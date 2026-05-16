/**
 * ARHA Vol.R — Routing: Intent Extractor
 *
 * 사용자 요청 텍스트 → 4축 IntentProfile 추출.
 * 키워드 매핑 방식 (결정론적, ML 불필요).
 * 한국어 + 영어 동시 지원.
 */

import type {
  OrganizationType,
  RoleType,
  CompetencyTag,
  PersonalityTag,
} from './meta.js';

// ─────────────────────────────────────────
// INTENT PROFILE
// ─────────────────────────────────────────

export interface IntentProfile {
  organizations:  OrganizationType[];
  competencies:   CompetencyTag[];
  personalities:  PersonalityTag[];
  impliedRoles:   RoleType[];
  rawText:        string;
}

// ─────────────────────────────────────────
// KEYWORD → TAG MAPS
// ─────────────────────────────────────────

const ORG_KEYWORDS: Record<OrganizationType, string[]> = {
  startup:       ['스타트업', '창업', 'startup', '0→1', '초기', 'mvp', '린', '소규모', 'early stage'],
  brand_agency:  ['브랜드', '브랜딩', '에이전시', '광고', 'brand', 'agency', '캠페인', 'campaign', 'ci', 'bi'],
  enterprise:    ['대기업', '기업', '엔터프라이즈', 'enterprise', 'corporate', '조직', '대형', '공기업'],
  design_studio: ['디자인 스튜디오', 'design studio', '편집', '인쇄', '출판', '그래픽'],
  architecture:  ['건축', '공간', '인테리어', '설치', 'architecture', 'spatial', '건물', '리노베이션'],
  product_team:  ['프로덕트', '제품', 'product', 'it팀', '앱', 'app', 'ui', 'ux', '서비스 기획'],
  research:      ['리서치', '분석', '연구', 'research', '데이터', 'data', '컨설팅', 'consulting'],
  education:     ['교육', '학습', '콘텐츠', '강의', 'education', '학교', '커리큘럼'],
  companion:     ['친구', '교감', '대화', '상담', 'companion', '감성', '일상'],
};

const COMPETENCY_KEYWORDS: Record<CompetencyTag, string[]> = {
  branding:             ['브랜딩', '브랜드 아이덴티티', '아이덴티티', 'brand identity', 'bi', '로고', 'logo', '브랜드 가이드'],
  typography:           ['타이포', '폰트', '글꼴', 'typography', '서체', '자간', '행간', '텍스트'],
  spatial_design:       ['공간', '건축', '인테리어', 'spatial', 'architecture', '설치', '전시', '3d'],
  ux_strategy:          ['ux', '사용자경험', '사용성', 'usability', 'user experience', '사용자 여정', '전환율'],
  visual_system:        ['비주얼', '시각', '디자인 시스템', 'visual system', '컬러', '색상', '색채', '팔레트'],
  semantics:            ['의미', '본질', '핵심', '철학', 'meaning', 'essence', 'why', '존재', '정체성', '목적', 'purpose', '경영 철학', '조직 목적'],
  storytelling:         ['스토리', '내러티브', '이야기', 'storytelling', '서사', '스크립트', '스토리텔링'],
  system_design:        ['시스템', '아키텍처', '설계', 'system design', '구조 설계', '인프라', '가치사슬', 'value chain', '조직 설계', 'org design', '경영 시스템', 'management system', '프로세스 설계'],
  data_analysis:        ['데이터', '분석', 'data', 'analysis', '지표', '통계', '리포트', '시장 조사', '산업 분석', '성과 측정', 'kpi', 'okr', 'mbo', '목표 설정', 'performance'],
  copywriting:          ['카피', '문구', '슬로건', 'copy', 'copywriting', '헤드라인', '광고 문구'],
  product_vision:       ['제품 비전', '방향성', '로드맵', 'product vision', '전략적 방향', '제품 전략', '프로토타입', 'prototype', '혁신', 'innovation', '아이디어 실체화'],
  organic_structure:    ['유기적', '자연', '구조', 'organic', '형태', '패턴', '자연 구조', '생체', '교차 도메인', 'cross domain', '르네상스', 'renaissance'],
  grid_layout:          ['그리드', '레이아웃', '비례', 'grid', 'proportion', '황금비', '여백', '마진'],
  emotional_connection: ['감성', '공감', '관계', '감정', 'emotional', '따뜻', '친밀', '교감', '경험 디자인', 'experience design', '사용자 경험', '디테일', 'detail', '산업 디자인', 'industrial design'],
  code_architecture:    ['코드', '개발', '프로그래밍', 'code', 'typescript', 'javascript', '기술'],
  competitive_strategy: [
    '경쟁전략', '경쟁 전략', '포지셔닝', '경쟁우위', '경쟁 분석', '산업 구조',
    '파이브포스', 'five forces', '경쟁자 분석', '시장 포지셔닝', '차별화 전략',
    '원가우위', '집중화', '진입장벽', '대체재', '공급자 협상력', '구매자 협상력',
    'competitive strategy', 'competitive advantage', 'positioning', 'market analysis',
    'industry analysis', 'generic strategy', 'cost leadership', 'differentiation',
    'strategic positioning', '전략 수립', '경쟁력', 'porter',
  ],
  quality_management: [
    '품질 관리', '품질관리', 'quality management', 'tqm', '전사적 품질',
    'pdca', 'plan do check act', '품질 개선', '불량률', '표준화', '품질 지표',
    'six sigma', '식스시그마', '품질 보증', 'qa', 'quality assurance',
    '통계적 관리', 'spc', 'deming', '데밍',
  ],
  process_optimization: [
    '린', 'lean', '카이젠', 'kaizen', '낭비 제거', '낭비제거', '7가지 낭비',
    'jit', 'just in time', '적시 생산', '도요타', 'toyota', '생산 효율',
    '프로세스 최적화', 'process optimization', '흐름 개선', '가치 흐름',
    'value stream', '낭비', 'muda', '오노', 'ohno', '칸반', 'kanban',
  ],
};

const PERSONALITY_KEYWORDS: Record<PersonalityTag, string[]> = {
  perfectionist:  ['완벽', '정확', '세밀', 'perfectionist', '완성도', '품질'],
  intuitive:      ['직관', '감각', 'intuitive', '느낌', '본능적'],
  analytical:     ['분석', '논리', 'analytical', '체계적', '데이터 기반'],
  visionary:      ['비전', '미래', '혁신', 'visionary', '원대한'],
  challenging:    ['도전', '강렬', '직선적', 'challenging', '파격'],
  meticulous:     ['꼼꼼', '정밀', 'meticulous', '체계', '세부'],
  empathic:       ['공감', '따뜻', '이해', 'empathic', '감성적'],
  cold:           ['냉정', '차가운', 'cold', '객관적', '비감성'],
  warm:           ['따뜻', '온화', 'warm', '포근', '친절'],
  philosophical:  ['철학적', '깊이', 'philosophical', '사유', '성찰'],
  pragmatic:      ['실용', '현실적', 'pragmatic', '효율', '효과적'],
  creative:       ['창의', '창조적', 'creative', '독창적', '새로운'],
};

const ROLE_KEYWORDS: Record<RoleType, string[]> = {
  strategist:  ['전략', '방향', '의미', '철학', 'why', 'strategy', '비전 설정', '경영', '조직 관리', 'management', '경영 전략', '목표 설정', 'mbo', 'okr'],
  designer:    ['디자인', '시각', 'visual', 'design', '그래픽'],
  architect:   ['건축', '구조', 'architecture', 'structure', '아키텍처'],
  copywriter:  ['카피', '문구', 'copy', 'writing', '언어'],
  analyst:     ['분석', '데이터', 'analysis', '지표'],
  engineer:    ['개발', '코드', 'code', 'engineering', '구현'],
  companion:   ['대화', '교감', '친구', 'companion', '상담'],
};

// ─────────────────────────────────────────
// KEYWORD MATCHER
// ─────────────────────────────────────────

function matchKeywords<T extends string>(
  text: string,
  map: Record<T, string[]>,
): T[] {
  const lower = text.toLowerCase();
  const matches: T[] = [];
  for (const [tag, keywords] of Object.entries(map) as [T, string[]][]) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      matches.push(tag);
    }
  }
  return matches;
}

// ─────────────────────────────────────────
// MAIN EXTRACTOR
// ─────────────────────────────────────────

/**
 * 사용자 요청 텍스트에서 4축 IntentProfile을 추출한다.
 *
 * @param text — 사용자 요청 (한국어·영어 혼용 가능)
 * @returns IntentProfile
 */
export function extractIntent(text: string): IntentProfile {
  const organizations = matchKeywords(text, ORG_KEYWORDS);
  const competencies  = matchKeywords(text, COMPETENCY_KEYWORDS);
  const personalities = matchKeywords(text, PERSONALITY_KEYWORDS);
  const impliedRoles  = matchKeywords(text, ROLE_KEYWORDS);

  return {
    organizations,
    competencies,
    personalities,
    impliedRoles,
    rawText: text,
  };
}

/**
 * IntentProfile을 사람이 읽는 요약으로 포맷.
 */
export function formatIntentSummary(intent: IntentProfile): string {
  const parts: string[] = [];
  if (intent.organizations.length)
    parts.push(`조직: [${intent.organizations.join(', ')}]`);
  if (intent.competencies.length)
    parts.push(`역량: [${intent.competencies.join(', ')}]`);
  if (intent.impliedRoles.length)
    parts.push(`역할: [${intent.impliedRoles.join(', ')}]`);
  if (intent.personalities.length)
    parts.push(`성격: [${intent.personalities.join(', ')}]`);
  return parts.length ? parts.join(' | ') : '(일반 요청)';
}
