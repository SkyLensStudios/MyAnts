/**
 * Colony Management System
 * Integrates all colony-related subsystems for comprehensive colony simulation
 */

import { CasteSystem, AntCaste, TaskType } from './casteSystem';
import { TaskAssignmentSystem } from './taskAssignment';
import { ResourceAllocationSystem, ResourceType } from './resourceAllocation';
import { PopulationDynamicsSystem } from './populationDynamics';

export interface ColonyState {
  id: string;
  name: string;
  founded: Date;
  location: { x: number; y: number; z: number };
  size: number;
  health: number;         // Overall colony health (0-1)
  morale: number;         // Colony morale (0-1)
  efficiency: number;     // Operational efficiency (0-1)
  threat_level: number;   // Current threat assessment (0-1)
}

export interface ColonyMetrics {
  productivity: number;       // Tasks completed per day
  resource_efficiency: number; // Resource utilization efficiency
  population_growth: number;  // Daily population change rate
  territory_control: number; // Territorial coverage (0-1)
  genetic_diversity: number; // Population genetic health
  adaptation_rate: number;   // Speed of adaptation to changes
}

export interface ColonyEvent {
  timestamp: Date;
  type: string;
  severity: number;    // 0-1, importance/impact of event
  description: string;
  effects: Map<string, number>; // System effects
  resolved: boolean;
}

/**
 * Main colony management system that coordinates all subsystems
 */
export class ColonyManagementSystem {
  private casteSystem: CasteSystem;
  private taskSystem: TaskAssignmentSystem;
  private resourceSystem: ResourceAllocationSystem;
  private populationSystem: PopulationDynamicsSystem;
  
  private colonyState: ColonyState;
  private colonyMetrics: ColonyMetrics;
  private eventHistory: ColonyEvent[];
  private dailyUpdateCallbacks: Array<() => void>;

  constructor(
    colonyId: string,
    initialPopulation: number = 100,
    location: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ) {
    // Initialize subsystems
    this.casteSystem = new CasteSystem();
    this.taskSystem = new TaskAssignmentSystem(this.casteSystem);
    this.resourceSystem = new ResourceAllocationSystem();
    this.populationSystem = new PopulationDynamicsSystem(initialPopulation);

    // Initialize colony state
    this.colonyState = {
      id: colonyId,
      name: `Colony ${colonyId}`,
      founded: new Date(),
      location,
      size: initialPopulation,
      health: 1.0,
      morale: 0.8,
      efficiency: 0.7,
      threat_level: 0.1
    };

    // Initialize metrics
    this.colonyMetrics = {
      productivity: 0,
      resource_efficiency: 0,
      population_growth: 0,
      territory_control: 0.1,
      genetic_diversity: 0.85,
      adaptation_rate: 0.1
    };

    this.eventHistory = [];
    this.dailyUpdateCallbacks = [];
  }

  /**
   * Main simulation update - should be called once per game day
   */
  public simulateDay(
    environmentalFactors: Map<string, number>,
    seasonalFactor: number = 1.0
  ): void {
    // Get current resource availability
    const resourceAvailability = this.calculateResourceAvailability();

    // Update population dynamics
    this.populationSystem.simulateDay(
      environmentalFactors,
      resourceAvailability,
      seasonalFactor
    );

    // Update colony size
    this.colonyState.size = this.populationSystem.getPopulationData().totalPopulation;

    // Update task assignments based on new population
    this.updateTaskAssignments();

    // Process resource updates (decay, spoilage, flows)
    this.updateResourceSystem();

    // Update colony metrics
    this.updateColonyMetrics();

    // Update colony health and morale
    this.updateColonyCondition();

    // Check for special events
    this.checkForEvents();

    // Execute registered callbacks
    this.dailyUpdateCallbacks.forEach(callback => callback());

    // Record daily event
    this.recordEvent('daily_update', 0.1, 'Daily colony simulation update', new Map());
  }

  private updateResourceSystem(): void {
    // Process resource decay and spoilage
    this.resourceSystem.processResourceDecay(24); // 24 hours

    // Update resource demands based on population
    this.updateResourceDemands();
  }

  private updateResourceDemands(): void {
    const populationData = this.populationSystem.getPopulationData();
    
    // Calculate food demand
    const foodDemand = this.estimateDailyConsumption();
    
    // Create demand if we have the method
    if ('createResourceDemand' in this.resourceSystem) {
      (this.resourceSystem as any).createResourceDemand(ResourceType.FOOD, foodDemand, 'daily_consumption', 0.8);
    }

    // Additional demands for larvae
    const larvae = populationData.ageDistribution.get('larvae') || 0;
    if (larvae > 0 && 'createResourceDemand' in this.resourceSystem) {
      (this.resourceSystem as any).createResourceDemand(ResourceType.LARVAE_FOOD, larvae * 2, 'larvae_feeding', 0.9);
    }
  }

  private calculateResourceAvailability(): number {
    const totalFood = this.resourceSystem.getTotalResourceAmount(ResourceType.FOOD);
    const dailyConsumption = this.estimateDailyConsumption();
    
    if (dailyConsumption === 0) return 1.0;
    
    return Math.min(1.0, totalFood / (dailyConsumption * 7)); // 7 days worth
  }

  private estimateDailyConsumption(): number {
    const population = this.populationSystem.getPopulationData();
    let consumption = 0;

    // Basic consumption per ant
    consumption += population.totalPopulation * 1.0;

    // Additional consumption for growing population
    const larvae = population.ageDistribution.get('larvae') || 0;
    consumption += larvae * 2.0; // Growing ants need more food

    return consumption;
  }

  private updateTaskAssignments(): void {
    const populationData = this.populationSystem.getPopulationData();
    
    // Create essential tasks
    this.createEssentialTasks();

    // Assign ants to tasks based on caste and availability
    for (const [caste, count] of populationData.casteDistribution) {
      if (count > 0) {
        this.assignCasteToTasks(caste, count);
      }
    }
  }

  private createEssentialTasks(): void {
    const populationData = this.populationSystem.getPopulationData();

    // Food gathering tasks
    const foodNeed = this.estimateDailyConsumption();
    const currentFood = this.resourceSystem.getTotalResourceAmount(ResourceType.FOOD);
    
    if (currentFood < foodNeed * 3) { // Less than 3 days food
      this.taskSystem.createTask(
        TaskType.FORAGE,
        { x: 0, y: 0, z: 0 },
        0.9, // High priority
        { teamSize: 5 }
      );
    }

    // Nest maintenance tasks
    const populationPressure = this.populationSystem.calculatePopulationPressure();
    if (populationPressure.housingPressure > 0.7) {
      this.taskSystem.createTask(
        TaskType.BUILD_CHAMBERS,
        { x: 0, y: 0, z: 0 },
        0.8,
        { teamSize: 10 }
      );
    }

    // Defense tasks based on threat level
    if (this.colonyState.threat_level > 0.3) {
      this.taskSystem.createTask(
        TaskType.GUARD_ENTRANCE,
        { x: 0, y: 0, z: 0 },
        0.7,
        { teamSize: 3 }
      );
    }

    // Brood care tasks
    const larvae = populationData.ageDistribution.get('larvae') || 0;
    const pupae = populationData.ageDistribution.get('pupae') || 0;
    const nursesNeeded = Math.ceil((larvae + pupae) / 10); // 1 nurse per 10 brood

    if (nursesNeeded > 0) {
      this.taskSystem.createTask(
        TaskType.NURSE_LARVAE,
        { x: 0, y: 0, z: 0 },
        0.8,
        { teamSize: nursesNeeded }
      );
    }
  }

  private assignCasteToTasks(caste: AntCaste, availableCount: number): void {
    // Get all available tasks
    const allTasks = this.taskSystem.getAllTasks();
    const suitableTasks = allTasks
      .filter(task => this.isTaskSuitableForCaste(task, caste))
      .sort((a, b) => b.priority - a.priority); // Sort by priority

    // Assign ants to tasks
    let assignedCount = 0;
    for (const task of suitableTasks) {
      if (assignedCount >= availableCount) break;

      const antsToAssign = Math.min(
        availableCount - assignedCount,
        Math.max(0, task.requirements.teamSize - (task.assignedAntId ? 1 : 0))
      );

      if (antsToAssign > 0) {
        // Simple assignment - in a full implementation this would assign actual ant IDs
        const success = this.taskSystem.assignTask(`${caste}_ant_${assignedCount}`, caste);
        if (success) {
          assignedCount += antsToAssign;
        }
      }
    }
  }

  private isTaskSuitableForCaste(task: any, caste: AntCaste): boolean {
    // Check caste-specific task preferences
    const casteTaskPreferences = new Map([
      [AntCaste.WORKER, [TaskType.BUILD_CHAMBERS, TaskType.CLEAN_NEST, TaskType.REPAIR_TUNNELS]],
      [AntCaste.SOLDIER, [TaskType.FIGHT_INTRUDERS, TaskType.GUARD_ENTRANCE]],
      [AntCaste.FORAGER, [TaskType.FORAGE, TaskType.HUNT, TaskType.SCOUT]],
      [AntCaste.NURSE, [TaskType.NURSE_LARVAE, TaskType.TEND_EGGS, TaskType.FEED_LARVAE]],
      [AntCaste.ARCHITECT, [TaskType.BUILD_CHAMBERS, TaskType.DIG_TUNNELS]],
      [AntCaste.GUARD, [TaskType.GUARD_ENTRANCE, TaskType.FIGHT_INTRUDERS]]
    ]);

    const preferredTasks = casteTaskPreferences.get(caste) || [];
    return preferredTasks.includes(task.type);
  }

  private updateColonyMetrics(): void {
    const populationData = this.populationSystem.getPopulationData();
    const taskMetrics = this.taskSystem.getTaskMetrics();
    const resourceMetrics = this.resourceSystem.getResourceMetrics();

    // Calculate productivity based on completed tasks
    this.colonyMetrics.productivity = taskMetrics.taskEfficiency;

    // Calculate resource efficiency
    this.colonyMetrics.resource_efficiency = resourceMetrics.distributionEfficiency;

    // Population growth rate
    this.colonyMetrics.population_growth = populationData.growthRate;

    // Territory control (simplified)
    this.colonyMetrics.territory_control = Math.min(1.0, 
      this.colonyState.size / 1000 * 0.5 + this.colonyMetrics.productivity * 0.3
    );

    // Genetic diversity from population system
    this.colonyMetrics.genetic_diversity = 
      this.populationSystem.getPopulationModel().geneticDiversity;

    // Adaptation rate based on caste diversity
    const casteCount = Array.from(populationData.casteDistribution.values())
      .filter(count => count > 0).length;
    this.colonyMetrics.adaptation_rate = casteCount / 8.0; // 8 total castes
  }

  private updateColonyCondition(): void {
    const populationPressure = this.populationSystem.calculatePopulationPressure();
    const resourceMetrics = this.resourceSystem.getResourceMetrics();

    // Calculate health based on various factors
    const foodAvailability = Math.min(1.0, this.calculateResourceAvailability());
    const housingQuality = 1 - populationPressure.housingPressure * 0.5;
    const taskEfficiency = this.colonyMetrics.productivity;

    this.colonyState.health = (foodAvailability + housingQuality + taskEfficiency) / 3;

    // Calculate morale based on different factors
    const growthPositive = Math.max(0, Math.min(1, 0.5 + this.colonyMetrics.population_growth));
    const threatNegative = 1 - this.colonyState.threat_level;
    const resourceSecurity = resourceMetrics.resourceSecurity;

    this.colonyState.morale = (foodAvailability + growthPositive + threatNegative + resourceSecurity) / 4;

    // Calculate efficiency based on coordination between systems
    const populationEfficiency = Math.min(1, this.colonyState.size / 500); // Optimal around 500 ants
    const overallTaskEfficiency = this.colonyMetrics.productivity;

    this.colonyState.efficiency = (populationEfficiency + this.colonyMetrics.resource_efficiency + overallTaskEfficiency) / 3;
  }

  private checkForEvents(): void {
    const populationData = this.populationSystem.getPopulationData();
    const populationPressure = this.populationSystem.calculatePopulationPressure();

    // Check for swarming event
    if (this.populationSystem.simulateSwarmingEvent()) {
      this.recordEvent(
        'swarming',
        0.8,
        'Colony has swarmed, creating a new colony',
        new Map([
          ['population', -0.3],
          ['territory_pressure', -0.5],
          ['genetic_diversity', 0.1]
        ])
      );
    }

    // Check for resource crisis
    const foodAvailability = this.calculateResourceAvailability();
    
    if (foodAvailability < 0.2) {
      this.recordEvent(
        'food_crisis',
        0.9,
        'Severe food shortage threatens colony survival',
        new Map([
          ['health', -0.3],
          ['morale', -0.4],
          ['mortality_rate', 0.2]
        ])
      );
    }

    // Check for population boom
    if (populationData.growthRate > 0.1) { // 10% daily growth
      this.recordEvent(
        'population_boom',
        0.6,
        'Rapid population growth',
        new Map([
          ['housing_pressure', 0.3],
          ['food_demand', 0.4]
        ])
      );
    }

    // Check for overcrowding
    if (populationPressure.housingPressure > 0.9) {
      this.recordEvent(
        'overcrowding',
        0.7,
        'Colony is severely overcrowded',
        new Map([
          ['health', -0.2],
          ['efficiency', -0.3],
          ['disease_risk', 0.4]
        ])
      );
    }
  }

  private recordEvent(
    type: string,
    severity: number,
    description: string,
    effects: Map<string, number>
  ): void {
    const event: ColonyEvent = {
      timestamp: new Date(),
      type,
      severity,
      description,
      effects,
      resolved: false
    };

    this.eventHistory.push(event);

    // Apply immediate effects
    for (const [effect, value] of effects) {
      this.applyEventEffect(effect, value);
    }

    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }
  }

  private applyEventEffect(effect: string, value: number): void {
    switch (effect) {
      case 'health':
        this.colonyState.health = Math.max(0, Math.min(1, this.colonyState.health + value));
        break;
      case 'morale':
        this.colonyState.morale = Math.max(0, Math.min(1, this.colonyState.morale + value));
        break;
      case 'efficiency':
        this.colonyState.efficiency = Math.max(0, Math.min(1, this.colonyState.efficiency + value));
        break;
      case 'threat_level':
        this.colonyState.threat_level = Math.max(0, Math.min(1, this.colonyState.threat_level + value));
        break;
      // Add more effect handlers as needed
    }
  }

  // Public interface methods

  public getColonyState(): ColonyState {
    return { ...this.colonyState };
  }

  public getColonyMetrics(): ColonyMetrics {
    return { ...this.colonyMetrics };
  }

  public getPopulationSystem(): PopulationDynamicsSystem {
    return this.populationSystem;
  }

  public getCasteSystem(): CasteSystem {
    return this.casteSystem;
  }

  public getTaskSystem(): TaskAssignmentSystem {
    return this.taskSystem;
  }

  public getResourceSystem(): ResourceAllocationSystem {
    return this.resourceSystem;
  }

  public getRecentEvents(hours: number = 24): ColonyEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.eventHistory.filter(event => event.timestamp >= cutoff);
  }

  public registerDailyUpdateCallback(callback: () => void): void {
    this.dailyUpdateCallbacks.push(callback);
  }

  public setThreatLevel(level: number): void {
    this.colonyState.threat_level = Math.max(0, Math.min(1, level));
  }

  public getColonySummary(): string {
    const state = this.colonyState;
    const metrics = this.colonyMetrics;
    const population = this.populationSystem.getPopulationData();

    return `Colony ${state.name}:
Population: ${population.totalPopulation} ants
Health: ${(state.health * 100).toFixed(1)}%
Morale: ${(state.morale * 100).toFixed(1)}%
Efficiency: ${(state.efficiency * 100).toFixed(1)}%
Growth Rate: ${(metrics.population_growth * 100).toFixed(1)}% per day
Productivity: ${(metrics.productivity * 100).toFixed(1)}%
Territory Control: ${(metrics.territory_control * 100).toFixed(1)}%
Threat Level: ${(state.threat_level * 100).toFixed(1)}%`;
  }

  // Crisis management methods

  public handleFoodCrisis(): void {
    // Emergency food gathering
    this.taskSystem.createTask(
      TaskType.FORAGE,
      { x: 0, y: 0, z: 0 },
      1.0, // Maximum priority
      { teamSize: 20 }
    );
  }

  public handleOvercrowding(): void {
    // Emergency nest expansion
    this.taskSystem.createTask(
      TaskType.BUILD_CHAMBERS,
      { x: 0, y: 0, z: 0 },
      0.9,
      { teamSize: 30 }
    );

    // Consider swarming if conditions are met
    this.populationSystem.simulateSwarmingEvent();
  }

  public handleThreatResponse(threatLevel: number): void {
    this.setThreatLevel(threatLevel);

    if (threatLevel > 0.7) {
      // High threat - all hands on defense
      this.taskSystem.createTask(
        TaskType.FIGHT_INTRUDERS,
        { x: 0, y: 0, z: 0 },
        1.0,
        { teamSize: 50 }
      );
    }
  }

  public simulateDisease(severity: number, duration: number): void {
    this.populationSystem.simulateDisease(severity, duration);
    
    this.recordEvent(
      'disease_outbreak',
      severity,
      `Disease outbreak affecting the colony for ${duration} days`,
      new Map([
        ['health', -severity * 0.5],
        ['mortality_rate', severity * 0.3],
        ['productivity', -severity * 0.2]
      ])
    );
  }
}

// Export all subsystem types for external use
export { CasteSystem, AntCaste, TaskType } from './casteSystem';
export { TaskAssignmentSystem } from './taskAssignment';
export { ResourceAllocationSystem, ResourceType } from './resourceAllocation';
export { PopulationDynamicsSystem } from './populationDynamics';