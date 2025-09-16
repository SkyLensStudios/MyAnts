/**
 * Adaptive Performance Manager
 * Automatically adjusts simulation complexity to maintain target FPS and quality
 */

import { LODController } from './LODController';
import { HybridComputeCoordinator } from './HybridComputeCoordinator';
import { GPUPheromoneSystem } from './GPUPheromoneSystem';

export interface PerformanceTargets {
  targetFPS: number;
  minFPS: number;
  maxFPS: number;
  targetFrameTime: number;        // milliseconds
  maxMemoryUsage: number;         // bytes
  maxCPUUsage: number;           // percentage
}

export interface QualityPreset {
  name: string;
  description: string;
  maxAnts: number;
  lodDistribution: {
    fullDetail: number;     // percentage
    simplified: number;
    statistical: number;
    aggregate: number;
  };
  enableGPUCompute: boolean;
  enableWebAssembly: boolean;
  pheromoneResolution: number;
  physicsAccuracy: number;        // 0-1
  renderQuality: number;          // 0-1
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  antCount: number;
  lodDistribution: Map<string, number>;
  gpuUtilization: number;
  wasmUtilization: number;
}

export interface AdaptiveSettings {
  aggressiveScaling: boolean;
  enablePredictiveScaling: boolean;
  samplingWindow: number;         // frames to sample for decisions
  scalingThreshold: number;       // performance deviation threshold
  hysteresisTime: number;         // milliseconds to wait between changes
}

/**
 * Manages performance optimization through adaptive quality scaling
 */
export class AdaptivePerformanceManager {
  private targets: PerformanceTargets;
  private currentPreset: QualityPreset;
  private presets: Map<string, QualityPreset> = new Map();
  private settings: AdaptiveSettings;
  
  // Component references
  private lodController: LODController;
  private computeCoordinator: HybridComputeCoordinator;
  private gpuPheromones: GPUPheromoneSystem | null = null;
  
  // Performance tracking
  private metricsHistory: PerformanceMetrics[] = [];
  private lastScalingTime: number = 0;
  private performanceTrend: 'stable' | 'improving' | 'degrading' = 'stable';
  private frameTimeBuffer: number[] = [];
  private readonly BUFFER_SIZE = 60; // 1 second at 60 FPS
  
  // Adaptive state
  private currentComplexityFactor: number = 1.0;
  private isAutoScalingEnabled: boolean = true;
  private scalingHistory: Array<{ time: number; action: string; reason: string }> = [];

  constructor(
    targets: PerformanceTargets,
    lodController: LODController,
    computeCoordinator: HybridComputeCoordinator
  ) {
    this.targets = targets;
    this.lodController = lodController;
    this.computeCoordinator = computeCoordinator;
    
    this.settings = {
      aggressiveScaling: false,
      enablePredictiveScaling: true,
      samplingWindow: 30,
      scalingThreshold: 0.15, // 15% deviation
      hysteresisTime: 2000    // 2 seconds
    };

    this.initializeQualityPresets();
    this.currentPreset = this.presets.get('balanced')!;
    this.applyPreset(this.currentPreset);
  }

  /**
   * Initialize predefined quality presets
   */
  private initializeQualityPresets(): void {
    this.presets.set('ultra', {
      name: 'Ultra (Scientific)',
      description: 'Maximum quality for research and detailed observation',
      maxAnts: 500,
      lodDistribution: {
        fullDetail: 80,
        simplified: 15,
        statistical: 5,
        aggregate: 0
      },
      enableGPUCompute: true,
      enableWebAssembly: true,
      pheromoneResolution: 2048,
      physicsAccuracy: 1.0,
      renderQuality: 1.0
    });

    this.presets.set('high', {
      name: 'High Performance',
      description: 'High quality with good performance balance',
      maxAnts: 2000,
      lodDistribution: {
        fullDetail: 40,
        simplified: 35,
        statistical: 20,
        aggregate: 5
      },
      enableGPUCompute: true,
      enableWebAssembly: true,
      pheromoneResolution: 1024,
      physicsAccuracy: 0.8,
      renderQuality: 0.85
    });

    this.presets.set('balanced', {
      name: 'Balanced',
      description: 'Optimal balance of quality and performance',
      maxAnts: 5000,
      lodDistribution: {
        fullDetail: 20,
        simplified: 30,
        statistical: 35,
        aggregate: 15
      },
      enableGPUCompute: true,
      enableWebAssembly: true,
      pheromoneResolution: 512,
      physicsAccuracy: 0.6,
      renderQuality: 0.7
    });

    this.presets.set('performance', {
      name: 'Performance',
      description: 'Prioritizes smooth framerate over quality',
      maxAnts: 10000,
      lodDistribution: {
        fullDetail: 5,
        simplified: 15,
        statistical: 40,
        aggregate: 40
      },
      enableGPUCompute: true,
      enableWebAssembly: true,
      pheromoneResolution: 256,
      physicsAccuracy: 0.4,
      renderQuality: 0.5
    });

    this.presets.set('extreme', {
      name: 'Extreme Scale',
      description: 'Maximum ant population with minimal quality',
      maxAnts: 50000,
      lodDistribution: {
        fullDetail: 1,
        simplified: 4,
        statistical: 25,
        aggregate: 70
      },
      enableGPUCompute: true,
      enableWebAssembly: true,
      pheromoneResolution: 128,
      physicsAccuracy: 0.2,
      renderQuality: 0.3
    });
  }

  /**
   * Update performance manager each frame
   */
  public update(deltaTime: number): void {
    const frameTime = deltaTime * 1000; // Convert to milliseconds
    this.updateFrameTimeBuffer(frameTime);
    
    const metrics = this.gatherPerformanceMetrics();
    this.metricsHistory.push(metrics);
    
    // Limit history size
    if (this.metricsHistory.length > 300) { // 5 seconds at 60 FPS
      this.metricsHistory.shift();
    }
    
    // Analyze performance trend
    this.analyzePerformanceTrend();
    
    // Apply adaptive scaling if enabled
    if (this.isAutoScalingEnabled && this.shouldPerformScaling()) {
      this.performAdaptiveScaling(metrics);
    }
  }

  /**
   * Update frame time buffer for performance analysis
   */
  private updateFrameTimeBuffer(frameTime: number): void {
    this.frameTimeBuffer.push(frameTime);
    
    if (this.frameTimeBuffer.length > this.BUFFER_SIZE) {
      this.frameTimeBuffer.shift();
    }
  }

  /**
   * Gather current performance metrics
   */
  private gatherPerformanceMetrics(): PerformanceMetrics {
    const averageFrameTime = this.frameTimeBuffer.length > 0
      ? this.frameTimeBuffer.reduce((a, b) => a + b, 0) / this.frameTimeBuffer.length
      : 16.67; // Default to 60 FPS

    const fps = 1000 / averageFrameTime;
    
    // Get LOD statistics
    const lodStats = this.lodController.getStatistics();
    
    // Get compute utilization
    const computeStats = this.computeCoordinator.getQueueStatus();
    
    return {
      fps,
      frameTime: averageFrameTime,
      cpuUsage: this.estimateCPUUsage(),
      memoryUsage: this.estimateMemoryUsage(),
      antCount: lodStats.performance.totalAnts,
      lodDistribution: lodStats.lodDistribution,
      gpuUtilization: this.estimateGPUUtilization(),
      wasmUtilization: computeStats.processingTasks / computeStats.totalCapacity
    };
  }

  /**
   * Analyze performance trend over recent history
   */
  private analyzePerformanceTrend(): void {
    if (this.metricsHistory.length < this.settings.samplingWindow) {
      this.performanceTrend = 'stable';
      return;
    }

    const recent = this.metricsHistory.slice(-this.settings.samplingWindow);
    const older = this.metricsHistory.slice(-this.settings.samplingWindow * 2, -this.settings.samplingWindow);
    
    if (older.length === 0) {
      this.performanceTrend = 'stable';
      return;
    }

    const recentAvgFPS = recent.reduce((sum, m) => sum + m.fps, 0) / recent.length;
    const olderAvgFPS = older.reduce((sum, m) => sum + m.fps, 0) / older.length;
    
    const fpsChange = (recentAvgFPS - olderAvgFPS) / olderAvgFPS;
    
    if (fpsChange > this.settings.scalingThreshold) {
      this.performanceTrend = 'improving';
    } else if (fpsChange < -this.settings.scalingThreshold) {
      this.performanceTrend = 'degrading';
    } else {
      this.performanceTrend = 'stable';
    }
  }

  /**
   * Check if scaling should be performed
   */
  private shouldPerformScaling(): boolean {
    const now = Date.now();
    const timeSinceLastScaling = now - this.lastScalingTime;
    
    return timeSinceLastScaling >= this.settings.hysteresisTime;
  }

  /**
   * Perform adaptive scaling based on current metrics
   */
  private performAdaptiveScaling(metrics: PerformanceMetrics): void {
    const fpsRatio = metrics.fps / this.targets.targetFPS;
    const memoryRatio = metrics.memoryUsage / this.targets.maxMemoryUsage;
    
    let action: string | null = null;
    let reason: string = '';
    
    // Critical performance issues - aggressive scaling
    if (metrics.fps < this.targets.minFPS || memoryRatio > 0.95) {
      action = this.scaleDown(true);
      reason = `Critical performance: FPS=${metrics.fps.toFixed(1)}, Memory=${(memoryRatio * 100).toFixed(1)}%`;
    }
    // Performance below target
    else if (fpsRatio < 0.9 || memoryRatio > 0.8) {
      action = this.scaleDown(false);
      reason = `Performance below target: FPS ratio=${fpsRatio.toFixed(2)}`;
    }
    // Performance above target with room for improvement
    else if (fpsRatio > 1.1 && memoryRatio < 0.6 && this.performanceTrend === 'stable') {
      action = this.scaleUp();
      reason = `Performance headroom available: FPS ratio=${fpsRatio.toFixed(2)}`;
    }
    // Predictive scaling based on trend
    else if (this.settings.enablePredictiveScaling && this.performanceTrend === 'degrading') {
      action = this.scaleDown(false);
      reason = 'Predictive scaling: degrading performance trend detected';
    }
    
    if (action) {
      this.recordScalingAction(action, reason);
      this.lastScalingTime = Date.now();
    }
  }

  /**
   * Scale down performance (reduce quality/complexity)
   */
  private scaleDown(aggressive: boolean): string {
    const factor = aggressive ? 0.7 : 0.9;
    this.currentComplexityFactor *= factor;
    
    // Apply complexity factor to current preset
    this.applyComplexityFactor();
    
    // Consider switching to lower preset if factor gets too low
    if (this.currentComplexityFactor < 0.6) {
      this.switchToLowerPreset();
    }
    
    return aggressive ? 'aggressive_scale_down' : 'scale_down';
  }

  /**
   * Scale up performance (increase quality/complexity)
   */
  private scaleUp(): string {
    this.currentComplexityFactor = Math.min(1.0, this.currentComplexityFactor * 1.1);
    
    // Apply complexity factor
    this.applyComplexityFactor();
    
    // Consider switching to higher preset if at maximum factor
    if (this.currentComplexityFactor >= 1.0) {
      this.switchToHigherPreset();
    }
    
    return 'scale_up';
  }

  /**
   * Apply complexity factor to current settings
   */
  private applyComplexityFactor(): void {
    const effectiveMaxAnts = Math.floor(this.currentPreset.maxAnts * this.currentComplexityFactor);
    
    // Update LOD targets
    this.lodController.setPerformanceTargets(
      this.targets.targetFPS,
      1.0 - this.currentComplexityFactor * 0.2
    );
    
    // Adjust pheromone resolution
    if (this.gpuPheromones) {
      const resolution = Math.floor(this.currentPreset.pheromoneResolution * Math.sqrt(this.currentComplexityFactor));
      // Would need to recreate GPU pheromone system with new resolution
    }
  }

  /**
   * Switch to lower quality preset
   */
  private switchToLowerPreset(): void {
    const presetOrder = ['ultra', 'high', 'balanced', 'performance', 'extreme'];
    const currentIndex = presetOrder.indexOf(this.currentPreset.name.split(' ')[0].toLowerCase());
    
    if (currentIndex < presetOrder.length - 1) {
      const newPreset = this.presets.get(presetOrder[currentIndex + 1]);
      if (newPreset) {
        this.setQualityPreset(newPreset.name);
        this.currentComplexityFactor = 1.0; // Reset factor for new preset
      }
    }
  }

  /**
   * Switch to higher quality preset
   */
  private switchToHigherPreset(): void {
    const presetOrder = ['ultra', 'high', 'balanced', 'performance', 'extreme'];
    const currentIndex = presetOrder.indexOf(this.currentPreset.name.split(' ')[0].toLowerCase());
    
    if (currentIndex > 0) {
      const newPreset = this.presets.get(presetOrder[currentIndex - 1]);
      if (newPreset) {
        this.setQualityPreset(newPreset.name);
        this.currentComplexityFactor = 0.8; // Start conservatively with new preset
      }
    }
  }

  /**
   * Record scaling action for analysis
   */
  private recordScalingAction(action: string, reason: string): void {
    this.scalingHistory.push({
      time: Date.now(),
      action,
      reason
    });
    
    // Limit history size
    if (this.scalingHistory.length > 100) {
      this.scalingHistory.shift();
    }
    
    console.log(`Performance Manager: ${action} - ${reason}`);
  }

  /**
   * Set quality preset by name
   */
  public setQualityPreset(presetName: string): void {
    const preset = this.presets.get(presetName);
    if (!preset) {
      throw new Error(`Unknown quality preset: ${presetName}`);
    }
    
    this.currentPreset = preset;
    this.applyPreset(preset);
    this.currentComplexityFactor = 1.0;
  }

  /**
   * Apply quality preset settings
   */
  private applyPreset(preset: QualityPreset): void {
    // Update LOD controller
    this.lodController.setPerformanceTargets(this.targets.targetFPS, 0.8);
    
    // Update compute coordinator
    // (Would configure compute preferences based on preset)
    
    console.log(`Applied quality preset: ${preset.name}`);
  }

  /**
   * Enable/disable automatic scaling
   */
  public setAutoScaling(enabled: boolean): void {
    this.isAutoScalingEnabled = enabled;
    console.log(`Automatic performance scaling: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Configure adaptive settings
   */
  public configureAdaptiveSettings(settings: Partial<AdaptiveSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current performance status
   */
  public getPerformanceStatus(): {
    currentMetrics: PerformanceMetrics | null;
    currentPreset: QualityPreset;
    complexityFactor: number;
    trend: string;
    autoScalingEnabled: boolean;
    recentActions: Array<{ time: number; action: string; reason: string }>;
  } {
    return {
      currentMetrics: this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null,
      currentPreset: { ...this.currentPreset },
      complexityFactor: this.currentComplexityFactor,
      trend: this.performanceTrend,
      autoScalingEnabled: this.isAutoScalingEnabled,
      recentActions: this.scalingHistory.slice(-10)
    };
  }

  /**
   * Get available quality presets
   */
  public getAvailablePresets(): QualityPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Force manual performance adjustment
   */
  public manualPerformanceAdjustment(direction: 'up' | 'down', factor: number = 0.1): void {
    if (direction === 'up') {
      this.currentComplexityFactor = Math.min(1.0, this.currentComplexityFactor + factor);
    } else {
      this.currentComplexityFactor = Math.max(0.1, this.currentComplexityFactor - factor);
    }
    
    this.applyComplexityFactor();
    this.recordScalingAction(`manual_${direction}`, `User adjustment: ${factor}`);
  }

  // Estimation methods (would be replaced with actual measurements)
  private estimateCPUUsage(): number {
    return Math.random() * 50 + 30; // Mock 30-80% CPU usage
  }

  private estimateMemoryUsage(): number {
    return Math.random() * 1024 * 1024 * 1024; // Mock 0-1GB memory usage
  }

  private estimateGPUUtilization(): number {
    return this.gpuPheromones ? Math.random() * 0.6 + 0.2 : 0; // Mock 20-80% if GPU enabled
  }
}