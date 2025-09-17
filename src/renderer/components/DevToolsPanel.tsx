import React, { useState, useEffect, useRef } from 'react';
import { AntRenderData, PheromoneRenderData, EnvironmentRenderData, SimulationState } from '../../shared/types';

interface DevToolsPanelProps {
  antData: AntRenderData[];
  pheromoneData: PheromoneRenderData[];
  environmentData: EnvironmentRenderData;
  simulationState: SimulationState;
  selectedAnt?: string | null;
  onAntSelect?: (antId: string) => void;
  onToggleOverlay?: (overlay: string, enabled: boolean) => void;
  onSimulationControl?: (action: 'play' | 'pause' | 'step' | 'reset' | 'speed', value?: number) => void;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  simulationTime: number;
  memoryUsage: number;
  antCount: number;
  visibleAnts: number;
  lastFrame?: number;
}

interface AntDebugInfo {
  id: string;
  position: { x: number; y: number; z: number };
  task: string;
  caste: string;
  health: number;
  energy: number;
  speed: number;
  age: number;
  carryingFood: boolean;
  lastDecision?: string;
  targetPosition?: { x: number; y: number; z: number };
  pathfindingState?: string;
}

const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  antData,
  pheromoneData,
  environmentData,
  simulationState,
  selectedAnt,
  onAntSelect,
  onToggleOverlay,
  onSimulationControl,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ants' | 'environment' | 'performance' | 'debug'>('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAntDetails, setSelectedAntDetails] = useState<AntDebugInfo | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);
  const [overlayStates, setOverlayStates] = useState({
    pheromoneTrails: false,
    antPaths: false,
    visionCones: false,
    foodDetection: false,
    taskColors: true,
    antIDs: false,
  });

  const performanceRef = useRef<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    simulationTime: 0,
    memoryUsage: 0,
    antCount: 0,
    visibleAnts: 0,
  });

  // Update performance metrics
  useEffect(() => {
    const updatePerformance = () => {
      const now = performance.now();
      performanceRef.current = {
        fps: Math.round(1000 / (now - (performanceRef.current?.lastFrame || now))),
        frameTime: now - (performanceRef.current?.lastFrame || now),
        renderTime: 0, // Will be updated by renderer
        simulationTime: 0, // Will be updated by simulation
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        antCount: antData.length,
        visibleAnts: antData.length,
      };
      
      setPerformanceHistory(prev => {
        const newHistory = [...prev, performanceRef.current].slice(-100); // Keep last 100 samples
        return newHistory;
      });
      
      (performanceRef.current as any).lastFrame = now;
    };

    const interval = setInterval(updatePerformance, 1000);
    return () => clearInterval(interval);
  }, [antData.length]);

  // Update selected ant details
  useEffect(() => {
    if (selectedAnt) {
      const ant = antData.find(a => a.id === selectedAnt);
      if (ant) {
        setSelectedAntDetails({
          id: ant.id,
          position: ant.position,
          task: ant.task,
          caste: ant.caste,
          health: ant.health,
          energy: ant.energy,
          speed: ant.speed || 0,
          age: ant.age,
          carryingFood: ant.carryingFood,
        });
      }
    }
  }, [selectedAnt, antData]);

  const handleOverlayToggle = (overlay: string, enabled: boolean) => {
    setOverlayStates(prev => ({ ...prev, [overlay]: enabled }));
    onToggleOverlay?.(overlay, enabled);
  };

  const calculateStats = () => {
    const taskCounts = antData.reduce((acc, ant) => {
      acc[ant.task] = (acc[ant.task] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casteCounts = antData.reduce((acc, ant) => {
      acc[ant.caste] = (acc[ant.caste] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const positions = antData.map(ant => ant.position);
    const avgHealth = antData.reduce((sum, ant) => sum + ant.health, 0) / antData.length;
    const avgEnergy = antData.reduce((sum, ant) => sum + ant.energy, 0) / antData.length;
    
    const spreadX = positions.length > 0 ? 
      Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x)) : 0;
    const spreadZ = positions.length > 0 ? 
      Math.max(...positions.map(p => p.z)) - Math.min(...positions.map(p => p.z)) : 0;

    return {
      taskCounts,
      casteCounts,
      avgHealth: avgHealth || 0,
      avgEnergy: avgEnergy || 0,
      spreadX,
      spreadZ,
      foodSources: environmentData?.foodSources?.length || 0,
      pheromoneFields: pheromoneData?.length || 0,
    };
  };

  const stats = calculateStats();

  if (isCollapsed) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 10000,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        cursor: 'pointer',
      }} onClick={() => setIsCollapsed(false)}>
        🔧 Dev Tools
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 10000,
      fontFamily: 'monospace',
      fontSize: '12px',
      border: '1px solid #333',
    }}>
      {/* Header */}
      <div style={{
        background: '#1e1e1e',
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 'bold', color: '#00ff00' }}>🔧 Developer Tools</span>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: '#2d2d2d',
        borderBottom: '1px solid #333',
      }}>
        {['overview', 'ants', 'environment', 'performance', 'debug'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              background: activeTab === tab ? '#404040' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#00ff00' : '#ccc',
              padding: '8px 12px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: '11px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        padding: '12px',
        maxHeight: '60vh',
        overflowY: 'auto',
      }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>Simulation Overview</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Status:</strong> {simulationState?.isRunning ? '🟢 Running' : '🔴 Paused'}<br/>
              <strong>Time:</strong> {simulationState?.currentTime || 0}s<br/>
              <strong>Ants:</strong> {antData.length}<br/>
              <strong>Food Sources:</strong> {stats.foodSources}<br/>
              <strong>Avg Health:</strong> {(stats.avgHealth * 100).toFixed(1)}%<br/>
              <strong>Avg Energy:</strong> {(stats.avgEnergy * 100).toFixed(1)}%
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Spatial Distribution:</strong><br/>
              <span style={{ fontSize: '10px' }}>
                X-spread: {stats.spreadX.toFixed(1)}m<br/>
                Z-spread: {stats.spreadZ.toFixed(1)}m
              </span>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Tasks:</strong><br/>
              {Object.entries(stats.taskCounts).map(([task, count]) => (
                <div key={task} style={{ fontSize: '10px' }}>
                  {task}: {count} ({((count / antData.length) * 100).toFixed(1)}%)
                </div>
              ))}
            </div>

            <div>
              <strong>Castes:</strong><br/>
              {Object.entries(stats.casteCounts).map(([caste, count]) => (
                <div key={caste} style={{ fontSize: '10px' }}>
                  {caste}: {count}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ants' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>Ant Inspector</h3>
            
            {selectedAntDetails ? (
              <div style={{ marginBottom: '15px', padding: '8px', background: '#333', borderRadius: '4px' }}>
                <strong>Selected Ant: {selectedAntDetails.id}</strong><br/>
                <div style={{ fontSize: '10px', marginTop: '5px' }}>
                  Position: ({selectedAntDetails.position.x.toFixed(1)}, {selectedAntDetails.position.y.toFixed(1)}, {selectedAntDetails.position.z.toFixed(1)})<br/>
                  Task: {selectedAntDetails.task}<br/>
                  Caste: {selectedAntDetails.caste}<br/>
                  Health: {(selectedAntDetails.health * 100).toFixed(1)}%<br/>
                  Energy: {(selectedAntDetails.energy * 100).toFixed(1)}%<br/>
                  Speed: {selectedAntDetails.speed.toFixed(3)}<br/>
                  Age: {selectedAntDetails.age.toFixed(1)} days<br/>
                  Carrying Food: {selectedAntDetails.carryingFood ? 'Yes' : 'No'}
                </div>
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: '10px', marginBottom: '15px' }}>
                Click on an ant to inspect its details
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <strong>Quick Stats:</strong><br/>
              <div style={{ fontSize: '10px' }}>
                Total Ants: {antData.length}<br/>
                Foraging: {stats.taskCounts.forage || 0}<br/>
                Constructing: {stats.taskCounts.construct || 0}<br/>
                Resting: {stats.taskCounts.rest || 0}<br/>
                Idle: {stats.taskCounts.idle || 0}
              </div>
            </div>

            <div>
              <strong>Visual Overlays:</strong><br/>
              {Object.entries(overlayStates).map(([overlay, enabled]) => (
                <label key={overlay} style={{ display: 'block', fontSize: '10px', margin: '2px 0' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleOverlayToggle(overlay, e.target.checked)}
                    style={{ marginRight: '5px' }}
                  />
                  {overlay.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'environment' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>Environment</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Food Sources:</strong> {stats.foodSources}<br/>
              {environmentData?.foodSources?.map((food, i) => (
                <div key={i} style={{ fontSize: '10px', marginLeft: '10px' }}>
                  Food {i + 1}: ({food.position.x.toFixed(1)}, {food.position.z.toFixed(1)}) 
                  {food.quantity !== undefined && ` - ${food.quantity} units`}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Pheromone Fields:</strong> {stats.pheromoneFields}<br/>
              {pheromoneData?.map((field, i) => (
                <div key={i} style={{ fontSize: '10px', marginLeft: '10px' }}>
                  {field.type}: {field.width}x{field.height} grid
                </div>
              ))}
            </div>

            <div>
              <strong>Weather:</strong><br/>
              <div style={{ fontSize: '10px' }}>
                Temperature: {simulationState?.temperature || 20}°C<br/>
                Humidity: {simulationState?.humidity || 60}%<br/>
                Season: {simulationState?.season || 'spring'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>Performance</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Current Metrics:</strong><br/>
              <div style={{ fontSize: '10px' }}>
                FPS: {performanceRef.current.fps}<br/>
                Frame Time: {performanceRef.current.frameTime.toFixed(1)}ms<br/>
                Memory: {(performanceRef.current.memoryUsage / 1024 / 1024).toFixed(1)}MB<br/>
                Visible Ants: {performanceRef.current.visibleAnts}<br/>
                Total Entities: {antData.length + (environmentData?.foodSources?.length || 0)}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Performance History:</strong><br/>
              <div style={{ fontSize: '10px', background: '#2d2d2d', padding: '5px', borderRadius: '3px', height: '80px', overflowY: 'auto' }}>
                {performanceHistory.slice(-10).reverse().map((metric, i) => (
                  <div key={i} style={{ 
                    color: metric.fps < 30 ? '#ff6666' : metric.fps < 50 ? '#ffff66' : '#66ff66',
                    borderBottom: i < 9 ? '1px solid #444' : 'none',
                    paddingBottom: '2px',
                    marginBottom: '2px',
                  }}>
                    {metric.fps} FPS | {metric.frameTime.toFixed(1)}ms | {(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Performance Analysis:</strong><br/>
              <div style={{ fontSize: '10px' }}>
                {performanceHistory.length > 0 && (
                  <>
                    Avg FPS: {Math.round(performanceHistory.reduce((sum, m) => sum + m.fps, 0) / performanceHistory.length)}<br/>
                    Min FPS: {Math.min(...performanceHistory.map(m => m.fps))}<br/>
                    Max Frame Time: {Math.max(...performanceHistory.map(m => m.frameTime)).toFixed(1)}ms<br/>
                    Memory Trend: {
                      performanceHistory.length > 1 
                        ? (performanceHistory[performanceHistory.length - 1].memoryUsage > performanceHistory[0].memoryUsage ? '↗️ Increasing' : '↘️ Stable')
                        : 'No data'
                    }
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Simulation Controls:</strong><br/>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button
                  onClick={() => onSimulationControl?.('play')}
                  style={{ padding: '4px 8px', fontSize: '10px', background: '#2d2d2d', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
                >
                  ▶️ Play
                </button>
                <button
                  onClick={() => onSimulationControl?.('pause')}
                  style={{ padding: '4px 8px', fontSize: '10px', background: '#2d2d2d', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={() => onSimulationControl?.('step')}
                  style={{ padding: '4px 8px', fontSize: '10px', background: '#2d2d2d', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
                >
                  ⏭️ Step
                </button>
              </div>
            </div>

            <div>
              <strong>Speed Control:</strong><br/>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                defaultValue="1"
                onChange={(e) => onSimulationControl?.('speed', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '5px' }}
              />
              <div style={{ fontSize: '10px', textAlign: 'center' }}>0.1x - 10x speed</div>
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>Debug Console</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Export Data:</strong><br/>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button
                  onClick={() => {
                    const data = JSON.stringify(antData, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ant-data-${Date.now()}.json`;
                    a.click();
                  }}
                  style={{ padding: '4px 8px', fontSize: '10px', background: '#2d2d2d', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
                >
                  Export Ant Data
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Debug Info:</strong><br/>
              <div style={{ fontSize: '10px', background: '#1a1a1a', padding: '5px', borderRadius: '3px', maxHeight: '200px', overflowY: 'auto' }}>
                {JSON.stringify({
                  antCount: antData.length,
                  selectedAnt: selectedAnt,
                  simulationRunning: simulationState?.isRunning,
                  environmentLoaded: !!environmentData,
                  pheromoneDataSize: pheromoneData?.length || 0,
                }, null, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevToolsPanel;