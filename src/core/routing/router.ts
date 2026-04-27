/**
 * ARHA Vol.R — Routing: Dynamic Stack Router (B방향 Anchor Architecture)
 *
 * IntentProfile → Anchor + PersonaScore[] → StackDefinition
 *
 * B방향 라우팅 전략 (anchor-first):
 *   1. intent 추출
 *   2. anchor 결정:
 *      - 명시적 anchorId 있으면 해당 페르소나 고정
 *      - 없으면 canLead=true 중 intent 최고 득점자 자동 선택
 *   3. anchor를 제외한 나머지 페르소나만 specialist 후보로 스코어링
 *      (companion 제외, 다른 canLead 페르소나는 specialist로 참여 가능)
 *   4. threshold(0.45) 이상 specialist 선별
 *   5. 기존 predefined 스택 매칭: anchor 첫 레이어 일치 + 모든 required 레이어 qualified
 *   6. 매칭 실패 시 동적 스택: anchor(pre_foundation) → specialists(layerPriority 순)
 */

import type { StackDefinition, StackLayer, VolGLayerType } from '../orchestration/stack.js';
import type { PersonaDefinition } from '../identity/persona.js';
import type { IntentProfile } from './intent.js';
import type { PersonaScore } from './scorer.js';
import { extractIntent, formatIntentSummary } from './intent.js';
import { rankPersonas } from './scorer.js';
import { PREDEFINED_STACKS } from '../orchestration/stack.js';
import { getPersona, listPersonas } from '../../personas/registry.js';

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

const SCORE_THRESHOLD  = 0.45;  // 이 이하는 specialist 스택에 포함 안 됨
const MAX_STACK_LAYERS = 3;     // 동적 스택 최대 레이어 수 (anchor 포함)

// ─────────────────────────────────────────
// ROUTE RESULT
// ─────────────────────────────────────────

export interface RouteResult {
  /** 최종 실행할 스택 정의 */
  stackDef:    StackDefinition;
  /** specialist 스코어 목록 (anchor 제외) */
  scores:      PersonaScore[];
  /** 추출된 intent 프로파일 */
  intent:      IntentProfile;
  /** 라우팅 방식 */
  source:      'predefined' | 'dynamic';
  /** 팀 리더 페르소나 ID (명시 지정 or 자동 선택) */
  anchorId:    string;
  /** 라우팅 근거 (사람이 읽는 설명) */
  reasoning:   string[];
}

// ─────────────────────────────────────────
// ANCHOR SELECTION
// ─────────────────────────────────────────

/**
 * canLead=true 페르소나 중 intent 최고 득점자를 자동 선택.
 * canLead 페르소나가 없으면 'Jobs' fallback.
 */
function autoSelectAnchor(
  allPersonas: PersonaDefinition[],
  intent:      IntentProfile,
  reasoning:   string[],
): string {
  const leadPersonas = allPersonas.filter(p => p.routing?.role.canLead === true);

  if (leadPersonas.length === 0) {
    reasoning.push('No canLead persona found — defaulting to Jobs');
    return 'Jobs';
  }

  // canLead 페르소나들을 intent 기준으로 스코어링
  const leadScores = rankPersonas(leadPersonas, intent);
  const top = leadScores[0];
  reasoning.push(
    `Auto-selected anchor: ${top.personaId} (score: ${top.totalScore.toFixed(2)})` +
    (leadScores.length > 1
      ? ` over [${leadScores.slice(1).map(s => `${s.personaId}(${s.totalScore.toFixed(2)})`).join(', ')}]`
      : '')
  );
  return top.personaId;
}

// ─────────────────────────────────────────
// PREDEFINED STACK MATCHER (B방향)
// ─────────────────────────────────────────

/**
 * anchor + qualified specialists로 기존 스택 매칭 시도.
 *
 * 조건:
 *   - 스택 첫 레이어의 personaId === anchorId (팀 리더 일치)
 *   - 모든 required 레이어가 qualified pool(anchor + specialists)에 포함
 */
function matchPredefinedStackWithAnchor(
  anchorId:             string,
  qualifiedSpecialists: PersonaScore[],
  threshold:            number,
): StackDefinition | null {
  const qualifiedIds = new Set<string>([
    anchorId,
    ...qualifiedSpecialists
      .filter(s => s.totalScore >= threshold)
      .map(s => s.personaId),
  ]);

  for (const stack of PREDEFINED_STACKS) {
    // B방향 핵심: 스택의 첫 레이어가 anchor와 일치해야 함
    const firstLayer = stack.layers[0];
    if (firstLayer.personaId !== anchorId) continue;

    // 모든 required 레이어가 qualified pool에 포함되어야 함
    const allRequiredQualified = stack.layers
      .filter(l => l.required)
      .every(l => qualifiedIds.has(l.personaId));

    if (allRequiredQualified) return stack;
  }
  return null;
}

// ─────────────────────────────────────────
// LAYER TYPE RESOLVER
// ─────────────────────────────────────────

/**
 * role.type → VolGLayerType 변환 (specialist용).
 */
function roleToLayerType(personaId: string): VolGLayerType {
  const entry    = getPersona(personaId);
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

// ─────────────────────────────────────────
// DYNAMIC STACK BUILDER (B방향)
// ─────────────────────────────────────────

/**
 * anchor + qualified specialists로 동적 StackDefinition 조립.
 *
 * 구조:
 *   LAYER 0 (pre_foundation) → anchor (팀 리더, 의미 설정)
 *   LAYER 1+ (foundation/specialist) → specialists (layerPriority 오름차순)
 *
 * MAX_STACK_LAYERS 제한: anchor 포함 최대 3레이어.
 */
function buildDynamicStack(
  anchorId:             string,
  qualifiedSpecialists: PersonaScore[],
  intent:               IntentProfile,
): StackDefinition {
  // Specialists: layerPriority 오름차순, anchor 제외 자리만큼 선별
  const specialists = [...qualifiedSpecialists]
    .sort((a, b) => a.layerPriority - b.layerPriority)
    .slice(0, MAX_STACK_LAYERS - 1);

  // Anchor layer (항상 pre_foundation)
  const anchorLayer: StackLayer = {
    personaId:  anchorId,
    layerType:  'pre_foundation',
    outputType: 'Meaning_Spec',
    required:   true,
  };

  // Specialist layers
  const specialistLayers: StackLayer[] = specialists.map((s, idx) => ({
    personaId:  s.personaId,
    layerType:  roleToLayerType(s.personaId),
    outputType: idx === 0 ? 'Structure_Spec' : 'Domain_Spec',
    required:   false,
  }));

  const allPersonaIds = [anchorId, ...specialists.map(s => s.personaId)];

  // anchor만 있고 specialist가 없으면 단독 실행 스택
  if (specialists.length === 0) {
    return {
      stackId:     `STACK_SOLO_${anchorId.toUpperCase()}`,
      description: `단독 실행: ${anchorId}`,
      layers:      [anchorLayer],
      useCase:     formatIntentSummary(intent),
    };
  }

  return {
    stackId:     `STACK_DYNAMIC_${allPersonaIds.map(s => s.toUpperCase()).join('_')}`,
    description: `자동 조립: ${allPersonaIds.join(' → ')}`,
    layers:      [anchorLayer, ...specialistLayers],
    useCase:     formatIntentSummary(intent),
  };
}

// ─────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────

/**
 * 사용자 요청 텍스트를 분석해 최적 스택을 자동 선택/조립.
 *
 * B방향 architecture:
 *   - anchorId 명시 시 해당 페르소나가 팀 리더로 고정됨
 *   - anchorId 미지정 시 canLead=true 중 intent 최고 득점자 자동 선택
 *   - 라우터는 anchor를 제외한 specialist 후보만 스코어링
 *
 * @param text     — 사용자 요청 (한국어·영어 혼용 가능)
 * @param anchorId — 팀 리더 페르소나 ID (선택, 미지정 시 자동 선택)
 * @returns RouteResult — 실행 가능한 스택 + 점수 + 근거
 */
export function route(text: string, anchorId?: string): RouteResult {
  const reasoning: string[] = [];

  // ── STEP 1: Intent 추출
  const intent = extractIntent(text);
  reasoning.push(`Intent: ${formatIntentSummary(intent)}`);

  // ── STEP 2: 전체 페르소나 로드
  const allPersonaIds = listPersonas();
  const allPersonas   = allPersonaIds
    .map(id => getPersona(id)?.persona)
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // ── STEP 3: Anchor 결정
  let resolvedAnchorId: string;

  if (anchorId) {
    const anchorEntry = getPersona(anchorId);
    if (!anchorEntry) {
      reasoning.push(`Warning: anchor '${anchorId}' not registered — auto-selecting`);
      resolvedAnchorId = autoSelectAnchor(allPersonas, intent, reasoning);
    } else {
      resolvedAnchorId = anchorId;
      reasoning.push(`Anchor specified: ${anchorId}`);
    }
  } else {
    resolvedAnchorId = autoSelectAnchor(allPersonas, intent, reasoning);
  }

  // ── STEP 4: Specialist 후보 스코어링 (anchor + companion 제외)
  const specialistPersonas = allPersonas.filter(
    p => p.id !== resolvedAnchorId && p.routing?.role.type !== 'companion',
  );
  const specialistScores = rankPersonas(specialistPersonas, intent);

  reasoning.push(
    `Scored ${specialistScores.length} specialists — top: ${
      specialistScores
        .slice(0, 3)
        .map(s => `${s.personaId}(${s.totalScore.toFixed(2)})`)
        .join(', ')
    }`
  );

  // ── STEP 5: Threshold 이상 specialist 선별
  const qualifiedSpecialists = specialistScores.filter(
    s => s.totalScore >= SCORE_THRESHOLD,
  );

  // ── STEP 6: 기존 스택 매칭 시도 (anchor 첫 레이어 일치 조건 포함)
  const predefined = matchPredefinedStackWithAnchor(
    resolvedAnchorId,
    qualifiedSpecialists,
    SCORE_THRESHOLD,
  );

  if (predefined) {
    reasoning.push(`Predefined stack matched: ${predefined.stackId}`);
    return {
      stackDef: predefined,
      scores:   specialistScores,
      intent,
      source:   'predefined',
      anchorId: resolvedAnchorId,
      reasoning,
    };
  }

  // ── STEP 7: 동적 스택 조립
  reasoning.push('No predefined stack matched — building dynamic stack');
  const dynamicStack = buildDynamicStack(resolvedAnchorId, qualifiedSpecialists, intent);
  reasoning.push(`Dynamic stack: ${dynamicStack.stackId}`);

  return {
    stackDef: dynamicStack,
    scores:   specialistScores,
    intent,
    source:   'dynamic',
    anchorId: resolvedAnchorId,
    reasoning,
  };
}

/**
 * 라우팅 결과를 미리보기 형식으로 반환 (실행 없음).
 *
 * @param text     — 사용자 요청
 * @param anchorId — 팀 리더 페르소나 ID (선택)
 */
export function previewRoute(
  text:      string,
  anchorId?: string,
): Omit<RouteResult, 'stackDef'> & {
  stackPreview: { personaId: string; layerType: string; score: number; isAnchor: boolean }[];
} {
  const result = route(text, anchorId);
  return {
    scores:    result.scores,
    intent:    result.intent,
    source:    result.source,
    anchorId:  result.anchorId,
    reasoning: result.reasoning,
    stackPreview: result.stackDef.layers.map(l => ({
      personaId: l.personaId,
      layerType: l.layerType,
      score:     result.scores.find(s => s.personaId === l.personaId)?.totalScore ?? 1.0,
      isAnchor:  l.personaId === result.anchorId,
    })),
  };
}
