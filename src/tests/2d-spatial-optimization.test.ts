/**
 * 2D Spatial Optimization Tests
 * Comprehensive tests for SpatialHashGrid2D, BVH2D, and SpatialOptimization2D
 */

import {
  SpatialHashGrid2D,
  BVH2D,
  SpatialOptimization2D,
  SpatialOptimization2DConfig
} from '../main/spatial/SpatialOptimization2D';

import {
  Vector2D,
  Vector2DUtils,
  AABB2D,
  AABB2DUtils,
  SpatialEntity2D,
  SpatialQuery2D
} from '../shared/types-2d';

describe('2D Spatial Optimization Tests', () => {

  describe('SpatialHashGrid2D', () => {
    let hashGrid: SpatialHashGrid2D;

    beforeEach(() => {
      hashGrid = new SpatialHashGrid2D(50); // 50 unit cell size
    });

    test('should initialize with correct cell size', () => {
      expect(hashGrid).toBeDefined();
      const stats = hashGrid.getStats();
      expect(stats.cellSize).toBe(50);
      expect(stats.totalCells).toBe(0);
      expect(stats.totalEntities).toBe(0);
    });

    test('should insert and retrieve single entity', () => {
      const entity: SpatialEntity2D = {
        id: 'test-entity',
        position: { x: 100, y: 100 },
        radius: 5,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 10, y: 10 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      hashGrid.insert(entity);

      const stats = hashGrid.getStats();
      expect(stats.totalEntities).toBe(1);
      expect(stats.totalCells).toBe(1);

      const allEntities = hashGrid.getAllEntities();
      expect(allEntities).toHaveLength(1);
      expect(allEntities[0].id).toBe('test-entity');
    });

    test('should handle multiple entities in same cell', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'entity-1',
          position: { x: 25, y: 25 }, // Same cell
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 25, y: 25 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'entity-2',
          position: { x: 30, y: 30 }, // Same cell
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 30, y: 30 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => hashGrid.insert(entity));

      const stats = hashGrid.getStats();
      expect(stats.totalEntities).toBe(2);
      expect(stats.totalCells).toBe(1); // Both in same cell
      expect(stats.averageEntitiesPerCell).toBe(2);
    });

    test('should distribute entities across multiple cells', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'entity-1',
          position: { x: 25, y: 25 }, // Cell (0,0)
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 25, y: 25 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'entity-2',
          position: { x: 75, y: 75 }, // Cell (1,1)
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 75, y: 75 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'entity-3',
          position: { x: 125, y: 25 }, // Cell (2,0)
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 125, y: 25 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => hashGrid.insert(entity));

      const stats = hashGrid.getStats();
      expect(stats.totalEntities).toBe(3);
      expect(stats.totalCells).toBe(3);
      expect(stats.averageEntitiesPerCell).toBeCloseTo(1, 1);
    });

    test('should perform radius queries correctly', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'center-entity',
          position: { x: 100, y: 100 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'near-entity',
          position: { x: 110, y: 110 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 110, y: 110 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'far-entity',
          position: { x: 200, y: 200 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 200, y: 200 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => hashGrid.insert(entity));

      // Query with radius that should include center and near entity
      const results = hashGrid.queryRadius({ x: 100, y: 100 }, 20);

      expect(results).toHaveLength(2);
      expect(results.map(e => e.id).sort()).toEqual(['center-entity', 'near-entity']);
    });

    test('should perform AABB queries correctly', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'inside-entity',
          position: { x: 50, y: 50 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 50, y: 50 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'outside-entity',
          position: { x: 150, y: 150 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 150, y: 150 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => hashGrid.insert(entity));

      const queryBounds: AABB2D = {
        min: { x: 25, y: 25 },
        max: { x: 75, y: 75 }
      };

      const results = hashGrid.queryAABB(queryBounds);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('inside-entity');
    });

    test('should remove entities correctly', () => {
      const entity: SpatialEntity2D = {
        id: 'test-entity',
        position: { x: 100, y: 100 },
        radius: 5,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 10, y: 10 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      hashGrid.insert(entity);
      expect(hashGrid.getStats().totalEntities).toBe(1);

      hashGrid.remove('test-entity');
      expect(hashGrid.getStats().totalEntities).toBe(0);

      const allEntities = hashGrid.getAllEntities();
      expect(allEntities).toHaveLength(0);
    });

    test('should update entity positions', () => {
      const entity: SpatialEntity2D = {
        id: 'moving-entity',
        position: { x: 25, y: 25 },
        radius: 2,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 25, y: 25 }, { x: 4, y: 4 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      hashGrid.insert(entity);

      // Update position to different cell
      const updatedEntity: SpatialEntity2D = {
        ...entity,
        position: { x: 125, y: 125 },
        bounds: AABB2DUtils.fromCenterAndSize({ x: 125, y: 125 }, { x: 4, y: 4 })
      };

      hashGrid.update(updatedEntity);

      // Query original position should return empty
      const originalResults = hashGrid.queryRadius({ x: 25, y: 25 }, 10);
      expect(originalResults).toHaveLength(0);

      // Query new position should find the entity
      const newResults = hashGrid.queryRadius({ x: 125, y: 125 }, 10);
      expect(newResults).toHaveLength(1);
      expect(newResults[0].id).toBe('moving-entity');
    });

    test('should clear all entities', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: i * 50, y: i * 50 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: i * 50, y: i * 50 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => hashGrid.insert(entity));
      expect(hashGrid.getStats().totalEntities).toBe(10);

      hashGrid.clear();
      expect(hashGrid.getStats().totalEntities).toBe(0);
      expect(hashGrid.getStats().totalCells).toBe(0);
    });
  });

  describe('BVH2D', () => {
    let bvh: BVH2D;

    beforeEach(() => {
      bvh = new BVH2D({
        maxEntitiesPerBVHLeaf: 4,
        maxBVHDepth: 8
      });
    });

    test('should initialize with configuration', () => {
      expect(bvh).toBeDefined();
      const stats = bvh.getStats();
      expect(stats.totalNodes).toBe(0);
      expect(stats.totalEntities).toBe(0);
    });

    test('should build tree with single entity', () => {
      const entity: SpatialEntity2D = {
        id: 'single-entity',
        position: { x: 100, y: 100 },
        radius: 5,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 10, y: 10 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      bvh.insert(entity);

      const stats = bvh.getStats();
      expect(stats.totalEntities).toBe(1);
      expect(stats.totalNodes).toBeGreaterThanOrEqual(1);
    });

    test('should build balanced tree with many entities', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 50; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: Math.random() * 1000, y: Math.random() * 1000 },
          radius: 3,
          bounds: AABB2DUtils.fromCenterAndSize(
            { x: Math.random() * 1000, y: Math.random() * 1000 },
            { x: 6, y: 6 }
          ),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => bvh.insert(entity));

      const stats = bvh.getStats();
      expect(stats.totalEntities).toBe(50);
      expect(stats.totalNodes).toBeGreaterThan(1);
      expect(stats.maxDepth).toBeGreaterThan(0);
      expect(stats.averageDepth).toBeGreaterThan(0);
    });

    test('should perform radius queries efficiently', () => {
      // Create clustered entities
      const entities: SpatialEntity2D[] = [];

      // Cluster 1: around (100, 100)
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `cluster1-${i}`,
          position: { x: 100 + Math.random() * 20, y: 100 + Math.random() * 20 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize(
            { x: 100 + Math.random() * 20, y: 100 + Math.random() * 20 },
            { x: 4, y: 4 }
          ),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      // Cluster 2: around (500, 500)
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `cluster2-${i}`,
          position: { x: 500 + Math.random() * 20, y: 500 + Math.random() * 20 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize(
            { x: 500 + Math.random() * 20, y: 500 + Math.random() * 20 },
            { x: 4, y: 4 }
          ),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => bvh.insert(entity));

      // Query around cluster 1
      const cluster1Results = bvh.queryRadius({ x: 100, y: 100 }, 50);
      expect(cluster1Results.length).toBeGreaterThan(0);
      expect(cluster1Results.length).toBeLessThanOrEqual(10);

      // Query around cluster 2
      const cluster2Results = bvh.queryRadius({ x: 500, y: 500 }, 50);
      expect(cluster2Results.length).toBeGreaterThan(0);
      expect(cluster2Results.length).toBeLessThanOrEqual(10);

      // Query between clusters should return fewer results
      const betweenResults = bvh.queryRadius({ x: 300, y: 300 }, 50);
      expect(betweenResults.length).toBeLessThanOrEqual(cluster1Results.length);
    });

    test('should perform AABB queries correctly', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'inside-1',
          position: { x: 50, y: 50 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 50, y: 50 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'inside-2',
          position: { x: 60, y: 60 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 60, y: 60 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'outside',
          position: { x: 150, y: 150 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 150, y: 150 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => bvh.insert(entity));

      const queryBounds: AABB2D = {
        min: { x: 25, y: 25 },
        max: { x: 75, y: 75 }
      };

      const results = bvh.queryAABB(queryBounds);

      expect(results).toHaveLength(2);
      expect(results.map(e => e.id).sort()).toEqual(['inside-1', 'inside-2']);
    });

    test('should handle entity removal and updates', () => {
      const entity: SpatialEntity2D = {
        id: 'test-entity',
        position: { x: 100, y: 100 },
        radius: 5,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 10, y: 10 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      bvh.insert(entity);
      expect(bvh.getStats().totalEntities).toBe(1);

      bvh.remove('test-entity');
      expect(bvh.getStats().totalEntities).toBe(0);
    });

    test('should rebuild tree efficiently', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 20; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: i * 25, y: i * 25 },
          radius: 3,
          bounds: AABB2DUtils.fromCenterAndSize({ x: i * 25, y: i * 25 }, { x: 6, y: 6 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => bvh.insert(entity));

      const startTime = performance.now();
      bvh.rebuild();
      const rebuildTime = performance.now() - startTime;

      expect(rebuildTime).toBeLessThan(50); // Should rebuild quickly
      expect(bvh.getStats().totalEntities).toBe(20);
    });
  });

  describe('SpatialOptimization2D', () => {
    let spatialSystem: SpatialOptimization2D;

    beforeEach(() => {
      spatialSystem = new SpatialOptimization2D({
        hashGridCellSize: 50,
        enableSpatialHashing: true,
        enableBVH: true,
        queryOptimization: true
      });
    });

    test('should initialize with both systems enabled', () => {
      expect(spatialSystem).toBeDefined();
      const stats = spatialSystem.getStats();
      expect(stats.entityCount).toBe(0);
      expect(stats.hashGrid).toBeDefined();
      expect(stats.bvh).toBeDefined();
    });

    test('should choose optimal query method based on size', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 20; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: i * 30, y: i * 30 },
          radius: 3,
          bounds: AABB2DUtils.fromCenterAndSize({ x: i * 30, y: i * 30 }, { x: 6, y: 6 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => spatialSystem.insert(entity));

      // Small radius query should use hash grid
      const smallQuery: SpatialQuery2D = {
        type: 'radius',
        center: { x: 100, y: 100 },
        radius: 30 // Less than 2 * cellSize
      };

      const smallResult = spatialSystem.query(smallQuery);
      expect(smallResult.entities).toBeDefined();
      expect(smallResult.queryTime).toBeGreaterThanOrEqual(0);

      // Large radius query should use BVH
      const largeQuery: SpatialQuery2D = {
        type: 'radius',
        center: { x: 100, y: 100 },
        radius: 200 // Greater than 2 * cellSize
      };

      const largeResult = spatialSystem.query(largeQuery);
      expect(largeResult.entities).toBeDefined();
      expect(largeResult.queryTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle range queries with AABB', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'entity-1',
          position: { x: 50, y: 50 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 50, y: 50 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'entity-2',
          position: { x: 150, y: 150 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 150, y: 150 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => spatialSystem.insert(entity));

      const rangeQuery: SpatialQuery2D = {
        type: 'range',
        bounds: {
          min: { x: 25, y: 25 },
          max: { x: 75, y: 75 }
        }
      };

      const result = spatialSystem.query(rangeQuery);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].id).toBe('entity-1');
    });

    test('should apply filters to query results', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'ant-1',
          position: { x: 100, y: 100 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'food-1',
          position: { x: 110, y: 110 },
          radius: 3,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 110, y: 110 }, { x: 6, y: 6 }),
          type: 'food',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => spatialSystem.insert(entity));

      const filteredQuery: SpatialQuery2D = {
        type: 'radius',
        center: { x: 100, y: 100 },
        radius: 20,
        filter: (entity) => entity.type === 'ant'
      };

      const result = spatialSystem.query(filteredQuery);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].type).toBe('ant');
    });

    test('should limit results when maxResults is specified', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: 100 + i, y: 100 + i },
          radius: 1,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 100 + i, y: 100 + i }, { x: 2, y: 2 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => spatialSystem.insert(entity));

      const limitedQuery: SpatialQuery2D = {
        type: 'radius',
        center: { x: 100, y: 100 },
        radius: 50,
        maxResults: 5
      };

      const result = spatialSystem.query(limitedQuery);

      expect(result.entities.length).toBeLessThanOrEqual(5);
    });

    test('should find nearest neighbors correctly', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'center',
          position: { x: 100, y: 100 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'near',
          position: { x: 105, y: 105 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 105, y: 105 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'far',
          position: { x: 150, y: 150 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: 150, y: 150 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => spatialSystem.insert(entity));

      const nearest = spatialSystem.findNearestNeighbors({ x: 100, y: 100 }, 2, 200);

      expect(nearest).toHaveLength(2);
      expect(nearest[0].id).toBe('center'); // Closest to query point
      expect(nearest[1].id).toBe('near'); // Second closest
    });

    test('should update configuration dynamically', () => {
      const newConfig: Partial<SpatialOptimization2DConfig> = {
        hashGridCellSize: 100,
        enableSpatialHashing: false,
        enableBVH: true
      };

      spatialSystem.updateConfig(newConfig);

      const stats = spatialSystem.getStats();
      expect(stats.config.hashGridCellSize).toBe(100);
      expect(stats.config.enableSpatialHashing).toBe(false);
      expect(stats.config.enableBVH).toBe(true);
    });

    test('should provide comprehensive statistics', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 15; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: i * 20, y: i * 20 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: i * 20, y: i * 20 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => spatialSystem.insert(entity));

      const stats = spatialSystem.getStats();

      expect(stats.entityCount).toBe(15);
      expect(stats.hashGrid).toBeDefined();
      expect(stats.bvh).toBeDefined();
      expect(stats.config).toBeDefined();

      if (stats.hashGrid) {
        expect(stats.hashGrid.totalEntities).toBe(15);
        expect(stats.hashGrid.totalCells).toBeGreaterThan(0);
      }

      if (stats.bvh) {
        expect(stats.bvh.totalEntities).toBe(15);
        expect(stats.bvh.totalNodes).toBeGreaterThan(0);
      }
    });

    test('should clear all entities from both systems', () => {
      const entities: SpatialEntity2D[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `entity-${i}`,
          position: { x: i * 30, y: i * 30 },
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize({ x: i * 30, y: i * 30 }, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => spatialSystem.insert(entity));
      expect(spatialSystem.getStats().entityCount).toBe(10);

      spatialSystem.clear();
      expect(spatialSystem.getStats().entityCount).toBe(0);
    });

    test('should handle entity removal from both systems', () => {
      const entity: SpatialEntity2D = {
        id: 'test-entity',
        position: { x: 100, y: 100 },
        radius: 5,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 10, y: 10 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      spatialSystem.insert(entity);
      expect(spatialSystem.getStats().entityCount).toBe(1);

      spatialSystem.remove('test-entity');
      expect(spatialSystem.getStats().entityCount).toBe(0);
    });

    test('should handle entity updates in both systems', () => {
      const entity: SpatialEntity2D = {
        id: 'moving-entity',
        position: { x: 100, y: 100 },
        radius: 3,
        bounds: AABB2DUtils.fromCenterAndSize({ x: 100, y: 100 }, { x: 6, y: 6 }),
        type: 'ant',
        lastUpdate: Date.now()
      };

      spatialSystem.insert(entity);

      // Update position
      const updatedEntity: SpatialEntity2D = {
        ...entity,
        position: { x: 200, y: 200 },
        bounds: AABB2DUtils.fromCenterAndSize({ x: 200, y: 200 }, { x: 6, y: 6 })
      };

      spatialSystem.update(updatedEntity);

      // Should find entity at new position
      const query: SpatialQuery2D = {
        type: 'radius',
        center: { x: 200, y: 200 },
        radius: 10
      };

      const result = spatialSystem.query(query);
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].id).toBe('moving-entity');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large numbers of entities efficiently', () => {
      const spatialSystem = new SpatialOptimization2D({
        hashGridCellSize: 100,
        enableSpatialHashing: true,
        enableBVH: true
      });

      const entityCount = 2000;
      const entities: SpatialEntity2D[] = [];

      // Generate random entities
      for (let i = 0; i < entityCount; i++) {
        const position = {
          x: Math.random() * 2000,
          y: Math.random() * 2000
        };

        entities.push({
          id: `entity-${i}`,
          position,
          radius: 2 + Math.random() * 3,
          bounds: AABB2DUtils.fromCenterAndSize(position, { x: 6, y: 6 }),
          type: Math.random() > 0.5 ? 'ant' : 'food',
          lastUpdate: Date.now()
        });
      }

      // Insert entities
      const insertStartTime = performance.now();
      entities.forEach(entity => spatialSystem.insert(entity));
      const insertTime = performance.now() - insertStartTime;

      expect(insertTime).toBeLessThan(500); // Should insert quickly
      expect(spatialSystem.getStats().entityCount).toBe(entityCount);

      // Perform multiple queries
      const queryStartTime = performance.now();
      const queryCount = 100;

      for (let i = 0; i < queryCount; i++) {
        const query: SpatialQuery2D = {
          type: 'radius',
          center: {
            x: Math.random() * 2000,
            y: Math.random() * 2000
          },
          radius: 50 + Math.random() * 100
        };

        spatialSystem.query(query);
      }

      const queryTime = performance.now() - queryStartTime;
      const avgQueryTime = queryTime / queryCount;

      expect(avgQueryTime).toBeLessThan(10); // Should query quickly on average
    });

    test('should maintain performance with frequent updates', () => {
      const spatialSystem = new SpatialOptimization2D();
      const entityCount = 500;
      const entities: SpatialEntity2D[] = [];

      // Create initial entities
      for (let i = 0; i < entityCount; i++) {
        const position = {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        };

        entities.push({
          id: `entity-${i}`,
          position,
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize(position, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        });
      }

      entities.forEach(entity => spatialSystem.insert(entity));

      // Perform many updates
      const updateStartTime = performance.now();
      const updateCount = 1000;

      for (let i = 0; i < updateCount; i++) {
        const entityIndex = Math.floor(Math.random() * entityCount);
        const entity = entities[entityIndex];

        // Move entity to new position
        const newPosition = {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        };

        const updatedEntity: SpatialEntity2D = {
          ...entity,
          position: newPosition,
          bounds: AABB2DUtils.fromCenterAndSize(newPosition, { x: 4, y: 4 })
        };

        spatialSystem.update(updatedEntity);
        entities[entityIndex] = updatedEntity;
      }

      const updateTime = performance.now() - updateStartTime;
      const avgUpdateTime = updateTime / updateCount;

      expect(avgUpdateTime).toBeLessThan(5); // Should update quickly on average
    });
  });
});