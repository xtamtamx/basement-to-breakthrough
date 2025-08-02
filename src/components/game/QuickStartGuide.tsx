import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { haptics } from '@utils/mobile';

export const QuickStartGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    // Show guide on first visit
    const hasSeenGuide = localStorage.getItem('has-seen-quick-guide');
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  const tips = [
    {
      title: "Welcome to DIY Indie Empire!",
      content: "Build your underground music scene from basement shows to festivals.",
      icon: "🎸"
    },
    {
      title: "Navigation",
      content: "Use the bottom tabs to navigate between views. Swipe left/right to switch quickly!",
      icon: "👆"
    },
    {
      title: "Book Shows",
      content: "Go to Bands to build your roster, then Shows to book them at venues.",
      icon: "🎫"
    },
    {
      title: "Promote & Profit",
      content: "Use Promotion to boost attendance and discover Synergies for bonus multipliers!",
      icon: "📢"
    },
    {
      title: "Next Turn",
      content: "Tap the floating button (bottom-right) to advance to the next turn.",
      icon: "⏭️"
    }
  ];

  const handleClose = () => {
    localStorage.setItem('has-seen-quick-guide', 'true');
    setShowGuide(false);
    haptics.light();
  };

  const nextTip = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
      haptics.light();
    } else {
      handleClose();
    }
  };

  const prevTip = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1);
      haptics.light();
    }
  };

  if (!showGuide) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        padding: '24px',
        border: '2px solid #ec4899',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ec4899',
            margin: 0
          }}>Quick Start</h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Close guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{tips[currentTip].icon}</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#ffffff'
          }}>{tips[currentTip].title}</h3>
          <p style={{
            color: '#d1d5db',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>{tips[currentTip].content}</p>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          {tips.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentTip ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: index === currentTip ? '#ec4899' : '#4b5563',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={prevTip}
            disabled={currentTip === 0}
            style={{
              background: 'none',
              border: 'none',
              color: currentTip === 0 ? '#374151' : '#d1d5db',
              cursor: currentTip === 0 ? 'default' : 'pointer',
              padding: '8px'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={nextTip}
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {currentTip === tips.length - 1 ? 'Start Playing' : 'Next'}
            <ChevronRight size={16} />
          </button>

          <div style={{ width: '36px' }} />{/* Spacer */}
        </div>
      </div>
    </div>
  );
};