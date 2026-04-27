/**
 * ARHA Vol.R — Routing: Dynamic Stack Router
 *
 * IntentProfile → PersonaScore[] → StackDefinition (동적 조립 또는 기존 스택 매칭)
 *
 * 라우팅 전략:
 *   1. intent 추출
 *   2. 등록된 페르소나 전체 스코어링
 *   3. companion/standalone 페르소나 제외 (work stack 비참여)
 *   4. threshold(0.45) 이상인 페르소나 선별
 *   5. 기존 predefined 스택 매칭 시도 → 적합하면 사용
 *   6. 매칭 실패 시 동적 스택 조립:
 *      canLead=true 중 최고점 → LAYER 0(pre_foundation)
 *      나머지 → layerPriority 순 정렬
 */

import type { StackDefinition, VolGLayerType } from '../orchestration/stack.js';
import type { IntentProfile } from './intent.js';
import type { PersonaScore } from './scorer.js';
import { extractIntent, formatIntentSummary } from './intent.js';
import { rankPersonas } from './scorer.js';
import { PREDEFINED_STACKS } from '../orchestration/stack.js';
import { getPersona, listPersonas } from '../../personas/registry.js';

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

const SCORE_THRESHOLD   = 0.45;  // 이 이하는 스택에 포함 안 됨
const MAX_STACK_LAYERS  = 3;     // 동적 스택 최대 레이어 수

// ─────────────────────────────────────────
// ROUTE RESULT
// ─────────────────────────────────────────

export interface RouteResult {
  /** 최종 실행할 스택 정의 */
  stackDef:    StackDefinition;
  /** 전체 페르소나 점수 (상위 N개 포함) */
  scores:      PersonaScore[];
  /** 추출된 intent 프로파일 */
  intent:      IntentProfile;
  /** 라우팅 방식 */
  source:      'predefined' | 'dynamic';
  /** 라우팅 근거 (사람이 읽는 설명) */
  reasoning:   string[];
}

// ─────────────────────────────────────────
// PREDEFINED STACK MATCHER
// ─────────────────────────────────────────

/**
 * 스코어 상위 페르소나들과 기존 스택의 일치도를 계산.
 * 스택의 모든 required 레이어가 threshold를 넘으면 매칭 성공.
 */
function matchPredefinedStack(
  scores:    PersonaScore[],
  threshold: number,
): StackDefinition | null {
  const qualifiedIds = new Set(
    scores.filter(s => s.totalScore >= threshold).map(s => s.personaId)
  );

  for (const stack of PREDEFINED_STACKS) {
    const requiredLayers = stack.layers.filter(l => l.required);
    const allRequiredQualified = requiredLayers.every(
      l => qualifiedIds.has(l.personaId)
    );
    if (allRequiredQualified) {
      return stack;
    }
  }
  return null;
}

// ─────────────────────────────────────────
// DYNAMIC STACK BUILDER
// ─────────────────────────────────────────

/**
 * role.type → VolGLayerType 변환.
 */
function roleToLayerType(
  score:      PersonaScore,
  isLeader:   boolean,
): VolGLayerType {
  if (isLeader) return 'pre_foundation';
  const entry = getPersona(score.personaId);
  const roleType = entry?.persona.routing?.role.type;
  switch (roleType) {
    case 'strategist': return 'pre_foundation';
    case 'designer':   return 'foundation';
    case 'architect':  return 'specialist';
    case 'copywriter': return 'foundation';
    case 'analyst':    return 'specialist';
    case 'engineer':   return 'expression';
    default:           return 'specialist';
  }
}

/**
 * 스코어 배열에서 동적 StackDefinition을 조립.
 *
 * 규칙:
 *   1. companion 역할 제외
 *   2. canLead=true 중 최고점자 → LAYER 0 (pre_foundation)
 *   3. 나머지는 layerPriority 오름차순 정렬
 *   4. MAX_STACK_LAYERS까지만 포함
 */
function buildDynamicStack(
  scores:    PersonaScore[],
  intent:    IntentProfile,
): StackDefinition {
  // companion 제외
  const workScores = scores.filter(s => {
    const entry = getPersona(s.personaId);
    return entry?.persona.routing?.role.type !== 'companion';
  });

  // threshold 이상만
  const qualified = workScores.filter(s => s.totalScore >= SCORE_THRESHOLD);

  // 리더 선발: canLead=true 중 최고점
  const leaders    = qualified.filter(s => s.canLead);
  const nonLeaders = qualified.filter(s => !s.canLead);

  // 리더가 없으면 최고점자를 리더로
  const leader = leaders[0] ?? qualified[0];
  const rest   = qualified
    .filter(s => s.personaId !== leader?.personaId)
    .sort((a, b) => a.layerPriority - b.layerPriority)
    .slice(0, MAX_STACK_LAYERS - 1);

  const selected = leader ? [leader, ...rest] : rest;

  const layers = selected.map((s, idx) => ({
    personaId:  s.personaId,
    layerType:  roleToLayerType(s, idx === 0) as VolGLayerType,
    outputType: idx === 0 ? 'Meaning_Spec'
      : idx === 1 ? 'Structure_Spec'
      : 'Domain_Spec',
    required: idx === 0,
  }));

  // 스택이 비어있으면 fallback: HighSol 단독
  if (layers.length === 0) {
    layers.push({
      personaId:  'HighSol',
      layerType:  'companion' as VolGLayerType,
      outputType: 'Response',
      required:   true,
    });
  }

  const stackId = `STACK_DYNAMIC_${selected.map(s => s.personaId.toUpperCase()).join('_')}`;
  const desc    = `자동 조립: ${selected.map(s => s.personaId).join(' → ')}`;
  const useCase = formatIntentSummary(intent);

  return { stackId, description: desc, layers, useCase };
}

// ─────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────

/**
 * 사용자 요청 텍스트를 분석해 최적 스택을 자동 선택/조립.
 *
 * @param text — 사용자 요청 (한국어·영어 혼용 가능)
 * @returns RouteResult — 실행 가능한 스택 + 점수 + 근거
 */
export function route(text: string): RouteResult {
  const reasoning: string[] = [];

  // ── STEP 1: Intent 추출
  const intent = extractIntent(text);
  reasoning.push(`Intent: ${formatIntentSummary(intent)}`);

  // ── STEP 2: 전체 페르소나 스코어링
  const allPersonaIds = listPersonas();
  const allPersonas   = allPersonaIds
    .map(id => getPersona(id)?.persona)
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const scores = rankPersonas(allPersonas, intent);
  reasoning.push(`Scored ${scores.length} personas — top: ${
    scores.slice(0, 3).map(s => `${s.personaId}(${s.totalScore.toFixed(2)})`).join(', ')
  }`);

  // ── STEP 3: 기존 스택 매칭 시도
  const predefined = matchPredefinedStack(scores, SCORE_THRESHOLD);
  if (predefined) {
    reasoning.push(`Predefined stack matched: ${predefined.stackId}`);
    return {
      stackDef: predefined,
      scores,
      intent,
      source:   'predefined',
      reasoning,
    };
  }

  // ── STEP 4: 동적 스택 조립
  reasoning.push('No predefined stack matched — building dynamic stack');
  const dynamicStack = buildDynamicStack(scores, intent);
  reasoning.push(`Dynamic stack: ${dynamicStack.stackId}`);

  return {
    stackDef: dynamicStack,
    scores,
    intent,
    source:   'dynamic',
    reasoning,
  };
}

/**
 * 라우팅 결과를 미리보기 형식으로 반환 (실행 없음).
 */
export function previewRoute(text: string): Omit<RouteResult, 'stackDef'> & {
  stackPreview: { personaId: string; layerType: string; score: number }[];
} {
  const result = route(text);
  return {
    scores:    result.scores,
    intent:    result.intent,
    source:    result.source,
    reasoning: result.reasoning,
    stackPreview: result.stackDef.layers.map(l => ({
      personaId: l.personaId,
      layerType: l.layerType,
      score:     result.scores.find(s => s.personaId === l.personaId)?.totalScore ?? 0,
    })),
  };
}
