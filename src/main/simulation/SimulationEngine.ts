/**
 * Core Simulation Engine
 * Orchestrates all simulation systems and manages the main simulation loop
 */

import { SimulationConfig, SimulationState, AntRenderData, PheromoneRenderData, 
         EnvironmentRenderData, SimulationUpdate, PerformanceStats } from '../../shared/types';
import { SharedBufferManager } from './SharedBufferManager';
import { AntEntity } from './AntEntity';

// Import engine systems - fix paths to match actual structure
import { AntGenetics } from '../../../engine/biological/genetics';
import { PhysiologicalSystem } from '../../../engine/biological/physiology';
import { PheromoneSystem } from '../../../engine/chemical/pheromones';
import { WeatherSystem } from '../../../engine/environmental/weather';
import { SoilSystem } from '../../../engine/environmental/soil';
import { BehaviorDecisionTree } from '../../../engine/ai/decisionTree';
import { SpatialMemory } from '../../../engine/ai/spatialMemory';
import { AntCaste } from '../../../engine/colony/casteSystem';

export class SimulationEngine {
  private config: SimulationConfig;
  private state: SimulationState;
  private isRunning = false;
  private isPaused = false;
  private lastUpdateTime = 0;
  private targetFPS = 60;
  private actualFPS = 0;

  // Engine systems
  private pheromoneSystem: PheromoneSystem | null = null;
  private weatherSystem: WeatherSystem | null = null;
  private soilSystem: SoilSystem | null = null;
  
  // Data management
  private sharedBufferManager: SharedBufferManager;
  private ants: Map<string, AntEntity> = new Map();
  private updates: SimulationUpdate[] = [];
  
  // Performance tracking
  private performanceStats: PerformanceStats;
  private frameStartTime = 0;
  private frameCount = 0;
  private lastFPSUpdate = 0;

  constructor() {
    this.config = this.getDefaultConfig();
    this.state = this.getInitialState();
    this.sharedBufferManager = new SharedBufferManager();
    this.performanceStats = this.getInitialPerformanceStats();
    
    console.log('SimulationEngine initialized');
  }

  private getDefaultConfig(): SimulationConfig {
    return {
      timeScale: 1,
      colonySize: 1000,
      environmentSize: 100, // 100m²
      seasonLength: 3600, // 1 hour = 1 season
      speciesType: 'fire' as any,
      complexityLevel: 2,
      enablePhysics: true,
      enableWeather: true,
      enableGenetics: true,
      enableLearning: true,
      maxAnts: 10000,
      worldSeed: Math.floor(Math.random() * 1000000),
    };
  }

  private getInitialState(): SimulationState {
    return {
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      realTimeElapsed: 0,
      timeScale: 1,
      totalAnts: 0,
      livingAnts: 0,
      deadAnts: 0,
      colonyAge: 0,
      season: 'spring',
      dayPhase: 'dawn',
      temperature: 20,
      humidity: 0.6,
      foodStores: 100,
      currentGeneration: 1,
    };
  }

  private getInitialPerformanceStats(): PerformanceStats {
    return {
      fps: 0,
      frameTime: 0,
      updateTime: 0,
      renderTime: 0,
      memoryUsage: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      },
      cpuUsage: {
        user: 0,
        system: 0,
      },
      antCount: 0,
      pheromoneGridSize: 0,
      physicsObjects: 0,
      trianglesRendered: 0,
    };
  }

  public configure(config: SimulationConfig): void {
    this.config = { ...this.config, ...config };
    this.state.timeScale = config.timeScale;
    this.reinitializeSystems();
    console.log('Simulation configured:', config);
  }

  private reinitializeSystems(): void {
    // Initialize engine systems based on configuration
    if (this.config.enablePhysics) {
      // this.collisionSystem = new CollisionSystem();
      console.log('Physics system enabled');
    }

    if (this.config.enableWeather) {
      // this.weatherSystem = new WeatherSystem();
      console.log('Weather system enabled');
    }

    // Initialize pheromone system
    const worldSize = Math.sqrt(this.config.environmentSize);
    this.pheromoneSystem = new PheromoneSystem(worldSize, worldSize);
    console.log('Pheromone system initialized');

    // Initialize soil system
    // this.soilSystem = new SoilSystem();

    // Initialize shared buffers for high-performance data transfer
    this.sharedBufferManager.initialize({
      antDataBufferSize: this.config.maxAnts * 64, // 64 bytes per ant
      pheromoneBufferSize: 1024 * 1024, // 1MB for pheromone grid
      environmentBufferSize: 512 * 1024, // 512KB for environment
      metadataBufferSize: 1024, // 1KB for metadata
    });
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.lastUpdateTime = Date.now();
    
    // Create initial colony
    this.createInitialColony();
    
    console.log('Simulation started');
  }

  public pause(): void {
    this.isPaused = true;
    this.state.isPaused = true;
    console.log('Simulation paused');
  }

  public resume(): void {
    this.isPaused = false;
    this.state.isPaused = false;
    this.lastUpdateTime = Date.now();
    console.log('Simulation resumed');
  }

  public reset(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.state = this.getInitialState();
    this.ants.clear();
    this.updates = [];
    this.performanceStats = this.getInitialPerformanceStats();
    
    // Reset all systems
    this.reinitializeSystems();
    
    console.log('Simulation reset');
  }

  public stop(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    console.log('Simulation stopped');
  }

  public setSpeed(speed: number): void {
    this.config.timeScale = speed;
    this.state.timeScale = speed;
    console.log('Simulation speed set to:', speed);
  }

  private createInitialColony(): void {
    // Create initial queen and workers
    const queenCount = 1;
    const workerCount = Math.min(this.config.colonySize, this.config.maxAnts - queenCount);
    
    // Create queen
    for (let i = 0; i < queenCount; i++) {
      this.createAnt('queen', { x: 0, y: 0, z: 0 });
    }
    
    // Create workers
    for (let i = 0; i < workerCount; i++) {
      const angle = (i / workerCount) * Math.PI * 2;
      const radius = Math.random() * 5; // Spawn within 5m radius
      const position = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0,
      };
      this.createAnt('worker', position);
    }
    
    this.state.totalAnts = queenCount + workerCount;
    this.state.livingAnts = this.state.totalAnts;
    
    console.log(`Created initial colony: ${queenCount} queens, ${workerCount} workers`);
  }

  private createAnt(casteString: string, position: { x: number; y: number; z: number }): void {
    const id = `ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Convert caste string to AntCaste enum
    const caste = this.parseCaste(casteString);
    
    // Create proper AntEntity
    const ant = new AntEntity(id, position, caste, this.state.currentGeneration);
    
    this.ants.set(id, ant);
  }

  private parseCaste(casteString: string): AntCaste {
    switch (casteString.toLowerCase()) {
      case 'queen': return AntCaste.QUEEN;
      case 'soldier': return AntCaste.SOLDIER;
      case 'nurse': return AntCaste.NURSE;
      case 'forager': return AntCaste.FORAGER;
      case 'architect': return AntCaste.ARCHITECT;
      case 'guard': return AntCaste.GUARD;
      case 'male': return AntCaste.MALE;
      default: return AntCaste.WORKER;
    }
  }

  public update(): void {
    if (!this.isRunning || this.isPaused) return;
    
    this.frameStartTime = performance.now();
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    const scaledDeltaTime = deltaTime * this.config.timeScale;
    
    this.lastUpdateTime = currentTime;
    this.state.currentTime += scaledDeltaTime;
    this.state.realTimeElapsed += deltaTime;
    
    // Update all simulation systems
    this.updateAnts(scaledDeltaTime);
    this.updatePheromones(scaledDeltaTime);
    this.updateEnvironment(scaledDeltaTime);
    this.updatePhysics(scaledDeltaTime);
    this.updateWeather(scaledDeltaTime);
    
    // Update simulation state
    this.updateSimulationState(scaledDeltaTime);
    
    // Update shared buffers
    this.updateSharedBuffers();
    
    // Track performance
    this.updatePerformanceStats();
  }

  private updateAnts(deltaTime: number): void {
    // Build environment context for ants
    const environmentContext = {
      temperature: this.state.temperature,
      timeOfDay: this.state.dayPhase,
      danger: 0, // Could be calculated from threats
      threats: 0,
      resources: 0,
      pheromoneStrength: 0,
      alarmLevel: 0,
      crowding: this.ants.size / 1000, // Simple crowding metric
      colonyNeeds: {
        food: 0.5, // Could be calculated from colony state
        defense: 0.3,
        construction: 0.4,
        nursing: 0.2,
      },
    };

    // Update each ant using their comprehensive systems
    for (const ant of this.ants.values()) {
      if (!ant.isAlive) continue;
      
      // Let the ant update itself with all its systems
      ant.update(deltaTime, environmentContext);
      
      // Remove dead ants
      if (!ant.isAlive) {
        this.state.livingAnts--;
        this.state.deadAnts++;
      }
    }
    
    // Clean up dead ants periodically
    if (this.frameCount % 600 === 0) { // Every 10 seconds at 60 FPS
      this.cleanupDeadAnts();
    }
  }

  private cleanupDeadAnts(): void {
    const deadAnts: string[] = [];
    for (const [id, ant] of this.ants.entries()) {
      if (!ant.isAlive) {
        deadAnts.push(id);
      }
    }
    
    for (const id of deadAnts) {
      this.ants.delete(id);
    }
    
    if (deadAnts.length > 0) {
      console.log(`Cleaned up ${deadAnts.length} dead ants`);
    }
  }

  private updatePheromones(deltaTime: number): void {
    if (this.pheromoneSystem) {
      this.pheromoneSystem.update(deltaTime);
    }
  }

  private updateEnvironment(deltaTime: number): void {
    // Update environmental factors
    this.updateDayNightCycle(deltaTime);
    this.updateSeasonalCycle(deltaTime);
  }

  private updatePhysics(deltaTime: number): void {
    // Physics systems will be integrated later when collision system is properly set up
    // if (this.collisionSystem && this.config.enablePhysics) {
    //   this.collisionSystem.update(deltaTime);
    // }
  }

  private updateWeather(deltaTime: number): void {
    if (this.weatherSystem && this.config.enableWeather) {
      // this.weatherSystem.update(deltaTime);
    }
  }

  private updateDayNightCycle(deltaTime: number): void {
    // Simple day/night cycle (24 hours = 24 seconds at 1x speed)
    const dayLength = 24; // seconds
    const dayProgress = (this.state.currentTime % dayLength) / dayLength;
    
    if (dayProgress < 0.25) {
      this.state.dayPhase = 'dawn';
    } else if (dayProgress < 0.75) {
      this.state.dayPhase = 'day';
    } else if (dayProgress < 0.9) {
      this.state.dayPhase = 'dusk';
    } else {
      this.state.dayPhase = 'night';
    }
    
    // Update temperature based on time of day
    const tempVariation = 10; // ±10°C variation
    this.state.temperature = 20 + Math.sin(dayProgress * Math.PI * 2) * tempVariation;
  }

  private updateSeasonalCycle(deltaTime: number): void {
    const seasonProgress = (this.state.currentTime % (this.config.seasonLength * 4)) / (this.config.seasonLength * 4);
    
    if (seasonProgress < 0.25) {
      this.state.season = 'spring';
    } else if (seasonProgress < 0.5) {
      this.state.season = 'summer';
    } else if (seasonProgress < 0.75) {
      this.state.season = 'autumn';
    } else {
      this.state.season = 'winter';
    }
  }

  private updateSimulationState(deltaTime: number): void {
    this.state.colonyAge = this.state.currentTime / 86400; // Convert to days
    this.state.livingAnts = Array.from(this.ants.values()).filter(ant => ant.isAlive).length;
  }

  private updateSharedBuffers(): void {
    // Update shared array buffers with current simulation data
    this.sharedBufferManager.updateAntData(Array.from(this.ants.values()));
    // this.sharedBufferManager.updatePheromoneData(this.pheromoneSystem?.getLayers());
    // this.sharedBufferManager.updateEnvironmentData(this.getEnvironmentData());
  }

  private updatePerformanceStats(): void {
    const frameEndTime = performance.now();
    this.performanceStats.frameTime = frameEndTime - this.frameStartTime;
    
    // Update FPS every second
    this.frameCount++;
    if (frameEndTime - this.lastFPSUpdate >= 1000) {
      this.performanceStats.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFPSUpdate = frameEndTime;
    }
    
    this.performanceStats.antCount = this.state.livingAnts;
    // this.performanceStats.memoryUsage = process.memoryUsage();
    // this.performanceStats.cpuUsage = process.cpuUsage();
  }

  // Public data access methods
  public getState(): SimulationState {
    return { ...this.state };
  }

  public getAntData(): AntRenderData[] {
    return Array.from(this.ants.values()).map(ant => ant.toRenderData());
  }

  public getPheromoneData(): PheromoneRenderData[] {
    if (!this.pheromoneSystem) return [];
    
    // Return pheromone data for rendering
    return []; // TODO: Implement pheromone data extraction
  }

  public getEnvironmentData(): EnvironmentRenderData {
    return {
      tunnels: [],
      foodSources: [],
      obstacles: [],
      plants: [],
      soilMoisture: new Float32Array(0),
      temperature: new Float32Array(0),
      weatherState: {
        temperature: this.state.temperature,
        humidity: this.state.humidity,
        pressure: 101.3,
        windSpeed: 0,
        windDirection: 0,
        precipitation: 0,
        cloudCover: 0,
        visibility: 1000,
        uvIndex: 5,
      },
    };
  }

  public getUpdates(): SimulationUpdate {
    const update: SimulationUpdate = {
      timestamp: Date.now(),
      deltaTime: 1 / 60, // Assuming 60 FPS
      antUpdates: [],
      pheromoneUpdates: [],
      environmentUpdates: [],
      stateChanges: this.getState(),
    };
    
    return update;
  }

  public getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  public getAntCount(): number {
    return this.state.livingAnts;
  }

  public getSharedBuffers(): any {
    return this.sharedBufferManager.getBuffers();
  }
}