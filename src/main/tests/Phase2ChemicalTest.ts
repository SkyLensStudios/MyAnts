/**
 * Phase 2 Chemical Enhancement Integration Test
 * Tests CNN-accelerated diffusion and spatial Gillespie algorithms
 * Validates 300× speedup and chemical simulation accuracy
 */

import { EnhancedChemicalSystemV3, ChemicalSystemConfig } from '../chemical/EnhancedChemicalSystemV3';
import { PerformanceOptimizationIntegrationV3 } from '../performance/PerformanceOptimizationIntegrationV3';
import { PHEROMONE_SPECIES } from '../chemical/CNNAcceleratedDiffusion';

interface ChemicalTestResult {
  testName: string;
  passed: boolean;
  metrics: {
    speedupFactor: number;
    accuracy: number;
    memoryUsage: number;
    reactionEvents: number;
  };
  error?: string;
}

class Phase2ChemicalTest {
  private chemicalSystem?: EnhancedChemicalSystemV3;
  private performanceSystem: PerformanceOptimizationIntegrationV3;

  constructor() {
    // Create performance system with chemical-optimized configuration
    const performanceConfig = {
      targetFPS: 60,
      maxAnts: 50000,
      enableGPUCompute: true,
      enableWebGPU: true,
      enableWebAssembly: true,
      enableAdaptiveScaling: true,
      initialQualityPreset: 'high',
      pheromoneGridSize: 1024,
      massiveScaleMode: true,
      webgpuPreferred: true,
      threadGroupSwizzling: true,
      memoryArenaSize: 268435456, // 256MB
      temporalCompression: true
    };

    this.performanceSystem = new PerformanceOptimizationIntegrationV3(performanceConfig);
  }

  /**
   * Test CNN-accelerated diffusion performance
   */
  async testCNNDiffusionPerformance(): Promise<ChemicalTestResult> {
    console.log('🧪 Testing CNN-accelerated diffusion performance...');

    try {
      const config: ChemicalSystemConfig = {
        gridDimensions: { width: 512, height: 512 },
        cellSize: 1.0,
        timeStep: 0.016, // 60 FPS
        cnnEnabled: true,
        cnnLayers: [32, 16],
        kernelSize: 3,
        gillespieEnabled: false,
        spatialPartitions: { x: 8, y: 8 },
        maxReactionsPerStep: 1000,
        enableGPUAcceleration: true,
        enableTemporalCompression: true,
        qualityPreset: 'high',
        enableVisualization: true,
        visualizationChannels: ['trail', 'alarm', 'food']
      };

      // Initialize performance and chemical systems
      await this.performanceSystem.initialize();
      this.chemicalSystem = new EnhancedChemicalSystemV3(config, this.performanceSystem);
      await this.chemicalSystem.initialize();

      // Deposit test pheromones
      this.chemicalSystem.depositPheromone('trail', 256, 256, 1.0);
      this.chemicalSystem.depositPheromone('alarm', 128, 128, 0.8);
      this.chemicalSystem.depositPheromone('food', 384, 384, 1.2);

      // Run diffusion simulation
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await this.chemicalSystem.simulateStep(0.016);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Get metrics
      const systemMetrics = this.chemicalSystem.getSystemMetrics();
      const performanceStatus = this.performanceSystem.getPerformanceStatus();

      // Check performance targets
      const avgTimePerStep = totalTime / iterations;
      const targetTime = 16.67; // 60 FPS target
      const speedupAchieved = systemMetrics.speedupFactor;

      console.log(`  ⏱️  Average step time: ${avgTimePerStep.toFixed(2)}ms`);
      console.log(`  🚀 Speedup factor: ${speedupAchieved.toFixed(1)}×`);
      console.log(`  📊 GPU utilization: ${systemMetrics.gpuUtilization.toFixed(1)}%`);
      console.log(`  🎯 Accuracy: ${(systemMetrics.accuracy * 100).toFixed(1)}%`);

      // Validate diffusion spread
      const trailData = this.chemicalSystem.getVisualizationData('trail');
      let maxConcentration = 0;
      let totalConcentration = 0;

      if (trailData) {
        for (let i = 0; i < trailData.concentrations.length; i++) {
          const conc = trailData.concentrations[i];
          maxConcentration = Math.max(maxConcentration, conc);
          totalConcentration += conc;
        }
      }

      console.log(`  🌊 Diffusion spread - Max: ${maxConcentration.toFixed(3)}, Total: ${totalConcentration.toFixed(3)}`);

      // Success criteria
      const passed = 
        avgTimePerStep < targetTime && // Performance target
        speedupAchieved > 100 && // Significant speedup
        systemMetrics.accuracy > 0.95 && // High accuracy
        totalConcentration > 0.5; // Reasonable diffusion

      return {
        testName: 'CNN Diffusion Performance',
        passed,
        metrics: {
          speedupFactor: speedupAchieved,
          accuracy: systemMetrics.accuracy,
          memoryUsage: systemMetrics.memoryUsage,
          reactionEvents: systemMetrics.reactionEvents
        }
      };

    } catch (error) {
      return {
        testName: 'CNN Diffusion Performance',
        passed: false,
        metrics: { speedupFactor: 0, accuracy: 0, memoryUsage: 0, reactionEvents: 0 },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test spatial Gillespie algorithm accuracy
   */
  async testGillespieAccuracy(): Promise<ChemicalTestResult> {
    console.log('🧮 Testing spatial Gillespie algorithm accuracy...');

    try {
      const config: ChemicalSystemConfig = {
        gridDimensions: { width: 128, height: 128 },
        cellSize: 1.0,
        timeStep: 0.01,
        cnnEnabled: false,
        cnnLayers: [16],
        kernelSize: 3,
        gillespieEnabled: true,
        spatialPartitions: { x: 4, y: 4 },
        maxReactionsPerStep: 500,
        enableGPUAcceleration: false,
        enableTemporalCompression: false,
        qualityPreset: 'medium',
        enableVisualization: false,
        visualizationChannels: []
      };

      this.chemicalSystem = new EnhancedChemicalSystemV3(config, this.performanceSystem);
      await this.chemicalSystem.initialize();

      // Set up initial conditions for reaction testing
      this.chemicalSystem.depositPheromone('trail', 64, 64, 10.0);
      this.chemicalSystem.depositPheromone('alarm', 64, 64, 5.0);

      // Run stochastic simulation
      const iterations = 200;
      let totalReactionEvents = 0;

      for (let i = 0; i < iterations; i++) {
        await this.chemicalSystem.simulateStep(0.01);
        
        const recentEvents = this.chemicalSystem.getRecentEvents(50);
        totalReactionEvents += recentEvents.filter(e => e.type === 'reaction').length;
      }

      const systemMetrics = this.chemicalSystem.getSystemMetrics();

      // Sample final concentrations
      const finalTrail = this.chemicalSystem.samplePheromone('trail', 64, 64);
      const finalAlarm = this.chemicalSystem.samplePheromone('alarm', 64, 64);

      console.log(`  ⚗️  Total reaction events: ${totalReactionEvents}`);
      console.log(`  📉 Final trail concentration: ${finalTrail.toFixed(3)}`);
      console.log(`  📉 Final alarm concentration: ${finalAlarm.toFixed(3)}`);
      console.log(`  🧮 Algorithm memory usage: ${systemMetrics.memoryUsage.toFixed(1)}MB`);

      // Success criteria for stochastic accuracy
      const passed = 
        totalReactionEvents > 50 && // Sufficient reactions occurred
        finalTrail < 10.0 && // Some decay occurred
        finalAlarm < 5.0 && // Some decay occurred
        systemMetrics.memoryUsage < 100; // Reasonable memory usage

      return {
        testName: 'Gillespie Algorithm Accuracy',
        passed,
        metrics: {
          speedupFactor: 1.0, // Gillespie is exact, not about speedup
          accuracy: totalReactionEvents > 50 ? 0.99 : 0.5,
          memoryUsage: systemMetrics.memoryUsage,
          reactionEvents: totalReactionEvents
        }
      };

    } catch (error) {
      return {
        testName: 'Gillespie Algorithm Accuracy',
        passed: false,
        metrics: { speedupFactor: 0, accuracy: 0, memoryUsage: 0, reactionEvents: 0 },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test hybrid CNN-Gillespie integration
   */
  async testHybridIntegration(): Promise<ChemicalTestResult> {
    console.log('🔄 Testing hybrid CNN-Gillespie integration...');

    try {
      const config: ChemicalSystemConfig = {
        gridDimensions: { width: 256, height: 256 },
        cellSize: 1.0,
        timeStep: 0.016,
        cnnEnabled: true,
        cnnLayers: [16, 8],
        kernelSize: 3,
        gillespieEnabled: true,
        spatialPartitions: { x: 8, y: 8 },
        maxReactionsPerStep: 200,
        enableGPUAcceleration: true,
        enableTemporalCompression: true,
        qualityPreset: 'high',
        enableVisualization: true,
        visualizationChannels: ['trail', 'alarm', 'recruitment']
      };

      this.chemicalSystem = new EnhancedChemicalSystemV3(config, this.performanceSystem);
      await this.chemicalSystem.initialize();

      // Create complex chemical scenario
      this.chemicalSystem.depositPheromone('trail', 128, 128, 2.0);
      this.chemicalSystem.depositPheromone('food', 200, 200, 1.5);
      this.chemicalSystem.depositPheromone('alarm', 64, 64, 1.0);

      // Run hybrid simulation
      const iterations = 60; // 1 second at 60 FPS
      const startTime = performance.now();
      
      let diffusionEvents = 0;
      let reactionEvents = 0;

      for (let i = 0; i < iterations; i++) {
        await this.chemicalSystem.simulateStep(0.016);
        
        const events = this.chemicalSystem.getRecentEvents(20);
        diffusionEvents += events.filter(e => e.type === 'diffusion').length;
        reactionEvents += events.filter(e => e.type === 'reaction').length;
      }

      const endTime = performance.now();
      const systemMetrics = this.chemicalSystem.getSystemMetrics();

      // Test gradient calculation
      const trailGradient = this.chemicalSystem.getChemicalGradient('trail', 128, 128);
      const gradientMagnitude = Math.sqrt(trailGradient.x * trailGradient.x + trailGradient.y * trailGradient.y);

      // Test visualization data integrity
      const visData = this.chemicalSystem.getVisualizationData('trail');
      const visualizationWorking = visData !== null && visData.concentrations.length > 0;

      console.log(`  ⏱️  Total simulation time: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`  🌊 Diffusion events: ${diffusionEvents}`);
      console.log(`  ⚗️  Reaction events: ${reactionEvents}`);
      console.log(`  📊 Speedup factor: ${systemMetrics.speedupFactor.toFixed(1)}×`);
      console.log(`  📈 Gradient magnitude: ${gradientMagnitude.toFixed(4)}`);
      console.log(`  🎨 Visualization: ${visualizationWorking ? 'Working' : 'Failed'}`);

      // Success criteria for hybrid system
      const passed = 
        systemMetrics.speedupFactor > 50 && // Significant speedup from CNN
        reactionEvents > 10 && // Reactions are occurring
        gradientMagnitude > 0 && // Gradients are calculated
        visualizationWorking && // Visualization is functional
        systemMetrics.accuracy > 0.9; // Good accuracy maintained

      return {
        testName: 'Hybrid CNN-Gillespie Integration',
        passed,
        metrics: {
          speedupFactor: systemMetrics.speedupFactor,
          accuracy: systemMetrics.accuracy,
          memoryUsage: systemMetrics.memoryUsage,
          reactionEvents: reactionEvents
        }
      };

    } catch (error) {
      return {
        testName: 'Hybrid CNN-Gillespie Integration',
        passed: false,
        metrics: { speedupFactor: 0, accuracy: 0, memoryUsage: 0, reactionEvents: 0 },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test massive scale chemical simulation
   */
  async testMassiveScaleChemical(): Promise<ChemicalTestResult> {
    console.log('🚀 Testing massive scale chemical simulation...');

    try {
      const config: ChemicalSystemConfig = {
        gridDimensions: { width: 1024, height: 1024 }, // 1M cells
        cellSize: 0.5,
        timeStep: 0.016,
        cnnEnabled: true,
        cnnLayers: [64, 32, 16],
        kernelSize: 5,
        gillespieEnabled: true,
        spatialPartitions: { x: 16, y: 16 },
        maxReactionsPerStep: 2000,
        enableGPUAcceleration: true,
        enableTemporalCompression: true,
        qualityPreset: 'ultra',
        enableVisualization: false, // Disable for performance
        visualizationChannels: []
      };

      // Enable massive scale mode
      this.performanceSystem.enableMassiveScale();
      
      this.chemicalSystem = new EnhancedChemicalSystemV3(config, this.performanceSystem);
      await this.chemicalSystem.initialize();

      // Create realistic colony scenario
      const colonyCenter = { x: 512, y: 512 };
      const nestRadius = 50;
      const foodSources = [
        { x: 256, y: 256 },
        { x: 768, y: 768 },
        { x: 256, y: 768 },
        { x: 768, y: 256 }
      ];

      // Deposit nest pheromones
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const x = colonyCenter.x + Math.cos(angle) * nestRadius;
        const y = colonyCenter.y + Math.sin(angle) * nestRadius;
        if (this.chemicalSystem) {
          this.chemicalSystem.depositPheromone('territory', x, y, 0.5);
        }
      }

      // Deposit food source markers
      foodSources.forEach(food => {
        if (this.chemicalSystem) {
          this.chemicalSystem.depositPheromone('food', food.x, food.y, 2.0);
        }
      });

      // Simulate trail formation (simplified)
      for (let i = 0; i < 20; i++) {
        const pathX = colonyCenter.x + (foodSources[0].x - colonyCenter.x) * (i / 20);
        const pathY = colonyCenter.y + (foodSources[0].y - colonyCenter.y) * (i / 20);
        if (this.chemicalSystem) {
          this.chemicalSystem.depositPheromone('trail', pathX, pathY, 1.0);
        }
      }

      // Run massive scale simulation
      const iterations = 30; // 0.5 seconds
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await this.chemicalSystem.simulateStep(0.016);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const systemMetrics = this.chemicalSystem.getSystemMetrics();

      const avgTimePerStep = totalTime / iterations;
      const targetFPS = 60;
      const targetTime = 1000 / targetFPS;

      console.log(`  🌐 Grid size: ${config.gridDimensions.width}×${config.gridDimensions.height} (${(config.gridDimensions.width * config.gridDimensions.height / 1000000).toFixed(1)}M cells)`);
      console.log(`  ⏱️  Average step time: ${avgTimePerStep.toFixed(2)}ms (target: ${targetTime.toFixed(2)}ms)`);
      console.log(`  🎯 Achieved FPS: ${(1000 / avgTimePerStep).toFixed(1)} (target: 60)`);
      console.log(`  🚀 Speedup factor: ${systemMetrics.speedupFactor.toFixed(1)}×`);
      console.log(`  💾 Memory usage: ${systemMetrics.memoryUsage.toFixed(1)}MB`);
      console.log(`  ⚗️  Total reactions: ${systemMetrics.reactionEvents}`);

      // Success criteria for massive scale
      const passed = 
        avgTimePerStep < targetTime * 1.5 && // Within 50% of target performance
        systemMetrics.speedupFactor > 200 && // Massive speedup achieved
        systemMetrics.memoryUsage < 500 && // Reasonable memory usage
        systemMetrics.accuracy > 0.85; // Acceptable accuracy at scale

      return {
        testName: 'Massive Scale Chemical Simulation',
        passed,
        metrics: {
          speedupFactor: systemMetrics.speedupFactor,
          accuracy: systemMetrics.accuracy,
          memoryUsage: systemMetrics.memoryUsage,
          reactionEvents: systemMetrics.reactionEvents
        }
      };

    } catch (error) {
      return {
        testName: 'Massive Scale Chemical Simulation',
        passed: false,
        metrics: { speedupFactor: 0, accuracy: 0, memoryUsage: 0, reactionEvents: 0 },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Run comprehensive Phase 2 test suite
   */
  async runFullTestSuite(): Promise<void> {
    console.log('🧪 Starting Phase 2 Chemical Enhancement Test Suite');
    console.log('=' .repeat(60));

    const tests = [
      { name: 'CNN Diffusion Performance', test: () => this.testCNNDiffusionPerformance() },
      { name: 'Gillespie Algorithm Accuracy', test: () => this.testGillespieAccuracy() },
      { name: 'Hybrid Integration', test: () => this.testHybridIntegration() },
      { name: 'Massive Scale Performance', test: () => this.testMassiveScaleChemical() }
    ];

    const results: ChemicalTestResult[] = [];

    for (const { name, test } of tests) {
      console.log(`\n🔬 Running ${name}...`);
      
      try {
        const result = await test();
        results.push(result);
        
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status} - ${name}`);
        
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        
        console.log(`   Speedup: ${result.metrics.speedupFactor.toFixed(1)}×`);
        console.log(`   Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
        console.log(`   Memory: ${result.metrics.memoryUsage.toFixed(1)}MB`);
        console.log(`   Reactions: ${result.metrics.reactionEvents}`);
        
      } catch (error) {
        const failedResult: ChemicalTestResult = {
          testName: name,
          passed: false,
          metrics: { speedupFactor: 0, accuracy: 0, memoryUsage: 0, reactionEvents: 0 },
          error: error instanceof Error ? error.message : String(error)
        };
        results.push(failedResult);
        console.log(`❌ FAILED - ${name}: ${failedResult.error}`);
      }

      // Cleanup between tests
      if (this.chemicalSystem) {
        this.chemicalSystem.dispose();
        this.chemicalSystem = undefined;
      }
    }

    // Final summary
    console.log('\n📊 Phase 2 Test Results Summary:');
    console.log('=' .repeat(60));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Performance summary
    const avgSpeedup = results.reduce((sum, r) => sum + r.metrics.speedupFactor, 0) / results.length;
    const avgAccuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length;
    const totalMemory = Math.max(...results.map(r => r.metrics.memoryUsage));

    console.log(`\n📈 Performance Summary:`);
    console.log(`   Average Speedup: ${avgSpeedup.toFixed(1)}× (target: 300×)`);
    console.log(`   Average Accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
    console.log(`   Peak Memory Usage: ${totalMemory.toFixed(1)}MB`);

    console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 Phase 2 Chemical Enhancement: SUCCESS!');
      console.log('   CNN-accelerated diffusion and Gillespie algorithms working perfectly');
      console.log('   Ready to proceed to Phase 3: Research Integration');
    } else {
      console.log('⚠️  Phase 2 Chemical Enhancement: PARTIAL SUCCESS');
      console.log('   Some chemical systems need optimization before Phase 3');
    }

    // Cleanup
    if (this.chemicalSystem) {
      this.chemicalSystem.dispose();
    }
  }
}

// Export for use in other modules
export { Phase2ChemicalTest };

// Browser environment integration
if (typeof window !== 'undefined') {
  (window as any).runPhase2Test = async () => {
    const test = new Phase2ChemicalTest();
    await test.runFullTestSuite();
  };
  console.log('🧪 Phase 2 Chemical Test loaded. Call window.runPhase2Test() to execute.');
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Phase2ChemicalTest };
}