/**
 * Comprehensive Architecture Alignment Integration Test
 * Validates all v3 architecture components work together for 50,000+ ant simulation
 */

import { SimulationEngine } from '../simulation/SimulationEngine';
import { WebGPUComputePipelineManager } from '../performance/WebGPUComputePipelineManager';
import { AdaptiveLODController } from '../performance/AdaptiveLODController';
import { CNNDiffusionModel } from '../chemical/CNNDiffusionModel';
import { SpikingNeuralNetwork, SpikingNetworkFactory } from '../ai/SpikingNeuralNetwork';
import { PerformanceOptimizationIntegrationV3 } from '../performance/PerformanceOptimizationIntegrationV3';
import { LODController } from '../performance/LODController';

export interface ArchitectureTestResults {
  webgpuPerformance: {
    supported: boolean;
    computeTime: number;
    memoryBandwidth: number;
    threadEfficiency: number;
  };
  cnnAcceleration: {
    active: boolean;
    speedupAchieved: number;
    errorRate: number;
    trainingTime: number;
  };
  spikingNetworks: {
    initialized: boolean;
    neuronCount: number;
    synapseCount: number;
    averageStepTime: number;
    spikeRate: number;
  };
  adaptiveLOD: {
    functional: boolean;
    qualityLevel: number;
    performanceRatio: number;
    lodDistribution: Record<string, number>;
  };
  overallPerformance: {
    targetAchieved: boolean;
    maxAntsSupported: number;
    averageFPS: number;
    memoryUsage: number;
    scalabilityScore: number;
  };
}

export interface ArchitectureTestConfig {
  targetAntCount: number;
  testDuration: number; // seconds
  enableWebGPU: boolean;
  enableCNNAcceleration: boolean;
  enableSpikingNetworks: boolean;
  enableAdaptiveLOD: boolean;
  performanceThreshold: number; // minimum FPS
}

/**
 * Comprehensive test of all v3 architecture components
 */
export class ArchitectureAlignmentTester {
  private config: ArchitectureTestConfig;
  private testResults: ArchitectureTestResults;
  
  // System components
  private simulationEngine: SimulationEngine | null = null;
  private webgpuPipeline: WebGPUComputePipelineManager | null = null;
  private adaptiveLOD: AdaptiveLODController | null = null;
  private cnnModel: CNNDiffusionModel | null = null;
  private spikingNetwork: SpikingNeuralNetwork | null = null;
  private performanceSystem: PerformanceOptimizationIntegrationV3 | null = null;
  
  // Test state
  private isRunning = false;
  private startTime = 0;
  private frameCount = 0;
  private performanceHistory: number[] = [];

  constructor(config: Partial<ArchitectureTestConfig> = {}) {
    this.config = {
      targetAntCount: 50000,
      testDuration: 30, // 30 seconds
      enableWebGPU: true,
      enableCNNAcceleration: true,
      enableSpikingNetworks: true,
      enableAdaptiveLOD: true,
      performanceThreshold: 30, // 30 FPS minimum
      ...config
    };
    
    this.testResults = {
      webgpuPerformance: {
        supported: false,
        computeTime: 0,
        memoryBandwidth: 0,
        threadEfficiency: 0
      },
      cnnAcceleration: {
        active: false,
        speedupAchieved: 0,
        errorRate: 0,
        trainingTime: 0
      },
      spikingNetworks: {
        initialized: false,
        neuronCount: 0,
        synapseCount: 0,
        averageStepTime: 0,
        spikeRate: 0
      },
      adaptiveLOD: {
        functional: false,
        qualityLevel: 0,
        performanceRatio: 0,
        lodDistribution: {}
      },
      overallPerformance: {
        targetAchieved: false,
        maxAntsSupported: 0,
        averageFPS: 0,
        memoryUsage: 0,
        scalabilityScore: 0
      }
    };
  }

  /**
   * Run comprehensive architecture alignment test
   */
  public async runComprehensiveTest(): Promise<ArchitectureTestResults> {
    console.log('🚀 Starting Comprehensive Architecture Alignment Test');
    console.log(`Target: ${this.config.targetAntCount} ants, ${this.config.testDuration}s duration`);
    
    try {
      // Initialize all systems
      await this.initializeAllSystems();
      
      // Run performance tests
      await this.runWebGPUPerformanceTest();
      await this.runCNNAccelerationTest();
      await this.runSpikingNetworkTest();
      await this.runAdaptiveLODTest();
      
      // Run integrated simulation test
      await this.runIntegratedSimulationTest();
      
      // Calculate overall scores
      this.calculateOverallPerformance();
      
      // Generate summary report
      this.generateTestReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Architecture test failed:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Initialize all v3 architecture systems
   */
  private async initializeAllSystems(): Promise<void> {
    console.log('📋 Initializing v3 Architecture Systems...');
    
    try {
      // Initialize performance system first
      this.performanceSystem = new PerformanceOptimizationIntegrationV3({
        targetFPS: 60,
        maxAnts: this.config.targetAntCount,
        enableGPUCompute: this.config.enableWebGPU,
        enableWebGPU: this.config.enableWebGPU,
        enableWebAssembly: true,
        enableAdaptiveScaling: this.config.enableAdaptiveLOD,
        initialQualityPreset: 'high',
        pheromoneGridSize: 1024,
        massiveScaleMode: true,
        webgpuPreferred: true,
        threadGroupSwizzling: true,
        memoryArenaSize: 128 * 1024 * 1024,
        temporalCompression: true
      });
      
      await this.performanceSystem.initialize();
      console.log('✅ Performance system initialized');

      // Initialize WebGPU pipeline if enabled
      if (this.config.enableWebGPU) {
        try {
          const webgpuConfig = {
            device: null,
            enableOptimizations: true,
            maxComputeGroups: 65536,
            workgroupSize: [64, 1, 1] as [number, number, number],
            enableProfiling: true,
            maxAnts: this.config.targetAntCount,
            gridWidth: 1024,
            gridHeight: 1024,
            enableThreadGroupSwizzling: true,
            bufferPoolSize: 128 * 1024 * 1024,
            enableMemoryOptimization: true,
            timestep: 0.016,
            enableL2CacheOptimization: true,
            enableMemoryCoalescing: true,
            computeGroupSize: [64, 1, 1] as [number, number, number]
          };
          
          this.webgpuPipeline = new WebGPUComputePipelineManager(webgpuConfig, this.performanceSystem);
          await this.webgpuPipeline.initialize();
          this.testResults.webgpuPerformance.supported = true;
          console.log('✅ WebGPU pipeline initialized');
        } catch (error) {
          console.warn('⚠️ WebGPU not available, continuing without it');
          this.config.enableWebGPU = false;
        }
      }

      // Initialize LOD system
      if (this.config.enableAdaptiveLOD) {
        const lodController = new LODController();
        this.adaptiveLOD = new AdaptiveLODController(
          lodController,
          this.webgpuPipeline!,
          this.performanceSystem
        );
        await this.adaptiveLOD.initialize();
        this.testResults.adaptiveLOD.functional = true;
        console.log('✅ Adaptive LOD system initialized');
      }

      // Initialize CNN acceleration
      if (this.config.enableCNNAcceleration) {
        try {
          const cnnConfig = {
            modelPath: 'models/diffusion_model',
            enableGPU: true,
            batchSize: 32,
            inputShape: [256, 256, 1] as [number, number, number],
            inputWidth: 256,
            inputHeight: 256,
            inputChannels: 1,
            outputChannels: 1,
            hiddenLayers: [64, 32, 16],
            learningRate: 0.001,
            enableTraining: true,
            epochs: 10,
            validationSplit: 0.2
          };
          this.cnnModel = new CNNDiffusionModel(cnnConfig);
          await this.cnnModel.initialize();
          this.testResults.cnnAcceleration.active = true;
          console.log('✅ CNN diffusion model initialized');
        } catch (error) {
          console.warn('⚠️ CNN acceleration failed to initialize:', error);
          this.config.enableCNNAcceleration = false;
        }
      }

      // Initialize spiking neural networks
      if (this.config.enableSpikingNetworks) {
        try {
          this.spikingNetwork = SpikingNetworkFactory.createAntBehaviorNetwork();
          await this.spikingNetwork.initialize();
          this.testResults.spikingNetworks.initialized = true;
          console.log('✅ Spiking neural network initialized');
        } catch (error) {
          console.warn('⚠️ Spiking networks failed to initialize:', error);
          this.config.enableSpikingNetworks = false;
        }
      }

      console.log('🎯 All systems initialized successfully');
      
    } catch (error) {
      console.error('❌ System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Test WebGPU compute performance
   */
  private async runWebGPUPerformanceTest(): Promise<void> {
    if (!this.webgpuPipeline) {
      console.log('⏭️ Skipping WebGPU test (not available)');
      return;
    }

    console.log('🧪 Testing WebGPU Compute Performance...');
    
    const iterations = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await this.webgpuPipeline.executeComputeStep(0.016);
    }
    
    const totalTime = performance.now() - startTime;
    const avgComputeTime = totalTime / iterations;
    
    const metrics = this.webgpuPipeline.getPerformanceMetrics();
    
    this.testResults.webgpuPerformance = {
      supported: true,
      computeTime: avgComputeTime,
      memoryBandwidth: metrics.memoryBandwidth || 0,
      threadEfficiency: metrics.threadEfficiency || 0
    };
    
    console.log(`✅ WebGPU Performance: ${avgComputeTime.toFixed(2)}ms avg compute time`);
  }

  /**
   * Test CNN acceleration performance
   */
  private async runCNNAccelerationTest(): Promise<void> {
    if (!this.cnnModel) {
      console.log('⏭️ Skipping CNN test (not available)');
      return;
    }

    console.log('🧪 Testing CNN Acceleration Performance...');
    
    // Create test diffusion data
    const gridSize = 256;
    const testData = new Float32Array(gridSize * gridSize);
    for (let i = 0; i < testData.length; i++) {
      testData[i] = Math.random() * 100; // Random pheromone concentrations
    }
    
    // Test traditional vs CNN acceleration
    const iterations = 10;
    
    // Traditional simulation (baseline)
    const traditionalStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      // Simulate traditional diffusion (simplified)
      this.simulateTraditionalDiffusion(testData, gridSize);
    }
    const traditionalTime = performance.now() - traditionalStart;
    
    // CNN accelerated simulation
    const cnnStart = performance.now();
    try {
      const cnnResult = await this.cnnModel.predict(testData, {
        temperature: 25.0,
        humidity: 0.6,
        windSpeed: 2.0,
        pressure: 1013.25
      });
      const cnnTime = performance.now() - cnnStart;
      
      const speedup = traditionalTime / cnnTime;
      const errorRate = this.calculateDiffusionError(testData, cnnResult);
      
      this.testResults.cnnAcceleration = {
        active: true,
        speedupAchieved: speedup,
        errorRate: errorRate,
        trainingTime: cnnTime
      };
      
      console.log(`✅ CNN Acceleration: ${speedup.toFixed(1)}× speedup, ${(errorRate * 100).toFixed(2)}% error`);
      
    } catch (error) {
      console.warn('⚠️ CNN acceleration test failed:', error);
      this.testResults.cnnAcceleration.active = false;
    }
  }

  /**
   * Test spiking neural network performance
   */
  private async runSpikingNetworkTest(): Promise<void> {
    if (!this.spikingNetwork) {
      console.log('⏭️ Skipping spiking network test (not available)');
      return;
    }

    console.log('🧪 Testing Spiking Neural Network Performance...');
    
    const iterations = 100;
    const deltaTime = 0.001; // 1ms time steps
    
    const startTime = performance.now();
    let totalSpikes = 0;
    
    for (let i = 0; i < iterations; i++) {
      // Add some sensory input
      this.spikingNetwork.addSynapticInput(0, Math.random() * 5);
      this.spikingNetwork.addSynapticInput(1, Math.random() * 5);
      
      const spikeEvents = await this.spikingNetwork.simulateStep(deltaTime);
      totalSpikes += spikeEvents.length;
    }
    
    const totalTime = performance.now() - startTime;
    const avgStepTime = totalTime / iterations;
    const avgSpikeRate = totalSpikes / iterations;
    
    const networkState = this.spikingNetwork.getNetworkState();
    const performanceMetrics = this.spikingNetwork.getPerformanceMetrics();
    
    this.testResults.spikingNetworks = {
      initialized: true,
      neuronCount: networkState.membraneVoltages.length,
      synapseCount: networkState.synapticWeights.length,
      averageStepTime: avgStepTime,
      spikeRate: avgSpikeRate
    };
    
    console.log(`✅ Spiking Networks: ${avgStepTime.toFixed(2)}ms avg step, ${avgSpikeRate.toFixed(1)} spikes/step`);
  }

  /**
   * Test adaptive LOD system
   */
  private async runAdaptiveLODTest(): Promise<void> {
    if (!this.adaptiveLOD) {
      console.log('⏭️ Skipping LOD test (not available)');
      return;
    }

    console.log('🧪 Testing Adaptive LOD System...');
    
    // Create mock ant data
    const antCount = Math.min(this.config.targetAntCount, 10000); // Start with subset
    const mockAnts = this.createMockAntData(antCount);
    
    // Test LOD adaptation
    await this.adaptiveLOD.updateLODAssignments(mockAnts, 0.016);
    
    const metrics = this.adaptiveLOD.getPerformanceMetrics();
    const qualityLevel = this.adaptiveLOD.getCurrentQualityLevel();
    
    this.testResults.adaptiveLOD = {
      functional: true,
      qualityLevel: qualityLevel,
      performanceRatio: metrics.performanceRatio,
      lodDistribution: {
        fullDetail: Object.values(metrics.lodDistribution)[0] || 0,
        simplified: Object.values(metrics.lodDistribution)[1] || 0,
        statistical: Object.values(metrics.lodDistribution)[2] || 0,
        aggregate: Object.values(metrics.lodDistribution)[3] || 0
      }
    };
    
    console.log(`✅ Adaptive LOD: ${(qualityLevel * 100).toFixed(0)}% quality, ${metrics.performanceRatio.toFixed(2)} performance ratio`);
  }

  /**
   * Run integrated simulation test with all systems
   */
  private async runIntegratedSimulationTest(): Promise<void> {
    console.log('🧪 Running Integrated Simulation Test...');
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.performanceHistory = [];
    
    const targetFrames = this.config.testDuration * 60; // Assume 60 FPS target
    
    while (this.frameCount < targetFrames && this.isRunning) {
      const frameStart = performance.now();
      
      // Simulate one frame
      await this.simulateIntegratedFrame();
      
      const frameTime = performance.now() - frameStart;
      const fps = 1000 / frameTime;
      
      this.performanceHistory.push(fps);
      this.frameCount++;
      
      // Check if we're meeting performance targets
      if (fps < this.config.performanceThreshold) {
        console.warn(`⚠️ Performance below threshold: ${fps.toFixed(1)} FPS`);
      }
      
      // Progress logging
      if (this.frameCount % 60 === 0) {
        const avgFPS = this.performanceHistory.slice(-60).reduce((a, b) => a + b, 0) / 60;
        console.log(`📊 Frame ${this.frameCount}/${targetFrames}, Avg FPS: ${avgFPS.toFixed(1)}`);
      }
    }
    
    this.isRunning = false;
    
    console.log('✅ Integrated simulation test completed');
  }

  /**
   * Simulate one integrated frame with all systems
   */
  private async simulateIntegratedFrame(): Promise<void> {
    const deltaTime = 0.016; // 60 FPS
    
    // Update WebGPU compute if available
    if (this.webgpuPipeline) {
      await this.webgpuPipeline.executeComputeStep(deltaTime);
    }
    
    // Update spiking networks if available
    if (this.spikingNetwork) {
      await this.spikingNetwork.simulateStep(deltaTime);
    }
    
    // Update adaptive LOD if available
    if (this.adaptiveLOD) {
      const mockAnts = this.createMockAntData(this.config.targetAntCount);
      await this.adaptiveLOD.updateLODAssignments(mockAnts, deltaTime);
    }
    
    // Update CNN diffusion if available
    if (this.cnnModel) {
      const gridSize = 128;
      const testData = new Float32Array(gridSize * gridSize);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = Math.random() * 10;
      }
      await this.cnnModel.predict(testData, {
        temperature: 25.0,
        humidity: 0.6,
        windSpeed: 2.0,
        pressure: 1013.25
      });
    }
    
    // Update performance system
    if (this.performanceSystem) {
      this.performanceSystem.update(deltaTime);
    }
  }

  /**
   * Calculate overall performance scores
   */
  private calculateOverallPerformance(): void {
    const avgFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    const minFPS = Math.min(...this.performanceHistory);
    
    // Calculate max supported ants based on performance
    const performanceRatio = avgFPS / 60; // Relative to 60 FPS target
    const maxAntsSupported = Math.floor(this.config.targetAntCount * performanceRatio);
    
    // Calculate scalability score (0-100)
    let scalabilityScore = 0;
    if (this.testResults.webgpuPerformance.supported) scalabilityScore += 25;
    if (this.testResults.cnnAcceleration.active && this.testResults.cnnAcceleration.speedupAchieved > 100) scalabilityScore += 25;
    if (this.testResults.spikingNetworks.initialized) scalabilityScore += 25;
    if (this.testResults.adaptiveLOD.functional) scalabilityScore += 25;
    
    // Adjust based on actual performance
    if (avgFPS >= this.config.performanceThreshold) {
      scalabilityScore *= (avgFPS / 60); // Bonus for high FPS
    } else {
      scalabilityScore *= 0.5; // Penalty for poor performance
    }
    
    this.testResults.overallPerformance = {
      targetAchieved: avgFPS >= this.config.performanceThreshold && maxAntsSupported >= 50000,
      maxAntsSupported: maxAntsSupported,
      averageFPS: avgFPS,
      memoryUsage: this.estimateMemoryUsage(),
      scalabilityScore: Math.min(100, Math.max(0, scalabilityScore))
    };
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log('\n📋 =================== ARCHITECTURE ALIGNMENT TEST REPORT ===================');
    console.log(`🎯 Target: ${this.config.targetAntCount} ants simulation`);
    console.log(`⏱️  Duration: ${this.config.testDuration}s (${this.frameCount} frames)`);
    console.log('');
    
    // WebGPU Results
    console.log('🔧 WebGPU Compute Performance:');
    if (this.testResults.webgpuPerformance.supported) {
      console.log(`   ✅ Supported: ${this.testResults.webgpuPerformance.computeTime.toFixed(2)}ms avg compute time`);
      console.log(`   📊 Thread Efficiency: ${(this.testResults.webgpuPerformance.threadEfficiency * 100).toFixed(1)}%`);
    } else {
      console.log('   ❌ Not supported or failed to initialize');
    }
    console.log('');
    
    // CNN Results
    console.log('🧠 CNN Acceleration:');
    if (this.testResults.cnnAcceleration.active) {
      console.log(`   ✅ Active: ${this.testResults.cnnAcceleration.speedupAchieved.toFixed(1)}× speedup achieved`);
      console.log(`   📊 Error Rate: ${(this.testResults.cnnAcceleration.errorRate * 100).toFixed(2)}%`);
      
      if (this.testResults.cnnAcceleration.speedupAchieved >= 300) {
        console.log('   🎯 Target 300× speedup: ACHIEVED');
      } else {
        console.log('   ⚠️ Target 300× speedup: NOT YET ACHIEVED');
      }
    } else {
      console.log('   ❌ Not active or failed to initialize');
    }
    console.log('');
    
    // Spiking Networks Results
    console.log('⚡ Spiking Neural Networks:');
    if (this.testResults.spikingNetworks.initialized) {
      console.log(`   ✅ Initialized: ${this.testResults.spikingNetworks.neuronCount} neurons`);
      console.log(`   📊 Performance: ${this.testResults.spikingNetworks.averageStepTime.toFixed(2)}ms/step`);
      console.log(`   🔥 Spike Rate: ${this.testResults.spikingNetworks.spikeRate.toFixed(2)} spikes/step`);
    } else {
      console.log('   ❌ Not initialized or failed');
    }
    console.log('');
    
    // LOD Results
    console.log('📊 Adaptive LOD System:');
    if (this.testResults.adaptiveLOD.functional) {
      console.log(`   ✅ Functional: ${(this.testResults.adaptiveLOD.qualityLevel * 100).toFixed(0)}% quality level`);
      console.log(`   📊 Performance Ratio: ${this.testResults.adaptiveLOD.performanceRatio.toFixed(2)}`);
    } else {
      console.log('   ❌ Not functional or failed to initialize');
    }
    console.log('');
    
    // Overall Performance
    console.log('🚀 Overall Performance:');
    console.log(`   📈 Average FPS: ${this.testResults.overallPerformance.averageFPS.toFixed(1)}`);
    console.log(`   🐜 Max Ants Supported: ${this.testResults.overallPerformance.maxAntsSupported.toLocaleString()}`);
    console.log(`   💾 Memory Usage: ${(this.testResults.overallPerformance.memoryUsage / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   📊 Scalability Score: ${this.testResults.overallPerformance.scalabilityScore.toFixed(0)}/100`);
    console.log('');
    
    // Final verdict
    if (this.testResults.overallPerformance.targetAchieved) {
      console.log('🎉 ================= ARCHITECTURE TARGET ACHIEVED =================');
      console.log('✅ The codebase successfully aligns with v3 architecture specifications');
      console.log('✅ 50,000+ ant simulation target is achievable with current implementation');
    } else {
      console.log('⚠️ ================= ARCHITECTURE TARGET NOT YET MET =================');
      console.log('🔧 Additional optimization required to meet 50,000+ ant simulation target');
      console.log('📋 Consider enabling more performance features or optimizing bottlenecks');
    }
    console.log('===============================================================================\n');
  }

  /**
   * Helper methods
   */
  
  private createMockAntData(count: number): any[] {
    const ants = [];
    for (let i = 0; i < count; i++) {
      ants.push({
        id: i,
        position: { x: Math.random() * 100, y: Math.random() * 100, z: 0 },
        lodLevel: Math.floor(Math.random() * 4),
        isSelected: i < 10, // First 10 ants are "selected"
        lastActivity: Date.now() - Math.random() * 10000,
        caste: i === 0 ? 'queen' : i < 100 ? 'worker' : 'soldier'
      });
    }
    return ants;
  }

  private simulateTraditionalDiffusion(data: Float32Array, gridSize: number): void {
    // Simple diffusion simulation for baseline comparison
    const diffusionRate = 0.1;
    const newData = new Float32Array(data.length);
    
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        const idx = y * gridSize + x;
        const neighbors = 
          data[(y-1) * gridSize + x] +     // top
          data[(y+1) * gridSize + x] +     // bottom
          data[y * gridSize + (x-1)] +     // left
          data[y * gridSize + (x+1)];      // right
        
        newData[idx] = data[idx] + diffusionRate * (neighbors / 4 - data[idx]);
      }
    }
    
    // Copy back
    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  private calculateDiffusionError(original: Float32Array, predicted: Float32Array): number {
    let totalError = 0;
    for (let i = 0; i < original.length; i++) {
      totalError += Math.abs(original[i] - predicted[i]);
    }
    return totalError / original.length / 100; // Normalize to percentage
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in bytes
    let memoryUsage = 0;
    
    // WebGPU buffers
    if (this.testResults.webgpuPerformance.supported) {
      memoryUsage += this.config.targetAntCount * 64; // 64 bytes per ant
    }
    
    // Neural network memory
    if (this.testResults.spikingNetworks.initialized) {
      memoryUsage += this.testResults.spikingNetworks.neuronCount * 32;
      memoryUsage += this.testResults.spikingNetworks.synapseCount * 16;
    }
    
    // CNN model memory
    if (this.testResults.cnnAcceleration.active) {
      memoryUsage += 50 * 1024 * 1024; // ~50MB for model
    }
    
    return memoryUsage;
  }

  private cleanup(): void {
    this.isRunning = false;
    
    if (this.spikingNetwork) {
      this.spikingNetwork.dispose();
    }
    
    if (this.cnnModel) {
      this.cnnModel.dispose();
    }
    
    if (this.adaptiveLOD) {
      this.adaptiveLOD.dispose();
    }
    
    if (this.webgpuPipeline) {
      this.webgpuPipeline.destroy();
    }
    
    if (this.performanceSystem) {
      this.performanceSystem.dispose();
    }
  }
}

/**
 * Quick test runner for development
 */
export async function runArchitectureAlignmentTest(): Promise<void> {
  const tester = new ArchitectureAlignmentTester({
    targetAntCount: 50000,
    testDuration: 10, // Short test for development
    performanceThreshold: 30
  });
  
  try {
    const results = await tester.runComprehensiveTest();
    
    // Save results to console and potentially to file
    console.log('Test completed successfully');
    console.log('Results:', results);
    
  } catch (error) {
    console.error('Architecture test failed:', error);
  }
}

/**
 * Performance benchmark specifically for the 50,000 ant target
 */
export async function runScalabilityBenchmark(): Promise<void> {
  console.log('🎯 Running 50,000 Ant Scalability Benchmark...');
  
  const antCounts = [1000, 5000, 10000, 25000, 50000];
  
  for (const antCount of antCounts) {
    console.log(`\n📊 Testing ${antCount.toLocaleString()} ants...`);
    
    const tester = new ArchitectureAlignmentTester({
      targetAntCount: antCount,
      testDuration: 5, // Short test for each scale
      performanceThreshold: 30
    });
    
    try {
      const results = await tester.runComprehensiveTest();
      
      console.log(`${antCount.toLocaleString()} ants: ${results.overallPerformance.averageFPS.toFixed(1)} FPS`);
      
      if (results.overallPerformance.averageFPS < 30) {
        console.log(`⚠️ Performance degraded at ${antCount.toLocaleString()} ants`);
        break;
      }
      
    } catch (error) {
      console.error(`❌ Failed at ${antCount.toLocaleString()} ants:`, error);
      break;
    }
  }
  
  console.log('\n🏁 Scalability benchmark completed');
}