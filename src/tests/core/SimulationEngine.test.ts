/**
 * Core Simulation Engine Tests
 * Tests for SimulationEngine lifecycle, state management, and basic operations
 */

import { SimulationEngine } from '../../main/simulation/SimulationEngine';
import { AntEntity } from '../../main/simulation/AntEntity';
import { SimulationConfig, SimulationState, AntSpecies } from '../../shared/types';
import { AntCaste } from '@engine/colony/casteSystem';

// Mock dependencies
jest.mock('../../main/simulation/SharedBufferManager');
jest.mock('../../main/simulation/FoodSourceSystem');
jest.mock('../../main/performance/SpatialOptimizationIntegration');

describe('SimulationEngine Core Tests', () => {
  let simulationEngine: SimulationEngine;

  beforeEach(() => {
    simulationEngine = new SimulationEngine();
  });

  afterEach(() => {
    if (simulationEngine) {
      simulationEngine.stop();
    }
  });

  describe('Initialization and Configuration', () => {
    test('should initialize with default configuration', () => {
      expect(simulationEngine).toBeDefined();
      
      const state = simulationEngine.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.totalAnts).toBe(0);
    });

    test('should accept custom configuration', () => {
      const config: SimulationConfig = {
        timeScale: 2.0,
        colonySize: 1000,
        environmentSize: 20000,
        seasonLength: 172800,
        speciesType: AntSpecies.LEAFCUTTER,
        complexityLevel: 3,
        enablePhysics: true,
        enableWeather: true,
        enableGenetics: true,
        enableLearning: true,
        maxAnts: 2000,
        worldSeed: 42
      };

      simulationEngine.configure(config);
      // Configuration should be accepted without errors
      expect(() => simulationEngine.configure(config)).not.toThrow();
    });

    test('should initialize simulation systems', async () => {
      await expect(simulationEngine.initialize()).resolves.not.toThrow();
    });
  });

  describe('Simulation Lifecycle', () => {
    beforeEach(async () => {
      await simulationEngine.initialize();
    });

    test('should start simulation successfully', () => {
      simulationEngine.start();
      
      const state = simulationEngine.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    test('should pause and resume simulation', () => {
      simulationEngine.start();
      simulationEngine.pause();
      
      let state = simulationEngine.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(true);
      
      simulationEngine.resume();
      state = simulationEngine.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    test('should stop simulation', () => {
      simulationEngine.start();
      simulationEngine.stop();
      
      const state = simulationEngine.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    test('should reset simulation state', () => {
      simulationEngine.start();
      simulationEngine.reset();
      
      const state = simulationEngine.getState();
      expect(state.isRunning).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.totalAnts).toBe(0);
    });

    test('should handle time scale changes', () => {
      const originalSpeed = 1.0;
      const newSpeed = 2.5;
      
      simulationEngine.setSpeed(newSpeed);
      simulationEngine.setTimeScale(newSpeed);
      
      // Should accept speed changes without errors
      expect(() => simulationEngine.setSpeed(newSpeed)).not.toThrow();
    });
  });

  describe('Ant Management', () => {
    beforeEach(async () => {
      await simulationEngine.initialize();
    });

    test('should add ants at specified positions', async () => {
      const position = { x: 100, y: 50, z: 0 };
      const caste = AntCaste.WORKER;
      
      await simulationEngine.addAnt(position, caste);
      
      const antData = simulationEngine.getAntData();
      expect(antData.length).toBeGreaterThan(0);
      
      const addedAnt = antData[0];
      expect(addedAnt.position.x).toBeCloseTo(position.x, 1);
      expect(addedAnt.position.y).toBeCloseTo(position.y, 1);
    });

    test('should get ant count correctly', async () => {
      const initialCount = simulationEngine.getAntCount();
      expect(initialCount).toBe(0);
      
      await simulationEngine.addAnt({ x: 0, y: 0, z: 0 });
      await simulationEngine.addAnt({ x: 10, y: 10, z: 0 });
      
      const newCount = simulationEngine.getAntCount();
      expect(newCount).toBe(2);
    });

    test('should provide ant render data', async () => {
      await simulationEngine.addAnt({ x: 0, y: 0, z: 0 }, AntCaste.WORKER);
      
      const renderData = simulationEngine.getRenderData();
      expect(renderData).toBeDefined();
      expect(renderData.ants).toBeDefined();
      expect(Array.isArray(renderData.ants)).toBe(true);
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await simulationEngine.initialize();
    });

    test('should return valid simulation state', () => {
      const state = simulationEngine.getState();
      
      expect(state).toBeDefined();
      expect(typeof state.isRunning).toBe('boolean');
      expect(typeof state.isPaused).toBe('boolean');
      expect(typeof state.currentTime).toBe('number');
      expect(typeof state.totalAnts).toBe('number');
      expect(typeof state.livingAnts).toBe('number');
      expect(typeof state.temperature).toBe('number');
      expect(typeof state.humidity).toBe('number');
    });

    test('should provide performance statistics', () => {
      const perfStats = simulationEngine.getPerformanceStats();
      
      expect(perfStats).toBeDefined();
      expect(typeof perfStats.fps).toBe('number');
      expect(typeof perfStats.updateTime).toBe('number');
      expect(typeof perfStats.memoryUsage).toBe('number');
    });

    test('should handle simulation updates', async () => {
      simulationEngine.start();
      
      const initialTime = simulationEngine.getState().currentTime;
      
      // Advance mock time
      (global as any).advanceMockTime(16); // ~60 FPS frame
      
      await simulationEngine.update();
      
      const updatedTime = simulationEngine.getState().currentTime;
      expect(updatedTime).toBeGreaterThanOrEqual(initialTime);
    });
  });

  describe('Data Access Methods', () => {
    beforeEach(async () => {
      await simulationEngine.initialize();
      await simulationEngine.addAnt({ x: 0, y: 0, z: 0 });
    });

    test('should provide ant data in correct format', () => {
      const antData = simulationEngine.getAntData();
      
      expect(Array.isArray(antData)).toBe(true);
      
      if (antData.length > 0) {
        const ant = antData[0];
        expect(ant).toHaveProperty('id');
        expect(ant).toHaveProperty('position');
        expect(ant).toHaveProperty('caste');
        expect(ant).toHaveProperty('health');
        expect(ant).toHaveProperty('energy');
      }
    });

    test('should provide pheromone data', () => {
      const pheromoneData = simulationEngine.getPheromoneData();
      
      expect(Array.isArray(pheromoneData)).toBe(true);
    });

    test('should provide environment data', () => {
      const envData = simulationEngine.getEnvironmentData();
      
      expect(envData).toBeDefined();
      expect(typeof envData).toBe('object');
    });

    test('should provide simulation updates', () => {
      const updates = simulationEngine.getUpdates();
      
      expect(updates).toBeDefined();
      expect(updates).toHaveProperty('ants');
      expect(updates).toHaveProperty('environment');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        timeScale: -1,
        colonySize: -100,
        maxAnts: 0
      } as SimulationConfig;
      
      // Should not throw but may log warnings
      expect(() => simulationEngine.configure(invalidConfig)).not.toThrow();
    });

    test('should handle operations on uninitialized engine', () => {
      const uninitializedEngine = new SimulationEngine();
      
      // These operations should not crash
      expect(() => uninitializedEngine.getState()).not.toThrow();
      expect(() => uninitializedEngine.getAntData()).not.toThrow();
      expect(() => uninitializedEngine.getPheromoneData()).not.toThrow();
    });

    test('should handle update errors gracefully', async () => {
      await simulationEngine.initialize();
      simulationEngine.start();
      
      // Update should handle internal errors gracefully
      await expect(simulationEngine.update()).resolves.not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    test('should handle multiple ants efficiently', async () => {
      await simulationEngine.initialize();
      
      const startTime = performance.now();
      
      // Add multiple ants
      for (let i = 0; i < 100; i++) {
        await simulationEngine.addAnt({ 
          x: Math.random() * 1000, 
          y: Math.random() * 1000, 
          z: 0 
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (this is mocked time)
      expect(duration).toBeLessThan(1000);
      expect(simulationEngine.getAntCount()).toBe(100);
    });

    test('should provide shared buffer access', () => {
      const sharedBuffers = simulationEngine.getSharedBuffers();
      
      expect(sharedBuffers).toBeDefined();
    });
  });
});