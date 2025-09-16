/**
 * Simulation Controls Component
 * Provides UI controls for starting, pausing, configuring the simulation
 */

import React, { useState } from 'react';
import { SimulationState, SimulationConfig, AntSpecies } from '../../shared/types';

interface SimulationControlsProps {
  simulationState: SimulationState | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onConfigure: (config: SimulationConfig) => void;
  onSpeedChange: (speed: number) => void;
  onSave: () => void;
  onLoad: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationState,
  onStart,
  onPause,
  onReset,
  onConfigure,
  onSpeedChange,
  onSave,
  onLoad,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<SimulationConfig>({
    timeScale: 1,
    colonySize: 1000,
    environmentSize: 100,
    seasonLength: 3600,
    speciesType: AntSpecies.FIRE,
    complexityLevel: 2,
    enablePhysics: true,
    enableWeather: true,
    enableGenetics: true,
    enableLearning: true,
    maxAnts: 10000,
    worldSeed: 12345,
    
    // Phase 4 Environmental Systems
    enableAdvancedWeather: false,
    enableSoilDynamics: false,
    enableEcosystemInteractions: false,
    weatherComplexity: 'medium',
    soilResolution: 64,
  });

  const isRunning = simulationState?.isRunning;
  const isPaused = simulationState?.isPaused;

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = Number(e.target.value);
    onSpeedChange(speed);
  };

  const handleConfigSubmit = () => {
    onConfigure(config);
    setShowConfig(false);
  };

  return (
    <div className="simulation-controls">
      <div className="control-section">
        <h3>Simulation Controls</h3>
        
        <div className="button-group">
          <button
            onClick={isRunning && !isPaused ? onPause : onStart}
            className={`btn ${isRunning && !isPaused ? 'btn-warning' : 'btn-primary'}`}
          >
            {isRunning && !isPaused ? '⏸️ Pause' : '▶️ Start'}
          </button>
          
          <button
            onClick={onReset}
            className="btn btn-secondary"
          >
            🔄 Reset
          </button>
        </div>

        <div className="speed-control">
          <label htmlFor="speed-select">Speed:</label>
          <select
            id="speed-select"
            value={simulationState?.timeScale || 1}
            onChange={handleSpeedChange}
            className="speed-select"
          >
            <option value={0.1}>0.1x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
            <option value={100}>100x</option>
          </select>
        </div>
      </div>

      <div className="control-section">
        <h4>File Operations</h4>
        <div className="button-group">
          <button onClick={onSave} className="btn btn-secondary">
            💾 Save
          </button>
          <button onClick={onLoad} className="btn btn-secondary">
            📁 Load
          </button>
        </div>
      </div>

      <div className="control-section">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="btn btn-secondary"
        >
          ⚙️ {showConfig ? 'Hide' : 'Show'} Config
        </button>
      </div>

      {showConfig && (
        <div className="config-panel">
          <h4>Simulation Configuration</h4>
          
          <div className="config-field">
            <label>Colony Size:</label>
            <input
              type="number"
              value={config.colonySize}
              onChange={(e) => setConfig({...config, colonySize: Number(e.target.value)})}
              min="10"
              max="50000"
            />
          </div>

          <div className="config-field">
            <label>Environment Size (m²):</label>
            <input
              type="number"
              value={config.environmentSize}
              onChange={(e) => setConfig({...config, environmentSize: Number(e.target.value)})}
              min="1"
              max="10000"
            />
          </div>

          <div className="config-field">
            <label>Species:</label>
            <select
              value={config.speciesType}
              onChange={(e) => setConfig({...config, speciesType: e.target.value as AntSpecies})}
            >
              {Object.values(AntSpecies).map(species => (
                <option key={species} value={species}>
                  {species.charAt(0).toUpperCase() + species.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="config-field">
            <label>Complexity Level:</label>
            <select
              value={config.complexityLevel}
              onChange={(e) => setConfig({...config, complexityLevel: Number(e.target.value) as 1|2|3|4})}
            >
              <option value={1}>Level 1 - Basic</option>
              <option value={2}>Level 2 - Advanced</option>
              <option value={3}>Level 3 - Ecosystem</option>
              <option value={4}>Level 4 - Evolution</option>
            </select>
          </div>

          <div className="config-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={config.enablePhysics}
                onChange={(e) => setConfig({...config, enablePhysics: e.target.checked})}
              />
              Enable Physics
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={config.enableWeather}
                onChange={(e) => setConfig({...config, enableWeather: e.target.checked})}
              />
              Enable Weather
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={config.enableGenetics}
                onChange={(e) => setConfig({...config, enableGenetics: e.target.checked})}
              />
              Enable Genetics
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={config.enableLearning}
                onChange={(e) => setConfig({...config, enableLearning: e.target.checked})}
              />
              Enable Learning
            </label>
          </div>

          <div className="config-section">
            <h5>Phase 4 Environmental Systems</h5>
            <div className="config-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={config.enableAdvancedWeather || false}
                  onChange={(e) => setConfig({...config, enableAdvancedWeather: e.target.checked})}
                />
                Advanced Weather Simulation
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={config.enableSoilDynamics || false}
                  onChange={(e) => setConfig({...config, enableSoilDynamics: e.target.checked})}
                />
                Soil Physics Dynamics
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={config.enableEcosystemInteractions || false}
                  onChange={(e) => setConfig({...config, enableEcosystemInteractions: e.target.checked})}
                />
                Ecosystem Interactions
              </label>
            </div>

            <div className="config-field">
              <label>Weather Complexity:</label>
              <select
                value={config.weatherComplexity || 'medium'}
                onChange={(e) => setConfig({...config, weatherComplexity: e.target.value as 'low' | 'medium' | 'high'})}
              >
                <option value="low">Low - Basic weather</option>
                <option value="medium">Medium - Realistic weather</option>
                <option value="high">High - Complex patterns</option>
              </select>
            </div>

            <div className="config-field">
              <label>Soil Resolution:</label>
              <input
                type="number"
                value={config.soilResolution || 64}
                onChange={(e) => setConfig({...config, soilResolution: Number(e.target.value)})}
                min="16"
                max="512"
                step="16"
              />
              <small>Higher values = more detailed soil simulation</small>
            </div>
          </div>

          <div className="config-actions">
            <button onClick={handleConfigSubmit} className="btn btn-primary">
              Apply Configuration
            </button>
            <button onClick={() => setShowConfig(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationControls;