/**
 * Adaptive Renderer Component
 * Automatically selects and initializes the best available graphics renderer
 * with comprehensive fallback support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RendererFallbackManager, FallbackResult } from '../utils/RendererFallbackManager';
import { GraphicsCapabilityDetector } from '../utils/GraphicsCapabilityDetector';

interface AdaptiveRendererProps {
  children: React.ReactNode;
  onRendererInitialized?: (result: FallbackResult) => void;
  onError?: (error: Error) => void;
}

interface RendererState {
  isInitialized: boolean;
  isInitializing: boolean;
  fallbackResult: FallbackResult | null;
  error: Error | null;
}

export const AdaptiveRenderer: React.FC<AdaptiveRendererProps> = ({
  children,
  onRendererInitialized,
  onError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fallbackManagerRef = useRef<RendererFallbackManager | null>(null);
  const [state, setState] = useState<RendererState>({
    isInitialized: false,
    isInitializing: false,
    fallbackResult: null,
    error: null,
  });

  const initializeRenderer = useCallback(async () => {
    if (state.isInitializing || state.isInitialized || !mountRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      console.log('🚀 Starting adaptive renderer initialization...');
      
      // Create fallback manager
      fallbackManagerRef.current = new RendererFallbackManager();
      
      // Create canvas for renderer
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      
      // Clear any existing content
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(canvas);

      // Initialize renderer with fallback chain
      const fallbackResult = await fallbackManagerRef.current.createRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });

      if (!fallbackResult.renderer) {
        throw new Error('All renderer initialization attempts failed');
      }

      console.log(`✅ Renderer initialized: ${fallbackResult.actualRenderer}`);

      // Configure renderer for container
      const container = mountRef.current;
      const resizeRenderer = () => {
        if (fallbackResult.renderer && container) {
          const width = container.clientWidth;
          const height = container.clientHeight;
          fallbackResult.renderer.setSize(width, height);
          fallbackResult.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      };

      // Set initial size
      resizeRenderer();

      // Add resize listener
      const resizeObserver = new ResizeObserver(resizeRenderer);
      resizeObserver.observe(container);

      // Update state
      setState({
        isInitialized: true,
        isInitializing: false,
        fallbackResult,
        error: null,
      });

      // Notify parent component
      onRendererInitialized?.(fallbackResult);

      // Cleanup function
      return () => {
        resizeObserver.disconnect();
      };

    } catch (error) {
      console.error('❌ Renderer initialization failed:', error);
      const err = error instanceof Error ? error : new Error('Unknown renderer error');
      
      setState({
        isInitialized: false,
        isInitializing: false,
        fallbackResult: null,
        error: err,
      });

      onError?.(err);
    }
  }, [state.isInitializing, state.isInitialized, onRendererInitialized, onError]);

  // Initialize renderer on mount
  useEffect(() => {
    initializeRenderer();
  }, [initializeRenderer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.fallbackResult?.renderer) {
        state.fallbackResult.renderer.dispose();
      }
      if (state.fallbackResult?.webgpuIntegration) {
        state.fallbackResult.webgpuIntegration.dispose();
      }
    };
  }, [state.fallbackResult]);

  // Loading state
  if (state.isInitializing) {
    return (
      <div 
        ref={mountRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔧</div>
          <div>Initializing Graphics...</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Detecting capabilities and selecting optimal renderer
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div 
        ref={mountRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffe5e5',
          fontFamily: 'Arial, sans-serif',
          padding: '20px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
          <h3 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>Graphics Initialization Failed</h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
            Unable to initialize any graphics renderer. This may be due to:
          </p>
          <ul style={{ textAlign: 'left', fontSize: '12px', lineHeight: '1.5' }}>
            <li>Outdated graphics drivers</li>
            <li>Browser compatibility issues</li>
            <li>Hardware acceleration disabled</li>
            <li>Insufficient system resources</li>
          </ul>
          <button
            onClick={() => {
              setState(prev => ({ ...prev, error: null }));
              initializeRenderer();
            }}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  // Render children once initialized
  if (state.isInitialized && state.fallbackResult) {
    return (
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        {children}
        
        {/* Renderer info overlay (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 1000,
          }}>
            <div>Renderer: {state.fallbackResult.actualRenderer.toUpperCase()}</div>
            <div>Quality: {state.fallbackResult.renderingConfig.qualityLevel}</div>
            {state.fallbackResult.limitations.length > 0 && (
              <div style={{ color: '#ffa726', marginTop: '4px' }}>
                ⚠️ {state.fallbackResult.limitations.length} limitation(s)
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default fallback
  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default AdaptiveRenderer;

/**
 * Hook for accessing renderer information from child components
 */
export const useRenderer = () => {
  const [capabilities, setCapabilities] = useState<ReturnType<GraphicsCapabilityDetector['getCapabilities']>>(null);
  const [fallbackResult, setFallbackResult] = useState<FallbackResult | null>(null);

  useEffect(() => {
    const detector = new GraphicsCapabilityDetector();
    setCapabilities(detector.getCapabilities());
  }, []);

  return {
    capabilities,
    fallbackResult,
    setFallbackResult,
  };
};