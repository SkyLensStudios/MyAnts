/**
 * WASM Build Configuration
 * Defines the build process and module specifications for WebAssembly modules
 */

/**
 * Configuration for building WebAssembly modules from C/C++/Rust source
 */
export interface WASMModuleBuildConfig {
  name: string;
  sourceLanguage: 'c' | 'cpp' | 'rust';
  sourcePath: string;
  outputPath: string;
  optimizationLevel: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
  features: string[];
  sharedMemory: boolean;
  maxMemoryPages: number;
  exportedFunctions: string[];
  importedFunctions: string[];
}

/**
 * Physics Module - Collision detection, force calculation, motion integration
 */
export const physicsModuleConfig: WASMModuleBuildConfig = {
  name: 'physics',
  sourceLanguage: 'cpp',
  sourcePath: 'src/wasm/physics/',
  outputPath: 'public/wasm/physics.wasm',
  optimizationLevel: 'O3',
  features: ['simd', 'bulk-memory', 'multivalue'],
  sharedMemory: true,
  maxMemoryPages: 128, // 8MB
  exportedFunctions: [
    'updateCollisions',
    'calculateForces',
    'integrateMotion', 
    'processBatch',
    'setGravity',
    'addCollider',
    'removeCollider'
  ],
  importedFunctions: [
    'log',
    'getTime',
    'random'
  ]
};

/**
 * AI Module - Decision making, learning, memory processing
 */
export const aiModuleConfig: WASMModuleBuildConfig = {
  name: 'ai',
  sourceLanguage: 'rust',
  sourcePath: 'src/wasm/ai/',
  outputPath: 'public/wasm/ai.wasm',
  optimizationLevel: 'O3',
  features: ['simd', 'bulk-memory'],
  sharedMemory: true,
  maxMemoryPages: 256, // 16MB
  exportedFunctions: [
    'makeDecision',
    'updateMemory',
    'processLearning',
    'batchAIUpdate',
    'initializeNeuralNet',
    'trainNetwork',
    'getDecisionProbabilities'
  ],
  importedFunctions: [
    'log',
    'getTime',
    'random',
    'sigmoid',
    'tanh'
  ]
};

/**
 * Pathfinding Module - A*, flow fields, spatial queries
 */
export const pathfindingModuleConfig: WASMModuleBuildConfig = {
  name: 'pathfinding',
  sourceLanguage: 'cpp',
  sourcePath: 'src/wasm/pathfinding/',
  outputPath: 'public/wasm/pathfinding.wasm',
  optimizationLevel: 'O3',
  features: ['simd', 'bulk-memory'],
  sharedMemory: true,
  maxMemoryPages: 64, // 4MB
  exportedFunctions: [
    'calculatePath',
    'updateFlowField',
    'findNearest',
    'batchPathfinding',
    'createNavMesh',
    'queryRadius',
    'getShortestPath'
  ],
  importedFunctions: [
    'log',
    'getTime',
    'sqrt',
    'abs'
  ]
};

/**
 * Pheromones Module - Chemical diffusion, concentration calculation
 */
export const pheromonesModuleConfig: WASMModuleBuildConfig = {
  name: 'pheromones',
  sourceLanguage: 'c',
  sourcePath: 'src/wasm/pheromones/',
  outputPath: 'public/wasm/pheromones.wasm',
  optimizationLevel: 'Os', // Size optimized
  features: ['bulk-memory'],
  sharedMemory: true,
  maxMemoryPages: 32, // 2MB
  exportedFunctions: [
    'diffuseChemicals',
    'updateConcentration', 
    'calculateGradient',
    'batchDiffusion',
    'addPheromoneSource',
    'evaporateChemicals'
  ],
  importedFunctions: [
    'log',
    'getTime',
    'exp',
    'pow'
  ]
};

/**
 * Build script generator for Emscripten (C/C++)
 */
export function generateEmscriptenBuildScript(config: WASMModuleBuildConfig): string {
  const flags = [
    `-${config.optimizationLevel}`,
    '-s WASM=1',
    '-s ALLOW_MEMORY_GROWTH=1',
    `-s INITIAL_MEMORY=${config.maxMemoryPages * 64 * 1024}`,
    '-s USE_ES6_IMPORT_META=0',
    '-s EXPORT_ES6=1',
    '-s MODULARIZE=1',
    '-s EXPORT_NAME="createModule"',
    `-s EXPORTED_FUNCTIONS="[${config.exportedFunctions.map(f => `'_${f}'`).join(',')}]"`,
    '-s EXPORTED_RUNTIME_METHODS="[\'cwrap\',\'ccall\']"'
  ];

  if (config.sharedMemory) {
    flags.push('-s USE_PTHREADS=1', '-s PTHREAD_POOL_SIZE=4', '-s SHARED_MEMORY=1');
  }

  if (config.features.includes('simd')) {
    flags.push('-msimd128');
  }

  if (config.features.includes('bulk-memory')) {
    flags.push('-s BULK_MEMORY_OPS=1');
  }

  const sourceFiles = config.sourceLanguage === 'cpp' 
    ? `${config.sourcePath}*.cpp ${config.sourcePath}*.c`
    : `${config.sourcePath}*.c`;

  return `#!/bin/bash
# Build script for ${config.name} WASM module

# Check if emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found. Please install and activate emscripten."
    exit 1
fi

# Create output directory
mkdir -p $(dirname ${config.outputPath})

# Compile to WebAssembly
emcc ${sourceFiles} \\
  ${flags.join(' \\\n  ')} \\
  -o ${config.outputPath}

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ ${config.name} module built successfully"
    echo "📁 Output: ${config.outputPath}"
    echo "📊 Size: $(du -h ${config.outputPath} | cut -f1)"
else
    echo "❌ ${config.name} module build failed"
    exit 1
fi
`;
}

/**
 * Build script generator for wasm-pack (Rust)
 */
export function generateRustBuildScript(config: WASMModuleBuildConfig): string {
  const cargoToml = `[package]
name = "${config.name}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
console_error_panic_hook = "0.1"
wee_alloc = "0.4"

[dependencies.web-sys]
version = "0.3"
features = [
  "console",
  "Performance",
  "Window",
]

[features]
default = ["console_error_panic_hook"]
`;

  const rustScript = `#!/bin/bash
# Build script for ${config.name} WASM module (Rust)

# Check if wasm-pack is available
if ! command -v wasm-pack &> /dev/null; then
    echo "Error: wasm-pack not found. Please install wasm-pack."
    exit 1
fi

# Navigate to source directory
cd ${config.sourcePath}

# Create Cargo.toml if it doesn't exist
if [ ! -f Cargo.toml ]; then
    cat > Cargo.toml << EOF
${cargoToml}
EOF
fi

# Build with wasm-pack
wasm-pack build --target web --${config.optimizationLevel.toLowerCase()} \\
  --out-dir ../../public/wasm/

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ ${config.name} module built successfully"
    echo "📁 Output: ${config.outputPath}"
    echo "📊 Size: $(du -h ${config.outputPath} | cut -f1)"
else
    echo "❌ ${config.name} module build failed"
    exit 1
fi
`;

  return rustScript;
}

/**
 * Generate complete build system
 */
export function generateBuildSystem(): {
  buildAllScript: string;
  packageJson: object;
  dockerFile: string;
} {
  const modules = [physicsModuleConfig, aiModuleConfig, pathfindingModuleConfig, pheromonesModuleConfig];

  const buildAllScript = `#!/bin/bash
# Build all WASM modules

echo "🚀 Building WebAssembly modules..."

# Create output directories
mkdir -p public/wasm

# Track build results
FAILED_BUILDS=()

${modules.map(config => {
    const scriptGenerator = config.sourceLanguage === 'rust' 
      ? generateRustBuildScript 
      : generateEmscriptenBuildScript;
    
    return `
# Build ${config.name} module
echo "Building ${config.name}..."
${scriptGenerator(config).split('\n').slice(5).join('\n')}

if [ $? -ne 0 ]; then
    FAILED_BUILDS+=(${config.name})
fi
`;
  }).join('\n')}

# Report results
echo ""
echo "📋 Build Summary:"
if [ \${#FAILED_BUILDS[@]} -eq 0 ]; then
    echo "✅ All modules built successfully!"
else
    echo "❌ Failed builds: \${FAILED_BUILDS[*]}"
    exit 1
fi

echo ""
echo "📊 Module sizes:"
for wasm_file in public/wasm/*.wasm; do
    if [ -f "$wasm_file" ]; then
        echo "  $(basename $wasm_file): $(du -h $wasm_file | cut -f1)"
    fi
done
`;

  const packageJson = {
    scripts: {
      "build:wasm": "./scripts/build-wasm.sh",
      "build:wasm:physics": "./scripts/build-physics.sh",
      "build:wasm:ai": "./scripts/build-ai.sh", 
      "build:wasm:pathfinding": "./scripts/build-pathfinding.sh",
      "build:wasm:pheromones": "./scripts/build-pheromones.sh",
      "clean:wasm": "rm -rf public/wasm/*.wasm",
      "dev": "npm run build:wasm && npm run electron:dev"
    },
    devDependencies: {
      "emscripten": "^3.1.0"
    }
  };

  const dockerFile = `# WebAssembly Build Environment
FROM emscripten/emsdk:latest

# Install Rust for AI module
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:\${PATH}"
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack

# Install build tools
RUN apt-get update && apt-get install -y \\
    cmake \\
    make \\
    ninja-build \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Copy source files
COPY src/wasm/ src/wasm/
COPY scripts/ scripts/

# Make scripts executable
RUN chmod +x scripts/*.sh

# Build all modules
CMD ["./scripts/build-wasm.sh"]
`;

  return {
    buildAllScript,
    packageJson,
    dockerFile
  };
}

/**
 * Generate TypeScript definitions for WASM modules
 */
export function generateWASMTypeDefinitions(): string {
  return `// WebAssembly Module Type Definitions
// Auto-generated from WASM build configuration

declare namespace WASMModules {
  interface PhysicsModule {
    updateCollisions(antIds: number, deltaTime: number): number;
    calculateForces(antIds: number, count: number): void;
    integrateMotion(antIds: number, count: number, deltaTime: number): void;
    processBatch(antIds: number, count: number, deltaTime: number, forceMultiplier: number): number;
    setGravity(x: number, y: number, z: number): void;
    addCollider(id: number, x: number, y: number, z: number, radius: number): void;
    removeCollider(id: number): void;
  }

  interface AIModule {
    makeDecision(antId: number, context: number): number;
    updateMemory(antId: number, experience: number): void;
    processLearning(antId: number, reward: number): void;
    batchAIUpdate(antIds: number, count: number, contextData: number, environmentData: number): number;
    initializeNeuralNet(antId: number, layers: number): void;
    trainNetwork(antId: number, inputs: number, outputs: number): void;
    getDecisionProbabilities(antId: number, output: number): void;
  }

  interface PathfindingModule {
    calculatePath(startX: number, startY: number, endX: number, endY: number): number;
    updateFlowField(targetX: number, targetY: number, width: number, height: number): void;
    findNearest(x: number, y: number, type: number): number;
    batchPathfinding(antIds: number, count: number, targets: number, obstacles: number): number;
    createNavMesh(vertices: number, vertexCount: number, triangles: number, triangleCount: number): void;
    queryRadius(x: number, y: number, radius: number, results: number): number;
    getShortestPath(startId: number, endId: number, path: number): number;
  }

  interface PheromonesModule {
    diffuseChemicals(gridWidth: number, gridHeight: number, deltaTime: number): void;
    updateConcentration(x: number, y: number, type: number, amount: number): void;
    calculateGradient(x: number, y: number, type: number, gradient: number): void;
    batchDiffusion(gridWidth: number, gridHeight: number, deltaTime: number, diffusionRate: number): void;
    addPheromoneSource(x: number, y: number, type: number, intensity: number): void;
    evaporateChemicals(deltaTime: number, evaporationRate: number): void;
  }

  interface WASMInstance {
    physics?: PhysicsModule;
    ai?: AIModule;
    pathfinding?: PathfindingModule;
    pheromones?: PheromonesModule;
  }
}

export { WASMModules };
`;
}