/**
 * ARHA HTTP API Gateway — REST 레이어
 * v3.1: + Circuit breaker, rate limiter, retry backoff, conversation history, structured prompt
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

import { ARHARuntime } from '../runtime.js';
import { listPersonas } from '../personas/registry.js';

const app = express();
const PORT = process.env.HTTP_PORT ?? 8080;

// ── Circuit Breaker ────────────────────────────────────────────────────────────
// Opens after 3 consecutive Claude API failures. Resets after 30 s.
type CBState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: CBState = 'closed';
  private failures = 0;
  private openedAt = 0;
  private readonly maxFailures: number;
  private readonly resetMs: number;

  constructor(maxFailures = 3, resetMs = 30_000) {
    this.maxFailures = maxFailures;
    this.resetMs = resetMs;
  }

  canCall(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.resetMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true; // half-open: allow one probe
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    if (this.state === 'half-open' || this.failures >= this.maxFailures) {
      this.state = 'open';
      this.openedAt = Date.now();
      console.warn(`[ARHA CB] Circuit opened after ${this.failures} failures`);
    }
  }

  getStatus() { return { state: this.state, failures: this.failures }; }
}

// ── Rate Limiter ───────────────────────────────────────────────────────────────
// 60 requests per minute per sessionId (sliding window).
class RateLimiter {
  private windows = new Map<string, number[]>();
  private readonly maxPerMinute: number;

  constructor(maxPerMinute = 60) {
    this.maxPerMinute = maxPerMinute;
  }

  allow(key: string): boolean {
    const now = Date.now();
    const cutoff = now - 60_000;
    const ts = (this.windows.get(key) ?? []).filter(t => t > cutoff);
    if (ts.length >= this.maxPerMinute) return false;
    ts.push(now);
    this.windows.set(key, ts);
    return true;
  }
}

// ── Retry with exponential backoff ────────────────────────────────────────────
async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  breaker: CircuitBreaker,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (!breaker.canCall()) {
      throw new Error('Circuit open — Claude API temporarily unavailable. Retry in 30 s.');
    }
    try {
      const result = await fn();
      breaker.recordSuccess();
      return result;
    } catch (err) {
      breaker.recordFailure();
      if (attempt === maxRetries) throw err;
      const backoff = 500 * Math.pow(2, attempt); // 500 → 1000 → 2000 ms
      console.warn(`[ARHA API] Claude call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw new Error('unreachable');
}

// ── Singletons ─────────────────────────────────────────────────────────────────
const sessions = new Map<string, ARHARuntime>();
const breaker = new CircuitBreaker();
const rateLimiter = new RateLimiter(60);

function getOrCreate(sid: string, personaId = 'HighSol') {
  if (!sessions.has(sid)) sessions.set(sid, new ARHARuntime(personaId, sid));
  return sessions.get(sid)!;
}

// ── Express setup ──────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3002'], credentials: true }));
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[ARHA API] ${req.method} ${req.path}`);
  next();
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '3.1.0',
    system: 'ARHA Vol.A~E',
    personas: listPersonas(),
    circuitBreaker: breaker.getStatus(),
  });
});

// ── POST /v1/arha/process ──────────────────────────────────────────────────────
app.post('/v1/arha/process', async (req: Request, res: Response) => {
  try {
    const { input, sessionId = 'default', personaId = 'HighSol' } = req.body;
    if (!input) return res.status(400).json({ error: 'input is required' });

    // Rate limit check
    if (!rateLimiter.allow(sessionId)) {
      return res.status(429).json({ error: 'Rate limit exceeded (60 req/min per session)' });
    }

    const runtime = getOrCreate(sessionId, personaId);
    const arhaResult = runtime.process({ text: input, sessionId });

    if (!process.env.CLAUDE_API_KEY) {
      return res.json({
        arha: arhaResult,
        response: null,
        note: 'CLAUDE_API_KEY not set — ARHA state computed only',
      });
    }

    // Build structured Vol.A~E system prompt
    const systemPrompt = runtime.buildStructuredSystemPrompt(arhaResult);

    // Build messages array with rolling conversation history
    // History already includes the current user message; slice to get prior turns only
    const allHistory = runtime.getHistory();
    const priorMessages = allHistory.slice(0, -1); // exclude current turn's user message

    const messages: Anthropic.Messages.MessageParam[] = [
      ...priorMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: input },
    ];

    // Claude API call with circuit breaker + retry
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const message = await withRetry(
      () => client.messages.create({
        model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
      breaker
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Record assistant response → saves resonance + history to Π persistence
    runtime.recordAssistantResponse(responseText);

    res.json({
      response:    responseText,
      arha:        arhaResult,
      stateBlock:  arhaResult.stateBlock,
      phaseLabel:  arhaResult.phaseLabel,
      qualityGrade: arhaResult.qualityGrade,
      sessionId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ── GET /v1/arha/status/:sessionId ────────────────────────────────────────────
app.get('/v1/arha/status/:sessionId', (req: Request, res: Response) => {
  const runtime = sessions.get(req.params.sessionId);
  if (!runtime) return res.status(404).json({ error: 'Session not found' });
  const s = runtime.getState();
  res.json({
    personaId:    runtime.getPersonaId(),
    turnCount:    runtime.getTurnCount(),
    phase:        s.phase,
    C:            s.C,
    Gamma:        s.Gamma,
    k2Final:      s.k2Final,
    waveCount:    s.waveCount,
    circuitBreaker: breaker.getStatus(),
  });
});

// ── GET /v1/arha/personas ──────────────────────────────────────────────────────
app.get('/v1/arha/personas', (_req: Request, res: Response) => {
  res.json({ personas: listPersonas() });
});

// ── POST /v1/arha/session/:sessionId/handoff ───────────────────────────────────
app.post('/v1/arha/session/:sessionId/handoff', (req: Request, res: Response) => {
  const runtime = sessions.get(req.params.sessionId);
  if (!runtime) return res.status(404).json({ error: 'Session not found' });
  res.json(runtime.buildHandoff());
});

app.listen(PORT, () => {
  console.log(`[ARHA API] HTTP Gateway v3.1 running on port ${PORT}`);
  console.log(`[ARHA API] Personas: ${listPersonas().join(', ')}`);
});

export default app;
