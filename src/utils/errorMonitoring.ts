import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { devLog } from './devLogger';

interface ErrorContext {
  userId?: string;
  gameState?: {
    round: number;
    money: number;
    reputation: number;
  };
  action?: string;
  component?: string;
}

class ErrorMonitoring {
  private isInitialized: boolean = false;

  initialize(): void {
    if (this.isInitialized) return;
    
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn || import.meta.env.MODE === 'development') {
      devLog.log('Error monitoring disabled in development');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        integrations: [
          new BrowserTracing({
            // Set sampling rate for performance monitoring
            tracingOrigins: ['localhost', /^\//],
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              useLocation,
              useNavigationType,
              createRoutesFromChildren,
              matchRoutes
            ),
          }),
          new Sentry.Replay({
            // Mask sensitive content
            maskAllText: false,
            maskAllInputs: true,
            blockAllMedia: false,
            // Sampling rates
            sessionSampleRate: 0.1, // 10% of sessions
            errorSampleRate: 1.0,   // 100% of sessions with errors
          })
        ],
        
        // Performance Monitoring
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        
        // Release Tracking
        release: import.meta.env.VITE_APP_VERSION || '1.0.0',
        
        // Error Filtering
        beforeSend(event, hint) {
          // Filter out non-critical errors
          if (event.exception) {
            const error = hint.originalException as Error;
            
            // Ignore network errors in offline mode
            if (error?.message?.includes('Failed to fetch') && !navigator.onLine) {
              return null;
            }
            
            // Ignore expected game errors
            if (error?.message?.includes('Not enough money')) {
              return null;
            }
          }
          
          return event;
        },
        
        // Breadcrumb filtering
        beforeBreadcrumb(breadcrumb) {
          // Filter out noisy breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }
          
          return breadcrumb;
        }
      });

      this.isInitialized = true;
      devLog.log('Error monitoring initialized');
    } catch (error) {
      devLog.error('Failed to initialize error monitoring:', error);
    }
  }

  // Capture exception with context
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.isInitialized) {
      devLog.error('Error (not sent):', error, context);
      return;
    }

    Sentry.withScope(scope => {
      // Add context
      if (context) {
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }
        
        if (context.gameState) {
          scope.setContext('game_state', context.gameState);
        }
        
        if (context.action) {
          scope.setTag('action', context.action);
        }
        
        if (context.component) {
          scope.setTag('component', context.component);
        }
      }

      // Set error level based on severity
      if (error.message.includes('CRITICAL')) {
        scope.setLevel('fatal');
      } else if (error.message.includes('WARNING')) {
        scope.setLevel('warning');
      }

      Sentry.captureException(error);
    });
  }

  // Capture message
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.isInitialized) {
      devLog.log(`Message (${level}):`, message);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  // Add breadcrumb
  addBreadcrumb(breadcrumb: {
    message: string;
    category: string;
    level?: Sentry.SeverityLevel;
    data?: any;
  }): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category,
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000
    });
  }

  // Set user context
  setUser(user: { id: string; username?: string; email?: string } | null): void {
    if (!this.isInitialized) return;
    
    Sentry.setUser(user);
  }

  // Set custom context
  setContext(key: string, context: any): void {
    if (!this.isInitialized) return;
    
    Sentry.setContext(key, context);
  }

  // Performance monitoring
  startTransaction(name: string, op: string = 'navigation'): any {
    if (!this.isInitialized) return null;
    
    return Sentry.startTransaction({ name, op });
  }

  // Game-specific error tracking
  trackGameError(error: Error, gameContext: {
    round: number;
    action: string;
    showId?: string;
    venueId?: string;
    bandId?: string;
  }): void {
    this.captureException(error, {
      gameState: {
        round: gameContext.round,
        money: 0, // Get from store
        reputation: 0 // Get from store
      },
      action: gameContext.action,
      component: 'Game'
    });

    // Add breadcrumb for context
    this.addBreadcrumb({
      message: `Game error during ${gameContext.action}`,
      category: 'game',
      level: 'error',
      data: gameContext
    });
  }

  // Track performance metrics
  trackPerformance(metric: {
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
  }): void {
    if (!this.isInitialized) return;

    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
      const measurement = transaction.setMeasurement(
        metric.name,
        metric.value,
        metric.unit
      );
      
      if (metric.tags) {
        Object.entries(metric.tags).forEach(([key, value]) => {
          transaction.setTag(key, value);
        });
      }
    }
  }

  // React Error Boundary integration
  createErrorBoundary(fallback?: React.ComponentType<any>) {
    return Sentry.ErrorBoundary;
  }

  // Profiler integration
  withProfiler<P extends object>(
    Component: React.ComponentType<P>,
    name?: string
  ): React.ComponentType<P> {
    if (!this.isInitialized) return Component;
    
    return Sentry.withProfiler(Component, { name });
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoring();

// Initialize on import if in production
if (import.meta.env.PROD) {
  errorMonitoring.initialize();
}

// React imports for Sentry integration
import React from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';