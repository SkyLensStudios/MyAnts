/**
 * Collision Detection and Response System
 * High-performance spatial collision detection for ant simulation
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

export interface BoundingSphere {
  center: Vector3;
  radius: number;
}

export interface CollisionShape {
  type: 'box' | 'sphere' | 'mesh';
  bounds: BoundingBox | BoundingSphere;
  isTrigger: boolean;
}

export interface RigidBody {
  id: string;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  mass: number;
  restitution: number; // Bounciness (0-1)
  friction: number;    // Surface friction (0-1)
  shape: CollisionShape;
  isStatic: boolean;
  collisionLayers: number; // Bit mask for collision filtering
}

export interface CollisionInfo {
  bodyA: RigidBody;
  bodyB: RigidBody;
  contactPoint: Vector3;
  contactNormal: Vector3;
  penetrationDepth: number;
  relativeVelocity: Vector3;
}

/**
 * Spatial partitioning for efficient collision detection
 */
export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, RigidBody[]>;
  private bounds: BoundingBox;

  constructor(bounds: BoundingBox, cellSize: number) {
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

  public insert(body: RigidBody): void {
    const cells = this.getCellsForBody(body);
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      this.grid.get(cellKey)!.push(body);
    });
  }

  public remove(body: RigidBody): void {
    const cells = this.getCellsForBody(body);
    cells.forEach(cellKey => {
      const cellBodies = this.grid.get(cellKey);
      if (cellBodies) {
        const index = cellBodies.indexOf(body);
        if (index !== -1) {
          cellBodies.splice(index, 1);
        }
      }
    });
  }

  public clear(): void {
    this.grid.clear();
  }

  private getCellsForBody(body: RigidBody): string[] {
    const cells: string[] = [];
    let minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number;

    if (body.shape.type === 'sphere') {
      const sphere = body.shape.bounds as BoundingSphere;
      minX = sphere.center.x - sphere.radius;
      maxX = sphere.center.x + sphere.radius;
      minY = sphere.center.y - sphere.radius;
      maxY = sphere.center.y + sphere.radius;
      minZ = sphere.center.z - sphere.radius;
      maxZ = sphere.center.z + sphere.radius;
    } else {
      const box = body.shape.bounds as BoundingBox;
      minX = box.min.x;
      maxX = box.max.x;
      minY = box.min.y;
      maxY = box.max.y;
      minZ = box.min.z;
      maxZ = box.max.z;
    }

    const minCellX = Math.floor(minX / this.cellSize);
    const maxCellX = Math.floor(maxX / this.cellSize);
    const minCellY = Math.floor(minY / this.cellSize);
    const maxCellY = Math.floor(maxY / this.cellSize);
    const minCellZ = Math.floor(minZ / this.cellSize);
    const maxCellZ = Math.floor(maxZ / this.cellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        for (let z = minCellZ; z <= maxCellZ; z++) {
          cells.push(this.getCellKey(x * this.cellSize, y * this.cellSize, z * this.cellSize));
        }
      }
    }

    return cells;
  }

  public getPotentialCollisions(body: RigidBody): RigidBody[] {
    const potentialCollisions: Set<RigidBody> = new Set();
    const cells = this.getCellsForBody(body);

    cells.forEach(cellKey => {
      const cellBodies = this.grid.get(cellKey);
      if (cellBodies) {
        cellBodies.forEach(otherBody => {
          if (otherBody !== body && this.layersCanCollide(body.collisionLayers, otherBody.collisionLayers)) {
            potentialCollisions.add(otherBody);
          }
        });
      }
    });

    return Array.from(potentialCollisions);
  }

  private layersCanCollide(layersA: number, layersB: number): boolean {
    return (layersA & layersB) !== 0;
  }
}

/**
 * High-performance collision detection system
 */
export class CollisionSystem {
  private spatialGrid: SpatialGrid;
  private rigidBodies: Map<string, RigidBody>;
  private collisionCallbacks: Map<string, (collision: CollisionInfo) => void>;

  constructor(worldBounds: BoundingBox, cellSize: number = 10.0) {
    this.spatialGrid = new SpatialGrid(worldBounds, cellSize);
    this.rigidBodies = new Map();
    this.collisionCallbacks = new Map();
  }

  public addRigidBody(body: RigidBody): void {
    this.rigidBodies.set(body.id, body);
    this.spatialGrid.insert(body);
  }

  public removeRigidBody(bodyId: string): void {
    const body = this.rigidBodies.get(bodyId);
    if (body) {
      this.spatialGrid.remove(body);
      this.rigidBodies.delete(bodyId);
    }
  }

  public updateRigidBody(body: RigidBody): void {
    this.spatialGrid.remove(body);
    this.spatialGrid.insert(body);
  }

  public setCollisionCallback(bodyId: string, callback: (collision: CollisionInfo) => void): void {
    this.collisionCallbacks.set(bodyId, callback);
  }

  public detectCollisions(): CollisionInfo[] {
    const collisions: CollisionInfo[] = [];

    this.rigidBodies.forEach(body => {
      const potentialCollisions = this.spatialGrid.getPotentialCollisions(body);
      
      potentialCollisions.forEach(otherBody => {
        const collision = this.checkCollision(body, otherBody);
        if (collision) {
          collisions.push(collision);
          
          // Call collision callbacks
          const callbackA = this.collisionCallbacks.get(body.id);
          const callbackB = this.collisionCallbacks.get(otherBody.id);
          if (callbackA) callbackA(collision);
          if (callbackB) {
            // Swap bodies for callback B
            const swappedCollision: CollisionInfo = {
              ...collision,
              bodyA: collision.bodyB,
              bodyB: collision.bodyA,
              contactNormal: this.vectorNegate(collision.contactNormal)
            };
            callbackB(swappedCollision);
          }
        }
      });
    });

    return collisions;
  }

  private checkCollision(bodyA: RigidBody, bodyB: RigidBody): CollisionInfo | null {
    if (bodyA.shape.type === 'sphere' && bodyB.shape.type === 'sphere') {
      return this.sphereToSphere(bodyA, bodyB);
    } else if (bodyA.shape.type === 'box' && bodyB.shape.type === 'box') {
      return this.boxToBox(bodyA, bodyB);
    } else if ((bodyA.shape.type === 'sphere' && bodyB.shape.type === 'box') ||
               (bodyA.shape.type === 'box' && bodyB.shape.type === 'sphere')) {
      return this.sphereToBox(bodyA, bodyB);
    }
    
    return null;
  }

  private sphereToSphere(bodyA: RigidBody, bodyB: RigidBody): CollisionInfo | null {
    const sphereA = bodyA.shape.bounds as BoundingSphere;
    const sphereB = bodyB.shape.bounds as BoundingSphere;

    const distance = this.vectorDistance(sphereA.center, sphereB.center);
    const radiusSum = sphereA.radius + sphereB.radius;

    if (distance < radiusSum) {
      const penetrationDepth = radiusSum - distance;
      const contactNormal = this.vectorNormalize(
        this.vectorSubtract(sphereB.center, sphereA.center)
      );
      const contactPoint = this.vectorAdd(
        sphereA.center,
        this.vectorScale(contactNormal, sphereA.radius - penetrationDepth * 0.5)
      );

      return {
        bodyA,
        bodyB,
        contactPoint,
        contactNormal,
        penetrationDepth,
        relativeVelocity: this.vectorSubtract(bodyB.velocity, bodyA.velocity)
      };
    }

    return null;
  }

  private boxToBox(bodyA: RigidBody, bodyB: RigidBody): CollisionInfo | null {
    const boxA = bodyA.shape.bounds as BoundingBox;
    const boxB = bodyB.shape.bounds as BoundingBox;

    // AABB collision detection
    if (boxA.max.x < boxB.min.x || boxA.min.x > boxB.max.x ||
        boxA.max.y < boxB.min.y || boxA.min.y > boxB.max.y ||
        boxA.max.z < boxB.min.z || boxA.min.z > boxB.max.z) {
      return null;
    }

    // Calculate penetration and contact normal
    const overlapX = Math.min(boxA.max.x - boxB.min.x, boxB.max.x - boxA.min.x);
    const overlapY = Math.min(boxA.max.y - boxB.min.y, boxB.max.y - boxA.min.y);
    const overlapZ = Math.min(boxA.max.z - boxB.min.z, boxB.max.z - boxA.min.z);

    let contactNormal: Vector3;
    let penetrationDepth: number;

    if (overlapX < overlapY && overlapX < overlapZ) {
      penetrationDepth = overlapX;
      contactNormal = { x: bodyA.position.x < bodyB.position.x ? -1 : 1, y: 0, z: 0 };
    } else if (overlapY < overlapZ) {
      penetrationDepth = overlapY;
      contactNormal = { x: 0, y: bodyA.position.y < bodyB.position.y ? -1 : 1, z: 0 };
    } else {
      penetrationDepth = overlapZ;
      contactNormal = { x: 0, y: 0, z: bodyA.position.z < bodyB.position.z ? -1 : 1 };
    }

    const contactPoint = {
      x: (Math.max(boxA.min.x, boxB.min.x) + Math.min(boxA.max.x, boxB.max.x)) * 0.5,
      y: (Math.max(boxA.min.y, boxB.min.y) + Math.min(boxA.max.y, boxB.max.y)) * 0.5,
      z: (Math.max(boxA.min.z, boxB.min.z) + Math.min(boxA.max.z, boxB.max.z)) * 0.5
    };

    return {
      bodyA,
      bodyB,
      contactPoint,
      contactNormal,
      penetrationDepth,
      relativeVelocity: this.vectorSubtract(bodyB.velocity, bodyA.velocity)
    };
  }

  private sphereToBox(bodyA: RigidBody, bodyB: RigidBody): CollisionInfo | null {
    // Ensure sphere is first parameter
    if (bodyA.shape.type !== 'sphere') {
      return this.sphereToBox(bodyB, bodyA);
    }

    const sphere = bodyA.shape.bounds as BoundingSphere;
    const box = bodyB.shape.bounds as BoundingBox;

    // Find closest point on box to sphere center
    const closestPoint = {
      x: Math.max(box.min.x, Math.min(sphere.center.x, box.max.x)),
      y: Math.max(box.min.y, Math.min(sphere.center.y, box.max.y)),
      z: Math.max(box.min.z, Math.min(sphere.center.z, box.max.z))
    };

    const distance = this.vectorDistance(sphere.center, closestPoint);

    if (distance < sphere.radius) {
      const penetrationDepth = sphere.radius - distance;
      const contactNormal = distance > 0 
        ? this.vectorNormalize(this.vectorSubtract(sphere.center, closestPoint))
        : { x: 0, y: 1, z: 0 }; // Default normal if sphere center is inside box

      return {
        bodyA,
        bodyB,
        contactPoint: closestPoint,
        contactNormal,
        penetrationDepth,
        relativeVelocity: this.vectorSubtract(bodyB.velocity, bodyA.velocity)
      };
    }

    return null;
  }

  public resolveCollisions(collisions: CollisionInfo[]): void {
    collisions.forEach(collision => {
      this.resolveCollision(collision);
    });
  }

  private resolveCollision(collision: CollisionInfo): void {
    const { bodyA, bodyB, contactNormal, penetrationDepth, relativeVelocity } = collision;

    // Skip if either body is static and the other isn't moving
    if ((bodyA.isStatic && bodyB.isStatic) || 
        (bodyA.shape.isTrigger || bodyB.shape.isTrigger)) {
      return;
    }

    // Position correction (separate bodies)
    const correctionFactor = 0.8; // How much to correct penetration
    const slop = 0.01; // Allow small penetration to avoid jitter
    const correctionAmount = Math.max(penetrationDepth - slop, 0) * correctionFactor;

    if (!bodyA.isStatic && !bodyB.isStatic) {
      const totalInvMass = (1 / bodyA.mass) + (1 / bodyB.mass);
      const correctionVector = this.vectorScale(contactNormal, correctionAmount / totalInvMass);
      
      bodyA.position = this.vectorSubtract(bodyA.position, 
        this.vectorScale(correctionVector, 1 / bodyA.mass));
      bodyB.position = this.vectorAdd(bodyB.position, 
        this.vectorScale(correctionVector, 1 / bodyB.mass));
    } else if (!bodyA.isStatic) {
      bodyA.position = this.vectorSubtract(bodyA.position, 
        this.vectorScale(contactNormal, correctionAmount));
    } else if (!bodyB.isStatic) {
      bodyB.position = this.vectorAdd(bodyB.position, 
        this.vectorScale(contactNormal, correctionAmount));
    }

    // Velocity resolution (impulse-based)
    const normalVelocity = this.vectorDot(relativeVelocity, contactNormal);
    if (normalVelocity > 0) return; // Objects separating

    const restitution = Math.min(bodyA.restitution, bodyB.restitution);
    const impulseScalar = -(1 + restitution) * normalVelocity;

    if (!bodyA.isStatic && !bodyB.isStatic) {
      const totalInvMass = (1 / bodyA.mass) + (1 / bodyB.mass);
      const impulse = this.vectorScale(contactNormal, impulseScalar / totalInvMass);
      
      bodyA.velocity = this.vectorSubtract(bodyA.velocity, 
        this.vectorScale(impulse, 1 / bodyA.mass));
      bodyB.velocity = this.vectorAdd(bodyB.velocity, 
        this.vectorScale(impulse, 1 / bodyB.mass));
    } else if (!bodyA.isStatic) {
      const impulse = this.vectorScale(contactNormal, impulseScalar);
      bodyA.velocity = this.vectorSubtract(bodyA.velocity, impulse);
    } else if (!bodyB.isStatic) {
      const impulse = this.vectorScale(contactNormal, impulseScalar);
      bodyB.velocity = this.vectorAdd(bodyB.velocity, impulse);
    }

    // Apply friction
    this.applyFriction(collision);
  }

  private applyFriction(collision: CollisionInfo): void {
    const { bodyA, bodyB, contactNormal, relativeVelocity } = collision;
    
    // Calculate tangential velocity (perpendicular to normal)
    const normalVelocity = this.vectorScale(contactNormal, 
      this.vectorDot(relativeVelocity, contactNormal));
    const tangentialVelocity = this.vectorSubtract(relativeVelocity, normalVelocity);
    
    const tangentialSpeed = this.vectorMagnitude(tangentialVelocity);
    if (tangentialSpeed < 0.001) return; // No sliding
    
    const friction = Math.sqrt(bodyA.friction * bodyB.friction);
    const frictionDirection = this.vectorScale(tangentialVelocity, -1 / tangentialSpeed);
    
    let frictionMagnitude = friction * this.vectorMagnitude(normalVelocity);
    if (frictionMagnitude > tangentialSpeed) {
      frictionMagnitude = tangentialSpeed; // Static friction
    }
    
    const frictionImpulse = this.vectorScale(frictionDirection, frictionMagnitude);
    
    if (!bodyA.isStatic && !bodyB.isStatic) {
      const totalInvMass = (1 / bodyA.mass) + (1 / bodyB.mass);
      bodyA.velocity = this.vectorSubtract(bodyA.velocity, 
        this.vectorScale(frictionImpulse, 1 / (bodyA.mass * totalInvMass)));
      bodyB.velocity = this.vectorAdd(bodyB.velocity, 
        this.vectorScale(frictionImpulse, 1 / (bodyB.mass * totalInvMass)));
    } else if (!bodyA.isStatic) {
      bodyA.velocity = this.vectorSubtract(bodyA.velocity, frictionImpulse);
    } else if (!bodyB.isStatic) {
      bodyB.velocity = this.vectorAdd(bodyB.velocity, frictionImpulse);
    }
  }

  // Vector utility methods
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

  private vectorNegate(v: Vector3): Vector3 {
    return { x: -v.x, y: -v.y, z: -v.z };
  }
}