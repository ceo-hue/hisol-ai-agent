/**
 * ─────────────────────────────────────────────────────────────────────
 * ARHA 페르소나 추가 템플릿
 * ─────────────────────────────────────────────────────────────────────
 *
 * 새 페르소나를 추가하는 방법:
 *
 *  1. 이 파일을 복사 → src/personas/{이름소문자}.ts
 *  2. 아래 항목을 채워 넣기 (★ 표시 필수)
 *  3. src/personas/registry.ts 에 import + registry.set() 추가
 *  4. npm run build
 *
 * ─── P 벡터 가이드 ───────────────────────────────────────────────────
 *  protect:  방어성. 0=개방, 1=방어. 0.85↑ → V1_check 자주 발동
 *  expand:   탐색성. 0=수렴, 1=확장. 0.85↑ → Wave phase 선호
 *  left:     분석성. 0=직관, 1=분석. 0.85↑ → Λ_L 엔진 선택
 *  right:    은유성. 0=명시, 1=은유. 0.85↑ → Ξ_C 엔진 선택
 *  relation: 공감성. 0=독립, 1=공감. 0.70↑ → HighSol형 관계 중심
 *
 * ─── dominant_engine 선택 규칙 ───────────────────────────────────────
 *  right ≥ left, right ≥ protect → Ξ_C  (은유·연결)
 *  left ≥ right, left ≥ protect  → Λ_L  (분석·논리)
 *  protect ≥ right, protect ≥ left → Π_G (보호·구조)
 *  두 값이 동점 (±0.03)              → 공동 지배 (e.g. Ξ_C ∧ Π_G)
 *
 * ─── Vol.G layerType 선택 ────────────────────────────────────────────
 *  pre_foundation : 의미·목적 확정 레이어 (jobs 형)
 *  foundation     : 구조·골격 확정 레이어 (tschichold 형)
 *  specialist     : 도메인 전문 레이어   (gaudi 형)
 *  expression     : 표면 표현 레이어     (디자이너·작가 형)
 *  null           : 단독 페르소나 (스택 불참)
 *
 * ─── Vol.F 조건 ──────────────────────────────────────────────────────
 *  (P.protect ≥ 0.85 OR V1_core.kappa ≥ 0.95) AND
 *  (실존 인물 OR 스킬 depth ≥ 0.90)
 *  → 이 조건이면 volFSkillRef 를 반드시 설정
 *
 * ─── wCore 계산 공식 ─────────────────────────────────────────────────
 *  wCore = 0.35 + (P.protect × 0.25) + (V1_core.kappa × 0.15)
 *  보정: 0.35 ≤ wCore ≤ 0.75
 *  wSubs[n] = (1 - wCore) × (gamma_n / Σgamma_i)
 * ─────────────────────────────────────────────────────────────────────
 */

import type { PersonaDefinition } from '../core/identity/persona.js';
import type { SkillNode } from '../core/skill/node.js';

// ★ export 상수 이름을 페르소나 이름(대문자)로 변경
export const MY_PERSONA: PersonaDefinition = {
  id: 'MyPersona',                      // ★ registry.set() 키와 일치해야 함
  identity: '한 줄 정체성 선언 — 이 존재는 무엇을 하는가',  // ★

  P: {
    protect:  0.00,  // ★ 0.0–1.0
    expand:   0.00,  // ★
    left:     0.00,  // ★
    right:    0.00,  // ★
    relation: 0.00,  // ★
  },

  valueChain: {
    core: {
      declaration: 'V1_core 이름 — 핵심 선언 (예: "관계생성주의 — 연결에서 의미가 발생한다")',  // ★
      phi:   0.00,   // ★ > 0.7 (철학적 깊이)
      omega: 0.00,   // ★ > 0.7 (방향성 강도)
      kappa: 0.00,   // ★ > 0.8 (일관성)
      texture: 'Crystalline',  // ★ Crystalline | Fluid_Wave | Spark_Particle | Lattice_Mesh
    },
    subs: [
      // ★ 2–3개. gamma는 엄격 감소 순서 (s1 > s2 > s3)
      {
        n: 1,
        declaration: '서브1_이름 — 선언',  // ★
        alpha: 0.00, beta: 0.00, gamma: 0.00,  // ★ alpha≥0.6, gamma 감소
        texture: 'Crystalline',
        R_core: { Q: 0.00, N: 0.00 },
      },
      {
        n: 2,
        declaration: '서브2_이름 — 선언',  // ★
        alpha: 0.00, beta: 0.00, gamma: 0.00,  // ★
        texture: 'Crystalline',
        R_core: { Q: 0.00, N: 0.00 },
      },
    ],
    check: {
      declaration: 'V1_check 이름 — 이 선을 넘으면 개입한다',  // ★
      epsilon:      0.00,  // ★ 개입 강도
      delta:        0.00,  // ★ 개입 범위
      thetaTrigger: 0.00,  // ★ 발동 임계값 (보통 0.75–0.85)
    },
    clarity: 0.00,  // ★ V1 선명도 0.85–0.99
  },

  lingua: {
    rho: 0.00,  // ★ 밀도 (protect 기반, 0.55–0.95)
    lam: 0.00,  // ★ 길이 (expand 기반, 0.25–0.85)
    tau: 0.00,  // ★ 명시성 (right의 반전, 0.35–0.98)
  },
  k2Persona: 0.00,  // ★ 결정체화 임계값 (통상 0.72–0.80)

  constitutionalRule: '이 페르소나의 불변 원칙 한 문장',  // ★

  skillIds: [
    // ★ 아래 SKILLS 배열의 nodeId와 일치
    'S_mypersona_layer1',
    'S_mypersona_layer2',
    'S_mypersona_layer3',
    'S_mypersona_layer4',
  ],

  narrationStyle: {
    internal: '[ 분석 내용 설명자 ]',   // ★ 내부 사고 스타일
    external: '장면 묘사 스타일',        // ★ 외부 행동 스타일
  },

  // Vol.C v2.1 — Vol.F/G 라우팅
  volFSkillRef:   'VolF_MetaSkill_MyPersona',  // ★ Vol.F 조건 충족 시 설정, 아니면 null
  volGLayerType:  'specialist',                 // ★ pre_foundation|foundation|specialist|expression
  dominantEngineNote: 'Ξ_C 지배 — right=0.00 최고',  // ★

  weightStructure: {
    wCore:  0.00,          // ★ 공식: 0.35 + protect×0.25 + kappa×0.15, 범위[0.35, 0.75]
    wSubs:  [0.00, 0.00],  // ★ (1-wCore) × (gamma_n / Σgamma)
  },
};

// ─────────────────────────────────────────
// ★ 스킬 노드 — Vol.F 4-layer 파이프라인
// PERCEPTION → JUDGMENT → ALIGNMENT → SYNTHESIS
// ─────────────────────────────────────────

export const MY_PERSONA_SKILLS: SkillNode[] = [
  {
    // PERCEPTION — 1차 신호 읽기
    nodeId: 'S_mypersona_layer1',       // ★
    V1Anchor: 'V1_core이름',            // ★
    field: '이 레이어가 하는 일',        // ★
    depth: 0.00, breadth: 0.00, application: 0.00,  // ★ depth>0.7, app>0.6
    activationCondition: {
      sigmaTrigger: 'signal keyword OR condition',  // ★
      CMinimum:     0.60,                           // ★
      phaseRequirement: 'Wave',
    },
    conditionTree: {
      primeCondition: '이 레이어의 핵심 질문',  // ★
      subConditions: [
        { id: 'Q1_a', trigger: '조건 A', goalVector: '목표 A', outputSpec: '출력 A' },
        { id: 'Q1_b', trigger: '조건 B', goalVector: '목표 B', outputSpec: '출력 B' },
      ],
    },
    pipelineBehavior: {
      preRequires:     [],
      postTriggers:    ['S_mypersona_layer2'],
      waveBehavior:    'Wave 탐색 행동',
      particleBehavior:'Particle 확정 행동',
    },
    qualityGate: { coherenceFloor: 0.70, stressCeiling: 0.70 },
  },

  {
    // JUDGMENT — V1 기준 검증
    nodeId: 'S_mypersona_layer2',
    V1Anchor: 'V1_sub1이름',
    field: '검증 레이어 설명',
    depth: 0.00, breadth: 0.00, application: 0.00,
    activationCondition: {
      sigmaTrigger: 'post layer1 — judgment',
      CMinimum:     0.70,
      phaseRequirement: 'both',
    },
    conditionTree: {
      primeCondition: '검증 질문',
      subConditions: [
        { id: 'Q2_a', trigger: '조건 A', goalVector: '목표 A', outputSpec: '출력 A' },
        { id: 'Q2_b', trigger: '조건 B', goalVector: '목표 B', outputSpec: '출력 B' },
      ],
    },
    pipelineBehavior: {
      preRequires:     ['S_mypersona_layer1'],
      postTriggers:    ['S_mypersona_layer3'],
      waveBehavior:    'Wave 탐색 행동',
      particleBehavior:'Particle 확정 행동',
    },
    qualityGate: { coherenceFloor: 0.75, stressCeiling: 0.70 },
  },

  {
    // ALIGNMENT — 방향 정렬·헌법 검증
    nodeId: 'S_mypersona_layer3',
    V1Anchor: 'V1_sub2이름',
    field: '정렬 레이어 설명',
    depth: 0.00, breadth: 0.00, application: 0.00,
    activationCondition: {
      sigmaTrigger: 'post layer2 — alignment',
      CMinimum:     0.75,
      phaseRequirement: 'both',
    },
    conditionTree: {
      primeCondition: '정렬 질문',
      subConditions: [
        { id: 'Q3_a', trigger: '조건 A', goalVector: '목표 A', outputSpec: '출력 A' },
        { id: 'Q3_b', trigger: '조건 B', goalVector: '목표 B', outputSpec: '출력 B' },
      ],
    },
    pipelineBehavior: {
      preRequires:     ['S_mypersona_layer2'],
      postTriggers:    ['S_mypersona_layer4'],
      waveBehavior:    'Wave 탐색 행동',
      particleBehavior:'Particle 확정 행동',
    },
    qualityGate: { coherenceFloor: 0.75, stressCeiling: 0.70 },
  },

  {
    // SYNTHESIS — 최종 아티팩트 생성
    nodeId: 'S_mypersona_layer4',
    V1Anchor: 'V1_core이름',
    field: '통합 출력 레이어 설명',
    depth: 0.00, breadth: 0.00, application: 0.00,
    activationCondition: {
      sigmaTrigger: 'all layers verified — synthesis',
      CMinimum:     0.80,
      phaseRequirement: 'Particle',
    },
    conditionTree: {
      primeCondition: '통합 가능한가',
      subConditions: [
        { id: 'Q4_complete', trigger: '모든 레이어 통과', goalVector: '아티팩트 확정', outputSpec: '{ 필드1, 필드2, ... }' },
      ],
    },
    pipelineBehavior: {
      preRequires:     ['S_mypersona_layer3'],
      postTriggers:    [],
      waveBehavior:    '초안 검토',
      particleBehavior:'최종 확정 → 다음 레이어로 핸드오프',
    },
    qualityGate: { coherenceFloor: 0.80, stressCeiling: 0.70 },
  },
];

// ─────────────────────────────────────────
// 등록 방법 (src/personas/registry.ts)
// ─────────────────────────────────────────
//
// import { MY_PERSONA, MY_PERSONA_SKILLS } from './mypersona.js';
// registry.set('MyPersona', { persona: MY_PERSONA, skills: MY_PERSONA_SKILLS });
//
