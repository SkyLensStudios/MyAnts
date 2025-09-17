/**
 * Data Compression System for MyAnts Simulation
 * Phase 3 Architecture Improvement - Memory optimization and data serialization
 * 
 * Integrates ISABELA compression with simulation state management
 * Provides automatic compression for state persistence and network transfer
 */

import { ISABELACompressionEngine, ISABELAConfig, DataChunk } from '../../main/memory/ISABELACompressionEngine';
import { SimulationConfiguration } from '../types-enhanced';
import { configurationManager } from '../config/ConfigurationManager';

// Compression targets for different simulation data types
export interface CompressionTargets {
  antPositions: boolean;
  antStates: boolean;
  pheromoneGrids: boolean;
  environmentData: boolean;
  aiMemory: boolean;
  physicsStates: boolean;
  colonyStatistics: boolean;
  spatialStructures: boolean;
}

// Compression performance metrics
export interface CompressionMetrics {
  totalMemorySaved: number;
  averageCompressionRatio: number;
  compressionTime: number;
  decompressionTime: number;
  chunksActive: number;
  errorRate: number;
}

// Compressed state package for persistence/transfer
export interface CompressedStatePackage {
  metadata: {
    version: string;
    timestamp: number;
    simulationTime: number;
    compressionConfig: ISABELAConfig;
    originalSize: number;
    compressedSize: number;
  };
  chunks: DataChunk[];
  checksum: string;
}

/**
 * Data Compression System
 * Manages compression for all simulation data types
 */
export class DataCompressionSystem {
  private compressionEngine: ISABELACompressionEngine;
  private config: ISABELAConfig;
  private targets: CompressionTargets;
  private metrics: CompressionMetrics;
  private activeChunks: Map<string, DataChunk> = new Map();
  private compressionQueue: Array<{
    data: any;
    type: string;
    priority: number;
    callback?: (chunk: DataChunk) => void;
  }> = [];

  constructor() {
    // Initialize compression configuration from system settings
    this.config = this.createCompressionConfig();
    this.compressionEngine = new ISABELACompressionEngine(this.config);
    
    // Set compression targets based on performance settings
    this.targets = this.createCompressionTargets();
    
    // Initialize metrics
    this.metrics = {
      totalMemorySaved: 0,
      averageCompressionRatio: 1.0,
      compressionTime: 0,
      decompressionTime: 0,
      chunksActive: 0,
      errorRate: 0
    };

    console.log('🗜️ Data Compression System initialized');
    console.log('   Targets:', this.targets);
    console.log('   Compression Level:', this.config.compressionLevel);
  }

  /**
   * Initialize the compression system
   */
  async initialize(): Promise<void> {
    try {
      await this.compressionEngine.initialize();
      
      // Subscribe to configuration changes
      configurationManager.subscribe((config) => {
        this.updateCompressionSettings(config);
      });

      console.log('✅ Data Compression System ready');
    } catch (error) {
      console.error('❌ Failed to initialize compression system:', error);
      throw error;
    }
  }

  // ============================================================================
  // Simulation Data Compression
  // ============================================================================

  /**
   * Compress ant position data
   */
  async compressAntPositions(positions: Float32Array, antCount: number): Promise<DataChunk | null> {
    if (!this.targets.antPositions) return null;

    try {
      const dimensions = { width: antCount, height: 3 }; // x, y, z per ant
      return await this.compressionEngine.compressChunk(positions, 'ant_positions', dimensions);
    } catch (error) {
      console.error('Failed to compress ant positions:', error);
      this.updateErrorRate();
      return null;
    }
  }

  /**
   * Compress ant state data (health, energy, caste, etc.)
   */
  async compressAntStates(states: Float32Array, antCount: number, stateFields: number): Promise<DataChunk | null> {
    if (!this.targets.antStates) return null;

    try {
      const dimensions = { width: antCount, height: stateFields };
      return await this.compressionEngine.compressChunk(states, 'ai_state', dimensions);
    } catch (error) {
      console.error('Failed to compress ant states:', error);
      this.updateErrorRate();
      return null;
    }
  }

  /**
   * Compress pheromone grid data
   */
  async compressPheromoneGrid(grid: Float32Array, width: number, height: number): Promise<DataChunk | null> {
    if (!this.targets.pheromoneGrids) return null;

    try {
      const dimensions = { width, height };
      return await this.compressionEngine.compressChunk(grid, 'pheromone_grid', dimensions);
    } catch (error) {
      console.error('Failed to compress pheromone grid:', error);
      this.updateErrorRate();
      return null;
    }
  }

  /**
   * Compress environmental data (temperature, humidity, etc.)
   */
  async compressEnvironmentData(data: Float32Array, dimensions: { width: number; height: number }): Promise<DataChunk | null> {
    if (!this.targets.environmentData) return null;

    try {
      return await this.compressionEngine.compressChunk(data, 'environmental_data', dimensions);
    } catch (error) {
      console.error('Failed to compress environment data:', error);
      this.updateErrorRate();
      return null;
    }
  }

  /**
   * Compress AI memory and learning data
   */
  async compressAIMemory(memory: Float32Array): Promise<DataChunk | null> {
    if (!this.targets.aiMemory) return null;

    try {
      return await this.compressionEngine.compressChunk(memory, 'ai_state');
    } catch (error) {
      console.error('Failed to compress AI memory:', error);
      this.updateErrorRate();
      return null;
    }
  }

  /**
   * Compress physics simulation state
   */
  async compressPhysicsState(state: Float32Array): Promise<DataChunk | null> {
    if (!this.targets.physicsStates) return null;

    try {
      return await this.compressionEngine.compressChunk(state, 'physics_state');
    } catch (error) {
      console.error('Failed to compress physics state:', error);
      this.updateErrorRate();
      return null;
    }
  }

  // ============================================================================
  // State Package Management
  // ============================================================================

  /**
   * Compress complete simulation state into transferable package
   */
  async compressSimulationState(simulationState: {
    ants: {
      positions: Float32Array;
      states: Float32Array;
      count: number;
    };
    environment: {
      pheromones: Float32Array;
      temperature: Float32Array;
      humidity: Float32Array;
      dimensions: { width: number; height: number };
    };
    ai: {
      memory: Float32Array;
      decisions: Float32Array;
    };
    physics: {
      forces: Float32Array;
      velocities: Float32Array;
    };
    metadata: {
      simulationTime: number;
      frameCount: number;
    };
  }): Promise<CompressedStatePackage> {
    const startTime = performance.now();
    const chunks: DataChunk[] = [];
    let originalSize = 0;

    try {
      // Compress ant data
      if (simulationState.ants.positions.length > 0) {
        const posChunk = await this.compressAntPositions(
          simulationState.ants.positions, 
          simulationState.ants.count
        );
        if (posChunk) {
          chunks.push(posChunk);
          originalSize += posChunk.originalSize;
        }

        const stateChunk = await this.compressAntStates(
          simulationState.ants.states, 
          simulationState.ants.count, 
          10 // Assume 10 state fields per ant
        );
        if (stateChunk) {
          chunks.push(stateChunk);
          originalSize += stateChunk.originalSize;
        }
      }

      // Compress environment data
      const pheromoneChunk = await this.compressPheromoneGrid(
        simulationState.environment.pheromones,
        simulationState.environment.dimensions.width,
        simulationState.environment.dimensions.height
      );
      if (pheromoneChunk) {
        chunks.push(pheromoneChunk);
        originalSize += pheromoneChunk.originalSize;
      }

      const tempChunk = await this.compressEnvironmentData(
        simulationState.environment.temperature,
        simulationState.environment.dimensions
      );
      if (tempChunk) {
        chunks.push(tempChunk);
        originalSize += tempChunk.originalSize;
      }

      // Compress AI data
      const aiChunk = await this.compressAIMemory(simulationState.ai.memory);
      if (aiChunk) {
        chunks.push(aiChunk);
        originalSize += aiChunk.originalSize;
      }

      // Compress physics data
      const physicsChunk = await this.compressPhysicsState(simulationState.physics.forces);
      if (physicsChunk) {
        chunks.push(physicsChunk);
        originalSize += physicsChunk.originalSize;
      }

      const compressionTime = performance.now() - startTime;
      const compressedSize = chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0);

      // Update metrics
      this.updateMetrics(originalSize, compressedSize, compressionTime, 0);

      // Create package
      const statePackage: CompressedStatePackage = {
        metadata: {
          version: '3.0.0',
          timestamp: Date.now(),
          simulationTime: simulationState.metadata.simulationTime,
          compressionConfig: this.config,
          originalSize,
          compressedSize
        },
        chunks,
        checksum: this.calculatePackageChecksum(chunks)
      };

      console.log(`📦 Compressed simulation state: ${originalSize} → ${compressedSize} bytes (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
      
      return statePackage;

    } catch (error) {
      console.error('Failed to compress simulation state:', error);
      throw error;
    }
  }

  /**
   * Decompress simulation state package
   */
  async decompressSimulationState(statePackage: CompressedStatePackage): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Verify package integrity
      const checksum = this.calculatePackageChecksum(statePackage.chunks);
      if (checksum !== statePackage.checksum) {
        throw new Error('Package checksum mismatch - data may be corrupted');
      }

      const decompressedData: any = {
        ants: { positions: null, states: null },
        environment: { pheromones: null, temperature: null, humidity: null },
        ai: { memory: null },
        physics: { forces: null },
        metadata: {
          simulationTime: statePackage.metadata.simulationTime,
          originalSize: statePackage.metadata.originalSize,
          compressedSize: statePackage.metadata.compressedSize
        }
      };

      // Decompress each chunk
      for (const chunk of statePackage.chunks) {
        const data = await this.compressionEngine.decompressChunk(chunk);
        
        switch (chunk.type) {
          case 'ant_positions':
            decompressedData.ants.positions = data;
            break;
          case 'ai_state':
            if (chunk.metadata.dimensions?.height === 10) { // Ant states
              decompressedData.ants.states = data;
            } else { // AI memory
              decompressedData.ai.memory = data;
            }
            break;
          case 'pheromone_grid':
            decompressedData.environment.pheromones = data;
            break;
          case 'environmental_data':
            decompressedData.environment.temperature = data;
            break;
          case 'physics_state':
            decompressedData.physics.forces = data;
            break;
        }
      }

      const decompressionTime = performance.now() - startTime;
      this.updateMetrics(0, 0, 0, decompressionTime);

      console.log(`📂 Decompressed simulation state in ${decompressionTime.toFixed(2)}ms`);
      
      return decompressedData;

    } catch (error) {
      console.error('Failed to decompress simulation state:', error);
      throw error;
    }
  }

  // ============================================================================
  // Configuration and Management
  // ============================================================================

  /**
   * Update compression settings based on configuration changes
   */
  private updateCompressionSettings(config: SimulationConfiguration): void {
    // Update compression level based on performance settings
    if (config.performance.memoryLimit < 4096) {
      this.config.compressionLevel = 5; // Maximum compression for low memory
    } else if (config.performance.memoryLimit > 16384) {
      this.config.compressionLevel = 2; // Faster compression for high memory
    } else {
      this.config.compressionLevel = 3; // Balanced compression
    }

    // Update compression targets based on settings
    this.targets.antPositions = config.world.maxAnts > 5000;
    this.targets.pheromoneGrids = config.world.size.x * config.world.size.z > 1000000;
    this.targets.aiMemory = config.ai.memoryCapacity > 1000;
    
    console.log('🔧 Updated compression settings:', {
      level: this.config.compressionLevel,
      targets: this.targets
    });
  }

  /**
   * Create compression configuration from system settings
   */
  private createCompressionConfig(): ISABELAConfig {
    const systemConfig = configurationManager.getConfiguration();
    
    return {
      compressionLevel: systemConfig.performance.memoryLimit < 8192 ? 4 : 3,
      preservePrecision: true,
      enableTemporalCompression: true,
      enableSpatialCompression: true,
      blockSize: 64,
      quantizationBits: 16,
      enableWASMAcceleration: systemConfig.performance.gpuAcceleration,
      targetCompressionRatio: 10 // Target 90% compression
    };
  }

  /**
   * Create compression targets based on simulation scale
   */
  private createCompressionTargets(): CompressionTargets {
    const config = configurationManager.getConfiguration();
    
    return {
      antPositions: config.world.maxAnts > 1000,
      antStates: config.world.maxAnts > 1000,
      pheromoneGrids: config.world.size.x * config.world.size.z > 250000,
      environmentData: true,
      aiMemory: config.ai.memoryCapacity > 500,
      physicsStates: config.world.maxAnts > 2000,
      colonyStatistics: false, // Usually small data
      spatialStructures: config.world.maxAnts > 5000
    };
  }

  /**
   * Calculate package checksum for integrity verification
   */
  private calculatePackageChecksum(chunks: DataChunk[]): string {
    const data = chunks.map(chunk => chunk.metadata.checksum).join('');
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Update compression metrics
   */
  private updateMetrics(originalSize: number, compressedSize: number, compressionTime: number, decompressionTime: number): void {
    if (originalSize > 0 && compressedSize > 0) {
      this.metrics.totalMemorySaved += (originalSize - compressedSize);
      this.metrics.averageCompressionRatio = originalSize / compressedSize;
    }
    
    if (compressionTime > 0) {
      this.metrics.compressionTime = (this.metrics.compressionTime + compressionTime) / 2;
    }
    
    if (decompressionTime > 0) {
      this.metrics.decompressionTime = (this.metrics.decompressionTime + decompressionTime) / 2;
    }
    
    this.metrics.chunksActive = this.activeChunks.size;
  }

  /**
   * Update error rate metric
   */
  private updateErrorRate(): void {
    this.metrics.errorRate = Math.min(1.0, this.metrics.errorRate + 0.01);
  }

  /**
   * Get current compression metrics
   */
  public getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    totalSaved: number;
    compressionRatio: number;
    activeChunks: number;
  } {
    return {
      totalSaved: this.metrics.totalMemorySaved,
      compressionRatio: this.metrics.averageCompressionRatio,
      activeChunks: this.metrics.chunksActive
    };
  }
}

// Export singleton instance
export const dataCompressionSystem = new DataCompressionSystem();

// Utility functions for common compression tasks
export async function compressForPersistence(state: any): Promise<CompressedStatePackage> {
  return await dataCompressionSystem.compressSimulationState(state);
}

export async function decompressFromPersistence(statePackage: CompressedStatePackage): Promise<any> {
  return await dataCompressionSystem.decompressSimulationState(statePackage);
}

export function getCompressionMetrics(): CompressionMetrics {
  return dataCompressionSystem.getMetrics();
}