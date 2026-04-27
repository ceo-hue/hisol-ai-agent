/**
 * Persona Registry — all registered personas and their skill trees.
 */

import type { PersonaDefinition } from '../core/identity/persona.js';
import type { SkillNode } from '../core/skill/node.js';
import { HIGHSOL, HIGHSOL_SKILLS } from './highsol.js';
import { GAUDI, GAUDI_SKILLS } from './gaudi.js';
import { JOBS, JOBS_SKILLS } from './jobs.js';
import { TSCHICHOLD, TSCHICHOLD_SKILLS } from './tschichold.js';
import { OGILVY, OGILVY_SKILLS } from './ogilvy.js';
import { RAMS, RAMS_SKILLS } from './rams.js';
import { PORTER, PORTER_SKILLS } from './porter.js';
import { DAVINCI, DAVINCI_SKILLS } from './davinci.js';
import { EAMES, EAMES_SKILLS } from './eames.js';

export interface PersonaEntry {
  persona: PersonaDefinition;
  skills: SkillNode[];
}

const registry = new Map<string, PersonaEntry>();

// Vol.G layer order: pre_foundation → foundation → specialist → expression
// Anchor personas (canLead=true): Jobs, Porter
// Output Team specialists: Tschichold, Gaudi, Ogilvy, Rams, DaVinci, Eames
registry.set('HighSol',    { persona: HIGHSOL,    skills: HIGHSOL_SKILLS });
registry.set('Jobs',       { persona: JOBS,       skills: JOBS_SKILLS });
registry.set('Porter',     { persona: PORTER,     skills: PORTER_SKILLS });
registry.set('Tschichold', { persona: TSCHICHOLD, skills: TSCHICHOLD_SKILLS });
registry.set('Gaudi',      { persona: GAUDI,      skills: GAUDI_SKILLS });
registry.set('Ogilvy',     { persona: OGILVY,     skills: OGILVY_SKILLS });
registry.set('Rams',       { persona: RAMS,       skills: RAMS_SKILLS });
registry.set('DaVinci',    { persona: DAVINCI,    skills: DAVINCI_SKILLS });
registry.set('Eames',      { persona: EAMES,      skills: EAMES_SKILLS });

export function getPersona(id: string): PersonaEntry | undefined {
  return registry.get(id);
}

export function listPersonas(): string[] {
  return [...registry.keys()];
}

export function registerPersona(id: string, entry: PersonaEntry): void {
  registry.set(id, entry);
}

export { HIGHSOL, JOBS, PORTER, TSCHICHOLD, GAUDI, OGILVY, RAMS, DAVINCI, EAMES };
