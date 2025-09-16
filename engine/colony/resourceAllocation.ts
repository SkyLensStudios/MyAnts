/**
 * Resource Allocation System
 * Manages colony resources, storage, and distribution
 */

export enum ResourceType {
  FOOD = 'food',
  WATER = 'water',
  BUILDING_MATERIAL = 'building_material',
  ENERGY = 'energy',
  PROTEIN = 'protein',
  CARBOHYDRATES = 'carbohydrates',
  FATS = 'fats',
  VITAMINS = 'vitamins',
  MINERALS = 'minerals',
  PHEROMONES = 'pheromones',
  WASTE = 'waste',
  LARVAE_FOOD = 'larvae_food',
  ROYAL_JELLY = 'royal_jelly',
  FUNGUS = 'fungus',
  SEEDS = 'seeds',
  NECTAR = 'nectar',
  RESIN = 'resin',
  SOIL = 'soil',
  WOOD = 'wood',
  DEBRIS = 'debris'
}

export interface Resource {
  type: ResourceType;
  amount: number;
  quality: number;          // 0-1, affects effectiveness
  spoilageRate: number;     // Units lost per hour
  maxStorageLife: number;   // Hours before completely spoiled
  acquisitionTime: number;  // When resource was acquired
  location: { x: number; y: number; z: number }; // Where it's stored
  reserved: number;         // Amount reserved for specific tasks
}

export interface ResourceStorage {
  id: string;
  location: { x: number; y: number; z: number };
  capacity: Map<ResourceType, number>;    // Max storage for each type
  stored: Map<ResourceType, Resource[]>;  // Current resources
  accessibility: number;                  // 0-1, how easy to access
  security: number;                       // 0-1, protection from raids
  climateControl: number;                 // 0-1, preservation capability
  specialization: ResourceType[];         // Resource types this storage specializes in
}

export interface ResourceDemand {
  type: ResourceType;
  amount: number;
  urgency: number;        // 0-1, how urgent this need is
  source: string;         // What/who is requesting
  deadline?: number;      // When resource is needed by
  acceptableQuality: number; // Minimum quality acceptable
}

export interface ResourceFlow {
  from: string;           // Source storage/ant ID
  to: string;             // Destination storage/ant ID
  resource: ResourceType;
  amount: number;
  startTime: number;
  estimatedArrival: number;
  status: 'planned' | 'in_transit' | 'delivered' | 'failed';
}

export interface ResourceMetrics {
  totalResources: Map<ResourceType, number>;
  storageUtilization: number;    // 0-1, how full storage is
  spoilageRate: number;          // Resources lost per hour
  acquisitionRate: number;       // Resources gained per hour
  consumptionRate: number;       // Resources used per hour
  resourceSecurity: number;      // Average security of all storages
  distributionEfficiency: number; // How well resources reach where needed
}

export interface ColonyNeeds {
  immediate: ResourceDemand[];    // Urgent needs (< 1 hour)
  shortTerm: ResourceDemand[];    // Near-term needs (< 1 day)
  longTerm: ResourceDemand[];     // Strategic needs (> 1 day)
  seasonal: ResourceDemand[];     // Seasonal preparation
}

/**
 * Comprehensive resource allocation and management system
 */
export class ResourceAllocationSystem {
  private storages: Map<string, ResourceStorage>;
  private demands: ResourceDemand[];
  private flows: ResourceFlow[];
  private resourceMetrics: ResourceMetrics;
  private nextStorageId: number;
  private nextFlowId: number;

  constructor() {
    this.storages = new Map();
    this.demands = [];
    this.flows = [];
    this.nextStorageId = 1;
    this.nextFlowId = 1;
    
    this.resourceMetrics = {
      totalResources: new Map(),
      storageUtilization: 0,
      spoilageRate: 0,
      acquisitionRate: 0,
      consumptionRate: 0,
      resourceSecurity: 0,
      distributionEfficiency: 0
    };

    this.initializeResourceProperties();
  }

  private initializeResourceProperties(): void {
    // Initialize total resources tracking
    for (const resourceType of Object.values(ResourceType)) {
      this.resourceMetrics.totalResources.set(resourceType, 0);
    }
  }

  public createStorage(
    location: { x: number; y: number; z: number },
    capacities: Map<ResourceType, number>,
    specialization: ResourceType[] = []
  ): ResourceStorage {
    const storage: ResourceStorage = {
      id: `storage_${this.nextStorageId++}`,
      location,
      capacity: new Map(capacities),
      stored: new Map(),
      accessibility: 1.0,
      security: 0.5,
      climateControl: 0.3,
      specialization
    };

    // Initialize empty storage for each resource type
    for (const resourceType of capacities.keys()) {
      storage.stored.set(resourceType, []);
    }

    this.storages.set(storage.id, storage);
    return storage;
  }

  public addResource(
    storageId: string,
    resourceType: ResourceType,
    amount: number,
    quality: number = 1.0
  ): boolean {
    const storage = this.storages.get(storageId);
    if (!storage) return false;

    const capacity = storage.capacity.get(resourceType) || 0;
    const currentAmount = this.getStoredAmount(storageId, resourceType);

    if (currentAmount + amount > capacity) {
      return false; // Storage full
    }

    const resource: Resource = {
      type: resourceType,
      amount,
      quality: Math.max(0, Math.min(1, quality)),
      spoilageRate: this.getResourceSpoilageRate(resourceType),
      maxStorageLife: this.getResourceStorageLife(resourceType),
      acquisitionTime: Date.now(),
      location: storage.location,
      reserved: 0
    };

    const storedResources = storage.stored.get(resourceType) || [];
    storedResources.push(resource);
    storage.stored.set(resourceType, storedResources);

    // Update metrics
    const currentTotal = this.resourceMetrics.totalResources.get(resourceType) || 0;
    this.resourceMetrics.totalResources.set(resourceType, currentTotal + amount);

    return true;
  }

  private getResourceSpoilageRate(type: ResourceType): number {
    // Spoilage rate per hour for different resource types
    const spoilageRates = new Map([
      [ResourceType.FOOD, 0.001],          // 0.1% per hour
      [ResourceType.NECTAR, 0.005],        // 0.5% per hour
      [ResourceType.LARVAE_FOOD, 0.01],    // 1% per hour
      [ResourceType.ROYAL_JELLY, 0.02],    // 2% per hour
      [ResourceType.FUNGUS, 0.0005],       // 0.05% per hour
      [ResourceType.WATER, 0.0001],        // 0.01% per hour (evaporation)
      [ResourceType.BUILDING_MATERIAL, 0], // No spoilage
      [ResourceType.ENERGY, 0.1],          // 10% per hour (metabolic)
      [ResourceType.WASTE, 0],             // No spoilage (it's already waste)
      [ResourceType.SEEDS, 0.0001],        // Very slow
      [ResourceType.RESIN, 0],             // No spoilage
      [ResourceType.SOIL, 0],              // No spoilage
      [ResourceType.WOOD, 0.0001],         // Very slow decay
      [ResourceType.DEBRIS, 0]             // No spoilage
    ]);

    return spoilageRates.get(type) || 0.001;
  }

  private getResourceStorageLife(type: ResourceType): number {
    // Maximum storage life in hours
    const storageLife = new Map([
      [ResourceType.FOOD, 168],            // 1 week
      [ResourceType.NECTAR, 48],           // 2 days
      [ResourceType.LARVAE_FOOD, 24],      // 1 day
      [ResourceType.ROYAL_JELLY, 12],      // 12 hours
      [ResourceType.FUNGUS, 720],          // 1 month
      [ResourceType.WATER, 8760],          // 1 year (evaporation)
      [ResourceType.BUILDING_MATERIAL, Infinity], // Permanent
      [ResourceType.ENERGY, 10],           // 10 hours (metabolic)
      [ResourceType.WASTE, Infinity],      // Permanent
      [ResourceType.SEEDS, 8760],          // 1 year
      [ResourceType.RESIN, Infinity],      // Permanent
      [ResourceType.SOIL, Infinity],       // Permanent
      [ResourceType.WOOD, 8760],           // 1 year
      [ResourceType.DEBRIS, Infinity]      // Permanent
    ]);

    return storageLife.get(type) || 168;
  }

  public removeResource(
    storageId: string,
    resourceType: ResourceType,
    amount: number,
    preferQuality: 'high' | 'low' = 'high'
  ): Resource[] {
    const storage = this.storages.get(storageId);
    if (!storage) return [];

    const storedResources = storage.stored.get(resourceType) || [];
    const removedResources: Resource[] = [];
    let remainingAmount = amount;

    // Sort by quality preference
    const sortedResources = [...storedResources].sort((a, b) => 
      preferQuality === 'high' ? b.quality - a.quality : a.quality - b.quality
    );

    for (let i = 0; i < sortedResources.length && remainingAmount > 0; i++) {
      const resource = sortedResources[i];
      const availableAmount = resource.amount - resource.reserved;

      if (availableAmount <= 0) continue;

      const takeAmount = Math.min(remainingAmount, availableAmount);
      
      if (takeAmount === resource.amount) {
        // Take entire resource
        removedResources.push(resource);
        const index = storedResources.indexOf(resource);
        storedResources.splice(index, 1);
      } else {
        // Partial removal
        const partialResource: Resource = {
          ...resource,
          amount: takeAmount
        };
        removedResources.push(partialResource);
        resource.amount -= takeAmount;
      }

      remainingAmount -= takeAmount;
    }

    // Update metrics
    const totalRemoved = removedResources.reduce((sum, r) => sum + r.amount, 0);
    const currentTotal = this.resourceMetrics.totalResources.get(resourceType) || 0;
    this.resourceMetrics.totalResources.set(resourceType, currentTotal - totalRemoved);

    return removedResources;
  }

  public reserveResource(
    storageId: string,
    resourceType: ResourceType,
    amount: number,
    duration: number = 3600000 // 1 hour default
  ): boolean {
    const storage = this.storages.get(storageId);
    if (!storage) return false;

    const storedResources = storage.stored.get(resourceType) || [];
    let remainingAmount = amount;

    for (const resource of storedResources) {
      if (remainingAmount <= 0) break;

      const availableAmount = resource.amount - resource.reserved;
      const reserveAmount = Math.min(remainingAmount, availableAmount);

      resource.reserved += reserveAmount;
      remainingAmount -= reserveAmount;

      // Set up automatic unreserve after duration
      setTimeout(() => {
        resource.reserved = Math.max(0, resource.reserved - reserveAmount);
      }, duration);
    }

    return remainingAmount === 0;
  }

  public addDemand(demand: ResourceDemand): void {
    this.demands.push(demand);
    this.prioritizeDemands();
  }

  private prioritizeDemands(): void {
    // Sort demands by urgency and deadline
    this.demands.sort((a, b) => {
      // First by urgency
      if (a.urgency !== b.urgency) {
        return b.urgency - a.urgency;
      }

      // Then by deadline if both exist
      if (a.deadline && b.deadline) {
        return a.deadline - b.deadline;
      }

      // Demands with deadlines have priority
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;

      return 0;
    });
  }

  public allocateResources(): ResourceFlow[] {
    const allocations: ResourceFlow[] = [];

    for (const demand of this.demands) {
      const allocation = this.findBestAllocation(demand);
      if (allocation) {
        allocations.push(allocation);
        this.flows.push(allocation);
      }
    }

    // Remove satisfied demands
    this.demands = this.demands.filter(demand => 
      !allocations.some(alloc => alloc.to === demand.source)
    );

    return allocations;
  }

  private findBestAllocation(demand: ResourceDemand): ResourceFlow | null {
    let bestStorage: string | null = null;
    let bestScore = -1;

    for (const [storageId, storage] of this.storages) {
      const availableAmount = this.getAvailableAmount(storageId, demand.type);
      
      if (availableAmount < demand.amount) continue;

      // Check quality requirement
      const averageQuality = this.getAverageQuality(storageId, demand.type);
      if (averageQuality < demand.acceptableQuality) continue;

      // Calculate allocation score
      const score = this.calculateAllocationScore(storage, demand, availableAmount);
      
      if (score > bestScore) {
        bestScore = score;
        bestStorage = storageId;
      }
    }

    if (!bestStorage) return null;

    // Create flow
    const flow: ResourceFlow = {
      from: bestStorage,
      to: demand.source,
      resource: demand.type,
      amount: demand.amount,
      startTime: Date.now(),
      estimatedArrival: Date.now() + this.calculateTransportTime(bestStorage, demand.source),
      status: 'planned'
    };

    // Reserve the resources
    this.reserveResource(bestStorage, demand.type, demand.amount);

    return flow;
  }

  private calculateAllocationScore(
    storage: ResourceStorage,
    demand: ResourceDemand,
    availableAmount: number
  ): number {
    let score = 0;

    // Abundance factor (prefer storages with more of this resource)
    const abundanceRatio = availableAmount / (storage.capacity.get(demand.type) || 1);
    score += abundanceRatio * 0.3;

    // Accessibility factor
    score += storage.accessibility * 0.2;

    // Specialization bonus
    if (storage.specialization.includes(demand.type)) {
      score += 0.2;
    }

    // Distance factor (prefer closer storages)
    // This would need location of demand source to calculate properly
    // For now, use a placeholder
    score += 0.2;

    // Security factor (prefer more secure storages for valuable resources)
    if (this.isValueableResource(demand.type)) {
      score += storage.security * 0.1;
    }

    return score;
  }

  private isValueableResource(type: ResourceType): boolean {
    const valuableResources = [
      ResourceType.ROYAL_JELLY,
      ResourceType.ENERGY,
      ResourceType.PROTEIN,
      ResourceType.VITAMINS
    ];
    return valuableResources.includes(type);
  }

  private calculateTransportTime(fromStorageId: string, to: string): number {
    // Simplified transport time calculation
    // In a real implementation, this would calculate actual distance and ant speed
    return 60000; // 1 minute default
  }

  public updateFlows(deltaTime: number): void {
    const currentTime = Date.now();

    for (const flow of this.flows) {
      if (flow.status === 'planned' && currentTime >= flow.startTime) {
        flow.status = 'in_transit';
      } else if (flow.status === 'in_transit' && currentTime >= flow.estimatedArrival) {
        // Complete the transfer
        this.completeResourceTransfer(flow);
        flow.status = 'delivered';
      }
    }

    // Remove completed flows
    this.flows = this.flows.filter(flow => 
      flow.status !== 'delivered' && flow.status !== 'failed'
    );
  }

  private completeResourceTransfer(flow: ResourceFlow): void {
    // Remove from source
    const resources = this.removeResource(flow.from, flow.resource, flow.amount);
    
    // Add to destination (if it's a storage)
    // In a full implementation, this might deliver to an ant or other entity
    if (this.storages.has(flow.to)) {
      const totalAmount = resources.reduce((sum, r) => sum + r.amount, 0);
      const averageQuality = resources.reduce((sum, r) => sum + r.quality * r.amount, 0) / totalAmount;
      this.addResource(flow.to, flow.resource, totalAmount, averageQuality);
    }
  }

  public processResourceDecay(deltaTime: number): void {
    const hoursElapsed = deltaTime / 3600; // Convert seconds to hours

    for (const storage of this.storages.values()) {
      for (const [resourceType, resources] of storage.stored) {
        const decayedResources: Resource[] = [];

        for (let i = resources.length - 1; i >= 0; i--) {
          const resource = resources[i];
          
          // Apply spoilage
          const spoilage = resource.amount * resource.spoilageRate * hoursElapsed;
          resource.amount = Math.max(0, resource.amount - spoilage);

          // Check if completely spoiled
          const age = (Date.now() - resource.acquisitionTime) / 3600000; // Convert to hours
          if (age > resource.maxStorageLife || resource.amount <= 0) {
            decayedResources.push(resource);
            resources.splice(i, 1);
          }
        }

        // Update metrics for decayed resources
        const totalDecayed = decayedResources.reduce((sum, r) => sum + r.amount, 0);
        if (totalDecayed > 0) {
          const currentTotal = this.resourceMetrics.totalResources.get(resourceType) || 0;
          this.resourceMetrics.totalResources.set(resourceType, currentTotal - totalDecayed);
        }
      }
    }
  }

  // Query methods

  public getStoredAmount(storageId: string, resourceType: ResourceType): number {
    const storage = this.storages.get(storageId);
    if (!storage) return 0;

    const resources = storage.stored.get(resourceType) || [];
    return resources.reduce((sum, resource) => sum + resource.amount, 0);
  }

  public getAvailableAmount(storageId: string, resourceType: ResourceType): number {
    const storage = this.storages.get(storageId);
    if (!storage) return 0;

    const resources = storage.stored.get(resourceType) || [];
    return resources.reduce((sum, resource) => sum + (resource.amount - resource.reserved), 0);
  }

  public getAverageQuality(storageId: string, resourceType: ResourceType): number {
    const storage = this.storages.get(storageId);
    if (!storage) return 0;

    const resources = storage.stored.get(resourceType) || [];
    if (resources.length === 0) return 0;

    const totalAmount = resources.reduce((sum, r) => sum + r.amount, 0);
    const weightedQuality = resources.reduce((sum, r) => sum + (r.quality * r.amount), 0);

    return totalAmount > 0 ? weightedQuality / totalAmount : 0;
  }

  public getTotalResourceAmount(resourceType: ResourceType): number {
    return this.resourceMetrics.totalResources.get(resourceType) || 0;
  }

  public getColonyNeeds(): ColonyNeeds {
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    return {
      immediate: this.demands.filter(d => 
        d.urgency > 0.8 || (d.deadline && d.deadline - currentTime < oneHour)
      ),
      shortTerm: this.demands.filter(d => 
        d.urgency > 0.5 && d.urgency <= 0.8 && 
        (!d.deadline || d.deadline - currentTime < oneDay)
      ),
      longTerm: this.demands.filter(d => 
        d.urgency <= 0.5 && (!d.deadline || d.deadline - currentTime >= oneDay)
      ),
      seasonal: this.demands.filter(d => d.source.includes('seasonal'))
    };
  }

  public getResourceMetrics(): ResourceMetrics {
    this.updateMetrics();
    return { ...this.resourceMetrics };
  }

  private updateMetrics(): void {
    // Update storage utilization
    let totalCapacity = 0;
    let totalUsed = 0;

    for (const storage of this.storages.values()) {
      for (const [resourceType, capacity] of storage.capacity) {
        totalCapacity += capacity;
        totalUsed += this.getStoredAmount(storage.id, resourceType);
      }
    }

    this.resourceMetrics.storageUtilization = totalCapacity > 0 ? totalUsed / totalCapacity : 0;

    // Update average security
    const securities = Array.from(this.storages.values()).map(s => s.security);
    this.resourceMetrics.resourceSecurity = securities.length > 0 
      ? securities.reduce((sum, s) => sum + s, 0) / securities.length 
      : 0;

    // Distribution efficiency based on demand satisfaction
    const satisfiedDemands = this.flows.filter(f => f.status === 'delivered').length;
    const totalDemands = this.demands.length + satisfiedDemands;
    this.resourceMetrics.distributionEfficiency = totalDemands > 0 
      ? satisfiedDemands / totalDemands 
      : 1.0;
  }

  public getStorageInfo(storageId: string): ResourceStorage | undefined {
    return this.storages.get(storageId);
  }

  public getAllStorages(): ResourceStorage[] {
    return Array.from(this.storages.values());
  }

  public getActiveFlows(): ResourceFlow[] {
    return this.flows.filter(f => f.status === 'planned' || f.status === 'in_transit');
  }

  public getPendingDemands(): ResourceDemand[] {
    return [...this.demands];
  }

  // Colony management methods

  public optimizeStorageLocations(): void {
    // Analyze current storage efficiency and suggest improvements
    // This could include recommendations for new storage locations,
    // redistribution of resources, or changes to specialization
  }

  public predictResourceNeeds(timeHorizonHours: number): Map<ResourceType, number> {
    // Predict future resource needs based on historical consumption
    // and current colony state
    const predictions = new Map<ResourceType, number>();
    
    // Simplified prediction based on current consumption rates
    // In a full implementation, this would use historical data and trends
    
    return predictions;
  }

  public createEmergencyReserve(resourceType: ResourceType, amount: number): boolean {
    // Create emergency reserves for critical resources
    // Find best storage and reserve the amount
    let bestStorage: string | null = null;
    let bestAmount = 0;

    for (const [storageId, storage] of this.storages) {
      const available = this.getAvailableAmount(storageId, resourceType);
      if (available >= amount && (available > bestAmount || storage.security > 0.7)) {
        bestStorage = storageId;
        bestAmount = available;
      }
    }

    if (bestStorage) {
      return this.reserveResource(bestStorage, resourceType, amount, 24 * 3600000); // 24 hour reserve
    }

    return false;
  }
}