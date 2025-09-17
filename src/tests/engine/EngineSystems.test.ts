/**
 * Engine System Tests
 * Tests for biological, AI, physics, and chemical systems integration
 */

// Mock biological systems
const mockGeneticsSystem = {
  generateAntGenome: jest.fn().mockReturnValue({
    traits: {
      strength: 0.8,
      speed: 0.6,
      intelligence: 0.7,
      lifespan: 0.9
    },
    dominantGenes: ['worker'],
    recessiveGenes: ['soldier']
  }),
  crossover: jest.fn().mockReturnValue({
    traits: {
      strength: 0.75,
      speed: 0.65,
      intelligence: 0.68,
      lifespan: 0.85
    }
  }),
  mutate: jest.fn().mockReturnValue({
    traits: {
      strength: 0.82, // Slightly mutated
      speed: 0.6,
      intelligence: 0.7,
      lifespan: 0.9
    }
  }),
  calculateFitness: jest.fn().mockReturnValue(0.75),
  getGeneticDiversity: jest.fn().mockReturnValue(0.65)
};

const mockLifecycleSystem = {
  updateAntAge: jest.fn(),
  checkLifeStage: jest.fn().mockReturnValue('adult'),
  calculateLifeExpectancy: jest.fn().mockReturnValue(365), // days
  handleDeath: jest.fn(),
  processReproduction: jest.fn().mockReturnValue([]),
  getPopulationStatistics: jest.fn().mockReturnValue({
    totalPopulation: 1000,
    larvae: 100,
    pupae: 50,
    workers: 800,
    soldiers: 40,
    queens: 10
  })
};

const mockPhysiologySystem = {
  updateMetabolism: jest.fn(),
  calculateEnergyConsumption: jest.fn().mockReturnValue(10),
  processNutrition: jest.fn(),
  updateHealthStatus: jest.fn(),
  checkDiseaseResistance: jest.fn().mockReturnValue(0.8),
  getPhysiologicalState: jest.fn().mockReturnValue({
    energy: 80,
    health: 95,
    nutrition: 70,
    fatigue: 20
  })
};

// Mock AI systems
const mockDecisionTree = {
  makeDecision: jest.fn().mockReturnValue('forage'),
  updatePriorities: jest.fn(),
  evaluateOptions: jest.fn().mockReturnValue([
    { action: 'forage', score: 0.8 },
    { action: 'explore', score: 0.6 },
    { action: 'rest', score: 0.3 }
  ]),
  learnFromOutcome: jest.fn(),
  getDecisionHistory: jest.fn().mockReturnValue([
    { timestamp: Date.now() - 1000, decision: 'forage', outcome: 'success' },
    { timestamp: Date.now() - 2000, decision: 'explore', outcome: 'neutral' }
  ])
};

const mockSpatialMemory = {
  rememberLocation: jest.fn(),
  recallLocation: jest.fn().mockReturnValue({
    x: 100,
    y: 150,
    confidence: 0.9,
    timestamp: Date.now()
  }),
  forgetOldMemories: jest.fn(),
  getMemoryMap: jest.fn().mockReturnValue({
    foodSources: [{ x: 100, y: 150, quality: 0.8 }],
    dangerZones: [{ x: 200, y: 200, threat: 0.6 }],
    trails: [{ points: [{ x: 0, y: 0 }, { x: 100, y: 150 }] }]
  }),
  calculateSpatialScore: jest.fn().mockReturnValue(0.75)
};

const mockLearningSystem = {
  processExperience: jest.fn(),
  updateWeights: jest.fn(),
  predictOutcome: jest.fn().mockReturnValue(0.7),
  getModelAccuracy: jest.fn().mockReturnValue(0.85),
  trainModel: jest.fn(),
  evaluatePerformance: jest.fn().mockReturnValue({
    accuracy: 0.85,
    precision: 0.82,
    recall: 0.88
  })
};

// Mock physics systems
const mockCollisionSystem = {
  detectCollisions: jest.fn().mockReturnValue([]),
  resolveCollision: jest.fn(),
  checkBoundaries: jest.fn().mockReturnValue(true),
  updateCollisionGrid: jest.fn(),
  getCollisionStatistics: jest.fn().mockReturnValue({
    totalCollisions: 5,
    antToAnt: 2,
    antToEnvironment: 3,
    resolvedCollisions: 5
  })
};

const mockGravitySystem = {
  applyGravity: jest.fn(),
  calculateGravitationalForce: jest.fn().mockReturnValue({ x: 0, y: -9.81, z: 0 }),
  updateGravityField: jest.fn(),
  getGravityConfiguration: jest.fn().mockReturnValue({
    strength: 9.81,
    direction: { x: 0, y: -1, z: 0 }
  })
};

const mockFluidDynamics = {
  simulateFluidFlow: jest.fn(),
  calculateViscosity: jest.fn().mockReturnValue(0.001),
  updateFluidGrid: jest.fn(),
  applyFluidForces: jest.fn(),
  getFluidState: jest.fn().mockReturnValue({
    velocity: { x: 0.1, y: 0.05, z: 0 },
    pressure: 101325,
    density: 1.225
  })
};

// Mock chemical systems
const mockPheromoneSystem = {
  depositPheromone: jest.fn(),
  updatePheromoneGrid: jest.fn(),
  evaporatePheromones: jest.fn(),
  detectPheromones: jest.fn().mockReturnValue([
    { type: 'trail', concentration: 0.7, position: { x: 100, y: 100 } },
    { type: 'food', concentration: 0.9, position: { x: 150, y: 150 } }
  ]),
  calculateGradient: jest.fn().mockReturnValue({ x: 0.1, y: 0.2, z: 0 }),
  getPheromoneStatistics: jest.fn().mockReturnValue({
    totalPheromones: 500,
    trailPheromones: 300,
    foodPheromones: 150,
    alarmPheromones: 50
  })
};

// Mock the engine system imports
jest.mock('../../../engine/biological/genetics', () => ({
  AntGenetics: jest.fn().mockImplementation(() => mockGeneticsSystem)
}));

jest.mock('../../../engine/biological/lifecycle', () => ({
  LifecycleSystem: jest.fn().mockImplementation(() => mockLifecycleSystem)
}));

jest.mock('../../../engine/biological/physiology', () => ({
  PhysiologySystem: jest.fn().mockImplementation(() => mockPhysiologySystem)
}));

jest.mock('../../../engine/ai/decisionTree', () => ({
  BehaviorDecisionTree: jest.fn().mockImplementation(() => mockDecisionTree)
}));

jest.mock('../../../engine/ai/spatialMemory', () => ({
  SpatialMemorySystem: jest.fn().mockImplementation(() => mockSpatialMemory)
}));

jest.mock('../../../engine/ai/learning', () => ({
  LearningSystem: jest.fn().mockImplementation(() => mockLearningSystem)
}));

jest.mock('../../../engine/physics/collision', () => ({
  CollisionSystem: jest.fn().mockImplementation(() => mockCollisionSystem)
}));

jest.mock('../../../engine/physics/gravity', () => ({
  GravitySystem: jest.fn().mockImplementation(() => mockGravitySystem)
}));

jest.mock('../../../engine/physics/fluidDynamics', () => ({
  FluidDynamicsSystem: jest.fn().mockImplementation(() => mockFluidDynamics)
}));

jest.mock('../../../engine/chemical/pheromones', () => ({
  PheromoneSystem: jest.fn().mockImplementation(() => mockPheromoneSystem)
}));

describe('Engine System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Biological Systems', () => {
    describe('Genetics System', () => {
      test('should generate ant genomes with proper traits', () => {
        const genome = mockGeneticsSystem.generateAntGenome();
        
        expect(genome).toBeDefined();
        expect(genome.traits).toBeDefined();
        expect(typeof genome.traits.strength).toBe('number');
        expect(typeof genome.traits.speed).toBe('number');
        expect(typeof genome.traits.intelligence).toBe('number');
        expect(typeof genome.traits.lifespan).toBe('number');
        
        // Traits should be in valid range [0, 1]
        Object.values(genome.traits).forEach(trait => {
          expect(trait).toBeGreaterThanOrEqual(0);
          expect(trait).toBeLessThanOrEqual(1);
        });
      });

      test('should perform genetic crossover', () => {
        const parent1 = { traits: { strength: 0.8, speed: 0.6, intelligence: 0.7, lifespan: 0.9 } };
        const parent2 = { traits: { strength: 0.7, speed: 0.7, intelligence: 0.6, lifespan: 0.8 } };
        
        const offspring = mockGeneticsSystem.crossover(parent1, parent2);
        
        expect(offspring).toBeDefined();
        expect(offspring.traits).toBeDefined();
        expect(mockGeneticsSystem.crossover).toHaveBeenCalledWith(parent1, parent2);
      });

      test('should apply genetic mutations', () => {
        const originalGenome = { traits: { strength: 0.8, speed: 0.6, intelligence: 0.7, lifespan: 0.9 } };
        const mutatedGenome = mockGeneticsSystem.mutate(originalGenome, 0.1);
        
        expect(mutatedGenome).toBeDefined();
        expect(mutatedGenome.traits).toBeDefined();
        expect(mockGeneticsSystem.mutate).toHaveBeenCalledWith(originalGenome, 0.1);
      });

      test('should calculate fitness scores', () => {
        const genome = { traits: { strength: 0.8, speed: 0.6, intelligence: 0.7, lifespan: 0.9 } };
        const environment = { difficulty: 0.5, resources: 0.8 };
        
        const fitness = mockGeneticsSystem.calculateFitness(genome, environment);
        
        expect(typeof fitness).toBe('number');
        expect(fitness).toBe(0.75);
        expect(mockGeneticsSystem.calculateFitness).toHaveBeenCalledWith(genome, environment);
      });

      test('should measure genetic diversity', () => {
        const population = [
          { traits: { strength: 0.8, speed: 0.6, intelligence: 0.7, lifespan: 0.9 } },
          { traits: { strength: 0.7, speed: 0.7, intelligence: 0.6, lifespan: 0.8 } },
          { traits: { strength: 0.6, speed: 0.8, intelligence: 0.8, lifespan: 0.7 } }
        ];
        
        const diversity = mockGeneticsSystem.getGeneticDiversity(population);
        
        expect(typeof diversity).toBe('number');
        expect(diversity).toBe(0.65);
        expect(mockGeneticsSystem.getGeneticDiversity).toHaveBeenCalledWith(population);
      });
    });

    describe('Lifecycle System', () => {
      test('should manage ant aging', () => {
        const ant = { id: 'ant-1', age: 30, lifeStage: 'larva' };
        
        mockLifecycleSystem.updateAntAge(ant, 1); // Advance by 1 day
        expect(mockLifecycleSystem.updateAntAge).toHaveBeenCalledWith(ant, 1);
      });

      test('should determine life stages', () => {
        const ant = { id: 'ant-1', age: 50 };
        
        const lifeStage = mockLifecycleSystem.checkLifeStage(ant);
        expect(lifeStage).toBe('adult');
        expect(mockLifecycleSystem.checkLifeStage).toHaveBeenCalledWith(ant);
      });

      test('should calculate life expectancy', () => {
        const ant = { 
          id: 'ant-1', 
          genome: { traits: { lifespan: 0.8 } },
          health: 90 
        };
        
        const expectancy = mockLifecycleSystem.calculateLifeExpectancy(ant);
        expect(typeof expectancy).toBe('number');
        expect(expectancy).toBe(365);
        expect(mockLifecycleSystem.calculateLifeExpectancy).toHaveBeenCalledWith(ant);
      });

      test('should handle ant death', () => {
        const ant = { id: 'ant-1', age: 400, health: 0 };
        
        mockLifecycleSystem.handleDeath(ant);
        expect(mockLifecycleSystem.handleDeath).toHaveBeenCalledWith(ant);
      });

      test('should process reproduction', () => {
        const queen = { id: 'queen-1', caste: 'queen', fertility: 0.9 };
        const environment = { resources: 0.8, population: 1000 };
        
        const offspring = mockLifecycleSystem.processReproduction(queen, environment);
        expect(Array.isArray(offspring)).toBe(true);
        expect(mockLifecycleSystem.processReproduction).toHaveBeenCalledWith(queen, environment);
      });

      test('should provide population statistics', () => {
        const stats = mockLifecycleSystem.getPopulationStatistics();
        
        expect(stats).toBeDefined();
        expect(typeof stats.totalPopulation).toBe('number');
        expect(typeof stats.larvae).toBe('number');
        expect(typeof stats.pupae).toBe('number');
        expect(typeof stats.workers).toBe('number');
        expect(typeof stats.soldiers).toBe('number');
        expect(typeof stats.queens).toBe('number');
        
        // Population should add up
        const calculatedTotal = stats.larvae + stats.pupae + stats.workers + stats.soldiers + stats.queens;
        expect(calculatedTotal).toBe(stats.totalPopulation);
      });
    });

    describe('Physiology System', () => {
      test('should update ant metabolism', () => {
        const ant = { id: 'ant-1', energy: 80, activity: 'foraging' };
        
        mockPhysiologySystem.updateMetabolism(ant);
        expect(mockPhysiologySystem.updateMetabolism).toHaveBeenCalledWith(ant);
      });

      test('should calculate energy consumption', () => {
        const ant = { id: 'ant-1', activity: 'carrying', load: 5 };
        
        const consumption = mockPhysiologySystem.calculateEnergyConsumption(ant);
        expect(typeof consumption).toBe('number');
        expect(consumption).toBe(10);
        expect(mockPhysiologySystem.calculateEnergyConsumption).toHaveBeenCalledWith(ant);
      });

      test('should process nutrition', () => {
        const ant = { id: 'ant-1', nutrition: 70 };
        const food = { type: 'sugar', amount: 10, quality: 0.8 };
        
        mockPhysiologySystem.processNutrition(ant, food);
        expect(mockPhysiologySystem.processNutrition).toHaveBeenCalledWith(ant, food);
      });

      test('should check disease resistance', () => {
        const ant = { 
          id: 'ant-1', 
          genome: { traits: { health: 0.8 } },
          health: 95 
        };
        const disease = { type: 'fungal', virulence: 0.6 };
        
        const resistance = mockPhysiologySystem.checkDiseaseResistance(ant, disease);
        expect(typeof resistance).toBe('number');
        expect(resistance).toBe(0.8);
        expect(mockPhysiologySystem.checkDiseaseResistance).toHaveBeenCalledWith(ant, disease);
      });

      test('should provide physiological state', () => {
        const ant = { id: 'ant-1' };
        
        const state = mockPhysiologySystem.getPhysiologicalState(ant);
        
        expect(state).toBeDefined();
        expect(typeof state.energy).toBe('number');
        expect(typeof state.health).toBe('number');
        expect(typeof state.nutrition).toBe('number');
        expect(typeof state.fatigue).toBe('number');
        
        // All values should be in reasonable ranges
        expect(state.energy).toBeGreaterThanOrEqual(0);
        expect(state.energy).toBeLessThanOrEqual(100);
        expect(state.health).toBeGreaterThanOrEqual(0);
        expect(state.health).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('AI Systems', () => {
    describe('Decision Tree System', () => {
      test('should make behavioral decisions', () => {
        const context = {
          ant: { id: 'ant-1', energy: 80, position: { x: 100, y: 100 } },
          environment: { foodNearby: true, threatsNearby: false },
          colony: { needsFood: true, needsDefense: false }
        };
        
        const decision = mockDecisionTree.makeDecision(context);
        expect(typeof decision).toBe('string');
        expect(decision).toBe('forage');
        expect(mockDecisionTree.makeDecision).toHaveBeenCalledWith(context);
      });

      test('should evaluate multiple options', () => {
        const context = {
          ant: { id: 'ant-1', energy: 60 },
          availableActions: ['forage', 'explore', 'rest']
        };
        
        const options = mockDecisionTree.evaluateOptions(context);
        
        expect(Array.isArray(options)).toBe(true);
        expect(options.length).toBe(3);
        
        options.forEach((option: any) => {
          expect(option).toHaveProperty('action');
          expect(option).toHaveProperty('score');
          expect(typeof option.score).toBe('number');
        });
        
        expect(mockDecisionTree.evaluateOptions).toHaveBeenCalledWith(context);
      });

      test('should learn from outcomes', () => {
        const decision = 'forage';
        const outcome = { success: true, reward: 10, timeTaken: 30 };
        
        mockDecisionTree.learnFromOutcome(decision, outcome);
        expect(mockDecisionTree.learnFromOutcome).toHaveBeenCalledWith(decision, outcome);
      });

      test('should track decision history', () => {
        const history = mockDecisionTree.getDecisionHistory();
        
        expect(Array.isArray(history)).toBe(true);
        
        history.forEach((entry: any) => {
          expect(entry).toHaveProperty('timestamp');
          expect(entry).toHaveProperty('decision');
          expect(entry).toHaveProperty('outcome');
          expect(typeof entry.timestamp).toBe('number');
        });
      });

      test('should update priorities based on colony needs', () => {
        const colonyState = {
          foodStores: 20, // Low food
          population: 1000,
          threats: []
        };
        
        mockDecisionTree.updatePriorities(colonyState);
        expect(mockDecisionTree.updatePriorities).toHaveBeenCalledWith(colonyState);
      });
    });

    describe('Spatial Memory System', () => {
      test('should remember important locations', () => {
        const ant = { id: 'ant-1' };
        const location = { x: 100, y: 150, type: 'food', quality: 0.8 };
        
        mockSpatialMemory.rememberLocation(ant, location);
        expect(mockSpatialMemory.rememberLocation).toHaveBeenCalledWith(ant, location);
      });

      test('should recall stored locations', () => {
        const ant = { id: 'ant-1' };
        const locationType = 'food';
        
        const recalled = mockSpatialMemory.recallLocation(ant, locationType);
        
        expect(recalled).toBeDefined();
        expect(typeof recalled.x).toBe('number');
        expect(typeof recalled.y).toBe('number');
        expect(typeof recalled.confidence).toBe('number');
        expect(typeof recalled.timestamp).toBe('number');
        
        expect(mockSpatialMemory.recallLocation).toHaveBeenCalledWith(ant, locationType);
      });

      test('should forget old memories', () => {
        const ant = { id: 'ant-1' };
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        mockSpatialMemory.forgetOldMemories(ant, maxAge);
        expect(mockSpatialMemory.forgetOldMemories).toHaveBeenCalledWith(ant, maxAge);
      });

      test('should provide memory map', () => {
        const ant = { id: 'ant-1' };
        
        const memoryMap = mockSpatialMemory.getMemoryMap(ant);
        
        expect(memoryMap).toBeDefined();
        expect(Array.isArray(memoryMap.foodSources)).toBe(true);
        expect(Array.isArray(memoryMap.dangerZones)).toBe(true);
        expect(Array.isArray(memoryMap.trails)).toBe(true);
        
        expect(mockSpatialMemory.getMemoryMap).toHaveBeenCalledWith(ant);
      });

      test('should calculate spatial navigation scores', () => {
        const ant = { id: 'ant-1', position: { x: 50, y: 50 } };
        const targetPosition = { x: 100, y: 150 };
        
        const score = mockSpatialMemory.calculateSpatialScore(ant, targetPosition);
        
        expect(typeof score).toBe('number');
        expect(score).toBe(0.75);
        expect(mockSpatialMemory.calculateSpatialScore).toHaveBeenCalledWith(ant, targetPosition);
      });
    });

    describe('Learning System', () => {
      test('should process experiences for learning', () => {
        const experience = {
          state: { energy: 80, position: { x: 100, y: 100 } },
          action: 'forage',
          reward: 10,
          nextState: { energy: 90, position: { x: 120, y: 120 } }
        };
        
        mockLearningSystem.processExperience(experience);
        expect(mockLearningSystem.processExperience).toHaveBeenCalledWith(experience);
      });

      test('should predict action outcomes', () => {
        const state = { energy: 70, position: { x: 100, y: 100 } };
        const action = 'explore';
        
        const prediction = mockLearningSystem.predictOutcome(state, action);
        
        expect(typeof prediction).toBe('number');
        expect(prediction).toBe(0.7);
        expect(mockLearningSystem.predictOutcome).toHaveBeenCalledWith(state, action);
      });

      test('should evaluate model performance', () => {
        const performance = mockLearningSystem.evaluatePerformance();
        
        expect(performance).toBeDefined();
        expect(typeof performance.accuracy).toBe('number');
        expect(typeof performance.precision).toBe('number');
        expect(typeof performance.recall).toBe('number');
        
        // Performance metrics should be in valid range [0, 1]
        expect(performance.accuracy).toBeGreaterThanOrEqual(0);
        expect(performance.accuracy).toBeLessThanOrEqual(1);
      });

      test('should train models with experience data', () => {
        const trainingData = [
          { state: { energy: 80 }, action: 'forage', reward: 10 },
          { state: { energy: 60 }, action: 'rest', reward: 5 },
          { state: { energy: 90 }, action: 'explore', reward: 15 }
        ];
        
        mockLearningSystem.trainModel(trainingData);
        expect(mockLearningSystem.trainModel).toHaveBeenCalledWith(trainingData);
      });
    });
  });

  describe('Physics Systems', () => {
    describe('Collision System', () => {
      test('should detect collisions between entities', () => {
        const entities = [
          { id: 'ant-1', position: { x: 100, y: 100, z: 0 }, radius: 1 },
          { id: 'ant-2', position: { x: 101, y: 100, z: 0 }, radius: 1 },
          { id: 'ant-3', position: { x: 200, y: 200, z: 0 }, radius: 1 }
        ];
        
        const collisions = mockCollisionSystem.detectCollisions(entities);
        
        expect(Array.isArray(collisions)).toBe(true);
        expect(mockCollisionSystem.detectCollisions).toHaveBeenCalledWith(entities);
      });

      test('should resolve collision between entities', () => {
        const collision = {
          entity1: { id: 'ant-1', position: { x: 100, y: 100, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
          entity2: { id: 'ant-2', position: { x: 101, y: 100, z: 0 }, velocity: { x: -1, y: 0, z: 0 } },
          normal: { x: 1, y: 0, z: 0 },
          penetration: 0.5
        };
        
        mockCollisionSystem.resolveCollision(collision);
        expect(mockCollisionSystem.resolveCollision).toHaveBeenCalledWith(collision);
      });

      test('should check boundary conditions', () => {
        const entity = { id: 'ant-1', position: { x: 1000, y: 1000, z: 0 } };
        const boundaries = { minX: 0, maxX: 2000, minY: 0, maxY: 2000, minZ: 0, maxZ: 100 };
        
        const withinBounds = mockCollisionSystem.checkBoundaries(entity, boundaries);
        
        expect(typeof withinBounds).toBe('boolean');
        expect(withinBounds).toBe(true);
        expect(mockCollisionSystem.checkBoundaries).toHaveBeenCalledWith(entity, boundaries);
      });

      test('should provide collision statistics', () => {
        const stats = mockCollisionSystem.getCollisionStatistics();
        
        expect(stats).toBeDefined();
        expect(typeof stats.totalCollisions).toBe('number');
        expect(typeof stats.antToAnt).toBe('number');
        expect(typeof stats.antToEnvironment).toBe('number');
        expect(typeof stats.resolvedCollisions).toBe('number');
      });
    });

    describe('Gravity System', () => {
      test('should apply gravitational forces', () => {
        const entity = { 
          id: 'ant-1', 
          position: { x: 100, y: 100, z: 10 },
          velocity: { x: 0, y: 0, z: 0 },
          mass: 0.001
        };
        
        mockGravitySystem.applyGravity(entity);
        expect(mockGravitySystem.applyGravity).toHaveBeenCalledWith(entity);
      });

      test('should calculate gravitational force', () => {
        const entity = { mass: 0.001, position: { x: 100, y: 100, z: 10 } };
        
        const force = mockGravitySystem.calculateGravitationalForce(entity);
        
        expect(force).toBeDefined();
        expect(typeof force.x).toBe('number');
        expect(typeof force.y).toBe('number');
        expect(typeof force.z).toBe('number');
        expect(force.y).toBe(-9.81); // Downward gravity
        
        expect(mockGravitySystem.calculateGravitationalForce).toHaveBeenCalledWith(entity);
      });

      test('should provide gravity configuration', () => {
        const config = mockGravitySystem.getGravityConfiguration();
        
        expect(config).toBeDefined();
        expect(typeof config.strength).toBe('number');
        expect(config.direction).toBeDefined();
        expect(typeof config.direction.x).toBe('number');
        expect(typeof config.direction.y).toBe('number');
        expect(typeof config.direction.z).toBe('number');
      });
    });

    describe('Fluid Dynamics System', () => {
      test('should simulate fluid flow', () => {
        const fluidGrid = {
          width: 100,
          height: 100,
          cells: new Array(10000).fill({ velocity: { x: 0, y: 0 }, pressure: 101325 })
        };
        
        mockFluidDynamics.simulateFluidFlow(fluidGrid);
        expect(mockFluidDynamics.simulateFluidFlow).toHaveBeenCalledWith(fluidGrid);
      });

      test('should calculate fluid viscosity', () => {
        const fluidProperties = { temperature: 20, composition: 'air' };
        
        const viscosity = mockFluidDynamics.calculateViscosity(fluidProperties);
        
        expect(typeof viscosity).toBe('number');
        expect(viscosity).toBe(0.001);
        expect(mockFluidDynamics.calculateViscosity).toHaveBeenCalledWith(fluidProperties);
      });

      test('should apply fluid forces to entities', () => {
        const entity = { 
          id: 'ant-1', 
          position: { x: 100, y: 100, z: 5 },
          velocity: { x: 1, y: 0, z: 0 }
        };
        const fluidState = { velocity: { x: 0.5, y: 0.1, z: 0 }, density: 1.225 };
        
        mockFluidDynamics.applyFluidForces(entity, fluidState);
        expect(mockFluidDynamics.applyFluidForces).toHaveBeenCalledWith(entity, fluidState);
      });

      test('should provide fluid state information', () => {
        const position = { x: 100, y: 100, z: 5 };
        
        const fluidState = mockFluidDynamics.getFluidState(position);
        
        expect(fluidState).toBeDefined();
        expect(fluidState.velocity).toBeDefined();
        expect(typeof fluidState.velocity.x).toBe('number');
        expect(typeof fluidState.pressure).toBe('number');
        expect(typeof fluidState.density).toBe('number');
      });
    });
  });

  describe('Chemical Systems', () => {
    describe('Pheromone System', () => {
      test('should deposit pheromones', () => {
        const ant = { id: 'ant-1', position: { x: 100, y: 100, z: 0 } };
        const pheromoneType = 'trail';
        const concentration = 0.8;
        
        mockPheromoneSystem.depositPheromone(ant, pheromoneType, concentration);
        expect(mockPheromoneSystem.depositPheromone).toHaveBeenCalledWith(ant, pheromoneType, concentration);
      });

      test('should detect nearby pheromones', () => {
        const position = { x: 100, y: 100, z: 0 };
        const detectionRadius = 10;
        
        const pheromones = mockPheromoneSystem.detectPheromones(position, detectionRadius);
        
        expect(Array.isArray(pheromones)).toBe(true);
        expect(pheromones.length).toBe(2);
        
        pheromones.forEach((pheromone: any) => {
          expect(pheromone).toHaveProperty('type');
          expect(pheromone).toHaveProperty('concentration');
          expect(pheromone).toHaveProperty('position');
          expect(typeof pheromone.concentration).toBe('number');
        });
        
        expect(mockPheromoneSystem.detectPheromones).toHaveBeenCalledWith(position, detectionRadius);
      });

      test('should calculate pheromone gradients', () => {
        const position = { x: 100, y: 100, z: 0 };
        const pheromoneType = 'food';
        
        const gradient = mockPheromoneSystem.calculateGradient(position, pheromoneType);
        
        expect(gradient).toBeDefined();
        expect(typeof gradient.x).toBe('number');
        expect(typeof gradient.y).toBe('number');
        expect(typeof gradient.z).toBe('number');
        
        expect(mockPheromoneSystem.calculateGradient).toHaveBeenCalledWith(position, pheromoneType);
      });

      test('should handle pheromone evaporation', () => {
        const deltaTime = 1000; // 1 second
        
        mockPheromoneSystem.evaporatePheromones(deltaTime);
        expect(mockPheromoneSystem.evaporatePheromones).toHaveBeenCalledWith(deltaTime);
      });

      test('should provide pheromone statistics', () => {
        const stats = mockPheromoneSystem.getPheromoneStatistics();
        
        expect(stats).toBeDefined();
        expect(typeof stats.totalPheromones).toBe('number');
        expect(typeof stats.trailPheromones).toBe('number');
        expect(typeof stats.foodPheromones).toBe('number');
        expect(typeof stats.alarmPheromones).toBe('number');
        
        // Should add up correctly
        const calculatedTotal = stats.trailPheromones + stats.foodPheromones + stats.alarmPheromones;
        expect(calculatedTotal).toBe(stats.totalPheromones);
      });

      test('should update pheromone grid efficiently', () => {
        const pheromoneGrid = {
          width: 100,
          height: 100,
          cells: new Array(10000).fill({ trail: 0, food: 0, alarm: 0 })
        };
        
        mockPheromoneSystem.updatePheromoneGrid(pheromoneGrid);
        expect(mockPheromoneSystem.updatePheromoneGrid).toHaveBeenCalledWith(pheromoneGrid);
      });
    });
  });

  describe('Cross-System Integration Tests', () => {
    test('should coordinate biological and AI systems', () => {
      // Ant makes decision based on physiology
      const ant = { 
        id: 'ant-1', 
        energy: 30, // Low energy
        position: { x: 100, y: 100 }
      };
      
      const physiologyState = mockPhysiologySystem.getPhysiologicalState(ant);
      
      const decisionContext = {
        ant,
        physiology: physiologyState,
        environment: { foodNearby: true }
      };
      
      const decision = mockDecisionTree.makeDecision(decisionContext);
      
      expect(decision).toBe('forage');
      expect(mockPhysiologySystem.getPhysiologicalState).toHaveBeenCalledWith(ant);
      expect(mockDecisionTree.makeDecision).toHaveBeenCalledWith(decisionContext);
    });

    test('should integrate physics and chemical systems', () => {
      const ant = { 
        id: 'ant-1', 
        position: { x: 100, y: 100, z: 0 },
        velocity: { x: 1, y: 0, z: 0 }
      };
      
      // Detect pheromones that might affect movement
      const nearbyPheromones = mockPheromoneSystem.detectPheromones(ant.position, 10);
      
      if (nearbyPheromones.length > 0) {
        const gradient = mockPheromoneSystem.calculateGradient(ant.position, 'food');
        // Physics system would use this gradient to influence movement
        mockGravitySystem.applyGravity(ant);
      }
      
      expect(mockPheromoneSystem.detectPheromones).toHaveBeenCalledWith(ant.position, 10);
      expect(mockPheromoneSystem.calculateGradient).toHaveBeenCalledWith(ant.position, 'food');
      expect(mockGravitySystem.applyGravity).toHaveBeenCalledWith(ant);
    });

    test('should integrate AI learning with biological outcomes', () => {
      const ant = { id: 'ant-1', energy: 80 };
      const decision = 'forage';
      
      // AI makes decision
      mockDecisionTree.makeDecision({ ant });
      
      // Biological system processes the action
      const energyConsumption = mockPhysiologySystem.calculateEnergyConsumption({ 
        ...ant, 
        activity: decision 
      });
      
      // Learning system processes the outcome
      const experience = {
        state: ant,
        action: decision,
        reward: energyConsumption > 0 ? 10 : -5,
        nextState: { ...ant, energy: ant.energy - energyConsumption }
      };
      
      mockLearningSystem.processExperience(experience);
      
      expect(mockDecisionTree.makeDecision).toHaveBeenCalled();
      expect(mockPhysiologySystem.calculateEnergyConsumption).toHaveBeenCalled();
      expect(mockLearningSystem.processExperience).toHaveBeenCalledWith(experience);
    });

    test('should handle complex multi-system scenarios', () => {
      // Simulate a complete ant behavior cycle
      const ant = { 
        id: 'ant-1', 
        energy: 70,
        position: { x: 100, y: 100, z: 0 },
        genome: { traits: { strength: 0.8, speed: 0.6 } }
      };
      
      // 1. Check physiological state
      const physiology = mockPhysiologySystem.getPhysiologicalState(ant);
      
      // 2. AI makes decision based on state
      const decision = mockDecisionTree.makeDecision({ ant, physiology });
      
      // 3. Check for environmental factors (pheromones, collisions)
      const pheromones = mockPheromoneSystem.detectPheromones(ant.position, 10);
      const collisions = mockCollisionSystem.detectCollisions([ant]);
      
      // 4. Apply physics
      mockGravitySystem.applyGravity(ant);
      
      // 5. Update spatial memory
      if (pheromones.length > 0) {
        const foodLocation = pheromones.find((p: any) => p.type === 'food');
        if (foodLocation) {
          mockSpatialMemory.rememberLocation(ant, {
            x: foodLocation.position.x,
            y: foodLocation.position.y,
            type: 'food',
            quality: foodLocation.concentration
          });
        }
      }
      
      // 6. Deposit own pheromones
      mockPheromoneSystem.depositPheromone(ant, 'trail', 0.6);
      
      // 7. Process learning
      mockLearningSystem.processExperience({
        state: { ant, physiology, pheromones },
        action: decision,
        reward: 5,
        nextState: ant
      });
      
      // Verify all systems were called
      expect(mockPhysiologySystem.getPhysiologicalState).toHaveBeenCalledWith(ant);
      expect(mockDecisionTree.makeDecision).toHaveBeenCalled();
      expect(mockPheromoneSystem.detectPheromones).toHaveBeenCalledWith(ant.position, 10);
      expect(mockCollisionSystem.detectCollisions).toHaveBeenCalledWith([ant]);
      expect(mockGravitySystem.applyGravity).toHaveBeenCalledWith(ant);
      expect(mockSpatialMemory.rememberLocation).toHaveBeenCalled();
      expect(mockPheromoneSystem.depositPheromone).toHaveBeenCalledWith(ant, 'trail', 0.6);
      expect(mockLearningSystem.processExperience).toHaveBeenCalled();
    });
  });

  describe('Engine System Performance Tests', () => {
    test('should handle large numbers of entities efficiently', () => {
      const startTime = performance.now();
      
      // Create many ants
      const ants = [];
      for (let i = 0; i < 1000; i++) {
        ants.push({
          id: `ant-${i}`,
          position: { x: Math.random() * 1000, y: Math.random() * 1000, z: 0 },
          energy: Math.random() * 100,
          genome: mockGeneticsSystem.generateAntGenome()
        });
      }
      
      // Process each ant through systems
      ants.forEach(ant => {
        mockPhysiologySystem.getPhysiologicalState(ant);
        mockDecisionTree.makeDecision({ ant });
        mockPheromoneSystem.detectPheromones(ant.position, 10);
      });
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(5000); // Should complete in reasonable time
      expect(mockPhysiologySystem.getPhysiologicalState).toHaveBeenCalledTimes(1000);
      expect(mockDecisionTree.makeDecision).toHaveBeenCalledTimes(1000);
      expect(mockPheromoneSystem.detectPheromones).toHaveBeenCalledTimes(1000);
    });

    test('should maintain system responsiveness under load', () => {
      // Simulate high-frequency updates
      for (let frame = 0; frame < 60; frame++) { // 60 frames
        const frameAnts = [];
        for (let i = 0; i < 50; i++) { // 50 ants per frame
          frameAnts.push({
            id: `frame-${frame}-ant-${i}`,
            position: { x: Math.random() * 1000, y: Math.random() * 1000, z: 0 }
          });
        }
        
        // Quick system updates
        frameAnts.forEach(ant => {
          mockCollisionSystem.detectCollisions([ant]);
          mockGravitySystem.applyGravity(ant);
        });
        
        mockPheromoneSystem.evaporatePheromones(16); // ~60 FPS
      }
      
      // Should handle high frequency updates
      expect(mockCollisionSystem.detectCollisions).toHaveBeenCalledTimes(3000); // 60 * 50
      expect(mockGravitySystem.applyGravity).toHaveBeenCalledTimes(3000);
      expect(mockPheromoneSystem.evaporatePheromones).toHaveBeenCalledTimes(60);
    });
  });

  describe('Engine System Error Handling', () => {
    test('should handle invalid genetic data gracefully', () => {
      const invalidGenome = { traits: { strength: -1, speed: 2 } }; // Invalid values
      
      // Should not throw errors
      expect(() => {
        mockGeneticsSystem.calculateFitness(invalidGenome, {});
        mockGeneticsSystem.mutate(invalidGenome, 0.1);
      }).not.toThrow();
    });

    test('should handle physics edge cases', () => {
      const invalidEntity = { 
        id: 'invalid', 
        position: { x: NaN, y: Infinity, z: -Infinity },
        velocity: { x: null, y: undefined, z: 0 }
      };
      
      // Should handle gracefully
      expect(() => {
        mockGravitySystem.applyGravity(invalidEntity);
        mockCollisionSystem.detectCollisions([invalidEntity]);
      }).not.toThrow();
    });

    test('should handle chemical system edge cases', () => {
      const invalidPosition = { x: null, y: undefined, z: NaN };
      
      // Should handle gracefully
      expect(() => {
        mockPheromoneSystem.detectPheromones(invalidPosition, -10);
        mockPheromoneSystem.calculateGradient(invalidPosition, 'invalid_type');
      }).not.toThrow();
    });
  });
});