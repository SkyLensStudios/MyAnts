/**
 * Entity Component System (ECS) Architecture for MyAnts Simulation
 * Phase 3 Architecture Improvement - Modular, performant entity management
 * 
 * Modern ECS implementation with data-oriented design principles
 * Replaces monolithic entity classes with composable components and systems
 */

import { SimulationConfiguration } from '../types-enhanced';

// ============================================================================
// Core ECS Types and Interfaces
// ============================================================================

// Unique entity identifier
export type EntityId = number;

// Component type identifier
export type ComponentType = string;

// Component interface that all components must implement
export interface Component {
  readonly type: ComponentType;
}

// Component constructor signature
export interface ComponentConstructor<T extends Component = Component> {
  new (...args: any[]): T;
  readonly type: ComponentType;
}

// System interface for processing entities with specific components
export interface System {
  readonly name: string;
  readonly requiredComponents: readonly ComponentType[];
  readonly priority: number;
  readonly enabled: boolean;
  
  initialize?(world: World): void;
  update(deltaTime: number, entities: EntityId[], world: World): void;
  cleanup?(world: World): void;
}

// Query interface for finding entities with specific component combinations
export interface Query {
  readonly with: readonly ComponentType[];
  readonly without?: readonly ComponentType[];
  readonly any?: readonly ComponentType[];
}

// ============================================================================
// Core ECS Components
// ============================================================================

export class Transform implements Component {
  static readonly type = 'Transform';
  readonly type = Transform.type;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public rotationX: number = 0,
    public rotationY: number = 0,
    public rotationZ: number = 0,
    public scaleX: number = 1,
    public scaleY: number = 1,
    public scaleZ: number = 1,
  ) {}

  setPosition(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  setRotation(x: number, y: number, z: number): void {
    this.rotationX = x;
    this.rotationY = y;
    this.rotationZ = z;
  }

  setScale(x: number, y: number, z: number): void {
    this.scaleX = x;
    this.scaleY = y;
    this.scaleZ = z;
  }
}

export class Velocity implements Component {
  static readonly type = 'Velocity';
  readonly type = Velocity.type;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public maxSpeed: number = 1.0,
  ) {}

  setVelocity(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  getSpeed(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): void {
    const speed = this.getSpeed();
    if (speed > 0) {
      this.x /= speed;
      this.y /= speed;
      this.z /= speed;
    }
  }

  clampToMaxSpeed(): void {
    const speed = this.getSpeed();
    if (speed > this.maxSpeed) {
      this.normalize();
      this.x *= this.maxSpeed;
      this.y *= this.maxSpeed;
      this.z *= this.maxSpeed;
    }
  }
}

export class Health implements Component {
  static readonly type = 'Health';
  readonly type = Health.type;

  constructor(
    public current: number = 100,
    public maximum: number = 100,
    public regenerationRate: number = 0,
  ) {}

  takeDamage(amount: number): boolean {
    this.current = Math.max(0, this.current - amount);
    return this.current <= 0;
  }

  heal(amount: number): void {
    this.current = Math.min(this.maximum, this.current + amount);
  }

  isAlive(): boolean {
    return this.current > 0;
  }

  getHealthPercentage(): number {
    return this.current / this.maximum;
  }
}

export class Energy implements Component {
  static readonly type = 'Energy';
  readonly type = Energy.type;

  constructor(
    public current: number = 100,
    public maximum: number = 100,
    public consumptionRate: number = 1,
    public regenerationRate: number = 0,
  ) {}

  consume(amount: number): boolean {
    this.current = Math.max(0, this.current - amount);
    return this.current <= 0;
  }

  restore(amount: number): void {
    this.current = Math.min(this.maximum, this.current + amount);
  }

  getEnergyPercentage(): number {
    return this.current / this.maximum;
  }
}

export class AntIdentity implements Component {
  static readonly type = 'AntIdentity';
  readonly type = AntIdentity.type;

  constructor(
    public caste: string,
    public age: number = 0,
    public generation: number = 0,
    public colonyId: EntityId = 0,
  ) {}
}

export class Task implements Component {
  static readonly type = 'Task';
  readonly type = Task.type;

  constructor(
    public currentTask: string = 'idle',
    public priority: number = 0,
    public targetEntityId?: EntityId,
    public targetPosition?: { x: number; y: number; z: number },
    public progress: number = 0,
    public isComplete: boolean = false,
  ) {}

  setTask(task: string, priority: number = 0): void {
    this.currentTask = task;
    this.priority = priority;
    this.progress = 0;
    this.isComplete = false;
  }

  updateProgress(delta: number): void {
    this.progress = Math.min(1, this.progress + delta);
    if (this.progress >= 1) {
      this.isComplete = true;
    }
  }
}

export class Inventory implements Component {
  static readonly type = 'Inventory';
  readonly type = Inventory.type;

  public items: Map<string, number> = new Map();

  constructor(
    public capacity: number = 1,
  ) {}

  addItem(itemType: string, amount: number = 1): boolean {
    const currentTotal = this.getTotalItems();
    if (currentTotal + amount > this.capacity) {
      return false;
    }

    const current = this.items.get(itemType) || 0;
    this.items.set(itemType, current + amount);
    return true;
  }

  removeItem(itemType: string, amount: number = 1): number {
    const current = this.items.get(itemType) || 0;
    const removed = Math.min(current, amount);
    
    if (removed === current) {
      this.items.delete(itemType);
    } else {
      this.items.set(itemType, current - removed);
    }
    
    return removed;
  }

  hasItem(itemType: string, amount: number = 1): boolean {
    return (this.items.get(itemType) || 0) >= amount;
  }

  getTotalItems(): number {
    let total = 0;
    for (const amount of this.items.values()) {
      total += amount;
    }
    return total;
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  isFull(): boolean {
    return this.getTotalItems() >= this.capacity;
  }
}

export class Pheromone implements Component {
  static readonly type = 'Pheromone';
  readonly type = Pheromone.type;

  constructor(
    public pheromoneType: string,
    public strength: number = 1.0,
    public decayRate: number = 0.01,
    public radius: number = 10,
  ) {}

  decay(deltaTime: number): boolean {
    this.strength -= this.decayRate * deltaTime;
    return this.strength <= 0;
  }
}

export class Renderable implements Component {
  static readonly type = 'Renderable';
  readonly type = Renderable.type;

  constructor(
    public meshId: string,
    public materialId: string,
    public visible: boolean = true,
    public castShadow: boolean = true,
    public receiveShadow: boolean = true,
    public scale: number = 1.0,
  ) {}
}

export class Physics implements Component {
  static readonly type = 'Physics';
  readonly type = Physics.type;

  constructor(
    public mass: number = 1.0,
    public friction: number = 0.1,
    public restitution: number = 0.3,
    public isStatic: boolean = false,
    public gravityScale: number = 1.0,
  ) {}
}

export class Collision implements Component {
  static readonly type = 'Collision';
  readonly type = Collision.type;

  constructor(
    public shape: 'sphere' | 'box' | 'cylinder' = 'sphere',
    public radius: number = 0.5,
    public width: number = 1.0,
    public height: number = 1.0,
    public depth: number = 1.0,
    public isTrigger: boolean = false,
  ) {}
}

export class AI implements Component {
  static readonly type = 'AI';
  readonly type = AI.type;

  public state: string = 'idle';
  public memory: Map<string, any> = new Map();
  public lastDecisionTime: number = 0;
  public decisionCooldown: number = 100; // ms

  constructor(
    public intelligence: number = 0.5,
    public aggressiveness: number = 0.5,
    public curiosity: number = 0.5,
    public socialTendency: number = 0.5,
  ) {}

  canMakeDecision(currentTime: number): boolean {
    return currentTime - this.lastDecisionTime >= this.decisionCooldown;
  }

  makeDecision(currentTime: number): void {
    this.lastDecisionTime = currentTime;
  }

  setMemory(key: string, value: any): void {
    this.memory.set(key, value);
  }

  getMemory(key: string): any {
    return this.memory.get(key);
  }

  hasMemory(key: string): boolean {
    return this.memory.has(key);
  }
}

// ============================================================================
// Component Registry
// ============================================================================

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private componentTypes: Map<ComponentType, ComponentConstructor> = new Map();

  private constructor() {
    // Register core components
    this.register(Transform);
    this.register(Velocity);
    this.register(Health);
    this.register(Energy);
    this.register(AntIdentity);
    this.register(Task);
    this.register(Inventory);
    this.register(Pheromone);
    this.register(Renderable);
    this.register(Physics);
    this.register(Collision);
    this.register(AI);
  }

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  public register<T extends Component>(componentClass: ComponentConstructor<T>): void {
    this.componentTypes.set(componentClass.type, componentClass);
  }

  public getConstructor(type: ComponentType): ComponentConstructor | undefined {
    return this.componentTypes.get(type);
  }

  public getAllTypes(): ComponentType[] {
    return Array.from(this.componentTypes.keys());
  }

  public isRegistered(type: ComponentType): boolean {
    return this.componentTypes.has(type);
  }
}

// ============================================================================
// Entity Manager
// ============================================================================

export class EntityManager {
  private nextEntityId: EntityId = 1;
  private entities: Set<EntityId> = new Set();
  private components: Map<ComponentType, Map<EntityId, Component>> = new Map();
  private entityComponents: Map<EntityId, Set<ComponentType>> = new Map();
  private recycleBin: EntityId[] = [];

  constructor() {
    // Initialize component storage for all registered types
    const registry = ComponentRegistry.getInstance();
    for (const type of registry.getAllTypes()) {
      this.components.set(type, new Map());
    }
  }

  /**
   * Create a new entity
   */
  public createEntity(): EntityId {
    let entityId: EntityId;
    
    if (this.recycleBin.length > 0) {
      entityId = this.recycleBin.pop()!;
    } else {
      entityId = this.nextEntityId++;
    }

    this.entities.add(entityId);
    this.entityComponents.set(entityId, new Set());
    
    return entityId;
  }

  /**
   * Destroy an entity and all its components
   */
  public destroyEntity(entityId: EntityId): void {
    if (!this.entities.has(entityId)) {
      return;
    }

    // Remove all components
    const componentTypes = this.entityComponents.get(entityId);
    if (componentTypes) {
      for (const type of componentTypes) {
        this.components.get(type)?.delete(entityId);
      }
    }

    // Clean up entity
    this.entities.delete(entityId);
    this.entityComponents.delete(entityId);
    this.recycleBin.push(entityId);
  }

  /**
   * Add a component to an entity
   */
  public addComponent<T extends Component>(entityId: EntityId, component: T): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    const componentMap = this.components.get(component.type);
    if (!componentMap) {
      throw new Error(`Component type ${component.type} is not registered`);
    }

    componentMap.set(entityId, component);
    this.entityComponents.get(entityId)?.add(component.type);
  }

  /**
   * Remove a component from an entity
   */
  public removeComponent(entityId: EntityId, componentType: ComponentType): void {
    const componentMap = this.components.get(componentType);
    componentMap?.delete(entityId);
    this.entityComponents.get(entityId)?.delete(componentType);
  }

  /**
   * Get a component from an entity
   */
  public getComponent<T extends Component>(entityId: EntityId, componentType: ComponentType): T | undefined {
    const componentMap = this.components.get(componentType);
    return componentMap?.get(entityId) as T;
  }

  /**
   * Check if an entity has a component
   */
  public hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
    return this.entityComponents.get(entityId)?.has(componentType) || false;
  }

  /**
   * Check if an entity has all specified components
   */
  public hasComponents(entityId: EntityId, componentTypes: readonly ComponentType[]): boolean {
    const entityComponentSet = this.entityComponents.get(entityId);
    if (!entityComponentSet) return false;

    return componentTypes.every(type => entityComponentSet.has(type));
  }

  /**
   * Query entities with specific component combinations
   */
  public query(query: Query): EntityId[] {
    const result: EntityId[] = [];

    for (const entityId of this.entities) {
      if (this.matchesQuery(entityId, query)) {
        result.push(entityId);
      }
    }

    return result;
  }

  /**
   * Get all entities
   */
  public getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  /**
   * Get the number of entities
   */
  public getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Get all components of a specific type
   */
  public getComponents<T extends Component>(componentType: ComponentType): Map<EntityId, T> {
    return this.components.get(componentType) as Map<EntityId, T> || new Map();
  }

  /**
   * Clear all entities and components
   */
  public clear(): void {
    this.entities.clear();
    this.entityComponents.clear();
    this.recycleBin.length = 0;
    this.nextEntityId = 1;

    for (const componentMap of this.components.values()) {
      componentMap.clear();
    }
  }

  private matchesQuery(entityId: EntityId, query: Query): boolean {
    const entityComponentSet = this.entityComponents.get(entityId);
    if (!entityComponentSet) return false;

    // Check required components
    if (!query.with.every(type => entityComponentSet.has(type))) {
      return false;
    }

    // Check excluded components
    if (query.without && query.without.some(type => entityComponentSet.has(type))) {
      return false;
    }

    // Check any components (at least one must be present)
    if (query.any && !query.any.some(type => entityComponentSet.has(type))) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// World (ECS Container)
// ============================================================================

export class World {
  public readonly entityManager: EntityManager;
  public readonly componentRegistry: ComponentRegistry;
  private systems: System[] = [];
  private systemsByName: Map<string, System> = new Map();

  constructor() {
    this.entityManager = new EntityManager();
    this.componentRegistry = ComponentRegistry.getInstance();
  }

  /**
   * Add a system to the world
   */
  public addSystem(system: System): void {
    this.systems.push(system);
    this.systemsByName.set(system.name, system);
    
    // Sort systems by priority (higher priority runs first)
    this.systems.sort((a, b) => b.priority - a.priority);

    // Initialize the system
    if (system.initialize) {
      system.initialize(this);
    }
  }

  /**
   * Remove a system from the world
   */
  public removeSystem(systemName: string): void {
    const system = this.systemsByName.get(systemName);
    if (system) {
      // Cleanup the system
      if (system.cleanup) {
        system.cleanup(this);
      }

      this.systemsByName.delete(systemName);
      this.systems = this.systems.filter(s => s.name !== systemName);
    }
  }

  /**
   * Get a system by name
   */
  public getSystem(systemName: string): System | undefined {
    return this.systemsByName.get(systemName);
  }

  /**
   * Update all systems
   */
  public update(deltaTime: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        const entities = this.entityManager.query({ with: system.requiredComponents });
        system.update(deltaTime, entities, this);
      }
    }
  }

  /**
   * Create an entity with components
   */
  public createEntity(...components: Component[]): EntityId {
    const entityId = this.entityManager.createEntity();
    
    for (const component of components) {
      this.entityManager.addComponent(entityId, component);
    }

    return entityId;
  }

  /**
   * Destroy an entity
   */
  public destroyEntity(entityId: EntityId): void {
    this.entityManager.destroyEntity(entityId);
  }

  /**
   * Query entities
   */
  public query(query: Query): EntityId[] {
    return this.entityManager.query(query);
  }

  /**
   * Get all systems
   */
  public getSystems(): System[] {
    return [...this.systems];
  }

  /**
   * Get number of systems
   */
  public getSystemCount(): number {
    return this.systems.length;
  }

  /**
   * Get number of enabled systems
   */
  public getEnabledSystemCount(): number {
    return this.systems.filter(s => s.enabled).length;
  }

  /**
   * Clear the world
   */
  public clear(): void {
    // Cleanup all systems
    for (const system of this.systems) {
      if (system.cleanup) {
        system.cleanup(this);
      }
    }

    this.entityManager.clear();
    this.systems.length = 0;
    this.systemsByName.clear();
  }
}

// Export singleton instance
export const ecsWorld = new World();