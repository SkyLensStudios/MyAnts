/**
 * React 2D Canvas Renderer Component
 * High-performance 2D rendering component to replace Three.js components
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Vector2D,
    Vector2DUtils,
} from '../../shared/types-2d';
import {
    ModeConversionUtils,
    UnifiedSimulationUpdate,
} from '../../shared/types-unified';
import { Camera2D, Canvas2DRenderer, Canvas2DRendererConfig, RenderMetrics2D } from '../Canvas2DRenderer';

interface Canvas2DRendererProps {
  width: number;
  height: number;
  simulationData?: UnifiedSimulationUpdate;
  config?: Partial<Canvas2DRendererConfig>;
  onCameraChange?: (camera: Camera2D) => void;
  onMetricsUpdate?: (metrics: RenderMetrics2D) => void;
  enableControls?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * React component wrapping the Canvas2D renderer
 */
const Canvas2DRendererComponent: React.FC<Canvas2DRendererProps> = ({
  width,
  height,
  simulationData,
  config = {},
  onCameraChange,
  onMetricsUpdate,
  enableControls = true,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTime = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [camera, setCamera] = useState<Camera2D>({
    position: { x: 0, y: 0 },
    zoom: 1.0,
    rotation: 0,
    viewportWidth: width,
    viewportHeight: height,
  });

  // Mouse interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Vector2D>({ x: 0, y: 0 });

  /**
   * Initialize the 2D renderer
   */
  const initializeRenderer = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      // Create renderer instance
      rendererRef.current = new Canvas2DRenderer(canvasRef.current, {
        enableAntiAliasing: true,
        enableBackgroundGrid: true,
        enablePheromoneVisualizations: true,
        enableEnvironmentObjects: true,
        maxAntsToRender: 10000,
        antSize: 4,
        pheromoneAlpha: 0.3,
        backgroundColor: '#1a1a1a',
        gridColor: '#333333',
        enablePerformanceOptimizations: true,
        cullingEnabled: true,
        batchSize: 500,
        ...config,
      });

      // Set initial camera
      rendererRef.current.setCamera(camera);
      
      setIsInitialized(true);
      console.log('Canvas2D renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Canvas2D renderer:', error);
    }
  }, [config, camera]);

  /**
   * Render loop
   */
  const render = useCallback(() => {
    if (!rendererRef.current || !simulationData) return;

    const now = performance.now();
    if (now - lastRenderTime.current < 16) { // Limit to ~60 FPS
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }
    lastRenderTime.current = now;

    try {
      // Convert data to 2D format
      const converted = ModeConversionUtils.updateTo2D(simulationData);
      const antData = converted.antData;
      const pheromoneData = converted.pheromoneData;
      const environmentData = converted.environmentData;

      // Render the frame
      rendererRef.current.render(antData, pheromoneData, environmentData);

      // Update metrics
      if (onMetricsUpdate) {
        const metrics = rendererRef.current.getMetrics();
        onMetricsUpdate(metrics);
      }

    } catch (error) {
      console.error('Rendering error:', error);
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, [simulationData, onMetricsUpdate]);

  /**
   * Handle canvas resize
   */
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !rendererRef.current) return;

    // Update canvas size
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Update renderer
    rendererRef.current.resize(width, height);

    // Update camera viewport only if dimensions actually changed
    setCamera(prevCamera => {
      if (prevCamera.viewportWidth !== width || prevCamera.viewportHeight !== height) {
        const newCamera: Camera2D = {
          ...prevCamera,
          viewportWidth: width,
          viewportHeight: height,
        };
        rendererRef.current?.setCamera(newCamera);
        if (onCameraChange) {
          onCameraChange(newCamera);
        }
        return newCamera;
      }
      return prevCamera;
    });
  }, [width, height, onCameraChange]); // Remove camera from dependencies

  /**
   * Mouse event handlers for camera controls
   */
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableControls) return;
    
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  }, [enableControls]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableControls || !isDragging || !rendererRef.current) return;

    const deltaX = event.clientX - lastMousePos.x;
    const deltaY = event.clientY - lastMousePos.y;

    // Only update if there's significant movement (reduce noise)
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    setCamera(prevCamera => {
      // Convert screen delta to world delta
      const worldDelta = Vector2DUtils.multiply({ x: -deltaX, y: deltaY }, 1 / prevCamera.zoom);

      // Update camera position
      const newCamera: Camera2D = {
        ...prevCamera,
        position: Vector2DUtils.add(prevCamera.position, worldDelta),
      };

      rendererRef.current?.setCamera(newCamera);

      if (onCameraChange) {
        onCameraChange(newCamera);
      }

      return newCamera;
    });

    setLastMousePos({ x: event.clientX, y: event.clientY });
  }, [enableControls, isDragging, lastMousePos, onCameraChange]);

  const handleMouseUp = useCallback(() => {
    if (!enableControls) return;
    setIsDragging(false);
  }, [enableControls]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!enableControls || !rendererRef.current) return;

    event.preventDefault();

    // Zoom factor based on wheel delta
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;

    setCamera(prevCamera => {
      const newZoom = Math.max(0.1, Math.min(10, prevCamera.zoom * zoomFactor));

      // Only update if zoom actually changed
      if (Math.abs(newZoom - prevCamera.zoom) < 0.001) return prevCamera;

      const newCamera: Camera2D = {
        ...prevCamera,
        zoom: newZoom,
      };

      rendererRef.current?.setCamera(newCamera);

      if (onCameraChange) {
        onCameraChange(newCamera);
      }

      return newCamera;
    });
  }, [enableControls, onCameraChange]);

  /**
   * Keyboard controls for camera
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableControls || !rendererRef.current) return;

    let deltaX = 0;
    let deltaY = 0;
    const moveSpeed = 10 / camera.zoom;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        deltaY = -moveSpeed;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        deltaY = moveSpeed;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        deltaX = -moveSpeed;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        deltaX = moveSpeed;
        break;
      case '+':
      case '=':
        const zoomInCamera: Camera2D = {
          ...camera,
          zoom: Math.min(10, camera.zoom * 1.1),
        };
        setCamera(zoomInCamera);
        rendererRef.current.setCamera(zoomInCamera);
        if (onCameraChange) onCameraChange(zoomInCamera);
        return;
      case '-':
        const zoomOutCamera: Camera2D = {
          ...camera,
          zoom: Math.max(0.1, camera.zoom * 0.9),
        };
        setCamera(zoomOutCamera);
        rendererRef.current.setCamera(zoomOutCamera);
        if (onCameraChange) onCameraChange(zoomOutCamera);
        return;
      case 'r':
      case 'R':
        // Reset camera
        const resetCamera: Camera2D = {
          position: { x: 0, y: 0 },
          zoom: 1.0,
          rotation: 0,
          viewportWidth: width,
          viewportHeight: height,
        };
        setCamera(resetCamera);
        rendererRef.current.setCamera(resetCamera);
        if (onCameraChange) onCameraChange(resetCamera);
        return;
      default:
        return;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      const newCamera: Camera2D = {
        ...camera,
        position: Vector2DUtils.add(camera.position, { x: deltaX, y: deltaY }),
      };
      setCamera(newCamera);
      rendererRef.current.setCamera(newCamera);
      if (onCameraChange) onCameraChange(newCamera);
    }
  }, [enableControls, camera, width, height, onCameraChange]);

  // Initialize renderer when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      initializeRenderer();
    }
  }, [initializeRenderer, isInitialized]);

  // Handle resize with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 16); // ~60fps throttling

    return () => clearTimeout(timeoutId);
  }, [width, height, handleResize]);

  // Start/stop render loop
  useEffect(() => {
    if (isInitialized && simulationData) {
      animationFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInitialized, simulationData, render]);

  // Add keyboard event listeners
  useEffect(() => {
    if (enableControls) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableControls, handleKeyDown]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className={className} style={style}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          display: 'block',
          cursor: (() => {
            if (isDragging) return 'grabbing';
            if (enableControls) return 'grab';
            return 'default';
          })(),
          ...style,
        }}
      />
      
      {/* Camera controls info */}
      {enableControls && (
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          <div>Controls: WASD/Arrows=Move, Mouse=Drag, Wheel=Zoom</div>
          <div>+/- = Zoom, R = Reset</div>
          <div>Position: ({camera.position.x.toFixed(1)}, {camera.position.y.toFixed(1)})</div>
          <div>Zoom: {camera.zoom.toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
};

export default Canvas2DRendererComponent;