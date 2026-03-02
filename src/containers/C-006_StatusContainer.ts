// C-006_StatusContainer
/**
 * Status Monitoring Container
 *
 * Responsibility: System status monitoring with atomic responsibility
 * Features: Pure status monitoring, health checks, performance metrics
 */

export interface StatusRequest {
  includeDetails?: boolean;
  containerFilter?: string;
  timeframe?: 'current' | 'hourly' | 'daily';
  metricsType?: 'basic' | 'detailed' | 'comprehensive';
}

export interface StatusResponse {
  systemHealth: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  containerStatuses: Record<string, ContainerStatus>;
  performanceMetrics: PerformanceMetrics;
  qualityDistribution: QualityDistribution;
  systemInsights: string[];
  recommendedActions: string[];
  qualityGrade: 'A' | 'B+' | 'B' | 'C';
}

export interface ContainerStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  uptime: number;
  lastResponse: number;
  errorCount: number;
  qualityGrade: 'A' | 'B+' | 'B' | 'C';
  atomicResponsibility: string;
  circuitBreakerStatus: boolean;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
}

export interface QualityDistribution {
  A: number;
  'B+': number;
  B: number;
  C: number;
}

export class StatusContainer {
  private containerHealthData: Map<string, ContainerStatus> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  private systemStartTime: number = Date.now();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeContainerMonitoring();
    this.startContinuousMonitoring();
    console.log('C-006_StatusContainer: Status monitoring container initialized');
  }

  /**
   * Get comprehensive system status with atomic responsibility
   */
  async getSystemStatus(request: StatusRequest = {}): Promise<StatusResponse> {
    try {
      console.log('C-006_StatusContainer: Generating system status', {
        includeDetails: request.includeDetails,
        filter: request.containerFilter
      });

      // Collect current container statuses
      const containerStatuses = this.collectContainerStatuses(request.containerFilter);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics();

      // Determine overall system health
      const systemHealth = this.determineSystemHealth(containerStatuses, performanceMetrics);

      // Generate quality distribution
      const qualityDistribution = this.calculateQualityDistribution(containerStatuses);

      // Generate system insights
      const systemInsights = this.generateSystemInsights(containerStatuses, performanceMetrics);

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(systemHealth, containerStatuses);

      // Calculate overall quality grade
      const qualityGrade = this.calculateOverallQualityGrade(systemHealth, qualityDistribution);

      const response: StatusResponse = {
        systemHealth,
        timestamp: new Date().toISOString(),
        containerStatuses,
        performanceMetrics,
        qualityDistribution,
        systemInsights,
        recommendedActions,
        qualityGrade
      };

      // Store metrics in history
      this.storePerformanceHistory(performanceMetrics);

      console.log('C-006_StatusContainer: Status report generated', {
        health: systemHealth,
        containers: Object.keys(containerStatuses).length,
        grade: qualityGrade
      });

      return response;

    } catch (error) {
      console.error('C-006_StatusContainer: Status monitoring failed', { error });

      return {
        systemHealth: 'critical',
        timestamp: new Date().toISOString(),
        containerStatuses: {},
        performanceMetrics: this.getEmptyPerformanceMetrics(),
        qualityDistribution: { A: 0, 'B+': 0, B: 0, C: 1 },
        systemInsights: ['Status monitoring system failure detected'],
        recommendedActions: ['Restart status monitoring system', 'Check system logs'],
        qualityGrade: 'C'
      };
    }
  }

  /**
   * Update container health status
   */
  updateContainerHealth(containerId: string, status: Partial<ContainerStatus>): void {
    const currentStatus = this.containerHealthData.get(containerId) || this.createDefaultContainerStatus(containerId);

    const updatedStatus: ContainerStatus = {
      ...currentStatus,
      ...status,
      lastResponse: Date.now()
    };

    this.containerHealthData.set(containerId, updatedStatus);

    console.log(`C-006_StatusContainer: Updated ${containerId} status`, {
      status: updatedStatus.status,
      grade: updatedStatus.qualityGrade
    });
  }

  /**
   * Record container operation metrics
   */
  recordContainerOperation(containerId: string, success: boolean, responseTime: number): void {
    const status = this.containerHealthData.get(containerId);
    if (status) {
      if (!success) {
        status.errorCount++;
      }
      status.lastResponse = responseTime;

      // Update quality grade based on performance
      status.qualityGrade = this.calculateContainerQualityGrade(status, responseTime, success);

      this.containerHealthData.set(containerId, status);
    }
  }

  /**
   * Collect all container statuses
   */
  private collectContainerStatuses(filter?: string): Record<string, ContainerStatus> {
    const statuses: Record<string, ContainerStatus> = {};

    for (const [containerId, status] of this.containerHealthData) {
      if (!filter || containerId.includes(filter)) {
        statuses[containerId] = {
          ...status,
          uptime: Date.now() - this.systemStartTime
        };
      }
    }

    return statuses;
  }

  /**
   * Calculate current performance metrics
   */
  private calculatePerformanceMetrics(): PerformanceMetrics {
    const containers = Array.from(this.containerHealthData.values());

    if (containers.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const averageResponseTime = containers.reduce((sum, c) => sum + c.lastResponse, 0) / containers.length;
    const totalErrors = containers.reduce((sum, c) => sum + c.errorCount, 0);
    const errorRate = totalErrors / (containers.length * 100); // Assuming 100 operations per container
    const successRate = Math.max(0, 1 - errorRate);

    return {
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      memoryUsage: this.calculateMemoryUsage(),
      cpuUsage: this.calculateCpuUsage(),
      throughput: this.calculateThroughput(containers.length),
      errorRate: Math.round(errorRate * 10000) / 100 // Convert to percentage
    };
  }

  /**
   * Determine overall system health
   */
  private determineSystemHealth(
    containerStatuses: Record<string, ContainerStatus>,
    performanceMetrics: PerformanceMetrics
  ): 'healthy' | 'warning' | 'critical' {
    const containers = Object.values(containerStatuses);

    if (containers.length === 0) return 'critical';

    const healthyCount = containers.filter(c => c.status === 'healthy').length;
    const degradedCount = containers.filter(c => c.status === 'degraded').length;
    const offlineCount = containers.filter(c => c.status === 'offline').length;

    const healthyRatio = healthyCount / containers.length;

    // Critical conditions
    if (offlineCount > 0 || healthyRatio < 0.5 || performanceMetrics.errorRate > 10) {
      return 'critical';
    }

    // Warning conditions
    if (degradedCount > 0 || healthyRatio < 0.8 || performanceMetrics.errorRate > 5) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Calculate quality distribution across containers
   */
  private calculateQualityDistribution(containerStatuses: Record<string, ContainerStatus>): QualityDistribution {
    const distribution: QualityDistribution = { A: 0, 'B+': 0, B: 0, C: 0 };

    Object.values(containerStatuses).forEach(status => {
      distribution[status.qualityGrade]++;
    });

    return distribution;
  }

  /**
   * Generate system insights
   */
  private generateSystemInsights(
    containerStatuses: Record<string, ContainerStatus>,
    performanceMetrics: PerformanceMetrics
  ): string[] {
    const insights: string[] = [];
    const containers = Object.values(containerStatuses);

    // Performance insights
    if (performanceMetrics.averageResponseTime < 100) {
      insights.push('🚀 Excellent response times across all containers');
    } else if (performanceMetrics.averageResponseTime > 500) {
      insights.push('⚠️ Response times are elevated - consider optimization');
    }

    // Quality insights
    const aGradeCount = containers.filter(c => c.qualityGrade === 'A').length;
    if (aGradeCount === containers.length) {
      insights.push('⭐ All containers operating at Grade A quality');
    }

    // Error insights
    if (performanceMetrics.errorRate === 0) {
      insights.push('✅ Zero error rate maintained across all containers');
    } else if (performanceMetrics.errorRate > 5) {
      insights.push('🔥 High error rate detected - immediate attention required');
    }

    // Container-specific insights
    const degradedContainers = containers.filter(c => c.status === 'degraded');
    if (degradedContainers.length > 0) {
      insights.push(`⚡ ${degradedContainers.length} container(s) in degraded state`);
    }

    // System load insights
    if (performanceMetrics.memoryUsage > 80) {
      insights.push('💾 High memory usage detected - consider scaling');
    }

    if (insights.length === 0) {
      insights.push('📊 System operating within normal parameters');
    }

    return insights;
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(
    systemHealth: string,
    containerStatuses: Record<string, ContainerStatus>
  ): string[] {
    const actions: string[] = [];

    if (systemHealth === 'critical') {
      actions.push('🚨 Immediate investigation required');
      actions.push('🔄 Consider restarting affected containers');
      actions.push('📞 Alert system administrators');
    } else if (systemHealth === 'warning') {
      actions.push('👀 Monitor system closely');
      actions.push('🔍 Investigate degraded containers');
      actions.push('📈 Review performance trends');
    } else {
      actions.push('✅ Continue normal operations');
      actions.push('📊 Regular monitoring maintenance');
    }

    // Container-specific actions
    const offlineContainers = Object.entries(containerStatuses)
      .filter(([_, status]) => status.status === 'offline')
      .map(([id, _]) => id);

    if (offlineContainers.length > 0) {
      actions.push(`🔧 Restart offline containers: ${offlineContainers.join(', ')}`);
    }

    return actions;
  }

  /**
   * Calculate overall system quality grade
   */
  private calculateOverallQualityGrade(
    systemHealth: string,
    qualityDistribution: QualityDistribution
  ): 'A' | 'B+' | 'B' | 'C' {
    if (systemHealth === 'critical') return 'C';
    if (systemHealth === 'warning') return 'B';

    const total = qualityDistribution.A + qualityDistribution['B+'] + qualityDistribution.B + qualityDistribution.C;
    if (total === 0) return 'C';

    const aRatio = qualityDistribution.A / total;
    const bPlusRatio = qualityDistribution['B+'] / total;

    if (aRatio >= 0.8) return 'A';
    if (aRatio + bPlusRatio >= 0.7) return 'B+';
    if (qualityDistribution.C / total < 0.3) return 'B';
    return 'C';
  }

  /**
   * Calculate container quality grade
   */
  private calculateContainerQualityGrade(
    status: ContainerStatus,
    responseTime: number,
    success: boolean
  ): 'A' | 'B+' | 'B' | 'C' {
    if (!success || status.status === 'offline') return 'C';
    if (status.status === 'degraded') return 'B';

    if (responseTime < 100 && status.errorCount === 0) return 'A';
    if (responseTime < 200 && status.errorCount < 3) return 'B+';
    if (responseTime < 500 && status.errorCount < 10) return 'B';
    return 'C';
  }

  /**
   * Initialize container monitoring
   */
  private initializeContainerMonitoring(): void {
    const containerIds = ['C-001', 'C-002', 'C-003', 'C-004', 'C-005', 'C-007', 'C-008'];

    containerIds.forEach(id => {
      this.containerHealthData.set(id, this.createDefaultContainerStatus(id));
    });
  }

  /**
   * Create default container status
   */
  private createDefaultContainerStatus(containerId: string): ContainerStatus {
    const responsibilities: Record<string, string> = {
      'C-001': 'ARHA emotion processing only',
      'C-002': 'Analytics and metrics only',
      'C-003': 'Agent processing only',
      'C-004': 'Command execution only',
      'C-005': 'Multi-container orchestration only',
      'C-006': 'Status monitoring only',
      'C-007': 'API gateway routing only',
      'C-008': 'Vibe-coding compliance only'
    };

    return {
      name: containerId,
      status: 'healthy',
      uptime: 0,
      lastResponse: 100,
      errorCount: 0,
      qualityGrade: 'A',
      atomicResponsibility: responsibilities[containerId] || 'Specialized processing only',
      circuitBreakerStatus: false
    };
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform periodic health check
   */
  private performHealthCheck(): void {
    for (const [containerId, status] of this.containerHealthData) {
      const timeSinceLastResponse = Date.now() - status.lastResponse;

      // Mark as degraded if no response for 2 minutes
      if (timeSinceLastResponse > 120000 && status.status === 'healthy') {
        status.status = 'degraded';
        status.qualityGrade = 'B';
        console.warn(`C-006_StatusContainer: ${containerId} marked as degraded`);
      }

      // Mark as offline if no response for 5 minutes
      if (timeSinceLastResponse > 300000 && status.status !== 'offline') {
        status.status = 'offline';
        status.qualityGrade = 'C';
        console.error(`C-006_StatusContainer: ${containerId} marked as offline`);
      }
    }
  }

  /**
   * Helper methods for performance calculations
   */
  private calculateMemoryUsage(): number {
    // Simulate memory usage calculation
    return Math.round(30 + Math.random() * 40); // 30-70%
  }

  private calculateCpuUsage(): number {
    // Simulate CPU usage calculation
    return Math.round(10 + Math.random() * 30); // 10-40%
  }

  private calculateThroughput(containerCount: number): number {
    // Simulate throughput calculation (requests per minute)
    return Math.round(containerCount * 50 + Math.random() * 100);
  }

  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime: 0,
      successRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      throughput: 0,
      errorRate: 100
    };
  }

  private storePerformanceHistory(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);

    // Keep only last 100 metrics
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Get container status
   */
  getStatus(): any {
    return {
      containerName: 'C-006_StatusContainer',
      status: 'healthy',
      monitoredContainers: this.containerHealthData.size,
      performanceHistorySize: this.performanceHistory.length,
      uptime: Date.now() - this.systemStartTime,
      qualityGrade: 'A',
      atomicResponsibility: 'Pure system status monitoring only'
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('C-006_StatusContainer: Status monitoring stopped');
  }
}