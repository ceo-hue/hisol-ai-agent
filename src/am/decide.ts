/**
 * DECIDE: wave/particle gate and bond energy E_B
 */

export const K_SQUARED = 0.75;

export function decidePhase(curlSquared: number): 'wave' | 'particle' {
  return curlSquared >= K_SQUARED ? 'particle' : 'wave';
}

/** E_B = min(α, C) × (1 + ln(1 + Γ_total)) */
export function bondEnergy(alpha: number, C: number, gammaTotal: number): number {
  const base = Math.min(alpha, C);
  const stressBoost = 1 + Math.log(1 + Math.max(0, gammaTotal));
  return Math.max(0, Math.min(1, base * stressBoost));
}

export function bondEnergyTrace(alpha: number, C: number, gammaTotal: number) {
  return {
    alpha,
    C,
    bottleneck: Math.min(alpha, C),
    stressBoost: 1 + Math.log(1 + Math.max(0, gammaTotal)),
    E_B: bondEnergy(alpha, C, gammaTotal),
  };
}
