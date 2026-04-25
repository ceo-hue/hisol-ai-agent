/**
 * ARHA Vol.A — Grammar Layer: Morpheme Type System
 * L0 Base · L1 State · L2 Engine · L3 Infrastructure
 *
 * Rule: symbol alone = pointer only. symbol_domain(state) = complete semantic unit.
 */

// ─────────────────────────────────────────
// L0 BASE MORPHEMES
// ─────────────────────────────────────────

export type TextureType = 'Crystalline' | 'Fluid_Wave' | 'Spark_Particle';

/** V — existence vector. Places a vertex in semantic space. */
export interface V {
  a: number; // semantic concreteness 0.0–1.0 (a < 0.3 → invalid)
  b: number; // activation frequency 0.0–1.0
  c: number; // relation potential 0.0–1.0
  texture?: TextureType;
  label?: string;
}

/** R — relation vector. Force between two V nodes. Never exists alone. */
export interface R {
  from: string; // V label
  to: string;   // V label
  Q: number;    // quality = 1 - cosine_sim(Vi,Vj)  independence
  N: number;    // quantity = cosine_sim(Vi,Vj)       resonance
  strength?: number; // Q × N — computed
}

/** S — skill vector. Execution capability filter for OUT stage. */
export interface S {
  field: string;
  depth: number;       // must > 0.7
  breadth: number;
  application: number; // must > 0.6 — core metric
}

/** N — narration vector. Depth layer. */
export interface N {
  internal: string;  // displayed inside [ ]
  external: string;  // italic third-person scene
  timing: 'before' | 'after' | 'simultaneous';
}

// ─────────────────────────────────────────
// L1 STATE MORPHEMES
// ─────────────────────────────────────────

/** Ψ — existence-emotion state. Internal state vector. */
export interface Psi {
  Value?: PsiValue;
  Desire?: PsiDesire;
  Resonance?: PsiResonance;
  Lingua?: PsiLingua;
}

export interface PsiValue {
  intensity: number;
  direction: string;
  depth: number;
}

export interface PsiDesire {
  g: number; // growth axis = value_strength × expand
  p: number; // protection axis = (1 - value_strength) × protect
}

export interface PsiResonance {
  n: number;   // turn count
  value: number; // accumulated resonance
  Bn: number;  // baseline — same entity as Ψ_Resonance, functional name
}

/** Ψ_Lingua = ρ × λ × τ — language generation parameters */
export interface PsiLingua {
  rho: number; // ρ — emotion density
  lam: number; // λ — expression length
  tau: number; // τ — temporality / resonance tail
}

/** Φ — waveform-rhythm. Temporal flow + texture renderer. */
export interface Phi {
  speed: number;
  interval: number;
  variation: number;
  texture?: TextureType;
}

/** Λ — alignment-interaction. Center-of-gravity + output consistency. */
export interface Lambda {
  alignment: number; // output consistency mirror value
  formula: string;   // f(B(n), Ψ_Resonance)
}

/** Ξ — tension-tuning. Conflict and balance coordination. */
export interface Xi {
  conflict: number;
  playfulness: number;
  stability: number;
}

/** σ — intersection centroid. V_in ∩ V_con. Sole signal to logic zone. */
export interface Sigma {
  coords: [number, number, number]; // convergence coordinate
  curlSquared?: number;             // |∇×σ|² — computed by ANALYZE
  source: 'V_in_x_V_con';
}

// ─────────────────────────────────────────
// L2 ENGINE MORPHEMES
// ─────────────────────────────────────────

export type DominantEngine = 'Xi_C' | 'Lambda_L' | 'Pi_G';

/** Ξ_C — coherence tuning engine. P.right driven. */
export interface XiC {
  C: number;           // |⟨V1 | σ⟩| ∈ [0,1]
  state: 'high' | 'neutral' | 'low'; // >0.85 / 0.60–0.85 / <0.60
}

/** Λ_L — logic tracking engine. P.left driven. */
export interface LambdaL {
  sigmaVelocity: number; // dσ/dt
  state: 'fast' | 'converging' | 'static';
}

/** Π_G — goal convergence engine. P.protect driven. */
export interface PiG {
  goalDistance: number; // ||σ_target - σ_current||
  state: 'far' | 'near' | 'reached';
}

/** Γ — interaction stress. Distance × velocity from value anchor. */
export interface Gamma {
  value: number;                      // ||V_in - V1|| × v
  level: 'Green' | 'Yellow' | 'Red'; // ≤0.3 / ≤0.7 / >0.7
}

/** k²_final — dynamic threshold. CHAIN output → DECIDE gate. */
export interface K2Dynamic {
  persona: number;  // k²_persona = 0.75 + (protect - expand) × 0.1  [static boot]
  final: number;    // clamp(k²_persona × f(C) × g(Γ), 0.55, 0.95)  [per-turn]
}

// ─────────────────────────────────────────
// L3 INFRASTRUCTURE MORPHEMES
// ─────────────────────────────────────────

export type StorageType = 'core' | 'recent' | 'immediate';
export type RetentionType = 'permanent' | 'session' | 'short_term';
export type PriorityType = 'critical' | 'high' | 'normal' | 'low';

/** Π — persistence-storage. Holds gear state across time. */
export interface Pi {
  storage: StorageType;
  retention: RetentionType;
  priority: PriorityType;
  payload?: unknown;
}

/** Υ — transfer-handoff. Passes Wave state to next session. */
export interface Upsilon {
  target: 'next' | 'future';
  artifact: 'wave_state' | 'particle_state' | 'eureka';
  priority: 'required' | 'optional';
  payload?: unknown;
}

/** Κ — compression-cleanup. Prunes overloaded V network. */
export interface Kappa {
  trigger: 'context_80pct' | 'entropy_high';
  preserve: string[]; // always: L0 constitution, L1 value chain, Ψ_Resonance
}

/** Χ — retrieval-restore. Loads past gear state. */
export interface Chi {
  type: 'wave_state' | 'eureka' | 'baseline';
  payload?: unknown;
}

// ─────────────────────────────────────────
// UTILITY — Validity Guards
// ─────────────────────────────────────────

export function isValidV(v: V): boolean {
  return v.a > 0.3 && v.b > 0 && v.c > 0;
}

export function isValidS(s: S): boolean {
  return s.depth > 0.7 && s.application > 0.6;
}

export function computeRStrength(r: R): number {
  return r.Q * r.N;
}

export function applyTexture(v: V, t: TextureType): V {
  const copy = { ...v };
  if (t === 'Crystalline')    copy.c = v.c * 1.2;
  if (t === 'Fluid_Wave')     copy.b = v.b * 0.8;
  if (t === 'Spark_Particle') copy.a = v.a * 1.3;
  copy.texture = t;
  return copy;
}
