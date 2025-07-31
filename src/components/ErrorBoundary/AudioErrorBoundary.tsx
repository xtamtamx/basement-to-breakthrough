import React, { Component, ErrorInfo, ReactNode } from 'react';
import { VolumeX } from 'lucide-react';

import { devLog } from '../../utils/devLogger';
interface Props {
  children: ReactNode;
  onAudioError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  audioDisabled: boolean;
}

export class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      audioDisabled: false
    };
  }

  static getDerivedStateFromError(error: Error): State | null {
    // Only catch audio-related errors
    const isAudioError = error.message.toLowerCase().includes('audio') ||
                        error.message.toLowerCase().includes('sound') ||
                        error.message.toLowerCase().includes('audiocontext') ||
                        error.message.toLowerCase().includes('oscillator') ||
                        error.name === 'AudioError';
    
    if (isAudioError) {
      return {
        hasError: true,
        audioDisabled: true
      };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only handle audio-related errors
    const isAudioError = error.message.toLowerCase().includes('audio') ||
                        error.message.toLowerCase().includes('sound') ||
                        error.message.toLowerCase().includes('audiocontext') ||
                        error.message.toLowerCase().includes('oscillator') ||
                        error.name === 'AudioError';
    
    if (isAudioError) {
      devLog.warn('Audio Error:', error, errorInfo);
      
      // Disable audio globally to prevent further errors
      if (window.localStorage) {
        window.localStorage.setItem('audioDisabled', 'true');
      }

      const { onAudioError } = this.props;
      if (onAudioError) {
        onAudioError(error);
      }

      // Dispatch event for other components to handle
      window.dispatchEvent(new CustomEvent('audio-error', {
        detail: { error: error.message }
      }));
    } else {
      // Re-throw non-audio errors
      throw error;
    }
  }

  handleEnableAudio = () => {
    this.setState({ hasError: false, audioDisabled: false });
    if (window.localStorage) {
      window.localStorage.removeItem('audioDisabled');
    }
    // Reload to reinitialize audio
    window.location.reload();
  };

  render() {
    const { hasError, audioDisabled } = this.state;
    const { children } = this.props;

    if (hasError && audioDisabled) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900/50 border border-yellow-600/50 rounded-lg">
          <VolumeX className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-300">Audio disabled due to error</span>
          <button
            onClick={this.handleEnableAudio}
            className="text-xs text-yellow-400 hover:text-yellow-300 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return children;
  }
}