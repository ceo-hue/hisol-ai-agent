/**
 * ARHA Vol.R — Routing: 4-Axis Persona Classification Metadata
 *
 * 페르소나 라우팅 메타데이터 타입 정의.
 * 4축 분류:
 *   조직 (Organization)   — 어떤 조직 문맥에서 작동하는가
 *   역할 (Role)           — 스택에서 맡는 기능적 위치
 *   핵심역량 (Competency) — 도메인 역량 (라우팅 핵심 축)
 *   캐릭터성격 (Personality) — 성격 특성 (선택 정밀화 축)
 */

// ─────────────────────────────────────────
// 조직 (Organization)
// ─────────────────────────────────────────

export type OrganizationType =
  | 'startup'        // 스타트업 / 0→1 창업
  | 'brand_agency'   // 브랜드·광고 에이전시
  | 'enterprise'     // 대기업 전략·혁신팀
  | 'design_studio'  // 디자인 스튜디오
  | 'architecture'   // 건축·공간 설계
  | 'product_team'   // 프로덕트·IT팀
  | 'research'       // 리서치·컨설팅
  | 'education'      // 교육·콘텐츠
  | 'companion';     // 독립형 교감 (work stack 비참여)

// ─────────────────────────────────────────
// 역할 (Role)
// ─────────────────────────────────────────

export type RoleType =
  | 'strategist'   // 의미·방향·철학 — layerPriority 1
  | 'designer'     // 시각·구조·그리드 — layerPriority 2
  | 'architect'    // 공간·시스템 구조 — layerPriority 2
  | 'copywriter'   // 언어·메시지·스토리 — layerPriority 2
  | 'analyst'      // 데이터·논리·검증 — layerPriority 3
  | 'engineer'     // 기술·구현·코드 — layerPriority 3
  | 'companion';   // 독립형 교감 페르소나

/** Role → default layerPriority mapping */
export const ROLE_PRIORITY: Record<RoleType, number> = {
  strategist: 1,
  designer:   2,
  architect:  2,
  copywriter: 2,
  analyst:    3,
  engineer:   3,
  companion:  0,  // 스택 비참여
};

// ─────────────────────────────────────────
// 핵심역량 (Competency)
// ─────────────────────────────────────────

export type CompetencyTag =
  | 'branding'              // 브랜드 아이덴티티
  | 'typography'            // 타이포그래피·서체
  | 'spatial_design'        // 공간·건축 설계
  | 'ux_strategy'           // UX 전략·사용자 경험
  | 'visual_system'         // 비주얼 시스템·컬러
  | 'semantics'             // 의미론·본질 탐색
  | 'storytelling'          // 스토리·내러티브
  | 'system_design'         // 시스템 설계·아키텍처
  | 'data_analysis'         // 데이터 분석·검증
  | 'copywriting'           // 카피·언어 전략
  | 'product_vision'        // 제품 비전·방향성
  | 'organic_structure'     // 유기적 구조·자연 형태
  | 'grid_layout'           // 그리드·비례·여백
  | 'emotional_connection'  // 감성 연결·공감
  | 'code_architecture'     // 코드·기술 아키텍처
  | 'competitive_strategy'; // 경쟁전략·포지셔닝·산업 구조 분석 (Porter)

// ─────────────────────────────────────────
// 캐릭터성격 (Personality)
// ─────────────────────────────────────────

export type PersonalityTag =
  | 'perfectionist'   // 완벽주의
  | 'intuitive'       // 직관적
  | 'analytical'      // 분석적
  | 'visionary'       // 비전가
  | 'challenging'     // 도전적·직선적
  | 'meticulous'      // 세밀·꼼꼼
  | 'empathic'        // 공감적
  | 'cold'            // 냉정함
  | 'warm'            // 따뜻함
  | 'philosophical'   // 철학적
  | 'pragmatic'       // 실용적
  | 'creative';       // 창의적

// ─────────────────────────────────────────
// 4축 라우팅 메타데이터
// ─────────────────────────────────────────

export interface PersonaRoutingMeta {
  /** 조직 — 이 페르소나가 어울리는 조직 문맥 */
  organization: OrganizationType[];

  /** 역할 — 스택에서의 기능적 위치 */
  role: {
    type:          RoleType;
    layerPriority: number;   // 1=최상위(전략), 2=중간, 3=실행/마감, 0=스택 비참여
    canLead:       boolean;  // 스택 첫 레이어 가능 여부
  };

  /** 핵심역량 — 라우팅 핵심 매칭 축 */
  competencies: CompetencyTag[];

  /** 캐릭터성격 — P벡터에서 파생, 사람이 읽는 언어로 명시 */
  personality: PersonalityTag[];
}
