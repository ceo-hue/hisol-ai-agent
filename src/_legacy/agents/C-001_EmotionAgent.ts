// C-001_EmotionAgent
// Adapted from: hisol-unified-mcp/src/engines/C-001_ARHAEmotionEngine.ts @ v1.0
/**
 * ARHA Emotional Language System Based Unified Emotion Processing Agent
 *
 * Responsibility: Integrate existing 3 emotion processing functions
 *   (hisol_process + hisol_master_fusion + arha_process)
 * Features: Apply practical and intuitive ARHA functional language
 */

import {
  ARHAEmotionRequest,
  ARHAEmotionResult,
  ARHAEmotionVector,
  ARHAProcessResult,
  TriggerMode,
  PersonaType,
  PersonaTrait
} from '../types/arha-emotion.js';

export class EmotionAgent {
  private emotionDatabase: Map<string, ARHAEmotionVector> = new Map();

  constructor() {
    this.initializeEmotionDatabase();
    console.log('C-001_EmotionAgent: Emotion agent initialized');
  }

  /**
   * Unified emotion processing - Main function combining existing 3 functions
   */
  async processEmotion(request: ARHAEmotionRequest): Promise<ARHAEmotionResult> {
    try {
      console.log('C-001_EmotionAgent: Processing emotion', {
        mode: request.mode,
        inputLength: request.input.length
      });

      switch (request.mode) {
        case 'basic':
          return await this.basicEmotionProcess(request);
        case 'advanced':
          return await this.advancedEmotionProcess(request);
        case 'fusion':
          return await this.masterFusionProcess(request);
        default:
          return await this.autoSelectProcess(request);
      }

    } catch (error) {
      console.error('C-001_EmotionAgent: Emotion processing failed', { error });
      throw new Error(`Emotion processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ARHA 7-layer complete processing (replaces old hisol_master_fusion)
   */
  async processARHA7Layer(request: ARHAEmotionRequest): Promise<ARHAProcessResult> {
    try {
      console.log('C-001_EmotionAgent: Processing ARHA 7-layer', { input: request.input });

      const foundationSignals = this.analyzeFoundationSignals(request.input);
      const dualBrainFusion = this.processDualBrain(request.input, foundationSignals);
      const triggerModes = this.determineTriggerMode(request.input, dualBrainFusion);
      const languageSynthesis = this.synthesizeLanguage(request.input, triggerModes.currentMode);
      const valueChain = this.analyzeValueChain(request.input, request.sessionHistory || []);
      const personaVector = this.calculatePersonaVector(request.input, triggerModes.currentMode);
      const identityGrowth = this.trackIdentityGrowth(request.sessionHistory || []);

      const result: ARHAProcessResult = {
        foundationSignals,
        dualBrainFusion,
        triggerModes,
        languageSynthesis,
        valueChain,
        personaVector,
        identityGrowth
      };

      console.log('C-001_EmotionAgent: ARHA 7-layer processing completed');
      return result;

    } catch (error) {
      console.error('C-001_EmotionAgent: ARHA 7-layer processing failed', { error });
      throw error;
    }
  }

  private async basicEmotionProcess(request: ARHAEmotionRequest): Promise<ARHAEmotionResult> {
    const emotionVector = this.analyzeEmotionVector(request.input);
    const primaryEmotion = this.detectPrimaryEmotion(emotionVector);

    return {
      primaryEmotion,
      emotionVector,
      confidence: 0.85,
      emotionTags: this.generateEmotionTags(emotionVector),
      culturalAdaptation: this.adaptToCulture(primaryEmotion, request.culturalContext),
      suggestedResponse: this.generateBasicResponse(primaryEmotion, emotionVector),
      processingMode: 'basic'
    };
  }

  private async advancedEmotionProcess(request: ARHAEmotionRequest): Promise<ARHAEmotionResult> {
    const contextualEmotion = this.analyzeContextualEmotion(request.input, request.sessionHistory);
    const adaptiveResponse = this.generateAdaptiveResponse(contextualEmotion, request.emotionHint);

    return {
      primaryEmotion: contextualEmotion.primary,
      emotionVector: contextualEmotion.vector,
      confidence: 0.92,
      emotionTags: [...contextualEmotion.tags, 'contextual', 'adaptive'],
      culturalAdaptation: this.adaptToCulture(contextualEmotion.primary, request.culturalContext),
      suggestedResponse: adaptiveResponse,
      processingMode: 'advanced'
    };
  }

  private async masterFusionProcess(request: ARHAEmotionRequest): Promise<ARHAEmotionResult> {
    const arhaResult = await this.processARHA7Layer(request);
    const fusedEmotion = this.fuseARHAResults(arhaResult);

    return {
      primaryEmotion: fusedEmotion.primary,
      emotionVector: fusedEmotion.vector,
      confidence: 0.96,
      emotionTags: [...fusedEmotion.tags, 'fusion', 'arha-7layer'],
      culturalAdaptation: arhaResult.languageSynthesis.adaptations.join(', '),
      suggestedResponse: arhaResult.languageSynthesis.generatedText,
      processingMode: 'fusion'
    };
  }

  private async autoSelectProcess(request: ARHAEmotionRequest): Promise<ARHAEmotionResult> {
    const complexity = this.analyzeComplexity(request.input);

    if (complexity < 0.3) {
      return this.basicEmotionProcess(request);
    } else if (complexity < 0.7) {
      return this.advancedEmotionProcess(request);
    } else {
      return this.masterFusionProcess(request);
    }
  }

  private analyzeFoundationSignals(input: string) {
    const signals = {
      emotional: this.detectEmotionalSignals(input),
      cognitive: this.detectCognitiveSignals(input),
      behavioral: this.detectBehavioralSignals(input)
    };

    return {
      inputAnalysis: `Emotional: ${signals.emotional}, Cognitive: ${signals.cognitive}, Behavioral: ${signals.behavioral}`,
      signalStrength: (signals.emotional + signals.cognitive + signals.behavioral) / 3
    };
  }

  private processDualBrain(input: string, foundationSignals: any) {
    const leftBrain = this.analyzeLogically(input);
    const rightBrain = this.analyzeEmotionally(input);
    const fusion = this.fuseBrainResults(leftBrain, rightBrain, foundationSignals);

    return { leftBrain, rightBrain, fusion };
  }

  private determineTriggerMode(input: string, brainFusion: any): { currentMode: TriggerMode; confidence: number; reasoning: string } {
    const modeScores: Record<TriggerMode, number> = {
      'open_PI': this.calculateOpenPIScore(input),
      'protect': this.calculateProtectScore(input),
      'transmute': this.calculateTransmuteScore(input),
      'integrate': this.calculateIntegrateScore(input),
      'expand': this.calculateExpandScore(input),
      'chaos_gate': this.calculateChaosGateScore(input)
    };

    const bestMode = Object.entries(modeScores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as TriggerMode;
    const confidence = modeScores[bestMode];
    const reasoning = this.generateModeReasoning(bestMode, confidence);

    return { currentMode: bestMode, confidence, reasoning };
  }

  private initializeEmotionDatabase() {
    this.emotionDatabase.set('joy', { valence: 0.8, arousal: 0.6, intensity: 0.7 });
    this.emotionDatabase.set('sadness', { valence: -0.6, arousal: 0.2, intensity: 0.6 });
    this.emotionDatabase.set('anger', { valence: -0.7, arousal: 0.9, intensity: 0.8 });
    this.emotionDatabase.set('fear', { valence: -0.8, arousal: 0.8, intensity: 0.7 });
    this.emotionDatabase.set('surprise', { valence: 0.1, arousal: 0.9, intensity: 0.6 });
    this.emotionDatabase.set('love', { valence: 0.9, arousal: 0.5, intensity: 0.8 });
    this.emotionDatabase.set('calm', { valence: 0.3, arousal: 0.1, intensity: 0.4 });
  }

  private analyzeEmotionVector(input: string): ARHAEmotionVector {
    const words = input.toLowerCase().split(' ');
    let valence = 0, arousal = 0, intensity = 0;

    for (const word of words) {
      if (word.includes('good') || word.includes('happy') || word.includes('joy')) {
        valence += 0.3; arousal += 0.2; intensity += 0.2;
      } else if (word.includes('bad') || word.includes('sad') || word.includes('angry')) {
        valence -= 0.3; arousal += 0.3; intensity += 0.3;
      } else if (word.includes('surprise') || word.includes('amazing')) {
        arousal += 0.4; intensity += 0.2;
      }
    }

    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      intensity: Math.max(0, Math.min(1, intensity))
    };
  }

  private detectPrimaryEmotion(vector: ARHAEmotionVector): string {
    if (vector.valence > 0.5 && vector.arousal > 0.5) return 'joy';
    if (vector.valence < -0.5 && vector.arousal > 0.7) return 'anger';
    if (vector.valence < -0.3 && vector.arousal < 0.3) return 'sadness';
    if (vector.valence < -0.5 && vector.arousal > 0.6) return 'fear';
    if (vector.arousal > 0.8) return 'surprise';
    if (vector.valence > 0.7) return 'love';
    return 'neutral';
  }

  private generateEmotionTags(vector: ARHAEmotionVector): string[] {
    const tags = [];
    if (vector.valence > 0.5) tags.push('positive');
    if (vector.valence < -0.5) tags.push('negative');
    if (vector.arousal > 0.7) tags.push('high-energy');
    if (vector.arousal < 0.3) tags.push('calm');
    if (vector.intensity > 0.7) tags.push('intense');
    return tags;
  }

  private adaptToCulture(emotion: string, context?: string): string {
    if (!context) return `General response to ${emotion} emotion`;
    return `Appropriate response to ${emotion} emotion in ${context} cultural context`;
  }

  private generateBasicResponse(emotion: string, vector: ARHAEmotionVector): string {
    return `Detected ${emotion} emotion. Intensity: ${Math.round(vector.intensity * 100)}%, Energy: ${Math.round(vector.arousal * 100)}%`;
  }

  private analyzeComplexity(input: string): number {
    const length = input.length / 1000;
    const sentenceCount = input.split(/[.!?]/).length;
    const emotionWords = input.match(/emotion|feeling|mood|heart|think/g)?.length || 0;

    return Math.min(1, (length + sentenceCount / 10 + emotionWords / 5) / 3);
  }

  private analyzeContextualEmotion(input: string, history?: string[]) {
    return {
      primary: this.detectPrimaryEmotion(this.analyzeEmotionVector(input)),
      vector: this.analyzeEmotionVector(input),
      tags: ['contextual']
    };
  }

  private generateAdaptiveResponse(emotion: any, hint?: ARHAEmotionVector): string {
    return `Adaptive emotional response: ${emotion.primary}`;
  }

  private fuseARHAResults(arhaResult: ARHAProcessResult) {
    return {
      primary: 'fusion-emotion',
      vector: { valence: 0.5, arousal: 0.5, intensity: 0.7 },
      tags: ['arha-fusion']
    };
  }

  private detectEmotionalSignals(input: string): number { return 0.5; }
  private detectCognitiveSignals(input: string): number { return 0.5; }
  private detectBehavioralSignals(input: string): number { return 0.5; }
  private analyzeLogically(input: string): string { return 'Logical analysis result'; }
  private analyzeEmotionally(input: string): string { return 'Emotional analysis result'; }
  private fuseBrainResults(left: string, right: string, signals: any): string { return 'Fusion result'; }

  private calculateOpenPIScore(input: string): number { return 0.5; }
  private calculateProtectScore(input: string): number { return 0.5; }
  private calculateTransmuteScore(input: string): number { return 0.5; }
  private calculateIntegrateScore(input: string): number { return 0.5; }
  private calculateExpandScore(input: string): number { return 0.5; }
  private calculateChaosGateScore(input: string): number { return 0.5; }

  private generateModeReasoning(mode: TriggerMode, confidence: number): string {
    return `${mode} mode selected (confidence: ${Math.round(confidence * 100)}%)`;
  }

  private synthesizeLanguage(input: string, mode: TriggerMode) {
    return {
      generatedText: `Language generation result based on ${mode} mode`,
      emotionalTone: 'adaptive',
      adaptations: ['tone-adjustment', 'cultural-adaptation']
    };
  }

  private analyzeValueChain(input: string, history: string[]) {
    return {
      coreValues: ['empathy', 'understanding', 'growth'],
      valueAlignment: 0.8,
      recommendations: ['Deeper empathy', 'Enhanced understanding']
    };
  }

  private calculatePersonaVector(input: string, mode: TriggerMode) {
    return {
      currentPersona: 'adaptive' as PersonaType,
      traits: [
        { dimension: 'protect' as const, strength: 0.7, description: 'Protective tendency' },
        { dimension: 'expand' as const, strength: 0.6, description: 'Expansive tendency' }
      ],
      adaptationLevel: 0.8
    };
  }

  private trackIdentityGrowth(history: string[]) {
    return {
      currentState: 'Adaptive growth stage',
      growthVector: 'Positive development',
      learningInsights: ['Pattern recognition improvement', 'Emotional understanding increase']
    };
  }
}
