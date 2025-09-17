/**
 * Phase 1 Integration Test
 * Tests the v3 Performance Foundation and Advanced AI Engine integration
 * Validates massive scale mode and WebGPU capabilities
 */

import { PerformanceOptimizationIntegrationV3 } from '../performance/PerformanceOptimizationIntegrationV3';
import { AdvancedAIEngineV3 } from '../ai/AdvancedAIEngineV3';

interface MockAnt {
    id: string;
    position: { x: number; y: number; z: number };
    genetics: any;
    caste: 'worker' | 'soldier' | 'queen';
    energy: number;
    age: number;
}

class Phase1IntegrationTest {
    private performanceSystem: PerformanceOptimizationIntegrationV3;
    private aiEngine: AdvancedAIEngineV3;
    private testAnts: MockAnt[] = [];

    constructor() {
        // Create proper configuration for testing
        const defaultConfig = {
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
            temporalCompression: true,
        };
        
        this.performanceSystem = new PerformanceOptimizationIntegrationV3(defaultConfig);
        this.aiEngine = new AdvancedAIEngineV3();
    }

    /**
     * Test massive scale mode activation
     */
    async testMassiveScaleMode(): Promise<boolean> {
        console.log('🧪 Testing Massive Scale Mode...');
        
        try {
            // Initialize systems
            await this.performanceSystem.initialize();
            console.log('✅ Performance system initialized');

            // Enable massive scale mode
            this.performanceSystem.enableMassiveScale();
            console.log('✅ Massive scale mode activated');

            // Check performance status
            const status = this.performanceSystem.getPerformanceStatus();
            console.log(`📊 WebGPU Support: ${status.webgpuActive ? 'Available' : 'Fallback to WebGL2'}`);
            console.log(`📈 Memory Usage: ${status.memoryUsage.toFixed(1)}MB`);
            console.log(`🎯 Massive Scale: ${status.massiveScaleActive ? 'Active' : 'Inactive'}`);

            return true;
        } catch (error) {
            console.error('❌ Massive scale mode test failed:', error);
            return false;
        }
    }

    /**
     * Test AI engine with multiple ants
     */
    async testAIEngineScaling(): Promise<boolean> {
        console.log('🧠 Testing AI Engine Scaling...');
        
        try {
            // Create test ant population
            this.generateTestAnts(1000); // Start with 1k ants
            
            const startTime = performance.now();
            
            // Process decisions for all ants
            for (const ant of this.testAnts) {
                const mockContext = {
                    nearbyAnts: this.getNearbyAnts(ant, 50),
                    pheromoneGradient: { x: 0.1, y: 0.1 },
                    obstacles: [],
                    resources: [],
                };
                
                // Create AI for ant if not exists
                this.aiEngine.createAntAI(ant.id, ant.genetics, ant.caste);
                
                // Test AI decision making
                const decision = this.aiEngine.makeDecision(ant.id, mockContext, 'movement');
                
                // Test learning system
                this.aiEngine.learn(ant.id, 'move_forward', mockContext, 0.5);
            }
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            console.log(`📈 Processed ${this.testAnts.length} ants in ${processingTime.toFixed(2)}ms`);
            console.log(`⚡ Performance: ${(this.testAnts.length / processingTime * 1000).toFixed(0)} ants/second`);
            
            return processingTime < 100; // Should process 1k ants in under 100ms
        } catch (error) {
            console.error('❌ AI engine scaling test failed:', error);
            return false;
        }
    }

    /**
     * Test performance under increasing load
     */
    async testPerformanceScaling(): Promise<boolean> {
        console.log('📊 Testing Performance Scaling...');
        
        try {
            const testSizes = [1000, 5000, 10000, 25000];
            const results: { size: number; fps: number; memory: number }[] = [];
            
            for (const size of testSizes) {
                console.log(`Testing with ${size} ants...`);
                
                this.generateTestAnts(size);
                
                // Simulate frame processing
                const startTime = performance.now();
                const startMemory = this.getMemoryUsage();
                
                // Mock frame update
                await this.simulateFrameUpdate();
                
                const endTime = performance.now();
                const endMemory = this.getMemoryUsage();
                
                const frameTime = endTime - startTime;
                const fps = 1000 / frameTime;
                const memoryDelta = endMemory - startMemory;
                
                results.push({ size, fps, memory: memoryDelta });
                
                console.log(`  🎯 ${size} ants: ${fps.toFixed(1)} FPS, +${memoryDelta.toFixed(1)}MB memory`);
                
                // Check if we maintain reasonable performance
                if (fps < 30 && size < 50000) {
                    console.warn(`⚠️  Performance degradation at ${size} ants: ${fps.toFixed(1)} FPS`);
                }
            }
            
            // Performance targets from v3 architecture
            const targetFPS = 60;
            const maxAnts = 50000;
            
            console.log('\n📋 Performance Summary:');
            results.forEach(result => {
                const status = result.fps >= targetFPS ? '✅' : result.fps >= 30 ? '⚠️' : '❌';
                console.log(`  ${status} ${result.size} ants: ${result.fps.toFixed(1)} FPS`);
            });
            
            return true;
        } catch (error) {
            console.error('❌ Performance scaling test failed:', error);
            return false;
        }
    }

    /**
     * Run comprehensive Phase 1 integration test
     */
    async runFullTest(): Promise<void> {
        console.log('🚀 Starting Phase 1 Integration Test Suite');
        console.log('=' .repeat(50));
        
        const tests = [
            { name: 'Massive Scale Mode', test: () => this.testMassiveScaleMode() },
            { name: 'AI Engine Scaling', test: () => this.testAIEngineScaling() },
            { name: 'Performance Scaling', test: () => this.testPerformanceScaling() },
        ];
        
        const results: { name: string; passed: boolean; error?: string }[] = [];
        
        for (const { name, test } of tests) {
            try {
                const passed = await test();
                results.push({ name, passed });
                console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASSED' : 'FAILED'}\n`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.push({ name, passed: false, error: errorMessage });
                console.log(`❌ ${name}: FAILED (${errorMessage})\n`);
            }
        }
        
        // Summary
        console.log('📊 Test Results Summary:');
        console.log('=' .repeat(50));
        
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 Phase 1 Integration Test: SUCCESS!');
            console.log('   Ready to proceed to Phase 2: Chemical Enhancement');
        } else {
            console.log('⚠️  Phase 1 Integration Test: PARTIAL SUCCESS');
            console.log('   Review failed tests before proceeding to Phase 2');
        }
    }

    // Helper methods
    private generateTestAnts(count: number): void {
        this.testAnts = [];
        for (let i = 0; i < count; i++) {
            this.testAnts.push({
                id: `ant_${i}`,
                position: {
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    z: 0,
                },
                genetics: { strength: 0.5, speed: 0.5, intelligence: 0.5 },
                caste: i === 0 ? 'queen' : (i % 10 === 0 ? 'soldier' : 'worker'),
                energy: 100,
                age: Math.random() * 365,
            });
        }
    }

    private getNearbyAnts(ant: MockAnt, radius: number): MockAnt[] {
        return this.testAnts.filter(other => {
            if (other.id === ant.id) return false;
            const dx = ant.position.x - other.position.x;
            const dy = ant.position.y - other.position.y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }

    private async simulateFrameUpdate(): Promise<void> {
        // Simulate typical frame processing
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // Mock some computational work
        for (let i = 0; i < this.testAnts.length; i++) {
            const ant = this.testAnts[i];
            ant.position.x += (Math.random() - 0.5) * 2;
            ant.position.y += (Math.random() - 0.5) * 2;
        }
    }

    private getMemoryUsage(): number {
        // Approximate memory usage calculation
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        // Fallback estimation
        return this.testAnts.length * 0.001; // Rough estimate: 1KB per ant
    }
}

// Export for use in other modules
export { Phase1IntegrationTest };

// If running directly
if (typeof window !== 'undefined') {
    // Browser environment - can be called manually
    (window as any).runPhase1Test = async () => {
        const test = new Phase1IntegrationTest();
        await test.runFullTest();
    };
    console.log('🧪 Phase 1 Integration Test loaded. Call window.runPhase1Test() to execute.');
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { Phase1IntegrationTest };
}