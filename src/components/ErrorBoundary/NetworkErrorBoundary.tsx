import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { haptics } from '@utils/mobile';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  isOffline: boolean;
  error: Error | null;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isOffline: !navigator.onLine,
      error: null
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
    if (this.state.hasError) {
      this.handleRetry();
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a network-related error
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.name === 'NetworkError';

    if (isNetworkError) {
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if it's a network-related error
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.name === 'NetworkError';
    
    if (isNetworkError) {
      console.error('Network error caught:', error, errorInfo);
      haptics.error();
    } else {
      // Re-throw non-network errors
      throw error;
    }
  }

  handleRetry = () => {
    const { onRetry } = this.props;
    haptics.light();
    
    if (onRetry) {
      onRetry();
    }
    
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    const { hasError, isOffline, error } = this.state;
    const { children } = this.props;

    if (hasError || isOffline) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
            <WifiOff className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            
            <h2 className="text-xl font-bold text-white mb-2">
              {isOffline ? 'You\'re Offline' : 'Network Error'}
            </h2>
            
            <p className="text-gray-400 mb-6">
              {isOffline 
                ? 'Please check your internet connection to continue.'
                : error?.message || 'Unable to connect to the game servers.'
              }
            </p>

            {!isOffline && (
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            <p className="text-sm text-gray-500 mt-4">
              Don't worry - your game progress is saved locally!
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}