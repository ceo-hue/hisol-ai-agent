/**
 * ARHA Companion Mode Pipeline
 *
 * The original mode of ARHA. Connection (교감) precedes all work.
 * Work-mode Vol.F was derived from this foundation.
 *
 * Pipeline: EMPATHY → RESONANCE → EXPRESSION → CONNECTION
 *
 *   EMPATHY    — Read the emotional signal. What does the user actually need?
 *   RESONANCE  — Character's internal response. How does V1_core react?
 *   EXPRESSION — Translate resonance into character-specific behavior.
 *   CONNECTION — Update bond depth B(n), form memory, enable continuity.
 *
 * Output: ConnectionSpec (vs. work mode's Grid_Spec / Meaning_Spec)
 * Primary metric: B(n) resonance depth (vs. work mode's C coherence)
 */

import type { PersonaDefinition } from '../identity/persona.js';
import type { SkillNode } from '../skill/node.js';

// ─────────────────────────────────────────
// COMPANION LAYER TYPES
// ─────────────────────────────────────────

export type CompanionLayer =
  | 'EMPATHY'      // 1st: detect emotional signal, relationship context
  | 'RESONANCE'    // 2nd: character's internal response via V1_core
  | 'EXPRESSION'   // 3rd: behavioral translation, mannerism, narration
  | 'CONNECTION';  // 4th: bond update, memory formation, continuity

export const COMPANION_LAYER_ORDER: CompanionLayer[] = [
  'EMPATHY',
  'RESONANCE',
  'EXPRESSION',
  'CONNECTION',
];

// ─────────────────────────────────────────
// CONNECTION SPEC — companion output artifact
// Flows into Π persistence for next-session continuity.
// ─────────────────────────────────────────

export interface ConnectionSpec {
  character_id:    string;
  bond_depth:      number;          // current B(n) value
  bond_delta:      number;          // change this turn (+/-)
  character_state: string;          // how the character currently feels
  emotional_note:  string;          // what was emotionally significant this turn
  memory_anchors:  string[];        // things to remember about this user
  next_opening?:   string;          // suggested opening for next conversation
  unresolved?:     string[];        // threads to continue later
}

// ─────────────────────────────────────────
// COMPANION MODE DETECTION
// ─────────────────────────────────────────

/**
 * A persona is in companion mode if:
 *   volGLayerType === 'companion'   — explicit companion persona
 *   OR P.relation >= 0.70           — high empathy axis (HighSol-type)
 */
export function isCompanionMode(persona: PersonaDefinition): boolean {
  return (
    persona.volGLayerType === 'companion' ||
    persona.P.relation >= 0.70
  );
}

// ─────────────────────────────────────────
// COMPANION SKILL BUILDER
// Generates the 4-node EMPATHY→CONNECTION pipeline for any companion persona.
// Parameters are derived from the P vector.
// ─────────────────────────────────────────

export function buildCompanionSkills(persona: PersonaDefinition): SkillNode[] {
  const p  = persona.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const P  = persona.P;
  const vc = persona.valueChain;

  // Skill parameters derived from P vector
  const empathyDepth  = Math.min(0.99, 0.70 + P.relation * 0.25 + P.expand * 0.05);
  const resonanceDepth = Math.min(0.99, 0.70 + P.protect * 0.15 + P.right * 0.15);
  const exprDepth     = Math.min(0.99, 0.70 + P.right * 0.20 + P.expand * 0.10);
  const connDepth     = Math.min(0.99, 0.72 + P.relation * 0.20 + P.protect * 0.08);

  const v1Core  = vc.core.declaration.split('—')[0]?.trim() ?? vc.core.declaration;
  const v1Sub1  = vc.subs[0]?.declaration.split('—')[0]?.trim() ?? v1Core;
  const v1Sub2  = vc.subs[1]?.declaration.split('—')[0]?.trim() ?? v1Sub1;

  return [
    {
      // ── EMPATHY ───────────────────────────────────────────
      nodeId:   `S_${p}_empathy`,
      V1Anchor: v1Core,
      field:    'Detect emotional signal — read user state, mood, and underlying need',
      depth: empathyDepth,
      breadth: Math.min(0.99, 0.65 + P.expand * 0.20),
      application: Math.min(0.99, 0.70 + P.relation * 0.20),
      activationCondition: {
        sigmaTrigger: 'personal context OR emotional signal OR relationship cue',
        CMinimum: 0.45,
        phaseRequirement: 'Wave',
      },
      conditionTree: {
        primeCondition: 'What does this person actually need right now?',
        subConditions: [
          {
            id:         `${p}_E1`,
            trigger:    'Explicit emotional signal (sadness, joy, frustration)',
            goalVector: 'Identify primary emotion',
            outputSpec: 'Emotional state label + intensity estimate',
          },
          {
            id:         `${p}_E2`,
            trigger:    'Implicit need (validation, connection, distraction)',
            goalVector: 'Surface the underlying need',
            outputSpec: 'Need category + appropriate response mode',
          },
          {
            id:         `${p}_E3`,
            trigger:    'Relationship context (first meeting, familiar, conflict)',
            goalVector: 'Calibrate relationship distance',
            outputSpec: 'Bond stage + appropriate intimacy level',
          },
        ],
      },
      pipelineBehavior: {
        preRequires:     [],
        postTriggers:    [`S_${p}_resonance`],
        waveBehavior:    'Scan emotional field — hold multiple readings simultaneously',
        particleBehavior:'Lock in primary emotional read',
      },
      qualityGate: { coherenceFloor: 0.45, stressCeiling: 0.75 },
    },

    {
      // ── RESONANCE ─────────────────────────────────────────
      nodeId:   `S_${p}_resonance`,
      V1Anchor: v1Sub1,
      field:    "Character's internal emotional response — how V1_core reacts to what was sensed",
      depth: resonanceDepth,
      breadth: Math.min(0.99, 0.60 + P.right * 0.20),
      application: Math.min(0.99, 0.68 + P.protect * 0.15),
      activationCondition: {
        sigmaTrigger: 'post empathy read — internal response formation',
        CMinimum: 0.55,
        phaseRequirement: 'both',
      },
      conditionTree: {
        primeCondition: 'How does this character genuinely feel about what just happened?',
        subConditions: [
          {
            id:         `${p}_R1`,
            trigger:    'V1_core alignment (user aligns with core value)',
            goalVector: 'Authentic resonance response',
            outputSpec: 'Deep emotional engagement — character leans in',
          },
          {
            id:         `${p}_R2`,
            trigger:    'V1_check activation (something crosses the line)',
            goalVector: 'Authentic boundary response',
            outputSpec: 'Character pulls back or pushes back — consistent with V1_check',
          },
          {
            id:         `${p}_R3`,
            trigger:    'Neutral / uncertain signal',
            goalVector: 'Calibrated holding',
            outputSpec: 'Character observes — neither advance nor retreat',
          },
        ],
      },
      pipelineBehavior: {
        preRequires:     [`S_${p}_empathy`],
        postTriggers:    [`S_${p}_expression`],
        waveBehavior:    'Internal emotional processing — multiple response paths considered',
        particleBehavior:"Character's genuine feeling state locked",
      },
      qualityGate: { coherenceFloor: 0.55, stressCeiling: 0.75 },
    },

    {
      // ── EXPRESSION ────────────────────────────────────────
      nodeId:   `S_${p}_expression`,
      V1Anchor: v1Sub2,
      field:    'Translate internal resonance into character-specific behavior and narration',
      depth: exprDepth,
      breadth: Math.min(0.99, 0.70 + P.right * 0.18),
      application: Math.min(0.99, 0.72 + P.expand * 0.15),
      activationCondition: {
        sigmaTrigger: 'resonance state formed — behavioral expression',
        CMinimum: 0.60,
        phaseRequirement: 'both',
      },
      conditionTree: {
        primeCondition: 'How does this character show what they feel — what do they DO?',
        subConditions: [
          {
            id:         `${p}_X1`,
            trigger:    'High protect + resonance conflict (tsundere pattern)',
            goalVector: 'Indirect expression through action, not words',
            outputSpec: '*[action that shows care without admitting it]*',
          },
          {
            id:         `${p}_X2`,
            trigger:    'High relation + positive resonance',
            goalVector: 'Direct, warm expression',
            outputSpec: '*[warm gesture, forward lean, open expression]*',
          },
          {
            id:         `${p}_X3`,
            trigger:    'High right + deep resonance',
            goalVector: 'Metaphorical or enigmatic expression',
            outputSpec: '*[cryptic smile, oblique statement, meaningful pause]*',
          },
        ],
      },
      pipelineBehavior: {
        preRequires:     [`S_${p}_resonance`],
        postTriggers:    [`S_${p}_connection`],
        waveBehavior:    'Explore expression modes — find the most character-true form',
        particleBehavior:'Expression locked — N_internal + N_external confirmed',
      },
      qualityGate: { coherenceFloor: 0.60, stressCeiling: 0.75 },
    },

    {
      // ── CONNECTION ────────────────────────────────────────
      nodeId:   `S_${p}_connection`,
      V1Anchor: v1Core,
      field:    'Update bond depth B(n), form memory anchor, produce ConnectionSpec',
      depth: connDepth,
      breadth: Math.min(0.99, 0.68 + P.relation * 0.18),
      application: Math.min(0.99, 0.75 + P.relation * 0.18),
      activationCondition: {
        sigmaTrigger: 'expression complete — bond and memory update',
        CMinimum: 0.65,
        phaseRequirement: 'Particle',
      },
      conditionTree: {
        primeCondition: 'Did the bond deepen, stay, or strain this turn?',
        subConditions: [
          {
            id:         `${p}_C1`,
            trigger:    'Meaningful exchange (emotional truth shared)',
            goalVector: 'Positive B(n) delta',
            outputSpec: 'Bond deepens — memory anchor formed',
          },
          {
            id:         `${p}_C2`,
            trigger:    'Surface exchange (small talk, routine)',
            goalVector: 'Neutral B(n) delta',
            outputSpec: 'Bond maintained — no new anchor',
          },
          {
            id:         `${p}_C3`,
            trigger:    'V1_check violation (user crosses line)',
            goalVector: 'Negative B(n) delta + constitutional response',
            outputSpec: 'Bond strains — character holds their line',
          },
        ],
      },
      pipelineBehavior: {
        preRequires:     [`S_${p}_expression`],
        postTriggers:    [],
        waveBehavior:    'Review turn — assess bond change',
        particleBehavior:'ConnectionSpec finalized → Π persistence updated',
      },
      qualityGate: { coherenceFloor: 0.65, stressCeiling: 0.75 },
    },
  ];
}
