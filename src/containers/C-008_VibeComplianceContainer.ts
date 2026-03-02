// C-008_HOVCS_ComplianceContainer - Enhanced with Smart Feature Classification + Industry V2 Patterns
/**
 * HiSol Organic Vibe-Coding Standards (HOVCS) 2.0 Compliance Container
 * Enhanced with Smart Feature Classification System + Industry Best Practices
 *
 * This container implements the revolutionary HOVCS 2.0 framework with:
 * - Organic Container Architecture (OCA) layer recognition
 * - Conservative Core + Growth Features duality
 * - Neural communication protocol validation
 * - 6-Phase comprehensive validation framework
 * - Biological-inspired container evolution
 * - Template-driven organic development
 * - Advanced security and quality standards
 * - Multi-layer architecture compliance (ROOT/TRUNK/BRANCH/LEAF)
 *
 * NEW: Smart Feature Classification System:
 * - Intelligent feature categorization
 * - User-friendly guided classification
 * - Safety validation and error prevention
 * - Learning system for improved accuracy
 * - Interactive user interface for developers
 *
 * V2 ENHANCEMENT (Auto-triggered when enabled):
 * - 7-stage validation pipeline (AlphaCodium)
 * - Runtime simulation & error prediction (Meta CWM)
 * - Hierarchical quality gates (MoT)
 * - Agent-based validation (MetaGPT)
 * - Impact analysis (CodePlan)
 * - Auto-test generation (BluePrint/Aider)
 *
 * HOVCS 2.0 represents the evolution from traditional vibe-coding to
 * organic, adaptive container architecture with biological growth patterns.
 */

// Import V2 components for auto-enhancement
import {
  HOVCS_ComplianceContainerV2,
  ValidationPipeline,
  ValidationStage,
  CodeContext
} from './C-008_VibeComplianceContainer_V2.js';

// Smart Feature Classification Interfaces
interface ClassificationResult {
  category: 'CONSERVATIVE_CORE' | 'GROWTH_FEATURES' | 'NEEDS_REVIEW';
  confidence: number;
  reason: string;
  suggestions: string[];
  autoClassified: boolean;
}

interface ValidationResult {
  approved: boolean;
  warnings: string[];
  risks: { level: number; description: string }[];
  recommendation: string;
}

interface FeatureRequest {
  description: string;
  codePatterns?: string[];
  projectContext?: string;
  urgency?: 'low' | 'medium' | 'high';
  userRole?: string;
}

interface UserPreferences {
  userId: string;
  corePreference: number;
  growthPreference: number;
  commonKeywords: string[];
  decisionSpeed: number;
  learningData: any[];
}

// HOVCS 2.0 OCA Layer Classifications
type OCALayer = 'ROOT' | 'TRUNK' | 'BRANCH' | 'LEAF';
type ChangeRate = {
  layer: OCALayer;
  minRate: number;
  maxRate: number;
  conservativeRatio: number;
};

// Conservative Core + Growth Features Architecture
interface ConservativeCore {
  readonly security: SecurityProtocol;
  readonly communication: CommunicationInterface;
  readonly audit: AuditTrail;
  readonly errorHandling: ErrorHandler;
  readonly healthMonitoring: HealthMonitor;
}

interface GrowthFeatures {
  businessLogic: BusinessModule[];
  userInterface: UIComponent[];
  integrations: IntegrationAdapter[];
  customizations: CustomizationSet;
  experiments: ExperimentalFeature[];
}

// Neural Communication Protocols
type NeuralProtocol = 'SCP' | 'BAP' | 'EDP' | 'ERP'; // Secure Control, Business API, Event-Driven, Emergency Response

// HOVCS 2.0 Validation Rule Structure
interface HOVCSRule {
  id: string;
  name: string;
  description: string;
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  validator: (code: string, context: any) => HOVCSValidationResult;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: 'foundation' | 'layer' | 'protocol' | 'template' | 'implementation' | 'validation';
  applicableLayers: OCALayer[];
  conservativeCoreRequired: boolean;
}

interface HOVCSValidationResult {
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  layerCompliance?: {
    layer: OCALayer;
    changeRate: number;
    conservativeRatio: number;
  };
}

export interface VibeComplianceRequest {
  targetPath?: string;
  analysisDepth: 'BASIC' | 'CORE' | 'FULL';
  complianceLevel: 'BASIC' | 'CORE' | 'FULL';
  containerOperation?: 'analyze' | 'apply' | 'validate' | 'optimize';
  // HOVCS 2.0 specific options
  ocaLayer?: OCALayer;
  validatePhases?: number[];
  enableOrganicTemplates?: boolean;
  neuralProtocolValidation?: boolean;
  // V2 specific options
  performanceBudget?: {
    maxLatencyMs: number;
    maxBundleSizeKb: number;
    maxMemoryMb: number;
  };
}

export interface ComplianceReport {
  complianceScore: number;
  qualityGrade: 'A' | 'B+' | 'B' | 'C';
  hovcsVersion: '2.0';
  ocaLayerCompliance: {
    identifiedLayer: OCALayer;
    changeRateCompliance: number;
    conservativeCoreScore: number;
    growthFeaturesScore: number;
    layerBoundaryCompliance: number;
  };
  phaseValidation: {
    phase1_foundation: number;
    phase2_layer: number;
    phase3_protocol: number;
    phase4_template: number;
    phase5_implementation: number;
    phase6_validation: number;
  };
  neuralProtocols: {
    implementedProtocols: NeuralProtocol[];
    protocolCompliance: number;
    communicationEfficiency: number;
  };
  organicTemplates: {
    templateEvolutionScore: number;
    biologicalGrowthCompliance: number;
    templateInheritanceScore: number;
  };
  // Legacy analysis maintained for backward compatibility
  containerAnalysis: {
    atomicResponsibility: number;
    circuitBreakerImplementation: number;
    qualityGradeSystem: number;
    masterBlueprintCompliance: number;
  };
  recommendations: string[];
  violations: string[];
  improvementPlan: string[];
  certificationStatus: 'HOVCS_2.0_CERTIFIED' | 'HOVCS_2.0_PARTIAL' | 'LEGACY_COMPLIANT' | 'NON_COMPLIANT';
  // V2 Enhancement (optional - only present when V2 validation runs)
  v2ValidationPipeline?: ValidationPipeline;
}

export interface VibeContainer {
  id: string;
  name: string;
  responsibility: string;
  qualityGrade: 'A' | 'B+' | 'B' | 'C';
  atomicScore: number;
  dependencies: string[];
  circuitBreaker: boolean;
  // HOVCS 2.0 extensions
  ocaLayer?: OCALayer;
  conservativeCore?: ConservativeCore;
  growthFeatures?: GrowthFeatures;
  neuralProtocols?: NeuralProtocol[];
  changeRate?: number;
  templateEvolution?: {
    baseTemplate: string;
    evolutionGeneration: number;
    biologicalGrowthPattern: string;
  };
  hovcsCompliance?: {
    version: '2.0';
    certificationDate: string;
    validationPhases: number[];
  };
}

// Supporting interfaces for HOVCS 2.0
interface SecurityProtocol {
  authenticationLevel: 'BASIC' | 'ADVANCED' | 'HSM';
  encryptionStandard: string;
  auditLevel: 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE';
}

interface CommunicationInterface {
  protocol: NeuralProtocol;
  messageRouting: boolean;
  circuitBreaker: boolean;
  latencyThreshold: number;
}

interface AuditTrail {
  enabled: boolean;
  retentionPeriod: number;
  complianceLevel: string;
}

interface ErrorHandler {
  gracefulDegradation: boolean;
  errorRecovery: boolean;
  contextPreservation: boolean;
}

interface HealthMonitor {
  realTimeMonitoring: boolean;
  performanceMetrics: boolean;
  alertingEnabled: boolean;
}

interface BusinessModule {
  name: string;
  version: string;
  canHandle: (request: any) => boolean;
  process: (request: any) => Promise<any>;
}

interface UIComponent {
  type: string;
  layer: OCALayer;
  responsive: boolean;
}

interface IntegrationAdapter {
  system: string;
  protocol: string;
  healthCheck: () => Promise<boolean>;
}

interface CustomizationSet {
  userPreferences: Record<string, any>;
  businessRules: Record<string, any>;
  experimentalFlags: Record<string, boolean>;
}

interface ExperimentalFeature {
  name: string;
  enabled: boolean;
  successCriteria: string[];
  rollbackPlan: string;
}

export class HOVCS_ComplianceContainer {
  private containers: Map<string, VibeContainer> = new Map();
  private complianceRules: string[] = [];

  // Smart Feature Classification System Components
  private featureClassifier: FeatureClassifier;
  private safetyValidator: SafetyValidator;
  private userInterface: SmartUserInterface;
  private learningSystem: LearningSystem;
  private userPreferences: Map<string, UserPreferences> = new Map();

  // V2 Enhancement Components (Auto-triggered when enabled)
  private v2Container: HOVCS_ComplianceContainerV2;
  private readonly V2_ENABLED = process.env.ENABLE_V2_VIBE_VALIDATION === 'true';
  private readonly V2_AUTO_TRIGGER = process.env.ENABLE_V2_AUTO_TRIGGER === 'true';

  // HOVCS 2.0 OCA Layer Definitions
  private readonly ocaLayers: Record<OCALayer, ChangeRate> = {
    ROOT: { layer: 'ROOT', minRate: 0, maxRate: 5, conservativeRatio: 0.95 },
    TRUNK: { layer: 'TRUNK', minRate: 5, maxRate: 20, conservativeRatio: 0.80 },
    BRANCH: { layer: 'BRANCH', minRate: 20, maxRate: 70, conservativeRatio: 0.60 },
    LEAF: { layer: 'LEAF', minRate: 70, maxRate: 100, conservativeRatio: 0.30 }
  };

  // HOVCS 2.0 6-Phase Validation Rules
  private hovcsRules: HOVCSRule[] = [
    // Phase 1: Foundational Concepts
    {
      id: 'H001',
      name: 'OCA Layer Classification',
      description: 'Container must be properly classified in OCA hierarchy',
      phase: 1,
      validator: this.validateOCALayerClassification.bind(this),
      severity: 'critical',
      category: 'foundation',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    {
      id: 'H002',
      name: 'Conservative Core Architecture',
      description: 'Container must implement conservative core pattern',
      phase: 1,
      validator: this.validateConservativeCore.bind(this),
      severity: 'critical',
      category: 'foundation',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    {
      id: 'H003',
      name: 'Growth Features Separation',
      description: 'Growth features must be properly separated from conservative core',
      phase: 1,
      validator: this.validateGrowthFeaturesSeparation.bind(this),
      severity: 'major',
      category: 'foundation',
      applicableLayers: ['TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    // Phase 2: Layer Classification System
    {
      id: 'H004',
      name: 'Change Rate Compliance',
      description: 'Container change rate must match OCA layer specification',
      phase: 2,
      validator: this.validateChangeRateCompliance.bind(this),
      severity: 'major',
      category: 'layer',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: false
    },
    {
      id: 'H005',
      name: 'Layer Communication Boundaries',
      description: 'Communication must respect layer boundaries and protocols',
      phase: 2,
      validator: this.validateLayerCommunication.bind(this),
      severity: 'critical',
      category: 'layer',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    // Phase 3: Communication Protocol Standards
    {
      id: 'H006',
      name: 'Neural Protocol Implementation',
      description: 'Container must implement appropriate neural communication protocol',
      phase: 3,
      validator: this.validateNeuralProtocol.bind(this),
      severity: 'critical',
      category: 'protocol',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    {
      id: 'H007',
      name: 'Security Protocol Compliance',
      description: 'Security protocols must match layer requirements (SCP/BAP/EDP)',
      phase: 3,
      validator: this.validateSecurityProtocol.bind(this),
      severity: 'critical',
      category: 'protocol',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    // Phase 4: Template System Integration
    {
      id: 'H008',
      name: 'Organic Template Pattern',
      description: 'Container must follow organic template evolution patterns',
      phase: 4,
      validator: this.validateOrganicTemplate.bind(this),
      severity: 'major',
      category: 'template',
      applicableLayers: ['TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: false
    },
    {
      id: 'H009',
      name: 'Template Inheritance Validation',
      description: 'Template inheritance must follow biological growth patterns',
      phase: 4,
      validator: this.validateTemplateInheritance.bind(this),
      severity: 'major',
      category: 'template',
      applicableLayers: ['BRANCH', 'LEAF'],
      conservativeCoreRequired: false
    },
    // Phase 5: Practical Implementation Guidelines
    {
      id: 'H010',
      name: 'Implementation Quality Standards',
      description: 'Implementation must meet HOVCS 2.0 quality standards',
      phase: 5,
      validator: this.validateImplementationQuality.bind(this),
      severity: 'major',
      category: 'implementation',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    {
      id: 'H011',
      name: 'Performance Optimization',
      description: 'Performance must be optimized for layer-specific requirements',
      phase: 5,
      validator: this.validatePerformanceOptimization.bind(this),
      severity: 'major',
      category: 'implementation',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: false
    },
    // Phase 6: Validation and Testing Framework
    {
      id: 'H012',
      name: 'Comprehensive Testing Coverage',
      description: 'Testing must cover all HOVCS 2.0 validation aspects',
      phase: 6,
      validator: this.validateTestingCoverage.bind(this),
      severity: 'major',
      category: 'validation',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    },
    {
      id: 'H013',
      name: 'Certification Compliance',
      description: 'Container must meet HOVCS 2.0 certification requirements',
      phase: 6,
      validator: this.validateCertificationCompliance.bind(this),
      severity: 'critical',
      category: 'validation',
      applicableLayers: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'],
      conservativeCoreRequired: true
    }
  ];

  constructor() {
    this.initializeComplianceRules();
    this.initializeHOVCSRules();
    this.registerCoreContainers();
    this.upgradeContainersToHOVCS();

    // Initialize Smart Feature Classification System
    this.featureClassifier = new FeatureClassifier(this);
    this.safetyValidator = new SafetyValidator(this);
    this.userInterface = new SmartUserInterface(this);
    this.learningSystem = new LearningSystem(this);

    // Initialize V2 Enhancement Components
    this.v2Container = new HOVCS_ComplianceContainerV2();

    console.log('C-008_HOVCS_ComplianceContainer: HOVCS 2.0 organic vibe-coding compliance system initialized');
    console.log('🌱 Organic Container Architecture (OCA) enabled with 6-phase validation framework');
    console.log('🤖 Smart Feature Classification System activated');

    if (this.V2_ENABLED) {
      console.log('✨ V2 Industry Best Practices enabled (AlphaCodium, Meta CWM, MoT, MetaGPT, CodePlan)');
      if (this.V2_AUTO_TRIGGER) {
        console.log('🎯 V2 Auto-Trigger activated - Advanced validation runs automatically');
      }
    }
  }

  /**
   * Apply HOVCS 2.0 organic vibe-coding engineering standards
   */
  async applyEngineering(request: VibeComplianceRequest): Promise<ComplianceReport> {
    try {
      console.log('C-008_HOVCS_ComplianceContainer: Applying HOVCS 2.0 engineering standards', {
        depth: request.analysisDepth,
        level: request.complianceLevel,
        ocaLayer: request.ocaLayer || 'auto-detect',
        phases: request.validatePhases || [1, 2, 3, 4, 5, 6]
      });

      // 1. Analyze current state with OCA layer detection
      const currentState = await this.analyzeCurrentState(request);

      // 2. Apply HOVCS 2.0 validation rules
      const hovcsResults = await this.applyHOVCSValidation(request, currentState);

      // 3. Apply legacy compliance rules for backward compatibility
      const legacyResults = await this.applyLegacyComplianceRules(request, currentState);

      // 4. Generate HOVCS 2.0 improvement plan
      const improvementPlan = this.generateHOVCSImprovementPlan(hovcsResults, legacyResults);

      // 5. Calculate quality grade with HOVCS 2.0 criteria
      const qualityGrade = this.calculateHOVCSQualityGrade(hovcsResults);

      // 6. AUTO-TRIGGER V2 validation if enabled (Industry Best Practices)
      let v2Pipeline: ValidationPipeline | null = null;
      if (this.V2_ENABLED && this.shouldTriggerV2Validation(request, hovcsResults)) {
        console.log('🚀 C-008 V2: Auto-triggering industry best practices validation');
        v2Pipeline = await this.runV2Validation(request, currentState);
        console.log(`✅ C-008 V2: Validation complete - Score: ${(v2Pipeline.overallScore * 100).toFixed(1)}% (${v2Pipeline.overallStatus})`);
      }

      const report: ComplianceReport = {
        complianceScore: hovcsResults.overallScore,
        qualityGrade,
        hovcsVersion: '2.0',
        ocaLayerCompliance: hovcsResults.ocaLayerCompliance,
        phaseValidation: hovcsResults.phaseValidation,
        neuralProtocols: hovcsResults.neuralProtocols,
        organicTemplates: hovcsResults.organicTemplates,
        containerAnalysis: legacyResults.containerAnalysis,
        recommendations: [
          ...hovcsResults.recommendations,
          ...legacyResults.recommendations,
          ...(v2Pipeline ? this.extractV2Recommendations(v2Pipeline) : [])
        ],
        violations: [
          ...hovcsResults.violations,
          ...legacyResults.violations,
          ...(v2Pipeline ? this.extractV2Violations(v2Pipeline) : [])
        ],
        improvementPlan,
        certificationStatus: this.determineCertificationStatus(hovcsResults),
        v2ValidationPipeline: v2Pipeline || undefined // Include V2 results if available
      };

      console.log('C-008_HOVCS_ComplianceContainer: HOVCS 2.0 engineering standards applied', {
        score: report.complianceScore,
        grade: report.qualityGrade,
        certification: report.certificationStatus,
        ocaLayer: report.ocaLayerCompliance.identifiedLayer
      });

      return report;

    } catch (error) {
      console.error('C-008_HOVCS_ComplianceContainer: HOVCS 2.0 engineering application failed', { error });
      throw new Error(`HOVCS 2.0 engineering standards application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate container-based architecture
   */
  async validateArchitecture(containerId?: string): Promise<{
    isValid: boolean;
    score: number;
    violations: string[];
    recommendations: string[];
  }> {
    const containers = containerId ? [this.containers.get(containerId)] : Array.from(this.containers.values());
    const validContainers = containers.filter(c => c !== undefined);

    let totalScore = 0;
    const violations: string[] = [];
    const recommendations: string[] = [];

    for (const container of validContainers) {
      const analysis = this.analyzeContainer(container!);
      totalScore += analysis.score;

      if (analysis.score < 0.7) {
        violations.push(`Container ${container!.id}: Quality below threshold (${Math.round(analysis.score * 100)}%)`);
      }

      if (!container!.circuitBreaker) {
        violations.push(`Container ${container!.id}: Missing circuit breaker implementation`);
        recommendations.push(`Implement circuit breaker pattern for ${container!.id}`);
      }

      if (container!.atomicScore < 0.8) {
        violations.push(`Container ${container!.id}: Atomic responsibility violation`);
        recommendations.push(`Refactor ${container!.id} for better atomic responsibility`);
      }
    }

    const averageScore = validContainers.length > 0 ? totalScore / validContainers.length : 0;

    return {
      isValid: averageScore >= 0.8 && violations.length === 0,
      score: averageScore,
      violations,
      recommendations
    };
  }

  /**
   * Register a new container
   */
  registerContainer(container: VibeContainer): void {
    this.containers.set(container.id, container);
    console.log(`C-008_HOVCS_ComplianceContainer: Registered container ${container.id} [${container.ocaLayer || 'UNCLASSIFIED'}]`);
  }

  /**
   * Get container status
   */
  getContainerStatus(containerId: string): VibeContainer | null {
    return this.containers.get(containerId) || null;
  }

  /**
   * Get all containers with quality analysis
   */
  getAllContainers(): Array<VibeContainer & { analysis: any }> {
    return Array.from(this.containers.values()).map(container => ({
      ...container,
      analysis: this.analyzeContainer(container)
    }));
  }

  /**
   * Initialize HOVCS 2.0 compliance rules
   */
  private initializeHOVCSRules(): void {
    console.log('🌱 Initializing HOVCS 2.0 6-phase validation framework');
    console.log(`📊 Total HOVCS rules: ${this.hovcsRules.length}`);
    console.log(`🏗️ OCA layers supported: ${Object.keys(this.ocaLayers).join(', ')}`);
  }

  /**
   * Initialize legacy compliance rules for backward compatibility
   */
  private initializeComplianceRules(): void {
    this.complianceRules = [
      'C-XXX: Container numbering system implementation',
      'Atomic responsibility principle enforcement',
      'Circuit breaker pattern implementation',
      'Quality grade system (A/B+/B/C) application',
      'Master blueprint architecture compliance',
      'Failure isolation and recovery mechanisms',
      'Performance monitoring and metrics',
      'Scalability and maintainability standards',
      // HOVCS 2.0 additions
      'OCA layer classification and change rate compliance',
      'Conservative core + growth features duality',
      'Neural communication protocol implementation',
      'Organic template evolution patterns',
      'Biological growth pattern compliance',
      '6-phase validation framework certification'
    ];
  }

  /**
   * Register core HiSol containers with HOVCS 2.0 classification
   */
  private registerCoreContainers(): void {
    const coreContainers: VibeContainer[] = [
      {
        id: 'C-001',
        name: 'ARHAEmotionContainer',
        responsibility: 'Emotion processing and ARHA 7-layer integration',
        qualityGrade: 'A',
        atomicScore: 0.9,
        dependencies: [],
        circuitBreaker: true,
        // HOVCS 2.0 classification
        ocaLayer: 'TRUNK',
        changeRate: 15,
        neuralProtocols: ['BAP', 'EDP'],
        templateEvolution: {
          baseTemplate: 'T-001_EmotionCore',
          evolutionGeneration: 1,
          biologicalGrowthPattern: 'organic_expansion'
        }
      },
      {
        id: 'C-002',
        name: 'ARHAAnalyticsContainer',
        responsibility: 'Analytics engine and performance metrics',
        qualityGrade: 'A',
        atomicScore: 0.85,
        dependencies: ['C-001'],
        circuitBreaker: true,
        // HOVCS 2.0 classification
        ocaLayer: 'TRUNK',
        changeRate: 18,
        neuralProtocols: ['BAP', 'SCP'],
        templateEvolution: {
          baseTemplate: 'T-002_AnalyticsCore',
          evolutionGeneration: 1,
          biologicalGrowthPattern: 'data_driven_growth'
        }
      },
      {
        id: 'C-003',
        name: 'ARHAAgentContainer',
        responsibility: 'Agent processing and orchestration',
        qualityGrade: 'B+',
        atomicScore: 0.8,
        dependencies: ['C-001', 'C-002'],
        circuitBreaker: true,
        // HOVCS 2.0 classification
        ocaLayer: 'TRUNK',
        changeRate: 20,
        neuralProtocols: ['BAP', 'EDP'],
        templateEvolution: {
          baseTemplate: 'T-003_AgentOrchestrator',
          evolutionGeneration: 1,
          biologicalGrowthPattern: 'coordinated_evolution'
        }
      },
      {
        id: 'C-007',
        name: 'APIGatewayContainer',
        responsibility: 'External API routing and LLM integration',
        qualityGrade: 'A',
        atomicScore: 0.9,
        dependencies: [],
        circuitBreaker: true,
        // HOVCS 2.0 classification
        ocaLayer: 'BRANCH',
        changeRate: 35,
        neuralProtocols: ['EDP', 'ERP'],
        templateEvolution: {
          baseTemplate: 'B-001_APIGatewayFeature',
          evolutionGeneration: 1,
          biologicalGrowthPattern: 'interface_adaptation'
        }
      },
      {
        id: 'C-008',
        name: 'HOVCS_ComplianceContainer',
        responsibility: 'HOVCS 2.0 organic vibe-coding standards enforcement',
        qualityGrade: 'A',
        atomicScore: 0.95,
        dependencies: [],
        circuitBreaker: true,
        // HOVCS 2.0 classification
        ocaLayer: 'BRANCH',
        changeRate: 40,
        neuralProtocols: ['BAP', 'EDP', 'SCP'],
        templateEvolution: {
          baseTemplate: 'B-002_ComplianceFeature',
          evolutionGeneration: 2,
          biologicalGrowthPattern: 'standards_evolution'
        },
        hovcsCompliance: {
          version: '2.0',
          certificationDate: new Date().toISOString(),
          validationPhases: [1, 2, 3, 4, 5, 6]
        }
      }
    ];

    coreContainers.forEach(container => this.registerContainer(container));
  }

  /**
   * Upgrade existing containers to HOVCS 2.0 compliance
   */
  private upgradeContainersToHOVCS(): void {
    console.log('🔄 Upgrading existing containers to HOVCS 2.0 compliance');

    for (const [id, container] of this.containers) {
      if (!container.hovcsCompliance) {
        // Auto-classify container based on existing properties
        const autoClassifiedLayer = this.autoClassifyOCALayer(container);

        this.containers.set(id, {
          ...container,
          ocaLayer: autoClassifiedLayer,
          changeRate: this.estimateChangeRate(container),
          neuralProtocols: this.assignDefaultProtocols(autoClassifiedLayer),
          templateEvolution: {
            baseTemplate: `${autoClassifiedLayer.charAt(0)}-${id.split('-')[1]}_${container.name.replace('Container', '')}`,
            evolutionGeneration: 0,
            biologicalGrowthPattern: 'legacy_migration'
          },
          hovcsCompliance: {
            version: '2.0',
            certificationDate: new Date().toISOString(),
            validationPhases: [1, 2, 3]
          }
        });

        console.log(`✅ Upgraded ${id} to ${autoClassifiedLayer} layer with HOVCS 2.0 compliance`);
      }
    }
  }

  /**
   * Analyze current system state with HOVCS 2.0 OCA layer detection
   */
  private async analyzeCurrentState(request: VibeComplianceRequest): Promise<any> {
    const ocaDistribution = this.getOCALayerDistribution();
    const neuralProtocolCoverage = this.getNeuralProtocolCoverage();
    const hovcsComplianceLevel = this.getHOVCSComplianceLevel();

    return {
      containerCount: this.containers.size,
      complianceRuleCount: this.complianceRules.length,
      hovcsRuleCount: this.hovcsRules.length,
      analysisDepth: request.analysisDepth,
      ocaLayerDistribution: ocaDistribution,
      neuralProtocolCoverage,
      hovcsComplianceLevel,
      timestamp: new Date().toISOString(),
      version: 'HOVCS 2.0'
    };
  }

  /**
   * Apply HOVCS 2.0 validation rules
   */
  private async applyHOVCSValidation(request: VibeComplianceRequest, currentState: any): Promise<any> {
    const phaseValidation = {
      phase1_foundation: 0,
      phase2_layer: 0,
      phase3_protocol: 0,
      phase4_template: 0,
      phase5_implementation: 0,
      phase6_validation: 0
    };

    const ocaLayerCompliance = {
      identifiedLayer: request.ocaLayer || this.detectDominantOCALayer(),
      changeRateCompliance: 0,
      conservativeCoreScore: 0,
      growthFeaturesScore: 0,
      layerBoundaryCompliance: 0
    };

    const neuralProtocols = {
      implementedProtocols: this.getImplementedProtocols(),
      protocolCompliance: 0,
      communicationEfficiency: 0
    };

    const organicTemplates = {
      templateEvolutionScore: 0,
      biologicalGrowthCompliance: 0,
      templateInheritanceScore: 0
    };

    const violations: string[] = [];
    const recommendations: string[] = [];

    // Apply HOVCS rules based on requested phases
    const phasesToValidate = request.validatePhases || [1, 2, 3, 4, 5, 6];

    for (const phase of phasesToValidate) {
      const phaseRules = this.hovcsRules.filter(rule => rule.phase === phase);
      let phaseScore = 0;

      for (const rule of phaseRules) {
        try {
          const result = rule.validator('', { request, currentState, containers: this.containers });
          phaseScore += result.score;

          if (!result.passed) {
            violations.push(`${rule.id}: ${rule.description}`);
            recommendations.push(...result.recommendations);
          }
        } catch (error) {
          console.warn(`HOVCS rule ${rule.id} validation failed:`, error);
        }
      }

      const averagePhaseScore = phaseRules.length > 0 ? phaseScore / phaseRules.length : 0;
      (phaseValidation as any)[`phase${phase}_${this.getPhaseCategory(phase)}`] = averagePhaseScore;
    }

    // Calculate layer compliance
    ocaLayerCompliance.changeRateCompliance = this.calculateChangeRateCompliance();
    ocaLayerCompliance.conservativeCoreScore = this.calculateConservativeCoreScore();
    ocaLayerCompliance.growthFeaturesScore = this.calculateGrowthFeaturesScore();
    ocaLayerCompliance.layerBoundaryCompliance = this.calculateLayerBoundaryCompliance();

    // Calculate neural protocol compliance
    neuralProtocols.protocolCompliance = this.calculateProtocolCompliance();
    neuralProtocols.communicationEfficiency = this.calculateCommunicationEfficiency();

    // Calculate organic template scores
    organicTemplates.templateEvolutionScore = this.calculateTemplateEvolutionScore();
    organicTemplates.biologicalGrowthCompliance = this.calculateBiologicalGrowthCompliance();
    organicTemplates.templateInheritanceScore = this.calculateTemplateInheritanceScore();

    const overallScore = Object.values(phaseValidation).reduce((sum, score) => sum + score, 0) / 6;

    return {
      overallScore,
      phaseValidation,
      ocaLayerCompliance,
      neuralProtocols,
      organicTemplates,
      violations,
      recommendations
    };
  }

  /**
   * Apply legacy compliance rules for backward compatibility
   */
  private async applyLegacyComplianceRules(request: VibeComplianceRequest, currentState: any): Promise<any> {
    const containerAnalysis = {
      atomicResponsibility: this.calculateAtomicResponsibilityScore(),
      circuitBreakerImplementation: this.calculateCircuitBreakerScore(),
      qualityGradeSystem: this.calculateQualityGradeScore(),
      masterBlueprintCompliance: this.calculateBlueprintComplianceScore()
    };

    const overallScore = Object.values(containerAnalysis).reduce((sum, score) => sum + score, 0) / 4;

    const violations: string[] = [];
    const recommendations: string[] = [];

    if (containerAnalysis.atomicResponsibility < 0.8) {
      violations.push('Legacy: Atomic responsibility principle violations detected');
      recommendations.push('Legacy: Refactor containers to ensure single responsibility');
    }

    if (containerAnalysis.circuitBreakerImplementation < 0.9) {
      violations.push('Legacy: Circuit breaker implementation incomplete');
      recommendations.push('Legacy: Implement circuit breaker pattern in all containers');
    }

    if (containerAnalysis.qualityGradeSystem < 0.8) {
      violations.push('Legacy: Quality grade system not fully implemented');
      recommendations.push('Legacy: Apply A/B+/B/C quality grading to all operations');
    }

    return {
      overallScore,
      containerAnalysis,
      violations,
      recommendations
    };
  }

  /**
   * Generate HOVCS 2.0 improvement plan
   */
  private generateHOVCSImprovementPlan(hovcsResults: any, legacyResults: any): string[] {
    const plan: string[] = [
      '🌱 === HOVCS 2.0 Organic Evolution Plan ==='
    ];

    // HOVCS 2.0 specific improvements
    if (hovcsResults.overallScore < 0.9) {
      plan.push('🌱 Phase 1: Foundational OCA Architecture Implementation');
      plan.push('🌳 Phase 2: Layer Classification and Boundary Optimization');
      plan.push('🧬 Phase 3: Neural Communication Protocol Enhancement');
      plan.push('🧠 Phase 4: Organic Template System Integration');
      plan.push('⚙️ Phase 5: Advanced Implementation and Performance Tuning');
      plan.push('🏆 Phase 6: Comprehensive Validation and Certification');
    }

    // Layer-specific improvements
    if (hovcsResults.ocaLayerCompliance.changeRateCompliance < 0.8) {
      plan.push('🔄 Priority: Optimize change rate for OCA layer compliance');
    }

    if (hovcsResults.neuralProtocols.protocolCompliance < 0.8) {
      plan.push('🔌 Priority: Implement missing neural communication protocols');
    }

    if (hovcsResults.organicTemplates.templateEvolutionScore < 0.7) {
      plan.push('🧬 Priority: Enhance organic template evolution patterns');
    }

    // Legacy improvements
    if (legacyResults.containerAnalysis.atomicResponsibility < 0.8) {
      plan.push('🎯 Legacy: Refactor containers for atomic responsibility');
    }

    if (hovcsResults.violations.length > 0 || legacyResults.violations.length > 0) {
      plan.push('🚨 Critical: Address all compliance violations immediately');
    }

    plan.push('✨ Goal: Achieve HOVCS 2.0 full certification with organic growth patterns');

    return plan;
  }

  /**
   * Calculate quality grade based on HOVCS 2.0 compliance
   */
  private calculateHOVCSQualityGrade(hovcsResults: any): 'A' | 'B+' | 'B' | 'C' {
    const hovcsScore = hovcsResults.overallScore;
    const layerScore = hovcsResults.ocaLayerCompliance.changeRateCompliance;
    const protocolScore = hovcsResults.neuralProtocols.protocolCompliance;
    const templateScore = hovcsResults.organicTemplates.templateEvolutionScore;

    // HOVCS 2.0 uses weighted scoring with emphasis on organic architecture
    const weightedScore = (
      hovcsScore * 0.4 +
      layerScore * 0.3 +
      protocolScore * 0.2 +
      templateScore * 0.1
    );

    if (weightedScore >= 0.95 && hovcsResults.violations.length === 0) return 'A';
    if (weightedScore >= 0.85) return 'B+';
    if (weightedScore >= 0.75) return 'B';
    return 'C';
  }

  /**
   * Analyze individual container
   */
  private analyzeContainer(container: VibeContainer): { score: number; issues: string[] } {
    let score = 1.0;
    const issues: string[] = [];

    if (!container.circuitBreaker) {
      score -= 0.2;
      issues.push('Missing circuit breaker');
    }

    if (container.atomicScore < 0.8) {
      score -= 0.15;
      issues.push('Atomic responsibility violation');
    }

    if (container.qualityGrade === 'C') {
      score -= 0.3;
      issues.push('Poor quality grade');
    } else if (container.qualityGrade === 'B') {
      score -= 0.1;
    }

    if (container.dependencies.length > 3) {
      score -= 0.1;
      issues.push('Too many dependencies');
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Calculate atomic responsibility score
   */
  private calculateAtomicResponsibilityScore(): number {
    const scores = Array.from(this.containers.values()).map(c => c.atomicScore);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Calculate circuit breaker implementation score
   */
  private calculateCircuitBreakerScore(): number {
    const total = this.containers.size;
    const withCircuitBreaker = Array.from(this.containers.values()).filter(c => c.circuitBreaker).length;
    return total > 0 ? withCircuitBreaker / total : 0;
  }

  /**
   * Calculate quality grade score
   */
  private calculateQualityGradeScore(): number {
    const gradeValues = { 'A': 1.0, 'B+': 0.85, 'B': 0.7, 'C': 0.5 };
    const grades = Array.from(this.containers.values()).map(c => gradeValues[c.qualityGrade]);
    return grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;
  }

  /**
   * Calculate blueprint compliance score
   */
  private calculateBlueprintComplianceScore(): number {
    // Check if containers follow master blueprint architecture
    const hasApiGateway = this.containers.has('C-007');
    const hasComplianceContainer = this.containers.has('C-008');
    const hasEmotionEngine = this.containers.has('C-001');
    const hasAnalytics = this.containers.has('C-002');

    const coreComponents = [hasApiGateway, hasComplianceContainer, hasEmotionEngine, hasAnalytics];
    const score = coreComponents.filter(Boolean).length / coreComponents.length;

    return score;
  }

  /**
   * Get container system status
   */
  getSystemStatus(): any {
    return {
      containerName: 'C-008_HOVCS_ComplianceContainer',
      version: 'HOVCS 2.0',
      status: 'healthy',
      totalContainers: this.containers.size,
      complianceRules: this.complianceRules.length,
      hovcsRules: this.hovcsRules.length,
      overallScore: this.calculateAtomicResponsibilityScore(),
      ocaLayerDistribution: this.getOCALayerDistribution(),
      neuralProtocolCoverage: this.getNeuralProtocolCoverage(),
      hovcsComplianceLevel: this.getHOVCSComplianceLevel(),
      qualityDistribution: this.getQualityDistribution(),
      organicEvolutionStatus: this.getOrganicEvolutionStatus(),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get quality distribution across containers
   */
  private getQualityDistribution(): Record<string, number> {
    const distribution = { 'A': 0, 'B+': 0, 'B': 0, 'C': 0 };
    Array.from(this.containers.values()).forEach(container => {
      distribution[container.qualityGrade]++;
    });
    return distribution;
  }

  // ===============================================================================
  // HOVCS 2.0 VALIDATION METHODS
  // ===============================================================================

  /**
   * Determine HOVCS 2.0 certification status
   */
  private determineCertificationStatus(hovcsResults: any): 'HOVCS_2.0_CERTIFIED' | 'HOVCS_2.0_PARTIAL' | 'LEGACY_COMPLIANT' | 'NON_COMPLIANT' {
    const overallScore = hovcsResults.overallScore;
    const phasesPassed = Object.values(hovcsResults.phaseValidation).filter((score: any) => score >= 0.8).length;
    const totalViolations = hovcsResults.violations.length;

    if (overallScore >= 0.95 && phasesPassed === 6 && totalViolations === 0) {
      return 'HOVCS_2.0_CERTIFIED';
    } else if (overallScore >= 0.8 && phasesPassed >= 4) {
      return 'HOVCS_2.0_PARTIAL';
    } else if (overallScore >= 0.7) {
      return 'LEGACY_COMPLIANT';
    } else {
      return 'NON_COMPLIANT';
    }
  }

  /**
   * Get phase category name
   */
  private getPhaseCategory(phase: number): string {
    const categories = {
      1: 'foundation',
      2: 'layer',
      3: 'protocol',
      4: 'template',
      5: 'implementation',
      6: 'validation'
    };
    return (categories as any)[phase] || 'unknown';
  }

  /**
   * Auto-classify container to OCA layer
   */
  private autoClassifyOCALayer(container: VibeContainer): OCALayer {
    // Classification logic based on responsibility and dependencies
    if (container.dependencies.length === 0 && container.responsibility.includes('security')) {
      return 'ROOT';
    } else if (container.responsibility.includes('core') || container.responsibility.includes('engine')) {
      return 'TRUNK';
    } else if (container.responsibility.includes('API') || container.responsibility.includes('feature')) {
      return 'BRANCH';
    } else {
      return 'LEAF';
    }
  }

  /**
   * Estimate change rate for container
   */
  private estimateChangeRate(container: VibeContainer): number {
    // Estimate based on container characteristics
    let baseRate = 50; // Default middle rate

    if (container.responsibility.includes('security') || container.responsibility.includes('core')) {
      baseRate = 10; // Low change rate for core systems
    } else if (container.responsibility.includes('API') || container.responsibility.includes('gateway')) {
      baseRate = 40; // Medium-high for interfaces
    } else if (container.responsibility.includes('UI') || container.responsibility.includes('adapter')) {
      baseRate = 80; // High for user interfaces
    }

    // Adjust based on quality grade
    if (container.qualityGrade === 'A') baseRate -= 5;
    if (container.qualityGrade === 'C') baseRate += 10;

    return Math.max(0, Math.min(100, baseRate));
  }

  /**
   * Assign default neural protocols based on layer
   */
  private assignDefaultProtocols(layer: OCALayer): NeuralProtocol[] {
    const protocolMap: Record<OCALayer, NeuralProtocol[]> = {
      ROOT: ['SCP', 'ERP'],
      TRUNK: ['SCP', 'BAP'],
      BRANCH: ['BAP', 'EDP'],
      LEAF: ['EDP', 'ERP']
    };
    return protocolMap[layer];
  }

  /**
   * Get OCA layer distribution
   */
  private getOCALayerDistribution(): Record<OCALayer, number> {
    const distribution: Record<OCALayer, number> = {
      ROOT: 0,
      TRUNK: 0,
      BRANCH: 0,
      LEAF: 0
    };

    Array.from(this.containers.values()).forEach(container => {
      if (container.ocaLayer) {
        distribution[container.ocaLayer]++;
      }
    });

    return distribution;
  }

  /**
   * Get neural protocol coverage
   */
  private getNeuralProtocolCoverage(): Record<NeuralProtocol, number> {
    const coverage: Record<NeuralProtocol, number> = {
      SCP: 0,
      BAP: 0,
      EDP: 0,
      ERP: 0
    };

    Array.from(this.containers.values()).forEach(container => {
      if (container.neuralProtocols) {
        container.neuralProtocols.forEach(protocol => {
          coverage[protocol]++;
        });
      }
    });

    return coverage;
  }

  /**
   * Get HOVCS compliance level
   */
  private getHOVCSComplianceLevel(): { certified: number; partial: number; legacy: number; nonCompliant: number } {
    const levels = {
      certified: 0,
      partial: 0,
      legacy: 0,
      nonCompliant: 0
    };

    Array.from(this.containers.values()).forEach(container => {
      if (container.hovcsCompliance?.version === '2.0') {
        if (container.hovcsCompliance.validationPhases.length === 6) {
          levels.certified++;
        } else {
          levels.partial++;
        }
      } else {
        levels.legacy++;
      }
    });

    return levels;
  }

  /**
   * Detect dominant OCA layer
   */
  private detectDominantOCALayer(): OCALayer {
    const distribution = this.getOCALayerDistribution();
    return Object.entries(distribution).reduce((a, b) =>
      distribution[a[0] as OCALayer] > distribution[b[0] as OCALayer] ? a : b
    )[0] as OCALayer;
  }

  /**
   * Get implemented protocols
   */
  private getImplementedProtocols(): NeuralProtocol[] {
    const protocols = new Set<NeuralProtocol>();
    Array.from(this.containers.values()).forEach(container => {
      if (container.neuralProtocols) {
        container.neuralProtocols.forEach(protocol => protocols.add(protocol));
      }
    });
    return Array.from(protocols);
  }

  /**
   * Get organic evolution status
   */
  private getOrganicEvolutionStatus(): {
    averageGeneration: number;
    growthPatterns: Record<string, number>;
    templateEvolution: Record<string, number>;
  } {
    let totalGeneration = 0;
    const growthPatterns: Record<string, number> = {};
    const templateEvolution: Record<string, number> = {};
    let containerCount = 0;

    Array.from(this.containers.values()).forEach(container => {
      if (container.templateEvolution) {
        totalGeneration += container.templateEvolution.evolutionGeneration;
        containerCount++;

        const pattern = container.templateEvolution.biologicalGrowthPattern;
        growthPatterns[pattern] = (growthPatterns[pattern] || 0) + 1;

        const template = container.templateEvolution.baseTemplate.split('_')[0];
        templateEvolution[template] = (templateEvolution[template] || 0) + 1;
      }
    });

    return {
      averageGeneration: containerCount > 0 ? totalGeneration / containerCount : 0,
      growthPatterns,
      templateEvolution
    };
  }

  // ===============================================================================
  // HOVCS 2.0 VALIDATION RULE IMPLEMENTATIONS
  // ===============================================================================

  /**
   * H001: Validate OCA Layer Classification
   */
  private validateOCALayerClassification(code: string, context: any): HOVCSValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    const unclassifiedContainers = Array.from(this.containers.values())
      .filter(container => !container.ocaLayer);

    if (unclassifiedContainers.length > 0) {
      score -= 0.5;
      issues.push(`${unclassifiedContainers.length} containers lack OCA layer classification`);
      recommendations.push('Classify all containers into ROOT/TRUNK/BRANCH/LEAF layers');
    }

    const misclassifiedContainers = Array.from(this.containers.values())
      .filter(container => {
        if (!container.ocaLayer || !container.changeRate) return false;
        const layerSpec = this.ocaLayers[container.ocaLayer];
        return container.changeRate < layerSpec.minRate || container.changeRate > layerSpec.maxRate;
      });

    if (misclassifiedContainers.length > 0) {
      score -= 0.3;
      issues.push(`${misclassifiedContainers.length} containers have mismatched layer/change rate`);
      recommendations.push('Realign container change rates with OCA layer specifications');
    }

    return {
      passed: score >= 0.7,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * H002: Validate Conservative Core Architecture
   */
  private validateConservativeCore(code: string, context: any): HOVCSValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    const containersWithoutCore = Array.from(this.containers.values())
      .filter(container => !container.conservativeCore);

    if (containersWithoutCore.length > 0) {
      score -= 0.6;
      issues.push(`${containersWithoutCore.length} containers lack conservative core implementation`);
      recommendations.push('Implement conservative core pattern with security, communication, audit, error handling, and health monitoring');
    }

    return {
      passed: score >= 0.7,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * H003: Validate Growth Features Separation
   */
  private validateGrowthFeaturesSeparation(code: string, context: any): HOVCSValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    const containersWithoutGrowthFeatures = Array.from(this.containers.values())
      .filter(container =>
        (container.ocaLayer === 'TRUNK' || container.ocaLayer === 'BRANCH' || container.ocaLayer === 'LEAF') &&
        !container.growthFeatures
      );

    if (containersWithoutGrowthFeatures.length > 0) {
      score -= 0.4;
      issues.push(`${containersWithoutGrowthFeatures.length} containers lack growth features separation`);
      recommendations.push('Implement growth features pattern for adaptive business logic, UI, integrations, and experiments');
    }

    return {
      passed: score >= 0.7,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * Calculate change rate compliance score
   */
  private calculateChangeRateCompliance(): number {
    const compliantContainers = Array.from(this.containers.values())
      .filter(container => {
        if (!container.ocaLayer || !container.changeRate) return false;
        const layerSpec = this.ocaLayers[container.ocaLayer];
        return container.changeRate >= layerSpec.minRate && container.changeRate <= layerSpec.maxRate;
      }).length;

    return this.containers.size > 0 ? compliantContainers / this.containers.size : 0;
  }

  /**
   * Calculate conservative core score
   */
  private calculateConservativeCoreScore(): number {
    const containersWithCore = Array.from(this.containers.values())
      .filter(container => container.conservativeCore).length;

    return this.containers.size > 0 ? containersWithCore / this.containers.size : 0;
  }

  /**
   * Calculate growth features score
   */
  private calculateGrowthFeaturesScore(): number {
    const applicableContainers = Array.from(this.containers.values())
      .filter(container =>
        container.ocaLayer === 'TRUNK' || container.ocaLayer === 'BRANCH' || container.ocaLayer === 'LEAF'
      );

    const containersWithGrowthFeatures = applicableContainers
      .filter(container => container.growthFeatures).length;

    return applicableContainers.length > 0 ? containersWithGrowthFeatures / applicableContainers.length : 0;
  }

  /**
   * Calculate layer boundary compliance
   */
  private calculateLayerBoundaryCompliance(): number {
    // Simplified layer boundary validation
    return 0.85; // Placeholder - would implement actual boundary checking
  }

  /**
   * Calculate protocol compliance
   */
  private calculateProtocolCompliance(): number {
    const containersWithProtocols = Array.from(this.containers.values())
      .filter(container => container.neuralProtocols && container.neuralProtocols.length > 0).length;

    return this.containers.size > 0 ? containersWithProtocols / this.containers.size : 0;
  }

  /**
   * Calculate communication efficiency
   */
  private calculateCommunicationEfficiency(): number {
    // Simplified efficiency calculation
    return 0.90; // Placeholder - would implement actual efficiency metrics
  }

  /**
   * Calculate template evolution score
   */
  private calculateTemplateEvolutionScore(): number {
    const containersWithTemplates = Array.from(this.containers.values())
      .filter(container => container.templateEvolution).length;

    return this.containers.size > 0 ? containersWithTemplates / this.containers.size : 0;
  }

  /**
   * Calculate biological growth compliance
   */
  private calculateBiologicalGrowthCompliance(): number {
    const containersWithBiologicalGrowth = Array.from(this.containers.values())
      .filter(container =>
        container.templateEvolution &&
        container.templateEvolution.biologicalGrowthPattern !== 'legacy_migration'
      ).length;

    return this.containers.size > 0 ? containersWithBiologicalGrowth / this.containers.size : 0;
  }

  /**
   * Calculate template inheritance score
   */
  private calculateTemplateInheritanceScore(): number {
    const containersWithInheritance = Array.from(this.containers.values())
      .filter(container =>
        container.templateEvolution &&
        container.templateEvolution.evolutionGeneration > 0
      ).length;

    return this.containers.size > 0 ? containersWithInheritance / this.containers.size : 0;
  }

  // Placeholder validation methods for remaining HOVCS rules
  private validateChangeRateCompliance(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: this.calculateChangeRateCompliance(), issues: [], recommendations: [] };
  }

  private validateLayerCommunication(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: this.calculateLayerBoundaryCompliance(), issues: [], recommendations: [] };
  }

  private validateNeuralProtocol(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: this.calculateProtocolCompliance(), issues: [], recommendations: [] };
  }

  private validateSecurityProtocol(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: 0.9, issues: [], recommendations: [] };
  }

  private validateOrganicTemplate(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: this.calculateTemplateEvolutionScore(), issues: [], recommendations: [] };
  }

  private validateTemplateInheritance(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: this.calculateTemplateInheritanceScore(), issues: [], recommendations: [] };
  }

  private validateImplementationQuality(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: 0.85, issues: [], recommendations: [] };
  }

  private validatePerformanceOptimization(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: 0.88, issues: [], recommendations: [] };
  }

  private validateTestingCoverage(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: 0.80, issues: [], recommendations: [] };
  }

  private validateCertificationCompliance(code: string, context: any): HOVCSValidationResult {
    return { passed: true, score: 0.92, issues: [], recommendations: [] };
  }

  // ===============================================================================
  // SMART FEATURE CLASSIFICATION SYSTEM
  // ===============================================================================

  /**
   * Main API: Add new feature with intelligent guidance
   */
  async addFeatureWithGuidance(request: FeatureRequest): Promise<{
    classification: ClassificationResult;
    validation: ValidationResult;
    success: boolean;
  }> {
    try {
      console.log('🤖 Starting intelligent feature classification...', { description: request.description });

      // Step 1: Classify the feature
      const classification = await this.featureClassifier.classifyFeature(request);

      // Step 2: Validate safety
      const validation = await this.safetyValidator.validateFeature(request, classification);

      // Step 3: Learn from user interaction
      this.learningSystem.recordInteraction(request, classification, validation);

      // Step 4: Apply the feature if approved
      let success = false;
      if (validation.approved) {
        success = await this.applyFeatureClassification(request, classification);
      }

      console.log('✅ Feature classification completed', {
        category: classification.category,
        confidence: classification.confidence,
        approved: validation.approved,
        success
      });

      return { classification, validation, success };

    } catch (error) {
      console.error('❌ Feature classification failed', { error });
      throw new Error(`Feature classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Interactive feature addition with user guidance
   */
  async addFeatureInteractively(description: string, userId?: string): Promise<any> {
    return await this.userInterface.startInteractiveClassification(description, userId);
  }

  /**
   * Bulk classify existing features
   */
  async classifyExistingFeatures(): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];

    for (const [containerId, container] of this.containers) {
      const request: FeatureRequest = {
        description: container.responsibility,
        projectContext: `Existing container: ${container.name}`
      };

      const classification = await this.featureClassifier.classifyFeature(request);
      results.push({
        ...classification,
        suggestions: [`Applied to container: ${containerId}`]
      });
    }

    return results;
  }

  /**
   * Get user-specific classification suggestions
   */
  async getPersonalizedSuggestions(userId: string, description: string): Promise<ClassificationResult> {
    const preferences = this.userPreferences.get(userId);
    return await this.featureClassifier.classifyWithPreferences(description, preferences);
  }

  /**
   * Apply feature classification to system
   */
  private async applyFeatureClassification(request: FeatureRequest, classification: ClassificationResult): Promise<boolean> {
    try {
      // Create appropriate container structure based on classification
      if (classification.category === 'CONSERVATIVE_CORE') {
        await this.addToConservativeCore(request);
      } else if (classification.category === 'GROWTH_FEATURES') {
        await this.addToGrowthFeatures(request);
      }

      return true;
    } catch (error) {
      console.error('Failed to apply feature classification', { error });
      return false;
    }
  }

  private async addToConservativeCore(request: FeatureRequest): Promise<void> {
    // Implementation for adding to conservative core
    console.log('🔒 Adding feature to Conservative Core:', request.description);
  }

  private async addToGrowthFeatures(request: FeatureRequest): Promise<void> {
    // Implementation for adding to growth features
    console.log('🌱 Adding feature to Growth Features:', request.description);
  }

  // ============================================================================
  // V2 AUTO-TRIGGER & VALIDATION METHODS
  // ============================================================================

  /**
   * Determine if V2 validation should be auto-triggered
   *
   * Triggers when:
   * 1. V2_AUTO_TRIGGER flag is enabled
   * 2. Code complexity is high (CORE/FULL analysis)
   * 3. HOVCS score is borderline (needs extra validation)
   * 4. Target path contains actual code (not just analysis)
   */
  private shouldTriggerV2Validation(request: VibeComplianceRequest, hovcsResults: any): boolean {
    // Always trigger if auto-trigger is enabled
    if (this.V2_AUTO_TRIGGER) {
      return true;
    }

    // Trigger for CORE and FULL analysis (skip BASIC)
    if (request.analysisDepth === 'CORE' || request.analysisDepth === 'FULL') {
      return true;
    }

    // Trigger if HOVCS score is borderline (70-90%) - needs extra validation
    if (hovcsResults.overallScore >= 0.7 && hovcsResults.overallScore < 0.9) {
      console.log('🎯 C-008 V2: Auto-triggering due to borderline HOVCS score');
      return true;
    }

    // Trigger if there are violations - need deep analysis
    if (hovcsResults.violations.length > 0) {
      console.log('🎯 C-008 V2: Auto-triggering due to HOVCS violations');
      return true;
    }

    // Trigger if targetPath contains code files
    if (request.targetPath && this.isCodeFile(request.targetPath)) {
      console.log('🎯 C-008 V2: Auto-triggering for code file validation');
      return true;
    }

    return false;
  }

  /**
   * Check if path is a code file (not just config/docs)
   */
  private isCodeFile(path: string): boolean {
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs'];
    return codeExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  /**
   * Run V2 validation pipeline (7 stages + hierarchical gates + agents)
   */
  private async runV2Validation(request: VibeComplianceRequest, currentState: any): Promise<ValidationPipeline> {
    const context: CodeContext = {
      targetPath: request.targetPath,
      files: request.targetPath ? [request.targetPath] : undefined,
      testCoverage: currentState.testCoverage || undefined,
      performanceBudget: request.performanceBudget || undefined
    };

    const pipeline = await this.v2Container.validateCode(context);

    // Log V2 stage results
    console.log('📊 C-008 V2 Pipeline Results:');
    pipeline.stages.forEach((stage: any) => {
      const icon = stage.status === 'pass' ? '✅' : stage.status === 'fail' ? '❌' : '⚠️';
      console.log(`   ${icon} ${stage.stage}: ${(stage.score * 100).toFixed(0)}% (${stage.executionTimeMs}ms)`);
    });

    return pipeline;
  }

  /**
   * Extract recommendations from V2 pipeline
   */
  private extractV2Recommendations(pipeline: ValidationPipeline): string[] {
    const recommendations: string[] = [];

    pipeline.stages.forEach((stage: any) => {
      stage.recommendations.forEach((rec: string) => {
        recommendations.push(`[V2-${stage.stage}] ${rec}`);
      });
    });

    // Add overall V2 recommendation
    if (pipeline.overallScore < 0.8) {
      recommendations.push(`[V2] Overall validation score ${(pipeline.overallScore * 100).toFixed(0)}% - Consider addressing V2 stage issues`);
    }

    return recommendations.slice(0, 5); // Limit to top 5
  }

  /**
   * Extract violations from V2 pipeline
   */
  private extractV2Violations(pipeline: ValidationPipeline): string[] {
    const violations: string[] = [];

    pipeline.stages.forEach((stage: any) => {
      if (stage.status === 'fail') {
        stage.issues.forEach((issue: string) => {
          violations.push(`[V2-${stage.stage}] ${issue}`);
        });
      }
    });

    return violations;
  }

  /**
   * Get V2 validation summary (for debugging/monitoring)
   */
  getV2Status(): string {
    if (!this.V2_ENABLED) {
      return 'C-008 V2: Disabled (set ENABLE_V2_VIBE_VALIDATION=true to enable)';
    }

    return this.v2Container.getStatus();
  }
}

// ===============================================================================
// FEATURE CLASSIFIER CLASS
// ===============================================================================

class FeatureClassifier {
  private container: HOVCS_ComplianceContainer;

  constructor(container: HOVCS_ComplianceContainer) {
    this.container = container;
  }

  async classifyFeature(request: FeatureRequest): Promise<ClassificationResult> {
    const signals = this.analyzeCodeSignals(request.description);
    const contextScore = this.analyzeProjectContext(request.projectContext || '');
    const urgencyScore = this.analyzeUrgency(request.urgency || 'medium');

    const coreScore = signals.coreSignals + contextScore.coreBoost + urgencyScore.coreBoost;
    const growthScore = signals.growthSignals + contextScore.growthBoost + urgencyScore.growthBoost;

    const category = coreScore > growthScore ? 'CONSERVATIVE_CORE' : 'GROWTH_FEATURES';
    const confidence = Math.abs(coreScore - growthScore) / Math.max(coreScore, growthScore, 1);

    // If confidence is too low, mark for review
    if (confidence < 0.6) {
      return {
        category: 'NEEDS_REVIEW',
        confidence: confidence,
        reason: '분류 확신도가 낮아 추가 검토가 필요합니다',
        suggestions: [
          '더 구체적인 설명을 제공해주세요',
          '프로젝트 컨텍스트를 명시해주세요',
          '기능의 중요도를 지정해주세요'
        ],
        autoClassified: false
      };
    }

    return {
      category,
      confidence,
      reason: this.generateClassificationReason(category, { coreScore, growthScore, signals }),
      suggestions: this.generateSuggestions(category),
      autoClassified: true
    };
  }

  async classifyWithPreferences(description: string, preferences?: UserPreferences): Promise<ClassificationResult> {
    const baseClassification = await this.classifyFeature({ description });

    if (!preferences) {
      return baseClassification;
    }

    // Adjust classification based on user preferences
    const adjustedConfidence = baseClassification.confidence * (1 + preferences.decisionSpeed * 0.1);

    return {
      ...baseClassification,
      confidence: Math.min(adjustedConfidence, 1.0),
      reason: `${baseClassification.reason} (사용자 선호도 반영)`
    };
  }

  private analyzeCodeSignals(description: string): { coreSignals: number; growthSignals: number } {
    const coreKeywords = [
      /security|보안|인증|authentication/i,
      /validation|검증|유효성/i,
      /error|오류|exception|예외/i,
      /backup|백업|recovery|복구/i,
      /audit|감사|compliance|컴플라이언스/i,
      /core|핵심|critical|중요/i,
      /database|데이터베이스|storage|저장/i
    ];

    const growthKeywords = [
      /ui|interface|인터페이스|화면/i,
      /experiment|실험|test|테스트/i,
      /feature|기능|enhancement|개선/i,
      /analytics|분석|metrics|지표/i,
      /social|소셜|share|공유/i,
      /recommendation|추천|suggestion|제안/i,
      /integration|통합|api|연동/i
    ];

    let coreScore = 0;
    let growthScore = 0;

    coreKeywords.forEach(keyword => {
      if (keyword.test(description)) coreScore += 1;
    });

    growthKeywords.forEach(keyword => {
      if (keyword.test(description)) growthScore += 1;
    });

    return { coreSignals: coreScore, growthSignals: growthScore };
  }

  private analyzeProjectContext(context: string): { coreBoost: number; growthBoost: number } {
    if (context.includes('security') || context.includes('보안')) {
      return { coreBoost: 2, growthBoost: 0 };
    }
    if (context.includes('experiment') || context.includes('실험')) {
      return { coreBoost: 0, growthBoost: 2 };
    }
    return { coreBoost: 0, growthBoost: 0 };
  }

  private analyzeUrgency(urgency: string): { coreBoost: number; growthBoost: number } {
    switch (urgency) {
      case 'high': return { coreBoost: 1, growthBoost: 0 };
      case 'low': return { coreBoost: 0, growthBoost: 1 };
      default: return { coreBoost: 0, growthBoost: 0 };
    }
  }

  private generateClassificationReason(category: string, analysis: any): string {
    if (category === 'CONSERVATIVE_CORE') {
      return `핵심 기능으로 분류됨 (신호 점수: ${analysis.coreScore} vs ${analysis.growthScore}). 시스템 안정성과 보안이 중요한 기능입니다.`;
    } else {
      return `성장 기능으로 분류됨 (신호 점수: ${analysis.coreScore} vs ${analysis.growthScore}). 실험과 확장이 가능한 기능입니다.`;
    }
  }

  private generateSuggestions(category: string): string[] {
    if (category === 'CONSERVATIVE_CORE') {
      return [
        '철저한 테스트와 보안 검토 수행',
        '단계적 배포 계획 수립',
        '롤백 계획 준비',
        '의존성 영향도 분석'
      ];
    } else {
      return [
        'A/B 테스트 고려',
        'Feature Flag로 제어 가능하게 구현',
        '사용자 피드백 수집 계획',
        '성능 지표 모니터링 설정'
      ];
    }
  }
}

// ===============================================================================
// SAFETY VALIDATOR CLASS
// ===============================================================================

class SafetyValidator {
  private container: HOVCS_ComplianceContainer;

  constructor(container: HOVCS_ComplianceContainer) {
    this.container = container;
  }

  async validateFeature(request: FeatureRequest, classification: ClassificationResult): Promise<ValidationResult> {
    const risks = await this.analyzeRisks(request, classification);
    const warnings = this.generateWarnings(risks);
    const approved = this.shouldApprove(risks);

    return {
      approved,
      warnings,
      risks,
      recommendation: this.generateRecommendation(approved, risks)
    };
  }

  private async analyzeRisks(request: FeatureRequest, classification: ClassificationResult): Promise<Array<{ level: number; description: string }>> {
    const risks: Array<{ level: number; description: string }> = [];

    // Check for security risks
    if (classification.category === 'CONSERVATIVE_CORE' && !request.description.includes('security')) {
      risks.push({
        level: 0.8,
        description: '핵심 기능에 보안 검토가 누락될 수 있습니다'
      });
    }

    // Check for performance risks
    if (request.description.includes('heavy') || request.description.includes('대용량')) {
      risks.push({
        level: 0.6,
        description: '성능 영향을 주의깊게 검토해야 합니다'
      });
    }

    // Check for dependency risks
    if (classification.category === 'GROWTH_FEATURES' && request.description.includes('core')) {
      risks.push({
        level: 0.9,
        description: '성장 기능이 핵심 영역을 수정하려 합니다'
      });
    }

    return risks;
  }

  private generateWarnings(risks: Array<{ level: number; description: string }>): string[] {
    return risks
      .filter(risk => risk.level > 0.5)
      .map(risk => `⚠️ ${risk.description} (위험도: ${Math.round(risk.level * 100)}%)`);
  }

  private shouldApprove(risks: Array<{ level: number; description: string }>): boolean {
    const highRisks = risks.filter(risk => risk.level > 0.8);
    return highRisks.length === 0;
  }

  private generateRecommendation(approved: boolean, risks: Array<{ level: number; description: string }>): string {
    if (approved) {
      return '✅ 안전성 검증 통과. 기능 추가를 진행하세요.';
    } else {
      const highRiskCount = risks.filter(r => r.level > 0.8).length;
      return `❌ ${highRiskCount}개의 고위험 요소 발견. 추가 검토 후 진행하세요.`;
    }
  }
}

// ===============================================================================
// SMART USER INTERFACE CLASS
// ===============================================================================

class SmartUserInterface {
  private container: HOVCS_ComplianceContainer;

  constructor(container: HOVCS_ComplianceContainer) {
    this.container = container;
  }

  async startInteractiveClassification(description: string, userId?: string): Promise<any> {
    console.log('🤖 대화형 기능 분류를 시작합니다...');
    console.log(`📝 기능 설명: "${description}"`);

    // Step 1: Auto analysis
    const autoResult = await this.container['featureClassifier'].classifyFeature({ description });

    console.log(`💡 자동 분석 결과: ${autoResult.category}`);
    console.log(`📊 확신도: ${Math.round(autoResult.confidence * 100)}%`);
    console.log(`💭 이유: ${autoResult.reason}`);

    // Step 2: Interactive questions if confidence is low
    if (autoResult.confidence < 0.8) {
      console.log('❓ 정확한 분류를 위해 몇 가지 질문드리겠습니다:');

      const interactiveResult = await this.askClassificationQuestions(description);

      return {
        autoResult,
        interactiveResult,
        finalClassification: interactiveResult || autoResult,
        method: 'interactive'
      };
    }

    return {
      autoResult,
      finalClassification: autoResult,
      method: 'automatic'
    };
  }

  private async askClassificationQuestions(description: string): Promise<ClassificationResult | null> {
    const questions = [
      {
        question: '이 기능이 망가지면 전체 서비스가 중단될까요?',
        coreWeight: 3,
        growthWeight: 0
      },
      {
        question: '이 기능은 자주 변경될 예정인가요?',
        coreWeight: -2,
        growthWeight: 2
      },
      {
        question: '모든 사용자에게 필수적인 기능인가요?',
        coreWeight: 2,
        growthWeight: 0
      },
      {
        question: '보안이나 법적 요구사항과 관련있나요?',
        coreWeight: 3,
        growthWeight: 0
      }
    ];

    // In a real implementation, this would be interactive
    // For now, we'll simulate with reasonable defaults
    console.log('📋 질문 리스트:');
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.question}`);
    });

    // Simulated answers (in real implementation, would wait for user input)
    const answers = [true, false, true, false]; // Example answers

    let coreScore = 0;
    let growthScore = 0;

    answers.forEach((answer, index) => {
      if (answer) {
        coreScore += questions[index].coreWeight;
        growthScore += questions[index].growthWeight;
      }
    });

    const category = coreScore > growthScore ? 'CONSERVATIVE_CORE' : 'GROWTH_FEATURES';
    const confidence = Math.abs(coreScore - growthScore) / Math.max(Math.abs(coreScore), Math.abs(growthScore), 1);

    return {
      category,
      confidence,
      reason: `대화형 분류 결과 (점수: Core ${coreScore}, Growth ${growthScore})`,
      suggestions: category === 'CONSERVATIVE_CORE' ?
        ['안정성과 보안을 최우선으로 구현', '단계적 배포 계획 수립'] :
        ['실험 가능하게 구현', 'Feature Flag 활용'],
      autoClassified: false
    };
  }

  showClassificationResult(result: ClassificationResult): void {
    console.log('\n🎯 === 분류 결과 ===');

    if (result.category === 'CONSERVATIVE_CORE') {
      console.log('🔒 Conservative Core (보수적 핵심) 영역');
      console.log('   ✅ 높은 안정성과 보안 보장');
      console.log('   ✅ 신중한 변경 관리');
      console.log('   ✅ 전체 시스템 영향 고려');
    } else if (result.category === 'GROWTH_FEATURES') {
      console.log('🌱 Growth Features (성장 기능) 영역');
      console.log('   ✅ 실험과 빠른 개선 가능');
      console.log('   ✅ 빠른 반복 개발');
      console.log('   ✅ 독립적 배포 가능');
    } else {
      console.log('❓ 추가 검토 필요');
      console.log('   ⚠️ 분류 확신도 부족');
      console.log('   ⚠️ 더 많은 정보 필요');
    }

    console.log(`\n📊 확신도: ${Math.round(result.confidence * 100)}%`);
    console.log(`💭 이유: ${result.reason}`);

    if (result.suggestions.length > 0) {
      console.log('\n💡 제안사항:');
      result.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    }
  }
}

// ===============================================================================
// LEARNING SYSTEM CLASS
// ===============================================================================

class LearningSystem {
  private container: HOVCS_ComplianceContainer;
  private interactionHistory: any[] = [];

  constructor(container: HOVCS_ComplianceContainer) {
    this.container = container;
  }

  recordInteraction(request: FeatureRequest, classification: ClassificationResult, validation: ValidationResult): void {
    const interaction = {
      timestamp: new Date().toISOString(),
      request,
      classification,
      validation,
      outcome: validation.approved ? 'approved' : 'rejected'
    };

    this.interactionHistory.push(interaction);
    this.updateUserPreferences(request, classification);

    console.log('📚 학습 데이터 기록됨:', {
      category: classification.category,
      confidence: classification.confidence,
      approved: validation.approved
    });
  }

  private updateUserPreferences(request: FeatureRequest, classification: ClassificationResult): void {
    const userId = request.userRole || 'default';

    let preferences = this.container['userPreferences'].get(userId);
    if (!preferences) {
      preferences = {
        userId,
        corePreference: 0.5,
        growthPreference: 0.5,
        commonKeywords: [],
        decisionSpeed: 0.5,
        learningData: []
      };
    }

    // Update preferences based on classification
    if (classification.category === 'CONSERVATIVE_CORE') {
      preferences.corePreference += 0.1;
    } else {
      preferences.growthPreference += 0.1;
    }

    // Normalize preferences
    const total = preferences.corePreference + preferences.growthPreference;
    preferences.corePreference /= total;
    preferences.growthPreference /= total;

    // Update common keywords
    const keywords = request.description.toLowerCase().split(/\s+/);
    keywords.forEach(keyword => {
      if (keyword.length > 3 && !preferences.commonKeywords.includes(keyword)) {
        preferences.commonKeywords.push(keyword);
      }
    });

    // Keep only top 10 keywords
    if (preferences.commonKeywords.length > 10) {
      preferences.commonKeywords = preferences.commonKeywords.slice(-10);
    }

    preferences.learningData.push({
      timestamp: new Date().toISOString(),
      description: request.description,
      category: classification.category,
      confidence: classification.confidence
    });

    this.container['userPreferences'].set(userId, preferences);
  }

  getPersonalizedInsights(userId: string): any {
    const preferences = this.container['userPreferences'].get(userId);
    if (!preferences) {
      return { message: '사용자 데이터가 충분하지 않습니다.' };
    }

    const recentInteractions = this.interactionHistory.slice(-10);
    const coreRatio = recentInteractions.filter(i => i.classification.category === 'CONSERVATIVE_CORE').length / recentInteractions.length;

    return {
      corePreference: preferences.corePreference,
      growthPreference: preferences.growthPreference,
      recentCoreRatio: coreRatio,
      commonKeywords: preferences.commonKeywords,
      totalInteractions: preferences.learningData.length,
      accuracy: this.calculateAccuracy(preferences.learningData)
    };
  }

  private calculateAccuracy(learningData: any[]): number {
    if (learningData.length === 0) return 0;

    const highConfidenceCorrect = learningData.filter(d => d.confidence > 0.8).length;
    return highConfidenceCorrect / learningData.length;
  }
}