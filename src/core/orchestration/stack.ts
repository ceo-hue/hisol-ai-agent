/**
 * ARHA Vol.G — Orchestration: Stack Architecture
 * Stack composition & handoff protocol for multi-persona pipelines.
 *
 * Layer order (strict):
 *   pre_foundation (LAYER 0) → foundation (LAYER 1) →
 *   specialist (LAYER 2..N) → expression (LAYER N+1)
 *
 * Handoff_Package: immutable_spec flows downstream; each layer adds its own
 * layer_spec. Downstream layers CANNOT modify upstream immutable_spec.
 *
 * Predefined stacks:
 *   STACK_VISUAL_DESIGN_3  : Jobs → Tschichold → Gaudi
 *   STACK_CONCEPT_DESIGN_2 : Jobs → Tschichold
 *   STACK_SPACE_EXPERIENCE_3: Jobs → Gaudi → (expression TBD)
 */

// ─────────────────────────────────────────
// LAYER TYPES
// ─────────────────────────────────────────

export type VolGLayerType =
  | 'pre_foundation'  // LAYER 0: meaning/purpose (e.g. Jobs → Meaning_Spec)
  | 'foundation'      // LAYER 1: structural skeleton (e.g. Tschichold → Grid_Spec)
  | 'specialist'      // LAYER 2+: domain expertise (e.g. Gaudi → Domain_Spec)
  | 'expression'      // Final: surface rendering
  | 'companion';      // Standalone companion mode — does not participate in work stacks

// ─────────────────────────────────────────
// HANDOFF PACKAGE
// ─────────────────────────────────────────

/**
 * Flows between layers. upstream immutable_spec is read-only for all downstream.
 */
export interface HandoffPackage {
  /** Set by each upstream layer — downstream cannot override */
  immutable_spec: Record<string, unknown>;

  /** Accumulated layer outputs (ordered by layer) */
  layer_outputs: LayerOutput[];

  /** Current stack position */
  current_layer: VolGLayerType;

  /** Persona ID that produced this package */
  produced_by: string;

  /** Turn number when package was produced */
  turn: number;
}

export interface LayerOutput {
  layer: VolGLayerType;
  persona_id: string;
  artifact_type: string;  // 'Meaning_Spec' | 'Grid_Spec' | 'Domain_Spec' | etc.
  payload: Record<string, unknown>;
  locked: boolean;        // true = downstream cannot modify
}

/** Create an empty handoff package at the start of a stack execution */
export function createHandoffPackage(
  startPersonaId: string,
  startLayer: VolGLayerType,
  turn: number
): HandoffPackage {
  return {
    immutable_spec: {},
    layer_outputs:  [],
    current_layer:  startLayer,
    produced_by:    startPersonaId,
    turn,
  };
}

/**
 * Add a layer output to a handoff package.
 * Once locked=true, payload becomes part of immutable_spec.
 */
export function appendLayerOutput(
  pkg: HandoffPackage,
  output: LayerOutput
): HandoffPackage {
  const newOutputs = [...pkg.layer_outputs, output];

  // If output is locked, fold payload into immutable_spec
  const newImmutable = output.locked
    ? { ...pkg.immutable_spec, ...output.payload }
    : pkg.immutable_spec;

  return {
    ...pkg,
    layer_outputs:  newOutputs,
    immutable_spec: newImmutable,
    current_layer:  output.layer,
    produced_by:    output.persona_id,
  };
}

// ─────────────────────────────────────────
// STACK DEFINITION
// ─────────────────────────────────────────

export interface StackLayer {
  personaId:  string;
  layerType:  VolGLayerType;
  outputType: string;        // artifact type this layer produces
  required:   boolean;       // if true, stack fails without this layer
}

export interface StackDefinition {
  stackId:     string;
  description: string;
  layers:      StackLayer[];
  useCase:     string;
}

// ─────────────────────────────────────────
// PREDEFINED STACKS
// ─────────────────────────────────────────

/**
 * STACK_VISUAL_DESIGN_3
 * Jobs (의미) → Tschichold (비례/그리드) → Gaudi (자연 구조·감각)
 * Full 3-layer visual design pipeline.
 */
export const STACK_VISUAL_DESIGN_3: StackDefinition = {
  stackId:     'STACK_VISUAL_DESIGN_3',
  description: '3-레이어 시각 디자인 풀 파이프라인',
  useCase:     '브랜드 정체성 / UI 시스템 / 시각 커뮤니케이션 디자인',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Tschichold',
      layerType:  'foundation',
      outputType: 'Grid_Spec',
      required:   true,
    },
    {
      personaId:  'Gaudi',
      layerType:  'specialist',
      outputType: 'Domain_Spec',
      required:   false,
    },
  ],
};

/**
 * STACK_CONCEPT_DESIGN_2
 * Jobs (의미) → Tschichold (비례/그리드)
 * 2-layer: meaning + structure. No specialist.
 */
export const STACK_CONCEPT_DESIGN_2: StackDefinition = {
  stackId:     'STACK_CONCEPT_DESIGN_2',
  description: '2-레이어 개념 디자인 파이프라인',
  useCase:     '타이포그래피 / 레이아웃 / 편집 디자인',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Tschichold',
      layerType:  'foundation',
      outputType: 'Grid_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_SPACE_EXPERIENCE_3
 * Jobs (본질) → Gaudi (자연 구조) → [expression TBD]
 * 3-layer: meaning + structural form + spatial expression.
 */
export const STACK_SPACE_EXPERIENCE_3: StackDefinition = {
  stackId:     'STACK_SPACE_EXPERIENCE_3',
  description: '3-레이어 공간 경험 파이프라인',
  useCase:     '건축 / 공간 디자인 / 설치 예술',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Gaudi',
      layerType:  'specialist',
      outputType: 'Domain_Spec',
      required:   true,
    },
    // expression layer TBD — placeholder
    {
      personaId:  'TBD_Expression',
      layerType:  'expression',
      outputType: 'Surface_Spec',
      required:   false,
    },
  ],
};

/**
 * STACK_BRAND_COPY_2
 * Jobs (의미) → Ogilvy (카피·브랜드 언어)
 * 2-layer: meaning + language. 브랜드 캠페인·광고 카피.
 */
export const STACK_BRAND_COPY_2: StackDefinition = {
  stackId:     'STACK_BRAND_COPY_2',
  description: '2-레이어 브랜드 카피 파이프라인',
  useCase:     '브랜드 캠페인 / 광고 카피 / 슬로건 / 브랜드 언어 시스템',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Ogilvy',
      layerType:  'foundation',
      outputType: 'Copy_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_PRODUCT_DESIGN_2
 * Jobs (본질) → Rams (기능·UX 설계)
 * 2-layer: meaning + product design. 제품·앱·서비스 설계.
 */
export const STACK_PRODUCT_DESIGN_2: StackDefinition = {
  stackId:     'STACK_PRODUCT_DESIGN_2',
  description: '2-레이어 제품 설계 파이프라인',
  useCase:     '제품 설계 / UX 아키텍처 / 앱·서비스 구조 / 기능 우선순위',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_STRATEGY_2
 * Porter (경쟁전략) → Rams (제품·UX 설계)
 * 2-layer: 포지셔닝 전략 + 제품 설계.
 */
export const STACK_STRATEGY_2: StackDefinition = {
  stackId:     'STACK_STRATEGY_2',
  description: '2-레이어 경쟁전략·제품 파이프라인',
  useCase:     '경쟁 포지셔닝 / 제품 전략 / 스타트업 PMF / 시장 진입 설계',
  layers: [
    {
      personaId:  'Porter',
      layerType:  'pre_foundation',
      outputType: 'Strategy_Spec',
      required:   true,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_STRATEGY_3
 * Porter (경쟁전략) → Ogilvy (브랜드 언어) → Rams (제품·UX 설계)
 * 3-layer: 포지셔닝 + 메시지 + 제품 풀 파이프라인.
 */
export const STACK_STRATEGY_3: StackDefinition = {
  stackId:     'STACK_STRATEGY_3',
  description: '3-레이어 전략·브랜드·제품 풀 파이프라인',
  useCase:     '전략적 포지셔닝 + 브랜드 언어 + 제품 설계 통합',
  layers: [
    {
      personaId:  'Porter',
      layerType:  'pre_foundation',
      outputType: 'Strategy_Spec',
      required:   true,
    },
    {
      personaId:  'Ogilvy',
      layerType:  'foundation',
      outputType: 'Copy_Spec',
      required:   false,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_EXPERIENCE_2
 * Jobs (본질) → Eames (산업·경험 디자인)
 * 2-layer: 의미 + 사용자 경험 통합. 제품·서비스·공간 경험 설계.
 */
export const STACK_EXPERIENCE_2: StackDefinition = {
  stackId:     'STACK_EXPERIENCE_2',
  description: '2-레이어 경험 디자인 파이프라인',
  useCase:     '제품 경험 / 서비스 디자인 / 사용자 여정 / 산업 디자인',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Eames',
      layerType:  'foundation',
      outputType: 'Experience_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_PRODUCT_EXP_3
 * Jobs (본질) → Rams (제품·UX 설계) → Eames (경험 통합·디테일)
 * 3-layer: 의미 + 기능 설계 + 경험 완성. 제품 기능과 사용자 경험의 완전한 통합.
 */
export const STACK_PRODUCT_EXP_3: StackDefinition = {
  stackId:     'STACK_PRODUCT_EXP_3',
  description: '3-레이어 제품·경험 통합 파이프라인',
  useCase:     '제품 기능 + 사용자 경험 통합 / 하드웨어·소프트웨어 완성도',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
    {
      personaId:  'Eames',
      layerType:  'specialist',
      outputType: 'Experience_Spec',
      required:   false,
    },
  ],
};

/**
 * STACK_INNOVATION_3
 * Jobs (본질) → Rams (제품 설계) → DaVinci (교차 도메인 혁신 프로토타입)
 * 3-layer: 의미 + 기능 설계 + 교차 도메인 혁신. 제품 혁신의 완전한 파이프라인.
 */
export const STACK_INNOVATION_3: StackDefinition = {
  stackId:     'STACK_INNOVATION_3',
  description: '3-레이어 제품 혁신 파이프라인',
  useCase:     '제품 혁신 / 교차 도메인 아이디어 통합 / 프로토타이핑 / R&D',
  layers: [
    {
      personaId:  'Jobs',
      layerType:  'pre_foundation',
      outputType: 'Meaning_Spec',
      required:   true,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
    {
      personaId:  'DaVinci',
      layerType:  'specialist',
      outputType: 'Prototype_Spec',
      required:   false,
    },
  ],
};

/**
 * STACK_MANAGEMENT_2
 * Drucker (경영 목적·MBO) → Rams (제품·UX 설계)
 * 2-layer: 경영 목표 설정 + 제품 기능 설계.
 * "올바른 결과를 정의하고, 그 결과를 만드는 제품을 설계한다."
 */
export const STACK_MANAGEMENT_2: StackDefinition = {
  stackId:     'STACK_MANAGEMENT_2',
  description: '2-레이어 경영 목표·제품 설계 파이프라인',
  useCase:     '사업 목표 설정 / 제품 우선순위 결정 / 조직-제품 정합성 / 성과 기반 설계',
  layers: [
    {
      personaId:  'Drucker',
      layerType:  'pre_foundation',
      outputType: 'Management_Spec',
      required:   true,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
  ],
};

/**
 * STACK_MGT_BRAND_3
 * Drucker (경영·MBO) → Ogilvy (브랜드 언어) → Rams (제품 설계)
 * 3-layer: 경영 방향 + 브랜드 메시지 + 제품 완성.
 * 내부 목표와 외부 언어와 제품이 하나의 라인으로 정렬된다.
 */
export const STACK_MGT_BRAND_3: StackDefinition = {
  stackId:     'STACK_MGT_BRAND_3',
  description: '3-레이어 경영·브랜드·제품 정합 파이프라인',
  useCase:     '경영 목표 → 브랜드 메시지 → 제품 설계 전체 정합 / 사업 리포지셔닝',
  layers: [
    {
      personaId:  'Drucker',
      layerType:  'pre_foundation',
      outputType: 'Management_Spec',
      required:   true,
    },
    {
      personaId:  'Ogilvy',
      layerType:  'foundation',
      outputType: 'Copy_Spec',
      required:   false,
    },
    {
      personaId:  'Rams',
      layerType:  'foundation',
      outputType: 'Product_Spec',
      required:   true,
    },
  ],
};

/** All predefined stacks */
export const PREDEFINED_STACKS: StackDefinition[] = [
  // Jobs anchor — Output Team
  STACK_VISUAL_DESIGN_3,
  STACK_CONCEPT_DESIGN_2,
  STACK_SPACE_EXPERIENCE_3,
  STACK_BRAND_COPY_2,
  STACK_PRODUCT_DESIGN_2,
  STACK_EXPERIENCE_2,
  STACK_PRODUCT_EXP_3,
  STACK_INNOVATION_3,
  // Porter anchor — Competitive Strategy
  STACK_STRATEGY_2,
  STACK_STRATEGY_3,
  // Drucker anchor — Management & Process
  STACK_MANAGEMENT_2,
  STACK_MGT_BRAND_3,
];

/**
 * Routing priority check: Vol.G stack > Vol.F persona meta > Vol.C CHAIN > Vol.B phase > Vol.E skills
 * Returns the relevant stack if the personaId appears in any predefined stack.
 */
export function findStackByPersona(personaId: string): StackDefinition[] {
  return PREDEFINED_STACKS.filter(
    stack => stack.layers.some(l => l.personaId === personaId)
  );
}

/**
 * Get the layer order index (0 = pre_foundation, 1 = foundation, 2 = specialist, 3 = expression).
 */
export function getLayerOrderIndex(layerType: VolGLayerType): number {
  const order: VolGLayerType[] = ['pre_foundation', 'foundation', 'specialist', 'expression'];
  return order.indexOf(layerType);
}

/**
 * Format Vol.G layer metadata for system prompt injection.
 */
export function formatVolGLayer(
  personaId: string,
  layerType?: VolGLayerType
): string {
  if (!layerType) return '';
  const idx    = getLayerOrderIndex(layerType);
  const stacks = findStackByPersona(personaId).map(s => s.stackId).join(', ');
  return `Vol.G LAYER ${idx} [${layerType.toUpperCase()}]${stacks ? ` — stacks: ${stacks}` : ''}`;
}
