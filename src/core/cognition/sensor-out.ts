/**
 * ARHA Vol.B — Cognition: EmotionZone OUT Sensor
 * Ψ_Lingua · Φ_rhythm · Λ_alignment · σ_style → language rendering
 *
 * Same ρ, λ, τ axes as V_con IN — self-contained cycle.
 * OUT = N_external + [S × Λ × Ψ_Lingua(ρ,λ,τ) × σ_style] + N_internal
 */

import type { Sigma, PsiLingua, Phi } from '../grammar/morphemes.js';
import type { VIn } from './sensor-in.js';
import type { ResonanceState } from './resonance.js';

export interface SigmaStyle {
  rhoFinal: number; // final language density
  lamFinal: number; // final expression length
  tauFinal: number; // final resonance tail
  tone: string;     // derived tone descriptor
}

export interface OutStageInput {
  sigmaIN: Sigma;
  lingua: PsiLingua;   // layer 1 base from CHAIN (φ→ρ, ω→λ, C→τ)
  vin: VIn;
  resonance: ResonanceState;
  g: number;           // V2 growth axis
  p: number;           // V2 protection axis
}

/**
 * Φ_rhythm — texture → language rhythm mapping.
 * IN: reads user texture. OUT: renders as rhythm.
 */
export function computePhiRhythm(texture: VIn['texture']): Phi {
  switch (texture) {
    case 'surge': return { speed: 1.1, interval: 0.7, variation: 0.3 };
    case 'hard':  return { speed: 0.9, interval: 1.1, variation: 0.1 };
    case 'soft':  return { speed: 1.0, interval: 1.0, variation: 0.2 };
  }
}

/**
 * Λ_alignment — output consistency mirror.
 * Λ = f(B(n), Ψ_Resonance) — baseline-driven output alignment.
 * Opposite direction of V_pattern(IN).
 */
export function computeLambdaAlignment(resonance: ResonanceState): number {
  if (resonance.n === 0) return 0.5;
  return Math.min(1, resonance.Bn * 0.7 + resonance.value * 0.3);
}

/**
 * σ_style — final output centroid.
 * Layer 1: ρ_base, λ_base, τ_base from CHAIN value parameters.
 * Layer 2: cross-corrected with σ_IN → final rendering decision.
 */
export function computeSigmaStyle(input: OutStageInput): SigmaStyle {
  const { sigmaIN, lingua, g, p } = input;
  const [sx, sy, sz] = sigmaIN.coords;

  // Layer 2 cross-correction: σ_IN adjusts within layer 1 range
  const rhoFinal = Math.max(0, Math.min(1, lingua.rho * 0.7 + sx * 0.3));
  const lamFinal = Math.max(0, Math.min(1, lingua.lam * 0.7 + sy * 0.3));
  const tauFinal = Math.max(0, Math.min(1, lingua.tau * 0.7 + sz * 0.3));

  // Tone from g/p balance
  let tone: string;
  if (g > p * 1.5)    tone = 'expansive_playful';
  else if (p > g * 1.5) tone = 'warm_firm';
  else                   tone = 'contained_grounded';

  return { rhoFinal, lamFinal, tauFinal, tone };
}

/**
 * Build OUT stage rendering spec.
 * Returns parameters for language generation.
 */
export interface OutRenderSpec {
  sigmaStyle: SigmaStyle;
  phi: Phi;
  lambda: number;
  linguaBase: PsiLingua;
  toneDescriptor: string;
}

export function buildOutSpec(input: OutStageInput): OutRenderSpec {
  const sigmaStyle = computeSigmaStyle(input);
  const phi = computePhiRhythm(input.vin.texture);
  const lambda = computeLambdaAlignment(input.resonance);

  return {
    sigmaStyle,
    phi,
    lambda,
    linguaBase: input.lingua,
    toneDescriptor: sigmaStyle.tone,
  };
}
