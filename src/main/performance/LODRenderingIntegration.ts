/**
 * LOD Integration Component for Renderer
 * Connects EnhancedLODSystem with Three.js rendering pipeline
 * Provides seamless integration with existing WebGPU and instanced rendering
 */

import { EnhancedLODSystem, LODRenderData } from './EnhancedLODSystem';
import { AdaptiveLODController } from './AdaptiveLODController';
import { LODLevel } from './LODSystem';
import { AntRenderData } from '../../shared/types';

export interface LODRenderingConfig {
  enableLOD: boolean;
  enableAdaptiveQuality: boolean;
  performanceTargetFPS: number;
  aggressiveCulling: boolean;
  debugLODLevels: boolean;
}

export interface LODGeometryMapping {
  [LODLevel.FULL_DETAIL]: {
    geometry: THREE.BufferGeometry;
    triangleCount: number;
    complexityScore: number;
  };
  [LODLevel.SIMPLIFIED]: {
    geometry: THREE.BufferGeometry;
    triangleCount: number;
    complexityScore: number;
  };
  [LODLevel.STATISTICAL]: {
    geometry: THREE.BufferGeometry;
    triangleCount: number;
    complexityScore: number;
  };
  [LODLevel.AGGREGATE]: {
    geometry: THREE.BufferGeometry;
    triangleCount: number;
    complexityScore: number;
  };
}

export class LODRenderingIntegration {
  private lodSystem: EnhancedLODSystem;
  private adaptiveLODController: AdaptiveLODController | null = null;
  private config: LODRenderingConfig;
  private geometryMapping: Partial<LODGeometryMapping> = {};
  private currentFPS = 60;
  private frameCount = 0;

  // Performance tracking
  private renderStats = {
    totalTrianglesBaseline: 0,
    totalTrianglesWithLOD: 0,
    renderTimeMs: 0,
    lodBreakdown: {
      [LODLevel.FULL_DETAIL]: 0,
      [LODLevel.SIMPLIFIED]: 0,
      [LODLevel.STATISTICAL]: 0,
      [LODLevel.AGGREGATE]: 0
    }
  };

  constructor(config: Partial<LODRenderingConfig> = {}) {
    this.config = {
      enableLOD: true,
      enableAdaptiveQuality: true,
      performanceTargetFPS: 60,
      aggressiveCulling: false,
      debugLODLevels: false,
      ...config
    };

    // Initialize enhanced LOD system
    this.lodSystem = new EnhancedLODSystem({
      enabled: this.config.enableLOD,
      distances: {
        fullDetail: 30,
        simplified: 80,
        statistical: 180,
        aggregate: Number.MAX_VALUE
      },
      maxAntsPerLOD: {
        fullDetail: 400,
        simplified: 1500,
        statistical: 8000,
        aggregate: Number.MAX_VALUE
      },
      adaptiveThresholds: {
        performanceTarget: this.config.performanceTargetFPS,
        qualityReduction: 0.75
      }
    });

    console.log('🎯 LOD Rendering Integration initialized');
    console.log(`   Target FPS: ${this.config.performanceTargetFPS}`);
    console.log(`   Adaptive quality: ${this.config.enableAdaptiveQuality ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Set adaptive LOD controller
   */
  public setAdaptiveLODController(controller: AdaptiveLODController): void {
    this.adaptiveLODController = controller;
    this.lodSystem.setAdaptiveLODController(controller);
    console.log('🧠 Adaptive LOD controller connected to rendering integration');
  }

  /**
   * Register geometry for LOD level
   */
  public registerGeometry(
    lodLevel: LODLevel,
    geometry: THREE.BufferGeometry,
    triangleCount: number
  ): void {
    this.geometryMapping[lodLevel] = {
      geometry,
      triangleCount,
      complexityScore: this.calculateGeometryComplexity(geometry, triangleCount)
    };

    console.log(`📐 Registered ${LODLevel[lodLevel]} geometry: ${triangleCount} triangles`);
  }

  /**
   * Process ant render data with LOD optimization
   */
  public processAntsForRendering(
    antData: AntRenderData[],
    cameraPosition: { x: number; y: number; z: number },
    currentFPS: number
  ): {
    lodData: LODRenderData[];
    renderInstructions: LODRenderInstructions;
    performanceMetrics: any;
  } {
    this.frameCount++;
    this.currentFPS = currentFPS;

    const startTime = performance.now();

    // Update camera position in LOD system
    this.lodSystem.updateCameraPosition(cameraPosition);

    // Process ants through LOD system
    const lodData = this.lodSystem.processAntRenderData(antData, currentFPS);

    // Generate render instructions
    const renderInstructions = this.generateRenderInstructions(lodData);

    // Calculate performance metrics
    const processingTime = performance.now() - startTime;
    this.updateRenderStats(lodData, processingTime);

    // Get comprehensive metrics
    const lodMetrics = this.lodSystem.getPerformanceMetrics();
    const performanceMetrics = {
      lodSystem: lodMetrics,
      rendering: this.renderStats,
      processingTimeMs: processingTime,
      frameCount: this.frameCount
    };

    return {
      lodData,
      renderInstructions,
      performanceMetrics
    };
  }

  /**
   * Generate optimized render instructions
   */
  private generateRenderInstructions(lodData: LODRenderData[]): LODRenderInstructions {
    const instructions: LODRenderInstructions = {
      [LODLevel.FULL_DETAIL]: [],
      [LODLevel.SIMPLIFIED]: [],
      [LODLevel.STATISTICAL]: [],
      [LODLevel.AGGREGATE]: []
    };

    // Group ants by LOD level for batched rendering
    for (const ant of lodData) {
      instructions[ant.lodLevel].push({
        antId: ant.id,
        position: ant.position,
        rotation: { x: 0, y: ant.rotation || 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        color: this.getAntColor(ant),
        priority: ant.renderPriority,
        geometryComplexity: ant.geometryComplexity
      });
    }

    // Sort each LOD group by priority for optimal rendering
    for (const lodLevel of [LODLevel.FULL_DETAIL, LODLevel.SIMPLIFIED, LODLevel.STATISTICAL, LODLevel.AGGREGATE]) {
      instructions[lodLevel].sort((a: RenderInstruction, b: RenderInstruction) => b.priority - a.priority);
    }

    return instructions;
  }

  /**
   * Get ant color based on caste and state
   */
  private getAntColor(ant: LODRenderData): { r: number; g: number; b: number } {
    const casteColors: Record<string, { r: number; g: number; b: number }> = {
      worker: { r: 0.5, g: 0.3, b: 0.1 },   // Brown
      soldier: { r: 0.7, g: 0.1, b: 0.1 },  // Red-brown
      queen: { r: 0.8, g: 0.6, b: 0.2 },    // Golden
      scout: { r: 0.3, g: 0.5, b: 0.2 }     // Greenish
    };

    let baseColor = casteColors[ant.caste as string] || casteColors.worker;

    // Modify color based on ant state
    if (ant.energy < 0.3) {
      // Low energy - darker
      baseColor = {
        r: baseColor.r * 0.7,
        g: baseColor.g * 0.7,
        b: baseColor.b * 0.7
      };
    }

    // Debug coloring for LOD levels
    if (this.config.debugLODLevels) {
      const lodColors = {
        [LODLevel.FULL_DETAIL]: { r: 0.0, g: 1.0, b: 0.0 },    // Green
        [LODLevel.SIMPLIFIED]: { r: 1.0, g: 1.0, b: 0.0 },     // Yellow
        [LODLevel.STATISTICAL]: { r: 1.0, g: 0.5, b: 0.0 },    // Orange
        [LODLevel.AGGREGATE]: { r: 1.0, g: 0.0, b: 0.0 }       // Red
      };
      baseColor = lodColors[ant.lodLevel];
    }

    return baseColor;
  }

  /**
   * Calculate geometry complexity score
   */
  private calculateGeometryComplexity(
    geometry: THREE.BufferGeometry,
    triangleCount: number
  ): number {
    // Base complexity from triangle count
    let complexity = triangleCount / 1000; // Normalize to 1000 triangles = 1.0

    // Add complexity for additional attributes
    if (geometry.attributes.normal) complexity += 0.1;
    if (geometry.attributes.uv) complexity += 0.1;
    if (geometry.attributes.color) complexity += 0.05;

    return Math.max(0.1, complexity);
  }

  /**
   * Update render statistics
   */
  private updateRenderStats(lodData: LODRenderData[], processingTime: number): void {
    this.renderStats.renderTimeMs = processingTime;

    // Reset counters
    this.renderStats.totalTrianglesBaseline = lodData.length * 1000; // Assume 1000 triangles per full detail ant
    this.renderStats.totalTrianglesWithLOD = 0;
    
    // Reset LOD breakdown
    this.renderStats.lodBreakdown[LODLevel.FULL_DETAIL] = 0;
    this.renderStats.lodBreakdown[LODLevel.SIMPLIFIED] = 0;
    this.renderStats.lodBreakdown[LODLevel.STATISTICAL] = 0;
    this.renderStats.lodBreakdown[LODLevel.AGGREGATE] = 0;

    // Calculate actual triangle usage
    for (const ant of lodData) {
      const geometryData = this.geometryMapping[ant.lodLevel];
      if (geometryData) {
        this.renderStats.totalTrianglesWithLOD += geometryData.triangleCount;
      }
      this.renderStats.lodBreakdown[ant.lodLevel]++;
    }

    // Log performance improvements periodically
    if (this.frameCount % 300 === 0) { // Every 5 seconds at 60 FPS
      const triangleSavings = 1.0 - (this.renderStats.totalTrianglesWithLOD / this.renderStats.totalTrianglesBaseline);
      console.log(`🎯 LOD Rendering: ${(triangleSavings * 100).toFixed(1)}% triangle reduction, ${lodData.length} ants processed in ${processingTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get current render statistics
   */
  public getRenderStats(): typeof this.renderStats {
    return { ...this.renderStats };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<LODRenderingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update LOD system configuration
    this.lodSystem.updateConfig({
      enabled: this.config.enableLOD,
      adaptiveThresholds: {
        performanceTarget: this.config.performanceTargetFPS,
        qualityReduction: 0.75
      }
    });

    console.log('🎯 LOD rendering configuration updated');
  }

  /**
   * Enable/disable LOD system
   */
  public setEnabled(enabled: boolean): void {
    this.config.enableLOD = enabled;
    this.lodSystem.setEnabled(enabled);
    console.log(`🎯 LOD rendering ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get comprehensive performance metrics
   */
  public getPerformanceMetrics(): {
    lodSystem: any;
    rendering: any;
    frameCount: number;
    currentFPS: number;
    estimatedSpeedup: number;
  } {
    const lodMetrics = this.lodSystem.getPerformanceMetrics();
    const triangleSavings = 1.0 - (this.renderStats.totalTrianglesWithLOD / Math.max(1, this.renderStats.totalTrianglesBaseline));
    
    return {
      lodSystem: lodMetrics,
      rendering: this.renderStats,
      frameCount: this.frameCount,
      currentFPS: this.currentFPS,
      estimatedSpeedup: 1.0 + (triangleSavings * 2.0) // Conservative estimate
    };
  }
}

// Supporting interfaces
interface LODRenderInstructions {
  [LODLevel.FULL_DETAIL]: RenderInstruction[];
  [LODLevel.SIMPLIFIED]: RenderInstruction[];
  [LODLevel.STATISTICAL]: RenderInstruction[];
  [LODLevel.AGGREGATE]: RenderInstruction[];
}

interface RenderInstruction {
  antId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
  priority: number;
  geometryComplexity: number;
}