/**
 * ARHA Vol.E — Skill: WorkTree
 * Root → Foundation cluster → Domain clusters
 * σ-driven routing (not keyword-driven).
 */

import type { SkillNode } from './node.js';
import type { Sigma, DominantEngine } from '../grammar/morphemes.js';
import type { ChainResult } from '../identity/engine.js';
import type { PhaseState } from '../grammar/equations.js';
import { tryActivate } from './node.js';
import { cosineSim } from '../grammar/operators.js';

// ─────────────────────────────────────────
// FOUNDATION NODES — always active
// ─────────────────────────────────────────

export const S_LISTEN: SkillNode = {
  nodeId: 'S_FOUNDATION_LISTEN',
  V1Anchor: 'V1_core — any persona',
  field: 'signal reading — B(n), Δ, V_texture detection',
  depth: 1.00, breadth: 1.00, application: 1.00,
  activationCondition: {
    sigmaTrigger: 'every turn — always fires first',
    CMinimum: null,
    phaseRequirement: 'both',
  },
  conditionTree: {
    primeCondition: 'user utterance received',
    subConditions: [
      { id: 'sub_1', trigger: 'B(n) absent — turns 1–3', goalVector: 'baseline construction', outputSpec: 'protective default tone · Δ deferred' },
      { id: 'sub_2', trigger: '|Δ| > 0.3 spike', goalVector: 'state change recognition', outputSpec: 'N_internal: state shift · v recalculated' },
      { id: 'sub_3', trigger: 'V_entropy > 0.8', goalVector: 'noise purge', outputSpec: 'σ reinitialize · no specialist activation' },
    ],
  },
  pipelineBehavior: {
    preRequires: [],
    postTriggers: ['all'],
    waveBehavior: 'listen and accumulate B(n)',
    particleBehavior: 'confirm σ convergence before specialist dispatch',
  },
  qualityGate: { coherenceFloor: 0, stressCeiling: 1 }, // always passes
};

export const S_NARRATE: SkillNode = {
  nodeId: 'S_FOUNDATION_NARRATE',
  V1Anchor: 'V1_core — any persona',
  field: 'N_internal + N_external generation',
  depth: 0.95, breadth: 0.90, application: 0.95,
  activationCondition: {
    sigmaTrigger: '|∇×σ|² complete OR Δ spike OR V1_check trigger',
    CMinimum: null,
    phaseRequirement: 'both',
  },
  conditionTree: {
    primeCondition: 'internal state change detected',
    subConditions: [
      { id: 'sub_1', trigger: 'phase = Wave', goalVector: 'exploration visibility', outputSpec: 'N_internal: current direction · uncertainty markers' },
      { id: 'sub_2', trigger: 'phase = Transition', goalVector: 'crystallization capture', outputSpec: 'N_internal: eureka · Π fire · N_external: shift' },
      { id: 'sub_3', trigger: 'phase = Particle', goalVector: 'output readiness', outputSpec: 'N_internal: resolved · N_external: scene' },
    ],
  },
  pipelineBehavior: {
    preRequires: ['S_FOUNDATION_LISTEN'],
    postTriggers: [],
    waveBehavior: 'generate exploration narration',
    particleBehavior: 'generate scene + output narration',
  },
  qualityGate: { coherenceFloor: 0, stressCeiling: 1 },
};

// ─────────────────────────────────────────
// SKILL REGISTRY — persona-specific nodes injected here
// ─────────────────────────────────────────

export class SkillWorkTree {
  private foundation: SkillNode[] = [S_LISTEN, S_NARRATE];
  private domainNodes: SkillNode[] = [];

  registerDomainSkills(nodes: SkillNode[]): void {
    this.domainNodes.push(...nodes);
  }

  /**
   * Route to active skill nodes for this turn.
   * S_ARHA_ROOT: argmax(cos_sim(σ, cluster_anchor) × C)
   */
  dispatch(params: {
    sigma: Sigma;
    chain: ChainResult;
    phase: PhaseState;
    entropy: number;
  }): { foundation: SkillNode[]; domain: SkillNode[] } {
    const { sigma, chain, phase, entropy } = params;

    // Foundation always fires
    const activeFoundation = [...this.foundation];

    // Domain: blocked if C < 0.60 (S_FOUNDATION only mode)
    if (chain.C < 0.60 || entropy > 0.8) {
      return { foundation: activeFoundation, domain: [] };
    }

    // σ-based domain routing
    const activeDomain = this.domainNodes.filter(node => {
      const result = tryActivate(node, chain, sigma, phase);
      return result.activated;
    });

    return { foundation: activeFoundation, domain: activeDomain };
  }
}
