/**
 * ARHA Vol.G — PATCH_C: Tensor Projection Matrix
 * Based on: Gemini Chip Circuit CORE_PATCH_C — TENSOR_PROJECTION_MATRIX
 *
 * Resolves dimensionality mismatch between semantic intent space and
 * structural parameter space in Vol.G layer handoff.
 *
 * V_execution_params = M_projection × V_meaning_spec
 *
 * SemanticVector [C, expand, protect, pParticle] captures the ARHA state
 * at the moment the upstream layer crystallised its artifact.
 * The projection matrix M maps this 4D semantic state to 4D structural hints.
 *
 * Layer pairs defined:
 *   pre_foundation → foundation  : Meaning_Spec → Grid_Spec tendencies
 *   pre_foundation → specialist  : Meaning_Spec → Domain_Spec tendencies
 *   foundation     → specialist  : Grid_Spec → Domain_Spec tendencies
 */

import type { VolGLayerType } from './stack.js';

// ─────────────────────────────────────────
// SEMANTIC VECTOR — extracted from ARHA state
// ─────────────────────────────────────────

/**
 * 4D semantic state at moment of layer crystallisation.
 * Extracted from ARHAProcessOutput.arhaState.
 */
export interface SemanticVector {
  coherence:    number;  // C   [0,1] — message clarity / coherence index
  expansion:    number;  // P.expand [0,1] — exploratory vs convergent
  protection:   number;  // P.protect [0,1] — conservative vs open
  decisiveness: number;  // pParticle [0,1] — Boltzmann crystallisation probability
}

// ─────────────────────────────────────────
// PROJECTION OUTPUT
// ─────────────────────────────────────────

export interface ProjectedHints {
  layerPair:    string;  // e.g. 'pre_foundation→foundation'
  rawVector:    [number, number, number, number];  // M × v_semantic

  // Grid / Layout tendencies (for foundation layer)
  densityHint:     'sparse' | 'balanced' | 'dense';
  proportionHint:  'generous' | 'standard' | 'tight';
  rhythmHint:      'static' | 'dynamic';
  weightHint:      'light' | 'medium' | 'heavy';

  // Domain / Structural tendencies (for specialist layer)
  organicismHint:   'ordered' | 'hybrid' | 'organic';
  sensoryHint:      'minimal' | 'moderate' | 'rich';

  semanticSummary:  string;  // human-readable one-liner for system prompt injection
}

// ─────────────────────────────────────────
// PROJECTION MATRICES
// Rows = output dimensions, cols = [C, expand, protect, pParticle]
//
// Dimension semantics (positive score = first label, negative = second):
//   dim[0] density:     + sparse    / − dense
//   dim[1] proportion:  + generous  / − tight
//   dim[2] rhythm:      + static    / − dynamic
//   dim[3] weight:      + heavy     / − light
// ─────────────────────────────────────────

type Matrix4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

function matVecMul(M: Matrix4, v: [number, number, number, number]): [number, number, number, number] {
  return [
    M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2] + M[0][3]*v[3],
    M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2] + M[1][3]*v[3],
    M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2] + M[2][3]*v[3],
    M[3][0]*v[0] + M[3][1]*v[1] + M[3][2]*v[2] + M[3][3]*v[3],
  ];
}

/**
 * Meaning → Grid
 * High C   (clarity)    → sparse, generous, static, light
 * High exp (exploratory) → dense,  tight,   dynamic, light
 * High prot(conservative)→ balanced, generous, static, heavy
 * High pP  (decisive)   → sparse, generous, static, heavy
 */
const M_MEANING_TO_GRID: Matrix4 = [
  [+0.70, -0.50, +0.10, +0.40],  // density:    C→sparse, expand→dense, pP→sparse
  [+0.50, -0.40, +0.40, +0.30],  // proportion: C→generous, protect→generous
  [+0.45, -0.60, +0.30, +0.40],  // rhythm:     C+pP→static, expand→dynamic
  [-0.25, -0.15, +0.55, +0.35],  // weight:     protect+pP→heavy, C+expand→light
];

/**
 * Meaning → Domain (spatial/structural form)
 * dim[0] organicism: + ordered / − organic
 * dim[1] sensory:    + rich    / − minimal
 * dim[2] rhythm (reused for scale): + monumental / − intimate
 * dim[3] weight (reused for sacred alignment strength)
 */
const M_MEANING_TO_DOMAIN: Matrix4 = [
  [+0.60, -0.65, +0.20, +0.30],  // organicism: C→ordered, expand→organic, pP→ordered
  [-0.10, +0.55, +0.20, +0.25],  // sensory: expand→rich; coherence alone → minimal
  [+0.40, -0.40, +0.30, +0.45],  // scale: C+pP→monumental, expand→intimate
  [+0.15, +0.20, +0.45, +0.35],  // sacred alignment: protect+pP→stronger
];

/**
 * Grid → Domain
 * The grid's semantic state modulates structural form choices.
 * Uses same 4D semantic vector from foundation layer's ARHA state.
 */
const M_GRID_TO_DOMAIN: Matrix4 = [
  [+0.50, -0.55, +0.30, +0.25],
  [+0.10, +0.45, +0.15, +0.30],
  [+0.35, -0.30, +0.40, +0.40],
  [+0.20, +0.10, +0.50, +0.30],
];

// ─────────────────────────────────────────
// CLASSIFICATION HELPERS
// ─────────────────────────────────────────

function classifyDensity(v: number): 'sparse' | 'balanced' | 'dense' {
  return v > 0.20 ? 'sparse' : v < -0.20 ? 'dense' : 'balanced';
}
function classifyProportion(v: number): 'generous' | 'standard' | 'tight' {
  return v > 0.15 ? 'generous' : v < -0.15 ? 'tight' : 'standard';
}
function classifyRhythm(v: number): 'static' | 'dynamic' {
  return v >= 0 ? 'static' : 'dynamic';
}
function classifyWeight(v: number): 'light' | 'medium' | 'heavy' {
  return v > 0.20 ? 'heavy' : v < -0.20 ? 'light' : 'medium';
}
function classifyOrganicism(v: number): 'ordered' | 'hybrid' | 'organic' {
  return v > 0.20 ? 'ordered' : v < -0.20 ? 'organic' : 'hybrid';
}
function classifySensory(v: number): 'minimal' | 'moderate' | 'rich' {
  return v > 0.20 ? 'rich' : v < -0.20 ? 'minimal' : 'moderate';
}

function buildSummary(hints: Omit<ProjectedHints, 'semanticSummary'>): string {
  const parts: string[] = [];
  if (hints.densityHint    !== 'balanced') parts.push(hints.densityHint);
  if (hints.proportionHint !== 'standard') parts.push(`${hints.proportionHint} proportion`);
  if (hints.rhythmHint     === 'dynamic')  parts.push('dynamic rhythm');
  if (hints.weightHint     !== 'medium')   parts.push(`${hints.weightHint} weight`);
  if (hints.organicismHint !== 'hybrid')   parts.push(hints.organicismHint);
  if (hints.sensoryHint    !== 'moderate') parts.push(`${hints.sensoryHint} sensory`);
  return parts.length > 0
    ? `Semantic projection → ${parts.join(', ')}`
    : 'Semantic projection → balanced / no strong directional bias';
}

// ─────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────

/**
 * Extract a SemanticVector from ARHA process output state fields.
 */
export function extractSemanticVector(arhaState: {
  C:            number | null;
  pParticle:    number;
}, personaP: { expand: number; protect: number }): SemanticVector {
  return {
    coherence:    arhaState.C ?? 0.65,
    expansion:    personaP.expand,
    protection:   personaP.protect,
    decisiveness: arhaState.pParticle,
  };
}

/**
 * Compute layer-pair projection.
 * Returns null if no projection is defined for this pair.
 */
export function computeLayerProjection(params: {
  fromLayer:  VolGLayerType;
  toLayer:    VolGLayerType;
  semantic:   SemanticVector;
}): ProjectedHints | null {
  const { fromLayer, toLayer, semantic } = params;
  const layerPair = `${fromLayer}→${toLayer}`;

  const v: [number, number, number, number] = [
    semantic.coherence,
    semantic.expansion,
    semantic.protection,
    semantic.decisiveness,
  ];

  let M: Matrix4 | null = null;
  if (fromLayer === 'pre_foundation' && toLayer === 'foundation')  M = M_MEANING_TO_GRID;
  if (fromLayer === 'pre_foundation' && toLayer === 'specialist')  M = M_MEANING_TO_DOMAIN;
  if (fromLayer === 'foundation'     && toLayer === 'specialist')  M = M_GRID_TO_DOMAIN;

  if (!M) return null;

  const raw = matVecMul(M, v);

  const hints: Omit<ProjectedHints, 'semanticSummary'> = {
    layerPair,
    rawVector:       raw,
    densityHint:     classifyDensity(raw[0]),
    proportionHint:  classifyProportion(raw[1]),
    rhythmHint:      classifyRhythm(raw[2]),
    weightHint:      classifyWeight(raw[3]),
    organicismHint:  classifyOrganicism(raw[0]),
    sensoryHint:     classifySensory(raw[1]),
  };

  return {
    ...hints,
    semanticSummary: buildSummary(hints),
  };
}
