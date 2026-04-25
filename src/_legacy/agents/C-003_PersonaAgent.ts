// C-003_PersonaAgent
// Adapted from: hisol-unified-mcp/src/engines/C-003_ARHAAgentEngine_V4.ts @ v1.0
// V3 types inlined (C-003_ARHAAgentEngine legacy types merged)
/**
 * Enhanced Persona Agent with 15 Personas + Auto-Trigger + Orchestration
 * BACKWARD COMPATIBLE - existing functionality preserved
 */

import {
  ARHAAgentRequest,
  ARHAAgentResponse,
  ARHAEmotionVector
} from '../types/arha-emotion.js';

import { PersonaRole } from '../core/types.js';
import { getPersonaDefinition, getAllPersonaRoles } from '../personas/definitions.js';
import { autoTriggerEngine } from '../systems/auto-trigger.js';
import { orchestrator } from '../systems/orchestrator.js';
import { contextManager } from '../systems/context-manager.js';
import { promptBuilder } from '../systems/prompt-builder.js';

// ── V3 Types (inlined from legacy C-003_ARHAAgentEngine) ──────────────────

export interface ARHACommandRequest {
  commandType: 'explore' | 'analyze' | 'implement' | 'orchestrate';
  userIntent: string;
  parameters?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface ARHACommandResponse {
  commandType: string;
  executionResult: any;
  executionTime: number;
  success: boolean;
  output: string;
  nextSteps?: string[];
}

export interface ARHAOrchestrationRequest {
  userInput: string;
  culturalContext?: string;
  emotionHint?: ARHAEmotionVector;
  hisolPersonality?: 'creative' | 'analytical' | 'protective' | 'adaptive';
  sessionHistory?: string[];
}

export interface ARHAOrchestrationResponse {
  orchestrationResult: any;
  involvedAgents: string[];
  executionPlan: Array<{
    agent: string;
    priority: number;
    estimatedTime: number;
    dependencies: string[];
  }>;
  finalOutput: string;
  confidence: number;
}

// ── Feature Flags ──────────────────────────────────────────────────────────

const FEATURES = {
  USE_V4_PERSONAS: process.env.ENABLE_V4_PERSONAS === 'true',
  USE_AUTO_TRIGGER: process.env.ENABLE_AUTO_TRIGGER === 'true',
  USE_ORCHESTRATION: process.env.ENABLE_ORCHESTRATION === 'true',
};

// ── Persona Agent ──────────────────────────────────────────────────────────

export class PersonaAgent {
  private legacyAgentCapabilities: Map<string, string[]> = new Map();

  constructor() {
    this.initializeLegacyAgentCapabilities();
    console.log('C-003_PersonaAgent: Enhanced persona agent initialized with 15 personas');
    console.log('C-003_PersonaAgent: Feature flags:', FEATURES);
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
      console.log('C-003_PersonaAgent: Processing with auto-trigger and orchestration');

      contextManager.setTask(request.request);
      contextManager.extractHints(request.request);

      const triggerResult = autoTriggerEngine.selectPersonas(
        request.request,
        request.emotionContext,
        3
      );

      console.log('C-003_PersonaAgent: Selected personas:', triggerResult.selected_personas);
      console.log('C-003_PersonaAgent: Reasoning:', triggerResult.reasoning);

      const plan = orchestrator.createPlan(triggerResult.selected_personas, request.request);
      const primaryPersona = plan.primary_persona;
      const personaDef = getPersonaDefinition(primaryPersona);

      const context = contextManager.getContext();
      const prompt = promptBuilder.buildPrompt(
        primaryPersona,
        plan.execution_steps[0].action,
        context,
        request.request
      );

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
      console.warn('C-003_PersonaAgent: Error in V4 processing, falling back to legacy:', error);
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

  // ── Legacy private methods ─────────────────────────────────────────────────

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
}
