import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AccessibleTooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  delay = 500,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const spacing = 8;
    
    let x = rect.left + rect.width / 2;
    let y = rect.top;
    
    switch (position) {
      case 'top':
        y = rect.top - spacing;
        break;
      case 'bottom':
        y = rect.bottom + spacing;
        break;
      case 'left':
        x = rect.left - spacing;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + spacing;
        y = rect.top + rect.height / 2;
        break;
    }
    
    setCoords({ x, y });
  };
  
  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };
  
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  // Clone element and add props
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': isVisible ? tooltipId.current : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hideTooltip();
    }
  });
  
  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2 translate-y-0',
    left: '-translate-x-full -translate-y-1/2',
    right: 'translate-x-0 -translate-y-1/2'
  };
  
  return (
    <>
      {trigger}
      {isVisible && createPortal(
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`
            fixed z-50 px-2 py-1 text-sm
            bg-gray-800 text-white rounded
            pointer-events-none
            animate-fade-in
            ${positionClasses[position]}
          `}
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};