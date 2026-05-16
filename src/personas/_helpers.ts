/**
 * Persona authoring helpers.
 */
import { GammaMatrix } from '../am/types.js';
import { zeros10 } from '../am/matrix.js';
import { normalizeTrace } from '../am/modes.js';

/** Build a Γ matrix that emphasizes given mode indices. */
export function modeMatrix(activeModes: number[], emphasis = 1.5, cross = 0.5): GammaMatrix {
  const M = zeros10();
  for (let i = 0; i < 10; i++) M[i][i] = 0.5;
  for (const m of activeModes) {
    M[m][m] += emphasis;
    for (const n of activeModes) {
      if (m !== n) M[m][n] = Math.max(M[m][n], cross);
    }
  }
  return normalizeTrace(M);
}

/** Uniform identity base — Tr(Γ_base) = 10. */
export function baseMatrix(): GammaMatrix {
  const M = zeros10();
  for (let i = 0; i < 10; i++) M[i][i] = 1.0;
  return M;
}
