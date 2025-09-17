/**
 * ECS Entity Factory for MyAnts Simulation
 * Phase 3 Architecture Improvement - Entity creation and configuration
 * 
 * Provides convenient factory methods for creating different types of entities
 * Replaces monolithic entity classes with composable component-based entities
 */

import {
  World,
  EntityId,
  Transform,
  Velocity,
  Health,
  Energy,
  AntIdentity,
  Task,
  Inventory,
  Physics,
  Collision,
  AI,
  Pheromone,
  Renderable
} from './ECSCore';

import { SimulationConfiguration, AntCaste } from '../types-enhanced';
import { configurationManager } from '../config/ConfigurationManager';

// ============================================================================
// Entity Factory Class
// ============================================================================

export class EntityFactory {
  private world: World;
  private config: SimulationConfiguration;

  constructor(world: World) {
    this.world = world;
    this.config = configurationManager.getConfiguration();
    
    // Subscribe to configuration changes
    configurationManager.subscribe((newConfig) => {
      this.config = newConfig;
    });
  }

  // ============================================================================
  // Ant Entity Creation
  // ============================================================================

  /**
   * Create a worker ant entity
   */
  createWorkerAnt(position: { x: number; y: number; z: number }, colonyId: EntityId = 0): EntityId {
    const config = this.config.ants;
    
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Velocity(0, 0, 0, 2.0), // Max speed 2.0
      new Health(100, 100, 0.1), // 100 health, 0.1 regen
      new Energy(100, 100, 1.0, 0.5), // 100 energy, 1.0 consumption, 0.5 regen
      new AntIdentity('worker', 0, 1, colonyId),
      new Task('forage', 50),
      new Inventory(2), // Can carry 2 items
      new Physics(0.1, 0.3, 0.2, false, 1.0),
      new Collision('sphere', 0.3),
      new AI(
        0.5, // intelligence
        0.2, // aggressiveness
        0.7, // curiosity
        0.8  // social tendency
      ),
      new Renderable('ant_worker', 'ant_material', true, true, true, 1.0)
    );
  }

  /**
   * Create a scout ant entity
   */
  createScoutAnt(position: { x: number; y: number; z: number }, colonyId: EntityId = 0): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Velocity(0, 0, 0, 3.0), // Faster than workers
      new Health(80, 80, 0.1),
      new Energy(120, 120, 1.2, 0.6), // Higher energy for exploration
      new AntIdentity('scout', 0, 1, colonyId),
      new Task('explore', 60),
      new Inventory(1), // Light carrying capacity
      new Physics(0.08, 0.2, 0.3, false, 1.0), // Lighter, more agile
      new Collision('sphere', 0.25),
      new AI(
        0.8, // High intelligence for navigation
        0.3, // Moderate aggressiveness
        0.9, // Very curious
        0.6  // Moderate social tendency
      ),
      new Renderable('ant_scout', 'ant_material', true, true, true, 0.9)
    );
  }

  /**
   * Create a soldier ant entity
   */
  createSoldierAnt(position: { x: number; y: number; z: number }, colonyId: EntityId = 0): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Velocity(0, 0, 0, 1.5), // Slower but stronger
      new Health(150, 150, 0.05), // High health, low regen
      new Energy(80, 80, 0.8, 0.3), // Lower energy, focused on combat
      new AntIdentity('soldier', 0, 1, colonyId),
      new Task('guard', 80),
      new Inventory(0), // No carrying capacity
      new Physics(0.2, 0.4, 0.1, false, 1.0), // Heavy and stable
      new Collision('sphere', 0.4), // Larger collision radius
      new AI(
        0.6, // Moderate intelligence
        0.9, // Very aggressive
        0.3, // Low curiosity
        0.7  // Loyal to colony
      ),
      new Renderable('ant_soldier', 'ant_material', true, true, true, 1.2)
    );
  }

  /**
   * Create a nurse ant entity
   */
  createNurseAnt(position: { x: number; y: number; z: number }, colonyId: EntityId = 0): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Velocity(0, 0, 0, 1.8),
      new Health(90, 90, 0.2), // Moderate health, good regen
      new Energy(110, 110, 0.9, 0.7), // Efficient energy use
      new AntIdentity('nurse', 0, 1, colonyId),
      new Task('tend_larvae', 70),
      new Inventory(3), // Can carry supplies
      new Physics(0.09, 0.3, 0.2, false, 1.0),
      new Collision('sphere', 0.3),
      new AI(
        0.7, // High intelligence for care tasks
        0.1, // Very low aggression
        0.5, // Moderate curiosity
        0.9  // Very social
      ),
      new Renderable('ant_nurse', 'ant_material', true, true, true, 1.0)
    );
  }

  /**
   * Create a queen ant entity
   */
  createQueenAnt(position: { x: number; y: number; z: number }, colonyId: EntityId = 0): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Velocity(0, 0, 0, 0.5), // Very slow movement
      new Health(500, 500, 1.0), // Very high health and regen
      new Energy(200, 200, 0.5, 2.0), // High energy with good regen
      new AntIdentity('queen', 0, 1, colonyId),
      new Task('lay_eggs', 100),
      new Inventory(0), // No carrying
      new Physics(0.5, 0.8, 0.1, true, 0.5), // Heavy and mostly static
      new Collision('sphere', 0.8), // Large collision radius
      new AI(
        1.0, // Maximum intelligence
        0.0, // No aggression
        0.2, // Low curiosity
        1.0  // Maximum social influence
      ),
      new Renderable('ant_queen', 'ant_material_special', true, true, true, 2.0)
    );
  }

  // ============================================================================
  // Environmental Entity Creation
  // ============================================================================

  /**
   * Create a food source entity
   */
  createFoodSource(position: { x: number; y: number; z: number }, amount: number = 100): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Inventory(amount), // Food amount
      new Physics(1.0, 1.0, 0.0, true, 0.0), // Static object
      new Collision('sphere', 1.0, 1.0, 1.0, 1.0, true), // Trigger collision
      new Renderable('food_source', 'food_material', true, true, true, 1.0)
    );
  }

  /**
   * Create a pheromone trail entity
   */
  createPheromoneTrail(
    position: { x: number; y: number; z: number },
    type: string,
    strength: number = 1.0
  ): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Pheromone(type, strength, 0.01, 5.0), // Decays slowly, 5.0 radius
      new Renderable('pheromone_trail', 'pheromone_material', true, false, false, 0.5)
    );
  }

  /**
   * Create an obstacle entity
   */
  createObstacle(
    position: { x: number; y: number; z: number },
    size: { width: number; height: number; depth: number }
  ): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Physics(100.0, 0.9, 0.1, true, 0.0), // Heavy static object
      new Collision('box', 0, size.width, size.height, size.depth, false),
      new Renderable('obstacle', 'obstacle_material', true, true, true, 1.0)
    );
  }

  // ============================================================================
  // Colony Entity Creation
  // ============================================================================

  /**
   * Create a colony nest entity
   */
  createColonyNest(position: { x: number; y: number; z: number }): EntityId {
    return this.world.createEntity(
      new Transform(position.x, position.y, position.z),
      new Physics(1000.0, 1.0, 0.0, true, 0.0), // Very heavy static
      new Collision('cylinder', 3.0, 6.0, 2.0, 6.0, true), // Large trigger area
      new Inventory(1000), // Large storage capacity
      new Renderable('colony_nest', 'nest_material', true, true, true, 2.0)
    );
  }

  // ============================================================================
  // Batch Creation Methods
  // ============================================================================

  /**
   * Create a colony with mixed ant types
   */
  createColony(
    centerPosition: { x: number; y: number; z: number },
    configuration?: {
      workers?: number;
      scouts?: number;
      soldiers?: number;
      nurses?: number;
      queens?: number;
    }
  ): { colonyId: EntityId; ants: EntityId[] } {
    const config = configuration || this.getDefaultColonyConfiguration();
    
    // Create the nest first
    const colonyId = this.createColonyNest(centerPosition);
    const ants: EntityId[] = [];

    // Create ants around the nest
    const spawnRadius = 5.0;
    
    // Create queens
    for (let i = 0; i < config.queens!; i++) {
      const pos = this.getRandomPositionAround(centerPosition, spawnRadius * 0.3);
      ants.push(this.createQueenAnt(pos, colonyId));
    }

    // Create workers
    for (let i = 0; i < config.workers!; i++) {
      const pos = this.getRandomPositionAround(centerPosition, spawnRadius);
      ants.push(this.createWorkerAnt(pos, colonyId));
    }

    // Create scouts
    for (let i = 0; i < config.scouts!; i++) {
      const pos = this.getRandomPositionAround(centerPosition, spawnRadius * 1.2);
      ants.push(this.createScoutAnt(pos, colonyId));
    }

    // Create soldiers
    for (let i = 0; i < config.soldiers!; i++) {
      const pos = this.getRandomPositionAround(centerPosition, spawnRadius * 0.8);
      ants.push(this.createSoldierAnt(pos, colonyId));
    }

    // Create nurses
    for (let i = 0; i < config.nurses!; i++) {
      const pos = this.getRandomPositionAround(centerPosition, spawnRadius * 0.5);
      ants.push(this.createNurseAnt(pos, colonyId));
    }

    console.log(`🏠 Created colony with ${ants.length} ants:`, {
      workers: config.workers,
      scouts: config.scouts,
      soldiers: config.soldiers,
      nurses: config.nurses,
      queens: config.queens
    });

    return { colonyId, ants };
  }

  /**
   * Create food sources scattered around the environment
   */
  createFoodSources(
    count: number,
    area: { x: number; z: number; width: number; height: number }
  ): EntityId[] {
    const foodSources: EntityId[] = [];

    for (let i = 0; i < count; i++) {
      const position = {
        x: area.x + (Math.random() - 0.5) * area.width,
        y: 0,
        z: area.z + (Math.random() - 0.5) * area.height
      };

      const amount = Math.floor(Math.random() * 150) + 50; // 50-200 food units
      foodSources.push(this.createFoodSource(position, amount));
    }

    return foodSources;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getDefaultColonyConfiguration() {
    const totalAnts = this.config.ants.initialCount;
    const distribution = this.config.ants.casteDistribution;

    return {
      workers: Math.floor(totalAnts * (distribution[AntCaste.WORKER] || 0.7)),
      scouts: Math.floor(totalAnts * (distribution[AntCaste.SCOUT] || 0.15)),
      soldiers: Math.floor(totalAnts * (distribution[AntCaste.SOLDIER] || 0.1)),
      nurses: Math.floor(totalAnts * (distribution[AntCaste.NURSE] || 0.04)),
      queens: Math.floor(totalAnts * (distribution[AntCaste.QUEEN] || 0.01)) || 1
    };
  }

  private getRandomPositionAround(
    center: { x: number; y: number; z: number },
    radius: number
  ): { x: number; y: number; z: number } {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    
    return {
      x: center.x + Math.cos(angle) * distance,
      y: center.y,
      z: center.z + Math.sin(angle) * distance
    };
  }

  /**
   * Update factory configuration
   */
  updateConfiguration(config: SimulationConfiguration): void {
    this.config = config;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SimulationConfiguration {
    return this.config;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create and configure an entity factory for a world
 */
export function createEntityFactory(world: World): EntityFactory {
  return new EntityFactory(world);
}

/**
 * Create a complete simulation environment
 */
export function createSimulationEnvironment(world: World): {
  factory: EntityFactory;
  colony: { colonyId: EntityId; ants: EntityId[] };
  foodSources: EntityId[];
} {
  const factory = createEntityFactory(world);
  
  // Create main colony at origin
  const colony = factory.createColony({ x: 0, y: 0, z: 0 });
  
  // Create food sources in the environment
  const foodSources = factory.createFoodSources(10, {
    x: 0,
    z: 0,
    width: 200,
    height: 200
  });

  // Create some obstacles
  for (let i = 0; i < 5; i++) {
    const position = {
      x: (Math.random() - 0.5) * 150,
      y: 0,
      z: (Math.random() - 0.5) * 150
    };
    
    factory.createObstacle(position, {
      width: Math.random() * 3 + 1,
      height: Math.random() * 2 + 1,
      depth: Math.random() * 3 + 1
    });
  }

  console.log('🌍 Simulation environment created:', {
    ants: colony.ants.length,
    foodSources: foodSources.length,
    obstacles: 5
  });

  return { factory, colony, foodSources };
}