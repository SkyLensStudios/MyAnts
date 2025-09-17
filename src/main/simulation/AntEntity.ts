/**
 * AntEntity - Comprehensive ant representation
 * Integrates all biological, AI, and behavioral systems for individual ants
 */

import { BehaviorDecisionTree } from '../../../engine/ai/decisionTree';
import { SpatialMemory } from '../../../engine/ai/spatialMemory';
import { AntGenetics } from '../../../engine/biological/genetics';
import { PhysiologicalSystem } from '../../../engine/biological/physiology';
import { PheromoneSystem, PheromoneType } from '../../../engine/chemical/pheromones';
import { AntCaste } from '../../../engine/colony/casteSystem';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AntEntityData {
  id: string;
  position: Vector3;
  rotation: number;
  caste: AntCaste;
  health: number;
  energy: number;
  age: number;
  task: string;
  carryingFood: boolean;
  carryingConstruction: boolean;
  speed: number;
  isAlive: boolean;
  generation: number;
}

export class AntEntity {
  public readonly id: string;
  public position: Vector3;
  public rotation: number;
  public velocity: Vector3;
  
  // Biological systems
  public genetics: AntGenetics;
  public physiology: PhysiologicalSystem;
  
  // AI systems
  public decisionTree: BehaviorDecisionTree;
  public spatialMemory: SpatialMemory;
  
  // Colony attributes
  public caste: AntCaste;
  public generation: number;
  public age: number; // in days
  public isAlive: boolean;
  
  // Current state
  public currentTask: string;
  public carryingFood: boolean;
  public carryingConstruction: boolean;
  public lastTaskChange: number;
  
  // Physical properties  
  public mass: number;
  public size: number;
  
  private readonly createdAt: number;

  constructor(id: string, position: Vector3, caste: AntCaste, generation: number = 1) {
    this.id = id;
    this.position = { ...position };
    this.rotation = Math.random() * Math.PI * 2;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.caste = caste;
    this.generation = generation;
    this.age = 0;
    this.isAlive = true;
    this.currentTask = 'idle';
    this.carryingFood = false;
    this.carryingConstruction = false;
    this.lastTaskChange = Date.now();
    this.createdAt = Date.now();

    // Initialize biological systems
    this.genetics = new AntGenetics();
    this.physiology = new PhysiologicalSystem(this.genetics.traits);
    
    // Initialize AI systems  
    this.decisionTree = new BehaviorDecisionTree(this.getSimpleCasteString(caste), this.genetics);
    this.spatialMemory = new SpatialMemory(
      { x: position.x, y: position.y, z: position.z }, 
      this.genetics,
    );
    
    // Set physical properties based on genetics and caste
    this.mass = this.genetics.traits.size * this.getCasteMassMultiplier(caste);
    this.size = this.genetics.traits.size * this.getCasteSizeMultiplier(caste);
  }

  private getSimpleCasteString(caste: AntCaste): 'worker' | 'soldier' | 'queen' {
    switch (caste) {
      case AntCaste.QUEEN:
        return 'queen';
      case AntCaste.SOLDIER:
      case AntCaste.GUARD:
        return 'soldier';
      default:
        return 'worker';
    }
  }

  public update(deltaTime: number, environmentContext: any = {}): void {
    if (!this.isAlive) return;

    // Update age
    this.age += deltaTime / 86400; // Convert seconds to days

    // Update physiological systems
    this.physiology.update(deltaTime, environmentContext);
    
    // Check if ant dies from age, injury, or starvation
    if (this.shouldDie()) {
      this.die('natural_causes');
      return;
    }

    // Update AI systems
    this.updateDecisionMaking(deltaTime, environmentContext);
    
    // Update spatial memory
    this.spatialMemory.updatePosition(this.position);
    
    // Update movement based on current task
    this.updateMovement(deltaTime, environmentContext);
    
    // Update task-specific behaviors
    this.updateTaskBehavior(deltaTime, environmentContext);
  }

  private shouldDie(): boolean {
    // Check various death conditions
    return (
      this.physiology.health.hp <= 0 ||
      this.physiology.metabolic.energy <= 0 ||
      this.age > this.genetics.traits.lifespan ||
      this.physiology.health.toxicity > 0.9
    );
  }

  private getCurrentSpeed(): number {
    // Calculate current speed based on energy, health, and task
    const energyFactor = Math.max(0.1, this.physiology.metabolic.energy / this.physiology.metabolic.maxEnergy);
    const healthFactor = Math.max(0.1, this.physiology.health.hp / this.physiology.health.maxHp);
    const stressFactor = Math.max(0.5, 1 - this.physiology.health.stress);
    
    return energyFactor * healthFactor * stressFactor;
  }

  private updateDecisionMaking(deltaTime: number, environmentContext: any): void {
    // Create decision context from current state and environment
    const context = {
      energy: this.physiology.metabolic.energy,
      health: this.physiology.health.hp / this.physiology.health.maxHp,
      hunger: 1 - this.physiology.nutrition.lastMeal,
      stress: this.physiology.health.stress,
      threats: environmentContext.threats || 0,
      resources: environmentContext.resources || 0,
      colonyNeeds: environmentContext.colonyNeeds || {
        food: 0.5,
        defense: 0.3,
        construction: 0.4,
        nursing: 0.2,
      },
      environment: {
        danger: environmentContext.danger || 0,
        temperature: environmentContext.temperature || 20,
        timeOfDay: environmentContext.timeOfDay || 'day',
      },
      social: {
        pheromoneStrength: environmentContext.pheromoneStrength || 0,
        alarmLevel: environmentContext.alarmLevel || 0,
        crowding: environmentContext.crowding || 0,
      },
    };

    // Make decision about current task
    const decision = this.decisionTree.makeDecision(context);
    
    if (decision && decision.type !== this.currentTask) {
      this.changeTask(decision.type);
    }
  }

  private updateMovement(deltaTime: number, environmentContext?: any): void {
    // Enhanced movement based on current task and genetics
    const baseSpeed = this.genetics.traits.speed;
    const currentSpeed = this.getCurrentSpeed() * baseSpeed;
    
    // Task-based movement behavior
    let targetDirection = this.rotation;
    let movementIntensity = 1.0;
    
    switch (this.currentTask) {
      case 'forage':
        // Foraging ants move in exploratory patterns with pheromone trail following
        targetDirection = this.calculateForagingDirection(environmentContext);
        movementIntensity = 1.2; // More active when foraging
        break;
      case 'construct':
        // Construction ants move toward work sites
        targetDirection = this.calculateConstructionDirection();
        movementIntensity = 0.8; // Slower when carrying materials
        break;
      case 'nurture':
        // Nurse ants stay near nursery areas
        targetDirection = this.calculateNursingDirection();
        movementIntensity = 0.5; // Gentle movement around larvae
        break;
      case 'defend':
        // Defensive ants patrol or move toward threats
        targetDirection = this.calculateDefenseDirection();
        movementIntensity = 1.5; // Fast response to threats
        break;
      case 'rest':
        // Resting ants barely move
        movementIntensity = 0.1;
        break;
      default:
        // Idle ants wander randomly but purposefully
        targetDirection = this.calculateIdleDirection();
        movementIntensity = 0.6;
        break;
    }
    
    // Smooth rotation toward target direction
    const rotationSpeed = 2.0 * deltaTime;
    const angleDiff = targetDirection - this.rotation;
    const normalizedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    
    if (Math.abs(normalizedAngleDiff) > 0.1) {
      this.rotation += Math.sign(normalizedAngleDiff) * Math.min(rotationSpeed, Math.abs(normalizedAngleDiff));
    }
    
    // Calculate movement velocity
    const finalSpeed = currentSpeed * movementIntensity;
    this.velocity.x = Math.cos(this.rotation) * finalSpeed;
    this.velocity.z = Math.sin(this.rotation) * finalSpeed; // Use Z axis for ground movement
    this.velocity.y = 0; // Keep Y constant for ground movement
    
    // Update position with boundary checking
    const newX = this.position.x + this.velocity.x * deltaTime;
    const newZ = this.position.z + this.velocity.z * deltaTime; // Use Z for ground movement
    
    // Simple boundary constraints (keep ants in reasonable area)
    const worldSize = 100; // 100m world
    this.position.x = Math.max(-worldSize, Math.min(worldSize, newX));
    this.position.z = Math.max(-worldSize, Math.min(worldSize, newZ)); // Constrain Z axis
    // Keep Y position stable on ground (don't change Y unless jumping/climbing)
    
    // Update spatial memory with new position
    this.spatialMemory.updatePosition(this.position);
  }

  private updateTaskBehavior(deltaTime: number, environmentContext?: any): void {
    switch (this.currentTask) {
      case 'forage':
        this.updateForaging(deltaTime, environmentContext);
        break;
      case 'construct':
        this.updateConstruction(deltaTime);
        break;
      case 'nurture':
        this.updateNurturing(deltaTime);
        break;
      case 'defend':
        this.updateDefense(deltaTime);
        break;
      case 'rest':
        this.updateResting(deltaTime);
        break;
      default:
        // Idle behavior
        break;
    }
  }

  private updateForaging(deltaTime: number, environmentContext?: any): void {
    // Enhanced foraging behavior with food source interaction and pheromone trails
    if (!environmentContext?.foodSourceSystem) {
      return; // No food source system available
    }

    const foodSourceSystem = environmentContext.foodSourceSystem;
    const pheromoneSystem = environmentContext.pheromoneSystem;
    
    if (!this.carryingFood) {
      // Phase 1: Search for food
      const nearbyFood = typeof foodSourceSystem.findNearbyFoodSources === 'function'
        ? foodSourceSystem.findNearbyFoodSources(this.position, 5.0)
        : [];

      if (Array.isArray(nearbyFood) && nearbyFood.length > 0) {
        // Found food! Try to collect it
        const collectionResult = foodSourceSystem.collectFood(
          this.id,
          this.position,
          1.0, // Try to collect 1 unit
          deltaTime,
        );
        
        if (collectionResult.success && collectionResult.actualAmount > 0) {
          this.carryingFood = true;
          this.physiology.metabolic.energy += collectionResult.actualAmount * 0.1; // Small energy boost
          
          // Learn about this food source
          this.spatialMemory.learnFoodSource(this.position, collectionResult.actualAmount);
          
          // Lay recruitment pheromone to attract other ants to this food source
          if (pheromoneSystem) {
            this.layPheromoneTrail(pheromoneSystem, 'recruitment', 1.0);
          }
          
          console.log(`🐜 Ant ${this.id} collected ${collectionResult.actualAmount.toFixed(2)} food units and laid recruitment trail`);
        }
      } else {
        // No food nearby, continue exploring
        // The movement system will handle exploration direction
      }
    } else {
      // Phase 2: Return to nest with food
      const nestCenter = { x: 0, y: 0, z: 0 };
      const dx = nestCenter.x - this.position.x;
      const dy = nestCenter.y - this.position.y;
      const distanceToNest = Math.sqrt(dx * dx + dy * dy);
      
      if (distanceToNest < 3.0) {
        // Close enough to nest, deposit food
        this.carryingFood = false;
        this.physiology.metabolic.energy += 5.0; // Reward for bringing food home
        
        // Task completed, might switch to resting or continue foraging
        if (this.physiology.metabolic.energy < this.physiology.metabolic.maxEnergy * 0.8) {
          this.changeTask('rest');
        }
        
        console.log(`🏠 Ant ${this.id} deposited food at nest`);
      }
      // If not at nest, movement system will handle returning direction
    }
  }

  private updateConstruction(deltaTime: number): void {
    // TODO: Implement construction behavior
    // - Dig tunnels
    // - Build chambers
    // - Repair damage
  }

  private updateNurturing(deltaTime: number): void {
    // TODO: Implement nurturing behavior
    // - Care for larvae
    // - Feed young ants
    // - Maintain nursery chambers
  }

  private updateDefense(deltaTime: number): void {
    // TODO: Implement defense behavior
    // - Patrol territory
    // - Respond to threats
    // - Guard entrances
  }

  private updateResting(deltaTime: number): void {
    // Restore energy while resting - simple implementation
    this.physiology.metabolic.energy = Math.min(
      this.physiology.metabolic.maxEnergy, 
      this.physiology.metabolic.energy + 0.1 * deltaTime,
    );
  }

  // Movement direction calculation methods
  private calculateForagingDirection(environmentContext?: any): number {
    // Foraging ants use pheromone trails, memory, and random exploration
    const pheromoneSystem = environmentContext?.pheromoneSystem;
    
    if (!pheromoneSystem) {
      // Fallback to simple memory + random if no pheromone system
      const memoryInfluence = 0.3;
      const randomInfluence = 0.7;
      
      const memoryDirection = this.spatialMemory.getExplorationDirection();
      const randomDirection = this.rotation + (Math.random() - 0.5) * Math.PI;
      
      return memoryDirection * memoryInfluence + randomDirection * randomInfluence;
    }
    
    // Enhanced pheromone-based foraging behavior
    if (this.carryingFood) {
      // RETURNING TO NEST: Follow home trail and lay trail pheromone
      this.layPheromoneTrail(pheromoneSystem, 'trail', 0.8);
      
      // Follow existing trail back to nest
      const homeDirection = this.followPheromoneTrail(pheromoneSystem, 'trail');
      if (homeDirection !== null) {
        return homeDirection;
      }
      
      // No trail found, use memory to return to nest
      const nestCenter = { x: 0, y: 0, z: 0 };
      const dx = nestCenter.x - this.position.x;
      const dy = nestCenter.y - this.position.y;
      return Math.atan2(dy, dx);
    } else {
      // SEARCHING FOR FOOD: Follow recruitment or trail pheromones
      const recruitmentDirection = this.followPheromoneTrail(pheromoneSystem, 'recruitment');
      const trailDirection = this.followPheromoneTrail(pheromoneSystem, 'trail');
      
      // Prefer recruitment pheromones (indicate fresh food sources)
      if (recruitmentDirection !== null) {
        const recruitmentInfluence = 0.8;
        const explorationInfluence = 0.2;
        const explorationDirection = this.spatialMemory.getExplorationDirection();
        
        return recruitmentDirection * recruitmentInfluence + explorationDirection * explorationInfluence;
      } else if (trailDirection !== null) {
        // Found a trail, follow it (might lead to food)
        const trailInfluence = 0.6;
        const explorationInfluence = 0.4;
        const explorationDirection = this.spatialMemory.getExplorationDirection();
        
        return trailDirection * trailInfluence + explorationDirection * explorationInfluence;
      } else {
        // No pheromone trails found, use memory-guided exploration
        const memoryInfluence = 0.4;
        const randomInfluence = 0.6;
        
        const memoryDirection = this.spatialMemory.getExplorationDirection();
        const randomDirection = this.rotation + (Math.random() - 0.5) * Math.PI * 0.5;
        
        return memoryDirection * memoryInfluence + randomDirection * randomInfluence;
      }
    }
  }

  private calculateConstructionDirection(): number {
    // Construction ants move toward work sites (for now, toward nest center)
    const nestCenter = { x: 0, y: 0 }; // Nest is at origin
    const dx = nestCenter.x - this.position.x;
    const dy = nestCenter.y - this.position.y;
    
    // If carrying materials, move toward nest; otherwise explore for materials
    if (this.carryingConstruction) {
      return Math.atan2(dy, dx);
    } else {
      // Look for construction materials (add some randomness)
      return this.rotation + (Math.random() - 0.5) * 0.5;
    }
  }

  private calculateNursingDirection(): number {
    // Nurse ants stay near nursery areas (close to nest center)
    const nestCenter = { x: 0, y: 0 };
    const dx = nestCenter.x - this.position.x;
    const dy = nestCenter.y - this.position.y;
    const distanceToNest = Math.sqrt(dx * dx + dy * dy);
    
    // If too far from nest, return to it; otherwise move gently around nursery
    if (distanceToNest > 10) {
      return Math.atan2(dy, dx);
    } else {
      // Gentle circular movement around nursery
      return this.rotation + 0.1;
    }
  }

  private calculateDefenseDirection(): number {
    // Defensive ants patrol territory or respond to threats
    const nestCenter = { x: 0, y: 0 };
    const dx = nestCenter.x - this.position.x;
    const dy = nestCenter.y - this.position.y;
    const distanceToNest = Math.sqrt(dx * dx + dy * dy);
    
    // Patrol around the nest perimeter
    const patrolRadius = 20;
    
    if (distanceToNest < patrolRadius * 0.8) {
      // Move outward to patrol perimeter
      return Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.3;
    } else if (distanceToNest > patrolRadius * 1.2) {
      // Move back toward nest
      return Math.atan2(dy, dx);
    } else {
      // Patrol along perimeter
      return this.rotation + 0.2;
    }
  }

  private calculateIdleDirection(): number {
    // Idle ants wander randomly but tend to stay near nest
    const nestCenter = { x: 0, y: 0 };
    const dx = nestCenter.x - this.position.x;
    const dy = nestCenter.y - this.position.y;
    const distanceToNest = Math.sqrt(dx * dx + dy * dy);
    
    // If too far from nest, slowly return; otherwise random walk
    if (distanceToNest > 30) {
      const returnDirection = Math.atan2(dy, dx);
      const randomComponent = (Math.random() - 0.5) * Math.PI;
      return returnDirection * 0.7 + randomComponent * 0.3;
    } else {
      // Random walk with slight bias toward current direction
      return this.rotation + (Math.random() - 0.5) * 1.0;
    }
  }

  private changeTask(newTask: string): void {
    this.currentTask = newTask;
    this.lastTaskChange = Date.now();
    
    // Reset carrying state when changing tasks
    if (newTask !== 'forage') {
      this.carryingFood = false;
    }
    if (newTask !== 'construct') {
      this.carryingConstruction = false;
    }
  }

  public die(cause: string): void {
    this.isAlive = false;
    console.log(`Ant ${this.id} died from ${cause} at age ${this.age.toFixed(2)} days`);
  }

  public reproduce(partner: AntEntity): AntEntity | null {
    if (!this.canReproduce() || !partner.canReproduce()) {
      return null;
    }

    // Create offspring through genetic combination
    const offspringGenetics = AntGenetics.reproduce(this.genetics, partner.genetics);
    const offspringId = `ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Offspring spawns near parents
    const offspringPosition = {
      x: this.position.x + (Math.random() - 0.5) * 2,
      y: this.position.y + (Math.random() - 0.5) * 2,
      z: this.position.z,
    };
    
    const offspring = new AntEntity(
      offspringId, 
      offspringPosition, 
      this.determineCaste(offspringGenetics),
      Math.max(this.generation, partner.generation) + 1,
    );
    
    offspring.genetics = offspringGenetics;
    
    return offspring;
  }

  private canReproduce(): boolean {
    return this.isAlive && 
           this.age > 7 && // Must be at least 7 days old
           this.physiology.health.hp > 0.5 &&
           (this.caste === AntCaste.QUEEN || this.caste === AntCaste.MALE);
  }

  private determineCaste(genetics: AntGenetics): AntCaste {
    // Simple caste determination based on genetics
    // In reality, this would be much more complex
    if (genetics.traits.size > 0.8 && genetics.traits.aggressiveness > 0.7) {
      return AntCaste.SOLDIER;
    } else if (genetics.traits.nurturingInstinct > 0.8) {
      return AntCaste.NURSE;
    } else if (genetics.traits.forageEfficiency > 0.8) {
      return AntCaste.FORAGER;
    } else if (genetics.traits.constructionAbility > 0.8) {
      return AntCaste.ARCHITECT;
    } else {
      return AntCaste.WORKER;
    }
  }

  private getCasteMassMultiplier(caste: AntCaste): number {
    const multipliers = {
      [AntCaste.QUEEN]: 3.0,
      [AntCaste.SOLDIER]: 1.5,
      [AntCaste.WORKER]: 1.0,
      [AntCaste.NURSE]: 0.9,
      [AntCaste.FORAGER]: 0.8,
      [AntCaste.ARCHITECT]: 1.1,
      [AntCaste.GUARD]: 1.3,
      [AntCaste.MALE]: 0.7,
    };
    return multipliers[caste] || 1.0;
  }

  private getCasteSizeMultiplier(caste: AntCaste): number {
    const multipliers = {
      [AntCaste.QUEEN]: 2.0,
      [AntCaste.SOLDIER]: 1.3,
      [AntCaste.WORKER]: 1.0,
      [AntCaste.NURSE]: 0.9,
      [AntCaste.FORAGER]: 0.8,
      [AntCaste.ARCHITECT]: 1.0,
      [AntCaste.GUARD]: 1.2,
      [AntCaste.MALE]: 0.9,
    };
    return multipliers[caste] || 1.0;
  }

  // Pheromone trail laying and following methods
  private layPheromoneTrail(pheromoneSystem: PheromoneSystem, type: PheromoneType, intensity: number): void {
    // Add a pheromone source at current position
    pheromoneSystem.addSource({
      position: { ...this.position },
      type: type,
      intensity: intensity * this.genetics.traits.communicationSkill, // Genetics affect pheromone strength
      radius: 2.0, // Trail radius
      duration: 30000, // Trail lasts 30 seconds
      owner: this.id,
    });
  }

  private followPheromoneTrail(pheromoneSystem: PheromoneSystem, type: PheromoneType): number | null {
    // Get pheromone gradient at current position to find trail direction
    const gradient = pheromoneSystem.getGradient(this.position, type);
    const concentration = pheromoneSystem.getConcentration(this.position, type);
    
    // Only follow if there's a detectable trail
    if (concentration < 0.1) {
      return null; // No significant trail found
    }
    
    // Calculate direction based on gradient
    const gradientMagnitude = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y);
    if (gradientMagnitude < 0.01) {
      return null; // Gradient too weak to follow
    }
    
    // Follow the gradient (ants follow concentration gradients)
    const trailDirection = Math.atan2(gradient.y, gradient.x);
    
    // Add some randomness to avoid perfect following (more realistic)
    const noise = (Math.random() - 0.5) * 0.3; // ±0.15 radians
    return trailDirection + noise;
  }

  private sensePheromoneEnvironment(pheromoneSystem: PheromoneSystem): Map<PheromoneType, number> {
    // Get all pheromone concentrations at current position
    return pheromoneSystem.getAllConcentrations(this.position);
  }

  // Data export for rendering
  public toRenderData(): AntEntityData {
    return {
      id: this.id,
      position: { ...this.position },
      rotation: this.rotation,
      caste: this.caste,
      health: this.physiology.health.hp / this.physiology.health.maxHp,
      energy: this.physiology.metabolic.energy,
      age: this.age,
      task: this.currentTask,
      carryingFood: this.carryingFood,
      carryingConstruction: this.carryingConstruction,
      speed: Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2),
      isAlive: this.isAlive,
      generation: this.generation,
    };
  }
}