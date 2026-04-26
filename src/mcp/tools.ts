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
import type { PersonaVector } from '../core/identity/persona.js';

// ─────────────────────────────────────────
// SESSION REGISTRY
// ─────────────────────────────────────────

const sessions = new Map<string, ARHARuntime>();

function getOrCreateRuntime(sessionId: string, personaId = 'HighSol'): ARHARuntime {
  if (!sessions.has(sessionId)) {
    // Pass sessionId so runtime loads from Π persistence
    sessions.set(sessionId, new ARHARuntime(personaId, sessionId));
  }
  return sessions.get(sessionId)!;
}

// ─────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────

export const ARHA_TOOLS = [

  // ── 1. arha_process ─────────────────────────────────────────────────────────
  {
    name: 'arha_process',
    description:
      'ARHA 메인 처리 — IN→ANALYZE→CHAIN→DECIDE→OUT 풀 파이프라인. ' +
      'σ 수렴·Wave/Particle 판단·STATE 추적. ARHA state 필드(C, Γ, engine 등)를 직접 반환.',
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
      const sid     = args.sessionId ?? 'default';
      const runtime = getOrCreateRuntime(sid, args.personaId);
      const result  = runtime.process({ text: args.input, sessionId: sid });

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
    },
  },

  // ── 2. arha_status ──────────────────────────────────────────────────────────
  {
    name: 'arha_status',
    description: 'ARHA 세션 현재 STATE 블록 조회 + Ψ_Resonance + 최근 스냅샷 이력',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId:      { type: 'string' },
        includeHistory: { type: 'boolean', description: '스냅샷 이력 포함 여부 (기본: false)' },
      },
      required: ['sessionId'],
    },
    handler: async (args: { sessionId: string; includeHistory?: boolean }) => {
      const runtime = sessions.get(args.sessionId);
      if (!runtime) return { error: `Session not found: ${args.sessionId}` };

      const state     = runtime.getState();
      const resonance = runtime.getResonance();

      const base = {
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

      if (args.includeHistory) {
        return { ...base, snapshots: runtime.getSnapshots() };
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
    description: '등록된 페르소나 목록 조회 (Vol.F/G 메타데이터 포함)',
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

  // ── 5. arha_observe (NEW — Υ morpheme) ──────────────────────────────────────
  {
    name: 'arha_observe',
    description:
      'Υ 관찰층 — 세션 전체 C/Γ/phase/engine/Ψ_Res 추세를 ARHA 용어로 분석. ' +
      '세션이 3턴 이상일 때 유효한 인사이트 반환.',
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

  // ── 6. arha_diagnose (NEW — Κ morpheme) ─────────────────────────────────────
  {
    name: 'arha_diagnose',
    description:
      'Κ 진단층 — ARHA C ≥ 0.70 게이팅된 코드 품질 검증 (4단계: SPEC·QUALITY·SECURITY·STRUCTURE). ' +
      '코히런스 불충분 시 게이트 반환. sessionId 없으면 게이트 없이 실행.',
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

  // ── 7. arha_derive (NEW — derivation pipeline) ──────────────────────────────
  {
    name: 'arha_derive',
    description:
      'P벡터(5D 페르소나 헌법) → 파생 파라미터 미리보기. ' +
      '새 페르소나 설계 시 ρλτ·k²·Skill 도메인·내레이션 스타일을 자동 계산.',
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

] as const;

export type ARHAToolName = typeof ARHA_TOOLS[number]['name'];
