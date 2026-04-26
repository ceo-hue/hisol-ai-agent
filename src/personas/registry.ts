/**
 * Persona Registry — all registered personas and their skill trees.
 */

import type { PersonaDefinition } from '../core/identity/persona.js';
import type { SkillNode } from '../core/skill/node.js';
import { HIGHSOL, HIGHSOL_SKILLS } from './highsol.js';
import { GAUDI, GAUDI_SKILLS } from './gaudi.js';
import { JOBS, JOBS_SKILLS } from './jobs.js';
import { TSCHICHOLD, TSCHICHOLD_SKILLS } from './tschichold.js';

export interface PersonaEntry {
  persona: PersonaDefinition;
  skills: SkillNode[];
}

const registry = new Map<string, PersonaEntry>();

// Vol.G layer order: pre_foundation → foundation → specialist → expression
registry.set('HighSol',    { persona: HIGHSOL,    skills: HIGHSOL_SKILLS });
registry.set('Jobs',       { persona: JOBS,       skills: JOBS_SKILLS });
registry.set('Tschichold', { persona: TSCHICHOLD, skills: TSCHICHOLD_SKILLS });
registry.set('Gaudi',      { persona: GAUDI,      skills: GAUDI_SKILLS });

export function getPersona(id: string): PersonaEntry | undefined {
  return registry.get(id);
}

export function listPersonas(): string[] {
  return [...registry.keys()];
}

export function registerPersona(id: string, entry: PersonaEntry): void {
  registry.set(id, entry);
}

export { HIGHSOL, JOBS, TSCHICHOLD, GAUDI };
