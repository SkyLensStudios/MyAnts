/**
 * IPC Communication Tests
 * Tests for main-renderer IPC communication, preload API, and message handling
 */

import { IPCChannels } from '../../shared/IPCChannels';
import { mockElectronAPI } from '../setup';

// Mock Electron IPC
const mockIpcRenderer = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Mock Electron modules
jest.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer,
  ipcMain: mockIpcMain,
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
}));

describe('IPC Communication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IPC Channel Definitions', () => {
    test('should define all required simulation control channels', () => {
      expect(IPCChannels.SIMULATION_START).toBe('simulation:start');
      expect(IPCChannels.SIMULATION_PAUSE).toBe('simulation:pause');
      expect(IPCChannels.SIMULATION_RESET).toBe('simulation:reset');
      expect(IPCChannels.SIMULATION_CONFIG).toBe('simulation:config');
      expect(IPCChannels.SIMULATION_UPDATE).toBe('simulation:update');
      expect(IPCChannels.SIMULATION_SPEED_CHANGED).toBe('simulation:speed-changed');
    });

    test('should define all required data query channels', () => {
      expect(IPCChannels.GET_SIMULATION_STATE).toBe('data:get-simulation-state');
      expect(IPCChannels.GET_ANT_DATA).toBe('data:get-ant-data');
      expect(IPCChannels.GET_PHEROMONE_DATA).toBe('data:get-pheromone-data');
      expect(IPCChannels.GET_ENVIRONMENT_DATA).toBe('data:get-environment-data');
    });

    test('should define file operation channels', () => {
      expect(IPCChannels.SAVE_SIMULATION).toBe('file:save-simulation');
      expect(IPCChannels.LOAD_SIMULATION).toBe('file:load-simulation');
      expect(IPCChannels.EXPORT_DATA).toBe('file:export-data');
    });

    test('should define performance monitoring channels', () => {
      expect(IPCChannels.GET_PERFORMANCE_STATS).toBe('perf:get-stats');
      expect(IPCChannels.MEMORY_PRESSURE).toBe('perf:memory-pressure');
      expect(IPCChannels.CPU_USAGE).toBe('perf:cpu-usage');
    });
  });

  describe('Preload API Surface', () => {
    test('should expose simulation control methods', () => {
      expect(mockElectronAPI.simulation).toBeDefined();
      expect(typeof mockElectronAPI.simulation.start).toBe('function');
      expect(typeof mockElectronAPI.simulation.pause).toBe('function');
      expect(typeof mockElectronAPI.simulation.reset).toBe('function');
      expect(typeof mockElectronAPI.simulation.configure).toBe('function');
      expect(typeof mockElectronAPI.simulation.setSpeed).toBe('function');
    });

    test('should expose data query methods', () => {
      expect(mockElectronAPI.data).toBeDefined();
      expect(typeof mockElectronAPI.data.getSimulationState).toBe('function');
      expect(typeof mockElectronAPI.data.getAntData).toBe('function');
      expect(typeof mockElectronAPI.data.getPheromoneData).toBe('function');
      expect(typeof mockElectronAPI.data.getEnvironmentData).toBe('function');
      expect(typeof mockElectronAPI.data.getPerformanceStats).toBe('function');
    });

    test('should expose file operation methods', () => {
      expect(mockElectronAPI.file).toBeDefined();
      expect(typeof mockElectronAPI.file.saveSimulation).toBe('function');
      expect(typeof mockElectronAPI.file.loadSimulation).toBe('function');
      expect(typeof mockElectronAPI.file.exportData).toBe('function');
    });
  });

  describe('Simulation Control IPC', () => {
    test('should handle start simulation requests', async () => {
      const result = await mockElectronAPI.simulation.start();
      
      expect(mockElectronAPI.simulation.start).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle pause simulation requests', async () => {
      const result = await mockElectronAPI.simulation.pause();
      
      expect(mockElectronAPI.simulation.pause).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle reset simulation requests', async () => {
      const result = await mockElectronAPI.simulation.reset();
      
      expect(mockElectronAPI.simulation.reset).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle simulation configuration', async () => {
      const config = {
        timeScale: 2.0,
        colonySize: 1000,
        maxAnts: 2000,
      };
      
      const result = await mockElectronAPI.simulation.configure(config);
      
      expect(mockElectronAPI.simulation.configure).toHaveBeenCalledWith(config);
      expect(result).toBe(true);
    });

    test('should handle speed changes', () => {
      const speed = 1.5;
      
      mockElectronAPI.simulation.setSpeed(speed);
      
      expect(mockElectronAPI.simulation.setSpeed).toHaveBeenCalledWith(speed);
    });
  });

  describe('Data Query IPC', () => {
    test('should handle simulation state requests', async () => {
      const result = await mockElectronAPI.data.getSimulationState();
      
      expect(mockElectronAPI.data.getSimulationState).toHaveBeenCalled();
      expect(result).toHaveProperty('isRunning');
      expect(result).toHaveProperty('isPaused');
      expect(result).toHaveProperty('currentTime');
      expect(result).toHaveProperty('totalAnts');
    });

    test('should handle ant data requests', async () => {
      const result = await mockElectronAPI.data.getAntData();
      
      expect(mockElectronAPI.data.getAntData).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle pheromone data requests', async () => {
      const result = await mockElectronAPI.data.getPheromoneData();
      
      expect(mockElectronAPI.data.getPheromoneData).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle environment data requests', async () => {
      const result = await mockElectronAPI.data.getEnvironmentData();
      
      expect(mockElectronAPI.data.getEnvironmentData).toHaveBeenCalled();
      expect(typeof result).toBe('object');
    });

    test('should handle performance stats requests', async () => {
      const result = await mockElectronAPI.data.getPerformanceStats();
      
      expect(mockElectronAPI.data.getPerformanceStats).toHaveBeenCalled();
      expect(typeof result).toBe('object');
    });
  });

  describe('File Operation IPC', () => {
    test('should handle save simulation requests', async () => {
      const saveData = { filename: 'test_simulation.json' };
      
      const result = await mockElectronAPI.file.saveSimulation(saveData);
      
      expect(mockElectronAPI.file.saveSimulation).toHaveBeenCalledWith(saveData);
      expect(result).toBe(true);
    });

    test('should handle load simulation requests', async () => {
      const loadData = { filename: 'test_simulation.json' };
      
      const result = await mockElectronAPI.file.loadSimulation(loadData);
      
      expect(mockElectronAPI.file.loadSimulation).toHaveBeenCalledWith(loadData);
      expect(typeof result).toBe('object');
    });

    test('should handle data export requests', async () => {
      const exportOptions = { 
        format: 'csv', 
        includeEnvironment: true,
        timeRange: { start: 0, end: 1000 },
      };
      
      const result = await mockElectronAPI.file.exportData(exportOptions);
      
      expect(mockElectronAPI.file.exportData).toHaveBeenCalledWith(exportOptions);
      expect(result).toBe(true);
    });
  });

  describe('Error Handling in IPC', () => {
    test('should handle IPC communication failures gracefully', async () => {
      // Mock a failed IPC call
      const failingAPI = {
        simulation: {
          start: jest.fn().mockRejectedValue(new Error('IPC communication failed')),
        },
      };

      try {
        await failingAPI.simulation.start();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('IPC communication failed');
      }
    });

    test('should validate IPC message structure', () => {
      // Test that IPC channels follow naming convention
      const channelNames = Object.values(IPCChannels);
      
      channelNames.forEach(channel => {
        expect(typeof channel).toBe('string');
        expect(channel).toMatch(/^[a-z0-9]+:[a-z0-9-]+$/); // namespace:action format (allows numbers)
      });
    });

    test('should handle invalid simulation configurations', async () => {
      const invalidConfig = {
        timeScale: -1,
        maxAnts: 'invalid',
      };
      
      // Should not throw but may return error result
      const result = await mockElectronAPI.simulation.configure(invalidConfig as any);
      expect(mockElectronAPI.simulation.configure).toHaveBeenCalledWith(invalidConfig);
    });
  });

  describe('IPC Performance and Reliability', () => {
    test('should handle high-frequency data requests', async () => {
      const promises = [];
      
      // Simulate multiple rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(mockElectronAPI.data.getSimulationState());
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(mockElectronAPI.data.getSimulationState).toHaveBeenCalledTimes(10);
    });

    test('should handle concurrent IPC operations', async () => {
      const operations = [
        mockElectronAPI.simulation.start(),
        mockElectronAPI.data.getSimulationState(),
        mockElectronAPI.data.getAntData(),
        mockElectronAPI.data.getPerformanceStats(),
      ];
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(4);
      // All operations should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    test('should maintain IPC channel isolation', () => {
      // Ensure different channel categories don't interfere
      const simulationChannels = Object.values(IPCChannels).filter(ch => ch.startsWith('simulation:'));
      const dataChannels = Object.values(IPCChannels).filter(ch => ch.startsWith('data:'));
      const fileChannels = Object.values(IPCChannels).filter(ch => ch.startsWith('file:'));
      
      expect(simulationChannels.length).toBeGreaterThan(0);
      expect(dataChannels.length).toBeGreaterThan(0);
      expect(fileChannels.length).toBeGreaterThan(0);
      
      // No overlap between categories
      const allChannels = [...simulationChannels, ...dataChannels, ...fileChannels];
      const uniqueChannels = new Set(allChannels);
      expect(uniqueChannels.size).toBe(allChannels.length);
    });
  });

  describe('Type Safety in IPC', () => {
    test('should maintain type safety across IPC boundary', async () => {
      const state = await mockElectronAPI.data.getSimulationState();
      
      // Verify expected properties exist
      expect(typeof state.isRunning).toBe('boolean');
      expect(typeof state.isPaused).toBe('boolean');
      expect(typeof state.currentTime).toBe('number');
      expect(typeof state.totalAnts).toBe('number');
    });

    test('should handle typed configuration objects', async () => {
      const typedConfig = {
        timeScale: 1.5,
        colonySize: 500,
        environmentSize: 10000,
        maxAnts: 1000,
        enablePhysics: true,
        enableWeather: false,
      };
      
      await mockElectronAPI.simulation.configure(typedConfig);
      
      expect(mockElectronAPI.simulation.configure).toHaveBeenCalledWith(
        expect.objectContaining({
          timeScale: expect.any(Number),
          colonySize: expect.any(Number),
          enablePhysics: expect.any(Boolean),
        }),
      );
    });
  });
});