/**
 * ARHA HTTP gateway.
 */
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

import { ARHARuntime } from '../runtime.js';
import { listPersonas, resolvePersonaByTrigger } from '../personas/registry.js';
import { flattenMatrix } from '../am/matrix.js';
import { MODES } from '../am/types.js';

const app = express();
const PORT = process.env.HTTP_PORT ?? 8080;
const VERSION = '3.1.0';

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private openedAt = 0;
  constructor(private maxFailures = 3, private resetMs = 30_000) {}
  canCall(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.resetMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }
  recordSuccess(): void { this.failures = 0; this.state = 'closed'; }
  recordFailure(): void {
    this.failures++;
    if (this.state === 'half-open' || this.failures >= this.maxFailures) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
  getStatus() { return { state: this.state, failures: this.failures }; }
}

class RateLimiter {
  private windows = new Map<string, number[]>();
  constructor(private maxPerMinute = 60) {}
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

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
async function withRetry<T>(fn: () => Promise<T>, breaker: CircuitBreaker, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (!breaker.canCall()) throw new Error('Circuit open.');
    try {
      const r = await fn();
      breaker.recordSuccess();
      return r;
    } catch (err) {
      breaker.recordFailure();
      if (attempt === maxRetries) throw err;
      await sleep(500 * Math.pow(2, attempt));
    }
  }
  throw new Error('unreachable');
}

const sessions = new Map<string, ARHARuntime>();
const breaker = new CircuitBreaker();
const rateLimiter = new RateLimiter(60);
const lastResults = new Map<string, ReturnType<ARHARuntime['process']>>();

function getOrCreate(sid: string, personaId = 'highsol'): ARHARuntime {
  if (!sessions.has(sid)) sessions.set(sid, new ARHARuntime(personaId, sid));
  return sessions.get(sid)!;
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[arha] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: VERSION,
    personas: listPersonas(),
    modes: MODES,
    circuitBreaker: breaker.getStatus(),
  });
});

app.post('/v1/arha/process', async (req: Request, res: Response) => {
  try {
    const { input, sessionId = 'default', personaId } = req.body;
    if (!input) return res.status(400).json({ error: 'input is required' });
    if (!rateLimiter.allow(sessionId)) return res.status(429).json({ error: 'rate limit' });

    let pid = personaId;
    if (!pid) {
      const triggered = resolvePersonaByTrigger(input);
      pid = triggered?.id ?? 'highsol';
    }

    const runtime = getOrCreate(sessionId, pid);
    if (personaId && runtime.getPersonaId() !== personaId) runtime.setPersona(personaId);

    const result = runtime.process({ text: input, sessionId });
    lastResults.set(sessionId, result);
    const state = result.state;

    const amBlock = {
      sigma_vector: state.sigma_vector,
      sigma_scalar: state.sigma_scalar,
      curl_squared: state.curl_squared,
      phase: state.phase,
      alpha: state.alpha,
      C_coherence: state.C_coherence,
      gamma_total: state.gamma_total,
      E_B: state.E_B,
      theta_t: state.theta_t,
      psi_magnitude: state.psi_magnitude,
      psi_resonance: state.psi_resonance,
      turn: state.turn,
      modes: MODES,
      kyeol: state.kyeol,
      anchor_mode_name: MODES[state.kyeol.anchorMode],
      v_personality: {
        rho: state.v_personality.rho,
        lambda: state.v_personality.lambda,
        tau: state.v_personality.tau,
      },
      emotion_matrix: flattenMatrix(state.gamma_interfere),
      gamma_other: flattenMatrix(state.gamma_other),
    };

    if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return res.json({
        am: amBlock,
        systemPrompt: result.systemPrompt,
        stateBlock: result.stateBlock,
        phaseLabel: result.phaseLabel,
        qualityGrade: result.qualityGrade,
        isFirstTurn: result.isFirstTurn,
        response: null,
        sessionId,
        personaId: runtime.getPersonaId(),
        displayName: runtime.getPersonaSpec().displayName,
        note: 'CLAUDE_API_KEY not set',
      });
    }

    const apiKey = (process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY)!;
    const priorMessages = runtime.getHistory().slice(0, -1);
    const messages: Anthropic.Messages.MessageParam[] = [
      ...priorMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: input },
    ];
    const client = new Anthropic({ apiKey });
    const message = await withRetry(
      () => client.messages.create({
        model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: result.systemPrompt,
        messages,
      }),
      breaker,
    );
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    runtime.recordAssistantResponse(responseText);

    res.json({
      response: responseText,
      am: amBlock,
      systemPrompt: result.systemPrompt,
      stateBlock: result.stateBlock,
      phaseLabel: result.phaseLabel,
      qualityGrade: result.qualityGrade,
      isFirstTurn: result.isFirstTurn,
      sessionId,
      personaId: runtime.getPersonaId(),
      displayName: runtime.getPersonaSpec().displayName,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

app.get('/v1/arha/heatmap/:sessionId', (req: Request, res: Response) => {
  const runtime = sessions.get(req.params.sessionId);
  if (!runtime) return res.status(404).json({ error: 'session not found' });
  const last = lastResults.get(req.params.sessionId);
  if (!last) return res.json({ ready: false });
  res.json({
    ready: true,
    sessionId: req.params.sessionId,
    personaId: runtime.getPersonaId(),
    turn: runtime.getTurnCount(),
    modes: MODES,
    emotion_matrix: flattenMatrix(last.state.gamma_interfere),
    gamma_other: flattenMatrix(last.state.gamma_other),
    kyeol: last.state.kyeol,
    anchor_mode_name: MODES[last.state.kyeol.anchorMode],
  });
});

app.get('/v1/arha/status/:sessionId', (req: Request, res: Response) => {
  const runtime = sessions.get(req.params.sessionId);
  if (!runtime) return res.status(404).json({ error: 'session not found' });
  const s = runtime.getState();
  res.json({
    personaId: runtime.getPersonaId(),
    displayName: runtime.getPersonaSpec().displayName,
    turnCount: runtime.getTurnCount(),
    Gamma: s.Gamma,
    k2Final: s.k2Final,
    waveCount: s.waveCount,
    circuitBreaker: breaker.getStatus(),
  });
});

app.get('/v1/arha/personas', (_req: Request, res: Response) => {
  res.json({ personas: listPersonas() });
});

app.post('/v1/arha/session/:sessionId/handoff', (req: Request, res: Response) => {
  const runtime = sessions.get(req.params.sessionId);
  if (!runtime) return res.status(404).json({ error: 'session not found' });
  res.json(runtime.buildHandoff());
});

app.listen(PORT, () => {
  console.log(`[arha] gateway on :${PORT}`);
});

export default app;
