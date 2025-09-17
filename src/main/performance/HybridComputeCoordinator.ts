/**
 * Hybrid Compute Coordinator  
 * Orchestrates workload distribution between JavaScript, WebAssembly, and GPU compute
 */

import { WASMModuleManager } from './WASMModuleManager';
import { LODLevel } from './LODSystem';

export interface ComputeCapabilities {
  hasWebAssembly: boolean;
  hasWebGL2: boolean;
  hasWebGPU: boolean;
  hasSharedArrayBuffer: boolean;
  maxTextureSize: number;
  maxComputeUnits: number;
}

export interface ComputeTask {
  id: string;
  type: 'physics' | 'ai' | 'pathfinding' | 'pheromones';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dataSize: number;
  expectedDuration: number;
  lodLevel: LODLevel;
  requiresGPU: boolean;
}

export interface ComputeResult {
  taskId: string;
  processingTime: number;
  computeMethod: 'javascript' | 'webassembly' | 'gpu';
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Coordinates compute workloads across different processing units
 */
export class HybridComputeCoordinator {
  private wasmManager: WASMModuleManager;
  private capabilities: ComputeCapabilities;
  private taskQueue: ComputeTask[] = [];
  private processingTasks: Map<string, ComputeTask> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.wasmManager = new WASMModuleManager();
    this.capabilities = this.detectCapabilities();
  }

  /**
   * Initialize the hybrid compute system
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize WebAssembly modules if supported
      if (this.capabilities.hasWebAssembly) {
        await this.wasmManager.initialize();
      }
      
      // Initialize GPU compute contexts if supported
      if (this.capabilities.hasWebGL2) {
        await this.initializeWebGLCompute();
      }
      
      if (this.capabilities.hasWebGPU) {
        await this.initializeWebGPUCompute();
      }
      
      this.isInitialized = true;
      console.log('Hybrid compute coordinator initialized');
      console.log('Capabilities:', this.capabilities);
      
    } catch (error) {
      console.error('Failed to initialize hybrid compute:', error);
      throw error;
    }
  }

  /**
   * Detect available compute capabilities
   */
  private detectCapabilities(): ComputeCapabilities {
    // Check WebAssembly support
    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    
    // Check SharedArrayBuffer support
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    
    // Check WebGL2 support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const hasWebGL2 = !!gl;
    const maxTextureSize = hasWebGL2 ? gl!.getParameter(gl!.MAX_TEXTURE_SIZE) : 0;
    
    // Check WebGPU support (experimental)
    const hasWebGPU = 'gpu' in navigator;
    
    return {
      hasWebAssembly,
      hasWebGL2,
      hasWebGPU,
      hasSharedArrayBuffer,
      maxTextureSize,
      maxComputeUnits: navigator.hardwareConcurrency || 4,
    };
  }

  /**
   * Initialize WebGL compute shaders
   */
  private async initializeWebGLCompute(): Promise<void> {
    // WebGL compute setup would go here
    // For now, just log that it's available
    console.log('WebGL2 compute context initialized');
  }

  /**
   * Initialize WebGPU compute (experimental)
   */
  private async initializeWebGPUCompute(): Promise<void> {
    try {
      if ('gpu' in navigator) {
        // WebGPU setup would go here
        console.log('WebGPU compute context initialized');
      }
    } catch (error) {
      console.warn('WebGPU initialization failed:', error);
    }
  }

  /**
   * Submit a compute task for processing
   */
  public submitTask(task: ComputeTask): Promise<ComputeResult> {
    return new Promise((resolve, reject) => {
      // Add completion callback to task
      (task as any).onComplete = resolve;
      (task as any).onError = reject;
      
      // Add to queue
      this.taskQueue.push(task);
      
      // Process queue
      this.processTaskQueue();
    });
  }

  /**
   * Process the task queue
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;
    
    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Process tasks based on available resources
    while (this.taskQueue.length > 0 && this.canProcessMoreTasks()) {
      const task = this.taskQueue.shift()!;
      this.processTask(task);
    }
  }

  /**
   * Check if we can process more tasks concurrently
   */
  private canProcessMoreTasks(): boolean {
    return this.processingTasks.size < this.capabilities.maxComputeUnits;
  }

  /**
   * Process a single compute task
   */
  private async processTask(task: ComputeTask): Promise<void> {
    this.processingTasks.set(task.id, task);
    const startTime = performance.now();
    
    try {
      let result: ComputeResult;
      
      // Determine best compute method for this task
      const computeMethod = this.selectComputeMethod(task);
      
      switch (computeMethod) {
        case 'webassembly':
          result = await this.processWithWASM(task);
          break;
        case 'gpu':
          result = await this.processWithGPU(task);
          break;
        default:
          result = await this.processWithJavaScript(task);
      }
      
      const processingTime = performance.now() - startTime;
      result.processingTime = processingTime;
      
      // Update performance history
      this.updatePerformanceHistory(task.type, computeMethod, processingTime);
      
      // Complete task
      if ((task as any).onComplete) {
        (task as any).onComplete(result);
      }
      
    } catch (error) {
      const result: ComputeResult = {
        taskId: task.id,
        processingTime: performance.now() - startTime,
        computeMethod: 'javascript',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      if ((task as any).onError) {
        (task as any).onError(result);
      }
    } finally {
      this.processingTasks.delete(task.id);
      
      // Continue processing queue
      setTimeout(() => this.processTaskQueue(), 0);
    }
  }

  /**
   * Select the best compute method for a task
   */
  private selectComputeMethod(task: ComputeTask): 'javascript' | 'webassembly' | 'gpu' {
    // GPU-specific tasks
    if (task.requiresGPU && this.capabilities.hasWebGL2 && task.type === 'pheromones') {
      return 'gpu';
    }
    
    // Large batch tasks benefit from WASM
    if (this.capabilities.hasWebAssembly && task.dataSize > 1000) {
      return 'webassembly';
    }
    
    // Check performance history for this task type
    const history = this.getPerformanceHistory(task.type);
    if (history.webassembly && history.javascript) {
      const wasmAvg = history.webassembly.reduce((a, b) => a + b, 0) / history.webassembly.length;
      const jsAvg = history.javascript.reduce((a, b) => a + b, 0) / history.javascript.length;
      
      if (wasmAvg < jsAvg * 0.8) { // WASM is 20% faster
        return 'webassembly';
      }
    }
    
    // Default to JavaScript
    return 'javascript';
  }

  /**
   * Process task with WebAssembly
   */
  private async processWithWASM(task: ComputeTask): Promise<ComputeResult> {
    if (!this.wasmManager.isReady()) {
      throw new Error('WASM modules not ready');
    }

    let data: any;
    
    switch (task.type) {
      case 'physics':
        // Mock physics processing
        data = await this.mockPhysicsWASM(task);
        break;
      case 'ai':
        // Mock AI processing  
        data = await this.mockAIWASM(task);
        break;
      case 'pathfinding':
        // Mock pathfinding processing
        data = await this.mockPathfindingWASM(task);
        break;
      default:
        throw new Error(`WASM processing not implemented for ${task.type}`);
    }

    return {
      taskId: task.id,
      processingTime: 0, // Will be set by caller
      computeMethod: 'webassembly',
      success: true,
      data,
    };
  }

  /**
   * Process task with GPU compute
   */
  private async processWithGPU(task: ComputeTask): Promise<ComputeResult> {
    if (task.type === 'pheromones' && this.capabilities.hasWebGL2) {
      // Mock pheromone GPU processing
      const data = await this.mockPheromoneGPU(task);
      
      return {
        taskId: task.id,
        processingTime: 0,
        computeMethod: 'gpu', 
        success: true,
        data,
      };
    }
    
    throw new Error(`GPU processing not available for ${task.type}`);
  }

  /**
   * Process task with JavaScript
   */
  private async processWithJavaScript(task: ComputeTask): Promise<ComputeResult> {
    // Mock JavaScript processing
    await new Promise(resolve => setTimeout(resolve, task.expectedDuration));
    
    return {
      taskId: task.id,
      processingTime: 0,
      computeMethod: 'javascript',
      success: true,
      data: { result: 'mock_js_result' },
    };
  }

  // Mock implementations for testing
  private async mockPhysicsWASM(task: ComputeTask): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, task.expectedDuration * 0.3));
    return { physicsResult: 'wasm_physics' };
  }

  private async mockAIWASM(task: ComputeTask): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, task.expectedDuration * 0.4));
    return { aiResult: 'wasm_ai' };
  }

  private async mockPathfindingWASM(task: ComputeTask): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, task.expectedDuration * 0.2));
    return { pathResult: 'wasm_pathfinding' };
  }

  private async mockPheromoneGPU(task: ComputeTask): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, task.expectedDuration * 0.1));
    return { pheromoneResult: 'gpu_pheromones' };
  }

  /**
   * Update performance history for compute method selection
   */
  private updatePerformanceHistory(
    taskType: string, 
    computeMethod: string, 
    processingTime: number,
  ): void {
    const key = `${taskType}_${computeMethod}`;
    const history = this.performanceHistory.get(key) || [];
    
    history.push(processingTime);
    
    // Keep only last 100 measurements
    if (history.length > 100) {
      history.shift();
    }
    
    this.performanceHistory.set(key, history);
  }

  /**
   * Get performance history for task type
   */
  private getPerformanceHistory(taskType: string): {
    javascript?: number[];
    webassembly?: number[];
    gpu?: number[];
  } {
    return {
      javascript: this.performanceHistory.get(`${taskType}_javascript`),
      webassembly: this.performanceHistory.get(`${taskType}_webassembly`),
      gpu: this.performanceHistory.get(`${taskType}_gpu`),
    };
  }

  /**
   * Get system capabilities
   */
  public getCapabilities(): ComputeCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Get current task queue status
   */
  public getQueueStatus(): {
    queuedTasks: number;
    processingTasks: number;
    totalCapacity: number;
  } {
    return {
      queuedTasks: this.taskQueue.length,
      processingTasks: this.processingTasks.size,
      totalCapacity: this.capabilities.maxComputeUnits,
    };
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): Map<string, { avg: number; min: number; max: number }> {
    const stats = new Map();
    
    for (const [key, history] of this.performanceHistory.entries()) {
      if (history.length > 0) {
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        const min = Math.min(...history);
        const max = Math.max(...history);
        
        stats.set(key, { avg, min, max });
      }
    }
    
    return stats;
  }

  /**
   * Clear task queue
   */
  public clearQueue(): void {
    this.taskQueue.length = 0;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.clearQueue();
    this.processingTasks.clear();
    this.performanceHistory.clear();
    this.wasmManager.destroy();
    this.isInitialized = false;
  }
}