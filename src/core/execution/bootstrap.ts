/**
 * ARHA Vol.D — Execution: Bootstrap Protocol
 * Phase 0: grammar recognition → Phase 1: persona lock → Phase 2: baseline build → Phase 3: normal
 */

import type { PersonaDefinition } from '../identity/persona.js';
import type { ARHAState } from './state.js';
import type { ResonanceState } from '../cognition/resonance.js';
import { initState } from './state.js';
import { initResonance } from '../cognition/resonance.js';
import { validateValueChain } from '../identity/persona.js';

export type BootPhase = 'phase_0_recognition' | 'phase_1_persona_lock' | 'phase_2_baseline' | 'phase_3_normal';

export interface BootResult {
  ready: boolean;
  phase: BootPhase;
  state: ARHAState;
  resonance: ResonanceState;
  errors: string[];
  summary: string;
}

/**
 * Initialize ARHA Runtime for a persona.
 * Vol.D PART_2 bootstrap sequence.
 */
export function bootstrap(persona: PersonaDefinition): BootResult {
  const errors: string[] = [];

  // Phase 0 — Grammar recognition (validate all volumes loaded)
  const vcValidation = validateValueChain(persona.valueChain);
  if (!vcValidation.valid) {
    errors.push(...vcValidation.errors);
  }

  if (persona.k2Persona < 0.55 || persona.k2Persona > 0.95) {
    errors.push(`k²_persona out of valid range [0.55, 0.95]: ${persona.k2Persona}`);
  }

  // Phase 1 — Persona lock
  const state = initState({
    k2Persona: persona.k2Persona,
    g: persona.valueChain.core.omega * persona.P.expand,
    p: (1 - persona.valueChain.core.omega) * persona.P.protect,
    rho: persona.lingua.rho,
    lam: persona.lingua.lam,
    tau: persona.lingua.tau,
  });

  const resonance = initResonance();

  if (errors.length > 0) {
    return {
      ready: false,
      phase: 'phase_0_recognition',
      state,
      resonance,
      errors,
      summary: `Boot failed: ${errors.join('; ')}`,
    };
  }

  return {
    ready: true,
    phase: 'phase_2_baseline',
    state,
    resonance,
    errors: [],
    summary: `ARHA_READY · Persona: ${persona.id} · engine: ${getPreCalcEngine(persona)} · k²: ${persona.k2Persona.toFixed(3)} · Baseline build mode (turns 1–3)`,
  };
}

function getPreCalcEngine(persona: PersonaDefinition): string {
  const P = persona.P;
  const weights = { Xi_C: P.right, Lambda_L: P.left, Pi_G: P.protect };
  return Object.entries(weights).sort(([,a],[,b]) => b - a)[0][0];
}

/** Vol.D PART_3 — Document routing table */
export const ROUTING_TABLE = {
  symbol_interpretation:  'Vol.A PART_2~6',
  equation_verification:  'Vol.A PART_8~11',
  user_signal_detection:  'Vol.B PART_2~3',
  output_rendering:       'Vol.B PART_4',
  phase_decision:         'Vol.B PART_5~8',
  persona_tone_style:     'Vol.C PART_2~6',
  chain_processing:       'Vol.C PART_4 + Vol.A PART_10 Eq7',
  new_persona_design:     'Vol.C PART_7~10',
  session_continuity:     'Vol.B PART_9',
} as const;

/** Routing priority order */
export const ROUTING_PRIORITY = [
  'Vol.C PART_2 — Persona constitution conditions everything',
  'Vol.C PART_4 — CHAIN engine determines k²_final',
  'Vol.B PART_5~8 — phase transition gates output',
  'Vol.B PART_2~4 — sensors and rendering',
  'Vol.A PART_8~11 — equation verification',
  'Vol.A PART_2~7 — symbol interpretation',
] as const;
