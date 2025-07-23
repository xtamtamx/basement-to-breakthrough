import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { haptics } from '@utils/mobile';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  onClick,
  disabled,
  ...motionProps
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      haptics.light();
      onClick?.(e);
    }
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };

  return (
    <motion.button
      className={`
        btn 
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${fullWidth ? 'btn-full' : ''}
        ${loading ? 'btn-loading' : ''}
        ${disabled ? 'btn-disabled' : ''}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...motionProps}
    >
      {loading && (
        <motion.div 
          className="btn-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn-icon btn-icon-left">{icon}</span>
      )}
      
      <span className="btn-text">{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn-icon btn-icon-right">{icon}</span>
      )}

      <style jsx>{`
        .btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          letter-spacing: 0.025em;
          text-transform: uppercase;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
          overflow: hidden;
          font-family: inherit;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn:active::before {
          width: 300px;
          height: 300px;
        }

        /* Size variations */
        .btn-sm {
          padding: 10px 16px;
          font-size: 13px;
          min-height: 40px;
        }

        .btn-md {
          padding: 12px 20px;
          font-size: 14px;
          min-height: 44px;
        }

        .btn-lg {
          padding: 16px 28px;
          font-size: 16px;
          min-height: 52px;
        }

        /* Variant styles */
        .btn-primary {
          background: linear-gradient(135deg, var(--punk-pink) 0%, var(--punk-magenta) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
        }

        .btn-primary:hover:not(.btn-disabled) {
          box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 2px solid var(--border-default);
        }

        .btn-secondary:hover:not(.btn-disabled) {
          border-color: var(--punk-magenta);
          color: var(--punk-magenta);
        }

        .btn-success {
          background: linear-gradient(135deg, var(--success-emerald) 0%, var(--success-green) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-success:hover:not(.btn-disabled) {
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-danger {
          background: linear-gradient(135deg, var(--metal-blood) 0%, var(--metal-red) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .btn-danger:hover:not(.btn-disabled) {
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-primary);
          border: none;
        }

        .btn-ghost:hover:not(.btn-disabled) {
          background: var(--bg-tertiary);
          color: var(--punk-magenta);
        }

        /* States */
        .btn-full {
          width: 100%;
        }

        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-loading {
          color: transparent;
        }

        .btn-spinner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2em;
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .btn-md {
            padding: 10px 20px;
          }
        }
      `}</style>
    </motion.button>
  );
};