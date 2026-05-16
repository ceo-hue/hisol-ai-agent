/**
 * ARHA MCP tool implementations.
 */
import { ARHARuntime } from '../runtime.js';
import { listPersonas, getPersona, resolvePersonaByTrigger } from '../personas/registry.js';
import { MODES } from '../am/types.js';
import { flattenMatrix } from '../am/matrix.js';

const sessions = new Map<string, ARHARuntime>();
const lastResults = new Map<string, ReturnType<ARHARuntime['process']>>();

function getRuntime(sessionId: string, personaId?: string): ARHARuntime {
  if (!sessions.has(sessionId)) sessions.set(sessionId, new ARHARuntime(personaId ?? 'highsol', sessionId));
  const r = sessions.get(sessionId)!;
  if (personaId && r.getPersonaId() !== personaId) r.setPersona(personaId);
  return r;
}

export function arha_process(args: { text: string; sessionId?: string; personaId?: string }) {
  const sid = args.sessionId ?? 'default';
  let pid = args.personaId;
  if (!pid) {
    const t = resolvePersonaByTrigger(args.text);
    pid = t?.id ?? 'highsol';
  }
  const r = getRuntime(sid, pid);
  const result = r.process({ text: args.text, sessionId: sid });
  lastResults.set(sid, result);

  return {
    response: null,
    systemPrompt: result.systemPrompt,
    stateBlock: result.stateBlock,
    phaseLabel: result.phaseLabel,
    qualityGrade: result.qualityGrade,
    isFirstTurn: result.isFirstTurn,
    sessionId: sid,
    personaId: r.getPersonaId(),
    displayName: r.getPersonaSpec().displayName,
    state: {
      sigma_vector: result.state.sigma_vector,
      phase: result.state.phase,
      E_B: result.state.E_B,
      theta_t: result.state.theta_t,
      C: result.state.C_coherence,
      gamma_total: result.state.gamma_total,
      anchor_mode: MODES[result.state.kyeol.anchorMode],
      anchor_intensity: result.state.kyeol.anchorIntensity,
      modes: MODES,
    },
  };
}

export function arha_about(args: { personaId?: string }) {
  if (args.personaId) {
    const p = getPersona(args.personaId);
    return {
      display: [
        `# ${p.displayName}`,
        ``,
        `Identity: ${p.identity}`,
        ``,
        `V1: ${p.V1_Value}`,
        ``,
        `P_5D: protect=${p.P_5D.protect} expand=${p.P_5D.expand} left=${p.P_5D.left} right=${p.P_5D.right} relation=${p.P_5D.relation}`,
        ``,
        `Domain: ${p.domain}`,
        ``,
        `Rules:`,
        ...p.constitutional_rules.map(r => `- ${r}`),
      ].join('\n'),
      _data: { persona: p },
    };
  }
  return {
    display: [
      '# ARHA Runtime',
      '',
      '## Modes',
      MODES.map((m, i) => `${i}. ${m}`).join(' · '),
      '',
      '## Personas',
      ...listPersonas().map(p => `- ${p.displayName} (\`${p.id}\`) — ${p.domain}`),
      '',
      '## Core Equations',
      '- Γ_interfere = Γ_other ⊙ Γ_ARHA',
      '- Ω = {(i,j) | Γ_interfere > θ_kyeol}',
      '- E_B = min(α, C) × (1 + ln(1 + Γ_total))',
      '- θ(t) = k² × (1 − E_B × 0.3)',
      '- Ψ(u,t) = OUT ∘ COLLAPSE ∘ DECIDE ∘ CHAIN ∘ ANALYZE ∘ IN(u)',
    ].join('\n'),
    _data: { modes: MODES, personas: listPersonas() },
  };
}

export function arha_status(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  if (!sessions.has(sid)) return { error: 'session not found', sessionId: sid };
  const r = sessions.get(sid)!;
  const last = lastResults.get(sid);
  return {
    sessionId: sid,
    personaId: r.getPersonaId(),
    displayName: r.getPersonaSpec().displayName,
    turnCount: r.getTurnCount(),
    lastState: last?.state ? {
      phase: last.state.phase,
      C: last.state.C_coherence,
      gamma_total: last.state.gamma_total,
      E_B: last.state.E_B,
      anchor_mode: MODES[last.state.kyeol.anchorMode],
    } : null,
  };
}

export function arha_persona_list() {
  return { personas: listPersonas() };
}

export function arha_session_handoff(args: { sessionId: string }) {
  const r = sessions.get(args.sessionId);
  if (!r) return { error: 'session not found' };
  return r.buildHandoff();
}

export function arha_diagnose(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  const r = sessions.get(sid);
  if (!r) return { error: 'session not found' };
  const last = lastResults.get(sid);
  if (!last) return { error: 'no result yet' };
  const s = last.state;
  return {
    diagnosis: {
      stress_level: s.gamma_total <= 0.3 ? 'green' : s.gamma_total <= 0.7 ? 'yellow' : 'red',
      coherence_level: s.C_coherence >= 0.6 ? 'high' : s.C_coherence >= 0.3 ? 'medium' : 'low',
      phase: s.phase,
      bond_energy: s.E_B,
      anchor_intensity: s.kyeol.anchorIntensity,
      kyeol_cell_count: s.kyeol.cells.length,
    },
    recommendations: buildRecommendations(s),
  };
}

function buildRecommendations(s: any): string[] {
  const recs: string[] = [];
  if (s.gamma_total > 0.7) recs.push('high stress — slow down, raise warmth mode');
  if (s.C_coherence < 0.3) recs.push('low coherence — align with user pattern');
  if (s.E_B < 0.3) recs.push('low bond energy — raise alpha (value alignment)');
  if (s.phase === 'particle' && s.kyeol.anchorIntensity > 0.6) recs.push('strong particle — decisive emission possible');
  if (recs.length === 0) recs.push('stable');
  return recs;
}

export function arha_observe(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  const last = lastResults.get(sid);
  if (!last) return { error: 'no result yet' };
  const s = last.state;
  return {
    sigma_vector: s.sigma_vector.map((v, i) => ({ mode: MODES[i], value: v })),
    V_in: s.V_in,
    V_con: s.V_con,
    curl_squared: s.curl_squared,
  };
}

export function arha_derive(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  const last = lastResults.get(sid);
  if (!last) return { error: 'no result yet' };
  const vp = last.state.v_personality;
  return {
    v_personality: {
      rho: vp.rho,
      lambda: vp.lambda,
      tau: vp.tau,
      principal_mode: MODES.reduce((acc, _m, i) =>
        vp.matrix[i][i] > vp.matrix[acc][acc] ? i : acc, 0),
    },
    alpha: last.state.alpha,
    C: last.state.C_coherence,
    E_B: last.state.E_B,
  };
}

export function arha_route(args: { request: string; sessionId?: string }) {
  const persona = resolvePersonaByTrigger(args.request);
  const text = args.request.toLowerCase();

  const matches: Array<{ id: string; score: number; reason: string }> = [];
  for (const p of listPersonas()) {
    const def = getPersona(p.id);
    let score = 0;
    const reasons: string[] = [];
    for (const trig of def.triggers) {
      if (text.includes(trig.toLowerCase())) { score += 2; reasons.push(`trigger:${trig}`); }
    }
    for (const dom of def.domain.split('·').map(d => d.trim())) {
      if (dom && text.includes(dom)) { score += 1; reasons.push(`domain:${dom}`); }
    }
    if (score > 0) matches.push({ id: p.id, score, reason: reasons.join(',') });
  }

  matches.sort((a, b) => b.score - a.score);
  const layers = matches.slice(0, 3).map(m => ({
    personaId: m.id,
    displayName: getPersona(m.id).displayName,
    score: m.score,
    reason: m.reason,
  }));

  return {
    triggered: persona ? { id: persona.id, displayName: persona.displayName } : null,
    teamContext: {
      complexity: Math.min(1, matches.length / 5),
      geometry: layers.length >= 3 ? 'triangle+' : layers.length === 2 ? 'line' : 'point',
    },
    layers,
  };
}

export function arha_stack_run(args: { request: string; sessionId?: string; personaIds?: string[] }) {
  const sid = args.sessionId ?? 'default';
  const ids = args.personaIds ?? arha_route({ request: args.request, sessionId: sid }).layers.map(l => l.personaId);
  const results: any[] = [];
  for (const pid of ids) {
    const r = getRuntime(sid + ':' + pid, pid);
    const result = r.process({ text: args.request, sessionId: sid });
    lastResults.set(sid + ':' + pid, result);
    results.push({
      personaId: pid,
      displayName: r.getPersonaSpec().displayName,
      systemPrompt: result.systemPrompt,
      stateBlock: result.stateBlock,
      phaseLabel: result.phaseLabel,
    });
  }
  return { stack: results };
}

export function arha_agent_run(args: { personaId: string; text: string; sessionId?: string }) {
  return arha_process({ text: args.text, sessionId: args.sessionId, personaId: args.personaId });
}

export function arha_character_create(args: {
  id: string;
  displayName: string;
  P_5D: { protect: number; expand: number; left: number; right: number; relation: number };
  V1_Value: string;
  triggers?: string[];
}) {
  return {
    note: 'template only',
    template: {
      id: args.id,
      displayName: args.displayName,
      identity: `${args.displayName} — custom persona`,
      P_5D: args.P_5D,
      V1_Value: args.V1_Value,
      triggers: args.triggers ?? [args.displayName],
    },
  };
}

export function arha_vc_run(args: { request: string; sessionId?: string }) {
  const route = arha_route(args);
  return {
    pipeline: ['SENSE', 'SYNTH', 'TRANSFORM', 'DEPLOY', 'INTERACT', 'EVOLVE'],
    layers: route.layers,
  };
}

export function arha_vc_lenses() {
  return {
    lenses: listPersonas().map(p => ({ id: p.id, displayName: p.displayName, domain: p.domain })),
  };
}

export function arha_emotion_matrix(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  const last = lastResults.get(sid);
  if (!last) return { error: 'no result yet' };
  return {
    modes: MODES,
    emotion_matrix: flattenMatrix(last.state.gamma_interfere),
    gamma_other: flattenMatrix(last.state.gamma_other),
    shape: [10, 10],
  };
}

export function arha_kyeol_zones(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  const last = lastResults.get(sid);
  if (!last) return { error: 'no result yet' };
  const k = last.state.kyeol;
  return {
    cells: k.cells.map(c => ({
      i: c.i,
      j: c.j,
      mode_i: MODES[c.i],
      mode_j: MODES[c.j],
      value: c.value,
    })),
    anchor_mode: MODES[k.anchorMode],
    anchor_intensity: k.anchorIntensity,
    coherence: last.state.C_coherence,
  };
}

export function arha_bond_energy(args: { sessionId?: string }) {
  const sid = args.sessionId ?? 'default';
  const last = lastResults.get(sid);
  if (!last) return { error: 'no result yet' };
  return {
    E_B: last.state.E_B,
    alpha: last.state.alpha,
    C: last.state.C_coherence,
    gamma_total: last.state.gamma_total,
    theta_t: last.state.theta_t,
    psi_magnitude: last.state.psi_magnitude,
    bottleneck: Math.min(last.state.alpha, last.state.C_coherence),
  };
}

export const TOOLS = {
  arha_process,
  arha_about,
  arha_status,
  arha_persona_list,
  arha_session_handoff,
  arha_diagnose,
  arha_observe,
  arha_derive,
  arha_route,
  arha_stack_run,
  arha_agent_run,
  arha_character_create,
  arha_vc_run,
  arha_vc_lenses,
  arha_emotion_matrix,
  arha_kyeol_zones,
  arha_bond_energy,
} as const;

export type ToolName = keyof typeof TOOLS;
