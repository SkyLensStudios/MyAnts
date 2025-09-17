/**
 * Jest Test Setup
 * Global test configuration and mocks for MyAnts simulation
 */

// Mock Electron APIs for testing
const mockElectronAPI = {
  simulation: {
    start: jest.fn().mockResolvedValue(true),
    pause: jest.fn().mockResolvedValue(true),
    reset: jest.fn().mockResolvedValue(true),
    configure: jest.fn().mockResolvedValue(true),
    setSpeed: jest.fn()
  },
  data: {
    getSimulationState: jest.fn().mockResolvedValue({
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      totalAnts: 0
    }),
    getAntData: jest.fn().mockResolvedValue([]),
    getPheromoneData: jest.fn().mockResolvedValue([]),
    getEnvironmentData: jest.fn().mockResolvedValue({}),
    getPerformanceStats: jest.fn().mockResolvedValue({})
  },
  file: {
    saveSimulation: jest.fn().mockResolvedValue(true),
    loadSimulation: jest.fn().mockResolvedValue({}),
    exportData: jest.fn().mockResolvedValue(true)
  }
};

// Setup global electron API mock
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

// Mock WebGPU for testing
Object.defineProperty(navigator, 'gpu', {
  value: {
    requestAdapter: jest.fn().mockResolvedValue(null)
  },
  writable: true
});

// Mock WebGL context
const mockWebGLContext = {
  canvas: {},
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  getParameter: jest.fn(),
  getExtension: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  getAttribLocation: jest.fn(),
  getUniformLocation: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createTexture: jest.fn(),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  createFramebuffer: jest.fn(),
  bindFramebuffer: jest.fn(),
  framebufferTexture2D: jest.fn(),
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn()
};

// Mock canvas getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext;
(HTMLCanvasElement.prototype.getContext as any) = jest.fn((contextType: string) => {
  if (contextType === 'webgl2' || contextType === 'webgl') {
    return mockWebGLContext;
  }
  return originalGetContext.call(this, contextType);
});

// Mock performance.now for consistent timing in tests
const originalPerformanceNow = performance.now;
let mockTime = 0;
performance.now = jest.fn(() => mockTime);

// Helper to advance mock time
(global as any).advanceMockTime = (ms: number) => {
  mockTime += ms;
};

// Reset mock time
(global as any).resetMockTime = () => {
  mockTime = 0;
};

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Worker for worker tests
global.Worker = class MockWorker {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  postMessage(data: any) {
    // Mock worker responses
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data: { type: 'response', success: true } }));
      }
    }, 10);
  }

  terminate() {
    // Mock cleanup
  }
} as any;

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  (global as any).resetMockTime();
});

export { mockElectronAPI };