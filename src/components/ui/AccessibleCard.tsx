import React from 'react';
import { useAccessibleButton } from '@hooks/useAccessibility';
import { haptics } from '@utils/mobile';

interface AccessibleCardProps {
  title: string;
  description?: string;
  ariaDescription: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onKeyboardSelect?: () => void;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  description,
  ariaDescription,
  selected = false,
  disabled = false,
  onClick,
  onKeyboardSelect,
  children,
  className = '',
  icon,
  badge
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      haptics.light();
      onClick();
    }
  };
  
  const buttonProps = useAccessibleButton(
    onKeyboardSelect || onClick || (() => {}),
    disabled
  );
  
  const isInteractive = !!(onClick || onKeyboardSelect);
  
  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${selected 
          ? 'border-punk-magenta bg-gray-900/80 shadow-lg shadow-punk-magenta/20' 
          : 'border-gray-800 bg-gray-900/60'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : isInteractive 
            ? 'cursor-pointer hover:border-gray-700 hover:bg-gray-900/80 hover:scale-102' 
            : ''
        }
        ${className}
      `}
      onClick={isInteractive ? handleClick : undefined}
      aria-label={ariaDescription}
      aria-selected={selected}
      aria-disabled={disabled}
      {...(isInteractive ? buttonProps : {})}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-2 -right-2">
          {badge}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {icon && (
          <div className="flex-shrink-0 text-2xl" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {/* Content */}
      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}
      
      {/* Selected indicator */}
      {selected && (
        <div 
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-punk-magenta"
          aria-hidden="true"
        />
      )}
    </div>
  );
};