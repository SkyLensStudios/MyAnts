/**
 * 2D Type Definitions for MyAnts
 * Vector2D and related 2D spatial types to replace 3D equivalents
 */

// Basic 2D Vector
export interface Vector2D {
  x: number;
  y: number;
}

// 2D Bounding Box
export interface BoundingBox2D {
  min: Vector2D;
  max: Vector2D;
}

// 2D Circle (equivalent to sphere in 3D)
export interface BoundingCircle {
  center: Vector2D;
  radius: number;
}

// 2D Collision Shape
export interface CollisionShape2D {
  type: 'box' | 'circle' | 'polygon';
  bounds: BoundingBox2D | BoundingCircle;
  isTrigger: boolean;
}

// 2D Rigid Body
export interface RigidBody2D {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  rotation: number; // Single rotation angle in radians
  angularVelocity: number;
  mass: number;
  restitution: number; // Bounciness (0-1)
  friction: number;    // Surface friction (0-1)
  shape: CollisionShape2D;
  isStatic: boolean;
  collisionLayers: number; // Bit mask for collision filtering
}

// 2D Collision Info
export interface CollisionInfo2D {
  bodyA: RigidBody2D;
  bodyB: RigidBody2D;
  contactPoint: Vector2D;
  contactNormal: Vector2D;
  penetrationDepth: number;
  relativeVelocity: Vector2D;
}

// 2D AABB for spatial structures
export interface AABB2D {
  min: Vector2D;
  max: Vector2D;
}

// 2D Spatial Entity
export interface SpatialEntity2D {
  id: string;
  position: Vector2D;
  velocity?: Vector2D;
  radius: number;
  bounds: AABB2D;
  type: 'ant' | 'food' | 'obstacle' | 'pheromone_source' | 'nest';
  lastUpdate: number;
}

// 2D Spatial Query
export interface SpatialQuery2D {
  type: 'point' | 'range' | 'radius' | 'ray' | 'nearest';
  center?: Vector2D;
  radius?: number;
  bounds?: AABB2D;
  ray?: { origin: Vector2D; direction: Vector2D };
  maxResults?: number;
  filter?: (entity: SpatialEntity2D) => boolean;
}

// 2D Query Result
export interface QueryResult2D {
  entities: SpatialEntity2D[];
  queryTime: number;
  nodesVisited: number;
  entitiesChecked: number;
}

// 2D Ant Render Instance
export interface AntRenderInstance2D {
  id?: string;
  position: Vector2D;
  rotation: number; // Single angle instead of quaternion
  scale: Vector2D; // 2D scale
  color: { r: number; g: number; b: number; a: number }; // Color without Three.js dependency
  animationState: number;
  visible: boolean;
  lodLevel: number;
}

// 2D Pheromone Render Data
export interface PheromoneRenderData2D {
  position: Vector2D;
  strength: number;
  type: string;
  decay: number;
}

// 2D Environment Render Data  
export interface EnvironmentRenderData2D {
  position: Vector2D;
  size: Vector2D;
  type: string;
  properties: Record<string, any>;
}

// 2D Simulation Update
export interface SimulationUpdate2D {
  timestamp: number;
  antData: AntRenderInstance2D[];
  pheromoneData: PheromoneRenderData2D[];
  environmentData: EnvironmentRenderData2D[];
  deltaTime: number;
}

// Utility functions for 2D operations
export class Vector2DUtils {
  static create(x: number = 0, y: number = 0): Vector2D {
    return { x, y };
  }

  static clone(v: Vector2D): Vector2D {
    return { x: v.x, y: v.y };
  }

  static add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  static multiply(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x * scalar, y: v.y * scalar };
  }

  static dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
  }

  static magnitude(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static magnitudeSquared(v: Vector2D): number {
    return v.x * v.x + v.y * v.y;
  }

  static distance(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSquared(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  static normalize(v: Vector2D): Vector2D {
    const length = Vector2DUtils.magnitude(v);
    if (length === 0) return { x: 0, y: 0 };
    return { x: v.x / length, y: v.y / length };
  }

  static rotate(v: Vector2D, angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  }

  static lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  static isValid(v: Vector2D): boolean {
    return typeof v.x === 'number' && typeof v.y === 'number' && 
           !isNaN(v.x) && !isNaN(v.y) && 
           isFinite(v.x) && isFinite(v.y);
  }
}

// AABB2D utility functions
export class AABB2DUtils {
  static create(min: Vector2D, max: Vector2D): AABB2D {
    return { min, max };
  }

  static fromCenterAndSize(center: Vector2D, size: Vector2D): AABB2D {
    const halfX = size.x / 2;
    const halfY = size.y / 2;
    return {
      min: { x: center.x - halfX, y: center.y - halfY },
      max: { x: center.x + halfX, y: center.y + halfY },
    };
  }

  static contains(aabb: AABB2D, point: Vector2D): boolean {
    return point.x >= aabb.min.x && point.x <= aabb.max.x &&
           point.y >= aabb.min.y && point.y <= aabb.max.y;
  }

  static intersects(a: AABB2D, b: AABB2D): boolean {
    return a.min.x <= b.max.x && a.max.x >= b.min.x &&
           a.min.y <= b.max.y && a.max.y >= b.min.y;
  }

  static union(a: AABB2D, b: AABB2D): AABB2D {
    return {
      min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y) },
      max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y) },
    };
  }

  static expand(aabb: AABB2D, amount: number): AABB2D {
    return {
      min: { x: aabb.min.x - amount, y: aabb.min.y - amount },
      max: { x: aabb.max.x + amount, y: aabb.max.y + amount },
    };
  }

  static area(aabb: AABB2D): number {
    return (aabb.max.x - aabb.min.x) * (aabb.max.y - aabb.min.y);
  }

  static center(aabb: AABB2D): Vector2D {
    return {
      x: (aabb.min.x + aabb.max.x) / 2,
      y: (aabb.min.y + aabb.max.y) / 2,
    };
  }

  static size(aabb: AABB2D): Vector2D {
    return {
      x: aabb.max.x - aabb.min.x,
      y: aabb.max.y - aabb.min.y,
    };
  }
}

// Type guards
export function isVector2D(value: unknown): value is Vector2D {
  return typeof value === 'object' && value !== null &&
         'x' in value && 'y' in value &&
         typeof (value as any).x === 'number' &&
         typeof (value as any).y === 'number';
}

export function isAABB2D(value: unknown): value is AABB2D {
  return typeof value === 'object' && value !== null &&
         'min' in value && 'max' in value &&
         isVector2D((value as any).min) &&
         isVector2D((value as any).max);
}