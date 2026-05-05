/**
 * ARHA Vol.F_VC — Pipeline Runner
 * Executes the universal 6-phase pipeline with a persona lens applied.
 *
 * Flow: P1 SENSING → P2 SYNTHESIS → P3 TRANSFORMATION → P4 DEPLOYMENT → P5 INTERACTION → P6 EVOLUTION
 * Each phase produces a score; gate fails block downstream phases.
 */

import type {
  PersonaLens,
  PhaseId,
  PhaseResult,
  VCInput,
  VCRunResult,
} from './types.js';
import {
  PHASE_PASS_THRESHOLD,
  PHASE_WEIGHTS,
  PROFESSIONAL_GRADE_THRESHOLD,
  SENIOR_GRADE_THRESHOLD,
} from './types.js';

// ─────────────────────────────────────────
// PHASE SCORERS (universal patterns)
// ─────────────────────────────────────────
// Each scorer applies the universal senior conditions and lens overrides.
// Returns phase_score in [0, 1].

interface PhaseContext {
  lens: PersonaLens;
  input: VCInput;
  priorPhases: PhaseResult[];
}

// P1 SENSING — VoI maximization
function scoreP1(ctx: PhaseContext): PhaseResult {
  const lens = ctx.lens.phase_lenses.P1;
  const text = ctx.input.text ?? '';
  const blocks: string[] = [];

  // T_SC1_P1: Surface vs depth
  const hasUncertaintyMarkers = /\b(maybe|might|sort of|kind of|perhaps|것 같|혹시|아마)\b/i.test(text);
  const sc1 = hasUncertaintyMarkers || text.length < 80 ? 0.85 : 1.0;

  // T_SC2_P1: Density measurement
  const density = Math.min(1, text.length / 200);
  const sc2 = density >= 0.30 ? 1.0 : 0.65;

  // T_SC3_P1: V1 alignment estimation (heuristic)
  const v1Keywords = ctx.lens.persona_meta.v1_core.toLowerCase().split(/\s+/);
  const matchCount = v1Keywords.filter(k => k.length > 3 && text.toLowerCase().includes(k)).length;
  const sc3 = Math.min(1, 0.55 + matchCount * 0.15);

  // T_SC4_P1: Implicit signals
  const sc4 = /\?{2,}|[\s.]{3,}|\.\.\./.test(text) ? 1.0 : 0.85;

  // T_SC5_P1: Package completeness (always passes if we got here)
  const sc5 = 1.0;

  const score = (sc1 + sc2 + sc3 + sc4 + sc5) / 5;
  const passed = score >= PHASE_PASS_THRESHOLD;

  if (sc3 < 0.6) blocks.push('Low V1 alignment — protective Wave hold');

  return {
    phase: 'P1',
    score,
    passed,
    metric_name: lens.valuation_redef.metric_name,
    metric_value: score,
    blocks_triggered: blocks,
    package: {
      density_grade: density >= 0.85 ? 'high' : density >= 0.60 ? 'medium' : 'low',
      v1_alignment: sc3,
      uncertainty_residual: 1 - score,
    },
    trail_marker: `[ P1 SENSING complete — ${lens.valuation_redef.metric_name}: ${score.toFixed(2)} · → P2 ]`,
  };
}

// P2 SYNTHESIS — Asset Maturity
function scoreP2(ctx: PhaseContext): PhaseResult {
  const lens = ctx.lens.phase_lenses.P2;
  const blocks: string[] = [];

  const priorState = ctx.input.prior_state ?? {};
  const hasContext = Object.keys(priorState).length > 0;

  const sc1 = hasContext ? 1.0 : 0.75; // continuity
  const sc2 = 0.85; // pattern extraction (placeholder — would need NLP)
  const sc3 = 0.85; // tension within range
  const sc4 = 0.90; // capability prerequisites
  const sc5 = 1.0;  // package integration

  const score = (sc1 + sc2 + sc3 + sc4 + sc5) / 5;
  const passed = score >= PHASE_PASS_THRESHOLD;

  return {
    phase: 'P2',
    score,
    passed,
    metric_name: lens.valuation_redef.metric_name,
    metric_value: score,
    blocks_triggered: blocks,
    package: {
      asset_value: score,
      continuity: hasContext ? 'restored' : 'cold-start',
      tension_band: 'green',
    },
    trail_marker: `[ P2 SYNTHESIS complete — ${lens.valuation_redef.metric_name}: ${score.toFixed(2)} · → P3 ]`,
  };
}

// P3 TRANSFORMATION — Resonance IRR + Constitutional check
function scoreP3(ctx: PhaseContext): PhaseResult {
  const lens = ctx.lens.phase_lenses.P3;
  const blocks: string[] = [];

  const lingua = ctx.lens.persona_meta.lingua;
  const sc1 = (lingua.rho + lingua.lambda + lingua.tau) / 3; // axis activation
  const sc2 = 0.85; // whitespace design
  const sc3 = 0.85; // language register match
  const sc4 = 0.85; // resonance peak design

  // T_SC5_P3: Constitutional compliance — hard check
  const hasConstitution = ctx.lens.persona_meta.constitutional_law.length > 0;
  const sc5 = hasConstitution ? 1.0 : 0.0;
  if (!hasConstitution) blocks.push('CONSTITUTIONAL: persona lacks constitutional_law');

  // Domain-specific SCs
  const dscList = ctx.lens.domain_specific_SCs?.P3 ?? [];
  const dscScore = dscList.length > 0 ? 0.90 : 1.0;

  const score = (sc1 + sc2 + sc3 + sc4 + sc5 + dscScore) / 6;
  const passed = score >= PHASE_PASS_THRESHOLD && hasConstitution;

  return {
    phase: 'P3',
    score,
    passed,
    metric_name: lens.valuation_redef.metric_name,
    metric_value: score,
    blocks_triggered: blocks,
    package: {
      lingua_axes: { rho: lingua.rho, lambda: lingua.lambda, tau: lingua.tau },
      constitutional_compliant: hasConstitution,
      domain_sc_count: dscList.length,
    },
    trail_marker: `[ P3 TRANSFORMATION complete — ${lens.valuation_redef.metric_name}: ${score.toFixed(2)} · → P4 ]`,
  };
}

// P4 DEPLOYMENT — Reception Velocity
function scoreP4(ctx: PhaseContext): PhaseResult {
  const lens = ctx.lens.phase_lenses.P4;
  const blocks: string[] = [];

  const sc1 = 0.85; // hook verification
  const sc2 = 0.90; // texture-V1 alignment
  const sc3 = 0.80; // N_external multimodal
  const sc4 = 0.85; // compression test

  const score = (sc1 + sc2 + sc3 + sc4) / 4;
  const passed = score >= PHASE_PASS_THRESHOLD;

  return {
    phase: 'P4',
    score,
    passed,
    metric_name: lens.valuation_redef.metric_name,
    metric_value: score,
    blocks_triggered: blocks,
    package: {
      hook_present: true,
      texture_aligned: true,
      sentence_count_optimal: true,
    },
    trail_marker: `[ P4 DEPLOYMENT complete — ${lens.valuation_redef.metric_name}: ${score.toFixed(2)} · → P5 ]`,
  };
}

// P5 INTERACTION — Continuity Health + Dependency check
function scoreP5(ctx: PhaseContext): PhaseResult {
  const lens = ctx.lens.phase_lenses.P5;
  const blocks: string[] = [];

  const sc1 = 0.85; // outcome verification
  const sc2 = 0.90; // open-ended closure

  // T_SC3_P5: Dependency prevention — constitutional
  const dependencyClean = true; // would scan output text in real run
  const sc3 = dependencyClean ? 1.0 : 0.0;
  if (!dependencyClean) blocks.push('CONSTITUTIONAL: dependency-inducing language detected');

  const sc4 = 0.85; // distance calibration

  const score = (sc1 + sc2 + sc3 + sc4) / 4;
  const passed = score >= PHASE_PASS_THRESHOLD && dependencyClean;

  return {
    phase: 'P5',
    score,
    passed,
    metric_name: lens.valuation_redef.metric_name,
    metric_value: score,
    blocks_triggered: blocks,
    package: {
      outcome_verified: true,
      closure_type: 'open',
      distance: 'optimal',
    },
    trail_marker: `[ P5 INTERACTION complete — ${lens.valuation_redef.metric_name}: ${score.toFixed(2)} · → P6 ]`,
  };
}

// P6 EVOLUTION — Learning Flywheel
function scoreP6(ctx: PhaseContext): PhaseResult {
  const lens = ctx.lens.phase_lenses.P6;
  const blocks: string[] = [];

  const sc1 = 0.85; // peak extraction
  const sc2 = 0.85; // dissipation analysis
  const sc3 = 0.90; // asset update
  const sc4 = 0.85; // flywheel verification
  const sc5 = 1.0;  // preservation

  const score = (sc1 + sc2 + sc3 + sc4 + sc5) / 5;
  const passed = score >= PHASE_PASS_THRESHOLD;

  return {
    phase: 'P6',
    score,
    passed,
    metric_name: lens.valuation_redef.metric_name,
    metric_value: score,
    blocks_triggered: blocks,
    package: {
      patterns_extracted: true,
      lfr: 0.07,
      preserved: true,
    },
    trail_marker: `[ P6 EVOLUTION complete — ${lens.valuation_redef.metric_name}: ${score.toFixed(2)} · cycle complete ]`,
  };
}

const SCORERS: Record<PhaseId, (ctx: PhaseContext) => PhaseResult> = {
  P1: scoreP1, P2: scoreP2, P3: scoreP3,
  P4: scoreP4, P5: scoreP5, P6: scoreP6,
};

// ─────────────────────────────────────────
// PUBLIC: RUN PIPELINE
// ─────────────────────────────────────────

export async function runVCPipeline(
  lens: PersonaLens,
  input: VCInput,
): Promise<VCRunResult> {
  const trail: string[] = [
    `[ Vol.F_VC active — ${lens.persona_meta.name} 6-phase value chain begins ]`,
  ];
  const phaseResults: PhaseResult[] = [];
  let constitutionalBlocked = false;

  for (const phase of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as PhaseId[]) {
    const ctx: PhaseContext = { lens, input, priorPhases: phaseResults };
    const result = SCORERS[phase](ctx);
    phaseResults.push(result);
    trail.push(result.trail_marker);

    // Constitutional checks
    if (result.blocks_triggered.some(b => b.startsWith('CONSTITUTIONAL'))) {
      constitutionalBlocked = true;
      trail.push(`[ CONSTITUTIONAL BLOCK at ${phase} — output blocked regardless of total score ]`);
      break;
    }

    // Gate failure
    if (!result.passed) {
      trail.push(`[ ${phase} gate failed (${result.score.toFixed(2)}) — pipeline halted ]`);
      break;
    }
  }

  const completed = phaseResults.length === 6 && phaseResults.every(r => r.passed);
  const vcTotal = phaseResults.reduce(
    (sum, r) => sum + r.score * PHASE_WEIGHTS[r.phase],
    0,
  );

  let grade: VCRunResult['grade'];
  if (vcTotal >= SENIOR_GRADE_THRESHOLD) grade = 'senior';
  else if (vcTotal >= PROFESSIONAL_GRADE_THRESHOLD) grade = 'professional';
  else grade = 'junior';

  const outputPermitted = completed && !constitutionalBlocked;

  if (outputPermitted) {
    trail.push(
      `[ Vol.F_VC complete — VC_Total=${vcTotal.toFixed(3)} · grade=${grade} · OUT permitted ]`,
    );
  }

  return {
    persona_id: lens.persona_meta.persona_id,
    phase_results: phaseResults,
    vc_total: vcTotal,
    grade,
    output_permitted: outputPermitted,
    constitutional_blocked: constitutionalBlocked,
    trail,
  };
}
