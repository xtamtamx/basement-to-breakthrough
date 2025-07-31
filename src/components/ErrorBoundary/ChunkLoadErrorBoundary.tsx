import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { haptics } from '@utils/mobile';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChunkLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    // Detect chunk load errors
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading CSS chunk')
    ) {
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only catch chunk load errors
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading CSS chunk')
    ) {
      console.error('Chunk load error:', error, errorInfo);
      haptics.error();
    } else {
      // Re-throw non-chunk load errors
      throw error;
    }
  }

  handleReload = () => {
    haptics.medium();
    // Clear module cache and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            
            <h2 className="text-xl font-bold text-white mb-2">
              Update Available
            </h2>
            
            <p className="text-gray-400 mb-6">
              A new version of the game is available. Please reload to get the latest updates.
            </p>

            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Game
            </button>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto bg-gray-900 p-2 rounded">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}