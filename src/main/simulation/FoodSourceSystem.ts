/**
 * Food Source System for Ant Simulation
 * Manages food sources that ants can discover and collect from
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface FoodSource {
  id: string;
  position: Vector3;
  totalAmount: number;      // Initial food amount
  currentAmount: number;    // Remaining food amount
  quality: number;          // Food quality (0-1)
  type: 'fruit' | 'seed' | 'insect' | 'nectar' | 'carrion';
  discoveryTime: number;    // When it was first discovered
  lastCollectedTime: number; // Last collection time
  collectionRate: number;   // How much food can be collected per second
  regeneration: boolean;    // Whether food regenerates over time
  regenerationRate: number; // Amount regenerated per second
  discoveredBy: Set<string>; // Ant IDs that know about this food source
  isExhausted: boolean;     // Whether the food source is depleted
  radius: number;           // Detection radius
}

export interface FoodCollectionEvent {
  antId: string;
  foodSourceId: string;
  amountCollected: number;
  timestamp: number;
  efficiency: number;       // Collection efficiency (0-1)
}

export class FoodSourceSystem {
  private foodSources: Map<string, FoodSource> = new Map();
  private collectionEvents: FoodCollectionEvent[] = [];
  private nextFoodId = 1;

  constructor() {
    console.log('🍎 Food Source System initialized');
  }

  /**
   * Add a new food source to the simulation
   */
  public addFoodSource(
    position: Vector3,
    amount: number,
    type: FoodSource['type'] = 'fruit',
    quality: number = 0.8
  ): string {
    const id = `food_${this.nextFoodId++}`;
    
    const foodSource: FoodSource = {
      id,
      position: { ...position },
      totalAmount: amount,
      currentAmount: amount,
      quality: Math.max(0, Math.min(1, quality)),
      type,
      discoveryTime: Date.now(),
      lastCollectedTime: 0,
      collectionRate: this.getCollectionRateForType(type),
      regeneration: type === 'nectar' || type === 'fruit', // Some foods regenerate
      regenerationRate: type === 'nectar' ? 0.1 : type === 'fruit' ? 0.05 : 0,
      discoveredBy: new Set(),
      isExhausted: false,
      radius: 2.0 // 2 meter detection radius
    };

    this.foodSources.set(id, foodSource);
    console.log(`🍎 Added ${type} food source at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}) with ${amount} units`);
    
    return id;
  }

  /**
   * Attempt to collect food from a source
   */
  public collectFood(
    antId: string,
    position: Vector3,
    collectAmount: number,
    deltaTime: number
  ): { success: boolean; actualAmount: number; foodSourceId: string | null } {
    // Find nearby food sources
    const nearbyFoodSources = this.findNearbyFoodSources(position, 2.0);
    
    if (nearbyFoodSources.length === 0) {
      return { success: false, actualAmount: 0, foodSourceId: null };
    }

    // Choose the best food source (highest quality * amount ratio)
    const bestFoodSource = nearbyFoodSources.reduce((best, current) => {
      const currentScore = current.quality * (current.currentAmount / current.totalAmount);
      const bestScore = best.quality * (best.currentAmount / best.totalAmount);
      return currentScore > bestScore ? current : best;
    });

    // Calculate actual collection amount
    const maxCollectable = bestFoodSource.collectionRate * deltaTime;
    const actualAmount = Math.min(
      collectAmount,
      maxCollectable,
      bestFoodSource.currentAmount
    );

    if (actualAmount > 0) {
      // Update food source
      bestFoodSource.currentAmount -= actualAmount;
      bestFoodSource.lastCollectedTime = Date.now();
      bestFoodSource.discoveredBy.add(antId);

      // Check if exhausted
      if (bestFoodSource.currentAmount <= 0.01) {
        bestFoodSource.isExhausted = true;
        bestFoodSource.currentAmount = 0;
      }

      // Record collection event
      const event: FoodCollectionEvent = {
        antId,
        foodSourceId: bestFoodSource.id,
        amountCollected: actualAmount,
        timestamp: Date.now(),
        efficiency: actualAmount / maxCollectable
      };
      this.collectionEvents.push(event);

      // Keep only recent events (last 1000)
      if (this.collectionEvents.length > 1000) {
        this.collectionEvents = this.collectionEvents.slice(-1000);
      }

      return {
        success: true,
        actualAmount,
        foodSourceId: bestFoodSource.id
      };
    }

    return { success: false, actualAmount: 0, foodSourceId: bestFoodSource.id };
  }

  /**
   * Update food source system (regeneration, cleanup)
   */
  public update(deltaTime: number): void {
    for (const [id, foodSource] of this.foodSources.entries()) {
      // Handle regeneration
      if (foodSource.regeneration && !foodSource.isExhausted) {
        const regenerated = foodSource.regenerationRate * deltaTime;
        foodSource.currentAmount = Math.min(
          foodSource.totalAmount,
          foodSource.currentAmount + regenerated
        );
      }

      // Remove exhausted non-regenerating food sources after some time
      if (foodSource.isExhausted && !foodSource.regeneration) {
        const timeSinceExhaustion = Date.now() - foodSource.lastCollectedTime;
        if (timeSinceExhaustion > 60000) { // Remove after 1 minute
          this.foodSources.delete(id);
          console.log(`🗑️ Removed exhausted food source ${id}`);
        }
      }
    }
  }

  /**
   * Find food sources within range of a position
   */
  public findNearbyFoodSources(position: Vector3, range: number): FoodSource[] {
    const nearby: FoodSource[] = [];
    
    for (const foodSource of this.foodSources.values()) {
      if (foodSource.isExhausted) continue;
      
      const dx = foodSource.position.x - position.x;
      const dy = foodSource.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= range) {
        nearby.push(foodSource);
      }
    }
    
    return nearby;
  }

  /**
   * Get all food sources (for rendering)
   */
  public getAllFoodSources(): FoodSource[] {
    return Array.from(this.foodSources.values());
  }

  /**
   * Generate random food sources in the world
   */
  public generateRandomFoodSources(count: number, worldSize: number = 100): void {
    const foodTypes: FoodSource['type'][] = ['fruit', 'seed', 'insect', 'nectar', 'carrion'];
    
    for (let i = 0; i < count; i++) {
      const position: Vector3 = {
        x: (Math.random() - 0.5) * worldSize,
        y: (Math.random() - 0.5) * worldSize,
        z: 0
      };
      
      const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
      const amount = 10 + Math.random() * 40; // 10-50 units
      const quality = 0.5 + Math.random() * 0.5; // 0.5-1.0 quality
      
      this.addFoodSource(position, amount, type, quality);
    }
    
    console.log(`🍎 Generated ${count} random food sources`);
  }

  /**
   * Get statistics about food sources
   */
  public getStatistics(): {
    totalSources: number;
    exhaustedSources: number;
    totalFood: number;
    remainingFood: number;
    recentCollections: number;
  } {
    const sources = Array.from(this.foodSources.values());
    const recentCollections = this.collectionEvents.filter(
      event => Date.now() - event.timestamp < 10000 // Last 10 seconds
    ).length;

    return {
      totalSources: sources.length,
      exhaustedSources: sources.filter(s => s.isExhausted).length,
      totalFood: sources.reduce((sum, s) => sum + s.totalAmount, 0),
      remainingFood: sources.reduce((sum, s) => sum + s.currentAmount, 0),
      recentCollections
    };
  }

  private getCollectionRateForType(type: FoodSource['type']): number {
    switch (type) {
      case 'nectar': return 5.0; // Fast collection
      case 'fruit': return 3.0;
      case 'seed': return 2.0;
      case 'insect': return 4.0;
      case 'carrion': return 6.0; // Large chunks
      default: return 2.0;
    }
  }

  /**
   * Remove all food sources (for testing/reset)
   */
  public clearAll(): void {
    this.foodSources.clear();
    this.collectionEvents = [];
    this.nextFoodId = 1;
    console.log('🗑️ Cleared all food sources');
  }
}