import React, { Component, ErrorInfo, ReactNode } from "react";
import { useGameStore } from "@/stores/gameStore";

import { prodLog } from "../utils/devLogger";
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      prodLog.error("Error caught by boundary:", error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Dispatch custom event for error tracking
    window.dispatchEvent(
      new CustomEvent("game-error", {
        detail: {
          error: error.message,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        },
      }),
    );

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In a real app, send to error tracking service like Sentry
    prodLog.error("Production error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const ErrorFallback: React.FC<{ error: Error | null; onReset: () => void }> = ({
  error,
  onReset,
}) => {
  const resetGame = useGameStore((state) => state.resetGame);

  const handleFullReset = () => {
    // Reset game state
    resetGame();
    // Reset error boundary
    onReset();
    // Reload the page as last resort
    window.location.reload();
  };

  return (
    <div className="error-boundary-fallback">
      <div className="error-content">
        <h1>🎸 Stage Dive Gone Wrong!</h1>
        <p className="error-message">
          Something went wrong in the underground. The show must go on, but
          first we need to fix the stage.
        </p>

        {process.env.NODE_ENV === "development" && error && (
          <details className="error-details">
            <summary>Error Details (Dev Only)</summary>
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </details>
        )}

        <div className="error-actions">
          <button onClick={onReset} className="punk-button">
            Try Again
          </button>
          <button
            onClick={handleFullReset}
            className="punk-button punk-button-secondary"
          >
            Reset Everything
          </button>
        </div>
      </div>

      <style>{`
        .error-boundary-fallback {
          position: fixed;
          inset: 0;
          background: #0a0a0a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: monospace;
        }

        .error-content {
          max-width: 600px;
          text-align: center;
        }

        .error-content h1 {
          font-size: 2em;
          margin-bottom: 20px;
          color: #e94560;
        }

        .error-message {
          font-size: 1.2em;
          margin-bottom: 30px;
          color: #ccc;
        }

        .error-details {
          background: #1a1a1a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: left;
        }

        .error-details summary {
          cursor: pointer;
          margin-bottom: 10px;
          color: #e94560;
        }

        .error-details pre {
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 0.8em;
          color: #888;
        }

        .error-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .punk-button {
          background: #e94560;
          color: #fff;
          border: none;
          padding: 12px 24px;
          font-size: 1em;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .punk-button:hover {
          background: #d63851;
          transform: translateY(-2px);
        }

        .punk-button-secondary {
          background: #444;
        }

        .punk-button-secondary:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

// Specialized error boundary for game views
export const GameErrorBoundary: React.FC<{
  children: ReactNode;
  viewName: string;
}> = ({ children, viewName }) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    prodLog.error(`Error in ${viewName} view:`, error, errorInfo);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: "8px",
            margin: "20px",
          }}
        >
          <h2>Error in {viewName}</h2>
          <p>
            This part of the game encountered an error. Try switching views or
            refreshing.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
