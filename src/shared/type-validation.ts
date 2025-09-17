/**
 * TypeScript Validation and Safety Utilities for Phase 2
 * Provides runtime type checking and validation to eliminate 'any' usage
 * Ensures type safety at runtime with comprehensive validation
 */

import {
  Vector3D,
  Quaternion,
  AntCaste,
  AntState,
  PerformanceMetrics,
  SimulationConfiguration,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  isVector3D,
  isAntCaste,
  isPerformanceMetrics
} from './types-enhanced';

/**
 * Comprehensive validation utility class
 */
export class TypeValidator {
  private static instance: TypeValidator;

  public static getInstance(): TypeValidator {
    if (!TypeValidator.instance) {
      TypeValidator.instance = new TypeValidator();
    }
    return TypeValidator.instance;
  }

  /**
   * Validate Vector3D with strict type checking
   */
  public validateVector3D(value: unknown, fieldName: string = 'vector'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isVector3D(value)) {
      errors.push({
        code: 'INVALID_VECTOR3D',
        message: `${fieldName} must be a valid Vector3D with x, y, z numeric properties`,
        path: fieldName,
        value
      });
      return { isValid: false, errors, warnings };
    }

    const { x, y, z } = value;

    // Check for NaN or infinite values
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      errors.push({
        code: 'INVALID_NUMERIC_VALUES',
        message: `${fieldName} contains NaN or infinite values`,
        path: fieldName,
        value: { x, y, z }
      });
    }

    // Check for extremely large values that might cause performance issues
    const MAX_COORDINATE = 1000000;
    if (Math.abs(x) > MAX_COORDINATE || Math.abs(y) > MAX_COORDINATE || Math.abs(z) > MAX_COORDINATE) {
      warnings.push({
        code: 'LARGE_COORDINATE_VALUES',
        message: `${fieldName} contains very large coordinate values`,
        suggestion: 'Consider using smaller coordinate values for better performance'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Quaternion with normalization check
   */
  public validateQuaternion(value: unknown, fieldName: string = 'quaternion'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.isQuaternion(value)) {
      errors.push({
        code: 'INVALID_QUATERNION',
        message: `${fieldName} must be a valid Quaternion with x, y, z, w numeric properties`,
        path: fieldName,
        value
      });
      return { isValid: false, errors, warnings };
    }

    const { x, y, z, w } = value;

    // Check for NaN or infinite values
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(w)) {
      errors.push({
        code: 'INVALID_NUMERIC_VALUES',
        message: `${fieldName} contains NaN or infinite values`,
        path: fieldName,
        value: { x, y, z, w }
      });
    }

    // Check if quaternion is normalized (magnitude should be 1)
    const magnitude = Math.sqrt(x * x + y * y + z * z + w * w);
    if (Math.abs(magnitude - 1.0) > 0.001) {
      warnings.push({
        code: 'QUATERNION_NOT_NORMALIZED',
        message: `${fieldName} is not normalized (magnitude: ${magnitude.toFixed(4)})`,
        suggestion: 'Normalize quaternion for proper rotation representation'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate performance metrics with reasonable bounds
   */
  public validatePerformanceMetrics(value: unknown, fieldName: string = 'performanceMetrics'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isPerformanceMetrics(value)) {
      errors.push({
        code: 'INVALID_PERFORMANCE_METRICS',
        message: `${fieldName} must be a valid PerformanceMetrics object`,
        path: fieldName,
        value
      });
      return { isValid: false, errors, warnings };
    }

    const metrics = value as PerformanceMetrics;

    // Validate FPS bounds
    if (metrics.fps < 0 || metrics.fps > 240) {
      if (metrics.fps < 0) {
        errors.push({
          code: 'INVALID_FPS_NEGATIVE',
          message: `FPS cannot be negative: ${metrics.fps}`,
          path: `${fieldName}.fps`,
          value: metrics.fps
        });
      } else {
        warnings.push({
          code: 'UNUSUALLY_HIGH_FPS',
          message: `FPS is unusually high: ${metrics.fps}`,
          suggestion: 'Verify FPS calculation accuracy'
        });
      }
    }

    // Validate frame time
    if (metrics.frameTime < 0 || metrics.frameTime > 1000) {
      errors.push({
        code: 'INVALID_FRAME_TIME',
        message: `Frame time out of reasonable bounds: ${metrics.frameTime}ms`,
        path: `${fieldName}.frameTime`,
        value: metrics.frameTime
      });
    }

    // Validate CPU usage percentage
    if (metrics.cpuUsage < 0 || metrics.cpuUsage > 100) {
      errors.push({
        code: 'INVALID_CPU_USAGE',
        message: `CPU usage must be between 0-100%: ${metrics.cpuUsage}`,
        path: `${fieldName}.cpuUsage`,
        value: metrics.cpuUsage
      });
    }

    // Validate memory usage (in MB)
    if (metrics.memoryUsage < 0 || metrics.memoryUsage > 16384) { // 16GB limit
      errors.push({
        code: 'INVALID_MEMORY_USAGE',
        message: `Memory usage out of reasonable bounds: ${metrics.memoryUsage}MB`,
        path: `${fieldName}.memoryUsage`,
        value: metrics.memoryUsage
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate simulation configuration with comprehensive checks
   */
  public validateSimulationConfiguration(value: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.isSimulationConfiguration(value)) {
      errors.push({
        code: 'INVALID_SIMULATION_CONFIG',
        message: 'Value is not a valid SimulationConfiguration',
        path: 'root',
        value
      });
      return { isValid: false, errors, warnings };
    }

    const config = value as SimulationConfiguration;

    // Validate world configuration
    const worldResult = this.validateWorldConfiguration(config.world);
    errors.push(...worldResult.errors.map(err => ({ ...err, path: `world.${err.path}` })));
    warnings.push(...worldResult.warnings);

    // Validate performance configuration
    const perfResult = this.validatePerformanceConfiguration(config.performance);
    errors.push(...perfResult.errors.map(err => ({ ...err, path: `performance.${err.path}` })));
    warnings.push(...perfResult.warnings);

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Safe type casting with validation
   */
  public safeCast<T>(value: unknown, validator: (val: unknown) => val is T, fallback: T): T {
    return validator(value) ? value : fallback;
  }

  /**
   * Assert type with runtime validation
   */
  public assertType<T>(value: unknown, validator: (val: unknown) => val is T, errorMessage: string): asserts value is T {
    if (!validator(value)) {
      throw new TypeError(errorMessage);
    }
  }

  /**
   * Create strongly typed object builder
   */
  public createBuilder<T>(): TypedObjectBuilder<T> {
    return new TypedObjectBuilder<T>();
  }

  // Private helper methods
  private isQuaternion(value: unknown): value is Quaternion {
    return typeof value === 'object' && 
           value !== null && 
           'x' in value && 
           'y' in value && 
           'z' in value &&
           'w' in value &&
           typeof (value as any).x === 'number' &&
           typeof (value as any).y === 'number' &&
           typeof (value as any).z === 'number' &&
           typeof (value as any).w === 'number';
  }

  private isSimulationConfiguration(value: unknown): value is SimulationConfiguration {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as any;
    return 'world' in obj && 
           'ants' in obj && 
           'environment' in obj && 
           'performance' in obj && 
           'rendering' in obj && 
           'ai' in obj;
  }

  private validateWorldConfiguration(world: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate world size
    const sizeResult = this.validateVector3D(world.size, 'size');
    errors.push(...sizeResult.errors);
    warnings.push(...sizeResult.warnings);

    // Validate time scale
    if (typeof world.timeScale !== 'number' || world.timeScale <= 0 || world.timeScale > 100) {
      errors.push({
        code: 'INVALID_TIME_SCALE',
        message: `Time scale must be between 0 and 100: ${world.timeScale}`,
        path: 'timeScale',
        value: world.timeScale
      });
    }

    // Validate max ants
    if (typeof world.maxAnts !== 'number' || world.maxAnts < 1 || world.maxAnts > 100000) {
      errors.push({
        code: 'INVALID_MAX_ANTS',
        message: `Max ants must be between 1 and 100,000: ${world.maxAnts}`,
        path: 'maxAnts',
        value: world.maxAnts
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validatePerformanceConfiguration(performance: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate target FPS
    if (typeof performance.targetFPS !== 'number' || performance.targetFPS < 15 || performance.targetFPS > 240) {
      errors.push({
        code: 'INVALID_TARGET_FPS',
        message: `Target FPS must be between 15 and 240: ${performance.targetFPS}`,
        path: 'targetFPS',
        value: performance.targetFPS
      });
    }

    // Validate memory limit
    if (typeof performance.memoryLimit !== 'number' || performance.memoryLimit < 256 || performance.memoryLimit > 16384) {
      errors.push({
        code: 'INVALID_MEMORY_LIMIT',
        message: `Memory limit must be between 256MB and 16GB: ${performance.memoryLimit}MB`,
        path: 'memoryLimit',
        value: performance.memoryLimit
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

/**
 * Strongly typed object builder
 */
export class TypedObjectBuilder<T> {
  private data: Partial<T> = {};
  private validationRules: Array<(obj: Partial<T>) => ValidationResult> = [];

  public set<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  public addValidation(rule: (obj: Partial<T>) => ValidationResult): this {
    this.validationRules.push(rule);
    return this;
  }

  public build(): T {
    // Run all validation rules
    for (const rule of this.validationRules) {
      const result = rule(this.data);
      if (!result.isValid) {
        throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
      }
    }

    return this.data as T;
  }

  public tryBuild(): { success: boolean; value?: T; errors?: ValidationError[] } {
    try {
      const value = this.build();
      return { success: true, value };
    } catch (error) {
      return { 
        success: false, 
        errors: [{ 
          code: 'BUILD_FAILED', 
          message: error instanceof Error ? error.message : 'Unknown error',
          path: 'root'
        }] 
      };
    }
  }
}

/**
 * Runtime type checking decorators
 */
export function validateInput<T>(validator: (val: unknown) => val is T) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(this: any, input: unknown) {
      if (!validator(input)) {
        throw new TypeError(`Invalid input for ${propertyKey}: expected valid type`);
      }
      return originalMethod.call(this, input);
    };
    
    return descriptor;
  };
}

/**
 * Performance-aware type validation
 */
export class FastTypeChecker {
  private static readonly typeCache = new Map<string, boolean>();

  public static isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  public static isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  public static isValidArray<T>(value: unknown, itemValidator?: (item: unknown) => item is T): value is T[] {
    if (!Array.isArray(value)) return false;
    if (!itemValidator) return true;
    return value.every(itemValidator);
  }

  public static isValidObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  public static validateWithCache<T>(
    value: unknown, 
    validator: (val: unknown) => val is T,
    cacheKey: string
  ): value is T {
    if (this.typeCache.has(cacheKey)) {
      return this.typeCache.get(cacheKey)!;
    }

    const isValid = validator(value);
    this.typeCache.set(cacheKey, isValid);
    return isValid;
  }

  public static clearCache(): void {
    this.typeCache.clear();
  }
}

// Export singleton instance
export const typeValidator = TypeValidator.getInstance();