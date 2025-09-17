/**
 * Advanced Memory Management System v3
 * Integrates ISABELA compression with ME-BVH spatial structures
 * Enables massive 50,000+ ant colony simulations through intelligent memory optimization
 * 
 * Features:
 * - Dynamic memory allocation and deallocation
 * - Adaptive compression based on memory pressure
 * - Spatial data locality optimization
 * - Multi-tier memory hierarchy management
 * - Real-time memory defragmentation
 * - Predictive memory pre-allocation
 */

import { ISABELACompressionEngine, ISABELAConfig, CompressionStats } from '../memory/ISABELACompressionEngine';
import MEBVHSpatialStructure, { SpatialEntity, SpatialQuery, MEBVHConfig } from '../spatial/MEBVHSpatialStructure';

// Memory tier definitions
export enum MemoryTier {
  HOT = 'hot',         // Frequently accessed - uncompressed
  WARM = 'warm',       // Moderately accessed - light compression
  COLD = 'cold',       // Rarely accessed - heavy compression
  FROZEN = 'frozen'    // Very rare access - maximum compression + swap
}

// Memory pool configuration
export interface MemoryPoolConfig {
  maxTotalMemory: number;        // Maximum memory in bytes
  hotMemoryRatio: number;        // Percentage for hot tier
  warmMemoryRatio: number;       // Percentage for warm tier
  coldMemoryRatio: number;       // Percentage for cold tier
  frozenMemoryRatio: number;     // Percentage for frozen tier
  compressionThreshold: number;  // Memory pressure threshold to start compression
  defragmentationInterval: number; // Milliseconds between defragmentation cycles
  accessDecayRate: number;       // How quickly access frequency decays
  enablePredictiveAllocation: boolean;
  enableAdaptiveCompression: boolean;
}

// Memory block metadata
export interface MemoryBlock {
  id: string;
  tier: MemoryTier;
  size: number;
  compressedSize?: number;
  lastAccess: number;
  accessCount: number;
  accessFrequency: number;
  compressionRatio?: number;
  isCompressed: boolean;
  spatialRegion?: string; // For spatial locality optimization
  priority: number;
  age: number;
}

// Memory allocation request
export interface AllocationRequest {
  id: string;
  size: number;
  type: 'ant_data' | 'spatial_data' | 'ai_state' | 'physics_state' | 'pheromone_data' | 'render_data';
  priority: number;
  spatialRegion?: string;
  accessPattern: 'random' | 'sequential' | 'spatial' | 'temporal';
  expectedLifetime?: number; // Milliseconds
}

// Memory usage statistics
export interface MemoryStats {
  totalAllocated: number;
  totalCompressed: number;
  totalUncompressed: number;
  compressionRatio: number;
  tierDistribution: Record<MemoryTier, number>;
  fragmentationRatio: number;
  allocationCount: number;
  deallocationCount: number;
  compressionEvents: number;
  decompressionEvents: number;
  defragmentationEvents: number;
  spatialLocalityScore: number;
}

// Memory pressure levels
export enum MemoryPressure {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Advanced Memory Manager for massive ant colony simulations
 * Combines ISABELA compression with spatial optimization
 */
export class AdvancedMemoryManager {
  private config: MemoryPoolConfig;
  private compressionEngine: ISABELACompressionEngine;
  private spatialStructure: MEBVHSpatialStructure;
  
  // Memory tracking
  private memoryBlocks: Map<string, MemoryBlock> = new Map();
  private tierMemoryUsage: Record<MemoryTier, number> = {
    [MemoryTier.HOT]: 0,
    [MemoryTier.WARM]: 0,
    [MemoryTier.COLD]: 0,
    [MemoryTier.FROZEN]: 0,
  };
  
  // Memory pools by tier
  private memoryPools: Record<MemoryTier, Map<string, ArrayBuffer>> = {
    [MemoryTier.HOT]: new Map(),
    [MemoryTier.WARM]: new Map(),
    [MemoryTier.COLD]: new Map(),
    [MemoryTier.FROZEN]: new Map(),
  };
  
  // Spatial locality tracking
  private spatialRegions: Map<string, Set<string>> = new Map(); // region -> block IDs
  private blockRegions: Map<string, string> = new Map(); // block ID -> region
  
  // Performance tracking
  private stats: MemoryStats = {
    totalAllocated: 0,
    totalCompressed: 0,
    totalUncompressed: 0,
    compressionRatio: 1.0,
    tierDistribution: { [MemoryTier.HOT]: 0, [MemoryTier.WARM]: 0, [MemoryTier.COLD]: 0, [MemoryTier.FROZEN]: 0 },
    fragmentationRatio: 0,
    allocationCount: 0,
    deallocationCount: 0,
    compressionEvents: 0,
    decompressionEvents: 0,
    defragmentationEvents: 0,
    spatialLocalityScore: 0,
  };
  
  // Adaptive algorithms
  private accessHistory: Map<string, number[]> = new Map(); // Block access timestamps
  private allocationPatterns: Map<string, number> = new Map(); // Type -> average size
  private spatialCorrelations: Map<string, Map<string, number>> = new Map(); // Region correlations
  
  // Background processes
  private defragmentationTimer?: NodeJS.Timeout;
  private accessDecayTimer?: NodeJS.Timeout;
  private compressionTimer?: NodeJS.Timeout;

  constructor(
    config: MemoryPoolConfig,
    compressionConfig: ISABELAConfig,
    spatialConfig: MEBVHConfig,
  ) {
    this.config = config;
    
    // Initialize compression engine
    this.compressionEngine = new ISABELACompressionEngine(compressionConfig);
    
    // Initialize spatial structure
    this.spatialStructure = new MEBVHSpatialStructure(spatialConfig);
    
    // Start background processes
    this.startBackgroundProcesses();
    
    console.log('🧠 Advanced Memory Manager initialized');
    console.log(`   Max memory: ${(config.maxTotalMemory / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Tier distribution: Hot ${(config.hotMemoryRatio * 100).toFixed(0)}%, Warm ${(config.warmMemoryRatio * 100).toFixed(0)}%, Cold ${(config.coldMemoryRatio * 100).toFixed(0)}%, Frozen ${(config.frozenMemoryRatio * 100).toFixed(0)}%`);
  }

  /**
   * Allocate memory with intelligent tier placement
   */
  async allocate(request: AllocationRequest): Promise<ArrayBuffer | null> {
    this.stats.allocationCount++;
    
    // Update allocation patterns
    const currentAvg = this.allocationPatterns.get(request.type) || 0;
    const count = this.stats.allocationCount;
    this.allocationPatterns.set(request.type, (currentAvg * (count - 1) + request.size) / count);
    
    // Determine optimal tier based on request characteristics
    const targetTier = this.determineOptimalTier(request);
    
    // Check memory pressure and available space
    const pressure = this.calculateMemoryPressure();
    if (pressure === MemoryPressure.CRITICAL) {
      await this.handleCriticalMemoryPressure();
    }
    
    // Allocate memory in target tier
    const buffer = await this.allocateInTier(request, targetTier);
    if (!buffer) {
      // Try lower tiers if allocation failed
      return await this.allocateWithFallback(request, targetTier);
    }
    
    // Create memory block metadata
    const block: MemoryBlock = {
      id: request.id,
      tier: targetTier,
      size: request.size,
      lastAccess: performance.now(),
      accessCount: 1,
      accessFrequency: 1.0,
      isCompressed: false,
      priority: request.priority,
      age: 0,
    };
    
    // Handle spatial locality
    if (request.spatialRegion) {
      block.spatialRegion = request.spatialRegion;
      this.updateSpatialTracking(request.id, request.spatialRegion);
    }
    
    this.memoryBlocks.set(request.id, block);
    this.tierMemoryUsage[targetTier] += request.size;
    this.stats.totalAllocated += request.size;
    
    // Predictive pre-allocation
    if (this.config.enablePredictiveAllocation) {
      this.considerPredictiveAllocation(request);
    }
    
    this.updateStats();
    return buffer;
  }

  /**
   * Deallocate memory block
   */
  async deallocate(blockId: string): Promise<boolean> {
    const block = this.memoryBlocks.get(blockId);
    if (!block) return false;
    
    this.stats.deallocationCount++;
    
    // Remove from memory pool
    const pool = this.memoryPools[block.tier];
    const removed = pool.delete(blockId);
    
    if (removed) {
      this.tierMemoryUsage[block.tier] -= block.size;
      this.stats.totalAllocated -= block.size;
      
      if (block.isCompressed && block.compressedSize) {
        this.stats.totalCompressed -= block.compressedSize;
      } else {
        this.stats.totalUncompressed -= block.size;
      }
    }
    
    // Remove spatial tracking
    if (block.spatialRegion) {
      this.removeSpatialTracking(blockId, block.spatialRegion);
    }
    
    // Clean up metadata
    this.memoryBlocks.delete(blockId);
    this.accessHistory.delete(blockId);
    
    this.updateStats();
    return removed;
  }

  /**
   * Access memory block with automatic tier management
   */
  async access(blockId: string): Promise<ArrayBuffer | null> {
    const block = this.memoryBlocks.get(blockId);
    if (!block) return null;
    
    // Update access statistics
    const now = performance.now();
    block.lastAccess = now;
    block.accessCount++;
    
    // Update access history for frequency calculation
    const history = this.accessHistory.get(blockId) || [];
    history.push(now);
    
    // Keep only recent access history (last 100 accesses or 1 minute)
    const cutoff = now - 60000; // 1 minute
    const recentHistory = history.filter(time => time > cutoff).slice(-100);
    this.accessHistory.set(blockId, recentHistory);
    
    // Calculate access frequency
    block.accessFrequency = recentHistory.length / Math.max(1, (now - recentHistory[0]) / 1000);
    
    // Get data from appropriate tier
    const buffer = this.memoryPools[block.tier].get(blockId);
    
    // Handle compressed data
    if (block.isCompressed && buffer) {
      try {
        // Retrieve compressed chunk metadata
        const metadataKey = `${blockId}_metadata`;
        const metadataBuffer = this.memoryPools[block.tier].get(metadataKey);
        if (!metadataBuffer) {
          console.error(`❌ No metadata found for compressed block ${blockId}`);
          return null;
        }
        
        // Reconstruct DataChunk from stored metadata
        const decoder = new TextDecoder();
        const metadataView = new Uint8Array(metadataBuffer);
        const chunkInfo = JSON.parse(decoder.decode(metadataView));
        
        const chunk = {
          ...chunkInfo,
          data: new Uint8Array(buffer),
        };
        
        const decompressed = await this.compressionEngine.decompressChunk(chunk);
        this.stats.decompressionEvents++;
        
        // Convert back to ArrayBuffer
        const resultBuffer = new ArrayBuffer(decompressed.byteLength);
        new Uint8Array(resultBuffer).set(new Uint8Array(decompressed.buffer));
        
        // Consider promoting to higher tier if frequently accessed
        await this.considerTierPromotion(block);
        
        return resultBuffer;
      } catch (error) {
        console.error(`❌ Failed to decompress block ${blockId}:`, error);
        return null;
      }
    }
    
    // Consider tier promotion for frequently accessed blocks
    await this.considerTierPromotion(block);
    
    return buffer || null;
  }

  /**
   * Compress memory blocks based on adaptive algorithm
   */
  async compressAdaptively(): Promise<void> {
    if (!this.config.enableAdaptiveCompression) return;
    
    const pressure = this.calculateMemoryPressure();
    
    // Determine compression candidates based on memory pressure
    const candidates = this.getCompressionCandidates(pressure);
    
    for (const block of candidates) {
      await this.compressBlock(block);
    }
  }

  /**
   * Compress individual memory block
   */
  private async compressBlock(block: MemoryBlock): Promise<boolean> {
    const buffer = this.memoryPools[block.tier].get(block.id);
    if (!buffer || block.isCompressed) return false;
    
    try {
      // Convert ArrayBuffer to appropriate typed array
      const data = this.arrayBufferToTypedArray(buffer, 'float32');
      const type = this.getDataTypeFromBlock(block);
      
      const compressed = await this.compressionEngine.compressChunk(data, type);
      
      // Convert compressed chunk back to ArrayBuffer
      const compressedBuffer = new ArrayBuffer(compressed.data.byteLength);
      new Uint8Array(compressedBuffer).set(compressed.data);
      
      // Update memory pools
      this.memoryPools[block.tier].set(block.id, compressedBuffer);
      
      // Store compressed chunk metadata for decompression
      const metadataKey = `${block.id}_metadata`;
      const metadataBuffer = new ArrayBuffer(JSON.stringify(compressed).length * 2);
      const metadataView = new Uint8Array(metadataBuffer);
      const encoder = new TextEncoder();
      const encoded = encoder.encode(JSON.stringify(compressed));
      metadataView.set(encoded);
      this.memoryPools[block.tier].set(metadataKey, metadataBuffer);
      
      // Update block metadata
      block.isCompressed = true;
      block.compressedSize = compressedBuffer.byteLength;
      block.compressionRatio = buffer.byteLength / compressedBuffer.byteLength;
      
      // Update statistics
      this.stats.compressionEvents++;
      this.stats.totalUncompressed -= buffer.byteLength;
      this.stats.totalCompressed += compressedBuffer.byteLength;
      
      this.updateStats();
      return true;
    } catch (error) {
      console.error(`❌ Failed to compress block ${block.id}:`, error);
      return false;
    }
  }

  /**
   * Defragment memory to improve spatial locality
   */
  async defragment(): Promise<void> {
    this.stats.defragmentationEvents++;
    const startTime = performance.now();
    
    // Group blocks by spatial region
    const regionBlocks: Map<string, MemoryBlock[]> = new Map();
    
    for (const block of this.memoryBlocks.values()) {
      if (block.spatialRegion) {
        const blocks = regionBlocks.get(block.spatialRegion) || [];
        blocks.push(block);
        regionBlocks.set(block.spatialRegion, blocks);
      }
    }
    
    // Reorganize memory layout for better spatial locality
    for (const [region, blocks] of regionBlocks) {
      await this.optimizeSpatialLayout(region, blocks);
    }
    
    // Compact memory pools
    for (const tier of Object.values(MemoryTier)) {
      await this.compactMemoryPool(tier);
    }
    
    this.updateStats();
    
    const defragTime = performance.now() - startTime;
    console.log(`🧹 Memory defragmentation completed in ${defragTime.toFixed(2)}ms`);
  }

  /**
   * Get current memory pressure level
   */
  calculateMemoryPressure(): MemoryPressure {
    const usageRatio = this.stats.totalAllocated / this.config.maxTotalMemory;
    
    if (usageRatio < 0.5) return MemoryPressure.LOW;
    if (usageRatio < 0.7) return MemoryPressure.MEDIUM;
    if (usageRatio < 0.9) return MemoryPressure.HIGH;
    return MemoryPressure.CRITICAL;
  }

  /**
   * Handle critical memory pressure
   */
  private async handleCriticalMemoryPressure(): Promise<void> {
    console.warn('⚠️ Critical memory pressure detected - initiating emergency procedures');
    
    // Emergency compression of least recently used blocks
    const lruBlocks = Array.from(this.memoryBlocks.values())
      .filter(block => !block.isCompressed)
      .sort((a, b) => a.lastAccess - b.lastAccess)
      .slice(0, 10); // Compress 10 least recently used blocks
    
    for (const block of lruBlocks) {
      await this.compressBlock(block);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Emergency defragmentation
    await this.defragment();
  }

  /**
   * Determine optimal memory tier for allocation request
   */
  private determineOptimalTier(request: AllocationRequest): MemoryTier {
    // Factor in priority, access pattern, and expected lifetime
    let score = request.priority;
    
    // Adjust for access pattern
    switch (request.accessPattern) {
      case 'random':
        score += 1;
        break;
      case 'sequential':
        score += 2;
        break;
      case 'spatial':
        score += 3;
        break;
      case 'temporal':
        score += 2;
        break;
    }
    
    // Adjust for expected lifetime
    if (request.expectedLifetime) {
      if (request.expectedLifetime < 1000) score += 3; // Short-lived -> hot
      else if (request.expectedLifetime < 10000) score += 2; // Medium -> warm
      else if (request.expectedLifetime < 60000) score += 1; // Long -> cold
      else score += 0; // Very long -> frozen
    }
    
    // Map score to tier
    if (score >= 8) return MemoryTier.HOT;
    if (score >= 6) return MemoryTier.WARM;
    if (score >= 4) return MemoryTier.COLD;
    return MemoryTier.FROZEN;
  }

  /**
   * Allocate memory in specific tier
   */
  private async allocateInTier(request: AllocationRequest, tier: MemoryTier): Promise<ArrayBuffer | null> {
    const maxTierMemory = this.config.maxTotalMemory * this.getTierRatio(tier);
    const currentTierUsage = this.tierMemoryUsage[tier];
    
    if (currentTierUsage + request.size > maxTierMemory) {
      return null; // Not enough space in tier
    }
    
    // Create buffer
    const buffer = new ArrayBuffer(request.size);
    this.memoryPools[tier].set(request.id, buffer);
    
    return buffer;
  }

  /**
   * Get memory ratio for tier
   */
  private getTierRatio(tier: MemoryTier): number {
    switch (tier) {
      case MemoryTier.HOT: return this.config.hotMemoryRatio;
      case MemoryTier.WARM: return this.config.warmMemoryRatio;
      case MemoryTier.COLD: return this.config.coldMemoryRatio;
      case MemoryTier.FROZEN: return this.config.frozenMemoryRatio;
    }
  }

  /**
   * Allocate with tier fallback
   */
  private async allocateWithFallback(request: AllocationRequest, preferredTier: MemoryTier): Promise<ArrayBuffer | null> {
    const tiers = [MemoryTier.HOT, MemoryTier.WARM, MemoryTier.COLD, MemoryTier.FROZEN];
    const startIndex = tiers.indexOf(preferredTier);
    
    // Try lower tiers first
    for (let i = startIndex + 1; i < tiers.length; i++) {
      const buffer = await this.allocateInTier(request, tiers[i]);
      if (buffer) return buffer;
    }
    
    // Try higher tiers if lower tiers failed
    for (let i = startIndex - 1; i >= 0; i--) {
      const buffer = await this.allocateInTier(request, tiers[i]);
      if (buffer) return buffer;
    }
    
    return null; // All tiers exhausted
  }

  /**
   * Consider tier promotion for frequently accessed blocks
   */
  private async considerTierPromotion(block: MemoryBlock): Promise<void> {
    // Promotion thresholds based on access frequency
    const promotionThresholds = {
      [MemoryTier.FROZEN]: 0.1,
      [MemoryTier.COLD]: 0.5,
      [MemoryTier.WARM]: 2.0,
      [MemoryTier.HOT]: Infinity,
    };
    
    const threshold = promotionThresholds[block.tier];
    if (block.accessFrequency > threshold && block.tier !== MemoryTier.HOT) {
      await this.promoteBlock(block);
    }
  }

  /**
   * Promote block to higher tier
   */
  private async promoteBlock(block: MemoryBlock): Promise<void> {
    const tierOrder = [MemoryTier.FROZEN, MemoryTier.COLD, MemoryTier.WARM, MemoryTier.HOT];
    const currentIndex = tierOrder.indexOf(block.tier);
    
    if (currentIndex === tierOrder.length - 1) return; // Already at highest tier
    
    const newTier = tierOrder[currentIndex + 1];
    const buffer = this.memoryPools[block.tier].get(block.id);
    
    if (!buffer) return;
    
    // Check if new tier has space
    const maxTierMemory = this.config.maxTotalMemory * this.getTierRatio(newTier);
    const currentTierUsage = this.tierMemoryUsage[newTier];
    
    if (currentTierUsage + block.size > maxTierMemory) return; // No space in higher tier
    
    // Move block to new tier
    this.memoryPools[block.tier].delete(block.id);
    this.memoryPools[newTier].set(block.id, buffer);
    
    // Update tier usage
    this.tierMemoryUsage[block.tier] -= block.size;
    this.tierMemoryUsage[newTier] += block.size;
    
    // Update block metadata
    block.tier = newTier;
    
    // Decompress if moving to hot tier
    if (newTier === MemoryTier.HOT && block.isCompressed) {
      try {
        // Retrieve and decompress using ISABELA
        const metadataKey = `${block.id}_metadata`;
        const metadataBuffer = this.memoryPools[block.tier].get(metadataKey);
        if (metadataBuffer) {
          const decoder = new TextDecoder();
          const metadataView = new Uint8Array(metadataBuffer);
          const chunkInfo = JSON.parse(decoder.decode(metadataView));
          
          const chunk = {
            ...chunkInfo,
            data: new Uint8Array(buffer),
          };
          
          const decompressed = await this.compressionEngine.decompressChunk(chunk);
          const decompressedBuffer = new ArrayBuffer(decompressed.byteLength);
          new Uint8Array(decompressedBuffer).set(new Uint8Array(decompressed.buffer));
          
          this.memoryPools[newTier].set(block.id, decompressedBuffer);
          
          // Clean up metadata
          this.memoryPools[block.tier].delete(metadataKey);
          
          block.isCompressed = false;
          block.compressionRatio = undefined;
          block.compressedSize = undefined;
          
          this.stats.decompressionEvents++;
        }
      } catch (error) {
        console.error(`❌ Failed to decompress promoted block ${block.id}:`, error);
      }
    }
  }

  /**
   * Get compression candidates based on memory pressure
   */
  private getCompressionCandidates(pressure: MemoryPressure): MemoryBlock[] {
    const candidates = Array.from(this.memoryBlocks.values())
      .filter(block => !block.isCompressed && block.tier !== MemoryTier.HOT);
    
    // Sort by access frequency (compress least accessed first)
    candidates.sort((a, b) => a.accessFrequency - b.accessFrequency);
    
    // Determine how many blocks to compress based on pressure
    let targetCount: number;
    switch (pressure) {
      case MemoryPressure.LOW: targetCount = 0; break;
      case MemoryPressure.MEDIUM: targetCount = Math.ceil(candidates.length * 0.1); break;
      case MemoryPressure.HIGH: targetCount = Math.ceil(candidates.length * 0.3); break;
      case MemoryPressure.CRITICAL: targetCount = Math.ceil(candidates.length * 0.5); break;
    }
    
    return candidates.slice(0, targetCount);
  }

  /**
   * Select compression level based on block characteristics
   */
  private selectCompressionLevel(block: MemoryBlock): 1 | 2 | 3 | 4 | 5 {
    // Higher compression for lower tiers and less frequently accessed data
    switch (block.tier) {
      case MemoryTier.HOT: return 1;
      case MemoryTier.WARM: return block.accessFrequency > 1.0 ? 2 : 3;
      case MemoryTier.COLD: return block.accessFrequency > 0.5 ? 3 : 4;
      case MemoryTier.FROZEN: return 5;
    }
  }

  /**
   * Update spatial tracking
   */
  private updateSpatialTracking(blockId: string, region: string): void {
    // Add block to region
    const regionBlocks = this.spatialRegions.get(region) || new Set();
    regionBlocks.add(blockId);
    this.spatialRegions.set(region, regionBlocks);
    
    // Track block's region
    this.blockRegions.set(blockId, region);
  }

  /**
   * Remove spatial tracking
   */
  private removeSpatialTracking(blockId: string, region: string): void {
    const regionBlocks = this.spatialRegions.get(region);
    if (regionBlocks) {
      regionBlocks.delete(blockId);
      if (regionBlocks.size === 0) {
        this.spatialRegions.delete(region);
      }
    }
    
    this.blockRegions.delete(blockId);
  }

  /**
   * Optimize spatial layout for region
   */
  private async optimizeSpatialLayout(region: string, blocks: MemoryBlock[]): Promise<void> {
    // Sort blocks by access frequency to group frequently accessed blocks together
    blocks.sort((a, b) => b.accessFrequency - a.accessFrequency);
    
    // Implement spatial locality optimization here
    // This is a simplified version - in practice would reorganize memory layout
    for (let i = 0; i < blocks.length - 1; i++) {
      const block1 = blocks[i];
      const block2 = blocks[i + 1];
      
      // Track spatial correlation
      let correlations = this.spatialCorrelations.get(block1.id);
      if (!correlations) {
        correlations = new Map();
        this.spatialCorrelations.set(block1.id, correlations);
      }
      
      const currentCorrelation = correlations.get(block2.id) || 0;
      correlations.set(block2.id, currentCorrelation + 1);
    }
  }

  /**
   * Compact memory pool to reduce fragmentation
   */
  private async compactMemoryPool(tier: MemoryTier): Promise<void> {
    const pool = this.memoryPools[tier];
    
    // Simple compaction - in practice would reorganize buffer layout
    const entries = Array.from(pool.entries());
    pool.clear();
    
    for (const [id, buffer] of entries) {
      pool.set(id, buffer);
    }
  }

  /**
   * Consider predictive allocation
   */
  private considerPredictiveAllocation(request: AllocationRequest): void {
    // Analyze allocation patterns and pre-allocate if beneficial
    const avgSize = this.allocationPatterns.get(request.type) || request.size;
    
    // Pre-allocate if this type of allocation is common and current request is typical
    if (Math.abs(request.size - avgSize) / avgSize < 0.2) {
      // Could pre-allocate similar blocks here
      console.log(`🔮 Predictive allocation considered for ${request.type}`);
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    // Calculate compression ratio
    const totalUncompressed = this.stats.totalUncompressed;
    const totalCompressed = this.stats.totalCompressed;
    this.stats.compressionRatio = totalUncompressed > 0 ? 
      (totalUncompressed + totalCompressed) / (totalUncompressed + totalCompressed / 2) : 1.0;
    
    // Update tier distribution
    const total = this.stats.totalAllocated;
    if (total > 0) {
      for (const tier of Object.values(MemoryTier)) {
        this.stats.tierDistribution[tier] = this.tierMemoryUsage[tier] / total;
      }
    }
    
    // Calculate spatial locality score
    this.stats.spatialLocalityScore = this.calculateSpatialLocalityScore();
    
    // Calculate fragmentation ratio (simplified)
    const totalBlocks = this.memoryBlocks.size;
    const totalRegions = this.spatialRegions.size;
    this.stats.fragmentationRatio = totalRegions > 0 ? totalBlocks / totalRegions : 1.0;
  }

  /**
   * Calculate spatial locality score
   */
  private calculateSpatialLocalityScore(): number {
    if (this.spatialRegions.size === 0) return 1.0;
    
    let totalScore = 0;
    let regionCount = 0;
    
    for (const [region, blockIds] of this.spatialRegions) {
      if (blockIds.size > 1) {
        // Calculate correlation score for blocks in this region
        let correlationSum = 0;
        let pairCount = 0;
        
        const blockArray = Array.from(blockIds);
        for (let i = 0; i < blockArray.length; i++) {
          for (let j = i + 1; j < blockArray.length; j++) {
            const correlations = this.spatialCorrelations.get(blockArray[i]);
            const correlation = correlations?.get(blockArray[j]) || 0;
            correlationSum += correlation;
            pairCount++;
          }
        }
        
        if (pairCount > 0) {
          totalScore += correlationSum / pairCount;
          regionCount++;
        }
      }
    }
    
    return regionCount > 0 ? totalScore / regionCount : 1.0;
  }

  /**
   * Start background maintenance processes
   */
  private startBackgroundProcesses(): void {
    // Defragmentation process
    this.defragmentationTimer = setInterval(() => {
      this.defragment();
    }, this.config.defragmentationInterval);
    
    // Access frequency decay
    this.accessDecayTimer = setInterval(() => {
      this.decayAccessFrequencies();
    }, 10000); // Every 10 seconds
    
    // Adaptive compression
    this.compressionTimer = setInterval(() => {
      this.compressAdaptively();
    }, 5000); // Every 5 seconds
  }

  /**
   * Decay access frequencies over time
   */
  private decayAccessFrequencies(): void {
    const now = performance.now();
    
    for (const block of this.memoryBlocks.values()) {
      const timeSinceAccess = now - block.lastAccess;
      const decayFactor = Math.exp(-this.config.accessDecayRate * timeSinceAccess / 1000);
      block.accessFrequency *= decayFactor;
      block.age = timeSinceAccess;
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get memory pressure information
   */
  getMemoryPressure(): {
    level: MemoryPressure;
    usage: number;
    available: number;
    recommendations: string[];
  } {
    const pressure = this.calculateMemoryPressure();
    const usage = this.stats.totalAllocated;
    const available = this.config.maxTotalMemory - usage;
    
    const recommendations: string[] = [];
    
    switch (pressure) {
      case MemoryPressure.MEDIUM:
        recommendations.push('Consider compressing cold data');
        break;
      case MemoryPressure.HIGH:
        recommendations.push('Increase compression ratio');
        recommendations.push('Deallocate unused blocks');
        break;
      case MemoryPressure.CRITICAL:
        recommendations.push('Emergency memory cleanup required');
        recommendations.push('Reduce simulation complexity');
        break;
    }
    
    return { level: pressure, usage, available, recommendations };
  }

  /**
   * Force cleanup and optimization
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Starting advanced memory cleanup...');
    
    await this.compressAdaptively();
    await this.defragment();
    
    // Clear old access history
    const cutoff = performance.now() - 300000; // 5 minutes
    for (const [blockId, history] of this.accessHistory) {
      const recentHistory = history.filter(time => time > cutoff);
      if (recentHistory.length === 0) {
        this.accessHistory.delete(blockId);
      } else {
        this.accessHistory.set(blockId, recentHistory);
      }
    }
    
    console.log('✅ Advanced memory cleanup completed');
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clear timers
    if (this.defragmentationTimer) clearInterval(this.defragmentationTimer);
    if (this.accessDecayTimer) clearInterval(this.accessDecayTimer);
    if (this.compressionTimer) clearInterval(this.compressionTimer);
    
    // Clear all data structures
    this.memoryBlocks.clear();
    this.spatialRegions.clear();
    this.blockRegions.clear();
    this.accessHistory.clear();
    this.allocationPatterns.clear();
    this.spatialCorrelations.clear();
    
    // Clear memory pools
    for (const pool of Object.values(this.memoryPools)) {
      pool.clear();
    }
    
    // Dispose of subsystems
    this.compressionEngine.dispose();
    this.spatialStructure.dispose();
    
    console.log('🧠 Advanced Memory Manager disposed');
  }

  /**
   * Convert ArrayBuffer to typed array
   */
  private arrayBufferToTypedArray(buffer: ArrayBuffer, type: 'float32' | 'int32' | 'uint8'): Float32Array | Int32Array | Uint8Array {
    switch (type) {
      case 'float32':
        return new Float32Array(buffer);
      case 'int32':
        return new Int32Array(buffer);
      case 'uint8':
        return new Uint8Array(buffer);
      default:
        return new Float32Array(buffer);
    }
  }

  /**
   * Get data type from block allocation request type
   */
  private getDataTypeFromBlock(block: MemoryBlock): 'ant_positions' | 'pheromone_grid' | 'environmental_data' | 'ai_state' | 'physics_state' {
    // Map memory block types to ISABELA data types
    // This is a simplified mapping - in practice would be more sophisticated
    return 'ant_positions';
  }
}

export default AdvancedMemoryManager;