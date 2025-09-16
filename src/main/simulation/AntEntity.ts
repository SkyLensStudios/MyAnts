/**
 * AntEntity - Comprehensive ant representation
 * Integrates all biological, AI, and behavioral systems for individual ants
 */

import { AntGenetics } from '../../../engine/biological/genetics';
import { PhysiologicalSystem } from '../../../engine/biological/physiology';
import { BehaviorDecisionTree } from '../../../engine/ai/decisionTree';
import { SpatialMemory } from '../../../engine/ai/spatialMemory';
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
      this.genetics
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
    this.updateMovement(deltaTime);
    
    // Update task-specific behaviors
    this.updateTaskBehavior(deltaTime);
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

  private updateMovement(deltaTime: number): void {
    // Basic movement based on current task and genetics
    const baseSpeed = this.genetics.traits.speed;
    const currentSpeed = this.getCurrentSpeed() * baseSpeed;
    
    // Simple random movement for now - could be enhanced with pathfinding
    const direction = this.rotation;
    
    this.velocity.x = Math.cos(direction) * currentSpeed;
    this.velocity.y = Math.sin(direction) * currentSpeed;
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Occasionally change direction
    if (Math.random() < 0.05) { // 5% chance per update
      this.rotation += (Math.random() - 0.5) * 0.5;
    }
  }

  private updateTaskBehavior(deltaTime: number): void {
    switch (this.currentTask) {
      case 'forage':
        this.updateForaging(deltaTime);
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

  private updateForaging(deltaTime: number): void {
    // TODO: Implement foraging behavior
    // - Search for food sources
    // - Follow pheromone trails
    // - Carry food back to nest
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
      this.physiology.metabolic.energy + 0.1 * deltaTime
    );
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
      Math.max(this.generation, partner.generation) + 1
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