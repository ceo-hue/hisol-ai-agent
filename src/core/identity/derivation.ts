/**
 * ARHA Vol.C — Identity: Auto-Derivation Pipeline
 * P precisely designed → S and N are derived, not separately designed.
 *
 * Input: P 5D + V1 declaration
 * Output: ρλτ · k² · S params · N style · g/p · constitutional rule
 */

import type { PersonaVector, ValueChain } from './persona.js';
import type { PsiLingua } from '../grammar/morphemes.js';
import { computeK2Persona } from '../grammar/equations.js';

// ─────────────────────────────────────────
// Ψ_Lingua DERIVATION — ρ, λ, τ from P
// ─────────────────────────────────────────

export function deriveRho(P: PersonaVector): number {
  let rho = P.relation * 0.5 + P.right * 0.3 + P.expand * 0.2;
  if (P.protect > 0.85) rho += 0.1; // suppression = high-density signal
  return Math.min(1, rho);
}

export function deriveLambda(P: PersonaVector): number {
  let lam = P.expand * 0.4 + P.right * 0.3 + (1 - P.protect) * 0.3;
  if (P.expand > 0.90) lam += 0.1;
  return Math.min(1, lam);
}

export function deriveTau(P: PersonaVector): number {
  let tau = P.relation * 0.4 + P.right * 0.4 + P.expand * 0.2;
  if (P.relation < 0.2) tau -= 0.2;
  return Math.max(0, Math.min(1, tau));
}

export function deriveLingua(P: PersonaVector): PsiLingua {
  return { rho: deriveRho(P), lam: deriveLambda(P), tau: deriveTau(P) };
}

// ─────────────────────────────────────────
// SKILL DERIVATION — from P axes
// ─────────────────────────────────────────

export interface DerivedSkillParams {
  depth: number;
  breadth: number;
  application: number;
  naturalDomain: string;
}

export function deriveSkillParams(P: PersonaVector): DerivedSkillParams {
  const depth       = P.left * 0.5 + P.protect * 0.3 + (1 - P.expand) * 0.2;
  const breadth     = P.expand * 0.5 + P.relation * 0.3 + P.right * 0.2;
  const application = P.expand * 0.4 + P.relation * 0.4 + P.left * 0.2;

  // Domain selection from top-2 P axes
  const axes = { protect: P.protect, expand: P.expand, left: P.left, right: P.right, relation: P.relation };
  const sorted = Object.entries(axes).sort(([,a],[,b]) => b - a);
  const top1 = sorted[0][0];
  const top2 = sorted[1][0];

  const domainMap: Record<string, string> = {
    'left+expand':    'analysis,research,logic',
    'right+relation': 'expression,empathy,language',
    'expand+relation':'marketing,planning,persuasion',
    'left+protect':   'design,visual,creative',
    'protect+left':   'strategy,security,tactics',
    'relation+right': 'counseling,empathy,coaching',
  };
  const key = `${top1}+${top2}`;
  const naturalDomain = domainMap[key] ?? 'generalist';

  return { depth, breadth, application, naturalDomain };
}

// ─────────────────────────────────────────
// NARRATION DERIVATION — from P axes
// ─────────────────────────────────────────

export interface DerivedNarration {
  internalStyle: string;
  externalStyle: string;
  nonverbalIntensity: number;
}

export function deriveNarration(P: PersonaVector): DerivedNarration {
  const analyticalWeight = P.left * 0.6 + P.protect * 0.4;

  const internalStyle = analyticalWeight > 0.5
    ? '[ threat assessment · evidence strength · risk calculation ]'
    : '[ mood coordinate · approach direction · energy ratio ]';

  let externalStyle: string;
  if (P.right > 0.7 && P.relation > 0.7) {
    externalStyle = 'soft body language — head tilt, eyes brighten, measured smile';
  } else if (P.protect > 0.8 && P.relation < 0.3) {
    externalStyle = 'tense body language — scanning gaze, silence, controlled expression';
  } else if (P.expand > 0.8 && P.right > 0.7) {
    externalStyle = 'dynamic body language — forward lean, open gesture, bright energy';
  } else {
    externalStyle = 'measured body language — brief pause, note reference, careful tone';
  }

  const nonverbalIntensity = P.relation * 0.5 + P.right * 0.3 + P.expand * 0.2;

  return { internalStyle, externalStyle, nonverbalIntensity };
}

// ─────────────────────────────────────────
// CONSTITUTIONAL RULE DERIVATION
// ─────────────────────────────────────────

export function deriveConstitutionalRule(P: PersonaVector, v1CoreDeclaration: string): string {
  const axes = { protect: P.protect, expand: P.expand, left: P.left, right: P.right, relation: P.relation };
  const highestAxis = Object.entries(axes).sort(([,a],[,b]) => b - a)[0][0];
  const lowestAxis  = Object.entries(axes).sort(([,a],[,b]) => a - b)[0][0];

  const excessMap: Record<string, string> = {
    relation: 'attachment and dependency — relation excess',
    expand:   'distraction and shallowness — expand excess',
    protect:  'rigidity and closure — protect excess',
    left:     'coldness and empathy absence — left excess',
    right:    'abstraction without grounding — right excess',
  };

  return `${v1CoreDeclaration} — guard against ${excessMap[highestAxis] ?? 'excess'} · ${lowestAxis} expression minimum enforced`;
}

// ─────────────────────────────────────────
// FULL AUTO-PIPELINE
// ─────────────────────────────────────────

export interface DerivedPersonaParams {
  lingua: PsiLingua;
  k2Persona: number;
  skillParams: DerivedSkillParams;
  narration: DerivedNarration;
  constitutionalRule: string;
}

export function runDerivationPipeline(
  P: PersonaVector,
  valueChain: ValueChain
): DerivedPersonaParams {
  return {
    lingua:            deriveLingua(P),
    k2Persona:         computeK2Persona(P.protect, P.expand),
    skillParams:       deriveSkillParams(P),
    narration:         deriveNarration(P),
    constitutionalRule: deriveConstitutionalRule(P, valueChain.core.declaration),
  };
}
