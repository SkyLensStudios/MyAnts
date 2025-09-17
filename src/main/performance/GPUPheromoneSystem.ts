/**
 * GPU Pheromone System
 * WebGL-based compute shaders for high-performance chemical diffusion
 */

export interface PheromoneGPUConfig {
  gridWidth: number;
  gridHeight: number;
  maxPheromoneTypes: number;
  diffusionRate: number;
  evaporationRate: number;
  sparseThreshold: number;      // Concentration below which cells are considered empty
  activeRegionSize: number;     // Size of active processing regions
}

export interface GPUPheromoneCell {
  trailConcentration: number;
  alarmConcentration: number;
  territorialConcentration: number;
  foodConcentration: number;
  lastUpdate: number;
  isActive: boolean;
}

export interface ActiveRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  antCount: number;
  lastActivity: number;
}

/**
 * High-performance GPU-accelerated pheromone diffusion system
 */
export class GPUPheromoneSystem {
  private gl: WebGL2RenderingContext;
  private config: PheromoneGPUConfig;
  
  // WebGL resources
  private programs: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private buffers: Map<string, WebGLBuffer> = new Map();
  
  // Sparse grid optimization
  private activeRegions: Set<string> = new Set();
  private regionGrid: Map<string, ActiveRegion> = new Map();
  
  // Performance tracking
  private performanceMetrics = {
    lastFrameTime: 0,
    averageFrameTime: 0,
    activeTexels: 0,
    totalTexels: 0,
    gpuMemoryUsage: 0,
  };

  constructor(gl: WebGL2RenderingContext, config: PheromoneGPUConfig) {
    this.gl = gl;
    this.config = config;
  }

  /**
   * Initialize GPU resources and shaders
   */
  public async initialize(): Promise<void> {
    try {
      await this.createShaderPrograms();
      this.createTextures();
      this.createFramebuffers();
      this.createGeometryBuffers();
      this.initializeSparseGrid();
      
      console.log('GPU Pheromone System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GPU Pheromone System:', error);
      throw error;
    }
  }

  /**
   * Create and compile shader programs
   */
  private async createShaderPrograms(): Promise<void> {
    const shaderSources = {
      diffusion: {
        vertex: this.getDiffusionVertexShader(),
        fragment: this.getDiffusionFragmentShader(),
      },
      evaporation: {
        vertex: this.getEvaporationVertexShader(),
        fragment: this.getEvaporationFragmentShader(),
      },
      injection: {
        vertex: this.getInjectionVertexShader(),
        fragment: this.getInjectionFragmentShader(),
      },
      sparse: {
        vertex: this.getSparseVertexShader(),
        fragment: this.getSparseFragmentShader(),
      },
    };

    for (const [name, sources] of Object.entries(shaderSources)) {
      const program = await this.createShaderProgram(sources.vertex, sources.fragment);
      this.programs.set(name, program);
    }
  }

  /**
   * Create shader program from vertex and fragment shader source
   */
  private async createShaderProgram(vertexSource: string, fragmentSource: string): Promise<WebGLProgram> {
    const gl = this.gl;
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`Failed to link shader program: ${info}`);
    }
    
    return program;
  }

  /**
   * Create and compile individual shader
   */
  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${info}`);
    }
    
    return shader;
  }

  /**
   * Create textures for pheromone data storage
   */
  private createTextures(): void {
    const gl = this.gl;
    const width = this.config.gridWidth;
    const height = this.config.gridHeight;
    
    // Current pheromone concentrations (RGBA for 4 types)
    const currentTexture = this.createDataTexture(width, height, gl.RGBA32F);
    this.textures.set('current', currentTexture);
    
    // Previous frame for ping-pong rendering
    const previousTexture = this.createDataTexture(width, height, gl.RGBA32F);
    this.textures.set('previous', previousTexture);
    
    // Activity mask for sparse processing
    const activityTexture = this.createDataTexture(width, height, gl.R8);
    this.textures.set('activity', activityTexture);
    
    // Temporary texture for multi-pass operations
    const tempTexture = this.createDataTexture(width, height, gl.RGBA32F);
    this.textures.set('temp', tempTexture);
  }

  /**
   * Create data texture with specified format
   */
  private createDataTexture(width: number, height: number, internalFormat: number): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, 
                  this.getFormatFromInternal(internalFormat), gl.FLOAT, null);
    
    // Set texture parameters for data textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  /**
   * Get external format from internal format
   */
  private getFormatFromInternal(internalFormat: number): number {
    const gl = this.gl;
    switch (internalFormat) {
      case gl.RGBA32F:
      case gl.RGBA16F:
        return gl.RGBA;
      case gl.R32F:
      case gl.R16F:
      case gl.R8:
        return gl.RED;
      default:
        return gl.RGBA;
    }
  }

  /**
   * Create framebuffers for render-to-texture
   */
  private createFramebuffers(): void {
    const gl = this.gl;
    
    // Main diffusion framebuffer
    const diffusionFB = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, diffusionFB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, 
                           this.textures.get('current')!, 0);
    this.framebuffers.set('diffusion', diffusionFB);
    
    // Temporary framebuffer
    const tempFB = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, tempFB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
                           this.textures.get('temp')!, 0);
    this.framebuffers.set('temp', tempFB);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Create geometry buffers for full-screen quad
   */
  private createGeometryBuffers(): void {
    const gl = this.gl;
    
    // Full-screen quad vertices
    const vertices = new Float32Array([
      -1, -1,  0, 0,  // bottom-left
       1, -1,  1, 0,  // bottom-right
      -1,  1,  0, 1,  // top-left
       1,  1,  1, 1,   // top-right
    ]);
    
    const vertexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    this.buffers.set('quad', vertexBuffer);
  }

  /**
   * Initialize sparse grid for optimized processing
   */
  private initializeSparseGrid(): void {
    const regionSize = this.config.activeRegionSize;
    const gridWidth = Math.ceil(this.config.gridWidth / regionSize);
    const gridHeight = Math.ceil(this.config.gridHeight / regionSize);
    
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const key = `${x}_${y}`;
        this.regionGrid.set(key, {
          x: x * regionSize,
          y: y * regionSize,
          width: Math.min(regionSize, this.config.gridWidth - x * regionSize),
          height: Math.min(regionSize, this.config.gridHeight - y * regionSize),
          antCount: 0,
          lastActivity: 0,
        });
      }
    }
  }

  /**
   * Update pheromone system for one frame
   */
  public update(deltaTime: number, antPositions: Float32Array, pheromoneEvents: any[]): void {
    const startTime = performance.now();
    
    const gl = this.gl;
    gl.viewport(0, 0, this.config.gridWidth, this.config.gridHeight);
    
    // Update active regions based on ant positions
    this.updateActiveRegions(antPositions);
    
    // Process pheromone events (injection)
    if (pheromoneEvents.length > 0) {
      this.processPheromoneEvents(pheromoneEvents);
    }
    
    // Diffusion pass (only on active regions)
    this.performDiffusionPass(deltaTime);
    
    // Evaporation pass
    this.performEvaporationPass(deltaTime);
    
    // Swap textures for next frame (ping-pong)
    this.swapTextures();
    
    // Update performance metrics
    const frameTime = performance.now() - startTime;
    this.updatePerformanceMetrics(frameTime);
  }

  /**
   * Update active regions based on ant activity
   */
  private updateActiveRegions(antPositions: Float32Array): void {
    // Clear previous activity
    this.activeRegions.clear();
    
    // Reset ant counts
    for (const region of this.regionGrid.values()) {
      region.antCount = 0;
    }
    
    // Count ants in each region
    const regionSize = this.config.activeRegionSize;
    for (let i = 0; i < antPositions.length; i += 3) {
      const x = antPositions[i];
      const y = antPositions[i + 1];
      
      const regionX = Math.floor(x / regionSize);
      const regionY = Math.floor(y / regionSize);
      const key = `${regionX}_${regionY}`;
      
      const region = this.regionGrid.get(key);
      if (region) {
        region.antCount++;
        region.lastActivity = Date.now();
        
        // Mark region as active if it has ants
        if (region.antCount > 0) {
          this.activeRegions.add(key);
        }
      }
    }
  }

  /**
   * Process pheromone injection events
   */
  private processPheromoneEvents(events: any[]): void {
    const gl = this.gl;
    const program = this.programs.get('injection')!;
    
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.get('temp')!);
    
    // Bind input texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get('current')!);
    gl.uniform1i(gl.getUniformLocation(program, 'u_inputTexture'), 0);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
                this.config.gridWidth, this.config.gridHeight);
    
    // Process each event
    for (const event of events) {
      gl.uniform2f(gl.getUniformLocation(program, 'u_position'), event.x, event.y);
      gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), event.intensity);
      gl.uniform1i(gl.getUniformLocation(program, 'u_pheromoneType'), event.type);
      
      this.drawFullscreenQuad();
    }
    
    // Copy result back to current texture
    this.copyTexture('temp', 'current');
  }

  /**
   * Perform diffusion computation on GPU
   */
  private performDiffusionPass(deltaTime: number): void {
    const gl = this.gl;
    const program = this.programs.get('diffusion')!;
    
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.get('temp')!);
    
    // Bind input texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get('current')!);
    gl.uniform1i(gl.getUniformLocation(program, 'u_inputTexture'), 0);
    
    // Bind activity mask
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get('activity')!);
    gl.uniform1i(gl.getUniformLocation(program, 'u_activityTexture'), 1);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
                this.config.gridWidth, this.config.gridHeight);
    gl.uniform1f(gl.getUniformLocation(program, 'u_deltaTime'), deltaTime);
    gl.uniform1f(gl.getUniformLocation(program, 'u_diffusionRate'), this.config.diffusionRate);
    gl.uniform1f(gl.getUniformLocation(program, 'u_sparseThreshold'), this.config.sparseThreshold);
    
    this.drawFullscreenQuad();
    
    // Copy result back
    this.copyTexture('temp', 'current');
  }

  /**
   * Perform evaporation computation on GPU
   */
  private performEvaporationPass(deltaTime: number): void {
    const gl = this.gl;
    const program = this.programs.get('evaporation')!;
    
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.get('temp')!);
    
    // Bind input texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get('current')!);
    gl.uniform1i(gl.getUniformLocation(program, 'u_inputTexture'), 0);
    
    // Set uniforms
    gl.uniform1f(gl.getUniformLocation(program, 'u_deltaTime'), deltaTime);
    gl.uniform1f(gl.getUniformLocation(program, 'u_evaporationRate'), this.config.evaporationRate);
    
    this.drawFullscreenQuad();
    
    // Copy result back
    this.copyTexture('temp', 'current');
  }

  /**
   * Draw full-screen quad for shader processing
   */
  private drawFullscreenQuad(): void {
    const gl = this.gl;
    const buffer = this.buffers.get('quad')!;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);  // position
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);  // texCoord
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Copy one texture to another
   */
  private copyTexture(source: string, destination: string): void {
    const gl = this.gl;
    
    const sourceTex = this.textures.get(source)!;
    const destTex = this.textures.get(destination)!;
    
    // Use a simple copy shader or framebuffer blit
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffers.get('temp')!);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sourceTex, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffers.get('diffusion')!);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destTex, 0);
    
    gl.blitFramebuffer(0, 0, this.config.gridWidth, this.config.gridHeight,
                      0, 0, this.config.gridWidth, this.config.gridHeight,
                      gl.COLOR_BUFFER_BIT, gl.NEAREST);
  }

  /**
   * Swap current and previous textures
   */
  private swapTextures(): void {
    const current = this.textures.get('current')!;
    const previous = this.textures.get('previous')!;
    
    this.textures.set('current', previous);
    this.textures.set('previous', current);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(frameTime: number): void {
    this.performanceMetrics.lastFrameTime = frameTime;
    this.performanceMetrics.averageFrameTime = 
      this.performanceMetrics.averageFrameTime * 0.9 + frameTime * 0.1;
    
    this.performanceMetrics.activeTexels = this.activeRegions.size * 
      this.config.activeRegionSize * this.config.activeRegionSize;
    this.performanceMetrics.totalTexels = 
      this.config.gridWidth * this.config.gridHeight;
  }

  /**
   * Read pheromone concentration at specific position
   */
  public getConcentration(x: number, y: number): Float32Array {
    const gl = this.gl;
    const result = new Float32Array(4); // RGBA values
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.get('diffusion')!);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.FLOAT, result);
    
    return result;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }

  // Shader source code follows...
  private getDiffusionVertexShader(): string {
    return `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
  }

  private getDiffusionFragmentShader(): string {
    return `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform sampler2D u_inputTexture;
      uniform sampler2D u_activityTexture;
      uniform vec2 u_resolution;
      uniform float u_deltaTime;
      uniform float u_diffusionRate;
      uniform float u_sparseThreshold;
      
      void main() {
        vec2 texel = 1.0 / u_resolution;
        vec4 current = texture(u_inputTexture, v_texCoord);
        float activity = texture(u_activityTexture, v_texCoord).r;
        
        // Skip diffusion for inactive regions
        if (activity < 0.1) {
          fragColor = current;
          return;
        }
        
        // 9-point stencil diffusion
        vec4 sum = current * 4.0;
        sum += texture(u_inputTexture, v_texCoord + vec2(-texel.x, 0.0));
        sum += texture(u_inputTexture, v_texCoord + vec2( texel.x, 0.0));
        sum += texture(u_inputTexture, v_texCoord + vec2(0.0, -texel.y));
        sum += texture(u_inputTexture, v_texCoord + vec2(0.0,  texel.y));
        
        // Corner neighbors with reduced weight
        sum += texture(u_inputTexture, v_texCoord + vec2(-texel.x, -texel.y)) * 0.5;
        sum += texture(u_inputTexture, v_texCoord + vec2( texel.x, -texel.y)) * 0.5;
        sum += texture(u_inputTexture, v_texCoord + vec2(-texel.x,  texel.y)) * 0.5;
        sum += texture(u_inputTexture, v_texCoord + vec2( texel.x,  texel.y)) * 0.5;
        
        // Normalize and apply diffusion
        vec4 diffused = sum / 8.0;
        fragColor = mix(current, diffused, u_diffusionRate * u_deltaTime);
        
        // Apply sparse threshold
        fragColor = max(fragColor, vec4(u_sparseThreshold));
      }
    `;
  }

  private getEvaporationVertexShader(): string {
    return this.getDiffusionVertexShader(); // Same vertex shader
  }

  private getEvaporationFragmentShader(): string {
    return `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform sampler2D u_inputTexture;
      uniform float u_deltaTime;
      uniform float u_evaporationRate;
      
      void main() {
        vec4 current = texture(u_inputTexture, v_texCoord);
        float decay = exp(-u_evaporationRate * u_deltaTime);
        fragColor = current * decay;
      }
    `;
  }

  private getInjectionVertexShader(): string {
    return this.getDiffusionVertexShader(); // Same vertex shader
  }

  private getInjectionFragmentShader(): string {
    return `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform sampler2D u_inputTexture;
      uniform vec2 u_resolution;
      uniform vec2 u_position;
      uniform float u_intensity;
      uniform int u_pheromoneType;
      
      void main() {
        vec4 current = texture(u_inputTexture, v_texCoord);
        vec2 worldPos = v_texCoord * u_resolution;
        
        float distance = length(worldPos - u_position);
        float influence = exp(-distance * distance * 0.1);
        
        if (u_pheromoneType == 0) { // Trail
          current.r += u_intensity * influence;
        } else if (u_pheromoneType == 1) { // Alarm
          current.g += u_intensity * influence;
        } else if (u_pheromoneType == 2) { // Territorial
          current.b += u_intensity * influence;
        } else if (u_pheromoneType == 3) { // Food
          current.a += u_intensity * influence;
        }
        
        fragColor = current;
      }
    `;
  }

  private getSparseVertexShader(): string {
    return this.getDiffusionVertexShader(); // Same vertex shader
  }

  private getSparseFragmentShader(): string {
    return `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform sampler2D u_inputTexture;
      uniform float u_threshold;
      
      void main() {
        vec4 current = texture(u_inputTexture, v_texCoord);
        float maxComponent = max(max(current.r, current.g), max(current.b, current.a));
        
        fragColor = vec4(maxComponent > u_threshold ? 1.0 : 0.0);
      }
    `;
  }

  /**
   * Cleanup GPU resources
   */
  public destroy(): void {
    const gl = this.gl;
    
    // Delete programs
    for (const program of this.programs.values()) {
      gl.deleteProgram(program);
    }
    
    // Delete textures
    for (const texture of this.textures.values()) {
      gl.deleteTexture(texture);
    }
    
    // Delete framebuffers
    for (const framebuffer of this.framebuffers.values()) {
      gl.deleteFramebuffer(framebuffer);
    }
    
    // Delete buffers
    for (const buffer of this.buffers.values()) {
      gl.deleteBuffer(buffer);
    }
    
    this.programs.clear();
    this.textures.clear();
    this.framebuffers.clear();
    this.buffers.clear();
  }
}