/**
 * WebGPU-Enhanced Three.js Renderer Integration
 * Bridges Three.js rendering with WebGPU compute capabilities for massive ant colonies
 */

import * as THREE from 'three';
import { WebGPUComputePipelineManager } from '../main/performance/WebGPUComputePipelineManager';
import { AdaptiveLODController } from '../main/performance/AdaptiveLODController';

export interface WebGPURendererConfig {
  enableWebGPU: boolean;
  maxInstances: number;
  lodLevels: number;
  enableInstancedRendering: boolean;
  enableComputeShaderAcceleration: boolean;
  gpuBufferPoolSize: number;
}

export interface AntRenderInstance {
  lodLevel: number;
  color: THREE.Color;
  animationState: number;
  visible: boolean;
  position: THREE.Vector3;  // Add position property
  rotation: THREE.Quaternion; // Add rotation property
  scale: THREE.Vector3;     // Add scale property
  id?: string;              // Optional ID for tracking
}

/**
 * Enhanced Three.js renderer with WebGPU compute acceleration
 */
export class WebGPUThreeJSIntegration {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  // WebGPU integration
  private webgpuPipeline: WebGPUComputePipelineManager | null = null;
  private lodController: AdaptiveLODController | null = null;
  
  // Instanced rendering systems
  private instancedMeshes: Map<number, THREE.InstancedMesh> = new Map();
  private instanceMatrices: Map<number, Float32Array> = new Map();
  private instanceColors: Map<number, Float32Array> = new Map();
  
  // Geometry pools for different LOD levels
  private geometryPool: Map<number, THREE.BufferGeometry> = new Map();
  private materialPool: Map<number, THREE.Material> = new Map();
  
  // Performance tracking
  private renderMetrics = {
    drawCalls: 0,
    triangles: 0,
    instances: 0,
    lastFrameTime: 0,
    webgpuUtilization: 0,
  };
  
  private config: WebGPURendererConfig;
  private isInitialized = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    config: Partial<WebGPURendererConfig> = {},
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    this.config = {
      enableWebGPU: true,
      maxInstances: 50000,
      lodLevels: 4,
      enableInstancedRendering: true,
      enableComputeShaderAcceleration: true,
      gpuBufferPoolSize: 64 * 1024 * 1024, // 64MB
      ...config,
    };
  }

  /**
   * Initialize WebGPU integration with Three.js
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing WebGPU Three.js integration...');
      
      // Initialize WebGPU pipeline if enabled
      if (this.config.enableWebGPU) {
        try {
          // Check for WebGPU support
          if (navigator.gpu) {
            console.log('WebGPU is supported, initializing pipeline...');
            // We need to implement WebGPUComputePipelineManager
            // For now, we'll use a fallback
            console.log('WebGPU support detected but pipeline manager not yet implemented');
          } else {
            console.log('WebGPU not supported in this browser, falling back to WebGL');
          }
          this.config.enableWebGPU = false; // Disable for now until implementation is complete
        } catch (gpuError) {
          console.error('WebGPU initialization failed:', gpuError);
          this.config.enableWebGPU = false;
        }
      }
      
      // Create geometry and material pools
      console.log('Creating geometry pool...');
      this.initializeGeometryPool();
      
      console.log('Creating material pool...');
      this.initializeMaterialPool();
      
      // Create instanced meshes for each LOD level
      console.log('Setting up instanced meshes...');
      this.initializeInstancedMeshes();
      
      // Initialize renderer optimizations
      console.log('Optimizing renderer...');
      this.optimizeRenderer();
      
      this.isInitialized = true;
      console.log('WebGPU Three.js integration initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize WebGPU Three.js integration:', error);
      // Fallback to standard Three.js rendering
      this.config.enableWebGPU = false;
      this.initializeFallbackRendering();
    }
  }

  /**
   * Set LOD controller for adaptive quality management
   */
  public setLODController(lodController: AdaptiveLODController): void {
    this.lodController = lodController;
  }

  /**
   * Initialize geometry pool for different LOD levels
   */
  private initializeGeometryPool(): void {
    // LOD 0: Full detail ant geometry
    const fullDetailGeometry = this.createFullDetailAntGeometry();
    this.geometryPool.set(0, fullDetailGeometry);
    
    // LOD 1: Simplified ant geometry
    const simplifiedGeometry = this.createSimplifiedAntGeometry();
    this.geometryPool.set(1, simplifiedGeometry);
    
    // LOD 2: Basic geometry (box with textures)
    const basicGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.2);
    this.geometryPool.set(2, basicGeometry);
    
    // LOD 3: Ultra-low detail (single plane)
    const planeGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    this.geometryPool.set(3, planeGeometry);
  }

  /**
   * Create full detail ant geometry with body parts
   */
  private createFullDetailAntGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    // Create ant body with head, thorax, abdomen
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    
    // Head (sphere-like)
    this.addSphereVertices(vertices, normals, uvs, new THREE.Vector3(0, 0, 0.15), 0.04, 8, 6);
    
    // Thorax (elongated ellipsoid)
    this.addEllipsoidVertices(vertices, normals, uvs, new THREE.Vector3(0, 0, 0), 0.03, 0.02, 0.08, 8, 6);
    
    // Abdomen (larger ellipsoid)
    this.addEllipsoidVertices(vertices, normals, uvs, new THREE.Vector3(0, 0, -0.12), 0.05, 0.03, 0.1, 8, 6);
    
    // Legs (simplified cylinders)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const legPos = new THREE.Vector3(
        Math.cos(angle) * 0.04,
        Math.sin(angle) * 0.04,
        -0.02 + (i < 2 ? 0.04 : i < 4 ? 0 : -0.04),
      );
      this.addCylinderVertices(vertices, normals, uvs, legPos, 0.002, 0.06, 4);
    }
    
    // Generate indices for triangulation
    this.generateIndicesForVertices(indices, vertices.length / 3);
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    return geometry;
  }

  /**
   * Create simplified ant geometry
   */
  private createSimplifiedAntGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    // Simplified ant as three connected ellipsoids
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    
    // Head
    this.addEllipsoidVertices(vertices, normals, uvs, new THREE.Vector3(0, 0, 0.12), 0.03, 0.025, 0.04, 6, 4);
    
    // Thorax
    this.addEllipsoidVertices(vertices, normals, uvs, new THREE.Vector3(0, 0, 0), 0.025, 0.02, 0.06, 6, 4);
    
    // Abdomen
    this.addEllipsoidVertices(vertices, normals, uvs, new THREE.Vector3(0, 0, -0.08), 0.04, 0.03, 0.08, 6, 4);
    
    this.generateIndicesForVertices(indices, vertices.length / 3);
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    return geometry;
  }

  /**
   * Helper method to add sphere vertices
   */
  private addSphereVertices(
    vertices: number[], 
    normals: number[], 
    uvs: number[], 
    center: THREE.Vector3, 
    radius: number, 
    widthSegments: number, 
    heightSegments: number,
  ): void {
    for (let i = 0; i <= heightSegments; i++) {
      const theta = (i / heightSegments) * Math.PI;
      for (let j = 0; j <= widthSegments; j++) {
        const phi = (j / widthSegments) * Math.PI * 2;
        
        const x = center.x + radius * Math.sin(theta) * Math.cos(phi);
        const y = center.y + radius * Math.sin(theta) * Math.sin(phi);
        const z = center.z + radius * Math.cos(theta);
        
        vertices.push(x, y, z);
        
        const normal = new THREE.Vector3(x - center.x, y - center.y, z - center.z).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        uvs.push(j / widthSegments, i / heightSegments);
      }
    }
  }

  /**
   * Helper method to add ellipsoid vertices
   */
  private addEllipsoidVertices(
    vertices: number[], 
    normals: number[], 
    uvs: number[], 
    center: THREE.Vector3, 
    radiusX: number, 
    radiusY: number, 
    radiusZ: number,
    widthSegments: number, 
    heightSegments: number,
  ): void {
    for (let i = 0; i <= heightSegments; i++) {
      const theta = (i / heightSegments) * Math.PI;
      for (let j = 0; j <= widthSegments; j++) {
        const phi = (j / widthSegments) * Math.PI * 2;
        
        const x = center.x + radiusX * Math.sin(theta) * Math.cos(phi);
        const y = center.y + radiusY * Math.sin(theta) * Math.sin(phi);
        const z = center.z + radiusZ * Math.cos(theta);
        
        vertices.push(x, y, z);
        
        // Calculate normal for ellipsoid
        const nx = (x - center.x) / (radiusX * radiusX);
        const ny = (y - center.y) / (radiusY * radiusY);
        const nz = (z - center.z) / (radiusZ * radiusZ);
        const normal = new THREE.Vector3(nx, ny, nz).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        uvs.push(j / widthSegments, i / heightSegments);
      }
    }
  }

  /**
   * Helper method to add cylinder vertices
   */
  private addCylinderVertices(
    vertices: number[], 
    normals: number[], 
    uvs: number[], 
    center: THREE.Vector3, 
    radius: number, 
    height: number, 
    segments: number,
  ): void {
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      
      // Bottom vertex
      vertices.push(x, y, center.z);
      normals.push(Math.cos(angle), Math.sin(angle), 0);
      uvs.push(i / segments, 0);
      
      // Top vertex
      vertices.push(x, y, center.z + height);
      normals.push(Math.cos(angle), Math.sin(angle), 0);
      uvs.push(i / segments, 1);
    }
  }

  /**
   * Generate triangle indices for vertices
   */
  private generateIndicesForVertices(indices: number[], vertexCount: number): void {
    // Simple triangulation - this is a placeholder
    // In a real implementation, you'd want proper mesh triangulation
    for (let i = 0; i < vertexCount - 2; i += 3) {
      indices.push(i, i + 1, i + 2);
    }
  }

  /**
   * Initialize material pool
   */
  private initializeMaterialPool(): void {
    // LOD 0: Full detail with normal maps, specular, etc.
    const fullDetailMaterial = new THREE.MeshPhongMaterial({
      color: 0x654321,
      shininess: 30,
      transparent: true,
      opacity: 1.0,
    });
    this.materialPool.set(0, fullDetailMaterial);
    
    // LOD 1: Simplified material
    const simplifiedMaterial = new THREE.MeshLambertMaterial({
      color: 0x654321,
      transparent: true,
      opacity: 1.0,
    });
    this.materialPool.set(1, simplifiedMaterial);
    
    // LOD 2: Basic material
    const basicMaterial = new THREE.MeshBasicMaterial({
      color: 0x654321,
      transparent: true,
      opacity: 1.0,
    });
    this.materialPool.set(2, basicMaterial);
    
    // LOD 3: Ultra-simple material
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x654321,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    this.materialPool.set(3, planeMaterial);
  }

  /**
   * Initialize instanced meshes for each LOD level
   */
  private initializeInstancedMeshes(): void {
    for (let lod = 0; lod < this.config.lodLevels; lod++) {
      const geometry = this.geometryPool.get(lod);
      const material = this.materialPool.get(lod);
      
      if (geometry && material) {
        const instancedMesh = new THREE.InstancedMesh(
          geometry, 
          material, 
          Math.floor(this.config.maxInstances / this.config.lodLevels),
        );
        
        // Initialize instance matrices
        const matrixArray = new Float32Array(instancedMesh.count * 16);
        const colorArray = new Float32Array(instancedMesh.count * 3);
        
        this.instanceMatrices.set(lod, matrixArray);
        this.instanceColors.set(lod, colorArray);
        
        // Hide all instances initially
        instancedMesh.count = 0;
        instancedMesh.frustumCulled = false; // We'll handle culling manually
        
        this.instancedMeshes.set(lod, instancedMesh);
        this.scene.add(instancedMesh);
      }
    }
  }

  /**
   * Optimize renderer settings
   */
  private optimizeRenderer(): void {
    // Enable instancing optimization
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Optimize for performance
    this.renderer.info.autoReset = false;
    
    // Set clear color
    this.renderer.setClearColor(0x87CEEB, 1); // Sky blue background
  }

  /**
   * Initialize fallback rendering for when WebGPU is not available
   */
  private initializeFallbackRendering(): void {
    console.log('Initializing fallback Three.js rendering without WebGPU');
    this.isInitialized = true;
  }

  /**
   * Update ant instances with WebGPU acceleration
   */
  public async updateAntInstances(antInstances: AntRenderInstance[]): Promise<void> {
    if (!this.isInitialized) return;

    const startTime = performance.now();
    
    // Use WebGPU for position updates if available
    if (this.webgpuPipeline && this.config.enableComputeShaderAcceleration) {
      await this.updateInstancesWithWebGPU(antInstances);
    } else {
      this.updateInstancesCPU(antInstances);
    }
    
    // Update render metrics
    this.renderMetrics.lastFrameTime = performance.now() - startTime;
    this.renderMetrics.instances = antInstances.length;
  }

  /**
   * Update instances using WebGPU compute shaders
   */
  private async updateInstancesWithWebGPU(antInstances: AntRenderInstance[]): Promise<void> {
    if (!this.webgpuPipeline) return;

    // Prepare data for WebGPU processing
    const positionData = new Float32Array(antInstances.length * 4);
    const rotationData = new Float32Array(antInstances.length * 4);
    
    for (let i = 0; i < antInstances.length; i++) {
      const ant = antInstances[i];
      if (!ant.visible) continue;
      
      // Ensure position exists before accessing
      if (ant.position) {
        positionData[i * 4] = ant.position.x;
        positionData[i * 4 + 1] = ant.position.y;
        positionData[i * 4 + 2] = ant.position.z;
        positionData[i * 4 + 3] = ant.animationState;
      } else {
        // Default position if not provided
        positionData[i * 4] = 0;
        positionData[i * 4 + 1] = 0;
        positionData[i * 4 + 2] = 0;
        positionData[i * 4 + 3] = 0;
        console.warn(`Ant instance at index ${i} missing position data`);
      }
      
      // Ensure rotation exists before accessing
      if (ant.rotation) {
        rotationData[i * 4] = ant.rotation.x;
        rotationData[i * 4 + 1] = ant.rotation.y;
        rotationData[i * 4 + 2] = ant.rotation.z;
        rotationData[i * 4 + 3] = ant.rotation.w;
      } else {
        // Default rotation if not provided
        rotationData[i * 4] = 0;
        rotationData[i * 4 + 1] = 0;
        rotationData[i * 4 + 2] = 0;
        rotationData[i * 4 + 3] = 1; // Identity quaternion
        console.warn(`Ant instance at index ${i} missing rotation data`);
      }
    }
    
    // Dispatch WebGPU compute for instance transformations
    await this.webgpuPipeline.executeComputeStep(0.016); // Use available method
    
    // Update Three.js instance matrices with computed results
    this.updateInstanceMatricesFromWebGPU(antInstances);
  }

  /**
   * Update instances using CPU
   */
  private updateInstancesCPU(antInstances: AntRenderInstance[]): void {
    // Group instances by LOD level
    const lodGroups: Map<number, AntRenderInstance[]> = new Map();
    
    for (const ant of antInstances) {
      if (!lodGroups.has(ant.lodLevel)) {
        lodGroups.set(ant.lodLevel, []);
      }
      lodGroups.get(ant.lodLevel)!.push(ant);
    }
    
    // Update each LOD group
    for (const [lodLevel, ants] of lodGroups) {
      this.updateLODGroup(lodLevel, ants);
    }
  }

  /**
   * Update a specific LOD group
   */
  private updateLODGroup(lodLevel: number, ants: AntRenderInstance[]): void {
    const instancedMesh = this.instancedMeshes.get(lodLevel);
    const matrixArray = this.instanceMatrices.get(lodLevel);
    const colorArray = this.instanceColors.get(lodLevel);
    
    if (!instancedMesh || !matrixArray || !colorArray) return;
    
    // Update instance count
    instancedMesh.count = Math.min(ants.length, instancedMesh.instanceMatrix.count);
    
    const matrix = new THREE.Matrix4();
    const defaultPosition = new THREE.Vector3(0, 0, 0);
    const defaultRotation = new THREE.Quaternion();
    const defaultScale = new THREE.Vector3(1, 1, 1);
    
    for (let i = 0; i < ants.length && i < instancedMesh.count; i++) {
      const ant = ants[i];
      
      if (!ant.visible) continue;
      
      // Create transformation matrix - handle missing properties
      const position = ant.position || defaultPosition;
      const rotation = ant.rotation || defaultRotation;
      const scale = ant.scale || defaultScale;
      
      matrix.compose(position, rotation, scale);
      matrix.toArray(matrixArray, i * 16);
      
      // Set instance color
      colorArray[i * 3] = ant.color.r;
      colorArray[i * 3 + 1] = ant.color.g;
      colorArray[i * 3 + 2] = ant.color.b;
    }
    
    // Update GPU buffers
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Update instance matrices from WebGPU computed results
   */
  private updateInstanceMatricesFromWebGPU(antInstances: AntRenderInstance[]): void {
    // This would read back the computed transformation matrices from WebGPU
    // and update the Three.js instance matrices accordingly
    // For now, just fall back to CPU update
    this.updateInstancesCPU(antInstances);
  }

  /**
   * Render the scene
   */
  public render(): void {
    if (!this.isInitialized) return;

    // Reset render info
    this.renderer.info.reset();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    
    // Update render metrics
    this.renderMetrics.drawCalls = this.renderer.info.render.calls;
    this.renderMetrics.triangles = this.renderer.info.render.triangles;
    
    // Update WebGPU utilization if available
    if (this.webgpuPipeline) {
      const webgpuMetrics = this.webgpuPipeline.getPerformanceMetrics();
      this.renderMetrics.webgpuUtilization = webgpuMetrics.gpuUtilization || 0;
    }
  }

  /**
   * Get current render metrics
   */
  public getRenderMetrics(): typeof this.renderMetrics {
    return { ...this.renderMetrics };
  }

  /**
   * Resize renderer
   */
  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Dispose of instanced meshes
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    
    // Dispose of geometries
    for (const geometry of this.geometryPool.values()) {
      geometry.dispose();
    }
    
    // Dispose of materials
    for (const material of this.materialPool.values()) {
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    }
    
    // Dispose of WebGPU resources
    if (this.webgpuPipeline) {
      this.webgpuPipeline.destroy(); // Use correct method name
    }
    
    this.instancedMeshes.clear();
    this.instanceMatrices.clear();
    this.instanceColors.clear();
    this.geometryPool.clear();
    this.materialPool.clear();
    
    this.isInitialized = false;
  }
}