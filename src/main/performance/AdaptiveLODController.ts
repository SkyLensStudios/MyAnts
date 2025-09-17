/**
 * Advanced LOD Integration with WebGPU Performance System
 * Connects LOD controller with WebGPU compute pipeline for optimal performance
 */

import { LODController } from './LODController';
import { WebGPUComputePipelineManager } from './WebGPUComputePipelineManager';
import { PerformanceOptimizationIntegrationV3 } from './PerformanceOptimizationIntegrationV3';
import { LODLevel } from './LODSystem';

export interface AdaptiveLODConfig {
  targetFPS: number;
  minFPS: number;
  maxAnts: number;
  performanceThresholds: {
    ultraLow: number;   // 0.1 - Emergency performance mode
    low: number;        // 0.3 - Reduce quality significantly  
    medium: number;     // 0.6 - Balanced quality/performance
    high: number;       // 0.8 - High quality mode
    ultra: number;      // 1.0 - Maximum quality
  };
  adaptationRate: number; // How quickly to adapt to performance changes
}

export interface LODPerformanceMetrics {
  currentFPS: number;
  targetFPS: number;
  performanceRatio: number;
  lodDistribution: Record<LODLevel, number>;
  adaptationHistory: number[];
  webgpuUtilization: number;
  memoryPressure: number;
}

/**
 * Adaptive LOD System Integration
 * Dynamically adjusts quality based on real-time performance metrics
 */
export class AdaptiveLODController {
  private lodController: LODController;
  private webgpuPipeline: WebGPUComputePipelineManager;
  private performanceSystem: PerformanceOptimizationIntegrationV3;
  
  private config: AdaptiveLODConfig;
  private isInitialized = false;
  
  // Performance tracking
  private metrics: LODPerformanceMetrics = {
    currentFPS: 60,
    targetFPS: 60,
    performanceRatio: 1.0,
    lodDistribution: {
      [LODLevel.FULL_DETAIL]: 0,
      [LODLevel.SIMPLIFIED]: 0,
      [LODLevel.STATISTICAL]: 0,
      [LODLevel.AGGREGATE]: 0
    },
    adaptationHistory: [],
    webgpuUtilization: 0,
    memoryPressure: 0
  };
  
  // Adaptive control state
  private lastAdaptation = Date.now();
  private performanceHistory: number[] = [];
  private qualityLevel = 1.0; // 0.0 to 1.0

  constructor(
    lodController: LODController,
    webgpuPipeline: WebGPUComputePipelineManager,
    performanceSystem: PerformanceOptimizationIntegrationV3
  ) {
    this.lodController = lodController;
    this.webgpuPipeline = webgpuPipeline;
    this.performanceSystem = performanceSystem;
    
    this.config = {
      targetFPS: 60,
      minFPS: 30,
      maxAnts: 50000,
      performanceThresholds: {
        ultraLow: 0.1,
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        ultra: 1.0
      },
      adaptationRate: 0.1
    };
  }

  /**
   * Initialize the adaptive LOD system
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize WebGPU pipeline if not already done
      if (!this.webgpuPipeline) {
        console.warn('WebGPU pipeline not available, using fallback performance monitoring');
      }
      
      // Start performance monitoring loop
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('Adaptive LOD Controller initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Adaptive LOD Controller:', error);
      throw error;
    }
  }

  /**
   * Update LOD assignments based on current performance
   */
  public async updateLODAssignments(antData: any[], deltaTime: number): Promise<void> {
    if (!this.isInitialized) return;

    // Get current performance metrics
    const performanceMetrics = this.gatherPerformanceMetrics();
    this.updatePerformanceHistory(performanceMetrics);
    
    // Determine if adaptation is needed
    const adaptationNeeded = this.shouldAdapt(performanceMetrics);
    
    if (adaptationNeeded) {
      await this.adaptQualitySettings(performanceMetrics);
    }
    
    // Apply LOD assignments based on current quality level
    await this.applyOptimalLODDistribution(antData);
    
    // Update metrics
    this.updateMetrics(performanceMetrics);
  }

  /**
   * Gather comprehensive performance metrics
   */
  private gatherPerformanceMetrics(): any {
    const webgpuMetrics = this.webgpuPipeline?.getPerformanceMetrics() || {
      gpuUtilization: 0,
      lastComputeTime: 0,
      averageComputeTime: 0,
      memoryUsage: 0
    };
    
    const systemMetrics = this.performanceSystem.getPerformanceStatus();
    
    return {
      fps: systemMetrics.fps || 60,
      frameTime: systemMetrics.frameTime || 16.67,
      cpuUsage: systemMetrics.systemLoad || 0.5, // systemLoad maps to CPU usage
      memoryUsage: systemMetrics.memoryUsage || 0.5,
      gpuUtilization: webgpuMetrics.gpuUtilization,
      computeTime: webgpuMetrics.lastComputeTime,
      memoryBandwidth: webgpuMetrics.averageComputeTime, // Use averageComputeTime as bandwidth proxy
      thermalState: systemMetrics.systemLoad || 0.5 // Use systemLoad as thermal proxy
    };
  }

  /**
   * Update performance history for trend analysis
   */
  private updatePerformanceHistory(metrics: any): void {
    this.performanceHistory.push(metrics.fps);
    
    // Keep only recent history (last 5 seconds at 60 FPS)
    if (this.performanceHistory.length > 300) {
      this.performanceHistory.shift();
    }
    
    // Update current metrics
    this.metrics.currentFPS = metrics.fps;
    this.metrics.webgpuUtilization = metrics.gpuUtilization;
    this.metrics.memoryPressure = metrics.memoryUsage;
  }

  /**
   * Determine if quality adaptation is needed
   */
  private shouldAdapt(metrics: any): boolean {
    const now = Date.now();
    const timeSinceLastAdaptation = now - this.lastAdaptation;
    
    // Don't adapt too frequently
    if (timeSinceLastAdaptation < 1000) return false; // Wait at least 1 second
    
    // Check if performance is significantly below target
    const performanceRatio = metrics.fps / this.config.targetFPS;
    this.metrics.performanceRatio = performanceRatio;
    
    // Adapt if performance is below threshold
    if (performanceRatio < 0.9 && this.qualityLevel > this.config.performanceThresholds.low) {
      return true;
    }
    
    // Adapt if performance is above threshold and quality can be increased
    if (performanceRatio > 1.1 && this.qualityLevel < this.config.performanceThresholds.ultra) {
      return true;
    }
    
    // Check for thermal throttling
    if (metrics.thermalState > 0.85 && this.qualityLevel > this.config.performanceThresholds.medium) {
      return true;
    }
    
    return false;
  }

  /**
   * Adapt quality settings based on performance
   */
  private async adaptQualitySettings(metrics: any): Promise<void> {
    const performanceRatio = metrics.fps / this.config.targetFPS;
    let targetQuality = this.qualityLevel;
    
    if (performanceRatio < 0.5) {
      // Emergency performance mode
      targetQuality = this.config.performanceThresholds.ultraLow;
      console.log('LOD: Emergency performance mode activated');
    } else if (performanceRatio < 0.7) {
      // Low performance mode
      targetQuality = this.config.performanceThresholds.low;
      console.log('LOD: Low performance mode activated');
    } else if (performanceRatio < 0.9) {
      // Medium performance mode
      targetQuality = this.config.performanceThresholds.medium;
      console.log('LOD: Medium performance mode activated');
    } else if (performanceRatio > 1.2) {
      // High performance available
      targetQuality = Math.min(this.config.performanceThresholds.ultra, this.qualityLevel + 0.1);
      console.log('LOD: Increasing quality level');
    }
    
    // Apply thermal throttling
    if (metrics.thermalState > 0.85) {
      targetQuality = Math.min(targetQuality, this.config.performanceThresholds.medium);
      console.log('LOD: Thermal throttling applied');
    }
    
    // Smooth adaptation
    const adaptationSpeed = this.config.adaptationRate;
    this.qualityLevel = this.qualityLevel * (1 - adaptationSpeed) + targetQuality * adaptationSpeed;
    
    // Clamp quality level
    this.qualityLevel = Math.max(this.config.performanceThresholds.ultraLow, 
                                Math.min(this.config.performanceThresholds.ultra, this.qualityLevel));
    
    this.lastAdaptation = Date.now();
    this.metrics.adaptationHistory.push(this.qualityLevel);
    
    // Keep adaptation history manageable
    if (this.metrics.adaptationHistory.length > 100) {
      this.metrics.adaptationHistory.shift();
    }
  }

  /**
   * Apply optimal LOD distribution based on quality level
   */
  private async applyOptimalLODDistribution(antData: any[]): Promise<void> {
    const totalAnts = antData.length;
    
    // Calculate LOD distribution based on quality level
    let fullDetailRatio = 0;
    let simplifiedRatio = 0;
    let statisticalRatio = 0;
    let aggregateRatio = 0;
    
    if (this.qualityLevel >= this.config.performanceThresholds.ultra) {
      // Ultra quality: More detailed ants
      fullDetailRatio = Math.min(0.1, 500 / totalAnts);
      simplifiedRatio = Math.min(0.3, 2000 / totalAnts);
      statisticalRatio = Math.min(0.4, 8000 / totalAnts);
      aggregateRatio = 1 - fullDetailRatio - simplifiedRatio - statisticalRatio;
    } else if (this.qualityLevel >= this.config.performanceThresholds.high) {
      // High quality
      fullDetailRatio = Math.min(0.05, 300 / totalAnts);
      simplifiedRatio = Math.min(0.25, 1500 / totalAnts);
      statisticalRatio = Math.min(0.5, 7000 / totalAnts);
      aggregateRatio = 1 - fullDetailRatio - simplifiedRatio - statisticalRatio;
    } else if (this.qualityLevel >= this.config.performanceThresholds.medium) {
      // Medium quality
      fullDetailRatio = Math.min(0.02, 100 / totalAnts);
      simplifiedRatio = Math.min(0.15, 1000 / totalAnts);
      statisticalRatio = Math.min(0.6, 5000 / totalAnts);
      aggregateRatio = 1 - fullDetailRatio - simplifiedRatio - statisticalRatio;
    } else if (this.qualityLevel >= this.config.performanceThresholds.low) {
      // Low quality
      fullDetailRatio = Math.min(0.01, 50 / totalAnts);
      simplifiedRatio = Math.min(0.05, 500 / totalAnts);
      statisticalRatio = Math.min(0.4, 3000 / totalAnts);
      aggregateRatio = 1 - fullDetailRatio - simplifiedRatio - statisticalRatio;
    } else {
      // Ultra-low quality (emergency mode)
      fullDetailRatio = 0;
      simplifiedRatio = Math.min(0.02, 100 / totalAnts);
      statisticalRatio = Math.min(0.2, 1000 / totalAnts);
      aggregateRatio = 1 - simplifiedRatio - statisticalRatio;
    }
    
    // Apply LOD assignments
    const assignments = this.calculateLODAssignments(antData, {
      fullDetailRatio,
      simplifiedRatio,
      statisticalRatio,
      aggregateRatio
    });
    
    // Update metrics
    this.metrics.lodDistribution = {
      [LODLevel.FULL_DETAIL]: assignments.fullDetail,
      [LODLevel.SIMPLIFIED]: assignments.simplified,
      [LODLevel.STATISTICAL]: assignments.statistical,
      [LODLevel.AGGREGATE]: assignments.aggregate
    };
    
    // Apply assignments to simulation system
    await this.applyLODAssignments(assignments);
  }

  /**
   * Calculate specific LOD assignments for ants
   */
  private calculateLODAssignments(antData: any[], ratios: any): any {
    const totalAnts = antData.length;
    
    // Sort ants by importance (distance to camera, user selection, activity)
    const sortedAnts = antData.slice().sort((a, b) => {
      const importanceA = this.calculateAntImportance(a);
      const importanceB = this.calculateAntImportance(b);
      return importanceB - importanceA;
    });
    
    const fullDetailCount = Math.floor(totalAnts * ratios.fullDetailRatio);
    const simplifiedCount = Math.floor(totalAnts * ratios.simplifiedRatio);
    const statisticalCount = Math.floor(totalAnts * ratios.statisticalRatio);
    const aggregateCount = totalAnts - fullDetailCount - simplifiedCount - statisticalCount;
    
    return {
      fullDetail: fullDetailCount,
      simplified: simplifiedCount,
      statistical: statisticalCount,
      aggregate: aggregateCount,
      assignments: {
        fullDetail: sortedAnts.slice(0, fullDetailCount),
        simplified: sortedAnts.slice(fullDetailCount, fullDetailCount + simplifiedCount),
        statistical: sortedAnts.slice(fullDetailCount + simplifiedCount, fullDetailCount + simplifiedCount + statisticalCount),
        aggregate: sortedAnts.slice(fullDetailCount + simplifiedCount + statisticalCount)
      }
    };
  }

  /**
   * Calculate importance score for ant (for LOD prioritization)
   */
  private calculateAntImportance(ant: any): number {
    let importance = 0;
    
    // Distance to camera (closer = more important)
    const distance = this.calculateDistanceToCamera(ant.position);
    importance += Math.max(0, 1 - distance / 100); // Normalize to 0-1
    
    // User selection/focus
    if (ant.isSelected) {
      importance += 2.0;
    }
    
    // Recent activity
    const timeSinceActivity = Date.now() - (ant.lastActivity || 0);
    importance += Math.max(0, 1 - timeSinceActivity / 10000); // Activity in last 10 seconds
    
    // Caste importance (queen > workers > others)
    if (ant.caste === 'queen') {
      importance += 1.5;
    } else if (ant.caste === 'worker') {
      importance += 0.5;
    }
    
    return importance;
  }

  /**
   * Calculate distance from ant to camera
   */
  private calculateDistanceToCamera(position: any): number {
    // This would use actual camera position from the renderer
    // For now, assume camera at origin
    return Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
  }

  /**
   * Apply LOD assignments to simulation systems
   */
  private async applyLODAssignments(assignments: any): Promise<void> {
    // This would integrate with the actual simulation systems
    // For now, just log the assignments
    console.log(`LOD Distribution: Full=${assignments.fullDetail}, Simplified=${assignments.simplified}, Statistical=${assignments.statistical}, Aggregate=${assignments.aggregate}`);
    
    // Update WebGPU pipeline with performance step
    if (this.webgpuPipeline && this.webgpuPipeline.isAvailable()) {
      // Execute a compute step to apply the LOD changes
      await this.webgpuPipeline.executeComputeStep(16.67); // 60 FPS frame time
    }
  }

  /**
   * Start performance monitoring loop
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      if (!this.isInitialized) return;
      
      const metrics = this.gatherPerformanceMetrics();
      this.updatePerformanceHistory(metrics);
      
      // Log performance summary periodically
      if (Math.random() < 0.01) { // 1% chance per frame (~once per second at 60fps)
        console.log(`LOD Performance: ${metrics.fps.toFixed(1)} FPS, Quality: ${(this.qualityLevel * 100).toFixed(0)}%`);
      }
    }, 16); // ~60 FPS monitoring
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(performanceMetrics: any): void {
    this.metrics.currentFPS = performanceMetrics.fps;
    this.metrics.targetFPS = this.config.targetFPS;
    this.metrics.performanceRatio = performanceMetrics.fps / this.config.targetFPS;
    this.metrics.webgpuUtilization = performanceMetrics.gpuUtilization;
    this.metrics.memoryPressure = performanceMetrics.memoryUsage;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): LODPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current quality level
   */
  public getCurrentQualityLevel(): number {
    return this.qualityLevel;
  }

  /**
   * Set target FPS
   */
  public setTargetFPS(fps: number): void {
    this.config.targetFPS = fps;
    this.metrics.targetFPS = fps;
  }

  /**
   * Force quality level (for testing/debugging)
   */
  public setQualityLevel(quality: number): void {
    this.qualityLevel = Math.max(0, Math.min(1, quality));
    console.log(`LOD: Quality level manually set to ${(this.qualityLevel * 100).toFixed(0)}%`);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.isInitialized = false;
    this.performanceHistory = [];
    this.metrics.adaptationHistory = [];
  }
}