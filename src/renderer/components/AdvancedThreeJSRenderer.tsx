import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AntRenderData, PheromoneRenderData, FoodSource, EnvironmentRenderData, SimulationState } from '../../shared/types';

interface AdvancedThreeJSRendererProps {
  antData: AntRenderData[];
  pheromoneData: PheromoneRenderData[];
  environmentData: EnvironmentRenderData;
  simulationState: SimulationState;
  onAntSelected?: (antId: string) => void;
  selectedAnt?: string | null;
}

const AdvancedThreeJSRenderer: React.FC<AdvancedThreeJSRendererProps> = ({
  antData,
  pheromoneData,
  environmentData,
  simulationState,
  onAntSelected,
  selectedAnt,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const antMeshesRef = useRef<{ [antId: string]: THREE.Group }>({});
  const antGroupRef = useRef<THREE.Group | null>(null);
  const pheromoneSystemRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  // Memory management for object pooling
  const geometryPoolRef = useRef<{
    antBody?: THREE.CapsuleGeometry;
    antHead?: THREE.SphereGeometry;
    antLeg?: THREE.CylinderGeometry;
  }>({});
  const materialPoolRef = useRef<{
    antBody?: THREE.MeshLambertMaterial;
    antHead?: THREE.MeshLambertMaterial;
    antLeg?: THREE.MeshLambertMaterial;
  }>({});
  
  // Instanced mesh system for massive performance improvement
  const instancedMeshesRef = useRef<{
    workers?: THREE.InstancedMesh;
    soldiers?: THREE.InstancedMesh;
    queens?: THREE.InstancedMesh;
  }>({});
  const instanceMatricesRef = useRef<{
    workers?: Float32Array;
    soldiers?: Float32Array;
    queens?: Float32Array;
  }>({});
  const instanceColorsRef = useRef<{
    workers?: Float32Array;
    soldiers?: Float32Array;
    queens?: Float32Array;
  }>({});
  const maxInstancesRef = useRef({
    workers: 1500,  // Increased to handle 1000+ workers
    soldiers: 300,  // Increased for larger colonies
    queens: 100,     // Increased for multiple queens
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Memory management functions
  const initializeObjectPools = () => {
    // Create reusable geometries
    geometryPoolRef.current.antBody = new THREE.CapsuleGeometry(1.0, 2.5, 6, 8);
    geometryPoolRef.current.antHead = new THREE.SphereGeometry(0.8, 12, 8);
    geometryPoolRef.current.antLeg = new THREE.CylinderGeometry(0.15, 0.15, 1.5);

    // Create reusable materials
    materialPoolRef.current.antBody = new THREE.MeshLambertMaterial({ color: 0x000000 });
    materialPoolRef.current.antHead = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    materialPoolRef.current.antLeg = new THREE.MeshLambertMaterial({ color: 0x000000 });
  };

  const initializeInstancedMeshes = () => {
    if (!sceneRef.current || !antGroupRef.current) return;

    const antGroup = antGroupRef.current;
    
    // Create simple ant geometry for instancing (combine all parts into one)
    const combinedGeometry = new THREE.BoxGeometry(2.0, 0.5, 3.0); // Much larger box ant for visibility
    
    // Create instanced materials for different castes (with vertex colors enabled)
    const workerMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513, // Brown fallback
      vertexColors: true, // Enable instance colors
    }); 
    const soldierMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x800000, // Dark red fallback
      vertexColors: true, // Enable instance colors
    }); 
    const queenMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFFD700, // Gold fallback
      vertexColors: true, // Enable instance colors
    });

    // Create instanced meshes for each caste
    instancedMeshesRef.current.workers = new THREE.InstancedMesh(
      combinedGeometry, 
      workerMaterial, 
      maxInstancesRef.current.workers,
    );
    instancedMeshesRef.current.soldiers = new THREE.InstancedMesh(
      combinedGeometry.clone(), 
      soldierMaterial, 
      maxInstancesRef.current.soldiers,
    );
    instancedMeshesRef.current.queens = new THREE.InstancedMesh(
      combinedGeometry.clone(), 
      queenMaterial, 
      maxInstancesRef.current.queens,
    );

    // Initialize matrices and colors
    instanceMatricesRef.current.workers = new Float32Array(maxInstancesRef.current.workers * 16);
    instanceMatricesRef.current.soldiers = new Float32Array(maxInstancesRef.current.soldiers * 16);
    instanceMatricesRef.current.queens = new Float32Array(maxInstancesRef.current.queens * 16);

    instanceColorsRef.current.workers = new Float32Array(maxInstancesRef.current.workers * 3);
    instanceColorsRef.current.soldiers = new Float32Array(maxInstancesRef.current.soldiers * 3);
    instanceColorsRef.current.queens = new Float32Array(maxInstancesRef.current.queens * 3);

    // Set initial colors
    for (let i = 0; i < maxInstancesRef.current.workers; i++) {
      instanceColorsRef.current.workers![i * 3] = 0.545; // Brown R
      instanceColorsRef.current.workers![i * 3 + 1] = 0.271; // Brown G
      instanceColorsRef.current.workers![i * 3 + 2] = 0.075; // Brown B
    }

    for (let i = 0; i < maxInstancesRef.current.soldiers; i++) {
      instanceColorsRef.current.soldiers![i * 3] = 0.5; // Dark red R
      instanceColorsRef.current.soldiers![i * 3 + 1] = 0; // Dark red G
      instanceColorsRef.current.soldiers![i * 3 + 2] = 0; // Dark red B
    }

    for (let i = 0; i < maxInstancesRef.current.queens; i++) {
      instanceColorsRef.current.queens![i * 3] = 1.0; // Gold R
      instanceColorsRef.current.queens![i * 3 + 1] = 0.843; // Gold G
      instanceColorsRef.current.queens![i * 3 + 2] = 0; // Gold B
    }

    // Set up color attributes
    instancedMeshesRef.current.workers.instanceColor = new THREE.InstancedBufferAttribute(instanceColorsRef.current.workers, 3);
    instancedMeshesRef.current.soldiers.instanceColor = new THREE.InstancedBufferAttribute(instanceColorsRef.current.soldiers, 3);
    instancedMeshesRef.current.queens.instanceColor = new THREE.InstancedBufferAttribute(instanceColorsRef.current.queens, 3);

    // Enable shadows
    instancedMeshesRef.current.workers.castShadow = true;
    instancedMeshesRef.current.soldiers.castShadow = true;
    instancedMeshesRef.current.queens.castShadow = true;

    // Initially hide all instances (count = 0)
    instancedMeshesRef.current.workers.count = 0;
    instancedMeshesRef.current.soldiers.count = 0;
    instancedMeshesRef.current.queens.count = 0;

    // Add to scene
    antGroup.add(instancedMeshesRef.current.workers);
    antGroup.add(instancedMeshesRef.current.soldiers);
    antGroup.add(instancedMeshesRef.current.queens);
  };

  const disposeObjectPools = () => {
    // Dispose of geometries
    geometryPoolRef.current.antBody?.dispose();
    geometryPoolRef.current.antHead?.dispose();
    geometryPoolRef.current.antLeg?.dispose();

    // Dispose of materials
    materialPoolRef.current.antBody?.dispose();
    materialPoolRef.current.antHead?.dispose();
    materialPoolRef.current.antLeg?.dispose();

    // Clear references
    geometryPoolRef.current = {};
    materialPoolRef.current = {};
  };

  const disposeInstancedMeshes = () => {
    if (instancedMeshesRef.current.workers) {
      instancedMeshesRef.current.workers.geometry.dispose();
      if (Array.isArray(instancedMeshesRef.current.workers.material)) {
        instancedMeshesRef.current.workers.material.forEach(mat => mat.dispose());
      } else {
        instancedMeshesRef.current.workers.material.dispose();
      }
      antGroupRef.current?.remove(instancedMeshesRef.current.workers);
    }
    
    if (instancedMeshesRef.current.soldiers) {
      instancedMeshesRef.current.soldiers.geometry.dispose();
      if (Array.isArray(instancedMeshesRef.current.soldiers.material)) {
        instancedMeshesRef.current.soldiers.material.forEach(mat => mat.dispose());
      } else {
        instancedMeshesRef.current.soldiers.material.dispose();
      }
      antGroupRef.current?.remove(instancedMeshesRef.current.soldiers);
    }
    
    if (instancedMeshesRef.current.queens) {
      instancedMeshesRef.current.queens.geometry.dispose();
      if (Array.isArray(instancedMeshesRef.current.queens.material)) {
        instancedMeshesRef.current.queens.material.forEach(mat => mat.dispose());
      } else {
        instancedMeshesRef.current.queens.material.dispose();
      }
      antGroupRef.current?.remove(instancedMeshesRef.current.queens);
    }

    // Clear references
    instancedMeshesRef.current = {};
    instanceMatricesRef.current = {};
    instanceColorsRef.current = {};
  };

  const disposeAntMesh = (antGroup: THREE.Group) => {
    // Traverse and dispose of geometries and materials for individual meshes
    antGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Only dispose if it's not from the shared pool (custom geometries/materials)
        if (child.geometry !== geometryPoolRef.current.antBody &&
            child.geometry !== geometryPoolRef.current.antHead &&
            child.geometry !== geometryPoolRef.current.antLeg) {
          child.geometry.dispose();
        }
        
        if (child.material !== materialPoolRef.current.antBody &&
            child.material !== materialPoolRef.current.antHead &&
            child.material !== materialPoolRef.current.antLeg) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  };

  const disposeAllAntMeshes = () => {
    // Dispose of all existing ant meshes
    Object.values(antMeshesRef.current).forEach(antGroup => {
      disposeAntMesh(antGroup);
    });
    antMeshesRef.current = {};
  };

  const disposePheromoneSystem = () => {
    if (pheromoneSystemRef.current) {
      pheromoneSystemRef.current.geometry.dispose();
      if (Array.isArray(pheromoneSystemRef.current.material)) {
        pheromoneSystemRef.current.material.forEach(material => material.dispose());
      } else {
        pheromoneSystemRef.current.material.dispose();
      }
      sceneRef.current?.remove(pheromoneSystemRef.current);
      pheromoneSystemRef.current = null;
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    // Initialize object pools for memory efficiency
    initializeObjectPools();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    sceneRef.current = scene;

    // Camera setup - CLOSER and lower angle for better ant visibility
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    // Much closer camera position for seeing ants
    camera.position.set(0, 25, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    setupLighting(scene);

    // Environment setup
    setupEnvironment(scene);

    // Controls setup
    setupControls(camera, renderer);

    // Create ant group for better management
    const antGroup = new THREE.Group();
    scene.add(antGroup);
    antGroupRef.current = antGroup;

    // Initialize instanced meshes for massive performance improvement
    initializeInstancedMeshes();

    // Start render loop
    startRenderLoop();

    setIsInitialized(true);

    // Cleanup function with proper memory disposal
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      // Dispose of all ant meshes and their resources
      disposeAllAntMeshes();
      
      // Dispose of instanced meshes
      disposeInstancedMeshes();
      
      // Dispose of object pools
      disposeObjectPools();
      
      // Dispose of pheromone system
      if (pheromoneSystemRef.current) {
        disposePheromoneSystem();
      }
      
      // Remove renderer from DOM and dispose
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Setup lighting system
  const setupLighting = (scene: THREE.Scene) => {
    // Brighter ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Additional point lights for better ant visibility
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight1.position.set(-30, 20, -30);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(30, 20, 30);
    scene.add(pointLight2);
  };

  // Setup environment (ground, nest, food sources)
  const setupEnvironment = (scene: THREE.Scene) => {
    // SMALLER ground plane for better scale
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B7355,
      transparent: true,
      opacity: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // SMALLER nest structure
    const nestGeometry = new THREE.CylinderGeometry(4, 5, 1, 8);
    const nestMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.set(0, 0.5, 0);
    nest.castShadow = true;
    scene.add(nest);

    // Add some environmental details (smaller scale)
    for (let i = 0; i < 5; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5);
      const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 1,
        (Math.random() - 0.5) * 80,
      );
      rock.castShadow = true;
      scene.add(rock);
    }
  };

  // Setup camera controls
  const setupControls = (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      // Rotate camera around center
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaMove.x * 0.01;
      spherical.phi += deltaMove.y * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (event: WheelEvent) => {
      const zoomSpeed = 0.1;
      const distance = camera.position.length();
      const newDistance = Math.max(10, Math.min(100, distance + event.deltaY * zoomSpeed));
      camera.position.normalize().multiplyScalar(newDistance);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
  };

  // Start the render loop
  const startRenderLoop = () => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
  };

  // Create detailed ant geometry using object pools
  const createAntGeometry = () => {
    const antGroup = new THREE.Group();
    
    // Body (main part) - use pooled geometry and materials
    const body = new THREE.Mesh(
      geometryPoolRef.current.antBody!, 
      materialPoolRef.current.antBody!,
    );
    body.castShadow = true;
    antGroup.add(body);

    // Head - use pooled geometry and materials
    const head = new THREE.Mesh(
      geometryPoolRef.current.antHead!, 
      materialPoolRef.current.antHead!,
    );
    head.position.set(0, 0, 0.5);
    head.castShadow = true;
    antGroup.add(head);

    // Legs (simple cylinders) - use pooled geometry and materials
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(
        geometryPoolRef.current.antLeg!, 
        materialPoolRef.current.antLeg!,
      );
      const angle = (i / 6) * Math.PI * 2;
      const side = i < 3 ? 1 : -1;
      leg.position.set(
        Math.cos(angle) * 0.4 * side,
        -0.3,
        Math.sin(angle) * 0.2,
      );
      leg.rotation.z = side * Math.PI * 0.3;
      antGroup.add(leg);
    }

    return antGroup;
  };

  // Update ant positions using high-performance instanced rendering
  useEffect(() => {
    console.log(`🐜 AdvancedThreeJSRenderer: useEffect triggered with ${antData.length} ants`);
    console.log(`AdvancedThreeJSRenderer: Received ${antData.length} ants for rendering`);
    if (!sceneRef.current || !antGroupRef.current || !isInitialized) {
      console.log('🚫 AdvancedThreeJSRenderer: Scene not ready for rendering', {
        scene: !!sceneRef.current,
        antGroup: !!antGroupRef.current,
        initialized: isInitialized,
      });
      return;
    }
    if (!instancedMeshesRef.current.workers) {
      console.log('🚫 AdvancedThreeJSRenderer: Instanced meshes not ready');
      return; // Wait for instanced meshes
    }

    console.log('✅ AdvancedThreeJSRenderer: All systems ready, proceeding with rendering');

    // Separate ants by caste for instanced rendering
    const workers = antData.filter(ant => ant.caste === 'worker' || !ant.caste);
    const soldiers = antData.filter(ant => ant.caste === 'soldier');
    const queens = antData.filter(ant => ant.caste === 'queen');

    console.log(`🎯 AdvancedThreeJSRenderer: Rendering ${workers.length} workers, ${soldiers.length} soldiers, ${queens.length} queens`);

    const matrix = new THREE.Matrix4();

    // Update worker instances
    if (instancedMeshesRef.current.workers && instanceMatricesRef.current.workers) {
      const maxWorkers = Math.min(workers.length, maxInstancesRef.current.workers);
      console.log(`AdvancedThreeJSRenderer: Setting up ${maxWorkers} worker instances`);
      
      for (let i = 0; i < maxWorkers; i++) {
        const ant = workers[i];
        const isSelected = selectedAnt === ant.id;
        
        // Set position and rotation
        matrix.makeRotationY(ant.rotation || 0);
        matrix.setPosition(
          ant.position.x,
          Math.max(ant.position.y, 1.25), // Position above nest (nest height=1, top at Y=1)
          ant.position.z,
        );
        
        // Debug first few ants
        if (i < 3) {
          console.log(`Worker ${i}: position (${ant.position.x}, ${ant.position.y}, ${ant.position.z}), rotation: ${ant.rotation}`);
        }
        
        // Apply matrix to instance
        matrix.toArray(instanceMatricesRef.current.workers, i * 16);
        
        // Update color if selected
        if (isSelected) {
          instanceColorsRef.current.workers![i * 3] = 1.0; // Red for selected
          instanceColorsRef.current.workers![i * 3 + 1] = 0;
          instanceColorsRef.current.workers![i * 3 + 2] = 0;
        } else {
          instanceColorsRef.current.workers![i * 3] = 0.545; // Brown
          instanceColorsRef.current.workers![i * 3 + 1] = 0.271;
          instanceColorsRef.current.workers![i * 3 + 2] = 0.075;
        }
      }
      
      // Update the instance matrix attribute
      instancedMeshesRef.current.workers.instanceMatrix.needsUpdate = true;
      instancedMeshesRef.current.workers.instanceColor!.needsUpdate = true;
      instancedMeshesRef.current.workers.count = maxWorkers;
      console.log(`AdvancedThreeJSRenderer: Set worker mesh count to ${maxWorkers}`);
    }

    // Update soldier instances
    if (instancedMeshesRef.current.soldiers && instanceMatricesRef.current.soldiers) {
      const maxSoldiers = Math.min(soldiers.length, maxInstancesRef.current.soldiers);
      
      for (let i = 0; i < maxSoldiers; i++) {
        const ant = soldiers[i];
        const isSelected = selectedAnt === ant.id;
        
        matrix.makeRotationY(ant.rotation || 0);
        matrix.setPosition(
          ant.position.x,
          Math.max(ant.position.y, 1.25), // Position above nest
          ant.position.z,
        );
        
        matrix.toArray(instanceMatricesRef.current.soldiers, i * 16);
        
        if (isSelected) {
          instanceColorsRef.current.soldiers![i * 3] = 1.0; // Red for selected
          instanceColorsRef.current.soldiers![i * 3 + 1] = 0;
          instanceColorsRef.current.soldiers![i * 3 + 2] = 0;
        } else {
          instanceColorsRef.current.soldiers![i * 3] = 0.5; // Dark red
          instanceColorsRef.current.soldiers![i * 3 + 1] = 0;
          instanceColorsRef.current.soldiers![i * 3 + 2] = 0;
        }
      }
      
      instancedMeshesRef.current.soldiers.instanceMatrix.needsUpdate = true;
      instancedMeshesRef.current.soldiers.instanceColor!.needsUpdate = true;
      instancedMeshesRef.current.soldiers.count = maxSoldiers;
    }

    // Update queen instances
    if (instancedMeshesRef.current.queens && instanceMatricesRef.current.queens) {
      const maxQueens = Math.min(queens.length, maxInstancesRef.current.queens);
      
      for (let i = 0; i < maxQueens; i++) {
        const ant = queens[i];
        const isSelected = selectedAnt === ant.id;
        
        matrix.makeRotationY(ant.rotation || 0);
        matrix.setPosition(
          ant.position.x,
          Math.max(ant.position.y, 1.25), // Position above nest
          ant.position.z,
        );
        
        matrix.toArray(instanceMatricesRef.current.queens, i * 16);
        
        if (isSelected) {
          instanceColorsRef.current.queens![i * 3] = 1.0; // Red for selected
          instanceColorsRef.current.queens![i * 3 + 1] = 0;
          instanceColorsRef.current.queens![i * 3 + 2] = 0;
        } else {
          instanceColorsRef.current.queens![i * 3] = 1.0; // Gold
          instanceColorsRef.current.queens![i * 3 + 1] = 0.843;
          instanceColorsRef.current.queens![i * 3 + 2] = 0;
        }
      }
      
      instancedMeshesRef.current.queens.instanceMatrix.needsUpdate = true;
      instancedMeshesRef.current.queens.instanceColor!.needsUpdate = true;
      instancedMeshesRef.current.queens.count = maxQueens;
    }
  }, [antData, selectedAnt, isInitialized]);

  // Update pheromone visualization (keep existing code but with smaller scale)
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    const scene = sceneRef.current;

    // Remove old pheromone system with proper disposal
    if (pheromoneSystemRef.current) {
      disposePheromoneSystem();
    }

    if (pheromoneData.length > 0) {
      // Create pheromone visualization from grid data
      pheromoneData.forEach(pheromoneField => {
        const { concentrationGrid, width, height, cellSize } = pheromoneField;
        
        // Create points for visible pheromone concentrations
        const positions: number[] = [];
        const colors: number[] = [];
        
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const index = y * width + x;
            const concentration = concentrationGrid[index];
            
            if (concentration > 0.01) { // Only show visible concentrations
              // World position (smaller scale)
              const worldX = (x - width / 2) * cellSize * 0.5; // Scale down
              const worldZ = (y - height / 2) * cellSize * 0.5; // Scale down
              
              positions.push(worldX, 0.1, worldZ);
              
              // Color based on pheromone type
              switch (pheromoneField.type) {
                case 'trail':
                  colors.push(0, 1, 0); // Green
                  break;
                case 'alarm':
                  colors.push(1, 0, 0); // Red
                  break;
                case 'recruitment':
                  colors.push(0, 0, 1); // Blue
                  break;
                default:
                  colors.push(1, 1, 0); // Yellow
              }
            }
          }
        }
        
        if (positions.length > 0) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

          const material = new THREE.PointsMaterial({
            size: 4, // Larger points
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
          });

          const pheromoneSystem = new THREE.Points(geometry, material);
          scene.add(pheromoneSystem);
          pheromoneSystemRef.current = pheromoneSystem;
        }
      });
    }
  }, [pheromoneData, isInitialized]);

  // Handle food sources (smaller scale)
  useEffect(() => {
    if (!sceneRef.current || !isInitialized || !environmentData?.foodSources) return;

    const scene = sceneRef.current;

    environmentData.foodSources.forEach((food: FoodSource) => {
      const foodGeometry = new THREE.SphereGeometry(1, 12, 8); // Smaller food
      const foodMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
      const foodMesh = new THREE.Mesh(foodGeometry, foodMaterial);
      foodMesh.position.set(food.position.x * 0.5, food.position.y + 0.5, food.position.z * 0.5); // Scale down
      foodMesh.castShadow = true;
      scene.add(foodMesh);
    });
  }, [environmentData, isInitialized]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
      }}>
        <div>🐜 Ants: {antData.length}</div>
        <div>{simulationState.isRunning ? '🟢 Running' : '🔴 Paused'}</div>
        {selectedAnt && <div>Selected: {selectedAnt}</div>}
      </div>
    </div>
  );
};

export default AdvancedThreeJSRenderer;