/**
 * ARHA Vol.F_VC — Lens Loader
 * Loads and validates persona lens configurations against the universal template.
 */

import type { PersonaLens, PhaseId } from './types.js';

const REQUIRED_PHASES: PhaseId[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

const REQUIRED_META_FIELDS = [
  'persona_id',
  'name',
  'v1_core',
  'p_vector',
  'lingua',
  'constitutional_law',
  'dominant_engine',
] as const;

const REQUIRED_PHASE_FIELDS = [
  'reframe',
  'valuation_redef',
  'characteristic_move',
  'failure_signals',
] as const;

// ─────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────

export interface LensValidation {
  valid: boolean;
  errors: string[];
}

export function validateLens(lens: unknown): LensValidation {
  const errors: string[] = [];
  if (!lens || typeof lens !== 'object') {
    return { valid: false, errors: ['Lens must be an object'] };
  }
  const l = lens as Record<string, unknown>;

  // persona_meta
  const meta = l.persona_meta as Record<string, unknown> | undefined;
  if (!meta) {
    errors.push('Missing persona_meta');
  } else {
    for (const field of REQUIRED_META_FIELDS) {
      if (!(field in meta)) errors.push(`persona_meta.${field} missing`);
    }
    if (meta.constitutional_law && !Array.isArray(meta.constitutional_law)) {
      errors.push('persona_meta.constitutional_law must be array');
    }
  }

  // phase_lenses
  const phases = l.phase_lenses as Record<string, unknown> | undefined;
  if (!phases) {
    errors.push('Missing phase_lenses');
  } else {
    for (const phase of REQUIRED_PHASES) {
      const p = phases[phase] as Record<string, unknown> | undefined;
      if (!p) {
        errors.push(`phase_lenses.${phase} missing`);
        continue;
      }
      for (const field of REQUIRED_PHASE_FIELDS) {
        if (!(field in p)) errors.push(`phase_lenses.${phase}.${field} missing`);
      }
      const vr = p.valuation_redef as Record<string, unknown> | undefined;
      if (vr && (!vr.metric_name || !vr.redefinition)) {
        errors.push(`phase_lenses.${phase}.valuation_redef missing metric_name or redefinition`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────

const lensRegistry = new Map<string, PersonaLens>();

export function registerLens(lens: PersonaLens): void {
  const validation = validateLens(lens);
  if (!validation.valid) {
    throw new Error(
      `Invalid lens for ${lens?.persona_meta?.persona_id ?? '<unknown>'}: ${validation.errors.join(', ')}`,
    );
  }
  lensRegistry.set(lens.persona_meta.persona_id, lens);
}

export function getLens(personaId: string): PersonaLens | undefined {
  return lensRegistry.get(personaId);
}

export function listLenses(): string[] {
  return [...lensRegistry.keys()];
}

export function hasLens(personaId: string): boolean {
  return lensRegistry.has(personaId);
}
