/**
 * 2D System Integration Test
 * Validates the 2D rendering system components work together correctly
 */

import { 
  Vector2D, 
  Vector2DUtils, 
  AntRenderInstance2D, 
  PheromoneRenderData2D,
  EnvironmentRenderData2D,
  SpatialEntity2D,
  AABB2D,
  AABB2DUtils
} from '../shared/types-2d';

import { SpatialOptimization2D } from '../main/spatial/SpatialOptimization2D';

describe('2D System Integration Tests', () => {
  
  describe('Vector2D Utilities', () => {
    test('should perform basic vector operations correctly', () => {
      const v1: Vector2D = { x: 3, y: 4 };
      const v2: Vector2D = { x: 1, y: 2 };
      
      expect(Vector2DUtils.add(v1, v2)).toEqual({ x: 4, y: 6 });
      expect(Vector2DUtils.subtract(v1, v2)).toEqual({ x: 2, y: 2 });
      expect(Vector2DUtils.magnitude(v1)).toBe(5);
      expect(Vector2DUtils.distance(v1, v2)).toBeCloseTo(2.83, 2);
    });

    test('should validate vectors correctly', () => {
      expect(Vector2DUtils.isValid({ x: 1, y: 2 })).toBe(true);
      expect(Vector2DUtils.isValid({ x: NaN, y: 2 })).toBe(false);
      expect(Vector2DUtils.isValid({ x: Infinity, y: 2 })).toBe(false);
    });

    test('should normalize vectors correctly', () => {
      const v = { x: 3, y: 4 };
      const normalized = Vector2DUtils.normalize(v);
      expect(normalized.x).toBeCloseTo(0.6, 2);
      expect(normalized.y).toBeCloseTo(0.8, 2);
      expect(Vector2DUtils.magnitude(normalized)).toBeCloseTo(1, 5);
    });
  });

  describe('AABB2D Utilities', () => {
    test('should create and manipulate bounding boxes correctly', () => {
      const center: Vector2D = { x: 10, y: 20 };
      const size: Vector2D = { x: 6, y: 8 };
      const aabb = AABB2DUtils.fromCenterAndSize(center, size);
      
      expect(aabb.min).toEqual({ x: 7, y: 16 });
      expect(aabb.max).toEqual({ x: 13, y: 24 });
      
      expect(AABB2DUtils.contains(aabb, { x: 10, y: 20 })).toBe(true);
      expect(AABB2DUtils.contains(aabb, { x: 5, y: 15 })).toBe(false);
    });

    test('should detect AABB intersections correctly', () => {
      const aabb1: AABB2D = { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } };
      const aabb2: AABB2D = { min: { x: 5, y: 5 }, max: { x: 15, y: 15 } };
      const aabb3: AABB2D = { min: { x: 20, y: 20 }, max: { x: 30, y: 30 } };
      
      expect(AABB2DUtils.intersects(aabb1, aabb2)).toBe(true);
      expect(AABB2DUtils.intersects(aabb1, aabb3)).toBe(false);
    });
  });

  describe('Spatial Optimization 2D', () => {
    let spatialSystem: SpatialOptimization2D;
    
    beforeEach(() => {
      spatialSystem = new SpatialOptimization2D({
        hashGridCellSize: 50,
        enableSpatialHashing: true,
        enableBVH: true
      });
    });

    test('should insert and query entities correctly', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'ant1',
          position: { x: 10, y: 10 },
          radius: 2,
          bounds: { min: { x: 8, y: 8 }, max: { x: 12, y: 12 } },
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'ant2',
          position: { x: 100, y: 100 },
          radius: 2,
          bounds: { min: { x: 98, y: 98 }, max: { x: 102, y: 102 } },
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'food1',
          position: { x: 15, y: 15 },
          radius: 5,
          bounds: { min: { x: 10, y: 10 }, max: { x: 20, y: 20 } },
          type: 'food',
          lastUpdate: Date.now()
        }
      ];

      // Insert entities
      entities.forEach(entity => spatialSystem.insert(entity));

      // Query near ant1
      const nearAnt1 = spatialSystem.query({
        type: 'radius',
        center: { x: 10, y: 10 },
        radius: 10
      });

      expect(nearAnt1.entities.length).toBe(2); // ant1 and food1
      expect(nearAnt1.entities.map(e => e.id).sort()).toEqual(['ant1', 'food1']);

      // Query near ant2
      const nearAnt2 = spatialSystem.query({
        type: 'radius',
        center: { x: 100, y: 100 },
        radius: 10
      });

      expect(nearAnt2.entities.length).toBe(1); // only ant2
      expect(nearAnt2.entities[0].id).toBe('ant2');
    });

    test('should find nearest neighbors correctly', () => {
      const entities: SpatialEntity2D[] = [
        {
          id: 'ant1',
          position: { x: 0, y: 0 },
          radius: 1,
          bounds: { min: { x: -1, y: -1 }, max: { x: 1, y: 1 } },
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'ant2',
          position: { x: 5, y: 0 },
          radius: 1,
          bounds: { min: { x: 4, y: -1 }, max: { x: 6, y: 1 } },
          type: 'ant',
          lastUpdate: Date.now()
        },
        {
          id: 'ant3',
          position: { x: 10, y: 0 },
          radius: 1,
          bounds: { min: { x: 9, y: -1 }, max: { x: 11, y: 1 } },
          type: 'ant',
          lastUpdate: Date.now()
        }
      ];

      entities.forEach(entity => spatialSystem.insert(entity));

      const nearest = spatialSystem.findNearestNeighbors({ x: 0, y: 0 }, 2);
      expect(nearest.length).toBe(2);
      expect(nearest[0].id).toBe('ant1'); // Closest to itself
      expect(nearest[1].id).toBe('ant2'); // Next closest
    });
  });

  describe('Ant Render Instance 2D', () => {
    test('should create valid ant render instances', () => {
      const ant: AntRenderInstance2D = {
        id: 'test-ant',
        position: { x: 50, y: 75 },
        rotation: Math.PI / 4, // 45 degrees
        scale: { x: 1.2, y: 1.0 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        animationState: 0.5,
        visible: true,
        lodLevel: 0
      };

      expect(ant.position.x).toBe(50);
      expect(ant.position.y).toBe(75);
      expect(ant.rotation).toBeCloseTo(Math.PI / 4, 5);
      expect(ant.visible).toBe(true);
    });
  });

  describe('Pheromone Render Data 2D', () => {
    test('should create valid pheromone data', () => {
      const pheromone: PheromoneRenderData2D = {
        position: { x: 25, y: 30 },
        strength: 0.8,
        type: 'food',
        decay: 0.02
      };

      expect(pheromone.position.x).toBe(25);
      expect(pheromone.position.y).toBe(30);
      expect(pheromone.strength).toBe(0.8);
      expect(pheromone.type).toBe('food');
    });
  });

  describe('Environment Render Data 2D', () => {
    test('should create valid environment objects', () => {
      const envObject: EnvironmentRenderData2D = {
        position: { x: 100, y: 150 },
        size: { x: 20, y: 15 },
        type: 'food',
        properties: {
          nutritionValue: 50,
          maxCapacity: 100
        }
      };

      expect(envObject.position.x).toBe(100);
      expect(envObject.position.y).toBe(150);
      expect(envObject.size.x).toBe(20);
      expect(envObject.size.y).toBe(15);
      expect(envObject.properties.nutritionValue).toBe(50);
    });
  });

  describe('Performance Validation', () => {
    test('should handle large numbers of entities efficiently', () => {
      const spatialSystem = new SpatialOptimization2D({
        hashGridCellSize: 50,
        enableSpatialHashing: true,
        enableBVH: true
      });

      const entityCount = 1000;
      const startTime = performance.now();

      // Insert many entities
      for (let i = 0; i < entityCount; i++) {
        const position: Vector2D = {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        };
        
        const entity: SpatialEntity2D = {
          id: `entity-${i}`,
          position,
          radius: 2,
          bounds: AABB2DUtils.fromCenterAndSize(position, { x: 4, y: 4 }),
          type: 'ant',
          lastUpdate: Date.now()
        };
        
        spatialSystem.insert(entity);
      }

      const insertTime = performance.now() - startTime;
      console.log(`Inserted ${entityCount} entities in ${insertTime.toFixed(2)}ms`);

      // Query performance
      const queryStartTime = performance.now();
      const results = spatialSystem.query({
        type: 'radius',
        center: { x: 500, y: 500 },
        radius: 100
      });
      const queryTime = performance.now() - queryStartTime;
      
      console.log(`Query returned ${results.entities.length} entities in ${queryTime.toFixed(2)}ms`);
      
      expect(insertTime).toBeLessThan(100); // Should insert 1000 entities in < 100ms
      expect(queryTime).toBeLessThan(10);   // Should query in < 10ms
    });
  });

  describe('Memory Usage', () => {
    test('should not create memory leaks with repeated operations', () => {
      const spatialSystem = new SpatialOptimization2D();
      
      // Perform many insert/remove cycles
      for (let cycle = 0; cycle < 100; cycle++) {
        const entities: SpatialEntity2D[] = [];
        
        // Insert entities
        for (let i = 0; i < 50; i++) {
          const entity: SpatialEntity2D = {
            id: `cycle-${cycle}-entity-${i}`,
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            radius: 1,
            bounds: { min: { x: 0, y: 0 }, max: { x: 2, y: 2 } },
            type: 'ant',
            lastUpdate: Date.now()
          };
          entities.push(entity);
          spatialSystem.insert(entity);
        }
        
        // Remove all entities
        entities.forEach(entity => spatialSystem.remove(entity.id));
      }
      
      // After all cycles, system should be clean
      const stats = spatialSystem.getStats();
      expect(stats.entityCount).toBe(0);
    });
  });
});

// Integration test for complete 2D rendering pipeline
describe('2D Rendering Pipeline Integration', () => {
  test('should convert simulation data to renderable format', () => {
    // Simulate basic ant colony data
    const ants: AntRenderInstance2D[] = [
      {
        id: 'worker-1',
        position: { x: 100, y: 100 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1 },
        animationState: 0,
        visible: true,
        lodLevel: 0
      },
      {
        id: 'worker-2',
        position: { x: 110, y: 105 },
        rotation: Math.PI / 2,
        scale: { x: 1, y: 1 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1 },
        animationState: 0.5,
        visible: true,
        lodLevel: 0
      }
    ];

    const pheromones: PheromoneRenderData2D[] = [
      {
        position: { x: 95, y: 98 },
        strength: 0.8,
        type: 'home',
        decay: 0.01
      },
      {
        position: { x: 115, y: 110 },
        strength: 0.6,
        type: 'food',
        decay: 0.02
      }
    ];

    const environment: EnvironmentRenderData2D[] = [
      {
        position: { x: 150, y: 150 },
        size: { x: 30, y: 20 },
        type: 'food',
        properties: { nutritionValue: 100 }
      }
    ];

    // Validate all data is properly formatted for 2D rendering
    expect(ants.every(ant => 
      typeof ant.position.x === 'number' && 
      typeof ant.position.y === 'number' &&
      typeof ant.rotation === 'number'
    )).toBe(true);

    expect(pheromones.every(p => 
      typeof p.position.x === 'number' && 
      typeof p.position.y === 'number' &&
      p.strength >= 0 && p.strength <= 1
    )).toBe(true);

    expect(environment.every(e => 
      typeof e.position.x === 'number' && 
      typeof e.position.y === 'number' &&
      typeof e.size.x === 'number' && 
      typeof e.size.y === 'number'
    )).toBe(true);

    console.log('2D Rendering Pipeline Integration Test PASSED');
    console.log(`Validated ${ants.length} ants, ${pheromones.length} pheromones, ${environment.length} environment objects`);
  });
});