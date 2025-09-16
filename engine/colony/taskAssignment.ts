/**
 * Task Assignment System
 * Intelligent task allocation and management for ant colonies
 */

import { AntCaste, TaskType, CasteSystem } from './casteSystem';

export interface Task {
  id: string;
  type: TaskType;
  priority: number;        // 0-1, how urgent this task is
  difficulty: number;      // 0-1, how challenging the task is
  estimatedDuration: number; // Expected time to complete (seconds)
  location: { x: number; y: number; z: number };
  requirements: TaskRequirements;
  status: TaskStatus;
  assignedAntId?: string;
  createdAt: number;       // Timestamp
  deadline?: number;       // Optional deadline timestamp
  dependencies: string[];  // Task IDs that must complete first
  resources: ResourceRequirement[];
}

export interface TaskRequirements {
  minimumCaste?: AntCaste;
  preferredCastes: AntCaste[];
  minimumSkillLevel: number;    // 0-1
  requiredTraits: Map<string, number>; // trait name -> minimum value
  teamSize: number;             // How many ants needed
  equipment?: string[];         // Required tools/resources
}

export interface ResourceRequirement {
  type: string;        // Resource type (food, building_material, etc.)
  amount: number;      // Quantity needed
  consumed: boolean;   // Whether resource is consumed by task
}

export enum TaskStatus {
  PENDING = 'pending',           // Waiting to be assigned
  ASSIGNED = 'assigned',         // Assigned but not started
  IN_PROGRESS = 'in_progress',   // Currently being worked on
  PAUSED = 'paused',            // Temporarily stopped
  COMPLETED = 'completed',       // Successfully finished
  FAILED = 'failed',            // Could not be completed
  CANCELLED = 'cancelled'        // Deliberately cancelled
}

export interface TaskAssignment {
  antId: string;
  taskId: string;
  assignedAt: number;
  startedAt?: number;
  expectedCompletion: number;
  progress: number;        // 0-1
  efficiency: number;      // How well the ant is performing
}

export interface ColonyTaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  taskEfficiency: number;  // Average efficiency across all tasks
  taskBacklog: number;     // Number of pending tasks
  criticalTasks: number;   // High priority pending tasks
}

/**
 * Advanced task assignment and management system
 */
export class TaskAssignmentSystem {
  private tasks: Map<string, Task>;
  private assignments: Map<string, TaskAssignment>;  // antId -> assignment
  private taskQueue: Map<TaskType, Task[]>;          // Organized by task type
  private casteSystem: CasteSystem;
  private taskHistory: TaskAssignment[];             // Completed assignments
  private nextTaskId: number;

  constructor(casteSystem: CasteSystem) {
    this.tasks = new Map();
    this.assignments = new Map();
    this.taskQueue = new Map();
    this.casteSystem = casteSystem;
    this.taskHistory = [];
    this.nextTaskId = 1;

    this.initializeTaskQueues();
  }

  private initializeTaskQueues(): void {
    // Initialize empty queues for each task type
    for (const taskType of this.casteSystem.getAllTasks()) {
      this.taskQueue.set(taskType, []);
    }
  }

  public createTask(
    type: TaskType,
    location: { x: number; y: number; z: number },
    priority: number = 0.5,
    requirements: Partial<TaskRequirements> = {}
  ): Task {
    const taskId = `task_${this.nextTaskId++}`;
    
    const task: Task = {
      id: taskId,
      type,
      priority: Math.max(0, Math.min(1, priority)),
      difficulty: this.calculateTaskDifficulty(type),
      estimatedDuration: this.estimateTaskDuration(type),
      location,
      requirements: {
        preferredCastes: this.getOptimalCastesForTask(type),
        minimumSkillLevel: 0.3,
        requiredTraits: new Map(),
        teamSize: 1,
        ...requirements
      },
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      dependencies: [],
      resources: this.getTaskResourceRequirements(type)
    };

    this.tasks.set(taskId, task);
    this.addToQueue(task);

    return task;
  }

  private calculateTaskDifficulty(type: TaskType): number {
    // Base difficulty for different task types
    const difficultyMap = new Map([
      [TaskType.CLEAN_NEST, 0.2],
      [TaskType.FORAGE, 0.6],
      [TaskType.DIG_TUNNELS, 0.7],
      [TaskType.FIGHT_INTRUDERS, 0.9],
      [TaskType.BUILD_CHAMBERS, 0.8],
      [TaskType.TEND_EGGS, 0.4],
      [TaskType.SCOUT, 0.7],
      [TaskType.REPAIR_TUNNELS, 0.6],
      [TaskType.GUARD_ENTRANCE, 0.5],
      [TaskType.LAY_EGGS, 0.3],
      [TaskType.HUNT, 0.8],
      [TaskType.NURSE_LARVAE, 0.5]
    ]);

    return difficultyMap.get(type) || 0.5;
  }

  private estimateTaskDuration(type: TaskType): number {
    // Estimated duration in seconds for different tasks
    const durationMap = new Map([
      [TaskType.CLEAN_NEST, 120],        // 2 minutes
      [TaskType.FORAGE, 600],            // 10 minutes
      [TaskType.DIG_TUNNELS, 1800],      // 30 minutes
      [TaskType.FIGHT_INTRUDERS, 60],    // 1 minute (intense but short)
      [TaskType.BUILD_CHAMBERS, 3600],   // 1 hour
      [TaskType.TEND_EGGS, 300],         // 5 minutes
      [TaskType.SCOUT, 900],             // 15 minutes
      [TaskType.REPAIR_TUNNELS, 600],    // 10 minutes
      [TaskType.GUARD_ENTRANCE, 1800],   // 30 minutes
      [TaskType.LAY_EGGS, 30],           // 30 seconds per egg
      [TaskType.HUNT, 1200],             // 20 minutes
      [TaskType.NURSE_LARVAE, 600]       // 10 minutes
    ]);

    return durationMap.get(type) || 300;
  }

  private getOptimalCastesForTask(type: TaskType): AntCaste[] {
    // Return castes sorted by efficiency for this task
    const allCastes = this.casteSystem.getAllCastes();
    
    return allCastes
      .filter(caste => this.casteSystem.canPerformTask(caste, type))
      .sort((a, b) => 
        this.casteSystem.calculateCasteEfficiency(b, type) - 
        this.casteSystem.calculateCasteEfficiency(a, type)
      );
  }

  private getTaskResourceRequirements(type: TaskType): ResourceRequirement[] {
    const requirements: ResourceRequirement[] = [];

    switch (type) {
      case TaskType.DIG_TUNNELS:
        requirements.push({ type: 'energy', amount: 10, consumed: true });
        break;
      case TaskType.BUILD_CHAMBERS:
        requirements.push(
          { type: 'building_material', amount: 5, consumed: true },
          { type: 'energy', amount: 15, consumed: true }
        );
        break;
      case TaskType.FORAGE:
        requirements.push({ type: 'energy', amount: 5, consumed: true });
        break;
      case TaskType.FEED_LARVAE:
        requirements.push({ type: 'food', amount: 1, consumed: true });
        break;
      case TaskType.FIGHT_INTRUDERS:
        requirements.push({ type: 'energy', amount: 20, consumed: true });
        break;
    }

    return requirements;
  }

  private addToQueue(task: Task): void {
    const queue = this.taskQueue.get(task.type);
    if (queue) {
      // Insert task in priority order
      const insertIndex = queue.findIndex(t => t.priority < task.priority);
      if (insertIndex === -1) {
        queue.push(task);
      } else {
        queue.splice(insertIndex, 0, task);
      }
    }
  }

  public assignTask(antId: string, antCaste: AntCaste, antSkillLevel: number = 0.5): Task | null {
    // Find the best task for this ant
    const availableTasks = this.getAvailableTasksForAnt(antCaste, antSkillLevel);
    
    if (availableTasks.length === 0) {
      return null;
    }

    // Score tasks based on priority, efficiency, and urgency
    const scoredTasks = availableTasks.map(task => ({
      task,
      score: this.calculateTaskScore(task, antCaste, antSkillLevel)
    }));

    // Sort by score (highest first)
    scoredTasks.sort((a, b) => b.score - a.score);

    const bestTask = scoredTasks[0].task;
    
    // Create assignment
    const assignment: TaskAssignment = {
      antId,
      taskId: bestTask.id,
      assignedAt: Date.now(),
      expectedCompletion: Date.now() + bestTask.estimatedDuration * 1000,
      progress: 0,
      efficiency: this.casteSystem.calculateCasteEfficiency(antCaste, bestTask.type)
    };

    this.assignments.set(antId, assignment);
    bestTask.status = TaskStatus.ASSIGNED;
    bestTask.assignedAntId = antId;

    // Remove from queue
    this.removeFromQueue(bestTask);

    return bestTask;
  }

  private getAvailableTasksForAnt(antCaste: AntCaste, antSkillLevel: number): Task[] {
    const availableTasks: Task[] = [];

    for (const queue of this.taskQueue.values()) {
      for (const task of queue) {
        if (task.status === TaskStatus.PENDING && 
            this.canAntPerformTask(antCaste, antSkillLevel, task)) {
          availableTasks.push(task);
        }
      }
    }

    return availableTasks;
  }

  private canAntPerformTask(antCaste: AntCaste, antSkillLevel: number, task: Task): boolean {
    // Check if ant meets task requirements
    const requirements = task.requirements;

    // Check caste compatibility
    if (requirements.minimumCaste && antCaste !== requirements.minimumCaste) {
      if (!requirements.preferredCastes.includes(antCaste)) {
        return false;
      }
    }

    // Check skill level
    if (antSkillLevel < requirements.minimumSkillLevel) {
      return false;
    }

    // Check if caste can perform this task type
    if (!this.casteSystem.canPerformTask(antCaste, task.type)) {
      return false;
    }

    // Check dependencies
    if (task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = this.tasks.get(depId);
        if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
          return false;
        }
      }
    }

    return true;
  }

  private calculateTaskScore(task: Task, antCaste: AntCaste, antSkillLevel: number): number {
    let score = 0;

    // Priority factor (0-1)
    score += task.priority * 0.4;

    // Efficiency factor
    const efficiency = this.casteSystem.calculateCasteEfficiency(antCaste, task.type);
    score += efficiency * 0.3;

    // Urgency factor (based on age and deadline)
    const age = Date.now() - task.createdAt;
    const urgency = Math.min(1, age / (24 * 60 * 60 * 1000)); // Normalize to days
    score += urgency * 0.2;

    // Skill match factor
    const skillMatch = Math.min(1, antSkillLevel / Math.max(0.1, task.requirements.minimumSkillLevel));
    score += skillMatch * 0.1;

    return score;
  }

  private removeFromQueue(task: Task): void {
    const queue = this.taskQueue.get(task.type);
    if (queue) {
      const index = queue.findIndex(t => t.id === task.id);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  public updateTaskProgress(antId: string, progress: number): void {
    const assignment = this.assignments.get(antId);
    if (assignment) {
      assignment.progress = Math.max(0, Math.min(1, progress));
      
      // Start timing if not already started
      if (!assignment.startedAt && progress > 0) {
        assignment.startedAt = Date.now();
      }

      // Check if task is completed
      if (progress >= 1.0) {
        this.completeTask(antId);
      }
    }
  }

  public completeTask(antId: string): void {
    const assignment = this.assignments.get(antId);
    if (!assignment) return;

    const task = this.tasks.get(assignment.taskId);
    if (!task) return;

    // Update task status
    task.status = TaskStatus.COMPLETED;
    assignment.progress = 1.0;

    // Calculate actual efficiency
    const actualDuration = Date.now() - (assignment.startedAt || assignment.assignedAt);
    const expectedDuration = task.estimatedDuration * 1000;
    assignment.efficiency = expectedDuration / actualDuration;

    // Move to history
    this.taskHistory.push({ ...assignment });

    // Clean up
    this.assignments.delete(antId);
    task.assignedAntId = undefined;
  }

  public failTask(antId: string, reason: string = 'Unknown'): void {
    const assignment = this.assignments.get(antId);
    if (!assignment) return;

    const task = this.tasks.get(assignment.taskId);
    if (!task) return;

    // Update status
    task.status = TaskStatus.FAILED;
    task.assignedAntId = undefined;

    // Add back to queue with higher priority
    task.priority = Math.min(1.0, task.priority + 0.1);
    task.status = TaskStatus.PENDING;
    this.addToQueue(task);

    // Clean up assignment
    this.assignments.delete(antId);
  }

  public cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Clean up assignment if exists
    if (task.assignedAntId) {
      this.assignments.delete(task.assignedAntId);
    }

    // Remove from queue
    this.removeFromQueue(task);

    // Update status
    task.status = TaskStatus.CANCELLED;

    return true;
  }

  public pauseTask(antId: string): void {
    const assignment = this.assignments.get(antId);
    if (!assignment) return;

    const task = this.tasks.get(assignment.taskId);
    if (task) {
      task.status = TaskStatus.PAUSED;
    }
  }

  public resumeTask(antId: string): void {
    const assignment = this.assignments.get(antId);
    if (!assignment) return;

    const task = this.tasks.get(assignment.taskId);
    if (task && task.status === TaskStatus.PAUSED) {
      task.status = TaskStatus.IN_PROGRESS;
    }
  }

  // Query methods

  public getTasksOfType(type: TaskType, status?: TaskStatus): Task[] {
    const tasks = Array.from(this.tasks.values()).filter(task => task.type === type);
    
    if (status !== undefined) {
      return tasks.filter(task => task.status === status);
    }
    
    return tasks;
  }

  public getTasksForAnt(antId: string): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.assignedAntId === antId);
  }

  public getCurrentAssignment(antId: string): TaskAssignment | undefined {
    return this.assignments.get(antId);
  }

  public getTaskMetrics(): ColonyTaskMetrics {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.COMPLETED);
    const failedTasks = allTasks.filter(t => t.status === TaskStatus.FAILED);
    const pendingTasks = allTasks.filter(t => t.status === TaskStatus.PENDING);
    const criticalTasks = pendingTasks.filter(t => t.priority > 0.8);

    const avgTaskTime = this.taskHistory.length > 0 
      ? this.taskHistory.reduce((sum, assignment) => {
          const duration = (assignment.startedAt || assignment.assignedAt) - assignment.assignedAt;
          return sum + duration;
        }, 0) / this.taskHistory.length
      : 0;

    const avgEfficiency = this.taskHistory.length > 0
      ? this.taskHistory.reduce((sum, assignment) => sum + assignment.efficiency, 0) / this.taskHistory.length
      : 0;

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageTaskTime: avgTaskTime / 1000, // Convert to seconds
      taskEfficiency: avgEfficiency,
      taskBacklog: pendingTasks.length,
      criticalTasks: criticalTasks.length
    };
  }

  public getHighPriorityTasks(minimumPriority: number = 0.7): Task[] {
    return Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PENDING && task.priority >= minimumPriority)
      .sort((a, b) => b.priority - a.priority);
  }

  public getTaskById(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  public getActiveAssignments(): TaskAssignment[] {
    return Array.from(this.assignments.values());
  }

  // Task management utilities

  public addTaskDependency(taskId: string, dependencyId: string): boolean {
    const task = this.tasks.get(taskId);
    const dependency = this.tasks.get(dependencyId);
    
    if (!task || !dependency) return false;
    
    if (!task.dependencies.includes(dependencyId)) {
      task.dependencies.push(dependencyId);
    }
    
    return true;
  }

  public updateTaskPriority(taskId: string, newPriority: number): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.priority = Math.max(0, Math.min(1, newPriority));

    // Re-sort queue if task is still pending
    if (task.status === TaskStatus.PENDING) {
      this.removeFromQueue(task);
      this.addToQueue(task);
    }

    return true;
  }

  public createEmergencyTask(
    type: TaskType,
    location: { x: number; y: number; z: number },
    urgencyLevel: number = 1.0
  ): Task {
    const task = this.createTask(type, location, urgencyLevel);
    
    // Emergency tasks get processed immediately
    task.priority = 1.0;
    task.deadline = Date.now() + (5 * 60 * 1000); // 5 minute deadline
    
    return task;
  }

  public optimizeTaskDistribution(): void {
    // Rebalance task queues based on current colony state
    // This could include redistributing priorities, merging similar tasks, etc.
    
    for (const [taskType, queue] of this.taskQueue) {
      // Sort by priority
      queue.sort((a, b) => b.priority - a.priority);
      
      // Merge similar location-based tasks if beneficial
      this.mergeSimilarTasks(queue);
    }
  }

  private mergeSimilarTasks(queue: Task[]): void {
    // Simple implementation: merge tasks of same type at nearby locations
    for (let i = 0; i < queue.length - 1; i++) {
      for (let j = i + 1; j < queue.length; j++) {
        const taskA = queue[i];
        const taskB = queue[j];
        
        if (this.canMergeTasks(taskA, taskB)) {
          // Create a combined task
          const mergedTask = this.createMergedTask(taskA, taskB);
          
          // Remove original tasks
          this.tasks.delete(taskA.id);
          this.tasks.delete(taskB.id);
          queue.splice(j, 1);
          queue.splice(i, 1);
          
          // Add merged task
          this.tasks.set(mergedTask.id, mergedTask);
          queue.push(mergedTask);
          
          return; // Only merge one pair per call to avoid complexity
        }
      }
    }
  }

  private canMergeTasks(taskA: Task, taskB: Task): boolean {
    // Check if tasks can be merged
    if (taskA.type !== taskB.type) return false;
    if (taskA.status !== TaskStatus.PENDING || taskB.status !== TaskStatus.PENDING) return false;
    
    // Check location proximity
    const distance = Math.sqrt(
      Math.pow(taskA.location.x - taskB.location.x, 2) +
      Math.pow(taskA.location.y - taskB.location.y, 2) +
      Math.pow(taskA.location.z - taskB.location.z, 2)
    );
    
    return distance < 5.0; // Within 5 units
  }

  private createMergedTask(taskA: Task, taskB: Task): Task {
    // Create a new task that combines both tasks
    const midpoint = {
      x: (taskA.location.x + taskB.location.x) / 2,
      y: (taskA.location.y + taskB.location.y) / 2,
      z: (taskA.location.z + taskB.location.z) / 2
    };

    return this.createTask(
      taskA.type,
      midpoint,
      Math.max(taskA.priority, taskB.priority),
      {
        ...taskA.requirements,
        teamSize: taskA.requirements.teamSize + taskB.requirements.teamSize
      }
    );
  }
}