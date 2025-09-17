/// <reference path="../../types/webgpu.d.ts" />

/**
 * WebGPU Compute Pipeline Manager
 * Handles GPU-accelerated compute operations for ant simulation
 */

export class WebGPUComputePipelineManager {
  private device: GPUDevice | null = null;
  private initialized = false;
  private computePipelines: Map<string, GPUComputePipeline> = new Map();
  private bindGroupLayouts: Map<string, GPUBindGroupLayout> = new Map();
  private buffers: Map<string, GPUBuffer> = new Map();
  private textures: Map<string, GPUTexture> = new Map();
  
  // Performance metrics
  private performanceMetrics = {
    gpuUtilization: 0,
    lastComputeTime: 0,
    averageComputeTime: 0,
    memoryUsage: 0,
  };

  /**
   * Initialize WebGPU device and resources
   */
  public async initialize(): Promise<boolean> {
    console.log('Initializing WebGPU Compute Pipeline Manager...');
    
    try {
      // Check if WebGPU is supported
      if (!navigator.gpu) {
        console.warn('WebGPU not supported in this browser');
        return false;
      }

      // Request adapter
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });
      
      if (!adapter) {
        console.warn('No suitable GPU adapter found');
        return false;
      }

      // Request device
      this.device = await adapter.requestDevice();
      this.initialized = true;
      
      console.log('WebGPU initialized successfully:', {
        vendor: await adapter.requestAdapterInfo().then(info => info.vendor),
        architecture: await adapter.requestAdapterInfo().then(info => info.architecture),
        device: adapter.features,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize WebGPU:', error);
      return false;
    }
  }

  /**
   * Check if WebGPU is available and initialized
   */
  public isAvailable(): boolean {
    return this.initialized && this.device !== null;
  }

  /**
   * Execute a compute shader step
   */
  public async executeComputeStep(deltaTime: number): Promise<void> {
    if (!this.initialized || !this.device) {
      return;
    }

    const startTime = performance.now();

    try {
      // Create command encoder
      const commandEncoder = this.device.createCommandEncoder();
      
      // Run compute passes (simplified example)
      // In a real implementation, you'd run actual compute passes here
      
      // Submit commands
      this.device.queue.submit([commandEncoder.finish()]);
      
      // Update performance metrics
      const computeTime = performance.now() - startTime;
      this.performanceMetrics.lastComputeTime = computeTime;
      this.performanceMetrics.averageComputeTime = 
        this.performanceMetrics.averageComputeTime * 0.9 + computeTime * 0.1;
      this.performanceMetrics.gpuUtilization = 
        Math.min(1.0, computeTime / (deltaTime * 1000)) * 100;
    } catch (error) {
      console.error('Error in WebGPU compute step:', error);
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Create a buffer for compute operations
   */
  public createBuffer(name: string, size: number, usage: GPUBufferUsageFlags): GPUBuffer | null {
    if (!this.device) return null;
    
    try {
      const buffer = this.device.createBuffer({
        size,
        usage,
        mappedAtCreation: false,
      });
      
      this.buffers.set(name, buffer);
      return buffer;
    } catch (error) {
      console.error(`Error creating buffer '${name}':`, error);
      return null;
    }
  }

  /**
   * Update buffer data
   */
  public updateBufferData(name: string, data: ArrayBuffer, offset = 0): boolean {
    if (!this.device) return false;
    
    const buffer = this.buffers.get(name);
    if (!buffer) {
      console.error(`Buffer '${name}' not found`);
      return false;
    }
    
    try {
      this.device.queue.writeBuffer(buffer, offset, data);
      return true;
    } catch (error) {
      console.error(`Error updating buffer '${name}':`, error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Destroy all buffers
    for (const buffer of this.buffers.values()) {
      buffer.destroy();
    }
    
    // Destroy all textures
    for (const texture of this.textures.values()) {
      texture.destroy();
    }
    
    this.buffers.clear();
    this.textures.clear();
    this.computePipelines.clear();
    this.bindGroupLayouts.clear();
    
    this.initialized = false;
    console.log('WebGPU Compute Pipeline Manager destroyed');
  }
}