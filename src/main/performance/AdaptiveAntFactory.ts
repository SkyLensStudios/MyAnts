/**
 * Adaptive Ant Factory
 * Creates and manages different ant implementations based on LOD level
 */

import { LODLevel } from './LODSystem';
import { AntEntity } from '../simulation/AntEntity';
import { AntCaste } from '../../../engine/colony/casteSystem';
import { Vector3D } from '../../shared/types';

export interface AntBehaviorConfig {
  hasMemory: boolean;
  hasLearning: boolean;
  hasComplexAI: boolean;
  hasGenetics: boolean;
  hasPhysiology: boolean;
  updateFrequency: number;
  pathfindingComplexity: 'simple' | 'complex' | 'statistical';
  socialInteractions: boolean;
}

export interface StatisticalAntData {
  id: string;
  position: Vector3D;
  groupId: string;
  flowVector: Vector3D;
  density: number;
  lastUpdate: number;
}

/**
 * Manages different ant implementations for each LOD level
 */
export class AdaptiveAntFactory {
  private behaviorConfigs: Map<LODLevel, AntBehaviorConfig>;

  constructor() {
    this.behaviorConfigs = this.initializeBehaviorConfigs();
  }

  /**
   * Initialize behavior configurations for each LOD level
   */
  private initializeBehaviorConfigs(): Map<LODLevel, AntBehaviorConfig> {
    return new Map([
      [LODLevel.FULL_DETAIL, {
        hasMemory: true,
        hasLearning: true,
        hasComplexAI: true,
        hasGenetics: true,
        hasPhysiology: true,
        updateFrequency: 60,
        pathfindingComplexity: 'complex',
        socialInteractions: true
      }],
      [LODLevel.SIMPLIFIED, {
        hasMemory: false,
        hasLearning: false,
        hasComplexAI: false,
        hasGenetics: true,
        hasPhysiology: false,
        updateFrequency: 30,
        pathfindingComplexity: 'simple',
        socialInteractions: true
      }],
      [LODLevel.STATISTICAL, {
        hasMemory: false,
        hasLearning: false,
        hasComplexAI: false,
        hasGenetics: false,
        hasPhysiology: false,
        updateFrequency: 10,
        pathfindingComplexity: 'statistical',
        socialInteractions: false
      }],
      [LODLevel.AGGREGATE, {
        hasMemory: false,
        hasLearning: false,
        hasComplexAI: false,
        hasGenetics: false,
        hasPhysiology: false,
        updateFrequency: 1,
        pathfindingComplexity: 'statistical',
        socialInteractions: false
      }]
    ]);
  }

  /**
   * Create or upgrade ant to specified LOD level
   */
  public adaptAnt(existingAnt: AntEntity | null, targetLOD: LODLevel): AntEntity | StatisticalAntData {
    const config = this.behaviorConfigs.get(targetLOD)!;

    switch (targetLOD) {
      case LODLevel.FULL_DETAIL:
        return this.createFullDetailAnt(existingAnt);

      case LODLevel.SIMPLIFIED:
        return this.createSimplifiedAnt(existingAnt);

      case LODLevel.STATISTICAL:
      case LODLevel.AGGREGATE:
        return this.createStatisticalAnt(existingAnt);

      default:
        throw new Error(`Unknown LOD level: ${targetLOD}`);
    }
  }

  /**
   * Create full detail ant with all systems enabled
   */
  private createFullDetailAnt(existingAnt: AntEntity | null): AntEntity {
    if (existingAnt && existingAnt instanceof AntEntity) {
      // Full detail ants use all existing systems - no need to enable/disable
      return existingAnt;
    }

    // Create new full detail ant
    const ant = new AntEntity(
      Math.random().toString(36).substring(7),
      { x: 0, y: 0, z: 0 },
      AntCaste.WORKER
    );

    return ant;
  }

  /**
   * Create simplified ant with reduced complexity
   */
  private createSimplifiedAnt(existingAnt: AntEntity | null): AntEntity {
    if (existingAnt && existingAnt instanceof AntEntity) {
      // For simplified ants, we'll use the existing ant but track LOD level separately
      // The actual complexity reduction will be handled in the update logic
      return existingAnt;
    }

    // Create new simplified ant
    const ant = new AntEntity(
      Math.random().toString(36).substring(7),
      { x: 0, y: 0, z: 0 },
      AntCaste.WORKER
    );

    return ant;
  }

  /**
   * Create statistical representation for group-based processing
   */
  private createStatisticalAnt(existingAnt: AntEntity | StatisticalAntData | null): StatisticalAntData {
    const baseData = existingAnt instanceof AntEntity 
      ? {
          id: existingAnt.id,
          position: existingAnt.position,
          groupId: this.calculateGroupId(existingAnt.position),
          flowVector: { x: 0, y: 0, z: 0 },
          density: 1.0,
          lastUpdate: Date.now()
        }
      : existingAnt || {
          id: Math.random().toString(36).substring(7),
          position: { x: 0, y: 0, z: 0 },
          groupId: 'default',
          flowVector: { x: 0, y: 0, z: 0 },
          density: 1.0,
          lastUpdate: Date.now()
        };

    return {
      ...baseData,
      lastUpdate: Date.now()
    };
  }

  /**
   * Calculate group ID based on spatial position
   */
  private calculateGroupId(position: Vector3D): string {
    const gridSize = 100; // 100 unit grid
    const gridX = Math.floor(position.x / gridSize);
    const gridY = Math.floor(position.y / gridSize);
    const gridZ = Math.floor(position.z / gridSize);
    
    return `group_${gridX}_${gridY}_${gridZ}`;
  }

  /**
   * Get behavior configuration for LOD level
   */
  public getBehaviorConfig(level: LODLevel): AntBehaviorConfig {
    return this.behaviorConfigs.get(level)!;
  }

  /**
   * Check if ant needs behavior update based on LOD config
   */
  public shouldUpdateBehavior(level: LODLevel, lastUpdate: number): boolean {
    const config = this.behaviorConfigs.get(level)!;
    const updateInterval = 1000 / config.updateFrequency; // Convert to milliseconds
    
    return (Date.now() - lastUpdate) >= updateInterval;
  }

  /**
   * Get memory usage estimate for LOD level
   */
  public getMemoryEstimate(level: LODLevel): number {
    // Memory usage in KB per ant
    const memoryMap = new Map([
      [LODLevel.FULL_DETAIL, 512],   // Full AntEntity with all systems
      [LODLevel.SIMPLIFIED, 128],    // Reduced AntEntity
      [LODLevel.STATISTICAL, 32],    // Statistical data only
      [LODLevel.AGGREGATE, 8]        // Minimal statistical data
    ]);

    return memoryMap.get(level) || 512;
  }

  /**
   * Get computational complexity estimate for LOD level
   */
  public getComplexityEstimate(level: LODLevel): number {
    // Relative computational cost (0-1)
    const complexityMap = new Map([
      [LODLevel.FULL_DETAIL, 1.0],
      [LODLevel.SIMPLIFIED, 0.3],
      [LODLevel.STATISTICAL, 0.1],
      [LODLevel.AGGREGATE, 0.01]
    ]);

    return complexityMap.get(level) || 1.0;
  }
}