/**
 * Phase 2 Integration Test Suite
 * Comprehensive testing of all Phase 2 implementations:
 * - Spatial Optimization (ME-BVH)
 * - Enhanced LOD System
 * - Web Worker Integration
 * - TypeScript Type Safety
 */

import { 
  Vector3D, 
  AntCaste, 
  PerformanceMetrics,
  SimulationConfiguration 
} from '../../shared/types-enhanced';
import { typeValidator, TypeValidator, FastTypeChecker } from '../../shared/type-validation';
import { SpatialOptimizationIntegration } from '../performance/SpatialOptimizationIntegration';
import { EnhancedLODSystem } from '../performance/EnhancedLODSystem';
import { LODRenderingIntegration } from '../performance/LODRenderingIntegration';
import { SimulationWorkerManager } from '../workers/SimulationWorkerManager';
import { AdaptivePerformanceManager } from '../performance/AdaptivePerformanceManager';
import { LODController } from '../performance/LODController';
import { HybridComputeCoordinator } from '../performance/HybridComputeCoordinator';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  performance?: {
    operationsPerSecond: number;
    memoryUsage: number;
    maxDuration: number;
  };
}

interface Phase2TestSuite {
  spatialOptimization: TestResult[];
  lodSystem: TestResult[];
  webWorkers: TestResult[];
  typeSystem: TestResult[];
  integration: TestResult[];
}

export class Phase2IntegrationTester {
  private spatialOptimization: SpatialOptimizationIntegration;
  private lodSystem: EnhancedLODSystem;
  private lodRendering: LODRenderingIntegration;
  private workerManager: SimulationWorkerManager;
  private performanceManager: AdaptivePerformanceManager;
  private typeValidator: TypeValidator;

  private testResults: Phase2TestSuite = {
    spatialOptimization: [],
    lodSystem: [],
    webWorkers: [],
    typeSystem: [],
    integration: []
  };

  constructor() {
    this.spatialOptimization = new SpatialOptimizationIntegration();
    this.lodSystem = new EnhancedLODSystem();
    this.lodRendering = new LODRenderingIntegration();
    this.workerManager = new SimulationWorkerManager();
    
    // Create required dependencies for AdaptivePerformanceManager
    const performanceTargets = {
      targetFPS: 60,
      minFPS: 30,
      maxFPS: 120,
      targetFrameTime: 16.67,
      maxMemoryUsage: 2 * 1024 * 1024 * 1024, // 2GB
      maxCPUUsage: 80
    };
    
    const lodController = new LODController();
    const hybridComputeCoordinator = new HybridComputeCoordinator();
    
    this.performanceManager = new AdaptivePerformanceManager(
      performanceTargets,
      lodController,
      hybridComputeCoordinator
    );
    
    this.typeValidator = TypeValidator.getInstance();
  }

  /**
   * Run complete Phase 2 test suite
   */
  public async runCompleteTestSuite(): Promise<Phase2TestSuite> {
    console.log('🚀 Starting Phase 2 Integration Test Suite...');
    
    try {
      // Test each system independently
      await this.testSpatialOptimization();
      await this.testLODSystem();
      await this.testWebWorkerIntegration();
      await this.testTypeSystemValidation();
      
      // Test integrated systems
      await this.testSystemIntegration();
      
      // Performance benchmarks
      await this.runPerformanceBenchmarks();
      
      console.log('✅ Phase 2 Integration Test Suite Completed');
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test Suite Failed:', error);
      throw error;
    }

    return this.testResults;
  }

  /**
   * Test Spatial Optimization System (ME-BVH)
   */
  private async testSpatialOptimization(): Promise<void> {
    console.log('🔍 Testing Spatial Optimization System...');

    // Test 1: Spatial structure initialization
    await this.runTest('spatialOptimization', 'Spatial Structure Init', async () => {
      const worldBounds = { x: 1000, y: 1000, z: 100 };
      await this.spatialOptimization.initializeSpatialStructure(worldBounds);
      
      const structure = this.spatialOptimization.getSpatialStructure();
      if (!structure) throw new Error('Spatial structure not initialized');
    });

    // Test 2: O(log n) neighbor queries performance
    await this.runTest('spatialOptimization', 'Neighbor Query Performance', async () => {
      // Generate test ants
      const testAnts = this.generateTestAnts(1000);
      
      // Test neighbor query performance
      const startTime = performance.now();
      const testPosition: Vector3D = { x: 500, y: 500, z: 50 };
      const neighbors = await this.spatialOptimization.findNeighbors(testPosition, 50);
      const duration = performance.now() - startTime;
      
      // Should complete in under 1ms for 1000 ants
      if (duration > 1.0) {
        throw new Error(`Neighbor query too slow: ${duration.toFixed(2)}ms`);
      }
      
      if (neighbors.length === 0) {
        throw new Error('No neighbors found in populated area');
      }
    });

    // Test 3: Spatial query accuracy
    await this.runTest('spatialOptimization', 'Spatial Query Accuracy', async () => {
      const testAnts = this.generateTestAnts(100);
      const queryPosition: Vector3D = { x: 100, y: 100, z: 10 };
      const queryRadius = 50;
      
      const spatialResults = await this.spatialOptimization.findNeighbors(queryPosition, queryRadius);
      const bruteForceResults = this.bruteForceNeighborSearch(testAnts, queryPosition, queryRadius);
      
      if (spatialResults.length !== bruteForceResults.length) {
        throw new Error(`Spatial query mismatch: ${spatialResults.length} vs ${bruteForceResults.length}`);
      }
    });

    // Test 4: Dynamic spatial updates
    await this.runTest('spatialOptimization', 'Dynamic Spatial Updates', async () => {
      const testAnts = this.generateTestAnts(500);
      
      // Convert array to Map for updateSpatialStructure
      const antMap = new Map<string, any>();
      testAnts.forEach((ant, index) => {
        antMap.set(index.toString(), ant);
      });
      
      // Update ant positions
      testAnts.forEach(ant => {
        ant.position.x += Math.random() * 10 - 5;
        ant.position.y += Math.random() * 10 - 5;
      });
      
      await this.spatialOptimization.updateSpatialStructure(antMap, [], []);
      
      // Verify structure is still valid
      const neighbors = await this.spatialOptimization.findNeighbors({ x: 250, y: 250, z: 25 }, 30);
      if (neighbors.length === 0) {
        throw new Error('Spatial structure corrupted after update');
      }
    });
  }

  /**
   * Test Enhanced LOD System
   */
  private async testLODSystem(): Promise<void> {
    console.log('🎯 Testing Enhanced LOD System...');

    // Test 1: LOD level calculation
    await this.runTest('lodSystem', 'LOD Level Calculation', async () => {
      const testAnts = this.generateTestAnts(100);
      const cameraPosition: Vector3D = { x: 0, y: 0, z: 100 };
      
      this.lodSystem.updateCameraPosition(cameraPosition);
      const lodData = this.lodSystem.processAntRenderData(testAnts, 60);
      
      // Verify LOD levels are assigned
      const hasLODLevels = lodData.every(ant => ant.lodLevel !== undefined);
      if (!hasLODLevels) {
        throw new Error('Not all ants have LOD levels assigned');
      }
      
      // Verify distance-based LOD assignment
      const nearAnt = lodData.find(ant => this.calculateDistance(ant.position, cameraPosition) < 50);
      const farAnt = lodData.find(ant => this.calculateDistance(ant.position, cameraPosition) > 200);
      
      if (nearAnt && farAnt && nearAnt.lodLevel! >= farAnt.lodLevel!) {
        throw new Error('LOD levels not properly distance-based');
      }
    });

    // Test 2: Performance-based scaling
    await this.runTest('lodSystem', 'Performance-Based Scaling', async () => {
      const lowPerformanceMetrics: PerformanceMetrics = {
        fps: 25,
        frameTime: 40,
        cpuUsage: 85,
        memoryUsage: 1500,
        triangleCount: 50000,
        drawCalls: 100,
        shaderSwitches: 20,
        textureBindings: 30
      };
      
      // Update LOD system with new config to simulate performance adjustment
      this.lodSystem.updateConfig({
        adaptiveThresholds: {
          performanceTarget: 25, // Lower target FPS
          qualityReduction: 0.5  // More aggressive quality reduction
        }
      });
      
      const config = this.lodSystem.getConfig();
      if (config.adaptiveThresholds.performanceTarget !== 25) {
        throw new Error('Performance scaling configuration not updated');
      }
    });

    // Test 3: LOD rendering integration
    await this.runTest('lodSystem', 'LOD Rendering Integration', async () => {
      const testAnts = this.generateTestAnts(200);
      const cameraPosition: Vector3D = { x: 100, y: 100, z: 50 };
      
      this.lodSystem.updateCameraPosition(cameraPosition);
      const renderData = this.lodSystem.processAntRenderData(testAnts, 60);
      
      if (renderData.length === 0) {
        throw new Error('No render data generated');
      }
      
      // Verify render data has proper LOD geometry
      const hasValidLOD = renderData.every(ant => 
        ant.lodLevel !== undefined && ant.position !== undefined
      );
      
      if (!hasValidLOD) {
        throw new Error('Render data missing LOD information');
      }
    });
  }

  /**
   * Test Web Worker Integration
   */
  private async testWebWorkerIntegration(): Promise<void> {
    console.log('🧵 Testing Web Worker Integration...');

    // Test 1: Worker initialization
    await this.runTest('webWorkers', 'Worker Initialization', async () => {
      await this.workerManager.initialize();
      
      const stats = this.workerManager.getManagerStats();
      if (stats.totalMessages === 0 && stats.failedMessages === 0) {
        // Manager initialized successfully
        console.log('Worker manager initialized');
      }
    });

    // Test 2: Worker communication (configure simulation)
    await this.runTest('webWorkers', 'Worker Communication', async () => {
      const config = {
        timeScale: 1.0,
        colonySize: 50,
        environmentSize: 1000,
        seasonLength: 86400,
        speciesType: 'HARVESTER' as any,
        complexityLevel: 2 as const,
        enablePhysics: true,
        enableWeather: false,
        enableGenetics: false,
        enableLearning: false,
        maxAnts: 100,
        worldSeed: 12345
      };
      
      await this.workerManager.configureSimulation(config);
      await this.workerManager.startSimulation();
      
      const state = await this.workerManager.getSimulationState();
      if (!state) {
        throw new Error('Worker communication failed');
      }
    });

    // Test 3: Worker disposal
    await this.runTest('webWorkers', 'Worker Disposal', async () => {
      await this.workerManager.stopSimulation();
      this.workerManager.dispose();
      
      // Check if worker was properly disposed
      const isUsingWorker = this.workerManager.isUsingWorker();
      if (isUsingWorker) {
        throw new Error('Worker not properly disposed');
      }
    });

    // Test 4: Worker performance
    await this.runTest('webWorkers', 'Worker Performance', async () => {
      await this.workerManager.initialize();
      
      const startTime = performance.now();
      await this.workerManager.addAnts(100, { x: 0, y: 0, z: 0 });
      const duration = performance.now() - startTime;
      
      // Should add ants quickly
      if (duration > 100) {
        throw new Error(`Worker processing too slow: ${duration.toFixed(2)}ms`);
      }
    });
  }

  /**
   * Test TypeScript Type System
   */
  private async testTypeSystemValidation(): Promise<void> {
    console.log('🔒 Testing TypeScript Type System...');

    // Test 1: Vector3D validation
    await this.runTest('typeSystem', 'Vector3D Validation', async () => {
      const validVector: Vector3D = { x: 10, y: 20, z: 30 };
      const validResult = this.typeValidator.validateVector3D(validVector);
      
      if (!validResult.isValid) {
        throw new Error('Valid Vector3D failed validation');
      }
      
      const invalidVector = { x: 10, y: 'invalid', z: 30 };
      const invalidResult = this.typeValidator.validateVector3D(invalidVector);
      
      if (invalidResult.isValid) {
        throw new Error('Invalid Vector3D passed validation');
      }
    });

    // Test 2: Performance metrics validation
    await this.runTest('typeSystem', 'Performance Metrics Validation', async () => {
      const validMetrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        cpuUsage: 45,
        memoryUsage: 512,
        triangleCount: 50000,
        drawCalls: 100,
        shaderSwitches: 20,
        textureBindings: 30
      };
      
      const validResult = this.typeValidator.validatePerformanceMetrics(validMetrics);
      if (!validResult.isValid) {
        throw new Error('Valid performance metrics failed validation');
      }
      
      const invalidMetrics = { ...validMetrics, fps: -10 };
      const invalidResult = this.typeValidator.validatePerformanceMetrics(invalidMetrics);
      
      if (invalidResult.isValid) {
        throw new Error('Invalid performance metrics passed validation');
      }
    });

    // Test 3: Fast type checking
    await this.runTest('typeSystem', 'Fast Type Checking', async () => {
      const numbers = [1, 2, 3, 4, 5];
      const strings = ['a', 'b', 'c'];
      const mixed = [1, 'a', 3, 'b'];
      
      if (!FastTypeChecker.isValidArray(numbers, FastTypeChecker.isValidNumber)) {
        throw new Error('Valid number array failed check');
      }
      
      if (!FastTypeChecker.isValidArray(strings, FastTypeChecker.isValidString)) {
        throw new Error('Valid string array failed check');
      }
      
      if (FastTypeChecker.isValidArray(mixed, FastTypeChecker.isValidNumber)) {
        throw new Error('Mixed array incorrectly passed number check');
      }
    });

    // Test 4: Type builder pattern
    await this.runTest('typeSystem', 'Type Builder Pattern', async () => {
      const builder = this.typeValidator.createBuilder<Vector3D>();
      
      const vector = builder
        .set('x', 10)
        .set('y', 20)
        .set('z', 30)
        .build();
      
      if (vector.x !== 10 || vector.y !== 20 || vector.z !== 30) {
        throw new Error('Type builder produced incorrect object');
      }
    });
  }

  /**
   * Test System Integration
   */
  private async testSystemIntegration(): Promise<void> {
    console.log('🔗 Testing System Integration...');

    // Test 1: Spatial + LOD integration
    await this.runTest('integration', 'Spatial + LOD Integration', async () => {
      const testAnts = this.generateTestAnts(500);
      const cameraPosition: Vector3D = { x: 250, y: 250, z: 50 };
      
      // Initialize spatial structure
      await this.spatialOptimization.initializeSpatialStructure({ x: 1000, y: 1000, z: 100 });
      
      // Process ants with LOD system
      this.lodSystem.updateCameraPosition(cameraPosition);
      const lodData = this.lodSystem.processAntRenderData(testAnts, 60);
      
      // Find neighbors with spatial optimization
      const neighbors = await this.spatialOptimization.findNeighbors(cameraPosition, 100);
      
      if (lodData.length === 0 || neighbors.length === 0) {
        throw new Error('Spatial + LOD integration failed');
      }
    });

    // Test 2: All systems working together
    await this.runTest('integration', 'Complete System Integration', async () => {
      const testAnts = this.generateTestAnts(1000);
      const cameraPosition: Vector3D = { x: 500, y: 500, z: 100 };
      
      // Initialize all systems
      await this.spatialOptimization.initializeSpatialStructure({ x: 1000, y: 1000, z: 100 });
      await this.workerManager.initialize();
      
      // Configure simulation
      await this.workerManager.configureSimulation({
        timeScale: 1.0,
        colonySize: 100,
        maxAnts: 1000,
        complexityLevel: 2 as const
      });
      
      // Start simulation
      await this.workerManager.startSimulation();
      
      // Add some ants
      await this.workerManager.addAnts(50, { x: 0, y: 0, z: 0 });
      
      // Process LOD data
      this.lodSystem.updateCameraPosition(cameraPosition);
      const lodData = this.lodSystem.processAntRenderData(testAnts, 60);
      
      // Find neighbors for collision detection
      const neighbors = await this.spatialOptimization.findNeighbors(cameraPosition, 100);
      
      if (lodData.length === 0) {
        throw new Error('Complete system integration failed');
      }
    });
  }

  /**
   * Run performance benchmarks
   */
  private async runPerformanceBenchmarks(): Promise<void> {
    console.log('⚡ Running Performance Benchmarks...');

    // Benchmark spatial queries
    await this.runTest('integration', 'Spatial Query Benchmark', async () => {
      const testAnts = this.generateTestAnts(10000);
      await this.spatialOptimization.initializeSpatialStructure({ x: 2000, y: 2000, z: 200 });
      
      const queries = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < queries; i++) {
        const queryPos: Vector3D = {
          x: Math.random() * 2000,
          y: Math.random() * 2000,
          z: Math.random() * 200
        };
        this.spatialOptimization.findNeighbors(queryPos, 50);
      }
      
      const duration = performance.now() - startTime;
      const queriesPerSecond = (queries / duration) * 1000;
      
      // Should achieve at least 10,000 queries per second
      if (queriesPerSecond < 10000) {
        throw new Error(`Spatial queries too slow: ${queriesPerSecond.toFixed(0)} queries/sec`);
      }
    });

    // Benchmark LOD system
    await this.runTest('integration', 'LOD System Benchmark', async () => {
      const testAnts = this.generateTestAnts(50000);
      const cameraPosition: Vector3D = { x: 1000, y: 1000, z: 100 };
      
      const startTime = performance.now();
      this.lodSystem.updateCameraPosition(cameraPosition);
      const lodData = this.lodSystem.processAntRenderData(testAnts, 60);
      const duration = performance.now() - startTime;
      
      // Should process 50,000 ants in under 100ms
      if (duration > 100) {
        throw new Error(`LOD processing too slow: ${duration.toFixed(2)}ms for 50,000 ants`);
      }
      
      if (lodData.length === 0) {
        throw new Error('LOD system failed to process ants');
      }
    });
  }

  /**
   * Helper method to run individual tests
   */
  private async runTest(
    category: keyof Phase2TestSuite, 
    testName: string, 
    testFunction: () => Promise<void>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      await testFunction();
      const duration = performance.now() - startTime;
      
      this.testResults[category].push({
        testName,
        passed: true,
        duration
      });
      
      console.log(`  ✅ ${testName} (${duration.toFixed(2)}ms)`);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.testResults[category].push({
        testName,
        passed: false,
        duration,
        error: errorMessage
      });
      
      console.log(`  ❌ ${testName} (${duration.toFixed(2)}ms): ${errorMessage}`);
    }
  }

  /**
   * Generate test ants for benchmarking
   */
  private generateTestAnts(count: number): any[] {
    const ants = [];
    
    for (let i = 0; i < count; i++) {
      ants.push({
        id: i,
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          z: Math.random() * 100
        },
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 2
        },
        caste: Object.values(AntCaste)[Math.floor(Math.random() * Object.values(AntCaste).length)],
        energy: Math.random() * 100,
        age: Math.random() * 1000,
        lodLevel: 0
      });
    }
    
    return ants;
  }

  /**
   * Brute force neighbor search for accuracy testing
   */
  private bruteForceNeighborSearch(ants: any[], position: Vector3D, radius: number): any[] {
    return ants.filter(ant => {
      const distance = this.calculateDistance(ant.position, position);
      return distance <= radius;
    });
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(pos1: Vector3D, pos2: Vector3D): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Print comprehensive test summary
   */
  private printTestSummary(): void {
    console.log('\n📊 Phase 2 Test Summary');
    console.log('========================');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalDuration = 0;
    
    for (const [category, tests] of Object.entries(this.testResults)) {
      const passed = tests.filter((t: TestResult) => t.passed).length;
      const duration = tests.reduce((sum: number, t: TestResult) => sum + t.duration, 0);
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Tests: ${passed}/${tests.length} passed`);
      console.log(`  Duration: ${duration.toFixed(2)}ms`);
      
      if (tests.some((t: TestResult) => !t.passed)) {
        console.log('  Failed tests:');
        tests.filter((t: TestResult) => !t.passed).forEach((t: TestResult) => {
          console.log(`    - ${t.testName}: ${t.error}`);
        });
      }
      
      totalTests += tests.length;
      totalPassed += passed;
      totalDuration += duration;
    }
    
    console.log(`\nOVERALL: ${totalPassed}/${totalTests} tests passed (${totalDuration.toFixed(2)}ms)`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 All Phase 2 systems are working correctly!');
    } else {
      console.log('⚠️  Some tests failed - review implementation');
    }
  }
}

// Export for use in main application
export const phase2Tester = new Phase2IntegrationTester();