/**
 * Advanced spatial memory system for ants
 * Implements realistic navigation, landmark recognition, and path optimization
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Landmark {
  id: string;
  position: Vector3D;
  type: 'food_source' | 'nest_entrance' | 'tunnel_junction' | 'danger_zone' | 'construction_site' | 'water_source';
  strength: number;        // Memory strength (0-1)
  lastVisited: number;     // Timestamp of last visit
  reliability: number;     // How reliable this landmark is (0-1)
  associatedRewards: number; // Positive/negative associations
  description?: string;    // Additional landmark details
}

export interface PathSegment {
  from: Vector3D;
  to: Vector3D;
  distance: number;
  difficulty: number;      // Travel difficulty (0-1)
  safety: number;          // Safety rating (0-1)
  pheromoneStrength: number; // Pheromone trail strength
  lastUsed: number;        // When this path was last used
  useCount: number;        // How many times used
  reliability: number;     // Path reliability (0-1)
}

export interface SpatialMap {
  landmarks: Map<string, Landmark>;
  paths: PathSegment[];
  dangerZones: Array<{
    position: Vector3D;
    radius: number;
    severity: number;
    type: 'predator' | 'hostile_colony' | 'environmental';
  }>;
  foodSources: Map<string, {
    position: Vector3D;
    quality: number;
    depletion: number;
    lastChecked: number;
  }>;
}

export interface NavigationGoal {
  destination: Vector3D;
  type: 'forage' | 'return_home' | 'explore' | 'patrol' | 'escape';
  urgency: number;         // 0-1, affects path choice
  allowRisk: boolean;      // Whether to use risky but faster paths
}

export class SpatialMemory {
  private map: SpatialMap;
  private currentPosition: Vector3D;
  private homePosition: Vector3D;
  private memoryCapacity: number;
  private genetics: any;
  private learningRate: number;
  
  // Memory parameters
  private readonly MAX_LANDMARKS = 200;
  private readonly MAX_PATHS = 500;
  private readonly MEMORY_DECAY_RATE = 0.001;
  private readonly LANDMARK_THRESHOLD = 0.1;
  
  constructor(homePosition: Vector3D, genetics: any) {
    this.homePosition = { ...homePosition };
    this.currentPosition = { ...homePosition };
    this.genetics = genetics;
    this.memoryCapacity = Math.floor(50 + genetics.spatialMemory * 150);
    this.learningRate = genetics.learningRate || 0.5;
    
    this.map = {
      landmarks: new Map(),
      paths: [],
      dangerZones: [],
      foodSources: new Map(),
    };
    
    // Add home as initial landmark
    this.addLandmark({
      id: 'home',
      position: homePosition,
      type: 'nest_entrance',
      strength: 1.0,
      lastVisited: Date.now(),
      reliability: 1.0,
      associatedRewards: 0.8,
    });
  }

  /**
   * Update current position and process spatial learning
   */
  public updatePosition(newPosition: Vector3D): void {
    const oldPosition = { ...this.currentPosition };
    this.currentPosition = { ...newPosition };
    
    // Learn from movement
    this.learnFromMovement(oldPosition, newPosition);
    
    // Update landmark visibility
    this.updateLandmarkVisibility();
    
    // Decay memory over time
    this.decayMemory();
  }

  private learnFromMovement(from: Vector3D, to: Vector3D): void {
    const distance = this.calculateDistance(from, to);
    
    if (distance > 0.1) { // Significant movement
      // Record path segment
      this.recordPathSegment(from, to);
      
      // Update landmark associations
      this.updateLandmarkAssociations(to);
    }
  }

  private recordPathSegment(from: Vector3D, to: Vector3D): void {
    const distance = this.calculateDistance(from, to);
    const existingPath = this.findSimilarPath(from, to);
    
    if (existingPath) {
      // Update existing path
      existingPath.useCount++;
      existingPath.lastUsed = Date.now();
      existingPath.difficulty = this.lerp(existingPath.difficulty, 
        this.assessPathDifficulty(from, to), 0.1);
    } else {
      // Create new path segment
      const newPath: PathSegment = {
        from: { ...from },
        to: { ...to },
        distance,
        difficulty: this.assessPathDifficulty(from, to),
        safety: this.assessPathSafety(from, to),
        pheromoneStrength: 0,
        lastUsed: Date.now(),
        useCount: 1,
        reliability: 0.5, // Initial reliability
      };
      
      this.map.paths.push(newPath);
      
      // Limit path memory
      if (this.map.paths.length > this.MAX_PATHS) {
        this.pruneOldPaths();
      }
    }
  }

  private findSimilarPath(from: Vector3D, to: Vector3D): PathSegment | undefined {
    const threshold = 2.0; // Distance threshold for similar paths
    
    return this.map.paths.find(path => {
      const fromDist = this.calculateDistance(path.from, from);
      const toDist = this.calculateDistance(path.to, to);
      return fromDist < threshold && toDist < threshold;
    });
  }

  private assessPathDifficulty(from: Vector3D, to: Vector3D): number {
    // Simplified difficulty assessment
    const elevation = Math.abs(to.z - from.z);
    const distance = this.calculateDistance(from, to);
    
    // Steeper = more difficult
    const gradient = elevation / distance;
    return Math.min(1, gradient * 2);
  }

  private assessPathSafety(from: Vector3D, to: Vector3D): number {
    let safety = 1.0;
    
    // Check proximity to danger zones
    for (const danger of this.map.dangerZones) {
      const pathMidpoint = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        z: (from.z + to.z) / 2,
      };
      
      const distToDanger = this.calculateDistance(pathMidpoint, danger.position);
      if (distToDanger < danger.radius) {
        safety *= (1 - danger.severity);
      }
    }
    
    return safety;
  }

  /**
   * Add or update a landmark
   */
  public addLandmark(landmark: Landmark): void {
    const existing = this.map.landmarks.get(landmark.id);
    
    if (existing) {
      // Update existing landmark
      existing.lastVisited = landmark.lastVisited;
      existing.strength = Math.min(1, existing.strength + 0.1);
      existing.reliability = this.lerp(existing.reliability, landmark.reliability, 0.2);
    } else {
      // Add new landmark
      this.map.landmarks.set(landmark.id, { ...landmark });
      
      // Limit landmark memory
      if (this.map.landmarks.size > this.memoryCapacity) {
        this.pruneWeakLandmarks();
      }
    }
  }

  /**
   * Find path to destination using A* algorithm with memory
   */
  public findPath(goal: NavigationGoal): Vector3D[] | null {
    const start = { ...this.currentPosition };
    const end = goal.destination;
    
    // Use A* with memory-enhanced heuristics
    const path = this.aStar(start, end, goal);
    
    if (path && path.length > 1) {
      // Learn from successful pathfinding
      this.reinforcePath(path);
      return path;
    }
    
    // Fallback to direct path if no memory path found
    return this.getDirectPath(start, end);
  }

  private aStar(start: Vector3D, goal: Vector3D, navGoal: NavigationGoal): Vector3D[] | null {
    const openSet: Array<{
      position: Vector3D;
      gScore: number;
      fScore: number;
      parent?: Vector3D;
    }> = [];
    
    const closedSet = new Set<string>();
    
    openSet.push({
      position: start,
      gScore: 0,
      fScore: this.heuristic(start, goal, navGoal),
    });
    
    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;
      
      const currentKey = this.positionKey(current.position);
      
      if (closedSet.has(currentKey)) {
        continue;
      }
      
      closedSet.add(currentKey);
      
      // Check if we reached the goal
      if (this.calculateDistance(current.position, goal) < 1.0) {
        return this.reconstructPath(current);
      }
      
      // Get neighbors from memory
      const neighbors = this.getMemoryBasedNeighbors(current.position, navGoal);
      
      for (const neighbor of neighbors) {
        const neighborKey = this.positionKey(neighbor.position);
        
        if (closedSet.has(neighborKey)) {
          continue;
        }
        
        const tentativeGScore = current.gScore + neighbor.cost;
        
        const existingNeighbor = openSet.find(n => 
          this.positionKey(n.position) === neighborKey);
        
        if (!existingNeighbor || tentativeGScore < existingNeighbor.gScore) {
          const neighborNode = {
            position: neighbor.position,
            gScore: tentativeGScore,
            fScore: tentativeGScore + this.heuristic(neighbor.position, goal, navGoal),
            parent: current.position,
          };
          
          if (existingNeighbor) {
            Object.assign(existingNeighbor, neighborNode);
          } else {
            openSet.push(neighborNode);
          }
        }
      }
    }
    
    return null; // No path found
  }

  private getMemoryBasedNeighbors(position: Vector3D, goal: NavigationGoal): Array<{
    position: Vector3D;
    cost: number;
  }> {
    const neighbors: Array<{ position: Vector3D; cost: number }> = [];
    
    // Find paths from memory that start near current position
    const nearbyPaths = this.map.paths.filter(path => 
      this.calculateDistance(path.from, position) < 3.0);
    
    for (const path of nearbyPaths) {
      let cost = path.distance;
      
      // Adjust cost based on path properties
      cost *= (1 + path.difficulty);
      cost *= (2 - path.safety); // Unsafe paths cost more
      
      // Urgency affects risk tolerance
      if (goal.urgency > 0.7 && !goal.allowRisk) {
        cost *= (2 - path.safety);
      }
      
      // Pheromone trails reduce cost
      cost *= (1 - path.pheromoneStrength * 0.3);
      
      neighbors.push({
        position: path.to,
        cost,
      });
    }
    
    // Add landmark-based movement options
    for (const [_, landmark] of this.map.landmarks) {
      const distance = this.calculateDistance(position, landmark.position);
      
      if (distance < 10.0 && distance > 0.5) {
        let cost = distance;
        
        // Reliable landmarks are preferred
        cost *= (2 - landmark.reliability);
        
        // Recent landmarks are preferred
        const timeSinceVisit = Date.now() - landmark.lastVisited;
        const recencyFactor = Math.min(1, timeSinceVisit / (24 * 60 * 60 * 1000)); // 24 hours
        cost *= (1 + recencyFactor * 0.5);
        
        neighbors.push({
          position: landmark.position,
          cost,
        });
      }
    }
    
    return neighbors;
  }

  private heuristic(from: Vector3D, to: Vector3D, goal: NavigationGoal): number {
    let distance = this.calculateDistance(from, to);
    
    // Adjust heuristic based on goal type
    switch (goal.type) {
      case 'return_home':
        // Prefer known paths home
        const homeDistance = this.calculateDistance(from, this.homePosition);
        distance *= (1 - homeDistance / 100); // Closer to home is better
        break;
        
      case 'forage':
        // Consider known food sources
        for (const [_, food] of this.map.foodSources) {
          const foodDistance = this.calculateDistance(from, food.position);
          if (foodDistance < 5.0) {
            distance *= (1 - food.quality * 0.3);
          }
        }
        break;
        
      case 'escape':
        // Prefer paths away from danger
        for (const danger of this.map.dangerZones) {
          const dangerDistance = this.calculateDistance(from, danger.position);
          if (dangerDistance < danger.radius * 2) {
            distance *= (1 + danger.severity);
          }
        }
        break;
    }
    
    return distance;
  }

  private reconstructPath(node: any): Vector3D[] {
    const path: Vector3D[] = [];
    let current = node;
    
    while (current) {
      path.unshift(current.position);
      current = current.parent ? this.findNodeWithPosition(current.parent) : null;
    }
    
    return path;
  }

  private findNodeWithPosition(position: Vector3D): any {
    // This would need to be implemented with proper node tracking
    // For now, simplified version
    return null;
  }

  private getDirectPath(start: Vector3D, end: Vector3D): Vector3D[] {
    // Simple direct path as fallback
    return [start, end];
  }

  /**
   * Learn from successful food discovery
   */
  public learnFoodSource(position: Vector3D, quality: number): void {
    const id = `food_${this.positionKey(position)}`;
    
    this.map.foodSources.set(id, {
      position: { ...position },
      quality,
      depletion: 0,
      lastChecked: Date.now(),
    });
    
    // Add as landmark
    this.addLandmark({
      id: `landmark_${id}`,
      position: { ...position },
      type: 'food_source',
      strength: quality,
      lastVisited: Date.now(),
      reliability: 0.8,
      associatedRewards: quality,
    });
  }

  /**
   * Learn from danger encounters
   */
  public learnDanger(position: Vector3D, severity: number, type: 'predator' | 'hostile_colony' | 'environmental'): void {
    this.map.dangerZones.push({
      position: { ...position },
      radius: 5.0,
      severity,
      type,
    });
    
    // Add negative landmark
    this.addLandmark({
      id: `danger_${this.positionKey(position)}_${Date.now()}`,
      position: { ...position },
      type: 'danger_zone',
      strength: severity,
      lastVisited: Date.now(),
      reliability: 0.9,
      associatedRewards: -severity,
    });
  }

  /**
   * Get nearby landmarks
   */
  public getNearbyLandmarks(radius: number = 10): Landmark[] {
    const nearby: Landmark[] = [];
    
    for (const [_, landmark] of this.map.landmarks) {
      const distance = this.calculateDistance(this.currentPosition, landmark.position);
      if (distance <= radius) {
        nearby.push(landmark);
      }
    }
    
    return nearby.sort((a, b) => 
      this.calculateDistance(this.currentPosition, a.position) - 
      this.calculateDistance(this.currentPosition, b.position));
  }

  /**
   * Forget old or unreliable memories
   */
  private decayMemory(): void {
    const currentTime = Date.now();
    
    // Decay landmark strength
    for (const [id, landmark] of this.map.landmarks) {
      const timeSinceVisit = currentTime - landmark.lastVisited;
      const decayAmount = this.MEMORY_DECAY_RATE * (timeSinceVisit / 1000);
      
      landmark.strength = Math.max(0, landmark.strength - decayAmount);
      
      if (landmark.strength < this.LANDMARK_THRESHOLD && landmark.type !== 'nest_entrance') {
        this.map.landmarks.delete(id);
      }
    }
    
    // Remove old paths
    this.map.paths = this.map.paths.filter(path => {
      const age = currentTime - path.lastUsed;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      return age < maxAge || path.useCount > 5;
    });
  }

  private pruneWeakLandmarks(): void {
    const landmarks = Array.from(this.map.landmarks.entries());
    landmarks.sort((a, b) => a[1].strength - b[1].strength);
    
    const toRemove = Math.floor(landmarks.length * 0.1); // Remove weakest 10%
    for (let i = 0; i < toRemove; i++) {
      if (landmarks[i][1].type !== 'nest_entrance') {
        this.map.landmarks.delete(landmarks[i][0]);
      }
    }
  }

  private pruneOldPaths(): void {
    this.map.paths.sort((a, b) => a.lastUsed - b.lastUsed);
    this.map.paths.splice(0, Math.floor(this.map.paths.length * 0.1)); // Remove oldest 10%
  }

  private reinforcePath(path: Vector3D[]): void {
    for (let i = 0; i < path.length - 1; i++) {
      const pathSegment = this.findSimilarPath(path[i], path[i + 1]);
      if (pathSegment) {
        pathSegment.useCount++;
        pathSegment.lastUsed = Date.now();
        pathSegment.reliability = Math.min(1, pathSegment.reliability * 1.1);
      }
    }
  }

  private updateLandmarkVisibility(): void {
    // Update landmarks that are currently visible
    for (const [_, landmark] of this.map.landmarks) {
      const distance = this.calculateDistance(this.currentPosition, landmark.position);
      
      if (distance < 3.0) { // Within visibility range
        landmark.lastVisited = Date.now();
        landmark.strength = Math.min(1, landmark.strength + 0.05);
      }
    }
  }

  private updateLandmarkAssociations(position: Vector3D): void {
    // Update associations for nearby landmarks based on current context
    for (const [_, landmark] of this.map.landmarks) {
      const distance = this.calculateDistance(position, landmark.position);
      
      if (distance < 2.0) {
        // Learning happens near landmarks
        landmark.reliability = this.lerp(landmark.reliability, 0.9, this.learningRate * 0.1);
      }
    }
  }

  // Utility methods
  private calculateDistance(a: Vector3D, b: Vector3D): number {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + 
      Math.pow(a.y - b.y, 2) + 
      Math.pow(a.z - b.z, 2)
    );
  }

  private positionKey(position: Vector3D): string {
    return `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Get memory statistics for analysis
   */
  public getMemoryStats(): {
    landmarkCount: number;
    pathCount: number;
    memoryUtilization: number;
    averageLandmarkStrength: number;
  } {
    const landmarks = Array.from(this.map.landmarks.values());
    const avgStrength = landmarks.length > 0 
      ? landmarks.reduce((sum, l) => sum + l.strength, 0) / landmarks.length 
      : 0;
    
    return {
      landmarkCount: this.map.landmarks.size,
      pathCount: this.map.paths.length,
      memoryUtilization: this.map.landmarks.size / this.memoryCapacity,
      averageLandmarkStrength: avgStrength,
    };
  }

  /**
   * Export memory map for analysis or save/load
   */
  public exportMemory(): SpatialMap {
    return {
      landmarks: new Map(this.map.landmarks),
      paths: [...this.map.paths],
      dangerZones: [...this.map.dangerZones],
      foodSources: new Map(this.map.foodSources),
    };
  }

  /**
   * Import memory map
   */
  public importMemory(memoryMap: SpatialMap): void {
    this.map = {
      landmarks: new Map(memoryMap.landmarks),
      paths: [...memoryMap.paths],
      dangerZones: [...memoryMap.dangerZones],
      foodSources: new Map(memoryMap.foodSources),
    };
  }

  /**
   * Get direction for exploration based on spatial memory
   * Returns direction toward unexplored or promising areas
   */
  public getExplorationDirection(): number {
    // Analyze current position relative to known landmarks
    const nearbyLandmarks = this.getNearbyLandmarks(20);
    
    // If no landmarks, encourage random exploration
    if (nearbyLandmarks.length === 0) {
      return Math.random() * Math.PI * 2;
    }
    
    // Find direction with least landmark density (unexplored areas)
    const sectors = 8; // Divide space into 8 sectors
    const sectorCounts = new Array(sectors).fill(0);
    
    for (const landmark of nearbyLandmarks) {
      const dx = landmark.position.x - this.currentPosition.x;
      const dy = landmark.position.y - this.currentPosition.y;
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0-1
      const sector = Math.floor(normalizedAngle * sectors) % sectors;
      sectorCounts[sector]++;
    }
    
    // Find sector with lowest density
    let minCount = Math.min(...sectorCounts);
    let bestSectors = sectorCounts
      .map((count, index) => ({ count, index }))
      .filter(s => s.count === minCount)
      .map(s => s.index);
    
    // Choose random sector from best options
    const chosenSector = bestSectors[Math.floor(Math.random() * bestSectors.length)];
    
    // Convert sector back to angle
    const sectorAngle = (chosenSector / sectors) * 2 * Math.PI - Math.PI;
    
    // Add some randomness within the sector
    const sectorWidth = (2 * Math.PI) / sectors;
    return sectorAngle + (Math.random() - 0.5) * sectorWidth;
  }
}