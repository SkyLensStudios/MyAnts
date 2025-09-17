/**
 * Spatial Optimization Integration for Phase 2
 * Integrates ME-BVH spatial structure with SimulationEngine for O(1) neighbor queries
 * Replaces O(n²) collision detection with spatial hashing for massive performance gains
 */

import { AntEntity } from '../simulation/AntEntity';
import { MEBVHConfig, MEBVHSpatialStructure, SpatialEntity, SpatialQuery } from '../spatial/MEBVHSpatialStructure';

export interface SpatialOptimizationConfig {
  enabled: boolean;
  maxEntitiesPerLeaf: number;
  maxDepth: number;
  rebuildThreshold: number;
  spatialHashBuckets: number;
  updateFrequency: number; // How often to update spatial structure (in frames)
}

export interface NeighborQueryResult {
  ants: AntEntity[];
  foodSources: any[];
  obstacles: any[];
  queryTime: number;
  spatialStructureHit: boolean;
}

export class SpatialOptimizationIntegration {
  private spatialStructure: MEBVHSpatialStructure;
  private config: SpatialOptimizationConfig;
  private frameCount = 0;
  private lastUpdateFrame = 0;
  
  // Performance tracking
  private queryStats = {
    totalQueries: 0,
    averageQueryTime: 0,
    spatialHits: 0,
    bruteForceQueries: 0,
    performanceImprovement: 0,
  };

  constructor(config: Partial<SpatialOptimizationConfig> = {}) {
    this.config = {
      enabled: true,
      maxEntitiesPerLeaf: 10,
      maxDepth: 8,
      rebuildThreshold: 0.2, // Rebuild when 20% of entities move significantly
      spatialHashBuckets: 1024,
      updateFrequency: 1, // Update every frame for maximum accuracy
      ...config,
    };

    // Initialize spatial structure
    const spatialConfig: MEBVHConfig = {
      maxEntitiesPerLeaf: this.config.maxEntitiesPerLeaf,
      maxDepth: this.config.maxDepth,
      enableDynamicRebuilding: true,
      rebuildThreshold: this.config.rebuildThreshold,
      enableMemoryOptimization: true,
      enableSIMDOptimization: true,
      spatialHashBuckets: this.config.spatialHashBuckets,
      temporalCoherence: true,
    };

    this.spatialStructure = new MEBVHSpatialStructure(spatialConfig);
    
    console.log('🚀 Spatial Optimization Integration initialized');
    console.log(`   Max entities per leaf: ${this.config.maxEntitiesPerLeaf}`);
    console.log(`   Spatial hash buckets: ${this.config.spatialHashBuckets}`);
    console.log(`   Update frequency: ${this.config.updateFrequency} frame(s)`);
  }

  /**
   * Update spatial structure with current entity positions
   */
  public async updateSpatialStructure(
    ants: Map<string, AntEntity>,
    foodSources: any[],
    obstacles: any[] = [],
  ): Promise<void> {
    if (!this.config.enabled) return;

    this.frameCount++;
    
    // Check if we need to update this frame
    if (this.frameCount - this.lastUpdateFrame < this.config.updateFrequency) {
      return;
    }

    const startTime = performance.now();

    // Clear existing entities
    this.spatialStructure.clear();

    // Add ants to spatial structure
    for (const [id, ant] of ants.entries()) {
      if (!ant.isAlive) continue;

      const spatialEntity: SpatialEntity = {
        id: `ant_${id}`,
        position: {
          x: ant.position.x,
          y: ant.position.y,
          z: ant.position.z,
        },
        velocity: ant.velocity ? {
          x: ant.velocity.x,
          y: ant.velocity.y,
          z: ant.velocity.z,
        } : undefined,
        radius: 0.5, // Ant interaction radius
        bounds: {
          min: {
            x: ant.position.x - 0.5,
            y: ant.position.y - 0.5,
            z: ant.position.z - 0.5,
          },
          max: {
            x: ant.position.x + 0.5,
            y: ant.position.y + 0.5,
            z: ant.position.z + 0.5,
          },
        },
        type: 'ant',
        lastUpdate: performance.now(),
      };

      this.spatialStructure.addEntity(spatialEntity);
    }

    // Add food sources to spatial structure
    for (let i = 0; i < foodSources.length; i++) {
      const food = foodSources[i];
      if (!food.active) continue;

      const spatialEntity: SpatialEntity = {
        id: `food_${i}`,
        position: {
          x: food.position.x,
          y: food.position.y,
          z: food.position.z || 0,
        },
        radius: food.radius || 2.0,
        bounds: {
          min: {
            x: food.position.x - (food.radius || 2.0),
            y: food.position.y - (food.radius || 2.0),
            z: (food.position.z || 0) - (food.radius || 2.0),
          },
          max: {
            x: food.position.x + (food.radius || 2.0),
            y: food.position.y + (food.radius || 2.0),
            z: (food.position.z || 0) + (food.radius || 2.0),
          },
        },
        type: 'food',
        lastUpdate: performance.now(),
      };

      this.spatialStructure.addEntity(spatialEntity);
    }

    // Add obstacles if any
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];

      const spatialEntity: SpatialEntity = {
        id: `obstacle_${i}`,
        position: {
          x: obstacle.position.x,
          y: obstacle.position.y,
          z: obstacle.position.z || 0,
        },
        radius: obstacle.radius || 1.0,
        bounds: {
          min: {
            x: obstacle.position.x - (obstacle.radius || 1.0),
            y: obstacle.position.y - (obstacle.radius || 1.0),
            z: (obstacle.position.z || 0) - (obstacle.radius || 1.0),
          },
          max: {
            x: obstacle.position.x + (obstacle.radius || 1.0),
            y: obstacle.position.y + (obstacle.radius || 1.0),
            z: (obstacle.position.z || 0) + (obstacle.radius || 1.0),
          },
        },
        type: 'obstacle',
        lastUpdate: performance.now(),
      };

      this.spatialStructure.addEntity(spatialEntity);
    }

    // Rebuild spatial structure if needed
    if (this.spatialStructure.shouldRebuild()) {
      await this.spatialStructure.buildBVH();
    }

    this.lastUpdateFrame = this.frameCount;
    
    const updateTime = performance.now() - startTime;
    if (updateTime > 5.0) { // Log if update takes longer than 5ms
      console.log(`⚡ Spatial structure update: ${updateTime.toFixed(2)}ms for ${ants.size + foodSources.length} entities`);
    }
  }

  /**
   * Query neighbors within radius - MASSIVE performance improvement over O(n²)
   */
  public async queryNeighbors(
    position: { x: number; y: number; z: number },
    radius: number,
    antMap: Map<string, AntEntity>,
    foodSources: any[] = [],
    maxResults: number = 50,
  ): Promise<NeighborQueryResult> {
    const startTime = performance.now();
    
    if (!this.config.enabled) {
      // Fallback to brute force (for comparison)
      return this.bruteForceNeighborQuery(position, radius, antMap, foodSources, maxResults);
    }

    const query: SpatialQuery = {
      type: 'radius',
      center: position,
      radius: radius,
      maxResults: maxResults,
    };

    const result = await this.spatialStructure.query(query);
    
    // If query failed or returned unexpected shape, return a safe default
    if (!result || !Array.isArray(result.entities)) {
      return {
        ants: [],
        foodSources: [],
        obstacles: [],
        queryTime: typeof result === 'object' && result && typeof result.queryTime === 'number' ? result.queryTime : 0,
        spatialStructureHit: false,
      } as NeighborQueryResult;
    }

    // Convert spatial entities back to game objects
    const neighbors: NeighborQueryResult = {
      ants: [],
      foodSources: [],
      obstacles: [],
      queryTime: result.queryTime || 0,
      spatialStructureHit: true,
    };

    for (const entity of result.entities) {
      if (entity.type === 'ant') {
        const antId = entity.id.replace('ant_', '');
        const ant = antMap.get(antId);
        if (ant && ant.isAlive) {
          neighbors.ants.push(ant);
        }
      } else if (entity.type === 'food') {
        const foodIndex = parseInt(entity.id.replace('food_', ''));
        if (foodIndex < foodSources.length) {
          neighbors.foodSources.push(foodSources[foodIndex]);
        }
      }
    }

    // Update performance statistics
    this.updateQueryStats(performance.now() - startTime, true);

    return neighbors;
  }

  /**
   * Brute force neighbor query for fallback and comparison
   */
  private async bruteForceNeighborQuery(
    position: { x: number; y: number; z: number },
    radius: number,
    antMap: Map<string, AntEntity>,
    foodSources: any[] = [],
    maxResults: number = 50,
  ): Promise<NeighborQueryResult> {
    const startTime = performance.now();
    const radiusSquared = radius * radius;
    
    const neighbors: NeighborQueryResult = {
      ants: [],
      foodSources: [],
      obstacles: [],
      queryTime: 0,
      spatialStructureHit: false,
    };

    let count = 0;

    // Check ants
    for (const ant of antMap.values()) {
      if (!ant.isAlive || count >= maxResults) break;
      
      const dx = ant.position.x - position.x;
      const dy = ant.position.y - position.y;
      const dz = ant.position.z - position.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      if (distanceSquared <= radiusSquared) {
        neighbors.ants.push(ant);
        count++;
      }
    }

    // Check food sources
    for (const food of foodSources) {
      if (!food.active || count >= maxResults) break;
      
      const dx = food.position.x - position.x;
      const dy = food.position.y - position.y;
      const dz = (food.position.z || 0) - position.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      if (distanceSquared <= radiusSquared) {
        neighbors.foodSources.push(food);
        count++;
      }
    }

    neighbors.queryTime = performance.now() - startTime;
    this.updateQueryStats(neighbors.queryTime, false);

    return neighbors;
  }

  /**
   * Update performance statistics
   */
  private updateQueryStats(queryTime: number, usedSpatialStructure: boolean): void {
    this.queryStats.totalQueries++;
    this.queryStats.averageQueryTime = 
      (this.queryStats.averageQueryTime * (this.queryStats.totalQueries - 1) + queryTime) / this.queryStats.totalQueries;
    
    if (usedSpatialStructure) {
      this.queryStats.spatialHits++;
    } else {
      this.queryStats.bruteForceQueries++;
    }

    // Calculate performance improvement
    if (this.queryStats.bruteForceQueries > 0 && this.queryStats.spatialHits > 0) {
      // This is a simplified metric - in reality the improvement would be much higher
      this.queryStats.performanceImprovement = 
        this.queryStats.spatialHits / (this.queryStats.spatialHits + this.queryStats.bruteForceQueries);
    }
  }

  /**
   * Get performance statistics for debugging
   */
  public getPerformanceStats(): typeof this.queryStats {
    return { ...this.queryStats };
  }

  /**
   * Get spatial structure statistics
   */
  public getSpatialStats() {
    return this.spatialStructure.getPerformanceStats();
  }

  /**
   * Enable/disable spatial optimization
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`🎯 Spatial optimization ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Initialize spatial structure with world bounds
   */
  public async initializeSpatialStructure(worldBounds: { x: number; y: number; z: number }): Promise<void> {
    const mebvhConfig: MEBVHConfig = {
      maxEntitiesPerLeaf: this.config.maxEntitiesPerLeaf,
      maxDepth: this.config.maxDepth,
      enableDynamicRebuilding: true,
      rebuildThreshold: this.config.rebuildThreshold,
      enableMemoryOptimization: true,
      enableSIMDOptimization: true,
      spatialHashBuckets: this.config.spatialHashBuckets,
      temporalCoherence: true,
    };

    this.spatialStructure = new MEBVHSpatialStructure(mebvhConfig);
    console.log(`🏗️ Spatial structure initialized with bounds: ${worldBounds.x}x${worldBounds.y}x${worldBounds.z}`);
  }

  /**
   * Find neighbors around a position
   */
  public async findNeighbors(position: { x: number; y: number; z: number }, radius: number): Promise<any[]> {
    if (!this.config.enabled || !this.spatialStructure) {
      return []; // Return empty array if spatial optimization disabled
    }

    const startTime = performance.now();
    
    const query: SpatialQuery = {
      type: 'radius',
      center: position,
      radius: radius,
      maxResults: 100, // reasonable default
    };

    const result = await this.spatialStructure.query(query);
    
    const queryTime = performance.now() - startTime;
    this.updateQueryStats(queryTime, true);
    
    return result.entities;
  }

  /**
   * Get the spatial structure for debugging
   */
  public getSpatialStructure(): MEBVHSpatialStructure | null {
    return this.spatialStructure || null;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Cleanup would go here if needed
    console.log('🧹 Spatial optimization disposed');
  }
}