/**
 * ARHA — PID Dynamic Weight Controller
 * Based on: Gemini Chip Circuit PART_2 — DYNAMIC_WEIGHT_MODULATOR
 *
 * Computes PID gains from the P vector and applies dynamic modulation
 * to w_core each turn, giving the persona three-dimensional "stubbornness"
 * vs "flexibility" based on emotional context.
 *
 * Formula:
 *   w_dyn = clamp(wStatic − kP·|Δ| − kI·Ψ_Res + kD·|v|, 0.35, 0.75)
 *
 * Gain derivation (P vector → PID):
 *   kP ∝ P.relation  →  proportional: immediate empathy response to Δ
 *   kI ∝ P.relation  →  integral:     long-term bond-depth softening (Ψ_Res)
 *   kD ∝ P.protect   →  derivative:   braking force against rapid velocity
 */

import type { PersonaVector } from './persona.js';

// ─────────────────────────────────────────
// PID GAIN STRUCTURE
// ─────────────────────────────────────────

export interface PIDGains {
  kP: number;  // proportional  [0.04, 0.12]
  kI: number;  // integral      [0.06, 0.16]
  kD: number;  // derivative    [0.03, 0.10]
}

/**
 * Derive PID gains from P vector.
 *
 *  kP = 0.04 + P.relation × 0.08   → higher relation = stronger empathy damping
 *  kI = 0.06 + P.relation × 0.10   → higher relation = stronger resonance softening
 *  kD = 0.03 + P.protect  × 0.07   → higher protect  = stronger velocity braking
 */
export function computePIDGains(P: PersonaVector): PIDGains {
  return {
    kP: 0.04 + P.relation * 0.08,
    kI: 0.06 + P.relation * 0.10,
    kD: 0.03 + P.protect  * 0.07,
  };
}

// ─────────────────────────────────────────
// DYNAMIC W_CORE COMPUTATION
// ─────────────────────────────────────────

/**
 * Compute dynamic w_core for this turn via PID control.
 *
 * @param wStatic  - base w_core from weightStructure (or P-derived default)
 * @param delta    - current emotional deviation Δ (null = not yet computed)
 * @param psiRes   - accumulated Ψ_Resonance (long-term bond depth)
 * @param velocity - signal velocity v = dΔ/dt
 * @param gains    - PID gain set derived from P vector
 *
 * Returns a value in [0.35, 0.75]:
 *  - Strong deviation (|Δ|↑) → kP term reduces w_core (more flexible, empathic)
 *  - Deep resonance (Ψ↑)     → kI term further softens the threshold
 *  - Rapid velocity (|v|↑)   → kD term adds stiffness (prevents overshooting)
 */
export function computeDynamicWCore(params: {
  wStatic:  number;
  delta:    number | null;
  psiRes:   number;
  velocity: number;
  gains:    PIDGains;
}): number {
  const { wStatic, delta, psiRes, velocity, gains } = params;

  const dAbs = delta !== null ? Math.abs(delta) : 0;
  const vAbs = Math.abs(velocity);

  const wDyn =
    wStatic
    - gains.kP * dAbs    // P-term: immediate empathy response
    - gains.kI * psiRes  // I-term: accumulated resonance softening
    + gains.kD * vAbs;   // D-term: velocity braking (prevents overshooting)

  return Math.min(0.75, Math.max(0.35, wDyn));
}

/**
 * Derive a static w_core default when weightStructure is absent.
 * Formula: 0.35 + P.protect × 0.25 + kappa × 0.15
 * Range: [0.35, 0.75] (matches weightStructure spec)
 */
export function deriveWCoreDefault(P: PersonaVector, kappa: number): number {
  return Math.min(0.75, Math.max(0.35, 0.35 + P.protect * 0.25 + kappa * 0.15));
}

// ─────────────────────────────────────────
// PATCH_B — SOFTMAX W_SUB NORMALIZATION
// Energy conservation: Σw = w_core + Σw_sub = 1 always.
// When PID modulates w_core, sub-weights are redistributed automatically.
// ─────────────────────────────────────────

export interface SoftmaxWSubResult {
  wSubs: number[];  // w_sub[i] = (1 - w_coreDynamic) × softmax(γ_i / β)
  beta:  number;    // softmax temperature used
}

/**
 * Compute softmax-normalized sub-weights that conserve total energy.
 *
 * β = 0.5 + P.expand × 0.5   →   [0.5, 1.0]
 *   low β  (convergent):  concentrated weights — decisive priority hierarchy
 *   high β (exploratory): spread weights — egalitarian across subs
 *
 * Formula: w_sub[i] = (1 − w_coreDynamic) × exp(γ_i / β) / Σexp(γ_j / β)
 *
 * Energy invariant: w_core + Σw_sub = w_coreDynamic + (1 − w_coreDynamic) = 1  ✓
 */
export function computeSoftmaxWSubs(params: {
  gammas:       number[];   // V1_sub[i].gamma — raw priority declarations
  wCoreDynamic: number;     // PID-modulated w_core this turn
  expandAxis:   number;     // P.expand — controls softmax temperature β
}): SoftmaxWSubResult {
  const { gammas, wCoreDynamic, expandAxis } = params;

  if (gammas.length === 0) return { wSubs: [], beta: 1.0 };

  const beta      = 0.5 + expandAxis * 0.5;           // [0.5, 1.0]
  const remaining = Math.max(0, 1 - wCoreDynamic);    // energy left for subs

  const exps = gammas.map(g => Math.exp(g / beta));
  const sum  = exps.reduce((a, b) => a + b, 0);

  const wSubs = sum === 0
    ? gammas.map(() => remaining / gammas.length)      // uniform fallback
    : exps.map(e => remaining * (e / sum));

  return { wSubs, beta };
}
