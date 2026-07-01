import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { haptics } from '@utils/mobile';

interface PixelButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const styles = {
  button: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 400,
    letterSpacing: '0',
    textTransform: 'uppercase' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'none',
    fontFamily: "'Press Start 2P', ui-monospace, monospace",
    imageRendering: 'pixelated' as const,
    WebkitFontSmoothing: 'none',
    lineHeight: 1.5,
    boxShadow: 'inset -2px -2px 0px 0px rgba(0,0,0,0.45), inset 2px 2px 0px 0px rgba(255,255,255,0.4)',
  },
  sizes: {
    sm: {
      padding: '9px 12px',
      fontSize: '8px',
      minHeight: '34px',
    },
    md: {
      padding: '11px 16px',
      fontSize: '9px',
      minHeight: '42px',
    },
    lg: {
      padding: '15px 22px',
      fontSize: '11px',
      minHeight: '50px',
    },
  },
  variants: {
    primary: {
      background: 'var(--snes-magenta)',
      color: '#f7efe0',
    },
    secondary: {
      background: 'var(--snes-bg-3)',
      color: 'var(--snes-ink)',
    },
    success: {
      background: 'var(--snes-green)',
      color: '#f7efe0',
    },
    danger: {
      background: 'var(--snes-red)',
      color: '#f7efe0',
    },
    ghost: {
      background: 'var(--snes-bg)',
      color: 'var(--snes-ink)',
      boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void), 0 0 0 2px var(--snes-line)',
    },
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loading: {
    color: 'transparent',
  },
  full: {
    width: '100%',
  },
  spinner: {
    position: 'absolute' as const,
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '0',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2em',
    imageRendering: 'pixelated' as const,
  },
  text: {
    position: 'relative' as const,
    zIndex: 1,
  },
};

export const PixelButton: React.FC<PixelButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  onClick,
  disabled,
  style,
  ...motionProps
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      haptics.light();
      onClick?.(e);
    }
  };

  const buttonStyle = {
    ...styles.button,
    ...styles.sizes[size],
    ...styles.variants[variant],
    ...(disabled && styles.disabled),
    ...(loading && styles.loading),
    ...(fullWidth && styles.full),
    ...style,
  };

  const hoverStyle = variant === 'primary' ? { background: '#ff4d9e' } :
                    variant === 'secondary' ? { background: 'var(--snes-line)', color: 'var(--snes-cyan)' } :
                    variant === 'success' ? { background: '#54e094' } :
                    variant === 'danger' ? { background: '#ff7a76' } :
                    variant === 'ghost' ? { background: 'var(--snes-bg-3)', color: 'var(--snes-cyan)' } :
                    {};

  const activeStyle = variant !== 'ghost' ? {
    boxShadow: 'inset 2px 2px 0px 0px rgba(0,0,0,0.5), inset -2px -2px 0px 0px rgba(255,255,255,0.3)',
  } : {};

  return (
    <motion.button
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { ...hoverStyle, scale: 1.05 } : undefined}
      whileTap={!disabled && !loading ? { ...activeStyle, scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...motionProps}
    >
      {loading && (
        <motion.div 
          style={styles.spinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span style={styles.icon}>{icon}</span>
      )}
      
      <span style={styles.text}>{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span style={styles.icon}>{icon}</span>
      )}

      {/* Pixel border effect */}
      <div style={{
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        right: '-2px',
        bottom: '-2px',
        background: 'inherit',
        zIndex: -1,
        filter: 'brightness(0.7)',
        display: variant === 'ghost' ? 'none' : 'block',
      }} />
      <div style={{
        position: 'absolute',
        top: '-4px',
        left: '-4px',
        right: '-4px',
        bottom: '-4px',
        background: '#000',
        zIndex: -2,
        display: variant === 'ghost' ? 'none' : 'block',
      }} />
    </motion.button>
  );
};