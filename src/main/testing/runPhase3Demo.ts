/**
 * Phase 3 Test Runner
 * Demonstrates ISABELA compression, ME-BVH spatial structures, and advanced memory management
 * Quick validation script for Phase 3 research integration components
 */

import Phase3IntegrationTester from './Phase3IntegrationTester';

/**
 * Run Phase 3 demonstration tests
 */
async function runPhase3Demo(): Promise<void> {
  console.log('🚀 Phase 3 Research Integration Demo');
  console.log('==================================');
  
  // Configuration for demonstration
  const testConfig = {
    antCount: 10000, // 10K ants for demo (scales to 50K+)
    testDuration: 30000, // 30 seconds
    compressionTarget: 20, // 95% compression (20x ratio)
    spatialQueryCount: 100,
    memoryBudget: 256 * 1024 * 1024, // 256MB
    performanceThreshold: 10 // 10ms threshold
  };
  
  console.log(`🔬 Test configuration:`);
  console.log(`   Ant count: ${testConfig.antCount.toLocaleString()}`);
  console.log(`   Memory budget: ${(testConfig.memoryBudget / 1024 / 1024).toFixed(0)}MB`);
  console.log(`   Compression target: ${testConfig.compressionTarget}x`);
  console.log(`   Performance threshold: ${testConfig.performanceThreshold}ms`);
  console.log('');
  
  try {
    // Create and run test suite
    const tester = new Phase3IntegrationTester(testConfig);
    const results = await tester.runFullTestSuite();
    
    // Display summary
    console.log('\n🎯 PHASE 3 DEMONSTRATION COMPLETE');
    console.log('================================');
    
    if (results.overall.allTestsPassed) {
      console.log('✅ Phase 3 research integration successfully validated!');
      console.log('📈 Ready for 50,000+ ant colony simulations');
      console.log(`🏆 Performance score: ${results.overall.performanceScore.toFixed(1)}/100`);
      
      console.log('\n🔬 Key achievements:');
      console.log(`   🗜️  Compression: ${results.compressionTests.averageCompressionRatio.toFixed(1)}x ratio`);
      console.log(`   🌳 Spatial: ${results.spatialTests.averageQueryTime.toFixed(2)}ms avg query`);
      console.log(`   🧠 Memory: ${results.memoryTests.totalMemoryReduction.toFixed(1)}% reduction`);
      console.log(`   🔗 Integration: ${results.integrationTests.overallScore.toFixed(1)}/100 score`);
      
    } else {
      console.log('⚠️  Some Phase 3 components need optimization');
      if (results.overall.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        results.overall.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Phase 3 demo failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runPhase3Demo().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runPhase3Demo };
export default runPhase3Demo;