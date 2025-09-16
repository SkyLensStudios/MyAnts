/**
 * Fluid Dynamics System
 * Realistic fluid simulation for water flow, air currents, and chemical diffusion
 */

import { Vector3 } from './collision';

export interface FluidProperties {
  density: number;        // kg/m³
  viscosity: number;      // Dynamic viscosity (Pa·s)
  temperature: number;    // Kelvin
  pressure: number;       // Pascals
  velocity: Vector3;      // m/s
  turbulence: number;     // 0-1 turbulence factor
}

export interface FluidCell {
  position: Vector3;
  properties: FluidProperties;
  neighbors: FluidCell[];
  isObstacle: boolean;
  isBoundary: boolean;
}

export interface FluidGrid {
  cells: FluidCell[][][];
  dimensions: Vector3;
  cellSize: number;
  bounds: {
    min: Vector3;
    max: Vector3;
  };
}

export interface FluidForce {
  type: 'wind' | 'gravity' | 'pressure' | 'viscous' | 'buoyancy';
  vector: Vector3;
  magnitude: number;
  radius?: number;
  position?: Vector3;
}

/**
 * Lattice Boltzmann Method (LBM) fluid solver
 * Optimized for real-time simulation with ant-scale accuracy
 */
export class LatticeFluidSolver {
  private grid: FluidGrid;
  private distributionFunctions: number[][][][] = []; // f[x][y][z][direction]
  private equilibriumFunctions: number[][][][] = [];
  private tempDistributions: number[][][][] = [];
  private readonly D3Q19_WEIGHTS = [
    1/3,   // Rest particle
    1/18, 1/18, 1/18, 1/18, 1/18, 1/18, // Face neighbors
    1/36, 1/36, 1/36, 1/36, 1/36, 1/36, 1/36, 1/36, 1/36, 1/36, 1/36, 1/36 // Edge neighbors
  ];
  private readonly D3Q19_VELOCITIES = [
    [0, 0, 0],   // Rest
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], // Faces
    [1, 1, 0], [-1, -1, 0], [1, -1, 0], [-1, 1, 0], // XY edges
    [1, 0, 1], [-1, 0, -1], [1, 0, -1], [-1, 0, 1], // XZ edges
    [0, 1, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1]  // YZ edges
  ];

  constructor(dimensions: Vector3, cellSize: number, bounds: { min: Vector3; max: Vector3 }) {
    this.grid = this.initializeGrid(dimensions, cellSize, bounds);
    this.initializeDistributions();
  }

  private initializeGrid(dimensions: Vector3, cellSize: number, bounds: { min: Vector3; max: Vector3 }): FluidGrid {
    const cells: FluidCell[][][] = [];
    
    for (let x = 0; x < dimensions.x; x++) {
      cells[x] = [];
      for (let y = 0; y < dimensions.y; y++) {
        cells[x][y] = [];
        for (let z = 0; z < dimensions.z; z++) {
          const position: Vector3 = {
            x: bounds.min.x + (x + 0.5) * cellSize,
            y: bounds.min.y + (y + 0.5) * cellSize,
            z: bounds.min.z + (z + 0.5) * cellSize
          };

          const cell: FluidCell = {
            position,
            properties: {
              density: 1.225,      // Air density at sea level (kg/m³)
              viscosity: 1.81e-5,  // Air viscosity at 20°C (Pa·s)
              temperature: 293.15, // 20°C in Kelvin
              pressure: 101325,    // Standard atmospheric pressure (Pa)
              velocity: { x: 0, y: 0, z: 0 },
              turbulence: 0
            },
            neighbors: [],
            isObstacle: false,
            isBoundary: this.isBoundaryCell(x, y, z, dimensions)
          };

          cells[x][y][z] = cell;
        }
      }
    }

    // Set up neighbor relationships
    this.setupNeighbors(cells, dimensions);

    return {
      cells,
      dimensions,
      cellSize,
      bounds
    };
  }

  private isBoundaryCell(x: number, y: number, z: number, dimensions: Vector3): boolean {
    return x === 0 || x === dimensions.x - 1 ||
           y === 0 || y === dimensions.y - 1 ||
           z === 0 || z === dimensions.z - 1;
  }

  private setupNeighbors(cells: FluidCell[][][], dimensions: Vector3): void {
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          const cell = cells[x][y][z];
          
          // Add 26 neighbors (3x3x3 - 1)
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                const nz = z + dz;
                
                if (nx >= 0 && nx < dimensions.x &&
                    ny >= 0 && ny < dimensions.y &&
                    nz >= 0 && nz < dimensions.z) {
                  cell.neighbors.push(cells[nx][ny][nz]);
                }
              }
            }
          }
        }
      }
    }
  }

  private initializeDistributions(): void {
    const { dimensions } = this.grid;
    
    this.distributionFunctions = [];
    this.equilibriumFunctions = [];
    this.tempDistributions = [];
    
    for (let x = 0; x < dimensions.x; x++) {
      this.distributionFunctions[x] = [];
      this.equilibriumFunctions[x] = [];
      this.tempDistributions[x] = [];
      
      for (let y = 0; y < dimensions.y; y++) {
        this.distributionFunctions[x][y] = [];
        this.equilibriumFunctions[x][y] = [];
        this.tempDistributions[x][y] = [];
        
        for (let z = 0; z < dimensions.z; z++) {
          this.distributionFunctions[x][y][z] = new Array(19).fill(0);
          this.equilibriumFunctions[x][y][z] = new Array(19).fill(0);
          this.tempDistributions[x][y][z] = new Array(19).fill(0);
          
          // Initialize with equilibrium distribution
          const cell = this.grid.cells[x][y][z];
          this.calculateEquilibrium(x, y, z, cell.properties);
          
          for (let i = 0; i < 19; i++) {
            this.distributionFunctions[x][y][z][i] = this.equilibriumFunctions[x][y][z][i];
          }
        }
      }
    }
  }

  private calculateEquilibrium(x: number, y: number, z: number, properties: FluidProperties): void {
    const { density, velocity } = properties;
    const u = velocity;
    const usqr = u.x * u.x + u.y * u.y + u.z * u.z;
    
    for (let i = 0; i < 19; i++) {
      const ei = this.D3Q19_VELOCITIES[i];
      const eidotu = ei[0] * u.x + ei[1] * u.y + ei[2] * u.z;
      
      this.equilibriumFunctions[x][y][z][i] = this.D3Q19_WEIGHTS[i] * density * (
        1.0 + 3.0 * eidotu + 4.5 * eidotu * eidotu - 1.5 * usqr
      );
    }
  }

  public step(deltaTime: number, forces: FluidForce[] = []): void {
    this.collisionStep(deltaTime, forces);
    this.streamingStep();
    this.boundaryConditions();
    this.updateFluidProperties();
  }

  private collisionStep(deltaTime: number, forces: FluidForce[]): void {
    const { dimensions } = this.grid;
    const relaxationTime = 0.8; // Affects viscosity
    
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          const cell = this.grid.cells[x][y][z];
          if (cell.isObstacle) continue;
          
          // Apply external forces
          this.applyForces(cell, forces, deltaTime);
          
          // Calculate equilibrium
          this.calculateEquilibrium(x, y, z, cell.properties);
          
          // BGK collision operator
          for (let i = 0; i < 19; i++) {
            this.distributionFunctions[x][y][z][i] = 
              this.distributionFunctions[x][y][z][i] - 
              (1.0 / relaxationTime) * (
                this.distributionFunctions[x][y][z][i] - 
                this.equilibriumFunctions[x][y][z][i]
              );
          }
        }
      }
    }
  }

  private streamingStep(): void {
    const { dimensions } = this.grid;
    
    // Copy current distributions to temp array
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          for (let i = 0; i < 19; i++) {
            this.tempDistributions[x][y][z][i] = this.distributionFunctions[x][y][z][i];
          }
        }
      }
    }
    
    // Stream particles to neighbors
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          for (let i = 1; i < 19; i++) { // Skip rest particle (i=0)
            const ei = this.D3Q19_VELOCITIES[i];
            const nx = x + ei[0];
            const ny = y + ei[1];
            const nz = z + ei[2];
            
            if (nx >= 0 && nx < dimensions.x &&
                ny >= 0 && ny < dimensions.y &&
                nz >= 0 && nz < dimensions.z &&
                !this.grid.cells[nx][ny][nz].isObstacle) {
              
              this.distributionFunctions[nx][ny][nz][i] = this.tempDistributions[x][y][z][i];
            }
          }
        }
      }
    }
  }

  private boundaryConditions(): void {
    const { dimensions } = this.grid;
    
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          const cell = this.grid.cells[x][y][z];
          
          if (cell.isBoundary || cell.isObstacle) {
            this.applyBounceBackBoundary(x, y, z);
          }
        }
      }
    }
  }

  private applyBounceBackBoundary(x: number, y: number, z: number): void {
    // Bounce-back boundary condition for no-slip walls
    const oppositeDirections = [0, 2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16, 15, 18, 17];
    
    for (let i = 1; i < 19; i++) {
      const opposite = oppositeDirections[i];
      const temp = this.distributionFunctions[x][y][z][i];
      this.distributionFunctions[x][y][z][i] = this.distributionFunctions[x][y][z][opposite];
      this.distributionFunctions[x][y][z][opposite] = temp;
    }
  }

  private updateFluidProperties(): void {
    const { dimensions } = this.grid;
    
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          const cell = this.grid.cells[x][y][z];
          if (cell.isObstacle) continue;
          
          // Calculate macroscopic quantities
          let density = 0;
          let momentumX = 0;
          let momentumY = 0;
          let momentumZ = 0;
          
          for (let i = 0; i < 19; i++) {
            const f = this.distributionFunctions[x][y][z][i];
            const ei = this.D3Q19_VELOCITIES[i];
            
            density += f;
            momentumX += f * ei[0];
            momentumY += f * ei[1];
            momentumZ += f * ei[2];
          }
          
          cell.properties.density = density;
          if (density > 0) {
            cell.properties.velocity = {
              x: momentumX / density,
              y: momentumY / density,
              z: momentumZ / density
            };
          }
          
          // Update turbulence based on velocity gradients
          this.updateTurbulence(cell, x, y, z);
        }
      }
    }
  }

  private updateTurbulence(cell: FluidCell, x: number, y: number, z: number): void {
    let velocityGradientMagnitude = 0;
    const neighborCount = cell.neighbors.length;
    
    if (neighborCount > 0) {
      for (const neighbor of cell.neighbors) {
        const velocityDiff = {
          x: neighbor.properties.velocity.x - cell.properties.velocity.x,
          y: neighbor.properties.velocity.y - cell.properties.velocity.y,
          z: neighbor.properties.velocity.z - cell.properties.velocity.z
        };
        
        velocityGradientMagnitude += Math.sqrt(
          velocityDiff.x * velocityDiff.x +
          velocityDiff.y * velocityDiff.y +
          velocityDiff.z * velocityDiff.z
        );
      }
      
      velocityGradientMagnitude /= neighborCount;
      cell.properties.turbulence = Math.min(1.0, velocityGradientMagnitude * 100);
    }
  }

  private applyForces(cell: FluidCell, forces: FluidForce[], deltaTime: number): void {
    for (const force of forces) {
      let forceVector = { x: 0, y: 0, z: 0 };
      
      switch (force.type) {
        case 'gravity':
          forceVector = {
            x: force.vector.x * cell.properties.density,
            y: force.vector.y * cell.properties.density,
            z: force.vector.z * cell.properties.density
          };
          break;
          
        case 'wind':
          const windStrength = this.calculateWindEffect(cell, force);
          forceVector = {
            x: force.vector.x * windStrength,
            y: force.vector.y * windStrength,
            z: force.vector.z * windStrength
          };
          break;
          
        case 'pressure':
          if (force.position) {
            const distance = this.vectorDistance(cell.position, force.position);
            if (force.radius && distance < force.radius) {
              const pressureGradient = force.magnitude * (1 - distance / force.radius);
              const direction = this.vectorNormalize(
                this.vectorSubtract(cell.position, force.position)
              );
              forceVector = this.vectorScale(direction, pressureGradient);
            }
          }
          break;
      }
      
      // Apply force to velocity
      const acceleration = {
        x: forceVector.x / cell.properties.density,
        y: forceVector.y / cell.properties.density,
        z: forceVector.z / cell.properties.density
      };
      
      cell.properties.velocity = {
        x: cell.properties.velocity.x + acceleration.x * deltaTime,
        y: cell.properties.velocity.y + acceleration.y * deltaTime,
        z: cell.properties.velocity.z + acceleration.z * deltaTime
      };
    }
  }

  private calculateWindEffect(cell: FluidCell, force: FluidForce): number {
    // Wind effect diminishes with turbulence and viscosity
    const turbulenceEffect = 1.0 - cell.properties.turbulence * 0.3;
    const viscosityEffect = Math.exp(-cell.properties.viscosity * 1000);
    return force.magnitude * turbulenceEffect * viscosityEffect;
  }

  public setObstacle(x: number, y: number, z: number, isObstacle: boolean): void {
    if (x >= 0 && x < this.grid.dimensions.x &&
        y >= 0 && y < this.grid.dimensions.y &&
        z >= 0 && z < this.grid.dimensions.z) {
      this.grid.cells[x][y][z].isObstacle = isObstacle;
    }
  }

  public getVelocityField(): Vector3[][][] {
    const { dimensions } = this.grid;
    const velocityField: Vector3[][][] = [];
    
    for (let x = 0; x < dimensions.x; x++) {
      velocityField[x] = [];
      for (let y = 0; y < dimensions.y; y++) {
        velocityField[x][y] = [];
        for (let z = 0; z < dimensions.z; z++) {
          velocityField[x][y][z] = { ...this.grid.cells[x][y][z].properties.velocity };
        }
      }
    }
    
    return velocityField;
  }

  public getPressureField(): number[][][] {
    const { dimensions } = this.grid;
    const pressureField: number[][][] = [];
    
    for (let x = 0; x < dimensions.x; x++) {
      pressureField[x] = [];
      for (let y = 0; y < dimensions.y; y++) {
        pressureField[x][y] = [];
        for (let z = 0; z < dimensions.z; z++) {
          pressureField[x][y][z] = this.grid.cells[x][y][z].properties.pressure;
        }
      }
    }
    
    return pressureField;
  }

  public getFluidPropertiesAt(position: Vector3): FluidProperties | null {
    const gridPos = this.worldToGrid(position);
    
    if (gridPos.x >= 0 && gridPos.x < this.grid.dimensions.x &&
        gridPos.y >= 0 && gridPos.y < this.grid.dimensions.y &&
        gridPos.z >= 0 && gridPos.z < this.grid.dimensions.z) {
      return { ...this.grid.cells[gridPos.x][gridPos.y][gridPos.z].properties };
    }
    
    return null;
  }

  private worldToGrid(position: Vector3): Vector3 {
    const { bounds, cellSize } = this.grid;
    return {
      x: Math.floor((position.x - bounds.min.x) / cellSize),
      y: Math.floor((position.y - bounds.min.y) / cellSize),
      z: Math.floor((position.z - bounds.min.z) / cellSize)
    };
  }

  // Vector utility methods
  private vectorSubtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private vectorScale(v: Vector3, scale: number): Vector3 {
    return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
  }

  private vectorDistance(a: Vector3, b: Vector3): number {
    const diff = this.vectorSubtract(a, b);
    return Math.sqrt(diff.x * diff.x + diff.y * diff.y + diff.z * diff.z);
  }

  private vectorNormalize(v: Vector3): Vector3 {
    const magnitude = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (magnitude === 0) return { x: 0, y: 0, z: 0 };
    return this.vectorScale(v, 1 / magnitude);
  }
}

/**
 * Simplified fluid dynamics for performance-critical scenarios
 */
export class SimpleFluidSolver {
  private grid: FluidGrid;
  private viscosity: number;
  private timeStep: number;

  constructor(dimensions: Vector3, cellSize: number, bounds: { min: Vector3; max: Vector3 }) {
    this.grid = this.initializeSimpleGrid(dimensions, cellSize, bounds);
    this.viscosity = 0.1;
    this.timeStep = 0.016; // 60 FPS
  }

  private initializeSimpleGrid(dimensions: Vector3, cellSize: number, bounds: { min: Vector3; max: Vector3 }): FluidGrid {
    const cells: FluidCell[][][] = [];
    
    for (let x = 0; x < dimensions.x; x++) {
      cells[x] = [];
      for (let y = 0; y < dimensions.y; y++) {
        cells[x][y] = [];
        for (let z = 0; z < dimensions.z; z++) {
          const position: Vector3 = {
            x: bounds.min.x + (x + 0.5) * cellSize,
            y: bounds.min.y + (y + 0.5) * cellSize,
            z: bounds.min.z + (z + 0.5) * cellSize
          };

          cells[x][y][z] = {
            position,
            properties: {
              density: 1.0,
              viscosity: this.viscosity,
              temperature: 293.15,
              pressure: 101325,
              velocity: { x: 0, y: 0, z: 0 },
              turbulence: 0
            },
            neighbors: [],
            isObstacle: false,
            isBoundary: false
          };
        }
      }
    }

    return { cells, dimensions, cellSize, bounds };
  }

  public addVelocitySource(position: Vector3, velocity: Vector3, radius: number): void {
    const { dimensions, cellSize, bounds } = this.grid;
    
    const centerX = Math.floor((position.x - bounds.min.x) / cellSize);
    const centerY = Math.floor((position.y - bounds.min.y) / cellSize);
    const centerZ = Math.floor((position.z - bounds.min.z) / cellSize);
    
    const radiusInCells = Math.ceil(radius / cellSize);
    
    for (let x = Math.max(0, centerX - radiusInCells); 
         x < Math.min(dimensions.x, centerX + radiusInCells + 1); x++) {
      for (let y = Math.max(0, centerY - radiusInCells); 
           y < Math.min(dimensions.y, centerY + radiusInCells + 1); y++) {
        for (let z = Math.max(0, centerZ - radiusInCells); 
             z < Math.min(dimensions.z, centerZ + radiusInCells + 1); z++) {
          
          const distance = Math.sqrt(
            Math.pow((x - centerX) * cellSize, 2) +
            Math.pow((y - centerY) * cellSize, 2) +
            Math.pow((z - centerZ) * cellSize, 2)
          );
          
          if (distance <= radius) {
            const strength = 1.0 - (distance / radius);
            const cell = this.grid.cells[x][y][z];
            cell.properties.velocity.x += velocity.x * strength;
            cell.properties.velocity.y += velocity.y * strength;
            cell.properties.velocity.z += velocity.z * strength;
          }
        }
      }
    }
  }

  public update(deltaTime: number): void {
    this.diffuseVelocity(deltaTime);
    this.advectVelocity(deltaTime);
    this.applyBoundaryConditions();
  }

  private diffuseVelocity(deltaTime: number): void {
    const { dimensions } = this.grid;
    const diffusionRate = this.viscosity * deltaTime;
    
    // Simple diffusion using neighboring cells
    for (let x = 1; x < dimensions.x - 1; x++) {
      for (let y = 1; y < dimensions.y - 1; y++) {
        for (let z = 1; z < dimensions.z - 1; z++) {
          const cell = this.grid.cells[x][y][z];
          
          if (!cell.isObstacle) {
            const avgVelocity = this.calculateAverageNeighborVelocity(x, y, z);
            
            cell.properties.velocity.x += (avgVelocity.x - cell.properties.velocity.x) * diffusionRate;
            cell.properties.velocity.y += (avgVelocity.y - cell.properties.velocity.y) * diffusionRate;
            cell.properties.velocity.z += (avgVelocity.z - cell.properties.velocity.z) * diffusionRate;
          }
        }
      }
    }
  }

  private calculateAverageNeighborVelocity(x: number, y: number, z: number): Vector3 {
    const neighbors = [
      this.grid.cells[x-1][y][z], this.grid.cells[x+1][y][z],
      this.grid.cells[x][y-1][z], this.grid.cells[x][y+1][z],
      this.grid.cells[x][y][z-1], this.grid.cells[x][y][z+1]
    ];
    
    let avgVel = { x: 0, y: 0, z: 0 };
    let count = 0;
    
    for (const neighbor of neighbors) {
      if (!neighbor.isObstacle) {
        avgVel.x += neighbor.properties.velocity.x;
        avgVel.y += neighbor.properties.velocity.y;
        avgVel.z += neighbor.properties.velocity.z;
        count++;
      }
    }
    
    if (count > 0) {
      avgVel.x /= count;
      avgVel.y /= count;
      avgVel.z /= count;
    }
    
    return avgVel;
  }

  private advectVelocity(deltaTime: number): void {
    // Semi-Lagrangian advection
    const { dimensions, cellSize } = this.grid;
    const newVelocities: Vector3[][][] = [];
    
    for (let x = 0; x < dimensions.x; x++) {
      newVelocities[x] = [];
      for (let y = 0; y < dimensions.y; y++) {
        newVelocities[x][y] = [];
        for (let z = 0; z < dimensions.z; z++) {
          newVelocities[x][y][z] = { x: 0, y: 0, z: 0 };
        }
      }
    }
    
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          const cell = this.grid.cells[x][y][z];
          
          if (!cell.isObstacle) {
            // Trace particle backward
            const vel = cell.properties.velocity;
            const prevX = x - vel.x * deltaTime / cellSize;
            const prevY = y - vel.y * deltaTime / cellSize;
            const prevZ = z - vel.z * deltaTime / cellSize;
            
            // Interpolate velocity from previous position
            newVelocities[x][y][z] = this.interpolateVelocity(prevX, prevY, prevZ);
          }
        }
      }
    }
    
    // Copy back
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          if (!this.grid.cells[x][y][z].isObstacle) {
            this.grid.cells[x][y][z].properties.velocity = newVelocities[x][y][z];
          }
        }
      }
    }
  }

  private interpolateVelocity(x: number, y: number, z: number): Vector3 {
    const { dimensions } = this.grid;
    
    // Clamp to grid bounds
    x = Math.max(0, Math.min(dimensions.x - 1, x));
    y = Math.max(0, Math.min(dimensions.y - 1, y));
    z = Math.max(0, Math.min(dimensions.z - 1, z));
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = Math.min(dimensions.x - 1, x0 + 1);
    const y1 = Math.min(dimensions.y - 1, y0 + 1);
    const z1 = Math.min(dimensions.z - 1, z0 + 1);
    
    const fx = x - x0;
    const fy = y - y0;
    const fz = z - z0;
    
    // Trilinear interpolation
    const v000 = this.grid.cells[x0][y0][z0].properties.velocity;
    const v001 = this.grid.cells[x0][y0][z1].properties.velocity;
    const v010 = this.grid.cells[x0][y1][z0].properties.velocity;
    const v011 = this.grid.cells[x0][y1][z1].properties.velocity;
    const v100 = this.grid.cells[x1][y0][z0].properties.velocity;
    const v101 = this.grid.cells[x1][y0][z1].properties.velocity;
    const v110 = this.grid.cells[x1][y1][z0].properties.velocity;
    const v111 = this.grid.cells[x1][y1][z1].properties.velocity;
    
    return {
      x: this.lerp3D(v000.x, v001.x, v010.x, v011.x, v100.x, v101.x, v110.x, v111.x, fx, fy, fz),
      y: this.lerp3D(v000.y, v001.y, v010.y, v011.y, v100.y, v101.y, v110.y, v111.y, fx, fy, fz),
      z: this.lerp3D(v000.z, v001.z, v010.z, v011.z, v100.z, v101.z, v110.z, v111.z, fx, fy, fz)
    };
  }

  private lerp3D(v000: number, v001: number, v010: number, v011: number,
                 v100: number, v101: number, v110: number, v111: number,
                 fx: number, fy: number, fz: number): number {
    const v00 = v000 * (1 - fz) + v001 * fz;
    const v01 = v010 * (1 - fz) + v011 * fz;
    const v10 = v100 * (1 - fz) + v101 * fz;
    const v11 = v110 * (1 - fz) + v111 * fz;
    
    const v0 = v00 * (1 - fy) + v01 * fy;
    const v1 = v10 * (1 - fy) + v11 * fy;
    
    return v0 * (1 - fx) + v1 * fx;
  }

  private applyBoundaryConditions(): void {
    const { dimensions } = this.grid;
    
    // Zero velocity at boundaries
    for (let x = 0; x < dimensions.x; x++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let z = 0; z < dimensions.z; z++) {
          const cell = this.grid.cells[x][y][z];
          
          if (x === 0 || x === dimensions.x - 1 ||
              y === 0 || y === dimensions.y - 1 ||
              z === 0 || z === dimensions.z - 1 ||
              cell.isObstacle) {
            cell.properties.velocity = { x: 0, y: 0, z: 0 };
          }
        }
      }
    }
  }

  public getGrid(): FluidGrid {
    return this.grid;
  }
}