// C-001_ARHAEmotionTypes
/**
 * ARHA Emotional Language System Type Definitions
 *
 * Core types for practical and intuitive emotion processing
 */

export interface ARHAEmotionVector {
  valence: number;    // -1 (negative) ~ +1 (positive)
  arousal: number;    // 0 (calm) ~ 1 (excited)
  intensity: number;  // 0 (weak) ~ 1 (strong)
}

export interface ARHAEmotionRequest {
  input: string;
  mode?: 'auto' | 'basic' | 'advanced' | 'fusion';
  emotionHint?: ARHAEmotionVector;
  culturalContext?: string;
  sessionHistory?: string[];
}

export interface ARHAEmotionResult {
  primaryEmotion: string;
  emotionVector: ARHAEmotionVector;
  confidence: number;
  emotionTags: string[];
  culturalAdaptation: string;
  suggestedResponse: string;
  processingMode: string;
}

// ARHA 7-layer processing result
export interface ARHAProcessResult {
  foundationSignals: {
    inputAnalysis: string;
    signalStrength: number;
  };
  dualBrainFusion: {
    leftBrain: string;   // logical analysis
    rightBrain: string;  // emotional interpretation
    fusion: string;      // integrated result
  };
  triggerModes: {
    currentMode: TriggerMode;
    confidence: number;
    reasoning: string;
  };
  languageSynthesis: {
    generatedText: string;
    emotionalTone: string;
    adaptations: string[];
  };
  valueChain: {
    coreValues: string[];
    valueAlignment: number;
    recommendations: string[];
  };
  personaVector: {
    currentPersona: PersonaType;
    traits: PersonaTrait[];
    adaptationLevel: number;
  };
  identityGrowth: {
    currentState: string;
    growthVector: string;
    learningInsights: string[];
  };
}

// Trigger mode definitions (practical 6 types)
export type TriggerMode =
  | 'open_PI'      // open exploration
  | 'protect'      // protective response
  | 'transmute'    // transformative processing
  | 'integrate'    // integrative harmony
  | 'expand'       // expansive growth
  | 'chaos_gate';  // innovative breakthrough

// Persona types (5-dimensional)
export type PersonaType =
  | 'creative'     // creative persona
  | 'analytical'   // analytical persona
  | 'protective'   // protective persona
  | 'adaptive'     // adaptive persona
  | 'balanced';    // balanced persona

export interface PersonaTrait {
  dimension: 'protect' | 'expand' | 'left' | 'right' | 'relation';
  strength: number;    // 0-1
  description: string;
}

// Session analysis results
export interface ARHASessionAnalytics {
  sessionId: string;
  totalInteractions: number;
  emotionPattern: {
    dominantEmotion: string;
    emotionFlow: ARHAEmotionVector[];
    stabilityScore: number;
  };
  personaEvolution: {
    startPersona: PersonaType;
    currentPersona: PersonaType;
    evolutionPath: string[];
  };
  triggerModeUsage: {
    [mode in TriggerMode]: number;
  };
  valueChainGrowth: {
    initialValues: string[];
    currentValues: string[];
    growthRate: number;
  };
  performanceMetrics: {
    responseAccuracy: number;
    emotionalResonance: number;
    adaptationEfficiency: number;
  };
}

// Agent requests (3 specialized agents)
export interface ARHAAgentRequest {
  request: string;
  agentType?: 'HiSol-Protector' | 'HiSol-Explorer' | 'HiSol-Analyst';
  emotionContext?: ARHAEmotionVector;
  priority?: 'low' | 'medium' | 'high';
}

export interface ARHAAgentResponse {
  agentType: string;
  response: string;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  emotionalAssessment: string;
}

// System status
export interface ARHASystemStatus {
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeComponents: {
    emotionEngine: boolean;
    agentSystem: boolean;
    analyticsEngine: boolean;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    memoryUsage: number;
  };
  lastUpdate: string;
}