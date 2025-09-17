/**
 * Enhanced TypeScript Type Definitions for Phase 2
 * Replaces 'any' types with proper interfaces and type safety
 * Improves IDE support and catches runtime errors at compile time
 */

// Core simulation types with strict typing
export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Quaternion {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface Transform {
  readonly position: Vector3D;
  readonly rotation: Quaternion;
  readonly scale: Vector3D;
}

// Enhanced Ant Types with strict typing
export enum AntCaste {
  WORKER = 'worker',
  SOLDIER = 'soldier',
  QUEEN = 'queen',
  SCOUT = 'scout',
  NURSE = 'nurse',
  MALE = 'male'
}

export enum AntState {
  IDLE = 'idle',
  FORAGING = 'foraging',
  RETURNING = 'returning',
  FIGHTING = 'fighting',
  BUILDING = 'building',
  CARING = 'caring',
  MATING = 'mating',
  DYING = 'dying'
}

export interface AntPhysiology {
  readonly health: number;        // 0-1
  readonly energy: number;        // 0-1
  readonly strength: number;      // 0-1
  readonly speed: number;         // 0-1
  readonly intelligence: number;  // 0-1
  readonly fertility: number;     // 0-1
  readonly lifespan: number;      // in simulation time units
  readonly age: number;           // current age
}

export interface AntBehavior {
  readonly aggression: number;    // 0-1
  readonly curiosity: number;     // 0-1
  readonly cooperation: number;   // 0-1
  readonly communication: number; // 0-1
  readonly loyalty: number;       // 0-1
}

export interface AntMemory {
  readonly landmarks: ReadonlyMap<string, Vector3D>;
  readonly foodSources: ReadonlyMap<string, Vector3D>;
  readonly threats: ReadonlyMap<string, Vector3D>;
  readonly paths: ReadonlyArray<Vector3D>;
  readonly socialConnections: ReadonlySet<string>;
}

// Enhanced Environment Types
export interface EnvironmentConditions {
  readonly temperature: number;        // Celsius
  readonly humidity: number;          // 0-1
  readonly lightLevel: number;        // 0-1
  readonly windSpeed: number;         // m/s
  readonly windDirection: number;     // radians
  readonly precipitation: number;     // mm/h
  readonly pressure: number;          // kPa
  readonly soilMoisture: number;      // 0-1
  readonly ph: number;               // pH level
}

export interface FoodSource {
  readonly id: string;
  readonly position: Vector3D;
  readonly type: FoodType;
  readonly nutritionalValue: NutritionalProfile;
  readonly quantity: number;         // kg
  readonly qualityDecay: number;     // decay rate per time unit
  readonly accessibility: number;    // 0-1
  readonly discoveryRadius: number;  // meters
  readonly lastVisited: number;      // timestamp
}

export enum FoodType {
  SEEDS = 'seeds',
  INSECTS = 'insects',
  NECTAR = 'nectar',
  FUNGI = 'fungi',
  CARRION = 'carrion',
  SAP = 'sap'
}

export interface NutritionalProfile {
  readonly carbohydrates: number;    // percentage
  readonly proteins: number;         // percentage
  readonly fats: number;            // percentage
  readonly vitamins: number;         // percentage
  readonly minerals: number;         // percentage
  readonly water: number;           // percentage
  readonly toxicity: number;        // 0-1
}

// Spatial and Performance Types
export interface SpatialBounds {
  readonly min: Vector3D;
  readonly max: Vector3D;
}

export interface SpatialQuery {
  readonly type: 'point' | 'radius' | 'bounds' | 'ray' | 'nearest';
  readonly position?: Vector3D;
  readonly radius?: number;
  readonly bounds?: SpatialBounds;
  readonly direction?: Vector3D;
  readonly maxResults?: number;
  readonly filters?: ReadonlyArray<SpatialFilter>;
}

export interface SpatialFilter {
  readonly property: string;
  readonly operator: 'equals' | 'greater' | 'less' | 'contains';
  readonly value: unknown;
}

export interface SpatialQueryResult<T = unknown> {
  readonly entities: ReadonlyArray<T>;
  readonly queryTime: number;
  readonly totalChecked: number;
  readonly cacheHit: boolean;
}

// Performance and Metrics Types
export interface PerformanceMetrics {
  readonly fps: number;
  readonly frameTime: number;
  readonly cpuUsage: number;
  readonly memoryUsage: number;
  readonly triangleCount: number;
  readonly drawCalls: number;
  readonly shaderSwitches: number;
  readonly textureBindings: number;
}

export interface SimulationMetrics {
  readonly antCount: number;
  readonly colonyCount: number;
  readonly foodSourceCount: number;
  readonly pheromoneTrailCount: number;
  readonly updateTime: number;
  readonly spatialQueryTime: number;
  readonly aiDecisionTime: number;
  readonly physicsTime: number;
}

export interface RenderingMetrics {
  readonly lodDistribution: Readonly<Record<string, number>>;
  readonly culledObjects: number;
  readonly visibleObjects: number;
  readonly instancedMeshes: number;
  readonly materialSwitches: number;
  readonly geometryComplexity: number;
}

// Configuration Types with strict typing
export interface SimulationConfiguration {
  readonly world: WorldConfiguration;
  readonly ants: AntConfiguration;
  readonly environment: EnvironmentConfiguration;
  readonly performance: PerformanceConfiguration;
  readonly rendering: RenderingConfiguration;
  readonly ai: AIConfiguration;
}

export interface WorldConfiguration {
  readonly size: Vector3D;
  readonly gravity: Vector3D;
  readonly timeScale: number;
  readonly maxAnts: number;
  readonly seed: number;
  readonly biome: BiomeType;
}

export enum BiomeType {
  TEMPERATE_FOREST = 'temperate_forest',
  TROPICAL_RAINFOREST = 'tropical_rainforest',
  DESERT = 'desert',
  GRASSLAND = 'grassland',
  TUNDRA = 'tundra',
  WETLAND = 'wetland'
}

export interface AntConfiguration {
  readonly initialCount: number;
  readonly casteDistribution: Readonly<Record<AntCaste, number>>;
  readonly geneticsVariation: number;
  readonly lifespanMultiplier: number;
  readonly intelligenceRange: readonly [number, number];
  readonly physicalTraitsRange: Readonly<Record<string, readonly [number, number]>>;
}

export interface EnvironmentConfiguration {
  readonly weatherEnabled: boolean;
  readonly seasonalChanges: boolean;
  readonly dayNightCycle: boolean;
  readonly predatorsEnabled: boolean;
  readonly diseasesEnabled: boolean;
  readonly foodScarcity: number;
  readonly territorialConflicts: boolean;
}

export interface PerformanceConfiguration {
  readonly targetFPS: number;
  readonly adaptiveQuality: boolean;
  readonly spatialOptimization: boolean;
  readonly multiThreading: boolean;
  readonly gpuAcceleration: boolean;
  readonly memoryLimit: number;
  readonly cullingDistance: number;
}

export interface RenderingConfiguration {
  readonly maxRenderDistance: number;
  readonly lodEnabled: boolean;
  readonly instancedRendering: boolean;
  readonly shadowsEnabled: boolean;
  readonly particleEffects: boolean;
  readonly postProcessing: boolean;
  readonly antiAliasing: AAType;
  readonly textureQuality: TextureQuality;
}

export enum AAType {
  NONE = 'none',
  FXAA = 'fxaa',
  MSAA = 'msaa',
  TAA = 'taa'
}

export enum TextureQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export interface AIConfiguration {
  readonly decisionTreeDepth: number;
  readonly learningEnabled: boolean;
  readonly memoryCapacity: number;
  readonly communicationRange: number;
  readonly pheromoneStrength: number;
  readonly explorationBonus: number;
  readonly socialInfluence: number;
}

// Event and Messaging Types
export interface SimulationEvent<T = unknown> {
  readonly type: string;
  readonly timestamp: number;
  readonly source: string;
  readonly data: T;
  readonly priority: EventPriority;
}

export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export interface EventHandler<T = unknown> {
  (event: SimulationEvent<T>): void | Promise<void>;
}

export interface EventSystem {
  subscribe<T = unknown>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
  emit<T = unknown>(event: SimulationEvent<T>): void;
  clear(): void;
}

// Validation and Error Types
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<ValidationError>;
  readonly warnings: ReadonlyArray<ValidationWarning>;
}

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly value?: unknown;
}

export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly suggestion?: string;
}

export interface ErrorContext {
  readonly component: string;
  readonly method: string;
  readonly parameters: ReadonlyRecord<string, unknown>;
  readonly stackTrace: string;
  readonly timestamp: number;
}

// Utility Types
export type ReadonlyRecord<K extends string | number | symbol, V> = {
  readonly [P in K]: V;
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[] 
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends object 
    ? DeepReadonly<T[P]>
    : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonNullable<T> = T extends null | undefined ? never : T;

// Function signature types
export type UpdateFunction<T> = (deltaTime: number, context: T) => void;
export type RenderFunction<T> = (data: T, context: RenderContext) => void;
export type QueryFunction<T, R> = (query: T) => Promise<R>;

export interface RenderContext {
  readonly camera: Camera;
  readonly lights: ReadonlyArray<Light>;
  readonly environment: EnvironmentConditions;
  readonly viewport: Viewport;
}

export interface Camera {
  readonly position: Vector3D;
  readonly target: Vector3D;
  readonly up: Vector3D;
  readonly fov: number;
  readonly near: number;
  readonly far: number;
}

export interface Light {
  readonly type: LightType;
  readonly position: Vector3D;
  readonly direction: Vector3D;
  readonly color: Color;
  readonly intensity: number;
  readonly castShadows: boolean;
}

export enum LightType {
  DIRECTIONAL = 'directional',
  POINT = 'point',
  SPOT = 'spot',
  AMBIENT = 'ambient'
}

export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number;
}

export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// Type Guards
export function isVector3D(value: unknown): value is Vector3D {
  return typeof value === 'object' && 
         value !== null && 
         'x' in value && 
         'y' in value && 
         'z' in value &&
         typeof (value as any).x === 'number' &&
         typeof (value as any).y === 'number' &&
         typeof (value as any).z === 'number';
}

export function isAntCaste(value: unknown): value is AntCaste {
  return typeof value === 'string' && Object.values(AntCaste).includes(value as AntCaste);
}

export function isPerformanceMetrics(value: unknown): value is PerformanceMetrics {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as any;
  return typeof obj.fps === 'number' &&
         typeof obj.frameTime === 'number' &&
         typeof obj.cpuUsage === 'number' &&
         typeof obj.memoryUsage === 'number';
}

// Constants
export const DEFAULT_VECTOR3D: Vector3D = Object.freeze({ x: 0, y: 0, z: 0 });
export const DEFAULT_QUATERNION: Quaternion = Object.freeze({ x: 0, y: 0, z: 0, w: 1 });

export const ANT_CASTE_SIZES: ReadonlyRecord<AntCaste, number> = Object.freeze({
  [AntCaste.WORKER]: 1.0,
  [AntCaste.SOLDIER]: 1.3,
  [AntCaste.QUEEN]: 2.0,
  [AntCaste.SCOUT]: 0.9,
  [AntCaste.NURSE]: 1.1,
  [AntCaste.MALE]: 0.8
});

export const PERFORMANCE_THRESHOLDS: ReadonlyRecord<string, number> = Object.freeze({
  EXCELLENT_FPS: 60,
  GOOD_FPS: 45,
  ACCEPTABLE_FPS: 30,
  POOR_FPS: 15,
  MAX_FRAME_TIME: 33.33, // milliseconds for 30 FPS
  MAX_MEMORY_USAGE: 512,  // MB
  MAX_CPU_USAGE: 80       // percentage
});

// Export all commonly used constants
export const COMMON_CONSTANTS = Object.freeze({
  DEFAULT_VECTOR3D,
  DEFAULT_QUATERNION,
  ANT_CASTE_SIZES,
  PERFORMANCE_THRESHOLDS
});