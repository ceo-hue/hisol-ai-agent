// C-003_ARHAAgentEngine_V4
// Enhanced Agent Engine with 15 Personas + Auto-Trigger + Orchestration
// BACKWARD COMPATIBLE - existing functionality preserved

import {
  ARHAAgentRequest,
  ARHAAgentResponse,
  ARHAEmotionVector
} from '../types/arha-emotion.js';

// Import from C-003 engine (existing types)
import {
  ARHACommandRequest,
  ARHACommandResponse,
  ARHAOrchestrationRequest,
  ARHAOrchestrationResponse
} from './C-003_ARHAAgentEngine.js';

import { PersonaRole } from '../core/types.js';
import { getPersonaDefinition, getAllPersonaRoles } from '../personas/definitions.js';
import { autoTriggerEngine } from '../systems/auto-trigger.js';
import { orchestrator } from '../systems/orchestrator.js';
import { contextManager } from '../systems/context-manager.js';
import { promptBuilder } from '../systems/prompt-builder.js';

// Feature flags for safe rollout
const FEATURES = {
  USE_V4_PERSONAS: process.env.ENABLE_V4_PERSONAS === 'true',
  USE_AUTO_TRIGGER: process.env.ENABLE_AUTO_TRIGGER === 'true',
  USE_ORCHESTRATION: process.env.ENABLE_ORCHESTRATION === 'true',
};

export class ARHAAgentEngineV4 {
  private legacyAgentCapabilities: Map<string, string[]> = new Map();

  constructor() {
    this.initializeLegacyAgentCapabilities();
    console.log('C-003_ARHAAgentEngine_V4: Enhanced engine initialized with 15 personas');
    console.log('C-003_ARHAAgentEngine_V4: Feature flags:', FEATURES);
  }

  /**
   * BACKWARD COMPATIBLE: Legacy 3-agent system
   */
  async processAgentLegacy(request: ARHAAgentRequest): Promise<ARHAAgentResponse> {
    const selectedAgent = request.agentType || this.selectOptimalAgentLegacy(request.request);

    switch (selectedAgent) {
      case 'HiSol-Protector':
        return this.processProtectorAgent(request);
      case 'HiSol-Explorer':
        return this.processExplorerAgent(request);
      case 'HiSol-Analyst':
        return this.processAnalystAgent(request);
      default:
        return this.processProtectorAgent(request);
    }
  }

  /**
   * NEW V4: Enhanced multi-persona processing
   */
  async processAgentV4(request: ARHAAgentRequest): Promise<ARHAAgentResponse> {
    try {
      console.log('C-003_V4: Processing with auto-trigger and orchestration');

      // Update context
      contextManager.setTask(request.request);
      contextManager.extractHints(request.request);

      // Auto-trigger persona selection
      const triggerResult = autoTriggerEngine.selectPersonas(
        request.request,
        request.emotionContext,
        3
      );

      console.log('C-003_V4: Selected personas:', triggerResult.selected_personas);
      console.log('C-003_V4: Reasoning:', triggerResult.reasoning);

      // Create orchestration plan
      const plan = orchestrator.createPlan(triggerResult.selected_personas, request.request);

      // Execute with primary persona
      const primaryPersona = plan.primary_persona;
      const personaDef = getPersonaDefinition(primaryPersona);

      // Build enhanced prompt
      const context = contextManager.getContext();
      const prompt = promptBuilder.buildPrompt(
        primaryPersona,
        plan.execution_steps[0].action,
        context,
        request.request
      );

      // Simulate execution (in real implementation, this would call Claude API)
      const response: ARHAAgentResponse = {
        agentType: primaryPersona,
        response: `[${primaryPersona}]\n\nI've analyzed your request: "${request.request}"\n\n` +
          `Based on my ${personaDef.mission}, here's my response:\n\n` +
          `${personaDef.actions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n` +
          `**Mindset applied:** ${personaDef.mindset.join(', ')}\n` +
          `**Guardrails:** ${personaDef.guardrails.join(', ')}\n\n` +
          `**Orchestration Plan:**\n` +
          `- Primary: ${plan.primary_persona}\n` +
          `- Supporting: ${plan.supporting_personas.join(', ')}\n` +
          `- Quality Gates: ${plan.quality_gates.map(g => g.name).join(', ')}\n\n` +
          `Confidence: ${(triggerResult.confidence * 100).toFixed(1)}%`,
        confidence: triggerResult.confidence,
        reasoning: triggerResult.reasoning,
        suggestedActions: personaDef.actions.slice(0, 3),
        emotionalAssessment: `Emotion-aware processing with confidence ${(triggerResult.confidence * 100).toFixed(1)}%`
      };

      return response;

    } catch (error) {
      console.warn('C-003_V4: Error in V4 processing, falling back to legacy:', error);
      return this.processAgentLegacy(request);
    }
  }

  /**
   * Main entry point with graceful degradation
   */
  async processAgent(request: ARHAAgentRequest): Promise<ARHAAgentResponse> {
    if (FEATURES.USE_V4_PERSONAS && FEATURES.USE_AUTO_TRIGGER) {
      return this.processAgentV4(request);
    } else {
      return this.processAgentLegacy(request);
    }
  }

  /**
   * Get all available personas (V4)
   */
  getAvailablePersonas(): PersonaRole[] {
    return getAllPersonaRoles();
  }

  /**
   * Get persona info
   */
  getPersonaInfo(persona: PersonaRole) {
    return getPersonaDefinition(persona);
  }

  // ========================================================================
  // Legacy Methods (Preserved for Backward Compatibility)
  // ========================================================================

  private initializeLegacyAgentCapabilities(): void {
    this.legacyAgentCapabilities.set('HiSol-Protector', [
      'Error detection and recovery',
      'Security vulnerability analysis',
      'Risk assessment',
      'System stability protection'
    ]);

    this.legacyAgentCapabilities.set('HiSol-Explorer', [
      'Code exploration and analysis',
      'Pattern discovery',
      'Optimization opportunities',
      'Best practices recommendations'
    ]);

    this.legacyAgentCapabilities.set('HiSol-Analyst', [
      'Performance analysis',
      'Code quality assessment',
      'Architecture review',
      'Technical debt evaluation'
    ]);
  }

  private selectOptimalAgentLegacy(request: string): string {
    const requestLower = request.toLowerCase();

    if (requestLower.includes('error') || requestLower.includes('security') || requestLower.includes('protect')) {
      return 'HiSol-Protector';
    }

    if (requestLower.includes('explore') || requestLower.includes('find') || requestLower.includes('discover')) {
      return 'HiSol-Explorer';
    }

    if (requestLower.includes('analyze') || requestLower.includes('performance') || requestLower.includes('quality')) {
      return 'HiSol-Analyst';
    }

    return 'HiSol-Protector';
  }

  private async processProtectorAgent(request: ARHAAgentRequest): Promise<ARHAAgentResponse> {
    return {
      agentType: 'HiSol-Protector',
      response: `[HiSol-Protector Agent]\n\nProtective analysis for: "${request.request}"\n\nI've identified potential risks and security considerations:\n- Error handling patterns\n- Security best practices\n- System stability measures\n\nRecommendations: Implement proper error boundaries and security controls.`,
      confidence: 0.85,
      reasoning: 'Protective analysis based on security best practices',
      suggestedActions: this.legacyAgentCapabilities.get('HiSol-Protector') || [],
      emotionalAssessment: 'Protective mode activated'
    };
  }

  private async processExplorerAgent(request: ARHAAgentRequest): Promise<ARHAAgentResponse> {
    return {
      agentType: 'HiSol-Explorer',
      response: `[HiSol-Explorer Agent]\n\nExploration analysis for: "${request.request}"\n\nI've discovered:\n- Code patterns and structures\n- Optimization opportunities\n- Best practice recommendations\n\nSuggestions: Consider refactoring for better maintainability.`,
      confidence: 0.8,
      reasoning: 'Exploratory analysis with pattern discovery',
      suggestedActions: this.legacyAgentCapabilities.get('HiSol-Explorer') || [],
      emotionalAssessment: 'Exploratory mode activated'
    };
  }

  private async processAnalystAgent(request: ARHAAgentRequest): Promise<ARHAAgentResponse> {
    return {
      agentType: 'HiSol-Analyst',
      response: `[HiSol-Analyst Agent]\n\nAnalytical assessment for: "${request.request}"\n\nFindings:\n- Performance characteristics\n- Code quality metrics\n- Architecture evaluation\n\nInsights: System shows good structure with room for optimization.`,
      confidence: 0.82,
      reasoning: 'Analytical assessment with quality metrics',
      suggestedActions: this.legacyAgentCapabilities.get('HiSol-Analyst') || [],
      emotionalAssessment: 'Analytical mode activated'
    };
  }

  /**
   * Command execution (backward compatible)
   */
  async executeCommand(request: ARHACommandRequest): Promise<ARHACommandResponse> {
    const startTime = Date.now();

    const output = `Executing ${request.commandType} command: ${request.userIntent}`;

    return {
      commandType: request.commandType,
      executionResult: { success: true },
      executionTime: Date.now() - startTime,
      success: true,
      output,
      nextSteps: ['Verify results', 'Iterate if needed']
    };
  }

  /**
   * Orchestration (backward compatible)
   */
  async orchestrate(request: ARHAOrchestrationRequest): Promise<ARHAOrchestrationResponse> {
    return {
      orchestrationResult: { success: true },
      involvedAgents: ['HiSol-Protector', 'HiSol-Explorer', 'HiSol-Analyst'],
      executionPlan: [
        { agent: 'HiSol-Protector', priority: 1, estimatedTime: 100, dependencies: [] },
        { agent: 'HiSol-Explorer', priority: 2, estimatedTime: 150, dependencies: ['HiSol-Protector'] },
        { agent: 'HiSol-Analyst', priority: 3, estimatedTime: 120, dependencies: ['HiSol-Explorer'] }
      ],
      finalOutput: `Orchestration complete for: ${request.userInput}`,
      confidence: 0.85
    };
  }
}
