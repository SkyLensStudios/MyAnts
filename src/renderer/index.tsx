import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* StrictMode intentionally double-renders components in development to detect side effects */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);