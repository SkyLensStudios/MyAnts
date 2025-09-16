/**
 * Spatial Gillespie Algorithm Implementation
 * Exact stochastic chemical kinetics for ant colony chemical systems
 * 
 * Features:
 * - Exact stochastic simulation algorithm (SSA)
 * - Spatial partitioning for large-scale efficiency
 * - Multi-species chemical reaction networks
 * - Integration with CNN-accelerated diffusion
 * - Real-time reaction event tracking
 */

import { CNNAcceleratedDiffusion, ChemicalReaction, ChemicalSpecies } from './CNNAcceleratedDiffusion';

// Reaction event for tracking
export interface ReactionEvent {
  reactionId: string;
  time: number;
  location: { x: number; y: number };
  reactants: { species: string; amount: number }[];
  products: { species: string; amount: number }[];
  propensity: number;
}

// Spatial cell for Gillespie partitioning
export interface SpatialCell {
  index: number;
  position: { x: number; y: number };
  concentrations: Map<string, number>;
  propensities: Map<string, number>;
  lastUpdateTime: number;
  active: boolean;
}

// Gillespie algorithm configuration
export interface GillespieConfig {
  timeStep: number;
  maxEvents: number;
  spatialPartitions: { x: number; y: number };
  enableAdaptiveTimeStep: boolean;
  convergenceThreshold: number;
  stochasticSeed: number;
}

/**
 * Spatial Gillespie Algorithm Engine
 * Provides exact stochastic chemical kinetics simulation
 */
export class SpatialGillespieAlgorithm {
  private cells: SpatialCell[] = [];
  private reactionNetwork: Map<string, ChemicalReaction> = new Map();
  private species: Map<string, ChemicalSpecies> = new Map();
  private eventQueue: ReactionEvent[] = [];
  
  // Algorithm state
  private currentTime: number = 0;
  private totalEvents: number = 0;
  private config: GillespieConfig;
  
  // Spatial partitioning
  private partitionSize: { x: number; y: number };
  private cellGrid: SpatialCell[][] = [];
  
  // Performance tracking
  private algorithmMetrics = {
    eventsPerSecond: 0,
    averagePropensity: 0,
    spatialCorrelation: 0,
    convergenceRate: 0,
    memoryUsage: 0,
    computeTime: 0
  };

  // Random number generator (for reproducibility)
  private rng: () => number;

  constructor(
    gridWidth: number,
    gridHeight: number,
    config: GillespieConfig
  ) {
    this.config = config;
    this.partitionSize = {
      x: Math.ceil(gridWidth / config.spatialPartitions.x),
      y: Math.ceil(gridHeight / config.spatialPartitions.y)
    };

    // Initialize random number generator with seed
    this.rng = this.createSeededRNG(config.stochasticSeed);

    // Initialize spatial grid
    this.initializeSpatialGrid(gridWidth, gridHeight);

    // Initialize default chemical reactions
    this.initializeDefaultReactions();

    console.log(`🧮 Spatial Gillespie Algorithm initialized: ${gridWidth}×${gridHeight} grid`);
  }

  /**
   * Initialize spatial grid for Gillespie algorithm
   */
  private initializeSpatialGrid(width: number, height: number): void {
    this.cellGrid = [];
    this.cells = [];

    for (let y = 0; y < height; y++) {
      this.cellGrid[y] = [];
      for (let x = 0; x < width; x++) {
        const cell: SpatialCell = {
          index: y * width + x,
          position: { x, y },
          concentrations: new Map(),
          propensities: new Map(),
          lastUpdateTime: 0,
          active: false
        };

        this.cellGrid[y][x] = cell;
        this.cells.push(cell);
      }
    }

    console.log(`✅ Spatial grid initialized: ${this.cells.length} cells`);
  }

  /**
   * Initialize default chemical reactions for ant pheromone systems
   */
  private initializeDefaultReactions(): void {
    // Pheromone decay reactions
    const trailDecay: ChemicalReaction = {
      id: 'trail_decay',
      reactants: [{ species: 'trail', stoichiometry: 1 }],
      products: [],
      rateConstant: 0.002,
      activationEnergy: 25000, // J/mol
      temperature: 298 // 25°C in Kelvin
    };

    const alarmDecay: ChemicalReaction = {
      id: 'alarm_decay',
      reactants: [{ species: 'alarm', stoichiometry: 1 }],
      products: [],
      rateConstant: 0.005,
      activationEnergy: 20000,
      temperature: 298
    };

    // Cross-reaction: alarm inhibits trail following
    const alarmTrailInhibition: ChemicalReaction = {
      id: 'alarm_trail_inhibition',
      reactants: [
        { species: 'alarm', stoichiometry: 1 },
        { species: 'trail', stoichiometry: 1 }
      ],
      products: [{ species: 'alarm', stoichiometry: 1 }], // Alarm is preserved
      rateConstant: 0.1,
      activationEnergy: 15000,
      temperature: 298
    };

    // Recruitment amplification
    const recruitmentAmplification: ChemicalReaction = {
      id: 'recruitment_amplification',
      reactants: [
        { species: 'trail', stoichiometry: 2 },
        { species: 'food', stoichiometry: 1 }
      ],
      products: [
        { species: 'trail', stoichiometry: 2 },
        { species: 'recruitment', stoichiometry: 1 },
        { species: 'food', stoichiometry: 1 }
      ],
      rateConstant: 0.05,
      activationEnergy: 30000,
      temperature: 298
    };

    // Add reactions to network
    this.addReaction(trailDecay);
    this.addReaction(alarmDecay);
    this.addReaction(alarmTrailInhibition);
    this.addReaction(recruitmentAmplification);
  }

  /**
   * Create seeded random number generator for reproducibility
   */
  private createSeededRNG(seed: number): () => number {
    let state = seed;
    return () => {
      // Linear congruential generator
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Add chemical species to the system
   */
  addSpecies(species: ChemicalSpecies): void {
    this.species.set(species.id, species);
    
    // Initialize concentrations in all cells
    this.cells.forEach(cell => {
      cell.concentrations.set(species.id, 0);
    });

    console.log(`✅ Added chemical species: ${species.name}`);
  }

  /**
   * Add chemical reaction to the network
   */
  addReaction(reaction: ChemicalReaction): void {
    this.reactionNetwork.set(reaction.id, reaction);
    
    // Initialize propensities in all cells
    this.cells.forEach(cell => {
      cell.propensities.set(reaction.id, 0);
    });

    console.log(`✅ Added chemical reaction: ${reaction.id}`);
  }

  /**
   * Set initial concentration at specific location
   */
  setConcentration(speciesId: string, x: number, y: number, concentration: number): void {
    if (x >= 0 && x < this.cellGrid[0].length && y >= 0 && y < this.cellGrid.length) {
      const cell = this.cellGrid[y][x];
      cell.concentrations.set(speciesId, concentration);
      cell.active = concentration > 0;
    }
  }

  /**
   * Get concentration at specific location
   */
  getConcentration(speciesId: string, x: number, y: number): number {
    if (x >= 0 && x < this.cellGrid[0].length && y >= 0 && y < this.cellGrid.length) {
      return this.cellGrid[y][x].concentrations.get(speciesId) || 0;
    }
    return 0;
  }

  /**
   * Main Gillespie algorithm simulation step
   */
  async simulateStep(deltaTime: number): Promise<ReactionEvent[]> {
    const startTime = performance.now();
    const events: ReactionEvent[] = [];
    const endTime = this.currentTime + deltaTime;

    while (this.currentTime < endTime && events.length < this.config.maxEvents) {
      // Update propensities for all active cells
      this.updatePropensities();

      // Calculate total propensity across all cells
      const totalPropensity = this.calculateTotalPropensity();

      if (totalPropensity === 0) {
        // No reactions possible, advance time to end
        this.currentTime = endTime;
        break;
      }

      // Generate next reaction time (exponential distribution)
      const tau = -Math.log(this.rng()) / totalPropensity;
      const nextReactionTime = this.currentTime + tau;

      if (nextReactionTime > endTime) {
        // No reaction occurs in this time step
        this.currentTime = endTime;
        break;
      }

      // Select which reaction and where it occurs
      const selectedEvent = this.selectReaction(totalPropensity);
      
      if (selectedEvent) {
        selectedEvent.time = nextReactionTime;
        
        // Execute the reaction
        this.executeReaction(selectedEvent);
        
        events.push(selectedEvent);
        this.totalEvents++;
      }

      this.currentTime = nextReactionTime;
    }

    // Update performance metrics
    this.algorithmMetrics.computeTime = performance.now() - startTime;
    this.updateMetrics(events.length, deltaTime);

    return events;
  }

  /**
   * Update reaction propensities for all cells
   */
  private updatePropensities(): void {
    for (const cell of this.cells) {
      if (!cell.active) continue;

      for (const [reactionId, reaction] of this.reactionNetwork) {
        const propensity = this.calculatePropensity(reaction, cell);
        cell.propensities.set(reactionId, propensity);
      }

      cell.lastUpdateTime = this.currentTime;
    }
  }

  /**
   * Calculate reaction propensity for a specific cell
   */
  private calculatePropensity(reaction: ChemicalReaction, cell: SpatialCell): number {
    let propensity = reaction.rateConstant;

    // Apply mass action kinetics
    for (const reactant of reaction.reactants) {
      const concentration = cell.concentrations.get(reactant.species) || 0;
      
      if (concentration === 0) {
        return 0; // Can't react without reactants
      }

      // For stochastic kinetics, use molecular counts
      const molecularCount = Math.floor(concentration * 1000); // Scale factor
      
      for (let i = 0; i < reactant.stoichiometry; i++) {
        propensity *= Math.max(0, molecularCount - i);
      }
    }

    // Apply Arrhenius equation for temperature dependence
    const gasConstant = 8.314; // J/(mol·K)
    const activationFactor = Math.exp(-reaction.activationEnergy / (gasConstant * reaction.temperature));
    propensity *= activationFactor;

    // Spatial effects: neighbor influence
    const neighborEffect = this.calculateNeighborEffect(cell);
    propensity *= neighborEffect;

    return Math.max(0, propensity);
  }

  /**
   * Calculate neighbor effect on reaction propensity
   */
  private calculateNeighborEffect(cell: SpatialCell): number {
    const x = cell.position.x;
    const y = cell.position.y;
    let totalNeighborActivity = 0;
    let neighborCount = 0;

    // Check 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < this.cellGrid[0].length && 
            ny >= 0 && ny < this.cellGrid.length) {
          
          const neighbor = this.cellGrid[ny][nx];
          
          // Calculate activity as sum of all concentrations
          let activity = 0;
          for (const concentration of neighbor.concentrations.values()) {
            activity += concentration;
          }
          
          totalNeighborActivity += activity;
          neighborCount++;
        }
      }
    }

    if (neighborCount === 0) return 1.0;

    // Normalize and apply sigmoid function for smooth spatial coupling
    const averageNeighborActivity = totalNeighborActivity / neighborCount;
    return 1.0 + 0.1 * Math.tanh(averageNeighborActivity - 0.5);
  }

  /**
   * Calculate total propensity across all cells
   */
  private calculateTotalPropensity(): number {
    let total = 0;

    for (const cell of this.cells) {
      if (!cell.active) continue;

      for (const propensity of cell.propensities.values()) {
        total += propensity;
      }
    }

    return total;
  }

  /**
   * Select which reaction occurs using the direct method
   */
  private selectReaction(totalPropensity: number): ReactionEvent | null {
    const r = this.rng() * totalPropensity;
    let cumulativePropensity = 0;

    for (const cell of this.cells) {
      if (!cell.active) continue;

      for (const [reactionId, propensity] of cell.propensities) {
        cumulativePropensity += propensity;

        if (r <= cumulativePropensity) {
          const reaction = this.reactionNetwork.get(reactionId)!;
          
          return {
            reactionId,
            time: this.currentTime,
            location: { x: cell.position.x, y: cell.position.y },
            reactants: reaction.reactants.map(r => ({ 
              species: r.species, 
              amount: r.stoichiometry 
            })),
            products: reaction.products.map(p => ({ 
              species: p.species, 
              amount: p.stoichiometry 
            })),
            propensity
          };
        }
      }
    }

    return null;
  }

  /**
   * Execute a selected reaction
   */
  private executeReaction(event: ReactionEvent): void {
    const cell = this.cellGrid[event.location.y][event.location.x];

    // Consume reactants
    for (const reactant of event.reactants) {
      const currentConc = cell.concentrations.get(reactant.species) || 0;
      const newConc = Math.max(0, currentConc - reactant.amount);
      cell.concentrations.set(reactant.species, newConc);
    }

    // Produce products
    for (const product of event.products) {
      const currentConc = cell.concentrations.get(product.species) || 0;
      const newConc = currentConc + product.amount;
      cell.concentrations.set(product.species, newConc);
    }

    // Update cell activity status
    let totalActivity = 0;
    for (const concentration of cell.concentrations.values()) {
      totalActivity += concentration;
    }
    cell.active = totalActivity > this.config.convergenceThreshold;

    // Add to event queue for analysis
    this.eventQueue.push(event);
    
    // Limit event queue size
    if (this.eventQueue.length > 10000) {
      this.eventQueue = this.eventQueue.slice(-5000);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(eventsInStep: number, deltaTime: number): void {
    this.algorithmMetrics.eventsPerSecond = eventsInStep / deltaTime;
    
    // Calculate average propensity
    let totalPropensity = 0;
    let activeReactions = 0;
    
    for (const cell of this.cells) {
      for (const propensity of cell.propensities.values()) {
        if (propensity > 0) {
          totalPropensity += propensity;
          activeReactions++;
        }
      }
    }
    
    this.algorithmMetrics.averagePropensity = activeReactions > 0 ? 
      totalPropensity / activeReactions : 0;

    // Calculate spatial correlation
    this.algorithmMetrics.spatialCorrelation = this.calculateSpatialCorrelation();

    // Estimate memory usage
    const cellMemory = this.cells.length * (
      this.species.size * 8 + // concentrations
      this.reactionNetwork.size * 8 + // propensities
      64 // other cell data
    );
    this.algorithmMetrics.memoryUsage = cellMemory / (1024 * 1024); // MB
  }

  /**
   * Calculate spatial correlation metric
   */
  private calculateSpatialCorrelation(): number {
    if (this.cells.length < 2) return 0;

    let correlation = 0;
    let pairs = 0;

    // Sample correlation between neighboring cells
    for (let i = 0; i < Math.min(1000, this.cells.length); i++) {
      const cell = this.cells[i];
      const x = cell.position.x;
      const y = cell.position.y;

      // Check right neighbor
      if (x < this.cellGrid[0].length - 1) {
        const neighbor = this.cellGrid[y][x + 1];
        correlation += this.calculateCellCorrelation(cell, neighbor);
        pairs++;
      }

      // Check bottom neighbor
      if (y < this.cellGrid.length - 1) {
        const neighbor = this.cellGrid[y + 1][x];
        correlation += this.calculateCellCorrelation(cell, neighbor);
        pairs++;
      }
    }

    return pairs > 0 ? correlation / pairs : 0;
  }

  /**
   * Calculate correlation between two cells
   */
  private calculateCellCorrelation(cell1: SpatialCell, cell2: SpatialCell): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const speciesId of this.species.keys()) {
      const conc1 = cell1.concentrations.get(speciesId) || 0;
      const conc2 = cell2.concentrations.get(speciesId) || 0;

      dotProduct += conc1 * conc2;
      norm1 += conc1 * conc1;
      norm2 += conc2 * conc2;
    }

    const magnitude = Math.sqrt(norm1 * norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Integrate with CNN-accelerated diffusion system
   */
  integrateWithDiffusion(diffusionSystem: CNNAcceleratedDiffusion): void {
    // Synchronize species
    const diffusionSpecies = diffusionSystem.getChemicalSpecies();
    for (const [speciesId, species] of diffusionSpecies) {
      this.addSpecies(species);
    }

    // Update concentrations from diffusion system
    const concentrationGrids = diffusionSystem.getConcentrationGrids();
    
    for (const [speciesId, grid] of concentrationGrids) {
      for (let y = 0; y < this.cellGrid.length; y++) {
        for (let x = 0; x < this.cellGrid[0].length; x++) {
          const gridIdx = y * this.cellGrid[0].length + x;
          const concentration = grid[gridIdx];
          this.setConcentration(speciesId, x, y, concentration);
        }
      }
    }

    console.log('✅ Gillespie algorithm integrated with CNN diffusion system');
  }

  /**
   * Get current algorithm state
   */
  getAlgorithmState(): {
    currentTime: number;
    totalEvents: number;
    activeCells: number;
    metrics: {
      eventsPerSecond: number;
      averagePropensity: number;
      spatialCorrelation: number;
      convergenceRate: number;
      memoryUsage: number;
      computeTime: number;
    };
  } {
    const activeCells = this.cells.filter(cell => cell.active).length;

    return {
      currentTime: this.currentTime,
      totalEvents: this.totalEvents,
      activeCells,
      metrics: { ...this.algorithmMetrics }
    };
  }

  /**
   * Get recent reaction events
   */
  getRecentEvents(count: number = 100): ReactionEvent[] {
    return this.eventQueue.slice(-count);
  }

  /**
   * Get concentration distribution for visualization
   */
  getConcentrationGrid(speciesId: string): number[][] {
    const grid: number[][] = [];
    
    for (let y = 0; y < this.cellGrid.length; y++) {
      grid[y] = [];
      for (let x = 0; x < this.cellGrid[0].length; x++) {
        grid[y][x] = this.cellGrid[y][x].concentrations.get(speciesId) || 0;
      }
    }

    return grid;
  }

  /**
   * Reset algorithm state
   */
  reset(): void {
    this.currentTime = 0;
    this.totalEvents = 0;
    this.eventQueue = [];

    // Reset all cells
    for (const cell of this.cells) {
      cell.concentrations.clear();
      cell.propensities.clear();
      cell.lastUpdateTime = 0;
      cell.active = false;

      // Re-initialize with species
      for (const speciesId of this.species.keys()) {
        cell.concentrations.set(speciesId, 0);
      }
      
      for (const reactionId of this.reactionNetwork.keys()) {
        cell.propensities.set(reactionId, 0);
      }
    }

    console.log('🔄 Spatial Gillespie Algorithm reset');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cells = [];
    this.cellGrid = [];
    this.eventQueue = [];
    this.reactionNetwork.clear();
    this.species.clear();

    console.log('🧮 Spatial Gillespie Algorithm disposed');
  }
}

export default SpatialGillespieAlgorithm;