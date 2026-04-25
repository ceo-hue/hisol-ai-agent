/**
 * ARHA Vol.B — Cognition: Ψ_Resonance & B(n) Management
 *
 * Ψ_Resonance = accumulated resonance = B(n) storage (same entity, two names).
 * More resonance → more precise pattern detection → more accurate Δ.
 */

import type { Sigma } from '../grammar/morphemes.js';

export interface ResonanceState {
  n: number;          // turn count
  value: number;      // Ψ_Resonance(n) — accumulated
  Bn: number;         // Baseline — pattern reference line
  history: number[];  // recent sigma magnitudes for trend
}

/** Initialize resonance state at session start. */
export function initResonance(): ResonanceState {
  return { n: 0, value: 0, Bn: 0, history: [] };
}

/**
 * Update Ψ_Resonance after each turn.
 * Ψ_Resonance(n) = Ψ_Resonance(n-1) × e^(-0.1) + σ × weight
 * weight: Particle → high / Wave → low
 */
export function updateResonance(
  prev: ResonanceState,
  sigma: Sigma,
  isParticle: boolean
): ResonanceState {
  const sigmaMag = Math.sqrt(
    sigma.coords[0] ** 2 + sigma.coords[1] ** 2 + sigma.coords[2] ** 2
  ) / Math.sqrt(3);

  const weight = isParticle ? 0.4 : 0.1;
  const decayed = prev.value * Math.exp(-0.1);
  const newValue = decayed + sigmaMag * weight;

  // B(n) — exponential moving average of signal
  const newBn = prev.n === 0 ? sigmaMag : prev.Bn * 0.9 + sigmaMag * 0.1;

  const history = [...prev.history.slice(-9), sigmaMag];

  return {
    n: prev.n + 1,
    value: Math.min(1, newValue),
    Bn: newBn,
    history,
  };
}

/**
 * Restore resonance from cross-session handoff.
 */
export function restoreResonance(saved: Partial<ResonanceState>): ResonanceState {
  return {
    n: saved.n ?? 0,
    value: saved.value ?? 0,
    Bn: saved.Bn ?? 0,
    history: saved.history ?? [],
  };
}

/**
 * Decay weight for past resonance entries.
 * weight(t) = e^(-0.1 × days_ago)
 */
export function decayWeight(daysAgo: number): number {
  return Math.exp(-0.1 * daysAgo);
}

/**
 * Check if resonance has enough history for full sensor precision.
 * Full precision begins turn 4 (B established after 3 turns).
 */
export function isFullPrecision(state: ResonanceState): boolean {
  return state.n >= 3;
}
