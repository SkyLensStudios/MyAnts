/**
 * Shared Type Definitions
 * Common types used across main and renderer processes
 */

import { Vector3 } from '../../engine/physics/collision';
import { AntCaste } from '../../engine/colony/casteSystem';
import { PheromoneType } from '../../engine/chemical/pheromones';

// Use Vector3 from physics system as Vector3D
export type Vector3D = Vector3;

// Simulation Configuration
export interface SimulationConfig {
  timeScale: number;           // 1x = real time, 100x = accelerated
  colonySize: number;          // 100-50,000 individuals  
  environmentSize: number;     // 1m² - 100m² territory
  seasonLength: number;        // Realistic seasonal duration in seconds
  speciesType: AntSpecies;     // Leafcutter, Army, Fire, etc.
  complexityLevel: 1 | 2 | 3 | 4; // Computational complexity scaling
  enablePhysics: boolean;      // Enable/disable physics simulation
  enableWeather: boolean;      // Enable/disable weather effects
  enableGenetics: boolean;     // Enable/disable genetic simulation
  enableLearning: boolean;     // Enable/disable AI learning
  maxAnts: number;            // Maximum ant population
  worldSeed: number;          // Random seed for reproducible simulations
  
  // Phase 4 Environmental Systems
  enableAdvancedWeather?: boolean;     // Enable complex weather patterns
  enableSoilDynamics?: boolean;        // Enable soil physics simulation
  enableEcosystemInteractions?: boolean; // Enable ecosystem complexity
  weatherComplexity?: 'low' | 'medium' | 'high'; // Weather system detail level
  soilResolution?: number;             // Soil grid resolution
}

// Ant Species Definitions
export enum AntSpecies {
  LEAFCUTTER = 'leafcutter',
  ARMY = 'army',
  FIRE = 'fire',
  CARPENTER = 'carpenter',
  HARVESTER = 'harvester',
  WEAVER = 'weaver',
  BULLET = 'bullet',
  ARGENTINE = 'argentine',
}

// Simulation State
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number;         // Simulation time in seconds
  realTimeElapsed: number;     // Real time since start
  timeScale: number;           // Current time multiplier
  totalAnts: number;
  livingAnts: number;
  deadAnts: number;
  colonyAge: number;           // Days since colony founding
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  dayPhase: 'dawn' | 'day' | 'dusk' | 'night';
  temperature: number;         // Celsius
  humidity: number;            // 0-1
  foodStores: number;          // Total colony food
  currentGeneration: number;   // Genetic generation
}

// Ant Data for Rendering
export interface AntRenderData {
  id: string;
  position: Vector3D;
  rotation: number;            // Radians
  caste: AntCaste;
  health: number;              // 0-1
  energy: number;              // 0-1
  age: number;                 // Days
  task: string;                // Current task
  carryingFood: boolean;
  carryingConstruction: boolean;
  speed: number;               // Current movement speed
  isAlive: boolean;
  generation: number;
}

// Pheromone Field Data
export interface PheromoneRenderData {
  type: PheromoneType;
  concentrationGrid: Float32Array;
  width: number;
  height: number;
  cellSize: number;
  maxConcentration: number;
  lastUpdate: number;
}

// Environment Rendering Data
export interface EnvironmentRenderData {
  tunnels: TunnelSegment[];
  foodSources: FoodSource[];
  obstacles: Obstacle[];
  plants: Plant[];
  soilMoisture: Float32Array;
  temperature: Float32Array;
  weatherState: WeatherState;
}

export interface TunnelSegment {
  id: string;
  start: Vector3D;
  end: Vector3D;
  radius: number;
  stability: number;           // 0-1, collapse risk
  trafficLevel: number;        // How busy this tunnel is
}

export interface FoodSource {
  id: string;
  position: Vector3D;
  type: 'sugar' | 'protein' | 'seed' | 'insect' | 'leaf';
  quantity: number;            // Remaining food
  quality: number;             // 0-1, nutritional value
  depletion: number;           // How much has been harvested
  discoveryTime: number;       // When it was found
}

export interface Obstacle {
  id: string;
  position: Vector3D;
  size: Vector3D;
  type: 'rock' | 'root' | 'water' | 'competitor_nest';
  hardness: number;            // Digging difficulty
  blocking: boolean;           // Completely blocks movement
}

export interface Plant {
  id: string;
  position: Vector3D;
  type: 'grass' | 'shrub' | 'tree' | 'flower';
  growth: number;              // 0-1, maturity
  health: number;              // 0-1, plant health
  hasSeeds: boolean;
  hasNectar: boolean;
  rootDepth: number;
}

export interface WeatherState {
  temperature: number;         // Celsius
  humidity: number;            // 0-1
  pressure: number;            // kPa
  windSpeed: number;           // m/s
  windDirection: number;       // degrees (0-360)
  precipitation: number;       // mm/hour
  cloudCover: number;          // 0-1
  visibility: number;          // meters
  uvIndex: number;             // 0-12
}

// Performance Metrics
export interface PerformanceStats {
  fps: number;
  frameTime: number;           // milliseconds
  updateTime: number;          // milliseconds
  renderTime: number;          // milliseconds
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  antCount: number;
  pheromoneGridSize: number;
  physicsObjects: number;
  trianglesRendered: number;
}

// Shared Array Buffer Configuration
export interface SharedBufferConfig {
  antDataBufferSize: number;
  pheromoneBufferSize: number;
  environmentBufferSize: number;
  metadataBufferSize: number;
}

// Update Messages (for batched IPC)
export interface SimulationUpdate {
  timestamp: number;
  deltaTime: number;
  antUpdates: AntUpdate[];
  pheromoneUpdates: PheromoneUpdate[];
  environmentUpdates: EnvironmentUpdate[];
  stateChanges: Partial<SimulationState>;
}

export interface AntUpdate {
  id: string;
  position?: Vector3D;
  rotation?: number;
  health?: number;
  energy?: number;
  task?: string;
  died?: boolean;
  born?: boolean;
}

export interface PheromoneUpdate {
  type: PheromoneType;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: Float32Array;
}

export interface EnvironmentUpdate {
  type: 'tunnel_created' | 'tunnel_collapsed' | 'food_depleted' | 'obstacle_added';
  data: any;
}

// Camera and UI State
export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  zoom: number;
  mode: 'overview' | 'follow' | 'underground' | 'cross_section';
}

export interface UIState {
  selectedAnt?: string;
  selectedColony?: string;
  activeTool: 'select' | 'measure' | 'dig' | 'food' | 'obstacle';
  showPheromones: boolean;
  showPhysics: boolean;
  showUndergound: boolean;
  timeSpeed: number;
}

// File Operations
export interface SaveData {
  version: string;
  timestamp: number;
  config: SimulationConfig;
  state: SimulationState;
  ants: AntRenderData[];
  environment: EnvironmentRenderData;
  pheromones: PheromoneRenderData[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'sqlite';
  dataTypes: ('ants' | 'pheromones' | 'environment' | 'performance')[];
  timeRange?: {
    start: number;
    end: number;
  };
  compression: boolean;
}