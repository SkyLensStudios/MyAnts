/**
 * Population Dynamics System
 * Manages colony population growth, decline, and demographic changes
 */

import { AntCaste } from './casteSystem';

export interface PopulationData {
  totalPopulation: number;
  casteDistribution: Map<AntCaste, number>;
  ageDistribution: Map<string, number>; // age group -> count
  sexDistribution: { males: number; females: number };
  mortalityRate: number;    // Deaths per day
  birthRate: number;        // Births per day
  growthRate: number;       // Net population change per day
}

export interface DemographicTrend {
  timeWindow: number;       // Period in days
  populationGrowth: number; // Average growth rate
  casteTrends: Map<AntCaste, number>; // Growth rate per caste
  mortalityTrends: Map<string, number>; // Death rate by cause
  reproductiveSuccess: number; // Successful reproductions per attempt
}

export interface PopulationPressure {
  housingPressure: number;    // 0-1, overcrowding in nest
  foodPressure: number;       // 0-1, food scarcity relative to population
  territoryPressure: number;  // 0-1, need for territory expansion
  workloadPressure: number;   // 0-1, insufficient workers for tasks
  defensePressure: number;    // 0-1, insufficient defenders
}

export interface LifecycleStage {
  name: string;
  durationDays: number;
  mortalityRate: number;    // Daily death probability
  resourceConsumption: number; // Resources needed per day
  productivity: number;     // Work output (0-1)
}

export interface PopulationModel {
  carryingCapacity: number;     // Maximum sustainable population
  optimalCasteRatios: Map<AntCaste, number>; // Ideal caste distribution
  seasonalFactors: Map<string, number>; // Seasonal effects on population
  environmentalFactors: Map<string, number>; // Environmental pressures
  geneticDiversity: number;     // 0-1, genetic health of population
}

export interface ReproductiveData {
  queenId?: string;
  eggLayingRate: number;       // Eggs per day
  hatchingRate: number;        // Proportion of eggs that hatch
  pupationRate: number;        // Proportion that complete metamorphosis
  fertilityDecline: number;    // Age-related fertility reduction
  inbreedingCoefficient: number; // Genetic diversity measure
}

export interface MortalityCause {
  name: string;
  rate: number;               // Deaths per day from this cause
  agePreference: string;      // Which age groups are most affected
  castePreference: AntCaste[]; // Which castes are most affected
  seasonal: boolean;          // Whether cause varies by season
  preventable: boolean;       // Whether colony actions can reduce it
}

/**
 * Comprehensive population dynamics simulation
 */
export class PopulationDynamicsSystem {
  private populationData: PopulationData;
  private demographicHistory: DemographicTrend[];
  private populationModel: PopulationModel;
  private reproductiveData: ReproductiveData;
  private mortalityCauses: MortalityCause[];
  private lifecycleStages: Map<string, LifecycleStage>;

  constructor(initialPopulation: number = 100) {
    this.populationData = this.initializePopulation(initialPopulation);
    this.demographicHistory = [];
    this.populationModel = this.initializeModel();
    this.reproductiveData = this.initializeReproductiveData();
    this.mortalityCauses = this.initializeMortalityCauses();
    this.lifecycleStages = this.initializeLifecycleStages();
  }

  private initializePopulation(total: number): PopulationData {
    // Start with a realistic caste distribution
    const casteDistribution = new Map([
      [AntCaste.WORKER, Math.floor(total * 0.70)],
      [AntCaste.SOLDIER, Math.floor(total * 0.15)],
      [AntCaste.NURSE, Math.floor(total * 0.08)],
      [AntCaste.FORAGER, Math.floor(total * 0.05)],
      [AntCaste.ARCHITECT, Math.floor(total * 0.015)],
      [AntCaste.GUARD, Math.floor(total * 0.005)],
      [AntCaste.QUEEN, 1],
      [AntCaste.MALE, 0] // Males only during breeding season
    ]);

    // Age distribution (simplified into age groups)
    const ageDistribution = new Map([
      ['eggs', Math.floor(total * 0.05)],
      ['larvae', Math.floor(total * 0.10)],
      ['pupae', Math.floor(total * 0.05)],
      ['young_adults', Math.floor(total * 0.40)],
      ['mature_adults', Math.floor(total * 0.35)],
      ['old_adults', Math.floor(total * 0.05)]
    ]);

    return {
      totalPopulation: total,
      casteDistribution,
      ageDistribution,
      sexDistribution: { males: 0, females: total },
      mortalityRate: 0.02, // 2% daily mortality
      birthRate: 0.05,     // 5% daily birth rate
      growthRate: 0.03     // 3% daily growth
    };
  }

  private initializeModel(): PopulationModel {
    return {
      carryingCapacity: 10000,
      optimalCasteRatios: new Map([
        [AntCaste.WORKER, 0.65],
        [AntCaste.SOLDIER, 0.15],
        [AntCaste.NURSE, 0.10],
        [AntCaste.FORAGER, 0.06],
        [AntCaste.ARCHITECT, 0.025],
        [AntCaste.GUARD, 0.01],
        [AntCaste.QUEEN, 0.0025],
        [AntCaste.MALE, 0.0025]
      ]),
      seasonalFactors: new Map([
        ['spring', 1.2],      // Higher reproduction
        ['summer', 1.0],      // Normal
        ['autumn', 0.8],      // Preparation for winter
        ['winter', 0.5]       // Reduced activity
      ]),
      environmentalFactors: new Map([
        ['temperature', 1.0],
        ['humidity', 1.0],
        ['food_availability', 1.0],
        ['predation_pressure', 1.0],
        ['disease_pressure', 1.0]
      ]),
      geneticDiversity: 0.85
    };
  }

  private initializeReproductiveData(): ReproductiveData {
    return {
      eggLayingRate: 50,       // 50 eggs per day
      hatchingRate: 0.85,      // 85% of eggs hatch
      pupationRate: 0.90,      // 90% complete metamorphosis
      fertilityDecline: 0.001, // 0.1% decline per day
      inbreedingCoefficient: 0.05
    };
  }

  private initializeMortalityCauses(): MortalityCause[] {
    return [
      {
        name: 'old_age',
        rate: 0.005,
        agePreference: 'old_adults',
        castePreference: [],
        seasonal: false,
        preventable: false
      },
      {
        name: 'disease',
        rate: 0.003,
        agePreference: 'larvae',
        castePreference: [],
        seasonal: true,
        preventable: true
      },
      {
        name: 'predation',
        rate: 0.002,
        agePreference: 'young_adults',
        castePreference: [AntCaste.FORAGER, AntCaste.WORKER],
        seasonal: true,
        preventable: true
      },
      {
        name: 'accidents',
        rate: 0.001,
        agePreference: 'mature_adults',
        castePreference: [AntCaste.ARCHITECT, AntCaste.WORKER],
        seasonal: false,
        preventable: true
      },
      {
        name: 'starvation',
        rate: 0.0005,
        agePreference: 'larvae',
        castePreference: [],
        seasonal: true,
        preventable: true
      },
      {
        name: 'combat',
        rate: 0.001,
        agePreference: 'mature_adults',
        castePreference: [AntCaste.SOLDIER, AntCaste.GUARD],
        seasonal: false,
        preventable: false
      }
    ];
  }

  private initializeLifecycleStages(): Map<string, LifecycleStage> {
    const stages = new Map();

    stages.set('egg', {
      name: 'egg',
      durationDays: 7,
      mortalityRate: 0.05,
      resourceConsumption: 0.1,
      productivity: 0
    });

    stages.set('larva', {
      name: 'larva',
      durationDays: 14,
      mortalityRate: 0.03,
      resourceConsumption: 0.3,
      productivity: 0
    });

    stages.set('pupa', {
      name: 'pupa',
      durationDays: 7,
      mortalityRate: 0.02,
      resourceConsumption: 0.2,
      productivity: 0
    });

    stages.set('young_adult', {
      name: 'young_adult',
      durationDays: 15,
      mortalityRate: 0.01,
      resourceConsumption: 1.0,
      productivity: 0.7
    });

    stages.set('mature_adult', {
      name: 'mature_adult',
      durationDays: 20,
      mortalityRate: 0.015,
      resourceConsumption: 1.0,
      productivity: 1.0
    });

    stages.set('old_adult', {
      name: 'old_adult',
      durationDays: 10,
      mortalityRate: 0.08,
      resourceConsumption: 0.8,
      productivity: 0.6
    });

    return stages;
  }

  public simulateDay(
    environmentalFactors: Map<string, number>,
    resourceAvailability: number,
    seasonalFactor: number = 1.0
  ): void {
    // Update environmental factors in model
    for (const [factor, value] of environmentalFactors) {
      this.populationModel.environmentalFactors.set(factor, value);
    }

    // Simulate births
    this.simulateBirths(seasonalFactor, resourceAvailability);

    // Simulate deaths
    this.simulateDeaths(environmentalFactors, resourceAvailability);

    // Age progression
    this.simulateAging();

    // Update population statistics
    this.updatePopulationStatistics();

    // Record demographic trend
    this.recordDemographicTrend();
  }

  private simulateBirths(seasonalFactor: number, resourceAvailability: number): void {
    const queen = this.populationData.casteDistribution.get(AntCaste.QUEEN) || 0;
    if (queen === 0) return; // No queen, no reproduction

    // Calculate actual egg laying rate
    let dailyEggs = this.reproductiveData.eggLayingRate;
    
    // Apply seasonal modifier
    dailyEggs *= seasonalFactor;
    
    // Apply resource limitation
    if (resourceAvailability < 0.5) {
      dailyEggs *= resourceAvailability * 2; // Linear reduction below 50%
    }

    // Apply fertility decline (queen aging)
    dailyEggs *= (1 - this.reproductiveData.fertilityDecline);

    // Apply population pressure
    const pressure = this.calculatePopulationPressure();
    const densityEffect = Math.max(0.1, 1 - pressure.housingPressure);
    dailyEggs *= densityEffect;

    // Add eggs to population
    const currentEggs = this.populationData.ageDistribution.get('eggs') || 0;
    this.populationData.ageDistribution.set('eggs', currentEggs + Math.floor(dailyEggs));

    // Update birth rate
    this.populationData.birthRate = dailyEggs / this.populationData.totalPopulation;
  }

  private simulateDeaths(
    environmentalFactors: Map<string, number>,
    resourceAvailability: number
  ): void {
    let totalDeaths = 0;

    for (const cause of this.mortalityCauses) {
      let causeDeaths = 0;
      let adjustedRate = cause.rate;

      // Apply environmental modifiers
      if (cause.seasonal) {
        const season = this.getCurrentSeason();
        adjustedRate *= this.populationModel.seasonalFactors.get(season) || 1.0;
      }

      // Apply resource availability effects
      if (cause.name === 'starvation') {
        adjustedRate *= Math.max(0, 2 - resourceAvailability * 2);
      }

      // Apply environmental pressure effects
      if (cause.name === 'disease') {
        const diseasePress = environmentalFactors.get('disease_pressure') || 1.0;
        adjustedRate *= diseasePress;
      }

      if (cause.name === 'predation') {
        const predPress = environmentalFactors.get('predation_pressure') || 1.0;
        adjustedRate *= predPress;
      }

      // Calculate deaths by age group and caste
      for (const [ageGroup, count] of this.populationData.ageDistribution) {
        if (count === 0) continue;

        let ageMultiplier = 1.0;
        if (cause.agePreference === ageGroup) {
          ageMultiplier = 2.0; // Double risk for preferred age group
        }

        const ageDeaths = count * adjustedRate * ageMultiplier;
        this.populationData.ageDistribution.set(ageGroup, Math.max(0, count - ageDeaths));
        causeDeaths += ageDeaths;
      }

      totalDeaths += causeDeaths;
    }

    // Update mortality rate
    this.populationData.mortalityRate = totalDeaths / this.populationData.totalPopulation;
  }

  private simulateAging(): void {
    // Move individuals through life stages
    const newDistribution = new Map(this.populationData.ageDistribution);

    // Eggs -> Larvae
    const eggs = this.populationData.ageDistribution.get('eggs') || 0;
    const hatching = eggs * this.reproductiveData.hatchingRate / 7; // 7-day egg stage
    newDistribution.set('eggs', Math.max(0, eggs - hatching));
    newDistribution.set('larvae', (newDistribution.get('larvae') || 0) + hatching);

    // Larvae -> Pupae
    const larvae = this.populationData.ageDistribution.get('larvae') || 0;
    const pupating = larvae / 14; // 14-day larval stage
    newDistribution.set('larvae', Math.max(0, larvae - pupating));
    newDistribution.set('pupae', (newDistribution.get('pupae') || 0) + pupating);

    // Pupae -> Young Adults
    const pupae = this.populationData.ageDistribution.get('pupae') || 0;
    const emerging = pupae * this.reproductiveData.pupationRate / 7; // 7-day pupal stage
    newDistribution.set('pupae', Math.max(0, pupae - emerging));
    newDistribution.set('young_adults', (newDistribution.get('young_adults') || 0) + emerging);

    // Young Adults -> Mature Adults
    const youngAdults = this.populationData.ageDistribution.get('young_adults') || 0;
    const maturing = youngAdults / 15; // 15-day young adult stage
    newDistribution.set('young_adults', Math.max(0, youngAdults - maturing));
    newDistribution.set('mature_adults', (newDistribution.get('mature_adults') || 0) + maturing);

    // Mature Adults -> Old Adults
    const matureAdults = this.populationData.ageDistribution.get('mature_adults') || 0;
    const aging = matureAdults / 20; // 20-day mature adult stage
    newDistribution.set('mature_adults', Math.max(0, matureAdults - aging));
    newDistribution.set('old_adults', (newDistribution.get('old_adults') || 0) + aging);

    this.populationData.ageDistribution = newDistribution;
  }

  private updatePopulationStatistics(): void {
    // Calculate total population
    this.populationData.totalPopulation = Array.from(
      this.populationData.ageDistribution.values()
    ).reduce((sum, count) => sum + count, 0);

    // Update growth rate
    this.populationData.growthRate = 
      this.populationData.birthRate - this.populationData.mortalityRate;

    // Update caste distribution based on emerging adults
    this.updateCasteDistribution();
  }

  private updateCasteDistribution(): void {
    // When young adults emerge, assign them to castes
    // This would integrate with the caste system to determine optimal assignments
    
    // For now, maintain optimal ratios
    const totalAdults = 
      (this.populationData.ageDistribution.get('young_adults') || 0) +
      (this.populationData.ageDistribution.get('mature_adults') || 0) +
      (this.populationData.ageDistribution.get('old_adults') || 0);

    for (const [caste, optimalRatio] of this.populationModel.optimalCasteRatios) {
      const targetCount = Math.floor(totalAdults * optimalRatio);
      this.populationData.casteDistribution.set(caste, targetCount);
    }
  }

  private recordDemographicTrend(): void {
    const trend: DemographicTrend = {
      timeWindow: 1, // Daily recording
      populationGrowth: this.populationData.growthRate,
      casteTrends: new Map(this.populationData.casteDistribution),
      mortalityTrends: new Map(),
      reproductiveSuccess: this.reproductiveData.hatchingRate * this.reproductiveData.pupationRate
    };

    // Record mortality by cause
    for (const cause of this.mortalityCauses) {
      trend.mortalityTrends.set(cause.name, cause.rate);
    }

    this.demographicHistory.push(trend);

    // Keep only last 30 days of history
    if (this.demographicHistory.length > 30) {
      this.demographicHistory.shift();
    }
  }

  private getCurrentSeason(): string {
    // Simplified season determination
    // In a full implementation, this would be based on actual game time
    const day = Date.now() / (1000 * 60 * 60 * 24) % 365;
    
    if (day < 91) return 'spring';
    if (day < 182) return 'summer';
    if (day < 273) return 'autumn';
    return 'winter';
  }

  public calculatePopulationPressure(): PopulationPressure {
    const current = this.populationData.totalPopulation;
    const capacity = this.populationModel.carryingCapacity;

    // Housing pressure based on carrying capacity
    const housingPressure = Math.min(1.0, current / capacity);

    // Food pressure based on resource consumption vs availability
    // This would need integration with resource system
    const foodPressure = 0.3; // Placeholder

    // Territory pressure based on population density
    const territoryPressure = Math.min(1.0, (current - capacity * 0.8) / (capacity * 0.2));

    // Workload pressure based on caste distribution
    const workers = this.populationData.casteDistribution.get(AntCaste.WORKER) || 0;
    const optimalWorkers = current * (this.populationModel.optimalCasteRatios.get(AntCaste.WORKER) || 0.65);
    const workloadPressure = Math.max(0, (optimalWorkers - workers) / optimalWorkers);

    // Defense pressure based on soldier count
    const soldiers = this.populationData.casteDistribution.get(AntCaste.SOLDIER) || 0;
    const optimalSoldiers = current * (this.populationModel.optimalCasteRatios.get(AntCaste.SOLDIER) || 0.15);
    const defensePressure = Math.max(0, (optimalSoldiers - soldiers) / optimalSoldiers);

    return {
      housingPressure: Math.max(0, Math.min(1, housingPressure)),
      foodPressure: Math.max(0, Math.min(1, foodPressure)),
      territoryPressure: Math.max(0, Math.min(1, territoryPressure)),
      workloadPressure: Math.max(0, Math.min(1, workloadPressure)),
      defensePressure: Math.max(0, Math.min(1, defensePressure))
    };
  }

  // Query methods

  public getPopulationData(): PopulationData {
    return { ...this.populationData };
  }

  public getDemographicTrends(days: number = 7): DemographicTrend[] {
    return this.demographicHistory.slice(-days);
  }

  public getPopulationModel(): PopulationModel {
    return { ...this.populationModel };
  }

  public getReproductiveData(): ReproductiveData {
    return { ...this.reproductiveData };
  }

  public getCastePopulation(caste: AntCaste): number {
    return this.populationData.casteDistribution.get(caste) || 0;
  }

  public getAgeGroupPopulation(ageGroup: string): number {
    return this.populationData.ageDistribution.get(ageGroup) || 0;
  }

  public getPopulationGrowthRate(): number {
    return this.populationData.growthRate;
  }

  public predictPopulation(days: number): number {
    // Simple exponential growth prediction
    return this.populationData.totalPopulation * 
           Math.pow(1 + this.populationData.growthRate, days);
  }

  public calculateOptimalPopulation(
    resourceAvailability: number,
    territorySize: number,
    threatLevel: number
  ): number {
    let optimal = this.populationModel.carryingCapacity;

    // Adjust for resource availability
    optimal *= resourceAvailability;

    // Adjust for territory size
    optimal *= Math.min(1.0, territorySize / 1000); // Assuming 1000 is optimal territory

    // Adjust for threat level (higher threats require smaller, more defensive populations)
    optimal *= (1 - threatLevel * 0.3);

    return Math.max(10, optimal); // Minimum viable population
  }

  // Management methods

  public adjustCarryingCapacity(newCapacity: number): void {
    this.populationModel.carryingCapacity = Math.max(1, newCapacity);
  }

  public updateOptimalCasteRatio(caste: AntCaste, ratio: number): void {
    this.populationModel.optimalCasteRatios.set(caste, Math.max(0, Math.min(1, ratio)));
  }

  public setReproductiveRate(rate: number): void {
    this.reproductiveData.eggLayingRate = Math.max(0, rate);
  }

  public adjustMortalityCause(causeName: string, newRate: number): void {
    const cause = this.mortalityCauses.find(c => c.name === causeName);
    if (cause) {
      cause.rate = Math.max(0, newRate);
    }
  }

  public simulateDisease(
    severity: number,
    duration: number,
    affectedAgeGroups: string[] = []
  ): void {
    // Temporarily increase disease mortality
    const diseaseCause = this.mortalityCauses.find(c => c.name === 'disease');
    if (diseaseCause) {
      const originalRate = diseaseCause.rate;
      diseaseCause.rate *= (1 + severity);

      // Restore original rate after duration
      setTimeout(() => {
        diseaseCause.rate = originalRate;
      }, duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    }
  }

  public simulateSwarmingEvent(): boolean {
    // Check if conditions are right for swarming (colony division)
    const pressure = this.calculatePopulationPressure();
    const population = this.populationData.totalPopulation;
    
    if (pressure.housingPressure > 0.8 && population > 1000) {
      // Create new colony with portion of population
      const swarmSize = Math.floor(population * 0.3);
      
      // Reduce current population
      this.populationData.totalPopulation -= swarmSize;
      
      // Adjust age and caste distributions proportionally
      for (const [ageGroup, count] of this.populationData.ageDistribution) {
        const newCount = Math.floor(count * 0.7);
        this.populationData.ageDistribution.set(ageGroup, newCount);
      }
      
      for (const [caste, count] of this.populationData.casteDistribution) {
        const newCount = Math.floor(count * 0.7);
        this.populationData.casteDistribution.set(caste, newCount);
      }
      
      return true; // Swarming occurred
    }
    
    return false;
  }

  public getLifecycleStage(stageName: string): LifecycleStage | undefined {
    return this.lifecycleStages.get(stageName);
  }

  public getAllLifecycleStages(): LifecycleStage[] {
    return Array.from(this.lifecycleStages.values());
  }
}