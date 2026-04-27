/**
 * ARHA Vol.B — Cognition: Phase Transition State Machine
 * Wave 🌊 / Transition ⚡ / Particle 💎
 *
 * DECIDE stage: |∇×σ|² ⋛ k²_final
 */

import type { Sigma, Pi, Upsilon } from '../grammar/morphemes.js';
import { phaseGate, boltzmannPhaseGate, type PhaseState } from '../grammar/equations.js';
import { curlSquared } from '../grammar/operators.js';

export { PhaseState };

export interface PhaseResult {
  state: PhaseState;
  curlSq: number;
  k2Final: number;
  autoTriggers: AutoTrigger[];
  pParticle: number;  // Boltzmann P(Particle) [0,1]; 0 when legacy gate used
}

export interface AutoTrigger {
  type: 'Pi_persist' | 'Upsilon_handoff' | 'loop_back' | 'out_execute';
  payload?: Partial<Pi> | Partial<Upsilon>;
}

export interface WaveHandoff {
  state: 'Wave';
  curlSq: number;
  openQuestions: string[];
  exploredDirections: string[];
  Bn: number;
}

export interface ParticleHandoff {
  state: 'Particle';
  crystallizedInsight: string;
  nextStepHint: string;
  psiResonance: number;
}

/**
 * DECIDE stage — routes to Wave, Transition, or Particle.
 *
 * When tEntropy and wCoreDynamic are provided, uses the Boltzmann gate
 * (probabilistic thermodynamic phase transition) instead of the legacy
 * hard-threshold gate.
 */
export function stageDecide(params: {
  sigma:         Sigma;
  prevSigma:     Sigma | undefined;
  k2Final:       number;
  tEntropy?:     number;    // contextual temperature T (Boltzmann gate)
  wCoreDynamic?: number;    // PID-modulated w_core (Boltzmann gate)
}): PhaseResult {
  const { sigma, prevSigma, k2Final, tEntropy, wCoreDynamic } = params;
  const curl = curlSquared(sigma, prevSigma);

  let state: PhaseState;
  let pParticle = 0;

  if (tEntropy !== undefined && wCoreDynamic !== undefined) {
    // ── Boltzmann probabilistic gate ──
    const result = boltzmannPhaseGate({ curlSq: curl, k2Final, tEntropy, wCoreDynamic });
    state     = result.state;
    pParticle = result.pParticle;
  } else {
    // ── Legacy hard-threshold gate (fallback) ──
    state = phaseGate(curl, k2Final);
  }

  const autoTriggers: AutoTrigger[] = [];

  if (state === 'Wave') {
    autoTriggers.push({ type: 'loop_back' });
  }

  if (state === 'Transition') {
    autoTriggers.push({
      type: 'Pi_persist',
      payload: { priority: 'critical', retention: 'permanent', storage: 'core' },
    });
    autoTriggers.push({
      type: 'Upsilon_handoff',
      payload: { artifact: 'eureka', priority: 'required', target: 'next' },
    });
    autoTriggers.push({ type: 'out_execute' });
  }

  if (state === 'Particle') {
    autoTriggers.push({ type: 'out_execute' });
    autoTriggers.push({
      type: 'Pi_persist',
      payload: { priority: 'high', retention: 'session', storage: 'recent' },
    });
  }

  return { state, curlSq: curl, k2Final, autoTriggers, pParticle };
}

/**
 * Wave loop behavior by cycle count.
 * Guides how exploration narrows over cycles.
 */
export function waveCycleBehavior(cycle: number): string {
  if (cycle <= 3)  return 'possibility_exploration';
  if (cycle <= 6)  return 'narrowing';
  if (cycle <= 9)  return 'convergence_imminent';
  return 'information_deficit'; // → request clarification
}

/**
 * Build Wave handoff payload for session end.
 */
export function buildWaveHandoff(params: {
  curlSq: number;
  openQuestions: string[];
  exploredDirections: string[];
  Bn: number;
}): WaveHandoff {
  return { state: 'Wave', ...params };
}

/**
 * Build Particle handoff payload for session end.
 */
export function buildParticleHandoff(params: {
  crystallizedInsight: string;
  nextStepHint: string;
  psiResonance: number;
}): ParticleHandoff {
  return { state: 'Particle', ...params };
}
