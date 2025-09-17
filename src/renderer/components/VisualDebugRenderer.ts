import * as THREE from 'three';
import { AntRenderData } from '../../shared/types';

interface VisualDebugOverlayOptions {
  pheromoneTrails: boolean;
  antPaths: boolean;
  visionCones: boolean;
  foodDetection: boolean;
  taskColors: boolean;
  antIDs: boolean;
}

export class VisualDebugRenderer {
  private scene: THREE.Scene;
  private overlayGroup: THREE.Group;
  private antPathLines: Map<string, THREE.Line> = new Map();
  private visionCones: Map<string, THREE.Mesh> = new Map();
  private detectionRanges: Map<string, THREE.Mesh> = new Map();
  private antLabels: Map<string, THREE.Sprite> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'DebugOverlays';
    this.scene.add(this.overlayGroup);
  }

  updateOverlays(antData: AntRenderData[], options: VisualDebugOverlayOptions) {
    // Clear existing overlays
    this.clearOverlays();

    antData.forEach(ant => {
      if (options.antPaths) {
        this.createAntPath(ant);
      }

      if (options.visionCones) {
        this.createVisionCone(ant);
      }

      if (options.foodDetection) {
        this.createDetectionRange(ant);
      }

      if (options.antIDs) {
        this.createAntLabel(ant);
      }
    });
  }

  private createAntPath(ant: AntRenderData) {
    // Create a trail showing where the ant has been
    const points: THREE.Vector3[] = [];
    
    // For now, create a simple path from nest to current position
    // In a real implementation, you'd track the ant's actual path history
    points.push(new THREE.Vector3(0, 0.1, 0)); // Nest position
    points.push(new THREE.Vector3(ant.position.x, ant.position.y + 0.1, ant.position.z));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.getTaskColor(ant.task),
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });

    const line = new THREE.Line(geometry, material);
    this.overlayGroup.add(line);
    this.antPathLines.set(ant.id, line);
  }

  private createVisionCone(ant: AntRenderData) {
    // Create a cone showing the ant's vision/detection range
    const coneGeometry = new THREE.ConeGeometry(5, 8, 8); // radius, height, segments
    const coneMaterial = new THREE.MeshBasicMaterial({
      color: this.getTaskColor(ant.task),
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });

    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(ant.position.x, ant.position.y + 1, ant.position.z);
    
    // Rotate cone to face the ant's direction
    cone.rotation.z = -Math.PI / 2; // Point cone forward
    cone.rotation.y = ant.rotation;
    
    this.overlayGroup.add(cone);
    this.visionCones.set(ant.id, cone);
  }

  private createDetectionRange(ant: AntRenderData) {
    // Create a circle showing food detection range
    const circleGeometry = new THREE.RingGeometry(4, 6, 16); // inner radius, outer radius, segments
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: ant.task === 'forage' ? 0x00ff00 : 0x666666,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.set(ant.position.x, 0.1, ant.position.z);
    circle.rotation.x = -Math.PI / 2; // Lay flat on ground
    
    this.overlayGroup.add(circle);
    this.detectionRanges.set(ant.id, circle);
  }

  private createAntLabel(ant: AntRenderData) {
    // Create a text label showing ant ID and status
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '16px monospace';
    context.textAlign = 'center';
    context.fillText(`${ant.id.slice(0, 8)}`, canvas.width / 2, 20);
    context.fillText(`${ant.task}`, canvas.width / 2, 40);
    
    if (ant.carryingFood) {
      context.fillStyle = 'yellow';
      context.fillText('🍯', canvas.width / 2, 60);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.set(ant.position.x, ant.position.y + 8, ant.position.z);
    sprite.scale.set(8, 2, 1);
    
    this.overlayGroup.add(sprite);
    this.antLabels.set(ant.id, sprite);
  }

  private getTaskColor(task: string): number {
    switch (task) {
      case 'forage': return 0x00ff00;
      case 'construct': return 0x8b4513;
      case 'defend': return 0xff0000;
      case 'nurture': return 0xff69b4;
      case 'rest': return 0x808080;
      default: return 0xffff00;
    }
  }

  private clearOverlays() {
    // Properly dispose of all debug overlay objects
    this.overlayGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Sprite) {
        if (child.material.map) {
          child.material.map.dispose();
        }
        child.material.dispose();
      } else if (child instanceof THREE.Points) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Clear the group
    this.overlayGroup.clear();
    
    // Clear maps
    this.antPathLines.clear();
    this.visionCones.clear();
    this.detectionRanges.clear();
    this.antLabels.clear();
    
    console.log('Debug overlay resources properly disposed');
  }

  // Highlight specific ant with enhanced visuals
  highlightAnt(antId: string, ant: AntRenderData) {
    // Add special highlighting for selected ant
    const highlightGeometry = new THREE.RingGeometry(1, 3, 16);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(ant.position.x, 0.2, ant.position.z);
    highlight.rotation.x = -Math.PI / 2;
    highlight.name = `highlight-${antId}`;
    
    this.overlayGroup.add(highlight);

    // Add pulsing animation
    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const scale = 1 + Math.sin(elapsed * 4) * 0.3;
      highlight.scale.set(scale, scale, 1);
      
      if (this.overlayGroup.children.includes(highlight)) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  removeHighlight(antId: string) {
    const highlight = this.overlayGroup.getObjectByName(`highlight-${antId}`);
    if (highlight) {
      // Dispose of geometry and material
      if (highlight instanceof THREE.Mesh) {
        highlight.geometry.dispose();
        if (Array.isArray(highlight.material)) {
          highlight.material.forEach(material => material.dispose());
        } else {
          highlight.material.dispose();
        }
      }
      this.overlayGroup.remove(highlight);
    }
  }

  // Create pheromone trail visualization
  renderPheromoneTrails(pheromoneData: any[]) {
    pheromoneData.forEach(field => {
      if (field.concentrationGrid) {
        const positions: number[] = [];
        const colors: number[] = [];
        
        for (let x = 0; x < field.width; x++) {
          for (let y = 0; y < field.height; y++) {
            const index = y * field.width + x;
            const concentration = field.concentrationGrid[index];
            
            if (concentration > 0.1) {
              const worldX = (x - field.width / 2) * field.cellSize;
              const worldZ = (y - field.height / 2) * field.cellSize;
              
              positions.push(worldX, 0.2, worldZ);
              
              // Color based on concentration and type
              const intensity = Math.min(concentration, 1.0);
              switch (field.type) {
                case 'trail':
                  colors.push(0, intensity, 0); // Green trail
                  break;
                case 'alarm':
                  colors.push(intensity, 0, 0); // Red alarm
                  break;
                case 'recruitment':
                  colors.push(0, 0, intensity); // Blue recruitment
                  break;
                default:
                  colors.push(intensity, intensity, 0); // Yellow default
              }
            }
          }
        }
        
        if (positions.length > 0) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

          const material = new THREE.PointsMaterial({
            size: 8,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: false,
          });

          const pheromonePoints = new THREE.Points(geometry, material);
          pheromonePoints.name = `pheromone-${field.type}`;
          this.overlayGroup.add(pheromonePoints);
        }
      }
    });
  }

  dispose() {
    // Clear all overlays with proper disposal
    this.clearOverlays();
    
    // Remove the overlay group from scene
    this.scene.remove(this.overlayGroup);
    
    console.log('VisualDebugRenderer disposed');
  }
}