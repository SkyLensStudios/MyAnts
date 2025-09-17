# MyAnts AI Development Guide

## Architecture Overview

MyAnts is a scientifically accurate ant farm simulator with a sophisticated dual-process Electron architecture:

- **Main Process** (`src/main/`): Simulation engine, workers, performance systems
- **Renderer Process** (`src/renderer/`): React + Three.js frontend
- **Engine Systems** (`engine/`): 15 modular biological/physics systems (12k+ LOC)
- **Shared** (`src/shared/`): Types, IPC channels, validation

### Key Design Patterns

**Simulation-First Architecture**: The `SimulationEngine` class orchestrates 15 specialized systems (AI, biology, physics, chemistry). Each system is independent but shares data through spatial optimization and shared buffers.

**Worker-Based Processing**: `SimulationWorkerManager` automatically falls back from Web Workers to main thread processing based on capability detection. All simulation runs in isolated contexts for performance.

**Adaptive LOD System**: Performance scales dynamically from 100 ants (full detail) to 50,000+ ants (aggregate behaviors) through the `AdaptiveLODController` and spatial hashing.

## Critical Development Commands

```bash
# Full development with hot reload (builds both processes)
npm run dev

# Individual process builds
npm run build:main    # Electron main process only
npm run build:renderer # React renderer only
npm run build:watch   # Both with file watching

# Web-only development (bypasses Electron)
npm run start:web     # Port 3000, faster iteration
```

## Path Aliases & Import Patterns

```typescript
// Use project aliases extensively
import { SimulationEngine } from '@main/simulation/SimulationEngine';
import { PheromoneSystem } from '@engine/chemical/pheromones';
import { IPCChannels } from '@shared/IPCChannels';

// Engine systems use relative paths (legacy pattern)
import { AntGenetics } from '../../../engine/biological/genetics';
```

## IPC Communication Pattern

All main-renderer communication flows through type-safe IPC handlers in `electron.ts` and the preload script:

```typescript
// Main process handlers follow this pattern
private async handleStartSimulation(): Promise<boolean> {
  // Always delegate to SimulationWorkerManager
  return await this.workerManager?.startSimulation() || false;
}

// Renderer access via preload API
window.electronAPI.simulation.start()
```

## Performance System Integration

The simulation uses multi-layered performance optimization:

1. **Spatial Optimization**: `SpatialOptimizationIntegration` provides O(1) neighbor queries
2. **Adaptive LOD**: Automatically scales simulation complexity based on hardware
3. **Worker Fallback**: Graceful degradation when Web Workers unavailable
4. **Shared Buffers**: High-frequency data transfer without serialization

## Testing Framework

Use the comprehensive test suites in `src/main/testing/`:

- `Phase2IntegrationTester`: Integration testing for all performance systems
- `ArchitectureAlignmentTester`: Validation against architecture specifications

```typescript
// All tests follow this pattern
const tester = new Phase2IntegrationTester();
await tester.runComprehensiveTests();
```

## Engine System Conventions

Each engine system exports a main class and follows scientific accuracy:

```typescript
// Biology systems model real myrmecology research
export class BiologicalSystemsEngine {
  simulateDay(population, environment, season): void
}

// AI systems use behavior trees with realistic decision-making
export class BehaviorDecisionTree {
  makeDecision(context: DecisionContext): TaskType
}
```

## Common Pitfalls

- **Import Resolution**: Engine imports require explicit relative paths
- **Worker Communication**: Always check `isWorkerMode` before using worker features
- **Type Safety**: Use `types-enhanced.ts` for scientific simulation types
- **Performance**: Large simulations require spatial optimization enabled
- **Graphics**: Capability detection handles WebGPU/WebGL2/CPU fallback chain

## Development Workflow

1. Use `npm run dev` for full development
2. Test changes in `start:web` for faster iteration
3. Run integration tests after major changes
4. Check performance metrics via `getPerformanceStats()`
5. Use `ArchitectureAlignmentTester` for specification compliance