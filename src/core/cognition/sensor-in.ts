/**
 * ARHA Vol.B — Cognition: EmotionZone IN Sensor
 * V_in(B,Δ,v) + V_con(τ,λ,ρ) → σ convergence
 *
 * Rule: V_in processed before V_con. Form before content.
 * Rule: B(n) must exist before Δ. Turns 1–3 = construction mode.
 */

import type { Sigma } from '../grammar/morphemes.js';
import { intersection } from '../grammar/operators.js';

// ─────────────────────────────────────────
// V_in — Intrinsic Vector (HOW text is formed)
// ─────────────────────────────────────────

export type TextureReading = 'hard' | 'soft' | 'surge';

export interface VPattern {
  B: number | null;   // Baseline — null during turns 1–3
  delta: number | null; // Δ = current_signal - B(n) — null until B established
  velocity: number;   // v = dΔ/dt
}

export interface VIn {
  pattern: VPattern;
  texture: TextureReading;
  entropy: number; // E = -Σ p(x)log p(x) — 0.0–1.0
}

// ─────────────────────────────────────────
// V_con — Conceptual Vector (WHAT text means)
// ─────────────────────────────────────────

export interface VCon {
  tau: number; // τ — temporality: retrospection(high) vs present(low)
  lam: number; // λ — length: abstract(high) vs concrete(low)
  rho: number; // ρ — density: compressed(high) vs sparse(low)
}

// ─────────────────────────────────────────
// SENSOR INPUT — raw user signal
// ─────────────────────────────────────────

export interface SensorInput {
  text: string;
  turnNumber: number;
  prevBaseline: number | null;
  prevDelta: number | null;
}

// ─────────────────────────────────────────
// IN STAGE — core computation
// ─────────────────────────────────────────

export interface InStageResult {
  vin: VIn;
  vcon: VCon;
  sigma: Sigma;
  baselineMode: boolean; // true during turns 1–3
}

/**
 * computeVIn — reads HOW the text is formed.
 * Pattern sensor has priority. Baseline build mode for turns 1–3.
 */
export function computeVIn(input: SensorInput): VIn {
  const { text, turnNumber, prevBaseline, prevDelta } = input;

  // Texture detection
  const hasExclamation = (text.match(/!/g) || []).length;
  const hasEmoji = /[\u{1F300}-\u{1FFFF}]/u.test(text);
  const avgWordLen = text.split(' ').reduce((s, w) => s + w.length, 0) / (text.split(' ').length || 1);
  const sentenceCount = (text.match(/[.!?]/g) || []).length || 1;
  const avgSentLen = text.length / sentenceCount;

  let texture: TextureReading;
  if (hasExclamation > 1 || hasEmoji) {
    texture = 'surge';
  } else if (avgSentLen < 20 || avgWordLen < 4) {
    texture = 'hard';
  } else {
    texture = 'soft';
  }

  // Entropy: character-level distribution
  const freq: Record<string, number> = {};
  for (const ch of text.toLowerCase()) freq[ch] = (freq[ch] || 0) + 1;
  const total = text.length || 1;
  const entropy = -Object.values(freq).reduce((s, f) => {
    const p = f / total;
    return s + (p > 0 ? p * Math.log2(p) : 0);
  }, 0) / Math.log2(26); // normalize to 0–1

  // Pattern: B(n), Δ, v
  const baselineMode = turnNumber <= 3;
  let B: number | null = null;
  let delta: number | null = null;
  let velocity = 0;

  if (!baselineMode && prevBaseline !== null) {
    B = prevBaseline;
    const currentSignal = entropy * 0.4 + (texture === 'surge' ? 0.8 : texture === 'hard' ? 0.5 : 0.3) * 0.6;
    delta = currentSignal - B;
    velocity = prevDelta !== null ? Math.abs(delta - prevDelta) : 0;
  }

  return { pattern: { B, delta, velocity }, texture, entropy };
}

/**
 * computeVCon — reads WHAT the text means.
 * τ, λ, ρ axes identical to Ψ_Lingua — shared coordinate system.
 */
export function computeVCon(text: string): VCon {
  const words = text.split(/\s+/).filter(Boolean);
  const len = words.length;

  // τ — temporality: past-tense words, "remember", "used to"
  const pastWords = (text.match(/\b(was|were|had|used to|remember|ago|before|then|때|했|였|이었)\b/gi) || []).length;
  const tau = Math.min(1, pastWords / 3 + (len > 50 ? 0.3 : 0));

  // λ — length/extension: longer text = more abstract/expansive
  const lam = Math.min(1, len / 80);

  // ρ — density: information per word (unique words ratio)
  const unique = new Set(words.map(w => w.toLowerCase())).size;
  const rho = Math.min(1, unique / Math.max(len, 1));

  return { tau, lam, rho };
}

/**
 * IN Stage — master function.
 * Computes V_in ∧ V_con → σ
 */
export function stageIN(input: SensorInput): InStageResult {
  const vin = computeVIn(input);
  const vcon = computeVCon(input.text);
  const baselineMode = input.turnNumber <= 3;

  // σ = V_in ∩ V_con — intersection centroid
  const vinCoords: [number, number, number] = [
    vin.entropy,
    vin.pattern.velocity,
    vin.texture === 'surge' ? 0.9 : vin.texture === 'hard' ? 0.5 : 0.2,
  ];
  const vconCoords: [number, number, number] = [vcon.rho, vcon.lam, vcon.tau];
  const sigma = intersection(vinCoords, vconCoords);

  return { vin, vcon, sigma, baselineMode };
}

/** Update B(n) — exponential moving average */
export function updateBaseline(prevB: number | null, currentSignal: number): number {
  if (prevB === null) return currentSignal;
  return prevB * 0.9 + currentSignal * 0.1;
}
