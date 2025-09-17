/**
 * Electron Main Process
 * Handles simulation engine, file I/O, and IPC communication
 */

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { SimulationEngine } from './simulation/SimulationEngine';
import { IPCChannels } from '../shared/IPCChannels';
import { SimulationConfig, SimulationState } from '../shared/types';

class AntFarmApplication {
  private mainWindow: BrowserWindow | null = null;
  private simulationEngine: SimulationEngine | null = null;
  private isSimulationRunning = false;
  private static instance: AntFarmApplication | null = null;

  constructor() {
    console.log('ElectronApp constructor called');
    if (AntFarmApplication.instance) {
      console.log('Instance already exists, returning existing instance');
      return AntFarmApplication.instance;
    }
    
    AntFarmApplication.instance = this;
    this.setupElectronEvents();
    this.setupIPCHandlers();
  }

  private setupElectronEvents(): void {
    console.log('Setting up Electron events...');
    app.whenReady().then(() => {
      console.log('App is ready, creating main window...');
      this.createMainWindow();
      this.setupApplicationMenu();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.stopSimulation();
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.stopSimulation();
    });
  }

  private createMainWindow(): void {
    console.log('Creating main window...');
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Disable sandbox to avoid permission issues in development
        preload: path.join(__dirname, '../preload/preload.js'),
        // Enable SharedArrayBuffer for high-performance data transfer
        additionalArguments: ['--enable-features=SharedArrayBuffer'],
      },
      title: 'Hyper-Realistic Ant Farm Simulator',
      icon: path.join(__dirname, '../../../assets/icon.png'),
      show: false, // Show after ready-to-show to prevent visual flash
    });

    console.log('Window created, loading content...');
    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading development URL...');
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      const htmlPath = path.join(__dirname, '../../../dist/index.html');
      console.log('Loading HTML file:', htmlPath);
      this.mainWindow.loadFile(htmlPath);
    }

    this.mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show, making visible...');
      this.mainWindow?.show();
      this.mainWindow?.focus();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      this.stopSimulation();
    });
  }

  private setupApplicationMenu(): void {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Simulation',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewSimulation(),
          },
          {
            label: 'Load Simulation',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleLoadSimulation(),
          },
          {
            label: 'Save Simulation',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSaveSimulation(),
          },
          { type: 'separator' },
          {
            label: 'Export Data',
            submenu: [
              { label: 'Export as CSV' },
              { label: 'Export as JSON' },
              { label: 'Export Screenshots' },
            ],
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Simulation',
        submenu: [
          {
            label: 'Start/Resume',
            accelerator: 'Space',
            click: () => this.startSimulation(),
          },
          {
            label: 'Pause',
            accelerator: 'CmdOrCtrl+Space',
            click: () => this.pauseSimulation(),
          },
          {
            label: 'Reset',
            click: () => this.resetSimulation(),
          },
          { type: 'separator' },
          {
            label: 'Speed 1x',
            accelerator: '1',
            click: () => this.setSimulationSpeed(1),
          },
          {
            label: 'Speed 10x',
            accelerator: '2',
            click: () => this.setSimulationSpeed(10),
          },
          {
            label: 'Speed 100x',
            accelerator: '3',
            click: () => this.setSimulationSpeed(100),
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private setupIPCHandlers(): void {
    // Simulation control
    ipcMain.handle(IPCChannels.SIMULATION_START, this.handleStartSimulation.bind(this));
    ipcMain.handle(IPCChannels.SIMULATION_PAUSE, this.handlePauseSimulation.bind(this));
    ipcMain.handle(IPCChannels.SIMULATION_RESET, this.handleResetSimulation.bind(this));
    ipcMain.handle(IPCChannels.SIMULATION_CONFIG, this.handleConfigureSimulation.bind(this));

    // Data queries
    ipcMain.handle(IPCChannels.GET_SIMULATION_STATE, this.handleGetSimulationState.bind(this));
    ipcMain.handle(IPCChannels.GET_ANT_DATA, this.handleGetAntData.bind(this));
    ipcMain.handle(IPCChannels.GET_PHEROMONE_DATA, this.handleGetPheromoneData.bind(this));
    ipcMain.handle(IPCChannels.GET_ENVIRONMENT_DATA, this.handleGetEnvironmentData.bind(this));

    // File operations
    ipcMain.handle(IPCChannels.SAVE_SIMULATION, this.handleSaveSimulation.bind(this));
    ipcMain.handle(IPCChannels.LOAD_SIMULATION, this.handleLoadSimulation.bind(this));
    ipcMain.handle(IPCChannels.EXPORT_DATA, this.handleExportData.bind(this));

    // Performance monitoring
    ipcMain.handle(IPCChannels.GET_PERFORMANCE_STATS, this.handleGetPerformanceStats.bind(this));
  }

  // Simulation control handlers
  private async handleStartSimulation(): Promise<boolean> {
    try {
      console.log('IPC: Start simulation requested');
      if (!this.simulationEngine) {
        console.log('Creating new simulation engine...');
        this.simulationEngine = new SimulationEngine();
      }

      this.isSimulationRunning = true;
      this.simulationEngine.start();
      
      // Start the simulation update loop
      this.startSimulationLoop();
      
      console.log('Simulation started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start simulation:', error);
      return false;
    }
  }

  private async handlePauseSimulation(): Promise<boolean> {
    try {
      this.isSimulationRunning = false;
      this.simulationEngine?.pause();
      console.log('Simulation paused');
      return true;
    } catch (error) {
      console.error('Failed to pause simulation:', error);
      return false;
    }
  }

  private async handleResetSimulation(): Promise<boolean> {
    try {
      this.isSimulationRunning = false;
      this.simulationEngine?.reset();
      console.log('Simulation reset');
      return true;
    } catch (error) {
      console.error('Failed to reset simulation:', error);
      return false;
    }
  }

  private async handleConfigureSimulation(event: any, config: SimulationConfig): Promise<boolean> {
    try {
      if (!this.simulationEngine) {
        this.simulationEngine = new SimulationEngine();
      }
      
      this.simulationEngine.configure(config);
      console.log('Simulation configured:', config);
      return true;
    } catch (error) {
      console.error('Failed to configure simulation:', error);
      return false;
    }
  }

  // Data query handlers
  private async handleGetSimulationState(): Promise<SimulationState | null> {
    try {
      return this.simulationEngine?.getState() || null;
    } catch (error) {
      console.error('Failed to get simulation state:', error);
      return null;
    }
  }

  private async handleGetAntData(): Promise<any> {
    try {
      console.log('IPC: Getting ant data...');
      const result = this.simulationEngine?.getAntData() || [];
      console.log(`IPC: Returning ${result.length} ants`);
      return result;
    } catch (error) {
      console.error('Failed to get ant data:', error);
      return null;
    }
  }

  private async handleGetPheromoneData(): Promise<any> {
    try {
      return this.simulationEngine?.getPheromoneData() || null;
    } catch (error) {
      console.error('Failed to get pheromone data:', error);
      return null;
    }
  }

  private async handleGetEnvironmentData(): Promise<any> {
    try {
      return this.simulationEngine?.getEnvironmentData() || null;
    } catch (error) {
      console.error('Failed to get environment data:', error);
      return null;
    }
  }

  // File operation handlers
  private async handleSaveSimulation(): Promise<string | null> {
    try {
      // TODO: Implement save dialog and file writing
      console.log('Save simulation requested');
      return null;
    } catch (error) {
      console.error('Failed to save simulation:', error);
      return null;
    }
  }

  private async handleLoadSimulation(): Promise<boolean> {
    try {
      // TODO: Implement load dialog and file reading
      console.log('Load simulation requested');
      return false;
    } catch (error) {
      console.error('Failed to load simulation:', error);
      return false;
    }
  }

  private async handleExportData(event: any, format: 'csv' | 'json'): Promise<string | null> {
    try {
      // TODO: Implement data export
      console.log('Export data requested:', format);
      return null;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  private async handleGetPerformanceStats(): Promise<any> {
    try {
      return {
        fps: this.simulationEngine?.getPerformanceStats().fps || 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        antCount: this.simulationEngine?.getAntCount() || 0,
      };
    } catch (error) {
      console.error('Failed to get performance stats:', error);
      return null;
    }
  }

  // Simulation loop management
  private startSimulationLoop(): void {
    const simulationLoop = () => {
      if (this.isSimulationRunning && this.simulationEngine && this.mainWindow) {
        try {
          // Update simulation
          this.simulationEngine.update();
          
          // Send batched updates to renderer (non-blocking)
          this.sendSimulationUpdates();
          
        } catch (error) {
          console.error('Simulation loop error:', error);
          this.isSimulationRunning = false;
        }
      }
      
      if (this.isSimulationRunning) {
        setImmediate(simulationLoop);
      }
    };
    
    setImmediate(simulationLoop);
  }

  private sendSimulationUpdates(): void {
    if (!this.mainWindow || !this.simulationEngine) return;
    
    try {
      // Send critical updates via IPC
      const updates = this.simulationEngine.getUpdates();
      
      this.mainWindow.webContents.send(IPCChannels.SIMULATION_UPDATE, updates);
      
    } catch (error) {
      console.error('Failed to send simulation updates:', error);
    }
  }

  // Menu action handlers
  private handleNewSimulation(): void {
    this.mainWindow?.webContents.send(IPCChannels.UI_NEW_SIMULATION);
  }

  private startSimulation(): void {
    this.handleStartSimulation();
  }

  private pauseSimulation(): void {
    this.handlePauseSimulation();
  }

  private resetSimulation(): void {
    this.handleResetSimulation();
  }

  private setSimulationSpeed(speed: number): void {
    this.simulationEngine?.setSpeed(speed);
    this.mainWindow?.webContents.send(IPCChannels.SIMULATION_SPEED_CHANGED, speed);
  }

  private stopSimulation(): void {
    this.isSimulationRunning = false;
    this.simulationEngine?.stop();
  }
}

// Create the application instance
console.log('Starting Electron app...');
if (require.main === module) {
  new AntFarmApplication();
}
new AntFarmApplication();