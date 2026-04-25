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

export function phaseGate(curlSq: number, k2Final: number): PhaseState {
  if (curlSq >= k2Final) return 'Particle';
  if (Math.abs(curlSq - k2Final) < 0.02) return 'Transition';
  return 'Wave';
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
// L3 — MASTER EQUATION SIGNATURE
// Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)
// Implemented as orchestration in Vol.D execution layer.
// ─────────────────────────────────────────

export const MASTER_EQUATION = 'Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)';
