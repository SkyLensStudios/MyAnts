/**
 * Centralized State Management for MyAnts Simulation
 * Phase 3 Architecture Improvement - Clean data flow and state persistence
 * 
 * Uses Zustand for lightweight, performant state management
 * Replaces scattered state with centralized, typed store
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  Vector3D, 
  AntCaste, 
  PerformanceMetrics,
  SimulationConfiguration,
  BiomeType,
  AAType,
  TextureQuality
} from '../types-enhanced';

// ============================================================================
// State Interfaces
// ============================================================================

export interface AntEntity {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  rotation: { x: number; y: number; z: number; w: number };
  caste: AntCaste;
  age: number;
  energy: number;
  health: number;
  currentTask: string;
  targetPosition?: Vector3D;
  carryingFood: boolean;
  pheromoneIntensity: number;
  lastActivity: number;
  isSelected: boolean;
  groupId?: string;
  behaviors: string[];
  memory: Record<string, any>;
  lodLevel: number;
}

export interface ColonyState {
  id: string;
  name: string;
  queenPosition: Vector3D;
  nestEntrance: Vector3D;
  population: {
    workers: number;
    soldiers: number;
    queens: number;
    larvae: number;
  };
  resources: {
    food: number;
    buildingMaterials: number;
    pheromones: number;
  };
  territory: {
    explored: Vector3D[];
    claimed: Vector3D[];
    foodSources: Array<{
      id: string;
      position: Vector3D;
      amount: number;
      discoveredAt: number;
    }>;
  };
  morale: number;
  efficiency: number;
  reproduction: {
    breedingCooldown: number;
    eggsLaid: number;
    hatchingQueue: Array<{ caste: AntCaste; hatchTime: number }>;
  };
}

export interface EnvironmentState {
  worldBounds: Vector3D;
  biome: BiomeType;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
  };
  terrain: {
    obstacles: Array<{ position: Vector3D; size: Vector3D; type: string }>;
    vegetation: Array<{ position: Vector3D; type: string; density: number }>;
    waterSources: Array<{ position: Vector3D; radius: number }>;
  };
  timeOfDay: number; // 0-24 hour cycle
  dayCount: number;
  pheromoneMap: Map<string, { position: Vector3D; intensity: number; type: string; age: number }>;
}

export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  zoom: number;
  rotation: { x: number; y: number };
  followTarget?: string; // ant ID to follow
  mode: 'free' | 'follow' | 'overview' | 'cinematic';
  smoothTransition: boolean;
}

export interface UIState {
  activePanel: 'simulation' | 'performance' | 'debug' | 'settings' | 'analysis';
  showDebugOverlay: boolean;
  showPerformanceMetrics: boolean;
  showAntPaths: boolean;
  showPheromoneTrails: boolean;
  selectedAntIds: string[];
  inspectorTarget?: string;
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: number;
    duration?: number;
  }>;
  modal?: {
    type: string;
    props: Record<string, any>;
  };
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  timeScale: number;
  simulationTime: number;
  tickCount: number;
  targetFPS: number;
  deltaTime: number;
  lastFrameTime: number;
  adaptiveQuality: {
    enabled: boolean;
    currentLevel: number;
    targetLevel: number;
    performanceThreshold: number;
  };
}

export interface PerformanceState {
  current: PerformanceMetrics;
  history: Array<{ timestamp: number; metrics: PerformanceMetrics }>;
  alerts: Array<{
    type: 'memory' | 'fps' | 'cpu' | 'gpu';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    resolved: boolean;
  }>;
  profiling: {
    enabled: boolean;
    samples: Array<{
      function: string;
      duration: number;
      callCount: number;
      timestamp: number;
    }>;
  };
}

// ============================================================================
// Main Store Interface  
// ============================================================================

export interface MyAntsStore {
  // State sections
  ants: Map<string, AntEntity>;
  colonies: Map<string, ColonyState>;
  environment: EnvironmentState;
  camera: CameraState;
  ui: UIState;
  simulation: SimulationState;
  performance: PerformanceState;
  configuration: SimulationConfiguration;

  // Ant management actions
  addAnt: (ant: Omit<AntEntity, 'id'>) => string;
  removeAnt: (antId: string) => void;
  updateAnt: (antId: string, updates: Partial<AntEntity>) => void;
  updateAnts: (updates: Array<{ id: string; updates: Partial<AntEntity> }>) => void;
  selectAnt: (antId: string, addToSelection?: boolean) => void;
  deselectAnt: (antId: string) => void;
  clearSelection: () => void;
  getSelectedAnts: () => AntEntity[];

  // Colony management actions
  addColony: (colony: ColonyState) => void;
  updateColony: (colonyId: string, updates: Partial<ColonyState>) => void;
  addFoodSource: (colonyId: string, position: Vector3D, amount: number) => void;
  consumeFood: (colonyId: string, amount: number) => boolean;

  // Environment actions
  updateEnvironment: (updates: Partial<EnvironmentState>) => void;
  addObstacle: (obstacle: { position: Vector3D; size: Vector3D; type: string }) => void;
  updateWeather: (weather: Partial<EnvironmentState['weather']>) => void;
  advanceTime: (deltaTime: number) => void;
  updatePheromone: (id: string, pheromone: { position: Vector3D; intensity: number; type: string; age: number }) => void;
  decayPheromones: (decayRate: number) => void;

  // Camera actions
  updateCamera: (updates: Partial<CameraState>) => void;
  setCameraTarget: (position: Vector3D) => void;
  followAnt: (antId: string) => void;
  setCameraMode: (mode: CameraState['mode']) => void;

  // UI actions
  setActivePanel: (panel: UIState['activePanel']) => void;
  toggleDebugOverlay: () => void;
  togglePerformanceMetrics: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  showModal: (type: string, props: Record<string, any>) => void;
  hideModal: () => void;

  // Simulation control actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  setTimeScale: (scale: number) => void;
  setTargetFPS: (fps: number) => void;
  updateSimulationTime: (deltaTime: number) => void;
  updateAdaptiveQuality: (level: number) => void;

  // Performance monitoring actions
  updatePerformanceMetrics: (metrics: PerformanceMetrics) => void;
  addPerformanceAlert: (alert: Omit<PerformanceState['alerts'][0], 'timestamp'>) => void;
  resolvePerformanceAlert: (alertIndex: number) => void;
  enableProfiling: () => void;
  disableProfiling: () => void;
  addProfileSample: (sample: Omit<PerformanceState['profiling']['samples'][0], 'timestamp'>) => void;

  // Configuration actions
  updateConfiguration: (config: Partial<SimulationConfiguration>) => void;
  resetConfiguration: () => void;
  loadConfiguration: (config: SimulationConfiguration) => void;

  // Persistence actions
  saveState: () => void;
  loadState: () => void;
  exportState: () => string;
  importState: (stateJson: string) => void;

  // Performance optimization actions
  cleanup: () => void;
  resetPerformanceHistory: () => void;
  optimizeMemory: () => void;
}

// ============================================================================
// Default State Values
// ============================================================================

const DEFAULT_ENVIRONMENT: EnvironmentState = {
  worldBounds: { x: 1000, y: 1000, z: 100 },
  biome: BiomeType.TEMPERATE_FOREST,
  weather: {
    temperature: 22,
    humidity: 65,
    windSpeed: 5,
    season: 'spring'
  },
  terrain: {
    obstacles: [],
    vegetation: [],
    waterSources: []
  },
  timeOfDay: 12,
  dayCount: 0,
  pheromoneMap: new Map()
};

const DEFAULT_CAMERA: CameraState = {
  position: { x: 0, y: 50, z: 100 },
  target: { x: 0, y: 0, z: 0 },
  zoom: 1,
  rotation: { x: -0.5, y: 0 },
  mode: 'free',
  smoothTransition: true
};

const DEFAULT_UI: UIState = {
  activePanel: 'simulation',
  showDebugOverlay: false,
  showPerformanceMetrics: true,
  showAntPaths: false,
  showPheromoneTrails: true,
  selectedAntIds: [],
  notifications: [],
};

const DEFAULT_SIMULATION: SimulationState = {
  isRunning: false,
  isPaused: false,
  timeScale: 1.0,
  simulationTime: 0,
  tickCount: 0,
  targetFPS: 60,
  deltaTime: 0,
  lastFrameTime: 0,
  adaptiveQuality: {
    enabled: true,
    currentLevel: 2,
    targetLevel: 2,
    performanceThreshold: 45
  }
};

const DEFAULT_PERFORMANCE: PerformanceState = {
  current: {
    fps: 60,
    frameTime: 16.67,
    cpuUsage: 0,
    memoryUsage: 0,
    triangleCount: 0,
    drawCalls: 0,
    shaderSwitches: 0,
    textureBindings: 0
  },
  history: [],
  alerts: [],
  profiling: {
    enabled: false,
    samples: []
  }
};

const DEFAULT_CONFIGURATION: SimulationConfiguration = {
  world: {
    size: { x: 1000, y: 1000, z: 100 },
    gravity: { x: 0, y: -9.81, z: 0 },
    timeScale: 1.0,
    maxAnts: 10000,
    seed: 12345,
    biome: BiomeType.TEMPERATE_FOREST
  },
  ants: {
    initialCount: 100,
    casteDistribution: {
      [AntCaste.WORKER]: 0.8,
      [AntCaste.SOLDIER]: 0.15,
      [AntCaste.QUEEN]: 0.04,
      [AntCaste.SCOUT]: 0.005,
      [AntCaste.NURSE]: 0.04,
      [AntCaste.MALE]: 0.005
    },
    geneticsVariation: 0.2,
    lifespanMultiplier: 1.0,
    intelligenceRange: [0.3, 0.9] as const,
    physicalTraitsRange: {
      strength: [0.2, 0.8] as const,
      speed: [0.3, 0.9] as const,
      endurance: [0.4, 0.8] as const
    }
  },
  environment: {
    weatherEnabled: true,
    seasonalChanges: true,
    dayNightCycle: true,
    predatorsEnabled: false,
    diseasesEnabled: false,
    foodScarcity: 0.3,
    territorialConflicts: false
  },
  performance: {
    targetFPS: 60,
    adaptiveQuality: true,
    spatialOptimization: true,
    multiThreading: true,
    gpuAcceleration: true,
    memoryLimit: 2048,
    cullingDistance: 500
  },
  rendering: {
    maxRenderDistance: 500,
    lodEnabled: true,
    instancedRendering: true,
    shadowsEnabled: true,
    particleEffects: true,
    postProcessing: true,
    antiAliasing: AAType.MSAA,
    textureQuality: TextureQuality.HIGH
  },
  ai: {
    decisionTreeDepth: 5,
    learningEnabled: true,
    memoryCapacity: 1000,
    communicationRange: 50,
    pheromoneStrength: 0.8,
    explorationBonus: 0.1,
    socialInfluence: 0.6
  }
};

// ============================================================================
// Store Creation with Middleware
// ============================================================================

export const useMyAntsStore = create<MyAntsStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          ants: new Map(),
          colonies: new Map(),
          environment: DEFAULT_ENVIRONMENT,
          camera: DEFAULT_CAMERA,
          ui: DEFAULT_UI,
          simulation: DEFAULT_SIMULATION,
          performance: DEFAULT_PERFORMANCE,
          configuration: DEFAULT_CONFIGURATION,

          // Ant management actions
          addAnt: (antData) => {
            const id = `ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const ant: AntEntity = {
              id,
              ...antData,
              lodLevel: 0,
              behaviors: [],
              memory: {}
            };

            set((state) => {
              state.ants.set(id, ant);
            });

            return id;
          },

          removeAnt: (antId) => {
            set((state) => {
              state.ants.delete(antId);
              state.ui.selectedAntIds = state.ui.selectedAntIds.filter(id => id !== antId);
            });
          },

          updateAnt: (antId, updates) => {
            set((state) => {
              const ant = state.ants.get(antId);
              if (ant) {
                Object.assign(ant, updates);
              }
            });
          },

          updateAnts: (updates) => {
            set((state) => {
              updates.forEach(({ id, updates: antUpdates }) => {
                const ant = state.ants.get(id);
                if (ant) {
                  Object.assign(ant, antUpdates);
                }
              });
            });
          },

          selectAnt: (antId, addToSelection = false) => {
            set((state) => {
              const ant = state.ants.get(antId);
              if (ant) {
                if (addToSelection) {
                  if (!state.ui.selectedAntIds.includes(antId)) {
                    state.ui.selectedAntIds.push(antId);
                  }
                } else {
                  state.ui.selectedAntIds = [antId];
                }
                ant.isSelected = true;
              }
            });
          },

          deselectAnt: (antId) => {
            set((state) => {
              const ant = state.ants.get(antId);
              if (ant) {
                ant.isSelected = false;
                state.ui.selectedAntIds = state.ui.selectedAntIds.filter(id => id !== antId);
              }
            });
          },

          clearSelection: () => {
            set((state) => {
              state.ui.selectedAntIds.forEach(antId => {
                const ant = state.ants.get(antId);
                if (ant) {
                  ant.isSelected = false;
                }
              });
              state.ui.selectedAntIds = [];
            });
          },

          getSelectedAnts: () => {
            const state = get();
            return state.ui.selectedAntIds
              .map(id => state.ants.get(id))
              .filter(Boolean) as AntEntity[];
          },

          // Colony management actions
          addColony: (colony) => {
            set((state) => {
              state.colonies.set(colony.id, colony);
            });
          },

          updateColony: (colonyId, updates) => {
            set((state) => {
              const colony = state.colonies.get(colonyId);
              if (colony) {
                Object.assign(colony, updates);
              }
            });
          },

          addFoodSource: (colonyId, position, amount) => {
            set((state) => {
              const colony = state.colonies.get(colonyId);
              if (colony) {
                const foodSource = {
                  id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  position,
                  amount,
                  discoveredAt: Date.now()
                };
                colony.territory.foodSources.push(foodSource);
              }
            });
          },

          consumeFood: (colonyId, amount) => {
            let success = false;
            set((state) => {
              const colony = state.colonies.get(colonyId);
              if (colony && colony.resources.food >= amount) {
                colony.resources.food -= amount;
                success = true;
              }
            });
            return success;
          },

          // Environment actions
          updateEnvironment: (updates) => {
            set((state) => {
              Object.assign(state.environment, updates);
            });
          },

          addObstacle: (obstacle) => {
            set((state) => {
              state.environment.terrain.obstacles.push(obstacle);
            });
          },

          updateWeather: (weather) => {
            set((state) => {
              Object.assign(state.environment.weather, weather);
            });
          },

          advanceTime: (deltaTime) => {
            set((state) => {
              state.environment.timeOfDay += deltaTime / 3600; // Convert ms to hours
              if (state.environment.timeOfDay >= 24) {
                state.environment.timeOfDay -= 24;
                state.environment.dayCount++;
              }
            });
          },

          updatePheromone: (id, pheromone) => {
            set((state) => {
              state.environment.pheromoneMap.set(id, pheromone);
            });
          },

          decayPheromones: (decayRate) => {
            set((state) => {
              const toRemove: string[] = [];
              state.environment.pheromoneMap.forEach((pheromone, id) => {
                pheromone.intensity *= (1 - decayRate);
                pheromone.age++;
                if (pheromone.intensity < 0.01) {
                  toRemove.push(id);
                }
              });
              toRemove.forEach(id => state.environment.pheromoneMap.delete(id));
            });
          },

          // Camera actions
          updateCamera: (updates) => {
            set((state) => {
              Object.assign(state.camera, updates);
            });
          },

          setCameraTarget: (position) => {
            set((state) => {
              state.camera.target = position;
            });
          },

          followAnt: (antId) => {
            set((state) => {
              state.camera.followTarget = antId;
              state.camera.mode = 'follow';
            });
          },

          setCameraMode: (mode) => {
            set((state) => {
              state.camera.mode = mode;
              if (mode !== 'follow') {
                state.camera.followTarget = undefined;
              }
            });
          },

          // UI actions
          setActivePanel: (panel) => {
            set((state) => {
              state.ui.activePanel = panel;
            });
          },

          toggleDebugOverlay: () => {
            set((state) => {
              state.ui.showDebugOverlay = !state.ui.showDebugOverlay;
            });
          },

          togglePerformanceMetrics: () => {
            set((state) => {
              state.ui.showPerformanceMetrics = !state.ui.showPerformanceMetrics;
            });
          },

          addNotification: (notification) => {
            set((state) => {
              const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              state.ui.notifications.push({
                id,
                timestamp: Date.now(),
                ...notification
              });
            });
          },

          removeNotification: (notificationId) => {
            set((state) => {
              state.ui.notifications = state.ui.notifications.filter(n => n.id !== notificationId);
            });
          },

          showModal: (type, props) => {
            set((state) => {
              state.ui.modal = { type, props };
            });
          },

          hideModal: () => {
            set((state) => {
              state.ui.modal = undefined;
            });
          },

          // Simulation control actions
          startSimulation: () => {
            set((state) => {
              state.simulation.isRunning = true;
              state.simulation.isPaused = false;
            });
          },

          pauseSimulation: () => {
            set((state) => {
              state.simulation.isPaused = !state.simulation.isPaused;
            });
          },

          stopSimulation: () => {
            set((state) => {
              state.simulation.isRunning = false;
              state.simulation.isPaused = false;
              state.simulation.simulationTime = 0;
              state.simulation.tickCount = 0;
            });
          },

          setTimeScale: (scale) => {
            set((state) => {
              state.simulation.timeScale = Math.max(0.1, Math.min(10, scale));
            });
          },

          setTargetFPS: (fps) => {
            set((state) => {
              state.simulation.targetFPS = Math.max(15, Math.min(240, fps));
            });
          },

          updateSimulationTime: (deltaTime) => {
            set((state) => {
              state.simulation.deltaTime = deltaTime;
              state.simulation.simulationTime += deltaTime * state.simulation.timeScale;
              state.simulation.tickCount++;
              state.simulation.lastFrameTime = performance.now();
            });
          },

          updateAdaptiveQuality: (level) => {
            set((state) => {
              state.simulation.adaptiveQuality.currentLevel = level;
            });
          },

          // Performance monitoring actions
          updatePerformanceMetrics: (metrics) => {
            set((state) => {
              state.performance.current = metrics;
              state.performance.history.push({
                timestamp: Date.now(),
                metrics: { ...metrics }
              });

              // Keep only last 1000 samples
              if (state.performance.history.length > 1000) {
                state.performance.history = state.performance.history.slice(-1000);
              }
            });
          },

          addPerformanceAlert: (alert) => {
            set((state) => {
              state.performance.alerts.push({
                ...alert,
                timestamp: Date.now(),
                resolved: false
              });
            });
          },

          resolvePerformanceAlert: (alertIndex) => {
            set((state) => {
              if (state.performance.alerts[alertIndex]) {
                state.performance.alerts[alertIndex].resolved = true;
              }
            });
          },

          enableProfiling: () => {
            set((state) => {
              state.performance.profiling.enabled = true;
            });
          },

          disableProfiling: () => {
            set((state) => {
              state.performance.profiling.enabled = false;
              state.performance.profiling.samples = [];
            });
          },

          addProfileSample: (sample) => {
            set((state) => {
              if (state.performance.profiling.enabled) {
                state.performance.profiling.samples.push({
                  timestamp: Date.now(),
                  ...sample
                });

                // Keep only last 10000 samples
                if (state.performance.profiling.samples.length > 10000) {
                  state.performance.profiling.samples = state.performance.profiling.samples.slice(-10000);
                }
              }
            });
          },

          // Configuration actions
          updateConfiguration: (config) => {
            set((state) => {
              Object.assign(state.configuration, config);
            });
          },

          resetConfiguration: () => {
            set((state) => {
              Object.assign(state.configuration, DEFAULT_CONFIGURATION);
            });
          },

          loadConfiguration: (config) => {
            set((state) => {
              Object.assign(state.configuration, config);
            });
          },

          // Persistence actions
          saveState: () => {
            // This will be handled by the persist middleware
          },

          loadState: () => {
            // This will be handled by the persist middleware
          },

          exportState: () => {
            const state = get();
            return JSON.stringify({
              ants: Array.from(state.ants.entries()),
              colonies: Array.from(state.colonies.entries()),
              environment: {
                ...state.environment,
                pheromoneMap: Array.from(state.environment.pheromoneMap.entries())
              },
              configuration: state.configuration
            }, null, 2);
          },

          importState: (stateJson) => {
            try {
              const importedState = JSON.parse(stateJson);
              set((state) => {
                // Clear existing data
                state.ants.clear();
                state.colonies.clear();

                // Import ants
                if (importedState.ants) {
                  importedState.ants.forEach(([id, ant]: [string, AntEntity]) => {
                    state.ants.set(id, ant);
                  });
                }

                // Import colonies
                if (importedState.colonies) {
                  importedState.colonies.forEach(([id, colony]: [string, ColonyState]) => {
                    state.colonies.set(id, colony);
                  });
                }

                // Import environment
                if (importedState.environment) {
                  Object.assign(state.environment, importedState.environment);
                  if (importedState.environment.pheromoneMap) {
                    state.environment.pheromoneMap = new Map(importedState.environment.pheromoneMap);
                  }
                }

                // Import configuration
                if (importedState.configuration) {
                  state.configuration = importedState.configuration;
                }
              });
            } catch (error) {
              console.error('Failed to import state:', error);
            }
          },

          // Performance optimization actions
          cleanup: () => {
            set((state) => {
              // Remove old notifications
              const cutoffTime = Date.now() - 30000; // 30 seconds
              state.ui.notifications = state.ui.notifications.filter(n => n.timestamp > cutoffTime);

              // Remove resolved alerts older than 5 minutes
              const alertCutoff = Date.now() - 300000;
              state.performance.alerts = state.performance.alerts.filter(a => !a.resolved || a.timestamp > alertCutoff);

              // Limit performance history
              if (state.performance.history.length > 1000) {
                state.performance.history = state.performance.history.slice(-1000);
              }
            });
          },

          resetPerformanceHistory: () => {
            set((state) => {
              state.performance.history = [];
              state.performance.alerts = [];
              state.performance.profiling.samples = [];
            });
          },

          optimizeMemory: () => {
            const state = get();
            
            // Run cleanup
            state.cleanup();

            // Force garbage collection if available
            if ('gc' in window && typeof (window as any).gc === 'function') {
              (window as any).gc();
            }

            // Add memory optimization notification
            state.addNotification({
              type: 'info',
              message: 'Memory optimization completed',
              duration: 3000
            });
          }
        }))
      ),
      {
        name: 'myants-simulation-store',
        partialize: (state) => ({
          // Only persist essential state, not runtime data
          configuration: state.configuration,
          environment: {
            ...state.environment,
            pheromoneMap: new Map() // Don't persist pheromones
          },
          ui: {
            ...state.ui,
            notifications: [], // Don't persist notifications
            modal: undefined
          }
        })
      }
    ),
    {
      name: 'MyAnts Simulation Store'
    }
  )
);

// ============================================================================
// Utility Hooks and Selectors
// ============================================================================

// Performance-optimized selectors
export const useAnts = () => useMyAntsStore(state => state.ants);
export const useAntCount = () => useMyAntsStore(state => state.ants.size);
export const useSelectedAnts = () => useMyAntsStore(state => state.getSelectedAnts());
export const useSimulationRunning = () => useMyAntsStore(state => state.simulation.isRunning);
export const usePerformanceMetrics = () => useMyAntsStore(state => state.performance.current);
export const useConfiguration = () => useMyAntsStore(state => state.configuration);

// Computed selectors
export const useAntsByColony = (colonyId: string) => {
  return useMyAntsStore(state => {
    const ants: AntEntity[] = [];
    state.ants.forEach(ant => {
      // Assuming ants have colony association logic
      ants.push(ant);
    });
    return ants;
  });
};

export const usePerformanceStats = () => {
  return useMyAntsStore(state => {
    const history = state.performance.history;
    if (history.length === 0) return null;

    const recent = history.slice(-60); // Last 60 samples
    const avgFPS = recent.reduce((sum, h) => sum + h.metrics.fps, 0) / recent.length;
    const avgMemory = recent.reduce((sum, h) => sum + h.metrics.memoryUsage, 0) / recent.length;
    const minFPS = Math.min(...recent.map(h => h.metrics.fps));
    const maxFPS = Math.max(...recent.map(h => h.metrics.fps));

    return {
      avgFPS: Math.round(avgFPS),
      avgMemory: Math.round(avgMemory),
      minFPS: Math.round(minFPS),
      maxFPS: Math.round(maxFPS),
      sampleCount: recent.length
    };
  });
};

// Export store instance for direct access when needed
export const myAntsStore = useMyAntsStore;