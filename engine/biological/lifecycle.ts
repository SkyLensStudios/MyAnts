/**
 * Realistic ant lifecycle management system
 * Handles egg laying, larval development, pupation, and adult emergence
 */

import { AntGenetics, GeneticTraits } from './genetics';
import { PhysiologicalSystem } from './physiology';

export type AntCaste = 'queen' | 'worker' | 'soldier' | 'male' | 'larvae' | 'pupae' | 'egg';
export type LifecycleStage = 'egg' | 'larva' | 'pupa' | 'adult';

export interface DevelopmentStage {
  stage: LifecycleStage;
  progress: number;        // 0-1, development completion
  timeInStage: number;     // Time spent in current stage
  requiredTime: number;    // Time needed to advance to next stage
  temperature: number;     // Optimal development temperature
  nutrition: number;       // Nutrition required for development
}

export interface EggState extends DevelopmentStage {
  stage: 'egg';
  fertilized: boolean;     // Whether egg can develop into worker/soldier
  parentGenetics: [AntGenetics, AntGenetics?]; // Parent genetics
  laid: number;           // Time when egg was laid
  viability: number;      // Chance of successful hatching (0-1)
}

export interface LarvaState extends DevelopmentStage {
  stage: 'larva';
  instar: number;         // Larval stage (1-3 for ants)
  caste: AntCaste;        // Determined caste
  size: number;           // Current size
  targetSize: number;     // Adult target size
  fedCount: number;       // Number of times fed
  molts: number;          // Number of molts completed
}

export interface PupaState extends DevelopmentStage {
  stage: 'pupa';
  caste: AntCaste;
  metamorphosis: number;  // Metamorphosis progress (0-1)
  organDevelopment: {
    nervous: number;      // Brain development
    digestive: number;    // Digestive system
    respiratory: number;  // Breathing system
    reproductive: number; // Reproductive organs
  };
}

export interface AdultState {
  stage: 'adult';
  caste: AntCaste;
  age: number;
  mature: boolean;        // Reached sexual maturity
  reproductive: boolean;  // Can reproduce
  productivity: number;   // Work efficiency
}

export class AntLifecycle {
  public currentStage: DevelopmentStage | AdultState;
  public genetics: AntGenetics;
  public physiology?: PhysiologicalSystem;
  public id: string;
  public colonyId: string;
  
  // Development parameters
  private static readonly STAGE_DURATIONS = {
    egg: 240,      // 4 minutes at normal speed (10 days real time)
    larva: 1800,   // 30 minutes (3 weeks real time)
    pupa: 720,     // 12 minutes (2 weeks real time)
  };
  
  constructor(
    genetics: AntGenetics,
    colonyId: string,
    initialStage: LifecycleStage = 'egg',
    parentGenetics?: [AntGenetics, AntGenetics?]
  ) {
    this.genetics = genetics;
    this.colonyId = colonyId;
    this.id = this.generateId();
    
    this.currentStage = this.initializeStage(initialStage, parentGenetics);
  }

  private generateId(): string {
    return `ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeStage(
    stage: LifecycleStage,
    parentGenetics?: [AntGenetics, AntGenetics?]
  ): DevelopmentStage | AdultState {
    switch (stage) {
      case 'egg':
        return this.createEggState(parentGenetics);
      case 'larva':
        return this.createLarvaState();
      case 'pupa':
        return this.createPupaState();
      case 'adult':
        this.physiology = new PhysiologicalSystem(this.genetics.traits);
        return this.createAdultState();
    }
  }

  private createEggState(parentGenetics?: [AntGenetics, AntGenetics?]): EggState {
    return {
      stage: 'egg',
      progress: 0,
      timeInStage: 0,
      requiredTime: AntLifecycle.STAGE_DURATIONS.egg * (1 + Math.random() * 0.2),
      temperature: 25,
      nutrition: 1.0,
      fertilized: parentGenetics ? parentGenetics.length === 2 : false,
      parentGenetics: parentGenetics || [this.genetics],
      laid: Date.now(),
      viability: this.calculateViability(),
    };
  }

  private createLarvaState(): LarvaState {
    return {
      stage: 'larva',
      progress: 0,
      timeInStage: 0,
      requiredTime: AntLifecycle.STAGE_DURATIONS.larva * (1 + Math.random() * 0.3),
      temperature: 25,
      nutrition: 0.8,
      instar: 1,
      caste: this.determineCaste(),
      size: 0.1,
      targetSize: this.genetics.traits.size,
      fedCount: 0,
      molts: 0,
    };
  }

  private createPupaState(): PupaState {
    const caste = (this.currentStage as LarvaState).caste || this.determineCaste();
    return {
      stage: 'pupa',
      progress: 0,
      timeInStage: 0,
      requiredTime: AntLifecycle.STAGE_DURATIONS.pupa * (1 + Math.random() * 0.15),
      temperature: 25,
      nutrition: 1.0,
      caste,
      metamorphosis: 0,
      organDevelopment: {
        nervous: 0,
        digestive: 0,
        respiratory: 0,
        reproductive: caste === 'queen' || caste === 'male' ? 0 : 1, // Workers sterile
      },
    };
  }

  private createAdultState(): AdultState {
    const caste = this.currentStage.stage === 'pupa' 
      ? (this.currentStage as PupaState).caste 
      : this.determineCaste();
      
    return {
      stage: 'adult',
      caste,
      age: 0,
      mature: false,
      reproductive: caste === 'queen' || caste === 'male',
      productivity: this.genetics.traits.forageEfficiency,
    };
  }

  private calculateViability(): number {
    let viability = 0.95; // Base viability
    
    // Genetic health factors
    viability *= this.genetics.traits.diseaseResistance;
    viability *= (1 - Math.abs(this.genetics.traits.size - 1) * 0.2); // Extreme sizes less viable
    
    // Mutation effects
    this.genetics.markers.mutations.forEach(mutation => {
      switch (mutation) {
        case 'improved_disease_resistance':
          viability += 0.05;
          break;
        case 'enhanced_pheromone_production':
          viability += 0.02;
          break;
        default:
          // Some mutations may reduce viability
          if (Math.random() < 0.3) {
            viability -= 0.02;
          }
      }
    });
    
    return Math.max(0.1, Math.min(1, viability));
  }

  private determineCaste(): AntCaste {
    const eggState = this.currentStage as EggState;
    
    // Unfertilized eggs become males
    if (!eggState.fertilized) {
      return 'male';
    }
    
    // Colony needs and genetics determine caste
    const random = Math.random();
    const aggressiveness = this.genetics.traits.aggressiveness;
    const size = this.genetics.traits.size;
    
    // Queens are extremely rare and only in new colonies
    if (random < 0.001 && size > 1.2) {
      return 'queen';
    }
    
    // Soldiers: larger, more aggressive ants
    if (random < 0.15 && (aggressiveness > 0.7 || size > 1.1)) {
      return 'soldier';
    }
    
    // Default to worker
    return 'worker';
  }

  /**
   * Update lifecycle progression
   */
  public update(deltaTime: number, environment: any): boolean {
    if (this.currentStage.stage === 'adult') {
      return this.updateAdult(deltaTime);
    } else {
      return this.updateDevelopment(deltaTime, environment);
    }
  }

  private updateDevelopment(deltaTime: number, environment: any): boolean {
    const stage = this.currentStage as DevelopmentStage;
    
    // Environmental effects on development
    const tempEffect = this.calculateTemperatureEffect(environment.temperature || 25);
    const nutritionEffect = stage.nutrition;
    
    // Development rate
    const developmentRate = deltaTime * tempEffect * nutritionEffect;
    stage.timeInStage += deltaTime;
    stage.progress = Math.min(1, stage.timeInStage / stage.requiredTime * developmentRate);
    
    // Stage-specific updates
    switch (stage.stage) {
      case 'egg':
        return this.updateEgg(deltaTime, environment);
      case 'larva':
        return this.updateLarva(deltaTime, environment);
      case 'pupa':
        return this.updatePupa(deltaTime, environment);
    }
    
    return true;
  }

  private updateEgg(deltaTime: number, environment: any): boolean {
    const eggState = this.currentStage as EggState;
    
    // Check viability
    if (Math.random() < (1 - eggState.viability) * 0.001 * deltaTime) {
      return false; // Egg died
    }
    
    // Hatch when ready
    if (eggState.progress >= 1) {
      this.advance();
    }
    
    return true;
  }

  private updateLarva(deltaTime: number, environment: any): boolean {
    const larvaState = this.currentStage as LarvaState;
    
    // Growth
    larvaState.size = larvaState.targetSize * larvaState.progress;
    
    // Molting
    if (larvaState.progress > 0.33 && larvaState.molts === 0) {
      this.molt(larvaState);
    } else if (larvaState.progress > 0.66 && larvaState.molts === 1) {
      this.molt(larvaState);
    }
    
    // Nutrition requirements increase with size
    larvaState.nutrition = Math.max(0, larvaState.nutrition - 0.01 * deltaTime * larvaState.size);
    
    // Starvation
    if (larvaState.nutrition < 0.2) {
      return false; // Larva died from starvation
    }
    
    // Pupation when ready
    if (larvaState.progress >= 1) {
      this.advance();
    }
    
    return true;
  }

  private updatePupa(deltaTime: number, environment: any): boolean {
    const pupaState = this.currentStage as PupaState;
    
    // Organ development
    pupaState.metamorphosis = pupaState.progress;
    pupaState.organDevelopment.nervous = Math.min(1, pupaState.metamorphosis * 1.2);
    pupaState.organDevelopment.digestive = Math.min(1, pupaState.metamorphosis * 0.8);
    pupaState.organDevelopment.respiratory = Math.min(1, pupaState.metamorphosis * 1.1);
    
    if (pupaState.caste === 'queen' || pupaState.caste === 'male') {
      pupaState.organDevelopment.reproductive = Math.min(1, pupaState.metamorphosis * 0.9);
    }
    
    // Emergence when ready
    if (pupaState.progress >= 1) {
      this.advance();
    }
    
    return true;
  }

  private updateAdult(deltaTime: number): boolean {
    const adultState = this.currentStage as AdultState;
    
    adultState.age += deltaTime;
    
    // Maturation
    if (!adultState.mature && adultState.age > 100) {
      adultState.mature = true;
    }
    
    // Age-related productivity decline
    const maxAge = this.genetics.traits.lifespan * 1000;
    if (adultState.age > maxAge * 0.7) {
      const decline = (adultState.age - maxAge * 0.7) / (maxAge * 0.3);
      adultState.productivity *= (1 - decline * 0.5);
    }
    
    // Update physiology if adult
    if (this.physiology) {
      this.physiology.update(deltaTime, {});
      return this.physiology.isAlive();
    }
    
    return true;
  }

  private molt(larvaState: LarvaState): void {
    larvaState.molts++;
    larvaState.instar++;
    larvaState.size *= 1.5; // Growth spurt during molt
    larvaState.nutrition = 1.0; // Reset nutrition after successful molt
  }

  private calculateTemperatureEffect(temperature: number): number {
    const optimal = 25; // Optimal temperature for ant development
    const tolerance = 10; // Temperature tolerance range
    
    const diff = Math.abs(temperature - optimal);
    if (diff <= tolerance) {
      return 1.0; // Optimal development rate
    } else {
      return Math.max(0.1, 1 - (diff - tolerance) / 20); // Reduced rate outside tolerance
    }
  }

  /**
   * Advance to next life stage
   */
  public advance(): void {
    switch (this.currentStage.stage) {
      case 'egg':
        this.currentStage = this.createLarvaState();
        break;
      case 'larva':
        this.currentStage = this.createPupaState();
        break;
      case 'pupa':
        this.currentStage = this.createAdultState();
        this.physiology = new PhysiologicalSystem(this.genetics.traits);
        break;
    }
  }

  /**
   * Feed larva (only applicable to larval stage)
   */
  public feed(nutritionValue: number): boolean {
    if (this.currentStage.stage === 'larva') {
      const larvaState = this.currentStage as LarvaState;
      larvaState.nutrition = Math.min(1, larvaState.nutrition + nutritionValue);
      larvaState.fedCount++;
      return true;
    }
    return false;
  }

  /**
   * Get current development information
   */
  public getDevelopmentInfo(): {
    stage: string;
    progress: number;
    timeRemaining: number;
    caste?: AntCaste;
  } {
    if (this.currentStage.stage === 'adult') {
      const adultState = this.currentStage as AdultState;
      return {
        stage: 'adult',
        progress: 1,
        timeRemaining: 0,
        caste: adultState.caste,
      };
    }
    
    const devStage = this.currentStage as DevelopmentStage;
    return {
      stage: devStage.stage,
      progress: devStage.progress,
      timeRemaining: devStage.requiredTime - devStage.timeInStage,
      caste: 'caste' in devStage ? (devStage as any).caste : undefined,
    };
  }

  /**
   * Check if ant has reached adulthood
   */
  public isAdult(): boolean {
    return this.currentStage.stage === 'adult';
  }

  /**
   * Get adult ant data (only if adult)
   */
  public getAdultData(): AdultState | null {
    return this.isAdult() ? (this.currentStage as AdultState) : null;
  }

  /**
   * Apply environmental stress to development
   */
  public applyStress(stressType: 'temperature' | 'nutrition' | 'disease', intensity: number): void {
    if (this.currentStage.stage !== 'adult') {
      const stage = this.currentStage as DevelopmentStage;
      
      switch (stressType) {
        case 'temperature':
          stage.requiredTime *= (1 + intensity * 0.5);
          break;
        case 'nutrition':
          stage.nutrition = Math.max(0, stage.nutrition - intensity);
          break;
        case 'disease':
          if (this.currentStage.stage === 'egg') {
            (stage as EggState).viability *= (1 - intensity * 0.3);
          }
          break;
      }
    }
  }
}