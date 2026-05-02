/**
 * ARHA Vol.D — Π Persistence Layer
 * Cross-session B(n) resonance, conversation history, and state snapshot storage.
 * Implements the Π infrastructure morpheme — the "memory spine" between sessions.
 *
 * Paradigm: ARHA computes state per-turn in RAM; Π writes it to disk so the
 * next session can restore Ψ_Resonance baseline and Υ observation history.
 *
 * 신뢰성 설계:
 *   • Atomic write       — tmp + rename으로 도중 crash 시 corruption 방지.
 *                          Π는 ARHA의 기억 척추. 어설픈 일부 쓰기는 거짓 기억보다 위험.
 *   • Path sanitization  — sessionId가 외부 입력. 경로 탈출(../) 차단.
 *   • Failure counter    — 조용한 실패는 데이터 손실의 가장 흔한 패턴.
 *                          getPersistenceHealth()로 외부에서 가시성 확보.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ResonanceState } from '../cognition/resonance.js';
import type { ARHAState } from './state.js';
import type { StateSnapshot } from '../observation/analytics.js';

const DATA_DIR = process.env.ARHA_DATA_DIR ?? path.join(process.cwd(), '.arha-sessions');

// ─────────────────────────────────────────
// HEALTH COUNTERS — 침묵하지 않는 실패 추적
// ─────────────────────────────────────────

interface PersistenceHealth {
  writes:         number;
  writeFailures:  number;
  reads:          number;
  readFailures:   number;
  lastError:      string | null;
  lastErrorAt:    number | null;
}

const health: PersistenceHealth = {
  writes:         0,
  writeFailures:  0,
  reads:          0,
  readFailures:   0,
  lastError:      null,
  lastErrorAt:    null,
};

export function getPersistenceHealth(): Readonly<PersistenceHealth> {
  return { ...health };
}

function recordError(err: unknown): void {
  health.lastError   = err instanceof Error ? err.message : String(err);
  health.lastErrorAt = Date.now();
}

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
  /** @deprecated use fullState — kept for backward compat */
  partialState: {
    turn: number;
    psiResonance: number;
    phase: string;
    B: number | null;
    waveCount: number;
  };
  /** Full ARHAState — complete restoration including vsB, Bridge state, PID */
  fullState?: ARHAState;
  history: ConversationMessage[];   // rolling 10-turn (20 message) window
  snapshots: StateSnapshot[];       // lightweight per-turn state records (last 20)
  savedAt: number;
  schemaVersion: number;            // bumped on breaking state changes
}

// ─────────────────────────────────────────
// FILE I/O
// ─────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Max safe filename length — most filesystems cap at 255 bytes; we leave headroom. */
const MAX_SESSIONID_LEN = 200;

/**
 * sessionId → 안전한 파일 경로.
 * 영숫자·언더바·하이픈만 허용, 그 외 모두 `_`로 치환.
 * 결과 경로는 반드시 DATA_DIR 안에 머무는지 검증 (path traversal 차단).
 *
 * Edge cases:
 *   "../etc/passwd"   → "___etc_passwd.json"   (chars sanitized)
 *   ""                → "_default.json"        (empty fallback)
 *   "x".repeat(1000)  → truncated to MAX_SESSIONID_LEN
 */
export function sessionPath(sessionId: string): string {
  const cleaned = String(sessionId ?? '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, MAX_SESSIONID_LEN) || '_default';
  const filePath = path.join(DATA_DIR, `${cleaned}.json`);

  // Defense-in-depth: ensure resolved path is contained within DATA_DIR
  const resolvedDir  = path.resolve(DATA_DIR);
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedDir + path.sep) && resolvedFile !== resolvedDir) {
    // This should be unreachable given the regex above; throw loud if reached.
    throw new Error(`[ARHA Π] sessionId path escaped DATA_DIR: ${sessionId}`);
  }
  return filePath;
}

export function loadPersistedSession(sessionId: string): PersistedSession | null {
  health.reads++;
  try {
    const p = sessionPath(sessionId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as PersistedSession;
  } catch (e) {
    health.readFailures++;
    recordError(e);
    return null;
  }
}

export const PERSISTENCE_SCHEMA_VERSION = 2;

/**
 * Atomic session persist.
 *
 * 파일 손상 방지 패턴:
 *   1. JSON 직렬화 (in-memory)
 *   2. tmp 파일에 fully write
 *   3. fs.renameSync로 atomic 교체 (POSIX/Windows 모두 보장)
 *
 * 도중 crash나면 tmp 파일만 남고 원본은 무사 — 다음 부팅 때 mtime 검사로 청소 가능.
 * 어설픈 부분 쓰기는 거짓 기억보다 위험하다.
 */
export function persistSession(
  sessionId: string,
  personaId: string,
  resonance: ResonanceState,
  state: ARHAState,
  history: ConversationMessage[],
  snapshots: StateSnapshot[]
): void {
  health.writes++;
  try {
    ensureDataDir();
    const data: PersistedSession = {
      sessionId,
      personaId,
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      resonance: {
        n: resonance.n,
        value: resonance.value,
        Bn: resonance.Bn,
        history: resonance.history,
      },
      // fullState — complete restoration (v2+)
      fullState: { ...state },
      // partialState — legacy fallback
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

    const finalPath = sessionPath(sessionId);
    const tmpPath   = `${finalPath}.${process.pid}.${Date.now()}.tmp`;
    const payload   = JSON.stringify(data, null, 2);

    // tmp write — failure here leaves original untouched
    fs.writeFileSync(tmpPath, payload, 'utf-8');
    // atomic swap — this is the durability boundary
    fs.renameSync(tmpPath, finalPath);
  } catch (e) {
    health.writeFailures++;
    recordError(e);
    // stderr only — MCP stdio safety. Counter exposes failures programmatically.
    console.error('[ARHA Π] Persist failed:', e);
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
