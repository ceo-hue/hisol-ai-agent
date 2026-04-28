/**
 * ARHA Vol.C — Identity: CHAIN Stage Engine
 * ENGINE_SELECT → COHERENCE → STRESS → k²_dynamic → VALUE_CHAIN
 */

import type { PersonaVector, ValueChain, V1Sub } from './persona.js';
import type { Sigma } from '../grammar/morphemes.js';
import type { DominantEngine } from '../grammar/morphemes.js';
import { computeValueStrengthBridge, bridgeUpdateVsB } from '../grammar/equations.js';
import { cosineSim, innerProduct } from '../grammar/operators.js';

export interface ChainResult {
  dominantEngine: DominantEngine;
  blendRatio: { Xi_C: number; Lambda_L: number; Pi_G: number };
  C: number;
  coherenceState: 'high' | 'neutral' | 'low';
  Gamma: number;
  gammaLevel: 'Green' | 'Yellow' | 'Red';
  k2Final: number;
  activeSub: V1Sub | null;
  RTension: number;
  vsB: number;    // Bridge B(t) — session momentum after this turn's update
  g: number;
  p: number;
  psiDiss: boolean; // decoherence flag
}

/**
 * softmax for engine blend ratio
 */
function softmax(vals: number[]): number[] {
  const exps = vals.map(v => Math.exp(v));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/**
 * Full CHAIN stage processing.
 * Persona ⊳ ENGINE_SELECT ⊳ COHERENCE ⊳ STRESS ⊳ k²_final ⊳ [V1↔V2] ⊳ R(Δθ)
 */
export function stageChain(params: {
  P: PersonaVector;
  valueChain: ValueChain;
  sigma: Sigma;
  vinCoords: [number, number, number];
  velocity: number;
  k2Persona: number;
  prevPsiRes: number;  // Bridge: Ψ_Res(t−1)
  prevVsB:   number;   // Bridge: B(t−1) session momentum
}): ChainResult {
  const { P, valueChain, sigma, vinCoords, velocity, k2Persona } = params;

  // Stage 1 — ENGINE SELECT
  const weights = { Xi_C: P.right, Lambda_L: P.left, Pi_G: P.protect };
  const weightArr = [weights.Xi_C, weights.Lambda_L, weights.Pi_G];
  const sm = softmax(weightArr);
  const blendRatio = { Xi_C: sm[0], Lambda_L: sm[1], Pi_G: sm[2] };

  const dominantEngine = (Object.keys(weights) as DominantEngine[])
    .reduce((a, b) => weights[a] > weights[b] ? a : b);

  // Stage 2 — COHERENCE: C = |⟨V1 | σ⟩|
  const v1Coords: [number, number, number] = [
    valueChain.core.phi,
    valueChain.core.omega,
    valueChain.core.kappa,
  ];
  const C = Math.min(1, innerProduct(v1Coords, sigma.coords));
  const coherenceState = C > 0.85 ? 'high' : C < 0.60 ? 'low' : 'neutral';
  const psiDiss = coherenceState === 'low';

  // Stage 3 — STRESS: Γ = ||V_in - V1|| × v
  const dx = vinCoords[0] - v1Coords[0];
  const dy = vinCoords[1] - v1Coords[1];
  const dz = vinCoords[2] - v1Coords[2];
  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
  const Gamma = Math.min(1, dist * velocity);
  const gammaLevel: 'Green' | 'Yellow' | 'Red' =
    Gamma > 0.7 ? 'Red' : Gamma > 0.3 ? 'Yellow' : 'Green';

  // Stage 4 — k²_dynamic
  const fC = C > 0.85 ? 0.85 : C < 0.60 ? 1.20 : 1.00;
  const gG = Gamma > 0.7 ? 1.15 : 1.00;
  const k2Final = Math.max(0.55, Math.min(0.95, k2Persona * fC * gG));

  // Stage 5 — VALUE CHAIN: select active sub + compute R_tension
  let activeSub: V1Sub | null = null;
  let maxScore = -Infinity;
  for (const sub of valueChain.subs) {
    const subCoords: [number, number, number] = [sub.alpha, sub.beta, sub.gamma];
    const N = cosineSim(sigma.coords, subCoords);
    const score = N * sub.gamma;
    if (score > maxScore) { maxScore = score; activeSub = sub; }
  }

  // R_tension = weighted average tension across value chain
  let RTension = 0;
  let gammaSum = 0;
  for (const sub of valueChain.subs) {
    const subCoords: [number, number, number] = [sub.alpha, sub.beta, sub.gamma];
    const sim = cosineSim(v1Coords, subCoords);
    const Q = 1 - sim;
    const N = sim;
    const strength = Q * N;
    RTension += strength * sub.gamma;
    gammaSum += sub.gamma;
  }
  if (gammaSum > 0) RTension /= gammaSum;

  // V1_check — auto-activate if R_tension > θ_trigger
  if (RTension > valueChain.check.thetaTrigger) {
    // Reduce highest-tension sub influence (modeled as tension increase → protection)
  }

  // Bridge B(t) update — using this turn's C and Γ
  const vsB    = bridgeUpdateVsB(params.prevVsB, C, Gamma);
  const deltaB = vsB - params.prevVsB;

  // Bridge vs(t+1) — value_strength with full emotional dynamics
  const valueStrength = computeValueStrengthBridge({
    omega:    valueChain.core.omega,
    rTension: RTension,
    psiRes:   params.prevPsiRes,
    gamma:    Gamma,
    deltaB,
  });

  const g = valueStrength * P.expand;
  const p = (1 - valueStrength) * P.protect;

  return {
    dominantEngine,
    blendRatio,
    C,
    coherenceState,
    Gamma,
    gammaLevel,
    k2Final,
    activeSub,
    RTension,
    vsB,
    g,
    p,
    psiDiss,
  };
}
