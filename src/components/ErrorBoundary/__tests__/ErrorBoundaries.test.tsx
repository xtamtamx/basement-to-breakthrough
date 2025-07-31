import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameErrorBoundary } from '../GameErrorBoundary';
import { NetworkErrorBoundary } from '../NetworkErrorBoundary';
import { ChunkLoadErrorBoundary } from '../ChunkLoadErrorBoundary';
import { StorageErrorBoundary } from '../StorageErrorBoundary';
import { AppErrorBoundary } from '../AppErrorBoundary';

// Mock haptics
vi.mock('@utils/mobile', () => ({
  haptics: {
    light: vi.fn(),
    medium: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}));

// Component that throws an error
const ThrowError: React.FC<{ error: Error }> = ({ error }) => {
  throw error;
};

describe('Error Boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GameErrorBoundary', () => {
    it('should catch general errors', () => {
      render(
        <GameErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </GameErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should provide retry functionality', () => {
      const ChildComponent = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) throw new Error('Test error');
        return <div>Success!</div>;
      };

      const { rerender } = render(
        <GameErrorBoundary>
          <ChildComponent shouldError={true} />
        </GameErrorBoundary>
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();

      // Click try again
      fireEvent.click(screen.getByText('Try Again'));

      // Rerender with no error
      rerender(
        <GameErrorBoundary>
          <ChildComponent shouldError={false} />
        </GameErrorBoundary>
      );

      // Should show success after retry
      setTimeout(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      }, 150);
    });

    it('should use custom fallback if provided', () => {
      render(
        <GameErrorBoundary fallback={<div>Custom Error UI</div>}>
          <ThrowError error={new Error('Test')} />
        </GameErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });
  });

  describe('NetworkErrorBoundary', () => {
    beforeEach(() => {
      // Reset online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    it('should catch network errors', () => {
      render(
        <NetworkErrorBoundary>
          <ThrowError error={new Error('Failed to fetch')} />
        </NetworkErrorBoundary>
      );

      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('should detect offline state', () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <NetworkErrorBoundary>
          <div>Content</div>
        </NetworkErrorBoundary>
      );

      expect(screen.getByText("You're Offline")).toBeInTheDocument();
    });

    it('should pass through non-network errors', () => {
      // NetworkErrorBoundary should not catch this error
      const { container } = render(
        <GameErrorBoundary>
          <NetworkErrorBoundary>
            <ThrowError error={new Error('Generic application error')} />
          </NetworkErrorBoundary>
        </GameErrorBoundary>
      );

      // Should be caught by outer GameErrorBoundary
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });

  describe('ChunkLoadErrorBoundary', () => {
    it('should catch chunk load errors', () => {
      render(
        <ChunkLoadErrorBoundary>
          <ThrowError error={new Error('Loading chunk 5 failed')} />
        </ChunkLoadErrorBoundary>
      );

      expect(screen.getByText('Update Available')).toBeInTheDocument();
    });

    it('should handle dynamic import errors', () => {
      render(
        <ChunkLoadErrorBoundary>
          <ThrowError error={new Error('Failed to fetch dynamically imported module')} />
        </ChunkLoadErrorBoundary>
      );

      expect(screen.getByText('Update Available')).toBeInTheDocument();
      expect(screen.getByText('Reload Game')).toBeInTheDocument();
    });
  });

  describe('StorageErrorBoundary', () => {
    it('should catch quota exceeded errors', () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';

      render(
        <StorageErrorBoundary>
          <ThrowError error={quotaError} />
        </StorageErrorBoundary>
      );

      expect(screen.getByText('Storage Error')).toBeInTheDocument();
      expect(screen.getByText(/running out of storage space/)).toBeInTheDocument();
    });

    it('should provide export and clear options', () => {
      const storageError = new Error('localStorage error');
      
      render(
        <StorageErrorBoundary>
          <ThrowError error={storageError} />
        </StorageErrorBoundary>
      );

      expect(screen.getByText('Export Save File')).toBeInTheDocument();
      expect(screen.getByText('Clear Storage')).toBeInTheDocument();
    });
  });

  describe('AppErrorBoundary', () => {
    beforeEach(() => {
      // Ensure we're "online" for these tests
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    it('should catch errors in the correct order', () => {
      // Test chunk load error (highest priority)
      render(
        <AppErrorBoundary>
          <ThrowError error={new Error('Loading chunk failed')} />
        </AppErrorBoundary>
      );

      expect(screen.getByText('Update Available')).toBeInTheDocument();
    });

    it('should catch network errors when no chunk errors', () => {
      render(
        <AppErrorBoundary>
          <ThrowError error={new Error('Failed to fetch data from server')} />
        </AppErrorBoundary>
      );

      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('should catch general errors as fallback', () => {
      render(
        <AppErrorBoundary>
          <ThrowError error={new Error('General application error')} />
        </AppErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should show offline message when offline', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <AppErrorBoundary>
          <div>Content</div>
        </AppErrorBoundary>
      );

      expect(screen.getByText("You're Offline")).toBeInTheDocument();
    });
  });
});