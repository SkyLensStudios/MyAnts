/**
 * Advanced AI decision tree system for ant behavior
 * Implements complex decision-making based on multiple factors
 */

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskType = 'forage' | 'construct' | 'defend' | 'nurture' | 'explore' | 'rest' | 'communicate';

export interface DecisionContext {
  energy: number;          // 0-1
  health: number;          // 0-1
  hunger: number;          // 0-1
  stress: number;          // 0-1
  threats: number;         // Nearby threat count
  resources: number;       // Nearby resource count
  colonyNeeds: {
    food: number;          // Colony food urgency (0-1)
    defense: number;       // Defense needs (0-1)
    construction: number;  // Building needs (0-1)
    nursing: number;       // Larval care needs (0-1)
  };
  environment: {
    danger: number;        // Environmental danger level
    temperature: number;   // Current temperature
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  };
  social: {
    pheromoneStrength: number;  // Pheromone trail intensity
    alarmLevel: number;         // Colony alarm state
    crowding: number;           // Local ant density
  };
}

export interface DecisionNode {
  id: string;
  type: 'condition' | 'action' | 'selector' | 'sequence';
  condition?: (context: DecisionContext) => boolean;
  action?: TaskType;
  priority?: Priority;
  children?: DecisionNode[];
  weight?: number;         // For weighted random selection
  cooldown?: number;       // Minimum time between executions
  lastExecuted?: number;   // Last execution timestamp
}

export interface Task {
  type: TaskType;
  priority: Priority;
  urgency: number;         // 0-1, immediate need
  duration: number;        // Expected task duration
  location?: { x: number; y: number; z?: number };
  target?: string;         // Target entity ID
  resources?: string[];    // Required resources
  conditions?: string[];   // Prerequisites
}

export class BehaviorDecisionTree {
  private rootNode: DecisionNode;
  private currentTask?: Task;
  private taskHistory: Task[] = [];
  private personalityWeights: Map<string, number> = new Map();
  
  constructor(caste: 'worker' | 'soldier' | 'queen', genetics: any) {
    this.personalityWeights = this.initializePersonality(genetics);
    this.rootNode = this.buildDecisionTree(caste);
  }

  private initializePersonality(genetics: any): Map<string, number> {
    const weights = new Map<string, number>();
    
    // Base personality from genetics
    weights.set('aggression', genetics.aggressiveness || 0.5);
    weights.set('exploration', genetics.forageEfficiency || 0.5);
    weights.set('social', genetics.communicationSkill || 0.5);
    weights.set('caution', 1 - (genetics.aggressiveness || 0.5));
    weights.set('efficiency', genetics.spatialMemory || 0.5);
    weights.set('nurturing', genetics.nurturingInstinct || 0.5);
    
    return weights;
  }

  private buildDecisionTree(caste: 'worker' | 'soldier' | 'queen'): DecisionNode {
    switch (caste) {
      case 'worker':
        return this.buildWorkerTree();
      case 'soldier':
        return this.buildSoldierTree();
      case 'queen':
        return this.buildQueenTree();
      default:
        return this.buildWorkerTree();
    }
  }

  private buildWorkerTree(): DecisionNode {
    return {
      id: 'worker_root',
      type: 'selector',
      children: [
        // Survival priorities (highest)
        {
          id: 'survival_check',
          type: 'sequence',
          children: [
            {
              id: 'critical_health',
              type: 'condition',
              condition: (ctx) => ctx.health < 0.2 || ctx.energy < 0.1,
              children: [{
                id: 'seek_rest',
                type: 'action',
                action: 'rest',
                priority: 'critical'
              }]
            },
            {
              id: 'immediate_danger',
              type: 'condition',
              condition: (ctx) => ctx.threats > 0 || ctx.social.alarmLevel > 0.7,
              children: [{
                id: 'flee_or_defend',
                type: 'action',
                action: 'defend',
                priority: 'critical'
              }]
            }
          ]
        },
        
        // Colony emergency needs
        {
          id: 'colony_emergency',
          type: 'condition',
          condition: (ctx) => ctx.colonyNeeds.defense > 0.8 || ctx.colonyNeeds.food > 0.9,
          children: [
            {
              id: 'emergency_response',
              type: 'selector',
              children: [
                {
                  id: 'emergency_forage',
                  type: 'condition',
                  condition: (ctx) => ctx.colonyNeeds.food > 0.9,
                  children: [{
                    id: 'urgent_forage',
                    type: 'action',
                    action: 'forage',
                    priority: 'critical'
                  }]
                },
                {
                  id: 'emergency_defend',
                  type: 'action',
                  action: 'defend',
                  priority: 'high'
                }
              ]
            }
          ]
        },

        // Normal work priorities
        {
          id: 'normal_work',
          type: 'selector',
          children: [
            // Forage when hungry or colony needs food
            {
              id: 'forage_check',
              type: 'condition',
              condition: (ctx) => ctx.hunger > 0.6 || ctx.colonyNeeds.food > 0.5,
              children: [{
                id: 'forage_task',
                type: 'action',
                action: 'forage',
                priority: 'medium',
                weight: this.personalityWeights.get('exploration')
              }]
            },
            
            // Construction when needed
            {
              id: 'construction_check',
              type: 'condition',
              condition: (ctx) => ctx.colonyNeeds.construction > 0.6,
              children: [{
                id: 'construction_task',
                type: 'action',
                action: 'construct',
                priority: 'medium'
              }]
            },
            
            // Nursing duties
            {
              id: 'nursing_check',
              type: 'condition',
              condition: (ctx) => ctx.colonyNeeds.nursing > 0.4,
              children: [{
                id: 'nursing_task',
                type: 'action',
                action: 'nurture',
                priority: 'medium',
                weight: this.personalityWeights.get('nurturing')
              }]
            },
            
            // Exploration (default activity)
            {
              id: 'explore_default',
              type: 'action',
              action: 'explore',
              priority: 'low',
              weight: this.personalityWeights.get('exploration')
            }
          ]
        }
      ]
    };
  }

  private buildSoldierTree(): DecisionNode {
    return {
      id: 'soldier_root',
      type: 'selector',
      children: [
        // Immediate combat response
        {
          id: 'combat_response',
          type: 'condition',
          condition: (ctx) => ctx.threats > 0,
          children: [{
            id: 'engage_threat',
            type: 'action',
            action: 'defend',
            priority: 'critical'
          }]
        },
        
        // Colony defense needs
        {
          id: 'defense_needs',
          type: 'condition',
          condition: (ctx) => ctx.colonyNeeds.defense > 0.3 || ctx.social.alarmLevel > 0.5,
          children: [{
            id: 'patrol_defend',
            type: 'action',
            action: 'defend',
            priority: 'high'
          }]
        },
        
        // Patrol and exploration
        {
          id: 'patrol_check',
          type: 'condition',
          condition: (ctx) => ctx.energy > 0.5,
          children: [{
            id: 'patrol_explore',
            type: 'action',
            action: 'explore',
            priority: 'medium'
          }]
        },
        
        // Rest when needed
        {
          id: 'soldier_rest',
          type: 'action',
          action: 'rest',
          priority: 'low'
        }
      ]
    };
  }

  private buildQueenTree(): DecisionNode {
    return {
      id: 'queen_root',
      type: 'selector',
      children: [
        // Survival (queens are valuable)
        {
          id: 'queen_survival',
          type: 'condition',
          condition: (ctx) => ctx.health < 0.5 || ctx.threats > 0,
          children: [{
            id: 'queen_safety',
            type: 'action',
            action: 'rest',
            priority: 'critical'
          }]
        },
        
        // Egg laying (primary function)
        {
          id: 'reproduction_check',
          type: 'condition',
          condition: (ctx) => ctx.energy > 0.7 && ctx.health > 0.6,
          children: [{
            id: 'lay_eggs',
            type: 'action',
            action: 'nurture', // Using nurture as egg-laying activity
            priority: 'high'
          }]
        },
        
        // Communication and coordination
        {
          id: 'queen_communication',
          type: 'action',
          action: 'communicate',
          priority: 'medium'
        }
      ]
    };
  }

  /**
   * Execute decision tree to determine next task
   */
  public makeDecision(context: DecisionContext): Task | null {
    const selectedNode = this.evaluateNode(this.rootNode, context);
    
    if (selectedNode && selectedNode.action) {
      const task: Task = {
        type: selectedNode.action,
        priority: selectedNode.priority || 'medium',
        urgency: this.calculateUrgency(selectedNode.action, context),
        duration: this.estimateTaskDuration(selectedNode.action),
      };
      
      this.currentTask = task;
      this.taskHistory.push(task);
      
      // Limit history size
      if (this.taskHistory.length > 100) {
        this.taskHistory.shift();
      }
      
      return task;
    }
    
    return null;
  }

  private evaluateNode(node: DecisionNode, context: DecisionContext): DecisionNode | null {
    switch (node.type) {
      case 'condition':
        if (node.condition && node.condition(context)) {
          if (node.children && node.children.length > 0) {
            return this.evaluateNode(node.children[0], context);
          }
        }
        return null;
        
      case 'action':
        // Check cooldown
        if (node.cooldown && node.lastExecuted) {
          if (Date.now() - node.lastExecuted < node.cooldown) {
            return null;
          }
        }
        node.lastExecuted = Date.now();
        return node;
        
      case 'selector':
        // Try each child until one succeeds
        if (node.children) {
          for (const child of node.children) {
            const result = this.evaluateNode(child, context);
            if (result) {
              return result;
            }
          }
        }
        return null;
        
      case 'sequence':
        // All children must succeed
        if (node.children) {
          let lastResult = null;
          for (const child of node.children) {
            const result = this.evaluateNode(child, context);
            if (!result) {
              return null;
            }
            lastResult = result;
          }
          return lastResult;
        }
        return null;
        
      default:
        return null;
    }
  }

  private calculateUrgency(action: TaskType, context: DecisionContext): number {
    switch (action) {
      case 'rest':
        return Math.max(1 - context.energy, 1 - context.health);
      case 'defend':
        return Math.max(context.threats / 5, context.social.alarmLevel);
      case 'forage':
        return Math.max(context.hunger, context.colonyNeeds.food);
      case 'construct':
        return context.colonyNeeds.construction;
      case 'nurture':
        return context.colonyNeeds.nursing;
      case 'explore':
        return 0.3; // Base exploration drive
      case 'communicate':
        return context.social.pheromoneStrength;
      default:
        return 0.5;
    }
  }

  private estimateTaskDuration(action: TaskType): number {
    const baseDurations = {
      rest: 300,        // 5 minutes
      defend: 180,      // 3 minutes
      forage: 600,      // 10 minutes
      construct: 900,   // 15 minutes
      nurture: 240,     // 4 minutes
      explore: 480,     // 8 minutes
      communicate: 60,  // 1 minute
    };
    
    const base = baseDurations[action] || 300;
    const variation = 0.3; // ±30% variation
    
    return base * (1 + (Math.random() - 0.5) * variation);
  }

  /**
   * Update decision tree based on learning
   */
  public learn(outcome: 'success' | 'failure' | 'interrupted', context: DecisionContext): void {
    if (!this.currentTask) return;
    
    const taskType = this.currentTask.type;
    const success = outcome === 'success';
    
    // Adjust personality weights based on outcomes
    if (success) {
      this.reinforceSuccessfulBehavior(taskType, context);
    } else {
      this.adjustFailedBehavior(taskType, context);
    }
    
    // Update node weights based on learning
    this.updateNodeWeights(taskType, success);
  }

  private reinforceSuccessfulBehavior(taskType: TaskType, context: DecisionContext): void {
    const reinforcement = 0.02; // Small learning rate
    
    switch (taskType) {
      case 'forage':
        this.personalityWeights.set('exploration', 
          Math.min(1, (this.personalityWeights.get('exploration') || 0.5) + reinforcement));
        break;
      case 'defend':
        this.personalityWeights.set('aggression',
          Math.min(1, (this.personalityWeights.get('aggression') || 0.5) + reinforcement));
        break;
      case 'explore':
        this.personalityWeights.set('exploration',
          Math.min(1, (this.personalityWeights.get('exploration') || 0.5) + reinforcement));
        break;
    }
  }

  private adjustFailedBehavior(taskType: TaskType, context: DecisionContext): void {
    const penalty = 0.01; // Smaller penalty than reinforcement
    
    switch (taskType) {
      case 'forage':
        if (context.threats > 0) {
          // Failed foraging due to threats - increase caution
          this.personalityWeights.set('caution',
            Math.min(1, (this.personalityWeights.get('caution') || 0.5) + penalty));
        }
        break;
      case 'defend':
        if (context.health < 0.5) {
          // Failed defense - be more cautious
          this.personalityWeights.set('caution',
            Math.min(1, (this.personalityWeights.get('caution') || 0.5) + penalty));
        }
        break;
    }
  }

  private updateNodeWeights(taskType: TaskType, success: boolean): void {
    // Find and update relevant nodes in the tree
    this.updateNodeWeightsRecursive(this.rootNode, taskType, success);
  }

  private updateNodeWeightsRecursive(node: DecisionNode, taskType: TaskType, success: boolean): void {
    if (node.action === taskType && node.weight !== undefined) {
      const adjustment = success ? 0.05 : -0.02;
      node.weight = Math.max(0.1, Math.min(1, node.weight + adjustment));
    }
    
    if (node.children) {
      node.children.forEach(child => {
        this.updateNodeWeightsRecursive(child, taskType, success);
      });
    }
  }

  /**
   * Get current task
   */
  public getCurrentTask(): Task | undefined {
    return this.currentTask;
  }

  /**
   * Complete current task
   */
  public completeTask(): void {
    this.currentTask = undefined;
  }

  /**
   * Get task history for analysis
   */
  public getTaskHistory(): Task[] {
    return [...this.taskHistory];
  }

  /**
   * Get personality profile
   */
  public getPersonality(): Map<string, number> {
    return new Map(this.personalityWeights);
  }

  /**
   * Override personality weights (for testing or special conditions)
   */
  public setPersonalityWeight(trait: string, value: number): void {
    this.personalityWeights.set(trait, Math.max(0, Math.min(1, value)));
  }
}