/**
 * ARHA Session Registry — 기억의 경계
 *
 * MCP 서버는 장기 실행 프로세스이고, 세션은 무한히 쌓일 수 있습니다.
 * 단순 Map 보관은 메모리 누수의 직행 경로입니다.
 *
 * 설계 철학 (ARHA 정신):
 *   • LRU 한도   ─ "관계 동시 보유 한계": 너무 많은 사람을 깊이 기억할 수 없음
 *   • Idle TTL   ─ "잊을 줄 아는 능력":   비활동 시 디스크로 내려두고 RAM 비움
 *   • Evict-flush ─ "작별의 예의":         사라지기 전 기억을 디스크에 안전히 둠
 *   • Per-session queue ─ "정신의 일관성":  같은 세션 호출은 직렬 처리
 *
 * 구현 메모:
 *   - JavaScript Map은 insertion-order를 보존 → LRU touch는 delete+set으로 구현.
 *   - Per-session serial queue는 Promise 체인으로 구현 (mutex 라이브러리 불필요).
 *   - Idle eviction은 lazy: 호출 시 점검하므로 별도 setInterval 없음 (테스트·종료 단순화).
 */

import { ARHARuntime } from '../../runtime.js';

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

/** 동시 메모리 보유 세션 수 (초과 시 LRU evict). env: ARHA_SESSION_MAX */
const MAX_SESSIONS = Number(process.env.ARHA_SESSION_MAX ?? '100');

/** Idle eviction 임계 (ms). env: ARHA_SESSION_IDLE_MS, 기본 30분. */
const IDLE_TTL_MS = Number(process.env.ARHA_SESSION_IDLE_MS ?? String(30 * 60 * 1000));

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface SessionEntry {
  runtime:    ARHARuntime;
  lastTouch:  number;
  /** Per-session serial chain — 동시 호출 직렬화로 race 차단 */
  queue:      Promise<unknown>;
}

export interface SessionStats {
  size:        number;
  maxSessions: number;
  idleTtlMs:   number;
  oldestIdleMs: number | null;
}

// ─────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────

export class SessionRegistry {
  private entries = new Map<string, SessionEntry>();

  constructor(
    private readonly maxSessions: number = MAX_SESSIONS,
    private readonly idleTtlMs:   number = IDLE_TTL_MS,
  ) {}

  /**
   * Get-or-create the runtime bound to sessionId.
   * Touch updates LRU order. Triggers idle sweep + LRU evict if over capacity.
   */
  get(sessionId: string, personaId: string): ARHARuntime {
    this.sweepIdle();

    const existing = this.entries.get(sessionId);
    if (existing) {
      // 페르소나가 다른 ID로 재호출되면 기존 세션 보존이 우선 — runtime은 그대로 반환.
      // (페르소나 전환이 필요하면 명시적으로 evict 후 재생성하도록 호출자가 결정.)
      existing.lastTouch = Date.now();
      // LRU touch: 재삽입으로 끝쪽으로 이동
      this.entries.delete(sessionId);
      this.entries.set(sessionId, existing);
      return existing.runtime;
    }

    // New session — enforce capacity BEFORE insert
    while (this.entries.size >= this.maxSessions) {
      this.evictOldest();
    }

    const runtime = new ARHARuntime(personaId, sessionId);
    this.entries.set(sessionId, {
      runtime,
      lastTouch: Date.now(),
      queue:     Promise.resolve(),
    });
    return runtime;
  }

  /**
   * Run a per-session serialized task.
   * Same sessionId calls are queued FIFO — no concurrent mutation of state.
   *
   * @param sessionId  세션 키
   * @param personaId  세션 첫 생성 시 적용될 페르소나
   * @param task       runtime을 받아 결과를 만드는 비동기 함수
   */
  async runSerialized<T>(
    sessionId: string,
    personaId: string,
    task: (runtime: ARHARuntime) => Promise<T> | T,
  ): Promise<T> {
    const runtime = this.get(sessionId, personaId);
    const entry   = this.entries.get(sessionId)!;

    // Chain onto previous task — prior failures must NOT poison the queue
    const next = entry.queue.then(
      () => task(runtime),
      () => task(runtime), // ignore prior rejection, run regardless
    );
    entry.queue = next.catch(() => undefined); // queue holds settled promises only
    return next;
  }

  /**
   * Read-only lookup — does NOT touch lastTouch, does NOT create.
   * Returns the runtime if currently held in RAM, otherwise undefined.
   *
   * Use this for queries that must not affect LRU order
   * (e.g. arha_status, arha_session_handoff sessionId existence checks).
   */
  peek(sessionId: string): ARHARuntime | undefined {
    return this.entries.get(sessionId)?.runtime;
  }

  /** Manually evict a single session (flush + drop). */
  evict(sessionId: string): boolean {
    const entry = this.entries.get(sessionId);
    if (!entry) return false;
    try {
      entry.runtime.flush();
    } catch {
      // flush already guards internally; double-shield here for shutdown paths
    }
    this.entries.delete(sessionId);
    return true;
  }

  /** Evict the LRU entry (insertion order = recency order in JS Map). */
  private evictOldest(): void {
    const oldestKey = this.entries.keys().next().value;
    if (oldestKey !== undefined) this.evict(oldestKey);
  }

  /** Drop entries idle > TTL. Lazy — called on every get(). */
  private sweepIdle(): void {
    if (this.idleTtlMs <= 0) return;
    const now = Date.now();
    for (const [sid, entry] of this.entries) {
      if (now - entry.lastTouch > this.idleTtlMs) {
        this.evict(sid);
      }
    }
  }

  /** Force-flush all sessions to disk (graceful shutdown). */
  flushAll(): void {
    for (const entry of this.entries.values()) {
      try { entry.runtime.flush(); } catch { /* shutdown best-effort */ }
    }
  }

  /** Drop everything (post-flush) — used after flushAll on hard shutdown. */
  clear(): void {
    this.entries.clear();
  }

  /** Currently held sessionIds (LRU order, oldest first). */
  list(): string[] {
    return Array.from(this.entries.keys());
  }

  /** Telemetry snapshot for arha_status / health endpoints. */
  stats(): SessionStats {
    let oldestIdleMs: number | null = null;
    if (this.entries.size > 0) {
      const now = Date.now();
      let oldest = now;
      for (const e of this.entries.values()) {
        if (e.lastTouch < oldest) oldest = e.lastTouch;
      }
      oldestIdleMs = now - oldest;
    }
    return {
      size:         this.entries.size,
      maxSessions:  this.maxSessions,
      idleTtlMs:    this.idleTtlMs,
      oldestIdleMs,
    };
  }
}

// ─────────────────────────────────────────
// SHARED SINGLETON
// ─────────────────────────────────────────

/**
 * Shared registry for the MCP server process.
 * Imported by mcp/tools.ts and mcp/server.ts (graceful shutdown).
 */
export const sessionRegistry = new SessionRegistry();
