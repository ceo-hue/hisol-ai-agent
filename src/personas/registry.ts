/**
 * Persona registry.
 */
import { Persona } from '../am/types.js';
import Diana from './diana.js';
import { ALL_MASTERS } from './masters.js';

const REGISTRY = new Map<string, Persona>();

function register(p: Persona) { REGISTRY.set(p.id, p); }

register(Diana);
for (const m of ALL_MASTERS) register(m);

export function getPersona(id: string): Persona {
  return REGISTRY.get(id) ?? REGISTRY.get('highsol')!;
}

export function listPersonas(): Array<{ id: string; displayName: string; domain: string }> {
  return [...REGISTRY.values()].map(p => ({
    id: p.id, displayName: p.displayName, domain: p.domain,
  }));
}

export function resolvePersonaByTrigger(text: string): Persona | null {
  const lower = text.toLowerCase();
  for (const p of REGISTRY.values()) {
    for (const t of p.triggers) {
      if (lower.includes(t.toLowerCase()) || text.includes(t)) return p;
    }
  }
  return null;
}

export { Diana, ALL_MASTERS };
export default REGISTRY;
