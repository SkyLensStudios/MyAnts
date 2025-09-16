/**
 * Particle Physics System
 * High-performance particle simulation for dust, debris, chemical particles, and environmental effects
 */

import { Vector3, CollisionSystem, RigidBody } from './collision';

export interface Particle {
  id: string;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  mass: number;
  radius: number;
  lifespan: number;     // Seconds until particle expires
  age: number;          // Current age in seconds
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  temperature: number;  // Affects behavior and appearance
  charge: number;       // Electrical charge for electrostatic effects
  material: ParticleMaterial;
  forces: Vector3[];    // Accumulated forces this frame
  isActive: boolean;
}

export interface ParticleMaterial {
  type: 'dust' | 'water' | 'sand' | 'pheromone' | 'spore' | 'debris' | 'smoke';
  density: number;      // kg/m³
  restitution: number;  // Bounciness (0-1)
  friction: number;     // Surface friction (0-1)
  viscosity: number;    // Resistance to flow (0-1)
  solubility: number;   // How quickly it dissolves in water (0-1)
  conductivity: number; // Thermal conductivity
  magnetism: number;    // Magnetic susceptibility
}

export interface ParticleEmitter {
  id: string;
  position: Vector3;
  direction: Vector3;
  emissionRate: number;     // Particles per second
  particleLifespan: number; // Default lifespan for emitted particles
  velocityRange: {
    min: number;
    max: number;
  };
  angleSpread: number;      // Cone angle in radians
  material: ParticleMaterial;
  isActive: boolean;
  lastEmissionTime: number;
}

export interface ParticleForce {
  type: 'gravity' | 'wind' | 'magnetic' | 'electrostatic' | 'pressure' | 'viscous';
  vector: Vector3;
  magnitude: number;
  position?: Vector3;       // For point forces
  radius?: number;          // For localized forces
  falloffType?: 'linear' | 'quadratic' | 'exponential';
}

export interface ParticleConstraint {
  type: 'boundary' | 'attractor' | 'repulsor' | 'vortex';
  position: Vector3;
  strength: number;
  radius: number;
  axis?: Vector3;          // For vortex constraints
}

/**
 * Spatial partitioning system optimized for particles
 */
export class ParticleSpatialGrid {
  private cellSize: number;
  private grid: Map<string, Particle[]>;
  private bounds: { min: Vector3; max: Vector3 };

  constructor(bounds: { min: Vector3; max: Vector3 }, cellSize: number) {
    this.bounds = bounds;
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getCellKey(x: number, y: number, z: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellY},${cellZ}`;
  }

  public clear(): void {
    this.grid.clear();
  }

  public addParticle(particle: Particle): void {
    const cellKey = this.getCellKey(particle.position.x, particle.position.y, particle.position.z);
    
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    
    this.grid.get(cellKey)!.push(particle);
  }

  public getNearbyParticles(position: Vector3, radius: number): Particle[] {
    const nearby: Particle[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    
    const centerCellX = Math.floor(position.x / this.cellSize);
    const centerCellY = Math.floor(position.y / this.cellSize);
    const centerCellZ = Math.floor(position.z / this.cellSize);
    
    for (let x = centerCellX - cellRadius; x <= centerCellX + cellRadius; x++) {
      for (let y = centerCellY - cellRadius; y <= centerCellY + cellRadius; y++) {
        for (let z = centerCellZ - cellRadius; z <= centerCellZ + cellRadius; z++) {
          const cellKey = this.getCellKey(x * this.cellSize, y * this.cellSize, z * this.cellSize);
          const cellParticles = this.grid.get(cellKey);
          
          if (cellParticles) {
            for (const particle of cellParticles) {
              const distance = this.vectorDistance(position, particle.position);
              if (distance <= radius) {
                nearby.push(particle);
              }
            }
          }
        }
      }
    }
    
    return nearby;
  }

  private vectorDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

/**
 * High-performance particle physics system
 */
export class ParticleSystem {
  private particles: Map<string, Particle>;
  private emitters: Map<string, ParticleEmitter>;
  private spatialGrid: ParticleSpatialGrid;
  private forces: ParticleForce[];
  private constraints: ParticleConstraint[];
  private collisionSystem: CollisionSystem | null;
  private maxParticles: number;
  private particlePool: Particle[]; // Object pooling for performance
  private nextParticleId: number;

  constructor(bounds: { min: Vector3; max: Vector3 }, cellSize: number = 5.0, maxParticles: number = 10000) {
    this.particles = new Map();
    this.emitters = new Map();
    this.spatialGrid = new ParticleSpatialGrid(bounds, cellSize);
    this.forces = [];
    this.constraints = [];
    this.collisionSystem = null;
    this.maxParticles = maxParticles;
    this.particlePool = [];
    this.nextParticleId = 0;
    
    // Pre-allocate particle pool
    this.initializeParticlePool();
  }

  private initializeParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(this.createDefaultParticle());
    }
  }

  private createDefaultParticle(): Particle {
    return {
      id: '',
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      mass: 1.0,
      radius: 0.1,
      lifespan: 10.0,
      age: 0.0,
      color: { r: 1, g: 1, b: 1, a: 1 },
      temperature: 293.15,
      charge: 0.0,
      material: {
        type: 'dust',
        density: 1000,
        restitution: 0.3,
        friction: 0.5,
        viscosity: 0.1,
        solubility: 0.0,
        conductivity: 0.1,
        magnetism: 0.0
      },
      forces: [],
      isActive: false
    };
  }

  public setCollisionSystem(collisionSystem: CollisionSystem): void {
    this.collisionSystem = collisionSystem;
  }

  public addEmitter(emitter: ParticleEmitter): void {
    this.emitters.set(emitter.id, emitter);
  }

  public removeEmitter(emitterId: string): void {
    this.emitters.delete(emitterId);
  }

  public addForce(force: ParticleForce): void {
    this.forces.push(force);
  }

  public removeForce(force: ParticleForce): void {
    const index = this.forces.indexOf(force);
    if (index !== -1) {
      this.forces.splice(index, 1);
    }
  }

  public addConstraint(constraint: ParticleConstraint): void {
    this.constraints.push(constraint);
  }

  public createParticle(position: Vector3, velocity: Vector3, material: ParticleMaterial, lifespan: number = 10.0): Particle | null {
    if (this.particles.size >= this.maxParticles) {
      // Try to reuse an expired particle
      const expiredParticle = this.findExpiredParticle();
      if (expiredParticle) {
        this.resetParticle(expiredParticle, position, velocity, material, lifespan);
        return expiredParticle;
      }
      return null; // Max particles reached
    }

    // Get particle from pool
    const particle = this.particlePool.find(p => !p.isActive);
    if (!particle) return null;

    this.resetParticle(particle, position, velocity, material, lifespan);
    this.particles.set(particle.id, particle);
    
    return particle;
  }

  private findExpiredParticle(): Particle | null {
    for (const particle of this.particles.values()) {
      if (particle.age >= particle.lifespan) {
        return particle;
      }
    }
    return null;
  }

  private resetParticle(particle: Particle, position: Vector3, velocity: Vector3, material: ParticleMaterial, lifespan: number): void {
    particle.id = `particle_${this.nextParticleId++}`;
    particle.position = { ...position };
    particle.velocity = { ...velocity };
    particle.acceleration = { x: 0, y: 0, z: 0 };
    particle.mass = material.density * (4/3) * Math.PI * Math.pow(particle.radius, 3);
    particle.lifespan = lifespan;
    particle.age = 0;
    particle.material = { ...material };
    particle.forces = [];
    particle.isActive = true;
    particle.temperature = 293.15;
    particle.charge = 0;
    
    // Set material-based color
    this.setMaterialColor(particle);
  }

  private setMaterialColor(particle: Particle): void {
    switch (particle.material.type) {
      case 'dust':
        particle.color = { r: 0.8, g: 0.7, b: 0.6, a: 0.8 };
        break;
      case 'water':
        particle.color = { r: 0.2, g: 0.4, b: 0.8, a: 0.6 };
        break;
      case 'sand':
        particle.color = { r: 0.9, g: 0.8, b: 0.6, a: 1.0 };
        break;
      case 'pheromone':
        particle.color = { r: 0.2, g: 0.8, b: 0.2, a: 0.3 };
        break;
      case 'spore':
        particle.color = { r: 0.6, g: 0.4, b: 0.2, a: 0.9 };
        break;
      case 'debris':
        particle.color = { r: 0.5, g: 0.3, b: 0.2, a: 0.9 };
        break;
      case 'smoke':
        particle.color = { r: 0.3, g: 0.3, b: 0.3, a: 0.5 };
        break;
      default:
        particle.color = { r: 1, g: 1, b: 1, a: 1 };
    }
  }

  public update(deltaTime: number): void {
    // Update emitters
    this.updateEmitters(deltaTime);
    
    // Update spatial grid
    this.updateSpatialGrid();
    
    // Apply forces
    this.applyForces(deltaTime);
    
    // Apply constraints
    this.applyConstraints(deltaTime);
    
    // Integrate motion
    this.integrateMotion(deltaTime);
    
    // Handle collisions
    this.handleCollisions();
    
    // Update particle properties
    this.updateParticleProperties(deltaTime);
    
    // Remove expired particles
    this.removeExpiredParticles();
  }

  private updateEmitters(deltaTime: number): void {
    const currentTime = Date.now() / 1000;
    
    for (const emitter of this.emitters.values()) {
      if (!emitter.isActive) continue;
      
      const timeSinceLastEmission = currentTime - emitter.lastEmissionTime;
      const particlesToEmit = Math.floor(emitter.emissionRate * timeSinceLastEmission);
      
      for (let i = 0; i < particlesToEmit; i++) {
        this.emitParticle(emitter);
      }
      
      if (particlesToEmit > 0) {
        emitter.lastEmissionTime = currentTime;
      }
    }
  }

  private emitParticle(emitter: ParticleEmitter): void {
    // Random velocity within cone
    const speed = this.randomRange(emitter.velocityRange.min, emitter.velocityRange.max);
    const angle = this.randomRange(-emitter.angleSpread / 2, emitter.angleSpread / 2);
    
    const velocity = this.rotateVector(
      this.vectorScale(emitter.direction, speed),
      angle
    );
    
    this.createParticle(emitter.position, velocity, emitter.material, emitter.particleLifespan);
  }

  private updateSpatialGrid(): void {
    this.spatialGrid.clear();
    
    for (const particle of this.particles.values()) {
      if (particle.isActive) {
        this.spatialGrid.addParticle(particle);
      }
    }
  }

  private applyForces(deltaTime: number): void {
    for (const particle of this.particles.values()) {
      if (!particle.isActive) continue;
      
      // Clear accumulated forces
      particle.acceleration = { x: 0, y: 0, z: 0 };
      
      for (const force of this.forces) {
        this.applyForceToParticle(particle, force, deltaTime);
      }
      
      // Inter-particle forces (viscosity, electrostatic)
      this.applyInterParticleForces(particle, deltaTime);
    }
  }

  private applyForceToParticle(particle: Particle, force: ParticleForce, deltaTime: number): void {
    let forceVector = { x: 0, y: 0, z: 0 };
    let applicableForce = true;
    
    switch (force.type) {
      case 'gravity':
        forceVector = this.vectorScale(force.vector, particle.mass * force.magnitude);
        break;
        
      case 'wind':
        // Wind affects particles differently based on size and material
        const dragCoefficient = this.calculateDragCoefficient(particle);
        const airDensity = 1.225; // kg/m³
        const area = Math.PI * particle.radius * particle.radius;
        const relativeVelocity = this.vectorSubtract(force.vector, particle.velocity);
        const speed = this.vectorMagnitude(relativeVelocity);
        
        if (speed > 0) {
          const dragMagnitude = 0.5 * airDensity * speed * speed * dragCoefficient * area;
          forceVector = this.vectorScale(
            this.vectorNormalize(relativeVelocity),
            dragMagnitude * force.magnitude
          );
        }
        break;
        
      case 'magnetic':
        if (particle.material.magnetism > 0) {
          forceVector = this.vectorScale(force.vector, 
            particle.material.magnetism * force.magnitude);
        } else {
          applicableForce = false;
        }
        break;
        
      case 'electrostatic':
        if (Math.abs(particle.charge) > 0) {
          if (force.position) {
            const direction = this.vectorSubtract(particle.position, force.position);
            const distance = this.vectorMagnitude(direction);
            
            if (distance > 0 && (!force.radius || distance < force.radius)) {
              const coulombForce = (8.99e9 * particle.charge * force.magnitude) / (distance * distance);
              forceVector = this.vectorScale(this.vectorNormalize(direction), coulombForce);
            }
          }
        } else {
          applicableForce = false;
        }
        break;
        
      case 'pressure':
        if (force.position) {
          const direction = this.vectorSubtract(particle.position, force.position);
          const distance = this.vectorMagnitude(direction);
          
          if (distance > 0 && (!force.radius || distance < force.radius)) {
            let pressureForce = force.magnitude;
            
            if (force.falloffType === 'quadratic') {
              pressureForce /= (distance * distance);
            } else if (force.falloffType === 'linear') {
              pressureForce *= (1 - distance / (force.radius || 1));
            } else if (force.falloffType === 'exponential') {
              pressureForce *= Math.exp(-distance);
            }
            
            forceVector = this.vectorScale(this.vectorNormalize(direction), pressureForce);
          }
        }
        break;
        
      case 'viscous':
        // Viscous drag proportional to velocity
        forceVector = this.vectorScale(particle.velocity, 
          -particle.material.viscosity * force.magnitude);
        break;
    }
    
    if (applicableForce) {
      particle.acceleration = this.vectorAdd(particle.acceleration, 
        this.vectorScale(forceVector, 1 / particle.mass));
    }
  }

  private applyInterParticleForces(particle: Particle, deltaTime: number): void {
    const nearby = this.spatialGrid.getNearbyParticles(particle.position, particle.radius * 4);
    
    for (const neighbor of nearby) {
      if (neighbor === particle || !neighbor.isActive) continue;
      
      const distance = this.vectorDistance(particle.position, neighbor.position);
      const minDistance = particle.radius + neighbor.radius;
      
      if (distance < minDistance && distance > 0) {
        // Collision/repulsion force
        const overlap = minDistance - distance;
        const direction = this.vectorNormalize(
          this.vectorSubtract(particle.position, neighbor.position)
        );
        
        const stiffness = 1000; // Spring constant
        const repulsionForce = this.vectorScale(direction, stiffness * overlap);
        
        particle.acceleration = this.vectorAdd(particle.acceleration,
          this.vectorScale(repulsionForce, 1 / particle.mass));
      }
      
      // Electrostatic forces
      if (Math.abs(particle.charge) > 0 && Math.abs(neighbor.charge) > 0) {
        const coulombConstant = 8.99e9;
        const electrostaticForce = (coulombConstant * particle.charge * neighbor.charge) / 
          (distance * distance);
        
        const direction = this.vectorNormalize(
          this.vectorSubtract(particle.position, neighbor.position)
        );
        
        const force = this.vectorScale(direction, electrostaticForce);
        particle.acceleration = this.vectorAdd(particle.acceleration,
          this.vectorScale(force, 1 / particle.mass));
      }
    }
  }

  private calculateDragCoefficient(particle: Particle): number {
    // Simplified drag coefficient based on particle properties
    const reynoldsNumber = this.calculateReynoldsNumber(particle);
    
    if (reynoldsNumber < 1) {
      return 24 / reynoldsNumber; // Stokes flow
    } else if (reynoldsNumber < 1000) {
      return 24 / reynoldsNumber * (1 + 0.15 * Math.pow(reynoldsNumber, 0.687));
    } else {
      return 0.44; // Turbulent flow
    }
  }

  private calculateReynoldsNumber(particle: Particle): number {
    const fluidDensity = 1.225; // Air density
    const fluidViscosity = 1.81e-5; // Air dynamic viscosity
    const speed = this.vectorMagnitude(particle.velocity);
    
    return (fluidDensity * speed * particle.radius * 2) / fluidViscosity;
  }

  private applyConstraints(deltaTime: number): void {
    for (const particle of this.particles.values()) {
      if (!particle.isActive) continue;
      
      for (const constraint of this.constraints) {
        this.applyConstraintToParticle(particle, constraint, deltaTime);
      }
    }
  }

  private applyConstraintToParticle(particle: Particle, constraint: ParticleConstraint, deltaTime: number): void {
    const distance = this.vectorDistance(particle.position, constraint.position);
    
    switch (constraint.type) {
      case 'boundary':
        if (distance > constraint.radius) {
          const direction = this.vectorNormalize(
            this.vectorSubtract(constraint.position, particle.position)
          );
          particle.position = this.vectorAdd(constraint.position,
            this.vectorScale(direction, -constraint.radius));
          
          // Reflect velocity
          const normalComponent = this.vectorDot(particle.velocity, direction);
          if (normalComponent > 0) {
            const reflection = this.vectorScale(direction, -2 * normalComponent);
            particle.velocity = this.vectorAdd(particle.velocity, reflection);
            particle.velocity = this.vectorScale(particle.velocity, particle.material.restitution);
          }
        }
        break;
        
      case 'attractor':
        if (distance < constraint.radius && distance > 0) {
          const direction = this.vectorNormalize(
            this.vectorSubtract(constraint.position, particle.position)
          );
          const force = this.vectorScale(direction, constraint.strength / (distance * distance));
          particle.acceleration = this.vectorAdd(particle.acceleration,
            this.vectorScale(force, 1 / particle.mass));
        }
        break;
        
      case 'repulsor':
        if (distance < constraint.radius && distance > 0) {
          const direction = this.vectorNormalize(
            this.vectorSubtract(particle.position, constraint.position)
          );
          const force = this.vectorScale(direction, constraint.strength / (distance * distance));
          particle.acceleration = this.vectorAdd(particle.acceleration,
            this.vectorScale(force, 1 / particle.mass));
        }
        break;
        
      case 'vortex':
        if (distance < constraint.radius && constraint.axis) {
          const toParticle = this.vectorSubtract(particle.position, constraint.position);
          const tangent = this.vectorCross(constraint.axis, toParticle);
          const tangentForce = this.vectorScale(
            this.vectorNormalize(tangent),
            constraint.strength * (1 - distance / constraint.radius)
          );
          
          particle.acceleration = this.vectorAdd(particle.acceleration,
            this.vectorScale(tangentForce, 1 / particle.mass));
        }
        break;
    }
  }

  private integrateMotion(deltaTime: number): void {
    for (const particle of this.particles.values()) {
      if (!particle.isActive) continue;
      
      // Verlet integration for stability
      const oldVelocity = { ...particle.velocity };
      
      particle.velocity = this.vectorAdd(particle.velocity,
        this.vectorScale(particle.acceleration, deltaTime));
      
      const avgVelocity = this.vectorScale(
        this.vectorAdd(particle.velocity, oldVelocity), 0.5);
      
      particle.position = this.vectorAdd(particle.position,
        this.vectorScale(avgVelocity, deltaTime));
    }
  }

  private handleCollisions(): void {
    if (!this.collisionSystem) return;
    
    // Convert particles to rigid bodies for collision detection
    const particleRigidBodies: Map<string, RigidBody> = new Map();
    
    for (const particle of this.particles.values()) {
      if (!particle.isActive) continue;
      
      const rigidBody: RigidBody = {
        id: particle.id,
        position: particle.position,
        velocity: particle.velocity,
        acceleration: particle.acceleration,
        mass: particle.mass,
        restitution: particle.material.restitution,
        friction: particle.material.friction,
        shape: {
          type: 'sphere',
          bounds: {
            center: particle.position,
            radius: particle.radius
          },
          isTrigger: false
        },
        isStatic: false,
        collisionLayers: 1
      };
      
      particleRigidBodies.set(particle.id, rigidBody);
      this.collisionSystem.addRigidBody(rigidBody);
    }
    
    // Detect and resolve collisions
    const collisions = this.collisionSystem.detectCollisions();
    this.collisionSystem.resolveCollisions(collisions);
    
    // Update particle properties from rigid bodies
    for (const [particleId, rigidBody] of particleRigidBodies) {
      const particle = this.particles.get(particleId);
      if (particle) {
        particle.position = rigidBody.position;
        particle.velocity = rigidBody.velocity;
      }
      
      this.collisionSystem.removeRigidBody(particleId);
    }
  }

  private updateParticleProperties(deltaTime: number): void {
    for (const particle of this.particles.values()) {
      if (!particle.isActive) continue;
      
      // Age particle
      particle.age += deltaTime;
      
      // Update alpha based on age
      const ageRatio = particle.age / particle.lifespan;
      particle.color.a = Math.max(0, 1 - ageRatio);
      
      // Temperature effects
      this.updateParticleTemperature(particle, deltaTime);
      
      // Material-specific updates
      this.updateMaterialProperties(particle, deltaTime);
    }
  }

  private updateParticleTemperature(particle: Particle, deltaTime: number): void {
    // Simple thermal equilibrium with environment (20°C)
    const environmentTemp = 293.15;
    const thermalConductivity = particle.material.conductivity;
    
    const tempDiff = environmentTemp - particle.temperature;
    particle.temperature += tempDiff * thermalConductivity * deltaTime * 0.1;
    
    // Temperature affects color for some materials
    if (particle.material.type === 'smoke') {
      const heatRatio = (particle.temperature - 293.15) / 100;
      particle.color.r = Math.min(1, 0.3 + heatRatio * 0.7);
      particle.color.g = Math.min(1, 0.3 + heatRatio * 0.3);
    }
  }

  private updateMaterialProperties(particle: Particle, deltaTime: number): void {
    switch (particle.material.type) {
      case 'water':
        // Water evaporates over time
        if (particle.temperature > 373.15) { // Boiling point
          particle.lifespan *= 0.9; // Evaporate faster
        }
        break;
        
      case 'pheromone':
        // Pheromones decay exponentially
        particle.color.a *= Math.exp(-deltaTime * 0.5);
        break;
        
      case 'smoke':
        // Smoke rises and dissipates
        particle.acceleration.y += 0.5; // Buoyancy
        particle.radius += deltaTime * 0.1; // Expansion
        break;
    }
  }

  private removeExpiredParticles(): void {
    const expiredIds: string[] = [];
    
    for (const [id, particle] of this.particles) {
      if (particle.age >= particle.lifespan || particle.color.a <= 0) {
        particle.isActive = false;
        expiredIds.push(id);
      }
    }
    
    for (const id of expiredIds) {
      this.particles.delete(id);
    }
  }

  public getActiveParticles(): Particle[] {
    return Array.from(this.particles.values()).filter(p => p.isActive);
  }

  public getParticleCount(): number {
    return this.particles.size;
  }

  // Utility functions
  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private rotateVector(vector: Vector3, angle: number): Vector3 {
    // Simple rotation around Y-axis
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    return {
      x: vector.x * cos - vector.z * sin,
      y: vector.y,
      z: vector.x * sin + vector.z * cos
    };
  }

  private vectorAdd(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  private vectorSubtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private vectorScale(v: Vector3, scale: number): Vector3 {
    return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
  }

  private vectorDot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private vectorCross(a: Vector3, b: Vector3): Vector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  private vectorMagnitude(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  private vectorDistance(a: Vector3, b: Vector3): number {
    return this.vectorMagnitude(this.vectorSubtract(a, b));
  }

  private vectorNormalize(v: Vector3): Vector3 {
    const magnitude = this.vectorMagnitude(v);
    if (magnitude === 0) return { x: 0, y: 0, z: 0 };
    return this.vectorScale(v, 1 / magnitude);
  }
}