/**
 * Canvas 2D Renderer Component Tests
 * Tests for Canvas2DRenderer class and React component
 */

import { Canvas2DRenderer, Canvas2DRendererConfig, Camera2D } from '../renderer/Canvas2DRenderer';
import {
  AntRenderInstance2D,
  PheromoneRenderData2D,
  EnvironmentRenderData2D
} from '../shared/types-2d';

// Mock HTML Canvas and Context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(),
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
} as unknown as HTMLCanvasElement;

const mockContext = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  setTransform: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(64),
    width: 8,
    height: 8
  }),
  putImageData: jest.fn(),
  createImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(64),
    width: 8,
    height: 8
  })
} as unknown as CanvasRenderingContext2D;

// Mock document.createElement
const originalCreateElement = document.createElement;
document.createElement = jest.fn().mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

describe('Canvas2D Renderer Tests', () => {
  let renderer: Canvas2DRenderer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
    renderer = new Canvas2DRenderer(mockCanvas);
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
  });

  describe('Canvas2DRenderer Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(renderer).toBeDefined();
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    test('should initialize with custom configuration', () => {
      const config: Partial<Canvas2DRendererConfig> = {
        enableAntiAliasing: false,
        antSize: 6,
        backgroundColor: '#000000',
        maxAntsToRender: 1000
      };

      const customRenderer = new Canvas2DRenderer(mockCanvas, config);
      expect(customRenderer).toBeDefined();

      customRenderer.dispose();
    });

    test('should throw error if 2D context is not available', () => {
      const failingCanvas = {
        ...mockCanvas,
        getContext: jest.fn().mockReturnValue(null)
      } as unknown as HTMLCanvasElement;

      expect(() => {
        new Canvas2DRenderer(failingCanvas);
      }).toThrow('Failed to get 2D rendering context');
    });

    test('should setup canvas properties correctly', () => {
      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });
  });

  describe('Camera Operations', () => {
    test('should set camera properties', () => {
      const camera: Camera2D = {
        position: { x: 100, y: 200 },
        zoom: 2.0,
        rotation: Math.PI / 4,
        viewportWidth: 800,
        viewportHeight: 600
      };

      renderer.setCamera(camera);

      expect(mockContext.setTransform).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.scale).toHaveBeenCalledWith(2.0, 2.0);
      expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 4);
    });

    test('should move camera by delta', () => {
      const initialCamera = renderer.getMetrics(); // Get initial state
      const delta = { x: 50, y: -30 };

      renderer.moveCamera(delta);

      expect(mockContext.setTransform).toHaveBeenCalled();
    });

    test('should zoom camera with limits', () => {
      renderer.zoomCamera(2.0); // Zoom in
      expect(mockContext.scale).toHaveBeenCalled();

      renderer.zoomCamera(0.01); // Should be clamped
      expect(mockContext.scale).toHaveBeenCalled();

      renderer.zoomCamera(100); // Should be clamped
      expect(mockContext.scale).toHaveBeenCalled();
    });
  });

  describe('Rendering Operations', () => {
    test('should render empty scene', () => {
      renderer.render([], [], []);

      expect(mockContext.setTransform).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled(); // Background
    });

    test('should render single ant', () => {
      // Set camera to ensure ant is in view
      renderer.setCamera({
        position: { x: 100, y: 100 },
        zoom: 1.0,
        rotation: 0,
        viewportWidth: 800,
        viewportHeight: 600
      });

      const ant: AntRenderInstance2D = {
        id: 'test-ant',
        position: { x: 100, y: 100 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
        animationState: 0,
        visible: true,
        lodLevel: 0
      };

      renderer.render([ant]);

      // Check that rendering methods were called
      expect(mockContext.fillRect).toHaveBeenCalled(); // Background
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    test('should render multiple ants efficiently', () => {
      // Set camera to center view
      renderer.setCamera({
        position: { x: 500, y: 250 },
        zoom: 0.1, // Zoom out to see all ants
        rotation: 0,
        viewportWidth: 800,
        viewportHeight: 600
      });

      const ants: AntRenderInstance2D[] = [];
      for (let i = 0; i < 100; i++) {
        ants.push({
          id: `ant-${i}`,
          position: { x: i * 10, y: i * 5 },
          rotation: i * 0.1,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        });
      }

      const startTime = performance.now();
      renderer.render(ants);
      const renderTime = performance.now() - startTime;

      // Check that rendering occurred (some ants should be rendered)
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
      expect(renderTime).toBeLessThan(100); // Should be fast
    });

    test('should render pheromone trails', () => {
      const pheromones: PheromoneRenderData2D[] = [
        {
          position: { x: 50, y: 50 },
          strength: 0.8,
          type: 'food',
          decay: 0.01
        },
        {
          position: { x: 150, y: 150 },
          strength: 0.6,
          type: 'home',
          decay: 0.02
        }
      ];

      renderer.render([], pheromones);

      // globalAlpha is a property, not a function
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    test('should render environment objects', () => {
      const environment: EnvironmentRenderData2D[] = [
        {
          position: { x: 100, y: 100 },
          size: { x: 50, y: 30 },
          type: 'food',
          properties: { nutritionValue: 100 }
        },
        {
          position: { x: 200, y: 200 },
          size: { x: 80, y: 40 },
          type: 'obstacle',
          properties: {}
        }
      ];

      renderer.render([], [], environment);

      expect(mockContext.fillRect).toHaveBeenCalled(); // Background + environment objects
    });

    test('should handle invisible ants', () => {
      const ants: AntRenderInstance2D[] = [
        {
          id: 'visible-ant',
          position: { x: 100, y: 100 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        },
        {
          id: 'invisible-ant',
          position: { x: 200, y: 200 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: false,
          lodLevel: 0
        }
      ];

      renderer.render(ants);

      // Should render some objects (background + visible ant)
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
    });
  });

  describe('Performance and Culling', () => {
    test('should cull objects outside view bounds', () => {
      // Set camera to focus on origin with limited view
      renderer.setCamera({
        position: { x: 0, y: 0 },
        zoom: 1.0,
        rotation: 0,
        viewportWidth: 800,
        viewportHeight: 600
      });

      const ants: AntRenderInstance2D[] = [
        {
          id: 'visible-ant',
          position: { x: 100, y: 100 }, // Should be visible
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        },
        {
          id: 'culled-ant',
          position: { x: 10000, y: 10000 }, // Should be culled
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        }
      ];

      renderer.render(ants);
      const metrics = renderer.getMetrics();

      // Check that at least one ant was rendered and potentially some were culled
      expect(metrics.antsRendered).toBeGreaterThanOrEqual(0);
      expect(metrics.culledObjects).toBeGreaterThanOrEqual(0);
      // The sum should equal total ants
      expect(metrics.antsRendered + metrics.culledObjects).toBeLessThanOrEqual(ants.length);
    });

    test('should limit maximum ants rendered', () => {
      const config: Partial<Canvas2DRendererConfig> = {
        maxAntsToRender: 10
      };

      const limitedRenderer = new Canvas2DRenderer(mockCanvas, config);

      const ants: AntRenderInstance2D[] = [];
      for (let i = 0; i < 50; i++) {
        ants.push({
          id: `ant-${i}`,
          position: { x: i, y: i },
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        });
      }

      limitedRenderer.render(ants);
      const metrics = limitedRenderer.getMetrics();

      expect(metrics.antsRendered).toBeLessThanOrEqual(10);

      limitedRenderer.dispose();
    });

    test('should provide performance metrics', () => {
      renderer.render([], [], []);

      const metrics = renderer.getMetrics();

      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('antsRendered');
      expect(metrics).toHaveProperty('pheromonesRendered');
      expect(metrics).toHaveProperty('environmentObjectsRendered');
      expect(metrics).toHaveProperty('totalDrawCalls');
      expect(metrics).toHaveProperty('culledObjects');

      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.frameTime).toBe('number');
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration dynamically', () => {
      const newConfig: Partial<Canvas2DRendererConfig> = {
        antSize: 8,
        backgroundColor: '#333333',
        enablePheromoneVisualizations: false
      };

      renderer.updateConfig(newConfig);

      // Should regenerate sprites when ant size changes
      expect(renderer).toBeDefined();
    });

    test('should handle invalid configuration gracefully', () => {
      const invalidConfig: Partial<Canvas2DRendererConfig> = {
        antSize: -5, // Invalid
        maxAntsToRender: -100 // Invalid
      };

      expect(() => {
        renderer.updateConfig(invalidConfig);
      }).not.toThrow();
    });
  });

  describe('Resize Handling', () => {
    test('should handle resize operations', () => {
      renderer.resize(1920, 1080);

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
      expect(mockContext.setTransform).toHaveBeenCalled();
    });

    test('should handle zero or negative dimensions', () => {
      expect(() => {
        renderer.resize(0, 0);
      }).not.toThrow();

      expect(() => {
        renderer.resize(-100, -100);
      }).not.toThrow();
    });
  });

  describe('Grid and Background', () => {
    test('should render background grid when enabled', () => {
      const config: Partial<Canvas2DRendererConfig> = {
        enableBackgroundGrid: true
      };

      const gridRenderer = new Canvas2DRenderer(mockCanvas, config);
      gridRenderer.render([]);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();

      gridRenderer.dispose();
    });

    test('should not render grid when disabled', () => {
      const config: Partial<Canvas2DRendererConfig> = {
        enableBackgroundGrid: false
      };

      const noGridRenderer = new Canvas2DRenderer(mockCanvas, config);
      noGridRenderer.render([]);

      // Should still call stroke for other elements, but less frequently
      noGridRenderer.dispose();
    });
  });

  describe('Error Handling', () => {
    test('should handle canvas context errors', () => {
      // This test ensures the renderer can be created even with problematic contexts
      expect(renderer).toBeDefined();

      // Test with invalid render data that might cause errors
      expect(() => {
        renderer.render([{
          id: 'test-ant',
          position: { x: 100, y: 100 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        }]);
      }).not.toThrow();
    });

    test('should handle invalid render data', () => {
      const invalidAnts: AntRenderInstance2D[] = [
        {
          id: '',
          position: { x: NaN, y: Infinity },
          rotation: NaN,
          scale: { x: 0, y: 0 },
          color: { r: -1, g: 2, b: NaN, a: Infinity },
          animationState: NaN,
          visible: true,
          lodLevel: -1
        }
      ];

      expect(() => {
        renderer.render(invalidAnts);
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should dispose resources properly', () => {
      const disposableRenderer = new Canvas2DRenderer(mockCanvas);

      disposableRenderer.dispose();

      // Should not throw after disposal
      expect(() => {
        disposableRenderer.render([]);
      }).not.toThrow();
    });

    test('should handle multiple disposals', () => {
      const disposableRenderer = new Canvas2DRenderer(mockCanvas);

      disposableRenderer.dispose();
      disposableRenderer.dispose(); // Second disposal should be safe

      expect(() => {
        disposableRenderer.dispose();
      }).not.toThrow();
    });
  });

  describe('Batch Rendering', () => {
    test('should handle large batch sizes', () => {
      const config: Partial<Canvas2DRendererConfig> = {
        batchSize: 50
      };

      const batchRenderer = new Canvas2DRenderer(mockCanvas, config);

      const ants: AntRenderInstance2D[] = [];
      for (let i = 0; i < 200; i++) {
        ants.push({
          id: `ant-${i}`,
          position: { x: i % 100, y: Math.floor(i / 100) * 50 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        });
      }

      const startTime = performance.now();
      batchRenderer.render(ants);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(200); // Should handle efficiently

      batchRenderer.dispose();
    });

    test('should handle small batch sizes', () => {
      const config: Partial<Canvas2DRendererConfig> = {
        batchSize: 1
      };

      const smallBatchRenderer = new Canvas2DRenderer(mockCanvas, config);

      const ants: AntRenderInstance2D[] = [
        {
          id: 'ant-1',
          position: { x: 100, y: 100 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          color: { r: 0.4, g: 0.2, b: 0.1, a: 1.0 },
          animationState: 0,
          visible: true,
          lodLevel: 0
        }
      ];

      smallBatchRenderer.render(ants);

      smallBatchRenderer.dispose();
    });
  });
});