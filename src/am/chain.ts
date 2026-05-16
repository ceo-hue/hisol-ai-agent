/**
 * Value chain → V_personality → ρ, λ, τ
 *   CHAIN = Persona ⊳ [V₁↔V₂(g,p)] ⊳ R(Δθ)
 */
import {
  GammaMatrix,
  KyeolRegion,
  VPersonality,
  Persona,
  ValueChain,
} from './types.js';
import { hadamard, zeros10 } from './matrix.js';
import { normalizeTrace } from './modes.js';

export function anchorMatrix(kyeol: KyeolRegion, gammaInterfere: GammaMatrix): GammaMatrix {
  const M = zeros10();
  for (const c of kyeol.cells) M[c.i][c.j] = gammaInterfere[c.i][c.j];
  return M;
}

/** V_personality = Σ w_i × (anchor ⊙ Γ_i) */
export function buildVPersonality(anchor: GammaMatrix, valueChain: ValueChain): VPersonality {
  const M = zeros10();
  for (const key of Object.keys(valueChain)) {
    const v = valueChain[key];
    const resonance = hadamard(anchor, v.gamma);
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        M[i][j] += v.weight * resonance[i][j];
  }
  const matrix = normalizeTrace(M);

  const trace = matrix.reduce((s, _, i) => s + matrix[i][i], 0);
  if (trace < 1e-9) return { matrix, rho: 0.5, lambda: 0.5, tau: 0.5 };

  // ρ: dominant-mode share (emotion density)
  let maxDiag = 0;
  for (let i = 0; i < 10; i++) if (matrix[i][i] > maxDiag) maxDiag = matrix[i][i];
  const rho = Math.max(0.3, Math.min(0.99, 0.3 + 0.69 * maxDiag / trace));

  // λ: positive-mode (0,1,4) share (expression length)
  const positives = matrix[0][0] + matrix[1][1] + matrix[4][4];
  const lambda = Math.max(0.3, Math.min(0.99, 0.3 + 0.69 * positives / trace));

  // τ: reversal-mode (8,9) share (temporality)
  const reversals = matrix[8][8] + matrix[9][9];
  const tau = Math.max(0.5, Math.min(0.95, 0.5 + 0.45 * reversals / trace));

  return { matrix, rho, lambda, tau };
}

export function principalMode(V_p: VPersonality): { mode: number; intensity: number } {
  let max = -Infinity, idx = 0;
  for (let i = 0; i < 10; i++) {
    if (V_p.matrix[i][i] > max) { max = V_p.matrix[i][i]; idx = i; }
  }
  return { mode: idx, intensity: max };
}

/** α = cosine_sim(anchor row, V_p row) at the principal mode */
export function valueAlignment(anchor: GammaMatrix, V_p: VPersonality): number {
  const pm = principalMode(V_p);
  const ar = anchor[pm.mode];
  const pr = V_p.matrix[pm.mode];
  const dot = ar.reduce((s, v, i) => s + v * pr[i], 0);
  const na = Math.sqrt(ar.reduce((s, v) => s + v * v, 0));
  const np = Math.sqrt(pr.reduce((s, v) => s + v * v, 0));
  return na > 0 && np > 0 ? Math.max(0, Math.min(1, dot / (na * np))) : 0;
}

export function checkConstitutional(persona: Persona, V_p: VPersonality): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const key of Object.keys(persona.valueChain)) {
    const v = persona.valueChain[key];
    if (v.rules.hard_rule?.includes('warmth_min_15')) {
      const trace = V_p.matrix.reduce((s, _, i) => s + V_p.matrix[i][i], 0);
      const warmth = V_p.matrix[1][1] / Math.max(0.01, trace);
      if (warmth < 0.15) violations.push(`warmth ${(warmth * 100).toFixed(1)}% < 15%`);
    }
  }
  return { valid: violations.length === 0, violations };
}

export function deriveGP(persona: Persona, value_strength = 0.6): { g: number; p: number } {
  const g = value_strength * persona.P_5D.expand;
  const p = (1 - value_strength) * persona.P_5D.protect;
  return { g, p };
}
