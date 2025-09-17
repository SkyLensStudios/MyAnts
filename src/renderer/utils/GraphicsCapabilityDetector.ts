/**
 * WebGL/WebGPU Capability Detection and Fallback System
 * Provides graceful degradation for different graphics capabilities
 */

export interface GraphicsCapabilities {
  webgl: boolean;
  webgl2: boolean;
  webgpu: boolean;
  extensions: {
    vertexArrayObject: boolean;
    instancedArrays: boolean;
    textureFloat: boolean;
    textureHalfFloat: boolean;
    colorBufferFloat: boolean;
    depthTexture: boolean;
  };
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxViewportDims: [number, number];
  maxTextureUnits: number;
  vendor: string;
  renderer: string;
  version: string;
  shaderVersion: string;
}

export interface FallbackOptions {
  enableWebGL1Fallback: boolean;
  enableCanvasFallback: boolean;
  maxTextureSizeOverride?: number;
  disableInstancing?: boolean;
  disableShadows?: boolean;
  reducedParticleCount?: boolean;
}

export interface RenderingConfig {
  renderer: 'webgpu' | 'webgl2' | 'webgl1' | 'canvas';
  antInstanceLimit: number;
  enableShadows: boolean;
  enableInstancing: boolean;
  antialias: boolean;
  particleCount: number;
  qualityLevel: 'ultra' | 'high' | 'medium' | 'low';
}

export class GraphicsCapabilityDetector {
  private capabilities: GraphicsCapabilities | null = null;
  private fallbackOptions: FallbackOptions;

  constructor(fallbackOptions: FallbackOptions = { enableWebGL1Fallback: true, enableCanvasFallback: true }) {
    this.fallbackOptions = fallbackOptions;
  }

  /**
   * Detect graphics capabilities and return detailed information
   */
  public async detectCapabilities(): Promise<GraphicsCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    console.log('🔍 Detecting graphics capabilities...');

    const capabilities: GraphicsCapabilities = {
      webgl: false,
      webgl2: false,
      webgpu: false,
      extensions: {
        vertexArrayObject: false,
        instancedArrays: false,
        textureFloat: false,
        textureHalfFloat: false,
        colorBufferFloat: false,
        depthTexture: false,
      },
      maxTextureSize: 0,
      maxRenderbufferSize: 0,
      maxViewportDims: [0, 0],
      maxTextureUnits: 0,
      vendor: '',
      renderer: '',
      version: '',
      shaderVersion: ''
    };

    // Test WebGPU first (best option)
    try {
      if ('gpu' in navigator) {
        const adapter = await (navigator as any).gpu?.requestAdapter();
        if (adapter) {
          capabilities.webgpu = true;
          console.log('✅ WebGPU is available');
        }
      }
    } catch (error) {
      console.warn('❌ WebGPU not available:', error);
    }

    // Test WebGL2 (second best option)
    const canvas = document.createElement('canvas');
    let gl2: WebGL2RenderingContext | null = null;
    
    try {
      gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext;
      if (gl2) {
        capabilities.webgl2 = true;
        this.populateWebGLCapabilities(gl2, capabilities);
        console.log('✅ WebGL2 is available');
      }
    } catch (error) {
      console.warn('❌ WebGL2 not available:', error);
    }

    // Test WebGL1 (fallback option)
    if (!capabilities.webgl2) {
      try {
        const gl1 = canvas.getContext('webgl') as WebGLRenderingContext;
        if (gl1) {
          capabilities.webgl = true;
          this.populateWebGLCapabilities(gl1, capabilities);
          console.log('⚠️ WebGL1 available (WebGL2 preferred)');
        }
      } catch (error) {
        console.warn('❌ WebGL1 not available:', error);
      }
    }

    this.capabilities = capabilities;
    this.logCapabilitiesSummary(capabilities);
    
    return capabilities;
  }

  private populateWebGLCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext, capabilities: GraphicsCapabilities) {
    // Basic info
    capabilities.vendor = gl.getParameter(gl.VENDOR) || 'Unknown';
    capabilities.renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
    capabilities.version = gl.getParameter(gl.VERSION) || 'Unknown';
    capabilities.shaderVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown';

    // Limits
    capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
    capabilities.maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0;
    capabilities.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0];
    capabilities.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0;

    // Extensions
    const extensions = gl.getSupportedExtensions() || [];
    
    capabilities.extensions.vertexArrayObject = 
      extensions.includes('OES_vertex_array_object') || 
      'createVertexArray' in gl; // WebGL2 has it built-in

    capabilities.extensions.instancedArrays = 
      extensions.includes('ANGLE_instanced_arrays') ||
      'drawElementsInstanced' in gl; // WebGL2 has it built-in

    capabilities.extensions.textureFloat = extensions.includes('OES_texture_float');
    capabilities.extensions.textureHalfFloat = extensions.includes('OES_texture_half_float');
    capabilities.extensions.colorBufferFloat = extensions.includes('EXT_color_buffer_float');
    capabilities.extensions.depthTexture = extensions.includes('WEBGL_depth_texture');
  }

  private logCapabilitiesSummary(capabilities: GraphicsCapabilities) {
    console.group('📊 Graphics Capabilities Summary');
    console.log('WebGPU:', capabilities.webgpu ? '✅' : '❌');
    console.log('WebGL2:', capabilities.webgl2 ? '✅' : '❌');
    console.log('WebGL1:', capabilities.webgl ? '✅' : '❌');
    console.log('Max Texture Size:', capabilities.maxTextureSize);
    console.log('Instanced Arrays:', capabilities.extensions.instancedArrays ? '✅' : '❌');
    console.log('Vendor:', capabilities.vendor);
    console.log('Renderer:', capabilities.renderer);
    console.groupEnd();
  }

  /**
   * Get recommended rendering configuration based on capabilities
   */
  public getRecommendedConfig(): RenderingConfig {
    const capabilities = this.capabilities;
    
    if (!capabilities) {
      throw new Error('Must call detectCapabilities() first');
    }

    // Ultra quality: WebGPU with full features
    if (capabilities.webgpu) {
      return {
        renderer: 'webgpu',
        antInstanceLimit: 50000,
        enableShadows: true,
        enableInstancing: true,
        antialias: true,
        particleCount: 10000,
        qualityLevel: 'ultra'
      };
    }

    // High quality: WebGL2 with most features
    if (capabilities.webgl2 && capabilities.extensions.instancedArrays) {
      return {
        renderer: 'webgl2',
        antInstanceLimit: 10000,
        enableShadows: true,
        enableInstancing: true,
        antialias: true,
        particleCount: 5000,
        qualityLevel: 'high'
      };
    }

    // Medium quality: WebGL2 without instancing
    if (capabilities.webgl2) {
      return {
        renderer: 'webgl2',
        antInstanceLimit: 1000,
        enableShadows: true,
        enableInstancing: false,
        antialias: false,
        particleCount: 1000,
        qualityLevel: 'medium'
      };
    }

    // Low quality: WebGL1 with minimal features
    if (capabilities.webgl) {
      return {
        renderer: 'webgl1',
        antInstanceLimit: 500,
        enableShadows: false,
        enableInstancing: capabilities.extensions.instancedArrays,
        antialias: false,
        particleCount: 500,
        qualityLevel: 'low'
      };
    }

    // Fallback: Canvas 2D rendering
    return {
      renderer: 'canvas',
      antInstanceLimit: 100,
      enableShadows: false,
      enableInstancing: false,
      antialias: false,
      particleCount: 0,
      qualityLevel: 'low'
    };
  }

  /**
   * Check if the current environment can run the simulation
   */
  public canRunSimulation(): boolean {
    const capabilities = this.capabilities;
    if (!capabilities) return false;

    return capabilities.webgpu || capabilities.webgl2 || capabilities.webgl;
  }

  /**
   * Get fallback suggestions for unsupported environments
   */
  public getCapabilities(): GraphicsCapabilities | null {
    return this.capabilities;
  }

  public getFallbackSuggestions(): string[] {
    const suggestions: string[] = [];
    const capabilities = this.capabilities;
    
    if (!capabilities?.webgl && !capabilities?.webgl2) {
      suggestions.push('Enable hardware acceleration in your browser settings');
      suggestions.push('Update your graphics drivers');
      suggestions.push('Try using Chrome, Firefox, or Edge browser');
      suggestions.push('Close other graphics-intensive applications');
    }

    if (capabilities?.webgl && !capabilities?.webgl2) {
      suggestions.push('Consider updating your browser for better WebGL2 support');
    }

    if (capabilities && capabilities.maxTextureSize < 2048) {
      suggestions.push('Your graphics card may be older - some features will be limited');
    }

    return suggestions;
  }
}

export default GraphicsCapabilityDetector;