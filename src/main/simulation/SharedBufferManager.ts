/**
 * SharedBufferManager - High-performance data sharing between main and renderer processes
 * Uses SharedArrayBuffer for zero-copy data transfer of simulation state
 */

import { SharedBufferConfig } from '../../shared/types';

export class SharedBufferManager {
  private antDataBuffer: SharedArrayBuffer | null = null;
  private pheromoneBuffer: SharedArrayBuffer | null = null;
  private environmentBuffer: SharedArrayBuffer | null = null;
  private metadataBuffer: SharedArrayBuffer | null = null;
  
  // Typed array views for efficient data access
  private antDataView: Float32Array | null = null;
  private pheromoneDataView: Float32Array | null = null;
  private environmentDataView: Float32Array | null = null;
  private metadataView: Int32Array | null = null;
  
  private isInitialized = false;
  
  public initialize(config: SharedBufferConfig): boolean {
    try {
      // Check if SharedArrayBuffer is supported
      if (typeof SharedArrayBuffer === 'undefined') {
        console.warn('SharedArrayBuffer not supported, falling back to regular IPC');
        return false;
      }
      
      // Create shared buffers
      this.antDataBuffer = new SharedArrayBuffer(config.antDataBufferSize);
      this.pheromoneBuffer = new SharedArrayBuffer(config.pheromoneBufferSize);
      this.environmentBuffer = new SharedArrayBuffer(config.environmentBufferSize);
      this.metadataBuffer = new SharedArrayBuffer(config.metadataBufferSize);
      
      // Create typed array views
      this.antDataView = new Float32Array(this.antDataBuffer);
      this.pheromoneDataView = new Float32Array(this.pheromoneBuffer);
      this.environmentDataView = new Float32Array(this.environmentBuffer);
      this.metadataView = new Int32Array(this.metadataBuffer);
      
      // Initialize metadata
      this.metadataView[0] = 0; // Ant count
      this.metadataView[1] = 0; // Pheromone grid width
      this.metadataView[2] = 0; // Pheromone grid height
      this.metadataView[3] = 0; // Environment data size
      this.metadataView[4] = 0; // Last update timestamp
      
      this.isInitialized = true;
      console.log('SharedBufferManager initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize SharedBufferManager:', error);
      return false;
    }
  }
  
  public updateAntData(ants: any[]): boolean {
    if (!this.isInitialized || !this.antDataView || !this.metadataView) {
      return false;
    }
    
    try {
      // Each ant uses 16 floats (64 bytes):
      // [x, y, z, rotation, health, energy, age, speed, caste_id, task_id, carrying_food, carrying_construction, is_alive, generation, reserved1, reserved2]
      
      const antDataSize = 16;
      let offset = 0;
      
      for (let i = 0; i < ants.length && offset + antDataSize <= this.antDataView.length; i++) {
        const ant = ants[i];
        
        this.antDataView[offset + 0] = ant.position.x;
        this.antDataView[offset + 1] = ant.position.y;
        this.antDataView[offset + 2] = ant.position.z || 0;
        this.antDataView[offset + 3] = ant.rotation;
        this.antDataView[offset + 4] = ant.health;
        this.antDataView[offset + 5] = ant.energy;
        this.antDataView[offset + 6] = ant.age;
        this.antDataView[offset + 7] = ant.speed;
        this.antDataView[offset + 8] = this.getCasteId(ant.caste);
        this.antDataView[offset + 9] = this.getTaskId(ant.task);
        this.antDataView[offset + 10] = ant.carryingFood ? 1 : 0;
        this.antDataView[offset + 11] = ant.carryingConstruction ? 1 : 0;
        this.antDataView[offset + 12] = ant.isAlive ? 1 : 0;
        this.antDataView[offset + 13] = ant.generation;
        this.antDataView[offset + 14] = 0; // reserved
        this.antDataView[offset + 15] = 0; // reserved
        
        offset += antDataSize;
      }
      
      // Update metadata
      this.metadataView[0] = ants.length;
      this.metadataView[4] = Date.now();
      
      return true;
      
    } catch (error) {
      console.error('Failed to update ant data in shared buffer:', error);
      return false;
    }
  }
  
  public updatePheromoneData(pheromoneData: any): boolean {
    if (!this.isInitialized || !this.pheromoneDataView || !this.metadataView) {
      return false;
    }
    
    try {
      // TODO: Implement pheromone data copying to shared buffer
      // For now, just update metadata
      this.metadataView[1] = 0; // width
      this.metadataView[2] = 0; // height
      
      return true;
      
    } catch (error) {
      console.error('Failed to update pheromone data in shared buffer:', error);
      return false;
    }
  }
  
  public updateEnvironmentData(environmentData: any): boolean {
    if (!this.isInitialized || !this.environmentDataView || !this.metadataView) {
      return false;
    }
    
    try {
      // TODO: Implement environment data copying to shared buffer
      // For now, just update metadata
      this.metadataView[3] = 0; // data size
      
      return true;
      
    } catch (error) {
      console.error('Failed to update environment data in shared buffer:', error);
      return false;
    }
  }
  
  public getBuffers(): any {
    if (!this.isInitialized) {
      return null;
    }
    
    return {
      antDataBuffer: this.antDataBuffer,
      pheromoneBuffer: this.pheromoneBuffer,
      environmentBuffer: this.environmentBuffer,
      metadataBuffer: this.metadataBuffer,
    };
  }
  
  public getMetadata(): any {
    if (!this.metadataView) {
      return null;
    }
    
    return {
      antCount: this.metadataView[0],
      pheromoneGridWidth: this.metadataView[1],
      pheromoneGridHeight: this.metadataView[2],
      environmentDataSize: this.metadataView[3],
      lastUpdate: this.metadataView[4],
    };
  }
  
  private getCasteId(caste: string): number {
    const casteMap: { [key: string]: number } = {
      'queen': 0,
      'worker': 1,
      'soldier': 2,
      'nurse': 3,
      'forager': 4,
      'architect': 5,
      'guard': 6,
      'male': 7,
    };
    
    return casteMap[caste] || 1; // Default to worker
  }
  
  private getTaskId(task: string): number {
    const taskMap: { [key: string]: number } = {
      'idle': 0,
      'forage': 1,
      'construct': 2,
      'defend': 3,
      'nurture': 4,
      'explore': 5,
      'rest': 6,
      'communicate': 7,
    };
    
    return taskMap[task] || 0; // Default to idle
  }
  
  public cleanup(): void {
    this.antDataBuffer = null;
    this.pheromoneBuffer = null;
    this.environmentBuffer = null;
    this.metadataBuffer = null;
    this.antDataView = null;
    this.pheromoneDataView = null;
    this.environmentDataView = null;
    this.metadataView = null;
    this.isInitialized = false;
    
    console.log('SharedBufferManager cleaned up');
  }
}