/**
 * ColonyEntity - Bridge between Colony Management Engine and UI
 * Provides high-level colony operations and data aggregation for rendering
 */

import { ColonyManagementSystem, ColonyState, ColonyMetrics } from '../../../engine/colony/index';
import { AntCaste } from '../../../engine/colony/casteSystem';
import { ResourceType } from '../../../engine/colony/resourceAllocation';
import { AntEntity } from './AntEntity';

export interface ColonyRenderData {
  id: string;
  name: string;
  founded: Date;
  location: { x: number; y: number; z: number };
  size: number;
  health: number;
  morale: number;
  efficiency: number;
  threatLevel: number;
  totalAnts: number;
  livingAnts: number;
  deadAnts: number;
  casteBreakdown: Map<AntCaste, number>;
  resourceStockpile: Map<ResourceType, number>;
  territory: {
    center: { x: number; y: number };
    radius: number;
    tunnelLength: number;
    chamberCount: number;
  };
  metrics: ColonyMetrics;
  recentEvents: Array<{
    timestamp: Date;
    type: string;
    description: string;
    severity: number;
  }>;
}

export class ColonyEntity {
  private managementSystem: ColonyManagementSystem;
  private id: string;
  private name: string;
  private foundedTime: Date;
  private location: { x: number; y: number; z: number };

  // Colony tracking
  private ants: Map<string, AntEntity> = new Map();
  private recentEvents: Array<any> = [];
  private lastMetricsUpdate = 0;
  private cachedMetrics: ColonyMetrics | null = null;

  constructor(
    id: string,
    name: string,
    location: { x: number; y: number; z: number },
  ) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.foundedTime = new Date();

    // Create management system with required parameters
    this.managementSystem = new ColonyManagementSystem(
      this.id,
      100, // Initial population
      this.location,
    );

    console.log(`Colony "${name}" established at ${location.x}, ${location.y}`);
  }

  /**
   * Update colony state and management systems
   */
  public update(deltaTime: number, ants: Map<string, AntEntity>): void {
    this.ants = ants;

    // Convert ants to format expected by colony management
    const antData = this.convertAntsForManagement();

    // Note: Management system update would be called here
    // this.managementSystem.update(deltaTime, antData);

    // Update cached metrics periodically (every 5 seconds)
    const now = Date.now();
    if (now - this.lastMetricsUpdate > 5000) {
      // this.cachedMetrics = this.managementSystem.getMetrics();
      this.cachedMetrics = this.getDefaultMetrics();
      this.lastMetricsUpdate = now;
    }

    // Process any new events
    this.processColonyEvents();
  }

  private convertAntsForManagement(): any[] {
    return Array.from(this.ants.values()).map(ant => {
      const renderData = ant.toRenderData();
      return {
        id: renderData.id,
        caste: renderData.caste,
        task: renderData.task,
        health: renderData.health,
        energy: renderData.energy,
        age: renderData.age,
        position: renderData.position,
        isAlive: renderData.isAlive,
        generation: renderData.generation,
      };
    });
  }

  private processColonyEvents(): void {
    // Note: Would get events from management system
    // const newEvents = this.managementSystem.getRecentEvents();

    // For now, keep the events array empty or add placeholder events
    // Keep only last 50 events
    if (this.recentEvents.length > 50) {
      this.recentEvents = this.recentEvents.slice(-50);
    }
  }

  /**
   * Add new ant to the colony
   */
  public addAnt(ant: AntEntity): void {
    const renderData = ant.toRenderData();
    this.ants.set(renderData.id, ant);
    // Note: Would add to management system
    // this.managementSystem.addAnt({...});
  }

  /**
   * Remove ant from the colony
   */
  public removeAnt(antId: string): void {
    this.ants.delete(antId);
    // Note: Would remove from management system
    // this.managementSystem.removeAnt(antId);
  }

  /**
   * Get comprehensive colony state for rendering
   */
  public toRenderData(): ColonyRenderData {
    // Note: Would get state from management system
    // const state = this.managementSystem.getState();
    const state = {
      health: 0.8,
      morale: 0.7,
      efficiency: 0.6,
      threat_level: 0.2,
    };

    const livingAnts = Array.from(this.ants.values()).filter(ant => ant.isAlive);
    const deadAnts = Array.from(this.ants.values()).filter(ant => !ant.isAlive);

    // Calculate caste breakdown
    const casteBreakdown = new Map<AntCaste, number>();
    for (const ant of livingAnts) {
      const renderData = ant.toRenderData();
      const caste = renderData.caste;
      casteBreakdown.set(caste, (casteBreakdown.get(caste) || 0) + 1);
    }

    // Get resource stockpile (using basic resource system for now)
    const resourceStockpile = new Map<ResourceType, number>();

    // Calculate territory stats
    const territory = this.calculateTerritoryStats();

    return {
      id: this.id,
      name: this.name,
      founded: this.foundedTime,
      location: this.location,
      size: livingAnts.length,
      health: state.health,
      morale: state.morale,
      efficiency: state.efficiency,
      threatLevel: state.threat_level,
      totalAnts: this.ants.size,
      livingAnts: livingAnts.length,
      deadAnts: deadAnts.length,
      casteBreakdown,
      resourceStockpile,
      territory,
      metrics: this.cachedMetrics || this.getDefaultMetrics(),
      recentEvents: this.recentEvents.slice(-10), // Last 10 events for UI
    };
  }

  private calculateTerritoryStats() {
    const ants = Array.from(this.ants.values()).filter(ant => ant.isAlive);

    if (ants.length === 0) {
      return {
        center: this.location,
        radius: 0,
        tunnelLength: 0,
        chamberCount: 0,
      };
    }

    // Calculate territory center (average ant position)
    let centerX = 0;
    let centerY = 0;
    for (const ant of ants) {
      const renderData = ant.toRenderData();
      centerX += renderData.position.x;
      centerY += renderData.position.y;
    }
    centerX /= ants.length;
    centerY /= ants.length;

    // Calculate territory radius (max distance from center)
    let maxRadius = 0;
    for (const ant of ants) {
      const renderData = ant.toRenderData();
      const distance = Math.sqrt(
        Math.pow(renderData.position.x - centerX, 2) + Math.pow(renderData.position.y - centerY, 2),
      );
      maxRadius = Math.max(maxRadius, distance);
    }

    return {
      center: { x: centerX, y: centerY },
      radius: maxRadius,
      tunnelLength: 0, // Placeholder - would be calculated from colony system
      chamberCount: 0, // Placeholder - would be calculated from colony system
    };
  }

  private getDefaultMetrics(): ColonyMetrics {
    return {
      productivity: 0,
      resource_efficiency: 0,
      population_growth: 0,
      territory_control: 0,
      genetic_diversity: 0,
      adaptation_rate: 0,
    };
  }

  /**
   * Get colony management system for direct access
   */
  public getManagementSystem(): ColonyManagementSystem {
    return this.managementSystem;
  }

  /**
   * Get colony ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get colony name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get colony location
   */
  public getLocation(): { x: number; y: number; z: number } {
    return { ...this.location };
  }

  /**
   * Set colony location (for migrations)
   */
  public setLocation(location: { x: number; y: number; z: number }): void {
    this.location = location;
    // Note: setLocation would be implemented in the colony management system
  }

  /**
   * Get colony founded time
   */
  public getFoundedTime(): Date {
    return this.foundedTime;
  }

  /**
   * Get current colony age in days
   */
  public getAgeInDays(): number {
    return (Date.now() - this.foundedTime.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Check if colony is active (has living ants)
   */
  public isActive(): boolean {
    return Array.from(this.ants.values()).some(ant => ant.isAlive);
  }

  /**
   * Get colony population by caste
   */
  public getPopulationByCaste(caste: AntCaste): number {
    return Array.from(this.ants.values())
      .filter(ant => {
        const renderData = ant.toRenderData();
        return renderData.isAlive && renderData.caste === caste;
      })
      .length;
  }

  /**
   * Get available resources of specific type
   */
  public getResourceAmount(resourceType: ResourceType): number {
    // Placeholder implementation - would use colony management system
    return 0;
  }

  /**
   * Add resources to colony stockpile
   */
  public addResource(resourceType: ResourceType, amount: number): void {
    // Placeholder implementation - would use colony management system
    console.log(`Adding ${amount} ${resourceType} to colony ${this.id}`);
  }

  /**
   * Try to consume resources from stockpile
   */
  public consumeResource(resourceType: ResourceType, amount: number): boolean {
    // Placeholder implementation - would use colony management system
    console.log(`Consuming ${amount} ${resourceType} from colony ${this.id}`);
    return true;
  }
}