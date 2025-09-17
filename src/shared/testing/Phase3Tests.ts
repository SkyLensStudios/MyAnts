/**
 * Simplified Phase 3 Integration Test
 * Tests core Phase 3 architectural improvements
 */

import { ecsManager, initializeECS, createECSSimulation } from '../ecs/ECSManager';
import { configurationManager } from '../config/ConfigurationManager';
import { dataCompressionSystem } from '../compression/DataCompressionSystem';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
}

/**
 * Run simplified Phase 3 integration tests
 */
export async function runPhase3Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  console.log('🧪 Running Phase 3 Integration Tests...');

  // Test 1: ECS Initialization
  const ecsTest = await testECSInitialization();
  results.push(ecsTest);

  // Test 2: Configuration System
  const configTest = await testConfigurationSystem();
  results.push(configTest);

  // Test 3: Data Compression
  const compressionTest = await testDataCompression();
  results.push(compressionTest);

  // Test 4: Full Integration
  const integrationTest = await testFullIntegration();
  results.push(integrationTest);

  // Print results
  console.log('\n📊 Test Results:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}: ${result.details} (${result.duration.toFixed(2)}ms)`);
  });

  const allPassed = results.every(r => r.passed);
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'PASSED' : 'FAILED'}`);

  return results;
}

async function testECSInitialization(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    await initializeECS();
    const world = ecsManager.getWorld();
    const systemCount = world.getSystemCount();
    const entityCount = world.entityManager.getEntityCount();

    const passed = systemCount > 0;
    
    return {
      testName: 'ECS Initialization',
      passed,
      duration: performance.now() - startTime,
      details: `${systemCount} systems initialized, ${entityCount} entities`
    };
  } catch (error) {
    return {
      testName: 'ECS Initialization',
      passed: false,
      duration: performance.now() - startTime,
      details: `Failed: ${error}`
    };
  }
}

async function testConfigurationSystem(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    const defaultConfig = configurationManager.getConfiguration();
    const presetResult = configurationManager.loadPreset('balanced');
    const exportedConfig = configurationManager.exportConfiguration();

    const passed = presetResult.isValid && exportedConfig.length > 0;
    
    return {
      testName: 'Configuration System',
      passed,
      duration: performance.now() - startTime,
      details: `Preset: ${presetResult.isValid}, Export: ${exportedConfig.length} chars`
    };
  } catch (error) {
    return {
      testName: 'Configuration System',
      passed: false,
      duration: performance.now() - startTime,
      details: `Failed: ${error}`
    };
  }
}

async function testDataCompression(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    await dataCompressionSystem.initialize();
    
    // Create test data
    const testData = {
      ants: {
        positions: new Float32Array([1, 2, 3, 4, 5, 6]),
        states: new Float32Array([10, 20, 30, 40, 50, 60]),
        count: 2
      },
      environment: {
        pheromones: new Float32Array([0.1, 0.2, 0.3]),
        temperature: new Float32Array([20, 21, 22]),
        humidity: new Float32Array([0.5, 0.6, 0.7]),
        dimensions: { width: 100, height: 100 }
      },
      ai: { 
        memory: new Float32Array([1, 2, 3]),
        decisions: new Float32Array([0.1, 0.2])
      },
      physics: { 
        forces: new Float32Array([0.1, 0.2]),
        velocities: new Float32Array([1.0, 2.0])
      },
      metadata: { simulationTime: Date.now(), frameCount: 1 }
    };

    const compressed = await dataCompressionSystem.compressSimulationState(testData);
    const decompressed = await dataCompressionSystem.decompressSimulationState(compressed);
    
    const compressionRatio = compressed.metadata.originalSize / compressed.metadata.compressedSize;
    const dataValid = decompressed.ants && decompressed.ants.count === testData.ants.count;
    
    const passed = compressionRatio > 1 && dataValid;
    
    return {
      testName: 'Data Compression',
      passed,
      duration: performance.now() - startTime,
      details: `Ratio: ${compressionRatio.toFixed(2)}:1, Valid: ${dataValid}`
    };
  } catch (error) {
    return {
      testName: 'Data Compression',
      passed: false,
      duration: performance.now() - startTime,
      details: `Failed: ${error}`
    };
  }
}

async function testFullIntegration(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    // Create simulation
    const simulation = await createECSSimulation();
    
    // Run a few updates
    for (let i = 0; i < 5; i++) {
      simulation.manager.update();
    }
    
    // Get simulation stats
    const stats = simulation.manager.getSimulationStats();
    const antCount = stats.entities.ants;
    
    // Test serialization
    const serialized = await simulation.manager.serializeState();
    
    // Clear and restore
    simulation.manager.clearSimulation();
    await simulation.manager.deserializeState(serialized);
    
    const restoredStats = simulation.manager.getSimulationStats();
    
    const passed = antCount > 0 && 
                   serialized && 
                   restoredStats.entities.total > 0;
    
    return {
      testName: 'Full Integration',
      passed,
      duration: performance.now() - startTime,
      details: `Ants: ${antCount}, Serialized: ${!!serialized}, Restored: ${restoredStats.entities.total > 0}`
    };
  } catch (error) {
    return {
      testName: 'Full Integration',
      passed: false,
      duration: performance.now() - startTime,
      details: `Failed: ${error}`
    };
  }
}

export default { runPhase3Tests };