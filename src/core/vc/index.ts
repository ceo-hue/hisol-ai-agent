/**
 * ARHA Vol.F_VC — Public API
 * Universal 6-phase value chain pipeline with persona lens adaptation.
 *
 * 12 personas registered through their lens files:
 *   Anchor (strategy):  Jobs, Porter, Drucker
 *   Process:            Deming, Ohno
 *   Output specialists: Tschichold, Gaudi, Ogilvy, Rams, DaVinci, Eames
 *   Companion:          HighSol
 */

export * from './types.js';
export * from './lens-loader.js';
export { runVCPipeline } from './runner.js';

import { registerLens } from './lens-loader.js';

// Strategy Anchor layer
import { JOBS_LENS }       from './lenses/jobs.js';
import { PORTER_LENS }     from './lenses/porter.js';
import { DRUCKER_LENS }    from './lenses/drucker.js';

// Process layer
import { DEMING_LENS }     from './lenses/deming.js';
import { OHNO_LENS }       from './lenses/ohno.js';

// Output specialist layer
import { TSCHICHOLD_LENS } from './lenses/tschichold.js';
import { GAUDI_LENS }      from './lenses/gaudi.js';
import { OGILVY_LENS }     from './lenses/ogilvy.js';
import { RAMS_LENS }       from './lenses/rams.js';
import { DAVINCI_LENS }    from './lenses/davinci.js';
import { EAMES_LENS }      from './lenses/eames.js';

// Companion layer
import { HIGHSOL_LENS }    from './lenses/highsol.js';

let bootstrapped = false;

export function bootstrapVCLenses(): void {
  if (bootstrapped) return;

  // Anchor (strategy)
  registerLens(JOBS_LENS);
  registerLens(PORTER_LENS);
  registerLens(DRUCKER_LENS);

  // Process
  registerLens(DEMING_LENS);
  registerLens(OHNO_LENS);

  // Output specialists
  registerLens(TSCHICHOLD_LENS);
  registerLens(GAUDI_LENS);
  registerLens(OGILVY_LENS);
  registerLens(RAMS_LENS);
  registerLens(DAVINCI_LENS);
  registerLens(EAMES_LENS);

  // Companion
  registerLens(HIGHSOL_LENS);

  bootstrapped = true;
}

// Auto-bootstrap on import
bootstrapVCLenses();
