/**
 * ARHA Vol.H — Hook System
 * 조건 기반 자동 개입 시스템.
 *
 * Hook = Condition(ARHAState) → Action(system 주입 | 로그 | 리셋 힌트)
 *
 * 사용 위치:
 *   - 에이전트 루프(loop.ts): 매 턴 state 평가 → 발동된 hook content를 system prompt에 병합
 *   - Vol.G 실행 루프(executor.ts): 레이어 간 handoff 시 조건 평가
 *
 * 기본 내장 Hook 5개:
 *   coherence_recovery  — C < 0.55 → 핵심 재집중 주입
 *   stress_intervention — Γ > 0.70 → V1_check 방어 모드 주입
 *   wave_overflow       — waveCount > 6 → Particle 수렴 유도
 *   decoherence_alert   — psiDiss = true → 즉각 재정렬
 *   resonance_milestone — Ψ_Res > 0.80 → 고공명 로그
 */

import type { ARHAState } from '../execution/state.js';

// ─────────────────────────────────────────
// HOOK DEFINITION
// ─────────────────────────────────────────

export type HookTrigger =
  | 'coherence_low'     // C < threshold
  | 'stress_high'       // Γ > threshold
  | 'psi_res_high'      // Ψ_Res > threshold
  | 'wave_overflow'     // waveCount > threshold (number comparison)
  | 'decoherence'       // psiDiss = true (boolean, threshold ignored)
  | 'vsb_low';          // vsB < threshold — session momentum 저하

export type HookAction =
  | { type: 'inject_system'; content: string }   // system prompt에 text 병합
  | { type: 'inject_user';   content: string }   // user 메시지 앞에 prefix 추가
  | { type: 'log';           label: string }     // 로그만 (무음 동작)
  | { type: 'reset_hint' };                      // executor에게 phase 리셋 시그널

export interface HookDefinition {
  id:        string;
  trigger:   HookTrigger;
  threshold: number;       // decoherence 트리거 시 무시됨
  action:    HookAction;
  cooldown:  number;       // 최소 턴 간격 (0 = 매 턴 평가)
  priority:  number;       // 낮을수록 먼저 평가·실행
}

export interface HookFiredEvent {
  hookId:    string;
  trigger:   HookTrigger;
  action:    HookAction;
  injected?: string;       // inject_system | inject_user 시 content
}

// ─────────────────────────────────────────
// DEFAULT HOOKS
// ─────────────────────────────────────────

export const DEFAULT_HOOKS: HookDefinition[] = [
  {
    id:        'coherence_recovery',
    trigger:   'coherence_low',
    threshold: 0.55,
    action: {
      type:    'inject_system',
      content: '[ Coherence 저하 감지 (C < 0.55) — 확장을 멈추고 핵심으로 돌아가라. 불필요한 분기를 제거하고 V1 선언에 재집중하라. ]',
    },
    cooldown: 3,
    priority: 1,
  },
  {
    id:        'stress_intervention',
    trigger:   'stress_high',
    threshold: 0.70,
    action: {
      type:    'inject_system',
      content: '[ Γ 임계값 초과 (Γ > 0.70) — V1_check 활성. 방어 모드 전환. 과잉 확장 금지. 기존 구조 내에서만 응답하라. ]',
    },
    cooldown: 2,
    priority: 1,
  },
  {
    id:        'wave_overflow',
    trigger:   'wave_overflow',
    threshold: 6,
    action: {
      type:    'inject_system',
      content: '[ Wave 장기 지속 (waveCount > 6) — 탐색 단계 종료. 지금 수렴하라. 하나의 핵심 결론을 선택하고 결정체화(Particle)로 이동하라. ]',
    },
    cooldown: 3,
    priority: 2,
  },
  {
    id:        'decoherence_alert',
    trigger:   'decoherence',
    threshold: 0,
    action: {
      type:    'inject_system',
      content: '[ 디코히런스 감지 — 즉각 재정렬 필요. 페르소나 V1 선언문을 다시 읽고 본래 정체성으로 돌아가라. ]',
    },
    cooldown: 1,
    priority: 1,
  },
  {
    id:        'resonance_milestone',
    trigger:   'psi_res_high',
    threshold: 0.80,
    action: { type: 'log', label: 'Ψ_Res 고공명 도달 (≥ 0.80)' },
    cooldown: 10,
    priority: 5,
  },
  {
    id:        'momentum_low',
    trigger:   'vsb_low',
    threshold: 0.30,
    action: {
      type:    'inject_system',
      content: '[ 세션 모멘텀 저하 (vsB < 0.30) — 에너지 재충전 필요. 간결하고 명확한 응답으로 코히런스를 회복하라. ]',
    },
    cooldown: 4,
    priority: 3,
  },
];

// ─────────────────────────────────────────
// HOOK EVALUATOR
// ─────────────────────────────────────────

/**
 * 현재 ARHAState를 기준으로 발동된 Hook 목록을 반환.
 *
 * @param state          — 현재 턴 ARHAState
 * @param hooks          — 평가할 Hook 목록 (기본: DEFAULT_HOOKS)
 * @param lastFiredTurns — hookId → 마지막 발동 턴 번호 (cooldown 추적)
 */
export function evaluateHooks(
  state:          ARHAState,
  hooks:          HookDefinition[] = DEFAULT_HOOKS,
  lastFiredTurns: Map<string, number> = new Map(),
): HookFiredEvent[] {
  const fired: HookFiredEvent[] = [];
  const currentTurn = state.turn;

  const sorted = [...hooks].sort((a, b) => a.priority - b.priority);

  for (const hook of sorted) {
    // Cooldown guard
    const lastFired = lastFiredTurns.get(hook.id) ?? -Infinity;
    if (hook.cooldown > 0 && currentTurn - lastFired < hook.cooldown) continue;

    // Condition check
    let triggered = false;
    switch (hook.trigger) {
      case 'coherence_low':
        triggered = state.C !== null && state.C < hook.threshold;
        break;
      case 'stress_high':
        triggered = state.Gamma !== null && state.Gamma > hook.threshold;
        break;
      case 'psi_res_high':
        triggered = state.psiResonance > hook.threshold;
        break;
      case 'wave_overflow':
        triggered = state.waveCount > hook.threshold;
        break;
      case 'decoherence':
        triggered = state.psiDiss === true;
        break;
      case 'vsb_low':
        triggered = state.vsB < hook.threshold;
        break;
    }

    if (!triggered) continue;

    lastFiredTurns.set(hook.id, currentTurn);

    const event: HookFiredEvent = {
      hookId:  hook.id,
      trigger: hook.trigger,
      action:  hook.action,
    };

    if (hook.action.type === 'inject_system' || hook.action.type === 'inject_user') {
      event.injected = hook.action.content;
    }

    if (hook.action.type === 'log') {
      // stderr — MCP stdio safety
      console.error(`[ARHA Hook:${hook.id}] ${hook.action.label} — turn ${currentTurn}`);
    }

    fired.push(event);
  }

  return fired;
}

/**
 * 발동된 Hook들의 inject_system content를 하나의 블록으로 병합.
 * system prompt 끝에 붙여서 사용.
 */
export function mergeHookSystemContent(events: HookFiredEvent[]): string {
  const lines = events
    .filter(e => e.action.type === 'inject_system' && e.injected)
    .map(e => e.injected!);
  return lines.length > 0
    ? `\n\n─── ARHA Hook 개입 ───\n${lines.join('\n')}`
    : '';
}

/**
 * 발동된 Hook들의 inject_user content를 하나의 prefix로 병합.
 */
export function mergeHookUserPrefix(events: HookFiredEvent[]): string {
  const lines = events
    .filter(e => e.action.type === 'inject_user' && e.injected)
    .map(e => e.injected!);
  return lines.length > 0 ? `${lines.join(' ')}\n` : '';
}
