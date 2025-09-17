/**
 * Renderer Fallback Management System
 * Implements WebGPU → WebGL2 → WebGL1 → Canvas fallback chain with graceful degradation
 */

import * as THREE from 'three';
import { GraphicsCapabilityDetector, GraphicsCapabilities, RenderingConfig } from './GraphicsCapabilityDetector';
import { WebGPUThreeJSIntegration, WebGPURendererConfig } from '../WebGPUThreeJSIntegration';

export interface RendererOptions {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
}

export interface FallbackResult {
  renderer: THREE.WebGLRenderer | null;
  webgpuIntegration: WebGPUThreeJSIntegration | null;
  renderingConfig: RenderingConfig;
  actualRenderer: 'webgpu' | 'webgl2' | 'webgl1' | 'canvas' | 'failed';
  limitations: string[];
  performanceHints: string[];
}

export class RendererFallbackManager {
  private capabilityDetector: GraphicsCapabilityDetector;
  private capabilities: GraphicsCapabilities | null = null;
  
  constructor() {
    this.capabilityDetector = new GraphicsCapabilityDetector();
    this.capabilities = this.capabilityDetector.getCapabilities();
  }

  /**
   * Attempt to create the best available renderer with fallback chain
   */
  public async createRenderer(options: RendererOptions = {}): Promise<FallbackResult> {
    console.log('🔧 Initializing renderer with fallback chain...');
    
    // Default result structure
    let result: FallbackResult = {
      renderer: null,
      webgpuIntegration: null,
      renderingConfig: this.capabilityDetector.getRecommendedConfig(),
      actualRenderer: 'failed',
      limitations: [],
      performanceHints: []
    };

    // Try WebGPU first (if supported and recommended)
    if (this.capabilities?.webgpu && result.renderingConfig.renderer === 'webgpu') {
      try {
        console.log('🎮 Attempting WebGPU renderer initialization...');
        const webgpuResult = await this.createWebGPURenderer(options);
        if (webgpuResult.success) {
          result.renderer = webgpuResult.renderer!;
          result.webgpuIntegration = webgpuResult.webgpuIntegration!;
          result.actualRenderer = 'webgpu';
          result.performanceHints.push('WebGPU renderer active - maximum performance');
          console.log('✅ WebGPU renderer initialized successfully');
          return result;
        }
      } catch (error) {
        console.warn('❌ WebGPU initialization failed:', error);
        result.limitations.push('WebGPU failed to initialize');
      }
    }

    // Fallback to WebGL2
    if (this.capabilities?.webgl2) {
      try {
        console.log('🔄 Falling back to WebGL2 renderer...');
        const webgl2Result = this.createWebGL2Renderer(options);
        if (webgl2Result.success) {
          result.renderer = webgl2Result.renderer!;
          result.actualRenderer = 'webgl2';
          result.performanceHints.push('WebGL2 renderer - good performance with most features');
          result.limitations.push('WebGPU compute shaders not available');
          console.log('✅ WebGL2 renderer initialized successfully');
          return result;
        }
      } catch (error) {
        console.warn('❌ WebGL2 initialization failed:', error);
        result.limitations.push('WebGL2 failed to initialize');
      }
    }

    // Fallback to WebGL1
    if (this.capabilities?.webgl) {
      try {
        console.log('🔄 Falling back to WebGL1 renderer...');
        const webgl1Result = this.createWebGL1Renderer(options);
        if (webgl1Result.success) {
          result.renderer = webgl1Result.renderer!;
          result.actualRenderer = 'webgl1';
          result.performanceHints.push('WebGL1 renderer - basic 3D support');
          result.limitations.push(
            'Limited to WebGL1 features',
            'Reduced performance for large simulations',
            'Some advanced rendering features disabled'
          );
          console.log('✅ WebGL1 renderer initialized successfully');
          return result;
        }
      } catch (error) {
        console.warn('❌ WebGL1 initialization failed:', error);
        result.limitations.push('WebGL1 failed to initialize');
      }
    }

    // Final fallback: Canvas 2D (emergency mode)
    console.warn('🚨 All WebGL renderers failed - falling back to Canvas 2D emergency mode');
    result.actualRenderer = 'canvas';
    result.limitations.push(
      'No 3D acceleration available',
      'Simulation limited to 2D visualization',
      'Severely reduced performance',
      'Limited visual fidelity'
    );
    result.performanceHints.push('Consider updating graphics drivers or using a different browser');

    return result;
  }

  /**
   * Attempt to create WebGPU-enhanced renderer
   */
  private async createWebGPURenderer(options: RendererOptions): Promise<{
    success: boolean;
    renderer?: THREE.WebGLRenderer;
    webgpuIntegration?: WebGPUThreeJSIntegration;
  }> {
    try {
      // Create WebGL2 renderer as base
      const renderer = new THREE.WebGLRenderer({
        canvas: options.canvas,
        antialias: options.antialias ?? true,
        alpha: options.alpha ?? true,
        powerPreference: options.powerPreference ?? 'high-performance',
        failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat ?? false
      });

      // Ensure we're using WebGL2
      const gl = renderer.getContext();
      if (!(gl instanceof WebGL2RenderingContext)) {
        throw new Error('WebGL2 context required for WebGPU integration');
      }

      // Initialize WebGPU integration
      const webgpuConfig: WebGPURendererConfig = {
        enableWebGPU: true,
        maxInstances: this.capabilities?.maxTextureSize ? Math.min(100000, this.capabilities.maxTextureSize) : 10000,
        lodLevels: 4,
        enableInstancedRendering: true,
        enableComputeShaderAcceleration: true,
        gpuBufferPoolSize: 32 * 1024 * 1024 // 32MB buffer pool
      };

      // Create basic scene and camera for WebGPU integration
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

      const webgpuIntegration = new WebGPUThreeJSIntegration(scene, camera, renderer, webgpuConfig);
      
      // Test WebGPU availability
      if ('gpu' in navigator) {
        const adapter = await navigator.gpu?.requestAdapter();
        if (adapter) {
          await adapter.requestDevice();
          return { success: true, renderer, webgpuIntegration };
        }
      }
      
      throw new Error('WebGPU adapter not available');
    } catch (error) {
      console.error('WebGPU renderer creation failed:', error);
      return { success: false };
    }
  }

  /**
   * Create WebGL2 renderer
   */
  private createWebGL2Renderer(options: RendererOptions): {
    success: boolean;
    renderer?: THREE.WebGLRenderer;
  } {
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: options.canvas,
        antialias: options.antialias ?? true,
        alpha: options.alpha ?? true,
        powerPreference: options.powerPreference ?? 'high-performance',
        failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat ?? false
      });

      // Verify WebGL2 context
      const gl = renderer.getContext();
      if (!(gl instanceof WebGL2RenderingContext)) {
        throw new Error('Expected WebGL2 context');
      }

      // Configure for optimal WebGL2 features
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      
      return { success: true, renderer };
    } catch (error) {
      console.error('WebGL2 renderer creation failed:', error);
      return { success: false };
    }
  }

  /**
   * Create WebGL1 renderer (limited features)
   */
  private createWebGL1Renderer(options: RendererOptions): {
    success: boolean;
    renderer?: THREE.WebGLRenderer;
  } {
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: options.canvas,
        antialias: options.antialias ?? false, // Reduce antialiasing for performance
        alpha: options.alpha ?? true,
        powerPreference: options.powerPreference ?? 'default',
        failIfMajorPerformanceCaveat: false // Be more permissive
      });

      // Verify we have at least WebGL1
      const gl = renderer.getContext();
      if (!gl) {
        throw new Error('No WebGL context available');
      }

      // Basic WebGL1 configuration
      renderer.shadowMap.enabled = false; // Shadows might not work well
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      
      return { success: true, renderer };
    } catch (error) {
      console.error('WebGL1 renderer creation failed:', error);
      return { success: false };
    }
  }

  /**
   * Get current graphics capabilities
   */
  public getCapabilities(): GraphicsCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get performance recommendations based on current system
   */
  public getPerformanceRecommendations(): string[] {
    if (!this.capabilities) {
      return ['Unable to detect graphics capabilities'];
    }

    const recommendations: string[] = [];

    if (this.capabilities.webgpu) {
      recommendations.push('Your system supports WebGPU - enable all advanced features');
    } else if (this.capabilities.webgl2) {
      recommendations.push('WebGL2 available - most features supported with good performance');
    } else if (this.capabilities.webgl) {
      recommendations.push('Limited to WebGL1 - consider reducing simulation complexity');
    } else {
      recommendations.push('No hardware acceleration - performance will be severely limited');
    }

    if (this.capabilities.maxTextureSize < 4096) {
      recommendations.push('Small texture support detected - reduce visual quality settings');
    }

    return recommendations;
  }

  /**
   * Test if fallback to a specific renderer type is possible
   */
  public async testRenderer(type: 'webgpu' | 'webgl2' | 'webgl1'): Promise<boolean> {
    try {
      switch (type) {
        case 'webgpu':
          if (!this.capabilities?.webgpu) return false;
          const result = await this.createWebGPURenderer({});
          return result.success;
        
        case 'webgl2':
          if (!this.capabilities?.webgl2) return false;
          const webgl2Result = this.createWebGL2Renderer({});
          return webgl2Result.success;
        
        case 'webgl1':
          if (!this.capabilities?.webgl) return false;
          const webgl1Result = this.createWebGL1Renderer({});
          return webgl1Result.success;
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}