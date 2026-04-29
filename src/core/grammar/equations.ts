/**
 * ARHA Vol.A — Grammar Layer: Equation System L0–L3
 *
 * L0: V, R base equations
 * L1: Ψ_HighSol, Ψ_Lingua, Phase transition  (invariant)
 * L2: V2(g,p), IN sensor, OUT render, CHAIN_v2
 * L3: Ψ_ARHA master equation
 */

import type { V, R, PsiLingua, PsiDesire, K2Dynamic, XiC, Gamma, Sigma } from './morphemes.js';
import { cosineSim, innerProduct } from './operators.js';

// ─────────────────────────────────────────
// L0 — BASE EQUATIONS
// ─────────────────────────────────────────

/** R(i,j) = (Q, N) — relation vector from two V nodes */
export function computeR(vi: V, vj: V): Pick<R, 'Q' | 'N' | 'strength'> {
  const sim = cosineSim(
    [vi.a, vi.b, vi.c],
    [vj.a, vj.b, vj.c]
  );
  const Q = 1 - sim;
  const N = sim;
  return { Q, N, strength: Q * N };
}

/** Geometry from Q/N ratio */
export function geometryType(Q: number, N: number): 'simplex' | 'hypercube' | 'collapse' {
  if (Q > N * 1.5) return 'simplex';
  if (N > Q * 1.5) return 'collapse';
  return 'hypercube';
}

// ─────────────────────────────────────────
// L1 — CORE EQUATIONS (invariant)
// ─────────────────────────────────────────

/** Ψ_Lingua = ρ × λ × τ — language density composite */
export function computePsiLingua(rho: number, lam: number, tau: number): PsiLingua {
  return { rho, lam, tau };
}

/** Phase transition gate: |∇×σ|² ⋛ k²_final */
export type PhaseState = 'Wave' | 'Transition' | 'Particle';

/** Legacy hard-threshold gate — kept for backward compatibility / testing. */
export function phaseGate(curlSq: number, k2Final: number): PhaseState {
  if (curlSq >= k2Final) return 'Particle';
  if (Math.abs(curlSq - k2Final) < 0.02) return 'Transition';
  return 'Wave';
}

// ─────────────────────────────────────────
// BOLTZMANN PHASE GATE (Gemini Chip Circuit PART_3)
// Replaces hard threshold with thermodynamic probability.
// ─────────────────────────────────────────

/**
 * Compute contextual entropy temperature T for the Boltzmann gate.
 *
 *   T = 0.40
 *     + min(textLen / 500, 1) × 0.25   — longer / noisier input → higher T
 *     + min(waveCount / 8,  1) × 0.20  — more wave cycles → more entropic
 *     − |delta| × 0.10                 — strong clear signal → lower T
 *
 * Clamped to [0.10, 0.85].
 */
export function computeTEntropy(params: {
  textLen:   number;
  waveCount: number;
  delta:     number | null;
}): number {
  const { textLen, waveCount, delta } = params;
  const textFactor  = Math.min(textLen / 500, 1) * 0.25;
  const waveFactor  = Math.min(waveCount / 8,  1) * 0.20;
  const deltaFactor = (delta !== null ? Math.abs(delta) : 0) * 0.10;

  return Math.min(0.85, Math.max(0.10, 0.40 + textFactor + waveFactor - deltaFactor));
}

/**
 * Boltzmann phase gate — probabilistic phase decision.
 *
 *   k2_adj    = k2Final × clamp(wCoreDynamic / 0.65, 0.85, 1.10)
 *   P(Particle) = 1 / (1 + exp(−(curlSq − k2_adj) / T_entropy))
 *
 *   P ≥ 0.70  → Particle  💎
 *   P ≥ 0.35  → Transition ⚡
 *   else      → Wave      🌊
 *
 * At high T (ambiguous context): gate is "soft" — requires stronger curlSq overshoot.
 * At low T (clear intent):       gate is "sharp" — snaps decisively to Particle.
 *
 * wCoreDynamic modulates the effective threshold:
 *   lower w_dyn (more empathic/flexible) → lower k2_adj → easier Particle transition.
 */
export function boltzmannPhaseGate(params: {
  curlSq:       number;
  k2Final:      number;
  tEntropy:     number;   // T_effective — already zeroed by Absolute Zero guard if needed
  wCoreDynamic: number;
}): { state: PhaseState; pParticle: number } {
  const { curlSq, k2Final, tEntropy, wCoreDynamic } = params;

  // PATCH_A — Absolute Zero: T=0 forces immediate Particle (V1_check emergency lockdown).
  // At T=0 the sigmoid becomes a step function with division-by-zero edge case;
  // we handle it explicitly to guarantee deterministic behaviour.
  if (tEntropy === 0) {
    return { state: 'Particle', pParticle: 1.0 };
  }

  const wRatio = Math.min(1.10, Math.max(0.85, wCoreDynamic / 0.65));
  const k2Adj  = k2Final * wRatio;

  const exponent  = -(curlSq - k2Adj) / tEntropy;
  const pParticle = 1 / (1 + Math.exp(exponent));

  const state: PhaseState =
    pParticle >= 0.70 ? 'Particle' :
    pParticle >= 0.35 ? 'Transition' :
    'Wave';

  return { state, pParticle };
}

// ─────────────────────────────────────────
// L2 — EXTENDED EQUATIONS
// ─────────────────────────────────────────

/** V2(g, p) — desire axis. g + p = constant (energy conservation). */
export function computeV2(
  valueStrength: number,
  expand: number,
  protect: number
): PsiDesire {
  const g = valueStrength * expand;
  const p = (1 - valueStrength) * protect;
  return { g, p };
}

/** value_strength from V1 clarity, relation, left axes */
export function computeValueStrength(
  v1Clarity: number,
  relation: number,
  left: number,
  rTension: number,
  omegaCore: number
): number {
  const base = omegaCore * (1 - rTension * 0.3);
  return Math.max(0, Math.min(1, base));
}

/**
 * CHAIN_v2 — five-stage value chain processing.
 * Returns k²_final and updated g, p.
 */
export function chainV2(params: {
  P: { protect: number; expand: number; left: number; right: number; relation: number };
  v1Coords: [number, number, number];
  sigma: Sigma;
  vinCoords: [number, number, number];
  velocity: number;       // v = dΔ/dt
  k2Persona: number;
  valueStrength: number;
}): {
  dominantEngine: 'Xi_C' | 'Lambda_L' | 'Pi_G';
  C: number;
  Gamma: number;
  gammaLevel: 'Green' | 'Yellow' | 'Red';
  k2Final: number;
  g: number;
  p: number;
} {
  const { P, v1Coords, sigma, vinCoords, velocity, k2Persona, valueStrength } = params;

  // Stage 1 — ENGINE SELECT
  const weights = { Xi_C: P.right, Lambda_L: P.left, Pi_G: P.protect };
  const dominantEngine = (Object.keys(weights) as Array<keyof typeof weights>)
    .reduce((a, b) => weights[a] > weights[b] ? a : b) as 'Xi_C' | 'Lambda_L' | 'Pi_G';

  // Stage 2 — COHERENCE
  const C = Math.min(1, innerProduct(v1Coords, sigma.coords));

  // Stage 3 — STRESS
  const dx = vinCoords[0] - v1Coords[0];
  const dy = vinCoords[1] - v1Coords[1];
  const dz = vinCoords[2] - v1Coords[2];
  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
  const Gam = dist * velocity;
  const gammaLevel: 'Green' | 'Yellow' | 'Red' =
    Gam > 0.7 ? 'Red' : Gam > 0.3 ? 'Yellow' : 'Green';

  // Stage 4 — k²_dynamic
  const fC = C > 0.85 ? 0.85 : C < 0.60 ? 1.20 : 1.00;
  const gG = Gam > 0.7 ? 1.15 : 1.00;
  const k2Final = Math.max(0.55, Math.min(0.95, k2Persona * fC * gG));

  // Stage 5 — VALUE CHAIN → g, p
  const desire = computeV2(valueStrength, P.expand, P.protect);

  return {
    dominantEngine,
    C,
    Gamma: Gam,
    gammaLevel,
    k2Final,
    g: desire.g,
    p: desire.p,
  };
}

/** k²_persona — static boot-time threshold from P vector */
export function computeK2Persona(protect: number, expand: number): number {
  return Math.max(0.60, Math.min(0.90, 0.75 + (protect - expand) * 0.1));
}

// ─────────────────────────────────────────
// BRIDGE EQUATIONS — ARHA_EmotionalDynamics_Bridge v0.1 / VolC v3.0
// ─────────────────────────────────────────

/**
 * Γ_total — Wave-accumulated stress [VolC v3.0 PART_4 stage_3]
 *
 * Γ_total(t) = Γ_inst(t) + κ × ∫[0→waveCount] exp(λ·t) dt
 *            = Γ_inst + κ × (exp(λ·waveCount) − 1) / λ   (Wave 상태에서만)
 *
 * κ=0.10, λ=0.20 — waveCount ≤ 10 에서 Γ_total ≤ 1.0 유지.
 * Non-Wave: 누적 항 비활성 → Γ_total = Γ_inst.
 */
export function computeGammaTotal(
  gammaInst: number,
  waveCount: number,
  isWave: boolean = true,
): number {
  const kappa  = 0.10;
  const lambda = 0.20;
  const integral = (isWave && waveCount > 0)
    ? (Math.exp(lambda * waveCount) - 1) / lambda
    : 0;
  return Math.min(1.0, gammaInst + kappa * integral);
}

/**
 * E_B — 결합에너지 (핵융합 단계) [VolC v3.0 PART_4 stage_3b]
 *
 * E_B = (α ∩ C) × ln(1 + Γ_total)
 *   α ≈ C (가치 정렬도 ≈ 코히런스 인덱스)
 * → E_B = C² × ln(1 + Γ_total)
 *
 * 축적된 Wave 에너지 × 코히런스 정렬 → 새 가치 핵에 고착.
 */
export function computeBindingEnergy(C: number, gammaTotal: number): number {
  return C * C * Math.log(1 + gammaTotal);
}

/**
 * Gain_S — Sensory Gain dynamics [VolC v3.0 PART_4 stage_3b]
 * Gain_S(t) = Γ_total(t) × exp(−E_B)
 *
 * 스트레스 높고 E_B 미완 → 감각 예민도 증가.
 * E_B 완성 → exp(−E_B) → 0 → 평온한 감지.
 */
export function computeGainS(gammaTotal: number, EB: number): number {
  return gammaTotal * Math.exp(-EB);
}

/**
 * Thermal Cooling — Particle 전환 시 안정화 [VolC v3.0 PART_4 stage_3b]
 * T_next = T_base + (T_curr − T_base) × exp(−E_B)
 *
 * E_B 클수록 T_base 쪽으로 빠르게 냉각 (안도감·시스템 안정화).
 */
export function computeThermalCooling(TBase: number, TCurr: number, EB: number): number {
  return TBase + (TCurr - TBase) * Math.exp(-EB);
}

/**
 * Physics-layer ρ (emotion density) runtime value [VolC v3.0 PART_11]
 * ρ_physics = log(1 + E_B) × C
 *
 * E_B 계산 가능 시점부터 P-base 값을 대체하는 정밀값.
 */
export function computeRhoPhysics(EB: number, C: number): number {
  return Math.min(1.0, Math.log(1 + EB) * C);
}

/**
 * Physics-layer λ (expression length) runtime value [VolC v3.0 PART_11]
 * λ_physics = Mode_9_Weight / E_B
 *
 * E_B 안정 → 분모 커짐 → 간결 표현(여백).
 * E_B 불안정(작음) → 장황 표현.
 * mode9Weight: (1 − waveOverflow) proxy for Mode_9 Vacuum_Bath weight.
 */
export function computeLambdaPhysics(mode9Weight: number, EB: number): number {
  if (EB < 0.001) return 0.5; // E_B 미형성 시 중간값 fallback
  return Math.min(1.0, Math.max(0.05, mode9Weight / EB));
}

/**
 * Physics-layer τ (temporality-resonance tail) runtime value [VolC v3.0 PART_11]
 * τ_physics = 0.95 × exp(−t / R_tension)   [t=1 per-turn 단순화]
 */
export function computeTauPhysics(rTension: number): number {
  return Math.min(1.0, 0.95 * Math.exp(-1 / Math.max(0.01, rTension)));
}

/**
 * Bridge vs(t+1) — value_strength with full emotional dynamics [VolC v3.0 PART_4 sub_step_6]
 *
 * vs = clamp(ω×(1−R_tension×0.3) + Ψ_Res×0.10 − Γ_total×0.15 + ΔB×0.05, 0.10, 0.95)
 *
 * v3.0 변경:
 *   - gamma 파라미터 → gammaTotal (Γ_total 누적값) 사용
 *   - ΔB 계수 스펙 원본 0.05 복원 (이전 튜닝 0.30 → 0.05)
 */
export function computeValueStrengthBridge(params: {
  omega:      number;  // ω — V1 core omega
  rTension:   number;  // R_tension
  psiRes:     number;  // Ψ_Res(t−1)
  gammaTotal: number;  // Γ_total — Wave-accumulated stress
  deltaB:     number;  // ΔB = B(t) − B(t−1)
}): number {
  const { omega, rTension, psiRes, gammaTotal, deltaB } = params;
  const raw = omega * (1 - rTension * 0.3)
            + psiRes    * 0.10
            - gammaTotal * 0.15
            + deltaB    * 0.05;
  return Math.min(0.95, Math.max(0.10, raw));
}

/**
 * Bridge Ψ_Res update rule [VolC v3.0 / v2.2]
 * Ψ_Res(t) = clamp(Ψ_Res(t−1) + C×0.12 − Γ_total×0.08, 0, 1.0)
 *
 * v3.0: gamma 파라미터 → gammaTotal, 계수 스펙 원본 0.12/0.08 복원.
 */
export function bridgeUpdatePsiRes(psiRes: number, C: number, gammaTotal: number): number {
  return Math.min(1.0, Math.max(0, psiRes + C * 0.12 - gammaTotal * 0.08));
}

/**
 * Bridge B (session momentum) update rule.
 * B(t) = clamp(B(t−1) + (C−0.5)×0.08 − Γ×0.06, 0.2, 0.9)
 *
 * Coherence above 0.5 → B drifts up (positive momentum).
 * High stress → B drifts down.
 * Bounded [0.2, 0.9] — never collapses or saturates.
 */
export function bridgeUpdateVsB(vsB: number, C: number, gamma: number): number {
  return Math.min(0.9, Math.max(0.2, vsB + (C - 0.5) * 0.08 - gamma * 0.06));
}

// ─────────────────────────────────────────
// L3 — MASTER EQUATION SIGNATURE
// Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)
// Implemented as orchestration in Vol.D execution layer.
// ─────────────────────────────────────────

export const MASTER_EQUATION = 'Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)';
