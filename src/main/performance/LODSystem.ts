/**
 * Level of Detail (LOD) System
 * Dynamic complexity scaling for ant simulation performance optimization
 * Implements 4-tier LOD system as specified in architecture v2
 */

export enum LODLevel {
  FULL_DETAIL = 'FULL_DETAIL',   // Individual ant simulation with all systems
  SIMPLIFIED = 'SIMPLIFIED',     // Reduced AI complexity, basic pathfinding  
  STATISTICAL = 'STATISTICAL',   // Group behaviors, flow fields
  AGGREGATE = 'AGGREGATE'        // Population statistics only
}

export interface LODConfiguration {
  maxAnts: number;
  features: string[];
  updateRate: number;        // Updates per second
  cpuCost: number;          // Relative computational cost (0-1)
  memoryFootprint: number;  // KB per ant
  qualityLevel: number;     // Visual/behavioral quality (0-1)
}

export interface LODFactors {
  distanceToCamera: number;     // 0-1, closer = higher priority
  recentActivity: number;       // 0-1, more active = higher priority  
  userFocus: number;           // 0-1, user interest level
  systemLoad: number;         // 0-1, current performance load
  antImportance: number;       // 0-10, role-based importance (queen=10)
  groupDensity: number;        // 0-1, density of nearby ants
}

export interface LODAssignment {
  antId: string;
  level: LODLevel;
  lastUpdate: number;
  nextUpdate: number;
  score: number;              // LOD calculation score
  factors: LODFactors;
}

/**
 * Core LOD system managing dynamic complexity scaling
 */
export class LODSystem {
  private assignments: Map<string, LODAssignment> = new Map();
  private configurations: Map<LODLevel, LODConfiguration>;
  private performanceTargets: { targetFPS: number; maxLoadFactor: number };
  private lastUpdate: number = 0;
  private frameTimeHistory: number[] = [];
  private readonly HISTORY_SIZE = 60; // Track last 60 frames

  constructor() {
    this.configurations = this.initializeLODConfigurations();
    this.performanceTargets = { targetFPS: 30, maxLoadFactor: 0.8 };
  }

  /**
   * Initialize LOD tier configurations based on architecture v2 specifications
   */
  private initializeLODConfigurations(): Map<LODLevel, LODConfiguration> {
    return new Map([
      [LODLevel.FULL_DETAIL, {
        maxAnts: 100,
        features: [
          'full_ai', 'learning', 'memory', 'pathfinding',
          'genetics', 'physiology', 'spatial_memory',
          'individual_behaviors', 'complex_interactions'
        ],
        updateRate: 60,
        cpuCost: 1.0,
        memoryFootprint: 512,    // 512KB per ant
        qualityLevel: 1.0
      }],
      [LODLevel.SIMPLIFIED, {
        maxAnts: 1000, 
        features: [
          'basic_ai', 'simple_pathfinding', 'basic_genetics',
          'reduced_memory', 'simple_behaviors'
        ],
        updateRate: 30,
        cpuCost: 0.3,
        memoryFootprint: 128,    // 128KB per ant
        qualityLevel: 0.7
      }],
      [LODLevel.STATISTICAL, {
        maxAnts: 5000,
        features: [
          'group_behavior', 'flow_fields', 'population_genetics',
          'statistical_ai', 'collective_pathfinding'
        ],
        updateRate: 10,
        cpuCost: 0.1,
        memoryFootprint: 32,     // 32KB per ant
        qualityLevel: 0.4
      }],
      [LODLevel.AGGREGATE, {
        maxAnts: 50000,
        features: [
          'population_statistics', 'macro_behaviors',
          'density_maps', 'aggregate_flows'
        ],
        updateRate: 1,
        cpuCost: 0.01,
        memoryFootprint: 8,      // 8KB per ant
        qualityLevel: 0.2
      }]
    ]);
  }

  /**
   * Calculate appropriate LOD level for an ant based on multiple factors
   */
  public calculateLOD(antId: string, factors: LODFactors): LODLevel {
    // Calculate weighted score based on multiple factors
    const weights = {
      distance: 0.3,
      activity: 0.2,
      focus: 0.25,
      importance: 0.15,
      systemLoad: 0.1
    };

    const score = (
      factors.distanceToCamera * weights.distance +
      factors.recentActivity * weights.activity +
      factors.userFocus * weights.focus +
      (factors.antImportance / 10) * weights.importance +
      (1 - factors.systemLoad) * weights.systemLoad
    );

    // Add hysteresis to prevent LOD thrashing
    const currentAssignment = this.assignments.get(antId);
    const hysteresis = currentAssignment ? this.getHysteresis(currentAssignment.level) : 0;
    const adjustedScore = score + hysteresis;

    // Determine LOD level based on score thresholds
    if (adjustedScore >= 0.8) return LODLevel.FULL_DETAIL;
    if (adjustedScore >= 0.6) return LODLevel.SIMPLIFIED;
    if (adjustedScore >= 0.3) return LODLevel.STATISTICAL;
    return LODLevel.AGGREGATE;
  }

  /**
   * Add hysteresis to prevent rapid LOD level changes
   */
  private getHysteresis(currentLevel: LODLevel): number {
    const hysteresisMap = new Map([
      [LODLevel.FULL_DETAIL, 0.05],    // Slightly favor staying in full detail
      [LODLevel.SIMPLIFIED, 0.02],
      [LODLevel.STATISTICAL, 0.02],
      [LODLevel.AGGREGATE, -0.02]      // Slightly discourage staying in aggregate
    ]);
    
    return hysteresisMap.get(currentLevel) || 0;
  }

  /**
   * Update LOD assignments for all ants
   */
  public updateLODAssignments(
    antIds: string[], 
    factorsProvider: (antId: string) => LODFactors,
    deltaTime: number
  ): Map<LODLevel, string[]> {
    this.updatePerformanceMetrics(deltaTime);
    
    const assignments = new Map<LODLevel, string[]>();
    const currentLoad = this.getCurrentSystemLoad();
    
    // Initialize assignment buckets
    Object.values(LODLevel).forEach(level => {
      assignments.set(level as LODLevel, []);
    });

    // Process each ant
    for (const antId of antIds) {
      const factors = factorsProvider(antId);
      factors.systemLoad = currentLoad;
      
      const targetLOD = this.calculateLOD(antId, factors);
      const enforcedLOD = this.enforceLODLimits(targetLOD, assignments);
      
      this.updateAssignment(antId, enforcedLOD, factors);
      assignments.get(enforcedLOD)!.push(antId);
    }

    return assignments;
  }

  /**
   * Enforce maximum ant counts per LOD level
   */
  private enforceLODLimits(
    targetLOD: LODLevel, 
    currentAssignments: Map<LODLevel, string[]>
  ): LODLevel {
    const config = this.configurations.get(targetLOD)!;
    const currentCount = currentAssignments.get(targetLOD)!.length;
    
    if (currentCount >= config.maxAnts) {
      // Degrade to next lower LOD level
      const downgradePath = [
        LODLevel.FULL_DETAIL,
        LODLevel.SIMPLIFIED, 
        LODLevel.STATISTICAL,
        LODLevel.AGGREGATE
      ];
      
      const currentIndex = downgradePath.indexOf(targetLOD);
      if (currentIndex < downgradePath.length - 1) {
        return this.enforceLODLimits(downgradePath[currentIndex + 1], currentAssignments);
      }
    }
    
    return targetLOD;
  }

  /**
   * Update assignment record for an ant
   */
  private updateAssignment(antId: string, level: LODLevel, factors: LODFactors): void {
    const config = this.configurations.get(level)!;
    const now = Date.now();
    
    this.assignments.set(antId, {
      antId,
      level,
      lastUpdate: now,
      nextUpdate: now + (1000 / config.updateRate),
      score: this.calculateScore(factors),
      factors
    });
  }

  /**
   * Calculate composite score from factors
   */
  private calculateScore(factors: LODFactors): number {
    return (
      factors.distanceToCamera * 0.3 +
      factors.recentActivity * 0.2 + 
      factors.userFocus * 0.25 +
      (factors.antImportance / 10) * 0.15 +
      (1 - factors.systemLoad) * 0.1
    );
  }

  /**
   * Update performance tracking for adaptive scaling
   */
  private updatePerformanceMetrics(deltaTime: number): void {
    const frameTime = deltaTime * 1000; // Convert to milliseconds
    this.frameTimeHistory.push(frameTime);
    
    if (this.frameTimeHistory.length > this.HISTORY_SIZE) {
      this.frameTimeHistory.shift();
    }
    
    this.lastUpdate = Date.now();
  }

  /**
   * Calculate current system computational load
   */
  private getCurrentSystemLoad(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    
    const averageFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    const targetFrameTime = 1000 / this.performanceTargets.targetFPS;
    
    return Math.min(1.0, averageFrameTime / targetFrameTime);
  }

  /**
   * Get LOD assignment for specific ant
   */
  public getAssignment(antId: string): LODAssignment | null {
    return this.assignments.get(antId) || null;
  }

  /**
   * Check if ant needs update based on its LOD level
   */
  public shouldUpdate(antId: string): boolean {
    const assignment = this.assignments.get(antId);
    if (!assignment) return true;
    
    return Date.now() >= assignment.nextUpdate;
  }

  /**
   * Get current LOD distribution statistics
   */
  public getLODStatistics(): Map<LODLevel, number> {
    const stats = new Map<LODLevel, number>();
    
    // Initialize with zeros
    Object.values(LODLevel).forEach(level => {
      stats.set(level as LODLevel, 0);
    });
    
    // Count assignments
    for (const assignment of this.assignments.values()) {
      const current = stats.get(assignment.level) || 0;
      stats.set(assignment.level, current + 1);
    }
    
    return stats;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): {
    averageFrameTime: number;
    currentFPS: number;
    systemLoad: number;
    totalAnts: number;
    memoryUsage: number;
  } {
    const averageFrameTime = this.frameTimeHistory.length > 0 
      ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length 
      : 0;
    
    const currentFPS = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
    const systemLoad = this.getCurrentSystemLoad();
    
    // Calculate total memory usage
    let totalMemory = 0;
    for (const assignment of this.assignments.values()) {
      const config = this.configurations.get(assignment.level)!;
      totalMemory += config.memoryFootprint;
    }
    
    return {
      averageFrameTime,
      currentFPS,
      systemLoad,
      totalAnts: this.assignments.size,
      memoryUsage: totalMemory
    };
  }

  /**
   * Configure performance targets
   */
  public setPerformanceTargets(targetFPS: number, maxLoadFactor: number): void {
    this.performanceTargets = { targetFPS, maxLoadFactor };
  }

  /**
   * Remove ant from LOD tracking
   */
  public removeAnt(antId: string): void {
    this.assignments.delete(antId);
  }

  /**
   * Clear all LOD assignments
   */
  public clear(): void {
    this.assignments.clear();
    this.frameTimeHistory.length = 0;
  }
}