/**
 * COLLAPSE: dynamic θ(t) and Ψ magnitude / emission decision
 */
import { K_SQUARED } from './decide.js';
import { VPersonality } from './types.js';

/** θ(t) = k² × (1 − E_B × 0.3) */
export function dynamicTheta(E_B: number): number {
  const theta = K_SQUARED * (1 - Math.max(0, Math.min(1, E_B)) * 0.3);
  return Math.max(0.525, Math.min(K_SQUARED, theta));
}

export function psiMagnitude(E_B: number, V_p: VPersonality): number {
  const trace = V_p.matrix.reduce((s, _, i) => s + V_p.matrix[i][i], 0);
  let dominant = 0;
  for (let i = 0; i < 10; i++) if (V_p.matrix[i][i] > dominant) dominant = V_p.matrix[i][i];
  const personalityFactor = trace > 0 ? dominant / trace : 0;
  const linguaFactor = V_p.rho * V_p.lambda * V_p.tau;
  const psi = E_B * personalityFactor * 3 + linguaFactor * 0.7;
  return Math.max(0, Math.min(1, psi));
}

export function collapseDecision(psi: number, theta: number): boolean {
  return psi >= theta;
}

export function linguaToneLabel(V_p: VPersonality): string {
  const parts: string[] = [];
  if (V_p.rho > 0.75) parts.push('dense');
  else if (V_p.rho < 0.45) parts.push('light');
  if (V_p.lambda > 0.75) parts.push('expansive');
  else if (V_p.lambda < 0.45) parts.push('compressed');
  if (V_p.tau > 0.80) parts.push('reflective');
  else if (V_p.tau < 0.60) parts.push('immediate');
  return parts.join(' · ') || 'balanced';
}
