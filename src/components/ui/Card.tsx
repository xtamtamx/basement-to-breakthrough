import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'punk' | 'metal' | 'success' | 'warning';
  glow?: boolean;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  variant = 'default',
  glow = false,
  interactive = true,
  className = '',
  children,
  ...motionProps
}) => {
  const variantClasses = {
    default: 'card-default',
    punk: 'card-punk',
    metal: 'card-metal',
    success: 'card-success',
    warning: 'card-warning',
  };

  const glowClasses = {
    default: '',
    punk: 'glow-pink',
    metal: 'glow-red',
    success: 'glow-green',
    warning: 'glow-amber',
  };

  return (
    <motion.div
      className={`
        card 
        ${variantClasses[variant]} 
        ${glow ? glowClasses[variant] : ''} 
        ${interactive ? 'interactive' : ''}
        ${className}
      `}
      whileHover={interactive ? { scale: 1.02, y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...motionProps}
    >
      {children}

      <style jsx>{`
        .card {
          background: var(--bg-card);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: all var(--transition-base);
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.05) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: opacity var(--transition-fast);
          pointer-events: none;
        }

        .card.interactive:hover::before {
          opacity: 1;
        }

        .card.interactive:hover {
          border-color: var(--border-light);
          background: var(--bg-hover);
        }

        /* Variant styles */
        .card-punk {
          border-color: var(--punk-magenta);
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, var(--bg-card) 100%);
        }

        .card-punk.interactive:hover {
          border-color: var(--punk-pink);
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, var(--bg-hover) 100%);
        }

        .card-metal {
          border-color: var(--metal-blood);
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, var(--bg-card) 100%);
        }

        .card-metal.interactive:hover {
          border-color: var(--metal-red);
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, var(--bg-hover) 100%);
        }

        .card-success {
          border-color: var(--success-emerald);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-card) 100%);
        }

        .card-success.interactive:hover {
          border-color: var(--success-green);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-hover) 100%);
        }

        .card-warning {
          border-color: var(--warning-amber);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, var(--bg-card) 100%);
        }

        .card-warning.interactive:hover {
          border-color: var(--warning-gold);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-hover) 100%);
        }

        /* Glow effects */
        .glow-pink {
          box-shadow: 
            0 0 20px rgba(255, 0, 110, 0.3),
            0 0 40px rgba(255, 0, 110, 0.2),
            inset 0 0 60px rgba(255, 0, 110, 0.05);
        }

        .glow-red {
          box-shadow: 
            0 0 20px rgba(220, 38, 38, 0.3),
            0 0 40px rgba(220, 38, 38, 0.2),
            inset 0 0 60px rgba(220, 38, 38, 0.05);
        }

        .glow-green {
          box-shadow: 
            0 0 20px rgba(16, 185, 129, 0.3),
            0 0 40px rgba(16, 185, 129, 0.2),
            inset 0 0 60px rgba(16, 185, 129, 0.05);
        }

        .glow-amber {
          box-shadow: 
            0 0 20px rgba(245, 158, 11, 0.3),
            0 0 40px rgba(245, 158, 11, 0.2),
            inset 0 0 60px rgba(245, 158, 11, 0.05);
        }

        @media (max-width: 768px) {
          .card {
            padding: 16px;
            border-radius: 8px;
          }
        }
      `}</style>
    </motion.div>
  );
};