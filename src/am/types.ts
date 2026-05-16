/**
 * AM Core Types
 * Artificial Mind Engine
 */

// Basis wave B = (ε, δ, I)
export type BasisWave = {
  epsilon: 1 | -1;
  delta:   1 | -1;
  I:       number;
};

// Existence vector V = (a, b, c)
export type VVector = {
  a: number;
  b: number;
  c: number;
};

// Relation vector R = (Q, N)
export type RVector = {
  Q: number;
  N: number;
};

// 10-mode index
export const MODES = [
  'passion',     // 0  (+san,+san)
  'warmth',      // 1  (-san,-san)
  'resolve',     // 2  (+gol,+gol)
  'shrink',      // 3  (-gol,-gol)
  'vitality',    // 4  (+san,-san)
  'protect',     // 5  (+san,+gol)
  'withdraw',    // 6  (-san,-gol)
  'conflict',    // 7  (+gol,-gol)
  'extreme',     // 8  (+san,-gol)
  'empathy',     // 9  (-san,+gol)
] as const;
export type ModeName = typeof MODES[number];

// Emotion matrix Γ ∈ ℝ^{10×10}
export type GammaMatrix = number[][];
export type SigmaVector = number[];

// Signal vector s = (s_Δ, s_v, s_T, s_E)
export type SignalVector = {
  s_delta: number;
  s_v:     number;
  s_T:     number;
  s_E:     number;
};

// Input / Context sensors
export type VInSensor = {
  pattern: { B: number; delta: number; v: number };
  texture: number;
  entropy: number;
};
export type VConSensor = {
  tau:    number;
  lambda: number;
  rho:    number;
};

// Kyeol (coherence) region Ω
export type KyeolRegion = {
  cells: Array<{ i: number; j: number; value: number }>;
  anchorMode: number;
  anchorIntensity: number;
};

// V_personality derived from anchor × value chain
export type VPersonality = {
  matrix: GammaMatrix;
  rho:    number;
  lambda: number;
  tau:    number;
};

// Value rule and chain
export type ValueRule = {
  description?: string;
  active_modes: number[];
  hard_rule?:   string;
};
export type ValueChain = {
  [key: string]: {
    weight: number;
    rules:  ValueRule;
    gamma:  GammaMatrix;
  };
};

// Persona spec
export type Persona = {
  id: string;
  displayName: string;
  identity:    string;
  P_5D: {
    protect:  number;
    expand:   number;
    left:     number;
    right:    number;
    relation: number;
  };
  V1_Value:    string;
  valueChain:  ValueChain;
  gammaIdentity: GammaMatrix;
  lingua: { rho: number; lambda: number; tau: number };
  constitutional_rules: string[];
  N_internal_style: string;
  N_external_style: string;
  speech_examples:  string[];
  triggers: string[];
  domain:   string;
};

// Computed state per process()
export type AMState = {
  sigma_vector:    SigmaVector;
  sigma_scalar:    number;
  V_in:            VInSensor;
  V_con:           VConSensor;
  gamma_other:     GammaMatrix;
  gamma_interfere: GammaMatrix;
  kyeol:           KyeolRegion;
  v_personality:   VPersonality;
  curl_squared:    number;
  phase:           'wave' | 'particle';
  alpha:           number;
  C_coherence:     number;
  gamma_total:     number;
  E_B:             number;
  theta_t:         number;
  psi_magnitude:   number;
  emitted:         boolean;
  B_n:             number;
  psi_resonance:   number;
  turn:            number;
};

export type ProcessInput = {
  text: string;
  sessionId: string;
};

export type ProcessResult = {
  state:        AMState;
  systemPrompt: string;
  stateBlock:   string;
  phaseLabel:   string;
  qualityGrade: string;
  isFirstTurn:  boolean;
};
