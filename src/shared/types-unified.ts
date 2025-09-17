/**
 * Unified 2D/3D Types for MyAnts Simulation
 * Supports both 2D and 3D rendering modes with shared interfaces
 */

import { Vector3 } from '../../engine/physics/collision';
import { Vector2D, AntRenderInstance2D, PheromoneRenderData2D, EnvironmentRenderData2D } from './types-2d';
import { AntCaste } from '../../engine/colony/casteSystem';
import { PheromoneType } from '../../engine/chemical/pheromones';

// Unified position type that supports both 2D and 3D
export interface UnifiedPosition {
  x: number;
  y: number;
  z?: number; // Optional for 2D mode
}

// Simulation mode enum
export enum SimulationMode {
  MODE_2D = '2d',
  MODE_3D = '3d'
}

// Mode-aware configuration
export interface SimulationConfig {
  mode: SimulationMode;            // New: 2D or 3D mode
  timeScale: number;               // 1x = real time, 100x = accelerated
  colonySize: number;              // 100-50,000 individuals  
  environmentSize: number;         // 1m² - 100m² territory
  seasonLength: number;            // Realistic seasonal duration in seconds
  speciesType: AntSpecies;         // Leafcutter, Army, Fire, etc.
  complexityLevel: 1 | 2 | 3 | 4;  // Computational complexity scaling
  enablePhysics: boolean;          // Enable/disable physics simulation
  enableWeather: boolean;          // Enable/disable weather effects
  enableGenetics: boolean;         // Enable/disable genetic simulation
  enableLearning: boolean;         // Enable/disable AI learning
  maxAnts: number;                // Maximum ant population
  worldSeed: number;              // Random seed for reproducible simulations
  
  // Rendering configuration
  render3D: boolean;              // Use 3D rendering (Three.js) vs 2D (Canvas)
  enableAdvancedRendering: boolean; // Enable WebGPU, LOD, etc.
  
  // Phase 4 Environmental Systems
  enableAdvancedWeather?: boolean;     // Enable complex weather patterns
  enableSoilDynamics?: boolean;        // Enable soil physics simulation
  enableEcosystemInteractions?: boolean; // Enable ecosystem complexity
  weatherComplexity?: 'low' | 'medium' | 'high'; // Weather system detail level
  soilResolution?: number;             // Soil grid resolution
}

// Ant Species Definitions (unchanged)
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

// Unified simulation state
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  mode: SimulationMode;           // Current rendering mode
  currentTime: number;            // Simulation time in seconds
  timeScale: number;              // Current time scale multiplier
  stepCount: number;              // Number of simulation steps completed
  realTimeElapsed: number;        // Real-world time elapsed in ms
  temperature: number;            // Environmental temperature
  humidity: number;               // Environmental humidity
  foodStores: number;             // Colony food reserves
  currentGeneration: number;      // Current generation number
}

// Mode-aware ant render data (supports both 2D and 3D)
export interface UnifiedAntRenderData {
  id: string;
  position: UnifiedPosition;
  rotation: number | { x: number; y: number; z: number; w: number }; // Angle for 2D, quaternion for 3D
  scale: { x: number; y: number; z?: number }; // Optional z for 2D
  caste: AntCaste;
  health: number;
  energy: number;
  carryingFood: boolean;
  currentTask: string;
  age: number;
  color: { r: number; g: number; b: number; a: number };
  visible: boolean;
  generation: number;
  
  // 2D specific properties
  animationState?: number;
  lodLevel?: number;
}

// Mode-aware pheromone data
export interface UnifiedPheromoneRenderData {
  position: UnifiedPosition;
  type: PheromoneType;
  strength: number;
  maxStrength: number;
  decay: number;
  age: number;
  sourceAntId?: string;
}

// Mode-aware environment data
export interface UnifiedEnvironmentRenderData {
  position: UnifiedPosition;
  size: { x: number; y: number; z?: number }; // Optional z for 2D
  type: 'food' | 'obstacle' | 'nest' | 'water' | 'boundary';
  properties: Record<string, any>;
}

// Unified simulation update
export interface UnifiedSimulationUpdate {
  timestamp: number;
  mode: SimulationMode;
  antData: UnifiedAntRenderData[];
  pheromoneData: UnifiedPheromoneRenderData[];
  environmentData: UnifiedEnvironmentRenderData[];
  deltaTime: number;
  performanceMetrics?: {
    fps: number;
    frameTime: number;
    antCount: number;
    culledAnts?: number;
  };
}

// Performance tracking
export interface PerformanceStats {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
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
  spatialOptimizationStats?: any;
}

// Utility functions for mode conversion
export class ModeConversionUtils {
  /**
   * Convert 3D position to 2D (drops z coordinate)
   */
  static to2D(position: Vector3 | UnifiedPosition): Vector2D {
    return { x: position.x, y: position.y };
  }

  /**
   * Convert 2D position to 3D (adds z=0)
   */
  static to3D(position: Vector2D, z: number = 0): Vector3 {
    return { x: position.x, y: position.y, z };
  }

  /**
   * Convert unified position based on mode
   */
  static convertPosition(position: UnifiedPosition, targetMode: SimulationMode): UnifiedPosition {
    if (targetMode === SimulationMode.MODE_2D) {
      return { x: position.x, y: position.y };
    } else {
      return { x: position.x, y: position.y, z: position.z || 0 };
    }
  }

  /**
   * Convert 3D ant data to 2D
   */
  static antDataTo2D(ant3D: UnifiedAntRenderData): AntRenderInstance2D {
    return {
      id: ant3D.id,
      position: ModeConversionUtils.to2D(ant3D.position),
      rotation: typeof ant3D.rotation === 'number' ? ant3D.rotation : 0, // Extract angle from quaternion if needed
      scale: { x: ant3D.scale.x, y: ant3D.scale.y },
      color: ant3D.color,
      animationState: ant3D.animationState || 0,
      visible: ant3D.visible,
      lodLevel: ant3D.lodLevel || 0
    };
  }

  /**
   * Convert 2D ant data to unified format
   */
  static antDataFrom2D(ant2D: AntRenderInstance2D, additionalData?: Partial<UnifiedAntRenderData>): UnifiedAntRenderData {
    return {
      id: ant2D.id || '',
      position: { x: ant2D.position.x, y: ant2D.position.y },
      rotation: ant2D.rotation,
      scale: { x: ant2D.scale.x, y: ant2D.scale.y },
      caste: AntCaste.WORKER, // Default, should be provided in additionalData
      health: 1.0,
      energy: 1.0,
      carryingFood: false,
      currentTask: 'exploring',
      age: 0,
      color: ant2D.color,
      visible: ant2D.visible,
      generation: 1,
      animationState: ant2D.animationState,
      lodLevel: ant2D.lodLevel,
      ...additionalData
    };
  }

  /**
   * Convert pheromone data to 2D
   */
  static pheromoneDataTo2D(pheromone3D: UnifiedPheromoneRenderData): PheromoneRenderData2D {
    return {
      position: ModeConversionUtils.to2D(pheromone3D.position),
      strength: pheromone3D.strength,
      type: pheromone3D.type.toString(),
      decay: pheromone3D.decay
    };
  }

  /**
   * Convert environment data to 2D
   */
  static environmentDataTo2D(env3D: UnifiedEnvironmentRenderData): EnvironmentRenderData2D {
    return {
      position: ModeConversionUtils.to2D(env3D.position),
      size: { x: env3D.size.x, y: env3D.size.y },
      type: env3D.type,
      properties: env3D.properties
    };
  }

  /**
   * Convert unified update to 2D format
   */
  static updateTo2D(update: UnifiedSimulationUpdate): {
    antData: AntRenderInstance2D[];
    pheromoneData: PheromoneRenderData2D[];
    environmentData: EnvironmentRenderData2D[];
  } {
    return {
      antData: update.antData.map(ant => ModeConversionUtils.antDataTo2D(ant)),
      pheromoneData: update.pheromoneData.map(p => ModeConversionUtils.pheromoneDataTo2D(p)),
      environmentData: update.environmentData.map(e => ModeConversionUtils.environmentDataTo2D(e))
    };
  }
}

// Type guards for mode detection
export function isSimulationMode2D(mode: SimulationMode): boolean {
  return mode === SimulationMode.MODE_2D;
}

export function isSimulationMode3D(mode: SimulationMode): boolean {
  return mode === SimulationMode.MODE_3D;
}

export function hasZCoordinate(position: UnifiedPosition): position is Required<UnifiedPosition> {
  return position.z !== undefined;
}

// Configuration helpers
export class ConfigurationUtils {
  /**
   * Get default 2D configuration
   */
  static getDefault2DConfig(): Partial<SimulationConfig> {
    return {
      mode: SimulationMode.MODE_2D,
      render3D: false,
      enableAdvancedRendering: false,
      enablePhysics: false, // Simplified physics for 2D
      complexityLevel: 2,   // Medium complexity for 2D
    };
  }

  /**
   * Get default 3D configuration
   */
  static getDefault3DConfig(): Partial<SimulationConfig> {
    return {
      mode: SimulationMode.MODE_3D,
      render3D: true,
      enableAdvancedRendering: true,
      enablePhysics: true,
      complexityLevel: 3,   // Higher complexity for 3D
    };
  }

  /**
   * Convert configuration between modes
   */
  static convertConfig(config: SimulationConfig, targetMode: SimulationMode): SimulationConfig {
    const newConfig = { ...config };
    newConfig.mode = targetMode;
    
    if (targetMode === SimulationMode.MODE_2D) {
      // Optimize for 2D
      newConfig.render3D = false;
      newConfig.enableAdvancedRendering = false;
      newConfig.complexityLevel = Math.min(3, newConfig.complexityLevel) as 1 | 2 | 3 | 4;
    } else {
      // Configure for 3D
      newConfig.render3D = true;
      newConfig.enableAdvancedRendering = true;
    }
    
    return newConfig;
  }
}

// Legacy type aliases for backward compatibility
export type Vector3D = Vector3;
export type AntRenderData = UnifiedAntRenderData;
export type PheromoneRenderData = UnifiedPheromoneRenderData; 
export type EnvironmentRenderData = UnifiedEnvironmentRenderData;
export type SimulationUpdate = UnifiedSimulationUpdate;