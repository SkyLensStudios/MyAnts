/**
 * IPC Channel Definitions
 * Centralized channel names for type-safe communication between main and renderer processes
 * Enhanced with 2D/3D mode support
 */

export const IPCChannels = {
  // Simulation Control
  SIMULATION_START: 'simulation:start',
  SIMULATION_PAUSE: 'simulation:pause',
  SIMULATION_RESET: 'simulation:reset',
  SIMULATION_CONFIG: 'simulation:config',
  SIMULATION_UPDATE: 'simulation:update',
  SIMULATION_SPEED_CHANGED: 'simulation:speed-changed',
  SIMULATION_MODE_CHANGED: 'simulation:mode-changed', // New: 2D/3D mode switching

  // Data Queries (High-frequency)
  GET_SIMULATION_STATE: 'data:get-simulation-state',
  GET_ANT_DATA: 'data:get-ant-data',
  GET_PHEROMONE_DATA: 'data:get-pheromone-data',
  GET_ENVIRONMENT_DATA: 'data:get-environment-data',
  GET_UNIFIED_SIMULATION_DATA: 'data:get-unified-simulation-data', // New: Unified 2D/3D data

  // Bulk Data Transfer (SharedArrayBuffer)
  SHARED_BUFFER_INIT: 'shared:buffer-init',
  SHARED_BUFFER_UPDATE: 'shared:buffer-update',
  SHARED_BUFFER_METADATA: 'shared:buffer-metadata',

  // Rendering Mode Management
  RENDERER_MODE_SWITCH: 'renderer:mode-switch',
  RENDERER_2D_CAMERA_UPDATE: 'renderer:2d-camera-update',
  RENDERER_3D_CAMERA_UPDATE: 'renderer:3d-camera-update',
  RENDERER_METRICS_2D: 'renderer:metrics-2d',
  RENDERER_METRICS_3D: 'renderer:metrics-3d',

  // File Operations
  SAVE_SIMULATION: 'file:save-simulation',
  LOAD_SIMULATION: 'file:load-simulation',
  EXPORT_DATA: 'file:export-data',

  // Performance & Monitoring
  GET_PERFORMANCE_STATS: 'perf:get-stats',
  MEMORY_PRESSURE: 'perf:memory-pressure',
  CPU_USAGE: 'perf:cpu-usage',

  // User Interface Events
  UI_NEW_SIMULATION: 'ui:new-simulation',
  UI_COLONY_SELECTED: 'ui:colony-selected',
  UI_ANT_SELECTED: 'ui:ant-selected',
  UI_CAMERA_CHANGED: 'ui:camera-changed',
  UI_TOOL_CHANGED: 'ui:tool-changed',

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

// Type-safe channel names
export type IPCChannel = typeof IPCChannels[keyof typeof IPCChannels];