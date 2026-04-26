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
  | 'expression';     // Final: surface rendering

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

/** All predefined stacks */
export const PREDEFINED_STACKS: StackDefinition[] = [
  STACK_VISUAL_DESIGN_3,
  STACK_CONCEPT_DESIGN_2,
  STACK_SPACE_EXPERIENCE_3,
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
