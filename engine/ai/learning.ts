/**
 * Advanced learning algorithms for ant AI
 * Implements reinforcement learning, neural adaptation, and experience memory
 */

export interface Experience {
  id: string;
  situation: {
    location: { x: number; y: number; z: number };
    context: string;         // 'foraging', 'defending', 'exploring', etc.
    environment: {
      temperature: number;
      danger: number;
      resources: number;
      crowding: number;
    };
    antState: {
      energy: number;
      health: number;
      hunger: number;
      stress: number;
    };
  };
  action: string;            // Action taken
  outcome: {
    success: boolean;
    reward: number;          // -1 to 1
    consequences: string[];  // List of what happened
    duration: number;        // How long the action took
  };
  timestamp: number;
  importance: number;        // Memory importance (0-1)
}

export interface LearningWeights {
  situations: Map<string, number>;    // Situation-action preferences
  locations: Map<string, number>;     // Location-based learning
  temporal: Map<string, number>;      // Time-based patterns
  social: Map<string, number>;        // Social learning weights
}

export interface NeuralNode {
  id: string;
  type: 'input' | 'hidden' | 'output';
  activation: number;
  bias: number;
  connections: Array<{
    targetId: string;
    weight: number;
    strength: number;         // Connection strength (for pruning)
  }>;
}

export interface NeuralNetwork {
  nodes: Map<string, NeuralNode>;
  inputNodes: string[];
  outputNodes: string[];
  hiddenLayers: string[][];
  learningRate: number;
  lastUpdate: number;
}

export class LearningSystem {
  private experiences: Experience[] = [];
  private weights: LearningWeights;
  private neuralNet: NeuralNetwork;
  private genetics: any;
  
  // Learning parameters
  private readonly MAX_EXPERIENCES = 1000;
  private readonly MEMORY_CONSOLIDATION_INTERVAL = 300000; // 5 minutes
  private readonly LEARNING_RATE = 0.01;
  private readonly DECAY_RATE = 0.001;
  
  // Pattern recognition
  private patterns: Map<string, {
    frequency: number;
    success: number;
    lastSeen: number;
    variations: string[];
  }> = new Map();
  
  constructor(genetics: any) {
    this.genetics = genetics;
    this.weights = this.initializeWeights();
    this.neuralNet = this.initializeNeuralNetwork();
  }

  private initializeWeights(): LearningWeights {
    return {
      situations: new Map(),
      locations: new Map(),
      temporal: new Map(),
      social: new Map(),
    };
  }

  private initializeNeuralNetwork(): NeuralNetwork {
    const network: NeuralNetwork = {
      nodes: new Map(),
      inputNodes: [],
      outputNodes: [],
      hiddenLayers: [[], []],
      learningRate: this.LEARNING_RATE * (this.genetics.learningRate || 0.5),
      lastUpdate: Date.now(),
    };

    // Create input nodes (environmental and internal state)
    const inputTypes = [
      'energy', 'health', 'hunger', 'stress',
      'temperature', 'danger', 'resources', 'crowding',
      'time_of_day', 'location_familiarity', 'pheromone_strength'
    ];

    inputTypes.forEach((type, index) => {
      const nodeId = `input_${type}`;
      network.nodes.set(nodeId, {
        id: nodeId,
        type: 'input',
        activation: 0,
        bias: 0,
        connections: [],
      });
      network.inputNodes.push(nodeId);
    });

    // Create hidden layers
    for (let layer = 0; layer < 2; layer++) {
      const nodeCount = layer === 0 ? 8 : 6;
      
      for (let i = 0; i < nodeCount; i++) {
        const nodeId = `hidden_${layer}_${i}`;
        network.nodes.set(nodeId, {
          id: nodeId,
          type: 'hidden',
          activation: 0,
          bias: Math.random() * 0.2 - 0.1,
          connections: [],
        });
        network.hiddenLayers[layer].push(nodeId);
      }
    }

    // Create output nodes (actions)
    const outputTypes = ['forage', 'defend', 'explore', 'rest', 'construct', 'nurture'];
    
    outputTypes.forEach(type => {
      const nodeId = `output_${type}`;
      network.nodes.set(nodeId, {
        id: nodeId,
        type: 'output',
        activation: 0,
        bias: Math.random() * 0.1 - 0.05,
        connections: [],
      });
      network.outputNodes.push(nodeId);
    });

    // Connect layers
    this.connectNetworkLayers(network);
    
    return network;
  }

  private connectNetworkLayers(network: NeuralNetwork): void {
    // Connect inputs to first hidden layer
    for (const inputId of network.inputNodes) {
      const inputNode = network.nodes.get(inputId)!;
      
      for (const hiddenId of network.hiddenLayers[0]) {
        inputNode.connections.push({
          targetId: hiddenId,
          weight: Math.random() * 0.6 - 0.3,
          strength: 1.0,
        });
      }
    }

    // Connect hidden layers
    for (let layer = 0; layer < network.hiddenLayers.length - 1; layer++) {
      for (const nodeId of network.hiddenLayers[layer]) {
        const node = network.nodes.get(nodeId)!;
        
        for (const targetId of network.hiddenLayers[layer + 1]) {
          node.connections.push({
            targetId,
            weight: Math.random() * 0.6 - 0.3,
            strength: 1.0,
          });
        }
      }
    }

    // Connect last hidden layer to outputs
    const lastHiddenLayer = network.hiddenLayers[network.hiddenLayers.length - 1];
    for (const hiddenId of lastHiddenLayer) {
      const hiddenNode = network.nodes.get(hiddenId)!;
      
      for (const outputId of network.outputNodes) {
        hiddenNode.connections.push({
          targetId: outputId,
          weight: Math.random() * 0.6 - 0.3,
          strength: 1.0,
        });
      }
    }
  }

  /**
   * Record a new experience for learning
   */
  public recordExperience(experience: Omit<Experience, 'id' | 'timestamp' | 'importance'>): void {
    const newExperience: Experience = {
      ...experience,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      importance: this.calculateImportance(experience),
    };

    this.experiences.push(newExperience);

    // Immediate learning from experience
    this.learnFromExperience(newExperience);

    // Pattern recognition
    this.updatePatterns(newExperience);

    // Limit experience memory
    if (this.experiences.length > this.MAX_EXPERIENCES) {
      this.consolidateMemory();
    }
  }

  private calculateImportance(experience: any): number {
    let importance = 0.5; // Base importance

    // Reward magnitude affects importance
    importance += Math.abs(experience.outcome.reward) * 0.3;

    // Success/failure affects importance
    importance += experience.outcome.success ? 0.1 : 0.2; // Failures are more important

    // Rare situations are more important
    const contextFrequency = this.getContextFrequency(experience.situation.context);
    importance += (1 - contextFrequency) * 0.2;

    // Extreme states are more important
    const stateExtremity = this.calculateStateExtremity(experience.situation.antState);
    importance += stateExtremity * 0.2;

    return Math.max(0, Math.min(1, importance));
  }

  private getContextFrequency(context: string): number {
    const contextCount = this.experiences.filter(exp => 
      exp.situation.context === context).length;
    return Math.min(1, contextCount / 100); // Normalize by expected frequency
  }

  private calculateStateExtremity(state: any): number {
    const extremes = [
      Math.abs(state.energy - 0.5) * 2,
      Math.abs(state.health - 0.5) * 2,
      Math.abs(state.hunger - 0.5) * 2,
      Math.abs(state.stress - 0.5) * 2,
    ];
    
    return extremes.reduce((sum, val) => sum + val, 0) / extremes.length;
  }

  /**
   * Learn from a specific experience
   */
  private learnFromExperience(experience: Experience): void {
    // Update situation-action weights
    const situationKey = this.getSituationKey(experience.situation);
    const currentWeight = this.weights.situations.get(situationKey) || 0;
    const reward = experience.outcome.reward;
    
    const newWeight = currentWeight + this.LEARNING_RATE * reward;
    this.weights.situations.set(situationKey, newWeight);

    // Update location-based learning
    const locationKey = this.getLocationKey(experience.situation.location);
    const locationWeight = this.weights.locations.get(locationKey) || 0;
    this.weights.locations.set(locationKey, 
      locationWeight + this.LEARNING_RATE * reward * 0.5);

    // Update temporal patterns
    const timeKey = this.getTimeKey(experience.timestamp);
    const timeWeight = this.weights.temporal.get(timeKey) || 0;
    this.weights.temporal.set(timeKey, 
      timeWeight + this.LEARNING_RATE * reward * 0.3);

    // Neural network learning
    this.trainNeuralNetwork(experience);
  }

  private trainNeuralNetwork(experience: Experience): void {
    // Prepare input values
    const inputs = this.prepareNetworkInputs(experience.situation);
    
    // Forward pass
    const outputs = this.forwardPass(inputs);
    
    // Create target outputs based on experience
    const targets = this.createTargetOutputs(experience);
    
    // Backward pass (simplified)
    this.backwardPass(outputs, targets);
  }

  private prepareNetworkInputs(situation: any): number[] {
    return [
      situation.antState.energy,
      situation.antState.health,
      situation.antState.hunger,
      situation.antState.stress,
      situation.environment.temperature / 50, // Normalize temperature
      situation.environment.danger,
      situation.environment.resources,
      situation.environment.crowding,
      this.getTimeOfDayValue(),
      this.getLocationFamiliarity(situation.location),
      situation.environment.pheromones || 0,
    ];
  }

  private forwardPass(inputs: number[]): number[] {
    // Set input activations
    this.neuralNet.inputNodes.forEach((nodeId, index) => {
      const node = this.neuralNet.nodes.get(nodeId)!;
      node.activation = inputs[index] || 0;
    });

    // Process hidden layers
    for (const layer of this.neuralNet.hiddenLayers) {
      for (const nodeId of layer) {
        const node = this.neuralNet.nodes.get(nodeId)!;
        let sum = node.bias;
        
        // Calculate input from connected nodes
        for (const [sourceId, sourceNode] of this.neuralNet.nodes) {
          for (const connection of sourceNode.connections) {
            if (connection.targetId === nodeId) {
              sum += sourceNode.activation * connection.weight;
            }
          }
        }
        
        node.activation = this.sigmoid(sum);
      }
    }

    // Process output layer
    const outputs: number[] = [];
    for (const nodeId of this.neuralNet.outputNodes) {
      const node = this.neuralNet.nodes.get(nodeId)!;
      let sum = node.bias;
      
      for (const [sourceId, sourceNode] of this.neuralNet.nodes) {
        for (const connection of sourceNode.connections) {
          if (connection.targetId === nodeId) {
            sum += sourceNode.activation * connection.weight;
          }
        }
      }
      
      node.activation = this.sigmoid(sum);
      outputs.push(node.activation);
    }

    return outputs;
  }

  private createTargetOutputs(experience: Experience): number[] {
    const targets = new Array(this.neuralNet.outputNodes.length).fill(0);
    
    // Set target based on action taken and outcome
    const actionIndex = this.getActionIndex(experience.action);
    if (actionIndex >= 0) {
      // Higher target for successful actions, lower for failed ones
      targets[actionIndex] = experience.outcome.success ? 
        0.8 + experience.outcome.reward * 0.2 : 
        0.2 + experience.outcome.reward * 0.3;
    }
    
    return targets;
  }

  private backwardPass(outputs: number[], targets: number[]): void {
    // Simplified backpropagation
    const learningRate = this.neuralNet.learningRate;
    
    // Calculate output errors
    const outputErrors = outputs.map((output, index) => 
      targets[index] - output);
    
    // Update output connections
    for (let i = 0; i < this.neuralNet.outputNodes.length; i++) {
      const outputNodeId = this.neuralNet.outputNodes[i];
      const error = outputErrors[i];
      
      // Find connections to this output
      for (const [sourceId, sourceNode] of this.neuralNet.nodes) {
        for (const connection of sourceNode.connections) {
          if (connection.targetId === outputNodeId) {
            const delta = learningRate * error * sourceNode.activation;
            connection.weight += delta;
            
            // Update connection strength
            connection.strength = Math.min(1, connection.strength + Math.abs(delta) * 0.1);
          }
        }
      }
    }
  }

  /**
   * Get action recommendation based on current situation
   */
  public getActionRecommendation(situation: any): {
    action: string;
    confidence: number;
    reasoning: string;
  } {
    // Neural network decision
    const inputs = this.prepareNetworkInputs(situation);
    const outputs = this.forwardPass(inputs);
    
    // Weight-based decision
    const situationKey = this.getSituationKey(situation);
    const situationWeight = this.weights.situations.get(situationKey) || 0;
    
    // Combine neural and weight-based decisions
    const neuralChoice = this.getBestAction(outputs);
    const weightChoice = this.getWeightBasedAction(situation);
    
    // Confidence based on agreement between methods
    const confidence = neuralChoice.action === weightChoice.action ? 
      Math.max(neuralChoice.confidence, weightChoice.confidence) :
      (neuralChoice.confidence + weightChoice.confidence) / 2;
    
    // Choose action with higher confidence
    const bestChoice = neuralChoice.confidence > weightChoice.confidence ? 
      neuralChoice : weightChoice;
    
    return {
      action: bestChoice.action,
      confidence,
      reasoning: this.generateReasoning(bestChoice, situation),
    };
  }

  private getBestAction(outputs: number[]): { action: string; confidence: number } {
    const actions = ['forage', 'defend', 'explore', 'rest', 'construct', 'nurture'];
    
    let bestIndex = 0;
    let bestValue = outputs[0];
    
    for (let i = 1; i < outputs.length; i++) {
      if (outputs[i] > bestValue) {
        bestValue = outputs[i];
        bestIndex = i;
      }
    }
    
    return {
      action: actions[bestIndex],
      confidence: bestValue,
    };
  }

  private getWeightBasedAction(situation: any): { action: string; confidence: number } {
    const situationKey = this.getSituationKey(situation);
    const weight = this.weights.situations.get(situationKey) || 0;
    
    // Simple heuristic-based action selection
    let action = 'explore'; // default
    let confidence = 0.3;
    
    if (situation.antState.energy < 0.3) {
      action = 'rest';
      confidence = 0.8;
    } else if (situation.environment.danger > 0.6) {
      action = 'defend';
      confidence = 0.7;
    } else if (situation.antState.hunger > 0.6) {
      action = 'forage';
      confidence = 0.6;
    }
    
    return { action, confidence };
  }

  /**
   * Update pattern recognition
   */
  private updatePatterns(experience: Experience): void {
    const patternKey = this.createPatternKey(experience);
    const existing = this.patterns.get(patternKey);
    
    if (existing) {
      existing.frequency++;
      existing.success += experience.outcome.success ? 1 : 0;
      existing.lastSeen = experience.timestamp;
      
      // Track variations
      const variation = this.createVariationKey(experience);
      if (!existing.variations.includes(variation)) {
        existing.variations.push(variation);
      }
    } else {
      this.patterns.set(patternKey, {
        frequency: 1,
        success: experience.outcome.success ? 1 : 0,
        lastSeen: experience.timestamp,
        variations: [this.createVariationKey(experience)],
      });
    }
  }

  /**
   * Consolidate memory by keeping only important experiences
   */
  private consolidateMemory(): void {
    // Sort by importance and recency
    this.experiences.sort((a, b) => {
      const importanceScore = (b.importance * 0.7) - (a.importance * 0.7);
      const recencyScore = (b.timestamp - a.timestamp) / 1000000 * 0.3;
      return importanceScore + recencyScore;
    });
    
    // Keep top experiences
    const keepCount = Math.floor(this.MAX_EXPERIENCES * 0.8);
    this.experiences = this.experiences.slice(0, keepCount);
    
    // Decay weights
    this.decayWeights();
  }

  private decayWeights(): void {
    // Decay situation weights
    for (const [key, weight] of this.weights.situations) {
      this.weights.situations.set(key, weight * (1 - this.DECAY_RATE));
    }
    
    // Remove very small weights
    for (const [key, weight] of this.weights.situations) {
      if (Math.abs(weight) < 0.01) {
        this.weights.situations.delete(key);
      }
    }
  }

  // Utility methods
  private getSituationKey(situation: any): string {
    return `${situation.context}_${Math.round(situation.environment.danger * 10)}_${Math.round(situation.antState.energy * 10)}`;
  }

  private getLocationKey(location: any): string {
    return `${Math.round(location.x / 10)}_${Math.round(location.y / 10)}`;
  }

  private getTimeKey(timestamp: number): string {
    const hour = new Date(timestamp).getHours();
    return `hour_${hour}`;
  }

  private getActionIndex(action: string): number {
    const actions = ['forage', 'defend', 'explore', 'rest', 'construct', 'nurture'];
    return actions.indexOf(action);
  }

  private getTimeOfDayValue(): number {
    const hour = new Date().getHours();
    return hour / 24;
  }

  private getLocationFamiliarity(location: any): number {
    const locationKey = this.getLocationKey(location);
    const locationWeight = this.weights.locations.get(locationKey) || 0;
    return Math.max(0, Math.min(1, locationWeight + 0.5));
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private createPatternKey(experience: Experience): string {
    return `${experience.situation.context}_${experience.action}`;
  }

  private createVariationKey(experience: Experience): string {
    return `${Math.round(experience.situation.environment.temperature)}_${Math.round(experience.situation.antState.energy * 10)}`;
  }

  private generateReasoning(choice: any, situation: any): string {
    const reasons = [];
    
    if (situation.antState.energy < 0.3) {
      reasons.push("low energy requires rest");
    }
    if (situation.environment.danger > 0.5) {
      reasons.push("high danger level detected");
    }
    if (situation.antState.hunger > 0.6) {
      reasons.push("hunger drives foraging behavior");
    }
    
    return reasons.join(", ") || "based on learned experience patterns";
  }

  /**
   * Get learning statistics
   */
  public getLearningStats(): {
    experienceCount: number;
    patternCount: number;
    networkConnections: number;
    averageImportance: number;
    learningRate: number;
  } {
    const avgImportance = this.experiences.length > 0 ?
      this.experiences.reduce((sum, exp) => sum + exp.importance, 0) / this.experiences.length : 0;
    
    let connectionCount = 0;
    for (const [_, node] of this.neuralNet.nodes) {
      connectionCount += node.connections.length;
    }
    
    return {
      experienceCount: this.experiences.length,
      patternCount: this.patterns.size,
      networkConnections: connectionCount,
      averageImportance: avgImportance,
      learningRate: this.neuralNet.learningRate,
    };
  }

  /**
   * Export learning data for analysis
   */
  public exportLearningData(): {
    experiences: Experience[];
    weights: LearningWeights;
    patterns: Map<string, any>;
  } {
    return {
      experiences: [...this.experiences],
      weights: {
        situations: new Map(this.weights.situations),
        locations: new Map(this.weights.locations),
        temporal: new Map(this.weights.temporal),
        social: new Map(this.weights.social),
      },
      patterns: new Map(this.patterns),
    };
  }
}