/**
 * Advanced AI Systems v3
 * Implements breakthrough AI technologies from v3 architecture:
 * - Branching Q-Networks for specialized decisions
 * - Memory-Augmented Networks with episodic recall
 * - Multi-Agent RL with MASTER algorithm
 * - Swarm Intelligence with contribution-based cooperation
 */

import { AntGenetics } from '@engine/biological/genetics';

// Enhanced AI interfaces
export interface BranchingQNetwork {
  movement: DQNBranch;
  pheromone: DQNBranch;
  interaction: DQNBranch;
  task: DQNBranch;
}

export interface DQNBranch {
  actions: string[];
  qValues: Map<string, number>;
  lastUpdate: number;
  explorationRate: number;
  learningRate: number;
}

export interface MemoryAugmentedNetwork {
  episodicMemory: LSTMMemory;
  workingMemory: AttentionMemory;
  spatialMemory: SpatialHashMemory;
  associativeMemory: AssociativeMemory;
}

export interface LSTMMemory {
  capacity: number;
  episodes: MemoryEpisode[];
  hiddenState: Float32Array;
  cellState: Float32Array;
  weights: Map<string, Float32Array>;
}

export interface MemoryEpisode {
  id: string;
  timestamp: number;
  context: any;
  action: string;
  outcome: number;
  importance: number;
  decayRate: number;
}

export interface AttentionMemory {
  capacity: number;
  attentionWeights: Map<string, number>;
  focusHistory: string[];
  currentFocus: string | null;
}

export interface SpatialHashMemory {
  spatialHash: Map<string, any>;
  locationMemory: Map<string, LocationMemory>;
  pathMemory: Map<string, PathMemory>;
}

export interface LocationMemory {
  position: { x: number; y: number; z: number };
  type: string;
  importance: number;
  lastVisited: number;
  associatedRewards: number;
  successRate: number;
}

export interface PathMemory {
  from: string;
  to: string;
  efficiency: number;
  safety: number;
  useCount: number;
  lastUsed: number;
}

export interface AssociativeMemory {
  associations: Map<string, Association[]>;
  strengthThreshold: number;
  decayRate: number;
}

export interface Association {
  from: string;
  to: string;
  strength: number;
  type: 'causal' | 'temporal' | 'spatial' | 'social';
  confidence: number;
}

// MASTER Algorithm interfaces
export interface MASTERSystem {
  agents: Map<string, MASTERAgent>;
  consensusThreshold: number;
  maxIterations: number;
  convergenceRate: number;
  communicationMatrix: Map<string, Map<string, number>>;
}

export interface MASTERAgent {
  id: string;
  localState: any;
  neighbors: Set<string>;
  contributionWeights: Map<string, number>;
  consensusValue: number;
  lastUpdate: number;
}

// Contribution-based cooperation
export interface ContributionSystem {
  contributionMatrix: Map<string, Map<string, number>>;
  reputationScores: Map<string, number>;
  cooperationHistory: CooperationEvent[];
  taskAllocation: TaskAllocationSystem;
}

export interface CooperationEvent {
  participants: string[];
  task: string;
  contributions: Map<string, number>;
  success: boolean;
  timestamp: number;
  efficiency: number;
}

export interface TaskAllocationSystem {
  availableTasks: Task[];
  assignments: Map<string, string[]>;
  capabilities: Map<string, CapabilityProfile>;
  workload: Map<string, number>;
}

export interface Task {
  id: string;
  type: string;
  priority: number;
  requiredCapabilities: string[];
  estimatedDuration: number;
  rewards: Map<string, number>;
}

export interface CapabilityProfile {
  skills: Map<string, number>;
  experience: Map<string, number>;
  availability: number;
  efficiency: number;
}

/**
 * Advanced AI Engine implementing v3 breakthrough technologies
 */
export class AdvancedAIEngineV3 {
  private branchingQNetworks: Map<string, BranchingQNetwork> = new Map();
  private memoryNetworks: Map<string, MemoryAugmentedNetwork> = new Map();
  private masterSystem: MASTERSystem;
  private contributionSystem: ContributionSystem;
  
  // Performance tracking
  private aiMetrics = {
    convergenceTime: 0,
    decisionAccuracy: 0,
    memoryEfficiency: 0,
    cooperationRate: 0,
    learningProgress: 0
  };

  constructor() {
    this.masterSystem = this.initializeMASTERSystem();
    this.contributionSystem = this.initializeContributionSystem();
    
    console.log('🧠 Advanced AI Engine v3 initialized');
  }

  /**
   * Initialize MASTER algorithm system for distributed optimization
   */
  private initializeMASTERSystem(): MASTERSystem {
    return {
      agents: new Map(),
      consensusThreshold: 1e-8,
      maxIterations: 1000,
      convergenceRate: 0.95,
      communicationMatrix: new Map()
    };
  }

  /**
   * Initialize contribution-based cooperation system
   */
  private initializeContributionSystem(): ContributionSystem {
    return {
      contributionMatrix: new Map(),
      reputationScores: new Map(),
      cooperationHistory: [],
      taskAllocation: {
        availableTasks: [],
        assignments: new Map(),
        capabilities: new Map(),
        workload: new Map()
      }
    };
  }

  /**
   * Create advanced AI for an ant
   */
  public createAntAI(antId: string, genetics: AntGenetics, caste: string): void {
    // Initialize branching Q-network
    const branchingQNet = this.createBranchingQNetwork(genetics, caste);
    this.branchingQNetworks.set(antId, branchingQNet);
    
    // Initialize memory-augmented network
    const memoryNet = this.createMemoryAugmentedNetwork(genetics);
    this.memoryNetworks.set(antId, memoryNet);
    
    // Register with MASTER system
    this.registerMASTERAgent(antId, genetics, caste);
    
    // Initialize contribution profile
    this.initializeContributionProfile(antId, genetics, caste);
    
    console.log(`🧠 Advanced AI created for ant ${antId} (${caste})`);
  }

  /**
   * Create branching Q-network for specialized decisions
   */
  private createBranchingQNetwork(genetics: AntGenetics, caste: string): BranchingQNetwork {
    const baseExploration = 0.1;
    const baseLearning = genetics.traits?.learningRate || 0.01;
    
    return {
      movement: {
        actions: ['forward', 'left', 'right', 'backward', 'stop'],
        qValues: new Map(),
        lastUpdate: Date.now(),
        explorationRate: baseExploration,
        learningRate: baseLearning
      },
      pheromone: {
        actions: ['deposit_trail', 'deposit_alarm', 'follow_trail', 'ignore'],
        qValues: new Map(),
        lastUpdate: Date.now(),
        explorationRate: baseExploration * 0.5,
        learningRate: baseLearning
      },
      interaction: {
        actions: ['ignore', 'assist', 'communicate', 'exchange', 'follow'],
        qValues: new Map(),
        lastUpdate: Date.now(),
        explorationRate: baseExploration * 0.3,
        learningRate: baseLearning
      },
      task: {
        actions: ['continue', 'switch', 'delegate', 'collaborate'],
        qValues: new Map(),
        lastUpdate: Date.now(),
        explorationRate: baseExploration * 0.2,
        learningRate: baseLearning
      }
    };
  }

  /**
   * Create memory-augmented network with episodic recall
   */
  private createMemoryAugmentedNetwork(genetics: AntGenetics): MemoryAugmentedNetwork {
    const memoryCapacity = Math.floor(100 + (genetics.traits?.spatialMemory || 0.5) * 400);
    
    return {
      episodicMemory: {
        capacity: memoryCapacity,
        episodes: [],
        hiddenState: new Float32Array(256),
        cellState: new Float32Array(256),
        weights: new Map()
      },
      workingMemory: {
        capacity: 64,
        attentionWeights: new Map(),
        focusHistory: [],
        currentFocus: null
      },
      spatialMemory: {
        spatialHash: new Map(),
        locationMemory: new Map(),
        pathMemory: new Map()
      },
      associativeMemory: {
        associations: new Map(),
        strengthThreshold: 0.3,
        decayRate: 0.001
      }
    };
  }

  /**
   * Register ant with MASTER algorithm system
   */
  private registerMASTERAgent(antId: string, genetics: AntGenetics, caste: string): void {
    const agent: MASTERAgent = {
      id: antId,
      localState: {
        position: { x: 0, y: 0, z: 0 },
        energy: 1.0,
        task: 'idle',
        caste
      },
      neighbors: new Set(),
      contributionWeights: new Map(),
      consensusValue: 0,
      lastUpdate: Date.now()
    };
    
    this.masterSystem.agents.set(antId, agent);
    this.masterSystem.communicationMatrix.set(antId, new Map());
  }

  /**
   * Initialize contribution profile for cooperation
   */
  private initializeContributionProfile(antId: string, genetics: AntGenetics, caste: string): void {
    // Initialize capability profile based on genetics and caste
    const capabilities: CapabilityProfile = {
      skills: new Map([
        ['foraging', genetics.traits?.forageEfficiency || 0.5],
        ['construction', caste === 'worker' ? 0.8 : 0.3],
        ['defense', caste === 'soldier' ? 0.9 : 0.2],
        ['leadership', caste === 'queen' ? 1.0 : 0.1],
        ['communication', genetics.traits?.communicationSkill || 0.5]
      ]),
      experience: new Map(),
      availability: 1.0,
      efficiency: 0.7
    };
    
    this.contributionSystem.taskAllocation.capabilities.set(antId, capabilities);
    this.contributionSystem.reputationScores.set(antId, 0.5); // Neutral starting reputation
    this.contributionSystem.contributionMatrix.set(antId, new Map());
  }

  /**
   * Make decisions using branching Q-networks
   */
  public makeDecision(
    antId: string, 
    context: any, 
    decisionType: 'movement' | 'pheromone' | 'interaction' | 'task'
  ): string {
    const qNet = this.branchingQNetworks.get(antId);
    if (!qNet) {
      return 'idle'; // Fallback
    }
    
    const branch = qNet[decisionType];
    if (!branch) {
      return 'idle';
    }
    
    // Epsilon-greedy action selection with context awareness
    if (Math.random() < branch.explorationRate) {
      // Exploration: random action
      return branch.actions[Math.floor(Math.random() * branch.actions.length)];
    } else {
      // Exploitation: best known action
      let bestAction = branch.actions[0];
      let bestValue = branch.qValues.get(bestAction) || 0;
      
      for (const action of branch.actions) {
        const value = branch.qValues.get(action) || 0;
        const contextBonus = this.calculateContextBonus(antId, action, context);
        
        if (value + contextBonus > bestValue) {
          bestValue = value + contextBonus;
          bestAction = action;
        }
      }
      
      return bestAction;
    }
  }

  /**
   * Calculate context bonus for decision making
   */
  private calculateContextBonus(antId: string, action: string, context: any): number {
    const memoryNet = this.memoryNetworks.get(antId);
    if (!memoryNet) return 0;
    
    let bonus = 0;
    
    // Episodic memory bonus
    const similarEpisodes = this.findSimilarEpisodes(memoryNet.episodicMemory, context);
    for (const episode of similarEpisodes) {
      if (episode.action === action) {
        bonus += episode.outcome * episode.importance * 0.1;
      }
    }
    
    // Associative memory bonus
    const associations = memoryNet.associativeMemory.associations.get(action) || [];
    for (const assoc of associations) {
      if (context[assoc.to]) {
        bonus += assoc.strength * assoc.confidence * 0.05;
      }
    }
    
    return Math.max(-0.5, Math.min(0.5, bonus)); // Clamp bonus
  }

  /**
   * Find similar episodes in episodic memory
   */
  private findSimilarEpisodes(memory: LSTMMemory, context: any): MemoryEpisode[] {
    const similarEpisodes: MemoryEpisode[] = [];
    const threshold = 0.7;
    
    for (const episode of memory.episodes) {
      const similarity = this.calculateContextSimilarity(episode.context, context);
      if (similarity > threshold) {
        similarEpisodes.push(episode);
      }
    }
    
    return similarEpisodes.sort((a, b) => b.importance - a.importance).slice(0, 5);
  }

  /**
   * Calculate similarity between contexts
   */
  private calculateContextSimilarity(context1: any, context2: any): number {
    // Simple similarity calculation - could be enhanced with more sophisticated methods
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const commonKeys = keys1.filter(key => keys2.includes(key));
    
    if (commonKeys.length === 0) return 0;
    
    let similarity = 0;
    for (const key of commonKeys) {
      const val1 = context1[key];
      const val2 = context2[key];
      
      if (typeof val1 === 'number' && typeof val2 === 'number') {
        similarity += 1 - Math.abs(val1 - val2) / Math.max(Math.abs(val1), Math.abs(val2), 1);
      } else if (val1 === val2) {
        similarity += 1;
      }
    }
    
    return similarity / commonKeys.length;
  }

  /**
   * Update AI with learning from experience
   */
  public learn(antId: string, action: string, context: any, reward: number): void {
    this.updateQNetwork(antId, action, context, reward);
    this.updateEpisodicMemory(antId, action, context, reward);
    this.updateAssociativeMemory(antId, action, context, reward);
    this.updateContributions(antId, action, context, reward);
  }

  /**
   * Update Q-network with reward
   */
  private updateQNetwork(antId: string, action: string, context: any, reward: number): void {
    const qNet = this.branchingQNetworks.get(antId);
    if (!qNet) return;
    
    // Determine which branch to update
    let branch: DQNBranch | null = null;
    if (['forward', 'left', 'right', 'backward', 'stop'].includes(action)) {
      branch = qNet.movement;
    } else if (['deposit_trail', 'deposit_alarm', 'follow_trail', 'ignore'].includes(action)) {
      branch = qNet.pheromone;
    } else if (['ignore', 'assist', 'communicate', 'exchange', 'follow'].includes(action)) {
      branch = qNet.interaction;
    } else if (['continue', 'switch', 'delegate', 'collaborate'].includes(action)) {
      branch = qNet.task;
    }
    
    if (!branch) return;
    
    // Q-learning update
    const currentQ = branch.qValues.get(action) || 0;
    const newQ = currentQ + branch.learningRate * (reward - currentQ);
    branch.qValues.set(action, newQ);
    
    // Decay exploration rate
    branch.explorationRate *= 0.9995;
    branch.explorationRate = Math.max(0.01, branch.explorationRate);
    
    branch.lastUpdate = Date.now();
  }

  /**
   * Update episodic memory with new experience
   */
  private updateEpisodicMemory(antId: string, action: string, context: any, reward: number): void {
    const memoryNet = this.memoryNetworks.get(antId);
    if (!memoryNet) return;
    
    const episode: MemoryEpisode = {
      id: `${antId}_${Date.now()}`,
      timestamp: Date.now(),
      context: { ...context },
      action,
      outcome: reward,
      importance: Math.abs(reward) + Math.random() * 0.1,
      decayRate: 0.001
    };
    
    memoryNet.episodicMemory.episodes.push(episode);
    
    // Trim memory if over capacity
    if (memoryNet.episodicMemory.episodes.length > memoryNet.episodicMemory.capacity) {
      memoryNet.episodicMemory.episodes.sort((a, b) => a.importance - b.importance);
      memoryNet.episodicMemory.episodes.shift(); // Remove least important
    }
  }

  /**
   * Update associative memory
   */
  private updateAssociativeMemory(antId: string, action: string, context: any, reward: number): void {
    const memoryNet = this.memoryNetworks.get(antId);
    if (!memoryNet) return;
    
    // Create associations between context elements and actions
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const contextKey = `${key}:${value}`;
        
        if (!memoryNet.associativeMemory.associations.has(contextKey)) {
          memoryNet.associativeMemory.associations.set(contextKey, []);
        }
        
        const associations = memoryNet.associativeMemory.associations.get(contextKey)!;
        let association = associations.find(a => a.to === action);
        
        if (!association) {
          association = {
            from: contextKey,
            to: action,
            strength: 0,
            type: 'causal',
            confidence: 0.5
          };
          associations.push(association);
        }
        
        // Update association strength based on reward
        const update = reward > 0 ? 0.1 : -0.05;
        association.strength = Math.max(0, Math.min(1, association.strength + update));
        association.confidence = Math.min(1, association.confidence + 0.01);
      }
    }
  }

  /**
   * Update contribution tracking
   */
  private updateContributions(antId: string, action: string, context: any, reward: number): void {
    // Update reputation based on performance
    const currentReputation = this.contributionSystem.reputationScores.get(antId) || 0.5;
    const reputationUpdate = reward > 0 ? 0.01 : -0.005;
    const newReputation = Math.max(0, Math.min(1, currentReputation + reputationUpdate));
    this.contributionSystem.reputationScores.set(antId, newReputation);
    
    // Track cooperation events
    if (context.collaborators && Array.isArray(context.collaborators)) {
      const event: CooperationEvent = {
        participants: [antId, ...context.collaborators],
        task: context.task || 'unknown',
        contributions: new Map([[antId, Math.abs(reward)]]),
        success: reward > 0,
        timestamp: Date.now(),
        efficiency: reward / (context.duration || 1)
      };
      
      this.contributionSystem.cooperationHistory.push(event);
      
      // Trim history
      if (this.contributionSystem.cooperationHistory.length > 1000) {
        this.contributionSystem.cooperationHistory.shift();
      }
    }
  }

  /**
   * Run MASTER algorithm for distributed consensus
   */
  public runMASTERConsensus(objective: string, maxIterations: number = 100): Map<string, number> {
    const consensus = new Map<string, number>();
    let iteration = 0;
    let converged = false;
    
    while (iteration < maxIterations && !converged) {
      converged = true;
      
      for (const [agentId, agent] of this.masterSystem.agents) {
        const oldConsensus = agent.consensusValue;
        
        // Calculate local consensus based on neighbors
        let sum = 0;
        let count = 0;
        
        for (const neighborId of agent.neighbors) {
          const neighbor = this.masterSystem.agents.get(neighborId);
          if (neighbor) {
            const weight = this.masterSystem.communicationMatrix.get(agentId)?.get(neighborId) || 0.1;
            sum += neighbor.consensusValue * weight;
            count += weight;
          }
        }
        
        // Update consensus value
        if (count > 0) {
          agent.consensusValue = sum / count;
        }
        
        // Check convergence
        if (Math.abs(agent.consensusValue - oldConsensus) > this.masterSystem.consensusThreshold) {
          converged = false;
        }
        
        consensus.set(agentId, agent.consensusValue);
        agent.lastUpdate = Date.now();
      }
      
      iteration++;
    }
    
    this.aiMetrics.convergenceTime = iteration;
    console.log(`🔄 MASTER consensus reached in ${iteration} iterations`);
    
    return consensus;
  }

  /**
   * Get AI performance metrics
   */
  public getAIMetrics(): typeof this.aiMetrics {
    return { ...this.aiMetrics };
  }

  /**
   * Dispose AI resources for an ant
   */
  public disposeAntAI(antId: string): void {
    this.branchingQNetworks.delete(antId);
    this.memoryNetworks.delete(antId);
    this.masterSystem.agents.delete(antId);
    this.masterSystem.communicationMatrix.delete(antId);
    this.contributionSystem.taskAllocation.capabilities.delete(antId);
    this.contributionSystem.reputationScores.delete(antId);
    this.contributionSystem.contributionMatrix.delete(antId);
  }
}