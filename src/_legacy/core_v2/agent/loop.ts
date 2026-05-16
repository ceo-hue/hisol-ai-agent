/**
 * ARHA Vol.H — Agent Loop
 * 에이전트 루프 + systemPrompt 자동 주입.
 *
 * ① arha_process() → systemPrompt + ARHAState 획득
 * ② Hook 평가 → inject_system content 병합
 * ③ Claude API 호출 (systemPrompt + 대화 history + 사용자 입력)
 * ④ 응답 기록 → Π 자동 영속
 * ⑤ AgentTurnResult 반환
 *
 * runAgentTurn  — 단일 턴 (외부에서 루프 제어)
 * runAgentLoop  — 자율 멀티턴 (maxTurns 지정)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ARHARuntime } from '../../runtime.js';
import type { ARHAState } from '../execution/state.js';
import type { ConversationMessage } from '../execution/persistence.js';
import {
  DEFAULT_HOOKS,
  evaluateHooks,
  mergeHookSystemContent,
  mergeHookUserPrefix,
  type HookDefinition,
  type HookFiredEvent,
} from './hooks.js';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface AgentConfig {
  sessionId:    string;
  personaId?:   string;                  // 기본: runtime의 personaId
  model?:       string;                  // 기본: claude-sonnet-4-6
  maxTokens?:   number;                  // 기본: 4096
  hooks?:       HookDefinition[];        // 기본: DEFAULT_HOOKS
  temperature?: number;                  // 기본: 1.0
}

export interface AgentTurnResult {
  response:     string;                  // Claude의 실제 응답
  sessionId:    string;
  personaId:    string;
  systemPrompt: string;                  // ARHA 생성 system prompt (hook content 포함)
  arhaState:    ARHAState;
  hooksFired:   string[];                // 발동된 hook ID 목록
  hooksDetail:  HookFiredEvent[];
  turn:         number;
  qualityGrade: string;
  inputTokens:  number;
  outputTokens: number;
}

export interface AgentLoopResult {
  turns:     AgentTurnResult[];
  finalState: ARHAState;
  totalInputTokens:  number;
  totalOutputTokens: number;
}

// ─────────────────────────────────────────
// HOOK COOLDOWN REGISTRY (per-runtime)
// ─────────────────────────────────────────

const hookCooldownRegistry = new WeakMap<object, Map<string, number>>();

function getHookCooldownMap(runtime: ARHARuntime): Map<string, number> {
  // Use runtime as WeakMap key — survives multiple turns in same runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const key = runtime as any;
  if (!hookCooldownRegistry.has(key)) {
    hookCooldownRegistry.set(key, new Map<string, number>());
  }
  return hookCooldownRegistry.get(key)!;
}

// ─────────────────────────────────────────
// ANTHROPIC CLIENT FACTORY
// ─────────────────────────────────────────

function makeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('[ARHA Loop] ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

// ─────────────────────────────────────────
// SINGLE TURN EXECUTION
// ─────────────────────────────────────────

/**
 * 단일 에이전트 턴 실행.
 *
 * @param userInput — 사용자 입력
 * @param config    — 에이전트 설정
 * @param runtime   — ARHARuntime 인스턴스 (외부에서 관리)
 * @param anthropic — Anthropic 클라이언트 (선택, 없으면 env key로 생성)
 */
export async function runAgentTurn(
  userInput: string,
  config:    AgentConfig,
  runtime:   ARHARuntime,
  anthropic?: Anthropic,
): Promise<AgentTurnResult> {
  const client  = anthropic ?? makeClient();
  const model   = config.model     ?? 'claude-sonnet-4-6';
  const maxTok  = config.maxTokens ?? 4096;
  const hooks   = config.hooks     ?? DEFAULT_HOOKS;

  // ── STEP 1: ARHA 처리 — state 계산 + system prompt 생성 ──────────
  const arhaResult = runtime.process({
    text:      userInput,
    sessionId: config.sessionId,
  });

  const baseSystemPrompt = runtime.buildStructuredSystemPrompt(arhaResult);
  const currentState     = arhaResult.turnOutput.state;

  // ── STEP 2: Hook 평가 ────────────────────────────────────────────
  const cooldownMap = getHookCooldownMap(runtime);
  const firedHooks  = evaluateHooks(currentState, hooks, cooldownMap);

  const hookSystemContent = mergeHookSystemContent(firedHooks);
  const hookUserPrefix    = mergeHookUserPrefix(firedHooks);

  // ── STEP 3: System prompt 조합 (ARHA + Hook 개입) ────────────────
  const finalSystemPrompt = baseSystemPrompt + hookSystemContent;

  // ── STEP 4: 대화 history → Anthropic messages 형식 변환 ──────────
  const history: ConversationMessage[] = runtime.getHistory();
  // history 마지막에는 이미 이번 userInput이 push된 상태 (runtime.process 내부에서)
  // 따라서 history에서 마지막 user 메시지는 제외하고, user prefix 적용하여 별도 전달
  const priorMessages = history.slice(0, -1);  // 마지막 user 메시지 제외

  const messages: Anthropic.MessageParam[] = [
    ...priorMessages.map(m => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role:    'user' as const,
      content: hookUserPrefix + userInput,
    },
  ];

  // ── STEP 5: Claude API 호출 ──────────────────────────────────────
  const response = await client.messages.create({
    model,
    max_tokens: maxTok,
    system:     finalSystemPrompt,
    messages,
  });

  const responseText = response.content
    .filter(c => c.type === 'text')
    .map(c => (c as Anthropic.TextBlock).text)
    .join('');

  const inputTokens  = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // ── STEP 6: 응답 기록 → Π 자동 영속 ────────────────────────────
  runtime.recordAssistantResponse(responseText);

  return {
    response:     responseText,
    sessionId:    config.sessionId,
    personaId:    arhaResult.promptContext.personaId,
    systemPrompt: finalSystemPrompt,
    arhaState:    currentState,
    hooksFired:   firedHooks.map(e => e.hookId),
    hooksDetail:  firedHooks,
    turn:         currentState.turn,
    qualityGrade: arhaResult.qualityGrade,
    inputTokens,
    outputTokens,
  };
}

// ─────────────────────────────────────────
// MULTI-TURN AUTONOMOUS LOOP
// ─────────────────────────────────────────

/**
 * 자율 멀티턴 루프.
 * 초기 입력으로 시작, 후속 턴은 Claude 응답을 입력으로 피드백.
 * 주로 Vol.G 스택 레이어 내부 수렴에 사용.
 *
 * @param initialInput — 첫 턴 사용자 입력
 * @param config       — maxTurns 포함 에이전트 설정
 * @param runtime      — ARHARuntime
 * @param anthropic    — Anthropic 클라이언트 (선택)
 * @param stopCondition — 조기 종료 조건 (선택). true 반환 시 루프 종료.
 */
export async function runAgentLoop(
  initialInput:  string,
  config:        AgentConfig & { maxTurns: number },
  runtime:       ARHARuntime,
  anthropic?:    Anthropic,
  stopCondition?: (result: AgentTurnResult) => boolean,
): Promise<AgentLoopResult> {
  const client = anthropic ?? makeClient();
  const turns:  AgentTurnResult[] = [];
  let   input   = initialInput;

  for (let i = 0; i < config.maxTurns; i++) {
    const result = await runAgentTurn(input, config, runtime, client);
    turns.push(result);

    // 조기 종료 — stopCondition or Particle phase
    const shouldStop =
      stopCondition?.(result) ||
      result.arhaState.phase === 'Particle';

    if (shouldStop) break;

    // 후속 턴 입력: Claude 응답 → 다음 입력
    input = result.response;
  }

  const lastState = turns.at(-1)!.arhaState;

  return {
    turns,
    finalState: lastState,
    totalInputTokens:  turns.reduce((s, t) => s + t.inputTokens, 0),
    totalOutputTokens: turns.reduce((s, t) => s + t.outputTokens, 0),
  };
}
