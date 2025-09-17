/**
 * Advanced Three.js Renderer Component - Backend Integration
 * Connects to the sophisticated simulation backend with full feature support
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AntRenderData, SimulationState, PheromoneRenderData, EnvironmentRenderData } from '../../shared/types';

interface AdvancedThreeJSRendererProps {
  antData: AntRenderData[];
  pheromoneData: PheromoneRenderData[];
  environmentData: EnvironmentRenderData | null;
  simulationState: SimulationState | null;
  onAntSelected: (antId: string | null) => void;
  selectedAnt: string | null;
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
  const animationIdRef = useRef<number | null>(null);
  
  // Advanced rendering objects
  const antMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const pheromoneSystemRef = useRef<THREE.Points | null>(null);
  const foodSourcesRef = useRef<THREE.Group | null>(null);
  const environmentGroupRef = useRef<THREE.Group | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderStats, setRenderStats] = useState({
    fps: 0,
    antCount: 0,
    pheromoneParticles: 0,
    drawCalls: 0
  });

  // Performance monitoring
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  // Initialize advanced lighting system with multiple light sources
  const initializeAdvancedLighting = (scene: THREE.Scene) => {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
    sunLight.position.set(50, 80, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-30, 40, -30);
    scene.add(fillLight);

    // Subtle hemisphere light for natural sky lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.2);
    scene.add(hemisphereLight);
  };

  // Create realistic ant farm environment
  const createAntFarmEnvironment = (scene: THREE.Scene) => {
    const envGroup = new THREE.Group();
    environmentGroupRef.current = envGroup;
    
    // Enhanced ground plane with texture-like appearance
    const groundSize = 200;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
    
    // Create varied ground heights for realism
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      // Add subtle height variation
      const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + 
                   Math.random() * 0.2;
      positions.setY(i, height);
    }
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x6b4423,
      transparent: true,
      opacity: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    envGroup.add(ground);

    // Enhanced nest structure with multiple chambers
    createAdvancedNestStructure(envGroup);
    
    // Add environmental details
    createEnvironmentalDetails(envGroup);
    
    scene.add(envGroup);
  };

  // Create advanced nest structure
  const createAdvancedNestStructure = (parent: THREE.Group) => {
    // Main nest entrance
    const nestGeometry = new THREE.CylinderGeometry(4, 6, 2, 12);
    const nestMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const mainNest = new THREE.Mesh(nestGeometry, nestMaterial);
    mainNest.position.set(0, 1, 0);
    mainNest.castShadow = true;
    parent.add(mainNest);

    // Secondary entrances
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 15;
      const smallNestGeometry = new THREE.CylinderGeometry(2, 3, 1, 8);
      const smallNest = new THREE.Mesh(smallNestGeometry, nestMaterial);
      smallNest.position.set(
        Math.cos(angle) * distance,
        0.5,
        Math.sin(angle) * distance
      );
      smallNest.castShadow = true;
      parent.add(smallNest);
    }

    // Tunnel connections (visual hints)
    const tunnelMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x3a2718,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 15;
      const tunnelGeometry = new THREE.CylinderGeometry(0.5, 0.5, distance, 8);
      const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(
        Math.cos(angle) * distance * 0.5,
        -0.5,
        Math.sin(angle) * distance * 0.5
      );
      tunnel.rotation.x = Math.PI / 2;
      tunnel.rotation.z = angle;
      parent.add(tunnel);
    }
  };

  // Create environmental details like rocks, twigs, etc.
  const createEnvironmentalDetails = (parent: THREE.Group) => {
    // Add some rocks
    for (let i = 0; i < 8; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
      const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 180,
        Math.random() * 1,
        (Math.random() - 0.5) * 180
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      parent.add(rock);
    }

    // Add some twigs/sticks
    for (let i = 0; i < 12; i++) {
      const stickGeometry = new THREE.CylinderGeometry(0.1, 0.15, Math.random() * 8 + 4);
      const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const stick = new THREE.Mesh(stickGeometry, stickMaterial);
      stick.position.set(
        (Math.random() - 0.5) * 160,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 160
      );
      stick.rotation.set(
        Math.random() * Math.PI * 0.2,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.2
      );
      stick.castShadow = true;
      parent.add(stick);
    }
  };

  // Main initialization useEffect
  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Create advanced renderer with optimization
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x1a4b3a, 1); // Darker forest green background
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create scene with fog for depth perception
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x1a4b3a, 50, 200);
      sceneRef.current = scene;

      // Create camera with optimal settings for ant farm viewing
      const camera = new THREE.PerspectiveCamera(
        60, // Slightly narrower FOV for better ant details
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(40, 40, 40);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Initialize advanced lighting system
      initializeAdvancedLighting(scene);
      
      // Create realistic ant farm environment
      createAntFarmEnvironment(scene);
      
      // Initialize pheromone visualization system
      initializePheromoneSystem(scene);
      
      // Initialize food source visualization
      initializeFoodSources(scene);
      
      // Add advanced camera controls
      initializeAdvancedCameraControls(renderer.domElement, camera);

      // Start optimized render loop
      startAdvancedRenderLoop(renderer, scene, camera);

      setIsInitialized(true);
      console.log('🎮 Advanced Three.js renderer with backend integration initialized');

    } catch (err) {
      console.error('Failed to initialize advanced Three.js:', err);
      setError(`Advanced 3D renderer failed: ${err}`);
    }

    // Cleanup function
    return () => {
      cleanup();
    };
  }, []);

  // Initialize advanced lighting system with multiple light sources
  const initializeAdvancedLighting = (scene: THREE.Scene) => {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
    sunLight.position.set(50, 80, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-30, 40, -30);
    scene.add(fillLight);

    // Subtle hemisphere light for natural sky lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.2);
    scene.add(hemisphereLight);
  };

  // Create realistic ant farm environment
  const createAntFarmEnvironment = (scene: THREE.Scene) => {
    const envGroup = new THREE.Group();
    environmentGroupRef.current = envGroup;
    
    // Enhanced ground plane with texture-like appearance
    const groundSize = 200;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
    
    // Create varied ground heights for realism
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      // Add subtle height variation
      const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + 
                   Math.random() * 0.2;
      positions.setY(i, height);
    }
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x6b4423,
      transparent: true,
      opacity: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    envGroup.add(ground);

    // Enhanced nest structure with multiple chambers
    createAdvancedNestStructure(envGroup);
    
    // Add environmental details
    createEnvironmentalDetails(envGroup);
    
    scene.add(envGroup);
  };

  // Create advanced nest structure
  const createAdvancedNestStructure = (parent: THREE.Group) => {
    // Main nest entrance
    const nestGeometry = new THREE.CylinderGeometry(4, 6, 2, 12);
    const nestMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const mainNest = new THREE.Mesh(nestGeometry, nestMaterial);
    mainNest.position.set(0, 1, 0);
    mainNest.castShadow = true;
    parent.add(mainNest);

    // Secondary entrances
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 15;
      const smallNestGeometry = new THREE.CylinderGeometry(2, 3, 1, 8);
      const smallNest = new THREE.Mesh(smallNestGeometry, nestMaterial);
      smallNest.position.set(
        Math.cos(angle) * distance,
        0.5,
        Math.sin(angle) * distance
      );
      smallNest.castShadow = true;
      parent.add(smallNest);
    }

    // Tunnel connections (visual hints)
    const tunnelMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x3a2718,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 15;
      const tunnelGeometry = new THREE.CylinderGeometry(0.5, 0.5, distance, 8);
      const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(
        Math.cos(angle) * distance * 0.5,
        -0.5,
        Math.sin(angle) * distance * 0.5
      );
      tunnel.rotation.x = Math.PI / 2;
      tunnel.rotation.z = angle;
      parent.add(tunnel);
    }
  };

  // Create environmental details like rocks, twigs, etc.
  const createEnvironmentalDetails = (parent: THREE.Group) => {
    // Add some rocks
    for (let i = 0; i < 8; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
      const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 180,
        Math.random() * 1,
        (Math.random() - 0.5) * 180
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      parent.add(rock);
    }

    // Add some twigs/sticks
    for (let i = 0; i < 12; i++) {
      const stickGeometry = new THREE.CylinderGeometry(0.1, 0.15, Math.random() * 8 + 4);
      const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const stick = new THREE.Mesh(stickGeometry, stickMaterial);
      stick.position.set(
        (Math.random() - 0.5) * 160,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 160
      );
      stick.rotation.set(
        Math.random() * Math.PI * 0.2,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.2
      );
      stick.castShadow = true;
      parent.add(stick);
    }
  // Initialize pheromone visualization system
  const initializePheromoneSystem = (scene: THREE.Scene) => {
    // Create particle system for pheromone visualization
    const maxParticles = 10000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    
    const pheromoneSystem = new THREE.Points(geometry, material);
    pheromoneSystemRef.current = pheromoneSystem;
    scene.add(pheromoneSystem);
  };

  // Initialize food source visualization
  const initializeFoodSources = (scene: THREE.Scene) => {
    const foodGroup = new THREE.Group();
    foodSourcesRef.current = foodGroup;
    scene.add(foodGroup);
  };

  // Initialize advanced camera controls
  const initializeAdvancedCameraControls = (domElement: HTMLCanvasElement, camera: THREE.PerspectiveCamera) => {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let isRightClick = false;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      isRightClick = event.button === 2;
      mouseX = event.clientX;
      mouseY = event.clientY;
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !camera) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      if (isRightClick) {
        // Pan camera
        const panSpeed = 0.1;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.getWorldDirection(right);
        right.cross(camera.up).normalize();
        up.copy(camera.up);
        
        const panVector = new THREE.Vector3()
          .addScaledVector(right, -deltaX * panSpeed)
          .addScaledVector(up, deltaY * panSpeed);
        
        camera.position.add(panVector);
      } else {
        // Rotate camera around center
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta += deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      }
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
      isRightClick = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (!camera) return;
      const distance = camera.position.length();
      const newDistance = Math.max(5, Math.min(300, distance + event.deltaY * 0.1));
      camera.position.normalize().multiplyScalar(newDistance);
      event.preventDefault();
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    domElement.addEventListener('mousedown', onMouseDown);
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('contextmenu', onContextMenu);
  };

  // Start advanced render loop with performance monitoring
  const startAdvancedRenderLoop = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Update performance stats
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFpsUpdateRef.current > 1000) {
        setRenderStats(prev => ({
          ...prev,
          fps: Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)),
          antCount: antData?.length || 0,
          pheromoneParticles: pheromoneData?.length || 0,
          drawCalls: renderer.info.render.calls
        }));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      // Update animations and effects
      updatePheromoneVisualization();
      updateFoodSourceVisualization();
      updateAntAnimations();
      
      renderer.render(scene, camera);
    };
    animate();
  };

  // Update pheromone visualization from backend data
  const updatePheromoneVisualization = () => {
    if (!pheromoneSystemRef.current || !pheromoneData || pheromoneData.length === 0) return;
    
    const geometry = pheromoneSystemRef.current.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;
    
    let particleIndex = 0;
    
    pheromoneData.forEach(pheromone => {
      const grid = pheromone.concentrationGrid;
      const width = pheromone.width;
      const height = pheromone.height;
      const cellSize = pheromone.cellSize;
      const maxConcentration = pheromone.maxConcentration;
      
      // Sample particles from concentration grid
      for (let x = 0; x < width && particleIndex < 10000; x += 2) {
        for (let z = 0; z < height && particleIndex < 10000; z += 2) {
          const concentration = grid[x * height + z];
          
          if (concentration > 0.01 && Math.random() < concentration / maxConcentration) {
            // Position
            positions[particleIndex * 3] = (x - width / 2) * cellSize;
            positions[particleIndex * 3 + 1] = 0.2;
            positions[particleIndex * 3 + 2] = (z - height / 2) * cellSize;
            
            // Color based on pheromone type
            const intensity = concentration / maxConcentration;
            switch (pheromone.type) {
              case 'trail':
                colors[particleIndex * 3] = 0.0;     // R
                colors[particleIndex * 3 + 1] = 0.8;  // G
                colors[particleIndex * 3 + 2] = 1.0;  // B
                break;
              case 'alarm':
                colors[particleIndex * 3] = 1.0;     // R
                colors[particleIndex * 3 + 1] = 0.2;  // G
                colors[particleIndex * 3 + 2] = 0.0;  // B
                break;
              default:
                colors[particleIndex * 3] = 0.8;     // R
                colors[particleIndex * 3 + 1] = 0.8;  // G
                colors[particleIndex * 3 + 2] = 0.0;  // B
            }
            
            sizes[particleIndex] = intensity * 2.0;
            particleIndex++;
          }
        }
      }
    });
    
    // Hide unused particles
    for (let i = particleIndex; i < 10000; i++) {
      sizes[i] = 0;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  };

  // Update food source visualization from backend data
  const updateFoodSourceVisualization = () => {
    if (!foodSourcesRef.current || !environmentData?.foodSources) return;
    
    const foodGroup = foodSourcesRef.current;
    
    // Clear existing food sources
    foodGroup.clear();
    
    // Add food sources from backend
    environmentData.foodSources.forEach(food => {
      const size = Math.max(0.5, Math.min(4, food.quantity / 10));
      const geometry = new THREE.SphereGeometry(size, 12, 8);
      
      // Color based on food type
      let color = 0x90EE90; // Default green
      switch (food.type) {
        case 'seed': color = 0xDEB887; break;
        case 'protein': color = 0xFF6347; break;
        case 'insect': color = 0x8B4513; break;
        case 'sugar': color = 0xFFD700; break;
        case 'leaf': color = 0x228B22; break;
      }
      
      const material = new THREE.MeshLambertMaterial({ 
        color: color,
        transparent: true,
        opacity: Math.max(0.3, food.quantity / 100) // Normalize against expected max quantity
      });
      
      const foodMesh = new THREE.Mesh(geometry, material);
      foodMesh.position.set(food.position.x, food.position.y + size, food.position.z);
      foodMesh.castShadow = true;
      foodMesh.userData = { type: 'food', id: food.id };
      
      foodGroup.add(foodMesh);
    });
  };

  // Update ant representations with enhanced details
  const updateAntAnimations = () => {
    if (!sceneRef.current || !antData || antData.length === 0) return;
    
    const scene = sceneRef.current;
    const currentAntMeshes = antMeshesRef.current;
    
    // Remove ants that no longer exist
    const currentAntIds = new Set(antData.map(ant => ant.id));
    for (const [id, mesh] of currentAntMeshes.entries()) {
      if (!currentAntIds.has(id)) {
        scene.remove(mesh);
        currentAntMeshes.delete(id);
      }
    }
    
    // Update existing ants and add new ones (limit to 500 for performance)
    const visibleAnts = antData.slice(0, 500);
    visibleAnts.forEach(ant => {
      let antMesh = currentAntMeshes.get(ant.id);
      
      if (!antMesh) {
        // Create new ant mesh with enhanced appearance
        const antGeometry = createAntGeometry(ant);
        const antMaterial = createAntMaterial(ant);
        antMesh = new THREE.Mesh(antGeometry, antMaterial);
        antMesh.castShadow = true;
        antMesh.userData = { type: 'ant', id: ant.id, caste: ant.caste };
        
        scene.add(antMesh);
        currentAntMeshes.set(ant.id, antMesh);
      }
      
      // Update position and rotation
      antMesh.position.set(ant.position.x, ant.position.y + 0.3, ant.position.z);
      antMesh.rotation.y = ant.rotation;
      
      // Update material based on state
      const material = antMesh.material as THREE.MeshLambertMaterial;
      
      // Highlight selected ant
      if (selectedAnt === ant.id) {
        material.color.setHex(0xff0000);
        material.emissive.setHex(0x330000);
      } else {
        // Color based on caste and state
        material.color.setHex(getAntColor(ant));
        material.emissive.setHex(0x000000);
      }
      
      // Scale based on health
      const healthScale = Math.max(0.5, ant.health);
      antMesh.scale.setScalar(healthScale);
    });
  };

  // Create ant geometry based on caste
  const createAntGeometry = (ant: AntRenderData): THREE.BufferGeometry => {
    const group = new THREE.Group();
    
    // Body parts with proper proportions
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const thoraxGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const abdomenGeometry = new THREE.SphereGeometry(0.35, 8, 6);
    
    const head = new THREE.Mesh(headGeometry);
    head.position.set(0, 0, 0.4);
    
    const thorax = new THREE.Mesh(thoraxGeometry);
    thorax.position.set(0, 0, 0);
    
    const abdomen = new THREE.Mesh(abdomenGeometry);
    abdomen.position.set(0, 0, -0.5);
    
    group.add(head, thorax, abdomen);
    
    // Merge geometries for performance
    const finalGeometry = new THREE.BufferGeometry();
    // For simplicity, use a single ellipsoid for now
    return new THREE.SphereGeometry(0.4, 6, 4);
  };

  // Create ant material based on caste and state
  const createAntMaterial = (ant: AntRenderData): THREE.MeshLambertMaterial => {
    return new THREE.MeshLambertMaterial({
      color: getAntColor(ant),
      transparent: true,
      opacity: ant.isAlive ? 1.0 : 0.5
    });
  };

  // Get ant color based on caste and state
  const getAntColor = (ant: AntRenderData): number => {
    if (!ant.isAlive) return 0x666666;
    
    // Base color by caste
    let baseColor = 0x8B4513; // Default brown
    switch (ant.caste) {
      case 'queen': baseColor = 0xFF6B35; break;
      case 'soldier': baseColor = 0x8B0000; break;
      case 'worker': baseColor = 0x8B4513; break;
      case 'nurse': baseColor = 0xDEB887; break;
    }
    
    // Modify based on state
    if (ant.carryingFood) {
      // Slightly greenish tint when carrying food
      const r = (baseColor >> 16) & 0xff;
      const g = Math.min(255, ((baseColor >> 8) & 0xff) + 30);
      const b = (baseColor) & 0xff;
      return (r << 16) | (g << 8) | b;
    }
    
    return baseColor;
  };

  // Cleanup function
  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (rendererRef.current && mountRef.current) {
      try {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
    }
    // Clear ant meshes
    antMeshesRef.current.clear();
  };

  // Update data when props change
  useEffect(() => {
    if (isInitialized) {
      updatePheromoneVisualization();
      updateFoodSourceVisualization();
      updateAntAnimations();
    }
  }, [antData, pheromoneData, environmentData, selectedAnt, isInitialized]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ff6b6b',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3>🚫 Advanced 3D Renderer Error</h3>
        <p>{error}</p>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          This may be due to WebGL compatibility issues or insufficient graphics support.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={mountRef} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div>🔬 Initializing Advanced Ant Farm Renderer...</div>
          <div style={{ fontSize: '12px', marginTop: '10px' }}>
            Connecting to simulation backend systems
          </div>
        </div>
      )}

      {isInitialized && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div>🐜 Advanced Ant Farm Simulator</div>
          <div>FPS: {renderStats.fps}</div>
          <div>Ants: {renderStats.antCount}</div>
          <div>Pheromones: {renderStats.pheromoneParticles}</div>
          <div>Draw Calls: {renderStats.drawCalls}</div>
          <div style={{ marginTop: '5px', fontSize: '10px' }}>
            Left Click: Rotate | Right Click: Pan | Wheel: Zoom
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedThreeJSRenderer;