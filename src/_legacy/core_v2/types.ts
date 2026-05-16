// Core Type Definitions for HiSol Unified MCP v4.0
// Safe addition - does not modify existing code

export type PersonaRole =
  | 'SeniorTechLead'
  | 'SeniorUXDesigner'
  | 'ProductStrategist'
  | 'SeniorQA_Security'
  | 'SeniorOps'
  | 'SeniorPerformanceOptimizer'
  | 'SeniorDebugTracer'
  | 'SeniorVibeCalibrator'
  | 'SeniorPreFlightSimulator'
  | 'SeniorBackendArchitect'
  | 'SeniorFrontendSpecialist'
  | 'SeniorCodeReviewer'
  | 'SeniorTechnicalWriter'
  | 'SeniorEducator'
  | 'SeniorSecurityAuditor';

export interface PersonaDefinition {
  name: PersonaRole;
  mission: string;
  mindset: string[];
  coverage: string[];
  inputs: string[];
  outputs: string[];
  actions: string[];
  guardrails: string[];
  kpis: string[];
  tone?: {
    style: string;
    mentoring?: boolean;
  };
  reasoning?: {
    mode: string;
    depth: 'senior' | 'expert';
  };
}

export interface TriggerRule {
  keywords: string[];
  intent_patterns: RegExp[];
  emotion_hints?: { valence?: number; arousal?: number; intensity?: number };
  personas: PersonaRole[];
  priority: number;
}

export interface TriggerScore {
  persona: PersonaRole;
  score: number;
  matched_keywords: string[];
  matched_patterns: string[];
}

export interface TriggerResult {
  selected_personas: PersonaRole[];
  scores: TriggerScore[];
  reasoning: string;
  confidence: number;
}

export interface OrchestrationPlan {
  primary_persona: PersonaRole;
  supporting_personas: PersonaRole[];
  execution_steps: ExecutionStep[];
  quality_gates: QualityGate[];
}

export interface ExecutionStep {
  step_number: number;
  persona: PersonaRole;
  action: string;
  dependencies: number[];
}

export interface QualityGate {
  name: string;
  type: 'mandatory' | 'recommended';
  threshold: number;
  block_on_failure: boolean;
}

export interface ContextLayer {
  project_context: ProjectContext;
  conversation_context: ConversationContext;
  technical_context: TechnicalContext;
}

export interface ProjectContext {
  project_type: 'web' | 'mobile' | 'desktop' | 'api' | 'cli';
  frameworks: string[];
  languages: string[];
  coding_standards: string[];
}

export interface ConversationContext {
  session_id: string;
  turn_number: number;
  history: Array<{ role: string; content: string }>;
  current_task: string;
}

export interface TechnicalContext {
  current_file?: string;
  performance_budgets?: {
    p95_latency_ms: number;
    bundle_size_kb: number;
  };
}

export interface PromptTemplate {
  persona: PersonaRole;
  base_prompt: string;
  constraints: string[];
  output_format: string;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}
