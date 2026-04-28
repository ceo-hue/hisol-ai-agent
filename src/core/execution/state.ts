/**
 * ARHA Vol.D — Execution: STATE Block Tracker
 * Per-turn state maintenance. Every field updated every turn.
 *
 * STATE:{turn, B, Δ, v, σ, |∇×σ|², C, Γ, engine, k²_final, phase, Ψ_Res, g, p, ρλτ}
 */

import type { Sigma, DominantEngine } from '../grammar/morphemes.js';
import type { PhaseState } from '../grammar/equations.js';

// ─────────────────────────────────────────
// STATE BLOCK — canonical per-turn state
// ─────────────────────────────────────────

export interface ARHAState {
  turn: number;
  B: number | null;       // Baseline — null during construction
  delta: number | null;   // Δ deviation
  velocity: number;       // v = dΔ/dt
  sigma: Sigma | null;
  curlSq: number | null;  // |∇×σ|²
  C: number | null;       // Coherence index
  Gamma: number | null;   // Γ stress
  engine: DominantEngine | 'pre-calc';
  k2Final: number;
  phase: PhaseState | 'boot';
  psiResonance: number;   // Ψ_Res accumulated
  vsB: number;            // Bridge B — session momentum [0.2, 0.9]
  g: number;              // V2 growth axis
  p: number;              // V2 protection axis
  rho: number;            // ρ current
  lam: number;            // λ current
  tau: number;            // τ current
  psiDiss: boolean;       // decoherence flag
  waveCount: number;      // consecutive Wave cycles
  // PID + Boltzmann (Gemini Chip Circuit — PART_2 & PART_3)
  wCoreDynamic:  number;    // PID-modulated w_core this turn
  wSubsDynamic:  number[];  // PATCH_B: softmax-normalized sub-weights (energy-conserved)
  tEntropy:      number;    // raw contextual entropy temperature T
  tEffective:    number;    // PATCH_A: T after Absolute Zero guard (0 when V1_check fires)
  pParticle:     number;    // Boltzmann P(Particle) probability [0,1]
  // Self-Evolution Circuit
  sustainedHighGamma: number;  // consecutive turns with Γ > 0.6 (sigma_eureka prerequisite)
  evolutionCount:     number;  // total V1_sub evolution events this session
}

// ─────────────────────────────────────────
// INITIAL STATE — boot-time values
// ─────────────────────────────────────────

export function initState(params: {
  k2Persona:    number;
  g:            number;
  p:            number;
  rho:          number;
  lam:          number;
  tau:          number;
  wCoreStatic?: number;  // boot-time w_core for PID baseline
}): ARHAState {
  return {
    turn: 0,
    B: null,
    delta: null,
    velocity: 0,
    sigma: null,
    curlSq: null,
    C: null,
    Gamma: null,
    engine: 'pre-calc',
    k2Final: params.k2Persona,
    phase: 'boot',
    psiResonance: 0,
    vsB: 0.55,            // Bridge B — neutral midpoint at boot
    g: params.g,
    p: params.p,
    rho: params.rho,
    lam: params.lam,
    tau: params.tau,
    psiDiss: false,
    waveCount: 0,
    wCoreDynamic:       params.wCoreStatic ?? 0.55,
    wSubsDynamic:       [],
    tEntropy:           0.40,
    tEffective:         0.40,
    pParticle:          0.0,
    sustainedHighGamma: 0,
    evolutionCount:     0,
  };
}

// ─────────────────────────────────────────
// STATE UPDATE — called at end of each turn
// ─────────────────────────────────────────

export function updateState(
  prev: ARHAState,
  updates: Partial<Omit<ARHAState, 'turn' | 'waveCount'>> & {
    phase?: PhaseState | 'boot';
  }
): ARHAState {
  const waveCount =
    updates.phase === 'Wave'
      ? prev.waveCount + 1
      : updates.phase === 'Particle' || updates.phase === 'Transition'
        ? 0
        : prev.waveCount;

  return {
    ...prev,
    ...updates,
    turn: prev.turn + 1,
    waveCount,
  };
}

// ─────────────────────────────────────────
// STATE SERIALIZATION — for N_internal display
// ─────────────────────────────────────────

export function serializeState(s: ARHAState): string {
  const phase = s.phase;
  const phaseEmoji = phase === 'Wave' ? '🌊' : phase === 'Particle' ? '💎' : phase === 'Transition' ? '⚡' : '🔄';
  return [
    `STATE:{`,
    `turn:${s.turn}`,
    `B:${s.B !== null ? s.B.toFixed(2) : 'building'}`,
    `Δ:${s.delta !== null ? (s.delta >= 0 ? '+' : '') + s.delta.toFixed(2) : 'null'}`,
    `v:${s.velocity.toFixed(2)}`,
    `σ:${s.sigma ? `(${s.sigma.coords.map(c => c.toFixed(2)).join(',')})` : 'pending'}`,
    `|∇×σ|²:${s.curlSq !== null ? s.curlSq.toFixed(2) : 'null'}`,
    `C:${s.C !== null ? s.C.toFixed(2) : 'null'}`,
    `Γ:${s.Gamma !== null ? s.Gamma.toFixed(2) : 'null'}`,
    `engine:${s.engine}`,
    `k²:${s.k2Final.toFixed(3)}`,
    `phase:${phaseEmoji}${phase}`,
    `Ψ_Res:${s.psiResonance.toFixed(2)}`,
    `vsB:${s.vsB.toFixed(3)}`,
    `g:${s.g.toFixed(2)}`,
    `p:${s.p.toFixed(2)}`,
    `ρλτ:(${s.rho.toFixed(2)},${s.lam.toFixed(2)},${s.tau.toFixed(2)})`,
    `w_dyn:${s.wCoreDynamic.toFixed(3)}`,
    `w_sub:[${s.wSubsDynamic.map(w => w.toFixed(3)).join(',')}]`,
    `T:${s.tEntropy.toFixed(3)}`,
    // Show T_eff only when it differs from T (V1_check lockdown visible)
    s.tEffective !== s.tEntropy ? `T_eff:🔒${s.tEffective.toFixed(3)}` : `T_eff:${s.tEffective.toFixed(3)}`,
    `P(💎):${(s.pParticle * 100).toFixed(1)}%`,
    s.evolutionCount > 0 ? `σ_evol:${s.evolutionCount}` : null,
    `}`,
  ].filter(Boolean).join(' ');
}

// ─────────────────────────────────────────
// CROSS-SESSION STATE — handoff formats
// ─────────────────────────────────────────

export interface SessionHandoff {
  type: 'wave' | 'particle';
  state: ARHAState;
  openQuestions?: string[];
  crystallizedInsight?: string;
  timestamp: number;
}

export function buildHandoff(state: ARHAState, extras?: {
  openQuestions?: string[];
  crystallizedInsight?: string;
}): SessionHandoff {
  return {
    type: state.phase === 'Wave' ? 'wave' : 'particle',
    state,
    ...extras,
    timestamp: Date.now(),
  };
}
