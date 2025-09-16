/**
 * Nutrition and Metabolism System
 * Comprehensive nutrition tracking, metabolism simulation, and dietary effects
 */

export enum NutrientType {
  CARBOHYDRATES = 'carbohydrates',   // Primary energy source
  PROTEINS = 'proteins',             // Body building and repair
  FATS = 'fats',                     // Energy storage and cell membranes
  VITAMINS = 'vitamins',             // Metabolic cofactors
  MINERALS = 'minerals',             // Structural and enzymatic functions
  WATER = 'water',                   // Cellular functions and transport
  FIBER = 'fiber'                    // Digestive health
}

export enum VitaminType {
  VITAMIN_A = 'vitamin_a',           // Vision, immune function
  VITAMIN_B1 = 'vitamin_b1',         // Energy metabolism
  VITAMIN_B2 = 'vitamin_b2',         // Cellular respiration
  VITAMIN_B6 = 'vitamin_b6',         // Protein metabolism
  VITAMIN_B12 = 'vitamin_b12',       // DNA synthesis, nerve function
  VITAMIN_C = 'vitamin_c',           // Antioxidant, collagen synthesis
  VITAMIN_D = 'vitamin_d',           // Calcium absorption
  VITAMIN_E = 'vitamin_e',           // Antioxidant, membrane protection
  VITAMIN_K = 'vitamin_k',           // Blood clotting, bone health
  FOLATE = 'folate',                 // DNA synthesis, cell division
  NIACIN = 'niacin',                 // Energy metabolism
  BIOTIN = 'biotin'                  // Fatty acid synthesis
}

export enum MineralType {
  CALCIUM = 'calcium',               // Exoskeleton strength
  PHOSPHORUS = 'phosphorus',         // Energy storage (ATP)
  MAGNESIUM = 'magnesium',           // Enzyme function
  IRON = 'iron',                     // Oxygen transport
  ZINC = 'zinc',                     // Immune function, wound healing
  COPPER = 'copper',                 // Iron metabolism
  MANGANESE = 'manganese',           // Bone formation, metabolism
  SELENIUM = 'selenium',             // Antioxidant function
  IODINE = 'iodine',                 // Thyroid function
  CHROMIUM = 'chromium',             // Glucose metabolism
  MOLYBDENUM = 'molybdenum',         // Enzyme function
  FLUORIDE = 'fluoride'              // Tooth and bone health
}

export interface NutritionalContent {
  // Macronutrients (per 100g)
  carbohydrates: number;             // grams
  proteins: number;                  // grams
  fats: number;                      // grams
  fiber: number;                     // grams
  water: number;                     // grams
  
  // Energy content
  calories: number;                  // kcal per 100g
  metabolizableEnergy: number;       // kcal actually available to ant
  
  // Vitamins (per 100g)
  vitamins: Map<VitaminType, number>; // mg or μg
  
  // Minerals (per 100g)
  minerals: Map<MineralType, number>; // mg or μg
  
  // Food quality factors
  digestibility: number;             // 0-1, how easily digested
  bioavailability: number;           // 0-1, how much nutrition is absorbed
  antiNutrients: number;             // 0-1, compounds that reduce nutrition
  toxicity: number;                  // 0-1, harmful compounds present
  
  // Physical properties
  moisture: number;                  // 0-1, water content
  hardness: number;                  // 0-1, difficulty to process
  perishability: number;             // days until spoilage
}

export interface FoodSource {
  id: string;
  name: string;
  type: 'plant' | 'insect' | 'fungus' | 'secretion' | 'carrion' | 'processed';
  
  // Nutritional profile
  nutrition: NutritionalContent;
  
  // Availability and seasonality
  seasonality: Map<string, number>;  // season -> availability (0-1)
  location: 'surface' | 'underground' | 'tree' | 'water' | 'artificial';
  abundance: number;                 // 0-1, how common this food is
  
  // Foraging characteristics
  harvestDifficulty: number;         // 0-1, effort required to obtain
  processingRequired: boolean;       // needs preparation before consumption
  storageLife: number;              // days food remains viable when stored
  
  // Ecological factors
  competitionLevel: number;          // 0-1, competition from other species
  predationRisk: number;            // 0-1, danger while foraging
  
  // Special properties
  medicinalProperties: Map<string, number>; // health effects
  addictivePotential: number;        // 0-1, preference formation
  culturalValue: number;             // 0-1, importance to colony identity
}

export interface MetabolicProfile {
  // Basic metabolic rate
  basalMetabolicRate: number;        // kcal/day at rest
  activeMetabolicRate: number;       // kcal/day during activity
  thermoregulationCost: number;      // kcal/day for temperature control
  
  // Efficiency factors
  digestiveEfficiency: number;       // 0-1, nutrient extraction efficiency
  metabolicEfficiency: number;       // 0-1, energy conversion efficiency
  storageEfficiency: number;         // 0-1, energy storage efficiency
  
  // Life stage modifiers
  growthEnergyDemand: number;        // Additional energy for growth
  reproductiveEnergyDemand: number;  // Additional energy for reproduction
  maintenanceEnergyDemand: number;   // Energy for cellular maintenance
  
  // Caste-specific requirements
  casteMultiplier: number;           // Metabolic rate modifier for caste
  workloadMultiplier: number;        // Activity-based energy multiplier
  
  // Health status effects
  diseaseMetabolicCost: number;      // Additional energy cost when sick
  injuryRepairCost: number;         // Energy for healing
  immuneSystemCost: number;         // Energy for immune function
  
  // Environmental adaptations
  temperatureAdaptation: Map<number, number>; // temp -> efficiency modifier
  humidityAdaptation: Map<number, number>;    // humidity -> efficiency modifier
  altitudeAdaptation: number;        // High altitude metabolic adjustment
}

export interface NutritionalStatus {
  // Overall nutritional health
  overallNutrition: number;          // 0-1, overall nutritional status
  bodyCondition: number;             // 0-1, physical condition score
  energyReserves: number;            // kcal stored as fat/glycogen
  hydrationLevel: number;            // 0-1, water balance
  
  // Macronutrient status
  carbohydrateReserves: number;      // grams of stored carbohydrates
  proteinBalance: number;            // 0-1, protein adequacy
  fatReserves: number;               // grams of stored fat
  
  // Micronutrient levels
  vitaminLevels: Map<VitaminType, number>;   // Current vitamin stores
  mineralLevels: Map<MineralType, number>;   // Current mineral levels
  
  // Deficiency indicators
  deficiencies: Map<string, number>; // nutrient -> severity (0-1)
  toxicities: Map<string, number>;   // nutrient -> toxicity level (0-1)
  
  // Recent consumption
  recentIntake: Map<NutrientType, number>; // 24-hour nutrient intake
  lastMealTime: number;              // Timestamp of last feeding
  hungerLevel: number;               // 0-1, current hunger
  thirstLevel: number;               // 0-1, current thirst
  
  // Digestive health
  digestiveHealth: number;           // 0-1, gut health status
  metabolicHealth: number;           // 0-1, metabolic system health
  
  // Performance impacts
  energyLevel: number;               // 0-1, current energy/stamina
  cognitiveFunction: number;         // 0-1, mental performance
  immuneFunction: number;            // 0-1, immune system strength
  reproductiveHealth: number;        // 0-1, reproductive capability
}

export interface DietaryRequirement {
  nutrientType: NutrientType | VitaminType | MineralType;
  dailyRequirement: number;          // Amount needed per day
  minimumRequirement: number;        // Minimum to prevent deficiency
  maximumSafe: number;              // Maximum safe daily intake
  toxicLevel: number;               // Level that causes toxicity
  
  // Life stage variations
  growthMultiplier: number;          // Additional needs during growth
  reproductiveMultiplier: number;    // Additional needs for reproduction
  ageingMultiplier: number;          // Modified needs in old age
  
  // Storage and depletion
  bodyStores: number;               // How much can be stored
  depletionRate: number;            // Daily depletion rate
  halfLife: number;                 // Days until 50% depletion
  
  // Health consequences
  deficiencySymptoms: string[];      // Effects of deficiency
  toxicitySymptoms: string[];        // Effects of excess
  interactionEffects: Map<string, number>; // Interactions with other nutrients
}

export interface FoodPreference {
  foodSourceId: string;
  preference: number;                // 0-1, how much ant likes this food
  
  // Learned preferences
  experience: number;                // How familiar ant is with this food
  associatedOutcomes: number[];      // Positive/negative experiences
  
  // Innate preferences
  geneticPreference: number;         // 0-1, genetic bias toward this food
  seasonalModifier: number;          // Current seasonal preference modifier
  
  // Social influences
  colonyPreference: number;          // 0-1, colony-wide preference
  culturalTransmission: number;      // Learned from other ants
  
  // Contextual factors
  availabilityBias: number;          // Preference based on availability
  nutritionalNeed: number;           // Preference based on current needs
  situationalContext: Map<string, number>; // Context-dependent preferences
}

export interface MetabolicEvent {
  timestamp: number;
  type: 'feeding' | 'fasting' | 'exercise' | 'rest' | 'stress' | 'illness';
  details: {
    foodConsumed?: string;           // Food source ID
    quantity?: number;               // Amount consumed
    energyExpended?: number;         // kcal burned
    stressFactor?: number;           // Stress level (0-1)
    duration?: number;               // Event duration in minutes
  };
  metabolicImpact: {
    energyChange: number;            // Net energy change
    nutrientChanges: Map<string, number>; // Nutrient level changes
    healthEffects: Map<string, number>;  // Health impact
  };
}

/**
 * Comprehensive nutrition and metabolism simulation system
 */
export class NutritionMetabolismSystem {
  private foodSources: Map<string, FoodSource>;
  private nutritionalStatus: Map<string, NutritionalStatus>; // antId -> status
  private metabolicProfiles: Map<string, MetabolicProfile>; // antId -> profile
  private dietaryRequirements: Map<string, DietaryRequirement[]>; // caste -> requirements
  private foodPreferences: Map<string, Map<string, FoodPreference>>; // antId -> foodId -> preference
  private metabolicHistory: Map<string, MetabolicEvent[]>; // antId -> events
  
  // Environmental factors
  private seasonalFactors: Map<string, number>;
  private environmentalStress: number;
  private foodAvailability: Map<string, number>; // foodId -> availability

  constructor() {
    this.foodSources = new Map();
    this.nutritionalStatus = new Map();
    this.metabolicProfiles = new Map();
    this.dietaryRequirements = new Map();
    this.foodPreferences = new Map();
    this.metabolicHistory = new Map();
    this.seasonalFactors = new Map();
    this.environmentalStress = 0.3;
    this.foodAvailability = new Map();

    this.initializeFoodSources();
    this.initializeDietaryRequirements();
  }

  private initializeFoodSources(): void {
    // Honeydew from aphids - primary carbohydrate source
    this.foodSources.set('aphid_honeydew', {
      id: 'aphid_honeydew',
      name: 'Aphid Honeydew',
      type: 'secretion',
      nutrition: {
        carbohydrates: 80,
        proteins: 2,
        fats: 0.5,
        fiber: 0,
        water: 17,
        calories: 333,
        metabolizableEnergy: 300,
        vitamins: new Map([
          [VitaminType.VITAMIN_C, 5],
          [VitaminType.VITAMIN_B1, 0.1]
        ]),
        minerals: new Map([
          [MineralType.CALCIUM, 20],
          [MineralType.PHOSPHORUS, 15]
        ]),
        digestibility: 0.95,
        bioavailability: 0.9,
        antiNutrients: 0.05,
        toxicity: 0,
        moisture: 0.17,
        hardness: 0.1,
        perishability: 2
      },
      seasonality: new Map([
        ['spring', 1.0],
        ['summer', 0.8],
        ['autumn', 0.6],
        ['winter', 0.2]
      ]),
      location: 'tree',
      abundance: 0.7,
      harvestDifficulty: 0.3,
      processingRequired: false,
      storageLife: 3,
      competitionLevel: 0.4,
      predationRisk: 0.2,
      medicinalProperties: new Map(),
      addictivePotential: 0.6,
      culturalValue: 0.8
    });

    // Dead insects - protein source
    this.foodSources.set('insect_carrion', {
      id: 'insect_carrion',
      name: 'Insect Carrion',
      type: 'carrion',
      nutrition: {
        carbohydrates: 5,
        proteins: 65,
        fats: 25,
        fiber: 5,
        water: 60,
        calories: 450,
        metabolizableEnergy: 400,
        vitamins: new Map([
          [VitaminType.VITAMIN_B12, 2.5],
          [VitaminType.VITAMIN_B6, 0.5],
          [VitaminType.NIACIN, 8]
        ]),
        minerals: new Map([
          [MineralType.IRON, 15],
          [MineralType.ZINC, 8],
          [MineralType.PHOSPHORUS, 200]
        ]),
        digestibility: 0.8,
        bioavailability: 0.85,
        antiNutrients: 0.1,
        toxicity: 0.2,
        moisture: 0.6,
        hardness: 0.7,
        perishability: 1
      },
      seasonality: new Map([
        ['spring', 0.6],
        ['summer', 1.0],
        ['autumn', 0.8],
        ['winter', 0.3]
      ]),
      location: 'surface',
      abundance: 0.4,
      harvestDifficulty: 0.6,
      processingRequired: true,
      storageLife: 2,
      competitionLevel: 0.8,
      predationRisk: 0.3,
      medicinalProperties: new Map(),
      addictivePotential: 0.3,
      culturalValue: 0.6
    });

    // Seeds - balanced nutrition
    this.foodSources.set('seeds', {
      id: 'seeds',
      name: 'Plant Seeds',
      type: 'plant',
      nutrition: {
        carbohydrates: 45,
        proteins: 20,
        fats: 30,
        fiber: 5,
        water: 10,
        calories: 520,
        metabolizableEnergy: 480,
        vitamins: new Map([
          [VitaminType.VITAMIN_E, 15],
          [VitaminType.FOLATE, 60],
          [VitaminType.NIACIN, 5]
        ]),
        minerals: new Map([
          [MineralType.MAGNESIUM, 120],
          [MineralType.PHOSPHORUS, 350],
          [MineralType.ZINC, 5]
        ]),
        digestibility: 0.7,
        bioavailability: 0.75,
        antiNutrients: 0.2,
        toxicity: 0,
        moisture: 0.1,
        hardness: 0.9,
        perishability: 30
      },
      seasonality: new Map([
        ['spring', 0.3],
        ['summer', 0.6],
        ['autumn', 1.0],
        ['winter', 0.8]
      ]),
      location: 'surface',
      abundance: 0.6,
      harvestDifficulty: 0.4,
      processingRequired: true,
      storageLife: 21,
      competitionLevel: 0.7,
      predationRisk: 0.1,
      medicinalProperties: new Map(),
      addictivePotential: 0.2,
      culturalValue: 0.4
    });

    // Fungus - emergency food source
    this.foodSources.set('mushrooms', {
      id: 'mushrooms',
      name: 'Wild Mushrooms',
      type: 'fungus',
      nutrition: {
        carbohydrates: 15,
        proteins: 25,
        fats: 3,
        fiber: 10,
        water: 85,
        calories: 180,
        metabolizableEnergy: 150,
        vitamins: new Map([
          [VitaminType.VITAMIN_D, 0.2],
          [VitaminType.NIACIN, 3.5],
          [VitaminType.FOLATE, 20]
        ]),
        minerals: new Map([
          [MineralType.SELENIUM, 9],
          [MineralType.COPPER, 0.3],
          [MineralType.PHOSPHORUS, 86]
        ]),
        digestibility: 0.6,
        bioavailability: 0.7,
        antiNutrients: 0.15,
        toxicity: 0.3,
        moisture: 0.85,
        hardness: 0.4,
        perishability: 3
      },
      seasonality: new Map([
        ['spring', 0.8],
        ['summer', 0.4],
        ['autumn', 1.0],
        ['winter', 0.2]
      ]),
      location: 'underground',
      abundance: 0.3,
      harvestDifficulty: 0.5,
      processingRequired: false,
      storageLife: 5,
      competitionLevel: 0.5,
      predationRisk: 0.4,
      medicinalProperties: new Map([
        ['immune_boost', 0.3],
        ['antioxidant', 0.4]
      ]),
      addictivePotential: 0.1,
      culturalValue: 0.2
    });

    // Nectar - high energy source
    this.foodSources.set('flower_nectar', {
      id: 'flower_nectar',
      name: 'Flower Nectar',
      type: 'plant',
      nutrition: {
        carbohydrates: 70,
        proteins: 1,
        fats: 0.1,
        fiber: 0,
        water: 28,
        calories: 285,
        metabolizableEnergy: 270,
        vitamins: new Map([
          [VitaminType.VITAMIN_C, 8],
          [VitaminType.FOLATE, 3]
        ]),
        minerals: new Map([
          [MineralType.CALCIUM, 6],
          [MineralType.PHOSPHORUS, 4]
        ]),
        digestibility: 0.98,
        bioavailability: 0.95,
        antiNutrients: 0,
        toxicity: 0,
        moisture: 0.28,
        hardness: 0.05,
        perishability: 1
      },
      seasonality: new Map([
        ['spring', 1.0],
        ['summer', 0.9],
        ['autumn', 0.4],
        ['winter', 0.0]
      ]),
      location: 'surface',
      abundance: 0.5,
      harvestDifficulty: 0.7,
      processingRequired: false,
      storageLife: 2,
      competitionLevel: 0.9,
      predationRisk: 0.5,
      medicinalProperties: new Map([
        ['energy_boost', 0.8]
      ]),
      addictivePotential: 0.7,
      culturalValue: 0.9
    });
  }

  private initializeDietaryRequirements(): void {
    // Worker ant requirements
    const workerRequirements: DietaryRequirement[] = [
      {
        nutrientType: NutrientType.CARBOHYDRATES,
        dailyRequirement: 8.0,
        minimumRequirement: 5.0,
        maximumSafe: 15.0,
        toxicLevel: 25.0,
        growthMultiplier: 1.5,
        reproductiveMultiplier: 1.0,
        ageingMultiplier: 0.8,
        bodyStores: 2.0,
        depletionRate: 0.8,
        halfLife: 1.5,
        deficiencySymptoms: ['fatigue', 'reduced_work_capacity', 'weakness'],
        toxicitySymptoms: ['hyperactivity', 'digestive_upset'],
        interactionEffects: new Map()
      },
      {
        nutrientType: NutrientType.PROTEINS,
        dailyRequirement: 3.0,
        minimumRequirement: 2.0,
        maximumSafe: 8.0,
        toxicLevel: 12.0,
        growthMultiplier: 2.0,
        reproductiveMultiplier: 1.3,
        ageingMultiplier: 1.2,
        bodyStores: 10.0,
        depletionRate: 0.3,
        halfLife: 7.0,
        deficiencySymptoms: ['muscle_wasting', 'poor_healing', 'immune_weakness'],
        toxicitySymptoms: ['kidney_stress', 'dehydration'],
        interactionEffects: new Map()
      },
      {
        nutrientType: NutrientType.FATS,
        dailyRequirement: 1.5,
        minimumRequirement: 0.8,
        maximumSafe: 4.0,
        toxicLevel: 8.0,
        growthMultiplier: 1.2,
        reproductiveMultiplier: 1.5,
        ageingMultiplier: 0.9,
        bodyStores: 20.0,
        depletionRate: 0.1,
        halfLife: 14.0,
        deficiencySymptoms: ['poor_insulation', 'hormone_imbalance', 'vitamin_deficiency'],
        toxicitySymptoms: ['obesity', 'reduced_mobility'],
        interactionEffects: new Map()
      },
      {
        nutrientType: NutrientType.WATER,
        dailyRequirement: 15.0,
        minimumRequirement: 10.0,
        maximumSafe: 30.0,
        toxicLevel: 50.0,
        growthMultiplier: 1.2,
        reproductiveMultiplier: 1.3,
        ageingMultiplier: 1.1,
        bodyStores: 5.0,
        depletionRate: 2.0,
        halfLife: 0.5,
        deficiencySymptoms: ['dehydration', 'reduced_circulation', 'organ_failure'],
        toxicitySymptoms: ['water_intoxication', 'electrolyte_imbalance'],
        interactionEffects: new Map()
      }
    ];

    this.dietaryRequirements.set('worker', workerRequirements);

    // Soldier ant requirements (higher protein needs)
    const soldierRequirements = workerRequirements.map(req => ({
      ...req,
      dailyRequirement: req.nutrientType === NutrientType.PROTEINS ? 
        req.dailyRequirement * 1.3 : req.dailyRequirement,
      minimumRequirement: req.nutrientType === NutrientType.PROTEINS ? 
        req.minimumRequirement * 1.3 : req.minimumRequirement
    }));

    this.dietaryRequirements.set('soldier', soldierRequirements);

    // Queen requirements (much higher for egg production)
    const queenRequirements = workerRequirements.map(req => ({
      ...req,
      dailyRequirement: req.dailyRequirement * 3.0,
      minimumRequirement: req.minimumRequirement * 2.5,
      reproductiveMultiplier: req.reproductiveMultiplier * 2.0
    }));

    this.dietaryRequirements.set('queen', queenRequirements);
  }

  // Main simulation methods

  public simulateDay(
    populationData: any,
    environmentalFactors: Map<string, number>,
    foodAvailabilityMap: Map<string, number>
  ): void {
    // Update environmental factors
    this.updateEnvironmentalFactors(environmentalFactors);
    this.foodAvailability = foodAvailabilityMap;

    // Process metabolism for all ants
    this.processMetabolism(populationData);

    // Update nutritional status
    this.updateNutritionalStatus();

    // Process feeding behavior
    this.processFeedingBehavior(populationData);

    // Update food preferences based on experiences
    this.updateFoodPreferences();

    // Check for nutritional deficiencies and toxicities
    this.checkNutritionalHealth();
  }

  private updateEnvironmentalFactors(factors: Map<string, number>): void {
    const temperature = factors.get('temperature') || 20;
    const humidity = factors.get('humidity') || 0.5;
    const seasonalStress = factors.get('seasonal_stress') || 0.3;

    this.environmentalStress = seasonalStress;

    // Update seasonal factors affecting food availability
    this.seasonalFactors.set('temperature_effect', this.calculateTemperatureEffect(temperature));
    this.seasonalFactors.set('humidity_effect', this.calculateHumidityEffect(humidity));
  }

  private calculateTemperatureEffect(temperature: number): number {
    // Optimal temperature range for ant activity: 20-30°C
    if (temperature >= 20 && temperature <= 30) {
      return 1.0;
    } else if (temperature < 20) {
      return Math.max(0.2, 1.0 - (20 - temperature) * 0.05);
    } else {
      return Math.max(0.2, 1.0 - (temperature - 30) * 0.03);
    }
  }

  private calculateHumidityEffect(humidity: number): number {
    // Optimal humidity range: 50-80%
    if (humidity >= 0.5 && humidity <= 0.8) {
      return 1.0;
    } else if (humidity < 0.5) {
      return Math.max(0.3, humidity * 2);
    } else {
      return Math.max(0.4, 1.4 - humidity);
    }
  }

  private processMetabolism(populationData: any): void {
    // Process each ant's metabolism
    for (const [antId, status] of this.nutritionalStatus) {
      const profile = this.metabolicProfiles.get(antId);
      if (!profile) continue;

      // Calculate daily energy expenditure
      const energyExpenditure = this.calculateEnergyExpenditure(antId, profile);

      // Calculate nutrient consumption
      const nutrientConsumption = this.calculateNutrientConsumption(antId, profile);

      // Update energy reserves
      this.updateEnergyReserves(antId, energyExpenditure);

      // Update nutrient levels
      this.updateNutrientLevels(antId, nutrientConsumption);

      // Record metabolic event
      this.recordMetabolicEvent(antId, {
        timestamp: Date.now(),
        type: 'rest',
        details: {
          energyExpended: energyExpenditure,
          duration: 1440 // Full day in minutes
        },
        metabolicImpact: {
          energyChange: -energyExpenditure,
          nutrientChanges: nutrientConsumption,
          healthEffects: new Map()
        }
      });
    }
  }

  private calculateEnergyExpenditure(antId: string, profile: MetabolicProfile): number {
    let totalExpenditure = profile.basalMetabolicRate;

    // Add activity costs
    totalExpenditure += profile.activeMetabolicRate * this.getActivityLevel(antId);

    // Add thermoregulation costs
    const tempEffect = this.seasonalFactors.get('temperature_effect') || 1.0;
    totalExpenditure += profile.thermoregulationCost * (2 - tempEffect);

    // Add stress costs
    totalExpenditure += profile.basalMetabolicRate * this.environmentalStress * 0.2;

    // Add health-related costs
    const status = this.nutritionalStatus.get(antId);
    if (status) {
      totalExpenditure += profile.diseaseMetabolicCost * (1 - status.overallNutrition);
      totalExpenditure += profile.immuneSystemCost;
    }

    return totalExpenditure;
  }

  private getActivityLevel(antId: string): number {
    // Simplified activity level - would integrate with task system
    return 0.6; // Moderate activity level
  }

  private calculateNutrientConsumption(antId: string, profile: MetabolicProfile): Map<string, number> {
    const consumption = new Map<string, number>();
    
    // Get caste-specific requirements
    const caste = this.getAntCaste(antId);
    const requirements = this.dietaryRequirements.get(caste) || this.dietaryRequirements.get('worker')!;

    for (const requirement of requirements) {
      const dailyNeed = requirement.dailyRequirement * profile.casteMultiplier;
      const consumptionRate = dailyNeed * (1 + this.environmentalStress * 0.2);
      consumption.set(requirement.nutrientType.toString(), consumptionRate);
    }

    return consumption;
  }

  private getAntCaste(antId: string): string {
    // Simplified caste detection - would integrate with colony system
    if (antId.includes('queen')) return 'queen';
    if (antId.includes('soldier')) return 'soldier';
    return 'worker';
  }

  private updateEnergyReserves(antId: string, expenditure: number): void {
    const status = this.nutritionalStatus.get(antId);
    if (!status) return;

    status.energyReserves = Math.max(0, status.energyReserves - expenditure);
    
    // Update energy level based on reserves
    const maxReserves = 500; // kcal - typical maximum for worker ant
    status.energyLevel = Math.min(1, status.energyReserves / maxReserves);

    // Update hunger level
    status.hungerLevel = Math.min(1, (maxReserves - status.energyReserves) / maxReserves);
  }

  private updateNutrientLevels(antId: string, consumption: Map<string, number>): void {
    const status = this.nutritionalStatus.get(antId);
    if (!status) return;

    for (const [nutrient, amount] of consumption) {
      const currentLevel = status.recentIntake.get(nutrient as NutrientType) || 0;
      const newLevel = Math.max(0, currentLevel - amount);
      status.recentIntake.set(nutrient as NutrientType, newLevel);
    }

    // Update vitamin and mineral levels
    this.depleteVitaminsAndMinerals(status);
  }

  private depleteVitaminsAndMinerals(status: NutritionalStatus): void {
    // Deplete vitamins based on their half-lives
    for (const [vitamin, level] of status.vitaminLevels) {
      const depletionRate = this.getVitaminDepletionRate(vitamin);
      const newLevel = level * (1 - depletionRate);
      status.vitaminLevels.set(vitamin, newLevel);
    }

    // Deplete minerals
    for (const [mineral, level] of status.mineralLevels) {
      const depletionRate = this.getMineralDepletionRate(mineral);
      const newLevel = level * (1 - depletionRate);
      status.mineralLevels.set(mineral, newLevel);
    }
  }

  private getVitaminDepletionRate(vitamin: VitaminType): number {
    const depletionRates = new Map([
      [VitaminType.VITAMIN_C, 0.15],     // Water-soluble, rapid depletion
      [VitaminType.VITAMIN_B1, 0.12],
      [VitaminType.VITAMIN_B2, 0.10],
      [VitaminType.VITAMIN_B6, 0.08],
      [VitaminType.VITAMIN_B12, 0.02],   // Stored in liver
      [VitaminType.FOLATE, 0.14],
      [VitaminType.NIACIN, 0.11],
      [VitaminType.BIOTIN, 0.05],
      [VitaminType.VITAMIN_A, 0.03],     // Fat-soluble, slower depletion
      [VitaminType.VITAMIN_D, 0.02],
      [VitaminType.VITAMIN_E, 0.02],
      [VitaminType.VITAMIN_K, 0.04]
    ]);

    return depletionRates.get(vitamin) || 0.05;
  }

  private getMineralDepletionRate(mineral: MineralType): number {
    const depletionRates = new Map([
      [MineralType.CALCIUM, 0.01],       // Stored in exoskeleton
      [MineralType.PHOSPHORUS, 0.05],
      [MineralType.MAGNESIUM, 0.06],
      [MineralType.IRON, 0.02],          // Recycled efficiently
      [MineralType.ZINC, 0.08],
      [MineralType.COPPER, 0.03],
      [MineralType.MANGANESE, 0.07],
      [MineralType.SELENIUM, 0.04],
      [MineralType.IODINE, 0.15],        // Not well stored
      [MineralType.CHROMIUM, 0.10],
      [MineralType.MOLYBDENUM, 0.05],
      [MineralType.FLUORIDE, 0.01]
    ]);

    return depletionRates.get(mineral) || 0.05;
  }

  private updateNutritionalStatus(): void {
    for (const [antId, status] of this.nutritionalStatus) {
      // Update overall nutrition score
      this.calculateOverallNutrition(status);

      // Update body condition
      this.calculateBodyCondition(status);

      // Update hydration
      this.updateHydration(status);

      // Update thirst level
      this.updateThirst(status);

      // Check for deficiencies and toxicities
      this.checkNutrientDeficiencies(status);
      this.checkNutrientToxicities(status);

      // Update performance metrics
      this.updatePerformanceMetrics(status);
    }
  }

  private calculateOverallNutrition(status: NutritionalStatus): void {
    const factors = [
      status.energyLevel,
      this.calculateMacronutrientBalance(status),
      this.calculateMicronutrientBalance(status),
      status.hydrationLevel,
      1 - this.getDeficiencySeverity(status)
    ];

    status.overallNutrition = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private calculateMacronutrientBalance(status: NutritionalStatus): number {
    const carbBalance = Math.min(1, status.carbohydrateReserves / 50); // 50g target
    const proteinBalance = status.proteinBalance;
    const fatBalance = Math.min(1, status.fatReserves / 20); // 20g target

    return (carbBalance + proteinBalance + fatBalance) / 3;
  }

  private calculateMicronutrientBalance(status: NutritionalStatus): number {
    let vitaminScore = 0;
    let vitaminCount = 0;

    for (const [vitamin, level] of status.vitaminLevels) {
      const adequateLevel = this.getAdequateVitaminLevel(vitamin);
      vitaminScore += Math.min(1, level / adequateLevel);
      vitaminCount++;
    }

    let mineralScore = 0;
    let mineralCount = 0;

    for (const [mineral, level] of status.mineralLevels) {
      const adequateLevel = this.getAdequateMineralLevel(mineral);
      mineralScore += Math.min(1, level / adequateLevel);
      mineralCount++;
    }

    const avgVitaminScore = vitaminCount > 0 ? vitaminScore / vitaminCount : 1;
    const avgMineralScore = mineralCount > 0 ? mineralScore / mineralCount : 1;

    return (avgVitaminScore + avgMineralScore) / 2;
  }

  private getAdequateVitaminLevel(vitamin: VitaminType): number {
    // Adequate vitamin levels (simplified)
    const adequateLevels = new Map([
      [VitaminType.VITAMIN_A, 10],
      [VitaminType.VITAMIN_B1, 2],
      [VitaminType.VITAMIN_B2, 2.5],
      [VitaminType.VITAMIN_B6, 2],
      [VitaminType.VITAMIN_B12, 5],
      [VitaminType.VITAMIN_C, 15],
      [VitaminType.VITAMIN_D, 1],
      [VitaminType.VITAMIN_E, 8],
      [VitaminType.VITAMIN_K, 3],
      [VitaminType.FOLATE, 20],
      [VitaminType.NIACIN, 10],
      [VitaminType.BIOTIN, 1]
    ]);

    return adequateLevels.get(vitamin) || 5;
  }

  private getAdequateMineralLevel(mineral: MineralType): number {
    // Adequate mineral levels (simplified)
    const adequateLevels = new Map([
      [MineralType.CALCIUM, 100],
      [MineralType.PHOSPHORUS, 80],
      [MineralType.MAGNESIUM, 30],
      [MineralType.IRON, 20],
      [MineralType.ZINC, 10],
      [MineralType.COPPER, 2],
      [MineralType.MANGANESE, 5],
      [MineralType.SELENIUM, 1],
      [MineralType.IODINE, 0.5],
      [MineralType.CHROMIUM, 0.2],
      [MineralType.MOLYBDENUM, 0.1],
      [MineralType.FLUORIDE, 1]
    ]);

    return adequateLevels.get(mineral) || 10;
  }

  // Additional helper methods and complex logic would continue...
  // This includes methods for:
  // - processFeedingBehavior()
  // - updateFoodPreferences()
  // - checkNutritionalHealth()
  // - calculateBodyCondition()
  // - updateHydration()
  // - updateThirst()
  // - checkNutrientDeficiencies()
  // - checkNutrientToxicities()
  // - updatePerformanceMetrics()
  // - recordMetabolicEvent()
  // - getDeficiencySeverity()
  // And many more...

  // Public interface methods

  public getAntNutritionalStatus(antId: string): NutritionalStatus | undefined {
    return this.nutritionalStatus.get(antId);
  }

  public getFoodSource(foodId: string): FoodSource | undefined {
    return this.foodSources.get(foodId);
  }

  public getAllFoodSources(): FoodSource[] {
    return Array.from(this.foodSources.values());
  }

  public getAvailableFoodSources(season: string): FoodSource[] {
    return Array.from(this.foodSources.values())
      .filter(food => (food.seasonality.get(season) || 0) > 0.1)
      .sort((a, b) => (b.seasonality.get(season) || 0) - (a.seasonality.get(season) || 0));
  }

  public feedAnt(antId: string, foodId: string, quantity: number): boolean {
    const food = this.foodSources.get(foodId);
    const status = this.nutritionalStatus.get(antId);
    
    if (!food || !status) return false;

    // Process feeding
    const nutritionGained = this.calculateNutritionFromFood(food, quantity);
    this.applyNutritionGains(status, nutritionGained);

    // Update feeding time
    status.lastMealTime = Date.now();

    // Record feeding event
    this.recordMetabolicEvent(antId, {
      timestamp: Date.now(),
      type: 'feeding',
      details: {
        foodConsumed: foodId,
        quantity: quantity
      },
      metabolicImpact: {
        energyChange: nutritionGained.get('energy') || 0,
        nutrientChanges: nutritionGained,
        healthEffects: new Map()
      }
    });

    return true;
  }

  private calculateNutritionFromFood(food: FoodSource, quantity: number): Map<string, number> {
    const gains = new Map<string, number>();
    
    // Calculate energy gain
    const energyGain = (food.nutrition.metabolizableEnergy * quantity / 100) * food.nutrition.digestibility;
    gains.set('energy', energyGain);

    // Calculate macronutrient gains
    gains.set('carbohydrates', food.nutrition.carbohydrates * quantity / 100);
    gains.set('proteins', food.nutrition.proteins * quantity / 100);
    gains.set('fats', food.nutrition.fats * quantity / 100);
    gains.set('water', food.nutrition.water * quantity / 100);

    // Calculate vitamin gains
    for (const [vitamin, amount] of food.nutrition.vitamins) {
      const actualGain = amount * quantity / 100 * food.nutrition.bioavailability;
      gains.set(vitamin, actualGain);
    }

    // Calculate mineral gains
    for (const [mineral, amount] of food.nutrition.minerals) {
      const actualGain = amount * quantity / 100 * food.nutrition.bioavailability;
      gains.set(mineral, actualGain);
    }

    return gains;
  }

  private applyNutritionGains(status: NutritionalStatus, gains: Map<string, number>): void {
    // Apply energy gain
    const energyGain = gains.get('energy') || 0;
    status.energyReserves += energyGain;
    status.energyLevel = Math.min(1, status.energyReserves / 500); // Max 500 kcal
    status.hungerLevel = Math.max(0, status.hungerLevel - energyGain / 100);

    // Apply macronutrient gains
    status.carbohydrateReserves += gains.get('carbohydrates') || 0;
    status.fatReserves += gains.get('fats') || 0;
    
    // Update protein balance
    const proteinGain = gains.get('proteins') || 0;
    status.proteinBalance = Math.min(1, status.proteinBalance + proteinGain / 50);

    // Apply water gain
    const waterGain = gains.get('water') || 0;
    status.hydrationLevel = Math.min(1, status.hydrationLevel + waterGain / 100);
    status.thirstLevel = Math.max(0, status.thirstLevel - waterGain / 50);

    // Apply vitamin gains
    for (const [vitamin, gain] of gains) {
      if (Object.values(VitaminType).includes(vitamin as VitaminType)) {
        const currentLevel = status.vitaminLevels.get(vitamin as VitaminType) || 0;
        status.vitaminLevels.set(vitamin as VitaminType, currentLevel + gain);
      }
    }

    // Apply mineral gains
    for (const [mineral, gain] of gains) {
      if (Object.values(MineralType).includes(mineral as MineralType)) {
        const currentLevel = status.mineralLevels.get(mineral as MineralType) || 0;
        status.mineralLevels.set(mineral as MineralType, currentLevel + gain);
      }
    }
  }

  // Placeholder implementations for remaining methods
  private calculateBodyCondition(status: NutritionalStatus): void {
    status.bodyCondition = (status.energyLevel + status.proteinBalance + status.hydrationLevel) / 3;
  }

  private updateHydration(status: NutritionalStatus): void {
    // Simplified hydration update
    status.hydrationLevel = Math.max(0, status.hydrationLevel - 0.1); // Daily water loss
  }

  private updateThirst(status: NutritionalStatus): void {
    status.thirstLevel = Math.min(1, 1 - status.hydrationLevel);
  }

  private checkNutrientDeficiencies(status: NutritionalStatus): void {
    status.deficiencies.clear();
    
    // Check vitamin deficiencies
    for (const [vitamin, level] of status.vitaminLevels) {
      const adequateLevel = this.getAdequateVitaminLevel(vitamin);
      if (level < adequateLevel * 0.5) {
        const severity = 1 - (level / adequateLevel);
        status.deficiencies.set(vitamin, severity);
      }
    }
  }

  private checkNutrientToxicities(status: NutritionalStatus): void {
    status.toxicities.clear();
    // Implementation for toxicity checking
  }

  private updatePerformanceMetrics(status: NutritionalStatus): void {
    // Update cognitive function based on nutrition
    status.cognitiveFunction = Math.min(1, status.overallNutrition * 1.2);
    
    // Update immune function
    status.immuneFunction = status.overallNutrition * 0.9;
    
    // Update reproductive health
    status.reproductiveHealth = Math.min(1, status.overallNutrition * status.bodyCondition);
  }

  private recordMetabolicEvent(antId: string, event: MetabolicEvent): void {
    if (!this.metabolicHistory.has(antId)) {
      this.metabolicHistory.set(antId, []);
    }
    
    const history = this.metabolicHistory.get(antId)!;
    history.push(event);
    
    // Keep only last 100 events
    if (history.length > 100) {
      history.shift();
    }
  }

  private getDeficiencySeverity(status: NutritionalStatus): number {
    if (status.deficiencies.size === 0) return 0;
    
    const severities = Array.from(status.deficiencies.values());
    return severities.reduce((sum, severity) => sum + severity, 0) / severities.length;
  }

  // Additional placeholder methods
  private processFeedingBehavior(populationData: any): void {
    // Implementation for feeding behavior simulation
  }

  private updateFoodPreferences(): void {
    // Implementation for food preference updates
  }

  private checkNutritionalHealth(): void {
    // Implementation for nutritional health checks
  }
}