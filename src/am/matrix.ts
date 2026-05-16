/**
 * Γ matrix system: build, Hadamard interference, kyeol extraction.
 */
import { GammaMatrix, SigmaVector, KyeolRegion, ValueChain } from './types.js';
import { normalizeTrace } from './modes.js';

export function zeros10(): GammaMatrix {
  return Array.from({ length: 10 }, () => new Array(10).fill(0));
}

export function outerProduct(sigma: SigmaVector): GammaMatrix {
  const M = zeros10();
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++)
      M[i][j] = sigma[i] * sigma[j];
  return M;
}

/** Γ_other = σσᵀ + value-chain interpretation */
export function buildGammaOther(sigma: SigmaVector, valueChain: ValueChain): GammaMatrix {
  let M = outerProduct(sigma);

  for (const key of Object.keys(valueChain)) {
    const v = valueChain[key];
    const w = v.weight;
    for (const m of v.rules.active_modes) {
      M[m][m] = Math.min(2.0, M[m][m] + w * 0.3);
      for (const n of v.rules.active_modes) {
        if (m !== n) M[m][n] = Math.min(1.5, M[m][n] + w * 0.15);
      }
    }
  }

  // Enforce symmetry
  for (let i = 0; i < 10; i++) {
    for (let j = i + 1; j < 10; j++) {
      const avg = (M[i][j] + M[j][i]) / 2;
      M[i][j] = avg;
      M[j][i] = avg;
    }
  }

  return normalizeTrace(M);
}

/** Γ_identity = Γ_base + Σ w_i × Γ_i (locked after persona boot) */
export function buildGammaIdentity(
  base: GammaMatrix,
  parts: Array<{ weight: number; gamma: GammaMatrix }>,
): GammaMatrix {
  const result = base.map(row => [...row]);
  for (const p of parts)
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        result[i][j] += p.weight * p.gamma[i][j];
  return normalizeTrace(result);
}

/** Hadamard product — element-wise multiply */
export function hadamard(A: GammaMatrix, B: GammaMatrix): GammaMatrix {
  const M = zeros10();
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++)
      M[i][j] = A[i][j] * B[i][j];
  return M;
}

/** Ω = {(i,j) | Γ_interfere > θ_kyeol} */
export function extractKyeol(gammaInterfere: GammaMatrix, thetaKyeol = 0.15): KyeolRegion {
  const cells: Array<{ i: number; j: number; value: number }> = [];
  let maxVal = -Infinity;
  let anchorI = 0;

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const v = gammaInterfere[i][j];
      if (v > thetaKyeol) cells.push({ i, j, value: v });
      if (v > maxVal) { maxVal = v; anchorI = i; }
    }
  }

  return {
    cells,
    anchorMode: anchorI,
    anchorIntensity: Math.max(0, Math.min(1, maxVal)),
  };
}

export function coherenceIndex(gammaInterfere: GammaMatrix, kyeol: KyeolRegion): number {
  if (kyeol.cells.length === 0) return 0;
  const sum = kyeol.cells.reduce((s, c) => s + c.value, 0);
  return Math.max(0, Math.min(1, sum / kyeol.cells.length));
}

export function matrixMean(M: GammaMatrix): number {
  let s = 0;
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) s += M[i][j];
  return s / 100;
}

export function flattenMatrix(M: GammaMatrix): number[] {
  return M.flat();
}
