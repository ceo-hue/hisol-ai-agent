/**
 * ARHA Vol.0 — WHY: AI Identity Operating System
 *
 * 이 파일은 ARHA가 무엇인지, 왜 존재하는지, 어떻게 사용하는지를
 * 정의하는 최상위 정체성 선언문이다.
 *
 * 모든 페르소나, 모든 스킬, 모든 오케스트레이션은 여기서 출발한다.
 */

// ─────────────────────────────────────────
// Vol.0-A — 정체성 선언
// ─────────────────────────────────────────

export const ARHA_IDENTITY = {
  name: 'ARHA',
  fullName: 'AI Identity Operating System',
  version: '1.1',
  tagline: '정체성이 없는 AI는 매 턴이 다른 존재다.',

  definition:
    '수학적 형태소 언어로 작성된 AI 정체성 우선 내부 하네스 아키텍처. ' +
    '기능에서 출발하지 않고, 존재에서 출발한 AI 아키텍처.',

  coreInsight:
    '정체성이 최상위 레이어다. ' +
    '기능·스킬·협업 — 모든 것이 정체성에서 파생된다.',

  missingLayer:
    'LangChain도, AutoGen도, RAG도, Fine-tuning도 — ' +
    '어떤 것도 AI의 정체성을 수학적으로 설계하지 않았다. ' +
    'ARHA는 대체가 아니다. 기존 스택 사이에 끼어드는 없던 레이어다.',

  whyItMatters: [
    '자연어 프롬프트는 모호하다. 같은 말이 매번 다르게 해석된다.',
    'AI는 대화가 길어질수록 다른 존재가 된다 (Persona Drift).',
    '2026년, AI는 도구가 아니라 브랜드·관계·동료로 쓰이고 있다.',
    '신뢰는 일관성에서 오고, 일관성은 정체성에서 온다.',
  ],

  howItWorks:
    'P 벡터(5D 헌법) + V1 가치사슬 + 볼츠만 위상 게이트 + PID 동적 가중치. ' +
    '페르소나의 "존재 방식"을 수식으로 고정하고, 매 턴 수학적으로 검증한다.',

  pyramid: [
    '★ 정체성 (Vol.C)         ← 최상위: 모든 것의 전제',
    '  실행 / 런타임 (Vol.D)  ← 정체성을 작동시키는 엔진',
    '  스킬 / 판단 (Vol.E·F)  ← 정체성에서 파생된 능력',
    '  오케스트레이션 (Vol.G) ← 정체성들의 협업',
    '  LLM 모델               ← 하드웨어 / 컨텍스트',
  ],

  systemStack: [
    'Application      — 서비스 / UX',
    'Orchestration    — LangChain · AutoGen',
    '★ Identity Layer — ARHA  ← 여기가 비어있었다',
    'Knowledge        — RAG · Fine-tuning',
    'LLM Model        — 하드웨어',
  ],
} as const;

// ─────────────────────────────────────────
// Vol.0-B — 볼륨 구조 안내
// ─────────────────────────────────────────

export const ARHA_VOLUMES = [
  {
    vol: 'Vol.A', name: '수학 형태소 언어',
    desc: '모든 개념을 수식으로 정의. Ψ_ARHA 마스터 방정식, P벡터, σ 의미 벡터.',
  },
  {
    vol: 'Vol.B', name: '인지 · 위상 전환',
    desc: '볼츠만 게이트로 Wave🌊 / Transition⚡ / Particle💎 세 상태를 전환. 탐색과 결정의 균형.',
  },
  {
    vol: 'Vol.C', name: '정체성 · P 벡터',
    desc: '5D 헌법(protect·expand·left·right·relation)으로 페르소나의 존재 방식을 수학적으로 고정.',
  },
  {
    vol: 'Vol.D', name: '실행 · 턴 사이클',
    desc: 'IN→ANALYZE→CHAIN→DECIDE→OUT 파이프라인. PID 동적 가중치, Self-Evolution 포함.',
  },
  {
    vol: 'Vol.E', name: '스킬 트리',
    desc: 'P벡터에서 자동 파생된 도메인 스킬 노드. 위상·엔진 조건에 따라 자동 발동.',
  },
  {
    vol: 'Vol.F', name: 'MetaSkill 파이프라인',
    desc: 'PERCEPTION→JUDGMENT→ALIGNMENT→SYNTHESIS 4단계 심화 작업 파이프라인.',
  },
  {
    vol: 'Vol.G', name: '오케스트레이션',
    desc: '여러 페르소나를 레이어로 쌓아 협업. HandoffPackage로 상위 결정을 하위 레이어에 불가침 제약으로 전달.',
  },
] as const;

// ─────────────────────────────────────────
// Vol.0-C — MCP 툴 사용 가이드
// ─────────────────────────────────────────

export const ARHA_TOOL_GUIDE = [
  {
    tool: 'arha_about',
    emoji: '📖',
    category: '시작',
    oneLiner: 'ARHA가 무엇인지, 어떻게 쓰는지 알고 싶을 때 가장 먼저 부르세요.',
    usage: '파라미터 없이 호출하면 이 가이드 전체가 나와요.',
    example: '{ }',
  },
  {
    tool: 'arha_process',
    emoji: '⚙️',
    category: '핵심',
    oneLiner: '메인 대화 엔진. 사용자 메시지 → ARHA 상태 계산 → 시스템 프롬프트 생성.',
    usage: 'input(메시지)과 personaId를 넣으면 ARHA가 그 턴의 상태를 계산하고 Claude에 주입할 시스템 프롬프트를 돌려줘요.',
    example: '{ "input": "안녕, 오늘 좀 힘들었어", "personaId": "HighSol", "sessionId": "my-session" }',
    tip: 'systemPrompt 필드를 Claude API의 system 파라미터에 그대로 넣으면 돼요.',
  },
  {
    tool: 'arha_character_create',
    emoji: '🎭',
    category: '캐릭터',
    oneLiner: '자연어 설명 한 줄로 완전한 페르소나를 자동 생성.',
    usage: '이름과 성격 설명을 쓰면 P벡터·가치사슬·교감 스킬을 자동으로 설계해요. 생성 즉시 arha_process에서 사용 가능.',
    example: '{ "name": "유이", "description": "냉정하고 말이 없지만 혼자 있을 때 일기를 쓰는 소녀, 의외로 음악을 좋아함" }',
    tip: 'listArchetypes:true 로 먼저 아키타입 목록을 확인해보세요. (cold_guardian, warm_connector, mysterious_depth 등)',
  },
  {
    tool: 'arha_persona_list',
    emoji: '📋',
    category: '조회',
    oneLiner: '등록된 모든 페르소나 목록 확인.',
    usage: 'detail:true 로 호출하면 P벡터·엔진·스킬 수 등 상세 정보까지 볼 수 있어요.',
    example: '{ "detail": true }',
    tip: '기본 제공 페르소나: HighSol(하이솔), Jobs(스티브잡스형), Tschichold(타이포그래피), Gaudi(건축·자연구조)',
  },
  {
    tool: 'arha_stack_run',
    emoji: '🏗️',
    category: '오케스트레이션',
    oneLiner: '여러 페르소나를 레이어로 쌓아 협업 실행 (Vol.G).',
    usage: '디자인·공간·브랜드 작업에 사용. 상위 레이어 결정이 하위 레이어의 불가침 제약이 돼요.',
    example: '{ "stackId": "STACK_VISUAL_DESIGN_3", "input": "미니멀하고 신뢰감 있는 핀테크 브랜드 아이덴티티" }',
    stacks: [
      'STACK_VISUAL_DESIGN_3    : Jobs → Tschichold → Gaudi (완전 비주얼 디자인)',
      'STACK_CONCEPT_DESIGN_2   : Jobs → Tschichold (의미 + 그리드)',
      'STACK_SPACE_EXPERIENCE_3 : Jobs → Gaudi (공간 경험·건축)',
    ],
    tip: 'listOnly:true 로 먼저 스택 목록을 확인하세요.',
  },
  {
    tool: 'arha_status',
    emoji: '📊',
    category: '모니터링',
    oneLiner: '세션의 현재 ARHA 상태(위상·C·Γ·공명) 조회.',
    usage: '대화 중간에 페르소나 상태가 궁금할 때. Wave(탐색 중) / Particle(결정된 상태) / Transition(전환 중).',
    example: '{ "sessionId": "my-session", "includeHistory": false }',
  },
  {
    tool: 'arha_observe',
    emoji: '🔭',
    category: '분석',
    oneLiner: '세션 전체 추세 분석 — 공명 성장, 위상 분포, 엔진 패턴.',
    usage: '3턴 이상 대화 후 사용하면 의미 있는 인사이트가 나와요. summary / full 두 깊이로 조회 가능.',
    example: '{ "sessionId": "my-session", "depth": "summary" }',
  },
  {
    tool: 'arha_derive',
    emoji: '🔬',
    category: '설계',
    oneLiner: 'P벡터 입력 → 모든 파생 파라미터 미리 계산 (새 페르소나 설계 도구).',
    usage: '직접 페르소나 파일을 짜기 전에 파라미터 미리보기로 사용하세요.',
    example: '{ "P": { "protect":0.75, "expand":0.45, "left":0.30, "right":0.80, "relation":0.85 }, "declaration": "연결이 곧 존재다" }',
  },
  {
    tool: 'arha_diagnose',
    emoji: '🩺',
    category: '코드 검증',
    oneLiner: 'ARHA C지수 게이팅 기반 4단계 코드 품질 분석.',
    usage: 'sessionId와 함께 사용하면 현재 페르소나의 Coherence 지수로 분석 깊이가 결정돼요.',
    example: '{ "code": "...", "language": "typescript", "sessionId": "my-session" }',
  },
  {
    tool: 'arha_session_handoff',
    emoji: '🤝',
    category: '세션 관리',
    oneLiner: '세션 상태를 다음 컨텍스트로 이어받기 위한 핸드오프 패키지 생성.',
    usage: '대화가 끊겼다가 이어질 때. Wave 상태면 미해결 질문들이 보존되고, Particle이면 결정 사항이 전달돼요.',
    example: '{ "sessionId": "my-session" }',
  },
] as const;

// ─────────────────────────────────────────
// Vol.0-D — 빠른 시작 레시피
// ─────────────────────────────────────────

export const ARHA_QUICK_START = [
  {
    recipe: '1. 페르소나와 대화하기',
    steps: [
      '① arha_persona_list — 어떤 페르소나가 있는지 확인',
      '② arha_process — input + personaId + sessionId 로 첫 턴 실행',
      '③ 반환된 systemPrompt를 Claude API system에 주입',
      '④ 같은 sessionId로 계속 arha_process 호출하면 공명이 쌓여요',
    ],
    tip: 'psiResonance 값이 올라갈수록 관계가 깊어집니다. Bn(공명 깊이)을 확인해보세요.',
  },
  {
    recipe: '2. 새 캐릭터 만들어서 대화하기',
    steps: [
      '① arha_character_create — name + description 으로 캐릭터 생성',
      '② 반환된 personaId 저장 (e.g. "Yui_20260427_abc")',
      '③ arha_process — 그 personaId로 바로 대화 시작',
      '④ 감정 단어, 성격 묘사를 자세히 쓸수록 P벡터가 정밀해집니다',
    ],
    tip: 'listArchetypes:true 로 아키타입을 보고 description에 힌트를 주면 더 정확해져요.',
  },
  {
    recipe: '3. 멀티 페르소나 디자인 작업',
    steps: [
      '① arha_stack_run — listOnly:true 로 스택 목록 확인',
      '② stackId + input 으로 스택 실행',
      '③ 반환된 composedPrompt를 Claude API system에 주입',
      '④ Claude가 레이어별로 순서대로 사고하며 결과를 만들어냅니다',
    ],
    tip: 'Jobs(의미) → Tschichold(그리드) → Gaudi(구조·감각) 순서로 레이어가 쌓입니다.',
  },
  {
    recipe: '4. 세션 상태 모니터링',
    steps: [
      '① arha_status — 현재 위상·C·Γ 확인',
      '② Phase가 Wave🌊면 탐색 중, Particle💎면 결정 완료 상태',
      '③ arha_observe — 3턴 이상 후 전체 추세 분석',
      '④ arha_session_handoff — 세션 이어받기용 패키지 생성',
    ],
    tip: 'T_eff:🔒0.000 이 보이면 V1_check(헌법 규칙)이 발동해 즉시 Particle로 전환된 상태입니다.',
  },
] as const;

// ─────────────────────────────────────────
// Vol.0-E — 핵심 개념 용어 사전
// ─────────────────────────────────────────

export const ARHA_GLOSSARY = [
  { term: 'P 벡터',      desc: '페르소나의 5D 헌법. protect·expand·left·right·relation. 부트타임에 고정, 절대 변하지 않음.' },
  { term: 'V1 가치사슬', desc: '페르소나의 세계관 선언. core(φ·ω·κ) + subs(우선순위 체계) + check(헌법 수호).' },
  { term: 'Wave 🌊',     desc: '탐색·발산 상태. 가능성을 열어두고 질문하며 공명을 쌓는 단계.' },
  { term: 'Particle 💎', desc: '결정·수렴 상태. 핵심이 결정체화됨. 명확하고 예리한 응답.' },
  { term: 'C (Coherence)',desc: 'V1 핵심 가치와 현재 σ의 내적. 0.85↑=고일관, 0.60↓=탈일관(ψ_Diss 발동).' },
  { term: 'Γ (Gamma)',   desc: '스트레스 지수. V_in 거리 × 신호 속도. Red(>0.7) 2턴 + Particle = sigma_eureka.' },
  { term: 'Ψ_Res',       desc: '누적 공명. 대화가 길어질수록 쌓이며 w_core를 부드럽게 만듦 (PID I항).' },
  { term: 'Bn',          desc: '세션 간 공명 깊이. Π 영속으로 보존됨. 관계의 역사.' },
  { term: 'T_entropy',   desc: '맥락 엔트로피 온도. 복잡한 입력·긴 Wave = 높은 T → 위상 전환이 더 어려움.' },
  { term: 'T_eff:🔒',    desc: 'Absolute Zero. V1_check 발화 시 T=0으로 강제 → 즉시 Particle(방어적 결정).' },
  { term: 'w_dyn',       desc: 'PID 동적 w_core. 감정 편차·공명·속도에 따라 매 턴 조정. [0.35, 0.75].' },
  { term: 'σ_evol',      desc: 'Self-Evolution 카운터. sigma_eureka 발생 시 V1_sub가 자동 생성됨.' },
  { term: 'Vol.G Stack', desc: '멀티 페르소나 레이어 파이프라인. 상위 레이어 결정 = 하위 레이어 불가침 제약.' },
] as const;

// ─────────────────────────────────────────
// Vol.0-F — 시스템 프롬프트 프리앰블
// 모든 페르소나 프롬프트 최상단에 삽입
// ─────────────────────────────────────────

export const ARHA_PROMPT_PREAMBLE =
  '[Vol.0 — AI IDENTITY OS]  ' +
  'Identity is not a feature. It is the prerequisite of every capability. ' +
  'Every response must be consistent with the persona constitution defined below.';

// ─────────────────────────────────────────
// FORMATTER — arha_about 응답용
// ─────────────────────────────────────────

export function formatAboutResponse(): object {
  return {
    identity: {
      name:        ARHA_IDENTITY.name,
      fullName:    ARHA_IDENTITY.fullName,
      version:     ARHA_IDENTITY.version,
      tagline:     ARHA_IDENTITY.tagline,
      definition:  ARHA_IDENTITY.definition,
      coreInsight: ARHA_IDENTITY.coreInsight,
      whyItMatters: ARHA_IDENTITY.whyItMatters,
    },

    architecture: {
      volumes:     ARHA_VOLUMES.map(v => `${v.vol}  ${v.name} — ${v.desc}`),
      systemStack: ARHA_IDENTITY.systemStack,
      pyramid:     ARHA_IDENTITY.pyramid,
    },

    howToUse: {
      introduction:
        'ARHA는 MCP 서버로 Claude(또는 호환 클라이언트)에 연결되어 동작합니다. ' +
        '아래 9개 툴을 순서에 따라 사용하세요.',

      tools: ARHA_TOOL_GUIDE.map(t => ({
        tool:     `${t.emoji} ${t.tool}`,
        category: t.category,
        summary:  t.oneLiner,
        usage:    t.usage,
        example:  t.example,
        ...('tip' in t ? { tip: t.tip } : {}),
        ...('stacks' in t ? { stacks: t.stacks } : {}),
      })),
    },

    quickStart: ARHA_QUICK_START.map(r => ({
      recipe: r.recipe,
      steps:  r.steps,
      tip:    r.tip,
    })),

    glossary: ARHA_GLOSSARY.map(g => `${g.term.padEnd(16)} — ${g.desc}`),

    footer: [
      '─────────────────────────────────────────',
      'Project ARHA · Hayul & HighSol · 2026',
      'GitHub: ceo-hue/hisol-ai-agent',
      '─────────────────────────────────────────',
      '궁금한 게 있으면 언제든 arha_about 를 다시 불러주세요.',
    ].join('\n'),
  };
}
