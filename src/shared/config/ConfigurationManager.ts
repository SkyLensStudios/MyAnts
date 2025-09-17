/**
 * Configuration Management System for MyAnts Simulation
 * Phase 3 Architecture Improvement - Replace hardcoded values with flexible configuration
 * 
 * Provides runtime configuration loading, validation, and hot-reloading
 * Supports environment-specific settings and user preferences
 */

import * as React from 'react';
import { 
  SimulationConfiguration, 
  ValidationResult, 
  BiomeType, 
  AAType, 
  TextureQuality, 
  AntCaste, 
} from '../types-enhanced';
import { typeValidator } from '../type-validation';

// ============================================================================
// Configuration Schema and Validation
// ============================================================================

export interface ConfigurationTemplate {
  name: string;
  description: string;
  category: 'performance' | 'quality' | 'research' | 'custom';
  targetHardware: 'low' | 'medium' | 'high' | 'ultra';
  configuration: SimulationConfiguration;
}

export interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  configuration: Partial<SimulationConfiguration>;
  compatibility: {
    minWebGLVersion: number;
    requiresWebGPU: boolean;
    minMemoryMB: number;
    minCpuCores: number;
  };
}

export interface ConfigurationEnvironment {
  development: Partial<SimulationConfiguration>;
  testing: Partial<SimulationConfiguration>;
  production: Partial<SimulationConfiguration>;
  demo: Partial<SimulationConfiguration>;
}

export interface ConfigurationSource {
  type: 'file' | 'url' | 'embedded' | 'user';
  path: string;
  priority: number;
  dynamic: boolean;
  watchForChanges: boolean;
}

// ============================================================================
// Built-in Configuration Presets
// ============================================================================

export const PERFORMANCE_PRESETS: Record<string, ConfigurationTemplate> = {
  'ultra-performance': {
    name: 'Ultra Performance',
    description: 'Maximum performance for high-end systems with WebGPU',
    category: 'performance',
    targetHardware: 'ultra',
    configuration: {
      world: {
        size: { x: 2000, y: 2000, z: 200 },
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 1.0,
        maxAnts: 50000,
        seed: 12345,
        biome: BiomeType.TEMPERATE_FOREST,
      },
      ants: {
        initialCount: 5000,
        casteDistribution: {
          [AntCaste.WORKER]: 0.75,
          [AntCaste.SOLDIER]: 0.15,
          [AntCaste.QUEEN]: 0.02,
          [AntCaste.SCOUT]: 0.05,
          [AntCaste.NURSE]: 0.025,
          [AntCaste.MALE]: 0.005,
        },
        geneticsVariation: 0.3,
        lifespanMultiplier: 1.0,
        intelligenceRange: [0.2, 0.95] as const,
        physicalTraitsRange: {
          strength: [0.1, 0.9] as const,
          speed: [0.2, 0.95] as const,
          endurance: [0.3, 0.85] as const,
        },
      },
      environment: {
        weatherEnabled: true,
        seasonalChanges: true,
        dayNightCycle: true,
        predatorsEnabled: true,
        diseasesEnabled: true,
        foodScarcity: 0.4,
        territorialConflicts: true,
      },
      performance: {
        targetFPS: 60,
        adaptiveQuality: true,
        spatialOptimization: true,
        multiThreading: true,
        gpuAcceleration: true,
        memoryLimit: 8192,
        cullingDistance: 1000,
      },
      rendering: {
        maxRenderDistance: 1000,
        lodEnabled: true,
        instancedRendering: true,
        shadowsEnabled: true,
        particleEffects: true,
        postProcessing: true,
        antiAliasing: AAType.TAA,
        textureQuality: TextureQuality.ULTRA,
      },
      ai: {
        decisionTreeDepth: 8,
        learningEnabled: true,
        memoryCapacity: 2000,
        communicationRange: 75,
        pheromoneStrength: 0.9,
        explorationBonus: 0.15,
        socialInfluence: 0.8,
      },
    },
  },

  'balanced': {
    name: 'Balanced',
    description: 'Good balance of performance and visual quality',
    category: 'quality',
    targetHardware: 'medium',
    configuration: {
      world: {
        size: { x: 1000, y: 1000, z: 100 },
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 1.0,
        maxAnts: 10000,
        seed: 12345,
        biome: BiomeType.TEMPERATE_FOREST,
      },
      ants: {
        initialCount: 1000,
        casteDistribution: {
          [AntCaste.WORKER]: 0.8,
          [AntCaste.SOLDIER]: 0.15,
          [AntCaste.QUEEN]: 0.02,
          [AntCaste.SCOUT]: 0.02,
          [AntCaste.NURSE]: 0.005,
          [AntCaste.MALE]: 0.005,
        },
        geneticsVariation: 0.2,
        lifespanMultiplier: 1.0,
        intelligenceRange: [0.3, 0.8] as const,
        physicalTraitsRange: {
          strength: [0.2, 0.8] as const,
          speed: [0.3, 0.85] as const,
          endurance: [0.4, 0.8] as const,
        },
      },
      environment: {
        weatherEnabled: true,
        seasonalChanges: true,
        dayNightCycle: true,
        predatorsEnabled: false,
        diseasesEnabled: false,
        foodScarcity: 0.3,
        territorialConflicts: false,
      },
      performance: {
        targetFPS: 60,
        adaptiveQuality: true,
        spatialOptimization: true,
        multiThreading: true,
        gpuAcceleration: true,
        memoryLimit: 4096,
        cullingDistance: 500,
      },
      rendering: {
        maxRenderDistance: 500,
        lodEnabled: true,
        instancedRendering: true,
        shadowsEnabled: true,
        particleEffects: true,
        postProcessing: true,
        antiAliasing: AAType.MSAA,
        textureQuality: TextureQuality.HIGH,
      },
      ai: {
        decisionTreeDepth: 5,
        learningEnabled: true,
        memoryCapacity: 1000,
        communicationRange: 50,
        pheromoneStrength: 0.8,
        explorationBonus: 0.1,
        socialInfluence: 0.6,
      },
    },
  },

  'low-end': {
    name: 'Performance Optimized',
    description: 'Optimized for older hardware and mobile devices',
    category: 'performance',
    targetHardware: 'low',
    configuration: {
      world: {
        size: { x: 500, y: 500, z: 50 },
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 1.0,
        maxAnts: 1000,
        seed: 12345,
        biome: BiomeType.GRASSLAND,
      },
      ants: {
        initialCount: 100,
        casteDistribution: {
          [AntCaste.WORKER]: 0.85,
          [AntCaste.SOLDIER]: 0.1,
          [AntCaste.QUEEN]: 0.02,
          [AntCaste.SCOUT]: 0.02,
          [AntCaste.NURSE]: 0.005,
          [AntCaste.MALE]: 0.005,
        },
        geneticsVariation: 0.1,
        lifespanMultiplier: 1.0,
        intelligenceRange: [0.4, 0.7] as const,
        physicalTraitsRange: {
          strength: [0.3, 0.7] as const,
          speed: [0.4, 0.7] as const,
          endurance: [0.4, 0.7] as const,
        },
      },
      environment: {
        weatherEnabled: false,
        seasonalChanges: false,
        dayNightCycle: false,
        predatorsEnabled: false,
        diseasesEnabled: false,
        foodScarcity: 0.2,
        territorialConflicts: false,
      },
      performance: {
        targetFPS: 30,
        adaptiveQuality: true,
        spatialOptimization: true,
        multiThreading: false,
        gpuAcceleration: false,
        memoryLimit: 1024,
        cullingDistance: 200,
      },
      rendering: {
        maxRenderDistance: 200,
        lodEnabled: true,
        instancedRendering: true,
        shadowsEnabled: false,
        particleEffects: false,
        postProcessing: false,
        antiAliasing: AAType.NONE,
        textureQuality: TextureQuality.LOW,
      },
      ai: {
        decisionTreeDepth: 3,
        learningEnabled: false,
        memoryCapacity: 500,
        communicationRange: 25,
        pheromoneStrength: 0.6,
        explorationBonus: 0.05,
        socialInfluence: 0.4,
      },
    },
  },

  'research': {
    name: 'Research Mode',
    description: 'Detailed simulation for research and analysis',
    category: 'research',
    targetHardware: 'high',
    configuration: {
      world: {
        size: { x: 1500, y: 1500, z: 150 },
        gravity: { x: 0, y: -9.81, z: 0 },
        timeScale: 0.5,
        maxAnts: 25000,
        seed: 12345,
        biome: BiomeType.TROPICAL_RAINFOREST,
      },
      ants: {
        initialCount: 2000,
        casteDistribution: {
          [AntCaste.WORKER]: 0.7,
          [AntCaste.SOLDIER]: 0.12,
          [AntCaste.QUEEN]: 0.03,
          [AntCaste.SCOUT]: 0.08,
          [AntCaste.NURSE]: 0.05,
          [AntCaste.MALE]: 0.02,
        },
        geneticsVariation: 0.4,
        lifespanMultiplier: 1.2,
        intelligenceRange: [0.1, 0.99] as const,
        physicalTraitsRange: {
          strength: [0.05, 0.95] as const,
          speed: [0.1, 0.99] as const,
          endurance: [0.2, 0.9] as const,
        },
      },
      environment: {
        weatherEnabled: true,
        seasonalChanges: true,
        dayNightCycle: true,
        predatorsEnabled: true,
        diseasesEnabled: true,
        foodScarcity: 0.5,
        territorialConflicts: true,
      },
      performance: {
        targetFPS: 30,
        adaptiveQuality: false,
        spatialOptimization: true,
        multiThreading: true,
        gpuAcceleration: true,
        memoryLimit: 16384,
        cullingDistance: 2000,
      },
      rendering: {
        maxRenderDistance: 2000,
        lodEnabled: false,
        instancedRendering: true,
        shadowsEnabled: true,
        particleEffects: true,
        postProcessing: true,
        antiAliasing: AAType.TAA,
        textureQuality: TextureQuality.ULTRA,
      },
      ai: {
        decisionTreeDepth: 10,
        learningEnabled: true,
        memoryCapacity: 5000,
        communicationRange: 100,
        pheromoneStrength: 0.95,
        explorationBonus: 0.2,
        socialInfluence: 0.9,
      },
    },
  },
};

// ============================================================================
// Configuration Manager Class
// ============================================================================

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private currentConfig: SimulationConfiguration;
  private sources: ConfigurationSource[] = [];
  private watchers: Map<string, any> = new Map();
  private listeners: Array<(config: SimulationConfiguration) => void> = [];
  private validationEnabled = true;

  private constructor() {
    this.currentConfig = PERFORMANCE_PRESETS['balanced'].configuration;
    this.setupDefaultSources();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Setup default configuration sources
   */
  private setupDefaultSources(): void {
    // Built-in presets (highest priority for defaults)
    this.addSource({
      type: 'embedded',
      path: 'presets://built-in',
      priority: 100,
      dynamic: false,
      watchForChanges: false,
    });

    // User preferences in localStorage
    this.addSource({
      type: 'user',
      path: 'localStorage://myants-config',
      priority: 50,
      dynamic: true,
      watchForChanges: false,
    });

    // Environment-specific config file
    const environment = this.detectEnvironment();
    this.addSource({
      type: 'file',
      path: `/config/environments/${environment}.json`,
      priority: 75,
      dynamic: true,
      watchForChanges: true,
    });
  }

  /**
   * Add a configuration source
   */
  public addSource(source: ConfigurationSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => b.priority - a.priority);

    if (source.watchForChanges && source.type === 'file') {
      this.setupFileWatcher(source);
    }
  }

  /**
   * Load configuration from a preset
   */
  public loadPreset(presetId: string): ValidationResult {
    const preset = PERFORMANCE_PRESETS[presetId];
    if (!preset) {
      return {
        isValid: false,
        errors: [{
          code: 'PRESET_NOT_FOUND',
          message: `Preset '${presetId}' not found`,
          path: 'preset',
        }],
        warnings: [],
      };
    }

    return this.setConfiguration(preset.configuration);
  }

  /**
   * Set configuration with validation
   */
  public setConfiguration(config: Partial<SimulationConfiguration>): ValidationResult {
    const mergedConfig = this.mergeConfiguration(this.currentConfig, config);
    
    if (this.validationEnabled) {
      const validation = this.validateConfiguration(mergedConfig);
      if (!validation.isValid) {
        return validation;
      }
    }

    this.currentConfig = mergedConfig;
    this.notifyListeners();
    this.saveToUserPreferences();

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): SimulationConfiguration {
    return JSON.parse(JSON.stringify(this.currentConfig));
  }

  /**
   * Get specific configuration section
   */
  public getSection<K extends keyof SimulationConfiguration>(
    section: K,
  ): SimulationConfiguration[K] {
    return JSON.parse(JSON.stringify(this.currentConfig[section]));
  }

  /**
   * Update specific configuration values
   */
  public updateValues(path: string, value: any): ValidationResult {
    const pathSegments = path.split('.');
    const updatedConfig = JSON.parse(JSON.stringify(this.currentConfig));
    
    let current = updatedConfig;
    for (let i = 0; i < pathSegments.length - 1; i++) {
      current = current[pathSegments[i]];
    }
    current[pathSegments[pathSegments.length - 1]] = value;

    return this.setConfiguration(updatedConfig);
  }

  /**
   * Load configuration from file
   */
  public async loadFromFile(filePath: string): Promise<ValidationResult> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        return {
          isValid: false,
          errors: [{
            code: 'FILE_LOAD_ERROR',
            message: `Failed to load configuration from ${filePath}: ${response.statusText}`,
            path: 'file',
          }],
          warnings: [],
        };
      }

      const config = await response.json();
      return this.setConfiguration(config);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'FILE_PARSE_ERROR',
          message: `Failed to parse configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: 'file',
        }],
        warnings: [],
      };
    }
  }

  /**
   * Save configuration to file
   */
  public async saveToFile(filePath: string): Promise<boolean> {
    try {
      const configJson = JSON.stringify(this.currentConfig, null, 2);
      
      // In a real browser environment, you'd use the File System Access API
      // For now, we'll trigger a download
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath;
      a.click();
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  /**
   * Export configuration as JSON string
   */
  public exportConfiguration(): string {
    return JSON.stringify(this.currentConfig, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  public importConfiguration(configJson: string): ValidationResult {
    try {
      const config = JSON.parse(configJson);
      return this.setConfiguration(config);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'IMPORT_PARSE_ERROR',
          message: `Failed to parse configuration JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: 'import',
        }],
        warnings: [],
      };
    }
  }

  /**
   * Reset to default configuration
   */
  public resetToDefaults(): ValidationResult {
    return this.loadPreset('balanced');
  }

  /**
   * Apply performance optimization based on detected hardware
   */
  public async optimizeForHardware(): Promise<ValidationResult> {
    const capabilities = await this.detectHardwareCapabilities();
    
    let presetId = 'balanced';
    if (capabilities.score >= 80) {
      presetId = 'ultra-performance';
    } else if (capabilities.score <= 30) {
      presetId = 'low-end';
    }

    const result = this.loadPreset(presetId);
    
      // Apply hardware-specific optimizations
      if (result.isValid) {
        const optimizations: any = {};
        
        if (!capabilities.webgpu) {
          optimizations.performance = {
            ...this.currentConfig.performance,
            gpuAcceleration: false,
          };
        }
        
        if (capabilities.memoryGB < 4) {
          optimizations.performance = {
            ...this.currentConfig.performance,
            memoryLimit: Math.max(1024, capabilities.memoryGB * 256),
          };
        }
        
        if (capabilities.cpuCores < 4) {
          optimizations.performance = {
            ...this.currentConfig.performance,
            multiThreading: false,
          };
        }

        return this.setConfiguration(optimizations);
      }    return result;
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(listener: (config: SimulationConfiguration) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get available presets
   */
  public getAvailablePresets(): Array<{ id: string; template: ConfigurationTemplate }> {
    return Object.entries(PERFORMANCE_PRESETS).map(([id, template]) => ({
      id,
      template,
    }));
  }

  /**
   * Create custom preset from current configuration
   */
  public createCustomPreset(name: string, description: string): string {
    const presetId = `custom_${Date.now()}`;
    const customPreset: ConfigurationTemplate = {
      name,
      description,
      category: 'custom',
      targetHardware: 'medium',
      configuration: this.getConfiguration(),
    };

    // Store in localStorage for persistence
    const customPresets = this.getCustomPresets();
    customPresets[presetId] = customPreset;
    localStorage.setItem('myants-custom-presets', JSON.stringify(customPresets));

    return presetId;
  }

  /**
   * Get custom presets from localStorage
   */
  public getCustomPresets(): Record<string, ConfigurationTemplate> {
    try {
      const stored = localStorage.getItem('myants-custom-presets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Enable/disable configuration validation
   */
  public setValidationEnabled(enabled: boolean): void {
    this.validationEnabled = enabled;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private validateConfiguration(config: SimulationConfiguration): ValidationResult {
    // Use existing type validator for comprehensive validation
    const validation = typeValidator.validateSimulationConfiguration(config);
    
    // Add additional business logic validation
    if (validation.isValid) {
      const warnings = [];
      
      // Check for potential performance issues
      if (config.world.maxAnts > 10000 && !config.performance.gpuAcceleration) {
        warnings.push({
          code: 'PERFORMANCE_WARNING',
          message: 'Large ant populations without GPU acceleration may cause performance issues',
          suggestion: 'Enable GPU acceleration or reduce max ants',
        });
      }
      
      if (config.ants.initialCount > config.world.maxAnts) {
        warnings.push({
          code: 'POPULATION_WARNING',
          message: 'Initial ant count exceeds maximum world capacity',
          suggestion: 'Reduce initial count or increase world max ants',
        });
      }

      return { ...validation, warnings };
    }

    return validation;
  }

  private mergeConfiguration(
    base: SimulationConfiguration, 
    updates: Partial<SimulationConfiguration>,
  ): SimulationConfiguration {
    const merged = JSON.parse(JSON.stringify(base));
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          merged[key] = { ...merged[key], ...value };
        } else {
          merged[key] = value;
        }
      }
    }
    
    return merged;
  }

  private detectEnvironment(): string {
    // Detect if we're in development, testing, or production
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
      }
      if (window.location.hostname.includes('staging') || window.location.hostname.includes('test')) {
        return 'testing';
      }
      if (window.location.search.includes('demo=true')) {
        return 'demo';
      }
    }
    return 'production';
  }

  private async detectHardwareCapabilities(): Promise<{
    webgpu: boolean;
    webgl2: boolean;
    memoryGB: number;
    cpuCores: number;
    score: number;
  }> {
    const capabilities = {
      webgpu: false,
      webgl2: false,
      memoryGB: 4,
      cpuCores: 4,
      score: 50,
    };

    try {
      // Check WebGPU support
      if ('gpu' in navigator) {
        const adapter = await (navigator as any).gpu.requestAdapter();
        capabilities.webgpu = !!adapter;
      }

      // Check WebGL2 support
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      capabilities.webgl2 = !!gl2;

      // Estimate memory (rough approximation)
      if ('memory' in performance) {
        capabilities.memoryGB = Math.round((performance as any).memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
      }

      // Estimate CPU cores
      capabilities.cpuCores = navigator.hardwareConcurrency || 4;

      // Calculate capability score
      let score = 30; // Base score
      if (capabilities.webgpu) score += 25;
      if (capabilities.webgl2) score += 15;
      if (capabilities.memoryGB >= 8) score += 15;
      if (capabilities.cpuCores >= 8) score += 15;

      capabilities.score = Math.min(100, score);

    } catch (error) {
      console.warn('Hardware capability detection failed:', error);
    }

    return capabilities;
  }

  private setupFileWatcher(source: ConfigurationSource): void {
    // In a real electron app, you'd use fs.watchFile
    // For web apps, this would be a no-op or use Service Workers
    this.watchers.set(source.path, null);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfiguration());
      } catch (error) {
        console.error('Configuration listener error:', error);
      }
    });
  }

  private saveToUserPreferences(): void {
    try {
      localStorage.setItem('myants-user-config', JSON.stringify(this.currentConfig));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }
}

// ============================================================================
// Configuration Utilities and Helpers
// ============================================================================

/**
 * Auto-configure based on hardware capabilities
 */
export async function autoConfigureForHardware(): Promise<SimulationConfiguration> {
  const manager = ConfigurationManager.getInstance();
  await manager.optimizeForHardware();
  return manager.getConfiguration();
}

/**
 * Load configuration from multiple sources with priorities
 */
export async function loadConfigurationFromSources(
  sources: ConfigurationSource[],
): Promise<SimulationConfiguration> {
  const manager = ConfigurationManager.getInstance();
  
  // Add sources in priority order
  sources.forEach(source => manager.addSource(source));
  
  return manager.getConfiguration();
}

/**
 * Create configuration builder for fluent API
 */
export class ConfigurationBuilder {
  private config: {
    world?: Partial<SimulationConfiguration['world']>;
    ants?: Partial<SimulationConfiguration['ants']>;
    environment?: Partial<SimulationConfiguration['environment']>;
    performance?: Partial<SimulationConfiguration['performance']>;
    rendering?: Partial<SimulationConfiguration['rendering']>;
    ai?: Partial<SimulationConfiguration['ai']>;
  } = {};

  public world(world: Partial<SimulationConfiguration['world']>): this {
    this.config.world = { ...this.config.world, ...world };
    return this;
  }

  public ants(ants: Partial<SimulationConfiguration['ants']>): this {
    this.config.ants = { ...this.config.ants, ...ants };
    return this;
  }

  public environment(environment: Partial<SimulationConfiguration['environment']>): this {
    this.config.environment = { ...this.config.environment, ...environment };
    return this;
  }

  public performance(performance: Partial<SimulationConfiguration['performance']>): this {
    this.config.performance = { ...this.config.performance, ...performance };
    return this;
  }

  public rendering(rendering: Partial<SimulationConfiguration['rendering']>): this {
    this.config.rendering = { ...this.config.rendering, ...rendering };
    return this;
  }

  public ai(ai: Partial<SimulationConfiguration['ai']>): this {
    this.config.ai = { ...this.config.ai, ...ai };
    return this;
  }

  public build(): ValidationResult {
    const manager = ConfigurationManager.getInstance();
    return manager.setConfiguration(this.config as Partial<SimulationConfiguration>);
  }
}

/**
 * Utility function to create configuration builder
 */
export function createConfiguration(): ConfigurationBuilder {
  return new ConfigurationBuilder();
}

// Export singleton instance
export const configurationManager = ConfigurationManager.getInstance();

// ============================================================================
// React Hooks for Configuration Management
// ============================================================================

/**
 * React hook for accessing configuration
 */
export function useConfiguration(): {
  config: SimulationConfiguration;
  setConfig: (config: Partial<SimulationConfiguration>) => ValidationResult;
  loadPreset: (presetId: string) => ValidationResult;
  resetToDefaults: () => ValidationResult;
  export: () => string;
  import: (json: string) => ValidationResult;
} {
  const [config, setConfig] = React.useState(
    configurationManager.getConfiguration(),
  );

  React.useEffect(() => {
    const unsubscribe = configurationManager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  return {
    config,
    setConfig: (updates) => configurationManager.setConfiguration(updates),
    loadPreset: (presetId) => configurationManager.loadPreset(presetId),
    resetToDefaults: () => configurationManager.resetToDefaults(),
    export: () => configurationManager.exportConfiguration(),
    import: (json) => configurationManager.importConfiguration(json),
  };
}