/**
 * Capacity Planning & Cost Optimization
 * Phase 8 Task 4: Capacity Planning & Auto-Scaling
 */

export interface CapacityMetrics {
  timestamp: number;
  cpuUtilization: number;
  memoryUtilization: number;
  networkBandwidth: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
}

export interface AutoScalingPolicy {
  service: string;
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpThreshold: { cpu: number; duration: number }; // Seconds
  scaleDownThreshold: { cpu: number; duration: number };
}

export interface CostOptimization {
  serviceName: string;
  currentCostPerHour: number;
  projectedCostPerMonth: number;
  optimizationOpportunities: Array<{
    strategy: string;
    estimatedSavings: number;
    effortLevel: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

/**
 * Capacity Planner: Analyzes historical data and forecasts capacity needs
 */
export class CapacityPlanner {
  private metrics: CapacityMetrics[] = [];
  private readonly maxDataPoints = 10080; // 1 week of 1-minute data

  /**
   * Record capacity metrics
   */
  recordMetrics(metrics: CapacityMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxDataPoints) {
      this.metrics.shift();
    }
  }

  /**
   * Forecast capacity needs for next 6 months
   */
  forecast(daysAhead: number = 180): Array<{
    date: Date;
    forecastCPU: number;
    forecastMemory: number;
    recommendedInstances: number;
  }> {
    if (this.metrics.length < 100) {
      return [];
    }

    const forecast = [];
    const recentMetrics = this.metrics.slice(-1440); // Last 24 hours
    const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUtilization, 0) / recentMetrics.length;

    // Simple linear projection with seasonal adjustments
    for (let i = 1; i <= daysAhead; i++) {
      const growthRate = 0.002; // 0.2% daily growth
      const forecastedCPU = Math.min(avgCPU * (1 + growthRate * i), 90);
      const forecastedMemory = Math.min(avgMemory * (1 + growthRate * i), 85);

      // Determine recommended instances (3 min, 20 max)
      const instancesNeeded = Math.ceil((forecastedCPU / 70) * 3); // 3 base instances, target 70% CPU
      const recommendedInstances = Math.min(Math.max(instancesNeeded, 3), 20);

      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        forecastCPU: forecastedCPU,
        forecastMemory: forecastedMemory,
        recommendedInstances,
      });
    }

    return forecast;
  }

  /**
   * Get current utilization summary
   */
  getUtilizationSummary(): {
    currentCPU: number;
    currentMemory: number;
    peakCPU: number;
    peakMemory: number;
    averageCPU: number;
    averageMemory: number;
  } {
    if (this.metrics.length === 0) {
      return { currentCPU: 0, currentMemory: 0, peakCPU: 0, peakMemory: 0, averageCPU: 0, averageMemory: 0 };
    }

    const recent = this.metrics.slice(-60); // Last hour
    const currentCPU = recent[recent.length - 1].cpuUtilization;
    const currentMemory = recent[recent.length - 1].memoryUtilization;
    const peakCPU = Math.max(...recent.map((m) => m.cpuUtilization));
    const peakMemory = Math.max(...recent.map((m) => m.memoryUtilization));
    const averageCPU = recent.reduce((sum, m) => sum + m.cpuUtilization, 0) / recent.length;
    const averageMemory = recent.reduce((sum, m) => sum + m.memoryUtilization, 0) / recent.length;

    return { currentCPU, currentMemory, peakCPU, peakMemory, averageCPU, averageMemory };
  }

  /**
   * Generate cost optimization recommendations
   */
  generateOptimizations(currentSpend: number): CostOptimization {
    const summary = this.getUtilizationSummary();

    const opportunities = [];

    if (summary.averageCPU < 40) {
      opportunities.push({
        strategy: 'Right-size instances',
        estimatedSavings: currentSpend * 0.25,
        effortLevel: 'low' as const,
        description: 'Reduce instance type (currently over-provisioned)',
      });
    }

    if (summary.peakCPU - summary.averageCPU > 40) {
      opportunities.push({
        strategy: 'Implement auto-scaling',
        estimatedSavings: currentSpend * 0.15,
        effortLevel: 'medium' as const,
        description: 'Scale down during off-peak hours (40%+ variance detected)',
      });
    }

    opportunities.push({
      strategy: 'Reserved instances',
      estimatedSavings: currentSpend * 0.20,
      effortLevel: 'low' as const,
      description: 'Switch to 1-year or 3-year reserved instances',
    });

    opportunities.push({
      strategy: 'Spot instances for non-critical workloads',
      estimatedSavings: currentSpend * 0.30,
      effortLevel: 'high' as const,
      description: 'Use spot instances for batch jobs and non-critical services',
    });

    return {
      serviceName: 'BarberShop-Platform',
      currentCostPerHour: currentSpend / 730,
      projectedCostPerMonth: currentSpend,
      optimizationOpportunities: opportunities,
    };
  }
}

/**
 * Auto-Scaling Configuration Generator
 */
export class AutoScalingConfigurator {
  /**
   * Generate optimal auto-scaling policies
   */
  generatePolicies(services: string[]): AutoScalingPolicy[] {
    return services.map((service) => ({
      service,
      minInstances: 2,
      maxInstances: 20,
      targetCPU: 70,
      targetMemory: 75,
      scaleUpThreshold: { cpu: 80, duration: 120 }, // 2 minutes above 80%
      scaleDownThreshold: { cpu: 20, duration: 300 }, // 5 minutes below 20%
    }));
  }

  /**
   * Generate RDS auto-scaling policy
   */
  generateDatabasePolicy() {
    return {
      service: 'RDS-Booking-DB',
      minCapacity: 0.5,
      maxCapacity: 16,
      targetUtilization: 70,
      scaleUpDuration: 300, // 5 minutes
      scaleDownDuration: 900, // 15 minutes
    };
  }
}

export const capacityPlanner = new CapacityPlanner();
export const autoScalingConfigurator = new AutoScalingConfigurator();
