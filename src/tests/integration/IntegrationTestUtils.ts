/**
 * Integration Test Utilities
 * Provides common utilities and helpers for integration testing with minimal mocking
 */

import { SimulationEngine } from '../../main/simulation/SimulationEngine';
import { AntSpecies, SimulationConfig } from '../../shared/types';

// Real configuration for integration tests
export const createTestConfiguration = (overrides: Partial<SimulationConfig> = {}): SimulationConfig => ({
  timeScale: 1.0,
  colonySize: 50, // Smaller for faster testing
  environmentSize: 1000,
  seasonLength: 3600, // 1 hour for faster testing
  speciesType: AntSpecies.LEAFCUTTER,
  complexityLevel: 2, // Medium complexity
  enablePhysics: true,
  enableWeather: true,
  enableGenetics: true,
  enableLearning: true,
  maxAnts: 100,
  worldSeed: 42, // Deterministic for testing
  ...overrides
});

// Test environment setup with minimal mocking
export class IntegrationTestEnvironment {
  private simulationEngine: SimulationEngine;
  private config: SimulationConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<SimulationConfig>) {
    this.config = createTestConfiguration(config);
    this.simulationEngine = new SimulationEngine();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure with test settings
      this.simulationEngine.configure(this.config);
      
      // Initialize with reduced complexity for testing
      await this.simulationEngine.initialize();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize integration test environment:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.simulationEngine) {
      this.simulationEngine.stop();
    }
    this.isInitialized = false;
  }

  getEngine(): SimulationEngine {
    if (!this.isInitialized) {
      throw new Error('Test environment not initialized. Call initialize() first.');
    }
    return this.simulationEngine;
  }

  // Helper to run simulation for a specific duration
  async runSimulation(durationMs: number): Promise<void> {
    const engine = this.getEngine();
    engine.start();
    
    // Wait real time to allow async operations, and advance mocked time so performance.now() moves
    await new Promise(resolve => setTimeout(resolve, durationMs));
    if (typeof (global as any).advanceMockTime === 'function') {
      (global as any).advanceMockTime(durationMs);
    }
    
    engine.pause();
  }

  // Helper to add test ants at specific positions
  async addTestAnts(count: number, positions?: Array<{x: number, y: number}>): Promise<void> {
    const engine = this.getEngine();
    
    if (positions) {
      for (const pos of positions.slice(0, count)) {
        await engine.addAnt({ x: pos.x, y: pos.y, z: 0 });
      }
    } else {
      // Add ants in a grid pattern for predictable testing
      const gridSize = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const x = (i % gridSize) * 10;
        const y = Math.floor(i / gridSize) * 10;
        await engine.addAnt({ x, y, z: 0 });
      }
    }
  }

  // Helper to validate simulation state
  validateSimulationState(): {
    isValid: boolean;
    issues: string[];
  } {
    const engine = this.getEngine();
    const state = engine.getState();
    const issues: string[] = [];

    // Basic state validation
    if (state.totalAnts < 0) {
      issues.push('Negative ant count detected');
    }

    if (state.currentTime < 0) {
      issues.push('Negative simulation time detected');
    }

    // Performance validation
    const performance = engine.getPerformanceStats();
    if (performance && performance.fps < 1) {
      issues.push('Extremely low FPS detected');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Performance measurement utilities
export class PerformanceMeasurement {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(performance.now());
  }

  endMeasurement(name: string): number {
    const times = this.measurements.get(name);
    if (!times || times.length === 0) {
      throw new Error(`No measurement started for '${name}'`);
    }

    const startTime = times[times.length - 1];
    const duration = performance.now() - startTime;
    times[times.length - 1] = duration;
    
    return duration;
  }

  getAverageDuration(name: string): number {
    const times = this.measurements.get(name);
    if (!times || times.length === 0) {
      return 0;
    }

    const validTimes = times.filter(t => t > 0);
    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }

  getStatistics(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    const times = this.measurements.get(name);
    if (!times || times.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    const validTimes = times.filter(t => t > 0);
    return {
      average: validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length,
      min: Math.min(...validTimes),
      max: Math.max(...validTimes),
      count: validTimes.length
    };
  }

  reset(): void {
    this.measurements.clear();
  }
}

// Data validation utilities
export class DataValidator {
  static validateAntData(antData: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(antData)) {
      errors.push('Ant data is not an array');
      return { isValid: false, errors };
    }

    antData.forEach((ant, index) => {
      if (typeof ant.x !== 'number' || typeof ant.y !== 'number') {
        errors.push(`Ant ${index}: Invalid position coordinates`);
      }

      if (typeof ant.energy !== 'number' || ant.energy < 0 || ant.energy > 100) {
        errors.push(`Ant ${index}: Invalid energy level`);
      }

      if (!ant.id || typeof ant.id !== 'string') {
        errors.push(`Ant ${index}: Missing or invalid ID`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  static validatePheromoneData(pheromoneData: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(pheromoneData)) {
      errors.push('Pheromone data is not an array');
      return { isValid: false, errors };
    }

    pheromoneData.forEach((pheromone, index) => {
      if (!pheromone.concentrationGrid || !(pheromone.concentrationGrid instanceof Float32Array)) {
        errors.push(`Pheromone ${index}: Invalid concentration grid`);
      }

      if (typeof pheromone.width !== 'number' || typeof pheromone.height !== 'number') {
        errors.push(`Pheromone ${index}: Invalid dimensions`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  static validateEnvironmentData(envData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!envData || typeof envData !== 'object') {
      errors.push('Environment data is not an object');
      return { isValid: false, errors };
    }

    if (!envData.weatherState || typeof envData.weatherState !== 'object') {
      errors.push('Weather state is missing or invalid');
    }

    if (!Array.isArray(envData.foodSources)) {
      errors.push('Food sources data is missing or invalid');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// System interaction helpers
export class SystemInteractionHelper {
  static async testSystemCommunication(
    systemA: any,
    systemB: any,
    testData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Test if systemA can send data to systemB
      if (typeof systemA.sendData === 'function' && typeof systemB.receiveData === 'function') {
        await systemA.sendData(testData);
        const received = await systemB.receiveData();
        
        return {
          success: JSON.stringify(received) === JSON.stringify(testData)
        };
      }

      return { success: false, error: 'Systems do not support communication interface' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async waitForCondition(
    condition: () => boolean,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return false;
  }
}

// Enhanced test fixtures
export const TestFixtures = {
  // Standard test positions for predictable testing
  antPositions: [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 0 },
    { x: 30, y: 10 },
    { x: 0, y: 20 },
  ],

  // Test environment configurations
  environments: {
    minimal: createTestConfiguration({
      colonySize: 10,
      environmentSize: 500,
      enableWeather: false,
      enableGenetics: false,
    }),
    standard: createTestConfiguration(),
    complex: createTestConfiguration({
      colonySize: 200,
      environmentSize: 2000,
      complexityLevel: 3,
    })
  },

  // Performance thresholds for integration tests
  performanceThresholds: {
    initialization: 2000, // 2 seconds
    antUpdate: 16, // 16ms (60fps)
    pheromoneUpdate: 33, // 33ms (30fps)
    renderFrame: 16, // 16ms (60fps)
  }
};