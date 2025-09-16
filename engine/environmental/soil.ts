/**
 * Advanced soil simulation system
 * Implements realistic soil properties, chemistry, and physics
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type SoilType = 'clay' | 'sand' | 'loam' | 'silt' | 'peat' | 'rocky';

export interface SoilLayer {
  depth: number;              // Depth in meters
  thickness: number;          // Layer thickness in meters
  soilType: SoilType;
  porosity: number;           // 0-1, affects water retention
  permeability: number;       // Water flow rate
  density: number;            // kg/m³
  organicMatter: number;      // 0-1, affects fertility
  compaction: number;         // 0-1, affects digging difficulty
  stability: number;          // 0-1, tunnel collapse resistance
  temperature: number;        // Celsius
}

export interface SoilChemistry {
  pH: number;                 // 0-14, soil acidity
  nitrogen: number;           // mg/kg
  phosphorus: number;         // mg/kg
  potassium: number;          // mg/kg
  calcium: number;            // mg/kg
  magnesium: number;          // mg/kg
  sulfur: number;             // mg/kg
  ironOxide: number;          // mg/kg
  organicCarbon: number;      // mg/kg
  salinity: number;           // dS/m
}

export interface MoistureProfile {
  saturation: number;         // 0-1, current water content
  fieldCapacity: number;      // 0-1, max water retention
  wiltingPoint: number;       // 0-1, min plant-available water
  hydraulicConductivity: number; // Water movement rate
  capillaryAction: number;    // Upward water movement
}

export interface SoilCell {
  position: Vector3D;
  layers: SoilLayer[];
  chemistry: SoilChemistry;
  moisture: MoistureProfile;
  temperature: number;
  microorganisms: number;     // Microbial activity level
  rootDensity: number;        // Plant root density
  excavated: boolean;         // Has been dug by ants
  excavationStrength: number; // How much has been excavated (0-1)
  tunnelStability: number;    // Current tunnel stability
  lastUpdated: number;
}

export interface SoilProperties {
  // Digging properties
  diggingDifficulty: number;  // 0-1, how hard to dig
  caveInRisk: number;         // 0-1, tunnel collapse probability
  supportRequired: number;    // 0-1, structural support needed
  
  // Water properties
  drainageRate: number;       // How fast water drains
  waterRetention: number;     // How much water is retained
  capillaryRise: number;      // Upward water movement
  
  // Chemical properties
  nutrientAvailability: number; // Plant nutrition
  toxicity: number;           // Harmful substances
  buffering: number;          // pH stability
}

export class SoilSystem {
  private soilGrid: Map<string, SoilCell> = new Map();
  private worldWidth: number;
  private worldHeight: number;
  private worldDepth: number;
  private cellSize: number;
  
  // Soil type definitions
  private readonly SOIL_PROPERTIES = new Map<SoilType, Partial<SoilLayer>>([
    ['clay', {
      porosity: 0.45,
      permeability: 0.1,
      density: 1600,
      organicMatter: 0.03,
      compaction: 0.7,
      stability: 0.8,
    }],
    ['sand', {
      porosity: 0.35,
      permeability: 0.9,
      density: 1400,
      organicMatter: 0.01,
      compaction: 0.2,
      stability: 0.3,
    }],
    ['loam', {
      porosity: 0.50,
      permeability: 0.6,
      density: 1300,
      organicMatter: 0.05,
      compaction: 0.4,
      stability: 0.6,
    }],
    ['silt', {
      porosity: 0.48,
      permeability: 0.3,
      density: 1350,
      organicMatter: 0.04,
      compaction: 0.5,
      stability: 0.5,
    }],
    ['peat', {
      porosity: 0.80,
      permeability: 0.7,
      density: 800,
      organicMatter: 0.60,
      compaction: 0.1,
      stability: 0.2,
    }],
    ['rocky', {
      porosity: 0.10,
      permeability: 0.05,
      density: 2200,
      organicMatter: 0.001,
      compaction: 0.95,
      stability: 0.95,
    }],
  ]);

  constructor(worldWidth: number, worldHeight: number, worldDepth: number, cellSize: number = 0.5) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.worldDepth = worldDepth;
    this.cellSize = cellSize;
    
    this.initializeSoilGrid();
  }

  private initializeSoilGrid(): void {
    const gridWidth = Math.ceil(this.worldWidth / this.cellSize);
    const gridHeight = Math.ceil(this.worldHeight / this.cellSize);
    const gridDepth = Math.ceil(this.worldDepth / this.cellSize);
    
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        for (let z = 0; z < gridDepth; z++) {
          const position = {
            x: x * this.cellSize,
            y: y * this.cellSize,
            z: z * this.cellSize,
          };
          
          const cell = this.createSoilCell(position);
          const key = this.getGridKey(position);
          this.soilGrid.set(key, cell);
        }
      }
    }
  }

  private createSoilCell(position: Vector3D): SoilCell {
    const depth = position.z;
    const layers = this.generateSoilLayers(depth);
    
    return {
      position,
      layers,
      chemistry: this.generateSoilChemistry(layers),
      moisture: this.generateMoistureProfile(layers),
      temperature: this.calculateSoilTemperature(depth),
      microorganisms: this.calculateMicrobialActivity(layers),
      rootDensity: this.calculateRootDensity(depth),
      excavated: false,
      excavationStrength: 0,
      tunnelStability: 1.0,
      lastUpdated: Date.now(),
    };
  }

  private generateSoilLayers(depth: number): SoilLayer[] {
    const layers: SoilLayer[] = [];
    
    // Generate realistic soil profile based on depth
    if (depth < 0.3) {
      // Topsoil - rich in organic matter
      layers.push(this.createLayer(0, 0.3, 'loam', { organicMatter: 0.08 }));
    } else if (depth < 0.6) {
      // Subsoil - less organic matter, more clay
      layers.push(this.createLayer(0.3, 0.3, 'clay', { organicMatter: 0.03 }));
    } else if (depth < 1.5) {
      // Substratum - mixed composition
      const soilTypes: SoilType[] = ['clay', 'silt', 'sand'];
      const randomType = soilTypes[Math.floor(Math.random() * soilTypes.length)];
      layers.push(this.createLayer(0.6, 0.9, randomType, { organicMatter: 0.01 }));
    } else {
      // Bedrock or very dense material
      layers.push(this.createLayer(1.5, 2.0, 'rocky', { organicMatter: 0.001 }));
    }
    
    return layers;
  }

  private createLayer(
    depth: number,
    thickness: number,
    soilType: SoilType,
    overrides: Partial<SoilLayer> = {}
  ): SoilLayer {
    const baseProperties = this.SOIL_PROPERTIES.get(soilType) || {};
    
    return {
      depth,
      thickness,
      soilType,
      porosity: baseProperties.porosity || 0.4,
      permeability: baseProperties.permeability || 0.5,
      density: baseProperties.density || 1400,
      organicMatter: baseProperties.organicMatter || 0.02,
      compaction: baseProperties.compaction || 0.3,
      stability: baseProperties.stability || 0.5,
      temperature: 15 + Math.random() * 5, // Base soil temperature
      ...overrides,
    };
  }

  private generateSoilChemistry(layers: SoilLayer[]): SoilChemistry {
    // Average chemistry from all layers
    const avgOrganicMatter = layers.reduce((sum, layer) => sum + layer.organicMatter, 0) / layers.length;
    
    return {
      pH: 6.0 + Math.random() * 2, // Slightly acidic to neutral
      nitrogen: 20 + avgOrganicMatter * 100 + Math.random() * 30,
      phosphorus: 15 + Math.random() * 25,
      potassium: 80 + Math.random() * 60,
      calcium: 200 + Math.random() * 400,
      magnesium: 50 + Math.random() * 100,
      sulfur: 10 + Math.random() * 20,
      ironOxide: 30 + Math.random() * 70,
      organicCarbon: avgOrganicMatter * 580, // Standard conversion
      salinity: Math.random() * 2, // Low salinity
    };
  }

  private generateMoistureProfile(layers: SoilLayer[]): MoistureProfile {
    const avgPorosity = layers.reduce((sum, layer) => sum + layer.porosity, 0) / layers.length;
    const avgPermeability = layers.reduce((sum, layer) => sum + layer.permeability, 0) / layers.length;
    
    const fieldCapacity = avgPorosity * 0.7; // Approximate field capacity
    const wiltingPoint = fieldCapacity * 0.3;
    
    return {
      saturation: wiltingPoint + Math.random() * (fieldCapacity - wiltingPoint),
      fieldCapacity,
      wiltingPoint,
      hydraulicConductivity: avgPermeability,
      capillaryAction: (1 - avgPermeability) * 0.5, // Inverse relationship
    };
  }

  private calculateSoilTemperature(depth: number): number {
    const surfaceTemp = 20; // Assumed surface temperature
    const tempGradient = 25; // Geothermal gradient (°C per km)
    
    // Temperature increases with depth due to geothermal gradient
    return surfaceTemp + (depth * tempGradient / 1000);
  }

  private calculateMicrobialActivity(layers: SoilLayer[]): number {
    const avgOrganicMatter = layers.reduce((sum, layer) => sum + layer.organicMatter, 0) / layers.length;
    const avgPorosity = layers.reduce((sum, layer) => sum + layer.porosity, 0) / layers.length;
    
    // Higher organic matter and porosity support more microbial life
    return (avgOrganicMatter * 5 + avgPorosity) * 0.5;
  }

  private calculateRootDensity(depth: number): number {
    // Root density decreases exponentially with depth
    return Math.exp(-depth * 2) * 0.8;
  }

  /**
   * Update soil system (moisture, temperature, chemistry)
   */
  public update(deltaTime: number, weather: any): void {
    const currentTime = Date.now();
    
    for (const [key, cell] of this.soilGrid) {
      this.updateSoilCell(cell, deltaTime, weather, currentTime);
    }
  }

  private updateSoilCell(cell: SoilCell, deltaTime: number, weather: any, currentTime: number): void {
    // Update moisture based on precipitation and evaporation
    this.updateMoisture(cell, weather, deltaTime);
    
    // Update temperature based on surface conditions and depth
    this.updateTemperature(cell, weather, deltaTime);
    
    // Update chemistry through biological and chemical processes
    this.updateChemistry(cell, deltaTime);
    
    // Update microbial activity
    this.updateMicrobialActivity(cell, deltaTime);
    
    // Update tunnel stability if excavated
    if (cell.excavated) {
      this.updateTunnelStability(cell, deltaTime, weather);
    }
    
    cell.lastUpdated = currentTime;
  }

  private updateMoisture(cell: SoilCell, weather: any, deltaTime: number): void {
    const moisture = cell.moisture;
    const surfaceDepth = cell.position.z;
    
    // Surface receives precipitation
    if (surfaceDepth < 0.1 && weather.precipitation > 0) {
      const infiltration = weather.precipitation * 0.001 * deltaTime; // Convert mm/hr to saturation
      moisture.saturation = Math.min(moisture.fieldCapacity, 
        moisture.saturation + infiltration);
    }
    
    // Evaporation from surface
    if (surfaceDepth < 0.1) {
      const evaporation = 0.001 * weather.temperature * (1 - weather.humidity) * deltaTime;
      moisture.saturation = Math.max(moisture.wiltingPoint, 
        moisture.saturation - evaporation);
    }
    
    // Drainage based on hydraulic conductivity
    if (moisture.saturation > moisture.fieldCapacity) {
      const drainage = (moisture.saturation - moisture.fieldCapacity) * 
                      moisture.hydraulicConductivity * deltaTime * 0.1;
      moisture.saturation -= drainage;
    }
    
    // Capillary action from deeper layers
    if (moisture.saturation < moisture.fieldCapacity * 0.8) {
      const capillaryRise = moisture.capillaryAction * deltaTime * 0.05;
      moisture.saturation = Math.min(moisture.fieldCapacity, 
        moisture.saturation + capillaryRise);
    }
  }

  private updateTemperature(cell: SoilCell, weather: any, deltaTime: number): void {
    const surfaceTemp = weather.temperature || 20;
    const depth = cell.position.z;
    
    // Calculate target temperature based on surface and geothermal
    const geothermalTemp = this.calculateSoilTemperature(depth);
    const surfaceInfluence = Math.exp(-depth * 2); // Surface influence decreases with depth
    const targetTemp = geothermalTemp * (1 - surfaceInfluence) + surfaceTemp * surfaceInfluence;
    
    // Temperature changes gradually
    const tempChange = (targetTemp - cell.temperature) * 0.01 * deltaTime;
    cell.temperature += tempChange;
  }

  private updateChemistry(cell: SoilCell, deltaTime: number): void {
    const chemistry = cell.chemistry;
    
    // Microbial processes affect chemistry
    const microbialRate = cell.microorganisms * deltaTime * 0.001;
    
    // Decomposition increases nutrients
    chemistry.nitrogen += microbialRate * 0.5;
    chemistry.phosphorus += microbialRate * 0.2;
    chemistry.organicCarbon -= microbialRate * 0.3; // Carbon consumed
    
    // Leaching removes nutrients
    const leachingRate = cell.moisture.saturation * deltaTime * 0.0001;
    chemistry.nitrogen *= (1 - leachingRate);
    chemistry.potassium *= (1 - leachingRate * 0.5);
    
    // pH buffering
    const targetPH = 6.5 + chemistry.calcium * 0.001;
    chemistry.pH += (targetPH - chemistry.pH) * 0.001 * deltaTime;
  }

  private updateMicrobialActivity(cell: SoilCell, deltaTime: number): void {
    const optimalTemp = 25;
    const optimalMoisture = cell.moisture.fieldCapacity * 0.6;
    const optimalPH = 7.0;
    
    // Calculate environmental factors
    const tempFactor = 1 - Math.abs(cell.temperature - optimalTemp) / 20;
    const moistureFactor = 1 - Math.abs(cell.moisture.saturation - optimalMoisture) / optimalMoisture;
    const pHFactor = 1 - Math.abs(cell.chemistry.pH - optimalPH) / 3;
    
    const environmentalFactor = (tempFactor + moistureFactor + pHFactor) / 3;
    const organicMatterFactor = cell.layers[0]?.organicMatter || 0.01;
    
    // Update microbial activity
    const targetActivity = environmentalFactor * organicMatterFactor * 2;
    cell.microorganisms += (targetActivity - cell.microorganisms) * 0.01 * deltaTime;
    cell.microorganisms = Math.max(0, Math.min(1, cell.microorganisms));
  }

  private updateTunnelStability(cell: SoilCell, deltaTime: number, weather: any): void {
    let stability = cell.tunnelStability;
    
    // Water weakens tunnels
    const moistureEffect = cell.moisture.saturation * 0.1 * deltaTime;
    stability -= moistureEffect;
    
    // Soil type affects stability
    const baseStability = cell.layers[0]?.stability || 0.5;
    stability += (baseStability - stability) * 0.001 * deltaTime;
    
    // Vibrations and weather can cause instability
    if (weather.windSpeed > 15) {
      stability -= 0.01 * deltaTime;
    }
    
    cell.tunnelStability = Math.max(0, Math.min(1, stability));
    
    // Collapse if stability is too low
    if (cell.tunnelStability < 0.1) {
      this.collapseTunnel(cell);
    }
  }

  /**
   * Attempt to dig at a position
   */
  public dig(position: Vector3D, force: number): {
    success: boolean;
    difficulty: number;
    materialRemoved: number;
    stability: number;
  } {
    const cell = this.getSoilAt(position);
    if (!cell) {
      return { success: false, difficulty: 1, materialRemoved: 0, stability: 0 };
    }
    
    const properties = this.calculateSoilProperties(cell);
    const requiredForce = properties.diggingDifficulty;
    
    if (force >= requiredForce) {
      cell.excavated = true;
      cell.excavationStrength = Math.min(1, cell.excavationStrength + force * 0.1);
      
      // Calculate material removed
      const efficiency = Math.min(1, force / requiredForce);
      const materialRemoved = efficiency * 0.1;
      
      // Update tunnel stability
      const avgStability = cell.layers.reduce((sum, layer) => sum + layer.stability, 0) / cell.layers.length;
      cell.tunnelStability = avgStability * (1 - cell.excavationStrength * 0.5);
      
      return {
        success: true,
        difficulty: properties.diggingDifficulty,
        materialRemoved,
        stability: cell.tunnelStability,
      };
    }
    
    return {
      success: false,
      difficulty: properties.diggingDifficulty,
      materialRemoved: 0,
      stability: cell.tunnelStability,
    };
  }

  /**
   * Calculate soil properties for a cell
   */
  public calculateSoilProperties(cell: SoilCell): SoilProperties {
    const layers = cell.layers;
    const moisture = cell.moisture;
    const chemistry = cell.chemistry;
    
    // Average properties from all layers
    const avgCompaction = layers.reduce((sum, layer) => sum + layer.compaction, 0) / layers.length;
    const avgStability = layers.reduce((sum, layer) => sum + layer.stability, 0) / layers.length;
    const avgPermeability = layers.reduce((sum, layer) => sum + layer.permeability, 0) / layers.length;
    const avgPorosity = layers.reduce((sum, layer) => sum + layer.porosity, 0) / layers.length;
    
    // Moisture affects digging difficulty
    const moistureEffect = moisture.saturation > moisture.fieldCapacity * 0.8 ? 1.5 : 1.0;
    
    return {
      diggingDifficulty: avgCompaction * moistureEffect,
      caveInRisk: (1 - avgStability) * (moisture.saturation / moisture.fieldCapacity),
      supportRequired: Math.max(0, avgCompaction - avgStability),
      drainageRate: avgPermeability,
      waterRetention: avgPorosity,
      capillaryRise: moisture.capillaryAction,
      nutrientAvailability: (chemistry.nitrogen + chemistry.phosphorus + chemistry.potassium) / 300,
      toxicity: Math.max(0, chemistry.salinity - 2) / 10,
      buffering: chemistry.calcium / 1000,
    };
  }

  /**
   * Get soil cell at position
   */
  public getSoilAt(position: Vector3D): SoilCell | null {
    const key = this.getGridKey(position);
    return this.soilGrid.get(key) || null;
  }

  /**
   * Check if position can support tunnels
   */
  public canSupportTunnel(position: Vector3D): boolean {
    const cell = this.getSoilAt(position);
    if (!cell) return false;
    
    const properties = this.calculateSoilProperties(cell);
    return properties.caveInRisk < 0.7 && cell.tunnelStability > 0.3;
  }

  /**
   * Get soil composition in an area
   */
  public getSoilComposition(center: Vector3D, radius: number): Map<SoilType, number> {
    const composition = new Map<SoilType, number>();
    const radiusSquared = radius * radius;
    
    for (const [key, cell] of this.soilGrid) {
      const distance = this.calculateDistance(center, cell.position);
      
      if (distance <= radius) {
        for (const layer of cell.layers) {
          const current = composition.get(layer.soilType) || 0;
          composition.set(layer.soilType, current + layer.thickness);
        }
      }
    }
    
    return composition;
  }

  /**
   * Collapse tunnel at position
   */
  private collapseTunnel(cell: SoilCell): void {
    cell.excavated = false;
    cell.excavationStrength = 0;
    cell.tunnelStability = 1.0;
    
    // Increase compaction due to collapse
    cell.layers.forEach(layer => {
      layer.compaction = Math.min(1, layer.compaction + 0.1);
    });
  }

  /**
   * Apply erosion effects
   */
  public applyErosion(position: Vector3D, intensity: number): void {
    const cell = this.getSoilAt(position);
    if (!cell || cell.position.z > 0.1) return; // Only surface erosion
    
    // Remove organic matter and fine particles
    cell.layers.forEach(layer => {
      layer.organicMatter *= (1 - intensity * 0.1);
      if (layer.soilType === 'silt' || layer.soilType === 'clay') {
        layer.thickness *= (1 - intensity * 0.05);
      }
    });
    
    // Update chemistry
    cell.chemistry.nitrogen *= (1 - intensity * 0.2);
    cell.chemistry.organicCarbon *= (1 - intensity * 0.15);
  }

  /**
   * Add organic matter (from decomposition)
   */
  public addOrganicMatter(position: Vector3D, amount: number): void {
    const cell = this.getSoilAt(position);
    if (!cell) return;
    
    // Add to surface layer
    if (cell.layers.length > 0) {
      cell.layers[0].organicMatter = Math.min(1, cell.layers[0].organicMatter + amount);
    }
    
    // Increase nutrients
    cell.chemistry.nitrogen += amount * 50;
    cell.chemistry.phosphorus += amount * 20;
    cell.chemistry.organicCarbon += amount * 580;
  }

  // Utility methods
  private getGridKey(position: Vector3D): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  private calculateDistance(pos1: Vector3D, pos2: Vector3D): number {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
  }

  /**
   * Get soil system statistics
   */
  public getStats(): {
    totalCells: number;
    excavatedCells: number;
    averageStability: number;
    soilTypeDistribution: Map<SoilType, number>;
  } {
    let excavatedCount = 0;
    let totalStability = 0;
    const soilDistribution = new Map<SoilType, number>();
    
    for (const [_, cell] of this.soilGrid) {
      if (cell.excavated) excavatedCount++;
      totalStability += cell.tunnelStability;
      
      for (const layer of cell.layers) {
        const current = soilDistribution.get(layer.soilType) || 0;
        soilDistribution.set(layer.soilType, current + 1);
      }
    }
    
    return {
      totalCells: this.soilGrid.size,
      excavatedCells: excavatedCount,
      averageStability: totalStability / this.soilGrid.size,
      soilTypeDistribution: soilDistribution,
    };
  }
}