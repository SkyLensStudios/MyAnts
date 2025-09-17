/**
 * Comprehensive Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays enhanced fallback UI
 * Includes WebGL/WebGPU specific error handling and recovery mechanisms
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GraphicsCapabilityDetector } from '../utils/GraphicsCapabilityDetector';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isWebGLError: boolean;
  retryCount: number;
  capabilityDetector: GraphicsCapabilityDetector | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isWebGLError: false,
      retryCount: 0,
      capabilityDetector: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a WebGL-related error
    const isWebGLError = error.message.toLowerCase().includes('webgl') ||
                        error.message.toLowerCase().includes('webgpu') ||
                        error.message.toLowerCase().includes('shader') ||
                        error.message.toLowerCase().includes('renderer') ||
                        error.message.toLowerCase().includes('three');

    // Initialize capability detector for graphics errors
    const capabilityDetector = isWebGLError ? new GraphicsCapabilityDetector() : null;

    // Update state so the next render will show the fallback UI
    return { hasError: true, error, isWebGLError, capabilityDetector };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enhanced error logging
    console.group('🚨 ErrorBoundary caught an error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
    
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to external service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // This could integrate with error tracking services
    console.info('Error reporting could be integrated here for production');
    
    // Log system information for debugging
    this.logSystemInfo();
  }

  private logSystemInfo() {
    console.group('📊 System Information');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Hardware Concurrency:', navigator.hardwareConcurrency);
    console.log('Language:', navigator.language);
    
    // WebGL capabilities
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      if (gl) {
        console.log('WebGL Vendor:', gl.getParameter(gl.VENDOR));
        console.log('WebGL Renderer:', gl.getParameter(gl.RENDERER));
        console.log('WebGL Version:', gl.getParameter(gl.VERSION));
      } else {
        console.warn('WebGL not available');
      }
    } catch (e) {
      console.warn('Failed to get WebGL info:', e);
    }
    
    console.groupEnd();
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount <= 3) {
      console.log(`Retrying... (${newRetryCount}/3)`);
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: newRetryCount,
      });
    } else {
      console.warn('Maximum retry attempts reached');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced error UI with WebGL-specific guidance
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          fontFamily: 'Arial, sans-serif',
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '30px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: this.state.isWebGLError ? '2px solid #ff6b6b' : '2px solid #ffa502',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ 
                color: this.state.isWebGLError ? '#d63031' : '#e17055',
                margin: '0 0 10px 0',
                fontSize: '24px',
              }}>
                {this.state.isWebGLError ? '🎮 Graphics Error' : '⚠️ Application Error'}
              </h1>
              <p style={{ color: '#636e72', margin: 0 }}>
                {this.state.isWebGLError 
                  ? 'There was a problem with 3D graphics rendering'
                  : 'Something unexpected happened in the application'
                }
              </p>
            </div>

            {this.state.isWebGLError && (
              <div style={{
                backgroundColor: '#ffe5e5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ffcdd2',
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>WebGL/Graphics Issue</h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                  This error is related to 3D graphics rendering. Try these solutions:
                </p>
                
                {/* Graphics capability information */}
                {this.state.capabilityDetector && (
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#d32f2f', fontSize: '16px' }}>
                      System Capabilities
                    </h4>
                    <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                      <div>WebGL: {this.state.capabilityDetector.getCapabilities()?.webgl ? '✅ Supported' : '❌ Not Available'}</div>
                      <div>WebGL2: {this.state.capabilityDetector.getCapabilities()?.webgl2 ? '✅ Supported' : '❌ Not Available'}</div>
                      <div>WebGPU: {this.state.capabilityDetector.getCapabilities()?.webgpu ? '✅ Supported' : '❌ Not Available'}</div>
                      {this.state.capabilityDetector.getCapabilities()?.maxTextureSize && (
                        <div>Max Texture Size: {this.state.capabilityDetector.getCapabilities()!.maxTextureSize}px</div>
                      )}
                    </div>
                  </div>
                )}

                <ul style={{ margin: 0, fontSize: '14px' }}>
                  {this.state.capabilityDetector ? 
                    this.state.capabilityDetector.getFallbackSuggestions().map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    )) :
                    (
                      <>
                        <li>Update your graphics drivers</li>
                        <li>Enable hardware acceleration in your browser</li>
                        <li>Try a different browser (Chrome, Firefox, Edge)</li>
                        <li>Close other graphics-intensive applications</li>
                      </>
                    )
                  }
                </ul>
              </div>
            )}

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #e9ecef',
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Quick Solutions</h3>
              <ul style={{ margin: 0, fontSize: '14px' }}>
                <li>Refresh the page to restart the application</li>
                <li>Check the browser console for additional details</li>
                <li>Ensure your browser supports modern web standards</li>
                {this.state.retryCount < 3 && <li>Try the retry button below</li>}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {this.state.retryCount < 3 && (
                <button
                  onClick={this.handleRetry}
                  style={{
                    backgroundColor: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  Try Again ({3 - this.state.retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#00b894',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Refresh Page
              </button>
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '25px' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  color: '#6c5ce7',
                  marginBottom: '10px',
                }}>
                  🔍 Developer Details
                </summary>
                <div style={{
                  backgroundColor: '#2d3748',
                  color: '#e2e8f0',
                  padding: '15px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;