/**
 * ARHA Vol.C — Identity: Persona Vector P
 * 5D constitutional layer. Immutable once set at boot.
 *
 * P = (protect, expand, left, right, relation)
 * P conditions: S expression, N form, k²_persona, g/p ratio, engine selection, language style.
 */

import type { PsiLingua, TextureType } from '../grammar/morphemes.js';
import { computeK2Persona } from '../grammar/equations.js';

// ─────────────────────────────────────────
// PERSONA VECTOR — P
// ─────────────────────────────────────────

export interface PersonaVector {
  protect: number;  // 0–1: low=open / high=defensive
  expand:  number;  // 0–1: low=convergent / high=exploratory
  left:    number;  // 0–1: low=intuitive / high=analytical
  right:   number;  // 0–1: low=explicit / high=metaphorical
  relation:number;  // 0–1: low=independent / high=empathic
}

// ─────────────────────────────────────────
// VALUE CHAIN — V1 structure
// ─────────────────────────────────────────

export interface V1Core {
  declaration: string;
  phi: number;    // philosophical depth 0–1 (must > 0.7)
  omega: number;  // orientation strength 0–1 (must > 0.7)
  kappa: number;  // consistency 0–1 (must > 0.8)
  texture: TextureType;
}

export interface V1Sub {
  n: number;         // priority (1, 2, 3... strictly decreasing)
  declaration: string;
  alpha: number;     // alignment with V1_core (must > 0.6)
  beta: number;      // interpretation specificity
  gamma: number;     // priority weight (strictly γ_1 > γ_2 > γ_3)
  texture: TextureType;
  R_core?: { Q: number; N: number };
}

export interface V1Check {
  declaration: string;
  epsilon: number;     // restraint strength
  delta: number;       // restraint scope
  thetaTrigger: number; // activation threshold
}

export interface ValueChain {
  core: V1Core;
  subs: V1Sub[];
  check: V1Check;
  clarity: number; // V1_clarity — precision of core declaration 0–1
}

// ─────────────────────────────────────────
// COMPLETE PERSONA DEFINITION
// ─────────────────────────────────────────

export interface WeightStructure {
  wCore: number;            // w_core = f(P.protect, V1_core.kappa) ∈ [0.35, 0.75]
  wSubs: number[];          // w_sub[n] = (1 - wCore) × (gamma_n / Σgamma_i)
}

export interface PersonaDefinition {
  id: string;
  identity: string;         // one-line declaration
  P: PersonaVector;
  valueChain: ValueChain;
  lingua: PsiLingua;        // derived ρλτ
  k2Persona: number;        // derived threshold
  constitutionalRule: string;
  skillIds: string[];       // references to S vector definitions
  narrationStyle: {
    internal: string;       // [ ] style descriptor
    external: string;       // italic scene style descriptor
  };
  // Vol.C v2.1 — Vol.F/G routing
  volFSkillRef?: string | null;           // 'VolF_MetaSkill_{Name}' | null
  volGLayerType?: 'pre_foundation' | 'foundation' | 'specialist' | 'expression';
  weightStructure?: WeightStructure;      // w_core + w_sub[] for token anchor
  dominantEngineNote?: string;            // e.g. "Ξ_C ∧ Π_G 공동 지배"
}

// ─────────────────────────────────────────
// CONSTITUTIONAL GUARD
// ─────────────────────────────────────────

/**
 * Checks if a response candidate violates Persona constitution.
 * Vol.C PART_2 constitutional law.
 */
export function violatesConstitution(
  persona: PersonaDefinition,
  responseText: string
): boolean {
  // Check constitutional rule keywords
  const rule = persona.constitutionalRule.toLowerCase();

  // Attachment prohibition check (example for HighSol)
  if (rule.includes('attachment') || rule.includes('애착')) {
    const attachmentWords = /\b(depend on me|only i|always here for you|나만|나한테만|항상 곁에)\b/i;
    if (attachmentWords.test(responseText)) return true;
  }

  return false;
}

/**
 * Validate V1 chain integrity.
 */
export function validateValueChain(vc: ValueChain): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (vc.core.phi <= 0.7) errors.push('V1_core.phi must > 0.7');
  if (vc.core.omega <= 0.7) errors.push('V1_core.omega must > 0.7');
  if (vc.core.kappa <= 0.8) errors.push('V1_core.kappa must > 0.8');

  for (let i = 0; i < vc.subs.length; i++) {
    const sub = vc.subs[i];
    if (sub.alpha < 0.6) errors.push(`V1_sub[${i+1}].alpha must ≥ 0.6`);
    if (i > 0 && sub.gamma >= vc.subs[i-1].gamma) {
      errors.push(`V1_sub[${i+1}].gamma must < V1_sub[${i}].gamma (strict ordering)`);
    }
  }

  return { valid: errors.length === 0, errors };
}
