/**
 * Comprehensive genetics system for ant simulation
 * Based on real ant genetics and inheritance patterns
 */

export interface GeneticTraits {
  // Physical traits
  aggressiveness: number;        // 0-1, affects combat and territorial behavior
  forageEfficiency: number;      // 0-1, affects resource gathering speed
  thermalTolerance: number;      // 0-1, survival in temperature extremes  
  diseaseResistance: number;     // 0-1, resistance to pathogens
  lifespan: number;             // Base lifespan in simulation time units
  size: number;                 // Physical size multiplier (0.5-2.0)
  speed: number;                // Movement speed multiplier
  carryingCapacity: number;     // How much weight can be carried
  
  // Cognitive traits
  spatialMemory: number;        // 0-1, ability to remember locations
  learningRate: number;        // 0-1, how quickly behaviors adapt
  communicationSkill: number;  // 0-1, effectiveness of pheromone signals
  
  // Specialized traits
  nurturingInstinct: number;    // Care for larvae and eggs
  constructionAbility: number; // Tunnel building efficiency
  sensoryAcuity: number;       // Detection range for stimuli
}

export interface GeneticMarkers {
  dominantAlleles: string[];    // Dominant genetic expressions
  recessiveAlleles: string[];   // Recessive traits that may appear
  mutations: string[];          // Beneficial or harmful mutations
  chromosomeId: string;         // Unique genetic identifier
}

export class AntGenetics {
  public traits: GeneticTraits;
  public markers: GeneticMarkers;
  public generation: number;
  public parentage: string[];   // IDs of genetic parents

  constructor(
    traits?: Partial<GeneticTraits>, 
    markers?: Partial<GeneticMarkers>,
    generation: number = 0
  ) {
    this.traits = this.initializeTraits(traits);
    this.markers = this.initializeMarkers(markers);
    this.generation = generation;
    this.parentage = [];
  }

  private initializeTraits(traits?: Partial<GeneticTraits>): GeneticTraits {
    return {
      aggressiveness: traits?.aggressiveness ?? this.randomTrait(),
      forageEfficiency: traits?.forageEfficiency ?? this.randomTrait(),
      thermalTolerance: traits?.thermalTolerance ?? this.randomTrait(),
      diseaseResistance: traits?.diseaseResistance ?? this.randomTrait(),
      lifespan: traits?.lifespan ?? this.randomRange(0.5, 1.5),
      size: traits?.size ?? this.randomRange(0.8, 1.2),
      speed: traits?.speed ?? this.randomRange(0.8, 1.2),
      carryingCapacity: traits?.carryingCapacity ?? this.randomRange(0.7, 1.3),
      spatialMemory: traits?.spatialMemory ?? this.randomTrait(),
      learningRate: traits?.learningRate ?? this.randomTrait(),
      communicationSkill: traits?.communicationSkill ?? this.randomTrait(),
      nurturingInstinct: traits?.nurturingInstinct ?? this.randomTrait(),
      constructionAbility: traits?.constructionAbility ?? this.randomTrait(),
      sensoryAcuity: traits?.sensoryAcuity ?? this.randomTrait(),
    };
  }

  private initializeMarkers(markers?: Partial<GeneticMarkers>): GeneticMarkers {
    return {
      dominantAlleles: markers?.dominantAlleles ?? this.generateAlleles(4),
      recessiveAlleles: markers?.recessiveAlleles ?? this.generateAlleles(2),
      mutations: markers?.mutations ?? [],
      chromosomeId: markers?.chromosomeId ?? this.generateChromosomeId(),
    };
  }

  private randomTrait(): number {
    // Use normal distribution centered around 0.5
    return Math.max(0, Math.min(1, this.gaussianRandom(0.5, 0.15)));
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private generateAlleles(count: number): string[] {
    const alleles = [];
    const bases = ['A', 'T', 'C', 'G'];
    
    for (let i = 0; i < count; i++) {
      let allele = '';
      for (let j = 0; j < 6; j++) {
        allele += bases[Math.floor(Math.random() * bases.length)];
      }
      alleles.push(allele);
    }
    return alleles;
  }

  private generateChromosomeId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Realistic genetic reproduction with Mendelian inheritance
   */
  public static reproduce(parent1: AntGenetics, parent2: AntGenetics): AntGenetics {
    const offspring = new AntGenetics();
    
    // Inherit traits through genetic combination
    offspring.traits = {
      aggressiveness: this.inheritTrait(parent1.traits.aggressiveness, parent2.traits.aggressiveness),
      forageEfficiency: this.inheritTrait(parent1.traits.forageEfficiency, parent2.traits.forageEfficiency),
      thermalTolerance: this.inheritTrait(parent1.traits.thermalTolerance, parent2.traits.thermalTolerance),
      diseaseResistance: this.inheritTrait(parent1.traits.diseaseResistance, parent2.traits.diseaseResistance),
      lifespan: this.inheritTrait(parent1.traits.lifespan, parent2.traits.lifespan),
      size: this.inheritTrait(parent1.traits.size, parent2.traits.size),
      speed: this.inheritTrait(parent1.traits.speed, parent2.traits.speed),
      carryingCapacity: this.inheritTrait(parent1.traits.carryingCapacity, parent2.traits.carryingCapacity),
      spatialMemory: this.inheritTrait(parent1.traits.spatialMemory, parent2.traits.spatialMemory),
      learningRate: this.inheritTrait(parent1.traits.learningRate, parent2.traits.learningRate),
      communicationSkill: this.inheritTrait(parent1.traits.communicationSkill, parent2.traits.communicationSkill),
      nurturingInstinct: this.inheritTrait(parent1.traits.nurturingInstinct, parent2.traits.nurturingInstinct),
      constructionAbility: this.inheritTrait(parent1.traits.constructionAbility, parent2.traits.constructionAbility),
      sensoryAcuity: this.inheritTrait(parent1.traits.sensoryAcuity, parent2.traits.sensoryAcuity),
    };

    // Combine genetic markers
    offspring.markers = {
      dominantAlleles: this.combineAlleles(parent1.markers.dominantAlleles, parent2.markers.dominantAlleles),
      recessiveAlleles: this.combineAlleles(parent1.markers.recessiveAlleles, parent2.markers.recessiveAlleles),
      mutations: this.generateMutations(parent1, parent2),
      chromosomeId: offspring.generateChromosomeId(),
    };

    offspring.generation = Math.max(parent1.generation, parent2.generation) + 1;
    offspring.parentage = [parent1.markers.chromosomeId, parent2.markers.chromosomeId];

    return offspring;
  }

  private static inheritTrait(trait1: number, trait2: number): number {
    // Mendelian inheritance with some randomness
    const inherited = (trait1 + trait2) / 2;
    const mutation = (Math.random() - 0.5) * 0.1; // Small random mutation
    return Math.max(0, Math.min(1, inherited + mutation));
  }

  private static combineAlleles(alleles1: string[], alleles2: string[]): string[] {
    const combined = [];
    const maxLength = Math.max(alleles1.length, alleles2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (Math.random() < 0.5 && alleles1[i]) {
        combined.push(alleles1[i]);
      } else if (alleles2[i]) {
        combined.push(alleles2[i]);
      }
    }
    
    return combined;
  }

  private static generateMutations(parent1: AntGenetics, parent2: AntGenetics): string[] {
    const mutations = [];
    const mutationRate = 0.05; // 5% chance of mutation
    
    // Inherit some parental mutations
    mutations.push(...parent1.markers.mutations);
    mutations.push(...parent2.markers.mutations);
    
    // Generate new mutations
    if (Math.random() < mutationRate) {
      const mutationTypes = [
        'enhanced_pheromone_production',
        'improved_disease_resistance',
        'increased_metabolism',
        'enhanced_vision',
        'stronger_mandibles',
        'improved_navigation',
        'cold_resistance',
        'heat_tolerance'
      ];
      
      const newMutation = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
      if (!mutations.includes(newMutation)) {
        mutations.push(newMutation);
      }
    }
    
    return mutations;
  }

  /**
   * Calculate fitness score based on environmental pressures
   */
  public calculateFitness(environment: any): number {
    let fitness = 0;
    
    // Base fitness from balanced traits
    fitness += this.traits.forageEfficiency * 0.2;
    fitness += this.traits.diseaseResistance * 0.15;
    fitness += this.traits.spatialMemory * 0.1;
    fitness += this.traits.communicationSkill * 0.1;
    
    // Environmental adaptations
    if (environment.temperature > 0.7) {
      fitness += this.traits.thermalTolerance * 0.2;
    }
    
    if (environment.predatorDensity > 0.5) {
      fitness += this.traits.aggressiveness * 0.15;
    }
    
    // Mutation benefits
    this.markers.mutations.forEach(mutation => {
      switch (mutation) {
        case 'enhanced_pheromone_production':
          fitness += 0.05;
          break;
        case 'improved_disease_resistance':
          fitness += 0.1;
          break;
        case 'increased_metabolism':
          fitness += 0.03;
          break;
      }
    });
    
    return Math.max(0, Math.min(1, fitness));
  }

  /**
   * Apply aging effects to genetic expression
   */
  public applyAging(age: number, maxAge: number): void {
    const ageRatio = age / maxAge;
    
    // Gradual decline in physical capabilities
    if (ageRatio > 0.6) {
      const decline = (ageRatio - 0.6) * 0.5;
      this.traits.speed *= (1 - decline);
      this.traits.carryingCapacity *= (1 - decline);
      this.traits.aggressiveness *= (1 - decline * 0.5);
    }
    
    // Potential wisdom gains
    if (ageRatio > 0.4) {
      const wisdom = (ageRatio - 0.4) * 0.2;
      this.traits.spatialMemory *= (1 + wisdom);
      this.traits.communicationSkill *= (1 + wisdom * 0.5);
    }
  }

  /**
   * Clone genetics for asexual reproduction (rare cases)
   */
  public clone(): AntGenetics {
    const clone = new AntGenetics(this.traits, this.markers, this.generation + 1);
    
    // Small mutations in cloning
    Object.keys(clone.traits).forEach(key => {
      const trait = key as keyof GeneticTraits;
      if (typeof clone.traits[trait] === 'number') {
        const mutation = (Math.random() - 0.5) * 0.02;
        (clone.traits[trait] as number) = Math.max(0, Math.min(1, 
          (clone.traits[trait] as number) + mutation));
      }
    });
    
    return clone;
  }
}