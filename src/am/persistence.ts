/**
 * Persistence: stress, decay, resonance, baseline, tone adaptation
 */
import { Persona } from './types.js';

export function computeGammaStress(persona: Persona, conflictHints = 0): number {
  const keys = Object.keys(persona.valueChain);
  let stress = 0;

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = persona.valueChain[keys[i]];
      const b = persona.valueChain[keys[j]];

      const setA = new Set(a.rules.active_modes);
      const setB = new Set(b.rules.active_modes);
      const overlap = [...setA].filter(m => setB.has(m)).length;
      const union = new Set([...setA, ...setB]).size || 1;
      const distance = 1 - overlap / union;

      stress += distance * a.weight * b.weight;
    }
  }

  return Math.max(0, Math.min(1, stress + conflictHints * 0.1));
}

/** Γ_total(t) = Γ_stress × exp(−k·t) */
export function decayGammaTotal(prev: number, elapsedTurns: number, k = 0.15): number {
  return prev * Math.exp(-k * Math.max(0, elapsedTurns));
}

export function stressLevel(gammaTotal: number): 'green' | 'yellow' | 'red' {
  if (gammaTotal <= 0.3) return 'green';
  if (gammaTotal <= 0.7) return 'yellow';
  return 'red';
}

export function updateResonance(prev: number, current: number, alpha = 0.25): number {
  return alpha * current + (1 - alpha) * prev;
}

export function updateBaseline(prev: number, currentSignal: number, turn: number): number {
  const learningRate = 1 / (turn + 1);
  return prev + learningRate * (currentSignal - prev);
}

export function adaptTone(
  current: number,
  userTone: number,
  k = 0.12,
  allowedMin = 0.3,
  allowedMax = 0.95,
): number {
  const next = current + k * (userTone - current);
  return Math.max(allowedMin, Math.min(allowedMax, next));
}
