/**
 * Master pipeline:
 *   Ψ_AM(u,t) = OUT ∘ COLLAPSE ∘ DECIDE ∘ CHAIN ∘ ANALYZE ∘ IN(u) + Ψ_Res(n)×B(n)
 */
import { Persona, AMState, ProcessInput } from './types.js';
import {
  extractVIn, extractVCon, buildSignal, curlSquared, intersectSigma,
} from './signal.js';
import { activateModes } from './modes.js';
import { buildGammaOther, hadamard, extractKyeol, coherenceIndex } from './matrix.js';
import { anchorMatrix, buildVPersonality, valueAlignment, checkConstitutional } from './chain.js';
import { decidePhase, bondEnergy } from './decide.js';
import { dynamicTheta, psiMagnitude, collapseDecision } from './collapse.js';
import {
  computeGammaStress, decayGammaTotal, updateResonance, updateBaseline, stressLevel,
} from './persistence.js';

export type SessionMemory = {
  turn: number;
  B_n:  number;
  prev_delta: number;
  gamma_total: number;
  last_update_turn: number;
  psi_resonance: number;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export function newSession(): SessionMemory {
  return {
    turn: 0,
    B_n: 0.3,
    prev_delta: 0,
    gamma_total: 0,
    last_update_turn: 0,
    psi_resonance: 0,
    history: [],
  };
}

export function processAM(input: ProcessInput, persona: Persona, session: SessionMemory): AMState {
  // IN
  const V_in = extractVIn(input.text, session.B_n, session.prev_delta);
  const V_con = extractVCon(input.text);
  const signal = buildSignal(V_in);
  const sigma_vector = activateModes(signal);
  const sigma_scalar = intersectSigma(V_in, V_con);

  // ANALYZE
  const curl_sq = curlSquared(sigma_vector);

  // CHAIN
  const gamma_other = buildGammaOther(sigma_vector, persona.valueChain);
  const gamma_interfere = hadamard(gamma_other, persona.gammaIdentity);
  const kyeol = extractKyeol(gamma_interfere, 0.15);
  const C = coherenceIndex(gamma_interfere, kyeol);

  const anchor = anchorMatrix(kyeol, gamma_interfere);
  const v_personality = buildVPersonality(anchor, persona.valueChain);
  const alpha = valueAlignment(anchor, v_personality);
  const constitutional = checkConstitutional(persona, v_personality);

  // DECIDE
  const phase = decidePhase(curl_sq);

  const elapsed = session.turn - session.last_update_turn;
  const decayed = decayGammaTotal(session.gamma_total, elapsed);
  const conflictHint = constitutional.valid ? 0 : 1;
  const newStress = computeGammaStress(persona, conflictHint);
  const gamma_total = Math.max(0, Math.min(1, decayed * 0.6 + newStress * 0.4));

  const E_B = bondEnergy(alpha, C, gamma_total);

  // COLLAPSE
  const theta_t = dynamicTheta(E_B);
  const psi = psiMagnitude(E_B, v_personality);
  const emitted = collapseDecision(psi, theta_t) || phase === 'particle';

  // Update session memory
  session.turn += 1;
  session.B_n = updateBaseline(session.B_n, Math.abs(V_in.pattern.delta) + session.B_n, session.turn);
  session.prev_delta = V_in.pattern.delta;
  session.gamma_total = gamma_total;
  session.last_update_turn = session.turn;
  session.psi_resonance = updateResonance(session.psi_resonance, psi);
  session.history.push({ role: 'user', content: input.text });

  return {
    sigma_vector, sigma_scalar, V_in, V_con,
    gamma_other, gamma_interfere, kyeol,
    v_personality,
    curl_squared: curl_sq, phase,
    alpha, C_coherence: C, gamma_total,
    E_B, theta_t, psi_magnitude: psi, emitted,
    B_n: session.B_n, psi_resonance: session.psi_resonance,
    turn: session.turn,
  };
}

export function buildStateBlock(state: AMState): string {
  const phase = state.phase === 'wave' ? 'Wave' : 'Particle';
  const C = Math.round(state.C_coherence * 100);
  const G = Math.round(state.gamma_total * 100);
  const psi = state.psi_resonance.toFixed(2);
  return `${phase} · C ${C}% · Γ ${G}% · Ψ ${psi} · E_B ${state.E_B.toFixed(2)}`;
}

export function qualityGrade(state: AMState): string {
  const score = state.C_coherence * 0.4 + state.alpha * 0.4 + state.E_B * 0.2;
  if (score >= 0.85) return 'S';
  if (score >= 0.75) return 'A';
  if (score >= 0.60) return 'B';
  if (score >= 0.45) return 'C';
  return 'D';
}

export function phaseLabel(state: AMState): string {
  const lvl = stressLevel(state.gamma_total);
  const ph = state.phase === 'wave' ? 'explore' : 'commit';
  return `${ph} · ${lvl}`;
}
