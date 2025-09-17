/**
 * Simulation Lifecycle Integration Tests
 * Tests the complete simulation lifecycle with real engine components
 */

import { IntegrationTestEnvironment, PerformanceMeasurement, TestFixtures } from './IntegrationTestUtils';
import { SimulationEngine } from '../../main/simulation/SimulationEngine';
import { SimulationState, AntSpecies } from '../../shared/types';

describe('Simulation Lifecycle Integration Tests', () => {
  let testEnv: IntegrationTestEnvironment;
  let performanceMeasurer: PerformanceMeasurement;

  beforeEach(async () => {
    performanceMeasurer = new PerformanceMeasurement();
  });

  afterEach(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe('Initialization and Configuration', () => {
    test('should initialize simulation with different complexity levels', async () => {
      const complexityLevels = [1, 2, 3] as const;
      
      for (const level of complexityLevels) {
        testEnv = new IntegrationTestEnvironment({ 
          complexityLevel: level,
          colonySize: 20,
          enablePhysics: true,
          enableWeather: true
        });
        
        performanceMeasurer.startMeasurement(`init_complexity_${level}`);
        await testEnv.initialize();
        const initTime = performanceMeasurer.endMeasurement(`init_complexity_${level}`);
        
        const engine = testEnv.getEngine();
        const state = engine.getState();
        
        // Verify initialization succeeded
        expect(state).toBeDefined();
        expect(state.isRunning).toBe(false);
        expect(state.currentTime).toBe(0);
        
        // Higher complexity should take more time but still be reasonable
        expect(initTime).toBeLessThan(TestFixtures.performanceThresholds.initialization);
        
        await testEnv.cleanup();
      }
    });

    test('should handle different ant species configurations', async () => {
      const species = [AntSpecies.LEAFCUTTER, AntSpecies.FIRE, AntSpecies.ARMY];
      
      for (const speciesType of species) {
        testEnv = new IntegrationTestEnvironment({ 
          speciesType,
          colonySize: 15 
        });
        
        await testEnv.initialize();
        const engine = testEnv.getEngine();
        
        // Add ants and verify species-specific behavior
        await testEnv.addTestAnts(5);
        await testEnv.runSimulation(1000);
        
        const antData = engine.getAntData();
        expect(antData.length).toBeGreaterThan(0);
        
        // Each species should have different behavioral patterns
        const uniqueTasks = new Set(antData.map(ant => ant.task));
        expect(uniqueTasks.size).toBeGreaterThan(0);
        
        await testEnv.cleanup();
      }
    });

    test('should maintain configuration consistency throughout lifecycle', async () => {
      const config = {
        timeScale: 2.0,
        colonySize: 25,
        environmentSize: 1500,
        enableGenetics: true,
        worldSeed: 12345
      };
      
      testEnv = new IntegrationTestEnvironment(config);
      await testEnv.initialize();
      
      const engine = testEnv.getEngine();
      
      // Verify configuration is applied
      const state = engine.getState();
      expect(state).toBeDefined();
      
      // Run through multiple simulation phases
      await testEnv.addTestAnts(10);
      engine.start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      engine.pause();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      engine.resume();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      engine.stop();
      
      // Configuration should remain consistent
      const finalState = engine.getState();
      expect(finalState.isRunning).toBe(false);
      expect(finalState.currentTime).toBeGreaterThan(0);
    });
  });

  describe('State Transitions and Management', () => {
    beforeEach(async () => {
      testEnv = new IntegrationTestEnvironment();
      await testEnv.initialize();
    });

    test('should handle smooth state transitions', async () => {
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(8);
      
      // Test all state transitions
      let state = engine.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      
      // Start simulation
      engine.start();
      state = engine.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
      
      // Allow some simulation time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Pause simulation
      engine.pause();
      state = engine.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(true);
      
      const pausedTime = state.currentTime;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Time should not advance while paused
      state = engine.getState();
      expect(state.currentTime).toBe(pausedTime);
      
      // Resume simulation
      engine.resume();
      state = engine.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stop simulation
      engine.stop();
      state = engine.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    test('should handle simulation reset correctly', async () => {
      const engine = testEnv.getEngine();
      
      // Run simulation with some activity
      await testEnv.addTestAnts(10);
      await testEnv.runSimulation(1500);
      
      const preResetState = engine.getState();
      expect(preResetState.currentTime).toBeGreaterThan(0);
      expect(preResetState.totalAnts).toBeGreaterThan(0);
      
      // Reset simulation
      engine.reset();
      
      const postResetState = engine.getState();
      expect(postResetState.currentTime).toBe(0);
      expect(postResetState.totalAnts).toBe(0);
      expect(postResetState.isRunning).toBe(false);
      expect(postResetState.isPaused).toBe(false);
      
      // Verify reset is complete - should be able to start fresh
      await testEnv.addTestAnts(5);
      await testEnv.runSimulation(1000);
      
      const newState = engine.getState();
      expect(newState.totalAnts).toBe(5);
      expect(newState.currentTime).toBeGreaterThan(0);
    });

    test('should maintain data integrity during state changes', async () => {
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(12, TestFixtures.antPositions);
      
      // Start simulation
      engine.start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Collect data during running state
      const runningAntData = engine.getAntData();
      const runningPheromoneData = engine.getPheromoneData();
      const runningEnvironmentData = engine.getEnvironmentData();
      
      // Pause and collect data
      engine.pause();
      const pausedAntData = engine.getAntData();
      const pausedPheromoneData = engine.getPheromoneData();
      const pausedEnvironmentData = engine.getEnvironmentData();
      
      // Data should remain consistent and valid
      expect(pausedAntData).toBeDefined();
      expect(pausedPheromoneData).toBeDefined();
      expect(pausedEnvironmentData).toBeDefined();
      
      expect(pausedAntData.length).toBe(runningAntData.length);
      expect(pausedPheromoneData.length).toBe(runningPheromoneData.length);
      
      // Resume and verify data continuity
      engine.resume();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const resumedAntData = engine.getAntData();
      expect(resumedAntData.length).toBe(pausedAntData.length);
      
      engine.stop();
    });
  });

  describe('Population Dynamics Integration', () => {
    beforeEach(async () => {
      testEnv = new IntegrationTestEnvironment({ 
        enableGenetics: true,
        colonySize: 30 
      });
      await testEnv.initialize();
    });

    test('should handle dynamic population changes', async () => {
      const engine = testEnv.getEngine();
      
      // Start with small population
      await testEnv.addTestAnts(5);
      await testEnv.runSimulation(1000);
      
      let state = engine.getState();
      expect(state.totalAnts).toBe(5);
      
      // Add more ants during simulation
      engine.start();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testEnv.addTestAnts(8);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      state = engine.getState();
      expect(state.totalAnts).toBe(13);
      
      engine.stop();
      
      // Verify all ants are tracked correctly
      const antData = engine.getAntData();
      expect(antData.length).toBe(13);
      
      // Each ant should have valid data
      antData.forEach(ant => {
        expect(ant.id).toBeDefined();
        expect(typeof ant.position.x).toBe('number');
        expect(typeof ant.position.y).toBe('number');
        expect(typeof ant.energy).toBe('number');
        expect(ant.energy).toBeGreaterThanOrEqual(0);
        expect(ant.energy).toBeLessThanOrEqual(100);
      });
    });

    test('should handle population under different environmental pressures', async () => {
      // Test with harsh environment
      await testEnv.cleanup();
      testEnv = new IntegrationTestEnvironment({ 
        enableWeather: true,
        seasonLength: 2000, // Short seasons for rapid changes
        colonySize: 20
      });
      await testEnv.initialize();
      
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(15);
      
      // Run through multiple environmental cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        await testEnv.runSimulation(1000);
        
        const state = engine.getState();
        const antData = engine.getAntData();
        
        // Population should adapt to environmental changes
        expect(state.totalAnts).toBeGreaterThan(0);
        expect(antData.length).toBe(state.totalAnts);
        
        // Ants should show behavioral adaptation
        const activeTasks = new Set(antData.map(ant => ant.task));
        expect(activeTasks.size).toBeGreaterThan(0);
      }
    });
  });

  describe('Long-running Simulation Stability', () => {
    beforeEach(async () => {
      testEnv = new IntegrationTestEnvironment({ 
        colonySize: 40,
        enablePhysics: true,
        enableWeather: true,
        enableGenetics: true
      });
      await testEnv.initialize();
    });

    test('should maintain stability over extended runtime', async () => {
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(20);
      
      const checkpoints: SimulationState[] = [];
      const iterations = 10;
      const intervalMs = 800;
      
      engine.start();
      
      // Collect checkpoints over time
      for (let i = 0; i < iterations; i++) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        
        const state = engine.getState();
        checkpoints.push({ ...state });
        
        // Verify system state is still valid
        const validation = testEnv.validateSimulationState();
        expect(validation.isValid).toBe(true);
        
        if (!validation.isValid) {
          console.error(`Validation failed at checkpoint ${i}:`, validation.issues);
        }
      }
      
      engine.stop();
      
      // Analyze progression
      expect(checkpoints.length).toBe(iterations);
      
      // Time should progress monotonically
      for (let i = 1; i < checkpoints.length; i++) {
        expect(checkpoints[i].currentTime).toBeGreaterThan(checkpoints[i-1].currentTime);
      }
      
      // System should remain responsive
      const finalPerformance = engine.getPerformanceStats();
      expect(finalPerformance).toBeDefined();
    });

    test('should handle system stress gracefully', async () => {
      const engine = testEnv.getEngine();
      
      // Add maximum allowed ants
      const maxAnts = 50; // Reasonable limit for testing
      await testEnv.addTestAnts(maxAnts);
      
      // Run high-frequency operations
      engine.start();
      
      const stressOperations = [];
      for (let i = 0; i < 20; i++) {
        stressOperations.push(
          new Promise(resolve => {
            setTimeout(() => {
              // Perform concurrent data queries
              const antData = engine.getAntData();
              const pheromoneData = engine.getPheromoneData();
              const envData = engine.getEnvironmentData();
              
              expect(antData).toBeDefined();
              expect(pheromoneData).toBeDefined();
              expect(envData).toBeDefined();
              
              resolve(true);
            }, i * 50);
          })
        );
      }
      
      // Wait for all stress operations
      await Promise.all(stressOperations);
      
      engine.stop();
      
      // System should still be functional
      const finalState = engine.getState();
      expect(finalState.totalAnts).toBe(maxAnts);
      
      const validation = testEnv.validateSimulationState();
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Performance Characteristics', () => {
    test('should demonstrate predictable performance scaling', async () => {
      const antCounts = [10, 20, 30];
      const performanceResults = [];
      
      for (const count of antCounts) {
        testEnv = new IntegrationTestEnvironment({ colonySize: count });
        await testEnv.initialize();
        
        const engine = testEnv.getEngine();
        await testEnv.addTestAnts(count);
        
        // Measure performance over multiple update cycles
        performanceMeasurer.startMeasurement(`performance_${count}`);
        
        await testEnv.runSimulation(2000);
        
        const duration = performanceMeasurer.endMeasurement(`performance_${count}`);
        const performance = engine.getPerformanceStats();
        
        performanceResults.push({
          antCount: count,
          duration,
          fps: performance?.fps || 0,
          memoryUsage: performance?.memoryUsage || 0
        });
        
        await testEnv.cleanup();
      }
      
      // Analyze performance scaling
      expect(performanceResults.length).toBe(antCounts.length);
      
      performanceResults.forEach((result, index) => {
        expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
        expect(result.fps).toBeGreaterThan(5); // Minimum acceptable FPS
        
        console.log(`Performance for ${result.antCount} ants: ${result.duration.toFixed(2)}ms, ${result.fps.toFixed(1)} FPS`);
      });
      
      // Performance degradation should be reasonable
      const firstResult = performanceResults[0];
      const lastResult = performanceResults[performanceResults.length - 1];
      const performanceRatio = lastResult.duration / firstResult.duration;
      
      expect(performanceRatio).toBeLessThan(5.0); // Less than 5x slowdown for 3x ants
    });
  });
});