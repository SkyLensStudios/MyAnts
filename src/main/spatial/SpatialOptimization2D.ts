/**
 * 2D Spatial Optimization System
 * Efficient spatial data structures for 2D ant colony simulation
 * Replaces 3D ME-BVH with optimized 2D spatial hash grid and BVH
 */

import {
  Vector2D,
  AABB2D,
  SpatialEntity2D,
  SpatialQuery2D,
  QueryResult2D,
  Vector2DUtils,
  AABB2DUtils
} from '../../shared/types-2d';

// 2D BVH Node
export interface BVHNode2D {
  id: number;
  bounds: AABB2D;
  isLeaf: boolean;
  
  // For internal nodes
  leftChild?: number;
  rightChild?: number;
  
  // For leaf nodes
  entities?: string[];
  entityCount: number;
  
  // Optimization
  parent?: number;
  lastAccess: number;
  depth: number;
}

// Spatial Hash Grid Cell
export interface SpatialHashCell {
  entities: Set<string>;
  bounds: AABB2D;
  lastUpdate: number;
}

// Configuration for spatial optimization
export interface SpatialOptimization2DConfig {
  hashGridCellSize: number;
  maxEntitiesPerBVHLeaf: number;
  maxBVHDepth: number;
  enableDynamicRebuilding: boolean;
  rebuildThreshold: number;
  enableSpatialHashing: boolean;
  enableBVH: boolean;
  queryOptimization: boolean;
}

/**
 * High-performance 2D Spatial Hash Grid
 * O(1) insertion, deletion, and neighbor queries
 */
export class SpatialHashGrid2D {
  private cellSize: number;
  private cells: Map<string, SpatialHashCell> = new Map();
  private entityToCell: Map<string, string> = new Map();
  private entities: Map<string, SpatialEntity2D> = new Map();
  
  constructor(cellSize: number = 50) {
    this.cellSize = cellSize;
  }

  /**
   * Get hash key for position
   */
  private getHashKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Get or create cell at position
   */
  private getOrCreateCell(key: string): SpatialHashCell {
    let cell = this.cells.get(key);
    if (!cell) {
      const [cellX, cellY] = key.split(',').map(Number);
      cell = {
        entities: new Set(),
        bounds: {
          min: { x: cellX * this.cellSize, y: cellY * this.cellSize },
          max: { x: (cellX + 1) * this.cellSize, y: (cellY + 1) * this.cellSize }
        },
        lastUpdate: Date.now()
      };
      this.cells.set(key, cell);
    }
    return cell;
  }

  /**
   * Insert entity into spatial hash
   */
  public insert(entity: SpatialEntity2D): void {
    const key = this.getHashKey(entity.position.x, entity.position.y);
    const cell = this.getOrCreateCell(key);
    
    // Remove from previous cell if exists
    this.remove(entity.id);
    
    // Add to new cell
    cell.entities.add(entity.id);
    this.entityToCell.set(entity.id, key);
    this.entities.set(entity.id, entity);
    cell.lastUpdate = Date.now();
  }

  /**
   * Remove entity from spatial hash
   */
  public remove(entityId: string): void {
    const cellKey = this.entityToCell.get(entityId);
    if (cellKey) {
      const cell = this.cells.get(cellKey);
      if (cell) {
        cell.entities.delete(entityId);
        if (cell.entities.size === 0) {
          this.cells.delete(cellKey);
        }
      }
      this.entityToCell.delete(entityId);
    }
    this.entities.delete(entityId);
  }

  /**
   * Update entity position
   */
  public update(entity: SpatialEntity2D): void {
    const currentKey = this.entityToCell.get(entity.id);
    const newKey = this.getHashKey(entity.position.x, entity.position.y);
    
    if (currentKey !== newKey) {
      this.insert(entity); // Will handle removal from old cell
    } else {
      this.entities.set(entity.id, entity);
    }
  }

  /**
   * Query entities within radius
   */
  public queryRadius(center: Vector2D, radius: number): SpatialEntity2D[] {
    const results: SpatialEntity2D[] = [];
    const radiusSquared = radius * radius;
    
    // Determine which cells to check
    const minX = Math.floor((center.x - radius) / this.cellSize);
    const maxX = Math.floor((center.x + radius) / this.cellSize);
    const minY = Math.floor((center.y - radius) / this.cellSize);
    const maxY = Math.floor((center.y + radius) / this.cellSize);
    
    // Check all relevant cells
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entityId of cell.entities) {
            const entity = this.entities.get(entityId);
            if (entity) {
              const distSquared = Vector2DUtils.distanceSquared(center, entity.position);
              if (distSquared <= radiusSquared) {
                results.push(entity);
              }
            }
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Query entities within AABB
   */
  public queryAABB(bounds: AABB2D): SpatialEntity2D[] {
    const results: SpatialEntity2D[] = [];
    
    // Determine which cells to check
    const minX = Math.floor(bounds.min.x / this.cellSize);
    const maxX = Math.floor(bounds.max.x / this.cellSize);
    const minY = Math.floor(bounds.min.y / this.cellSize);
    const maxY = Math.floor(bounds.max.y / this.cellSize);
    
    // Check all relevant cells
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entityId of cell.entities) {
            const entity = this.entities.get(entityId);
            if (entity && AABB2DUtils.contains(bounds, entity.position)) {
              results.push(entity);
            }
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Get all entities
   */
  public getAllEntities(): SpatialEntity2D[] {
    return Array.from(this.entities.values());
  }

  /**
   * Clear all entities
   */
  public clear(): void {
    this.cells.clear();
    this.entityToCell.clear();
    this.entities.clear();
  }

  /**
   * Get statistics
   */
  public getStats() {
    return {
      totalCells: this.cells.size,
      totalEntities: this.entities.size,
      averageEntitiesPerCell: this.entities.size / Math.max(1, this.cells.size),
      cellSize: this.cellSize
    };
  }
}

/**
 * 2D Bounding Volume Hierarchy for more complex spatial queries
 */
export class BVH2D {
  private nodes: BVHNode2D[] = [];
  private entities: Map<string, SpatialEntity2D> = new Map();
  private rootIndex: number = -1;
  private freeIndices: number[] = [];
  private config: SpatialOptimization2DConfig;
  private nextNodeId = 0;

  constructor(config: Partial<SpatialOptimization2DConfig> = {}) {
    this.config = {
      hashGridCellSize: 50,
      maxEntitiesPerBVHLeaf: 8,
      maxBVHDepth: 16,
      enableDynamicRebuilding: true,
      rebuildThreshold: 0.3,
      enableSpatialHashing: true,
      enableBVH: true,
      queryOptimization: true,
      ...config
    };
  }

  /**
   * Allocate new node
   */
  private allocateNode(): number {
    let index = this.freeIndices.pop();
    if (index === undefined) {
      index = this.nodes.length;
      this.nodes.push({
        id: this.nextNodeId++,
        bounds: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } },
        isLeaf: true,
        entities: [],
        entityCount: 0,
        lastAccess: Date.now(),
        depth: 0
      });
    }
    return index;
  }

  /**
   * Free node
   */
  private freeNode(index: number): void {
    this.freeIndices.push(index);
  }

  /**
   * Calculate bounds for entities
   */
  private calculateBounds(entityIds: string[]): AABB2D {
    if (entityIds.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const id of entityIds) {
      const entity = this.entities.get(id);
      if (entity) {
        const pos = entity.position;
        const radius = entity.radius;
        
        minX = Math.min(minX, pos.x - radius);
        minY = Math.min(minY, pos.y - radius);
        maxX = Math.max(maxX, pos.x + radius);
        maxY = Math.max(maxY, pos.y + radius);
      }
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }

  /**
   * Build BVH recursively
   */
  private buildNode(entityIds: string[], depth: number = 0): number {
    const nodeIndex = this.allocateNode();
    const node = this.nodes[nodeIndex];
    
    node.bounds = this.calculateBounds(entityIds);
    node.depth = depth;
    node.entityCount = entityIds.length;

    // Create leaf if conditions met
    if (entityIds.length <= this.config.maxEntitiesPerBVHLeaf || depth >= this.config.maxBVHDepth) {
      node.isLeaf = true;
      node.entities = [...entityIds];
      return nodeIndex;
    }

    // Split entities
    node.isLeaf = false;
    const { left, right } = this.splitEntities(entityIds, node.bounds);

    if (left.length > 0) {
      node.leftChild = this.buildNode(left, depth + 1);
      this.nodes[node.leftChild].parent = nodeIndex;
    }

    if (right.length > 0) {
      node.rightChild = this.buildNode(right, depth + 1);
      this.nodes[node.rightChild].parent = nodeIndex;
    }

    return nodeIndex;
  }

  /**
   * Split entities using surface area heuristic
   */
  private splitEntities(entityIds: string[], bounds: AABB2D): { left: string[], right: string[] } {
    if (entityIds.length <= 1) {
      return { left: entityIds, right: [] };
    }

    const center = AABB2DUtils.center(bounds);
    const size = AABB2DUtils.size(bounds);
    
    // Choose split axis (longest dimension)
    const splitX = size.x >= size.y;
    const splitValue = splitX ? center.x : center.y;

    const left: string[] = [];
    const right: string[] = [];

    for (const id of entityIds) {
      const entity = this.entities.get(id);
      if (entity) {
        const value = splitX ? entity.position.x : entity.position.y;
        if (value < splitValue) {
          left.push(id);
        } else {
          right.push(id);
        }
      }
    }

    // Ensure both sides have entities
    if (left.length === 0 || right.length === 0) {
      const mid = Math.floor(entityIds.length / 2);
      return {
        left: entityIds.slice(0, mid),
        right: entityIds.slice(mid)
      };
    }

    return { left, right };
  }

  /**
   * Insert entity
   */
  public insert(entity: SpatialEntity2D): void {
    this.entities.set(entity.id, entity);
    // For now, rebuild the tree when entities are added
    // In a production system, you'd implement incremental updates
    this.rebuild();
  }

  /**
   * Remove entity
   */
  public remove(entityId: string): void {
    this.entities.delete(entityId);
    this.rebuild();
  }

  /**
   * Update entity
   */
  public update(entity: SpatialEntity2D): void {
    this.entities.set(entity.id, entity);
    // Could implement more efficient update without full rebuild
    this.rebuild();
  }

  /**
   * Rebuild entire BVH
   */
  public rebuild(): void {
    this.nodes = [];
    this.freeIndices = [];
    this.nextNodeId = 0;
    
    const entityIds = Array.from(this.entities.keys());
    if (entityIds.length > 0) {
      this.rootIndex = this.buildNode(entityIds);
    } else {
      this.rootIndex = -1;
    }
  }

  /**
   * Query entities within radius
   */
  public queryRadius(center: Vector2D, radius: number): SpatialEntity2D[] {
    if (this.rootIndex === -1) return [];

    const results: SpatialEntity2D[] = [];
    const radiusSquared = radius * radius;
    const queryBounds: AABB2D = {
      min: { x: center.x - radius, y: center.y - radius },
      max: { x: center.x + radius, y: center.y + radius }
    };

    this.queryNodeRadius(this.rootIndex, center, radiusSquared, queryBounds, results);
    return results;
  }

  /**
   * Query node for radius search
   */
  private queryNodeRadius(
    nodeIndex: number,
    center: Vector2D,
    radiusSquared: number,
    queryBounds: AABB2D,
    results: SpatialEntity2D[]
  ): void {
    const node = this.nodes[nodeIndex];
    if (!node || !AABB2DUtils.intersects(node.bounds, queryBounds)) {
      return;
    }

    node.lastAccess = Date.now();

    if (node.isLeaf) {
      // Check entities in leaf
      if (node.entities) {
        for (const entityId of node.entities) {
          const entity = this.entities.get(entityId);
          if (entity) {
            const distSquared = Vector2DUtils.distanceSquared(center, entity.position);
            if (distSquared <= radiusSquared) {
              results.push(entity);
            }
          }
        }
      }
    } else {
      // Recurse to children
      if (node.leftChild !== undefined) {
        this.queryNodeRadius(node.leftChild, center, radiusSquared, queryBounds, results);
      }
      if (node.rightChild !== undefined) {
        this.queryNodeRadius(node.rightChild, center, radiusSquared, queryBounds, results);
      }
    }
  }

  /**
   * Query entities within AABB
   */
  public queryAABB(bounds: AABB2D): SpatialEntity2D[] {
    if (this.rootIndex === -1) return [];

    const results: SpatialEntity2D[] = [];
    this.queryNodeAABB(this.rootIndex, bounds, results);
    return results;
  }

  /**
   * Query node for AABB search
   */
  private queryNodeAABB(nodeIndex: number, queryBounds: AABB2D, results: SpatialEntity2D[]): void {
    const node = this.nodes[nodeIndex];
    if (!node || !AABB2DUtils.intersects(node.bounds, queryBounds)) {
      return;
    }

    node.lastAccess = Date.now();

    if (node.isLeaf) {
      if (node.entities) {
        for (const entityId of node.entities) {
          const entity = this.entities.get(entityId);
          if (entity && AABB2DUtils.contains(queryBounds, entity.position)) {
            results.push(entity);
          }
        }
      }
    } else {
      if (node.leftChild !== undefined) {
        this.queryNodeAABB(node.leftChild, queryBounds, results);
      }
      if (node.rightChild !== undefined) {
        this.queryNodeAABB(node.rightChild, queryBounds, results);
      }
    }
  }

  /**
   * Get statistics
   */
  public getStats() {
    return {
      totalNodes: this.nodes.length,
      totalEntities: this.entities.size,
      maxDepth: this.getMaxDepth(),
      averageDepth: this.getAverageDepth()
    };
  }

  private getMaxDepth(): number {
    if (this.rootIndex === -1) return 0;
    return Math.max(...this.nodes.map(node => node.depth));
  }

  private getAverageDepth(): number {
    if (this.nodes.length === 0) return 0;
    const totalDepth = this.nodes.reduce((sum, node) => sum + node.depth, 0);
    return totalDepth / this.nodes.length;
  }
}

/**
 * Unified 2D Spatial Optimization System
 * Combines spatial hash grid and BVH for optimal performance
 */
export class SpatialOptimization2D {
  private hashGrid: SpatialHashGrid2D;
  private bvh: BVH2D;
  private config: SpatialOptimization2DConfig;
  private entityCount = 0;
  private lastRebuild = Date.now();

  constructor(config: Partial<SpatialOptimization2DConfig> = {}) {
    this.config = {
      hashGridCellSize: 50,
      maxEntitiesPerBVHLeaf: 8,
      maxBVHDepth: 16,
      enableDynamicRebuilding: true,
      rebuildThreshold: 0.3,
      enableSpatialHashing: true,
      enableBVH: true,
      queryOptimization: true,
      ...config
    };

    this.hashGrid = new SpatialHashGrid2D(this.config.hashGridCellSize);
    this.bvh = new BVH2D(this.config);
  }

  /**
   * Insert entity into spatial optimization
   */
  public insert(entity: SpatialEntity2D): void {
    if (this.config.enableSpatialHashing) {
      this.hashGrid.insert(entity);
    }
    
    if (this.config.enableBVH) {
      this.bvh.insert(entity);
    }
    
    this.entityCount++;
  }

  /**
   * Remove entity from spatial optimization
   */
  public remove(entityId: string): void {
    if (this.config.enableSpatialHashing) {
      this.hashGrid.remove(entityId);
    }
    
    if (this.config.enableBVH) {
      this.bvh.remove(entityId);
    }
    
    this.entityCount--;
  }

  /**
   * Update entity position
   */
  public update(entity: SpatialEntity2D): void {
    if (this.config.enableSpatialHashing) {
      this.hashGrid.update(entity);
    }
    
    if (this.config.enableBVH) {
      this.bvh.update(entity);
    }
  }

  /**
   * Execute spatial query with automatic optimization
   */
  public query(query: SpatialQuery2D): QueryResult2D {
    const startTime = performance.now();
    let entities: SpatialEntity2D[] = [];
    let nodesVisited = 0;
    let entitiesChecked = 0;

    // Choose optimal query method based on query type and data structures
    if (query.type === 'radius' && query.center && query.radius !== undefined) {
      if (this.config.enableSpatialHashing && query.radius <= this.config.hashGridCellSize * 2) {
        // Use hash grid for small radius queries
        entities = this.hashGrid.queryRadius(query.center, query.radius);
      } else if (this.config.enableBVH) {
        // Use BVH for larger radius queries
        entities = this.bvh.queryRadius(query.center, query.radius);
      }
    } else if (query.type === 'range' && query.bounds) {
      if (this.config.enableSpatialHashing) {
        entities = this.hashGrid.queryAABB(query.bounds);
      } else if (this.config.enableBVH) {
        entities = this.bvh.queryAABB(query.bounds);
      }
    }

    // Apply filter if provided
    if (query.filter) {
      entities = entities.filter(query.filter);
    }

    // Limit results if specified
    if (query.maxResults && entities.length > query.maxResults) {
      entities = entities.slice(0, query.maxResults);
    }

    entitiesChecked = entities.length;
    const queryTime = performance.now() - startTime;

    return {
      entities,
      queryTime,
      nodesVisited,
      entitiesChecked
    };
  }

  /**
   * Find nearest neighbors
   */
  public findNearestNeighbors(position: Vector2D, count: number = 5, maxRadius: number = 100): SpatialEntity2D[] {
    const query: SpatialQuery2D = {
      type: 'radius',
      center: position,
      radius: maxRadius,
      maxResults: count * 2 // Get more than needed for sorting
    };

    const result = this.query(query);
    
    // Sort by distance and return closest
    return result.entities
      .sort((a: SpatialEntity2D, b: SpatialEntity2D) => {
        const distA = Vector2DUtils.distanceSquared(position, a.position);
        const distB = Vector2DUtils.distanceSquared(position, b.position);
        return distA - distB;
      })
      .slice(0, count);
  }

  /**
   * Clear all entities
   */
  public clear(): void {
    this.hashGrid.clear();
    this.bvh.rebuild();
    this.entityCount = 0;
  }

  /**
   * Get comprehensive statistics
   */
  public getStats() {
    return {
      entityCount: this.entityCount,
      hashGrid: this.config.enableSpatialHashing ? this.hashGrid.getStats() : null,
      bvh: this.config.enableBVH ? this.bvh.getStats() : null,
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SpatialOptimization2DConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate data structures if needed
    if (newConfig.hashGridCellSize) {
      const entities = this.hashGrid.getAllEntities();
      this.hashGrid = new SpatialHashGrid2D(this.config.hashGridCellSize);
      entities.forEach(entity => this.hashGrid.insert(entity));
    }
  }
}