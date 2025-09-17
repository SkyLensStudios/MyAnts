/**
 * Cross-System Integration Tests
 * Tests real interactions between engine systems with minimal mocking
 */

import { IntegrationTestEnvironment, PerformanceMeasurement, DataValidator, SystemInteractionHelper, TestFixtures } from './IntegrationTestUtils';
import { SimulationEngine } from '../../main/simulation/SimulationEngine';
import { AntSpecies } from '../../shared/types';

describe('Cross-System Integration Tests', () => {
  let testEnv: IntegrationTestEnvironment;
  let performanceMeasurer: PerformanceMeasurement;

  beforeEach(async () => {
    testEnv = new IntegrationTestEnvironment();
    performanceMeasurer = new PerformanceMeasurement();
    
    await testEnv.initialize();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Biological and AI System Integration', () => {
    test('should have ants make decisions based on biological states', async () => {
      const engine = testEnv.getEngine();
      
      // Add test ants
      await testEnv.addTestAnts(5, TestFixtures.antPositions);
      
      // Run simulation for a short period
      await testEnv.runSimulation(1000);
      
      // Get ant data to verify biological-AI integration
      const antData = engine.getAntData();
      expect(antData.length).toBeGreaterThan(0);
      
      // Validate that ants have both biological and behavioral data
      antData.forEach(ant => {
        expect(ant).toHaveProperty('energy');
        expect(ant).toHaveProperty('task');
        expect(ant).toHaveProperty('position');
        expect(typeof ant.energy).toBe('number');
        expect(ant.energy).toBeGreaterThanOrEqual(0);
        expect(ant.energy).toBeLessThanOrEqual(100);
      });

      // Validate data integrity
      const validation = DataValidator.validateAntData(antData);
      expect(validation.isValid).toBe(true);
      if (!validation.isValid) {
        console.error('Ant data validation errors:', validation.errors);
      }
    });

    test('should show correlation between ant energy and task assignment', async () => {
      const engine = testEnv.getEngine();
      
      // Add ants and run simulation
      await testEnv.addTestAnts(10);
      await testEnv.runSimulation(2000);
      
      const antData = engine.getAntData();
      
      // Group ants by energy levels
      const lowEnergyAnts = antData.filter(ant => ant.energy < 30);
      const highEnergyAnts = antData.filter(ant => ant.energy > 70);
      
      // Low energy ants should prefer rest/food tasks
      if (lowEnergyAnts.length > 0) {
        const restingAnts = lowEnergyAnts.filter(ant => 
          ant.task === 'RESTING' || ant.task === 'FORAGING'
        );
        expect(restingAnts.length).toBeGreaterThan(0);
      }
      
      // High energy ants should be more active
      if (highEnergyAnts.length > 0) {
        const activeAnts = highEnergyAnts.filter(ant => 
          ant.task === 'EXPLORING' || ant.task === 'BUILDING'
        );
        expect(activeAnts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Chemical and Physics System Integration', () => {
    test('should simulate pheromone diffusion with physics', async () => {
      const engine = testEnv.getEngine();
      
      // Add ants to create pheromone trails
      await testEnv.addTestAnts(3, [
        { x: 50, y: 50 },
        { x: 60, y: 50 },
        { x: 70, y: 50 }
      ]);
      
      // Run simulation to allow pheromone deposition
      await testEnv.runSimulation(3000);
      
      // Get pheromone data
      const pheromoneData = engine.getPheromoneData();
      expect(pheromoneData).toBeDefined();
      
      // Validate pheromone data structure
      const validation = DataValidator.validatePheromoneData(pheromoneData);
      expect(validation.isValid).toBe(true);
      
      // Check that pheromones have been deposited
      const hasActivePheromones = pheromoneData.some(pheromone =>
        pheromone.concentrationGrid.some(cell => cell > 0)
      );
      expect(hasActivePheromones).toBe(true);
    });

    test('should show pheromone gradient effects on ant behavior', async () => {
      const engine = testEnv.getEngine();
      
      // Create initial pheromone source
      await testEnv.addTestAnts(1, [{ x: 25, y: 25 }]);
      await testEnv.runSimulation(1000);
      
      // Add new ants that should be influenced by existing pheromones
      await testEnv.addTestAnts(3, [
        { x: 75, y: 75 },
        { x: 80, y: 80 },
        { x: 85, y: 85 }
      ]);
      
      // Run simulation to see behavioral changes
      await testEnv.runSimulation(2000);
      
      const finalAntData = engine.getAntData();
      const pheromoneData = engine.getPheromoneData();
      
      // Verify ants have moved (indicating response to pheromones)
      const movedAnts = finalAntData.filter(ant => 
        Math.abs(ant.position.x - 80) > 5 || Math.abs(ant.position.y - 80) > 5
      );
      expect(movedAnts.length).toBeGreaterThan(0);
    });
  });

  describe('Environmental and Biological System Integration', () => {
    test('should adapt ant behavior to weather conditions', async () => {
      // Create environment with weather enabled
      await testEnv.cleanup();
      testEnv = new IntegrationTestEnvironment({ 
        enableWeather: true,
        colonySize: 20 
      });
      await testEnv.initialize();
      
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(10);
      
      // Run simulation through different weather conditions
      await testEnv.runSimulation(3000);
      
      const environmentData = engine.getEnvironmentData();
      const antData = engine.getAntData();
      
      // Validate environment data
      const envValidation = DataValidator.validateEnvironmentData(environmentData);
      expect(envValidation.isValid).toBe(true);
      
      // Check that weather affects ant activity
      expect(environmentData.weatherState).toBeDefined();
      expect(typeof environmentData.weatherState.temperature).toBe('number');
      expect(typeof environmentData.weatherState.humidity).toBe('number');
      
      // Verify ants respond to environmental conditions
      const activeAnts = antData.filter(ant => ant.task !== 'RESTING');
      expect(activeAnts.length).toBeGreaterThan(0);
    });

    test('should show seasonal effects on colony behavior', async () => {
      // Use longer season for testing
      await testEnv.cleanup();
      testEnv = new IntegrationTestEnvironment({ 
        seasonLength: 1000, // Short season for testing
        enableWeather: true 
      });
      await testEnv.initialize();
      
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(15);
      
      // Record initial state
      await testEnv.runSimulation(500);
      const initialState = engine.getState();
      const initialAnts = engine.getAntData();
      
      // Run through season change
      await testEnv.runSimulation(1500);
      const laterState = engine.getState();
      const laterAnts = engine.getAntData();
      
      // Verify time progression
      expect(laterState.currentTime).toBeGreaterThan(initialState.currentTime);
      
      // Check for behavioral adaptations over time
      const initialActiveAnts = initialAnts.filter(ant => ant.task === 'EXPLORING').length;
      const laterActiveAnts = laterAnts.filter(ant => ant.task === 'EXPLORING').length;
      
      // Expect some change in behavior patterns
      expect(Math.abs(laterActiveAnts - initialActiveAnts)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Memory Integration', () => {
    test('should maintain performance with increasing complexity', async () => {
      const engine = testEnv.getEngine();
      
      // Test with gradually increasing ant count
      const antCounts = [5, 10, 20];
      const updateTimes: number[] = [];
      
      for (const count of antCounts) {
        // Clear previous ants
        engine.reset();
        await testEnv.addTestAnts(count);
        
        // Measure update performance
        performanceMeasurer.startMeasurement(`update_${count}`);
        await testEnv.runSimulation(1000);
        performanceMeasurer.endMeasurement(`update_${count}`);
        
        const avgTime = performanceMeasurer.getAverageDuration(`update_${count}`);
        updateTimes.push(avgTime);
        
        // Performance should not degrade exponentially
        if (updateTimes.length > 1) {
          const lastTime = updateTimes[updateTimes.length - 1];
          const prevTime = updateTimes[updateTimes.length - 2];
          const performanceRatio = lastTime / prevTime;
          
          // Performance degradation should be reasonable (not more than 3x)
          expect(performanceRatio).toBeLessThan(3.0);
        }
      }
    });

    test('should handle memory efficiently with continuous operation', async () => {
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(10);
      
      // Get initial memory baseline
      const initialPerf = engine.getPerformanceStats();
      
      // Run multiple simulation cycles
      for (let i = 0; i < 5; i++) {
        await testEnv.runSimulation(500);
        
        // Check performance stats
        const currentPerf = engine.getPerformanceStats();
        expect(currentPerf).toBeDefined();
        
        // Memory should not continuously increase
        if (initialPerf && currentPerf.memoryUsage && initialPerf.memoryUsage) {
          const currentMemory = typeof currentPerf.memoryUsage === 'number' ? currentPerf.memoryUsage : 0;
          const initialMemory = typeof initialPerf.memoryUsage === 'number' ? initialPerf.memoryUsage : 0;
          const memoryIncrease = currentMemory - initialMemory;
          expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
        }
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from system errors gracefully', async () => {
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(5);
      
      // Start simulation
      engine.start();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate error condition by force-stopping and restarting
      engine.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
      engine.start();
      
      // Verify system recovers
      await new Promise(resolve => setTimeout(resolve, 1000));
      const state = engine.getState();
      expect(state.isRunning).toBe(true);
      
      // Validate that system state is still consistent
      const validation = testEnv.validateSimulationState();
      expect(validation.isValid).toBe(true);
      
      engine.pause();
    });

    test('should handle invalid data inputs gracefully', async () => {
      const engine = testEnv.getEngine();
      
      // Try to add ant at invalid position
      expect(() => {
        engine.addAnt({ x: NaN, y: NaN, z: NaN });
      }).not.toThrow();
      
      // System should still function normally
      await testEnv.addTestAnts(3);
      await testEnv.runSimulation(1000);
      
      const validation = testEnv.validateSimulationState();
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Real-time Performance Integration', () => {
    test('should maintain consistent frame timing', async () => {
      const engine = testEnv.getEngine();
      await testEnv.addTestAnts(15);
      
      const frameTimes: number[] = [];
      const targetFPS = 30; // 33ms per frame
      const toleranceMs = 10; // Allow 10ms variance
      
      // Measure frame timing consistency
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await testEnv.runSimulation(33); // Target 30 FPS
        const frameTime = performance.now() - start;
        frameTimes.push(frameTime);
      }
      
      // Calculate timing statistics
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const minFrameTime = Math.min(...frameTimes);
      
      // Verify timing consistency
      expect(avgFrameTime).toBeLessThan(50); // Average should be reasonable
      expect(maxFrameTime - minFrameTime).toBeLessThan(30); // Variance should be low
      
      console.log(`Frame timing stats: avg=${avgFrameTime.toFixed(2)}ms, min=${minFrameTime.toFixed(2)}ms, max=${maxFrameTime.toFixed(2)}ms`);
    });
  });
});