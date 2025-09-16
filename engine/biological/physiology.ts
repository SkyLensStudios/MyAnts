/**
 * Comprehensive physiological systems for realistic ant simulation
 * Includes metabolism, aging, health, nutrition, and circadian rhythms
 */

import { GeneticTraits } from './genetics';

export interface MetabolicState {
  energy: number;           // Current energy level (0-1)
  maxEnergy: number;        // Maximum energy capacity
  metabolicRate: number;    // Rate of energy consumption
  efficiency: number;       // Energy conversion efficiency
  temperature: number;      // Body temperature
  hydration: number;        // Water level (0-1)
}

export interface HealthState {
  hp: number;              // Current health points
  maxHp: number;           // Maximum health points
  immunity: number;        // Disease resistance (0-1)
  injuries: Injury[];      // Current injuries
  diseases: Disease[];     // Active diseases
  stress: number;          // Stress level (0-1)
  toxicity: number;        // Accumulated toxins (0-1)
}

export interface NutritionalState {
  proteins: number;        // Protein reserves (0-1)
  carbohydrates: number;   // Carb reserves (0-1)
  fats: number;           // Fat reserves (0-1)
  vitamins: number;       // Vitamin levels (0-1)
  minerals: number;       // Mineral levels (0-1)
  lastMeal: number;       // Time since last feeding
}

export interface CircadianState {
  phase: 'dawn' | 'day' | 'dusk' | 'night';
  activityLevel: number;   // Current activity multiplier
  sleepDebt: number;      // Accumulated sleep debt
  alertness: number;      // Mental alertness (0-1)
}

export interface Injury {
  type: 'cut' | 'bruise' | 'bite' | 'burn' | 'fracture';
  severity: number;       // 0-1, affects healing time
  location: string;       // Body part affected
  healingRate: number;    // How fast it heals
  timeToHeal: number;     // Remaining healing time
}

export interface Disease {
  name: string;
  severity: number;       // 0-1, disease progression
  contagious: boolean;    // Can spread to other ants
  symptoms: string[];     // List of effects
  progression: number;    // Rate of worsening
  resistance: number;     // How hard to cure
}

export class PhysiologicalSystem {
  public metabolic: MetabolicState;
  public health: HealthState;
  public nutrition: NutritionalState;
  public circadian: CircadianState;
  public age: number;
  public genetics: GeneticTraits;
  
  // System parameters
  private baseMetabolicRate = 0.001;  // Energy consumed per tick
  private healingRate = 0.01;          // Base healing per tick
  private nutritionDecay = 0.0005;     // Nutrition loss per tick
  
  constructor(genetics: GeneticTraits) {
    this.genetics = genetics;
    this.age = 0;
    
    this.metabolic = this.initializeMetabolic();
    this.health = this.initializeHealth();
    this.nutrition = this.initializeNutrition();
    this.circadian = this.initializeCircadian();
  }

  private initializeMetabolic(): MetabolicState {
    return {
      energy: 1.0,
      maxEnergy: 100 * this.genetics.size,
      metabolicRate: this.baseMetabolicRate * (2 - this.genetics.thermalTolerance),
      efficiency: 0.7 + (this.genetics.forageEfficiency * 0.3),
      temperature: 25, // Normal ant body temperature
      hydration: 1.0,
    };
  }

  private initializeHealth(): HealthState {
    return {
      hp: 100 * this.genetics.size,
      maxHp: 100 * this.genetics.size,
      immunity: this.genetics.diseaseResistance,
      injuries: [],
      diseases: [],
      stress: 0,
      toxicity: 0,
    };
  }

  private initializeNutrition(): NutritionalState {
    return {
      proteins: 0.8,
      carbohydrates: 0.8,
      fats: 0.8,
      vitamins: 0.8,
      minerals: 0.8,
      lastMeal: 0,
    };
  }

  private initializeCircadian(): CircadianState {
    return {
      phase: 'day',
      activityLevel: 1.0,
      sleepDebt: 0,
      alertness: 1.0,
    };
  }

  /**
   * Update all physiological systems
   */
  public update(deltaTime: number, environment: any): void {
    this.updateMetabolism(deltaTime, environment);
    this.updateHealth(deltaTime);
    this.updateNutrition(deltaTime);
    this.updateCircadian(deltaTime, environment);
    this.updateAging(deltaTime);
  }

  private updateMetabolism(deltaTime: number, environment: any): void {
    // Energy consumption based on activity and environment
    let energyConsumption = this.metabolic.metabolicRate * deltaTime;
    
    // Temperature effects
    const tempDiff = Math.abs(environment.temperature - this.metabolic.temperature);
    if (tempDiff > 5) {
      energyConsumption *= 1 + (tempDiff / 20) * (1 - this.genetics.thermalTolerance);
    }
    
    // Activity-based consumption
    energyConsumption *= this.circadian.activityLevel;
    
    // Size-based metabolism
    energyConsumption *= this.genetics.size;
    
    this.metabolic.energy = Math.max(0, this.metabolic.energy - energyConsumption);
    
    // Hydration loss
    this.metabolic.hydration = Math.max(0, this.metabolic.hydration - 0.0001 * deltaTime);
    
    // Low energy effects
    if (this.metabolic.energy < 0.2) {
      this.health.stress += 0.001 * deltaTime;
    }
    
    // Dehydration effects
    if (this.metabolic.hydration < 0.3) {
      this.health.hp -= 0.1 * deltaTime;
      this.health.stress += 0.002 * deltaTime;
    }
  }

  private updateHealth(deltaTime: number): void {
    // Heal injuries
    this.health.injuries = this.health.injuries.filter(injury => {
      injury.timeToHeal -= this.healingRate * this.genetics.diseaseResistance * deltaTime;
      return injury.timeToHeal > 0;
    });
    
    // Disease progression
    this.health.diseases.forEach(disease => {
      if (Math.random() < disease.progression * deltaTime) {
        disease.severity += 0.01;
        this.health.hp -= disease.severity * 0.5;
        
        // Recovery chance based on immunity
        if (Math.random() < this.health.immunity * 0.01 * deltaTime) {
          disease.severity -= 0.02;
        }
      }
    });
    
    // Remove cured diseases
    this.health.diseases = this.health.diseases.filter(disease => disease.severity > 0);
    
    // Stress effects
    if (this.health.stress > 0.7) {
      this.health.immunity *= 0.999; // Stress reduces immunity
      this.metabolic.efficiency *= 0.999; // Stress reduces efficiency
    }
    
    // Natural stress recovery
    this.health.stress = Math.max(0, this.health.stress - 0.001 * deltaTime);
    
    // Toxin elimination
    this.health.toxicity = Math.max(0, this.health.toxicity - 0.002 * deltaTime);
    
    // Health regeneration when well-fed and rested
    if (this.metabolic.energy > 0.8 && this.health.stress < 0.3) {
      this.health.hp = Math.min(this.health.maxHp, 
        this.health.hp + this.healingRate * deltaTime);
    }
  }

  private updateNutrition(deltaTime: number): void {
    // Natural nutrient depletion
    this.nutrition.proteins = Math.max(0, this.nutrition.proteins - this.nutritionDecay * deltaTime);
    this.nutrition.carbohydrates = Math.max(0, this.nutrition.carbohydrates - this.nutritionDecay * 2 * deltaTime);
    this.nutrition.fats = Math.max(0, this.nutrition.fats - this.nutritionDecay * 0.5 * deltaTime);
    this.nutrition.vitamins = Math.max(0, this.nutrition.vitamins - this.nutritionDecay * deltaTime);
    this.nutrition.minerals = Math.max(0, this.nutrition.minerals - this.nutritionDecay * deltaTime);
    
    this.nutrition.lastMeal += deltaTime;
    
    // Malnutrition effects
    const avgNutrition = (this.nutrition.proteins + this.nutrition.carbohydrates + 
                         this.nutrition.fats + this.nutrition.vitamins + this.nutrition.minerals) / 5;
    
    if (avgNutrition < 0.3) {
      this.health.hp -= 0.05 * deltaTime;
      this.metabolic.efficiency *= 0.99;
      this.health.immunity *= 0.99;
    }
    
    // Starvation
    if (this.nutrition.lastMeal > 1000) { // Extended period without food
      this.health.hp -= 0.1 * deltaTime;
      this.health.stress += 0.005 * deltaTime;
    }
  }

  private updateCircadian(deltaTime: number, environment: any): void {
    // Update circadian phase based on time of day
    const timeOfDay = environment.timeOfDay || 0; // 0-24 hours
    
    if (timeOfDay >= 5 && timeOfDay < 7) {
      this.circadian.phase = 'dawn';
      this.circadian.activityLevel = 0.7;
    } else if (timeOfDay >= 7 && timeOfDay < 18) {
      this.circadian.phase = 'day';
      this.circadian.activityLevel = 1.0;
    } else if (timeOfDay >= 18 && timeOfDay < 20) {
      this.circadian.phase = 'dusk';
      this.circadian.activityLevel = 0.8;
    } else {
      this.circadian.phase = 'night';
      this.circadian.activityLevel = 0.3;
    }
    
    // Sleep debt accumulation
    if (this.circadian.phase === 'night' && this.circadian.activityLevel > 0.5) {
      this.circadian.sleepDebt += 0.001 * deltaTime;
    } else if (this.circadian.phase === 'night' && this.circadian.activityLevel <= 0.5) {
      this.circadian.sleepDebt = Math.max(0, this.circadian.sleepDebt - 0.002 * deltaTime);
    }
    
    // Alertness based on sleep debt and energy
    this.circadian.alertness = Math.max(0.1, 
      (1 - this.circadian.sleepDebt) * (this.metabolic.energy / this.metabolic.maxEnergy));
  }

  private updateAging(deltaTime: number): void {
    this.age += deltaTime;
    
    // Age-related decline
    const ageRatio = this.age / (this.genetics.lifespan * 1000); // Convert to simulation time
    
    if (ageRatio > 0.5) {
      const decline = (ageRatio - 0.5) * 2;
      
      // Physical decline
      this.health.maxHp *= (1 - 0.0001 * decline * deltaTime);
      this.metabolic.maxEnergy *= (1 - 0.0001 * decline * deltaTime);
      this.metabolic.efficiency *= (1 - 0.00005 * decline * deltaTime);
      
      // Increased disease susceptibility
      this.health.immunity *= (1 - 0.00002 * decline * deltaTime);
    }
    
    // Natural death from old age
    if (ageRatio > 1.0) {
      this.health.hp = 0;
    }
  }

  /**
   * Feed the ant with specific nutrients
   */
  public feed(food: { proteins: number; carbs: number; fats: number; vitamins: number; minerals: number }): void {
    const efficiency = this.metabolic.efficiency;
    
    this.nutrition.proteins = Math.min(1, this.nutrition.proteins + food.proteins * efficiency);
    this.nutrition.carbohydrates = Math.min(1, this.nutrition.carbohydrates + food.carbs * efficiency);
    this.nutrition.fats = Math.min(1, this.nutrition.fats + food.fats * efficiency);
    this.nutrition.vitamins = Math.min(1, this.nutrition.vitamins + food.vitamins * efficiency);
    this.nutrition.minerals = Math.min(1, this.nutrition.minerals + food.minerals * efficiency);
    
    this.nutrition.lastMeal = 0;
    
    // Energy restoration
    const energyGain = (food.carbs * 0.5 + food.fats * 0.3 + food.proteins * 0.2) * efficiency;
    this.metabolic.energy = Math.min(this.metabolic.maxEnergy, this.metabolic.energy + energyGain);
  }

  /**
   * Apply damage to the ant
   */
  public takeDamage(amount: number, type: 'physical' | 'chemical' | 'thermal' = 'physical'): void {
    let actualDamage = amount;
    
    // Genetic resistance
    if (type === 'chemical') {
      actualDamage *= (1 - this.genetics.diseaseResistance * 0.5);
    } else if (type === 'thermal') {
      actualDamage *= (1 - this.genetics.thermalTolerance * 0.3);
    }
    
    this.health.hp = Math.max(0, this.health.hp - actualDamage);
    this.health.stress += actualDamage * 0.01;
    
    // Add injury
    if (actualDamage > 5) {
      const injuryTypes: Array<Injury['type']> = ['cut', 'bruise', 'bite', 'burn', 'fracture'];
      const injury: Injury = {
        type: injuryTypes[Math.floor(Math.random() * injuryTypes.length)],
        severity: Math.min(1, actualDamage / 20),
        location: 'body',
        healingRate: this.healingRate,
        timeToHeal: actualDamage * 2,
      };
      this.health.injuries.push(injury);
    }
  }

  /**
   * Expose to disease
   */
  public exposeToDisease(disease: Omit<Disease, 'severity'>): void {
    const infectionChance = 1 - this.health.immunity;
    
    if (Math.random() < infectionChance) {
      const newDisease: Disease = {
        ...disease,
        severity: 0.1,
      };
      this.health.diseases.push(newDisease);
    }
  }

  /**
   * Get overall health status
   */
  public getHealthStatus(): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const healthRatio = this.health.hp / this.health.maxHp;
    const energyRatio = this.metabolic.energy / this.metabolic.maxEnergy;
    const overall = (healthRatio + energyRatio) / 2;
    
    if (overall > 0.9) return 'excellent';
    if (overall > 0.7) return 'good';
    if (overall > 0.5) return 'fair';
    if (overall > 0.2) return 'poor';
    return 'critical';
  }

  /**
   * Check if ant is alive
   */
  public isAlive(): boolean {
    return this.health.hp > 0;
  }

  /**
   * Get performance multiplier based on current state
   */
  public getPerformanceMultiplier(): number {
    const healthFactor = this.health.hp / this.health.maxHp;
    const energyFactor = this.metabolic.energy / this.metabolic.maxEnergy;
    const stressFactor = 1 - this.health.stress;
    const alertnessFactor = this.circadian.alertness;
    
    return (healthFactor + energyFactor + stressFactor + alertnessFactor) / 4;
  }
}