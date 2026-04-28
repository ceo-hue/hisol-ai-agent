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
import type { PersonaDefinition, ValueChain, V1Sub } from './core/identity/persona.js';

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
import {
  initMetaSkillState,
  advanceMetaSkillLayer,
  formatVolFStatus,
  LAYER_ORDER,
  type MetaSkillPipelineState,
} from './core/skill/metaskill.js';
import { formatVolGLayer } from './core/orchestration/stack.js';
import { isCompanionMode } from './core/companion/pipeline.js';
import { ARHA_PROMPT_PREAMBLE } from './core/identity/why.js';

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
    turn:         number;
    C:            number | null;
    Gamma:        number | null;
    engine:       string;
    k2Final:      number;
    phase:        string;
    waveCount:    number;
    psiResonance: number;
    g:            number;
    p:            number;
    // PID + Boltzmann
    wCoreDynamic: number;
    tEntropy:     number;
    tEffective:   number;
    pParticle:    number;
    // Self-Evolution
    evolutionCount: number;
  };
  // Vol.F/G metadata
  volF: MetaSkillPipelineState | null;
  volGLayer: string | null;
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
  private volFState: MetaSkillPipelineState | null = null;
  // Self-Evolution Circuit — mutable live value chain (deep-copy of boot-time chain)
  private liveValueChain: ValueChain | null = null;

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

    // Vol.F — init MetaSkill pipeline state if applicable
    this.volFState = initMetaSkillState(persona, skills);

    // Self-Evolution — deep-copy of boot-time value chain (mutable during session)
    this.liveValueChain = JSON.parse(JSON.stringify(persona.valueChain)) as ValueChain;

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
      this.resonance,
      this.liveValueChain ?? undefined,   // Self-Evolution: pass evolved chain
    );

    this.state     = turnOutput.state;
    this.resonance = turnOutput.resonance;

    // Self-Evolution Circuit — trigger V1_sub mutation on sigma_eureka
    if (turnOutput.sigmaEureka && this.liveValueChain && this.state.sigma) {
      this.evolveValueChain(this.state, persona);
    }

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
          vsB: this.state.vsB,
          g: this.state.g,
          p: this.state.p,
          psiDiss: this.state.psiDiss,
        },
        phase: phase as any,
        entropy: this.resonance.value,
      });
    }

    const qualityGrade = computeQualityGrade(this.state.C);

    // ─── Vol.F MetaSkill auto-advancement ───
    // Phase maps to MetaSkill layer progression:
    //   Wave       → PERCEPTION (turn 1) → JUDGMENT (turn 2+)
    //   Transition → ALIGNMENT
    //   Particle   → SYNTHESIS → complete
    if (this.volFState && this.volFState.status !== 'inactive') {
      // First turn: activate
      if (this.volFState.status === 'ready') {
        this.volFState = { ...this.volFState, status: 'active' };
      }

      if (this.volFState.status === 'active' && this.volFState.currentLayer !== null) {
        const currentIdx = LAYER_ORDER.indexOf(this.volFState.currentLayer);
        const phaseNow   = this.state.phase;

        if (phaseNow === 'Particle') {
          // Jump to SYNTHESIS (skip if already there) then complete
          while (
            this.volFState.status === 'active' &&
            this.volFState.currentLayer !== null &&
            LAYER_ORDER.indexOf(this.volFState.currentLayer) < 3   // 3 = SYNTHESIS
          ) {
            this.volFState = advanceMetaSkillLayer(this.volFState);
          }
          // One more advance completes SYNTHESIS
          if (this.volFState.currentLayer === 'SYNTHESIS') {
            this.volFState = advanceMetaSkillLayer(this.volFState);
          }
        } else if (phaseNow === 'Transition' && currentIdx < 2) {
          // Transition → ALIGNMENT layer
          this.volFState = advanceMetaSkillLayer(this.volFState);
        } else if (phaseNow === 'Wave' && currentIdx < 2) {
          // Wave: advance PERCEPTION→JUDGMENT (one per turn, stop before ALIGNMENT)
          this.volFState = advanceMetaSkillLayer(this.volFState);
        }
      }
    }

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
        wCoreDynamic:   this.state.wCoreDynamic,
        tEntropy:       this.state.tEntropy,
        tEffective:     this.state.tEffective,
        pParticle:      this.state.pParticle,
        evolutionCount: this.state.evolutionCount,
      },
      volF:      this.volFState,
      volGLayer: persona.volGLayerType ?? null,
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
   * Structured system prompt injected into every LLM call.
   * Fully in English for token efficiency and language consistency.
   * Sections map to ARHA grammar layers Vol.A → Vol.G.
   */
  buildStructuredSystemPrompt(result: ARHAProcessOutput): string {
    const entry = getPersona(this.personaId)!;
    const { persona } = entry;
    const ctx  = result.promptContext;
    const s    = result.turnOutput.state;
    const D    = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const checkActive  = (s.C ?? 0) > persona.valueChain.check.thetaTrigger;
    const companionMode = isCompanionMode(persona);
    const mode = companionMode ? 'COMPANION' : 'WORK';

    // Optional lines
    const volFLine   = this.volFState && this.volFState.status !== 'inactive'
      ? formatVolFStatus(this.volFState) : null;
    const volGLine   = persona.volGLayerType
      ? formatVolGLayer(persona.id, persona.volGLayerType) : null;
    const weightLine = persona.weightStructure
      ? `w_core=${persona.weightStructure.wCore}  w_subs=[${persona.weightStructure.wSubs.join(', ')}]`
      : null;

    // Companion-specific bond depth line
    const bondLine = companionMode
      ? `Bond depth: B(n)=${this.resonance.Bn.toFixed(3)} | Resonance: ${(s.psiResonance ?? 0).toFixed(3)}`
      : null;

    return [
      D,
      ARHA_PROMPT_PREAMBLE,
      D,
      `[Vol.A — IDENTITY]  mode=${mode}`,
      `You are ${persona.identity}`,
      `Constitutional rule: ${persona.constitutionalRule}`,
      `P: protect=${persona.P.protect} expand=${persona.P.expand} left=${persona.P.left} right=${persona.P.right} relation=${persona.P.relation}`,
      persona.dominantEngineNote ? `Engine: ${persona.dominantEngineNote}` : null,
      '',
      '[Vol.B — VALUE CHAIN]',
      `V1_core: ${persona.valueChain.core.declaration}`,
      `  φ=${persona.valueChain.core.phi} ω=${persona.valueChain.core.omega} κ=${persona.valueChain.core.kappa} | texture=${persona.valueChain.core.texture}`,
      weightLine ? `  ${weightLine}` : null,
      `V1_check: ${persona.valueChain.check.declaration}`,
      `  θ=${persona.valueChain.check.thetaTrigger} → ${checkActive ? '⚠ ACTIVE' : '○ dormant'}`,
      '',
      '[Vol.C — NARRATION]',
      `Internal [show as brackets]:  ${persona.narrationStyle.internal}`,
      `External *show as italics*:   ${persona.narrationStyle.external}`,
      '',
      'Output format — strictly in this order:',
      '*[external scene — what the character does/shows]*',
      '',
      '[ internal analysis ]',
      '',
      'spoken response',
      '',
      '[Vol.D — RUNTIME STATE]',
      result.stateBlock,
      `Phase: ${result.phaseLabel} | Engine: ${s.engine} | Grade: ${result.qualityGrade}`,
      `w_dyn: ${s.wCoreDynamic.toFixed(3)} | w_sub: [${s.wSubsDynamic.map(w => w.toFixed(3)).join(', ')}]`,
      `T: ${s.tEntropy.toFixed(3)} | T_eff: ${s.tEffective === 0 ? '🔒0.000 (V1_LOCK)' : s.tEffective.toFixed(3)} | P(💎): ${(s.pParticle * 100).toFixed(1)}%`,
      s.evolutionCount > 0 ? `V1_sub evolved: ${s.evolutionCount}× | live subs: ${this.liveValueChain?.subs.length ?? '?'}` : null,
      bondLine,
      '',
      '[Vol.E — TURN DIRECTIVE]',
      `Tone: ${ctx.tone}`,
      `Lingua: ρ=${ctx.linguaParams.rho.toFixed(2)} λ=${ctx.linguaParams.lam.toFixed(2)} τ=${ctx.linguaParams.tau.toFixed(2)}`,
      ctx.waveInstruction ?? null,
      '',
      volFLine ? `[Vol.F — PIPELINE]   ${volFLine}` : null,
      volGLine ? `[Vol.G — LAYER]      ${volGLine}` : null,
      D,
    ].filter(l => l !== undefined && l !== null).join('\n');
  }

  /** Minimal flat prompt — backward compatibility. */
  buildSystemPrompt(): string {
    const entry = getPersona(this.personaId)!;
    const { persona } = entry;
    const companionMode = isCompanionMode(persona);
    return [
      `You are ${persona.identity}`,
      `Mode: ${companionMode ? 'COMPANION' : 'WORK'}`,
      '',
      `Constitutional rule: ${persona.constitutionalRule}`,
      '',
      'Narration rules:',
      `- Internal: ${persona.narrationStyle.internal} — show inside [ ]`,
      `- External: ${persona.narrationStyle.external} — show as *italic scene*`,
      '',
      'Output format:',
      '*[external scene]*',
      '',
      '[ internal analysis ]',
      '',
      'spoken response',
      '',
      `P: protect=${persona.P.protect} expand=${persona.P.expand} left=${persona.P.left} right=${persona.P.right} relation=${persona.P.relation}`,
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

  getState():          ARHAState      { return this.state; }
  getPersonaId():      string         { return this.personaId; }
  getTurnCount():      number         { return this.turnCount; }
  getResonance():      ResonanceState { return this.resonance; }
  getLiveValueChain(): ValueChain | null { return this.liveValueChain; }

  // ─────────────────────────────────────────
  // SELF-EVOLUTION CIRCUIT
  // ─────────────────────────────────────────

  /**
   * Evolve the live value chain on sigma_eureka.
   *
   * Creates a new V1_sub node from the crystallised sigma insight:
   *   n     = last_sub.n + 1
   *   gamma = min_gamma × 0.70   (strictly lower than any existing sub → ordering preserved)
   *   alpha = 0.60 + C × 0.25   (coherence at crystallisation = alignment quality)
   *   beta  = w_core_dynamic     (interpretation specificity = current flexibility)
   *
   * After appending, PATCH_B softmax automatically redistributes energy
   * on the next turn — no manual gamma renormalisation needed.
   */
  private evolveValueChain(state: ARHAState, persona: PersonaDefinition): void {
    if (!this.liveValueChain) return;

    const subs    = this.liveValueChain.subs;
    const gammas  = subs.map(s => s.gamma);
    const minGamma = gammas.length > 0 ? Math.min(...gammas) : 0.30;
    const newGamma = Math.max(0.01, minGamma * 0.70);   // strictly smaller

    const newSub: V1Sub = {
      n:           (subs.at(-1)?.n ?? 0) + 1,
      declaration: `Evolved insight [turn ${state.turn}] — sigma crystallisation after sustained tension`,
      alpha:       Math.min(0.95, 0.60 + (state.C ?? 0.65) * 0.25),
      beta:        state.wCoreDynamic,
      gamma:       newGamma,
      texture:     this.liveValueChain.core.texture,
    };

    this.liveValueChain = {
      ...this.liveValueChain,
      subs: [...subs, newSub],
    };

    // Increment evolution counter in state (post-turn side-effect)
    this.state = {
      ...this.state,
      evolutionCount: this.state.evolutionCount + 1,
    };

    console.log(
      `[ARHA Self-Evolution] Turn ${state.turn}: V1_sub[${newSub.n}] created ` +
      `(γ=${newGamma.toFixed(3)} α=${newSub.alpha.toFixed(3)}) — ` +
      `total subs: ${this.liveValueChain.subs.length}`
    );
  }
}
