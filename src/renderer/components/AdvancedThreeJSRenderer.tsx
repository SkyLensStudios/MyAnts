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
  selectedAnt
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const antMeshesRef = useRef<{ [antId: string]: THREE.Group }>({});
  const antGroupRef = useRef<THREE.Group | null>(null);
  const pheromoneSystemRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    console.log('Initializing Three.js scene...');

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    sceneRef.current = scene;

    // Camera setup - CLOSER and lower angle for better ant visibility
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
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

    // Start render loop
    startRenderLoop();

    setIsInitialized(true);
    console.log('Three.js scene initialized successfully');

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
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
      opacity: 0.9
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
        (Math.random() - 0.5) * 80
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
        y: event.clientY - previousMousePosition.y
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

  // Create detailed ant geometry
  const createAntGeometry = () => {
    const antGroup = new THREE.Group();
    
    // Body (main part)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    antGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0, 0.5);
    head.castShadow = true;
    antGroup.add(head);

    // Legs (simple cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      const angle = (i / 6) * Math.PI * 2;
      const side = i < 3 ? 1 : -1;
      leg.position.set(
        Math.cos(angle) * 0.4 * side,
        -0.3,
        Math.sin(angle) * 0.2
      );
      leg.rotation.z = side * Math.PI * 0.3;
      antGroup.add(leg);
    }

    return antGroup;
  };

  // Update ant positions
  useEffect(() => {
    if (!sceneRef.current || !antGroupRef.current || !isInitialized) return;

    const antGroup = antGroupRef.current;

    console.log(`Updating ${antData.length} ants...`);

    // Clear existing ants
    while (antGroup.children.length > 0) {
      antGroup.remove(antGroup.children[0]);
    }
    antMeshesRef.current = {};

    // Debug info
    let debugText = `Rendering ${antData.length} ants\n`;
    
    // Create new ant meshes with LARGER, more visible ants
    antData.slice(0, Math.min(antData.length, 1000)).forEach((ant, index) => {
      // Create a more visible ant
      let antColor = 0x8B4513; // Default brown
      
      // Color by caste
      switch (ant.caste) {
        case 'queen':
          antColor = 0xFFD700; // Gold
          break;
        case 'worker':
          antColor = 0x8B4513; // Brown
          break;
        case 'soldier':
          antColor = 0x800000; // Dark red
          break;
        default:
          antColor = 0x8B4513;
      }

      // Highlight selected ant
      if (selectedAnt === ant.id) {
        antColor = 0xFF0000; // Red for selected
      }

      // Create detailed ant (use geometry function or simple sphere)
      const antMesh = createAntGeometry();
      
      // Apply color to all materials
      antMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = child.material.clone();
          child.material.color.setHex(antColor);
          child.castShadow = true;
        }
      });
      
      // Position ant - make sure it's ABOVE ground
      antMesh.position.set(
        ant.position.x,
        Math.max(ant.position.y, 0.5), // Ensure ants are above ground
        ant.position.z
      );
      
      // Rotate ant based on movement (calculate from position changes if needed)
      // For now, use a random rotation or calculate from velocity if available
      antMesh.rotation.y = Math.random() * Math.PI * 2;
      
      // Store ant ID for click detection
      antMesh.userData = { antId: ant.id };
      
      antGroup.add(antMesh);
      antMeshesRef.current[ant.id] = antMesh;

      // Debug first few ants
      if (index < 5) {
        debugText += `Ant ${index}: pos(${ant.position.x.toFixed(1)}, ${ant.position.y.toFixed(1)}, ${ant.position.z.toFixed(1)})\n`;
      }
    });

    setDebugInfo(debugText);
    console.log(`Successfully created ${Object.keys(antMeshesRef.current).length} ant meshes`);
  }, [antData, selectedAnt, isInitialized]);

  // Update pheromone visualization (keep existing code but with smaller scale)
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    const scene = sceneRef.current;

    // Remove old pheromone system
    if (pheromoneSystemRef.current) {
      scene.remove(pheromoneSystemRef.current);
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
            opacity: 0.8
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
        overflow: 'hidden'
      }}
    >
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '10px' }}>
          🐜 Ant Farm Status
        </div>
        <div>Ants: {antData.length}</div>
        <div>Visible: {Object.keys(antMeshesRef.current).length}</div>
        <div>Pheromones: {pheromoneData.length}</div>
        <div>Simulation: {simulationState.isRunning ? '🟢 Running' : '🔴 Paused'}</div>
        {selectedAnt && <div>Selected: {selectedAnt}</div>}
        
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#cccccc' }}>
          <strong>Controls:</strong><br/>
          • Mouse drag: Rotate camera<br/>
          • Mouse wheel: Zoom<br/>
          • Ants should now be visible!
        </div>
        
        {debugInfo && (
          <div style={{ marginTop: '10px', fontSize: '10px', color: '#ffff00' }}>
            <strong>Debug:</strong><br/>
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedThreeJSRenderer;