/**
 * Performance Monitor Component  
 * Displays real-time performance statistics and system metrics
 */

import React from 'react';
import { PerformanceStats } from '../../shared/types';

interface PerformanceMonitorProps {
  stats: PerformanceStats | null;
  onClose: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ stats, onClose }) => {
  if (!stats) {
    return (
      <div className="performance-monitor">
        <div className="panel-header">
          <h3>📈 Performance</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="no-data">No performance data available</div>
      </div>
    );
  }

  const memoryUsageMB = {
    rss: (stats.memoryUsage.rss / 1024 / 1024).toFixed(1),
    heapUsed: (stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
    heapTotal: (stats.memoryUsage.heapTotal / 1024 / 1024).toFixed(1),
    external: (stats.memoryUsage.external / 1024 / 1024).toFixed(1),
  };

  return (
    <div className="performance-monitor">
      <div className="panel-header">
        <h3>📈 Performance Monitor</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="section">
        <h4>Rendering</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="label">FPS:</span>
            <span className={`value ${stats.fps < 30 ? 'low' : stats.fps > 50 ? 'high' : 'medium'}`}>
              {stats.fps}
            </span>
          </div>
          <div className="stat">
            <span className="label">Frame Time:</span>
            <span className="value">{stats.frameTime.toFixed(1)}ms</span>
          </div>
          <div className="stat">
            <span className="label">Update Time:</span>
            <span className="value">{stats.updateTime.toFixed(1)}ms</span>
          </div>
          <div className="stat">
            <span className="label">Render Time:</span>
            <span className="value">{stats.renderTime.toFixed(1)}ms</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h4>Memory Usage</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="label">RSS:</span>
            <span className="value">{memoryUsageMB.rss} MB</span>
          </div>
          <div className="stat">
            <span className="label">Heap Used:</span>
            <span className="value">{memoryUsageMB.heapUsed} MB</span>
          </div>
          <div className="stat">
            <span className="label">Heap Total:</span>
            <span className="value">{memoryUsageMB.heapTotal} MB</span>
          </div>
          <div className="stat">
            <span className="label">External:</span>
            <span className="value">{memoryUsageMB.external} MB</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h4>Simulation Load</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="label">Ants:</span>
            <span className="value">{stats.antCount.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Physics Objects:</span>
            <span className="value">{stats.physicsObjects.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Pheromone Grid:</span>
            <span className="value">{stats.pheromoneGridSize.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Triangles:</span>
            <span className="value">{stats.trianglesRendered.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h4>CPU Usage</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="label">User:</span>
            <span className="value">{(stats.cpuUsage.user / 1000).toFixed(1)}ms</span>
          </div>
          <div className="stat">
            <span className="label">System:</span>
            <span className="value">{(stats.cpuUsage.system / 1000).toFixed(1)}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;