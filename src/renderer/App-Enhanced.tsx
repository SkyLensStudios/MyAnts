/**
 * Enhanced App Component with 2D/3D Mode Support
 * Supports both 2D Canvas and 3D Three.js rendering modes
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  SimulationMode, 
  UnifiedSimulationUpdate,
  SimulationConfig,
  UnifiedAntRenderData,
  UnifiedPheromoneRenderData,
  UnifiedEnvironmentRenderData,
  PerformanceStats,
  SimulationState,
  ConfigurationUtils,
  isSimulationMode2D
} from '../shared/types-unified';
import { AntSpecies } from '../shared/types';
import SimulationControls from './components/SimulationControls';
import DataPanel from './components/DataPanel';
import AdvancedThreeJSRenderer from './components/AdvancedThreeJSRenderer';
import Canvas2DRendererComponent from './components/Canvas2DRenderer';
import PerformanceMonitor from './components/PerformanceMonitor';
import ErrorBoundary from './components/ErrorBoundary';
import { Camera2D } from './Canvas2DRenderer';
import { RenderMetrics2D } from './Canvas2DRenderer';
import './App.css';

const App: React.FC = () => {
  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [simulationData, setSimulationData] = useState<UnifiedSimulationUpdate | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Rendering mode state
  const [renderMode, setRenderMode] = useState<SimulationMode>(SimulationMode.MODE_2D);
  const [camera2D, setCamera2D] = useState<Camera2D>({
    position: { x: 0, y: 0 },
    zoom: 1.0,
    rotation: 0,
    viewportWidth: 800,
    viewportHeight: 600
  });
  const [renderMetrics2D, setRenderMetrics2D] = useState<RenderMetrics2D | null>(null);

  // UI state
  const [showDataPanel, setShowDataPanel] = useState(true);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);
  const [selectedAnt, setSelectedAnt] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });

  // Check if Electron API is available
  useEffect(() => {
    if (window.electronAPI) {
      setIsConnected(true);
      console.log('Electron API connected');
    } else {
      console.error('Electron API not available - running in browser mode');
    }
  }, []);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('renderer-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up simulation update listener
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribe = window.electronAPI.events.onSimulationUpdate((update: UnifiedSimulationUpdate) => {
      setSimulationData(update);
      
      // Update simulation state from the update
      if (update) {
        setSimulationState(prev => ({
          ...prev,
          isRunning: true,
          mode: update.mode,
          currentTime: update.timestamp,
          stepCount: (prev?.stepCount || 0) + 1
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Periodic data updates (fallback for when events aren't working)
  useEffect(() => {
    if (!window.electronAPI) return;

    const updateInterval = setInterval(async () => {
      try {
        // Get simulation state
        const state = await window.electronAPI.data.getSimulationState();
        if (state) {
          setSimulationState(state);
          // Update render mode based on simulation state
          if (state.mode && state.mode !== renderMode) {
            setRenderMode(state.mode);
          }
        }

        // Get unified simulation data
        if (window.electronAPI.data.getUnifiedSimulationData) {
          const data = await window.electronAPI.data.getUnifiedSimulationData();
          if (data) {
            setSimulationData(data);
          }
        } else {
          // Fallback to individual data fetching
          const antData = await window.electronAPI.data.getAntData();
          const pheromoneData = await window.electronAPI.data.getPheromoneData();
          const environmentData = await window.electronAPI.data.getEnvironmentData();
          
          if (antData || pheromoneData || environmentData) {
            const unifiedData: UnifiedSimulationUpdate = {
              timestamp: Date.now(),
              mode: renderMode,
              antData: antData || [],
              pheromoneData: pheromoneData || [],
              environmentData: environmentData ? [environmentData] : [],
              deltaTime: 16.67 // ~60fps
            };
            setSimulationData(unifiedData);
          }
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
  }, [renderMode]);

  // Simulation control handlers
  const handleStartSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.start();
      if (success) {
        console.log('Simulation started successfully');
      } else {
        console.error('Failed to start simulation');
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  }, []);

  const handleStopSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.stop();
      if (success) {
        console.log('Simulation stopped successfully');
      } else {
        console.error('Failed to stop simulation');
      }
    } catch (error) {
      console.error('Error stopping simulation:', error);
    }
  }, []);

  const handlePauseSimulation = useCallback(async () => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.pause();
      if (success) {
        console.log('Simulation paused successfully');
      } else {
        console.error('Failed to pause simulation');
      }
    } catch (error) {
      console.error('Error pausing simulation:', error);
    }
  }, []);

  const handleConfigureSimulation = useCallback(async (config: SimulationConfig) => {
    if (!window.electronAPI) return;
    
    try {
      const success = await window.electronAPI.simulation.configure(config);
      if (success) {
        console.log('Simulation configured successfully', config);
        
        // Update render mode if it changed
        if (config.mode !== renderMode) {
          setRenderMode(config.mode);
        }
      } else {
        console.error('Failed to configure simulation');
      }
    } catch (error) {
      console.error('Error configuring simulation:', error);
    }
  }, [renderMode]);

  // Mode switching handlers
  const handleSwitchTo2D = useCallback(async () => {
    const config = ConfigurationUtils.getDefault2DConfig();
    const currentConfig: SimulationConfig = {
      mode: SimulationMode.MODE_2D,
      timeScale: 1,
      colonySize: 100,
      environmentSize: 10000,
      seasonLength: 300,
      speciesType: AntSpecies.LEAFCUTTER,
      complexityLevel: 2,
      enablePhysics: false,
      enableWeather: true,
      enableGenetics: true,
      enableLearning: true,
      maxAnts: 5000,
      worldSeed: 12345,
      render3D: false,
      enableAdvancedRendering: false,
      ...config
    };
    
    await handleConfigureSimulation(currentConfig);
  }, [handleConfigureSimulation]);

  const handleSwitchTo3D = useCallback(async () => {
    const config = ConfigurationUtils.getDefault3DConfig();
    const currentConfig: SimulationConfig = {
      mode: SimulationMode.MODE_3D,
      timeScale: 1,
      colonySize: 100,
      environmentSize: 10000,
      seasonLength: 300,
      speciesType: AntSpecies.LEAFCUTTER,
      complexityLevel: 3,
      enablePhysics: true,
      enableWeather: true,
      enableGenetics: true,
      enableLearning: true,
      maxAnts: 5000,
      worldSeed: 12345,
      render3D: true,
      enableAdvancedRendering: true,
      ...config
    };
    
    await handleConfigureSimulation(currentConfig);
  }, [handleConfigureSimulation]);

  // Ant selection handler
  const handleAntClick = useCallback((antId: string) => {
    setSelectedAnt(antId);
  }, []);

  // Camera update handlers
  const handleCamera2DChange = useCallback((camera: Camera2D) => {
    setCamera2D(camera);
  }, []);

  const handleRenderMetrics2DUpdate = useCallback((metrics: RenderMetrics2D) => {
    setRenderMetrics2D(metrics);
  }, []);

  // Render the appropriate renderer based on mode
  const renderRenderer = () => {
    if (isSimulationMode2D(renderMode)) {
      return (
        <Canvas2DRendererComponent
          width={viewportSize.width}
          height={viewportSize.height}
          simulationData={simulationData || undefined}
          onCameraChange={handleCamera2DChange}
          onMetricsUpdate={handleRenderMetrics2DUpdate}
          enableControls={true}
          config={{
            enableAntiAliasing: true,
            enableBackgroundGrid: true,
            enablePheromoneVisualizations: true,
            enableEnvironmentObjects: true,
            maxAntsToRender: 10000,
            antSize: 4,
            backgroundColor: '#1a1a1a',
            enablePerformanceOptimizations: true
          }}
        />
      );
    } else {
      return (
        <AdvancedThreeJSRenderer
          width={viewportSize.width}
          height={viewportSize.height}
          antData={simulationData?.antData || []}
          pheromoneData={simulationData?.pheromoneData || []}
          environmentData={simulationData?.environmentData[0] || null}
          onAntClick={handleAntClick}
        />
      );
    }
  };

  // Determine which metrics to show
  const getCurrentMetrics = () => {
    if (isSimulationMode2D(renderMode) && renderMetrics2D) {
      return {
        fps: renderMetrics2D.fps,
        frameTime: renderMetrics2D.frameTime,
        antCount: renderMetrics2D.antsRendered,
        additionalInfo: {
          pheromonesRendered: renderMetrics2D.pheromonesRendered,
          culledObjects: renderMetrics2D.culledObjects,
          drawCalls: renderMetrics2D.totalDrawCalls
        }
      };
    }
    return performanceStats;
  };

  if (!isConnected) {
    return (
      <div className="app">
        <div className="connection-error">
          <h2>Connection Error</h2>
          <p>Could not connect to Electron API. Please run the application through Electron.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {/* Header with mode switcher */}
        <div className="app-header">
          <h1>MyAnts - Ant Colony Simulator</h1>
          <div className="mode-switcher">
            <button 
              className={`mode-button ${renderMode === SimulationMode.MODE_2D ? 'active' : ''}`}
              onClick={handleSwitchTo2D}
            >
              2D Mode
            </button>
            <button 
              className={`mode-button ${renderMode === SimulationMode.MODE_3D ? 'active' : ''}`}
              onClick={handleSwitchTo3D}
            >
              3D Mode
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="app-content">
          {/* Left panel - Controls */}
          <div className="left-panel">
            <SimulationControls
              onStart={handleStartSimulation}
              onStop={handleStopSimulation}
              onPause={handlePauseSimulation}
              onConfigure={handleConfigureSimulation}
              simulationState={simulationState}
              isConnected={isConnected}
            />
            
            {showPerformanceMonitor && (
              <PerformanceMonitor 
                stats={getCurrentMetrics()}
                renderMode={renderMode}
              />
            )}
          </div>

          {/* Center - Renderer */}
          <div 
            id="renderer-container"
            className="renderer-container"
            style={{ position: 'relative', flex: 1 }}
          >
            {renderRenderer()}
            
            {/* Overlay info */}
            <div className="renderer-overlay">
              <div className="mode-indicator">
                {renderMode === SimulationMode.MODE_2D ? '2D Canvas' : '3D WebGL'} Renderer
              </div>
              {simulationData && (
                <div className="data-info">
                  Ants: {simulationData.antData.length} | 
                  Pheromones: {simulationData.pheromoneData.length} |
                  Environment: {simulationData.environmentData.length}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Data */}
          {showDataPanel && (
            <div className="right-panel">
              <DataPanel
                simulationState={simulationState}
                antData={simulationData?.antData || []}
                selectedAnt={selectedAnt}
                onAntSelect={setSelectedAnt}
                renderMode={renderMode}
              />
            </div>
          )}
        </div>

        {/* Footer with toggle buttons */}
        <div className="app-footer">
          <button
            className={`toggle-button ${showDataPanel ? 'active' : ''}`}
            onClick={() => setShowDataPanel(!showDataPanel)}
          >
            Data Panel
          </button>
          <button
            className={`toggle-button ${showPerformanceMonitor ? 'active' : ''}`}
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          >
            Performance
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;