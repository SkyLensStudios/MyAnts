/**
 * Main React Application Component
 * Handles the entire simulation interface and WebGL rendering
 */

import React, { useEffect, useState, useCallback } from 'react';
import { SimulationState, AntRenderData, PerformanceStats, SimulationConfig, PheromoneRenderData, EnvironmentRenderData } from '../shared/types';
import { AntSpecies } from '../shared/types';
import { SimulationMode, ModeConversionUtils } from '../shared/types-unified';
import SimulationControls from './components/SimulationControls';
import DataPanel from './components/DataPanel';
import Canvas2DRendererComponent from './components/Canvas2DRenderer';
import AdvancedThreeJSRenderer from './components/AdvancedThreeJSRenderer';
import PerformanceMonitor from './components/PerformanceMonitor';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const App: React.FC = () => {
  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [antData, setAntData] = useState<AntRenderData[]>([]);
  const [pheromoneData, setPheromoneData] = useState<PheromoneRenderData[]>([]);
  const [environmentData, setEnvironmentData] = useState<EnvironmentRenderData | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // UI state
  const [showDataPanel, setShowDataPanel] = useState(true);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);
  const [selectedAnt, setSelectedAnt] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<SimulationMode>(SimulationMode.MODE_2D);

  // Check if Electron API is available
  useEffect(() => {
    if (window.electronAPI) {
      setIsConnected(true);
      console.log('Electron API connected');
    } else {
      console.error('Electron API not available - running in browser mode');
    }
  }, []);

  // Set up simulation update listener
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribe = window.electronAPI.events.onSimulationUpdate((update: any) => {
      if (update.stateChanges) {
        setSimulationState((prev: any) => ({ ...prev, ...update.stateChanges }));
      }
    });

    return unsubscribe;
  }, []);

  // Periodic data updates
  useEffect(() => {
    if (!window.electronAPI) return;

    const updateInterval = setInterval(async () => {
      try {
        // Get simulation state
        const state = await window.electronAPI.data.getSimulationState();
        if (state) {
          setSimulationState(state);
        }

        // Get ant data
        const ants = await window.electronAPI.data.getAntData();
        if (ants) {
          console.log(`Received ${ants.length} ants from simulation`);
          setAntData(ants);
        } else {
          console.log('No ant data received from simulation');
        }

        // Get pheromone data
        const pheromones = await window.electronAPI.data.getPheromoneData();
        if (pheromones) {
          setPheromoneData(pheromones);
        }

        // Get environment data
        const environment = await window.electronAPI.data.getEnvironmentData();
        if (environment) {
          setEnvironmentData(environment);
        }

        // Get performance stats
        const stats = await window.electronAPI.data.getPerformanceStats();
        if (stats) {
          setPerformanceStats(stats);
        }
      } catch (error) {
        console.error('Failed to update data:', error);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(updateInterval);
  }, []);

  // Mode switching handlers
  const handleSwitchTo2D = useCallback(async () => {
    setRenderMode(SimulationMode.MODE_2D);
    console.log('Switched to 2D mode');
  }, []);

  const handleSwitchTo3D = useCallback(async () => {
    setRenderMode(SimulationMode.MODE_3D);
    console.log('Switched to 3D mode');
  }, []);

  // Simulation control handlers
  const handleStartSimulation = useCallback(async () => {
    if (!window.electronAPI) return;

    try {
      console.log('Starting simulation...');
      const success = await window.electronAPI.simulation.start();
      if (success) {
        console.log('Simulation started successfully');

        // Immediately check if we get data after starting
        setTimeout(async () => {
          const ants = await window.electronAPI.data.getAntData();
          console.log('Initial ant data check:', ants ? ants.length : 'none');
        }, 1000);
      } else {
        console.error('Failed to start simulation');
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  }, []);

  const handlePauseSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.pause();
      if (success) {
        console.log('Simulation paused');
      }
    } catch (error) {
      console.error('Error pausing simulation:', error);
    }
  }, []);

  const handleResetSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.reset();
      if (success) {
        console.log('Simulation reset');
        setAntData([]);
        setSelectedAnt(null);
      }
    } catch (error) {
      console.error('Error resetting simulation:', error);
    }
  }, []);

  const handleConfigureSimulation = useCallback(async (config: SimulationConfig) => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.configure(config);
      if (success) {
        console.log('Simulation configured', config);
      }
    } catch (error) {
      console.error('Error configuring simulation:', error);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    if (!window.electronAPI) return;
    
    window.electronAPI.simulation.setSpeed(speed);
  }, []);

  // File operation handlers
  const handleSaveSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const filePath = await window.electronAPI.file.saveSimulation();
      if (filePath) {
        console.log('Simulation saved to:', filePath);
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
    }
  }, []);

  const handleLoadSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.file.loadSimulation();
      if (success) {
        console.log('Simulation loaded');
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
    }
  }, []);

  // Render fallback if not connected to Electron
  if (!isConnected) {
    return (
      <div className="app app--disconnected">
        <div className="error-message">
          <h1>Hyper-Realistic Ant Farm Simulator</h1>
          <p>This application requires Electron to run properly.</p>
          <p>Please run the application through Electron instead of a web browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hyper-Realistic Ant Farm Simulator</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="app-main">
        {/* Simulation Controls */}
        <div 
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            right: (showDataPanel || showPerformanceMonitor) ? '320px' : '1rem',
            zIndex: 1001,
            transition: 'right 0.3s ease',
            pointerEvents: 'none'
          }}
        >
          <div style={{ pointerEvents: 'auto', display: 'inline-block' }}>
            <SimulationControls
              simulationState={simulationState}
              onStart={handleStartSimulation}
              onPause={handlePauseSimulation}
              onReset={handleResetSimulation}
              onConfigure={handleConfigureSimulation}
              onSpeedChange={handleSpeedChange}
              onSave={handleSaveSimulation}
              onLoad={handleLoadSimulation}
            />
            
            {/* Render Mode Toggle */}
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              background: 'rgba(0,0,0,0.7)', 
              borderRadius: '5px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '12px' }}>Render Mode:</span>
              <button
                onClick={handleSwitchTo2D}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: renderMode === SimulationMode.MODE_2D ? '#4CAF50' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                2D
              </button>
              <button
                onClick={handleSwitchTo3D}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: renderMode === SimulationMode.MODE_3D ? '#4CAF50' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                3D
              </button>
            </div>
          </div>
        </div>

        {/* Main visualization area */}
        <div 
          className="visualization-container" 
          style={{
            marginRight: (showDataPanel || showPerformanceMonitor) ? '300px' : '0',
            transition: 'margin-right 0.3s ease'
          }}
        >
          <ErrorBoundary fallback={
            <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>
              <h3>Renderer Error</h3>
              <p>The visualization failed to load. Please try switching render modes.</p>
              <button onClick={handleSwitchTo2D} style={{ margin: '10px' }}>Try 2D Mode</button>
              <button onClick={handleSwitchTo3D} style={{ margin: '10px' }}>Try 3D Mode</button>
            </div>
          }>
            {renderMode === SimulationMode.MODE_2D ? (
              <Canvas2DRendererComponent
                width={window.innerWidth - (showDataPanel || showPerformanceMonitor ? 300 : 0)}
                height={window.innerHeight - 60}
                simulationData={{
                  timestamp: Date.now(),
                  mode: SimulationMode.MODE_2D,
                  antData: antData.map(ant => ({
                    id: ant.id,
                    position: { x: ant.position.x, y: ant.position.y },
                    rotation: ant.rotation,
                    scale: { x: ant.scale?.x || 1, y: ant.scale?.y || 1 },
                    caste: ant.caste,
                    health: ant.health,
                    energy: ant.energy,
                    carryingFood: ant.carryingFood,
                    currentTask: ant.task || 'exploring',
                    age: ant.age,
                    color: { r: 0.54, g: 0.27, b: 0.07, a: 1.0 }, // Brown ant color
                    visible: true,
                    generation: ant.generation || 1,
                    animationState: 0,
                    lodLevel: 0
                  })),
                  pheromoneData: [], // Simplified for now - will convert pheromone grid data later
                  environmentData: [{
                    position: { x: 0, y: 0 },
                    size: { x: 1000, y: 1000 },
                    type: 'nest',
                    properties: {}
                  }],
                  deltaTime: 16.67,
                  performanceMetrics: performanceStats ? {
                    fps: performanceStats.fps,
                    frameTime: performanceStats.frameTime,
                    antCount: antData.length
                  } : undefined
                }}
                config={{
                  enableBackgroundGrid: true,
                  enablePerformanceOptimizations: true,
                  cullingEnabled: true,
                  batchSize: 100,
                  maxAntsToRender: 5000,
                  antSize: 4,
                  pheromoneAlpha: 0.7,
                  enableAntiAliasing: true,
                  enablePheromoneVisualizations: true,
                  enableEnvironmentObjects: true,
                  backgroundColor: '#2a2a2a',
                  gridColor: '#444444'
                }}
                onCameraChange={(camera) => console.log('Camera changed:', camera)}
                onMetricsUpdate={(metrics) => console.log('2D Metrics:', metrics)}
              />
            ) : (
              <AdvancedThreeJSRenderer
                antData={antData}
                pheromoneData={pheromoneData}
                environmentData={environmentData || { tunnels: [], foodSources: [], obstacles: [], plants: [], soilMoisture: new Float32Array(), temperature: new Float32Array(), weatherState: { temperature: 20, humidity: 0.5, pressure: 101.3, windSpeed: 0, windDirection: 0, precipitation: 0, cloudCover: 0, visibility: 1000, uvIndex: 5 }}}
                simulationState={simulationState || { isRunning: false, isPaused: false, currentTime: 0, realTimeElapsed: 0, timeScale: 1, totalAnts: 0, livingAnts: 0, deadAnts: 0, colonyAge: 0, season: 'spring', dayPhase: 'day', temperature: 20, humidity: 0.5, foodStores: 0, currentGeneration: 1 }}
                onAntSelected={setSelectedAnt}
                selectedAnt={selectedAnt}
              />
            )}
          </ErrorBoundary>
        </div>

        {/* Side panels */}
        {(showDataPanel || showPerformanceMonitor) && (
          <div className="side-panels" style={{ 
            position: 'fixed', 
            right: 0, 
            top: '60px', 
            bottom: 0, 
            width: '300px',
            zIndex: 900,
            backgroundColor: '#2a2a2a',
            borderLeft: '2px solid #444',
            overflowY: 'auto'
          }}>
            {showDataPanel && (
              <ErrorBoundary>
                <DataPanel
                  simulationState={simulationState}
                  antData={antData}
                  selectedAnt={selectedAnt}
                  onClose={() => setShowDataPanel(false)}
                />
              </ErrorBoundary>
            )}

            {showPerformanceMonitor && (
              <ErrorBoundary>
                <PerformanceMonitor
                  stats={performanceStats}
                  onClose={() => setShowPerformanceMonitor(false)}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
      </main>

      {/* Toggle buttons for panels */}
      <div className="panel-toggles">
        <button
          className={`toggle-button ${showDataPanel ? 'active' : ''}`}
          onClick={() => setShowDataPanel(!showDataPanel)}
          title="Toggle Data Panel"
        >
          📊
        </button>
        <button
          className={`toggle-button ${showPerformanceMonitor ? 'active' : ''}`}
          onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          title="Toggle Performance Monitor"
        >
          📈
        </button>
      </div>
    </div>
  );
};

export default App;