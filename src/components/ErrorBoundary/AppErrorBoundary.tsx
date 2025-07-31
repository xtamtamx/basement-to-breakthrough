import React, { ReactNode } from 'react';
import { GameErrorBoundary } from './GameErrorBoundary';
import { NetworkErrorBoundary } from './NetworkErrorBoundary';
import { ChunkLoadErrorBoundary } from './ChunkLoadErrorBoundary';
import { StorageErrorBoundary } from './StorageErrorBoundary';
import { AudioErrorBoundary } from './AudioErrorBoundary';

interface Props {
  children: ReactNode;
}

/**
 * Comprehensive error boundary that handles different types of errors.
 * The order is from general to specific (outermost to innermost):
 * 1. General game errors (catch-all)
 * 2. Chunk load errors (requires page reload)
 * 3. Network errors (can retry)
 * 4. Storage errors (can export/clear)
 * 5. Audio errors (isolated, non-critical)
 * 
 * Errors bubble up from innermost to outermost, so specific handlers
 * are placed closer to the error source.
 */
export const AppErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <GameErrorBoundary>
      <ChunkLoadErrorBoundary>
        <NetworkErrorBoundary>
          <StorageErrorBoundary>
            <AudioErrorBoundary>
              {children}
            </AudioErrorBoundary>
          </StorageErrorBoundary>
        </NetworkErrorBoundary>
      </ChunkLoadErrorBoundary>
    </GameErrorBoundary>
  );
};