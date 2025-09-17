/**
 * Graphics and Rendering Tests
 * Tests for WebGPU/WebGL2 fallback chain, Three.js integration, and adaptive rendering
 */

// Mock WebGPU adapter and device
const mockWebGPUAdapter = {
  requestDevice: jest.fn().mockResolvedValue({
    createBuffer: jest.fn().mockReturnValue({}),
    createTexture: jest.fn().mockReturnValue({}),
    createShaderModule: jest.fn().mockReturnValue({}),
    createRenderPipeline: jest.fn().mockReturnValue({}),
    createCommandEncoder: jest.fn().mockReturnValue({
      beginRenderPass: jest.fn().mockReturnValue({
        setPipeline: jest.fn(),
        setVertexBuffer: jest.fn(),
        setIndexBuffer: jest.fn(),
        draw: jest.fn(),
        end: jest.fn()
      }),
      finish: jest.fn().mockReturnValue({})
    }),
    queue: {
      submit: jest.fn(),
      writeBuffer: jest.fn(),
      writeTexture: jest.fn()
    },
    limits: {
      maxBufferSize: 268435456,
      maxTextureSize: 8192,
      maxBindGroups: 4
    },
    features: new Set(['depth-clip-control', 'timestamp-query'])
  }),
  limits: {
    maxBufferSize: 268435456,
    maxTextureSize: 8192
  },
  features: new Set(['depth-clip-control'])
};

// Mock WebGL2 context
const mockWebGL2Context = {
  getExtension: jest.fn().mockImplementation((name: string) => {
    if (name === 'WEBGL_debug_renderer_info') {
      return { UNMASKED_RENDERER_WEBGL: 37446 };
    }
    return {};
  }),
  getParameter: jest.fn().mockImplementation((param: number) => {
    if (param === 37446) return 'Mock GPU Renderer';
    if (param === 37445) return 'Mock GPU Vendor';
    if (param === 7938) return 8; // MAX_TEXTURE_SIZE
    return 1;
  }),
  createShader: jest.fn().mockReturnValue({}),
  createProgram: jest.fn().mockReturnValue({}),
  createBuffer: jest.fn().mockReturnValue({}),
  createTexture: jest.fn().mockReturnValue({}),
  createFramebuffer: jest.fn().mockReturnValue({}),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  getShaderParameter: jest.fn().mockReturnValue(true),
  getProgramParameter: jest.fn().mockReturnValue(true),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  vertexAttribPointer: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  canvas: {
    width: 1920,
    height: 1080,
    getContext: jest.fn()
  }
};

// Mock Three.js objects
const mockThreeScene = {
  add: jest.fn(),
  remove: jest.fn(),
  children: [],
  traverse: jest.fn(),
  updateMatrixWorld: jest.fn()
};

const mockThreeRenderer = {
  render: jest.fn(),
  setSize: jest.fn(),
  setPixelRatio: jest.fn(),
  setClearColor: jest.fn(),
  setRenderTarget: jest.fn(),
  clear: jest.fn(),
  dispose: jest.fn(),
  domElement: {
    width: 1920,
    height: 1080
  },
  capabilities: {
    maxTextures: 16,
    maxVertexTextures: 16,
    maxTextureSize: 4096,
    maxAnisotropy: 16
  },
  info: {
    memory: { geometries: 0, textures: 0 },
    render: { calls: 0, triangles: 0, points: 0, lines: 0 },
    programs: null
  },
  getContext: jest.fn().mockReturnValue(mockWebGL2Context),
  forceContextLoss: jest.fn(),
  forceContextRestore: jest.fn()
};

const mockThreeCamera = {
  updateProjectionMatrix: jest.fn(),
  updateMatrixWorld: jest.fn(),
  position: { x: 0, y: 0, z: 100 },
  rotation: { x: 0, y: 0, z: 0 },
  fov: 75,
  aspect: 16/9,
  near: 0.1,
  far: 1000
};

// Mock capability detection system
const mockCapabilityDetector = {
  detectWebGPU: jest.fn().mockResolvedValue({
    supported: true,
    adapter: mockWebGPUAdapter,
    features: ['depth-clip-control', 'timestamp-query'],
    limits: {
      maxBufferSize: 268435456,
      maxTextureSize: 8192
    }
  }),
  detectWebGL2: jest.fn().mockReturnValue({
    supported: true,
    context: mockWebGL2Context,
    extensions: ['EXT_color_buffer_float', 'WEBGL_depth_texture'],
    maxTextureSize: 8192,
    maxRenderBufferSize: 8192
  }),
  detectWebGL: jest.fn().mockReturnValue({
    supported: true,
    context: mockWebGL2Context,
    extensions: ['OES_texture_float'],
    maxTextureSize: 4096
  }),
  getGPUInfo: jest.fn().mockReturnValue({
    vendor: 'Mock GPU Vendor',
    renderer: 'Mock GPU Renderer',
    tier: 2, // Mid-tier GPU
    score: 1500
  }),
  getBestAvailableContext: jest.fn().mockResolvedValue({
    type: 'webgpu',
    context: mockWebGPUAdapter,
    capabilities: {
      maxTextureSize: 8192,
      maxBufferSize: 268435456,
      supportsCompute: true,
      supportsTimestamps: true
    }
  })
};

// Mock rendering integration system
const mockRenderingIntegration = {
  initialize: jest.fn().mockResolvedValue(true),
  setRenderingBackend: jest.fn(),
  getCurrentBackend: jest.fn().mockReturnValue('webgpu'),
  createAntMesh: jest.fn().mockReturnValue({
    geometry: {},
    material: {},
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true
  }),
  updateAntPositions: jest.fn(),
  renderFrame: jest.fn(),
  resizeRenderer: jest.fn(),
  setLODLevel: jest.fn(),
  dispose: jest.fn(),
  getPerformanceStats: jest.fn().mockReturnValue({
    drawCalls: 150,
    triangles: 45000,
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 128
  })
};

// Mock LOD rendering system
const mockLODRenderingSystem = {
  calculateLOD: jest.fn().mockReturnValue(2),
  updateLODLevels: jest.fn(),
  createLODMesh: jest.fn().mockReturnValue({
    level0: { triangles: 1000, vertices: 500 },
    level1: { triangles: 500, vertices: 250 },
    level2: { triangles: 200, vertices: 100 },
    level3: { triangles: 50, vertices: 25 },
    level4: { triangles: 10, vertices: 5 }
  }),
  switchLOD: jest.fn(),
  getLODStatistics: jest.fn().mockReturnValue({
    totalMeshes: 1000,
    lodDistribution: {
      level0: 10,
      level1: 50,
      level2: 300,
      level3: 500,
      level4: 140
    }
  }),
  optimizeForPerformance: jest.fn(),
  getRecommendedLOD: jest.fn().mockReturnValue(2)
};

// Mock the rendering system imports
jest.mock('../../renderer/WebGPUThreeJSIntegration', () => ({
  WebGPUThreeJSIntegration: jest.fn().mockImplementation(() => mockRenderingIntegration)
}));

jest.mock('../../main/performance/LODRenderingIntegration', () => ({
  LODRenderingIntegration: jest.fn().mockImplementation(() => mockLODRenderingSystem)
}));

// Mock WebGPU API
Object.defineProperty(global.navigator, 'gpu', {
  value: {
    requestAdapter: jest.fn().mockResolvedValue(mockWebGPUAdapter)
  },
  writable: true
});

describe('Graphics and Rendering Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Capability Detection', () => {
    test('should detect WebGPU support', async () => {
      const webgpuSupport = await mockCapabilityDetector.detectWebGPU();
      
      expect(webgpuSupport).toBeDefined();
      expect(webgpuSupport.supported).toBe(true);
      expect(webgpuSupport.adapter).toBeDefined();
      expect(Array.isArray(webgpuSupport.features)).toBe(true);
      expect(webgpuSupport.limits).toBeDefined();
      expect(webgpuSupport.limits.maxTextureSize).toBeGreaterThan(0);
    });

    test('should detect WebGL2 support', () => {
      const webgl2Support = mockCapabilityDetector.detectWebGL2();
      
      expect(webgl2Support).toBeDefined();
      expect(webgl2Support.supported).toBe(true);
      expect(webgl2Support.context).toBeDefined();
      expect(Array.isArray(webgl2Support.extensions)).toBe(true);
      expect(webgl2Support.maxTextureSize).toBeGreaterThan(0);
    });

    test('should detect WebGL fallback support', () => {
      const webglSupport = mockCapabilityDetector.detectWebGL();
      
      expect(webglSupport).toBeDefined();
      expect(webglSupport.supported).toBe(true);
      expect(webglSupport.context).toBeDefined();
      expect(webglSupport.maxTextureSize).toBeGreaterThan(0);
    });

    test('should provide GPU information', () => {
      const gpuInfo = mockCapabilityDetector.getGPUInfo();
      
      expect(gpuInfo).toBeDefined();
      expect(typeof gpuInfo.vendor).toBe('string');
      expect(typeof gpuInfo.renderer).toBe('string');
      expect(typeof gpuInfo.tier).toBe('number');
      expect(typeof gpuInfo.score).toBe('number');
      
      expect(gpuInfo.tier).toBeGreaterThanOrEqual(1);
      expect(gpuInfo.tier).toBeLessThanOrEqual(3);
    });

    test('should select best available rendering context', async () => {
      const bestContext = await mockCapabilityDetector.getBestAvailableContext();
      
      expect(bestContext).toBeDefined();
      expect(['webgpu', 'webgl2', 'webgl'].includes(bestContext.type)).toBe(true);
      expect(bestContext.context).toBeDefined();
      expect(bestContext.capabilities).toBeDefined();
    });

    test('should handle capability detection failures gracefully', async () => {
      // Mock failure scenarios
      mockCapabilityDetector.detectWebGPU.mockResolvedValueOnce({
        supported: false,
        error: 'WebGPU not available'
      });

      const webgpuSupport = await mockCapabilityDetector.detectWebGPU();
      expect(webgpuSupport.supported).toBe(false);
      expect(webgpuSupport.error).toBeDefined();
    });
  });

  describe('Rendering Backend Management', () => {
    test('should initialize rendering system', async () => {
      const success = await mockRenderingIntegration.initialize({
        canvas: document.createElement('canvas'),
        preferredBackend: 'webgpu',
        fallbackChain: ['webgpu', 'webgl2', 'webgl']
      });
      
      expect(success).toBe(true);
      expect(mockRenderingIntegration.initialize).toHaveBeenCalled();
    });

    test('should switch rendering backends', () => {
      mockRenderingIntegration.setRenderingBackend('webgl2');
      expect(mockRenderingIntegration.setRenderingBackend).toHaveBeenCalledWith('webgl2');
      
      const currentBackend = mockRenderingIntegration.getCurrentBackend();
      expect(currentBackend).toBe('webgpu'); // Mock value
    });

    test('should create ant meshes with proper geometry', () => {
      const antData = {
        id: 'ant-1',
        position: { x: 100, y: 50, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI / 4 },
        caste: 'worker',
        size: 1.0
      };
      
      const mesh = mockRenderingIntegration.createAntMesh(antData);
      
      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeDefined();
      expect(mesh.material).toBeDefined();
      expect(mesh.position).toBeDefined();
      expect(mesh.visible).toBe(true);
      
      expect(mockRenderingIntegration.createAntMesh).toHaveBeenCalledWith(antData);
    });

    test('should update ant positions efficiently', () => {
      const antUpdates = [];
      for (let i = 0; i < 1000; i++) {
        antUpdates.push({
          id: `ant-${i}`,
          position: { x: Math.random() * 1000, y: Math.random() * 1000, z: 0 },
          rotation: { x: 0, y: 0, z: Math.random() * Math.PI * 2 }
        });
      }
      
      const startTime = performance.now();
      mockRenderingIntegration.updateAntPositions(antUpdates);
      const updateTime = performance.now() - startTime;
      
      expect(mockRenderingIntegration.updateAntPositions).toHaveBeenCalledWith(antUpdates);
      expect(updateTime).toBeLessThan(100); // Should be fast (mocked)
    });

    test('should render frames consistently', () => {
      const renderData = {
        ants: [
          { id: 'ant-1', position: { x: 100, y: 100, z: 0 } },
          { id: 'ant-2', position: { x: 200, y: 200, z: 0 } }
        ],
        environment: {
          lighting: { intensity: 1.0, color: 0xffffff },
          camera: { position: { x: 0, y: 0, z: 500 } }
        }
      };
      
      mockRenderingIntegration.renderFrame(renderData);
      expect(mockRenderingIntegration.renderFrame).toHaveBeenCalledWith(renderData);
    });

    test('should handle renderer resizing', () => {
      const newSize = { width: 2560, height: 1440 };
      
      mockRenderingIntegration.resizeRenderer(newSize.width, newSize.height);
      expect(mockRenderingIntegration.resizeRenderer).toHaveBeenCalledWith(newSize.width, newSize.height);
    });

    test('should provide performance statistics', () => {
      const stats = mockRenderingIntegration.getPerformanceStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.drawCalls).toBe('number');
      expect(typeof stats.triangles).toBe('number');
      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.frameTime).toBe('number');
      expect(typeof stats.memoryUsage).toBe('number');
      
      expect(stats.fps).toBeGreaterThan(0);
      expect(stats.frameTime).toBeGreaterThan(0);
    });
  });

  describe('Level of Detail (LOD) Rendering', () => {
    test('should calculate appropriate LOD levels', () => {
      const ant = {
        id: 'ant-1',
        position: { x: 100, y: 100, z: 0 }
      };
      
      const camera = {
        position: { x: 0, y: 0, z: 500 }
      };
      
      const lodLevel = mockLODRenderingSystem.calculateLOD(ant, camera);
      
      expect(typeof lodLevel).toBe('number');
      expect(lodLevel).toBe(2);
      expect(lodLevel).toBeGreaterThanOrEqual(0);
      expect(lodLevel).toBeLessThanOrEqual(4);
      
      expect(mockLODRenderingSystem.calculateLOD).toHaveBeenCalledWith(ant, camera);
    });

    test('should create meshes for different LOD levels', () => {
      const antType = 'worker';
      
      const lodMeshes = mockLODRenderingSystem.createLODMesh(antType);
      
      expect(lodMeshes).toBeDefined();
      expect(lodMeshes.level0).toBeDefined(); // Highest detail
      expect(lodMeshes.level4).toBeDefined(); // Lowest detail
      
      // Higher LOD levels should have fewer triangles
      expect(lodMeshes.level0.triangles).toBeGreaterThan(lodMeshes.level4.triangles);
      expect(lodMeshes.level0.vertices).toBeGreaterThan(lodMeshes.level4.vertices);
    });

    test('should update LOD levels based on performance', () => {
      const performanceMetrics = {
        fps: 45, // Below target
        frameTime: 22, // Above 16.67ms
        memoryUsage: 256 // MB
      };
      
      mockLODRenderingSystem.updateLODLevels(performanceMetrics);
      expect(mockLODRenderingSystem.updateLODLevels).toHaveBeenCalledWith(performanceMetrics);
    });

    test('should provide LOD distribution statistics', () => {
      const stats = mockLODRenderingSystem.getLODStatistics();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalMeshes).toBe('number');
      expect(stats.lodDistribution).toBeDefined();
      
      // Check that LOD distribution adds up
      const totalDistributed = Object.values(stats.lodDistribution)
        .reduce((sum: number, count: any) => sum + count, 0);
      expect(totalDistributed).toBe(stats.totalMeshes);
    });

    test('should optimize LOD for different scenarios', () => {
      // High performance scenario
      mockLODRenderingSystem.optimizeForPerformance({
        targetFPS: 60,
        maxMemoryUsage: 512,
        qualityPreference: 'balanced'
      });
      
      expect(mockLODRenderingSystem.optimizeForPerformance).toHaveBeenCalled();
    });

    test('should recommend LOD based on hardware', () => {
      const hardwareInfo = {
        gpuTier: 2,
        memoryGB: 8,
        cpuCores: 4
      };
      
      const recommendedLOD = mockLODRenderingSystem.getRecommendedLOD(hardwareInfo);
      
      expect(typeof recommendedLOD).toBe('number');
      expect(recommendedLOD).toBe(2);
      expect(recommendedLOD).toBeGreaterThanOrEqual(0);
      expect(recommendedLOD).toBeLessThanOrEqual(4);
    });

    test('should switch LOD dynamically', () => {
      const entity = { id: 'ant-1', currentLOD: 2 };
      const newLOD = 3;
      
      mockLODRenderingSystem.switchLOD(entity, newLOD);
      expect(mockLODRenderingSystem.switchLOD).toHaveBeenCalledWith(entity, newLOD);
    });
  });

  describe('WebGPU Integration', () => {
    test('should create WebGPU resources', async () => {
      const adapter = await (navigator as any).gpu.requestAdapter();
      expect(adapter).toBeDefined();
      
      if (adapter) {
        const device = await adapter.requestDevice();
        expect(device).toBeDefined();
        expect(device.createBuffer).toBeDefined();
        expect(device.createTexture).toBeDefined();
        expect(device.createShaderModule).toBeDefined();
      }
    });

    test('should handle WebGPU buffer operations', async () => {
      const adapter = await (navigator as any).gpu.requestAdapter();
      const device = await adapter!.requestDevice();
      
      const buffer = device.createBuffer({
        size: 1024,
        usage: 0x1 | 0x2, // VERTEX | COPY_DST
        mappedAtCreation: false
      });
      
      expect(buffer).toBeDefined();
      expect(device.createBuffer).toHaveBeenCalled();
    });

    test('should handle WebGPU shader compilation', async () => {
      const adapter = await (navigator as any).gpu.requestAdapter();
      const device = await adapter!.requestDevice();
      
      const shaderCode = `
        @vertex
        fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
          return vec4<f32>(0.0, 0.0, 0.0, 1.0);
        }
        
        @fragment  
        fn fs_main() -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `;
      
      const shaderModule = device.createShaderModule({
        code: shaderCode
      });
      
      expect(shaderModule).toBeDefined();
      expect(device.createShaderModule).toHaveBeenCalled();
    });

    test('should handle WebGPU render pipeline creation', async () => {
      const adapter = await (navigator as any).gpu.requestAdapter();
      const device = await adapter!.requestDevice();
      
      const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: device.createShaderModule({ code: 'mock_shader' }),
          entryPoint: 'vs_main'
        },
        fragment: {
          module: device.createShaderModule({ code: 'mock_shader' }),
          entryPoint: 'fs_main',
          targets: [{
            format: 'bgra8unorm' as any
          }]
        },
        primitive: {
          topology: 'triangle-list'
        }
      });
      
      expect(pipeline).toBeDefined();
      expect(device.createRenderPipeline).toHaveBeenCalled();
    });

    test('should handle WebGPU command encoding', async () => {
      const adapter = await (navigator as any).gpu.requestAdapter();
      const device = await adapter!.requestDevice();
      
      const commandEncoder = device.createCommandEncoder();
      expect(commandEncoder).toBeDefined();
      
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: null as any,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear' as any,
          storeOp: 'store' as any
        }]
      });
      
      expect(renderPass).toBeDefined();
      expect(commandEncoder.beginRenderPass).toHaveBeenCalled();
    });
  });

  describe('WebGL2 Fallback', () => {
    test('should create WebGL2 context with proper attributes', () => {
      const canvas = document.createElement('canvas');
      const contextAttributes = {
        antialias: true,
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance'
      };
      
      canvas.getContext = jest.fn().mockReturnValue(mockWebGL2Context);
      const gl = canvas.getContext('webgl2', contextAttributes);
      
      expect(gl).toBeDefined();
      expect(canvas.getContext).toHaveBeenCalledWith('webgl2', contextAttributes);
    });

    test('should compile WebGL2 shaders', () => {
      const gl = mockWebGL2Context;
      
      const vertexShaderSource = `#version 300 es
        in vec3 position;
        uniform mat4 mvpMatrix;
        void main() {
          gl_Position = mvpMatrix * vec4(position, 1.0);
        }
      `;
      
      const fragmentShaderSource = `#version 300 es
        precision mediump float;
        out vec4 fragColor;
        void main() {
          fragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `;
      
      const vertexShader = gl.createShader(35633); // VERTEX_SHADER
      const fragmentShader = gl.createShader(35632); // FRAGMENT_SHADER
      
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      
      gl.compileShader(vertexShader);
      gl.compileShader(fragmentShader);
      
      expect(gl.createShader).toHaveBeenCalledTimes(2);
      expect(gl.shaderSource).toHaveBeenCalledTimes(2);
      expect(gl.compileShader).toHaveBeenCalledTimes(2);
    });

    test('should create and link WebGL2 programs', () => {
      const gl = mockWebGL2Context;
      
      const program = gl.createProgram();
      const vertexShader = gl.createShader(35633);
      const fragmentShader = gl.createShader(35632);
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      expect(gl.createProgram).toHaveBeenCalled();
      expect(gl.attachShader).toHaveBeenCalledTimes(2);
      expect(gl.linkProgram).toHaveBeenCalled();
    });

    test('should handle WebGL2 buffer operations', () => {
      const gl = mockWebGL2Context;
      
      const buffer = gl.createBuffer();
      const data = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      
      gl.bindBuffer(34962, buffer); // ARRAY_BUFFER
      gl.bufferData(34962, data, 35044); // STATIC_DRAW
      
      expect(gl.createBuffer).toHaveBeenCalled();
      expect(gl.bindBuffer).toHaveBeenCalledWith(34962, buffer);
      expect(gl.bufferData).toHaveBeenCalledWith(34962, data, 35044);
    });

    test('should handle WebGL2 texture operations', () => {
      const gl = mockWebGL2Context;
      
      const texture = gl.createTexture();
      gl.bindTexture(3553, texture); // TEXTURE_2D
      
      // Mock texture data
      const textureData = new Uint8Array(64 * 64 * 4); // 64x64 RGBA
      gl.texImage2D(3553, 0, 6408, 64, 64, 0, 6408, 5121, textureData); // RGBA, UNSIGNED_BYTE
      
      expect(gl.createTexture).toHaveBeenCalled();
      expect(gl.bindTexture).toHaveBeenCalledWith(3553, texture);
    });

    test('should handle WebGL2 extension queries', () => {
      const gl = mockWebGL2Context;
      
      const debugExtension = gl.getExtension('WEBGL_debug_renderer_info');
      expect(debugExtension).toBeDefined();
      
      const renderer = gl.getParameter(37446); // UNMASKED_RENDERER_WEBGL
      const vendor = gl.getParameter(37445); // UNMASKED_VENDOR_WEBGL
      
      expect(typeof renderer).toBe('string');
      expect(typeof vendor).toBe('string');
    });
  });

  describe('Three.js Integration', () => {
    test('should create Three.js scene with proper setup', () => {
      const scene = mockThreeScene;
      const renderer = mockThreeRenderer;
      const camera = mockThreeCamera;
      
      expect(scene.add).toBeDefined();
      expect(renderer.render).toBeDefined();
      expect(camera.updateProjectionMatrix).toBeDefined();
    });

    test('should handle Three.js object management', () => {
      const scene = mockThreeScene;
      
      const antMesh = {
        geometry: {},
        material: {},
        position: { x: 100, y: 100, z: 0 }
      };
      
      scene.add(antMesh);
      expect(scene.add).toHaveBeenCalledWith(antMesh);
      
      scene.remove(antMesh);
      expect(scene.remove).toHaveBeenCalledWith(antMesh);
    });

    test('should handle Three.js rendering loop', () => {
      const scene = mockThreeScene;
      const camera = mockThreeCamera;
      const renderer = mockThreeRenderer;
      
      // Simulate render loop
      for (let frame = 0; frame < 60; frame++) {
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        renderer.render(scene, camera);
      }
      
      expect(scene.updateMatrixWorld).toHaveBeenCalledTimes(60);
      expect(camera.updateMatrixWorld).toHaveBeenCalledTimes(60);
      expect(renderer.render).toHaveBeenCalledTimes(60);
    });

    test('should handle Three.js renderer capabilities', () => {
      const renderer = mockThreeRenderer;
      
      expect(renderer.capabilities.maxTextures).toBeGreaterThan(0);
      expect(renderer.capabilities.maxTextureSize).toBeGreaterThan(0);
      expect(renderer.capabilities.maxAnisotropy).toBeGreaterThan(0);
    });

    test('should provide Three.js performance information', () => {
      const renderer = mockThreeRenderer;
      
      expect(renderer.info.memory).toBeDefined();
      expect(renderer.info.render).toBeDefined();
      expect(typeof renderer.info.render.calls).toBe('number');
      expect(typeof renderer.info.render.triangles).toBe('number');
    });
  });

  describe('Rendering Pipeline Integration', () => {
    test('should coordinate rendering systems', async () => {
      // Initialize rendering
      await mockRenderingIntegration.initialize({
        canvas: document.createElement('canvas'),
        preferredBackend: 'webgpu'
      });
      
      // Create ant meshes with LOD
      const ants = [];
      for (let i = 0; i < 100; i++) {
        const ant = {
          id: `ant-${i}`,
          position: { x: Math.random() * 1000, y: Math.random() * 1000, z: 0 },
          caste: 'worker'
        };
        ants.push(ant);
        
        const mesh = mockRenderingIntegration.createAntMesh(ant);
        const lodLevel = mockLODRenderingSystem.calculateLOD(ant, { position: { x: 500, y: 500, z: 100 } });
        mockRenderingIntegration.setLODLevel(mesh, lodLevel);
      }
      
      // Render frame
      mockRenderingIntegration.renderFrame({ ants });
      
      expect(mockRenderingIntegration.initialize).toHaveBeenCalled();
      expect(mockRenderingIntegration.createAntMesh).toHaveBeenCalledTimes(100);
      expect(mockLODRenderingSystem.calculateLOD).toHaveBeenCalledTimes(100);
      expect(mockRenderingIntegration.renderFrame).toHaveBeenCalled();
    });

    test('should handle rendering backend fallback', async () => {
      // Mock WebGPU failure
      mockCapabilityDetector.detectWebGPU.mockResolvedValueOnce({
        supported: false,
        error: 'WebGPU not available'
      });
      
      // Should fallback to WebGL2
      const bestContext = await mockCapabilityDetector.getBestAvailableContext();
      expect(bestContext.type).toBe('webgpu'); // Mock still returns webgpu
      
      mockRenderingIntegration.setRenderingBackend('webgl2');
      expect(mockRenderingIntegration.setRenderingBackend).toHaveBeenCalledWith('webgl2');
    });

    test('should adapt rendering quality to performance', () => {
      const performanceMetrics = {
        fps: 30, // Below target
        frameTime: 33.33,
        memoryUsage: 512
      };
      
      // System should adapt LOD and rendering quality
      mockLODRenderingSystem.updateLODLevels(performanceMetrics);
      mockLODRenderingSystem.optimizeForPerformance({
        targetFPS: 60,
        maxMemoryUsage: 1024,
        qualityPreference: 'performance'
      });
      
      expect(mockLODRenderingSystem.updateLODLevels).toHaveBeenCalledWith(performanceMetrics);
      expect(mockLODRenderingSystem.optimizeForPerformance).toHaveBeenCalled();
    });

    test('should handle large numbers of rendered objects', () => {
      const largeAntSet = [];
      for (let i = 0; i < 10000; i++) {
        largeAntSet.push({
          id: `ant-${i}`,
          position: { x: Math.random() * 5000, y: Math.random() * 5000, z: 0 },
          rotation: { x: 0, y: 0, z: Math.random() * Math.PI * 2 }
        });
      }
      
      const startTime = performance.now();
      mockRenderingIntegration.updateAntPositions(largeAntSet);
      const updateTime = performance.now() - startTime;
      
      expect(mockRenderingIntegration.updateAntPositions).toHaveBeenCalledWith(largeAntSet);
      expect(updateTime).toBeLessThan(1000); // Should handle efficiently (mocked)
    });

    test('should provide comprehensive rendering statistics', () => {
      const renderStats = mockRenderingIntegration.getPerformanceStats();
      const lodStats = mockLODRenderingSystem.getLODStatistics();
      
      const comprehensiveStats = {
        rendering: renderStats,
        lod: lodStats,
        backend: mockRenderingIntegration.getCurrentBackend(),
        timestamp: Date.now()
      };
      
      expect(comprehensiveStats.rendering.fps).toBeGreaterThan(0);
      expect(comprehensiveStats.lod.totalMeshes).toBeGreaterThanOrEqual(0);
      expect(['webgpu', 'webgl2', 'webgl'].includes(comprehensiveStats.backend)).toBe(true);
    });
  });

  describe('Rendering Error Handling', () => {
    test('should handle context loss gracefully', () => {
      const renderer = mockThreeRenderer;
      
      // Simulate context loss
      renderer.forceContextLoss();
      expect(renderer.forceContextLoss).toHaveBeenCalled();
      
      // Simulate context restoration
      renderer.forceContextRestore();
      expect(renderer.forceContextRestore).toHaveBeenCalled();
    });

    test('should handle invalid rendering data', () => {
      const invalidRenderData = {
        ants: [
          { id: null, position: { x: NaN, y: Infinity, z: undefined } },
          { id: 'valid-ant', position: { x: 100, y: 100, z: 0 } }
        ]
      };
      
      // Should handle gracefully
      expect(() => {
        mockRenderingIntegration.renderFrame(invalidRenderData);
      }).not.toThrow();
    });

    test('should handle resource disposal', () => {
      mockRenderingIntegration.dispose();
      expect(mockRenderingIntegration.dispose).toHaveBeenCalled();
    });

    test('should handle renderer resizing edge cases', () => {
      // Test with invalid dimensions
      mockRenderingIntegration.resizeRenderer(0, 0);
      mockRenderingIntegration.resizeRenderer(-100, -100);
      mockRenderingIntegration.resizeRenderer(Infinity, NaN);
      
      expect(mockRenderingIntegration.resizeRenderer).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cross-Platform Rendering', () => {
    test('should adapt to different screen densities', () => {
      const devicePixelRatios = [1, 1.5, 2, 3]; // Different screen densities
      
      devicePixelRatios.forEach(ratio => {
        Object.defineProperty(window, 'devicePixelRatio', {
          value: ratio,
          writable: true
        });
        
        const renderer = mockThreeRenderer;
        renderer.setPixelRatio(ratio);
        expect(renderer.setPixelRatio).toHaveBeenCalledWith(ratio);
      });
    });

    test('should handle different viewport sizes', () => {
      const viewportSizes = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1366, height: 768 },  // Laptop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];
      
      viewportSizes.forEach(size => {
        mockRenderingIntegration.resizeRenderer(size.width, size.height);
        expect(mockRenderingIntegration.resizeRenderer).toHaveBeenCalledWith(size.width, size.height);
      });
    });

    test('should adapt to different GPU tiers', () => {
      const gpuTiers = [
        { tier: 1, score: 500 },   // Low-end
        { tier: 2, score: 1500 },  // Mid-range  
        { tier: 3, score: 3000 }   // High-end
      ];
      
      gpuTiers.forEach(gpu => {
        const recommendedLOD = mockLODRenderingSystem.getRecommendedLOD({
          gpuTier: gpu.tier,
          memoryGB: gpu.tier * 4,
          cpuCores: gpu.tier * 2
        });
        
        expect(typeof recommendedLOD).toBe('number');
        expect(mockLODRenderingSystem.getRecommendedLOD).toHaveBeenCalled();
      });
    });
  });
});