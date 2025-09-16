/**
 * LOD Controller
 * Orchestrates Level of Detail assignments and integrates with simulation engine
 */

import { LODSystem, LODLevel, LODFactors } from './LODSystem';
import { Vector3D } from '../../shared/types';

export interface CameraInfo {
  position: Vector3D;
  direction: Vector3D;
  fov: number;
  farClip: number;
}

export interface AntLODData {
  id: string;
  position: Vector3D;
  caste: string;
  lastActivity: number;
  isSelected: boolean;
  groupSize: number;
}

/**
 * High-level controller for managing LOD assignments
 */
export class LODController {
  private lodSystem: LODSystem;
  private camera: CameraInfo;
  private focusedAnts: Set<string> = new Set();
  private userInteractionHistory: Map<string, number> = new Map();
  private readonly INTERACTION_DECAY_TIME = 30000; // 30 seconds

  constructor() {
    this.lodSystem = new LODSystem();
    this.camera = {
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: -1 },
      fov: 75,
      farClip: 1000
    };
  }

  /**
   * Update camera information for distance calculations
   */
  public updateCamera(camera: CameraInfo): void {
    this.camera = { ...camera };
  }

  /**
   * Mark ants as focused by user interaction
   */
  public setFocusedAnts(antIds: string[]): void {
    this.focusedAnts.clear();
    antIds.forEach(id => this.focusedAnts.add(id));
    
    // Record interaction timestamp
    const now = Date.now();
    antIds.forEach(id => this.userInteractionHistory.set(id, now));
  }

  /**
   * Process LOD assignments for all ants
   */
  public processLODAssignments(
    ants: AntLODData[], 
    deltaTime: number
  ): Map<LODLevel, string[]> {
    this.cleanupInteractionHistory();
    
    const antIds = ants.map(ant => ant.id);
    const factorsProvider = (antId: string) => this.calculateFactors(antId, ants);
    
    return this.lodSystem.updateLODAssignments(antIds, factorsProvider, deltaTime);
  }

  /**
   * Calculate LOD factors for a specific ant
   */
  private calculateFactors(antId: string, ants: AntLODData[]): LODFactors {
    const ant = ants.find(a => a.id === antId);
    if (!ant) {
      throw new Error(`Ant ${antId} not found in LOD data`);
    }

    return {
      distanceToCamera: this.calculateDistanceScore(ant.position),
      recentActivity: this.calculateActivityScore(ant),
      userFocus: this.calculateFocusScore(ant.id),
      systemLoad: 0, // Will be set by LOD system
      antImportance: this.calculateImportanceScore(ant),
      groupDensity: this.calculateGroupDensity(ant, ants)
    };
  }

  /**
   * Calculate distance-based priority score (closer = higher priority)
   */
  private calculateDistanceScore(position: Vector3D): number {
    const distance = this.calculateDistance(this.camera.position, position);
    const maxDistance = this.camera.farClip;
    
    // Inverse distance with exponential falloff
    const normalizedDistance = Math.min(distance / maxDistance, 1.0);
    return Math.exp(-normalizedDistance * 3); // Exponential decay
  }

  /**
   * Calculate activity-based priority score
   */
  private calculateActivityScore(ant: AntLODData): number {
    const timeSinceActivity = Date.now() - ant.lastActivity;
    const maxActivityAge = 60000; // 1 minute
    
    if (timeSinceActivity > maxActivityAge) return 0;
    
    return 1 - (timeSinceActivity / maxActivityAge);
  }

  /**
   * Calculate user focus priority score
   */
  private calculateFocusScore(antId: string): number {
    let score = 0;
    
    // Direct selection bonus
    if (this.focusedAnts.has(antId)) {
      score += 0.8;
    }
    
    // Recent interaction bonus
    const lastInteraction = this.userInteractionHistory.get(antId);
    if (lastInteraction) {
      const timeSince = Date.now() - lastInteraction;
      const decayTime = this.INTERACTION_DECAY_TIME;
      
      if (timeSince < decayTime) {
        score += 0.4 * (1 - timeSince / decayTime);
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate importance based on ant caste and role
   */
  private calculateImportanceScore(ant: AntLODData): number {
    const casteImportance = new Map([
      ['queen', 10],
      ['soldier', 6],
      ['nurse', 4],
      ['forager', 3],
      ['worker', 2],
      ['male', 1]
    ]);
    
    return casteImportance.get(ant.caste) || 2;
  }

  /**
   * Calculate group density factor
   */
  private calculateGroupDensity(target: AntLODData, allAnts: AntLODData[]): number {
    const densityRadius = 50; // Radius for density calculation
    let nearbyCount = 0;
    
    for (const other of allAnts) {
      if (other.id === target.id) continue;
      
      const distance = this.calculateDistance(target.position, other.position);
      if (distance <= densityRadius) {
        nearbyCount++;
      }
    }
    
    // Normalize density (assume max 20 ants in radius)
    return Math.min(nearbyCount / 20, 1.0);
  }

  /**
   * Calculate 3D distance between two points
   */
  private calculateDistance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Clean up old interaction history
   */
  private cleanupInteractionHistory(): void {
    const now = Date.now();
    const cutoff = now - this.INTERACTION_DECAY_TIME * 2; // Keep extra time for cleanup
    
    for (const [antId, timestamp] of this.userInteractionHistory.entries()) {
      if (timestamp < cutoff) {
        this.userInteractionHistory.delete(antId);
      }
    }
  }

  /**
   * Get LOD level for specific ant
   */
  public getAntLOD(antId: string): LODLevel | null {
    const assignment = this.lodSystem.getAssignment(antId);
    return assignment ? assignment.level : null;
  }

  /**
   * Check if ant should be updated this frame
   */
  public shouldUpdateAnt(antId: string): boolean {
    return this.lodSystem.shouldUpdate(antId);
  }

  /**
   * Get current LOD statistics
   */
  public getStatistics() {
    return {
      lodDistribution: this.lodSystem.getLODStatistics(),
      performance: this.lodSystem.getPerformanceMetrics(),
      focusedAnts: this.focusedAnts.size,
      trackedInteractions: this.userInteractionHistory.size
    };
  }

  /**
   * Configure performance targets
   */
  public setPerformanceTargets(targetFPS: number, maxLoadFactor: number): void {
    this.lodSystem.setPerformanceTargets(targetFPS, maxLoadFactor);
  }

  /**
   * Remove ant from tracking
   */
  public removeAnt(antId: string): void {
    this.lodSystem.removeAnt(antId);
    this.focusedAnts.delete(antId);
    this.userInteractionHistory.delete(antId);
  }

  /**
   * Clear all LOD data
   */
  public clear(): void {
    this.lodSystem.clear();
    this.focusedAnts.clear();
    this.userInteractionHistory.clear();
  }

  /**
   * Enable massive scale mode for 50,000+ ants (v3 feature)
   */
  public setMassiveScaleMode(enabled: boolean): void {
    if (enabled) {
      // Configure LOD system for massive scale operations
      this.lodSystem.setPerformanceTargets(15, 0.9); // Lower FPS target, higher load factor
      console.log('🔥 LOD Controller: Massive scale mode enabled');
    } else {
      this.lodSystem.setPerformanceTargets(30, 0.8); // Normal targets
      console.log('LOD Controller: Normal scale mode');
    }
  }
}