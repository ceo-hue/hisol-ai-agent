// Multi-Persona Orchestration System
// Coordinates execution of multiple personas

import { PersonaRole, OrchestrationPlan, ExecutionStep, QualityGate } from '../core/types.js';

export class PersonaOrchestrator {
  createPlan(personas: PersonaRole[], task: string): OrchestrationPlan {
    const primary = personas[0];
    const supporting = personas.slice(1);

    const steps: ExecutionStep[] = personas.map((persona, index) => ({
      step_number: index + 1,
      persona,
      action: this.getActionForPersona(persona, task),
      dependencies: index > 0 ? [index] : []
    }));

    const qualityGates: QualityGate[] = [
      {
        name: 'Completeness Check',
        type: 'mandatory',
        threshold: 0.8,
        block_on_failure: true
      }
    ];

    if (personas.includes('SeniorSecurityAuditor')) {
      qualityGates.push({
        name: 'Security Scan',
        type: 'mandatory',
        threshold: 0.9,
        block_on_failure: true
      });
    }

    return {
      primary_persona: primary,
      supporting_personas: supporting,
      execution_steps: steps,
      quality_gates: qualityGates
    };
  }

  private getActionForPersona(persona: PersonaRole, task: string): string {
    const actionMap: Record<PersonaRole, string> = {
      'SeniorTechLead': 'Design architecture',
      'SeniorBackendArchitect': 'Design backend',
      'SeniorFrontendSpecialist': 'Design frontend',
      'SeniorUXDesigner': 'Design UX',
      'SeniorSecurityAuditor': 'Security audit',
      'SeniorQA_Security': 'Create tests',
      'SeniorOps': 'Plan deployment',
      'SeniorPerformanceOptimizer': 'Optimize performance',
      'SeniorDebugTracer': 'Debug and analyze',
      'SeniorCodeReviewer': 'Review code',
      'SeniorTechnicalWriter': 'Write documentation',
      'SeniorEducator': 'Create tutorial',
      'ProductStrategist': 'Define strategy',
      'SeniorVibeCalibrator': 'Apply standards',
      'SeniorPreFlightSimulator': 'Run simulation'
    };

    return actionMap[persona] || 'Execute task';
  }
}

export const orchestrator = new PersonaOrchestrator();
