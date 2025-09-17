/**
 * Enhanced Level of Detail (LOD) System for Phase 2
 * Implements distance-based ant detail reduction for massive performance gains
 * Integrates with existing AdaptiveLODController for intelligent quality scaling
 */

import { AdaptiveLODController } from './AdaptiveLODController';
import { LODLevel } from './LODSystem';
import { AntRenderData } from '../../shared/types';

export interface LODConfig {
  enabled: boolean;
  distances: {
    fullDetail: number;      // 0-20m: Full detail
    simplified: number;      // 20-50m: Simplified geometry
    statistical: number;     // 50-100m: Statistical representation
    aggregate: number;       // 100m+: Aggregate clusters
  };
  geometryReduction: {
    fullDetail: number;      // 1.0 = full geometry
    simplified: number;      // 0.5 = half the triangles
    statistical: number;     // 0.1 = minimal geometry
    aggregate: number;       // 0.02 = cluster representation
  };
  maxAntsPerLOD: {
    fullDetail: number;
    simplified: number;
    statistical: number;
    aggregate: number;
  };
  adaptiveThresholds: {
    performanceTarget: number; // Target FPS
    qualityReduction: number;  // How much to reduce quality under load
  };
}

export interface LODRenderData extends AntRenderData {
  lodLevel: LODLevel;
  distanceFromCamera: number;
  geometryComplexity: number;
  renderPriority: number;
  clusterSize?: number; // For aggregate LOD
}

export interface LODPerformanceMetrics {
  totalAnts: number;
  lodDistribution: Record<LODLevel, number>;
  renderTimeMs: number;
  geometryReduction: number; // Percentage of triangles saved
  performanceGain: number;   // Estimated FPS improvement
}

export class EnhancedLODSystem {
  private config: LODConfig;
  private adaptiveLODController: AdaptiveLODController | null = null;
  private frameCount = 0;
  private performanceMetrics: LODPerformanceMetrics;
  private cameraPosition = { x: 0, y: 0, z: 0 };

  constructor(config: Partial<LODConfig> = {}) {
    this.config = {
      enabled: true,
      distances: {
        fullDetail: 25,
        simplified: 75,
        statistical: 150,
        aggregate: Number.MAX_VALUE
      },
      geometryReduction: {
        fullDetail: 1.0,
        simplified: 0.4,
        statistical: 0.15,
        aggregate: 0.05
      },
      maxAntsPerLOD: {
        fullDetail: 500,
        simplified: 2000,
        statistical: 5000,
        aggregate: Number.MAX_VALUE
      },
      adaptiveThresholds: {
        performanceTarget: 60,
        qualityReduction: 0.8
      },
      ...config
    };

    this.performanceMetrics = {
      totalAnts: 0,
      lodDistribution: {
        [LODLevel.FULL_DETAIL]: 0,
        [LODLevel.SIMPLIFIED]: 0,
        [LODLevel.STATISTICAL]: 0,
        [LODLevel.AGGREGATE]: 0
      },
      renderTimeMs: 0,
      geometryReduction: 0,
      performanceGain: 0
    };

    console.log('🎯 Enhanced LOD System initialized');
    console.log(`   Full detail distance: ${this.config.distances.fullDetail}m`);
    console.log(`   Simplified distance: ${this.config.distances.simplified}m`);
    console.log(`   Statistical distance: ${this.config.distances.statistical}m`);
  }

  /**
   * Set adaptive LOD controller for intelligent quality management
   */
  public setAdaptiveLODController(controller: AdaptiveLODController): void {
    this.adaptiveLODController = controller;
    console.log('🧠 Adaptive LOD controller connected');
  }

  /**
   * Update camera position for distance calculations
   */
  public updateCameraPosition(position: { x: number; y: number; z: number }): void {
    this.cameraPosition = position;
  }

  /**
   * Process ant render data with LOD optimization
   */
  public processAntRenderData(
    antData: AntRenderData[],
    currentFPS: number
  ): LODRenderData[] {
    if (!this.config.enabled) {
      return antData.map(ant => ({
        ...ant,
        lodLevel: LODLevel.FULL_DETAIL,
        distanceFromCamera: 0,
        geometryComplexity: 1.0,
        renderPriority: 1.0
      }));
    }

    const startTime = performance.now();
    this.frameCount++;

    // Reset metrics
    this.performanceMetrics.totalAnts = antData.length;
    this.performanceMetrics.lodDistribution = {
      [LODLevel.FULL_DETAIL]: 0,
      [LODLevel.SIMPLIFIED]: 0,
      [LODLevel.STATISTICAL]: 0,
      [LODLevel.AGGREGATE]: 0
    };

    // Calculate distances and assign LOD levels
    const antDataWithLOD = antData.map(ant => this.assignLODLevel(ant, currentFPS));

    // Sort by render priority (distance and importance)
    antDataWithLOD.sort((a, b) => b.renderPriority - a.renderPriority);

    // Apply LOD limits based on performance
    const optimizedData = this.applyLODLimits(antDataWithLOD, currentFPS);

    // Calculate performance metrics
    this.calculatePerformanceMetrics(optimizedData, performance.now() - startTime);

    return optimizedData;
  }

  /**
   * Assign LOD level based on distance and performance
   */
  private assignLODLevel(ant: AntRenderData, currentFPS: number): LODRenderData {
    // Calculate distance from camera
    const dx = ant.position.x - this.cameraPosition.x;
    const dy = ant.position.y - this.cameraPosition.y;
    const dz = ant.position.z - this.cameraPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Adaptive distance scaling based on performance
    const performanceScale = this.getPerformanceScale(currentFPS);
    const scaledDistances = {
      fullDetail: this.config.distances.fullDetail * performanceScale,
      simplified: this.config.distances.simplified * performanceScale,
      statistical: this.config.distances.statistical * performanceScale
    };

    // Determine LOD level
    let lodLevel: LODLevel;
    let geometryComplexity: number;

    if (distance <= scaledDistances.fullDetail) {
      lodLevel = LODLevel.FULL_DETAIL;
      geometryComplexity = this.config.geometryReduction.fullDetail;
    } else if (distance <= scaledDistances.simplified) {
      lodLevel = LODLevel.SIMPLIFIED;
      geometryComplexity = this.config.geometryReduction.simplified;
    } else if (distance <= scaledDistances.statistical) {
      lodLevel = LODLevel.STATISTICAL;
      geometryComplexity = this.config.geometryReduction.statistical;
    } else {
      lodLevel = LODLevel.AGGREGATE;
      geometryComplexity = this.config.geometryReduction.aggregate;
    }

    // Calculate render priority (closer = higher priority)
    const renderPriority = Math.max(0, 1.0 - (distance / 200));

    // Apply ant importance modifier (queens > soldiers > workers)
    const importanceMultiplier = ant.caste === 'queen' ? 2.0 : 
                                ant.caste === 'soldier' ? 1.5 : 1.0;

    return {
      ...ant,
      lodLevel,
      distanceFromCamera: distance,
      geometryComplexity: geometryComplexity,
      renderPriority: renderPriority * importanceMultiplier
    };
  }

  /**
   * Get performance-based distance scaling
   */
  private getPerformanceScale(currentFPS: number): number {
    const targetFPS = this.config.adaptiveThresholds.performanceTarget;
    const performanceRatio = currentFPS / targetFPS;

    if (performanceRatio >= 1.0) {
      return 1.0; // Full quality distances
    } else if (performanceRatio >= 0.8) {
      return 0.8; // Slightly reduced distances
    } else if (performanceRatio >= 0.6) {
      return 0.6; // Moderately reduced distances
    } else {
      return 0.4; // Heavily reduced distances for performance
    }
  }

  /**
   * Apply LOD limits based on performance constraints
   */
  private applyLODLimits(
    antData: LODRenderData[],
    currentFPS: number
  ): LODRenderData[] {
    const limits = this.config.maxAntsPerLOD;
    const counts = { ...this.performanceMetrics.lodDistribution };
    
    // Performance-based limit adjustment
    const performanceMultiplier = Math.min(1.0, currentFPS / this.config.adaptiveThresholds.performanceTarget);
    const adjustedLimits = {
      [LODLevel.FULL_DETAIL]: Math.floor(limits.fullDetail * performanceMultiplier),
      [LODLevel.SIMPLIFIED]: Math.floor(limits.simplified * performanceMultiplier),
      [LODLevel.STATISTICAL]: Math.floor(limits.statistical * performanceMultiplier),
      [LODLevel.AGGREGATE]: limits.aggregate
    };

    const result: LODRenderData[] = [];

    for (const ant of antData) {
      const currentCount = counts[ant.lodLevel];
      const limit = adjustedLimits[ant.lodLevel];

      if (currentCount < limit) {
        result.push(ant);
        counts[ant.lodLevel]++;
        this.performanceMetrics.lodDistribution[ant.lodLevel]++;
      } else {
        // Downgrade to next LOD level if possible
        const downgradedAnt = this.downgradeLODLevel(ant);
        if (downgradedAnt && counts[downgradedAnt.lodLevel] < adjustedLimits[downgradedAnt.lodLevel]) {
          result.push(downgradedAnt);
          counts[downgradedAnt.lodLevel]++;
          this.performanceMetrics.lodDistribution[downgradedAnt.lodLevel]++;
        }
        // Otherwise, skip this ant (culling for performance)
      }
    }

    return result;
  }

  /**
   * Downgrade ant to next LOD level
   */
  private downgradeLODLevel(ant: LODRenderData): LODRenderData | null {
    let newLodLevel: LODLevel;
    let newGeometryComplexity: number;

    switch (ant.lodLevel) {
      case LODLevel.FULL_DETAIL:
        newLodLevel = LODLevel.SIMPLIFIED;
        newGeometryComplexity = this.config.geometryReduction.simplified;
        break;
      case LODLevel.SIMPLIFIED:
        newLodLevel = LODLevel.STATISTICAL;
        newGeometryComplexity = this.config.geometryReduction.statistical;
        break;
      case LODLevel.STATISTICAL:
        newLodLevel = LODLevel.AGGREGATE;
        newGeometryComplexity = this.config.geometryReduction.aggregate;
        break;
      default:
        return null; // Can't downgrade further
    }

    return {
      ...ant,
      lodLevel: newLodLevel,
      geometryComplexity: newGeometryComplexity,
      renderPriority: ant.renderPriority * 0.8 // Slightly reduce priority
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(optimizedData: LODRenderData[], renderTime: number): void {
    this.performanceMetrics.renderTimeMs = renderTime;

    // Calculate geometry reduction
    let totalComplexity = 0;
    for (const ant of optimizedData) {
      totalComplexity += ant.geometryComplexity;
    }

    const baselineComplexity = optimizedData.length; // All ants at full detail
    this.performanceMetrics.geometryReduction = 
      Math.max(0, 1.0 - (totalComplexity / baselineComplexity));

    // Estimate performance gain (conservative)
    const triangleReduction = this.performanceMetrics.geometryReduction;
    this.performanceMetrics.performanceGain = 
      1.0 + (triangleReduction * 2.0); // 2x improvement per triangle saved (conservative)

    // Log performance improvements periodically
    if (this.frameCount % 300 === 0) { // Every 5 seconds at 60 FPS
      console.log(`🎯 LOD Performance: ${(this.performanceMetrics.geometryReduction * 100).toFixed(1)}% geometry reduction, ${this.performanceMetrics.performanceGain.toFixed(1)}x estimated speedup`);
    }
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): LODPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get LOD configuration
   */
  public getConfig(): LODConfig {
    return { ...this.config };
  }

  /**
   * Update LOD configuration dynamically
   */
  public updateConfig(newConfig: Partial<LODConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🎯 LOD configuration updated');
  }

  /**
   * Enable/disable LOD system
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`🎯 LOD system ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get detailed LOD statistics for debugging
   */
  public getDetailedStats(): {
    config: LODConfig;
    metrics: LODPerformanceMetrics;
    frameCount: number;
    cameraPosition: { x: number; y: number; z: number };
  } {
    return {
      config: this.config,
      metrics: this.performanceMetrics,
      frameCount: this.frameCount,
      cameraPosition: this.cameraPosition
    };
  }
}