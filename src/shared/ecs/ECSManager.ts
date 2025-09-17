/**
 * ECS Integration for MyAnts Simulation
 * Phase 3 Architecture Improvement - Complete ECS system integration
 * 
 * Provides unified interface for ECS system initialization and management
 * Integrates with existing simulation engine and configuration system
 */

import { 
  World, 
  ecsWorld,
  EntityId,
  Transform,
  Velocity,
  Health,
  Energy,
  AntIdentity,
  Task,
  AI,
} from './ECSCore';

import {
  MovementSystem,
  HealthSystem,
  EnergySystem,
  AIDecisionSystem,
  TaskExecutionSystem,
  PheromoneSystem,
  CollisionSystem,
  AgingSystem,
  ecsSystems,
} from './ECSSystems';

import { 
  EntityFactory, 
  createEntityFactory, 
  createSimulationEnvironment, 
} from './EntityFactory';

import { SimulationConfiguration } from '../types-enhanced';
import { configurationManager } from '../config/ConfigurationManager';
import { dataCompressionSystem } from '../compression/DataCompressionSystem';

// ============================================================================
// ECS Manager Class
// ============================================================================

export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory;
  private isInitialized = false;
  private lastUpdateTime = 0;
  private performanceMetrics = {
    averageFrameTime: 0,
    entitiesCount: 0,
    systemsCount: 0,
    lastFrameTime: 0,
  };

  constructor() {
    this.world = ecsWorld;
    this.entityFactory = createEntityFactory(this.world);
  }

  /**
   * Initialize the ECS system with all required systems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('ECS Manager already initialized');
      return;
    }

    try {
      console.log('🔧 Initializing ECS Manager...');

      // Initialize core systems in priority order
      this.world.addSystem(new CollisionSystem());
      this.world.addSystem(new MovementSystem());
      this.world.addSystem(new HealthSystem());
      this.world.addSystem(new EnergySystem());
      this.world.addSystem(new AIDecisionSystem());
      this.world.addSystem(new TaskExecutionSystem());
      this.world.addSystem(new PheromoneSystem());
      this.world.addSystem(new AgingSystem());

      // Subscribe to configuration changes
      configurationManager.subscribe((config) => {
        this.updateSystemsConfiguration(config);
      });

      this.isInitialized = true;
      this.lastUpdateTime = performance.now();

      console.log('✅ ECS Manager initialized with', this.world.getSystemCount(), 'systems');

    } catch (error) {
      console.error('❌ Failed to initialize ECS Manager:', error);
      throw error;
    }
  }

  /**
   * Update all ECS systems
   */
  update(): void {
    if (!this.isInitialized) {
      console.warn('ECS Manager not initialized');
      return;
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    
    // Update the world (all systems)
    this.world.update(deltaTime);

    // Update performance metrics
    this.updatePerformanceMetrics(currentTime, deltaTime);
    
    this.lastUpdateTime = currentTime;
  }

  /**
   * Create a complete simulation environment
   */
  createSimulation(): {
    colonyId: EntityId;
    ants: EntityId[];
    foodSources: EntityId[];
    environment: any;
  } {
    if (!this.isInitialized) {
      throw new Error('ECS Manager must be initialized before creating simulation');
    }

    console.log('🌍 Creating simulation environment...');
    
    const environment = createSimulationEnvironment(this.world);
    
    console.log('✅ Simulation environment created:', {
      ants: environment.colony.ants.length,
      foodSources: environment.foodSources.length,
      entities: this.world.entityManager.getEntityCount(),
    });

    return {
      colonyId: environment.colony.colonyId,
      ants: environment.colony.ants,
      foodSources: environment.foodSources,
      environment,
    };
  }

  /**
   * Get all ant entities with their current data
   */
  getAntData(): Array<{
    id: EntityId;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    health: number;
    energy: number;
    caste: string;
    task: string;
    age: number;
  }> {
    const ants: any[] = [];
    
    // Query all entities with ant identity
    const antEntities = this.world.query({ with: [AntIdentity.type] });
    
    for (const entityId of antEntities) {
      const transform = this.world.entityManager.getComponent<Transform>(entityId, Transform.type);
      const velocity = this.world.entityManager.getComponent<Velocity>(entityId, Velocity.type);
      const health = this.world.entityManager.getComponent<Health>(entityId, Health.type);
      const energy = this.world.entityManager.getComponent<Energy>(entityId, Energy.type);
      const identity = this.world.entityManager.getComponent<AntIdentity>(entityId, AntIdentity.type);
      const task = this.world.entityManager.getComponent<Task>(entityId, Task.type);

      if (transform && identity) {
        ants.push({
          id: entityId,
          position: { x: transform.x, y: transform.y, z: transform.z },
          velocity: velocity ? { x: velocity.x, y: velocity.y, z: velocity.z } : { x: 0, y: 0, z: 0 },
          health: health ? health.current : 0,
          energy: energy ? energy.current : 0,
          caste: identity.caste,
          task: task ? task.currentTask : 'idle',
          age: identity.age,
        });
      }
    }

    return ants;
  }

  /**
   * Get simulation statistics
   */
  getSimulationStats(): {
    entities: {
      total: number;
      ants: number;
      foodSources: number;
      pheromones: number;
    };
    performance: {
      frameTime: number;
      averageFrameTime: number;
      fps: number;
    };
    systems: {
      count: number;
      enabled: number;
    };
  } {
    const antEntities = this.world.query({ with: [AntIdentity.type] });
    const foodEntities = this.world.query({ with: ['Inventory'], without: [AntIdentity.type] });
    const pheromoneEntities = this.world.query({ with: ['Pheromone'] });

    const systemsCount = this.world.getSystemCount();
    const enabledSystems = this.world.getEnabledSystemCount();

    return {
      entities: {
        total: this.world.entityManager.getEntityCount(),
        ants: antEntities.length,
        foodSources: foodEntities.length,
        pheromones: pheromoneEntities.length,
      },
      performance: {
        frameTime: this.performanceMetrics.lastFrameTime,
        averageFrameTime: this.performanceMetrics.averageFrameTime,
        fps: this.performanceMetrics.averageFrameTime > 0 ? 1000 / this.performanceMetrics.averageFrameTime : 0,
      },
      systems: {
        count: systemsCount,
        enabled: enabledSystems,
      },
    };
  }

  /**
   * Serialize simulation state for persistence
   */
  async serializeState(): Promise<any> {
    const antData = this.getAntData();
    const stats = this.getSimulationStats();
    
    // Create positions array for compression
    const positions = new Float32Array(antData.length * 3);
    const states = new Float32Array(antData.length * 10); // 10 state fields per ant
    
    for (let i = 0; i < antData.length; i++) {
      const ant = antData[i];
      const basePos = i * 3;
      const baseState = i * 10;
      
      // Positions
      positions[basePos] = ant.position.x;
      positions[basePos + 1] = ant.position.y;
      positions[basePos + 2] = ant.position.z;
      
      // States
      states[baseState] = ant.health;
      states[baseState + 1] = ant.energy;
      states[baseState + 2] = ant.velocity.x;
      states[baseState + 3] = ant.velocity.y;
      states[baseState + 4] = ant.velocity.z;
      states[baseState + 5] = ant.age;
      states[baseState + 6] = ant.caste === 'worker' ? 0 : ant.caste === 'scout' ? 1 : ant.caste === 'soldier' ? 2 : 3;
      states[baseState + 7] = 0; // Reserved
      states[baseState + 8] = 0; // Reserved
      states[baseState + 9] = 0; // Reserved
    }

    const simulationState = {
      ants: {
        positions,
        states,
        count: antData.length,
      },
      environment: {
        pheromones: new Float32Array(0), // Would contain pheromone grid data
        temperature: new Float32Array(0), // Would contain temperature data
        humidity: new Float32Array(0), // Would contain humidity data
        dimensions: { width: 200, height: 200 },
      },
      ai: {
        memory: new Float32Array(0), // Would contain AI memory data
        decisions: new Float32Array(0),
      },
      physics: {
        forces: new Float32Array(0), // Would contain physics forces
        velocities: new Float32Array(0),
      },
      metadata: {
        simulationTime: performance.now(),
        frameCount: this.performanceMetrics.entitiesCount,
      },
    };

    try {
      const compressedState = await dataCompressionSystem.compressSimulationState(simulationState);
      return compressedState;
    } catch (error) {
      console.warn('Failed to compress state, returning uncompressed:', error);
      return simulationState;
    }
  }

  /**
   * Deserialize and restore simulation state
   */
  async deserializeState(stateData: any): Promise<void> {
    try {
      // Clear current simulation
      this.clearSimulation();

      let simulationState;
      
      // Check if data is compressed
      if (stateData.metadata && stateData.chunks) {
        simulationState = await dataCompressionSystem.decompressSimulationState(stateData);
      } else {
        simulationState = stateData;
      }

      // Recreate entities from state data
      await this.recreateEntitiesFromState(simulationState);
      
      console.log('✅ Simulation state restored');
      
    } catch (error) {
      console.error('❌ Failed to deserialize simulation state:', error);
      throw error;
    }
  }

  /**
   * Clear all entities from the simulation
   */
  clearSimulation(): void {
    this.world.entityManager.clear();
    console.log('🧹 Simulation cleared');
  }

  /**
   * Enable or disable a system
   */
  setSystemEnabled(systemName: string, enabled: boolean): boolean {
    const system = this.world.getSystem(systemName);
    if (system) {
      (system as any).enabled = enabled;
      console.log(`🔧 System '${systemName}' ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * Get the ECS world instance
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Get the entity factory
   */
  getEntityFactory(): EntityFactory {
    return this.entityFactory;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private updateSystemsConfiguration(config: SimulationConfiguration): void {
    // Update system configurations based on simulation configuration
    // This could disable certain systems based on performance settings
    
    if (config.performance.memoryLimit < 4096) {
      // Disable some systems for low memory
      this.setSystemEnabled('PheromoneSystem', false);
    } else {
      this.setSystemEnabled('PheromoneSystem', true);
    }

    if (!config.performance.multiThreading) {
      // Adjust AI decision frequency for single-threaded performance
      const aiSystem = this.world.getSystem('AIDecisionSystem') as AIDecisionSystem;
      if (aiSystem) {
        // Could adjust AI update frequency here
      }
    }
  }

  private updatePerformanceMetrics(currentTime: number, deltaTime: number): void {
    this.performanceMetrics.lastFrameTime = currentTime - this.lastUpdateTime;
    this.performanceMetrics.averageFrameTime = 
      (this.performanceMetrics.averageFrameTime * 0.9) + (this.performanceMetrics.lastFrameTime * 0.1);
    this.performanceMetrics.entitiesCount = this.world.entityManager.getEntityCount();
    this.performanceMetrics.systemsCount = this.world.getSystemCount();
  }

  private async recreateEntitiesFromState(simulationState: any): Promise<void> {
    if (!simulationState.ants || !simulationState.ants.positions) {
      return;
    }

    const antCount = simulationState.ants.count || 0;
    const positions = simulationState.ants.positions;
    const states = simulationState.ants.states;

    // Recreate ants
    for (let i = 0; i < antCount; i++) {
      const basePos = i * 3;
      const baseState = i * 10;

      const position = {
        x: positions[basePos] || 0,
        y: positions[basePos + 1] || 0,
        z: positions[basePos + 2] || 0,
      };

      const health = states[baseState] || 100;
      const energy = states[baseState + 1] || 100;
      const casteIndex = states[baseState + 6] || 0;
      const caste = ['worker', 'scout', 'soldier', 'nurse'][casteIndex] || 'worker';

      // Create ant based on caste
      let antId: EntityId;
      switch (caste) {
        case 'scout':
          antId = this.entityFactory.createScoutAnt(position);
          break;
        case 'soldier':
          antId = this.entityFactory.createSoldierAnt(position);
          break;
        case 'nurse':
          antId = this.entityFactory.createNurseAnt(position);
          break;
        default:
          antId = this.entityFactory.createWorkerAnt(position);
          break;
      }

      // Restore ant state
      const healthComp = this.world.entityManager.getComponent<Health>(antId, Health.type);
      const energyComp = this.world.entityManager.getComponent<Energy>(antId, Energy.type);
      const velocityComp = this.world.entityManager.getComponent<Velocity>(antId, Velocity.type);
      const identityComp = this.world.entityManager.getComponent<AntIdentity>(antId, AntIdentity.type);

      if (healthComp) healthComp.current = health;
      if (energyComp) energyComp.current = energy;
      if (velocityComp) {
        velocityComp.x = states[baseState + 2] || 0;
        velocityComp.y = states[baseState + 3] || 0;
        velocityComp.z = states[baseState + 4] || 0;
      }
      if (identityComp) {
        identityComp.age = states[baseState + 5] || 0;
      }
    }
  }
}

// ============================================================================
// Export Global ECS Manager Instance
// ============================================================================

export const ecsManager = new ECSManager();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize the ECS system for the simulation
 */
export async function initializeECS(): Promise<ECSManager> {
  await ecsManager.initialize();
  return ecsManager;
}

/**
 * Create a complete simulation with ECS
 */
export async function createECSSimulation(): Promise<{
  manager: ECSManager;
  simulation: {
    colonyId: EntityId;
    ants: EntityId[];
    foodSources: EntityId[];
  };
}> {
  await ecsManager.initialize();
  const simulation = ecsManager.createSimulation();
  
  return {
    manager: ecsManager,
    simulation,
  };
}

/**
 * Get current simulation data in a format compatible with existing systems
 */
export function getSimulationData(): {
  ants: Array<{
    id: EntityId;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    health: number;
    energy: number;
    caste: string;
    task: string;
    age: number;
  }>;
  stats: any;
} {
  return {
    ants: ecsManager.getAntData(),
    stats: ecsManager.getSimulationStats(),
  };
}

// Export core ECS components for external use
export * from './ECSCore';
export * from './ECSSystems';
export * from './EntityFactory';