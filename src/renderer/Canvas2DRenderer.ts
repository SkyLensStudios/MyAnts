/**
 * 2D Canvas Renderer System
 * High-performance 2D renderer for ant colony simulation using HTML5 Canvas
 * Replaces Three.js WebGPU system with simpler, more efficient 2D rendering
 */

import {
    AABB2D,
    AntRenderInstance2D,
    EnvironmentRenderData2D,
    PheromoneRenderData2D,
    Vector2D,
    Vector2DUtils,
} from '../shared/types-2d';

export interface Canvas2DRendererConfig {
  enableAntiAliasing: boolean;
  enableBackgroundGrid: boolean;
  enablePheromoneVisualizations: boolean;
  enableEnvironmentObjects: boolean;
  maxAntsToRender: number;
  antSize: number;
  pheromoneAlpha: number;
  backgroundColor: string;
  gridColor: string;
  enablePerformanceOptimizations: boolean;
  cullingEnabled: boolean;
  batchSize: number; // Number of ants to batch render together
}

export interface RenderMetrics2D {
  fps: number;
  frameTime: number;
  antsRendered: number;
  pheromonesRendered: number;
  environmentObjectsRendered: number;
  totalDrawCalls: number;
  culledObjects: number;
  lastFrameTime: number;
}

export interface Camera2D {
  position: Vector2D;
  zoom: number;
  rotation: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * High-performance 2D Canvas Renderer
 * Optimized for rendering thousands of ants with smooth performance
 */
export class Canvas2DRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private config: Canvas2DRendererConfig;
  private camera: Camera2D;
  private readonly metrics: RenderMetrics2D;
  
  // Performance optimization
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private readonly antSpriteCache: Map<string, ImageData> = new Map();
  private readonly lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;
  
  // Culling
  private viewBounds: AABB2D = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  
  // Animation
  private readonly animationId: number | null = null;
  private readonly isRunning = false;

  constructor(canvas: HTMLCanvasElement, config: Partial<Canvas2DRendererConfig> = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = context;
    
    this.config = {
      enableAntiAliasing: true,
      enableBackgroundGrid: true,
      enablePheromoneVisualizations: true,
      enableEnvironmentObjects: true,
      maxAntsToRender: 50000,
      antSize: 4,
      pheromoneAlpha: 0.3,
      backgroundColor: '#1a1a1a',
      gridColor: '#333333',
      enablePerformanceOptimizations: true,
      cullingEnabled: true,
      batchSize: 1000,
      ...config,
    };

    this.camera = {
      position: { x: 0, y: 0 },
      zoom: 1.0,
      rotation: 0,
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
    };

    this.metrics = {
      fps: 0,
      frameTime: 0,
      antsRendered: 0,
      pheromonesRendered: 0,
      environmentObjectsRendered: 0,
      totalDrawCalls: 0,
      culledObjects: 0,
      lastFrameTime: 0,
    };

    this.initialize();
  }

  /**
   * Initialize renderer and create optimizations
   */
  private initialize(): void {
    // Setup canvas
    this.setupCanvas();
    
    // Create offscreen canvas for performance optimizations
    if (this.config.enablePerformanceOptimizations) {
      this.createOffscreenCanvas();
    }
    
    // Pre-generate ant sprites
    this.generateAntSprites();
    
    console.log('Canvas2D renderer initialized');
  }

  /**
   * Setup canvas properties
   */
  private setupCanvas(): void {
    // Configure rendering context
    if (this.config.enableAntiAliasing) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    } else {
      this.ctx.imageSmoothingEnabled = false;
    }
    
    // Set initial transform
    this.updateViewTransform();
  }

  /**
   * Create offscreen canvas for rendering optimizations
   */
  private createOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    // Add willReadFrequently for better performance
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

    if (this.offscreenCtx && this.config.enableAntiAliasing) {
      this.offscreenCtx.imageSmoothingEnabled = true;
      this.offscreenCtx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * Pre-generate ant sprites for different castes/states
   */
  private generateAntSprites(): void {
    const size = this.config.antSize;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size * 2;
    tempCanvas.height = size * 2;
    // Add willReadFrequently for better performance when using getImageData
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    if (!tempCtx) return;

    // Generate basic ant sprite
    const antSprite = this.createAntSprite(tempCtx, size, '#654321');
    this.antSpriteCache.set('worker', antSprite);
    
    // Generate different caste sprites
    this.antSpriteCache.set('soldier', this.createAntSprite(tempCtx, size * 1.2, '#8B4513'));
    this.antSpriteCache.set('queen', this.createAntSprite(tempCtx, size * 1.5, '#DAA520'));
    this.antSpriteCache.set('drone', this.createAntSprite(tempCtx, size * 0.8, '#A0522D'));
  }

  /**
   * Create individual ant sprite
   */
  private createAntSprite(ctx: CanvasRenderingContext2D, size: number, color: string): ImageData {
    const width = size * 2;
    const height = size * 2;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    
    // Draw ant body (3 circles for head, thorax, abdomen)
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - size * 0.4, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Thorax
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Abdomen
    ctx.beginPath();
    ctx.arc(centerX, centerY + size * 0.4, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple legs (lines)
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const startX = centerX + Math.cos(angle) * size * 0.2;
      const startY = centerY + Math.sin(angle) * size * 0.2;
      const endX = centerX + Math.cos(angle) * size * 0.5;
      const endY = centerY + Math.sin(angle) * size * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Update camera transform
   */
  private updateViewTransform(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    
    // Apply camera transformation
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.rotate(this.camera.rotation);
    this.ctx.translate(-this.camera.position.x, -this.camera.position.y);
    
    // Update view bounds for culling
    this.updateViewBounds();
  }

  /**
   * Update view bounds for frustum culling
   */
  private updateViewBounds(): void {
    const halfWidth = (this.canvas.width / 2) / this.camera.zoom;
    const halfHeight = (this.canvas.height / 2) / this.camera.zoom;
    
    this.viewBounds = {
      min: {
        x: this.camera.position.x - halfWidth,
        y: this.camera.position.y - halfHeight,
      },
      max: {
        x: this.camera.position.x + halfWidth,
        y: this.camera.position.y + halfHeight,
      },
    };
  }

  /**
   * Check if object is within view bounds
   */
  private isInView(position: Vector2D, radius: number = 5): boolean {
    if (!this.config.cullingEnabled) return true;
    
    return position.x + radius >= this.viewBounds.min.x &&
           position.x - radius <= this.viewBounds.max.x &&
           position.y + radius >= this.viewBounds.min.y &&
           position.y - radius <= this.viewBounds.max.y;
  }

  /**
   * Clear the canvas
   */
  private clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for clear
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.updateViewTransform(); // Restore camera transform
  }

  /**
   * Draw background grid
   */
  private drawGrid(): void {
    if (!this.config.enableBackgroundGrid) return;
    
    this.ctx.strokeStyle = this.config.gridColor;
    this.ctx.lineWidth = 1 / this.camera.zoom;
    
    const gridSize = 50;
    const startX = Math.floor(this.viewBounds.min.x / gridSize) * gridSize;
    const endX = Math.ceil(this.viewBounds.max.x / gridSize) * gridSize;
    const startY = Math.floor(this.viewBounds.min.y / gridSize) * gridSize;
    const endY = Math.ceil(this.viewBounds.max.y / gridSize) * gridSize;
    
    this.ctx.beginPath();
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo(x, this.viewBounds.min.y);
      this.ctx.lineTo(x, this.viewBounds.max.y);
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(this.viewBounds.min.x, y);
      this.ctx.lineTo(this.viewBounds.max.x, y);
    }
    
    this.ctx.stroke();
  }

  /**
   * Render pheromone trails
   */
  private renderPheromones(pheromones: PheromoneRenderData2D[]): void {
    if (!this.config.enablePheromoneVisualizations || pheromones.length === 0) return;
    
    this.ctx.globalAlpha = this.config.pheromoneAlpha;
    let rendered = 0;
    
    for (const pheromone of pheromones) {
      if (!this.isInView(pheromone.position, 5)) {
        continue;
      }
      
      // Color based on pheromone type
      let hue: number;
      if (pheromone.type === 'food') {
        hue = 120; // Green for food
      } else if (pheromone.type === 'home') {
        hue = 240; // Blue for home
      } else {
        hue = 60; // Yellow for others
      }
      
      const saturation = Math.min(100, pheromone.strength * 100);
      const lightness = 50;
      
      this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      const radius = Math.max(1, pheromone.strength * 5);
      this.ctx.beginPath();
      this.ctx.arc(pheromone.position.x, pheromone.position.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      rendered++;
    }
    
    this.ctx.globalAlpha = 1.0;
    this.metrics.pheromonesRendered = rendered;
  }

  /**
   * Render environment objects
   */
  private renderEnvironment(environment: EnvironmentRenderData2D[]): void {
    if (!this.config.enableEnvironmentObjects || environment.length === 0) return;
    
    let rendered = 0;
    
    for (const obj of environment) {
      if (!this.isInView(obj.position, Math.max(obj.size.x, obj.size.y) / 2)) {
        continue;
      }
      
      // Color based on object type
      let objectColor: string;
      if (obj.type === 'food') {
        objectColor = '#8B4513'; // Brown for food
      } else if (obj.type === 'obstacle') {
        objectColor = '#666666'; // Gray for obstacles
      } else if (obj.type === 'nest') {
        objectColor = '#DAA520'; // Gold for nest
      } else {
        objectColor = '#999999'; // Default gray
      }
      this.ctx.fillStyle = objectColor;
      
      this.ctx.fillRect(
        obj.position.x - obj.size.x / 2,
        obj.position.y - obj.size.y / 2,
        obj.size.x,
        obj.size.y,
      );
      
      rendered++;
    }
    
    this.metrics.environmentObjectsRendered = rendered;
  }

  /**
   * Render ants using optimized batch rendering
   */
  private renderAnts(ants: AntRenderInstance2D[]): void {
    if (ants.length === 0) return;
    
    let rendered = 0;
    const maxRender = Math.min(ants.length, this.config.maxAntsToRender);
    
    // Batch rendering for performance
    for (let i = 0; i < maxRender; i += this.config.batchSize) {
      const batchEnd = Math.min(i + this.config.batchSize, maxRender);
      this.renderAntBatch(ants.slice(i, batchEnd));
      rendered += (batchEnd - i);
    }
    
    this.metrics.antsRendered = rendered;
    this.metrics.culledObjects = ants.length - rendered;
  }

  /**
   * Render a batch of ants
   */
  private renderAntBatch(ants: AntRenderInstance2D[]): void {
    for (const ant of ants) {
      if (!ant.visible || !this.isInView(ant.position, this.config.antSize)) {
        continue;
      }
      
      this.ctx.save();
      
      // Transform to ant position and rotation
      this.ctx.translate(ant.position.x, ant.position.y);
      this.ctx.rotate(ant.rotation);
      this.ctx.scale(ant.scale.x, ant.scale.y);
      
      // Set ant color and draw simple circle representation
      this.ctx.fillStyle = `rgba(${ant.color.r * 255}, ${ant.color.g * 255}, ${ant.color.b * 255}, ${ant.color.a})`;
      
      // Draw ant as circle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.config.antSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add direction indicator
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.beginPath();
      this.ctx.arc(this.config.antSize * 0.5, 0, this.config.antSize * 0.2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }
  }

  /**
   * Main render function
   */
  public render(
    ants: AntRenderInstance2D[],
    pheromones: PheromoneRenderData2D[] = [],
    environment: EnvironmentRenderData2D[] = [],
  ): void {
    const frameStart = performance.now();
    
    // Clear canvas
    this.clear();
    
    // Draw background grid
    this.drawGrid();
    
    // Render environment objects
    this.renderEnvironment(environment);
    
    // Render pheromone trails
    this.renderPheromones(pheromones);
    
    // Render ants
    this.renderAnts(ants);
    
    // Update metrics
    this.updateMetrics(frameStart);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(frameStart: number): void {
    const frameTime = performance.now() - frameStart;
    this.metrics.frameTime = frameTime;
    this.metrics.lastFrameTime = frameStart;
    
    // Update FPS counter
    this.frameCount++;
    if (frameStart - this.fpsUpdateTime >= 1000) {
      this.metrics.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = frameStart;
    }
  }

  /**
   * Camera controls
   */
  public setCamera(camera: Partial<Camera2D>): void {
    this.camera = { ...this.camera, ...camera };
    this.updateViewTransform();
  }

  public moveCamera(delta: Vector2D): void {
    this.camera.position = Vector2DUtils.add(this.camera.position, delta);
    this.updateViewTransform();
  }

  public zoomCamera(factor: number, _center?: Vector2D): void {
    this.camera.zoom *= factor;
    this.camera.zoom = Math.max(0.1, Math.min(10, this.camera.zoom));
    this.updateViewTransform();
  }

  /**
   * Resize handling
   */
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
    
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
    }
    
    this.updateViewTransform();
  }

  /**
   * Get current render metrics
   */
  public getMetrics(): RenderMetrics2D {
    return { ...this.metrics };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<Canvas2DRendererConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.antSize !== undefined) {
      this.generateAntSprites(); // Regenerate sprites with new size
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.antSpriteCache.clear();
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
  }
}