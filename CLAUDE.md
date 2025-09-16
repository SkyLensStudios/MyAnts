# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development with hot reload (builds and starts Electron)
- `npm run build` - Full production build (main + renderer processes)
- `npm run build:watch` - Development build with watch mode (main + renderer)
- `npm run build:main` - Build Electron main process only
- `npm run build:renderer` - Build renderer process only
- `npm run start:web` - Start web development server (port 3000)
- `npm run start:electron` - Start Electron app (requires built assets)

### Code Quality
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Architecture Overview

This is a hyper-realistic ant farm simulator built with modern TypeScript/React. The codebase represents a comprehensive simulation engine with 15 major systems across 12,000+ lines of scientifically accurate code.

### Core Structure
- **`engine/`** - Complete simulation engine with 15 integrated systems:
  - `ai/` - Advanced AI (decision trees with learning, spatial memory, behavioral adaptation)
  - `biological/` - Complete life sciences (genetics with Mendelian inheritance, physiology, lifecycle, disease system)
  - `chemical/` - Sophisticated chemistry (pheromone diffusion, chemical interactions, environmental effects)
  - `colony/` - Full colony management (caste systems, task assignment, resource allocation, population dynamics)
  - `environmental/` - Comprehensive environment (weather simulation, soil chemistry, ecosystem modeling)
  - `physics/` - Integrated physics engine (collision detection, fluid dynamics, particle systems, gravity)

- **`src/`** - Electron application structure:
  - `main/` - Electron main process (Node.js backend)
  - `renderer/` - Renderer process (React frontend)
  - `shared/` - Shared types and utilities between processes

### Implementation Status (~80% Complete)
- **Engine Systems**: ✅ **Complete** (15/15 systems, 12,087 lines)
- **Build Architecture**: ✅ **Complete** (Electron main/renderer separation)
- **Frontend**: ❌ **Scaffolding Only** (build setup ready, needs React components)
- **Data Layer**: ❌ **Not Started** (directories exist but empty)
- **Main Integration**: ❌ **Missing** (needs simulation coordinator and IPC)

### Next Development Priorities
1. **Electron Main Process** - Implement main process with simulation coordinator
2. **React Renderer Setup** - Create basic React components and Three.js canvas
3. **IPC Communication** - Connect main and renderer processes
4. **Entity Management** - Ant and Colony classes that use the engine systems

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Rendering**: Three.js with WebGL 2.0
- **Physics**: Cannon.js + custom physics engine
- **Build**: Webpack + TypeScript
- **Desktop**: Electron
- **State Management**: Zustand
- **3D Graphics**: react-three-fiber + @react-three/drei

### Path Aliases
The project uses TypeScript path aliases:
- `@/*` - Source directory (src/)
- `@engine/*` - Engine modules
- `@shared/*` - Shared utilities between processes
- `@renderer/*` - Renderer process files
- `@main/*` - Main process files

### Key Design Principles
1. **Scientific Accuracy**: Based on real myrmecology research
2. **Modular Architecture**: Each engine system is independent and composable
3. **Performance-First**: Optimized for handling 10,000+ ants at 60fps
4. **Real-time Simulation**: Complex biological behaviors, physics, and chemical systems

### Key Implemented Systems

#### AI & Behavior (3 systems)
- **BehaviorDecisionTree**: Complex behavior trees with personality, learning, and caste-specific decisions
- **LearningSystem**: Reinforcement learning and behavioral adaptation
- **SpatialMemory**: Location-based memory with forgetting curves and landmark recognition

#### Biological Sciences (4 systems)
- **AntGenetics**: Mendelian inheritance, mutations, fitness calculations, and aging effects
- **PhysiologicalSystem**: Metabolism, health, nutrition, and circadian rhythms
- **LifecycleSystem**: Complete ant lifecycle from egg to death with realistic timing
- **DiseaseSystem**: Comprehensive pathogen modeling with transmission, immunity, and outbreaks

#### Colony Management (5 systems)
- **ColonyManagementSystem**: Central coordination of all colony operations
- **CasteSystem**: Worker/soldier/queen roles with specialized behaviors
- **TaskAssignmentSystem**: Dynamic task allocation based on needs and ant capabilities
- **ResourceAllocationSystem**: Resource distribution and priority management
- **PopulationDynamicsSystem**: Birth/death rates, migration, and population control

#### Physics & Environment (3 systems)
- **PhysicsEngine**: Integrated collision, fluid dynamics, particles, and gravity
- **PheromoneSystem**: Realistic chemical diffusion with wind effects and interactions
- **WeatherSystem**: Climate simulation affecting all other systems
- **SoilSystem**: Soil chemistry and tunnel construction physics

### Development Notes
- **124 exported classes/interfaces** provide comprehensive APIs
- **Scientific accuracy** based on real myrmecology research
- **Performance optimized** for 10,000+ ants with fixed-timestep simulation
- **Modular design** allows systems to interact through standardized interfaces
- **Event-driven architecture** enables complex emergent behaviors