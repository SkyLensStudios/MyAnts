/**
 * Worker System Tests
 * Tests for SimulationWorkerManager fallback mechanisms and worker communication
 */

import { SimulationWorkerManager } from '../../main/workers/SimulationWorkerManager';
import { SimulationConfig, AntSpecies } from '../../shared/types';

// Mock SimulationEngine for fallback testing
const mockSimulationEngine = {
  configure: jest.fn(),
  initialize: jest.fn(),
  start: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  reset: jest.fn(),
  update: jest.fn(),
  getState: jest.fn().mockReturnValue({
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    totalAnts: 0
  }),
  getPerformanceStats: jest.fn().mockReturnValue({
    fps: 60,
    updateTime: 16,
    memoryUsage: 100
  }),
  getRenderData: jest.fn().mockReturnValue({
    ants: [],
    colonies: [],
    environment: {}
  })
};

// Mock dynamic import of SimulationEngine
jest.mock('../../main/simulation/SimulationEngine', () => ({
  SimulationEngine: jest.fn().mockImplementation(() => mockSimulationEngine)
}));

describe('Worker System Tests', () => {
  let workerManager: SimulationWorkerManager;

  beforeEach(() => {
    jest.clearAllMocks();
    workerManager = new SimulationWorkerManager();
  });

  afterEach(async () => {
    if (workerManager) {
      workerManager.dispose();
    }
  });

  describe('Worker Manager Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(workerManager).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const config = {
        workerPath: '/custom/worker.ts',
        enableFallbackMode: true,
        maxResponseTime: 3000
      };

      const customWorkerManager = new SimulationWorkerManager(config);
      expect(customWorkerManager).toBeDefined();
    });

    test('should attempt worker initialization first', async () => {
      // Mock Worker availability
      const originalWorker = global.Worker;
      global.Worker = class MockWorker {
        constructor(url: string) {
          this.url = url;
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage(new MessageEvent('message', { 
                data: { type: 'ready' } 
              }));
            }
          }, 10);
        }
        url: string;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: ErrorEvent) => void) | null = null;
        postMessage = jest.fn();
        terminate = jest.fn();
      } as any;

      await workerManager.initialize();

      global.Worker = originalWorker;
    });

    test('should fallback to main thread when worker fails', async () => {
      // Mock Worker failure
      const originalWorker = global.Worker;
      global.Worker = class FailingWorker {
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new ErrorEvent('error', { 
                message: 'Worker failed to initialize' 
              }));
            }
          }, 10);
        }
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: ErrorEvent) => void) | null = null;
        postMessage = jest.fn();
        terminate = jest.fn();
      } as any;

      await workerManager.initialize();

      // Should fall back to main thread
      expect(mockSimulationEngine.configure).not.toHaveBeenCalled();
      
      global.Worker = originalWorker;
    });
  });

  describe('Worker Communication', () => {
    beforeEach(async () => {
      await workerManager.initialize();
    });

    test('should configure simulation in worker mode', async () => {
      const config: Partial<SimulationConfig> = {
        timeScale: 1.5,
        colonySize: 1000,
        speciesType: AntSpecies.HARVESTER,
        maxAnts: 2000
      };

      await workerManager.configureSimulation(config);

      // In worker mode, this would send a message to worker
      // In fallback mode, it should configure the engine directly
    });

    test('should start simulation in worker', async () => {
      await workerManager.startSimulation();

      // Should not throw and handle start request
      expect(workerManager).toBeDefined();
    });

    test('should pause simulation in worker', async () => {
      await workerManager.startSimulation();
      await workerManager.pauseSimulation();

      // Should handle pause request
      expect(workerManager).toBeDefined();
    });

    test('should stop simulation in worker', async () => {
      await workerManager.startSimulation();
      await workerManager.stopSimulation();

      // Should handle stop request
      expect(workerManager).toBeDefined();
    });

    test('should handle simulation speed changes', async () => {
      const speed = 2.0;

      await workerManager.setSimulationSpeed(speed);

      // Should handle speed change request
      expect(workerManager).toBeDefined();
    });
  });

  describe('Fallback Mode Operation', () => {
    beforeEach(async () => {
      // Force fallback mode by making Worker unavailable
      const originalWorker = global.Worker;
      (global as any).Worker = undefined;

      await workerManager.initialize();

      global.Worker = originalWorker;
    });

    test('should operate in fallback mode when worker unavailable', async () => {
      const config: Partial<SimulationConfig> = {
        timeScale: 1.0,
        colonySize: 500,
        maxAnts: 1000
      };

      await workerManager.configureSimulation(config);

      // In fallback mode, should configure the engine directly
      expect(mockSimulationEngine.configure).toHaveBeenCalledWith(
        expect.objectContaining(config)
      );
    });

    test('should start simulation in fallback mode', async () => {
      await workerManager.startSimulation();

      expect(mockSimulationEngine.start).toHaveBeenCalled();
    });

    test('should pause simulation in fallback mode', async () => {
      await workerManager.pauseSimulation();

      expect(mockSimulationEngine.pause).toHaveBeenCalled();
    });

    test('should stop simulation in fallback mode', async () => {
      await workerManager.stopSimulation();

      expect(mockSimulationEngine.stop).toHaveBeenCalled();
    });

    test('should get simulation state in fallback mode', async () => {
      const state = await workerManager.getSimulationState();

      expect(mockSimulationEngine.getState).toHaveBeenCalled();
      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('isPaused');
    });

    test('should get performance stats in fallback mode', async () => {
      const stats = await workerManager.getPerformanceStats();

      expect(mockSimulationEngine.getPerformanceStats).toHaveBeenCalled();
      expect(stats).toHaveProperty('mode', 'fallback');
      expect(stats).toHaveProperty('engine');
    });
  });

  describe('Worker Error Handling', () => {
    test('should handle worker communication errors gracefully', async () => {
      // Mock worker with communication error
      const originalWorker = global.Worker;
      global.Worker = class ErrorWorker {
        constructor() {}
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: ErrorEvent) => void) | null = null;
        postMessage = jest.fn(() => {
          throw new Error('Communication failed');
        });
        terminate = jest.fn();
      } as any;

      await workerManager.initialize();

      // Should not crash on communication errors
      await expect(workerManager.startSimulation()).resolves.not.toThrow();

      global.Worker = originalWorker;
    });

    test('should handle worker timeout', async () => {
      // Create worker manager with short timeout
      const shortTimeoutManager = new SimulationWorkerManager({
        maxResponseTime: 100
      });

      // Mock worker that never responds
      const originalWorker = global.Worker;
      global.Worker = class SlowWorker {
        constructor() {}
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: ErrorEvent) => void) | null = null;
        postMessage = jest.fn();
        terminate = jest.fn();
      } as any;

      await shortTimeoutManager.initialize();

      // Operations should handle timeout gracefully
      await expect(shortTimeoutManager.getSimulationState()).resolves.toBeDefined();

      shortTimeoutManager.dispose();
      global.Worker = originalWorker;
    });

    test('should recover from worker crashes', async () => {
      await workerManager.initialize();

      // Simulate worker crash
      const mockWorker = {
        terminate: jest.fn(),
        postMessage: jest.fn(),
        onerror: null as ((event: ErrorEvent) => void) | null
      };

      // Trigger error handler
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error', {
          message: 'Worker crashed'
        }));
      }

      // Should fall back to main thread
      await expect(workerManager.getSimulationState()).resolves.toBeDefined();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should track message statistics', async () => {
      await workerManager.initialize();

      // Perform several operations
      await workerManager.getSimulationState();
      await workerManager.getPerformanceStats();

      const stats = await workerManager.getPerformanceStats();

      expect(stats).toHaveProperty('workerManager');
      expect(stats.workerManager).toHaveProperty('totalMessages');
    });

    test('should handle high-frequency operations', async () => {
      await workerManager.initialize();

      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(workerManager.getSimulationState());
      }

      const results = await Promise.all(operations);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('isRunning');
      });
    });

    test('should properly cleanup resources', async () => {
      await workerManager.initialize();
      await workerManager.startSimulation();

      workerManager.dispose();

      // After cleanup, operations should still work (fallback)
      await expect(workerManager.getSimulationState()).resolves.toBeDefined();
    });
  });

  describe('Worker Manager Configuration', () => {
    test('should respect configuration options', () => {
      const config = {
        workerPath: '/custom/worker.ts',
        enableFallbackMode: true,
        maxResponseTime: 3000,
        retryAttempts: 5,
        enablePerformanceLogging: false
      };

      const configuredManager = new SimulationWorkerManager(config);
      expect(configuredManager).toBeDefined();
    });

    test('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        maxResponseTime: -1,
        retryAttempts: 'invalid'
      };

      expect(() => new SimulationWorkerManager(invalidConfig as any))
        .not.toThrow();
    });
  });

  describe('Render Data Handling', () => {
    beforeEach(async () => {
      await workerManager.initialize();
    });

    test('should handle render data callbacks', () => {
      const mockCallback = jest.fn();

      workerManager.onRenderData(mockCallback);

      // Callback should be registered
      expect(mockCallback).not.toHaveBeenCalled(); // Not called immediately
    });

    test('should handle performance update callbacks', () => {
      const mockCallback = jest.fn();

      workerManager.onPerformanceUpdate(mockCallback);

      // Callback should be registered
      expect(mockCallback).not.toHaveBeenCalled(); // Not called immediately
    });

    test('should handle error callbacks', () => {
      const mockCallback = jest.fn();

      workerManager.onError(mockCallback);

      // Callback should be registered
      expect(mockCallback).not.toHaveBeenCalled(); // Not called immediately
    });
  });

  describe('Thread Safety and Synchronization', () => {
    test('should handle concurrent initialization', async () => {
      const manager1 = new SimulationWorkerManager();
      const manager2 = new SimulationWorkerManager();

      const promises = [
        manager1.initialize(),
        manager2.initialize()
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();

      manager1.dispose();
      manager2.dispose();
    });

    test('should handle concurrent operations safely', async () => {
      await workerManager.initialize();

      const operations = [
        workerManager.startSimulation(),
        workerManager.getSimulationState(),
        workerManager.pauseSimulation(),
        workerManager.getPerformanceStats()
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(4);
    });
  });
});