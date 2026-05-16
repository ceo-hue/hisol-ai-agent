/**
 * ARHA Vol.R — Routing: Persona Scorer
 *
 * 4축 가중 합산으로 각 페르소나의 요청 적합도를 계산.
 *
 * Score = w_org(0.15) × orgScore
 *       + w_role(0.25) × roleScore
 *       + w_comp(0.45) × competencyScore   ← 가장 중요
 *       + w_pers(0.15) × personalityScore
 *
 * 라우팅 메타데이터가 없는 페르소나는 중립 점수(0.40)를 받음.
 */

import type { PersonaDefinition } from '../identity/persona.js';
import type { IntentProfile } from './intent.js';
import type { CompetencyTag, OrganizationType, PersonalityTag, RoleType } from './meta.js';

// ─────────────────────────────────────────
// SCORE WEIGHTS
// ─────────────────────────────────────────

const W = {
  organization: 0.15,
  role:         0.25,
  competency:   0.45,
  personality:  0.15,
} as const;

// ─────────────────────────────────────────
// RESULT
// ─────────────────────────────────────────

export interface PersonaScore {
  personaId:    string;
  totalScore:   number;
  layerPriority:number;
  canLead:      boolean;
  breakdown: {
    organizationScore:  number;
    roleScore:          number;
    competencyScore:    number;
    personalityScore:   number;
  };
}

// ─────────────────────────────────────────
// PARTIAL MATCH HELPERS
// ─────────────────────────────────────────

/**
 * 집합 A 중 B와 겹치는 비율.
 * A가 비어있으면 0.5 (중립) 반환 — "요청에 이 축 정보 없음"
 */
function overlapRatio<T>(a: T[], b: T[]): number {
  if (a.length === 0) return 0.5;   // 요청에 해당 축 정보 없음 → 중립
  if (b.length === 0) return 0.0;
  const matched = a.filter(item => b.includes(item)).length;
  return matched / a.length;
}

// ─────────────────────────────────────────
// PER-AXIS SCORERS
// ─────────────────────────────────────────

function scoreOrganization(
  intentOrgs: OrganizationType[],
  personaOrgs: OrganizationType[],
): number {
  return overlapRatio(intentOrgs, personaOrgs);
}

function scoreRole(
  intentRoles: RoleType[],
  personaRole: RoleType,
): number {
  if (intentRoles.length === 0) return 0.5;
  return intentRoles.includes(personaRole) ? 1.0 : 0.2;
}

function scoreCompetency(
  intentComps: CompetencyTag[],
  personaComps: CompetencyTag[],
): number {
  return overlapRatio(intentComps, personaComps);
}

function scorePersonality(
  intentPerss: PersonalityTag[],
  personaPerss: PersonalityTag[],
): number {
  return overlapRatio(intentPerss, personaPerss);
}

// ─────────────────────────────────────────
// MAIN SCORER
// ─────────────────────────────────────────

/**
 * 단일 페르소나의 적합도 점수를 계산.
 */
export function scorePersona(
  persona: PersonaDefinition,
  intent:  IntentProfile,
): PersonaScore {
  const routing = persona.routing;

  // routing 메타데이터 없는 페르소나는 중립 점수
  if (!routing) {
    return {
      personaId:    persona.id,
      totalScore:   0.40,
      layerPriority: 99,
      canLead:      false,
      breakdown: {
        organizationScore: 0.40,
        roleScore:         0.40,
        competencyScore:   0.40,
        personalityScore:  0.40,
      },
    };
  }

  const orgScore  = scoreOrganization(intent.organizations,  routing.organization);
  const roleScore = scoreRole(intent.impliedRoles,           routing.role.type);
  const compScore = scoreCompetency(intent.competencies,     routing.competencies);
  const persScore = scorePersonality(intent.personalities,   routing.personality);

  const total =
    W.organization * orgScore  +
    W.role         * roleScore +
    W.competency   * compScore +
    W.personality  * persScore;

  return {
    personaId:    persona.id,
    totalScore:   parseFloat(total.toFixed(4)),
    layerPriority: routing.role.layerPriority,
    canLead:      routing.role.canLead,
    breakdown: {
      organizationScore:  parseFloat(orgScore.toFixed(4)),
      roleScore:          parseFloat(roleScore.toFixed(4)),
      competencyScore:    parseFloat(compScore.toFixed(4)),
      personalityScore:   parseFloat(persScore.toFixed(4)),
    },
  };
}

/**
 * 전체 페르소나 목록을 점수순으로 정렬.
 */
export function rankPersonas(
  personas: PersonaDefinition[],
  intent:   IntentProfile,
): PersonaScore[] {
  return personas
    .map(p => scorePersona(p, intent))
    .sort((a, b) => b.totalScore - a.totalScore);
}
