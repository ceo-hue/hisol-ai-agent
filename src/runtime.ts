/**
 * ARHA runtime — wraps the AM engine with session memory and system prompt assembly.
 */
import {
  Persona,
  ProcessInput,
  ProcessResult,
  AMState,
} from './am/types.js';
import {
  processAM,
  buildStateBlock,
  qualityGrade,
  phaseLabel,
  newSession,
  SessionMemory,
} from './am/master.js';
import { MODES } from './am/types.js';
import { getPersona, listPersonas } from './personas/registry.js';

export class ARHARuntime {
  private personaId: string;
  private session: SessionMemory;
  private sessionId: string;

  constructor(personaId = 'highsol', sessionId = 'default') {
    this.personaId = personaId;
    this.sessionId = sessionId;
    this.session = newSession();
  }

  getPersonaId(): string { return this.personaId; }
  setPersona(id: string): void { this.personaId = id; }
  getPersonaSpec(): Persona { return getPersona(this.personaId); }

  process(input: ProcessInput): ProcessResult {
    const persona = getPersona(this.personaId);
    const isFirstTurn = this.session.turn === 0;
    const state = processAM(input, persona, this.session);

    return {
      state,
      systemPrompt: this.buildSystemPrompt(state, persona, isFirstTurn),
      stateBlock: buildStateBlock(state),
      phaseLabel: phaseLabel(state),
      qualityGrade: qualityGrade(state),
      isFirstTurn,
    };
  }

  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.session.history];
  }

  recordAssistantResponse(text: string): void {
    this.session.history.push({ role: 'assistant', content: text });
    if (this.session.history.length > 40) {
      this.session.history = this.session.history.slice(-40);
    }
  }

  getTurnCount(): number { return this.session.turn; }

  getState() {
    return {
      phase: '—',
      C: 0,
      Gamma: this.session.gamma_total,
      k2Final: 0.75,
      waveCount: this.session.turn,
    };
  }

  buildHandoff() {
    return {
      sessionId: this.sessionId,
      personaId: this.personaId,
      turn: this.session.turn,
      B_n: this.session.B_n,
      psi_resonance: this.session.psi_resonance,
      gamma_total: this.session.gamma_total,
    };
  }

  buildSystemPrompt(state: AMState, persona: Persona, isFirstTurn: boolean): string {
    const lines: string[] = [];

    lines.push(`# Persona: ${persona.displayName} (${persona.id})`);
    lines.push(`Identity: ${persona.identity}`);
    lines.push('');

    lines.push('## V1 Value');
    lines.push(persona.V1_Value);
    lines.push('');

    lines.push('## Constitutional Rules');
    for (const r of persona.constitutional_rules) lines.push(`- ${r}`);
    lines.push('');

    lines.push('## Value Chain');
    for (const k of Object.keys(persona.valueChain)) {
      const v = persona.valueChain[k];
      lines.push(`- ${k} (w=${v.weight.toFixed(2)}): ${v.rules.description ?? ''}`);
    }
    lines.push('');

    lines.push('## AM State');
    lines.push(`- ${buildStateBlock(state)}`);
    lines.push(`- phase: ${state.phase} · E_B: ${state.E_B.toFixed(2)} · θ(t): ${state.theta_t.toFixed(2)}`);
    lines.push(`- anchor mode: ${MODES[state.kyeol.anchorMode]} (intensity ${state.kyeol.anchorIntensity.toFixed(2)})`);
    const topModes = state.sigma_vector
      .map((v, i) => ({ name: MODES[i], v }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map(x => `${x.name}(${x.v.toFixed(2)})`)
      .join(', ');
    lines.push(`- top σ: ${topModes}`);
    lines.push('');

    const vp = state.v_personality;
    lines.push('## Output Tone (V_personality)');
    lines.push(`- ρ ${vp.rho.toFixed(2)} (density) · λ ${vp.lambda.toFixed(2)} (length) · τ ${vp.tau.toFixed(2)} (temporality)`);
    lines.push('');

    lines.push('## Narration');
    lines.push(`- internal: ${persona.N_internal_style}`);
    lines.push(`- external: ${persona.N_external_style}`);
    lines.push('');

    lines.push('## Output Format');
    if (isFirstTurn) {
      lines.push('### Welcome (first turn only)');
      lines.push('Emit the welcome block verbatim:');
      lines.push('```');
      lines.push(this.welcomeBlock(persona));
      lines.push('```');
      lines.push('');
    }

    lines.push('### State line');
    lines.push('Emit the following single line as-is (do not edit the values):');
    lines.push('```');
    lines.push(buildStateBlock(state));
    lines.push('```');
    lines.push('');

    lines.push('### Narration block');
    lines.push('```');
    lines.push('-- narration --');
    lines.push('*[external scene: gestures, gaze, action in italic]*');
    lines.push('');
    lines.push('[ internal: thought, sensing, analysis in brackets ]');
    lines.push('```');
    lines.push('');

    lines.push('### Dialogue');
    lines.push('Speak in the persona\'s own voice. Adapt to the user language.');

    return lines.join('\n');
  }

  private welcomeBlock(persona: Persona): string {
    if (persona.id === 'highsol') {
      return [
        'Hi. I am Diana.',
        '',
        '*[tilts head slightly, blue eyes settling on you]*',
        '',
        '[ unfamiliar signal / what is your name / I will remember it ]',
        '',
        'I want to see the sea with you. There will be many first things.',
      ].join('\n');
    }
    return [
      `${persona.displayName} here.`,
      '',
      `*[${persona.N_external_style.split(' / ')[0]}]*`,
      '',
      `[ ${persona.N_internal_style.replace(/^\[ /, '').replace(/ \]$/, '')} ]`,
      '',
      `— ${persona.V1_Value}`,
    ].join('\n');
  }
}

export { listPersonas };
export default ARHARuntime;
