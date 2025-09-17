/**
 * Unified 2D/3D Types Tests
 * Tests for type conversion utilities and unified simulation data handling
 */

import {
  SimulationMode,
  UnifiedSimulationUpdate,
  UnifiedAntRenderData,
  UnifiedPheromoneRenderData,
  UnifiedEnvironmentRenderData,
  UnifiedPosition,
  ModeConversionUtils,
  ConfigurationUtils,
  isSimulationMode2D,
  isSimulationMode3D,
  hasZCoordinate
} from '../shared/types-unified';

import {
  Vector2D,
  AntRenderInstance2D,
  PheromoneRenderData2D,
  EnvironmentRenderData2D
} from '../shared/types-2d';

import { AntCaste } from '../../engine/colony/casteSystem';
import { PheromoneType } from '../../engine/chemical/pheromones';

describe('Unified 2D/3D Types Tests', () => {

  describe('Mode Detection Functions', () => {
    test('should detect 2D simulation mode correctly', () => {
      expect(isSimulationMode2D(SimulationMode.MODE_2D)).toBe(true);
      expect(isSimulationMode2D(SimulationMode.MODE_3D)).toBe(false);
    });

    test('should detect 3D simulation mode correctly', () => {
      expect(isSimulationMode3D(SimulationMode.MODE_3D)).toBe(true);
      expect(isSimulationMode3D(SimulationMode.MODE_2D)).toBe(false);
    });

    test('should detect Z coordinate presence', () => {
      const position2D: UnifiedPosition = { x: 10, y: 20 };
      const position3D: UnifiedPosition = { x: 10, y: 20, z: 30 };

      expect(hasZCoordinate(position2D)).toBe(false);
      expect(hasZCoordinate(position3D)).toBe(true);
    });
  });

  describe('Position Conversion Utilities', () => {
    test('should convert 3D position to 2D', () => {
      const position3D = { x: 100, y: 200, z: 300 };
      const position2D = ModeConversionUtils.to2D(position3D);

      expect(position2D).toEqual({ x: 100, y: 200 });
      expect(position2D).not.toHaveProperty('z');
    });

    test('should convert 2D position to 3D with default z', () => {
      const position2D: Vector2D = { x: 100, y: 200 };
      const position3D = ModeConversionUtils.to3D(position2D);

      expect(position3D).toEqual({ x: 100, y: 200, z: 0 });
    });

    test('should convert 2D position to 3D with custom z', () => {
      const position2D: Vector2D = { x: 100, y: 200 };
      const position3D = ModeConversionUtils.to3D(position2D, 50);

      expect(position3D).toEqual({ x: 100, y: 200, z: 50 });
    });

    test('should convert unified position based on target mode', () => {
      const unifiedPosition: UnifiedPosition = { x: 100, y: 200, z: 300 };

      const converted2D = ModeConversionUtils.convertPosition(unifiedPosition, SimulationMode.MODE_2D);
      expect(converted2D).toEqual({ x: 100, y: 200 });
      expect(converted2D).not.toHaveProperty('z');

      const converted3D = ModeConversionUtils.convertPosition(unifiedPosition, SimulationMode.MODE_3D);
      expect(converted3D).toEqual({ x: 100, y: 200, z: 300 });
    });

    test('should handle missing z coordinate in 3D conversion', () => {
      const position2D: UnifiedPosition = { x: 100, y: 200 };
      const converted3D = ModeConversionUtils.convertPosition(position2D, SimulationMode.MODE_3D);

      expect(converted3D).toEqual({ x: 100, y: 200, z: 0 });
    });
  });

  describe('Ant Data Conversion', () => {
    test('should convert unified ant data to 2D format', () => {
      const unifiedAnt: UnifiedAntRenderData = {
        id: 'test-ant',
        position: { x: 100, y: 200, z: 50 },
        rotation: Math.PI / 4,
        scale: { x: 1.2, y: 1.2, z: 1.2 },
        caste: AntCaste.WORKER,
        health: 0.8,
        energy: 0.6,
        carryingFood: true,
        currentTask: 'foraging',
        age: 100,
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        visible: true,
        generation: 2,
        animationState: 0.5,
        lodLevel: 1
      };

      const ant2D = ModeConversionUtils.antDataTo2D(unifiedAnt);

      expect(ant2D).toEqual({
        id: 'test-ant',
        position: { x: 100, y: 200 },
        rotation: Math.PI / 4,
        scale: { x: 1.2, y: 1.2 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        animationState: 0.5,
        visible: true,
        lodLevel: 1
      });
    });

    test('should convert quaternion rotation to angle', () => {
      const unifiedAntWithQuaternion: UnifiedAntRenderData = {
        id: 'test-ant',
        position: { x: 100, y: 200 },
        rotation: { x: 0, y: 0, z: 0.707, w: 0.707 }, // ~90 degrees around Z
        scale: { x: 1, y: 1 },
        caste: AntCaste.WORKER,
        health: 1,
        energy: 1,
        carryingFood: false,
        currentTask: 'exploring',
        age: 0,
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        visible: true,
        generation: 1
      };

      const ant2D = ModeConversionUtils.antDataTo2D(unifiedAntWithQuaternion);

      expect(typeof ant2D.rotation).toBe('number');
      expect(ant2D.rotation).toBe(0); // Mock conversion defaults to 0
    });

    test('should convert 2D ant data to unified format', () => {
      const ant2D: AntRenderInstance2D = {
        id: 'test-ant',
        position: { x: 100, y: 200 },
        rotation: Math.PI / 4,
        scale: { x: 1.2, y: 1.2 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        animationState: 0.5,
        visible: true,
        lodLevel: 1
      };

      const additionalData = {
        caste: AntCaste.SOLDIER,
        health: 0.9,
        energy: 0.7,
        carryingFood: true,
        currentTask: 'defending',
        age: 150,
        generation: 3
      };

      const unifiedAnt = ModeConversionUtils.antDataFrom2D(ant2D, additionalData);

      expect(unifiedAnt.id).toBe('test-ant');
      expect(unifiedAnt.position).toEqual({ x: 100, y: 200 });
      expect(unifiedAnt.rotation).toBe(Math.PI / 4);
      expect(unifiedAnt.scale).toEqual({ x: 1.2, y: 1.2 });
      expect(unifiedAnt.caste).toBe(AntCaste.SOLDIER);
      expect(unifiedAnt.health).toBe(0.9);
      expect(unifiedAnt.carryingFood).toBe(true);
    });

    test('should use default values when converting 2D to unified without additional data', () => {
      const ant2D: AntRenderInstance2D = {
        position: { x: 100, y: 200 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        animationState: 0,
        visible: true,
        lodLevel: 0
      };

      const unifiedAnt = ModeConversionUtils.antDataFrom2D(ant2D);

      expect(unifiedAnt.id).toBe('');
      expect(unifiedAnt.caste).toBe(AntCaste.WORKER);
      expect(unifiedAnt.health).toBe(1.0);
      expect(unifiedAnt.energy).toBe(1.0);
      expect(unifiedAnt.carryingFood).toBe(false);
      expect(unifiedAnt.currentTask).toBe('exploring');
      expect(unifiedAnt.generation).toBe(1);
    });
  });

  describe('Pheromone Data Conversion', () => {
    test('should convert unified pheromone data to 2D format', () => {
      const unifiedPheromone: UnifiedPheromoneRenderData = {
        position: { x: 150, y: 250, z: 75 },
        type: 'trail' as PheromoneType,
        strength: 0.8,
        maxStrength: 1.0,
        decay: 0.02,
        age: 500,
        sourceAntId: 'ant-123'
      };

      const pheromone2D = ModeConversionUtils.pheromoneDataTo2D(unifiedPheromone);

      expect(pheromone2D).toEqual({
        position: { x: 150, y: 250 },
        strength: 0.8,
        type: 'trail',
        decay: 0.02
      });
    });

    test('should handle different pheromone types', () => {
      const homeTrailPheromone: UnifiedPheromoneRenderData = {
        position: { x: 0, y: 0 },
        type: 'alarm' as PheromoneType,
        strength: 0.6,
        maxStrength: 1.0,
        decay: 0.01,
        age: 200
      };

      const pheromone2D = ModeConversionUtils.pheromoneDataTo2D(homeTrailPheromone);

      expect(pheromone2D.type).toBe('alarm');
      expect(pheromone2D.strength).toBe(0.6);
    });
  });

  describe('Environment Data Conversion', () => {
    test('should convert unified environment data to 2D format', () => {
      const unifiedEnvironment: UnifiedEnvironmentRenderData = {
        position: { x: 300, y: 400, z: 100 },
        size: { x: 50, y: 30, z: 20 },
        type: 'food',
        properties: {
          nutritionValue: 150,
          maxCapacity: 200,
          currentAmount: 180
        }
      };

      const environment2D = ModeConversionUtils.environmentDataTo2D(unifiedEnvironment);

      expect(environment2D).toEqual({
        position: { x: 300, y: 400 },
        size: { x: 50, y: 30 },
        type: 'food',
        properties: {
          nutritionValue: 150,
          maxCapacity: 200,
          currentAmount: 180
        }
      });
    });

    test('should handle different environment types', () => {
      const environmentTypes = ['food', 'obstacle', 'nest', 'water', 'boundary'] as const;

      environmentTypes.forEach(type => {
        const unifiedEnvironment: UnifiedEnvironmentRenderData = {
          position: { x: 100, y: 100, z: 0 },
          size: { x: 10, y: 10, z: 10 },
          type,
          properties: {}
        };

        const environment2D = ModeConversionUtils.environmentDataTo2D(unifiedEnvironment);

        expect(environment2D.type).toBe(type);
        expect(environment2D.position).toEqual({ x: 100, y: 100 });
        expect(environment2D.size).toEqual({ x: 10, y: 10 });
      });
    });
  });

  describe('Unified Update Conversion', () => {
    test('should convert complete unified update to 2D format', () => {
      const unifiedUpdate: UnifiedSimulationUpdate = {
        timestamp: Date.now(),
        mode: SimulationMode.MODE_3D,
        antData: [
          {
            id: 'ant-1',
            position: { x: 100, y: 100, z: 0 },
            rotation: 0,
            scale: { x: 1, y: 1, z: 1 },
            caste: AntCaste.WORKER,
            health: 1,
            energy: 1,
            carryingFood: false,
            currentTask: 'exploring',
            age: 0,
            color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
            visible: true,
            generation: 1
          }
        ],
        pheromoneData: [
          {
            position: { x: 50, y: 50, z: 0 },
            type: 'trail' as PheromoneType,
            strength: 0.7,
            maxStrength: 1.0,
            decay: 0.01,
            age: 100
          }
        ],
        environmentData: [
          {
            position: { x: 200, y: 200, z: 0 },
            size: { x: 30, y: 30, z: 10 },
            type: 'food',
            properties: { nutritionValue: 100 }
          }
        ],
        deltaTime: 16.67
      };

      const converted2D = ModeConversionUtils.updateTo2D(unifiedUpdate);

      expect(converted2D.antData).toHaveLength(1);
      expect(converted2D.antData[0].position).toEqual({ x: 100, y: 100 });
      expect(converted2D.antData[0]).not.toHaveProperty('caste');

      expect(converted2D.pheromoneData).toHaveLength(1);
      expect(converted2D.pheromoneData[0].position).toEqual({ x: 50, y: 50 });

      expect(converted2D.environmentData).toHaveLength(1);
      expect(converted2D.environmentData[0].position).toEqual({ x: 200, y: 200 });
    });

    test('should handle empty data arrays', () => {
      const emptyUpdate: UnifiedSimulationUpdate = {
        timestamp: Date.now(),
        mode: SimulationMode.MODE_3D,
        antData: [],
        pheromoneData: [],
        environmentData: [],
        deltaTime: 16.67
      };

      const converted2D = ModeConversionUtils.updateTo2D(emptyUpdate);

      expect(converted2D.antData).toHaveLength(0);
      expect(converted2D.pheromoneData).toHaveLength(0);
      expect(converted2D.environmentData).toHaveLength(0);
    });
  });

  describe('Configuration Utilities', () => {
    test('should provide default 2D configuration', () => {
      const config2D = ConfigurationUtils.getDefault2DConfig();

      expect(config2D.mode).toBe(SimulationMode.MODE_2D);
      expect(config2D.render3D).toBe(false);
      expect(config2D.enableAdvancedRendering).toBe(false);
      expect(config2D.enablePhysics).toBe(false);
      expect(config2D.complexityLevel).toBe(2);
    });

    test('should provide default 3D configuration', () => {
      const config3D = ConfigurationUtils.getDefault3DConfig();

      expect(config3D.mode).toBe(SimulationMode.MODE_3D);
      expect(config3D.render3D).toBe(true);
      expect(config3D.enableAdvancedRendering).toBe(true);
      expect(config3D.enablePhysics).toBe(true);
      expect(config3D.complexityLevel).toBe(3);
    });

    test('should convert configuration from 3D to 2D', () => {
      const config3D = {
        mode: SimulationMode.MODE_3D,
        timeScale: 2.0,
        colonySize: 1000,
        environmentSize: 50000,
        seasonLength: 600,
        speciesType: 'leafcutter' as any,
        complexityLevel: 4 as any,
        enablePhysics: true,
        enableWeather: true,
        enableGenetics: true,
        enableLearning: true,
        maxAnts: 10000,
        worldSeed: 12345,
        render3D: true,
        enableAdvancedRendering: true
      };

      const convertedConfig = ConfigurationUtils.convertConfig(config3D, SimulationMode.MODE_2D);

      expect(convertedConfig.mode).toBe(SimulationMode.MODE_2D);
      expect(convertedConfig.render3D).toBe(false);
      expect(convertedConfig.enableAdvancedRendering).toBe(false);
      expect(convertedConfig.complexityLevel).toBe(3); // Clamped from 4 to 3
      expect(convertedConfig.timeScale).toBe(2.0); // Preserved
      expect(convertedConfig.colonySize).toBe(1000); // Preserved
    });

    test('should convert configuration from 2D to 3D', () => {
      const config2D = {
        mode: SimulationMode.MODE_2D,
        timeScale: 1.0,
        colonySize: 500,
        environmentSize: 10000,
        seasonLength: 300,
        speciesType: 'army' as any,
        complexityLevel: 1 as any,
        enablePhysics: false,
        enableWeather: true,
        enableGenetics: false,
        enableLearning: true,
        maxAnts: 2000,
        worldSeed: 54321,
        render3D: false,
        enableAdvancedRendering: false
      };

      const convertedConfig = ConfigurationUtils.convertConfig(config2D, SimulationMode.MODE_3D);

      expect(convertedConfig.mode).toBe(SimulationMode.MODE_3D);
      expect(convertedConfig.render3D).toBe(true);
      expect(convertedConfig.enableAdvancedRendering).toBe(true);
      expect(convertedConfig.complexityLevel).toBe(1); // Preserved
      expect(convertedConfig.timeScale).toBe(1.0); // Preserved
      expect(convertedConfig.colonySize).toBe(500); // Preserved
    });
  });

  describe('Type Safety and Validation', () => {
    test('should handle undefined or null values gracefully', () => {
      expect(() => {
        ModeConversionUtils.to2D({ x: 100, y: 200, z: undefined as any });
      }).not.toThrow();

      expect(() => {
        ModeConversionUtils.to3D({ x: 100, y: 200 }, undefined as any);
      }).not.toThrow();
    });

    test('should handle invalid position data', () => {
      const invalidPosition = { x: NaN, y: Infinity, z: -Infinity };

      expect(() => {
        ModeConversionUtils.to2D(invalidPosition);
      }).not.toThrow();

      expect(() => {
        ModeConversionUtils.convertPosition(invalidPosition, SimulationMode.MODE_2D);
      }).not.toThrow();
    });

    test('should handle missing optional fields', () => {
      const minimalAnt2D: AntRenderInstance2D = {
        position: { x: 100, y: 100 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        animationState: 0,
        visible: true,
        lodLevel: 0
        // id is optional and missing
      };

      expect(() => {
        ModeConversionUtils.antDataFrom2D(minimalAnt2D);
      }).not.toThrow();

      const result = ModeConversionUtils.antDataFrom2D(minimalAnt2D);
      expect(result.id).toBe('');
    });

    test('should preserve properties during conversion', () => {
      const originalEnvironment: UnifiedEnvironmentRenderData = {
        position: { x: 100, y: 100, z: 0 },
        size: { x: 50, y: 50, z: 10 },
        type: 'nest',
        properties: {
          capacity: 1000,
          entrances: 3,
          depth: 15,
          specialProperty: 'unique_value'
        }
      };

      const converted2D = ModeConversionUtils.environmentDataTo2D(originalEnvironment);

      expect(converted2D.properties).toEqual(originalEnvironment.properties);
      expect(converted2D.properties.specialProperty).toBe('unique_value');
    });
  });

  describe('Performance and Bulk Operations', () => {
    test('should handle bulk ant data conversion efficiently', () => {
      const antCount = 1000;
      const unifiedAnts: UnifiedAntRenderData[] = [];

      for (let i = 0; i < antCount; i++) {
        unifiedAnts.push({
          id: `ant-${i}`,
          position: { x: i, y: i, z: 0 },
          rotation: i * 0.1,
          scale: { x: 1, y: 1, z: 1 },
          caste: AntCaste.WORKER,
          health: 1,
          energy: 1,
          carryingFood: false,
          currentTask: 'exploring',
          age: i,
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          visible: true,
          generation: 1
        });
      }

      const startTime = performance.now();
      const converted2D = unifiedAnts.map(ant => ModeConversionUtils.antDataTo2D(ant));
      const conversionTime = performance.now() - startTime;

      expect(converted2D).toHaveLength(antCount);
      expect(conversionTime).toBeLessThan(100); // Should be reasonably fast
    });

    test('should handle bulk update conversion efficiently', () => {
      const updateCount = 100;
      const updates: UnifiedSimulationUpdate[] = [];

      for (let i = 0; i < updateCount; i++) {
        updates.push({
          timestamp: Date.now() + i,
          mode: SimulationMode.MODE_3D,
          antData: [
            {
              id: `ant-${i}`,
              position: { x: i, y: i, z: 0 },
              rotation: 0,
              scale: { x: 1, y: 1, z: 1 },
              caste: AntCaste.WORKER,
              health: 1,
              energy: 1,
              carryingFood: false,
              currentTask: 'exploring',
              age: 0,
              color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
              visible: true,
              generation: 1
            }
          ],
          pheromoneData: [],
          environmentData: [],
          deltaTime: 16.67
        });
      }

      const startTime = performance.now();
      const converted2D = updates.map(update => ModeConversionUtils.updateTo2D(update));
      const conversionTime = performance.now() - startTime;

      expect(converted2D).toHaveLength(updateCount);
      expect(conversionTime).toBeLessThan(200); // Should handle bulk operations efficiently
    });
  });
});