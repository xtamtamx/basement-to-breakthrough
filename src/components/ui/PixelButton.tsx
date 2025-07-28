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
  pixelated?: boolean;
}

const styles = {
  button: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'monospace',
    imageRendering: 'pixelated' as any,
    WebkitFontSmoothing: 'none',
    boxShadow: 'inset -2px -2px 0px 0px rgba(0,0,0,0.5), inset 2px 2px 0px 0px rgba(255,255,255,0.3)',
  },
  sizes: {
    sm: {
      padding: '8px 12px',
      fontSize: '11px',
      minHeight: '32px',
    },
    md: {
      padding: '10px 16px',
      fontSize: '12px',
      minHeight: '40px',
    },
    lg: {
      padding: '14px 24px',
      fontSize: '14px',
      minHeight: '48px',
    },
  },
  variants: {
    primary: {
      background: '#FF0066',
      color: 'white',
    },
    secondary: {
      background: '#2D2D2D',
      color: '#FFFFFF',
    },
    success: {
      background: '#00FF00',
      color: '#000000',
    },
    danger: {
      background: '#FF0000',
      color: 'white',
    },
    ghost: {
      background: 'transparent',
      color: '#FFFFFF',
      boxShadow: 'none',
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
    imageRendering: 'pixelated' as any,
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
  pixelated = true,
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

  const hoverStyle = variant === 'primary' ? { background: '#FF3380' } :
                    variant === 'secondary' ? { background: '#3D3D3D', color: '#FF0066' } :
                    variant === 'success' ? { background: '#33FF33' } :
                    variant === 'danger' ? { background: '#FF3333' } :
                    variant === 'ghost' ? { background: 'rgba(255, 255, 255, 0.1)', color: '#FF0066' } :
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