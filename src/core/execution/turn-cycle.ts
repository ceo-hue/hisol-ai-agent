/**
 * ARHA Vol.D — Execution: Turn Cycle Orchestrator
 * IN → ANALYZE → CHAIN → DECIDE → OUT → UPDATE
 *
 * Master pipeline per turn. References Vol.A~C implementations.
 *
 * Gemini Chip Circuit patches active:
 *   PATCH_A  Absolute Zero Override   — V1_check forces T_eff → 0
 *   PATCH_B  Softmax w_sub            — energy-conserved sub-weight redistribution
 *   SELF_EVO sigma_eureka detection   — triggers V1_sub evolution in ARHARuntime
 */

import type { PersonaDefinition, ValueChain } from '../identity/persona.js';
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
import { computeK2Persona, computeTEntropy, bridgeUpdatePsiRes } from '../grammar/equations.js';
import {
  computePIDGains,
  computeDynamicWCore,
  deriveWCoreDefault,
  computeSoftmaxWSubs,
} from '../identity/pid.js';

export interface TurnInput {
  text: string;
  turnNumber: number;
}

export interface TurnOutput {
  state: ARHAState;
  resonance: ResonanceState;
  outSpec: OutRenderSpec;
  stateBlock: string;        // serialized STATE for N_internal
  phaseLabel: string;        // 🌊 / 💎 / ⚡
  waveCycleBehavior?: string;
  constitutionViolation: boolean;
  errorFlags: string[];
  sigmaEureka: boolean;      // Self-Evolution trigger signal
}

/**
 * Full per-turn execution.
 * Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)
 *
 * @param liveValueChain  — runtime-mutated value chain (Self-Evolution).
 *                          Pass undefined to use persona.valueChain (boot default).
 */
export function executeTurn(
  input:           TurnInput,
  persona:         PersonaDefinition,
  prevState:       ARHAState,
  prevResonance:   ResonanceState,
  liveValueChain?: ValueChain,
): TurnOutput {
  const errorFlags: string[] = [];

  // Use evolved value chain if provided, otherwise boot-time constant
  const effectiveChain = liveValueChain ?? persona.valueChain;

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
  const vinCoords = inResult.sigma.coords;
  const chainResult = stageChain({
    P:          persona.P,
    valueChain: effectiveChain,   // ← uses evolved chain
    sigma:      inResult.sigma,
    vinCoords,
    velocity:   inResult.vin.pattern.velocity,
    k2Persona:  persona.k2Persona,
    // Bridge: pass previous resonance + session-B momentum
    prevPsiRes: prevResonance.value,
    prevVsB:    prevState.vsB,
  });

  if (chainResult.psiDiss) {
    errorFlags.push('decoherence:C_below_0.60');
  }
  if (chainResult.gammaLevel === 'Red') {
    errorFlags.push('stress_red:V1_check_forced');
  }

  // ── STEP 4: DECIDE ───────────────────────────────────────────

  // PID (PART_2) — derive dynamic w_core
  const pidGains     = computePIDGains(persona.P);
  const wStatic      = persona.weightStructure?.wCore
    ?? deriveWCoreDefault(persona.P, effectiveChain.core.kappa);
  const wCoreDynamic = computeDynamicWCore({
    wStatic,
    delta:    inResult.vin.pattern.delta,
    psiRes:   prevResonance.value,
    velocity: inResult.vin.pattern.velocity,
    gains:    pidGains,
  });

  // PATCH_B — Softmax w_sub (energy conservation)
  const gammas = effectiveChain.subs.map(s => s.gamma);
  const { wSubs: wSubsDynamic } = computeSoftmaxWSubs({
    gammas,
    wCoreDynamic,
    expandAxis: persona.P.expand,
  });

  // PART_3 — raw contextual entropy temperature
  const tEntropy = computeTEntropy({
    textLen:   input.text.length,
    waveCount: prevState.waveCount,
    delta:     inResult.vin.pattern.delta,
  });

  // PATCH_A — Absolute Zero Override:
  // When V1_check fires (RTension > θ), collapse T → 0.
  // This forces Boltzmann gate into immediate Particle (defensive crystallisation).
  const v1CheckFired = chainResult.RTension > effectiveChain.check.thetaTrigger;
  const tEffective   = v1CheckFired ? 0 : tEntropy;

  if (v1CheckFired) {
    errorFlags.push('v1_check:absolute_zero_override');
  }

  const inResultSigma = inResult.sigma;
  inResultSigma.curlSquared = curlSq;

  const decideResult = stageDecide({
    sigma:        inResultSigma,
    prevSigma:    prevState.sigma ?? undefined,
    k2Final:      chainResult.k2Final,
    tEntropy:     tEffective,    // ← Boltzmann receives T_eff (0 if locked)
    wCoreDynamic,
  });

  // ── SELF-EVOLUTION DETECTION ──────────────────────────────────
  // sigma_eureka condition:
  //   • Sustained high Γ (≥ 2 consecutive Red turns) — friction & tension
  //   • Followed by Particle crystallisation            — convergent insight
  // ARHARuntime handles the actual V1_sub mutation.
  const sigmaEureka =
    chainResult.gammaLevel === 'Red'   &&
    decideResult.state     === 'Particle' &&
    prevState.sustainedHighGamma >= 2;

  // Track sustained high-gamma streak
  const sustainedHighGamma = chainResult.gammaLevel === 'Red'
    ? prevState.sustainedHighGamma + 1
    : 0;

  // ── STEP 5: OUT spec ─────────────────────────────────────────
  const outSpec = buildOutSpec({
    sigmaIN:   inResult.sigma,
    lingua:    persona.lingua,
    vin:       inResult.vin,
    resonance: prevResonance,
    g:         chainResult.g,
    p:         chainResult.p,
  });

  // ── STEP 6: UPDATE state ─────────────────────────────────────
  const newBaseline  = updateBaseline(prevState.B, inResult.vin.entropy);

  // Bridge Ψ_Res update rule — replaces raw sigma-magnitude accumulation
  // Ψ_Res(t) = clamp(Ψ_Res(t−1) + C×0.12 − Γ×0.08, 0, 1.0)
  const rawResonance    = updateResonance(prevResonance, inResult.sigma, decideResult.state === 'Particle');
  const bridgePsiRes    = bridgeUpdatePsiRes(prevResonance.value, chainResult.C, chainResult.Gamma);
  const newResonance    = { ...rawResonance, value: bridgePsiRes };

  const newState = updateState(prevState, {
    B:            newBaseline,
    delta:        inResult.vin.pattern.delta,
    velocity:     inResult.vin.pattern.velocity,
    sigma:        inResult.sigma,
    curlSq,
    C:            chainResult.C,
    Gamma:        chainResult.Gamma,
    engine:       chainResult.dominantEngine,
    k2Final:      chainResult.k2Final,
    phase:        decideResult.state,
    psiResonance: newResonance.value,
    vsB:          chainResult.vsB,
    g:            chainResult.g,
    p:            chainResult.p,
    rho:          outSpec.sigmaStyle.rhoFinal,
    lam:          outSpec.sigmaStyle.lamFinal,
    tau:          outSpec.sigmaStyle.tauFinal,
    psiDiss:      chainResult.psiDiss,
    // Chip circuit state
    wCoreDynamic,
    wSubsDynamic,
    tEntropy,
    tEffective,
    pParticle:          decideResult.pParticle,
    sustainedHighGamma,
    // evolutionCount is updated by ARHARuntime after sigma_eureka, not here
  });

  const phaseEmoji = decideResult.state === 'Wave' ? '🌊'
    : decideResult.state === 'Particle' ? '💎' : '⚡';

  return {
    state:     newState,
    resonance: newResonance,
    outSpec,
    stateBlock:  serializeState(newState),
    phaseLabel: `${phaseEmoji} ${decideResult.state}`,
    waveCycleBehavior: decideResult.state === 'Wave'
      ? getWaveBehavior(newState.waveCount) : undefined,
    constitutionViolation: false,
    errorFlags,
    sigmaEureka,
  };
}

function getWaveBehavior(count: number): string {
  if (count <= 3)  return 'possibility_exploration';
  if (count <= 6)  return 'narrowing';
  if (count <= 9)  return 'convergence_imminent';
  return 'information_deficit';
}
