/**
 * φ mapping: basis wave B = (ε, δ, I) → existence vector V = (a, b, c)
 */
import { BasisWave, VVector } from './types.js';

export function phiMapping(B: BasisWave): VVector {
  const E = (B.epsilon + 1) / 2;
  const D = (B.delta + 1) / 2;
  const I = Math.max(0, Math.min(1, B.I));

  const a = Math.max(0.3, E * I * 0.7 + 0.3);
  const b = I * (E * 0.8 + 0.2);
  const c = I * (0.5 + Math.abs(E - D) * 0.5);

  return { a, b, c };
}

export function isVValid(V: VVector): boolean {
  return V.a > 0.3 && V.b > 0 && V.c > 0;
}

/** R strength = Q × N (peaks when both distinct and connected) */
export function relationStrength(Vi: VVector, Vj: VVector): { Q: number; N: number; strength: number } {
  const dot = Vi.a*Vj.a + Vi.b*Vj.b + Vi.c*Vj.c;
  const ni = Math.sqrt(Vi.a**2 + Vi.b**2 + Vi.c**2);
  const nj = Math.sqrt(Vj.a**2 + Vj.b**2 + Vj.c**2);
  const cosSim = ni > 0 && nj > 0 ? dot / (ni * nj) : 0;
  const N = Math.max(0, Math.min(1, cosSim));
  const Q = 1 - N;
  return { Q, N, strength: Q * N };
}
