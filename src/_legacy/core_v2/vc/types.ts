/**
 * ARHA Vol.F_VC — Universal 6-Phase Value Chain Pipeline Types
 * Persona-agnostic scaffolding · Lens-driven domain adaptation
 */

export type PhaseId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

// ─────────────────────────────────────────
// PERSONA LENS
// ─────────────────────────────────────────

export interface PVector {
  protect: number;
  expand: number;
  left: number;
  right: number;
  relation: number;
}

export interface Lingua {
  rho: number;
  lambda: number;
  tau: number;
}

export interface PersonaMeta {
  persona_id: string;
  name: string;
  v1_core: string;
  p_vector: PVector;
  lingua: Lingua;
  constitutional_law: string[];
  dominant_engine: string;
}

export interface ValuationRedef {
  metric_name: string;
  redefinition: string;
  domain_thresholds?: Record<string, string>;
  constitutional_overlay?: string[];
  hook_types?: Record<string, string>;
  dependency_signals?: string[];
  healthy_distance_definition?: string;
  peak_pattern_definition?: string;
  dissipation_categories?: string[];
}

export interface PhaseLens {
  reframe: string;
  valuation_redef: ValuationRedef;
  characteristic_move: string;
  failure_signals: string[];
}

export interface DomainSC {
  id: string;
  condition: string;
  description: string;
  detection_method: string[];
  auto_block: string;
  senior_note: string;
}

export interface PersonaLens {
  persona_meta: PersonaMeta;
  phase_lenses: Record<PhaseId, PhaseLens>;
  domain_specific_SCs?: Partial<Record<PhaseId, DomainSC[]>>;
}

// ─────────────────────────────────────────
// PIPELINE EXECUTION
// ─────────────────────────────────────────

export interface PhaseResult {
  phase: PhaseId;
  score: number;
  passed: boolean;
  metric_name: string;
  metric_value: number;
  blocks_triggered: string[];
  package: Record<string, unknown>;
  trail_marker: string;
}

export interface VCRunResult {
  persona_id: string;
  phase_results: PhaseResult[];
  vc_total: number;
  grade: 'senior' | 'professional' | 'junior';
  output_permitted: boolean;
  constitutional_blocked: boolean;
  trail: string[];
}

export interface VCInput {
  text: string;
  context?: string;
  prior_state?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// QUALITY GATE
// ─────────────────────────────────────────

export const PHASE_WEIGHTS: Record<PhaseId, number> = {
  P1: 0.15,
  P2: 0.15,
  P3: 0.25,
  P4: 0.20,
  P5: 0.15,
  P6: 0.10,
};

export const PHASE_PASS_THRESHOLD = 0.70;
export const SENIOR_GRADE_THRESHOLD = 0.82;
export const PROFESSIONAL_GRADE_THRESHOLD = 0.70;
