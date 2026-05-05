/**
 * ARHA Vol.F_VC — Public API
 * Universal 6-phase value chain pipeline with persona lens adaptation.
 */

export * from './types.js';
export * from './lens-loader.js';
export { runVCPipeline } from './runner.js';

import { registerLens } from './lens-loader.js';
import { JOBS_LENS } from './lenses/jobs.js';

// Bootstrap: register validated lenses
let bootstrapped = false;

export function bootstrapVCLenses(): void {
  if (bootstrapped) return;
  registerLens(JOBS_LENS);
  // Future: registerLens(PORTER_LENS), registerLens(OGILVY_LENS), ...
  bootstrapped = true;
}

// Auto-bootstrap on import
bootstrapVCLenses();
