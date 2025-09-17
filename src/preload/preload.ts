/**
 * Electron Preload Script
 * Provides secure IPC API surface for renderer process with context isolation
 */

import { contextBridge, ipcRenderer } from 'electron';
import { SimulationConfig, SimulationState, CameraState, UIState } from '../shared/types';

// Define IPC channels inline to avoid module resolution issues in sandbox
const IPCChannels = {
  // Simulation Control
  SIMULATION_START: 'simulation:start',
  SIMULATION_PAUSE: 'simulation:pause',
  SIMULATION_RESET: 'simulation:reset',
  SIMULATION_CONFIG: 'simulation:config',
  SIMULATION_UPDATE: 'simulation:update',
  SIMULATION_SPEED_CHANGED: 'simulation:speed-changed',

  // Data Queries (High-frequency)
  GET_SIMULATION_STATE: 'data:get-simulation-state',
  GET_ANT_DATA: 'data:get-ant-data',
  GET_PHEROMONE_DATA: 'data:get-pheromone-data',
  GET_ENVIRONMENT_DATA: 'data:get-environment-data',

  // File Operations
  SAVE_SIMULATION: 'file:save-simulation',
  LOAD_SIMULATION: 'file:load-simulation',
  EXPORT_DATA: 'file:export-data',

  // Performance & Monitoring
  GET_PERFORMANCE_STATS: 'perf:get-stats',

  // User Interface Events
  UI_NEW_SIMULATION: 'ui:new-simulation',

  // User Input (Low-latency)
  INPUT_MOUSE_MOVE: 'input:mouse-move',
  INPUT_MOUSE_CLICK: 'input:mouse-click',
  INPUT_KEYBOARD: 'input:keyboard',
  INPUT_WHEEL: 'input:wheel',

  // Scientific Tools
  MEASURE_DISTANCE: 'tool:measure-distance',
  TAKE_SCREENSHOT: 'tool:screenshot',
  START_RECORDING: 'tool:start-recording',
  STOP_RECORDING: 'tool:stop-recording',
  EXPORT_ANALYTICS: 'tool:export-analytics',

  // Debug & Development
  DEBUG_CONSOLE: 'debug:console',
  DEBUG_ENABLE_WIREFRAME: 'debug:wireframe',
  DEBUG_SHOW_PHYSICS: 'debug:physics',
  DEBUG_SHOW_PHEROMONES: 'debug:pheromones',
} as const;

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // Simulation control
  simulation: {
    start(): Promise<boolean>;
    pause(): Promise<boolean>;
    reset(): Promise<boolean>;
    configure(config: SimulationConfig): Promise<boolean>;
    setSpeed(speed: number): void;
  };
  
  // Data access
  data: {
    getSimulationState(): Promise<SimulationState | null>;
    getAntData(): Promise<any>;
    getPheromoneData(): Promise<any>;
    getEnvironmentData(): Promise<any>;
    getPerformanceStats(): Promise<any>;
  };
  
  // File operations
  file: {
    saveSimulation(): Promise<string | null>;
    loadSimulation(): Promise<boolean>;
    exportData(format: 'csv' | 'json'): Promise<string | null>;
  };
  
  // Shared buffer access
  sharedBuffers: {
    getBuffers(): any;
    getMetadata(): any;
  };
  
  // Event listeners
  events: {
    onSimulationUpdate(callback: (update: any) => void): () => void;
    onSpeedChanged(callback: (speed: number) => void): () => void;
    onNewSimulation(callback: () => void): () => void;
  };
  
  // User input handling
  input: {
    sendMouseMove(x: number, y: number): void;
    sendMouseClick(x: number, y: number, button: number): void;
    sendKeyboard(key: string, pressed: boolean): void;
    sendWheel(deltaX: number, deltaY: number): void;
  };
  
  // Scientific tools
  tools: {
    measureDistance(start: { x: number; y: number }, end: { x: number; y: number }): Promise<number>;
    takeScreenshot(): Promise<string | null>;
    startRecording(): Promise<boolean>;
    stopRecording(): Promise<string | null>;
    exportAnalytics(): Promise<string | null>;
  };
  
  // Debug functionality
  debug: {
    enableWireframe(enabled: boolean): void;
    showPhysics(enabled: boolean): void;
    showPheromones(enabled: boolean): void;
    log(message: string): void;
  };
}

// Implementation of the API
const electronAPI: ElectronAPI = {
  simulation: {
    start: () => ipcRenderer.invoke(IPCChannels.SIMULATION_START),
    pause: () => ipcRenderer.invoke(IPCChannels.SIMULATION_PAUSE),
    reset: () => ipcRenderer.invoke(IPCChannels.SIMULATION_RESET),
    configure: (config: SimulationConfig) => ipcRenderer.invoke(IPCChannels.SIMULATION_CONFIG, config),
    setSpeed: (speed: number) => ipcRenderer.send(IPCChannels.SIMULATION_SPEED_CHANGED, speed),
  },
  
  data: {
    getSimulationState: () => ipcRenderer.invoke(IPCChannels.GET_SIMULATION_STATE),
    getAntData: () => ipcRenderer.invoke(IPCChannels.GET_ANT_DATA),
    getPheromoneData: () => ipcRenderer.invoke(IPCChannels.GET_PHEROMONE_DATA),
    getEnvironmentData: () => ipcRenderer.invoke(IPCChannels.GET_ENVIRONMENT_DATA),
    getPerformanceStats: () => ipcRenderer.invoke(IPCChannels.GET_PERFORMANCE_STATS),
  },
  
  file: {
    saveSimulation: () => ipcRenderer.invoke(IPCChannels.SAVE_SIMULATION),
    loadSimulation: () => ipcRenderer.invoke(IPCChannels.LOAD_SIMULATION),
    exportData: (format: 'csv' | 'json') => ipcRenderer.invoke(IPCChannels.EXPORT_DATA, format),
  },
  
  sharedBuffers: {
    getBuffers: () => {
      // Note: SharedArrayBuffer access requires special handling
      // This would need to be implemented with proper buffer sharing
      return null;
    },
    getMetadata: () => {
      // Metadata can be transferred via regular IPC
      return null;
    },
  },
  
  events: {
    onSimulationUpdate: (callback: (update: any) => void) => {
      const listener = (_event: any, update: any) => callback(update);
      ipcRenderer.on(IPCChannels.SIMULATION_UPDATE, listener);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(IPCChannels.SIMULATION_UPDATE, listener);
      };
    },
    
    onSpeedChanged: (callback: (speed: number) => void) => {
      const listener = (_event: any, speed: number) => callback(speed);
      ipcRenderer.on(IPCChannels.SIMULATION_SPEED_CHANGED, listener);
      
      return () => {
        ipcRenderer.removeListener(IPCChannels.SIMULATION_SPEED_CHANGED, listener);
      };
    },
    
    onNewSimulation: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(IPCChannels.UI_NEW_SIMULATION, listener);
      
      return () => {
        ipcRenderer.removeListener(IPCChannels.UI_NEW_SIMULATION, listener);
      };
    },
  },
  
  input: {
    sendMouseMove: (x: number, y: number) => {
      ipcRenderer.send(IPCChannels.INPUT_MOUSE_MOVE, { x, y });
    },
    
    sendMouseClick: (x: number, y: number, button: number) => {
      ipcRenderer.send(IPCChannels.INPUT_MOUSE_CLICK, { x, y, button });
    },
    
    sendKeyboard: (key: string, pressed: boolean) => {
      ipcRenderer.send(IPCChannels.INPUT_KEYBOARD, { key, pressed });
    },
    
    sendWheel: (deltaX: number, deltaY: number) => {
      ipcRenderer.send(IPCChannels.INPUT_WHEEL, { deltaX, deltaY });
    },
  },
  
  tools: {
    measureDistance: (start: { x: number; y: number }, end: { x: number; y: number }) => 
      ipcRenderer.invoke(IPCChannels.MEASURE_DISTANCE, { start, end }),
    
    takeScreenshot: () => ipcRenderer.invoke(IPCChannels.TAKE_SCREENSHOT),
    
    startRecording: () => ipcRenderer.invoke(IPCChannels.START_RECORDING),
    
    stopRecording: () => ipcRenderer.invoke(IPCChannels.STOP_RECORDING),
    
    exportAnalytics: () => ipcRenderer.invoke(IPCChannels.EXPORT_ANALYTICS),
  },
  
  debug: {
    enableWireframe: (enabled: boolean) => {
      ipcRenderer.send(IPCChannels.DEBUG_ENABLE_WIREFRAME, enabled);
    },
    
    showPhysics: (enabled: boolean) => {
      ipcRenderer.send(IPCChannels.DEBUG_SHOW_PHYSICS, enabled);
    },
    
    showPheromones: (enabled: boolean) => {
      ipcRenderer.send(IPCChannels.DEBUG_SHOW_PHEROMONES, enabled);
    },
    
    log: (message: string) => {
      ipcRenderer.send(IPCChannels.DEBUG_CONSOLE, message);
    },
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the global electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

console.log('🔧 Preload script loaded successfully');
console.log('🔌 ElectronAPI exposed to window object');