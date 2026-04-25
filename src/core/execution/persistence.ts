/**
 * ARHA Vol.D — Π Persistence Layer
 * Cross-session B(n) resonance, conversation history, and state snapshot storage.
 * Implements the Π infrastructure morpheme — the "memory spine" between sessions.
 *
 * Paradigm: ARHA computes state per-turn in RAM; Π writes it to disk so the
 * next session can restore Ψ_Resonance baseline and Υ observation history.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ResonanceState } from '../cognition/resonance.js';
import type { ARHAState } from './state.js';
import type { StateSnapshot } from '../observation/analytics.js';

const DATA_DIR = process.env.ARHA_DATA_DIR ?? path.join(process.cwd(), '.arha-sessions');

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PersistedSession {
  sessionId: string;
  personaId: string;
  resonance: {
    n: number;
    value: number;
    Bn: number;
    history: number[];
  };
  partialState: {
    turn: number;
    psiResonance: number;
    phase: string;
    B: number | null;
    waveCount: number;
  };
  history: ConversationMessage[];   // rolling 10-turn (20 message) window
  snapshots: StateSnapshot[];       // lightweight per-turn state records (last 20)
  savedAt: number;
}

// ─────────────────────────────────────────
// FILE I/O
// ─────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function sessionPath(sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

export function loadPersistedSession(sessionId: string): PersistedSession | null {
  try {
    const p = sessionPath(sessionId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as PersistedSession;
  } catch {
    return null;
  }
}

export function persistSession(
  sessionId: string,
  personaId: string,
  resonance: ResonanceState,
  state: ARHAState,
  history: ConversationMessage[],
  snapshots: StateSnapshot[]
): void {
  try {
    ensureDataDir();
    const data: PersistedSession = {
      sessionId,
      personaId,
      resonance: {
        n: resonance.n,
        value: resonance.value,
        Bn: resonance.Bn,
        history: resonance.history,
      },
      partialState: {
        turn: state.turn,
        psiResonance: state.psiResonance,
        phase: state.phase,
        B: state.B,
        waveCount: state.waveCount,
      },
      history:   history.slice(-20),    // last 10 turns = 20 messages
      snapshots: snapshots.slice(-20),  // last 20 state snapshots
      savedAt: Date.now(),
    };
    fs.writeFileSync(sessionPath(sessionId), JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[ARHA Π] Persist failed:', e);
  }
}

export function deletePersistedSession(sessionId: string): void {
  try {
    const p = sessionPath(sessionId);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // silent
  }
}
