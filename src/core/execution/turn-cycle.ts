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
 *
 * VolC v3.0 additions:
 *   Γ_total   Wave-accumulated stress  — computeGammaTotal
 *   E_B       Binding energy           — computeBindingEnergy
 *   Gain_S    Sensory gain             — computeGainS
 *   Thermal   Particle cooling         — computeThermalCooling
 *   ρλτ_phys  Physics-layer ρ/λ/τ     — active when E_B > 0.1
 */

import type { PersonaDefinition, ValueChain } from '../identity/persona.js';
import type { ARHAState } from './state.js';
import type { ResonanceState } from '../cognition/resonance.js';
import type { OutRenderSpec } from '../cognition/sensor-out.js';

// ─────────────────────────────────────────
// CONFIG — VolC v3.0 thermal cooling baseline
// ─────────────────────────────────────────

/**
 * T_base — Particle 수렴 시 도달할 기준 온도.
 * 의미: 페르소나가 "차분해진 후 머무는 평정 온도".
 *   낮음(0.05) → 날카롭게 식음 (잡스 같은 단호한 페르소나에 적합)
 *   기본(0.10) → 표준 평정
 *   높음(0.20) → 따뜻하게 식음 (HighSol 같은 공감 페르소나에 적합)
 *
 * env: ARHA_T_BASE  default: 0.10  허용범위: [0, 0.40]
 * 범위 밖이거나 NaN이면 default로 fallback (silent — boot 안정성 우선).
 */
const T_BASE_DEFAULT = 0.10;
const T_BASE = (() => {
  const raw = process.env.ARHA_T_BASE;
  if (!raw) return T_BASE_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 0.40) {
    return T_BASE_DEFAULT;
  }
  return parsed;
})();

import { stageIN, updateBaseline } from '../cognition/sensor-in.js';
import { stageChain } from '../identity/engine.js';
import { stageDecide } from '../cognition/phase.js';
import { updateResonance } from '../cognition/resonance.js';
import { buildOutSpec } from '../cognition/sensor-out.js';
import { curlSquared } from '../grammar/operators.js';
import { updateState, serializeState } from './state.js';
import {
  computeK2Persona, computeTEntropy, bridgeUpdatePsiRes,
  computeGammaTotal, computeBindingEnergy, computeGainS,
  computeThermalCooling, computeRhoPhysics, computeLambdaPhysics, computeTauPhysics,
} from '../grammar/equations.js';
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
  // VolC v3.0 — Γ_total(t−1): accumulated stress from previous state, fed into value_strength
  const prevGammaTotal = computeGammaTotal(
    prevState.Gamma ?? 0,
    prevState.waveCount,
    prevState.phase === 'Wave',
  );

  const vinCoords = inResult.sigma.coords;
  const chainResult = stageChain({
    P:          persona.P,
    valueChain: effectiveChain,   // ← uses evolved chain
    sigma:      inResult.sigma,
    vinCoords,
    velocity:   inResult.vin.pattern.velocity,
    k2Persona:  persona.k2Persona,
    // Bridge: pass previous resonance + session-B momentum
    prevPsiRes:      prevResonance.value,
    prevVsB:         prevState.vsB,
    prevGammaTotal,  // ← VolC v3.0: Γ_total(t−1) for value_strength
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

  // ── VolC v3.0: Γ_total / E_B / Thermal Cooling / Physics ρλτ ──────────
  // Γ_total(t): current turn's accumulated stress — uses decideResult.state for Wave flag
  const gammaTotal = computeGammaTotal(
    chainResult.Gamma,
    prevState.waveCount,
    decideResult.state === 'Wave',
  );

  // E_B — binding energy: C²×ln(1+Γ_total)
  const EB = computeBindingEnergy(chainResult.C, gammaTotal);

  // Gain_S — sensory gain: 스트레스 높고 결합 미완 시 감각 예민도 상승.
  // E_B → ∞ 면 exp(-E_B) → 0 으로 평온한 감지.
  // ARHAState에 저장되어 마음상태 블록의 4번째 지표로 노출된다.
  const gainS = computeGainS(gammaTotal, EB);

  // Thermal Cooling — Particle phase convergence: T_eff → T_base (env-tunable)
  // T_BASE 모듈 상수는 ARHA_T_BASE env에서 한 번 검증된 값.
  // 페르소나별 차이가 필요하면 향후 persona.tBase override를 추가해 replace.
  const tEffectiveStored = (decideResult.state === 'Particle' && tEffective > 0)
    ? computeThermalCooling(T_BASE, tEffective, EB)
    : tEffective;

  // Physics ρ/λ/τ — activated once E_B ≥ 0.1 (sufficient binding energy)
  // Below threshold: P-base boot values (from outSpec) remain active.
  const ebActive   = EB >= 0.1;
  // Mode_9 Vacuum_Bath proxy: waveCount surge → mode_9 weight drops
  const mode9Weight = 1 - Math.min(1, prevState.waveCount / 8);

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

  // Physics-overridden ρ/λ/τ — replaces outSpec values when E_B ≥ 0.1
  const rhoFinal = ebActive
    ? computeRhoPhysics(EB, chainResult.C)
    : outSpec.sigmaStyle.rhoFinal;
  const lamFinal = ebActive
    ? computeLambdaPhysics(mode9Weight, EB)
    : outSpec.sigmaStyle.lamFinal;
  const tauFinal = ebActive
    ? computeTauPhysics(chainResult.RTension)
    : outSpec.sigmaStyle.tauFinal;

  // ── STEP 6: UPDATE state ─────────────────────────────────────
  const newBaseline  = updateBaseline(prevState.B, inResult.vin.entropy);

  // Bridge Ψ_Res update rule [VolC v3.0]
  // Ψ_Res(t) = clamp(Ψ_Res(t−1) + C×0.12 − Γ_total×0.08, 0, 1.0)
  // Note: gammaTotal (accumulated) replaces raw chainResult.Gamma (instantaneous)
  const rawResonance = updateResonance(prevResonance, inResult.sigma, decideResult.state === 'Particle');
  const bridgePsiRes = bridgeUpdatePsiRes(prevResonance.value, chainResult.C, gammaTotal);
  const newResonance = { ...rawResonance, value: bridgePsiRes };

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
    // Physics ρ/λ/τ — physics values when E_B active, P-base otherwise
    rho:          rhoFinal,
    lam:          lamFinal,
    tau:          tauFinal,
    psiDiss:      chainResult.psiDiss,
    // Chip circuit state
    wCoreDynamic,
    wSubsDynamic,
    tEntropy,
    tEffective:   tEffectiveStored,  // ← thermally cooled in Particle phase
    pParticle:          decideResult.pParticle,
    sustainedHighGamma,
    // VolC v3.0 — binding energy & accumulated stress & sensory gain
    gammaTotal,
    EB,
    gainS,
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
