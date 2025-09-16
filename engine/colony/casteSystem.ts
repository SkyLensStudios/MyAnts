/**
 * Caste System
 * Realistic ant caste determination and role management
 */

export enum AntCaste {
  WORKER = 'worker',
  SOLDIER = 'soldier',
  QUEEN = 'queen',
  MALE = 'male',
  NURSE = 'nurse',
  FORAGER = 'forager',
  ARCHITECT = 'architect',
  GUARD = 'guard'
}

export interface CasteTraits {
  // Physical characteristics
  size: number;           // Body size multiplier (1.0 = average worker)
  strength: number;       // Physical strength (0-1)
  speed: number;          // Movement speed (0-1)
  agility: number;        // Maneuverability (0-1)
  endurance: number;      // Stamina and work capacity (0-1)
  
  // Sensory capabilities
  vision: number;         // Visual acuity (0-1)
  smell: number;          // Olfactory sensitivity (0-1)
  touch: number;          // Tactile sensitivity (0-1)
  vibration: number;      // Vibration detection (0-1)
  
  // Behavioral tendencies
  aggression: number;     // Tendency to fight (0-1)
  exploration: number;    // Tendency to explore (0-1)
  sociability: number;    // Interaction with colony members (0-1)
  maintenance: number;    // Nest upkeep behavior (0-1)
  
  // Specialized abilities
  carrying_capacity: number;    // Weight they can carry
  mandible_strength: number;    // Bite force for cutting/defense
  venom_potency: number;        // For species with stingers
  flight_capable: boolean;      // Can fly (males, queens during nuptial flight)
  
  // Lifespan and reproduction
  lifespan_days: number;       // Natural lifespan
  reproductive_capable: boolean; // Can reproduce
  egg_laying_rate?: number;    // Eggs per day (queens only)
}

export interface CasteRole {
  primary_tasks: TaskType[];
  secondary_tasks: TaskType[];
  forbidden_tasks: TaskType[];
  leadership_level: number;     // 0-1, affects task assignment priority
  decision_weight: number;      // Influence in colony decisions
  emergency_roles: TaskType[];  // Tasks during crisis situations
}

export enum TaskType {
  // Basic maintenance
  CLEAN_NEST = 'clean_nest',
  REPAIR_TUNNELS = 'repair_tunnels',
  REMOVE_DEBRIS = 'remove_debris',
  VENTILATION = 'ventilation',
  
  // Food related
  FORAGE = 'forage',
  HUNT = 'hunt',
  STORE_FOOD = 'store_food',
  PROCESS_FOOD = 'process_food',
  FEED_LARVAE = 'feed_larvae',
  
  // Construction
  DIG_TUNNELS = 'dig_tunnels',
  BUILD_CHAMBERS = 'build_chambers',
  CONSTRUCT_NURSERY = 'construct_nursery',
  CREATE_STORAGE = 'create_storage',
  
  // Defense
  PATROL = 'patrol',
  GUARD_ENTRANCE = 'guard_entrance',
  FIGHT_INTRUDERS = 'fight_intruders',
  EMERGENCY_RESPONSE = 'emergency_response',
  
  // Social
  TEND_EGGS = 'tend_eggs',
  NURSE_LARVAE = 'nurse_larvae',
  GROOM_OTHERS = 'groom_others',
  COMMUNICATE = 'communicate',
  LAY_EGGS = 'lay_eggs',
  
  // Specialized
  SCOUT = 'scout',
  TRAIL_MAINTENANCE = 'trail_maintenance',
  TEMPERATURE_REGULATION = 'temperature_regulation',
  WASTE_MANAGEMENT = 'waste_management'
}

/**
 * Caste determination and management system
 */
export class CasteSystem {
  private casteDefinitions: Map<AntCaste, CasteTraits>;
  private casteRoles: Map<AntCaste, CasteRole>;
  private casteDevelopmentFactors: Map<string, number>;

  constructor() {
    this.casteDefinitions = new Map();
    this.casteRoles = new Map();
    this.casteDevelopmentFactors = new Map();
    
    this.initializeCasteDefinitions();
    this.initializeCasteRoles();
    this.initializeDevelopmentFactors();
  }

  private initializeCasteDefinitions(): void {
    // Worker caste - most numerous, general purpose
    this.casteDefinitions.set(AntCaste.WORKER, {
      size: 1.0,
      strength: 0.7,
      speed: 0.8,
      agility: 0.8,
      endurance: 0.9,
      vision: 0.7,
      smell: 0.8,
      touch: 0.8,
      vibration: 0.7,
      aggression: 0.3,
      exploration: 0.6,
      sociability: 0.9,
      maintenance: 0.8,
      carrying_capacity: 1.0,
      mandible_strength: 0.6,
      venom_potency: 0.0,
      flight_capable: false,
      lifespan_days: 45,
      reproductive_capable: false
    });

    // Soldier caste - larger, defensive specialists
    this.casteDefinitions.set(AntCaste.SOLDIER, {
      size: 1.5,
      strength: 0.95,
      speed: 0.6,
      agility: 0.6,
      endurance: 0.8,
      vision: 0.8,
      smell: 0.7,
      touch: 0.7,
      vibration: 0.8,
      aggression: 0.9,
      exploration: 0.4,
      sociability: 0.7,
      maintenance: 0.4,
      carrying_capacity: 1.5,
      mandible_strength: 0.95,
      venom_potency: 0.3,
      flight_capable: false,
      lifespan_days: 60,
      reproductive_capable: false
    });

    // Queen - reproductive specialist, largest
    this.casteDefinitions.set(AntCaste.QUEEN, {
      size: 3.0,
      strength: 0.7,
      speed: 0.3,
      agility: 0.3,
      endurance: 0.6,
      vision: 0.6,
      smell: 0.9,
      touch: 0.7,
      vibration: 0.6,
      aggression: 0.2,
      exploration: 0.1,
      sociability: 0.8,
      maintenance: 0.2,
      carrying_capacity: 0.5,
      mandible_strength: 0.4,
      venom_potency: 0.1,
      flight_capable: true, // During nuptial flight
      lifespan_days: 3650, // ~10 years
      reproductive_capable: true,
      egg_laying_rate: 100
    });

    // Male - reproductive, short-lived
    this.casteDefinitions.set(AntCaste.MALE, {
      size: 1.2,
      strength: 0.5,
      speed: 0.9,
      agility: 0.9,
      endurance: 0.4,
      vision: 0.9,
      smell: 0.9,
      touch: 0.6,
      vibration: 0.6,
      aggression: 0.1,
      exploration: 0.8,
      sociability: 0.3,
      maintenance: 0.1,
      carrying_capacity: 0.3,
      mandible_strength: 0.3,
      venom_potency: 0.0,
      flight_capable: true,
      lifespan_days: 14, // Very short-lived
      reproductive_capable: true
    });

    // Nurse - specialized for larval care
    this.casteDefinitions.set(AntCaste.NURSE, {
      size: 0.9,
      strength: 0.6,
      speed: 0.7,
      agility: 0.8,
      endurance: 0.8,
      vision: 0.8,
      smell: 0.9,
      touch: 0.9,
      vibration: 0.7,
      aggression: 0.2,
      exploration: 0.3,
      sociability: 0.95,
      maintenance: 0.9,
      carrying_capacity: 0.8,
      mandible_strength: 0.4,
      venom_potency: 0.0,
      flight_capable: false,
      lifespan_days: 50,
      reproductive_capable: false
    });

    // Forager - specialized for food collection
    this.casteDefinitions.set(AntCaste.FORAGER, {
      size: 1.1,
      strength: 0.8,
      speed: 0.9,
      agility: 0.9,
      endurance: 0.95,
      vision: 0.9,
      smell: 0.95,
      touch: 0.8,
      vibration: 0.8,
      aggression: 0.4,
      exploration: 0.95,
      sociability: 0.7,
      maintenance: 0.5,
      carrying_capacity: 1.2,
      mandible_strength: 0.7,
      venom_potency: 0.1,
      flight_capable: false,
      lifespan_days: 40, // Shorter due to dangerous work
      reproductive_capable: false
    });

    // Architect - specialized for construction
    this.casteDefinitions.set(AntCaste.ARCHITECT, {
      size: 1.0,
      strength: 0.8,
      speed: 0.6,
      agility: 0.7,
      endurance: 0.9,
      vision: 0.8,
      smell: 0.7,
      touch: 0.95,
      vibration: 0.9,
      aggression: 0.2,
      exploration: 0.5,
      sociability: 0.8,
      maintenance: 0.95,
      carrying_capacity: 1.0,
      mandible_strength: 0.8,
      venom_potency: 0.0,
      flight_capable: false,
      lifespan_days: 55,
      reproductive_capable: false
    });

    // Guard - patrol and security specialist
    this.casteDefinitions.set(AntCaste.GUARD, {
      size: 1.3,
      strength: 0.85,
      speed: 0.8,
      agility: 0.8,
      endurance: 0.85,
      vision: 0.9,
      smell: 0.8,
      touch: 0.7,
      vibration: 0.9,
      aggression: 0.7,
      exploration: 0.6,
      sociability: 0.7,
      maintenance: 0.6,
      carrying_capacity: 1.1,
      mandible_strength: 0.8,
      venom_potency: 0.2,
      flight_capable: false,
      lifespan_days: 50,
      reproductive_capable: false
    });
  }

  private initializeCasteRoles(): void {
    // Worker roles
    this.casteRoles.set(AntCaste.WORKER, {
      primary_tasks: [
        TaskType.CLEAN_NEST,
        TaskType.REPAIR_TUNNELS,
        TaskType.STORE_FOOD,
        TaskType.REMOVE_DEBRIS
      ],
      secondary_tasks: [
        TaskType.DIG_TUNNELS,
        TaskType.FORAGE,
        TaskType.BUILD_CHAMBERS,
        TaskType.TEND_EGGS
      ],
      forbidden_tasks: [TaskType.LAY_EGGS, TaskType.FIGHT_INTRUDERS],
      leadership_level: 0.3,
      decision_weight: 0.1,
      emergency_roles: [TaskType.EMERGENCY_RESPONSE, TaskType.REPAIR_TUNNELS]
    });

    // Soldier roles
    this.casteRoles.set(AntCaste.SOLDIER, {
      primary_tasks: [
        TaskType.FIGHT_INTRUDERS,
        TaskType.GUARD_ENTRANCE,
        TaskType.PATROL,
        TaskType.EMERGENCY_RESPONSE
      ],
      secondary_tasks: [
        TaskType.DIG_TUNNELS,
        TaskType.REMOVE_DEBRIS
      ],
      forbidden_tasks: [TaskType.LAY_EGGS, TaskType.TEND_EGGS, TaskType.NURSE_LARVAE],
      leadership_level: 0.7,
      decision_weight: 0.6,
      emergency_roles: [TaskType.FIGHT_INTRUDERS, TaskType.EMERGENCY_RESPONSE]
    });

    // Queen roles
    this.casteRoles.set(AntCaste.QUEEN, {
      primary_tasks: [TaskType.LAY_EGGS],
      secondary_tasks: [TaskType.COMMUNICATE],
      forbidden_tasks: [
        TaskType.FORAGE, TaskType.DIG_TUNNELS, TaskType.FIGHT_INTRUDERS,
        TaskType.CLEAN_NEST, TaskType.PATROL
      ],
      leadership_level: 1.0,
      decision_weight: 1.0,
      emergency_roles: [TaskType.LAY_EGGS]
    });

    // Male roles
    this.casteRoles.set(AntCaste.MALE, {
      primary_tasks: [],
      secondary_tasks: [TaskType.COMMUNICATE],
      forbidden_tasks: [
        TaskType.CLEAN_NEST, TaskType.DIG_TUNNELS, TaskType.FIGHT_INTRUDERS,
        TaskType.FORAGE, TaskType.TEND_EGGS, TaskType.NURSE_LARVAE
      ],
      leadership_level: 0.0,
      decision_weight: 0.0,
      emergency_roles: []
    });

    // Nurse roles
    this.casteRoles.set(AntCaste.NURSE, {
      primary_tasks: [
        TaskType.TEND_EGGS,
        TaskType.NURSE_LARVAE,
        TaskType.FEED_LARVAE,
        TaskType.CONSTRUCT_NURSERY
      ],
      secondary_tasks: [
        TaskType.CLEAN_NEST,
        TaskType.GROOM_OTHERS,
        TaskType.TEMPERATURE_REGULATION
      ],
      forbidden_tasks: [TaskType.LAY_EGGS, TaskType.FIGHT_INTRUDERS, TaskType.FORAGE],
      leadership_level: 0.4,
      decision_weight: 0.3,
      emergency_roles: [TaskType.TEND_EGGS, TaskType.TEMPERATURE_REGULATION]
    });

    // Forager roles
    this.casteRoles.set(AntCaste.FORAGER, {
      primary_tasks: [
        TaskType.FORAGE,
        TaskType.SCOUT,
        TaskType.HUNT,
        TaskType.TRAIL_MAINTENANCE
      ],
      secondary_tasks: [
        TaskType.STORE_FOOD,
        TaskType.PROCESS_FOOD,
        TaskType.COMMUNICATE
      ],
      forbidden_tasks: [TaskType.LAY_EGGS, TaskType.TEND_EGGS, TaskType.NURSE_LARVAE],
      leadership_level: 0.5,
      decision_weight: 0.4,
      emergency_roles: [TaskType.SCOUT, TaskType.FORAGE]
    });

    // Architect roles
    this.casteRoles.set(AntCaste.ARCHITECT, {
      primary_tasks: [
        TaskType.DIG_TUNNELS,
        TaskType.BUILD_CHAMBERS,
        TaskType.CONSTRUCT_NURSERY,
        TaskType.CREATE_STORAGE
      ],
      secondary_tasks: [
        TaskType.REPAIR_TUNNELS,
        TaskType.VENTILATION,
        TaskType.TEMPERATURE_REGULATION
      ],
      forbidden_tasks: [TaskType.LAY_EGGS, TaskType.FIGHT_INTRUDERS, TaskType.FORAGE],
      leadership_level: 0.6,
      decision_weight: 0.5,
      emergency_roles: [TaskType.REPAIR_TUNNELS, TaskType.VENTILATION]
    });

    // Guard roles
    this.casteRoles.set(AntCaste.GUARD, {
      primary_tasks: [
        TaskType.PATROL,
        TaskType.GUARD_ENTRANCE,
        TaskType.SCOUT
      ],
      secondary_tasks: [
        TaskType.FIGHT_INTRUDERS,
        TaskType.EMERGENCY_RESPONSE,
        TaskType.COMMUNICATE
      ],
      forbidden_tasks: [TaskType.LAY_EGGS, TaskType.TEND_EGGS, TaskType.NURSE_LARVAE],
      leadership_level: 0.6,
      decision_weight: 0.4,
      emergency_roles: [TaskType.FIGHT_INTRUDERS, TaskType.PATROL]
    });
  }

  private initializeDevelopmentFactors(): void {
    // Environmental factors that influence caste development
    this.casteDevelopmentFactors.set('temperature', 0.2);      // Higher temp favors workers
    this.casteDevelopmentFactors.set('humidity', 0.1);         // Affects development speed
    this.casteDevelopmentFactors.set('food_availability', 0.3); // High food = more soldiers
    this.casteDevelopmentFactors.set('colony_size', 0.2);      // Large colonies need specialists
    this.casteDevelopmentFactors.set('threat_level', 0.15);    // High threat = more soldiers
    this.casteDevelopmentFactors.set('season', 0.05);          // Breeding season affects males/queens
  }

  public determineCaste(
    genetics: any, // Reference to genetic system
    environmentalFactors: Map<string, number>,
    colonyNeeds: Map<AntCaste, number>
  ): AntCaste {
    const casteScores = new Map<AntCaste, number>();

    // Initialize base scores from genetics
    for (const caste of Object.values(AntCaste)) {
      casteScores.set(caste as AntCaste, this.getGeneticPredisposition(genetics, caste as AntCaste));
    }

    // Apply environmental modifiers
    this.applyEnvironmentalFactors(casteScores, environmentalFactors);

    // Apply colony need modifiers
    this.applyColonyNeeds(casteScores, colonyNeeds);

    // Apply caste constraints (e.g., only one queen per colony)
    this.applyCasteConstraints(casteScores, colonyNeeds);

    // Find the highest scoring caste
    let bestCaste = AntCaste.WORKER;
    let bestScore = -1;

    for (const [caste, score] of casteScores) {
      if (score > bestScore) {
        bestScore = score;
        bestCaste = caste;
      }
    }

    return bestCaste;
  }

  private getGeneticPredisposition(genetics: any, caste: AntCaste): number {
    // This would integrate with the genetics system
    // For now, return a base random value with some bias
    const baseProbability = this.getBaseCasteProbability(caste);
    const geneticVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
    
    return baseProbability + geneticVariation;
  }

  private getBaseCasteProbability(caste: AntCaste): number {
    // Realistic caste distributions in a healthy colony
    switch (caste) {
      case AntCaste.WORKER: return 0.75;    // 75% workers
      case AntCaste.SOLDIER: return 0.15;   // 15% soldiers
      case AntCaste.NURSE: return 0.05;     // 5% nurses
      case AntCaste.FORAGER: return 0.03;   // 3% specialized foragers
      case AntCaste.ARCHITECT: return 0.015; // 1.5% architects
      case AntCaste.GUARD: return 0.01;     // 1% guards
      case AntCaste.QUEEN: return 0.0001;   // Very rare
      case AntCaste.MALE: return 0.0049;    // Seasonal, rare
      default: return 0.1;
    }
  }

  private applyEnvironmentalFactors(
    casteScores: Map<AntCaste, number>,
    environmentalFactors: Map<string, number>
  ): void {
    const temperature = environmentalFactors.get('temperature') || 0.5;
    const foodAvailability = environmentalFactors.get('food_availability') || 0.5;
    const threatLevel = environmentalFactors.get('threat_level') || 0.5;
    const colonySize = environmentalFactors.get('colony_size') || 0.5;

    // Temperature effects
    if (temperature > 0.7) {
      // High temperature favors workers and foragers
      casteScores.set(AntCaste.WORKER, casteScores.get(AntCaste.WORKER)! * 1.2);
      casteScores.set(AntCaste.FORAGER, casteScores.get(AntCaste.FORAGER)! * 1.3);
    } else if (temperature < 0.3) {
      // Low temperature favors maintenance castes
      casteScores.set(AntCaste.NURSE, casteScores.get(AntCaste.NURSE)! * 1.4);
      casteScores.set(AntCaste.ARCHITECT, casteScores.get(AntCaste.ARCHITECT)! * 1.2);
    }

    // Food availability effects
    if (foodAvailability > 0.7) {
      // Abundant food allows for specialists
      casteScores.set(AntCaste.SOLDIER, casteScores.get(AntCaste.SOLDIER)! * 1.3);
      casteScores.set(AntCaste.ARCHITECT, casteScores.get(AntCaste.ARCHITECT)! * 1.2);
    } else if (foodAvailability < 0.3) {
      // Food scarcity favors workers and foragers
      casteScores.set(AntCaste.WORKER, casteScores.get(AntCaste.WORKER)! * 1.4);
      casteScores.set(AntCaste.FORAGER, casteScores.get(AntCaste.FORAGER)! * 1.5);
    }

    // Threat level effects
    if (threatLevel > 0.6) {
      // High threat favors defensive castes
      casteScores.set(AntCaste.SOLDIER, casteScores.get(AntCaste.SOLDIER)! * 1.5);
      casteScores.set(AntCaste.GUARD, casteScores.get(AntCaste.GUARD)! * 1.4);
    }

    // Colony size effects
    if (colonySize > 0.8) {
      // Large colonies need more specialists
      casteScores.set(AntCaste.ARCHITECT, casteScores.get(AntCaste.ARCHITECT)! * 1.3);
      casteScores.set(AntCaste.NURSE, casteScores.get(AntCaste.NURSE)! * 1.2);
      casteScores.set(AntCaste.GUARD, casteScores.get(AntCaste.GUARD)! * 1.2);
    }
  }

  private applyColonyNeeds(
    casteScores: Map<AntCaste, number>,
    colonyNeeds: Map<AntCaste, number>
  ): void {
    // Boost scores for castes the colony needs more of
    for (const [caste, need] of colonyNeeds) {
      if (need > 0.7) {
        casteScores.set(caste, casteScores.get(caste)! * (1 + need));
      }
    }
  }

  private applyCasteConstraints(
    casteScores: Map<AntCaste, number>,
    colonyNeeds: Map<AntCaste, number>
  ): void {
    // Only one queen per colony (unless founding new colony)
    const queenNeed = colonyNeeds.get(AntCaste.QUEEN) || 0;
    if (queenNeed < 0.1) {
      casteScores.set(AntCaste.QUEEN, 0);
    }

    // Males only during breeding season
    const maleNeed = colonyNeeds.get(AntCaste.MALE) || 0;
    if (maleNeed < 0.1) {
      casteScores.set(AntCaste.MALE, 0);
    }
  }

  public getCasteTraits(caste: AntCaste): CasteTraits {
    return { ...this.casteDefinitions.get(caste)! };
  }

  public getCasteRole(caste: AntCaste): CasteRole {
    return { ...this.casteRoles.get(caste)! };
  }

  public canPerformTask(caste: AntCaste, task: TaskType): boolean {
    const role = this.casteRoles.get(caste);
    if (!role) return false;

    return !role.forbidden_tasks.includes(task) &&
           (role.primary_tasks.includes(task) || role.secondary_tasks.includes(task));
  }

  public getTaskPriority(caste: AntCaste, task: TaskType): number {
    const role = this.casteRoles.get(caste);
    if (!role) return 0;

    if (role.forbidden_tasks.includes(task)) return 0;
    if (role.primary_tasks.includes(task)) return 1.0;
    if (role.secondary_tasks.includes(task)) return 0.6;
    if (role.emergency_roles.includes(task)) return 0.8;

    return 0.2; // Can do it, but not specialized
  }

  public calculateCasteEfficiency(caste: AntCaste, task: TaskType): number {
    const traits = this.casteDefinitions.get(caste);
    const priority = this.getTaskPriority(caste, task);
    
    if (!traits || priority === 0) return 0;

    // Calculate efficiency based on relevant traits for the task
    let efficiency = priority;

    switch (task) {
      case TaskType.FORAGE:
        efficiency *= (traits.speed + traits.endurance + traits.vision + traits.smell) / 4;
        break;
      case TaskType.DIG_TUNNELS:
        efficiency *= (traits.strength + traits.endurance + traits.mandible_strength) / 3;
        break;
      case TaskType.FIGHT_INTRUDERS:
        efficiency *= (traits.strength + traits.aggression + traits.mandible_strength + traits.venom_potency) / 4;
        break;
      case TaskType.TEND_EGGS:
        efficiency *= (traits.touch + traits.sociability + traits.maintenance) / 3;
        break;
      case TaskType.SCOUT:
        efficiency *= (traits.speed + traits.vision + traits.exploration + traits.agility) / 4;
        break;
      default:
        efficiency *= (traits.endurance + traits.sociability) / 2;
    }

    return Math.min(1.0, efficiency);
  }

  public getOptimalCasteDistribution(colonySize: number, environmentalFactors: Map<string, number>): Map<AntCaste, number> {
    const distribution = new Map<AntCaste, number>();
    
    // Base distribution for a healthy colony
    const baseDistribution = new Map([
      [AntCaste.WORKER, 0.60],
      [AntCaste.SOLDIER, 0.20],
      [AntCaste.FORAGER, 0.10],
      [AntCaste.NURSE, 0.05],
      [AntCaste.ARCHITECT, 0.03],
      [AntCaste.GUARD, 0.015],
      [AntCaste.QUEEN, 0.0025],
      [AntCaste.MALE, 0.0025]
    ]);

    // Adjust based on colony size
    for (const [caste, basePortion] of baseDistribution) {
      let adjustedPortion = basePortion;
      
      if (colonySize < 100) {
        // Small colonies need more workers, fewer specialists
        if (caste === AntCaste.WORKER) adjustedPortion *= 1.3;
        else if (caste === AntCaste.SOLDIER) adjustedPortion *= 0.7;
        else if ([AntCaste.ARCHITECT, AntCaste.GUARD].includes(caste)) adjustedPortion *= 0.5;
      } else if (colonySize > 10000) {
        // Large colonies can support more specialists
        if ([AntCaste.ARCHITECT, AntCaste.GUARD, AntCaste.NURSE].includes(caste)) {
          adjustedPortion *= 1.5;
        }
      }
      
      distribution.set(caste, Math.max(0, adjustedPortion));
    }

    // Apply environmental modifiers
    const threatLevel = environmentalFactors.get('threat_level') || 0.5;
    const foodAvailability = environmentalFactors.get('food_availability') || 0.5;
    
    if (threatLevel > 0.7) {
      // Increase soldiers and guards in dangerous environments
      distribution.set(AntCaste.SOLDIER, distribution.get(AntCaste.SOLDIER)! * 1.5);
      distribution.set(AntCaste.GUARD, distribution.get(AntCaste.GUARD)! * 1.3);
    }
    
    if (foodAvailability < 0.3) {
      // Increase foragers in food-scarce environments
      distribution.set(AntCaste.FORAGER, distribution.get(AntCaste.FORAGER)! * 1.4);
    }

    // Normalize to ensure total equals 1.0
    const total = Array.from(distribution.values()).reduce((sum, value) => sum + value, 0);
    for (const [caste, portion] of distribution) {
      distribution.set(caste, portion / total);
    }

    return distribution;
  }

  public getAllCastes(): AntCaste[] {
    return Object.values(AntCaste);
  }

  public getAllTasks(): TaskType[] {
    return Object.values(TaskType);
  }
}