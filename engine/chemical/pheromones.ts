/**
 * Advanced pheromone and chemical simulation system
 * Implements realistic diffusion, evaporation, and chemical interactions
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ChemicalLayer {
  id: string;
  type: PheromoneType;
  concentration: Float32Array;  // 2D grid of concentrations
  width: number;               // Grid width
  height: number;              // Grid height
  cellSize: number;            // Size of each grid cell in world units
  diffusionRate: number;       // How fast the chemical spreads
  evaporationRate: number;     // How fast it decays
  viscosity: number;           // Resistance to flow
  density: number;             // Chemical density
  lastUpdate: number;          // Last update timestamp
}

export type PheromoneType = 
  | 'trail'           // Food trail pheromone
  | 'alarm'           // Danger/alarm pheromone  
  | 'recruitment'     // Task coordination pheromone
  | 'territorial'     // Colony boundary markers
  | 'queen'           // Queen presence pheromone
  | 'nestmate'        // Colony recognition pheromone
  | 'sex'             // Mating pheromone
  | 'necrophoresis';  // Death/cleanup pheromone

export interface PheromoneSource {
  id: string;
  position: Vector3D;
  type: PheromoneType;
  intensity: number;           // Emission intensity (0-1)
  radius: number;              // Effective radius
  duration: number;            // How long it lasts (-1 for permanent)
  startTime: number;           // When it was created
  owner?: string;              // Ant ID that created it
}

export interface ChemicalInteraction {
  type1: PheromoneType;
  type2: PheromoneType;
  effect: 'amplify' | 'suppress' | 'neutralize' | 'transform';
  strength: number;            // Interaction strength (0-1)
  product?: PheromoneType;     // Result of transformation
}

export interface WindEffect {
  velocity: Vector3D;          // Wind direction and speed
  turbulence: number;          // Turbulence factor (0-1)
  gustiness: number;           // Gust variation (0-1)
  temperature: number;         // Temperature affecting diffusion
  humidity: number;            // Humidity affecting evaporation
}

export class PheromoneSystem {
  private layers: Map<PheromoneType, ChemicalLayer> = new Map();
  private sources: Map<string, PheromoneSource> = new Map();
  private interactions: ChemicalInteraction[] = [];
  private windEffect: WindEffect;
  
  // Simulation parameters
  private readonly GRID_RESOLUTION = 0.5;  // World units per grid cell
  private readonly UPDATE_INTERVAL = 50;   // Milliseconds between updates
  private readonly MAX_CONCENTRATION = 1.0;
  
  // Diffusion coefficients (realistic values scaled for simulation)
  private readonly DIFFUSION_RATES = new Map<PheromoneType, number>([
    ['trail', 0.8],
    ['alarm', 1.2],        // Alarm spreads faster
    ['recruitment', 0.6],
    ['territorial', 0.3],  // Territorial marks spread slowly
    ['queen', 0.4],
    ['nestmate', 0.5],
    ['sex', 1.0],
    ['necrophoresis', 0.7],
  ]);
  
  // Evaporation rates (how quickly pheromones fade)
  private readonly EVAPORATION_RATES = new Map<PheromoneType, number>([
    ['trail', 0.02],       // Trail fades moderately
    ['alarm', 0.05],       // Alarm fades quickly
    ['recruitment', 0.03],
    ['territorial', 0.001], // Territorial marks persist
    ['queen', 0.005],      // Queen pheromone persists
    ['nestmate', 0.01],
    ['sex', 0.04],
    ['necrophoresis', 0.02],
  ]);

  constructor(worldWidth: number, worldHeight: number) {
    this.windEffect = {
      velocity: { x: 0, y: 0, z: 0 },
      turbulence: 0.1,
      gustiness: 0.2,
      temperature: 25,
      humidity: 0.6,
    };
    
    this.initializeLayers(worldWidth, worldHeight);
    this.setupChemicalInteractions();
  }

  private initializeLayers(worldWidth: number, worldHeight: number): void {
    const gridWidth = Math.ceil(worldWidth / this.GRID_RESOLUTION);
    const gridHeight = Math.ceil(worldHeight / this.GRID_RESOLUTION);
    
    // Create layers for each pheromone type
    for (const [type, diffusionRate] of this.DIFFUSION_RATES) {
      const layer: ChemicalLayer = {
        id: `layer_${type}`,
        type,
        concentration: new Float32Array(gridWidth * gridHeight),
        width: gridWidth,
        height: gridHeight,
        cellSize: this.GRID_RESOLUTION,
        diffusionRate,
        evaporationRate: this.EVAPORATION_RATES.get(type) || 0.02,
        viscosity: 0.1,
        density: 1.0,
        lastUpdate: Date.now(),
      };
      
      this.layers.set(type, layer);
    }
  }

  private setupChemicalInteractions(): void {
    this.interactions = [
      // Alarm pheromone amplifies recruitment
      {
        type1: 'alarm',
        type2: 'recruitment',
        effect: 'amplify',
        strength: 0.3,
      },
      
      // Trail and recruitment work together
      {
        type1: 'trail',
        type2: 'recruitment',
        effect: 'amplify',
        strength: 0.2,
      },
      
      // Queen pheromone suppresses sex pheromone
      {
        type1: 'queen',
        type2: 'sex',
        effect: 'suppress',
        strength: 0.8,
      },
      
      // Necrophoresis neutralizes other pheromones
      {
        type1: 'necrophoresis',
        type2: 'trail',
        effect: 'suppress',
        strength: 0.4,
      },
      {
        type1: 'necrophoresis',
        type2: 'recruitment',
        effect: 'suppress',
        strength: 0.3,
      },
      
      // Territorial and nestmate reinforce each other
      {
        type1: 'territorial',
        type2: 'nestmate',
        effect: 'amplify',
        strength: 0.25,
      },
    ];
  }

  /**
   * Add a pheromone source to the simulation
   */
  public addSource(source: Omit<PheromoneSource, 'id' | 'startTime'>): string {
    const id = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newSource: PheromoneSource = {
      ...source,
      id,
      startTime: Date.now(),
    };
    
    this.sources.set(id, newSource);
    return id;
  }

  /**
   * Remove a pheromone source
   */
  public removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  /**
   * Update the entire pheromone system
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update wind effects
    this.updateWindEffects(deltaTime);
    
    // Process active sources
    this.processSources(deltaTime);
    
    // Update each chemical layer
    for (const [type, layer] of this.layers) {
      this.updateLayer(layer, deltaTime);
    }
    
    // Process chemical interactions
    this.processInteractions(deltaTime);
    
    // Clean up expired sources
    this.cleanupExpiredSources(currentTime);
  }

  private updateWindEffects(deltaTime: number): void {
    // Simple wind simulation with some variation
    const time = Date.now() / 1000;
    
    this.windEffect.velocity.x = Math.sin(time * 0.1) * 2 + 
      Math.sin(time * 0.3) * this.windEffect.gustiness;
    this.windEffect.velocity.y = Math.cos(time * 0.15) * 1.5 + 
      Math.cos(time * 0.25) * this.windEffect.gustiness;
    
    // Add turbulence
    this.windEffect.velocity.x += (Math.random() - 0.5) * this.windEffect.turbulence;
    this.windEffect.velocity.y += (Math.random() - 0.5) * this.windEffect.turbulence;
  }

  private processSources(deltaTime: number): void {
    for (const [sourceId, source] of this.sources) {
      // Check if source has expired
      if (source.duration > 0) {
        const elapsed = Date.now() - source.startTime;
        if (elapsed > source.duration) {
          this.sources.delete(sourceId);
          continue;
        }
      }
      
      // Add pheromone to appropriate layer
      this.emitPheromone(source, deltaTime);
    }
  }

  private emitPheromone(source: PheromoneSource, deltaTime: number): void {
    const layer = this.layers.get(source.type);
    if (!layer) return;
    
    // Convert world position to grid coordinates
    const gridX = Math.floor(source.position.x / layer.cellSize);
    const gridY = Math.floor(source.position.y / layer.cellSize);
    
    // Emit in a circular pattern
    const radiusCells = Math.ceil(source.radius / layer.cellSize);
    
    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      for (let dy = -radiusCells; dy <= radiusCells; dy++) {
        const x = gridX + dx;
        const y = gridY + dy;
        
        if (x >= 0 && x < layer.width && y >= 0 && y < layer.height) {
          const distance = Math.sqrt(dx * dx + dy * dy) * layer.cellSize;
          
          if (distance <= source.radius) {
            // Calculate emission strength based on distance
            const strength = source.intensity * Math.exp(-distance / source.radius);
            const index = y * layer.width + x;
            
            // Add to existing concentration
            layer.concentration[index] = Math.min(
              this.MAX_CONCENTRATION,
              layer.concentration[index] + strength * deltaTime * 0.01
            );
          }
        }
      }
    }
  }

  private updateLayer(layer: ChemicalLayer, deltaTime: number): void {
    const newConcentration = new Float32Array(layer.concentration.length);
    
    // Copy current state
    newConcentration.set(layer.concentration);
    
    // Apply diffusion
    this.applyDiffusion(layer, newConcentration, deltaTime);
    
    // Apply wind effects
    this.applyWindEffects(layer, newConcentration, deltaTime);
    
    // Apply evaporation
    this.applyEvaporation(layer, newConcentration, deltaTime);
    
    // Update layer
    layer.concentration = newConcentration;
    layer.lastUpdate = Date.now();
  }

  private applyDiffusion(layer: ChemicalLayer, concentration: Float32Array, deltaTime: number): void {
    const diffusionConstant = layer.diffusionRate * deltaTime * 0.1;
    
    // Use finite difference method for diffusion
    for (let y = 1; y < layer.height - 1; y++) {
      for (let x = 1; x < layer.width - 1; x++) {
        const index = y * layer.width + x;
        
        // Get neighboring concentrations
        const center = layer.concentration[index];
        const left = layer.concentration[index - 1];
        const right = layer.concentration[index + 1];
        const up = layer.concentration[index - layer.width];
        const down = layer.concentration[index + layer.width];
        
        // Calculate Laplacian (second derivative)
        const laplacian = (left + right + up + down - 4 * center);
        
        // Apply diffusion equation: dC/dt = D * ∇²C
        concentration[index] += diffusionConstant * laplacian;
      }
    }
  }

  private applyWindEffects(layer: ChemicalLayer, concentration: Float32Array, deltaTime: number): void {
    const windStrength = Math.sqrt(
      this.windEffect.velocity.x * this.windEffect.velocity.x +
      this.windEffect.velocity.y * this.windEffect.velocity.y
    );
    
    if (windStrength < 0.1) return; // No significant wind
    
    // Calculate wind displacement
    const windDx = this.windEffect.velocity.x * deltaTime * 0.1;
    const windDy = this.windEffect.velocity.y * deltaTime * 0.1;
    
    // Apply advection (simplified)
    for (let y = 1; y < layer.height - 1; y++) {
      for (let x = 1; x < layer.width - 1; x++) {
        const index = y * layer.width + x;
        
        // Calculate source position for this cell
        const sourceX = x - windDx / layer.cellSize;
        const sourceY = y - windDy / layer.cellSize;
        
        // Bilinear interpolation for fractional positions
        if (sourceX >= 0 && sourceX < layer.width - 1 &&
            sourceY >= 0 && sourceY < layer.height - 1) {
          
          const x1 = Math.floor(sourceX);
          const y1 = Math.floor(sourceY);
          const x2 = x1 + 1;
          const y2 = y1 + 1;
          
          const fx = sourceX - x1;
          const fy = sourceY - y1;
          
          const c11 = layer.concentration[y1 * layer.width + x1];
          const c12 = layer.concentration[y2 * layer.width + x1];
          const c21 = layer.concentration[y1 * layer.width + x2];
          const c22 = layer.concentration[y2 * layer.width + x2];
          
          const interpolated = 
            c11 * (1 - fx) * (1 - fy) +
            c21 * fx * (1 - fy) +
            c12 * (1 - fx) * fy +
            c22 * fx * fy;
          
          // Blend with current concentration
          concentration[index] = layer.concentration[index] * (1 - windStrength * 0.1) +
                                interpolated * windStrength * 0.1;
        }
      }
    }
  }

  private applyEvaporation(layer: ChemicalLayer, concentration: Float32Array, deltaTime: number): void {
    // Environmental factors affect evaporation
    const tempFactor = 1 + (this.windEffect.temperature - 25) * 0.02; // Higher temp = faster evaporation
    const humidityFactor = 1 - this.windEffect.humidity * 0.3; // Higher humidity = slower evaporation
    
    const evaporationRate = layer.evaporationRate * tempFactor * humidityFactor * deltaTime;
    
    for (let i = 0; i < concentration.length; i++) {
      concentration[i] *= (1 - evaporationRate);
      
      // Remove very small concentrations to prevent floating point errors
      if (concentration[i] < 0.001) {
        concentration[i] = 0;
      }
    }
  }

  private processInteractions(deltaTime: number): void {
    for (const interaction of this.interactions) {
      const layer1 = this.layers.get(interaction.type1);
      const layer2 = this.layers.get(interaction.type2);
      
      if (!layer1 || !layer2) continue;
      
      this.applyChemicalInteraction(layer1, layer2, interaction, deltaTime);
    }
  }

  private applyChemicalInteraction(
    layer1: ChemicalLayer,
    layer2: ChemicalLayer,
    interaction: ChemicalInteraction,
    deltaTime: number
  ): void {
    const strength = interaction.strength * deltaTime * 0.1;
    
    for (let i = 0; i < layer1.concentration.length; i++) {
      const conc1 = layer1.concentration[i];
      const conc2 = layer2.concentration[i];
      
      if (conc1 > 0.001 && conc2 > 0.001) {
        switch (interaction.effect) {
          case 'amplify':
            // Each chemical amplifies the other
            layer1.concentration[i] += conc2 * strength;
            layer2.concentration[i] += conc1 * strength;
            break;
            
          case 'suppress':
            // One chemical reduces the other
            layer2.concentration[i] *= (1 - conc1 * strength);
            break;
            
          case 'neutralize':
            // Chemicals cancel each other out
            const neutralization = Math.min(conc1, conc2) * strength;
            layer1.concentration[i] -= neutralization;
            layer2.concentration[i] -= neutralization;
            break;
            
          case 'transform':
            // One chemical transforms into another
            if (interaction.product) {
              const productLayer = this.layers.get(interaction.product);
              if (productLayer) {
                const transformation = Math.min(conc1, conc2) * strength;
                layer1.concentration[i] -= transformation;
                layer2.concentration[i] -= transformation;
                productLayer.concentration[i] += transformation;
              }
            }
            break;
        }
      }
    }
  }

  private cleanupExpiredSources(currentTime: number): void {
    for (const [sourceId, source] of this.sources) {
      if (source.duration > 0) {
        const elapsed = currentTime - source.startTime;
        if (elapsed > source.duration) {
          this.sources.delete(sourceId);
        }
      }
    }
  }

  /**
   * Get pheromone concentration at a specific world position
   */
  public getConcentration(position: Vector3D, type: PheromoneType): number {
    const layer = this.layers.get(type);
    if (!layer) return 0;
    
    const gridX = Math.floor(position.x / layer.cellSize);
    const gridY = Math.floor(position.y / layer.cellSize);
    
    if (gridX >= 0 && gridX < layer.width && gridY >= 0 && gridY < layer.height) {
      const index = gridY * layer.width + gridX;
      return layer.concentration[index];
    }
    
    return 0;
  }

  /**
   * Get gradient (direction of strongest concentration) at position
   */
  public getGradient(position: Vector3D, type: PheromoneType): Vector3D {
    const layer = this.layers.get(type);
    if (!layer) return { x: 0, y: 0, z: 0 };
    
    const gridX = Math.floor(position.x / layer.cellSize);
    const gridY = Math.floor(position.y / layer.cellSize);
    
    if (gridX <= 0 || gridX >= layer.width - 1 || gridY <= 0 || gridY >= layer.height - 1) {
      return { x: 0, y: 0, z: 0 };
    }
    
    // Calculate finite difference gradient
    const center = gridY * layer.width + gridX;
    const dx = (layer.concentration[center + 1] - layer.concentration[center - 1]) * 0.5;
    const dy = (layer.concentration[center + layer.width] - layer.concentration[center - layer.width]) * 0.5;
    
    return { x: dx, y: dy, z: 0 };
  }

  /**
   * Get all pheromone concentrations at a position
   */
  public getAllConcentrations(position: Vector3D): Map<PheromoneType, number> {
    const concentrations = new Map<PheromoneType, number>();
    
    for (const [type, layer] of this.layers) {
      concentrations.set(type, this.getConcentration(position, type));
    }
    
    return concentrations;
  }

  /**
   * Update wind conditions
   */
  public setWind(wind: Partial<WindEffect>): void {
    Object.assign(this.windEffect, wind);
  }

  /**
   * Get current wind conditions
   */
  public getWind(): WindEffect {
    return { ...this.windEffect };
  }

  /**
   * Clear all pheromones of a specific type
   */
  public clearPheromone(type: PheromoneType): void {
    const layer = this.layers.get(type);
    if (layer) {
      layer.concentration.fill(0);
    }
  }

  /**
   * Clear all pheromones
   */
  public clearAll(): void {
    for (const [_, layer] of this.layers) {
      layer.concentration.fill(0);
    }
    this.sources.clear();
  }

  /**
   * Get visualization data for a specific pheromone type
   */
  public getVisualizationData(type: PheromoneType): {
    width: number;
    height: number;
    cellSize: number;
    data: Float32Array;
  } | null {
    const layer = this.layers.get(type);
    if (!layer) return null;
    
    return {
      width: layer.width,
      height: layer.height,
      cellSize: layer.cellSize,
      data: new Float32Array(layer.concentration),
    };
  }

  /**
   * Get system statistics
   */
  public getStats(): {
    totalSources: number;
    totalConcentration: number;
    layerStats: Map<PheromoneType, {
      maxConcentration: number;
      averageConcentration: number;
      activeCells: number;
    }>;
  } {
    const layerStats = new Map();
    let totalConcentration = 0;
    
    for (const [type, layer] of this.layers) {
      let max = 0;
      let sum = 0;
      let active = 0;
      
      for (let i = 0; i < layer.concentration.length; i++) {
        const conc = layer.concentration[i];
        if (conc > 0.001) {
          active++;
          sum += conc;
          max = Math.max(max, conc);
        }
      }
      
      totalConcentration += sum;
      
      layerStats.set(type, {
        maxConcentration: max,
        averageConcentration: active > 0 ? sum / active : 0,
        activeCells: active,
      });
    }
    
    return {
      totalSources: this.sources.size,
      totalConcentration,
      layerStats,
    };
  }
}