/**
 * ECS Systems for MyAnts Simulation
 * Phase 3 Architecture Improvement - Modular system implementations
 * 
 * Systems that process entities with specific component combinations
 * Provides data-oriented design for high performance simulation
 */

import {
  System,
  EntityId,
  World,
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

// ============================================================================
// Movement System - Handles entity movement and physics
// ============================================================================

export class MovementSystem implements System {
  readonly name = 'MovementSystem';
  readonly requiredComponents = [Transform.type, Velocity.type] as const;
  readonly priority = 100;
  readonly enabled = true;

  update(deltaTime: number, entities: EntityId[], world: World): void {
    for (const entityId of entities) {
      const transform = world.entityManager.getComponent<Transform>(entityId, Transform.type);
      const velocity = world.entityManager.getComponent<Velocity>(entityId, Velocity.type);
      const physics = world.entityManager.getComponent<Physics>(entityId, Physics.type);

      if (!transform || !velocity) continue;

      // Apply gravity if physics component exists
      if (physics && !physics.isStatic) {
        velocity.y -= 9.81 * physics.gravityScale * deltaTime;
      }

      // Clamp velocity to max speed
      velocity.clampToMaxSpeed();

      // Update position based on velocity
      transform.x += velocity.x * deltaTime;
      transform.y += velocity.y * deltaTime;
      transform.z += velocity.z * deltaTime;

      // Apply friction if physics component exists
      if (physics && !physics.isStatic) {
        const friction = 1 - (physics.friction * deltaTime);
        velocity.x *= friction;
        velocity.z *= friction;
      }
    }
  }
}

// ============================================================================
// Health System - Manages entity health and death
// ============================================================================

export class HealthSystem implements System {
  readonly name = 'HealthSystem';
  readonly requiredComponents = [Health.type] as const;
  readonly priority = 90;
  readonly enabled = true;

  private entitiesToDestroy: EntityId[] = [];

  update(deltaTime: number, entities: EntityId[], world: World): void {
    this.entitiesToDestroy.length = 0;

    for (const entityId of entities) {
      const health = world.entityManager.getComponent<Health>(entityId, Health.type);
      if (!health) continue;

      // Apply regeneration
      if (health.regenerationRate > 0) {
        health.heal(health.regenerationRate * deltaTime);
      }

      // Mark dead entities for destruction
      if (!health.isAlive()) {
        this.entitiesToDestroy.push(entityId);
      }
    }

    // Destroy dead entities
    for (const entityId of this.entitiesToDestroy) {
      world.destroyEntity(entityId);
    }
  }
}

// ============================================================================
// Energy System - Manages entity energy consumption and restoration
// ============================================================================

export class EnergySystem implements System {
  readonly name = 'EnergySystem';
  readonly requiredComponents = [Energy.type] as const;
  readonly priority = 85;
  readonly enabled = true;

  update(deltaTime: number, entities: EntityId[], world: World): void {
    for (const entityId of entities) {
      const energy = world.entityManager.getComponent<Energy>(entityId, Energy.type);
      const velocity = world.entityManager.getComponent<Velocity>(entityId, Velocity.type);
      const task = world.entityManager.getComponent<Task>(entityId, Task.type);

      if (!energy) continue;

      // Base energy consumption
      let consumption = energy.consumptionRate * deltaTime;

      // Additional consumption based on movement
      if (velocity) {
        const speed = velocity.getSpeed();
        consumption += speed * 0.1 * deltaTime;
      }

      // Additional consumption based on task
      if (task && task.currentTask !== 'idle') {
        consumption += 0.5 * deltaTime;
      }

      // Consume energy
      energy.consume(consumption);

      // Apply regeneration when idle
      if (energy.regenerationRate > 0 && (!task || task.currentTask === 'idle')) {
        energy.restore(energy.regenerationRate * deltaTime);
      }

      // Reduce max speed when low energy
      if (velocity && energy.getEnergyPercentage() < 0.2) {
        velocity.maxSpeed *= 0.5;
      }
    }
  }
}

// ============================================================================
// AI Decision System - Handles ant AI and behavior
// ============================================================================

export class AIDecisionSystem implements System {
  readonly name = 'AIDecisionSystem';
  readonly requiredComponents = [AI.type, Task.type, AntIdentity.type] as const;
  readonly priority = 80;
  readonly enabled = true;

  private currentTime = 0;

  update(deltaTime: number, entities: EntityId[], world: World): void {
    this.currentTime += deltaTime * 1000; // Convert to ms

    for (const entityId of entities) {
      const ai = world.entityManager.getComponent<AI>(entityId, AI.type);
      const task = world.entityManager.getComponent<Task>(entityId, Task.type);
      const identity = world.entityManager.getComponent<AntIdentity>(entityId, AntIdentity.type);
      const energy = world.entityManager.getComponent<Energy>(entityId, Energy.type);
      const health = world.entityManager.getComponent<Health>(entityId, Health.type);

      if (!ai || !task || !identity) continue;

      // Only make decisions when cooldown has passed
      if (!ai.canMakeDecision(this.currentTime)) continue;

      // Make decision based on current state and needs
      const newTask = this.makeDecision(entityId, ai, task, identity, energy, health, world);
      
      if (newTask && newTask !== task.currentTask) {
        task.setTask(newTask, this.calculateTaskPriority(newTask, energy, health));
        ai.makeDecision(this.currentTime);
      }
    }
  }

  private makeDecision(
    entityId: EntityId,
    ai: AI,
    task: Task,
    identity: AntIdentity,
    energy: Energy | undefined,
    health: Health | undefined,
    world: World
  ): string | null {
    // Critical needs first
    if (health && health.getHealthPercentage() < 0.3) {
      return 'seek_safety';
    }

    if (energy && energy.getEnergyPercentage() < 0.2) {
      return 'rest';
    }

    // Task completion check
    if (task.isComplete) {
      return this.getNextTaskForCaste(identity.caste, ai, world);
    }

    // Caste-specific behavior
    switch (identity.caste) {
      case 'worker':
        return this.makeWorkerDecision(entityId, ai, task, world);
      case 'scout':
        return this.makeScoutDecision(entityId, ai, task, world);
      case 'soldier':
        return this.makeSoldierDecision(entityId, ai, task, world);
      case 'nurse':
        return this.makeNurseDecision(entityId, ai, task, world);
      default:
        return 'explore';
    }
  }

  private makeWorkerDecision(entityId: EntityId, ai: AI, task: Task, world: World): string {
    const inventory = world.entityManager.getComponent<Inventory>(entityId, Inventory.type);
    
    // If carrying food, return to colony
    if (inventory && inventory.hasItem('food')) {
      return 'return_food';
    }

    // If no current task or idle, look for food
    if (task.currentTask === 'idle' || task.isComplete) {
      return 'forage';
    }

    return task.currentTask;
  }

  private makeScoutDecision(entityId: EntityId, ai: AI, task: Task, world: World): string {
    // Scouts prioritize exploration and information gathering
    if (Math.random() < ai.curiosity) {
      return 'explore';
    }

    if (ai.hasMemory('found_food') && !ai.hasMemory('reported_food')) {
      return 'report_finding';
    }

    return 'patrol';
  }

  private makeSoldierDecision(entityId: EntityId, ai: AI, task: Task, world: World): string {
    // Soldiers prioritize defense and territorial control
    if (ai.hasMemory('threat_detected')) {
      return 'defend';
    }

    if (Math.random() < ai.aggressiveness) {
      return 'patrol_territory';
    }

    return 'guard';
  }

  private makeNurseDecision(entityId: EntityId, ai: AI, task: Task, world: World): string {
    // Nurses prioritize colony maintenance and care
    if (ai.hasMemory('larvae_needs_care')) {
      return 'tend_larvae';
    }

    if (ai.hasMemory('colony_needs_cleaning')) {
      return 'clean_colony';
    }

    return 'maintain_colony';
  }

  private getNextTaskForCaste(caste: string, ai: AI, world: World): string {
    const baseTasks = {
      worker: ['forage', 'build', 'maintain'],
      scout: ['explore', 'patrol', 'report'],
      soldier: ['guard', 'patrol_territory', 'defend'],
      nurse: ['tend_larvae', 'clean_colony', 'maintain_colony']
    };

    const tasks = baseTasks[caste as keyof typeof baseTasks] || ['idle'];
    return tasks[Math.floor(Math.random() * tasks.length)];
  }

  private calculateTaskPriority(task: string, energy?: Energy, health?: Health): number {
    let priority = 50; // Base priority

    // Critical tasks get higher priority
    if (task === 'seek_safety' || task === 'rest') {
      priority = 100;
    }

    // Adjust based on energy/health
    if (energy && energy.getEnergyPercentage() < 0.5) {
      priority += 20;
    }

    if (health && health.getHealthPercentage() < 0.5) {
      priority += 30;
    }

    return Math.min(100, priority);
  }
}

// ============================================================================
// Task Execution System - Handles task progress and completion
// ============================================================================

export class TaskExecutionSystem implements System {
  readonly name = 'TaskExecutionSystem';
  readonly requiredComponents = [Task.type, Transform.type] as const;
  readonly priority = 75;
  readonly enabled = true;

  update(deltaTime: number, entities: EntityId[], world: World): void {
    for (const entityId of entities) {
      const task = world.entityManager.getComponent<Task>(entityId, Task.type);
      const transform = world.entityManager.getComponent<Transform>(entityId, Transform.type);
      const velocity = world.entityManager.getComponent<Velocity>(entityId, Velocity.type);
      const energy = world.entityManager.getComponent<Energy>(entityId, Energy.type);

      if (!task || !transform) continue;

      // Skip if task is complete or entity has no energy
      if (task.isComplete || (energy && energy.current <= 0)) continue;

      // Execute task based on type
      this.executeTask(entityId, task, transform, velocity, energy, world, deltaTime);
    }
  }

  private executeTask(
    entityId: EntityId,
    task: Task,
    transform: Transform,
    velocity: Velocity | undefined,
    energy: Energy | undefined,
    world: World,
    deltaTime: number
  ): void {
    switch (task.currentTask) {
      case 'forage':
        this.executeForage(entityId, task, transform, velocity, world, deltaTime);
        break;
      case 'return_food':
        this.executeReturnFood(entityId, task, transform, velocity, world, deltaTime);
        break;
      case 'explore':
        this.executeExplore(entityId, task, transform, velocity, world, deltaTime);
        break;
      case 'rest':
        this.executeRest(entityId, task, energy, deltaTime);
        break;
      case 'build':
        this.executeBuild(entityId, task, transform, deltaTime);
        break;
      default:
        // Generic task execution - just update progress
        task.updateProgress(deltaTime * 0.1);
        break;
    }
  }

  private executeForage(
    entityId: EntityId,
    task: Task,
    transform: Transform,
    velocity: Velocity | undefined,
    world: World,
    deltaTime: number
  ): void {
    // Move to food source or search pattern
    if (task.targetPosition) {
      this.moveToTarget(transform, velocity, task.targetPosition, deltaTime);
      
      // Check if reached target
      const distance = this.getDistance(transform, task.targetPosition);
      if (distance < 1.0) {
        // Try to collect food
        const inventory = world.entityManager.getComponent<Inventory>(entityId, Inventory.type);
        if (inventory && inventory.addItem('food', 1)) {
          task.updateProgress(1.0); // Complete task
        }
      }
    } else {
      // Search for food (random movement)
      this.randomMovement(velocity, deltaTime);
      task.updateProgress(deltaTime * 0.01); // Slow progress while searching
    }
  }

  private executeReturnFood(
    entityId: EntityId,
    task: Task,
    transform: Transform,
    velocity: Velocity | undefined,
    world: World,
    deltaTime: number
  ): void {
    // Move towards colony (assuming colony is at origin for now)
    const colonyPosition = { x: 0, y: 0, z: 0 };
    this.moveToTarget(transform, velocity, colonyPosition, deltaTime);

    // Check if reached colony
    const distance = this.getDistance(transform, colonyPosition);
    if (distance < 2.0) {
      // Drop off food
      const inventory = world.entityManager.getComponent<Inventory>(entityId, Inventory.type);
      if (inventory && inventory.removeItem('food', 1)) {
        task.updateProgress(1.0); // Complete task
      }
    }
  }

  private executeExplore(
    entityId: EntityId,
    task: Task,
    transform: Transform,
    velocity: Velocity | undefined,
    world: World,
    deltaTime: number
  ): void {
    // Random exploration movement
    this.randomMovement(velocity, deltaTime);
    task.updateProgress(deltaTime * 0.05);

    // Occasionally discover things
    if (Math.random() < 0.001) {
      const ai = world.entityManager.getComponent<AI>(entityId, AI.type);
      if (ai) {
        ai.setMemory('found_food', { x: transform.x, y: transform.y, z: transform.z });
      }
    }
  }

  private executeRest(
    entityId: EntityId,
    task: Task,
    energy: Energy | undefined,
    deltaTime: number
  ): void {
    if (energy) {
      energy.restore(50 * deltaTime); // Faster energy restoration while resting
      
      // Complete when energy is above 80%
      if (energy.getEnergyPercentage() > 0.8) {
        task.updateProgress(1.0);
      }
    }
  }

  private executeBuild(
    entityId: EntityId,
    task: Task,
    transform: Transform,
    deltaTime: number
  ): void {
    // Building requires being stationary and progresses over time
    task.updateProgress(deltaTime * 0.2);
  }

  private moveToTarget(
    transform: Transform,
    velocity: Velocity | undefined,
    target: { x: number; y: number; z: number },
    deltaTime: number
  ): void {
    if (!velocity) return;

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    const dz = target.z - transform.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > 0.1) {
      // Normalize direction and apply to velocity
      velocity.x = (dx / distance) * velocity.maxSpeed;
      velocity.y = (dy / distance) * velocity.maxSpeed;
      velocity.z = (dz / distance) * velocity.maxSpeed;
    } else {
      // Stop when close enough
      velocity.x = 0;
      velocity.y = 0;
      velocity.z = 0;
    }
  }

  private randomMovement(velocity: Velocity | undefined, deltaTime: number): void {
    if (!velocity) return;

    // Add some randomness to current movement
    velocity.x += (Math.random() - 0.5) * 0.1;
    velocity.z += (Math.random() - 0.5) * 0.1;
    
    // Keep movement bounded
    velocity.clampToMaxSpeed();
  }

  private getDistance(
    transform: Transform,
    target: { x: number; y: number; z: number }
  ): number {
    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    const dz = target.z - transform.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// ============================================================================
// Pheromone System - Handles pheromone emission and decay
// ============================================================================

export class PheromoneSystem implements System {
  readonly name = 'PheromoneSystem';
  readonly requiredComponents = [Pheromone.type, Transform.type] as const;
  readonly priority = 70;
  readonly enabled = true;

  private entitiesToDestroy: EntityId[] = [];

  update(deltaTime: number, entities: EntityId[], world: World): void {
    this.entitiesToDestroy.length = 0;

    for (const entityId of entities) {
      const pheromone = world.entityManager.getComponent<Pheromone>(entityId, Pheromone.type);
      if (!pheromone) continue;

      // Decay pheromone
      const shouldDestroy = pheromone.decay(deltaTime);
      
      if (shouldDestroy) {
        this.entitiesToDestroy.push(entityId);
      }
    }

    // Remove decayed pheromones
    for (const entityId of this.entitiesToDestroy) {
      world.destroyEntity(entityId);
    }
  }
}

// ============================================================================
// Collision System - Handles entity collisions
// ============================================================================

export class CollisionSystem implements System {
  readonly name = 'CollisionSystem';
  readonly requiredComponents = [Transform.type, Collision.type] as const;
  readonly priority = 95;
  readonly enabled = true;

  update(deltaTime: number, entities: EntityId[], world: World): void {
    // Simple O(n²) collision detection for now
    // Could be optimized with spatial partitioning
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        this.checkCollision(entities[i], entities[j], world);
      }
    }
  }

  private checkCollision(entityA: EntityId, entityB: EntityId, world: World): void {
    const transformA = world.entityManager.getComponent<Transform>(entityA, Transform.type);
    const transformB = world.entityManager.getComponent<Transform>(entityB, Transform.type);
    const collisionA = world.entityManager.getComponent<Collision>(entityA, Collision.type);
    const collisionB = world.entityManager.getComponent<Collision>(entityB, Collision.type);

    if (!transformA || !transformB || !collisionA || !collisionB) return;

    // Simple sphere collision for now
    const distance = Math.sqrt(
      Math.pow(transformA.x - transformB.x, 2) +
      Math.pow(transformA.y - transformB.y, 2) +
      Math.pow(transformA.z - transformB.z, 2)
    );

    const combinedRadius = collisionA.radius + collisionB.radius;

    if (distance < combinedRadius) {
      this.resolveCollision(entityA, entityB, transformA, transformB, world);
    }
  }

  private resolveCollision(
    entityA: EntityId,
    entityB: EntityId,
    transformA: Transform,
    transformB: Transform,
    world: World
  ): void {
    const velocityA = world.entityManager.getComponent<Velocity>(entityA, Velocity.type);
    const velocityB = world.entityManager.getComponent<Velocity>(entityB, Velocity.type);
    const physicsA = world.entityManager.getComponent<Physics>(entityA, Physics.type);
    const physicsB = world.entityManager.getComponent<Physics>(entityB, Physics.type);

    // Simple separation
    const dx = transformB.x - transformA.x;
    const dy = transformB.y - transformA.y;
    const dz = transformB.z - transformA.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > 0) {
      const separation = 0.5; // How much to separate
      const separationX = (dx / distance) * separation;
      const separationY = (dy / distance) * separation;
      const separationZ = (dz / distance) * separation;

      // Move entities apart
      if (!physicsA?.isStatic) {
        transformA.x -= separationX;
        transformA.y -= separationY;
        transformA.z -= separationZ;
      }

      if (!physicsB?.isStatic) {
        transformB.x += separationX;
        transformB.y += separationY;
        transformB.z += separationZ;
      }

      // Apply velocity changes if both have physics
      if (velocityA && velocityB && physicsA && physicsB) {
        // Simple elastic collision response
        const restitution = (physicsA.restitution + physicsB.restitution) * 0.5;
        
        if (!physicsA.isStatic) {
          velocityA.x *= -restitution;
          velocityA.z *= -restitution;
        }
        
        if (!physicsB.isStatic) {
          velocityB.x *= -restitution;
          velocityB.z *= -restitution;
        }
      }
    }
  }
}

// ============================================================================
// Aging System - Handles entity aging and lifecycle
// ============================================================================

export class AgingSystem implements System {
  readonly name = 'AgingSystem';
  readonly requiredComponents = [AntIdentity.type] as const;
  readonly priority = 60;
  readonly enabled = true;

  update(deltaTime: number, entities: EntityId[], world: World): void {
    for (const entityId of entities) {
      const identity = world.entityManager.getComponent<AntIdentity>(entityId, AntIdentity.type);
      if (!identity) continue;

      // Age the ant
      identity.age += deltaTime;

      // Apply aging effects
      this.applyAgingEffects(entityId, identity, world, deltaTime);
    }
  }

  private applyAgingEffects(entityId: EntityId, identity: AntIdentity, world: World, deltaTime: number): void {
    const health = world.entityManager.getComponent<Health>(entityId, Health.type);
    const energy = world.entityManager.getComponent<Energy>(entityId, Energy.type);
    const velocity = world.entityManager.getComponent<Velocity>(entityId, Velocity.type);

    // Calculate aging factor (0 = young, 1 = old)
    const maxAge = this.getMaxAgeForCaste(identity.caste);
    const agingFactor = Math.min(1, identity.age / maxAge);

    // Reduce health over time
    if (health && agingFactor > 0.8) {
      health.takeDamage(agingFactor * deltaTime);
    }

    // Reduce energy efficiency
    if (energy) {
      energy.consumptionRate = 1 + (agingFactor * 0.5);
    }

    // Reduce movement speed
    if (velocity) {
      velocity.maxSpeed = 1 - (agingFactor * 0.3);
    }

    // Death from old age
    if (identity.age > maxAge) {
      if (health) {
        health.takeDamage(health.maximum);
      }
    }
  }

  private getMaxAgeForCaste(caste: string): number {
    const maxAges = {
      worker: 180, // 3 minutes
      scout: 240,  // 4 minutes
      soldier: 300, // 5 minutes
      nurse: 360,   // 6 minutes
      queen: 1800   // 30 minutes
    };

    return maxAges[caste as keyof typeof maxAges] || 180;
  }
}

// Export all systems
export const ecsSystems = {
  MovementSystem,
  HealthSystem,
  EnergySystem,
  AIDecisionSystem,
  TaskExecutionSystem,
  PheromoneSystem,
  CollisionSystem,
  AgingSystem
};