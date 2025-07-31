import React from 'react';

interface AccessibleProgressBarProps {
  value: number;
  max: number;
  label: string;
  showLabel?: boolean;
  showValue?: boolean;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const AccessibleProgressBar: React.FC<AccessibleProgressBarProps> = ({
  value,
  max,
  label,
  showLabel = true,
  showValue = true,
  color = 'default',
  size = 'md',
  animated = true
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    default: 'bg-gray-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const getAriaValueText = () => {
    if (percentage === 100) return `${label} complete`;
    if (percentage === 0) return `${label} not started`;
    return `${label} ${percentage.toFixed(0)} percent complete`;
  };
  
  return (
    <div className="w-full">
      {(showLabel || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {showLabel && (
            <span className="text-sm font-medium text-gray-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-gray-400">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <div
          className={`
            w-full bg-gray-800 rounded-full overflow-hidden
            ${sizeClasses[size]}
          `}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuetext={getAriaValueText()}
          aria-label={label}
        >
          <div
            className={`
              h-full rounded-full transition-all duration-300
              ${colorClasses[color]}
              ${animated ? 'animate-pulse' : ''}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Milestone markers */}
        {max > 10 && (
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="absolute w-px h-full bg-gray-700"
                style={{ left: `${milestone}%` }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Screen reader only percentage */}
      <span className="sr-only">
        {percentage.toFixed(0)}% complete
      </span>
    </div>
  );
};