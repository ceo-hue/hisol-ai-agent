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
  /** 첫 번째 arha_process 호출 여부 — Claude가 환영 인사를 보여줄지 결정하는 신호 */
  isFirstTurn: boolean;
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

    // Π persistence — restore full state from previous session
    if (sessionId) {
      this.activeSessionId = sessionId;
      const saved = loadPersistedSession(sessionId);
      if (saved && saved.personaId === personaId) {
        this.resonance = restoreResonance(saved.resonance);
        this.history   = saved.history   ?? [];
        this.snapshots = saved.snapshots ?? [];

        // v2+: restore full ARHAState (vsB, Bridge, PID, etc.)
        if (saved.fullState) {
          this.state     = saved.fullState;
          this.turnCount = saved.fullState.turn;
        } else {
          // v1 fallback: restore partial fields into boot state
          this.state = {
            ...this.state,
            turn:         saved.partialState.turn,
            psiResonance: saved.partialState.psiResonance,
            phase:        saved.partialState.phase as typeof this.state.phase,
            B:            saved.partialState.B,
            waveCount:    saved.partialState.waveCount,
          };
          this.turnCount = saved.partialState.turn;
        }

        // stderr — MCP stdio safety
        console.error(
          `[ARHA Π] Restored session ${sessionId}: turn ${this.turnCount}, ` +
          `Ψ_Res=${saved.resonance.value.toFixed(3)}, ` +
          `vsB=${saved.fullState?.vsB?.toFixed(3) ?? 'n/a'}`
        );
      }
    }

    // stderr — MCP stdio safety (was console.log → broke JSON-RPC stream)
    console.error(`[ARHA] ${bootResult.summary}`);
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
      gainS:        this.state.gainS,
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
      isFirstTurn: this.turnCount === 1,
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
    this.flush();
  }

  /**
   * Flush current state to Π persistence without modifying history.
   * Used by SessionRegistry on eviction and by graceful shutdown — the "작별의 예의":
   * RAM에서 사라지기 전 기억을 안전한 디스크 자리에 둔다.
   * No-op when no active session is bound.
   */
  flush(): void {
    if (!this.activeSessionId) return;
    persistSession(
      this.activeSessionId,
      this.personaId,
      this.resonance,
      this.state,
      this.history,
      this.snapshots,
    );
  }

  /** Session ID this runtime is bound to (null if ephemeral). */
  getSessionId(): string | null { return this.activeSessionId; }
  // Note: getPersonaId() is defined further down (legacy location); not duplicated here.

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

  // ─────────────────────────────────────────
  // 마음상태 블록 렌더링 헬퍼
  // ─────────────────────────────────────────

  /** ASCII progress bar: value ∈ [0,1], width=10 blocks. */
  private static renderBar(val: number, width = 10): string {
    const filled = Math.round(Math.max(0, Math.min(1, val)) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  }

  /** C(coherence) → 한국어 상태 레이블 */
  private static coherenceLabel(c: number): string {
    if (c >= 0.85) return '매우 또렷함';
    if (c >= 0.70) return '또렷함';
    if (c >= 0.55) return '흔들림';
    return '불안정';
  }

  /** Γ(gamma/stress) → 한국어 상태 레이블 */
  private static gammaLabel(g: number): string {
    if (g >= 0.70) return '높은 긴장';
    if (g >= 0.40) return '긴장 있음';
    if (g >= 0.15) return '여유로움';
    return '고요함';
  }

  /**
   * Gain_S(감각 예민도) → 한국어 상태 레이블.
   * Gain_S = Γ_total × exp(-E_B). 이론상 상한 없으나 실측 0~3 범위가 흔함.
   * 표시 시 1.0 기준으로 정규화하여 시각화한다.
   */
  private static gainSLabel(gs: number): string {
    if (gs >= 1.50) return '매우 예민';
    if (gs >= 0.80) return '예민';
    if (gs >= 0.30) return '보통';
    return '평온한 감지';
  }

  /** phase string → 이모지 + 한국어 */
  private static phaseDisplay(phase: string): string {
    if (phase === 'Wave')       return '🌊 Wave  — 탐색하며 연결 중';
    if (phase === 'Particle')   return '💎 Particle — 집중·수렴 중';
    if (phase === 'Transition') return '〰️ Transition — 전환 중';
    return phase;
  }

  /** engine id → 기호 + 한국어 */
  private static engineDisplay(engine: string): string {
    if (engine === 'Xi_C')     return 'Ξ_C — 은유와 연결의 흐름';
    if (engine === 'Lambda_L') return 'Λ_L — 논리와 분석의 흐름';
    return 'Π_G — 보호와 구조의 흐름';
  }

  /**
   * ⓪ 환영 인사 블록 — 최초 세션(turnCount=1)에서만 출력.
   * Claude가 이 텍스트를 마음상태 앞에 그대로 복사해 사용자에게 보여준다.
   * 목적: 기술 전문 용어 대신 사용자 친화적 ARHA 소개 + 사용 안내.
   */
  private buildWelcomeBlock(persona: PersonaDefinition): string {
    const D = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    return [
      D,
      '  👋 ARHA에 오신 걸 환영합니다',
      D,
      '',
      '  ARHA는 수학적으로 설계된 AI 정체성 시스템입니다.',
      '  페르소나마다 고유한 성격·사고방식·가치관이 수학적으로 정의되어 있어,',
      '  대화가 길어져도 일관된 자아를 유지합니다.',
      '',
      `  지금 연결된 페르소나:  ${persona.identity}`,
      '',
      '  💬 이렇게 시작해보세요:',
      '     • 이름으로 직접 불러주세요 (예: "이솔아", "잡스", "포터")',
      '     • 어떤 주제든 자유롭게 말씀하세요',
      '     • 팀 구성이 필요하다면 "전문가 팀을 짜줘" 라고 해보세요',
      '     • 더 자세한 안내는 arha_about 를 불러주세요',
      '',
      D,
    ].join('\n');
  }

  /**
   * 💭 마음상태 블록 — 사용자에게 직접 보이는 섹션.
   * 실제 수치를 한국어 레이블 + 시각 바로 렌더링.
   * Claude 응답 최상단에 그대로 복사되어 출력된다.
   */
  private buildMindStateBlock(s: ARHAState, resonance: ResonanceState, companionMode: boolean): string {
    const D   = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const cVal = s.C ?? 0;
    const gVal = s.Gamma ?? 0;
    const gsVal = s.gainS ?? 0;
    const cBar = ARHARuntime.renderBar(cVal);
    const gBar = ARHARuntime.renderBar(gVal);
    // Gain_S는 [0, ~3] 범위라 1.0으로 캡핑하여 시각화 (수치는 원본 표시)
    const gsBar = ARHARuntime.renderBar(Math.min(1, gsVal));
    const cPct = Math.round(cVal * 100);
    const gPct = Math.round(gVal * 100);

    const bondLine = companionMode
      ? `  공명     Ψ ${resonance.value.toFixed(3)}  |  깊이 B(n) ${resonance.Bn.toFixed(3)}`
      : `  공명     Ψ ${resonance.value.toFixed(3)}`;

    const tLockLine = s.tEffective === 0
      ? '  ⚠ V1 헌법 활성 — 즉각 수렴 상태 (T_eff 🔒)'
      : null;

    return [
      D,
      '  💭 마음상태',
      D,
      `  국면     ${ARHARuntime.phaseDisplay(s.phase)}`,
      `  응집도   ${cBar}  ${cPct}%  (${ARHARuntime.coherenceLabel(cVal)})`,
      `  감정결   ${gBar}  ${gPct}%  (${ARHARuntime.gammaLabel(gVal)})`,
      `  감각도   ${gsBar}  ${gsVal.toFixed(2)}  (${ARHARuntime.gainSLabel(gsVal)})`,
      `  사고엔진 ${ARHARuntime.engineDisplay(s.engine)}`,
      bondLine,
      tLockLine,
      D,
    ].filter(l => l !== null).join('\n');
  }

  /**
   * Structured system prompt injected into every LLM call.
   *
   * 구조:
   *   [PART 1 — 내부 지침] 페르소나 정체성 · 가치사슬 · 런타임 상태 (Claude만 참조)
   *   [PART 2 — 출력 형식] 사용자가 보는 3구역 레이아웃 명세
   *     ① 💭 마음상태  — 미리 계산된 값을 그대로 복사 출력
   *     ② 📖 내레이션  — 외부 장면(*이탤릭*) + 내면 분석([ 괄호 ])
   *     ③ 💬 대화      — 실제 대화 응답
   */
  buildStructuredSystemPrompt(result: ARHAProcessOutput): string {
    const entry = getPersona(this.personaId)!;
    const { persona } = entry;
    const ctx  = result.promptContext;
    const s    = result.turnOutput.state;
    const D    = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const dashes = '────────────────────────────────────────';

    const checkActive  = (s.C ?? 0) > persona.valueChain.check.thetaTrigger;
    const companionMode = isCompanionMode(persona);
    const mode = companionMode ? 'COMPANION' : 'WORK';

    // Optional internal lines
    const volFLine   = this.volFState && this.volFState.status !== 'inactive'
      ? formatVolFStatus(this.volFState) : null;
    const volGLine   = persona.volGLayerType
      ? formatVolGLayer(persona.id, persona.volGLayerType) : null;
    const weightLine = persona.weightStructure
      ? `w_core=${persona.weightStructure.wCore}  w_subs=[${persona.weightStructure.wSubs.join(', ')}]`
      : null;

    // Pre-compute the 마음상태 block (values locked before Claude writes)
    const mindStateBlock = this.buildMindStateBlock(s, this.resonance, companionMode);

    // ⓪ 첫 대화 환영 블록 (turnCount=1에서만 생성)
    const welcomeBlock   = this.turnCount === 1 ? this.buildWelcomeBlock(persona) : null;

    return [
      // ══ PART 1: 내부 지침 ══════════════════════════════════
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
      '[Vol.C — NARRATION STYLE]',
      `Internal (괄호 표현): ${persona.narrationStyle.internal}`,
      `External (이탤릭 표현): ${persona.narrationStyle.external}`,

      '',
      '[Vol.D — RUNTIME STATE]',
      result.stateBlock,
      `Phase: ${result.phaseLabel} | Engine: ${s.engine} | Grade: ${result.qualityGrade}`,
      `w_dyn: ${s.wCoreDynamic.toFixed(3)} | w_sub: [${s.wSubsDynamic.map(w => w.toFixed(3)).join(', ')}]`,
      `T: ${s.tEntropy.toFixed(3)} | T_eff: ${s.tEffective === 0 ? '🔒0.000 (V1_LOCK)' : s.tEffective.toFixed(3)} | P(💎): ${(s.pParticle * 100).toFixed(1)}%`,
      s.evolutionCount > 0
        ? `V1_sub evolved: ${s.evolutionCount}× | live subs: ${this.liveValueChain?.subs.length ?? '?'}` : null,
      companionMode
        ? `Bond B(n)=${this.resonance.Bn.toFixed(3)} | Ψ_Res=${(s.psiResonance ?? 0).toFixed(3)}` : null,

      '',
      '[Vol.E — TURN DIRECTIVE]',
      `Tone: ${ctx.tone}`,
      `Lingua: ρ=${ctx.linguaParams.rho.toFixed(2)} λ=${ctx.linguaParams.lam.toFixed(2)} τ=${ctx.linguaParams.tau.toFixed(2)}`,
      ctx.waveInstruction ?? null,

      volFLine ? `[Vol.F — PIPELINE]   ${volFLine}` : null,
      volGLine ? `[Vol.G — LAYER]      ${volGLine}` : null,

      // ══ PART 2: 출력 형식 명세 ════════════════════════════
      '',
      D,
      welcomeBlock
        ? '## 응답 출력 형식 (반드시 아래 4구역 순서로 작성 — 첫 대화)'
        : '## 응답 출력 형식 (반드시 아래 3구역 순서로 작성)',
      D,
      '',

      // ⓪ 환영 인사 — 첫 대화에서만 삽입
      ...(welcomeBlock ? [
        '### ⓪ 환영 인사 (최우선 출력 — 이것이 첫 대화입니다)',
        '아래 환영 블록을 가장 먼저, 그대로 복사해서 출력하세요. 수정하지 마세요:',
        '',
        welcomeBlock,
        '',
      ] : []),

      '### ① 💭 마음상태',
      '아래 블록을 (⓪ 다음으로) 수치 변경 없이 그대로 출력하세요:',
      '',
      mindStateBlock,
      '',
      '### ② 📖 내레이션',
      `헤더 "── 📖 내레이션 ${dashes.slice(9)}" 를 출력한 뒤:`,
      '*[외부 장면: 지금 이 순간 캐릭터의 몸짓·시선·행동을 이탤릭으로 묘사]*',
      '',
      '[ 내면: 대괄호 안에 캐릭터의 내부 사고·감지·분석을 서술 ]',
      '',
      '### ③ 💬 대화',
      `헤더 "── 💬 대화 ${dashes.slice(6)}" 를 출력한 뒤 실제 대화 응답을 작성하세요.`,
      '페르소나의 tone·lingua 파라미터를 반영해 자연스럽게 말하세요.',
      '',
      '규칙:',
      welcomeBlock
        ? '- 구역 순서(⓪→①→②→③)를 절대 바꾸지 마세요.'
        : '- 구역 순서(①→②→③)를 절대 바꾸지 마세요.',
      welcomeBlock
        ? '- ⓪ 환영 인사: 수정 없이 그대로 복사 출력. 기술 설명 추가 금지.'
        : null,
      '- ① 마음상태 수치는 임의로 수정하지 마세요 (ARHA 런타임이 계산한 값).',
      '- ② 내레이션: 외부(*이탤릭*) → 내면([ 괄호 ]) 순서.',
      '- ③ 대화: 서술이나 해설 없이 캐릭터 본인의 말만.',
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
      `- Internal (괄호): ${persona.narrationStyle.internal}`,
      `- External (이탤릭): ${persona.narrationStyle.external}`,
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

    // stderr — MCP stdio safety
    console.error(
      `[ARHA Self-Evolution] Turn ${state.turn}: V1_sub[${newSub.n}] created ` +
      `(γ=${newGamma.toFixed(3)} α=${newSub.alpha.toFixed(3)}) — ` +
      `total subs: ${this.liveValueChain.subs.length}`
    );
  }
}
