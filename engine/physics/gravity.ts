/**
 * Gravity System
 * Realistic gravitational simulation with multiple gravity sources and fields
 */

import { Vector3, RigidBody } from './collision';

export interface GravitySource {
  id: string;
  position: Vector3;
  mass: number;          // Mass in kg
  radius: number;        // Radius of effect in meters
  isActive: boolean;
  gravityConstant?: number; // Override default G constant
}

export interface GravityField {
  type: 'uniform' | 'radial' | 'linear' | 'exponential';
  direction: Vector3;    // For uniform fields
  magnitude: number;     // Acceleration in m/s²
  position?: Vector3;    // Center for radial fields
  radius?: number;       // Radius of effect
  falloffRate?: number;  // For exponential falloff
  isActive: boolean;
}

export interface GravitySettings {
  globalGravity: Vector3;    // Default gravity (e.g., Earth's gravity)
  gravityConstant: number;   // Universal gravitational constant (6.674e-11)
  enableNBodySimulation: boolean; // Enable multi-body gravitational interactions
  enableTidalForces: boolean;      // Enable tidal effects for close bodies
  relativistic: boolean;           // Enable relativistic corrections
  dampingFactor: number;           // Air resistance/damping (0-1)
}

/**
 * Advanced gravity system supporting multiple gravitational sources
 */
export class GravitySystem {
  private gravitySources: Map<string, GravitySource>;
  private gravityFields: Map<string, GravityField>;
  private settings: GravitySettings;
  private rigidBodies: Map<string, RigidBody>;

  constructor(settings: Partial<GravitySettings> = {}) {
    this.gravitySources = new Map();
    this.gravityFields = new Map();
    this.rigidBodies = new Map();
    
    this.settings = {
      globalGravity: { x: 0, y: -9.81, z: 0 }, // Earth's gravity
      gravityConstant: 6.674e-11,
      enableNBodySimulation: false,
      enableTidalForces: false,
      relativistic: false,
      dampingFactor: 0.001,
      ...settings
    };

    // Add default Earth-like gravity field
    this.addGravityField('earth_gravity', {
      type: 'uniform',
      direction: this.settings.globalGravity,
      magnitude: this.vectorMagnitude(this.settings.globalGravity),
      isActive: true
    });
  }

  public addGravitySource(source: GravitySource): void {
    this.gravitySources.set(source.id, source);
  }

  public removeGravitySource(sourceId: string): void {
    this.gravitySources.delete(sourceId);
  }

  public updateGravitySource(sourceId: string, updates: Partial<GravitySource>): void {
    const source = this.gravitySources.get(sourceId);
    if (source) {
      Object.assign(source, updates);
    }
  }

  public addGravityField(fieldId: string, field: GravityField): void {
    this.gravityFields.set(fieldId, field);
  }

  public removeGravityField(fieldId: string): void {
    this.gravityFields.delete(fieldId);
  }

  public addRigidBody(body: RigidBody): void {
    this.rigidBodies.set(body.id, body);
  }

  public removeRigidBody(bodyId: string): void {
    this.rigidBodies.delete(bodyId);
  }

  public updateGravitySettings(newSettings: Partial<GravitySettings>): void {
    Object.assign(this.settings, newSettings);
    
    // Update default gravity field
    const earthGravity = this.gravityFields.get('earth_gravity');
    if (earthGravity) {
      earthGravity.direction = this.settings.globalGravity;
      earthGravity.magnitude = this.vectorMagnitude(this.settings.globalGravity);
    }
  }

  public applyGravity(deltaTime: number): void {
    for (const body of this.rigidBodies.values()) {
      if (body.isStatic) continue;

      let totalGravityForce = { x: 0, y: 0, z: 0 };

      // Apply gravity fields
      totalGravityForce = this.vectorAdd(totalGravityForce, 
        this.calculateFieldGravity(body));

      // Apply gravity from sources
      totalGravityForce = this.vectorAdd(totalGravityForce, 
        this.calculateSourceGravity(body));

      // Apply N-body interactions if enabled
      if (this.settings.enableNBodySimulation) {
        totalGravityForce = this.vectorAdd(totalGravityForce, 
          this.calculateNBodyGravity(body));
      }

      // Apply tidal forces if enabled
      if (this.settings.enableTidalForces) {
        totalGravityForce = this.vectorAdd(totalGravityForce, 
          this.calculateTidalForces(body));
      }

      // Apply relativistic corrections if enabled
      if (this.settings.relativistic) {
        totalGravityForce = this.applyRelativisticCorrections(body, totalGravityForce);
      }

      // Convert force to acceleration and apply
      const gravityAcceleration = this.vectorScale(totalGravityForce, 1 / body.mass);
      
      // Apply damping
      const dampedAcceleration = this.vectorScale(gravityAcceleration, 
        1 - this.settings.dampingFactor);

      body.acceleration = this.vectorAdd(body.acceleration, dampedAcceleration);
    }
  }

  private calculateFieldGravity(body: RigidBody): Vector3 {
    let fieldForce = { x: 0, y: 0, z: 0 };

    for (const field of this.gravityFields.values()) {
      if (!field.isActive) continue;

      let fieldAcceleration = { x: 0, y: 0, z: 0 };

      switch (field.type) {
        case 'uniform':
          fieldAcceleration = this.vectorScale(field.direction, field.magnitude);
          break;

        case 'radial':
          if (field.position) {
            const distance = this.vectorDistance(body.position, field.position);
            if (field.radius && distance > field.radius) break;

            const direction = this.vectorNormalize(
              this.vectorSubtract(field.position, body.position)
            );
            
            let magnitude = field.magnitude;
            if (field.radius) {
              magnitude *= (1 - distance / field.radius);
            }

            fieldAcceleration = this.vectorScale(direction, magnitude);
          }
          break;

        case 'linear':
          if (field.position) {
            const distance = this.vectorDistance(body.position, field.position);
            if (field.radius && distance > field.radius) break;

            const direction = this.vectorNormalize(field.direction);
            const magnitude = field.magnitude * (1 - distance / (field.radius || 1));
            
            fieldAcceleration = this.vectorScale(direction, magnitude);
          }
          break;

        case 'exponential':
          if (field.position) {
            const distance = this.vectorDistance(body.position, field.position);
            if (field.radius && distance > field.radius) break;

            const direction = this.vectorNormalize(
              this.vectorSubtract(field.position, body.position)
            );
            
            const falloffRate = field.falloffRate || 1.0;
            const magnitude = field.magnitude * Math.exp(-distance * falloffRate);
            
            fieldAcceleration = this.vectorScale(direction, magnitude);
          }
          break;
      }

      const fieldGravityForce = this.vectorScale(fieldAcceleration, body.mass);
      fieldForce = this.vectorAdd(fieldForce, fieldGravityForce);
    }

    return fieldForce;
  }

  private calculateSourceGravity(body: RigidBody): Vector3 {
    let sourceForce = { x: 0, y: 0, z: 0 };

    for (const source of this.gravitySources.values()) {
      if (!source.isActive) continue;

      const distance = this.vectorDistance(body.position, source.position);
      if (distance > source.radius || distance === 0) continue;

      // Newton's law of universal gravitation: F = G * (m1 * m2) / r²
      const gravityConstant = source.gravityConstant || this.settings.gravityConstant;
      const forceMagnitude = gravityConstant * (source.mass * body.mass) / (distance * distance);

      const direction = this.vectorNormalize(
        this.vectorSubtract(source.position, body.position)
      );

      const gravityForce = this.vectorScale(direction, forceMagnitude);
      sourceForce = this.vectorAdd(sourceForce, gravityForce);
    }

    return sourceForce;
  }

  private calculateNBodyGravity(body: RigidBody): Vector3 {
    let nBodyForce = { x: 0, y: 0, z: 0 };

    // Calculate gravitational interactions between all rigid bodies
    for (const otherBody of this.rigidBodies.values()) {
      if (otherBody === body || otherBody.isStatic) continue;

      const distance = this.vectorDistance(body.position, otherBody.position);
      if (distance === 0) continue;

      // Minimum distance to avoid singularities
      const minDistance = Math.max(distance, 0.01);

      const forceMagnitude = this.settings.gravityConstant * 
        (body.mass * otherBody.mass) / (minDistance * minDistance);

      const direction = this.vectorNormalize(
        this.vectorSubtract(otherBody.position, body.position)
      );

      const gravityForce = this.vectorScale(direction, forceMagnitude);
      nBodyForce = this.vectorAdd(nBodyForce, gravityForce);
    }

    return nBodyForce;
  }

  private calculateTidalForces(body: RigidBody): Vector3 {
    let tidalForce = { x: 0, y: 0, z: 0 };

    for (const source of this.gravitySources.values()) {
      if (!source.isActive) continue;

      const distance = this.vectorDistance(body.position, source.position);
      if (distance === 0 || distance > source.radius) continue;

      // Tidal force is the gradient of gravitational field
      // F_tidal = -2 * G * M * m * r / d³
      const gravityConstant = source.gravityConstant || this.settings.gravityConstant;
      const tidalMagnitude = -2 * gravityConstant * source.mass * body.mass / 
        Math.pow(distance, 3);

      const displacement = this.vectorSubtract(body.position, source.position);
      const tidal = this.vectorScale(displacement, tidalMagnitude);
      
      tidalForce = this.vectorAdd(tidalForce, tidal);
    }

    return tidalForce;
  }

  private applyRelativisticCorrections(body: RigidBody, classicalForce: Vector3): Vector3 {
    // Simplified relativistic correction for high velocities
    const c = 299792458; // Speed of light in m/s
    const velocity = this.vectorMagnitude(body.velocity);
    const gamma = 1 / Math.sqrt(1 - (velocity * velocity) / (c * c));

    // Only apply corrections if velocity is significant compared to c
    if (velocity / c > 0.001) {
      return this.vectorScale(classicalForce, 1 / (gamma * gamma * gamma));
    }

    return classicalForce;
  }

  public getGravitationalPotential(position: Vector3): number {
    let potential = 0;

    // Potential from gravity sources
    for (const source of this.gravitySources.values()) {
      if (!source.isActive) continue;

      const distance = this.vectorDistance(position, source.position);
      if (distance > 0 && distance <= source.radius) {
        const gravityConstant = source.gravityConstant || this.settings.gravityConstant;
        potential -= gravityConstant * source.mass / distance;
      }
    }

    // Potential from uniform fields (simplified)
    for (const field of this.gravityFields.values()) {
      if (!field.isActive || field.type !== 'uniform') continue;

      const height = this.vectorDot(position, this.vectorNormalize(field.direction));
      potential += field.magnitude * height;
    }

    return potential;
  }

  public getGravitationalFieldStrength(position: Vector3): Vector3 {
    let fieldStrength = { x: 0, y: 0, z: 0 };

    // Field from gravity sources
    for (const source of this.gravitySources.values()) {
      if (!source.isActive) continue;

      const distance = this.vectorDistance(position, source.position);
      if (distance > 0 && distance <= source.radius) {
        const gravityConstant = source.gravityConstant || this.settings.gravityConstant;
        const fieldMagnitude = gravityConstant * source.mass / (distance * distance);
        
        const direction = this.vectorNormalize(
          this.vectorSubtract(source.position, position)
        );
        
        const sourceField = this.vectorScale(direction, fieldMagnitude);
        fieldStrength = this.vectorAdd(fieldStrength, sourceField);
      }
    }

    // Field from gravity fields
    for (const field of this.gravityFields.values()) {
      if (!field.isActive) continue;

      switch (field.type) {
        case 'uniform':
          fieldStrength = this.vectorAdd(fieldStrength, 
            this.vectorScale(field.direction, field.magnitude));
          break;

        case 'radial':
          if (field.position) {
            const distance = this.vectorDistance(position, field.position);
            if (field.radius && distance <= field.radius && distance > 0) {
              const direction = this.vectorNormalize(
                this.vectorSubtract(field.position, position)
              );
              
              let magnitude = field.magnitude;
              if (field.radius) {
                magnitude *= (1 - distance / field.radius);
              }

              const radialField = this.vectorScale(direction, magnitude);
              fieldStrength = this.vectorAdd(fieldStrength, radialField);
            }
          }
          break;
      }
    }

    return fieldStrength;
  }

  public createOrbitalVelocity(bodyMass: number, orbitRadius: number, centralMass: number): number {
    // Calculate orbital velocity for circular orbit
    // v = sqrt(G * M / r)
    return Math.sqrt(this.settings.gravityConstant * centralMass / orbitRadius);
  }

  public createEscapeVelocity(centralMass: number, distance: number): number {
    // Calculate escape velocity
    // v_escape = sqrt(2 * G * M / r)
    return Math.sqrt(2 * this.settings.gravityConstant * centralMass / distance);
  }

  public getGravitySources(): GravitySource[] {
    return Array.from(this.gravitySources.values());
  }

  public getGravityFields(): GravityField[] {
    return Array.from(this.gravityFields.values());
  }

  public getSettings(): GravitySettings {
    return { ...this.settings };
  }

  // Utility vector methods
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

/**
 * Gravity well visualization and analysis utilities
 */
export class GravityAnalyzer {
  private gravitySystem: GravitySystem;

  constructor(gravitySystem: GravitySystem) {
    this.gravitySystem = gravitySystem;
  }

  public generatePotentialField(bounds: { min: Vector3; max: Vector3 }, resolution: number): number[][][] {
    const field: number[][][] = [];
    const stepX = (bounds.max.x - bounds.min.x) / resolution;
    const stepY = (bounds.max.y - bounds.min.y) / resolution;
    const stepZ = (bounds.max.z - bounds.min.z) / resolution;

    for (let x = 0; x < resolution; x++) {
      field[x] = [];
      for (let y = 0; y < resolution; y++) {
        field[x][y] = [];
        for (let z = 0; z < resolution; z++) {
          const position = {
            x: bounds.min.x + x * stepX,
            y: bounds.min.y + y * stepY,
            z: bounds.min.z + z * stepZ
          };
          
          field[x][y][z] = this.gravitySystem.getGravitationalPotential(position);
        }
      }
    }

    return field;
  }

  public findLagrangePoints(mass1: number, mass2: number, distance: number): Vector3[] {
    // Calculate the five Lagrange points for a two-body system
    const lagrangePoints: Vector3[] = [];
    const mu = mass2 / (mass1 + mass2);

    // L1 point (between the masses)
    const r1 = distance * (1 - Math.cbrt(mu / 3));
    lagrangePoints.push({ x: r1, y: 0, z: 0 });

    // L2 point (beyond the smaller mass)
    const r2 = distance * (1 + Math.cbrt(mu / 3));
    lagrangePoints.push({ x: r2, y: 0, z: 0 });

    // L3 point (opposite side of larger mass)
    const r3 = -distance * (1 - 7 * mu / 12);
    lagrangePoints.push({ x: r3, y: 0, z: 0 });

    // L4 and L5 points (equilateral triangle points)
    const l4l5Distance = distance / 2;
    const l4l5Height = distance * Math.sqrt(3) / 2;
    
    lagrangePoints.push({ x: l4l5Distance, y: l4l5Height, z: 0 });
    lagrangePoints.push({ x: l4l5Distance, y: -l4l5Height, z: 0 });

    return lagrangePoints;
  }

  public calculateTidalRadius(primaryMass: number, secondaryMass: number, distance: number): number {
    // Roche limit calculation (rigid body approximation)
    const massRatio = secondaryMass / primaryMass;
    return distance * Math.cbrt(massRatio / 3);
  }

  public analyzeOrbitStability(position: Vector3, velocity: Vector3, centralMass: number): {
    eccentricity: number;
    semimajorAxis: number;
    isStable: boolean;
    orbitalPeriod: number;
  } {
    const G = this.gravitySystem.getSettings().gravityConstant;
    const r = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    const v = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

    // Specific orbital energy
    const energy = (v * v) / 2 - (G * centralMass) / r;

    // Semi-major axis
    const semimajorAxis = -G * centralMass / (2 * energy);

    // Angular momentum
    const angularMomentum = r * v; // Simplified for circular motion

    // Eccentricity
    const eccentricity = Math.sqrt(1 + (2 * energy * angularMomentum * angularMomentum) / 
      (G * G * centralMass * centralMass));

    // Orbital period (Kepler's third law)
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semimajorAxis, 3) / (G * centralMass));

    // Stability check (simplified)
    const isStable = eccentricity < 1 && energy < 0;

    return {
      eccentricity,
      semimajorAxis,
      isStable,
      orbitalPeriod
    };
  }
}