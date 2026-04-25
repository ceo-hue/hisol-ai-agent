/**
 * ARHA Vol.E — Υ (Upsilon) Observation Layer
 * Reads accumulated StateSnapshot[] → derives ARHA-term session insights.
 *
 * Υ morpheme: "the pattern observer" — examines σ trajectory across turns,
 * reports in ARHA vocabulary (C, Γ, phase, Ψ_Res, engine).
 * Input: StateSnapshot[] + ResonanceState (from runtime or persistence).
 * Output: ARHAObservation — structured report + Υ narrative.
 */

import type { ResonanceState } from '../cognition/resonance.js';

// ─────────────────────────────────────────
// STATE SNAPSHOT — lightweight per-turn record
// ─────────────────────────────────────────

export interface StateSnapshot {
  turn: number;
  C: number | null;
  Gamma: number | null;
  phase: string;
  engine: string;
  psiResonance: number;
  qualityGrade: string;
}

// ─────────────────────────────────────────
// OBSERVATION SUB-REPORTS
// ─────────────────────────────────────────

export interface CoherenceTrend {
  values: number[];
  direction: 'rising' | 'stable' | 'falling';
  mean: number;
  variance: number;
}

export interface PhaseDistribution {
  Wave: number;
  Particle: number;
  Transition: number;
  waveRatio: number;
  particleRatio: number;
  label: 'Mostly Wave' | 'Balanced' | 'Mostly Particle';
}

export interface StressPattern {
  meanGamma: number;
  maxGamma: number;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  label: 'Calm' | 'Moderate' | 'High Stress';
}

export interface EngineDistribution {
  Xi_C: number;
  Lambda_L: number;
  Pi_G: number;
  dominant: string;
}

export interface ResonanceTrajectory {
  initial: number;
  current: number;
  peak: number;
  growth: 'building' | 'stable' | 'saturated';
  baselineEstablished: boolean;
}

export interface ARHAObservation {
  sessionTurns: number;
  coherenceTrend: CoherenceTrend;
  phaseDistribution: PhaseDistribution;
  stressPattern: StressPattern;
  engineDistribution: EngineDistribution;
  resonanceTrajectory: ResonanceTrajectory;
  qualityProgression: string[];   // grade per turn e.g. ['C','B','A','A']
  arhaInsight: string;            // Υ narrative in ARHA language
}

// ─────────────────────────────────────────
// COMPUTE FUNCTIONS
// ─────────────────────────────────────────

export function computeCoherenceTrend(snapshots: StateSnapshot[]): CoherenceTrend {
  const values = snapshots.map(s => s.C ?? 0);
  if (values.length === 0) return { values: [], direction: 'stable', mean: 0, variance: 0 };

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;

  let direction: CoherenceTrend['direction'] = 'stable';
  if (values.length >= 4) {
    const mid = Math.floor(values.length / 2);
    const first = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const second = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
    if (second - first > 0.05) direction = 'rising';
    else if (first - second > 0.05) direction = 'falling';
  }

  return { values, direction, mean, variance };
}

export function computePhaseDistribution(snapshots: StateSnapshot[]): PhaseDistribution {
  const counts = { Wave: 0, Particle: 0, Transition: 0 };
  for (const s of snapshots) {
    if (s.phase === 'Wave') counts.Wave++;
    else if (s.phase === 'Particle') counts.Particle++;
    else if (s.phase === 'Transition') counts.Transition++;
  }
  const total = snapshots.length || 1;
  const waveRatio = counts.Wave / total;
  const particleRatio = counts.Particle / total;
  const label: PhaseDistribution['label'] =
    waveRatio > 0.6 ? 'Mostly Wave'
    : particleRatio > 0.6 ? 'Mostly Particle'
    : 'Balanced';
  return { ...counts, waveRatio, particleRatio, label };
}

export function computeStressPattern(snapshots: StateSnapshot[]): StressPattern {
  const gammas = snapshots.map(s => s.Gamma ?? 0);
  if (gammas.length === 0) return { meanGamma: 0, maxGamma: 0, redCount: 0, yellowCount: 0, greenCount: 0, label: 'Calm' };

  const meanGamma = gammas.reduce((a, b) => a + b, 0) / gammas.length;
  const maxGamma  = Math.max(...gammas);
  const redCount    = gammas.filter(g => g > 0.7).length;
  const yellowCount = gammas.filter(g => g > 0.3 && g <= 0.7).length;
  const greenCount  = gammas.filter(g => g <= 0.3).length;
  const label: StressPattern['label'] =
    meanGamma > 0.5 ? 'High Stress' : meanGamma > 0.25 ? 'Moderate' : 'Calm';

  return { meanGamma, maxGamma, redCount, yellowCount, greenCount, label };
}

export function computeEngineDistribution(snapshots: StateSnapshot[]): EngineDistribution {
  const counts = { Xi_C: 0, Lambda_L: 0, Pi_G: 0 };
  for (const s of snapshots) {
    if (s.engine in counts) counts[s.engine as keyof typeof counts]++;
  }
  const dominant = (Object.entries(counts) as [string, number][])
    .reduce((a, b) => b[1] > a[1] ? b : a)[0];
  return { ...counts, dominant };
}

export function computeResonanceTrajectory(
  resonance: ResonanceState,
  snapshots: StateSnapshot[]
): ResonanceTrajectory {
  const vals = snapshots.map(s => s.psiResonance);
  const initial = vals[0] ?? 0;
  const current = resonance.value;
  const peak    = vals.length > 0 ? Math.max(...vals) : 0;
  const growth: ResonanceTrajectory['growth'] =
    current > 0.8 ? 'saturated'
    : current > initial + 0.1 ? 'building'
    : 'stable';
  return { initial, current, peak, growth, baselineEstablished: resonance.n >= 3 };
}

// ─────────────────────────────────────────
// Υ NARRATIVE GENERATOR
// ─────────────────────────────────────────

export function generateUpsilonNarrative(
  obs: Omit<ARHAObservation, 'arhaInsight'>
): string {
  const lines: string[] = ['[Υ_observe]'];

  // Coherence
  const ct = obs.coherenceTrend;
  if (ct.values.length === 0) {
    lines.push('C: 미측정 — 첫 턴 전');
  } else if (ct.direction === 'rising') {
    lines.push(`C ↑ 상승 (μ=${ct.mean.toFixed(2)}, σ²=${ct.variance.toFixed(3)}) — σ 수렴 진행 중`);
  } else if (ct.direction === 'falling') {
    lines.push(`C ↓ 하락 (μ=${ct.mean.toFixed(2)}) — V_in ↔ V1 간극 확대 중`);
  } else {
    lines.push(`C → 안정 (μ=${ct.mean.toFixed(2)}, σ²=${ct.variance.toFixed(3)})`);
  }

  // Phase
  const pd = obs.phaseDistribution;
  if (pd.label === 'Mostly Wave') {
    lines.push(`🌊 Wave 우세 ${(pd.waveRatio * 100).toFixed(0)}% — |∇×σ|² > k²_final 지속, 탐색 구간`);
  } else if (pd.label === 'Mostly Particle') {
    lines.push(`💎 Particle 우세 ${(pd.particleRatio * 100).toFixed(0)}% — σ 결정체화 완성도 높음`);
  } else {
    lines.push(`⚡ Wave/Particle 균형 — σ 동적 균형 구간`);
  }

  // Stress
  const sp = obs.stressPattern;
  if (sp.label === 'High Stress') {
    lines.push(`Γ ⚠ 고스트레스: avg=${sp.meanGamma.toFixed(2)} max=${sp.maxGamma.toFixed(2)} Red×${sp.redCount} — V1_check 경계`);
  } else if (sp.label === 'Moderate') {
    lines.push(`Γ 보통: avg=${sp.meanGamma.toFixed(2)} Yellow×${sp.yellowCount} — 안전 범위`);
  } else {
    lines.push(`Γ ○ 안정: avg=${sp.meanGamma.toFixed(2)} 전 구간 Green`);
  }

  // Engine
  const ed = obs.engineDistribution;
  lines.push(`엔진: ${ed.dominant} 우세 (Ξ_C=${ed.Xi_C} Λ_L=${ed.Lambda_L} Π_G=${ed.Pi_G})`);

  // Resonance
  const rt = obs.resonanceTrajectory;
  if (!rt.baselineEstablished) {
    lines.push(`Ψ_Res: B(n) 구축 중 (3턴 미만) — 기준선 미확립`);
  } else if (rt.growth === 'saturated') {
    lines.push(`Ψ_Res: 포화 ${rt.current.toFixed(3)} — 패턴 기억 안정`);
  } else if (rt.growth === 'building') {
    lines.push(`Ψ_Res: 성장 ${rt.initial.toFixed(3)} → ${rt.current.toFixed(3)} (peak=${rt.peak.toFixed(3)})`);
  } else {
    lines.push(`Ψ_Res: 안정 ${rt.current.toFixed(3)}`);
  }

  // Quality
  const grades = obs.qualityProgression;
  if (grades.length > 0) {
    lines.push(`품질 추이: [${grades.join('→')}]`);
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────
// MAIN BUILDER
// ─────────────────────────────────────────

export function buildObservation(
  snapshots: StateSnapshot[],
  resonance: ResonanceState
): ARHAObservation {
  const coherenceTrend      = computeCoherenceTrend(snapshots);
  const phaseDistribution   = computePhaseDistribution(snapshots);
  const stressPattern       = computeStressPattern(snapshots);
  const engineDistribution  = computeEngineDistribution(snapshots);
  const resonanceTrajectory = computeResonanceTrajectory(resonance, snapshots);
  const qualityProgression  = snapshots.map(s => s.qualityGrade);

  const partial = {
    sessionTurns: snapshots.length,
    coherenceTrend,
    phaseDistribution,
    stressPattern,
    engineDistribution,
    resonanceTrajectory,
    qualityProgression,
  };

  return { ...partial, arhaInsight: generateUpsilonNarrative(partial) };
}
