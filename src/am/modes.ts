/**
 * Mode feature vectors and σ activation
 *   σ_n = max(0, f_n · s) / ‖f_n‖
 */
import { SignalVector, SigmaVector } from './types.js';

// f_n = (f_Δ, f_v, f_T, f_E) per mode
export const MODE_FEATURES: Array<[number, number, number, number]> = [
  [+1, +1, +1, -1],  // 0 passion
  [-1, -1,  0, -1],  // 1 warmth
  [+1, +1, -1, -1],  // 2 resolve
  [-1, -1, -1, -1],  // 3 shrink
  [+1,  0, +1,  0],  // 4 vitality
  [+1, -1, -1,  0],  // 5 protect
  [-1, -1,  0,  0],  // 6 withdraw
  [+1, +1, -1, +1],  // 7 conflict
  [+1, +1,  0, +1],  // 8 extreme
  [-1, -1, +1, -1],  // 9 empathy
];

export function activateModes(s: SignalVector): SigmaVector {
  const sArr = [s.s_delta, s.s_v, s.s_T, s.s_E];
  const raw = MODE_FEATURES.map(f => {
    const dot = f[0]*sArr[0] + f[1]*sArr[1] + f[2]*sArr[2] + f[3]*sArr[3];
    const norm = Math.sqrt(f[0]**2 + f[1]**2 + f[2]**2 + f[3]**2);
    return norm > 0 ? Math.max(0, dot) / norm : 0;
  });

  // Scale so Σσ_n² ≈ 10 (Tr(Γ) = 10 invariant)
  const sumSq = raw.reduce((a, v) => a + v*v, 0);
  if (sumSq < 1e-9) return raw.map(() => 1.0);
  const scale = Math.sqrt(10 / sumSq);
  return raw.map(v => v * scale);
}

export function normalizeTrace(M: number[][]): number[][] {
  const trace = M.reduce((s, _, i) => s + M[i][i], 0);
  if (trace < 1e-9) return M;
  const scale = 10 / trace;
  return M.map(row => row.map(v => v * scale));
}
