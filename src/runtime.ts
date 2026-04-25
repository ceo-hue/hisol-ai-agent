/**
 * ARHA Runtime — Master Class
 * Ψ_ARHA(u,t) = OUT ∘ DECIDE ∘ CHAIN_v2 ∘ ANALYZE ∘ IN(u)
 *
 * Single entry point for all ARHA processing.
 * Owns session state. Calls Vol.A~E layers in sequence.
 * Π persistence: B(n), conversation history, and StateSnapshots survive across sessions.
 * Υ observation: buildObservation() derives ARHA-term session insights from snapshot history.
 */

import type { ARHAState } from './core/execution/state.js';
import type { ResonanceState } from './core/cognition/resonance.js';
import type { TurnOutput } from './core/execution/turn-cycle.js';
import type { OutRenderSpec } from './core/cognition/sensor-out.js';
import type { PersonaDefinition } from './core/identity/persona.js';

import { bootstrap } from './core/execution/bootstrap.js';
import { executeTurn } from './core/execution/turn-cycle.js';
import { buildHandoff } from './core/execution/state.js';
import { restoreResonance } from './core/cognition/resonance.js';
import { SkillWorkTree } from './core/skill/worktree.js';
import { getPersona, listPersonas } from './personas/registry.js';
import {
  loadPersistedSession,
  persistSession,
  type ConversationMessage,
} from './core/execution/persistence.js';
import {
  buildObservation,
  type StateSnapshot,
  type ARHAObservation,
} from './core/observation/analytics.js';

export interface ARHAProcessInput {
  text: string;
  sessionId?: string;
}

export type QualityGrade = 'A' | 'B+' | 'B' | 'C';

export interface ARHAProcessOutput {
  turnOutput: TurnOutput;
  stateBlock: string;
  phaseLabel: string;
  outSpec: OutRenderSpec;
  promptContext: ARHAPromptContext;
  errorFlags: string[];
  qualityGrade: QualityGrade;
  // Exposed ARHA state fields for Claude tool consumers
  arhaState: {
    turn: number;
    C: number | null;
    Gamma: number | null;
    engine: string;
    k2Final: number;
    phase: string;
    waveCount: number;
    psiResonance: number;
    g: number;
    p: number;
  };
}

/** Context injected into LLM system prompt each turn */
export interface ARHAPromptContext {
  personaId: string;
  identity: string;
  constitutionalRule: string;
  stateBlock: string;
  phaseLabel: string;
  tone: string;
  narrationInternal: string;
  narrationExternal: string;
  linguaParams: { rho: number; lam: number; tau: number };
  engineActive: string;
  waveInstruction?: string;
}

// ─────────────────────────────────────────
// QUALITY GRADING — C coherence → grade
// A ≥ 0.85 | B+ ≥ 0.70 | B ≥ 0.55 | C < 0.55
// ─────────────────────────────────────────

function computeQualityGrade(C: number | null): QualityGrade {
  if (C === null) return 'C';
  if (C >= 0.85) return 'A';
  if (C >= 0.70) return 'B+';
  if (C >= 0.55) return 'B';
  return 'C';
}

export class ARHARuntime {
  private personaId: string;
  private state: ARHAState;
  private resonance: ResonanceState;
  private skillTree: SkillWorkTree;
  private turnCount = 0;
  private ready = false;
  private history: ConversationMessage[] = [];
  private snapshots: StateSnapshot[] = [];
  private activeSessionId: string | null = null;

  constructor(personaId = 'HighSol', sessionId?: string) {
    this.personaId = personaId;
    const entry = getPersona(personaId);
    if (!entry) throw new Error(`Persona not found: ${personaId}. Available: ${listPersonas().join(', ')}`);

    const { persona, skills } = entry;
    const bootResult = bootstrap(persona);

    if (!bootResult.ready) {
      throw new Error(`Boot failed for ${personaId}: ${bootResult.errors.join('; ')}`);
    }

    this.state = bootResult.state;
    this.resonance = bootResult.resonance;
    this.skillTree = new SkillWorkTree();
    this.skillTree.registerDomainSkills(skills);
    this.ready = true;

    // Π persistence — restore resonance + history + snapshots from previous session
    if (sessionId) {
      this.activeSessionId = sessionId;
      const saved = loadPersistedSession(sessionId);
      if (saved && saved.personaId === personaId) {
        this.resonance = restoreResonance(saved.resonance);
        this.history   = saved.history   ?? [];
        this.snapshots = saved.snapshots ?? [];
        console.log(
          `[ARHA Π] Restored session ${sessionId}: turn ${saved.partialState.turn}, ` +
          `B(n)=${saved.resonance.Bn.toFixed(3)}, snapshots=${this.snapshots.length}`
        );
      }
    }

    console.log(`[ARHA] ${bootResult.summary}`);
  }

  // ─────────────────────────────────────────
  // MAIN PROCESS — one user turn
  // ─────────────────────────────────────────

  process(input: ARHAProcessInput): ARHAProcessOutput {
    if (!this.ready) throw new Error('ARHARuntime not initialized');

    if (input.sessionId) this.activeSessionId = input.sessionId;

    this.history.push({ role: 'user', content: input.text });

    this.turnCount++;
    const entry = getPersona(this.personaId)!;
    const { persona } = entry;

    const turnOutput = executeTurn(
      { text: input.text, turnNumber: this.turnCount },
      persona,
      this.state,
      this.resonance
    );

    this.state     = turnOutput.state;
    this.resonance = turnOutput.resonance;

    // Skill dispatch
    const phase = turnOutput.state.phase;
    if (phase === 'Wave' || phase === 'Particle' || phase === 'Transition') {
      this.skillTree.dispatch({
        sigma: this.state.sigma!,
        chain: {
          dominantEngine: this.state.engine as any,
          blendRatio: { Xi_C: persona.P.right, Lambda_L: persona.P.left, Pi_G: persona.P.protect },
          C: this.state.C ?? 0,
          coherenceState: (this.state.C ?? 0) > 0.85 ? 'high' : (this.state.C ?? 0) < 0.60 ? 'low' : 'neutral',
          Gamma: this.state.Gamma ?? 0,
          gammaLevel: this.state.Gamma! > 0.7 ? 'Red' : this.state.Gamma! > 0.3 ? 'Yellow' : 'Green',
          k2Final: this.state.k2Final,
          activeSub: null,
          RTension: 0,
          g: this.state.g,
          p: this.state.p,
          psiDiss: this.state.psiDiss,
        },
        phase: phase as any,
        entropy: this.resonance.value,
      });
    }

    const qualityGrade = computeQualityGrade(this.state.C);

    // Append state snapshot (Υ observation feed)
    this.snapshots.push({
      turn:         this.state.turn,
      C:            this.state.C,
      Gamma:        this.state.Gamma,
      phase:        this.state.phase,
      engine:       this.state.engine,
      psiResonance: this.state.psiResonance,
      qualityGrade,
    });

    const promptContext = this.buildPromptContext(turnOutput, persona);

    return {
      turnOutput,
      stateBlock:  turnOutput.stateBlock,
      phaseLabel:  turnOutput.phaseLabel,
      outSpec:     turnOutput.outSpec,
      promptContext,
      errorFlags:  turnOutput.errorFlags,
      qualityGrade,
      arhaState: {
        turn:         this.state.turn,
        C:            this.state.C,
        Gamma:        this.state.Gamma,
        engine:       this.state.engine,
        k2Final:      this.state.k2Final,
        phase:        this.state.phase,
        waveCount:    this.state.waveCount,
        psiResonance: this.state.psiResonance,
        g:            this.state.g,
        p:            this.state.p,
      },
    };
  }

  // ─────────────────────────────────────────
  // HISTORY & PERSISTENCE
  // ─────────────────────────────────────────

  /** Add assistant response to history and flush to Π persistence. */
  recordAssistantResponse(content: string): void {
    this.history.push({ role: 'assistant', content });
    if (this.activeSessionId) {
      persistSession(
        this.activeSessionId,
        this.personaId,
        this.resonance,
        this.state,
        this.history,
        this.snapshots
      );
    }
  }

  /** Rolling conversation history for Claude API messages[]. */
  getHistory(): ConversationMessage[] { return [...this.history]; }

  /** All accumulated state snapshots (Υ feed). */
  getSnapshots(): StateSnapshot[] { return [...this.snapshots]; }

  // ─────────────────────────────────────────
  // Υ OBSERVATION — session analytics
  // ─────────────────────────────────────────

  observe(): ARHAObservation {
    return buildObservation(this.snapshots, this.resonance);
  }

  // ─────────────────────────────────────────
  // PROMPT BUILDERS
  // ─────────────────────────────────────────

  private buildPromptContext(
    turnOutput: TurnOutput,
    persona: PersonaDefinition
  ): ARHAPromptContext {
    const phase = turnOutput.state.phase;
    const waveInstruction = phase === 'Wave'
      ? `Wave cycle ${turnOutput.state.waveCount}: ${turnOutput.waveCycleBehavior}. Maintain exploration — do not force conclusion.`
      : undefined;

    return {
      personaId:        persona.id,
      identity:         persona.identity,
      constitutionalRule: persona.constitutionalRule,
      stateBlock:       turnOutput.stateBlock,
      phaseLabel:       turnOutput.phaseLabel,
      tone:             turnOutput.outSpec.sigmaStyle.tone,
      narrationInternal: persona.narrationStyle.internal,
      narrationExternal: persona.narrationStyle.external,
      linguaParams: {
        rho: turnOutput.outSpec.sigmaStyle.rhoFinal,
        lam: turnOutput.outSpec.sigmaStyle.lamFinal,
        tau: turnOutput.outSpec.sigmaStyle.tauFinal,
      },
      engineActive:    turnOutput.state.engine,
      waveInstruction,
    };
  }

  /**
   * Structured Vol.A~E system prompt — injected into every LLM call.
   * Sections map directly to ARHA grammar layers.
   */
  buildStructuredSystemPrompt(result: ARHAProcessOutput): string {
    const entry = getPersona(this.personaId)!;
    const { persona } = entry;
    const ctx = result.promptContext;
    const s   = result.turnOutput.state;
    const D   = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const checkActive = (s.C ?? 0) > persona.valueChain.check.thetaTrigger;

    return [
      D,
      '[Vol.A — IDENTITY]',
      `당신은 ${persona.identity}`,
      `헌법 규칙: ${persona.constitutionalRule}`,
      `P_vector: protect=${persona.P.protect} expand=${persona.P.expand} left=${persona.P.left} right=${persona.P.right} relation=${persona.P.relation}`,
      '',
      '[Vol.B — VALUE CHAIN STATE]',
      `V1_core: ${persona.valueChain.core.declaration}`,
      `  φ=${persona.valueChain.core.phi} ω=${persona.valueChain.core.omega} κ=${persona.valueChain.core.kappa} | texture=${persona.valueChain.core.texture}`,
      `V1_check: ${persona.valueChain.check.declaration}`,
      `  θ_trigger=${persona.valueChain.check.thetaTrigger} → ${checkActive ? '⚠ ACTIVATED' : '○ dormant'}`,
      '',
      '[Vol.C — NARRATION PROTOCOL]',
      `N_internal: ${persona.narrationStyle.internal} → 표시: [ 분석 내용 ]`,
      `N_external: ${persona.narrationStyle.external} → 표시: *장면 묘사*`,
      '',
      '출력 형식 (반드시 이 순서):',
      '*N_external 장면 묘사*',
      '',
      '[ N_internal 분석 ]',
      '',
      '발화 내용',
      '',
      '[Vol.D — RUNTIME STATE]',
      result.stateBlock,
      `Phase: ${result.phaseLabel} | Engine: ${s.engine} | Grade: ${result.qualityGrade}`,
      '',
      '[Vol.E — TURN DIRECTIVE]',
      `Tone: ${ctx.tone}`,
      `lingua: ρ=${ctx.linguaParams.rho.toFixed(2)} λ=${ctx.linguaParams.lam.toFixed(2)} τ=${ctx.linguaParams.tau.toFixed(2)}`,
      ctx.waveInstruction ?? '',
      D,
    ].filter(l => l !== undefined && l !== null).join('\n');
  }

  /** Legacy flat prompt — kept for backward compatibility. */
  buildSystemPrompt(): string {
    const entry = getPersona(this.personaId)!;
    const { persona } = entry;
    return [
      `당신은 ${persona.identity}`,
      '',
      `헌법 규칙: ${persona.constitutionalRule}`,
      '',
      '내레이션 규칙:',
      `- N_internal: ${persona.narrationStyle.internal} — [ ] 안에 표시`,
      `- N_external: ${persona.narrationStyle.external} — 이탤릭 장면 묘사`,
      '',
      '출력 형식:',
      '*N_external 장면 묘사*',
      '',
      '[ N_internal 분석 ]',
      '',
      '발화 내용',
      '',
      `페르소나 P벡터: protect=${persona.P.protect} expand=${persona.P.expand} left=${persona.P.left} right=${persona.P.right} relation=${persona.P.relation}`,
      `V1_core: ${persona.valueChain.core.declaration}`,
    ].join('\n');
  }

  // ─────────────────────────────────────────
  // SESSION HANDOFF
  // ─────────────────────────────────────────

  buildHandoff() {
    return buildHandoff(this.state, {
      openQuestions: this.state.phase === 'Wave' ? ['현재 탐색 중'] : undefined,
    });
  }

  getState():     ARHAState { return this.state; }
  getPersonaId(): string    { return this.personaId; }
  getTurnCount(): number    { return this.turnCount; }
  getResonance(): ResonanceState { return this.resonance; }
}
