/**
 * ARHA Vol.B — Cognition: Phase Transition State Machine
 * Wave 🌊 / Transition ⚡ / Particle 💎
 *
 * DECIDE stage: |∇×σ|² ⋛ k²_final
 */

import type { Sigma, Pi, Upsilon } from '../grammar/morphemes.js';
import { phaseGate, type PhaseState } from '../grammar/equations.js';
import { curlSquared } from '../grammar/operators.js';

export { PhaseState };

export interface PhaseResult {
  state: PhaseState;
  curlSq: number;
  k2Final: number;
  autoTriggers: AutoTrigger[];
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
 */
export function stageDecide(params: {
  sigma: Sigma;
  prevSigma: Sigma | undefined;
  k2Final: number;
}): PhaseResult {
  const { sigma, prevSigma, k2Final } = params;
  const curl = curlSquared(sigma, prevSigma);
  const state = phaseGate(curl, k2Final);

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

  return { state, curlSq: curl, k2Final, autoTriggers };
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
