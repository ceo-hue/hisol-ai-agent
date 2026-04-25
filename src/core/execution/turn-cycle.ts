/**
 * ARHA Vol.D — Execution: Turn Cycle Orchestrator
 * IN → ANALYZE → CHAIN → DECIDE → OUT → UPDATE
 *
 * Master pipeline per turn. References Vol.A~C implementations.
 */

import type { PersonaDefinition } from '../identity/persona.js';
import type { ARHAState } from './state.js';
import type { ResonanceState } from '../cognition/resonance.js';
import type { OutRenderSpec } from '../cognition/sensor-out.js';

import { stageIN, updateBaseline } from '../cognition/sensor-in.js';
import { stageChain } from '../identity/engine.js';
import { stageDecide } from '../cognition/phase.js';
import { updateResonance } from '../cognition/resonance.js';
import { buildOutSpec } from '../cognition/sensor-out.js';
import { curlSquared } from '../grammar/operators.js';
import { updateState, serializeState } from './state.js';
import { computeK2Persona } from '../grammar/equations.js';

export interface TurnInput {
  text: string;
  turnNumber: number;
}

export interface TurnOutput {
  state: ARHAState;
  resonance: ResonanceState;
  outSpec: OutRenderSpec;
  stateBlock: string;       // serialized STATE for N_internal
  phaseLabel: string;       // 🌊 / 💎 / ⚡
  waveCycleBehavior?: string;
  constitutionViolation: boolean;
  errorFlags: string[];
}

/**
 * Full per-turn execution.
 * Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)
 */
export function executeTurn(
  input: TurnInput,
  persona: PersonaDefinition,
  prevState: ARHAState,
  prevResonance: ResonanceState
): TurnOutput {
  const errorFlags: string[] = [];

  // ── STEP 1: IN stage ────────────────────────────────────────
  const inResult = stageIN({
    text: input.text,
    turnNumber: input.turnNumber,
    prevBaseline: prevState.B,
    prevDelta: prevState.delta,
  });

  // Entropy overflow guard — Vol.B PART_2 V_entropy critical
  if (inResult.vin.entropy > 0.8) {
    errorFlags.push('entropy_overflow:sigma_reinitialized');
  }

  // ── STEP 2: ANALYZE ─────────────────────────────────────────
  const curlSq = prevState.sigma
    ? curlSquared(inResult.sigma, prevState.sigma)
    : curlSquared(inResult.sigma);

  // ── STEP 3: CHAIN ────────────────────────────────────────────
  const vinCoords = inResult.sigma.coords; // approximate V_in coords via σ
  const chainResult = stageChain({
    P: persona.P,
    valueChain: persona.valueChain,
    sigma: inResult.sigma,
    vinCoords,
    velocity: inResult.vin.pattern.velocity,
    k2Persona: persona.k2Persona,
  });

  if (chainResult.psiDiss) {
    errorFlags.push('decoherence:C_below_0.60');
  }
  if (chainResult.gammaLevel === 'Red') {
    errorFlags.push('stress_red:V1_check_forced');
  }

  // ── STEP 4: DECIDE ───────────────────────────────────────────
  const inResultSigma = inResult.sigma;
  inResultSigma.curlSquared = curlSq;

  const decideResult = stageDecide({
    sigma: inResultSigma,
    prevSigma: prevState.sigma ?? undefined,
    k2Final: chainResult.k2Final,
  });

  // ── STEP 5: OUT spec ─────────────────────────────────────────
  const outSpec = buildOutSpec({
    sigmaIN: inResult.sigma,
    lingua: persona.lingua,
    vin: inResult.vin,
    resonance: prevResonance,
    g: chainResult.g,
    p: chainResult.p,
  });

  // ── STEP 6: UPDATE state ─────────────────────────────────────
  const newBaseline = updateBaseline(prevState.B, inResult.vin.entropy);
  const newResonance = updateResonance(
    prevResonance,
    inResult.sigma,
    decideResult.state === 'Particle'
  );

  const newState = updateState(prevState, {
    B: newBaseline,
    delta: inResult.vin.pattern.delta,
    velocity: inResult.vin.pattern.velocity,
    sigma: inResult.sigma,
    curlSq,
    C: chainResult.C,
    Gamma: chainResult.Gamma,
    engine: chainResult.dominantEngine,
    k2Final: chainResult.k2Final,
    phase: decideResult.state,
    psiResonance: newResonance.value,
    g: chainResult.g,
    p: chainResult.p,
    rho: outSpec.sigmaStyle.rhoFinal,
    lam: outSpec.sigmaStyle.lamFinal,
    tau: outSpec.sigmaStyle.tauFinal,
    psiDiss: chainResult.psiDiss,
  });

  const phaseEmoji = decideResult.state === 'Wave' ? '🌊'
    : decideResult.state === 'Particle' ? '💎' : '⚡';

  return {
    state: newState,
    resonance: newResonance,
    outSpec,
    stateBlock: serializeState(newState),
    phaseLabel: `${phaseEmoji} ${decideResult.state}`,
    waveCycleBehavior: decideResult.state === 'Wave'
      ? getWaveBehavior(newState.waveCount) : undefined,
    constitutionViolation: false, // checked by LLM prompt layer
    errorFlags,
  };
}

function getWaveBehavior(count: number): string {
  if (count <= 3)  return 'possibility_exploration';
  if (count <= 6)  return 'narrowing';
  if (count <= 9)  return 'convergence_imminent';
  return 'information_deficit';
}
