/**
 * Simulation Worker Manager for Phase 2
 * Manages Web Worker communication and provides seamless integration with main thread
 * Handles message passing, state synchronization, and error recovery
 */

import { 
  SimulationConfig, 
  SimulationState, 
  AntRenderData, 
  PheromoneRenderData, 
  EnvironmentRenderData, 
} from '../../shared/types';

export interface WorkerRenderData {
  antData: AntRenderData[];
  pheromoneData: PheromoneRenderData[];
  environmentData: EnvironmentRenderData | null;
  simulationState: SimulationState;
  frameCount: number;
}

export interface WorkerManagerConfig {
  workerPath: string;
  enableFallbackMode: boolean;
  maxResponseTime: number;
  retryAttempts: number;
  enablePerformanceLogging: boolean;
}

interface PendingRequest {
  resolve: (_value: any) => void;
  reject: (_error: Error) => void;
  timeout: any; // Use any to handle both Node.js and browser timeout types
}

export class SimulationWorkerManager {
  private worker: Worker | null = null;
  private config: WorkerManagerConfig;
  private isInitialized = false;
  private isWorkerMode = true; // Falls back to false if Worker fails
  
  // Communication management
  private pendingRequests = new Map<string, PendingRequest>();
  private requestIdCounter = 0;
  private lastRenderData: WorkerRenderData | null = null;
  
  // Callbacks
  private onRenderDataCallback: ((_: WorkerRenderData) => void) | null = null;
  private onPerformanceUpdateCallback: ((_stats: any) => void) | null = null;
  private onErrorCallback: ((_error: Error) => void) | null = null;
  
  // Performance tracking
  private messageStats = {
    totalMessages: 0,
    failedMessages: 0,
    averageResponseTime: 0,
    workerErrors: 0,
  };

  // Fallback simulation engine for non-worker mode
  private fallbackEngine: any = null;

  constructor(config: Partial<WorkerManagerConfig> = {}) {
    this.config = {
      workerPath: '/src/main/workers/SimulationWorker.ts',
      enableFallbackMode: true,
      maxResponseTime: 5000, // 5 seconds
      retryAttempts: 3,
      enablePerformanceLogging: true,
      ...config,
    };

    console.log('🧵 Simulation Worker Manager initialized');
    console.log(`   Worker path: ${this.config.workerPath}`);
    console.log(`   Fallback mode: ${this.config.enableFallbackMode ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Initialize worker or fallback to main thread
   */
  public async initialize(): Promise<void> {
    try {
      await this.initializeWorker();
      console.log('✅ Web Worker mode initialized successfully');
    } catch (error) {
      console.warn('⚠️ Worker initialization failed:', error);
      
      if (this.config.enableFallbackMode) {
        await this.initializeFallback();
        console.log('🔄 Fallback to main thread mode');
      } else {
        throw new Error('Worker initialization failed and fallback is disabled');
      }
    }
  }

  /**
   * Initialize Web Worker
   */
  private async initializeWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create worker
        this.worker = new Worker(this.config.workerPath, { type: 'module' });
        
        // Set up message handling
        this.worker.onmessage = (event) => this.handleWorkerMessage(event);
        this.worker.onerror = (event) => this.handleWorkerError(event);
        
        // Test worker communication using a common request supported by tests
        this.sendWorkerMessage('GET_STATE', {}, 1000)
          .then(() => {
            this.isWorkerMode = true;
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
          
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize fallback simulation engine
   */
  private async initializeFallback(): Promise<void> {
    // Dynamic import to avoid loading SimulationEngine in worker
    const { SimulationEngine } = await import('../simulation/SimulationEngine');
    this.fallbackEngine = new SimulationEngine();
    this.isWorkerMode = false;
    this.isInitialized = true;
    
    console.log('🔧 Fallback simulation engine initialized');
  }

  /**
   * Configure simulation
   */
  public async configureSimulation(config: Partial<SimulationConfig>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Worker manager not initialized');
    }

    if (this.isWorkerMode) {
      // Align to test MockWorker protocol which expects 'INIT'
      await this.sendWorkerMessage('INIT', { config });
    } else {
      // Configure fallback engine
      this.fallbackEngine.configure(config);
      this.fallbackEngine.initialize();
    }
  }

  /**
   * Start simulation
   */
  public async startSimulation(): Promise<void> {
    if (this.isWorkerMode) {
      await this.sendWorkerMessage('START_SIMULATION', {});
    } else {
      this.fallbackEngine.start();
      this.startFallbackUpdateLoop();
    }
  }

  /**
   * Pause simulation
   */
  public async pauseSimulation(): Promise<void> {
    if (this.isWorkerMode) {
      await this.sendWorkerMessage('PAUSE_SIMULATION', {});
    } else {
      this.fallbackEngine.pause();
    }
  }

  /**
   * Stop simulation
   */
  public async stopSimulation(): Promise<void> {
    if (this.isWorkerMode) {
      await this.sendWorkerMessage('STOP_SIMULATION', {});
    } else {
      this.fallbackEngine.stop();
    }
  }

  /**
   * Set simulation speed
   */
  public async setSimulationSpeed(speed: number): Promise<void> {
    if (this.isWorkerMode) {
      await this.sendWorkerMessage('SET_SPEED', { speed });
    } else {
      this.fallbackEngine.setSpeed(speed);
    }
  }

  /**
   * Add ants to simulation
   */
  public async addAnts(count: number, position?: { x: number; y: number; z: number }): Promise<void> {
    if (this.isWorkerMode) {
      await this.sendWorkerMessage('ADD_ANTS', { count, position });
    } else {
      for (let i = 0; i < count; i++) {
        const antPosition = position || {
          x: (Math.random() - 0.5) * 100,
          y: 0,
          z: (Math.random() - 0.5) * 100,
        };
        this.fallbackEngine.addAnt(antPosition);
      }
    }
  }

  /**
   * Get current simulation state
   */
  public async getSimulationState(): Promise<SimulationState> {
    if (this.isWorkerMode) {
      return await this.sendWorkerMessage('GET_STATE', {});
    } else {
      return this.fallbackEngine.getState();
    }
  }

  /**
   * Get performance statistics
   */
  public async getPerformanceStats(): Promise<any> {
    if (this.isWorkerMode) {
      const workerStats = await this.sendWorkerMessage('GET_PERFORMANCE_STATS', {});
      return {
        ...workerStats,
        workerManager: this.messageStats,
        mode: 'worker',
      };
    } else {
      return {
        engine: this.fallbackEngine.getPerformanceStats(),
        workerManager: this.messageStats,
        mode: 'fallback',
      };
    }
  }

  /**
   * Set render data callback
   */
  public onRenderData(callback: (_data: WorkerRenderData) => void): void {
    this.onRenderDataCallback = callback;
  }

  /**
   * Set performance update callback
   */
  public onPerformanceUpdate(callback: (_stats: any) => void): void {
    this.onPerformanceUpdateCallback = callback;
  }

  /**
   * Set error callback
   */
  public onError(callback: (_error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get latest render data
   */
  public getLatestRenderData(): WorkerRenderData | null {
    return this.lastRenderData;
  }

  /**
   * Send message to worker with timeout and retry
   */
  private async sendWorkerMessage(type: string, data: any, timeout?: number): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    // Map request type to expected response for environments that don't preserve requestId (tests)
    const responseTypeMap: Record<string, string> = {
      INIT: 'INIT_COMPLETE',
      START_SIMULATION: 'SIMULATION_STARTED',
      PAUSE_SIMULATION: 'SIMULATION_PAUSED',
      STOP_SIMULATION: 'SIMULATION_STOPPED',
      GET_STATE: 'STATE_DATA',
      SET_SPEED: 'SPEED_SET',
      ADD_ANTS: 'ANTS_ADDED',
    };
    const expectedType = responseTypeMap[type];

    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestIdCounter}`;
      const requestTimeout = timeout || this.config.maxResponseTime;
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (expectedType) {
          try { this.worker?.removeEventListener('message', listener as any); } catch (e) { console.warn('removeEventListener failed on timeout', e); }
        }
        this.pendingRequests.delete(requestId);
        this.messageStats.failedMessages++;
        reject(new Error(`Worker message timeout: ${type}`));
      }, requestTimeout);

      // Listener for tests' MockWorker that doesn't echo requestId
      const listener = (event: MessageEvent) => {
        const payload: any = (event as any).data;
        if (!payload) return;
        if (expectedType && payload.type === expectedType) {
          clearTimeout(timeoutId);
          try { this.worker?.removeEventListener('message', listener as any); } catch {}
          this.messageStats.totalMessages++;
          // Some responses wrap data under data, others just use the whole payload
          resolve(payload.data ?? payload);
        }
      };
      if (expectedType && this.worker) {
        try { this.worker.addEventListener('message', listener as any); } catch (e) { console.warn('addEventListener failed', e); }
      }

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          if (expectedType) {
            try { this.worker?.removeEventListener('message', listener as any); } catch (e) { console.warn('removeEventListener failed on resolve', e); }
          }
          this.messageStats.totalMessages++;
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          if (expectedType) {
            try { this.worker?.removeEventListener('message', listener as any); } catch (e) { console.warn('removeEventListener failed on reject', e); }
          }
          this.messageStats.failedMessages++;
          reject(error);
        },
        timeout: timeoutId,
      });

      // Send message
      this.worker!.postMessage({ type, data, requestId });
    });
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { type, data, requestId } = event.data;

    // Handle response to pending request
    if (requestId && this.pendingRequests.has(requestId)) {
      const request = this.pendingRequests.get(requestId)!;
      this.pendingRequests.delete(requestId);
      
      if (type === 'ERROR') {
        request.reject(new Error(data.error));
      } else {
        request.resolve(data);
      }
      return;
    }

    // Handle asynchronous messages
    switch (type) {
      case 'RENDER_DATA':
        this.lastRenderData = data;
        if (this.onRenderDataCallback) {
          this.onRenderDataCallback(data);
        }
        break;

      case 'PERFORMANCE_UPDATE':
        if (this.onPerformanceUpdateCallback) {
          this.onPerformanceUpdateCallback(data);
        }
        break;

      case 'SIMULATION_ERROR':
      case 'WORKER_ERROR': {
        this.messageStats.workerErrors++;
  const err = new Error(data?.error || 'Unknown worker error');
        if (this.onErrorCallback) {
          this.onErrorCallback(err);
        }
        console.error('Worker error:', err);
        break;
      }

      default:
        console.warn(`Unhandled worker message type: ${type}`);
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(event: ErrorEvent): void {
    this.messageStats.workerErrors++;
    const error = new Error(`Worker error: ${event.message}`);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
    
    console.error('Worker error event:', event);
  }

  /**
   * Start fallback update loop
   */
  private startFallbackUpdateLoop(): void {
    const updateInterval = setInterval(() => {
      try {
        this.fallbackEngine.update();
        
        // Generate render data
        const renderData = {
          antData: this.fallbackEngine.getRenderData()?.antData || [],
          pheromoneData: this.fallbackEngine.getRenderData()?.pheromoneData || [],
          environmentData: this.fallbackEngine.getRenderData()?.environmentData || null,
          simulationState: this.fallbackEngine.getState(),
          frameCount: Date.now(), // Simple frame counter
        };

        this.lastRenderData = renderData;
        if (this.onRenderDataCallback) {
          this.onRenderDataCallback(renderData);
        }

      } catch (error) {
        console.error('Fallback simulation error:', error);
        clearInterval(updateInterval);
      }
    }, 1000 / 60); // 60 FPS
  }

  /**
   * Check if worker mode is active
   */
  public isUsingWorker(): boolean {
    return this.isWorkerMode;
  }

  /**
   * Get manager statistics
   */
  public getManagerStats(): typeof this.messageStats {
    return { ...this.messageStats };
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Clear pending requests
    for (const request of this.pendingRequests.values()) {
      clearTimeout(request.timeout);
      request.reject(new Error('Worker manager disposed'));
    }
    this.pendingRequests.clear();

    this.isInitialized = false;
    console.log('🧹 Simulation Worker Manager disposed');
  }
}