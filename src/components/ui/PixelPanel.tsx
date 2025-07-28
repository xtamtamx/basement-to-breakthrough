import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PixelPanelProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'punk' | 'metal' | 'dialog';
  glow?: boolean;
  border?: boolean;
  children: React.ReactNode;
}

const styles = {
  panel: {
    position: 'relative' as const,
    background: '#1A1A1A',
    padding: '16px',
    imageRendering: 'pixelated' as any,
  },
  variants: {
    default: {
      background: '#2D2D2D',
      boxShadow: 'inset -2px -2px 0px 0px #000, inset 2px 2px 0px 0px #5A5A5A',
      borderColor: '#5A5A5A',
    },
    punk: {
      background: '#1A1A1A',
      boxShadow: 'inset -2px -2px 0px 0px #000, inset 2px 2px 0px 0px #FF0066',
      borderColor: '#FF0066',
    },
    metal: {
      background: '#0A0A0A',
      boxShadow: 'inset -2px -2px 0px 0px #000, inset 2px 2px 0px 0px #8B0000',
      borderColor: '#8B0000',
    },
    dialog: {
      background: '#000',
      boxShadow: 'inset -2px -2px 0px 0px #000, inset 2px 2px 0px 0px #FFF, 0 0 0 2px #000, 0 0 0 4px #FFF, 0 0 0 6px #000',
      borderColor: '#FFF',
    },
  },
  glow: {
    punk: {
      filter: 'drop-shadow(0 0 10px #FF0066)',
    },
    metal: {
      filter: 'drop-shadow(0 0 10px #8B0000)',
    },
    default: {
      filter: 'drop-shadow(0 0 10px #5A5A5A)',
    },
    dialog: {
      filter: 'none',
    },
  },
};

export const PixelPanel: React.FC<PixelPanelProps> = ({ 
  variant = 'default',
  glow = false,
  border = true,
  children,
  className = '',
  style,
  ...motionProps
}) => {
  const variantStyle = styles.variants[variant];
  const glowStyle = glow ? styles.glow[variant] : {};

  const panelStyle = {
    ...styles.panel,
    ...variantStyle,
    ...glowStyle,
    ...style,
  };

  return (
    <motion.div
      className={className}
      style={panelStyle}
      {...motionProps}
    >
      {children}
      
      {/* Pixel border effect */}
      {border && (
        <>
          <div style={{
            content: '',
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            background: `
              linear-gradient(to right, #000 4px, transparent 4px),
              linear-gradient(to bottom, #000 4px, transparent 4px),
              linear-gradient(to left, #000 4px, transparent 4px),
              linear-gradient(to top, #000 4px, transparent 4px)
            `,
            backgroundSize: '4px 100%, 100% 4px, 4px 100%, 100% 4px',
            backgroundPosition: 'left, top, right, bottom',
            backgroundRepeat: 'no-repeat',
            zIndex: -2,
            pointerEvents: 'none',
          }} />
          <div style={{
            content: '',
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            background: variantStyle.borderColor,
            zIndex: -1,
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Corner decorations for dialog variant */}
      {variant === 'dialog' && (
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '8px',
          height: '8px',
          background: '#FFF',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 'calc(100% - 20px)',
            width: '8px',
            height: '8px',
            background: '#FFF',
          }} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% - 20px)',
            left: 0,
            width: '8px',
            height: '8px',
            background: '#FFF',
          }} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% - 20px)',
            left: 'calc(100% - 20px)',
            width: '8px',
            height: '8px',
            background: '#FFF',
          }} />
        </div>
      )}
    </motion.div>
  );
};