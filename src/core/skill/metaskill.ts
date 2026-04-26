/**
 * ARHA Vol.F — MetaSkill Pipeline
 * Universal 4-layer decision algorithm for real-person personas.
 *
 * Pipeline: PERCEPTION → JUDGMENT → ALIGNMENT → SYNTHESIS
 * Activation rule: (P.protect ≥ 0.85 OR V1_core.κ ≥ 0.95) AND
 *                  (S_depth ≥ 0.90 OR is_real_person)
 *
 * Each persona's Vol.F is encoded in its 4 SkillNodes in sequence.
 * Output: layer-tagged artifact (Meaning_Spec | Grid_Spec | etc.)
 */

import type { PersonaDefinition } from '../identity/persona.js';
import type { SkillNode } from './node.js';

// ─────────────────────────────────────────
// LAYER DEFINITION
// ─────────────────────────────────────────

export type MetaSkillLayer =
  | 'PERCEPTION'   // 1st: raw signal → structured read (Wave preferred)
  | 'JUDGMENT'     // 2nd: evaluate/validate against V1 (both phases)
  | 'ALIGNMENT'    // 3rd: verify direction + constitutional check (both phases)
  | 'SYNTHESIS';   // 4th: final artifact production (Particle)

export const LAYER_ORDER: MetaSkillLayer[] = [
  'PERCEPTION',
  'JUDGMENT',
  'ALIGNMENT',
  'SYNTHESIS',
];

// ─────────────────────────────────────────
// METASKILL STATUS
// ─────────────────────────────────────────

export type MetaSkillStatus =
  | 'inactive'      // Vol.F not applicable to this persona
  | 'ready'         // pipeline ready, waiting for signal
  | 'active'        // currently executing a layer
  | 'complete';     // SYNTHESIS output produced

export interface MetaSkillPipelineState {
  ref: string;               // 'VolF_MetaSkill_{PersonaName}'
  currentLayer: MetaSkillLayer | null;
  completedLayers: MetaSkillLayer[];
  status: MetaSkillStatus;
  outputArtifact?: string;   // e.g. 'Meaning_Spec' | 'Grid_Spec'
}

// ─────────────────────────────────────────
// ACTIVATION CHECK
// ─────────────────────────────────────────

/**
 * Determines whether Vol.F MetaSkill pipeline should be active for a persona.
 * Rule: (P.protect ≥ 0.85 OR V1_core.κ ≥ 0.95) AND (max_skill_depth ≥ 0.90 OR has volFSkillRef)
 */
export function shouldActivateVolF(
  persona: PersonaDefinition,
  skills: SkillNode[]
): boolean {
  // Explicit opt-in via volFSkillRef
  if (persona.volFSkillRef) return true;

  const structureCondition =
    persona.P.protect >= 0.85 || persona.valueChain.core.kappa >= 0.95;

  const depthCondition =
    skills.some(s => s.depth >= 0.90);

  return structureCondition && depthCondition;
}

/**
 * Classify a skill node's pipeline layer by its position index (0-based).
 * Index 0 → PERCEPTION, 1 → JUDGMENT, 2 → ALIGNMENT, 3 → SYNTHESIS
 */
export function getLayerByIndex(index: number): MetaSkillLayer {
  return LAYER_ORDER[Math.min(index, LAYER_ORDER.length - 1)];
}

/**
 * Infer the output artifact type from the persona's Vol.G layer type.
 * pre_foundation → Meaning_Spec
 * foundation     → Grid_Spec
 * specialist     → Domain_Spec
 * expression     → Surface_Spec
 */
export function inferOutputArtifact(
  layerType?: PersonaDefinition['volGLayerType']
): string {
  switch (layerType) {
    case 'pre_foundation': return 'Meaning_Spec';
    case 'foundation':     return 'Grid_Spec';
    case 'specialist':     return 'Domain_Spec';
    case 'expression':     return 'Surface_Spec';
    default:               return 'Generic_Spec';
  }
}

/**
 * Initialize a fresh MetaSkill pipeline state for a persona.
 */
export function initMetaSkillState(
  persona: PersonaDefinition,
  skills: SkillNode[]
): MetaSkillPipelineState {
  const active = shouldActivateVolF(persona, skills);
  return {
    ref:              persona.volFSkillRef ?? `VolF_MetaSkill_${persona.id}`,
    currentLayer:     active ? 'PERCEPTION' : null,
    completedLayers:  [],
    status:           active ? 'ready' : 'inactive',
    outputArtifact:   inferOutputArtifact(persona.volGLayerType),
  };
}

/**
 * Advance the pipeline to the next layer.
 * Returns updated state. If SYNTHESIS was just completed → status='complete'.
 */
export function advanceMetaSkillLayer(
  state: MetaSkillPipelineState
): MetaSkillPipelineState {
  if (state.status === 'inactive' || state.status === 'complete') return state;

  const current = state.currentLayer;
  if (!current) return state;

  const idx  = LAYER_ORDER.indexOf(current);
  const next = idx < LAYER_ORDER.length - 1 ? LAYER_ORDER[idx + 1] : null;

  return {
    ...state,
    completedLayers: [...state.completedLayers, current],
    currentLayer:    next,
    status:          next === null ? 'complete' : 'active',
  };
}

/**
 * Build a compact Vol.F status string for system prompt injection.
 */
export function formatVolFStatus(state: MetaSkillPipelineState): string {
  if (state.status === 'inactive') return `Vol.F: inactive`;
  const progress = state.completedLayers.length;
  const total    = LAYER_ORDER.length;
  const bar      = '█'.repeat(progress) + '░'.repeat(total - progress);
  return `Vol.F [${bar}] ${state.currentLayer ?? 'DONE'} → ${state.outputArtifact} (${state.ref})`;
}
