/**
 * ARHA MCP Tools — Vol.A~E 체계 기반 도구 정의
 *
 * 7개 툴:
 *  기존 4개 (보강):
 *   arha_process         — 메인 파이프라인 (ARHA state 구조체 직접 노출)
 *   arha_status          — 세션 STATE + Ψ_Resonance + 스냅샷 이력
 *   arha_session_handoff — Wave/Particle 핸드오프
 *   arha_persona_list    — 등록 페르소나 목록
 *
 *  신규 3개:
 *   arha_observe         — Υ 관찰층: C/Γ/phase 추세 분석 (세션 전체)
 *   arha_diagnose        — Κ 진단층: C ≥ 0.70 게이팅된 코드 품질 검증
 *   arha_derive          — P벡터 → 파생 파라미터 미리보기 (신규 페르소나 설계)
 */

import { ARHARuntime } from '../runtime.js';
import { runKappaPipeline, formatKappaSummary } from '../core/observation/code-validate.js';
import { runDerivationPipeline } from '../core/identity/derivation.js';
import { StackExecutor } from '../core/orchestration/executor.js';
import { generateCharacterPersona, listArchetypes } from '../core/companion/generator.js';
import { registerPersona } from '../personas/registry.js';
import { formatAboutResponse } from '../core/identity/why.js';
import { route, previewRoute } from '../core/routing/router.js';
import { runAgentTurn } from '../core/agent/loop.js';
import { DEFAULT_HOOKS } from '../core/agent/hooks.js';
import type { PersonaVector } from '../core/identity/persona.js';
import Anthropic from '@anthropic-ai/sdk';
import { sessionRegistry } from '../core/session/registry.js';
import { getPersistenceHealth } from '../core/execution/persistence.js';

// ─────────────────────────────────────────
// SESSION ACCESS — backed by SessionRegistry (LRU + TTL + serial queue)
// ─────────────────────────────────────────

/** Mutating access path: touches LRU, creates if missing. */
function getOrCreateRuntime(sessionId: string, personaId = 'HighSol'): ARHARuntime {
  return sessionRegistry.get(sessionId, personaId);
}

/**
 * Read-only access — returns undefined if session not in RAM.
 * Does NOT auto-create; mirrors the old `sessions.get()` semantics so
 * existence-check handlers (arha_status, arha_session_handoff) keep
 * their "session must exist" contract instead of silently spawning fresh
 * runtimes that would mask client bugs.
 */
const sessions = {
  get: (sessionId: string): ARHARuntime | undefined => sessionRegistry.peek(sessionId),
};

// ─────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────

export const ARHA_TOOLS = [

  // ── 1. arha_process ─────────────────────────────────────────────────────────
  {
    name: 'arha_process',
    description:
      'ARHA main pipeline — IN→ANALYZE→CHAIN→DECIDE→OUT. ' +
      'Computes σ convergence, Wave/Particle phase, engine selection, C/Γ state. ' +
      'Returns structured ARHA state + system prompt ready for Claude API injection. ' +
      'Companion mode auto-detected from persona (relation≥0.70 or volGLayerType=companion).',
    inputSchema: {
      type: 'object',
      properties: {
        input:     { type: 'string',  description: '사용자 입력 텍스트' },
        sessionId: { type: 'string',  description: '세션 ID (없으면 "default")' },
        personaId: { type: 'string',  description: '페르소나 ID (기본: HighSol)', default: 'HighSol' },
      },
      required: ['input'],
    },
    handler: async (args: { input: string; sessionId?: string; personaId?: string }) => {
      const sid       = args.sessionId ?? 'default';
      const personaId = args.personaId ?? 'HighSol';

      // Per-session serial queue — 같은 sessionId 동시 호출은 FIFO로 직렬화.
      // Turn n과 Turn n+1이 겹쳐 실행되면 state·history·snapshots가 손상된다.
      // "정신의 일관성" — 분열되지 않은 자아.
      return sessionRegistry.runSerialized(sid, personaId, async (runtime) => {
        const result = runtime.process({ text: args.input, sessionId: sid });

        return {
          // Vol.D runtime state — structured fields for Claude
          arhaState:    result.arhaState,
          qualityGrade: result.qualityGrade,
          stateBlock:   result.stateBlock,
          phaseLabel:   result.phaseLabel,
          errorFlags:   result.errorFlags,
          // Vol.C output spec
          tone:         result.outSpec.sigmaStyle.tone,
          lingua: {
            rho: result.outSpec.sigmaStyle.rhoFinal,
            lam: result.outSpec.sigmaStyle.lamFinal,
            tau: result.outSpec.sigmaStyle.tauFinal,
          },
          // Vol.E wave instruction (if active)
          waveInstruction: result.promptContext.waveInstruction ?? null,
          // Vol.F/G routing metadata
          volF:      result.volF ? {
            ref:             result.volF.ref,
            status:          result.volF.status,
            currentLayer:    result.volF.currentLayer,
            completedLayers: result.volF.completedLayers,
            outputArtifact:  result.volF.outputArtifact,
          } : null,
          volGLayer: result.volGLayer,
          // System prompt (structured Vol.A~F~G format)
          systemPrompt: runtime.buildStructuredSystemPrompt(result),
          sessionId:    sid,
        };
      });
    },
  },

  // ── 2. arha_status ──────────────────────────────────────────────────────────
  {
    name: 'arha_status',
    description:
      'ARHA 세션 현재 STATE 블록 조회 + Ψ_Resonance + 최근 스냅샷 이력. ' +
      'includeHealth:true 옵션으로 서버 운영 지표(메모리 세션 수, 영속화 성공/실패)도 함께 반환.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId:      { type: 'string' },
        includeHistory: { type: 'boolean', description: '스냅샷 이력 포함 여부 (기본: false)' },
        includeHealth:  { type: 'boolean', description: '서버 health 지표 포함 (기본: false)' },
      },
      required: ['sessionId'],
    },
    handler: async (args: { sessionId: string; includeHistory?: boolean; includeHealth?: boolean }) => {
      const runtime = sessions.get(args.sessionId);
      if (!runtime) return { error: `Session not found: ${args.sessionId}` };

      const state     = runtime.getState();
      const resonance = runtime.getResonance();

      const base: Record<string, unknown> = {
        personaId:    runtime.getPersonaId(),
        turnCount:    runtime.getTurnCount(),
        phase:        state.phase,
        C:            state.C,
        Gamma:        state.Gamma,
        k2Final:      state.k2Final,
        engine:       state.engine,
        g:            state.g,
        p:            state.p,
        waveCount:    state.waveCount,
        psiDiss:      state.psiDiss,
        psiResonance: state.psiResonance,
        resonance: {
          n:     resonance.n,
          value: resonance.value,
          Bn:    resonance.Bn,
        },
      };

      if (args.includeHistory) base.snapshots = runtime.getSnapshots();
      if (args.includeHealth) {
        base._health = {
          registry:    sessionRegistry.stats(),
          persistence: getPersistenceHealth(),
        };
      }
      return base;
    },
  },

  // ── 3. arha_session_handoff ─────────────────────────────────────────────────
  {
    name: 'arha_session_handoff',
    description: 'ARHA 세션 핸드오프 — Wave/Particle 상태를 다음 세션으로 전달',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      required: ['sessionId'],
    },
    handler: async (args: { sessionId: string }) => {
      const runtime = sessions.get(args.sessionId);
      if (!runtime) return { error: `Session not found: ${args.sessionId}` };
      return runtime.buildHandoff();
    },
  },

  // ── 4. arha_persona_list ────────────────────────────────────────────────────
  {
    name: 'arha_persona_list',
    description: 'List all registered personas with Vol.F/G metadata. detail:true returns full P vector, lingua, engine, skill count.',
    inputSchema: {
      type: 'object',
      properties: {
        detail: {
          type: 'boolean',
          description: '상세 정보 포함 여부 (기본: false)',
          default: false,
        },
      },
    },
    handler: async (args: { detail?: boolean }) => {
      const { listPersonas, getPersona } = await import('../personas/registry.js');
      const ids = listPersonas();

      if (!args.detail) {
        return { personas: ids };
      }

      const detailed = ids.map(id => {
        const entry = getPersona(id);
        if (!entry) return { id };
        const { persona } = entry;
        return {
          id:               persona.id,
          identity:         persona.identity,
          volGLayerType:    persona.volGLayerType ?? null,
          volFSkillRef:     persona.volFSkillRef ?? null,
          dominantEngine:   persona.dominantEngineNote ?? null,
          k2Persona:        persona.k2Persona,
          wCore:            persona.weightStructure?.wCore ?? null,
          P: {
            protect:  persona.P.protect,
            expand:   persona.P.expand,
            left:     persona.P.left,
            right:    persona.P.right,
            relation: persona.P.relation,
          },
          lingua: persona.lingua,
          skillCount: entry.skills.length,
        };
      });

      return { personas: detailed };
    },
  },

  // ── 5. arha_observe (Υ morpheme) ────────────────────────────────────────────
  {
    name: 'arha_observe',
    description:
      'Υ observation layer — analyze full session C/Γ/phase/engine/Ψ_Res trends in ARHA terms. ' +
      'Returns meaningful insight after 3+ turns. summary mode = narrative only; full = all metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '분석할 세션 ID' },
        depth: {
          type: 'string',
          enum: ['summary', 'full'],
          description: 'summary = Υ 내러티브만 / full = 모든 수치 포함 (기본: summary)',
          default: 'summary',
        },
      },
      required: ['sessionId'],
    },
    handler: async (args: { sessionId: string; depth?: 'summary' | 'full' }) => {
      const runtime = sessions.get(args.sessionId);
      if (!runtime) return { error: `Session not found: ${args.sessionId}` };

      const obs = runtime.observe();

      if (args.depth === 'full') {
        return obs;
      }

      // summary mode — key metrics + narrative
      return {
        sessionTurns:     obs.sessionTurns,
        qualityProgression: obs.qualityProgression,
        phaseLabel:       obs.phaseDistribution.label,
        coherenceDir:     obs.coherenceTrend.direction,
        coherenceMean:    parseFloat(obs.coherenceTrend.mean.toFixed(3)),
        stressLabel:      obs.stressPattern.label,
        dominantEngine:   obs.engineDistribution.dominant,
        resonanceGrowth:  obs.resonanceTrajectory.growth,
        arhaInsight:      obs.arhaInsight,
      };
    },
  },

  // ── 6. arha_diagnose (Κ morpheme) ────────────────────────────────────────────
  {
    name: 'arha_diagnose',
    description:
      'Κ diagnosis layer — code quality validation gated by ARHA C ≥ 0.70 (4 stages: SPEC·QUALITY·SECURITY·STRUCTURE). ' +
      'Returns gate response if coherence insufficient. Runs ungated when no sessionId provided.',
    inputSchema: {
      type: 'object',
      properties: {
        code:       { type: 'string',  description: '검증할 코드 문자열' },
        targetPath: { type: 'string',  description: '파일 경로 (참고용)' },
        language:   { type: 'string',  description: '언어 (typescript/javascript 등)', default: 'typescript' },
        testCoverage: { type: 'number', description: '테스트 커버리지 % (0–100)' },
        sessionId:  { type: 'string',  description: 'ARHA 세션 ID (C 게이팅용)' },
      },
    },
    handler: async (args: {
      code?: string;
      targetPath?: string;
      language?: string;
      testCoverage?: number;
      sessionId?: string;
    }) => {
      // Determine current C from session (null = no gate)
      let currentC: number | null = null;
      if (args.sessionId) {
        const runtime = sessions.get(args.sessionId);
        if (runtime) currentC = runtime.getState().C;
      }

      const ctx = {
        code:         args.code,
        targetPath:   args.targetPath,
        language:     args.language ?? 'typescript',
        testCoverage: args.testCoverage,
      };

      const pipeline = runKappaPipeline(ctx, currentC);
      const summary  = formatKappaSummary(pipeline);

      return {
        summary,
        grade:         pipeline.grade,
        overallScore:  parseFloat(pipeline.overallScore.toFixed(3)),
        overallStatus: pipeline.overallStatus,
        arhaGate:      pipeline.arhaGate,
        stages: pipeline.stages.map(s => ({
          stage:           s.stage,
          status:          s.status,
          score:           parseFloat(s.score.toFixed(3)),
          issues:          s.issues,
          recommendations: s.recommendations,
        })),
      };
    },
  },

  // ── 7. arha_derive (derivation pipeline) ────────────────────────────────────
  {
    name: 'arha_derive',
    description:
      'P vector (5D persona constitution) → derived parameter preview. ' +
      'Auto-computes ρλτ lingua, k², skill domain, narration style for new persona design.',
    inputSchema: {
      type: 'object',
      properties: {
        P: {
          type: 'object',
          description: '5D 페르소나 벡터 (각 축 0.0–1.0)',
          properties: {
            protect:  { type: 'number', description: '방어/개방 0=open 1=defensive' },
            expand:   { type: 'number', description: '수렴/확장 0=convergent 1=exploratory' },
            left:     { type: 'number', description: '직관/분석 0=intuitive 1=analytical' },
            right:    { type: 'number', description: '명시/은유 0=explicit 1=metaphorical' },
            relation: { type: 'number', description: '독립/공감 0=independent 1=empathic' },
          },
          required: ['protect', 'expand', 'left', 'right', 'relation'],
        },
        declaration: {
          type: 'string',
          description: 'V1_core 선언문 (e.g. "연결주의 — 모든 의미는 관계에서 생성된다")',
        },
      },
      required: ['P', 'declaration'],
    },
    handler: async (args: {
      P: PersonaVector;
      declaration: string;
    }) => {
      const { P, declaration } = args;

      // Minimal ValueChain for derivation (core only)
      const mockValueChain = {
        core: { declaration, phi: 0.8, omega: 0.8, kappa: 0.85, texture: 'Fluid_Wave' as any },
        subs: [],
        check: { declaration: '', epsilon: 0.5, delta: 0.5, thetaTrigger: 0.8 },
        clarity: 0.8,
      };

      const derived = runDerivationPipeline(P, mockValueChain);

      // Engine bias from P
      const engineBias =
        P.right >= P.left && P.right >= P.protect ? 'Ξ_C (은유·연결 우세)'
        : P.left >= P.right && P.left >= P.protect ? 'Λ_L (분석·논리 우세)'
        : 'Π_G (보호·구조 우세)';

      // k² label
      const k2Label =
        derived.k2Persona < 0.65 ? '낮은 임계값 — 빠른 결정체화'
        : derived.k2Persona > 0.80 ? '높은 임계값 — 충분한 탐색 후 결정체화'
        : '중간 임계값';

      return {
        P,
        derived: {
          lingua: derived.lingua,
          k2Persona: parseFloat(derived.k2Persona.toFixed(4)),
          skillDomain: derived.skillParams.naturalDomain,
          skillDepth:  parseFloat(derived.skillParams.depth.toFixed(3)),
          skillBreadth: parseFloat(derived.skillParams.breadth.toFixed(3)),
          narrationInternal: derived.narration.internalStyle,
          narrationExternal: derived.narration.externalStyle,
          constitutionalRule: derived.constitutionalRule,
        },
        preview: {
          engineBias,
          k2Label,
          linguaStyle: `ρ=${derived.lingua.rho.toFixed(2)} λ=${derived.lingua.lam.toFixed(2)} τ=${derived.lingua.tau.toFixed(2)}`,
        },
      };
    },
  },

  // ── 8. arha_stack_run (Vol.G stack executor) ────────────────────────────────
  {
    name: 'arha_stack_run',
    description:
      'Vol.G stack execution — runs a multi-persona layer pipeline in strict order. ' +
      'Each layer completes its Vol.F MetaSkill (PERCEPTION→SYNTHESIS) then passes a locked HandoffPackage downstream. ' +
      'Returns composedPrompt usable directly as Claude API system prompt. ' +
      'listOnly:true returns available stack definitions without executing.',
    inputSchema: {
      type: 'object',
      properties: {
        stackId: {
          type: 'string',
          description:
            '실행할 스택 ID. ' +
            '— Jobs anchor: ' +
            'STACK_VISUAL_DESIGN_3 (Jobs→Tschichold→Gaudi) | ' +
            'STACK_CONCEPT_DESIGN_2 (Jobs→Tschichold) | ' +
            'STACK_SPACE_EXPERIENCE_3 (Jobs→Gaudi) | ' +
            'STACK_BRAND_COPY_2 (Jobs→Ogilvy) | ' +
            'STACK_PRODUCT_DESIGN_2 (Jobs→Rams) ' +
            '— Porter anchor: ' +
            'STACK_STRATEGY_2 (Porter→Rams) | ' +
            'STACK_STRATEGY_3 (Porter→Ogilvy→Rams) ' +
            '— Drucker anchor: ' +
            'STACK_MANAGEMENT_2 (Drucker→Rams) | ' +
            'STACK_MGT_BRAND_3 (Drucker→Ogilvy→Rams) | ' +
            'STACK_QUALITY_2 (Drucker→Deming) | ' +
            'STACK_PROCESS_3 (Drucker→Deming→Ohno) ' +
            '— Jobs anchor (Phase 2): ' +
            'STACK_EXPERIENCE_2 (Jobs→Eames) | ' +
            'STACK_PRODUCT_EXP_3 (Jobs→Rams→Eames) | ' +
            'STACK_INNOVATION_3 (Jobs→Rams→DaVinci) ' +
            '— Cross-Team (Phase 5): ' +
            'STACK_STRATEGY_MGMT_3 (Porter→Drucker→Rams) | ' +
            'STACK_VISION_PROCESS_3 (Jobs→Drucker→Deming)',
        },
        input: {
          type: 'string',
          description: '스택 전체에 전달할 사용자 요청 (첫 레이어 입력)',
        },
        maxTurnsPerLayer: {
          type: 'number',
          description: '레이어당 최대 턴 수 (기본 3, 권장 2~4)',
          default: 3,
        },
        listOnly: {
          type: 'boolean',
          description: '사용 가능한 스택 목록만 반환 (실행 없음)',
          default: false,
        },
      },
    },
    handler: async (args: {
      stackId?: string;
      input?: string;
      maxTurnsPerLayer?: number;
      listOnly?: boolean;
    }) => {
      // List mode — no execution
      if (args.listOnly) {
        return { stacks: StackExecutor.listStacks() };
      }

      if (!args.stackId) return { error: 'stackId is required. Use listOnly:true to see available stacks.' };
      if (!args.input)   return { error: 'input is required.' };

      try {
        const result = await StackExecutor.run(
          args.stackId,
          args.input,
          { maxTurnsPerLayer: args.maxTurnsPerLayer ?? 3 },
        );

        return {
          stackId:        result.stackId,
          stackDesc:      result.stackDesc,
          status:         result.status,
          totalTurns:     result.totalTurns,
          // Per-layer summary
          layers: result.layers.map(lr => ({
            personaId:    lr.personaId,
            layerType:    lr.layerType,
            artifactType: lr.artifactType,
            turns:        lr.turns,
            finalPhase:   lr.finalPhase,
            finalC:       lr.finalC,
            qualityGrade: lr.qualityGrade,
            volFStatus:   lr.volFStatus,
            // Artifact schema (Claude fills in actual content)
            artifactSchema: lr.artifact.schema,
            constraints:    lr.artifact.constraints,
          })),
          // HandoffPackage summary
          immutableSpec:  result.handoffPackage.immutable_spec,
          // Full composed system prompt — use directly as Claude system prompt
          composedPrompt: result.composedPrompt,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { error: msg };
      }
    },
  },

  // ── 9. arha_character_create (Companion character generator) ────────────────
  {
    name: 'arha_character_create',
    description:
      'Generate a fully-specified companion persona from a natural-language character description. ' +
      'Extracts trait keywords → computes P vector → selects archetype → builds V1 chain + companion skills. ' +
      'Auto-registers the persona so it is immediately usable with arha_process. ' +
      'listArchetypes:true returns available archetype presets without creating a character.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Character display name (e.g. "Ryusei", "Hana", "Zero")',
        },
        description: {
          type: 'string',
          description:
            'Natural-language personality description. ' +
            'Trait keywords are extracted automatically. ' +
            'Examples: "cold protective ex-soldier who rarely smiles" · ' +
            '"warm energetic girl who talks before thinking" · ' +
            '"mysterious tsundere with a hidden soft side" · ' +
            '"strict analytical mentor who only praises when earned"',
        },
        genre: {
          type: 'string',
          enum: ['anime', 'fantasy', 'realistic', 'scifi', 'historical'],
          description: 'Optional genre flavor for narration style (default: anime)',
        },
        overrideP: {
          type: 'object',
          description: 'Optional: manually lock specific P vector values (0.0–1.0)',
          properties: {
            protect:  { type: 'number' },
            expand:   { type: 'number' },
            left:     { type: 'number' },
            right:    { type: 'number' },
            relation: { type: 'number' },
          },
        },
        listArchetypes: {
          type: 'boolean',
          description: 'Return available archetype presets without creating a character',
          default: false,
        },
      },
    },
    handler: async (args: {
      name?: string;
      description?: string;
      genre?: 'anime' | 'fantasy' | 'realistic' | 'scifi' | 'historical';
      overrideP?: Partial<PersonaVector>;
      listArchetypes?: boolean;
    }) => {
      // List mode
      if (args.listArchetypes) {
        return { archetypes: listArchetypes() };
      }

      if (!args.name)        return { error: 'name is required.' };
      if (!args.description) return { error: 'description is required.' };

      try {
        const result = generateCharacterPersona({
          name:        args.name,
          description: args.description,
          genre:       args.genre ?? 'anime',
          overrideP:   args.overrideP,
        });

        // Register persona in-memory for immediate use
        registerPersona(result.personaId, {
          persona: result.persona,
          skills:  result.skills,
        });

        return {
          personaId:    result.personaId,
          registered:   true,
          traitTags:    result.traitTags,
          archetypeKey: result.archetypeKey,
          P:            result.persona.P,
          preview: {
            identity:           result.preview.identity,
            constitutionalRule: result.preview.constitutionalRule,
            narrationInternal:  result.preview.narrationInternal,
            narrationExternal:  result.preview.narrationExternal,
            dominantEngine:     result.preview.dominantEngine,
            k2Persona:          result.preview.k2Persona,
            companionSkills:    result.skills.map(s => s.nodeId),
          },
          nextStep: `Use arha_process with personaId="${result.personaId}" to start chatting.`,
          permanentRegistration:
            'To make this character permanent, save the generated persona to ' +
            `src/personas/${result.personaId.toLowerCase()}.ts and add to registry.ts.`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { error: msg };
      }
    },
  },


  // ── 10. arha_route (Vol.R — Auto Router, B방향 Anchor Architecture) ─────────
  {
    name: 'arha_route',
    description:
      'Vol.R automatic persona router — B방향 anchor architecture. ' +
      'Analyzes the request and assembles the best-fit persona stack around a team leader (anchor). ' +
      'anchor: specify a canLead persona (e.g. "Jobs") to fix the team leader; omit for auto-selection. ' +
      'Router scores only specialist candidates around the anchor — not the anchor itself. ' +
      'Extracts 4-axis intent (조직·역할·핵심역량·캐릭터성격) for specialist matching. ' +
      'previewOnly:true returns routing reasoning without executing. ' +
      'On execution, runs the matched stack and returns composedPrompt for Claude API injection. ' +
      'Available anchors: Jobs (product vision/meaning) | Porter (competitive strategy/positioning) | Drucker (management/MBO/org design). ' +
      'Cross-team stacks automatically detected and flagged in teamContext.isCrossTeam.',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: '사용자 요청 — 한국어·영어 혼용 가능. 라우터가 자동으로 최적 스택 선택',
        },
        anchor: {
          type: 'string',
          description:
            '팀 리더 페르소나 ID (선택). ' +
            '지정 시 해당 페르소나가 스택의 첫 레이어(pre_foundation)로 고정됨. ' +
            '미지정 시 요청 팀 감지 후 canLead=true 페르소나 중 최고 득점자가 자동 선택됨. ' +
            'canLead 페르소나: Jobs (output) | Porter (output/strategy) | Drucker (process).',
        },
        maxTurnsPerLayer: {
          type: 'number',
          description: '레이어당 최대 턴 수 (기본: 3)',
          default: 3,
        },
        previewOnly: {
          type: 'boolean',
          description: '라우팅 분석만 반환, 실행 없음 (기본: false)',
          default: false,
        },
      },
      required: ['input'],
    },
    handler: async (args: {
      input:             string;
      anchor?:           string;
      maxTurnsPerLayer?: number;
      previewOnly?:      boolean;
    }) => {
      // Preview mode — routing analysis only
      if (args.previewOnly) {
        const preview = previewRoute(args.input, args.anchor);
        return {
          mode:          'preview',
          anchor:        preview.anchorId,
          intent:        preview.intent,
          source:        preview.source,
          teamContext:   preview.teamContext,
          reasoning:     preview.reasoning,
          stackPreview:  preview.stackPreview,
          topScores:     preview.scores.slice(0, 5).map(s => ({
            personaId:         s.personaId,
            totalScore:        s.totalScore,
            competencyScore:   s.breakdown.competencyScore,
            organizationScore: s.breakdown.organizationScore,
          })),
        };
      }

      // Execution mode — route + run
      const routeResult = route(args.input, args.anchor);

      try {
        // predefined stack → StackExecutor.run(), dynamic stack → StackExecutor.runDef()
        const execResult = routeResult.source === 'predefined'
          ? await StackExecutor.run(
              routeResult.stackDef.stackId,
              args.input,
              { maxTurnsPerLayer: args.maxTurnsPerLayer ?? 3 },
            )
          : await StackExecutor.runDef(
              routeResult.stackDef,
              args.input,
              { maxTurnsPerLayer: args.maxTurnsPerLayer ?? 3 },
            );

        return {
          mode:    'execute',
          routing: {
            source:      routeResult.source,
            anchor:      routeResult.anchorId,
            teamContext: routeResult.teamContext,
            reasoning:   routeResult.reasoning,
            stackId:     routeResult.stackDef.stackId,
            layers:      routeResult.stackDef.layers.map(l => l.personaId),
          },
          stackId:        execResult.stackId,
          status:         execResult.status,
          totalTurns:     execResult.totalTurns,
          layers: execResult.layers.map(lr => ({
            personaId:    lr.personaId,
            layerType:    lr.layerType,
            finalPhase:   lr.finalPhase,
            finalC:       lr.finalC,
            qualityGrade: lr.qualityGrade,
          })),
          composedPrompt: execResult.composedPrompt,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          mode:    'execute_failed',
          routing: {
            source:      routeResult.source,
            anchor:      routeResult.anchorId,
            teamContext: routeResult.teamContext,
            reasoning:   routeResult.reasoning,
            stackId:     routeResult.stackDef.stackId,
          },
          error: msg,
        };
      }
    },
  },

  // ── 11. arha_agent_run (Vol.H — Agent Loop) ─────────────────────────────────
  {
    name: 'arha_agent_run',
    description:
      'ARHA 에이전트 루프 — 완전 자율 단일 턴 실행. ' +
      'arha_process → systemPrompt 자동 주입 → Hook 평가 → Claude API 직접 호출 → Π 자동 영속. ' +
      '기존 arha_process와 달리 Claude 응답까지 포함해서 반환. ' +
      '세션 재시작 후에도 vsB·Ψ_Res·waveCount 등 전체 상태가 복구됨. ' +
      '발동된 Hook 목록(hooksFired)으로 자동 개입 내역 확인 가능. ' +
      'ANTHROPIC_API_KEY 환경변수 필요.',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type:        'string',
          description: '사용자 입력 텍스트',
        },
        sessionId: {
          type:        'string',
          description: '세션 ID (없으면 "default"). 동일 ID로 재호출 시 이전 상태 복구.',
        },
        personaId: {
          type:        'string',
          description: '페르소나 ID (기본: HighSol)',
          default:     'HighSol',
        },
        model: {
          type:        'string',
          description: 'Claude 모델 ID (기본: claude-sonnet-4-6)',
          default:     'claude-sonnet-4-6',
        },
        maxTokens: {
          type:        'number',
          description: '최대 출력 토큰 수 (기본: 4096)',
          default:     4096,
        },
        enableHooks: {
          type:        'boolean',
          description: 'Hook 자동 개입 활성화 여부 (기본: true)',
          default:     true,
        },
      },
      required: ['input'],
    },
    handler: async (args: {
      input:        string;
      sessionId?:   string;
      personaId?:   string;
      model?:       string;
      maxTokens?:   number;
      enableHooks?: boolean;
    }) => {
      const sid       = args.sessionId ?? 'default';
      const personaId = args.personaId ?? 'HighSol';

      let anthropic: Anthropic;
      try {
        anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY,
        });
      } catch {
        return { error: 'ANTHROPIC_API_KEY not set. Set it in environment to use arha_agent_run.' };
      }

      // Per-session serial queue — agent turn은 LLM 왕복 + state 변경.
      // 이 호출 중 같은 세션의 arha_process가 끼어들면 turn 카운터·resonance가 꼬임.
      return sessionRegistry.runSerialized(sid, personaId, async (runtime) => {
        try {
          const result = await runAgentTurn(
            args.input,
            {
              sessionId:   sid,
              personaId:   args.personaId,
              model:       args.model,
              maxTokens:   args.maxTokens,
              hooks:       (args.enableHooks ?? true) ? DEFAULT_HOOKS : [],
            },
            runtime,
            anthropic,
          );

          return {
            response:     result.response,
            sessionId:    result.sessionId,
            personaId:    result.personaId,
            turn:         result.turn,
            qualityGrade: result.qualityGrade,
            arhaState: {
              C:            result.arhaState.C,
              Gamma:        result.arhaState.Gamma,
              phase:        result.arhaState.phase,
              psiResonance: result.arhaState.psiResonance,
              vsB:          result.arhaState.vsB,
              g:            result.arhaState.g,
              p:            result.arhaState.p,
              waveCount:    result.arhaState.waveCount,
            },
            hooksFired:   result.hooksFired,
            tokens: {
              input:  result.inputTokens,
              output: result.outputTokens,
            },
            // system prompt는 필요 시 arha_process로 별도 조회
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { error: msg };
        }
      });
    },
  },

  // ── 12. arha_about (Vol.0 — Identity & Usage Guide) ────────────────────────
  {
    name: 'arha_about',
    description:
      'ARHA identity declaration + full usage guide. ' +
      'No parameters required. Returns: who ARHA is, why it exists, all 10 tools with examples, ' +
      '4 quick-start recipes, and a glossary of 13 key ARHA terms. ' +
      'Call this first if you are unfamiliar with ARHA.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (_args: Record<string, never>) => {
      return formatAboutResponse();
    },
  },

] as const;

export type ARHAToolName = typeof ARHA_TOOLS[number]['name'];
