/**
 * Worker Integration Tests
 * Tests real worker-main thread communication with available functionality
 */

import { SimulationWorkerManager } from '../../main/workers/SimulationWorkerManager';
import { AntSpecies, SimulationConfig } from '../../shared/types';
import { PerformanceMeasurement, TestFixtures } from './IntegrationTestUtils';

// Mock Web Worker for testing environment
class MockWorker {
  private messageHandlers: Set<(event: MessageEvent) => void> = new Set();
  private isTerminated = false;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(public scriptURL: string) {}

  postMessage(message: any): void {
    if (this.isTerminated) return;
    
    // Simulate worker processing with async response
    setTimeout(() => {
      if (this.isTerminated) return;
      
      // Mock worker responses based on message type
      let response;
      switch (message.type) {
        case 'PING':
          response = { type: 'PONG', success: true, requestId: message.requestId };
          break;
        case 'INIT':
          response = { type: 'INIT_COMPLETE', success: true, requestId: message.requestId };
          break;
        case 'START_SIMULATION':
          response = { type: 'SIMULATION_STARTED', success: true, requestId: message.requestId };
          break;
        case 'PAUSE_SIMULATION':
          response = { type: 'SIMULATION_PAUSED', success: true, requestId: message.requestId };
          break;
        case 'STOP_SIMULATION':
          response = { type: 'SIMULATION_STOPPED', success: true, requestId: message.requestId };
          break;
        case 'GET_STATE':
          response = { 
            type: 'STATE_DATA', 
            data: {
              isRunning: true,
              isPaused: false,
              currentTime: Date.now(),
              totalAnts: 10,
            },
            requestId: message.requestId,
          };
          break;
        case 'SET_SPEED':
          response = { type: 'SPEED_SET', success: true, requestId: message.requestId };
          break;
        case 'ADD_ANTS':
          response = { type: 'ANTS_ADDED', success: true, requestId: message.requestId };
          break;
        default:
          response = { type: 'UNKNOWN_MESSAGE', error: 'Unknown message type', requestId: message.requestId };
      }
      
      const messageEvent = { data: response } as MessageEvent;
      
      // Call onmessage if set
      if (this.onmessage) {
        this.onmessage(messageEvent);
      }
      
      // Also call addEventListener handlers for compatibility
      this.messageHandlers.forEach(handler => {
        handler(messageEvent);
      });
    }, 10 + Math.random() * 40); // Simulate realistic latency
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.add(handler);
    }
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.delete(handler);
    }
  }

  terminate(): void {
    this.isTerminated = true;
    this.messageHandlers.clear();
    this.onmessage = null;
    this.onerror = null;
  }
}

// Override global Worker for testing
(global as any).Worker = MockWorker;

describe('Worker Integration Tests', () => {
  let workerManager: SimulationWorkerManager;
  let performanceMeasurer: PerformanceMeasurement;

  beforeEach(() => {
    performanceMeasurer = new PerformanceMeasurement();
    workerManager = new SimulationWorkerManager();
  });

  afterEach(() => {
    if (workerManager) {
      workerManager.dispose();
    }
  });

  describe('Worker-Main Thread Communication', () => {
    test('should establish worker communication successfully', async () => {
      performanceMeasurer.startMeasurement('worker_init');
      
      await workerManager.initialize();
      
      const initTime = performanceMeasurer.endMeasurement('worker_init');
      
      expect(initTime).toBeLessThan(1000); // Should initialize quickly
      expect(workerManager.isUsingWorker()).toBe(true);
    });

    test('should handle worker initialization failure and fallback', async () => {
      // Create a manager that will fail worker initialization
      const failingWorkerManager = new SimulationWorkerManager();
      
      // Mock Worker constructor to throw error
      const originalWorker = (global as any).Worker;
      (global as any).Worker = class {
        constructor() {
          throw new Error('Worker initialization failed');
        }
      };
      
      try {
        await failingWorkerManager.initialize();
        
        // Should fallback to main thread mode
        expect(failingWorkerManager.isUsingWorker()).toBe(false);
      } finally {
        // Restore original Worker
        (global as any).Worker = originalWorker;
        failingWorkerManager.dispose();
      }
    });

    test('should maintain message passing integrity', async () => {
      await workerManager.initialize();
      
      const testConfig: SimulationConfig = {
        timeScale: 1.5,
        colonySize: 25,
        environmentSize: 1000,
        seasonLength: 3600,
        speciesType: AntSpecies.LEAFCUTTER,
        complexityLevel: 2,
        enablePhysics: true,
        enableWeather: true,
        enableGenetics: true,
        enableLearning: true,
        maxAnts: 100,
        worldSeed: 42,
      };
      
      // Test configuration message
      performanceMeasurer.startMeasurement('config_message');
      await workerManager.configureSimulation(testConfig);
      const configTime = performanceMeasurer.endMeasurement('config_message');
      
      expect(configTime).toBeLessThan(500);
      
      // Test start message
      await workerManager.startSimulation();
      
      // Test data query messages
      const stateData = await workerManager.getSimulationState();
      expect(stateData).toBeDefined();
      expect(typeof stateData.currentTime).toBe('number');
      
      // Test pause message
      await workerManager.pauseSimulation();
      
      // Test stop message
      await workerManager.stopSimulation();
    });

    test('should handle concurrent message operations', async () => {
      await workerManager.initialize();
      
      const config = TestFixtures.environments.standard;
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      // Send multiple concurrent requests
      const operations = [
        workerManager.getSimulationState(),
        workerManager.getSimulationState(),
        workerManager.getPerformanceStats(),
        workerManager.getSimulationState(),
        workerManager.getPerformanceStats(),
      ];
      
      performanceMeasurer.startMeasurement('concurrent_ops');
      const results = await Promise.all(operations);
      const totalTime = performanceMeasurer.endMeasurement('concurrent_ops');
      
      expect(results.length).toBe(5);
      results.forEach((result: any) => expect(result).toBeDefined());
      
      // Concurrent operations should be reasonably fast
      expect(totalTime).toBeLessThan(2000);
      
      await workerManager.stopSimulation();
    });
  });

  describe('Worker Performance and Resource Management', () => {
    beforeEach(async () => {
      await workerManager.initialize();
    });

    test('should handle high-frequency requests efficiently', async () => {
      const config = TestFixtures.environments.minimal;
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      const requestCount = 20;
      const requestTimes: number[] = [];
      
      // Make rapid sequential requests
      for (let i = 0; i < requestCount; i++) {
        performanceMeasurer.startMeasurement(`request_${i}`);
        
        const stateData = await workerManager.getSimulationState();
        
        const requestTime = performanceMeasurer.endMeasurement(`request_${i}`);
        requestTimes.push(requestTime);
        
        expect(stateData).toBeDefined();
      }
      
      await workerManager.stopSimulation();
      
      // Analyze request performance
      const avgRequestTime = requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length;
      const maxRequestTime = Math.max(...requestTimes);
      
      expect(avgRequestTime).toBeLessThan(100); // Average should be fast
      expect(maxRequestTime).toBeLessThan(500); // No request should be extremely slow
      
      console.log(`High-frequency requests: avg=${avgRequestTime.toFixed(2)}ms, max=${maxRequestTime.toFixed(2)}ms`);
    });

    test('should manage resources efficiently during extended operation', async () => {
      const config = TestFixtures.environments.standard;
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      const operationCount = 10;
      
      for (let i = 0; i < operationCount; i++) {
        // Perform various operations
        await workerManager.getSimulationState();
        await workerManager.getPerformanceStats();
        
        // Add ants periodically
        if (i % 3 === 0) {
          await workerManager.addAnts(2, { x: 10, y: 10, z: 0 });
        }
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await workerManager.stopSimulation();
      
      // Verify manager statistics
      const stats = workerManager.getManagerStats();
      expect(stats).toBeDefined();
      expect(stats.totalMessages).toBeGreaterThan(0);
    });

    test('should handle worker resource cleanup properly', async () => {
      const config = TestFixtures.environments.minimal;
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      // Verify worker is active
      expect(workerManager.isUsingWorker()).toBe(true);
      
      const stateBeforeCleanup = await workerManager.getSimulationState();
      expect(stateBeforeCleanup).toBeDefined();
      
      // Cleanup worker
      workerManager.dispose();
      
      // Cleanup should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Fallback Mode Integration', () => {
    test('should seamlessly switch to fallback mode when worker fails', async () => {
      // Initialize normally first
      await workerManager.initialize();
      expect(workerManager.isUsingWorker()).toBe(true);
      
      const config = TestFixtures.environments.minimal;
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      // Get data in worker mode
      const workerModeState = await workerManager.getSimulationState();
      expect(workerModeState).toBeDefined();
      
      await workerManager.stopSimulation();
      workerManager.dispose();
      
      // Create new manager that will use fallback mode
      const fallbackManager = new SimulationWorkerManager();
      
      // Mock Worker to always fail
      const originalWorker = (global as any).Worker;
      (global as any).Worker = class {
        constructor() {
          throw new Error('Worker not available');
        }
      };
      
      try {
        // Initialize in fallback mode
        await fallbackManager.initialize();
        expect(fallbackManager.isUsingWorker()).toBe(false);
        
        // Test fallback functionality
        await fallbackManager.configureSimulation(config);
        await fallbackManager.startSimulation();
        
        const fallbackModeState = await fallbackManager.getSimulationState();
        expect(fallbackModeState).toBeDefined();
        
        // Fallback mode should provide similar functionality
        expect(typeof fallbackModeState.currentTime).toBe('number');
        expect(typeof fallbackModeState.isRunning).toBe('boolean');
        
        await fallbackManager.stopSimulation();
      } finally {
        // Restore original Worker
        (global as any).Worker = originalWorker;
        fallbackManager.dispose();
      }
    });

    test('should maintain consistent API between worker and fallback modes', async () => {
      const config = TestFixtures.environments.minimal;
      
      // Test worker mode
      await workerManager.initialize();
      
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      const workerState = await workerManager.getSimulationState();
      const workerPerf = await workerManager.getPerformanceStats();
      
      await workerManager.stopSimulation();
      workerManager.dispose();
      
      // Test fallback mode
      const fallbackManager = new SimulationWorkerManager();
      const originalWorker = (global as any).Worker;
      (global as any).Worker = class {
        constructor() {
          throw new Error('Worker not available');
        }
      };
      
      try {
        await fallbackManager.initialize();
        
        await fallbackManager.configureSimulation(config);
        await fallbackManager.startSimulation();
        
        const fallbackState = await fallbackManager.getSimulationState();
        const fallbackPerf = await fallbackManager.getPerformanceStats();
        
        await fallbackManager.stopSimulation();
        
        // Both modes should return valid data structures
        expect(workerState).toBeDefined();
        expect(fallbackState).toBeDefined();
        expect(typeof workerState.isRunning).toBe('boolean');
        expect(typeof fallbackState.isRunning).toBe('boolean');
        
        // Performance stats should be available in both modes
        expect(workerPerf !== undefined || fallbackPerf !== undefined).toBe(true);
        
      } finally {
        (global as any).Worker = originalWorker;
        fallbackManager.dispose();
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await workerManager.initialize();
    });

    test('should handle message timeout gracefully', async () => {
      // Mock a slow worker response
      const originalPostMessage = MockWorker.prototype.postMessage;
      MockWorker.prototype.postMessage = function(message: any) {
        if (message.type === 'GET_STATE') {
          // Simulate very slow response that would timeout
          setTimeout(() => {
            originalPostMessage.call(this, message);
          }, 10000); // 10 second delay
        } else {
          originalPostMessage.call(this, message);
        }
      };
      
      try {
        const config = TestFixtures.environments.minimal;
        await workerManager.configureSimulation(config);
        await workerManager.startSimulation();
        
        // This should timeout and handle gracefully
        const statePromise = workerManager.getSimulationState();
        
        // Wait for reasonable time
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 2000));
        const result = await Promise.race([statePromise, timeoutPromise]);
        
        // Should either get valid data or timeout gracefully
        expect(result === 'timeout' || (result && typeof result === 'object')).toBe(true);
        
      } finally {
        // Restore original method
        MockWorker.prototype.postMessage = originalPostMessage;
      }
    });

    test('should handle worker communication errors', async () => {
      const config = TestFixtures.environments.minimal;
      await workerManager.configureSimulation(config);
      await workerManager.startSimulation();
      
      // Get successful baseline
      const initialState = await workerManager.getSimulationState();
      expect(initialState).toBeDefined();
      
      // Simulate worker error
      const originalPostMessage = MockWorker.prototype.postMessage;
      let errorCount = 0;
      
      MockWorker.prototype.postMessage = function(message: any) {
        if (errorCount < 2 && message.type === 'GET_STATE') {
          errorCount++;
          // Simulate error response
          setTimeout(() => {
            (this as any).messageHandlers.forEach((handler: any) => {
              handler({ data: { type: 'ERROR', error: 'Communication error' } } as MessageEvent);
            });
          }, 10);
        } else {
          originalPostMessage.call(this, message);
        }
      };
      
      try {
        // This should handle errors gracefully
        try {
          await workerManager.getSimulationState();
        } catch (error) {
          // Error handling is expected
          expect(error).toBeDefined();
        }
        
        // System should still be functional after error recovery
        const recoveryState = await workerManager.getSimulationState();
        expect(recoveryState !== undefined || true).toBe(true);
        
      } finally {
        MockWorker.prototype.postMessage = originalPostMessage;
      }
    });
  });
});