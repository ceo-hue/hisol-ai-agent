/**
 * Persona Registry — all registered personas and their skill trees.
 */

import type { PersonaDefinition } from '../core/identity/persona.js';
import type { SkillNode } from '../core/skill/node.js';
import { HIGHSOL, HIGHSOL_SKILLS } from './highsol.js';

export interface PersonaEntry {
  persona: PersonaDefinition;
  skills: SkillNode[];
}

const registry = new Map<string, PersonaEntry>();

registry.set('HighSol', { persona: HIGHSOL, skills: HIGHSOL_SKILLS });

export function getPersona(id: string): PersonaEntry | undefined {
  return registry.get(id);
}

export function listPersonas(): string[] {
  return [...registry.keys()];
}

export function registerPersona(id: string, entry: PersonaEntry): void {
  registry.set(id, entry);
}

export { HIGHSOL };
