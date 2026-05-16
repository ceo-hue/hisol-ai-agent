/**
 * ARHA Vol.R — Routing: Dynamic Stack Router (Phase 5 — Team-Aware)
 *
 * B방향 anchor-first + 팀 인식 라우팅.
 *
 * Phase 5 추가:
 *   - 요청 팀 감지 (output / process / mixed)
 *   - 팀 편향 anchor 자동 선택
 *     → process 요청 → Drucker 우선
 *     → output 요청  → Jobs / Porter 우선
 *     → mixed       → 전체 canLead 중 최고 득점자
 *   - 같은 팀 specialist 우선 선별 (mixed 시 전체 허용)
 *   - RouteResult에 teamContext 포함
 *
 * 팀 분류 (추론 방식 — 페르소나 파일 수정 불필요):
 *   process team → quality_management | process_optimization 역량 보유
 *   companion   → role.type === 'companion'
 *   output team → 그 외 모두
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

const SCORE_THRESHOLD  = 0.45;
const MAX_STACK_LAYERS = 3;

/** process team 판별 역량 태그 */
const PROCESS_COMPETENCIES = ['quality_management', 'process_optimization'] as const;

/** output team 대표 역량 태그 (팀 감지용) */
const OUTPUT_COMPETENCIES = [
  'branding', 'typography', 'spatial_design', 'ux_strategy', 'visual_system',
  'copywriting', 'organic_structure', 'grid_layout', 'emotional_connection',
  'competitive_strategy', 'product_vision', 'storytelling',
] as const;

// ─────────────────────────────────────────
// TEAM TYPE
// ─────────────────────────────────────────

export type TeamType    = 'output' | 'process' | 'companion';
export type RequestTeam = 'output' | 'process' | 'mixed';

/**
 * 페르소나의 역량·역할 기반으로 팀 유형 추론.
 * 페르소나 파일에 teamType 필드 추가 없이 동작.
 */
export function inferTeamType(persona: PersonaDefinition): TeamType {
  if (persona.routing?.role.type === 'companion') return 'companion';
  const isProcess = persona.routing?.competencies.some(
    c => (PROCESS_COMPETENCIES as readonly string[]).includes(c)
  ) ?? false;
  return isProcess ? 'process' : 'output';
}

/**
 * 요청 intent에서 팀 방향 감지.
 * process 역량 키워드 → 'process'
 * output 역량 키워드  → 'output'
 * 둘 다 또는 둘 다 없음 → 'mixed' / 'output'(기본)
 */
export function detectRequestTeam(intent: IntentProfile): RequestTeam {
  const hasProcess = intent.competencies.some(
    c => (PROCESS_COMPETENCIES as readonly string[]).includes(c)
  );
  const hasOutput = intent.competencies.some(
    c => (OUTPUT_COMPETENCIES as readonly string[]).includes(c)
  );

  if (hasProcess && hasOutput) return 'mixed';
  if (hasProcess) return 'process';
  return 'output'; // 기본값: output team
}

// ─────────────────────────────────────────
// ROUTE RESULT
// ─────────────────────────────────────────

export interface TeamContext {
  /** 요청이 어느 팀을 향하는가 */
  requestTeam:  RequestTeam;
  /** 선택된 anchor의 팀 */
  anchorTeam:   TeamType;
  /** anchor와 specialist가 다른 팀인가 (cross-team stack) */
  isCrossTeam:  boolean;
}

export interface RouteResult {
  stackDef:    StackDefinition;
  scores:      PersonaScore[];
  intent:      IntentProfile;
  source:      'predefined' | 'dynamic';
  anchorId:    string;
  teamContext: TeamContext;
  reasoning:   string[];
}

// ─────────────────────────────────────────
// ANCHOR SELECTION (팀 편향)
// ─────────────────────────────────────────

/**
 * canLead 페르소나 중 요청 팀에 맞는 anchor 자동 선택.
 *
 * - process 요청 → process team anchor 우선
 * - output 요청  → output team anchor 우선
 * - mixed        → 전체 canLead 중 최고 득점자
 */
function autoSelectAnchor(
  allPersonas: PersonaDefinition[],
  intent:      IntentProfile,
  requestTeam: RequestTeam,
  reasoning:   string[],
): string {
  const leadPersonas = allPersonas.filter(p => p.routing?.role.canLead === true);

  if (leadPersonas.length === 0) {
    reasoning.push('No canLead persona found — defaulting to Jobs');
    return 'Jobs';
  }

  // 팀 편향 필터링
  let preferredLeads = leadPersonas;
  if (requestTeam !== 'mixed') {
    const teamFiltered = leadPersonas.filter(
      p => inferTeamType(p) === requestTeam,
    );
    if (teamFiltered.length > 0) {
      preferredLeads = teamFiltered;
      reasoning.push(`Team bias: ${requestTeam} → filtered to ${teamFiltered.map(p => p.id).join(', ')}`);
    }
  }

  const leadScores = rankPersonas(preferredLeads, intent);
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
// PREDEFINED STACK MATCHER (B방향 + 팀 인식)
// ─────────────────────────────────────────

/**
 * anchor + qualified specialists로 기존 스택 매칭.
 *
 * 조건:
 *   - 스택 첫 레이어의 personaId === anchorId
 *   - 모든 required 레이어가 qualified pool에 포함
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
    if (stack.layers[0].personaId !== anchorId) continue;
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
// DYNAMIC STACK BUILDER (팀 인식)
// ─────────────────────────────────────────

/**
 * anchor + qualified specialists로 동적 스택 조립.
 *
 * 팀 우선 정렬:
 *   - output 요청 → output specialist 우선
 *   - process 요청 → process specialist 우선
 *   - mixed → layerPriority만으로 정렬
 */
function buildDynamicStack(
  anchorId:             string,
  qualifiedSpecialists: PersonaScore[],
  intent:               IntentProfile,
  requestTeam:          RequestTeam,
): StackDefinition {
  // 팀 편향 정렬: 같은 팀 specialist 먼저, 그 다음 layerPriority
  const sorted = [...qualifiedSpecialists].sort((a, b) => {
    if (requestTeam !== 'mixed') {
      const aTeam = inferTeamType(getPersona(a.personaId)?.persona ?? ({} as PersonaDefinition));
      const bTeam = inferTeamType(getPersona(b.personaId)?.persona ?? ({} as PersonaDefinition));
      const anchorTeam = inferTeamType(getPersona(anchorId)?.persona ?? ({} as PersonaDefinition));
      const aMatch = aTeam === anchorTeam ? 0 : 1;
      const bMatch = bTeam === anchorTeam ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return a.layerPriority - b.layerPriority;
  });

  const specialists = sorted.slice(0, MAX_STACK_LAYERS - 1);

  const anchorLayer: StackLayer = {
    personaId:  anchorId,
    layerType:  'pre_foundation',
    outputType: 'Meaning_Spec',
    required:   true,
  };

  const specialistLayers: StackLayer[] = specialists.map((s, idx) => ({
    personaId:  s.personaId,
    layerType:  roleToLayerType(s.personaId),
    outputType: idx === 0 ? 'Structure_Spec' : 'Domain_Spec',
    required:   false,
  }));

  const allPersonaIds = [anchorId, ...specialists.map(s => s.personaId)];

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
// CROSS-TEAM 감지
// ─────────────────────────────────────────

function buildTeamContext(
  anchorId:  string,
  stackDef:  StackDefinition,
  requestTeam: RequestTeam,
): TeamContext {
  const anchorPersona = getPersona(anchorId)?.persona;
  const anchorTeam    = anchorPersona ? inferTeamType(anchorPersona) : 'output';

  // specialist 중 anchor 팀과 다른 팀이 있으면 cross-team
  const isCrossTeam = stackDef.layers
    .slice(1)
    .some(l => {
      const p = getPersona(l.personaId)?.persona;
      return p ? inferTeamType(p) !== anchorTeam && inferTeamType(p) !== 'companion' : false;
    });

  return { requestTeam, anchorTeam, isCrossTeam };
}

// ─────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────

/**
 * 사용자 요청을 분석해 최적 스택 자동 선택/조립.
 *
 * Phase 5: 팀 인식 라우팅
 *   - 요청 팀 감지 (output / process / mixed)
 *   - 팀 편향 anchor 자동 선택
 *   - 팀 편향 specialist 정렬
 *   - teamContext 반환
 *
 * @param text     — 사용자 요청
 * @param anchorId — 팀 리더 페르소나 ID (선택, 미지정 시 팀 감지 후 자동 선택)
 */
export function route(text: string, anchorId?: string): RouteResult {
  const reasoning: string[] = [];

  // STEP 1: Intent + 팀 감지
  const intent      = extractIntent(text);
  const requestTeam = detectRequestTeam(intent);
  reasoning.push(`Intent: ${formatIntentSummary(intent)}`);
  reasoning.push(`Request team: ${requestTeam}`);

  // STEP 2: 전체 페르소나 로드
  const allPersonaIds = listPersonas();
  const allPersonas   = allPersonaIds
    .map(id => getPersona(id)?.persona)
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // STEP 3: Anchor 결정
  let resolvedAnchorId: string;

  if (anchorId) {
    const anchorEntry = getPersona(anchorId);
    if (!anchorEntry) {
      reasoning.push(`Warning: anchor '${anchorId}' not registered — auto-selecting`);
      resolvedAnchorId = autoSelectAnchor(allPersonas, intent, requestTeam, reasoning);
    } else {
      resolvedAnchorId = anchorId;
      reasoning.push(`Anchor specified: ${anchorId} (team: ${inferTeamType(anchorEntry.persona)})`);
    }
  } else {
    resolvedAnchorId = autoSelectAnchor(allPersonas, intent, requestTeam, reasoning);
  }

  // STEP 4: Specialist 후보 스코어링 (anchor + companion 제외)
  const specialistPersonas = allPersonas.filter(
    p => p.id !== resolvedAnchorId && p.routing?.role.type !== 'companion',
  );
  const specialistScores = rankPersonas(specialistPersonas, intent);

  reasoning.push(
    `Scored ${specialistScores.length} specialists — top: ${
      specialistScores
        .slice(0, 3)
        .map(s => {
          const team = inferTeamType(getPersona(s.personaId)?.persona ?? ({} as PersonaDefinition));
          return `${s.personaId}[${team}](${s.totalScore.toFixed(2)})`;
        })
        .join(', ')
    }`
  );

  // STEP 5: Threshold 이상 specialist 선별
  const qualifiedSpecialists = specialistScores.filter(
    s => s.totalScore >= SCORE_THRESHOLD,
  );

  // STEP 6: Predefined 스택 매칭 (anchor 첫 레이어 일치 조건)
  const predefined = matchPredefinedStackWithAnchor(
    resolvedAnchorId,
    qualifiedSpecialists,
    SCORE_THRESHOLD,
  );

  if (predefined) {
    reasoning.push(`Predefined stack matched: ${predefined.stackId}`);
    const teamContext = buildTeamContext(resolvedAnchorId, predefined, requestTeam);
    if (teamContext.isCrossTeam) reasoning.push('Cross-team stack detected');
    return {
      stackDef: predefined,
      scores:   specialistScores,
      intent,
      source:   'predefined',
      anchorId: resolvedAnchorId,
      teamContext,
      reasoning,
    };
  }

  // STEP 7: 동적 스택 조립 (팀 편향 정렬)
  reasoning.push('No predefined stack matched — building dynamic stack');
  const dynamicStack = buildDynamicStack(
    resolvedAnchorId,
    qualifiedSpecialists,
    intent,
    requestTeam,
  );
  reasoning.push(`Dynamic stack: ${dynamicStack.stackId}`);

  const teamContext = buildTeamContext(resolvedAnchorId, dynamicStack, requestTeam);
  if (teamContext.isCrossTeam) reasoning.push('Cross-team stack detected');

  return {
    stackDef: dynamicStack,
    scores:   specialistScores,
    intent,
    source:   'dynamic',
    anchorId: resolvedAnchorId,
    teamContext,
    reasoning,
  };
}

/**
 * 라우팅 결과 미리보기 (실행 없음).
 */
export function previewRoute(
  text:      string,
  anchorId?: string,
): Omit<RouteResult, 'stackDef'> & {
  stackPreview: { personaId: string; layerType: string; score: number; isAnchor: boolean; team: TeamType }[];
} {
  const result = route(text, anchorId);
  return {
    scores:      result.scores,
    intent:      result.intent,
    source:      result.source,
    anchorId:    result.anchorId,
    teamContext: result.teamContext,
    reasoning:   result.reasoning,
    stackPreview: result.stackDef.layers.map(l => ({
      personaId: l.personaId,
      layerType: l.layerType,
      score:     result.scores.find(s => s.personaId === l.personaId)?.totalScore ?? 1.0,
      isAnchor:  l.personaId === result.anchorId,
      team:      inferTeamType(getPersona(l.personaId)?.persona ?? ({} as PersonaDefinition)),
    })),
  };
}
