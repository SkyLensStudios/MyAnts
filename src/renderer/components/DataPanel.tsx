/**
 * Data Panel Component
 * Displays simulation data, ant information, and colony statistics
 */

import React from 'react';
import { SimulationState, AntRenderData } from '../../shared/types';

interface DataPanelProps {
  simulationState: SimulationState | null;
  antData: AntRenderData[];
  selectedAnt: string | null;
  onClose: () => void;
}

const DataPanel: React.FC<DataPanelProps> = ({
  simulationState,
  antData,
  selectedAnt,
  onClose,
}) => {
  const selectedAntData = selectedAnt ? antData.find(ant => ant.id === selectedAnt) : null;
  const livingAnts = antData.filter(ant => ant.isAlive);
  const deadAnts = antData.filter(ant => !ant.isAlive);

  // Calculate statistics
  const avgHealth = livingAnts.length > 0 
    ? livingAnts.reduce((sum, ant) => sum + ant.health, 0) / livingAnts.length 
    : 0;
  
  const avgEnergy = livingAnts.length > 0
    ? livingAnts.reduce((sum, ant) => sum + ant.energy, 0) / livingAnts.length
    : 0;

  const casteDistribution = livingAnts.reduce((acc, ant) => {
    acc[ant.caste] = (acc[ant.caste] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const taskDistribution = livingAnts.reduce((acc, ant) => {
    acc[ant.task] = (acc[ant.task] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>📊 Simulation Data</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {simulationState && (
        <div className="section">
          <h4>Colony Status</h4>
          <div className="stats-grid">
            <div className="stat">
              <span className="label">Time:</span>
              <span className="value">{Math.floor(simulationState.currentTime)}s</span>
            </div>
            <div className="stat">
              <span className="label">Season:</span>
              <span className="value">{simulationState.season}</span>
            </div>
            <div className="stat">
              <span className="label">Day Phase:</span>
              <span className="value">{simulationState.dayPhase}</span>
            </div>
            <div className="stat">
              <span className="label">Temperature:</span>
              <span className="value">{simulationState?.temperature?.toFixed(1) ?? 'N/A'}°C</span>
            </div>
            <div className="stat">
              <span className="label">Humidity:</span>
              <span className="value">{simulationState?.humidity ? (simulationState.humidity * 100).toFixed(1) : 'N/A'}%</span>
            </div>
            <div className="stat">
              <span className="label">Colony Age:</span>
              <span className="value">{simulationState?.colonyAge?.toFixed(1) ?? 'N/A'} days</span>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h4>Population</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="label">Living:</span>
            <span className="value living">{livingAnts.length}</span>
          </div>
          <div className="stat">
            <span className="label">Dead:</span>
            <span className="value dead">{deadAnts.length}</span>
          </div>
          <div className="stat">
            <span className="label">Total:</span>
            <span className="value">{antData.length}</span>
          </div>
          <div className="stat">
            <span className="label">Avg Health:</span>
            <span className="value">{livingAnts.length > 0 ? (avgHealth * 100).toFixed(1) : '0.0'}%</span>
          </div>
          <div className="stat">
            <span className="label">Avg Energy:</span>
            <span className="value">{livingAnts.length > 0 ? (avgEnergy * 100).toFixed(1) : '0.0'}%</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h4>Caste Distribution</h4>
        <div className="distribution">
          {Object.entries(casteDistribution).map(([caste, count]) => (
            <div key={caste} className="distribution-item">
              <span className="label">{caste}:</span>
              <span className="value">{count}</span>
              <div className="bar">
                <div 
                  className="fill" 
                  style={{ width: `${(count / livingAnts.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>Task Distribution</h4>
        <div className="distribution">
          {Object.entries(taskDistribution).map(([task, count]) => (
            <div key={task} className="distribution-item">
              <span className="label">{task}:</span>
              <span className="value">{count}</span>
              <div className="bar">
                <div 
                  className="fill" 
                  style={{ width: `${(count / livingAnts.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedAntData && (
        <div className="section selected-ant">
          <h4>🐜 Selected Ant</h4>
          <div className="ant-details">
            <div className="detail">
              <span className="label">ID:</span>
              <span className="value">{selectedAntData.id.slice(-8)}</span>
            </div>
            <div className="detail">
              <span className="label">Caste:</span>
              <span className="value">{selectedAntData.caste}</span>
            </div>
            <div className="detail">
              <span className="label">Task:</span>
              <span className="value">{selectedAntData.task}</span>
            </div>
            <div className="detail">
              <span className="label">Health:</span>
              <span className={`value ${selectedAntData.health < 0.3 ? 'low' : selectedAntData.health > 0.7 ? 'high' : 'medium'}`}>
                {selectedAntData.health ? (selectedAntData.health * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="detail">
              <span className="label">Energy:</span>
              <span className={`value ${selectedAntData.energy < 0.3 ? 'low' : selectedAntData.energy > 0.7 ? 'high' : 'medium'}`}>
                {selectedAntData.energy ? (selectedAntData.energy * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="detail">
              <span className="label">Age:</span>
              <span className="value">{selectedAntData.age.toFixed(2)} days</span>
            </div>
            <div className="detail">
              <span className="label">Generation:</span>
              <span className="value">{selectedAntData.generation}</span>
            </div>
            <div className="detail">
              <span className="label">Position:</span>
              <span className="value">
                ({selectedAntData.position.x.toFixed(1)}, {selectedAntData.position.y.toFixed(1)})
              </span>
            </div>
            <div className="detail">
              <span className="label">Speed:</span>
              <span className="value">{selectedAntData.speed.toFixed(2)} m/s</span>
            </div>
            <div className="detail">
              <span className="label">Carrying:</span>
              <span className="value">
                {selectedAntData.carryingFood ? '🍯 Food' : 
                 selectedAntData.carryingConstruction ? '🏗️ Material' : 
                 'Nothing'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPanel;