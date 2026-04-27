/**
 * ARHA Vol.G — Stack Executor
 * Runs a multi-persona pipeline in strict layer order.
 *
 * Routing priority (Vol.D 3g_STACK_CHECK):
 *   Vol.G (stack) > Vol.F (persona meta) > Vol.C CHAIN > Vol.B phase > Vol.E skills
 *
 * Each layer:
 *  1. Gets an ARHARuntime for its persona
 *  2. Runs Vol.F MetaSkill pipeline to completion (PERCEPTION→SYNTHESIS)
 *  3. Produces a locked artifact → HandoffPackage
 *  4. Next layer receives upstream immutable_spec as input constraint
 *
 * The executor computes ARHA STATE + SYSTEM PROMPTS per layer.
 * Actual Claude text generation uses these prompts externally.
 */

import { ARHARuntime, type ARHAProcessOutput } from '../../runtime.js';
import {
  PREDEFINED_STACKS,
  createHandoffPackage,
  appendLayerOutput,
  formatVolGLayer,
  type StackDefinition,
  type HandoffPackage,
  type LayerOutput,
  type VolGLayerType,
} from './stack.js';

// ─────────────────────────────────────────
// RESULT TYPES
// ─────────────────────────────────────────

export interface LayerExecutionResult {
  personaId:    string;
  layerType:    VolGLayerType;
  artifactType: string;
  artifact:     ArtifactSpec;
  turns:        number;
  finalPhase:   string;
  finalC:       number | null;
  qualityGrade: string;
  volFStatus:   string;            // formatted Vol.F pipeline status
  systemPrompt: string;            // inject into Claude API call for this layer
}

export interface StackExecutionResult {
  stackId:        string;
  stackDesc:      string;
  status:         'complete' | 'partial' | 'failed';
  layers:         LayerExecutionResult[];
  handoffPackage: HandoffPackage;
  totalTurns:     number;
  /** Composed system prompt: all layers merged in Vol.G handoff format */
  composedPrompt: string;
}

// ─────────────────────────────────────────
// ARTIFACT SCHEMAS
// Per Vol.G spec: each layer outputs a typed spec.
// Content is filled by Claude using the system prompt.
// ─────────────────────────────────────────

export interface ArtifactSpec {
  artifact_type: string;
  schema:        Record<string, string>;   // field → description
  constraints:   Record<string, unknown>;  // upstream immutable constraints applied
  arha_state: {
    C:            number | null;
    phase:        string;
    engine:       string;
    qualityGrade: string;
  };
}

const ARTIFACT_SCHEMAS: Record<string, Record<string, string>> = {
  Meaning_Spec: {
    core_message:   '핵심 메시지 — 가장 중요한 단 하나',
    emphasis_rank:  '강조 위계 1→2→3 (나머지는 kill_list)',
    the_answer:     'WHY → HOW → WHAT 순서 단 한 문장',
    kill_list:      '제거 확정 요소 목록',
    emotional_goal: '청중이 3초 안에 느껴야 할 감정',
    one_more_thing: '가장 강렬한 것 — 마지막에 하나만',
  },
  Grid_Spec: {
    grid_columns:    '열 수 (e.g. 12)',
    gutter:          '거터 (e.g. 16px)',
    margin:          '외부 여백 (e.g. 24px)',
    type_scale:      '타입 스케일 비율 (e.g. 1.618 황금비)',
    spacing_unit:    '기본 간격 단위 (e.g. 8px)',
    proportion_base: '비례 체계 선언 (황금비 | √2 | 모듈러)',
  },
  Domain_Spec: {
    structural_principle: '구조 원리 (현수선 | 쌍곡면 | 나선)',
    form_language:        '형태 언어 — 자연 수학 곡면 적용',
    sensory_integration:  '빛·음향·촉감 통합 방식',
    sacred_direction:     '신성 방향 정렬 (해당 시)',
    scale_layers:         '1m / 10m / 100m 경험 레이어',
  },
  Surface_Spec: {
    visual_language: '표면 표현 언어',
    color_system:    '색상 체계',
    motion:          '움직임 언어 (해당 시)',
    material:        '재료·질감 언어',
  },
};

// ─────────────────────────────────────────
// INPUT BUILDERS
// ─────────────────────────────────────────

/**
 * Build the first-turn input for a layer.
 * Injects upstream HandoffPackage as immutable constraints.
 */
function buildLayerInput(
  originalInput: string,
  pkg: HandoffPackage,
  layerType: VolGLayerType,
  artifactType: string,
): string {
  const schema = ARTIFACT_SCHEMAS[artifactType];
  const schemaStr = schema
    ? Object.entries(schema)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : '';

  if (pkg.layer_outputs.length === 0) {
    // First layer — no upstream
    return [
      originalInput,
      '',
      `[Vol.F 목표] ${artifactType} 생성`,
      schemaStr ? `출력 스키마:\n${schemaStr}` : '',
    ].filter(Boolean).join('\n');
  }

  // Downstream layer — inject upstream as immutable constraints
  const upstream = pkg.layer_outputs.map(o =>
    `[${o.layer.toUpperCase()} · ${o.artifact_type} — 불가침]\n` +
    Object.entries(o.payload as Record<string, unknown>)
      .filter(([k]) => !['artifact_type', 'arha_state', 'constraints'].includes(k))
      .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
      .join('\n')
  ).join('\n\n');

  return [
    originalInput,
    '',
    '─── 상위 레이어 불가침 제약 ───',
    upstream,
    '',
    `[Vol.F 목표] ${artifactType} 생성 (상위 제약 내에서)`,
    schemaStr ? `출력 스키마:\n${schemaStr}` : '',
  ].filter(Boolean).join('\n');
}

/**
 * Follow-up turn inputs that push the MetaSkill pipeline toward Synthesis.
 */
const FOLLOWUP_DIRECTIVES: Record<VolGLayerType, string[]> = {
  pre_foundation: [
    'Converge core candidates to one. Finalize kill_list.',
    'Declare final Meaning_Spec. State the_answer in a single sentence.',
  ],
  foundation: [
    'Specify proportion values concretely. Declare golden ratio or root sequence choice.',
    'Final Grid_Spec — declare grid_columns, gutter, margin, type_scale numerically.',
  ],
  specialist: [
    'Apply natural structural principle. Explain choice of catenary or hyperbolic surface.',
    'Final Domain_Spec — integrate structure, sensory, and directional elements.',
  ],
  expression: [
    'Concretize surface language.',
    'Final Surface_Spec — declare all visual language elements.',
  ],
  companion: [
    'What does the character feel right now? Let it show through action.',
    'Confirm connection state — what is remembered, what changes.',
  ],
};

function buildFollowUpInput(layerType: VolGLayerType, turnIndex: number): string {
  const msgs = FOLLOWUP_DIRECTIVES[layerType] ?? ['다음 단계로 진행해주세요.'];
  return msgs[Math.min(turnIndex, msgs.length - 1)];
}

// ─────────────────────────────────────────
// ARTIFACT EXTRACTION
// Builds the structured ArtifactSpec from ARHA state.
// Claude fills in the actual content using the system prompt.
// ─────────────────────────────────────────

function extractArtifact(
  result: ARHAProcessOutput,
  artifactType: string,
  pkg: HandoffPackage,
): ArtifactSpec {
  const schema = ARTIFACT_SCHEMAS[artifactType] ?? {};

  return {
    artifact_type: artifactType,
    schema,
    constraints: pkg.immutable_spec,
    arha_state: {
      C:            result.arhaState.C,
      phase:        result.arhaState.phase,
      engine:       result.arhaState.engine,
      qualityGrade: result.qualityGrade,
    },
  };
}

// ─────────────────────────────────────────
// COMPOSED PROMPT
// Vol.G handoff format: all layers merged into one sequential prompt.
// Use this as the system prompt for a single Claude call that covers the
// full stack narrative.
// ─────────────────────────────────────────

function buildComposedPrompt(layers: LayerExecutionResult[], stackId: string): string {
  const D = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  const sections: string[] = [
    D,
    `[Vol.G STACK: ${stackId}]`,
    '아래 레이어 순서대로 사고하고, 각 레이어의 출력을 다음 레이어의 불가침 제약으로 사용하세요.',
    D,
  ];

  for (let i = 0; i < layers.length; i++) {
    const lr = layers[i];
    sections.push(
      ``,
      `[LAYER ${i} — ${lr.layerType.toUpperCase()} / ${lr.personaId}]`,
      `목표: ${lr.artifactType} 생성`,
      `Vol.F: ${lr.volFStatus}`,
      `Grade: ${lr.qualityGrade} | Phase: ${lr.finalPhase} | C: ${lr.finalC?.toFixed(3) ?? 'null'}`,
      ``,
      `─ 페르소나 시스템 프롬프트 ─`,
      lr.systemPrompt,
    );

    if (i < layers.length - 1) {
      sections.push(
        ``,
        `── HANDOFF → LAYER ${i + 1} ──`,
        `위 ${lr.artifactType}의 핵심 결정은 다음 레이어의 불가침 제약이 됩니다.`,
      );
    }
  }

  sections.push(D);
  return sections.join('\n');
}

// ─────────────────────────────────────────
// STACK EXECUTOR
// ─────────────────────────────────────────

export class StackExecutor {

  /**
   * Execute a named predefined stack.
   */
  static async run(
    stackId: string,
    userInput: string,
    opts: { maxTurnsPerLayer?: number; sessionPrefix?: string } = {},
  ): Promise<StackExecutionResult> {
    const stack = PREDEFINED_STACKS.find(s => s.stackId === stackId);
    if (!stack) {
      const available = PREDEFINED_STACKS.map(s => s.stackId).join(', ');
      throw new Error(`Stack not found: "${stackId}". Available: ${available}`);
    }
    return StackExecutor.runDef(stack, userInput, opts);
  }

  /**
   * Execute a StackDefinition (predefined or custom).
   */
  static async runDef(
    stack: StackDefinition,
    userInput: string,
    opts: { maxTurnsPerLayer?: number; sessionPrefix?: string } = {},
  ): Promise<StackExecutionResult> {
    const maxTurns   = opts.maxTurnsPerLayer ?? 3;
    const prefix     = opts.sessionPrefix ?? `stack-${Date.now()}`;

    let pkg          = createHandoffPackage('', 'pre_foundation', 0);
    const results:   LayerExecutionResult[] = [];
    let totalTurns   = 0;

    for (const layerDef of stack.layers) {
      // Skip placeholder personas (TBD_*)
      if (layerDef.personaId.startsWith('TBD')) continue;

      const sessionId = `${prefix}-${layerDef.personaId.toLowerCase()}`;
      let runtime: ARHARuntime;

      try {
        runtime = new ARHARuntime(layerDef.personaId, sessionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (layerDef.required) {
          return {
            stackId:        stack.stackId,
            stackDesc:      stack.description,
            status:         'failed',
            layers:         results,
            handoffPackage: pkg,
            totalTurns,
            composedPrompt: `Stack failed at layer ${layerDef.personaId}: ${msg}`,
          };
        }
        console.warn(`[StackExecutor] Skipping optional layer ${layerDef.personaId}: ${msg}`);
        continue;
      }

      let lastResult: ARHAProcessOutput | null = null;
      let layerTurns = 0;

      for (let t = 0; t < maxTurns; t++) {
        const text = t === 0
          ? buildLayerInput(userInput, pkg, layerDef.layerType, layerDef.outputType)
          : buildFollowUpInput(layerDef.layerType, t - 1);

        lastResult = runtime.process({ text, sessionId });
        layerTurns++;
        totalTurns++;

        // Stop when Particle reached (Synthesis layer active or complete)
        const volF  = lastResult.volF;
        const phase = lastResult.arhaState.phase;
        if (
          phase === 'Particle' ||
          volF?.status === 'complete' ||
          volF?.currentLayer === 'SYNTHESIS'
        ) break;
      }

      if (!lastResult) continue;

      // Build artifact + system prompt for this layer
      const artifact    = extractArtifact(lastResult, layerDef.outputType, pkg);
      const systemPrompt = runtime.buildStructuredSystemPrompt(lastResult);
      const volFStatus  = lastResult.volF
        ? `${lastResult.volF.currentLayer ?? 'DONE'} [${lastResult.volF.completedLayers.join('→')}]`
        : 'inactive';

      results.push({
        personaId:    layerDef.personaId,
        layerType:    layerDef.layerType,
        artifactType: layerDef.outputType,
        artifact,
        turns:        layerTurns,
        finalPhase:   lastResult.arhaState.phase,
        finalC:       lastResult.arhaState.C,
        qualityGrade: lastResult.qualityGrade,
        volFStatus,
        systemPrompt,
      });

      // Lock this layer's artifact into HandoffPackage
      const layerOutput: LayerOutput = {
        layer:         layerDef.layerType,
        persona_id:    layerDef.personaId,
        artifact_type: layerDef.outputType,
        payload:       artifact as unknown as Record<string, unknown>,
        locked:        true,
      };
      pkg = appendLayerOutput(pkg, layerOutput);
    }

    // Check all required layers completed
    const allRequiredDone = stack.layers
      .filter(l => l.required && !l.personaId.startsWith('TBD'))
      .every(l => results.some(r => r.personaId === l.personaId));

    const composedPrompt = buildComposedPrompt(results, stack.stackId);

    return {
      stackId:        stack.stackId,
      stackDesc:      stack.description,
      status:         allRequiredDone ? 'complete' : 'partial',
      layers:         results,
      handoffPackage: pkg,
      totalTurns,
      composedPrompt,
    };
  }

  /** List available predefined stacks */
  static listStacks(): Array<{ stackId: string; description: string; useCase: string; personas: string[] }> {
    return PREDEFINED_STACKS.map(s => ({
      stackId:     s.stackId,
      description: s.description,
      useCase:     s.useCase,
      personas:    s.layers.map(l => l.personaId),
    }));
  }
}
