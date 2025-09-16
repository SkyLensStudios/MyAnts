/**
 * Main Physics Engine
 * Integrates collision detection, fluid dynamics, particle physics, and gravity
 */

import { Vector3, CollisionSystem, RigidBody, CollisionInfo } from './collision';
import { LatticeFluidSolver, SimpleFluidSolver, FluidForce, FluidProperties } from './fluidDynamics';
import { ParticleSystem, Particle, ParticleEmitter, ParticleForce } from './particles';
import { GravitySystem, GravitySource, GravityField } from './gravity';

export interface PhysicsSettings {
  // General settings
  timeStep: number;              // Fixed timestep for physics simulation
  maxSubsteps: number;           // Maximum substeps per frame
  enableCollisions: boolean;     // Enable collision detection
  enableFluidDynamics: boolean;  // Enable fluid simulation
  enableParticles: boolean;      // Enable particle systems
  enableGravity: boolean;        // Enable gravity simulation
  
  // Performance settings
  spatialPartitioningCellSize: number;
  maxParticles: number;
  fluidGridResolution: Vector3;
  
  // Quality settings
  collisionIterations: number;   // Collision solver iterations
  fluidQuality: 'low' | 'medium' | 'high'; // Fluid simulation quality
  particleQuality: 'low' | 'medium' | 'high'; // Particle system quality
}

export interface PhysicsStats {
  frameTime: number;
  collisionTime: number;
  fluidTime: number;
  particleTime: number;
  gravityTime: number;
  activeRigidBodies: number;
  activeParticles: number;
  detectedCollisions: number;
}

export interface PhysicsWorldBounds {
  min: Vector3;
  max: Vector3;
}

/**
 * Comprehensive physics engine for the ant simulation
 */
export class PhysicsEngine {
  private settings: PhysicsSettings;
  private worldBounds: PhysicsWorldBounds;
  
  // Core systems
  private collisionSystem!: CollisionSystem;
  private fluidSolver: LatticeFluidSolver | SimpleFluidSolver | null = null;
  private particleSystem!: ParticleSystem;
  private gravitySystem!: GravitySystem;
  
  // Performance tracking
  private stats: PhysicsStats;
  private lastUpdateTime: number;
  private accumulator: number;
  
  // Event callbacks
  private collisionCallbacks: Map<string, (collision: CollisionInfo) => void>;
  private particleCallbacks: Map<string, (particle: Particle) => void>;

  constructor(worldBounds: PhysicsWorldBounds, settings: Partial<PhysicsSettings> = {}) {
    this.worldBounds = worldBounds;
    
    this.settings = {
      timeStep: 1/60,  // 60 FPS
      maxSubsteps: 3,
      enableCollisions: true,
      enableFluidDynamics: true,
      enableParticles: true,
      enableGravity: true,
      spatialPartitioningCellSize: 10.0,
      maxParticles: 10000,
      fluidGridResolution: { x: 50, y: 50, z: 50 },
      collisionIterations: 4,
      fluidQuality: 'medium',
      particleQuality: 'medium',
      ...settings
    };

    this.stats = {
      frameTime: 0,
      collisionTime: 0,
      fluidTime: 0,
      particleTime: 0,
      gravityTime: 0,
      activeRigidBodies: 0,
      activeParticles: 0,
      detectedCollisions: 0
    };

    this.lastUpdateTime = 0;
    this.accumulator = 0;
    this.collisionCallbacks = new Map();
    this.particleCallbacks = new Map();

    this.initializeSystems();
  }

  private initializeSystems(): void {
    // Initialize collision system
    if (this.settings.enableCollisions) {
      this.collisionSystem = new CollisionSystem(this.worldBounds, this.settings.spatialPartitioningCellSize);
    }

    // Initialize fluid system
    if (this.settings.enableFluidDynamics) {
      const cellSize = (this.worldBounds.max.x - this.worldBounds.min.x) / this.settings.fluidGridResolution.x;
      
      if (this.settings.fluidQuality === 'high') {
        this.fluidSolver = new LatticeFluidSolver(
          this.settings.fluidGridResolution,
          cellSize,
          this.worldBounds
        );
      } else {
        this.fluidSolver = new SimpleFluidSolver(
          this.settings.fluidGridResolution,
          cellSize,
          this.worldBounds
        );
      }
    }

    // Initialize particle system
    if (this.settings.enableParticles) {
      this.particleSystem = new ParticleSystem(
        this.worldBounds,
        this.settings.spatialPartitioningCellSize,
        this.settings.maxParticles
      );
      
      if (this.collisionSystem) {
        this.particleSystem.setCollisionSystem(this.collisionSystem);
      }
    }

    // Initialize gravity system
    if (this.settings.enableGravity) {
      this.gravitySystem = new GravitySystem({
        globalGravity: { x: 0, y: -9.81, z: 0 }, // Earth-like gravity
        enableNBodySimulation: false, // Too expensive for ant simulation
        enableTidalForces: false,
        relativistic: false,
        dampingFactor: 0.001
      });
    }
  }

  public update(deltaTime: number): void {
    const startTime = performance.now();
    
    this.accumulator += deltaTime;
    
    // Fixed timestep simulation with accumulator
    let substeps = 0;
    while (this.accumulator >= this.settings.timeStep && substeps < this.settings.maxSubsteps) {
      this.fixedUpdate(this.settings.timeStep);
      this.accumulator -= this.settings.timeStep;
      substeps++;
    }
    
    // Interpolation factor for smooth rendering
    const alpha = this.accumulator / this.settings.timeStep;
    this.interpolatePositions(alpha);
    
    this.stats.frameTime = performance.now() - startTime;
    this.lastUpdateTime = Date.now();
  }

  private fixedUpdate(deltaTime: number): void {
    // Update gravity first (affects all bodies)
    if (this.settings.enableGravity && this.gravitySystem) {
      const gravityStart = performance.now();
      this.gravitySystem.applyGravity(deltaTime);
      this.stats.gravityTime = performance.now() - gravityStart;
    }

    // Update fluid dynamics
    if (this.settings.enableFluidDynamics && this.fluidSolver) {
      const fluidStart = performance.now();
      
      if (this.fluidSolver instanceof LatticeFluidSolver) {
        this.fluidSolver.step(deltaTime, this.getFluidForces());
      } else if (this.fluidSolver instanceof SimpleFluidSolver) {
        this.fluidSolver.update(deltaTime);
      }
      
      this.stats.fluidTime = performance.now() - fluidStart;
    }

    // Update particles
    if (this.settings.enableParticles && this.particleSystem) {
      const particleStart = performance.now();
      this.particleSystem.update(deltaTime);
      this.stats.activeParticles = this.particleSystem.getParticleCount();
      this.stats.particleTime = performance.now() - particleStart;
    }

    // Update collisions last
    if (this.settings.enableCollisions && this.collisionSystem) {
      const collisionStart = performance.now();
      
      for (let i = 0; i < this.settings.collisionIterations; i++) {
        const collisions = this.collisionSystem.detectCollisions();
        this.collisionSystem.resolveCollisions(collisions);
        this.stats.detectedCollisions = collisions.length;
      }
      
      this.stats.collisionTime = performance.now() - collisionStart;
    }

    // Update statistics
    this.updateStats();
  }

  private getFluidForces(): FluidForce[] {
    const forces: FluidForce[] = [];
    
    // Add gravity as a fluid force
    forces.push({
      type: 'gravity',
      vector: { x: 0, y: -9.81, z: 0 },
      magnitude: 1.0
    });

    // Add wind forces if any
    // This could be extended to include weather system wind
    
    return forces;
  }

  private interpolatePositions(alpha: number): void {
    // Interpolate positions for smooth rendering between fixed timesteps
    // This would typically store previous positions and interpolate
    // For now, we'll skip this as it requires more complex state management
  }

  private updateStats(): void {
    if (this.collisionSystem) {
      // Count active rigid bodies - this would need to be implemented in collision system
      this.stats.activeRigidBodies = 0; // Placeholder
    }
  }

  // Public API for adding/removing physics objects

  public addRigidBody(body: RigidBody): void {
    if (this.collisionSystem) {
      this.collisionSystem.addRigidBody(body);
    }
    
    if (this.gravitySystem) {
      this.gravitySystem.addRigidBody(body);
    }
  }

  public removeRigidBody(bodyId: string): void {
    if (this.collisionSystem) {
      this.collisionSystem.removeRigidBody(bodyId);
    }
    
    if (this.gravitySystem) {
      this.gravitySystem.removeRigidBody(bodyId);
    }
  }

  public addParticleEmitter(emitter: ParticleEmitter): void {
    if (this.particleSystem) {
      this.particleSystem.addEmitter(emitter);
    }
  }

  public removeParticleEmitter(emitterId: string): void {
    if (this.particleSystem) {
      this.particleSystem.removeEmitter(emitterId);
    }
  }

  public addGravitySource(source: GravitySource): void {
    if (this.gravitySystem) {
      this.gravitySystem.addGravitySource(source);
    }
  }

  public removeGravitySource(sourceId: string): void {
    if (this.gravitySystem) {
      this.gravitySystem.removeGravitySource(sourceId);
    }
  }

  public addGravityField(fieldId: string, field: GravityField): void {
    if (this.gravitySystem) {
      this.gravitySystem.addGravityField(fieldId, field);
    }
  }

  public addParticleForce(force: ParticleForce): void {
    if (this.particleSystem) {
      this.particleSystem.addForce(force);
    }
  }

  // Fluid interaction methods

  public setFluidObstacle(position: Vector3, radius: number, isObstacle: boolean): void {
    if (!this.fluidSolver) return;

    if (this.fluidSolver instanceof LatticeFluidSolver) {
      // Convert world position to grid coordinates
      const gridDimensions = this.settings.fluidGridResolution;
      const cellSize = (this.worldBounds.max.x - this.worldBounds.min.x) / gridDimensions.x;
      
      const gridX = Math.floor((position.x - this.worldBounds.min.x) / cellSize);
      const gridY = Math.floor((position.y - this.worldBounds.min.y) / cellSize);
      const gridZ = Math.floor((position.z - this.worldBounds.min.z) / cellSize);
      
      const gridRadius = Math.ceil(radius / cellSize);
      
      for (let x = Math.max(0, gridX - gridRadius); 
           x < Math.min(gridDimensions.x, gridX + gridRadius + 1); x++) {
        for (let y = Math.max(0, gridY - gridRadius); 
             y < Math.min(gridDimensions.y, gridY + gridRadius + 1); y++) {
          for (let z = Math.max(0, gridZ - gridRadius); 
               z < Math.min(gridDimensions.z, gridZ + gridRadius + 1); z++) {
            
            const distance = Math.sqrt(
              Math.pow((x - gridX) * cellSize, 2) +
              Math.pow((y - gridY) * cellSize, 2) +
              Math.pow((z - gridZ) * cellSize, 2)
            );
            
            if (distance <= radius) {
              this.fluidSolver.setObstacle(x, y, z, isObstacle);
            }
          }
        }
      }
    }
  }

  public addFluidVelocitySource(position: Vector3, velocity: Vector3, radius: number): void {
    if (this.fluidSolver instanceof SimpleFluidSolver) {
      this.fluidSolver.addVelocitySource(position, velocity, radius);
    }
  }

  public getFluidVelocityAt(position: Vector3): Vector3 | null {
    if (this.fluidSolver instanceof LatticeFluidSolver) {
      const properties = this.fluidSolver.getFluidPropertiesAt(position);
      return properties ? properties.velocity : null;
    }
    
    return null;
  }

  public getFluidPropertiesAt(position: Vector3): FluidProperties | null {
    if (this.fluidSolver instanceof LatticeFluidSolver) {
      return this.fluidSolver.getFluidPropertiesAt(position);
    }
    
    return null;
  }

  // Query methods

  public getStats(): PhysicsStats {
    return { ...this.stats };
  }

  public getActiveParticles(): Particle[] {
    if (this.particleSystem) {
      return this.particleSystem.getActiveParticles();
    }
    return [];
  }

  public getFluidVelocityField(): Vector3[][][] | null {
    if (this.fluidSolver instanceof LatticeFluidSolver) {
      return this.fluidSolver.getVelocityField();
    }
    return null;
  }

  public getGravitationalFieldAt(position: Vector3): Vector3 {
    if (this.gravitySystem) {
      return this.gravitySystem.getGravitationalFieldStrength(position);
    }
    return { x: 0, y: 0, z: 0 };
  }

  // Event system

  public onCollision(bodyId: string, callback: (collision: CollisionInfo) => void): void {
    this.collisionCallbacks.set(bodyId, callback);
    
    if (this.collisionSystem) {
      this.collisionSystem.setCollisionCallback(bodyId, callback);
    }
  }

  public onParticleEvent(particleId: string, callback: (particle: Particle) => void): void {
    this.particleCallbacks.set(particleId, callback);
  }

  // Configuration methods

  public updateSettings(newSettings: Partial<PhysicsSettings>): void {
    Object.assign(this.settings, newSettings);
    
    // Reinitialize systems if necessary
    if (newSettings.enableCollisions !== undefined ||
        newSettings.enableFluidDynamics !== undefined ||
        newSettings.enableParticles !== undefined ||
        newSettings.enableGravity !== undefined) {
      this.initializeSystems();
    }
  }

  public getSettings(): PhysicsSettings {
    return { ...this.settings };
  }

  public getWorldBounds(): PhysicsWorldBounds {
    return { ...this.worldBounds };
  }

  // Utility methods for ant simulation

  public createAntRigidBody(position: Vector3, mass: number = 0.001): RigidBody {
    return {
      id: `ant_${Date.now()}_${Math.random()}`,
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      mass,
      restitution: 0.2,
      friction: 0.8,
      shape: {
        type: 'sphere',
        bounds: {
          center: position,
          radius: 0.002 // 2mm radius for ant
        },
        isTrigger: false
      },
      isStatic: false,
      collisionLayers: 1
    };
  }

  public createFoodParticle(position: Vector3): Particle | null {
    if (!this.particleSystem) return null;
    
    return this.particleSystem.createParticle(
      position,
      { x: 0, y: 0, z: 0 },
      {
        type: 'debris',
        density: 1500,
        restitution: 0.3,
        friction: 0.7,
        viscosity: 0.1,
        solubility: 0.0,
        conductivity: 0.1,
        magnetism: 0.0
      },
      300 // 5 minutes lifespan
    );
  }

  public createDustEmitter(position: Vector3): ParticleEmitter {
    return {
      id: `dust_${Date.now()}`,
      position: { ...position },
      direction: { x: 0, y: 1, z: 0 },
      emissionRate: 5, // 5 particles per second
      particleLifespan: 10,
      velocityRange: { min: 0.1, max: 0.5 },
      angleSpread: Math.PI / 4, // 45 degree cone
      material: {
        type: 'dust',
        density: 1000,
        restitution: 0.1,
        friction: 0.9,
        viscosity: 0.2,
        solubility: 0.0,
        conductivity: 0.1,
        magnetism: 0.0
      },
      isActive: true,
      lastEmissionTime: 0
    };
  }

  public dispose(): void {
    // Clean up resources
    this.collisionCallbacks.clear();
    this.particleCallbacks.clear();
    
    // Additional cleanup would go here
  }
}