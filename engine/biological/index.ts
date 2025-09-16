/**
 * Biological Systems Engine
 * Integrates disease, nutrition, genetics, and physiological systems
 */

import { DiseaseSystem, DiseaseType, TransmissionMode, Pathogen, Infection } from './diseaseSystem';
import { 
  NutritionMetabolismSystem, 
  NutrientType, 
  VitaminType, 
  MineralType, 
  FoodSource, 
  NutritionalStatus 
} from './nutritionMetabolism';

export interface BiologicalProfile {
  antId: string;
  species: string;
  
  // Genetic factors
  genetics: GeneticProfile;
  
  // Physical characteristics
  physiology: PhysiologyProfile;
  
  // Health status
  health: HealthStatus;
  
  // Life stage
  lifeStage: LifeStage;
  ageInDays: number;
  
  // Environmental adaptations
  adaptations: Map<string, number>;
}

export interface GeneticProfile {
  // Core genetic traits
  diseaseResistance: Map<DiseaseType, number>; // 0-1 resistance to each disease type
  metabolicEfficiency: number;                 // 0-1 efficiency of energy use
  lifespanGenetics: number;                   // Genetic component of lifespan
  stressResistance: number;                   // 0-1 resistance to environmental stress
  
  // Nutritional genetics
  digestiveEfficiency: number;                // 0-1 nutrient absorption capability
  toxinResistance: number;                   // 0-1 resistance to dietary toxins
  vitaminSynthesis: Map<VitaminType, number>; // Ability to synthesize vitamins
  
  // Environmental adaptation genes
  temperatureTolerance: { min: number; max: number }; // °C range
  humidityTolerance: { min: number; max: number };    // 0-1 range
  altitudeTolerance: number;                         // Maximum altitude tolerance
  
  // Behavioral genetics
  aggressionGenetics: number;                        // 0-1 genetic aggression level
  explorationGenetics: number;                       // 0-1 tendency to explore
  socialGenetics: number;                           // 0-1 social behavior strength
  
  // Reproduction genetics
  fertilityGenetics: number;                        // 0-1 reproductive capability
  parentalCareGenetics: number;                     // 0-1 care-giving behavior
  
  // Mutation and evolution
  mutationRate: number;                             // 0-1 genetic change rate
  parentGenetics: string[];                         // Parent genetic IDs
  generationNumber: number;                         // Generation from colony founding
}

export interface PhysiologyProfile {
  // Physical dimensions
  bodyLength: number;                               // mm
  bodyWeight: number;                              // mg
  thoraxSize: number;                              // mm
  abdomenSize: number;                             // mm
  
  // Sensory capabilities
  visualAcuity: number;                            // 0-1 vision quality
  olfactorySensitivity: number;                    // 0-1 smell sensitivity
  tactileSensitivity: number;                      // 0-1 touch sensitivity
  vibrationSensitivity: number;                    // 0-1 vibration detection
  
  // Physical capabilities
  maxSpeed: number;                                // mm/s maximum speed
  carryingCapacity: number;                        // mg maximum carry weight
  mandibleStrength: number;                        // N bite force
  grippingStrength: number;                        // N grip force
  
  // Respiratory and circulatory
  oxygenEfficiency: number;                        // 0-1 oxygen use efficiency
  circulationEfficiency: number;                   // 0-1 blood circulation
  
  // Thermoregulation
  heatProduction: number;                          // Heat generated per activity
  heatDissipation: number;                         // Heat loss rate
  thermalMass: number;                            // Thermal inertia
  
  // Immune system
  immuneSystemStrength: number;                    // 0-1 immune capability
  immuneMemory: Map<string, number>;               // Pathogen -> immunity level
  autoimmuneFactor: number;                        // 0-1 autoimmune tendency
  
  // Digestive system
  stomachCapacity: number;                         // mg food capacity
  digestionRate: number;                           // mg/hour processing rate
  nutrientAbsorption: Map<NutrientType, number>;   // Absorption efficiency per nutrient
  
  // Nervous system
  reactionTime: number;                            // ms response time
  memoryCapacity: number;                          // 0-1 memory retention
  learningRate: number;                            // 0-1 learning speed
  stressThreshold: number;                         // 0-1 stress tolerance
}

export interface HealthStatus {
  // Overall health metrics
  overallHealth: number;                           // 0-1 general health
  vitalityScore: number;                          // 0-1 energy and vigor
  fitnessLevel: number;                           // 0-1 physical fitness
  
  // Current conditions
  activeInfections: Infection[];                   // Current disease infections
  chronicConditions: string[];                     // Long-term health issues
  injuries: Injury[];                              // Physical injuries
  
  // Health trends
  healthTrend: number;                            // -1 to 1, improving/declining
  mortalityRisk: number;                          // 0-1 probability of death
  recoveryRate: number;                           // 0-1 healing speed
  
  // Stress and mental health
  stressLevel: number;                            // 0-1 current stress
  mentalHealth: number;                           // 0-1 psychological wellbeing
  socialHealth: number;                           // 0-1 social connection quality
  
  // Age-related factors
  agingRate: number;                              // Rate of aging process
  senescenceMarkers: Map<string, number>;         // Aging indicators
  
  // Environmental health
  environmentalAdaptation: number;                 // 0-1 adaptation to current environment
  toxinLoad: Map<string, number>;                 // Accumulated toxins
}

export interface Injury {
  id: string;
  type: 'cut' | 'bruise' | 'break' | 'burn' | 'infection' | 'amputation';
  severity: number;                               // 0-1 injury severity
  location: string;                               // Body part affected
  healingProgress: number;                        // 0-1 healing completion
  infectionRisk: number;                          // 0-1 risk of infection
  permanentDamage: number;                        // 0-1 lasting impairment
  painLevel: number;                              // 0-1 current pain
  timestamp: number;                              // When injury occurred
}

export enum LifeStage {
  EGG = 'egg',
  LARVA = 'larva',
  PUPA = 'pupa',
  YOUNG_ADULT = 'young_adult',
  MATURE_ADULT = 'mature_adult',
  OLD_ADULT = 'old_adult',
  SENESCENT = 'senescent'
}

export interface BiologicalEvent {
  timestamp: number;
  antId: string;
  type: 'birth' | 'maturation' | 'injury' | 'recovery' | 'death' | 'mutation' | 'adaptation';
  description: string;
  severity: number;                               // 0-1 importance of event
  biologicalImpact: Map<string, number>;          // Impact on biological systems
  environmentalFactors: Map<string, number>;      // Environmental context
}

/**
 * Comprehensive biological systems integration
 */
export class BiologicalSystemsEngine {
  private diseaseSystem: DiseaseSystem;
  private nutritionSystem: NutritionMetabolismSystem;
  
  private biologicalProfiles: Map<string, BiologicalProfile>;
  private biologicalEvents: BiologicalEvent[];
  private speciesData: Map<string, SpeciesCharacteristics>;
  
  // Environmental context
  private environmentalStressors: Map<string, number>;
  private seasonalBiologicalFactors: Map<string, number>;
  
  constructor() {
    this.diseaseSystem = new DiseaseSystem();
    this.nutritionSystem = new NutritionMetabolismSystem();
    
    this.biologicalProfiles = new Map();
    this.biologicalEvents = [];
    this.speciesData = new Map();
    this.environmentalStressors = new Map();
    this.seasonalBiologicalFactors = new Map();
    
    this.initializeSpeciesData();
  }

  private initializeSpeciesData(): void {
    // Example species: Fire Ant (Solenopsis invicta)
    this.speciesData.set('fire_ant', {
      name: 'Fire Ant',
      scientificName: 'Solenopsis invicta',
      averageLifespan: 45, // days for workers
      maturationTime: 21,  // days from egg to adult
      
      // Physical characteristics
      baseBodyLength: 3.5,   // mm
      baseBodyWeight: 2.0,   // mg
      carryingCapacityRatio: 50, // times body weight
      
      // Physiological ranges
      temperatureRange: { min: 10, max: 40 }, // °C
      humidityRange: { min: 0.3, max: 0.9 },
      
      // Genetic defaults
      baseDiseaseResistance: 0.6,
      baseMetabolicEfficiency: 0.7,
      baseStressResistance: 0.8,
      
      // Nutritional characteristics
      primaryNutrients: [NutrientType.CARBOHYDRATES, NutrientType.PROTEINS],
      secondaryNutrients: [NutrientType.FATS, NutrientType.WATER],
      vitaminRequirements: [VitaminType.VITAMIN_B1, VitaminType.VITAMIN_C],
      
      // Behavioral traits
      aggressionLevel: 0.8,
      socialStructure: 'eusocial',
      territorialBehavior: 0.9,
      
      // Environmental preferences
      preferredHabitat: 'terrestrial',
      nestingDepth: 0.5,  // meters
      foragingRange: 100  // meters
    });

    // Example species: Leafcutter Ant (Atta cephalotes)
    this.speciesData.set('leafcutter_ant', {
      name: 'Leafcutter Ant',
      scientificName: 'Atta cephalotes',
      averageLifespan: 60,
      maturationTime: 28,
      
      baseBodyLength: 5.0,
      baseBodyWeight: 8.0,
      carryingCapacityRatio: 20,
      
      temperatureRange: { min: 18, max: 35 },
      humidityRange: { min: 0.6, max: 0.95 },
      
      baseDiseaseResistance: 0.4, // More susceptible due to fungal cultivation
      baseMetabolicEfficiency: 0.8,
      baseStressResistance: 0.6,
      
      primaryNutrients: [NutrientType.CARBOHYDRATES, NutrientType.PROTEINS],
      secondaryNutrients: [NutrientType.VITAMINS, NutrientType.MINERALS],
      vitaminRequirements: [VitaminType.VITAMIN_B1, VitaminType.VITAMIN_B2, VitaminType.NIACIN],
      
      aggressionLevel: 0.4,
      socialStructure: 'eusocial',
      territorialBehavior: 0.6,
      
      preferredHabitat: 'forest',
      nestingDepth: 2.0,
      foragingRange: 300
    });
  }

  // Main simulation method
  public simulateDay(
    populationData: any,
    environmentalFactors: Map<string, number>,
    seasonalFactor: number
  ): void {
    // Update environmental context
    this.updateEnvironmentalContext(environmentalFactors, seasonalFactor);

    // Simulate disease progression and transmission
    this.diseaseSystem.simulateDay(populationData, environmentalFactors, this.calculateColonyStress());

    // Simulate nutrition and metabolism
    this.nutritionSystem.simulateDay(populationData, environmentalFactors, this.getFoodAvailability());

    // Process biological aging and development
    this.processAging();

    // Handle genetic mutations and adaptations
    this.processGeneticChanges();

    // Update physiological status
    this.updatePhysiologicalStatus();

    // Process injuries and healing
    this.processInjuriesAndHealing();

    // Update overall health status
    this.updateHealthStatus();

    // Biological events are recorded throughout the day by individual processes
  }

  private updateEnvironmentalContext(factors: Map<string, number>, seasonalFactor: number): void {
    // Update environmental stressors
    const temperature = factors.get('temperature') || 20;
    const humidity = factors.get('humidity') || 0.6;
    const toxins = factors.get('environmental_toxins') || 0.1;
    const predationPressure = factors.get('predation_pressure') || 0.3;

    this.environmentalStressors.set('temperature_stress', this.calculateTemperatureStress(temperature));
    this.environmentalStressors.set('humidity_stress', this.calculateHumidityStress(humidity));
    this.environmentalStressors.set('toxin_stress', toxins);
    this.environmentalStressors.set('predation_stress', predationPressure);

    // Update seasonal biological factors
    this.seasonalBiologicalFactors.set('metabolic_rate', this.calculateSeasonalMetabolicRate(seasonalFactor));
    this.seasonalBiologicalFactors.set('immune_function', this.calculateSeasonalImmuneFunction(seasonalFactor));
    this.seasonalBiologicalFactors.set('reproduction_rate', this.calculateSeasonalReproductionRate(seasonalFactor));
  }

  private calculateTemperatureStress(temperature: number): number {
    // Calculate stress based on deviation from optimal temperature range
    const optimalMin = 20;
    const optimalMax = 30;
    
    if (temperature >= optimalMin && temperature <= optimalMax) {
      return 0;
    } else if (temperature < optimalMin) {
      return Math.min(1, (optimalMin - temperature) / 10);
    } else {
      return Math.min(1, (temperature - optimalMax) / 15);
    }
  }

  private calculateHumidityStress(humidity: number): number {
    // Calculate stress based on deviation from optimal humidity range
    const optimalMin = 0.5;
    const optimalMax = 0.8;
    
    if (humidity >= optimalMin && humidity <= optimalMax) {
      return 0;
    } else if (humidity < optimalMin) {
      return (optimalMin - humidity) / optimalMin;
    } else {
      return (humidity - optimalMax) / (1 - optimalMax);
    }
  }

  private calculateSeasonalMetabolicRate(seasonalFactor: number): number {
    // Metabolic rate varies with seasons
    // Spring/Summer: higher metabolism, Fall: preparation, Winter: reduced
    return 0.7 + seasonalFactor * 0.6; // Range: 0.7 to 1.3
  }

  private calculateSeasonalImmuneFunction(seasonalFactor: number): number {
    // Immune function typically stronger in warmer months
    return 0.6 + seasonalFactor * 0.4; // Range: 0.6 to 1.0
  }

  private calculateSeasonalReproductionRate(seasonalFactor: number): number {
    // Reproduction peaks in optimal seasons
    return seasonalFactor; // Direct relationship with seasonal favorability
  }

  private calculateColonyStress(): number {
    const stressFactors = Array.from(this.environmentalStressors.values());
    return stressFactors.reduce((sum, stress) => sum + stress, 0) / stressFactors.length;
  }

  private getFoodAvailability(): Map<string, number> {
    // Simplified food availability - would integrate with ecosystem system
    const availability = new Map<string, number>();
    const foodSources = this.nutritionSystem.getAllFoodSources();
    
    for (const food of foodSources) {
      const baseAvailability = food.abundance;
      const seasonalModifier = this.seasonalBiologicalFactors.get('metabolic_rate') || 1.0;
      availability.set(food.id, baseAvailability * seasonalModifier);
    }
    
    return availability;
  }

  private processAging(): void {
    for (const [antId, profile] of this.biologicalProfiles) {
      // Increment age
      profile.ageInDays += 1;

      // Check for life stage transitions
      this.checkLifeStageTransition(profile);

      // Apply aging effects
      this.applyAgingEffects(profile);

      // Check for natural death
      this.checkNaturalDeath(profile);
    }
  }

  private checkLifeStageTransition(profile: BiologicalProfile): void {
    const species = this.speciesData.get(profile.species);
    if (!species) return;

    const currentStage = profile.lifeStage;
    let newStage = currentStage;

    // Simplified life stage transitions based on age
    switch (currentStage) {
      case LifeStage.EGG:
        if (profile.ageInDays >= 3) newStage = LifeStage.LARVA;
        break;
      case LifeStage.LARVA:
        if (profile.ageInDays >= 14) newStage = LifeStage.PUPA;
        break;
      case LifeStage.PUPA:
        if (profile.ageInDays >= species.maturationTime) newStage = LifeStage.YOUNG_ADULT;
        break;
      case LifeStage.YOUNG_ADULT:
        if (profile.ageInDays >= species.maturationTime + 10) newStage = LifeStage.MATURE_ADULT;
        break;
      case LifeStage.MATURE_ADULT:
        if (profile.ageInDays >= species.averageLifespan * 0.8) newStage = LifeStage.OLD_ADULT;
        break;
      case LifeStage.OLD_ADULT:
        if (profile.ageInDays >= species.averageLifespan * 0.95) newStage = LifeStage.SENESCENT;
        break;
    }

    if (newStage !== currentStage) {
      profile.lifeStage = newStage;
      this.recordBiologicalEvent({
        timestamp: Date.now(),
        antId: profile.antId,
        type: 'maturation',
        description: `Transitioned from ${currentStage} to ${newStage}`,
        severity: 0.6,
        biologicalImpact: new Map([
          ['development', 1.0],
          ['capabilities', 0.5]
        ]),
        environmentalFactors: new Map()
      });
    }
  }

  private applyAgingEffects(profile: BiologicalProfile): void {
    const species = this.speciesData.get(profile.species);
    if (!species) return;

    const ageRatio = profile.ageInDays / species.averageLifespan;
    
    // Apply age-related decline after maturity
    if (ageRatio > 0.5) {
      const declineRate = (ageRatio - 0.5) * 2; // 0 to 1 over latter half of life
      
      // Physical decline
      profile.physiology.maxSpeed *= (1 - declineRate * 0.3);
      profile.physiology.carryingCapacity *= (1 - declineRate * 0.2);
      profile.physiology.immuneSystemStrength *= (1 - declineRate * 0.4);
      
      // Sensory decline
      profile.physiology.visualAcuity *= (1 - declineRate * 0.25);
      profile.physiology.olfactorySensitivity *= (1 - declineRate * 0.2);
      
      // Cognitive decline
      profile.physiology.reactionTime *= (1 + declineRate * 0.5);
      profile.physiology.memoryCapacity *= (1 - declineRate * 0.3);
      
      // Health decline
      profile.health.overallHealth *= (1 - declineRate * 0.2);
      profile.health.mortalityRisk += declineRate * 0.1;
    }
  }

  private checkNaturalDeath(profile: BiologicalProfile): boolean {
    const species = this.speciesData.get(profile.species);
    if (!species) return false;

    const ageRatio = profile.ageInDays / species.averageLifespan;
    
    // Calculate death probability based on age and health
    let deathProbability = profile.health.mortalityRisk;
    
    // Age-related mortality
    if (ageRatio > 0.8) {
      deathProbability += (ageRatio - 0.8) * 0.5; // Increased risk in old age
    }
    
    // Health-related mortality
    deathProbability += (1 - profile.health.overallHealth) * 0.3;
    
    // Environmental stress mortality
    const overallStress = this.calculateColonyStress();
    deathProbability += overallStress * 0.1;

    // Daily death check
    if (Math.random() < deathProbability / 365) { // Convert annual probability to daily
      this.handleAntDeath(profile, 'natural_causes');
      return true;
    }
    
    return false;
  }

  private handleAntDeath(profile: BiologicalProfile, cause: string): void {
    this.recordBiologicalEvent({
      timestamp: Date.now(),
      antId: profile.antId,
      type: 'death',
      description: `Ant died from ${cause} at age ${profile.ageInDays} days`,
      severity: 1.0,
      biologicalImpact: new Map([
        ['population', -1.0],
        ['genetics', -0.1]
      ]),
      environmentalFactors: new Map(this.environmentalStressors)
    });

    // Remove from active profiles
    this.biologicalProfiles.delete(profile.antId);
  }

  private processGeneticChanges(): void {
    for (const [antId, profile] of this.biologicalProfiles) {
      // Check for spontaneous mutations
      if (Math.random() < profile.genetics.mutationRate / 365) { // Daily chance
        this.applyMutation(profile);
      }

      // Check for environmental adaptations
      this.processEnvironmentalAdaptation(profile);
    }
  }

  private applyMutation(profile: BiologicalProfile): void {
    // Random mutation to genetic traits
    const traitNames = [
      'diseaseResistance', 'metabolicEfficiency', 'lifespanGenetics', 
      'stressResistance', 'digestiveEfficiency', 'toxinResistance'
    ];
    
    const randomTrait = traitNames[Math.floor(Math.random() * traitNames.length)];
    const mutationEffect = (Math.random() - 0.5) * 0.1; // ±5% change
    
    switch (randomTrait) {
      case 'metabolicEfficiency':
        profile.genetics.metabolicEfficiency = Math.max(0, Math.min(1, 
          profile.genetics.metabolicEfficiency + mutationEffect));
        break;
      case 'lifespanGenetics':
        profile.genetics.lifespanGenetics = Math.max(0, Math.min(1, 
          profile.genetics.lifespanGenetics + mutationEffect));
        break;
      case 'stressResistance':
        profile.genetics.stressResistance = Math.max(0, Math.min(1, 
          profile.genetics.stressResistance + mutationEffect));
        break;
      // Add other mutation cases...
    }

    this.recordBiologicalEvent({
      timestamp: Date.now(),
      antId: profile.antId,
      type: 'mutation',
      description: `Genetic mutation in ${randomTrait}`,
      severity: 0.3,
      biologicalImpact: new Map([
        ['genetics', Math.abs(mutationEffect)],
        ['evolution', 0.1]
      ]),
      environmentalFactors: new Map()
    });
  }

  private processEnvironmentalAdaptation(profile: BiologicalProfile): void {
    // Gradual adaptation to current environmental conditions
    const temperature = this.environmentalStressors.get('temperature_stress') || 0;
    const humidity = this.environmentalStressors.get('humidity_stress') || 0;
    
    // Small adaptation improvements when under stress
    if (temperature > 0.5) {
      const currentAdaptation = profile.adaptations.get('temperature') || 0;
      profile.adaptations.set('temperature', Math.min(1, currentAdaptation + 0.01));
    }
    
    if (humidity > 0.5) {
      const currentAdaptation = profile.adaptations.get('humidity') || 0;
      profile.adaptations.set('humidity', Math.min(1, currentAdaptation + 0.01));
    }
  }

  private updatePhysiologicalStatus(): void {
    for (const [antId, profile] of this.biologicalProfiles) {
      // Get nutritional status
      const nutrition = this.nutritionSystem.getAntNutritionalStatus(antId);
      
      if (nutrition) {
        // Update physiology based on nutrition
        this.updatePhysiologyFromNutrition(profile, nutrition);
      }

      // Update physiology based on diseases
      const infections = this.diseaseSystem.getAntInfections(antId);
      this.updatePhysiologyFromDiseases(profile, infections);

      // Update physiology based on environmental stress
      this.updatePhysiologyFromEnvironment(profile);
    }
  }

  private updatePhysiologyFromNutrition(profile: BiologicalProfile, nutrition: NutritionalStatus): void {
    // Energy level affects physical capabilities
    profile.physiology.maxSpeed = profile.physiology.maxSpeed * 
      (0.7 + nutrition.energyLevel * 0.3);
    
    profile.physiology.carryingCapacity = profile.physiology.carryingCapacity * 
      (0.8 + nutrition.energyLevel * 0.2);

    // Protein balance affects muscle strength
    profile.physiology.mandibleStrength = profile.physiology.mandibleStrength * 
      (0.6 + nutrition.proteinBalance * 0.4);

    // Overall nutrition affects immune system
    profile.physiology.immuneSystemStrength = profile.physiology.immuneSystemStrength * 
      (0.5 + nutrition.overallNutrition * 0.5);

    // Hydration affects circulation
    profile.physiology.circulationEfficiency = profile.physiology.circulationEfficiency * 
      (0.7 + nutrition.hydrationLevel * 0.3);
  }

  private updatePhysiologyFromDiseases(profile: BiologicalProfile, infections: Infection[]): void {
    let totalDiseaseImpact = 0;
    
    for (const infection of infections) {
      const pathogen = this.diseaseSystem.getPathogen(infection.pathogenId);
      if (pathogen) {
        totalDiseaseImpact += pathogen.virulence * infection.severity;
      }
    }

    // Disease reduces physical capabilities
    const healthReduction = Math.min(0.8, totalDiseaseImpact);
    profile.physiology.maxSpeed *= (1 - healthReduction * 0.5);
    profile.physiology.carryingCapacity *= (1 - healthReduction * 0.4);
    profile.physiology.immuneSystemStrength *= (1 - healthReduction * 0.3);
    profile.physiology.reactionTime *= (1 + healthReduction * 0.3);
  }

  private updatePhysiologyFromEnvironment(profile: BiologicalProfile): void {
    const temperatureStress = this.environmentalStressors.get('temperature_stress') || 0;
    const humidityStress = this.environmentalStressors.get('humidity_stress') || 0;
    const toxinStress = this.environmentalStressors.get('toxin_stress') || 0;

    // Environmental stress affects performance
    const totalStress = (temperatureStress + humidityStress + toxinStress) / 3;
    
    profile.physiology.maxSpeed *= (1 - totalStress * 0.2);
    profile.physiology.oxygenEfficiency *= (1 - totalStress * 0.15);
    profile.physiology.immuneSystemStrength *= (1 - totalStress * 0.25);
    
    // Stress affects mental capabilities
    profile.physiology.reactionTime *= (1 + totalStress * 0.3);
    profile.physiology.learningRate *= (1 - totalStress * 0.2);
  }

  private processInjuriesAndHealing(): void {
    for (const [antId, profile] of this.biologicalProfiles) {
      for (let i = profile.health.injuries.length - 1; i >= 0; i--) {
        const injury = profile.health.injuries[i];
        
        // Progress healing
        const healingRate = profile.health.recoveryRate * 0.1; // 10% per day at max recovery
        injury.healingProgress = Math.min(1, injury.healingProgress + healingRate);
        
        // Reduce pain as healing progresses
        injury.painLevel = Math.max(0, injury.painLevel * (1 - healingRate));
        
        // Check for complications
        if (Math.random() < injury.infectionRisk * 0.1) {
          // Injury becomes infected
          this.diseaseSystem.infectAnt(
            antId, 
            'wound_infection', 
            'injury', 
            'wound' as any, 
            { x: 0, y: 0, z: 0 }
          );
        }
        
        // Remove fully healed injuries
        if (injury.healingProgress >= 1.0) {
          profile.health.injuries.splice(i, 1);
          
          this.recordBiologicalEvent({
            timestamp: Date.now(),
            antId: profile.antId,
            type: 'recovery',
            description: `Recovered from ${injury.type} injury`,
            severity: 0.4,
            biologicalImpact: new Map([
              ['health', 0.3],
              ['fitness', 0.2]
            ]),
            environmentalFactors: new Map()
          });
        }
      }
    }
  }

  private updateHealthStatus(): void {
    for (const [antId, profile] of this.biologicalProfiles) {
      // Calculate overall health from multiple factors
      const factors = [
        this.calculatePhysiologicalHealth(profile),
        this.calculateNutritionalHealth(antId),
        this.calculateDiseaseHealth(antId),
        this.calculateEnvironmentalHealth(profile),
        this.calculateMentalHealth(profile)
      ];

      profile.health.overallHealth = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;

      // Update vitality and fitness
      profile.health.vitalityScore = this.calculateVitality(profile);
      profile.health.fitnessLevel = this.calculateFitness(profile);

      // Update mortality risk
      profile.health.mortalityRisk = this.calculateMortalityRisk(profile);

      // Update health trend
      this.updateHealthTrend(profile);
    }
  }

  private calculatePhysiologicalHealth(profile: BiologicalProfile): number {
    const physiology = profile.physiology;
    
    const factors = [
      physiology.immuneSystemStrength,
      physiology.circulationEfficiency,
      physiology.oxygenEfficiency,
      1 - (profile.health.injuries.length * 0.2), // Injury penalty
      1 - profile.health.stressLevel * 0.3
    ];

    return Math.max(0, Math.min(1, factors.reduce((sum, factor) => sum + factor, 0) / factors.length));
  }

  private calculateNutritionalHealth(antId: string): number {
    const nutrition = this.nutritionSystem.getAntNutritionalStatus(antId);
    return nutrition ? nutrition.overallNutrition : 0.5;
  }

  private calculateDiseaseHealth(antId: string): number {
    const infections = this.diseaseSystem.getAntInfections(antId);
    if (infections.length === 0) return 1.0;
    
    let totalImpact = 0;
    for (const infection of infections) {
      const pathogen = this.diseaseSystem.getPathogen(infection.pathogenId);
      if (pathogen) {
        totalImpact += pathogen.virulence * infection.severity;
      }
    }
    
    return Math.max(0, 1 - totalImpact);
  }

  private calculateEnvironmentalHealth(profile: BiologicalProfile): number {
    const adaptations = profile.adaptations;
    const stressors = this.environmentalStressors;
    
    let adaptedStress = 0;
    let totalStress = 0;
    
    for (const [stressor, level] of stressors) {
      const adaptation = adaptations.get(stressor) || 0;
      adaptedStress += level * (1 - adaptation);
      totalStress += level;
    }
    
    if (totalStress === 0) return 1.0;
    
    return Math.max(0, 1 - adaptedStress / totalStress);
  }

  private calculateMentalHealth(profile: BiologicalProfile): number {
    const stressImpact = profile.health.stressLevel * 0.6;
    const socialImpact = (1 - profile.health.socialHealth) * 0.3;
    const cognitiveImpact = (1 - profile.physiology.learningRate) * 0.1;
    
    return Math.max(0, 1 - stressImpact - socialImpact - cognitiveImpact);
  }

  private calculateVitality(profile: BiologicalProfile): number {
    const energyFactor = this.nutritionSystem.getAntNutritionalStatus(profile.antId)?.energyLevel || 0.5;
    const healthFactor = profile.health.overallHealth;
    const ageFactor = this.calculateAgingVitality(profile);
    
    return (energyFactor + healthFactor + ageFactor) / 3;
  }

  private calculateAgingVitality(profile: BiologicalProfile): number {
    const species = this.speciesData.get(profile.species);
    if (!species) return 0.5;
    
    const ageRatio = profile.ageInDays / species.averageLifespan;
    
    if (ageRatio < 0.2) return 0.8; // Young and energetic
    if (ageRatio < 0.6) return 1.0; // Peak vitality
    if (ageRatio < 0.8) return 0.9; // Mature but strong
    return Math.max(0.3, 1 - (ageRatio - 0.8) * 2); // Declining vitality
  }

  private calculateFitness(profile: BiologicalProfile): number {
    const physicalFitness = (
      profile.physiology.maxSpeed / 10 + // Normalized speed
      profile.physiology.carryingCapacity / 100 + // Normalized carrying capacity
      profile.physiology.mandibleStrength / 5 // Normalized strength
    ) / 3;
    
    const metabolicFitness = profile.genetics.metabolicEfficiency;
    const immuneFitness = profile.physiology.immuneSystemStrength;
    
    return (physicalFitness + metabolicFitness + immuneFitness) / 3;
  }

  private calculateMortalityRisk(profile: BiologicalProfile): number {
    const agingRisk = this.calculateAgingMortalityRisk(profile);
    const healthRisk = (1 - profile.health.overallHealth) * 0.3;
    const environmentalRisk = this.calculateColonyStress() * 0.2;
    const injuryRisk = profile.health.injuries.length * 0.1;
    
    return Math.min(1, agingRisk + healthRisk + environmentalRisk + injuryRisk);
  }

  private calculateAgingMortalityRisk(profile: BiologicalProfile): number {
    const species = this.speciesData.get(profile.species);
    if (!species) return 0.1;
    
    const ageRatio = profile.ageInDays / species.averageLifespan;
    
    if (ageRatio < 0.8) return 0.01; // Low risk when young/mature
    
    // Exponential increase in mortality risk after 80% of lifespan
    return Math.min(0.5, Math.pow(ageRatio - 0.8, 2) * 2);
  }

  private updateHealthTrend(profile: BiologicalProfile): void {
    // Simplified health trend - would track over multiple days in real implementation
    const currentHealth = profile.health.overallHealth;
    const previousHealth = 0.8; // Would be stored from previous day
    
    profile.health.healthTrend = (currentHealth - previousHealth) * 10; // Amplify trend
    profile.health.healthTrend = Math.max(-1, Math.min(1, profile.health.healthTrend));
  }

  private recordBiologicalEvent(event: BiologicalEvent): void {
    this.biologicalEvents.push(event);
    
    // Keep only last 1000 events
    if (this.biologicalEvents.length > 1000) {
      this.biologicalEvents.shift();
    }
  }

  // Public interface methods

  public createAnt(antId: string, species: string, parentGenetics?: GeneticProfile[]): BiologicalProfile {
    const speciesData = this.speciesData.get(species);
    if (!speciesData) {
      throw new Error(`Unknown species: ${species}`);
    }

    const profile: BiologicalProfile = {
      antId,
      species,
      genetics: this.generateGenetics(speciesData, parentGenetics),
      physiology: this.generatePhysiology(speciesData),
      health: this.generateInitialHealth(),
      lifeStage: LifeStage.EGG,
      ageInDays: 0,
      adaptations: new Map()
    };

    this.biologicalProfiles.set(antId, profile);

    // Initialize nutrition system for this ant
    // Would call nutritionSystem.initializeAnt(antId, profile) if that method existed

    this.recordBiologicalEvent({
      timestamp: Date.now(),
      antId,
      type: 'birth',
      description: `New ${species} ant born`,
      severity: 0.5,
      biologicalImpact: new Map([
        ['population', 1.0],
        ['genetics', 0.1]
      ]),
      environmentalFactors: new Map()
    });

    return profile;
  }

  private generateGenetics(species: SpeciesCharacteristics, parents?: GeneticProfile[]): GeneticProfile {
    // Generate genetic profile based on species defaults and parent genetics
    const genetics: GeneticProfile = {
      diseaseResistance: new Map(),
      metabolicEfficiency: species.baseMetabolicEfficiency + (Math.random() - 0.5) * 0.2,
      lifespanGenetics: 1.0 + (Math.random() - 0.5) * 0.3,
      stressResistance: species.baseStressResistance + (Math.random() - 0.5) * 0.2,
      digestiveEfficiency: 0.8 + (Math.random() - 0.5) * 0.2,
      toxinResistance: 0.6 + (Math.random() - 0.5) * 0.3,
      vitaminSynthesis: new Map(),
      temperatureTolerance: {
        min: species.temperatureRange.min + (Math.random() - 0.5) * 5,
        max: species.temperatureRange.max + (Math.random() - 0.5) * 5
      },
      humidityTolerance: {
        min: species.humidityRange.min + (Math.random() - 0.5) * 0.2,
        max: species.humidityRange.max + (Math.random() - 0.5) * 0.2
      },
      altitudeTolerance: 1000 + Math.random() * 2000,
      aggressionGenetics: species.aggressionLevel + (Math.random() - 0.5) * 0.3,
      explorationGenetics: 0.5 + (Math.random() - 0.5) * 0.4,
      socialGenetics: 0.8 + (Math.random() - 0.5) * 0.2,
      fertilityGenetics: 1.0 + (Math.random() - 0.5) * 0.3,
      parentalCareGenetics: 0.7 + (Math.random() - 0.5) * 0.4,
      mutationRate: 0.001 + Math.random() * 0.009,
      parentGenetics: parents ? parents.map(p => `parent_${Math.random()}`) : [],
      generationNumber: parents ? Math.max(...parents.map(p => p.generationNumber)) + 1 : 1
    };

    // Initialize disease resistance for each disease type
    Object.values(DiseaseType).forEach(diseaseType => {
      genetics.diseaseResistance.set(
        diseaseType, 
        species.baseDiseaseResistance + (Math.random() - 0.5) * 0.3
      );
    });

    // Initialize vitamin synthesis capabilities
    Object.values(VitaminType).forEach(vitamin => {
      genetics.vitaminSynthesis.set(vitamin, Math.random() * 0.3);
    });

    return genetics;
  }

  private generatePhysiology(species: SpeciesCharacteristics): PhysiologyProfile {
    return {
      bodyLength: species.baseBodyLength + (Math.random() - 0.5) * species.baseBodyLength * 0.3,
      bodyWeight: species.baseBodyWeight + (Math.random() - 0.5) * species.baseBodyWeight * 0.3,
      thoraxSize: species.baseBodyLength * 0.4 + (Math.random() - 0.5) * 0.5,
      abdomenSize: species.baseBodyLength * 0.6 + (Math.random() - 0.5) * 0.7,
      
      visualAcuity: 0.6 + Math.random() * 0.4,
      olfactorySensitivity: 0.8 + Math.random() * 0.2,
      tactileSensitivity: 0.7 + Math.random() * 0.3,
      vibrationSensitivity: 0.7 + Math.random() * 0.3,
      
      maxSpeed: 5 + Math.random() * 10, // mm/s
      carryingCapacity: species.baseBodyWeight * species.carryingCapacityRatio * (0.8 + Math.random() * 0.4),
      mandibleStrength: 1 + Math.random() * 3, // N
      grippingStrength: 0.5 + Math.random() * 1.5, // N
      
      oxygenEfficiency: 0.8 + Math.random() * 0.2,
      circulationEfficiency: 0.8 + Math.random() * 0.2,
      
      heatProduction: 0.1 + Math.random() * 0.2,
      heatDissipation: 0.8 + Math.random() * 0.2,
      thermalMass: species.baseBodyWeight * 0.001,
      
      immuneSystemStrength: 0.7 + Math.random() * 0.3,
      immuneMemory: new Map(),
      autoimmuneFactor: Math.random() * 0.1,
      
      stomachCapacity: species.baseBodyWeight * 0.5,
      digestionRate: species.baseBodyWeight * 0.1,
      nutrientAbsorption: new Map(),
      
      reactionTime: 50 + Math.random() * 100, // ms
      memoryCapacity: 0.6 + Math.random() * 0.4,
      learningRate: 0.5 + Math.random() * 0.5,
      stressThreshold: 0.6 + Math.random() * 0.4
    };
  }

  private generateInitialHealth(): HealthStatus {
    return {
      overallHealth: 0.9 + Math.random() * 0.1,
      vitalityScore: 0.8 + Math.random() * 0.2,
      fitnessLevel: 0.7 + Math.random() * 0.3,
      
      activeInfections: [],
      chronicConditions: [],
      injuries: [],
      
      healthTrend: 0,
      mortalityRisk: 0.01,
      recoveryRate: 0.8 + Math.random() * 0.2,
      
      stressLevel: Math.random() * 0.3,
      mentalHealth: 0.8 + Math.random() * 0.2,
      socialHealth: 0.8 + Math.random() * 0.2,
      
      agingRate: 0.9 + Math.random() * 0.2,
      senescenceMarkers: new Map(),
      
      environmentalAdaptation: 0.5,
      toxinLoad: new Map()
    };
  }

  // Public query methods

  public getAntProfile(antId: string): BiologicalProfile | undefined {
    return this.biologicalProfiles.get(antId);
  }

  public getAllProfiles(): BiologicalProfile[] {
    return Array.from(this.biologicalProfiles.values());
  }

  public getDiseaseSystem(): DiseaseSystem {
    return this.diseaseSystem;
  }

  public getNutritionSystem(): NutritionMetabolismSystem {
    return this.nutritionSystem;
  }

  public getSpeciesData(species: string): SpeciesCharacteristics | undefined {
    return this.speciesData.get(species);
  }

  public getRecentBiologicalEvents(hours: number = 24): BiologicalEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.biologicalEvents.filter(event => event.timestamp >= cutoff);
  }

  public getColonyBiologicalSummary(): {
    totalAnts: number;
    averageHealth: number;
    averageAge: number;
    activeInfections: number;
    mortalityRate: number;
    geneticDiversity: number;
  } {
    const profiles = Array.from(this.biologicalProfiles.values());
    
    if (profiles.length === 0) {
      return {
        totalAnts: 0,
        averageHealth: 0,
        averageAge: 0,
        activeInfections: 0,
        mortalityRate: 0,
        geneticDiversity: 0
      };
    }

    const totalHealth = profiles.reduce((sum, p) => sum + p.health.overallHealth, 0);
    const totalAge = profiles.reduce((sum, p) => sum + p.ageInDays, 0);
    const totalInfections = profiles.reduce((sum, p) => sum + p.health.activeInfections.length, 0);
    const totalMortalityRisk = profiles.reduce((sum, p) => sum + p.health.mortalityRisk, 0);

    // Simplified genetic diversity calculation
    const uniqueGenetics = new Set(profiles.map(p => 
      `${p.genetics.metabolicEfficiency}_${p.genetics.stressResistance}_${p.genetics.lifespanGenetics}`
    ));
    const geneticDiversity = uniqueGenetics.size / profiles.length;

    return {
      totalAnts: profiles.length,
      averageHealth: totalHealth / profiles.length,
      averageAge: totalAge / profiles.length,
      activeInfections: totalInfections,
      mortalityRate: totalMortalityRisk / profiles.length,
      geneticDiversity
    };
  }
}

// Supporting interfaces
interface SpeciesCharacteristics {
  name: string;
  scientificName: string;
  averageLifespan: number;
  maturationTime: number;
  
  baseBodyLength: number;
  baseBodyWeight: number;
  carryingCapacityRatio: number;
  
  temperatureRange: { min: number; max: number };
  humidityRange: { min: number; max: number };
  
  baseDiseaseResistance: number;
  baseMetabolicEfficiency: number;
  baseStressResistance: number;
  
  primaryNutrients: NutrientType[];
  secondaryNutrients: NutrientType[];
  vitaminRequirements: VitaminType[];
  
  aggressionLevel: number;
  socialStructure: string;
  territorialBehavior: number;
  
  preferredHabitat: string;
  nestingDepth: number;
  foragingRange: number;
}

// Export all relevant types and classes
export {
  DiseaseSystem,
  NutritionMetabolismSystem,
  DiseaseType,
  TransmissionMode,
  NutrientType,
  VitaminType,
  MineralType
};