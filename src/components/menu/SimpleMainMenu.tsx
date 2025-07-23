import React from 'react';
import { RunConfig } from '@game/mechanics/RunManager';
import { haptics } from '@utils/mobile';

interface SimpleMainMenuProps {
  onStartGame: (runConfig?: RunConfig) => void;
}

export const SimpleMainMenu: React.FC<SimpleMainMenuProps> = ({ onStartGame }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: 'repeating-linear-gradient(0deg, #333 0, #333 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #333 0, #333 1px, transparent 1px, transparent 40px)',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{ 
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        padding: '20px',
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#ec4899',
            margin: '0',
            marginBottom: '0.25rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            lineHeight: 1
          }}>
            BASEMENT TO
          </h1>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#10b981',
            margin: '0',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            lineHeight: 1
          }}>
            BREAKTHROUGH
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 1.5vw, 1rem)',
            color: '#9ca3af',
            marginTop: '1rem',
            margin: '1rem 0 0 0'
          }}>
            Build Your Underground Music Empire
          </p>
        </div>

        {/* Buttons */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={() => {
              haptics.success();
              onStartGame();
            }}
            style={{
              padding: '0.875rem 2.5rem',
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              fontWeight: 'bold',
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              minWidth: '180px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#db2777'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ec4899'}
          >
            START GAME
          </button>

          <button
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: 'clamp(0.875rem, 1.25vw, 0.9rem)',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              minWidth: '180px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.color = '#ec4899';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            HOW TO PLAY
          </button>

          <button
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: 'clamp(0.875rem, 1.25vw, 0.9rem)',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              minWidth: '180px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.color = '#ec4899';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            SETTINGS
          </button>
        </div>

        {/* Version */}
        <div style={{
          marginTop: '2rem',
          fontSize: '0.8rem',
          color: '#4b5563',
          textAlign: 'center'
        }}>
          v1.0.0 - Premium Edition
        </div>
      </div>
    </div>
  );
};