/**
 * Main React Application Component
 * Handles the entire simulation interface and WebGL rendering
 */

import React, { useEffect, useState, useCallback } from 'react';
import { SimulationState, AntRenderData, PerformanceStats, SimulationConfig, PheromoneRenderData, EnvironmentRenderData } from '../shared/types';
import { AntSpecies } from '../shared/types';
import SimulationControls from './components/SimulationControls';
import DataPanel from './components/DataPanel';
import AdvancedThreeJSRenderer from './components/SimpleThreeJSRenderer';
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

        {/* Main visualization area */}
        <div className="visualization-container">
          <ErrorBoundary fallback={
            <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>
              <h3>3D Renderer Error</h3>
              <p>The 3D visualization failed to load. This may be due to WebGL compatibility issues.</p>
            </div>
          }>
            <AdvancedThreeJSRenderer
              antData={antData}
              pheromoneData={pheromoneData}
              environmentData={environmentData}
              simulationState={simulationState}
              onAntSelected={setSelectedAnt}
              selectedAnt={selectedAnt}
            />
          </ErrorBoundary>
        </div>

        {/* Side panels */}
        <div className="side-panels">
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