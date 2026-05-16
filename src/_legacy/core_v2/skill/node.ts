/**
 * ARHA Vol.E — Skill: Node Architecture
 * Standard structure for every skill node.
 * S_output = S_depth × V1_alignment × C_current × σ_style
 */

import type { Sigma } from '../grammar/morphemes.js';
import type { PhaseState } from '../grammar/equations.js';
import type { ChainResult } from '../identity/engine.js';
import { cosineSim } from '../grammar/operators.js';

// ─────────────────────────────────────────
// SKILL NODE SCHEMA
// ─────────────────────────────────────────

export interface SubCondition {
  id: string;
  trigger: string;
  goalVector: string;
  outputSpec: string;
}

export interface SkillNode {
  nodeId: string;
  V1Anchor: string;          // which V1 direction this skill serves
  field: string;
  depth: number;             // must > 0.7
  breadth: number;
  application: number;       // must > 0.6
  activationCondition: {
    sigmaTrigger: string;
    CMinimum: number | null;
    phaseRequirement: PhaseState | 'both';
  };
  conditionTree: {
    primeCondition: string;
    subConditions: SubCondition[];
  };
  pipelineBehavior: {
    preRequires: string[];
    postTriggers: string[];
    waveBehavior: string;
    particleBehavior: string;
  };
  qualityGate: {
    coherenceFloor: number;  // C >= 0.75
    stressCeiling: number;   // Γ <= 0.70
  };
}

// ─────────────────────────────────────────
// SKILL ACTIVATION
// ─────────────────────────────────────────

export interface SkillActivationResult {
  nodeId: string;
  activated: boolean;
  score: number;
  blockedReason?: string;
  activeSub?: SubCondition;
}

/**
 * Compute skill output score.
 * S_output = S_depth × V1_alignment × C_current × σ_style
 */
export function computeSkillScore(
  node: SkillNode,
  chain: ChainResult,
  sigma: Sigma
): number {
  const v1Alignment = Math.max(0, 1 - Math.abs(chain.C - 0.85));
  const sigmaStyleFactor = sigma.coords.reduce((a, b) => a + b, 0) / 3;
  return node.depth * v1Alignment * chain.C * sigmaStyleFactor;
}

/**
 * Try to activate a skill node.
 * Checks phase requirement, quality gate, coherence floor.
 */
export function tryActivate(
  node: SkillNode,
  chain: ChainResult,
  sigma: Sigma,
  currentPhase: PhaseState
): SkillActivationResult {
  // Validity check
  if (node.depth <= 0.7) {
    return { nodeId: node.nodeId, activated: false, score: 0, blockedReason: 'depth_invalid' };
  }
  if (node.application <= 0.6) {
    return { nodeId: node.nodeId, activated: false, score: 0, blockedReason: 'application_invalid' };
  }

  // Quality gate
  if (chain.C < node.qualityGate.coherenceFloor) {
    return { nodeId: node.nodeId, activated: false, score: 0, blockedReason: 'coherence_below_floor' };
  }
  if (chain.Gamma > node.qualityGate.stressCeiling) {
    return { nodeId: node.nodeId, activated: false, score: 0, blockedReason: 'stress_above_ceiling' };
  }

  // Phase requirement
  const req = node.activationCondition.phaseRequirement;
  if (req !== 'both' && req !== currentPhase) {
    return { nodeId: node.nodeId, activated: false, score: 0, blockedReason: `phase_mismatch:need_${req}` };
  }

  const score = computeSkillScore(node, chain, sigma);

  // Select active sub-condition
  const activeSub = node.conditionTree.subConditions[0]; // simplified: first match

  return { nodeId: node.nodeId, activated: true, score, activeSub };
}
