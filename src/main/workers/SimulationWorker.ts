/**
 * Simulation Web Worker for Phase 2
 * Separates simulation logic from rendering thread for massive performance improvement
 * Prevents UI blocking during heavy computation
 */

import { SimulationEngine } from '../simulation/SimulationEngine';
import { 
  SimulationConfig, 
  SimulationState, 
  AntRenderData, 
  PheromoneRenderData, 
  EnvironmentRenderData,
  SimulationUpdate 
} from '../../shared/types';

// Worker message types
interface WorkerMessage {
  type: string;
  data: any;
  requestId?: string;
}

interface SimulationWorkerConfig {
  targetFPS: number;
  maxDeltaTime: number;
  enablePerformanceLogging: boolean;
  batchSize: number;
}

class SimulationWorker {
  private simulationEngine: SimulationEngine;
  private isRunning = false;
  private isPaused = false;
  private lastUpdateTime = 0;
  private config: SimulationWorkerConfig;
  private updateIntervalId: number | null = null;

  // Performance tracking
  private frameCount = 0;
  private performanceStats = {
    avgUpdateTime: 0,
    maxUpdateTime: 0,
    totalUpdates: 0,
    memoryUsage: 0
  };

  constructor() {
    this.config = {
      targetFPS: 60,
      maxDeltaTime: 50, // Max 50ms per frame to prevent spiral of death
      enablePerformanceLogging: true,
      batchSize: 100 // Process ants in batches
    };

    this.simulationEngine = new SimulationEngine();
    
    console.log('🔧 Simulation Worker initialized');
    console.log(`   Target FPS: ${this.config.targetFPS}`);
    console.log(`   Max delta time: ${this.config.maxDeltaTime}ms`);
  }

  /**
   * Handle messages from main thread
   */
  public handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { type, data, requestId } = event.data;

    try {
      switch (type) {
        case 'INIT_SIMULATION':
          this.initializeSimulation(data.config);
          this.sendResponse('SIMULATION_INITIALIZED', { success: true }, requestId);
          break;

        case 'START_SIMULATION':
          this.startSimulation();
          this.sendResponse('SIMULATION_STARTED', { success: true }, requestId);
          break;

        case 'PAUSE_SIMULATION':
          this.pauseSimulation();
          this.sendResponse('SIMULATION_PAUSED', { success: true }, requestId);
          break;

        case 'STOP_SIMULATION':
          this.stopSimulation();
          this.sendResponse('SIMULATION_STOPPED', { success: true }, requestId);
          break;

        case 'UPDATE_CONFIG':
          this.updateConfig(data.config);
          this.sendResponse('CONFIG_UPDATED', { success: true }, requestId);
          break;

        case 'GET_STATE':
          const state = this.simulationEngine.getState();
          this.sendResponse('SIMULATION_STATE', state, requestId);
          break;

        case 'GET_PERFORMANCE_STATS':
          const stats = this.getPerformanceStats();
          this.sendResponse('PERFORMANCE_STATS', stats, requestId);
          break;

        case 'ADD_ANTS':
          this.addAnts(data.count, data.position);
          this.sendResponse('ANTS_ADDED', { success: true }, requestId);
          break;

        case 'SET_SPEED':
          this.simulationEngine.setTimeScale(data.speed);
          this.sendResponse('SPEED_SET', { success: true }, requestId);
          break;

        default:
          console.warn(`Unknown message type: ${type}`);
          this.sendResponse('ERROR', { error: `Unknown message type: ${type}` }, requestId);
      }
    } catch (error) {
      console.error('Error handling worker message:', error);
      this.sendResponse('ERROR', { error: error.message }, requestId);
    }
  }

  /**
   * Initialize simulation with configuration
   */
  private initializeSimulation(config: Partial<SimulationConfig>): void {
    this.simulationEngine.configure(config);
    this.simulationEngine.initialize();
    
    console.log('🚀 Simulation initialized in worker thread');
  }

  /**
   * Start simulation loop
   */
  private startSimulation(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastUpdateTime = performance.now();

    // Start high-frequency update loop
    this.updateIntervalId = setInterval(() => {
      this.updateSimulation();
    }, 1000 / this.config.targetFPS) as unknown as number;

    console.log('🏃 Simulation started in worker thread');
  }

  /**
   * Pause simulation
   */
  private pauseSimulation(): void {
    this.isPaused = true;
    console.log('⏸️ Simulation paused');
  }

  /**
   * Stop simulation
   */
  private stopSimulation(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }

    console.log('🛑 Simulation stopped');
  }

  /**
   * Main simulation update loop
   */
  private async updateSimulation(): Promise<void> {
    if (!this.isRunning || this.isPaused) return;

    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastUpdateTime, this.config.maxDeltaTime);
    this.lastUpdateTime = currentTime;

    const updateStartTime = performance.now();

    try {
      // Update simulation engine
      await this.simulationEngine.update();

      // Send render data to main thread at reasonable intervals
      this.frameCount++;
      if (this.frameCount % 1 === 0) { // Send every frame for smooth rendering
        this.sendRenderData();
      }

      // Send performance updates less frequently
      if (this.frameCount % 60 === 0) { // Every second at 60 FPS
        this.sendPerformanceUpdate();
      }

    } catch (error) {
      console.error('Simulation update error:', error);
      this.sendResponse('SIMULATION_ERROR', { error: error.message });
    }

    // Track performance
    const updateTime = performance.now() - updateStartTime;
    this.updatePerformanceStats(updateTime);
  }

  /**
   * Send render data to main thread
   */
  private sendRenderData(): void {
    try {
      const renderData = this.simulationEngine.getRenderData();
      const simulationState = this.simulationEngine.getState();

      this.sendMessage('RENDER_DATA', {
        antData: renderData.antData,
        pheromoneData: renderData.pheromoneData,
        environmentData: renderData.environmentData,
        simulationState: simulationState,
        frameCount: this.frameCount
      });
    } catch (error) {
      console.error('Error sending render data:', error);
    }
  }

  /**
   * Send performance update to main thread
   */
  private sendPerformanceUpdate(): void {
    const stats = this.getPerformanceStats();
    this.sendMessage('PERFORMANCE_UPDATE', stats);
  }

  /**
   * Add ants to simulation
   */
  private addAnts(count: number, position?: { x: number; y: number; z: number }): void {
    for (let i = 0; i < count; i++) {
      const antPosition = position || {
        x: (Math.random() - 0.5) * 100,
        y: 0,
        z: (Math.random() - 0.5) * 100
      };
      
      this.simulationEngine.addAnt(antPosition);
    }
  }

  /**
   * Update worker configuration
   */
  private updateConfig(newConfig: Partial<SimulationWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timer if FPS changed
    if (newConfig.targetFPS && this.isRunning) {
      this.stopSimulation();
      this.startSimulation();
    }
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(updateTime: number): void {
    this.performanceStats.totalUpdates++;
    this.performanceStats.maxUpdateTime = Math.max(this.performanceStats.maxUpdateTime, updateTime);
    this.performanceStats.avgUpdateTime = 
      (this.performanceStats.avgUpdateTime * (this.performanceStats.totalUpdates - 1) + updateTime) / 
      this.performanceStats.totalUpdates;

    // Estimate memory usage (simplified)
    if (typeof performance.memory !== 'undefined') {
      this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  private getPerformanceStats(): any {
    const engineStats = this.simulationEngine.getPerformanceStats();
    
    return {
      worker: this.performanceStats,
      engine: engineStats,
      frameCount: this.frameCount,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      config: this.config
    };
  }

  /**
   * Send message to main thread
   */
  private sendMessage(type: string, data: any): void {
    self.postMessage({ type, data });
  }

  /**
   * Send response to main thread with optional request ID
   */
  private sendResponse(type: string, data: any, requestId?: string): void {
    self.postMessage({ type, data, requestId });
  }
}

// Initialize worker
const simulationWorker = new SimulationWorker();

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  simulationWorker.handleMessage(event);
});

// Handle errors
self.addEventListener('error', (event: ErrorEvent) => {
  console.error('Worker error:', event.error);
  self.postMessage({
    type: 'WORKER_ERROR',
    data: { error: event.error.message, filename: event.filename, lineno: event.lineno }
  });
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('Worker unhandled promise rejection:', event.reason);
  self.postMessage({
    type: 'WORKER_ERROR',
    data: { error: event.reason }
  });
});

console.log('🧵 Simulation Web Worker loaded and ready');

export {}; // Make this a module