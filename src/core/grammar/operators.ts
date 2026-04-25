/**
 * ARHA Vol.A — Grammar Layer: L4 Operators
 * Composition connectors — rules for combining morphemes.
 */

import type { V, R, Sigma } from './morphemes.js';

// ─────────────────────────────────────────
// OPERATOR IMPLEMENTATIONS
// ─────────────────────────────────────────

/** → sequence: A completes before B. Returns pipeline runner. */
export function sequence<T>(stages: Array<(input: T) => T>): (input: T) => T {
  return (input: T) => stages.reduce((acc, fn) => fn(acc), input);
}

/** ∩ intersection: Returns common region — σ = V_in ∩ V_con. */
export function intersection(
  vin: [number, number, number],
  vcon: [number, number, number]
): Sigma {
  const coords: [number, number, number] = [
    (vin[0] + vcon[0]) / 2,
    (vin[1] + vcon[1]) / 2,
    (vin[2] + vcon[2]) / 2,
  ];
  return { coords, source: 'V_in_x_V_con' };
}

/** ⊳ hierarchy: upper conditions lower. Returns scoped value. */
export function hierarchy<T>(upper: boolean, lower: T): T | null {
  return upper ? lower : null;
}

/** ∇ gradient: computes gravity field magnitude of an anchor. */
export function gradient(anchor: V, target: [number, number, number]): number {
  const dx = anchor.a - target[0];
  const dy = anchor.b - target[1];
  const dz = anchor.c - target[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** ↑ promote: R promoted to V when strength exceeds threshold. */
export function promote(r: R, threshold = 0.25): V | null {
  const strength = r.Q * r.N;
  if (strength <= threshold) return null;
  return {
    a: strength,
    b: (r.Q + r.N) / 2,
    c: r.N,
    label: `R_promoted(${r.from}→${r.to})`,
  };
}

/** + merge: additive combination of two numeric states. */
export function merge(a: number, b: number): number {
  return a + b;
}

/** × amplify: multiplicative amplification. */
export function amplify(a: number, b: number): number {
  return a * b;
}

/** ⊕ context_merge: fusion of two state objects. */
export function contextMerge<T extends object>(a: T, b: Partial<T>): T {
  return { ...a, ...b };
}

// ─────────────────────────────────────────
// |∇×σ|² — CURL-SQUARED: Signal Tension
// ANALYZE stage core computation.
// ─────────────────────────────────────────

/**
 * Computes signal tension intensity from σ coordinates.
 * Approximates curl-squared as variance across coordinate dimensions.
 * Higher value = more converged / more tension.
 */
export function curlSquared(sigma: Sigma, prevSigma?: Sigma): number {
  if (!prevSigma) {
    const [x, y, z] = sigma.coords;
    return (x * x + y * y + z * z) / 3;
  }
  const [x1, y1, z1] = sigma.coords;
  const [x0, y0, z0] = prevSigma.coords;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dz = z1 - z0;
  return (dx * dx + dy * dy + dz * dz);
}

/** cosine similarity between two 3D vectors */
export function cosineSim(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const magA = Math.sqrt(a[0]**2 + a[1]**2 + a[2]**2);
  const magB = Math.sqrt(b[0]**2 + b[1]**2 + b[2]**2);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/** Inner product magnitude — for coherence: C = |⟨V1 | σ⟩| */
export function innerProduct(
  v1: [number, number, number],
  sigma: [number, number, number]
): number {
  return Math.abs(v1[0]*sigma[0] + v1[1]*sigma[1] + v1[2]*sigma[2]);
}
