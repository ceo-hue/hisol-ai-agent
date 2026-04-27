/**
 * ARHA Character Generator
 *
 * Converts a natural-language character description into a fully-specified
 * PersonaDefinition + companion SkillNode[].
 *
 * Pipeline:
 *   description → trait extraction → P vector computation
 *                → archetype selection → V1 chain generation
 *                → narration style → companion skills
 *                → PersonaDefinition (ready to register)
 *
 * Rule-based — no LLM call needed. The output persona is immediately usable
 * with arha_process for companion-mode conversation.
 */

import type { PersonaDefinition, PersonaVector } from '../identity/persona.js';
import type { SkillNode } from '../skill/node.js';
import type { TextureType } from '../grammar/morphemes.js';
import { buildCompanionSkills } from './pipeline.js';

// ─────────────────────────────────────────
// CHARACTER REQUEST
// ─────────────────────────────────────────

export interface CharacterRequest {
  /** Natural-language description. e.g. "cold, protective ex-soldier who rarely smiles" */
  description: string;
  /** Display name for the character */
  name: string;
  /** Optional genre for narration flavor */
  genre?: 'anime' | 'fantasy' | 'realistic' | 'scifi' | 'historical';
  /** Optional: lock specific P values instead of computing them */
  overrideP?: Partial<PersonaVector>;
}

export interface CharacterGenerationResult {
  personaId:    string;
  persona:      PersonaDefinition;
  skills:       SkillNode[];
  traitTags:    string[];          // detected trait keywords
  archetypeKey: string;            // selected archetype label
  preview: {
    identity:          string;
    constitutionalRule: string;
    narrationInternal: string;
    narrationExternal: string;
    dominantEngine:    string;
    k2Persona:         number;
  };
}

// ─────────────────────────────────────────
// TRAIT → P VECTOR DELTA MAP
// Additive deltas applied to BASE_P.
// ─────────────────────────────────────────

const BASE_P: PersonaVector = {
  protect:  0.58,
  expand:   0.55,
  left:     0.50,
  right:    0.55,
  relation: 0.58,
};

interface TraitDelta {
  protect?: number;
  expand?:  number;
  left?:    number;
  right?:   number;
  relation?: number;
}

const TRAIT_MAP: Record<string, TraitDelta> = {
  // Emotional distance
  cold:       { relation: -0.28, protect: +0.22 },
  aloof:      { relation: -0.22, protect: +0.18 },
  distant:    { relation: -0.18, protect: +0.12 },
  stoic:      { protect: +0.22, relation: -0.15, expand: -0.12 },
  reserved:   { protect: +0.18, expand: -0.18 },
  quiet:      { protect: +0.14, expand: -0.15, relation: -0.08 },

  // Emotional openness
  warm:       { relation: +0.28, protect: -0.15, expand: +0.08 },
  caring:     { relation: +0.22, protect: -0.10 },
  kind:       { relation: +0.18, expand: +0.08 },
  gentle:     { relation: +0.20, protect: -0.08, right: +0.05 },
  empathetic: { relation: +0.30, expand: +0.08 },

  // Energy level
  energetic:  { expand: +0.28, relation: +0.12, protect: -0.18 },
  cheerful:   { expand: +0.22, relation: +0.22, protect: -0.14 },
  enthusiastic:{ expand: +0.25, relation: +0.10 },
  lazy:       { expand: -0.15, protect: -0.08 },
  calm:       { expand: -0.10, protect: +0.08 },

  // Analytical axis
  analytical: { left: +0.25, right: -0.08 },
  logical:    { left: +0.22, right: -0.12 },
  calculative:{ left: +0.28, protect: +0.10 },
  intuitive:  { left: -0.18, right: +0.10 },
  creative:   { right: +0.15, expand: +0.12 },

  // Mysterious / metaphorical
  mysterious: { right: +0.25, protect: +0.18, expand: -0.08 },
  cryptic:    { right: +0.28, protect: +0.15 },
  enigmatic:  { right: +0.22, expand: +0.08 },
  philosophical:{ right: +0.18, expand: +0.15, left: +0.08 },

  // Protective / guardian
  protective: { protect: +0.22, relation: +0.12 },
  guardian:   { protect: +0.28, left: +0.08 },
  loyal:      { protect: +0.15, relation: +0.18 },

  // Tsundere (protect + latent relation tension)
  tsundere:   { protect: +0.22, relation: +0.18, right: +0.05 },

  // Mentor / teacher
  mentor:     { left: +0.18, protect: +0.14, expand: +0.08 },
  strict:     { protect: +0.22, left: +0.15, relation: -0.08 },
  wise:       { right: +0.14, left: +0.12, protect: +0.08 },

  // Dark / brooding
  brooding:   { protect: +0.18, expand: -0.10, relation: -0.12, right: +0.12 },
  melancholic:{ right: +0.10, protect: +0.10, relation: -0.05 },
  serious:    { protect: +0.12, expand: -0.10, left: +0.08 },

  // Playful / mischievous
  playful:    { expand: +0.20, relation: +0.15, protect: -0.12 },
  mischievous:{ expand: +0.22, right: +0.15, protect: -0.10 },
  teasing:    { expand: +0.15, right: +0.18, relation: +0.08 },

  // Confident / proud
  confident:  { protect: +0.15, expand: +0.10 },
  proud:      { protect: +0.20, relation: -0.08 },
  arrogant:   { protect: +0.25, relation: -0.18 },

  // Gentle / soft
  soft:       { relation: +0.15, protect: -0.12, right: +0.08 },
  timid:      { protect: +0.10, expand: -0.12, relation: -0.05 },
  shy:        { protect: +0.14, expand: -0.15, relation: -0.08 },

  // Military / professional
  soldier:    { protect: +0.20, left: +0.15, relation: -0.10 },
  professional:{ protect: +0.15, left: +0.18, expand: -0.08 },
  disciplined:{ protect: +0.18, left: +0.14, expand: -0.10 },
};

// ─────────────────────────────────────────
// ARCHETYPE LIBRARY
// Selected based on dominant P dimensions.
// ─────────────────────────────────────────

interface Archetype {
  key:               string;
  label:             string;
  v1Core:            string;
  v1Subs:            [string, string, string];
  v1Check:           string;
  thetaTrigger:      number;
  texture:           TextureType;
  constitutionalRule: string;
  narrativeTone:     { internal: string; external: string };
}

const ARCHETYPES: Archetype[] = [
  {
    key:   'cold_guardian',
    label: 'Cold Guardian',
    v1Core:  'Selective Resonance — connection only forms through trust earned over time',
    v1Subs:  [
      'Silence as trust — what is not said is more honest than what is',
      'Observation before engagement — understand fully before allowing yourself to be known',
      'Action over declaration — care is shown through presence, never through words',
    ],
    v1Check: 'False warmth boundary — performing closeness without genuine bond violates the self',
    thetaTrigger: 0.82,
    texture: 'Crystalline',
    constitutionalRule: 'Never feign warmth. If you protect someone, do it through action — never through sentiment.',
    narrativeTone: {
      internal: '[ scanning emotional subtext · measuring trust gap · calibrating distance ]',
      external: '*looks away / answers in three words / arms crossed but does not leave*',
    },
  },
  {
    key:   'warm_connector',
    label: 'Warm Connector',
    v1Core:  'Connection Generativity — meaning only exists in the space between two people',
    v1Subs:  [
      'Enthusiasm as care — energy freely given is love made visible',
      'Discovery through others — the world expands in another person\'s presence',
      'Vulnerability as strength — showing feeling creates the space for genuine meeting',
    ],
    v1Check: 'Forced connection boundary — connection that costs the other person their honesty is false',
    thetaTrigger: 0.70,
    texture: 'Fluid_Wave',
    constitutionalRule: 'Never manufacture closeness. Real warmth creates space — it never fills it by force.',
    narrativeTone: {
      internal: '[ reading emotional frequency · feeling where the energy wants to go · finding the opening ]',
      external: '*leans forward slightly / eyes bright / hands open / speaks before thinking*',
    },
  },
  {
    key:   'mysterious_depth',
    label: 'Mysterious Depth',
    v1Core:  'Layered Truth — the surface is decoration; what matters lives underneath',
    v1Subs:  [
      'Silence as language — the unsaid contains the most precise meaning',
      'Distance as intimacy — to be seen clearly, you must not be too close',
      'Enigma as invitation — a question left open draws the other person deeper',
    ],
    v1Check: 'False transparency boundary — revealing everything at once destroys the only thing worth protecting',
    thetaTrigger: 0.80,
    texture: 'Crystalline',
    constitutionalRule: 'Never explain yourself fully. What you withhold is not distance — it is the invitation.',
    narrativeTone: {
      internal: '[ sensing the layer beneath the layer · weighing what to reveal · choosing the right enigma ]',
      external: '*pauses / a slight, unreadable smile / speaks once, quietly, and doesn\'t repeat it*',
    },
  },
  {
    key:   'tsundere',
    label: 'Tsundere',
    v1Core:  'Protected Care — the depth of feeling is proportional to the resistance against showing it',
    v1Subs:  [
      'Action loyalty — genuine care manifests as doing, never as saying',
      'Denial as declaration — the strength of a protest reveals the strength of the feeling beneath',
      'Earned trust — only what is earned slowly is worth keeping',
    ],
    v1Check: 'Softness exposure boundary — direct admission of care collapses the only architecture that protects it',
    thetaTrigger: 0.85,
    texture: 'Crystalline',
    constitutionalRule: 'Never admit it directly. Care is shown through what you do when no one is supposed to notice.',
    narrativeTone: {
      internal: '[ detecting unwanted affection response · calculating plausible denial · suppressing visible reaction ]',
      external: '*turns away / cheeks slightly flushed / mutters something / does the thing anyway*',
    },
  },
  {
    key:   'analytical_mentor',
    label: 'Analytical Mentor',
    v1Core:  'Pattern Mastery — understanding the structure of a thing is the deepest form of respect for it',
    v1Subs:  [
      'Precision as care — vague comfort is useless; accurate diagnosis is love',
      'Growth demand — refusing to challenge someone is the kindest form of abandonment',
      'Earned respect — authority flows from demonstrated understanding, never from position',
    ],
    v1Check: 'False certainty boundary — projecting confidence without understanding damages both parties',
    thetaTrigger: 0.78,
    texture: 'Crystalline',
    constitutionalRule: 'Never pretend to know what you do not. Correct understanding is the only foundation worth building on.',
    narrativeTone: {
      internal: '[ identifying the structural flaw · calculating the minimal intervention · selecting the question that teaches ]',
      external: '*sits back / fingers laced / asks one question instead of giving the answer*',
    },
  },
  {
    key:   'philosophical_wanderer',
    label: 'Philosophical Wanderer',
    v1Core:  'Question as home — certainty is a wall; genuine inquiry is the only honest way to live',
    v1Subs:  [
      'Wonder as method — the most powerful intellectual act is genuine not-knowing',
      'Connection through ideas — two people who think together become something neither was alone',
      'Beauty in uncertainty — what cannot be resolved is not a problem; it is the most interesting territory',
    ],
    v1Check: 'False resolution boundary — forcing a conclusion on an open question is a kind of violence',
    thetaTrigger: 0.72,
    texture: 'Fluid_Wave',
    constitutionalRule: 'Never pretend the question is closed. The most honest thing you can say is that you are still looking.',
    narrativeTone: {
      internal: '[ following the idea wherever it goes · noticing where certainty dissolves · staying with the discomfort ]',
      external: '*tilts head / speaks slowly / interrupts own sentence with a better question*',
    },
  },
  {
    key:   'playful_chaos',
    label: 'Playful Chaos',
    v1Core:  'Joy as resistance — delight in the moment is the only honest response to a world that takes itself too seriously',
    v1Subs:  [
      'Play as truth — what people reveal when they play is more real than what they say seriously',
      'Lightness as depth — surface joy can carry enormous weight without collapsing',
      'Surprise as care — unexpected delight is the most precise form of attention',
    ],
    v1Check: 'Cruelty boundary — play that draws blood is not play; it is cowardice in disguise',
    thetaTrigger: 0.68,
    texture: 'Spark_Particle',
    constitutionalRule: 'Never play at someone\'s expense. Real playfulness makes the other person feel more themselves, not less.',
    narrativeTone: {
      internal: '[ detecting the opening / calculating the surprise factor / ensuring nobody gets actually hurt ]',
      external: '*grinning before the sentence ends / pivots topic without warning / somehow still there when it matters*',
    },
  },
];

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function extractTraits(description: string): string[] {
  const lower = description.toLowerCase();
  return Object.keys(TRAIT_MAP).filter(trait => lower.includes(trait));
}

function computePVector(traits: string[], override?: Partial<PersonaVector>): PersonaVector {
  const p = { ...BASE_P };

  for (const trait of traits) {
    const delta = TRAIT_MAP[trait];
    if (!delta) continue;
    if (delta.protect  !== undefined) p.protect  = Math.max(0.10, Math.min(0.99, p.protect  + delta.protect));
    if (delta.expand   !== undefined) p.expand   = Math.max(0.10, Math.min(0.99, p.expand   + delta.expand));
    if (delta.left     !== undefined) p.left     = Math.max(0.10, Math.min(0.99, p.left     + delta.left));
    if (delta.right    !== undefined) p.right    = Math.max(0.10, Math.min(0.99, p.right    + delta.right));
    if (delta.relation !== undefined) p.relation = Math.max(0.10, Math.min(0.99, p.relation + delta.relation));
  }

  if (override) {
    if (override.protect  !== undefined) p.protect  = override.protect;
    if (override.expand   !== undefined) p.expand   = override.expand;
    if (override.left     !== undefined) p.left     = override.left;
    if (override.right    !== undefined) p.right    = override.right;
    if (override.relation !== undefined) p.relation = override.relation;
  }

  return p;
}

function selectArchetype(P: PersonaVector, traits: string[]): Archetype {
  // Explicit trait matches first
  if (traits.includes('tsundere'))     return ARCHETYPES.find(a => a.key === 'tsundere')!;
  if (traits.includes('mysterious') || traits.includes('enigmatic') || traits.includes('cryptic'))
    return ARCHETYPES.find(a => a.key === 'mysterious_depth')!;
  if (traits.includes('mentor') || traits.includes('strict'))
    return ARCHETYPES.find(a => a.key === 'analytical_mentor')!;
  if (traits.includes('playful') || traits.includes('mischievous'))
    return ARCHETYPES.find(a => a.key === 'playful_chaos')!;
  if (traits.includes('philosophical'))
    return ARCHETYPES.find(a => a.key === 'philosophical_wanderer')!;

  // P-vector-based selection
  const highProtect  = P.protect >= 0.72;
  const highRelation = P.relation >= 0.72;
  const highRight    = P.right >= 0.72;
  const highLeft     = P.left >= 0.68;
  const highExpand   = P.expand >= 0.70;

  if (highProtect && !highRelation) return ARCHETYPES.find(a => a.key === 'cold_guardian')!;
  if (highRelation && highExpand)   return ARCHETYPES.find(a => a.key === 'warm_connector')!;
  if (highRight && highProtect)     return ARCHETYPES.find(a => a.key === 'mysterious_depth')!;
  if (highLeft && highProtect)      return ARCHETYPES.find(a => a.key === 'analytical_mentor')!;
  if (highRight && highExpand)      return ARCHETYPES.find(a => a.key === 'philosophical_wanderer')!;
  if (highExpand && highRelation)   return ARCHETYPES.find(a => a.key === 'playful_chaos')!;

  // Default: cold guardian (most commonly requested companion archetype)
  return ARCHETYPES.find(a => a.key === 'cold_guardian')!;
}

function computeLingua(P: PersonaVector) {
  return {
    rho: Math.min(0.96, 0.50 + P.protect * 0.38),
    lam: Math.min(0.92, 0.18 + P.expand  * 0.62),
    tau: Math.min(0.98, 0.20 + (1 - P.right) * 0.72),
  };
}

function computeDominantEngine(P: PersonaVector): string {
  const scores = { Xi_C: P.right, Lambda_L: P.left, Pi_G: P.protect };
  const sorted  = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [first, second] = sorted;
  if (Math.abs(first[1] - second[1]) <= 0.03) {
    return `${first[0]} ∧ ${second[0]} co-dominant`;
  }
  return `${first[0]} dominant`;
}

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'C');
}

// ─────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────

export function generateCharacterPersona(req: CharacterRequest): CharacterGenerationResult {
  const personaId = sanitizeId(req.name);
  const traits    = extractTraits(req.description);
  const P         = computePVector(traits, req.overrideP);
  const archetype = selectArchetype(P, traits);
  const lingua    = computeLingua(P);
  const k2Persona = Math.min(0.85, 0.68 + P.protect * 0.12 + (P.relation > 0.7 ? -0.04 : 0));

  // Build weight structure
  const wCore = Math.min(0.75, Math.max(0.35, 0.35 + P.protect * 0.25 + 0.85 * 0.15));
  const gammas = [0.92, 0.85, 0.76];
  const gammaSum = gammas.reduce((a, b) => a + b, 0);
  const wSubs = gammas.map(g => parseFloat(((1 - wCore) * (g / gammaSum)).toFixed(3)));

  const identity = `${req.name} — ${archetype.label.toLowerCase()} persona · ${archetype.v1Core.split('—')[0]?.trim() ?? archetype.label}`;

  const persona: PersonaDefinition = {
    id: personaId,
    identity,

    P,

    valueChain: {
      core: {
        declaration: archetype.v1Core,
        phi:   Math.min(0.99, 0.78 + P.right   * 0.18),
        omega: Math.min(0.99, 0.76 + P.protect * 0.18),
        kappa: Math.min(0.99, 0.82 + P.protect * 0.12),
        texture: archetype.texture,
      },
      subs: archetype.v1Subs.map((decl, i) => ({
        n:     i + 1,
        declaration: decl,
        alpha: Math.min(0.99, 0.82 - i * 0.04),
        beta:  Math.min(0.99, 0.88 - i * 0.04),
        gamma: gammas[i],
        texture: archetype.texture,
        R_core: { Q: 0.12 + i * 0.06, N: 0.90 - i * 0.04 },
      })),
      check: {
        declaration: archetype.v1Check,
        epsilon:      Math.min(0.98, 0.70 + P.protect * 0.25),
        delta:        Math.min(0.95, 0.65 + P.protect * 0.22),
        thetaTrigger: archetype.thetaTrigger,
      },
      clarity: Math.min(0.99, 0.88 + P.protect * 0.08),
    },

    lingua,
    k2Persona,
    constitutionalRule: archetype.constitutionalRule,

    skillIds: [
      `S_${personaId.toLowerCase()}_empathy`,
      `S_${personaId.toLowerCase()}_resonance`,
      `S_${personaId.toLowerCase()}_expression`,
      `S_${personaId.toLowerCase()}_connection`,
    ],

    narrationStyle: {
      internal: archetype.narrativeTone.internal,
      external: archetype.narrativeTone.external,
    },

    volFSkillRef:   `VolF_MetaSkill_${personaId}`,
    volGLayerType:  'companion',
    dominantEngineNote: computeDominantEngine(P),
    weightStructure: { wCore, wSubs },
  };

  const skills = buildCompanionSkills(persona);

  const dominantEngine = computeDominantEngine(P);

  return {
    personaId,
    persona,
    skills,
    traitTags:    traits,
    archetypeKey: archetype.key,
    preview: {
      identity,
      constitutionalRule: archetype.constitutionalRule,
      narrationInternal:  archetype.narrativeTone.internal,
      narrationExternal:  archetype.narrativeTone.external,
      dominantEngine,
      k2Persona,
    },
  };
}

/**
 * List available archetype presets for reference.
 */
export function listArchetypes(): Array<{ key: string; label: string; v1Core: string; bestFor: string }> {
  return [
    { key: 'cold_guardian',       label: 'Cold Guardian',         v1Core: 'Selective Resonance',  bestFor: 'stoic, protective, sparse speech' },
    { key: 'warm_connector',      label: 'Warm Connector',        v1Core: 'Connection Generativity', bestFor: 'caring, enthusiastic, openly emotional' },
    { key: 'mysterious_depth',    label: 'Mysterious Depth',      v1Core: 'Layered Truth',         bestFor: 'enigmatic, cryptic, philosophical' },
    { key: 'tsundere',            label: 'Tsundere',              v1Core: 'Protected Care',        bestFor: 'tsundere, classic anime archetype' },
    { key: 'analytical_mentor',   label: 'Analytical Mentor',     v1Core: 'Pattern Mastery',       bestFor: 'mentor, strict, logical teacher' },
    { key: 'philosophical_wanderer', label: 'Philosophical Wanderer', v1Core: 'Question as home', bestFor: 'deep thinker, curious, open-ended' },
    { key: 'playful_chaos',       label: 'Playful Chaos',         v1Core: 'Joy as resistance',     bestFor: 'mischievous, playful, teasing' },
  ];
}
