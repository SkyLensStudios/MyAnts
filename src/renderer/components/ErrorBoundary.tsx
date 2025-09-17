/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or use provided fallback
      return this.props.fallback || (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#2a2a2a',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <h3>🚨 Something went wrong</h3>
          <p>An error occurred in this component:</p>
          <details style={{ 
            marginTop: '10px', 
            textAlign: 'left',
            background: '#1a1a1a',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
              Error Details
            </summary>
            <pre style={{ 
              fontSize: '12px', 
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#4ecdc4',
              color: '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;