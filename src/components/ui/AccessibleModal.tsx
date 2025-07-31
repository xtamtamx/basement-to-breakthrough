import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap, useEscapeKey, useAnnouncement } from '@hooks/useAccessibility';
import { haptics } from '@utils/mobile';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  announceOnOpen?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  announceOnOpen
}) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useFocusTrap(isOpen);
  const announce = useAnnouncement();
  
  // Handle escape key
  useEscapeKey(onClose, isOpen);
  
  // Store and restore focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      if (announceOnOpen) {
        announce(announceOnOpen);
      }
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen, announce, announceOnOpen]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      haptics.light();
      onClose();
    }
  };
  
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-gray-900 rounded-lg shadow-2xl 
          border border-gray-800
          transform transition-all duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 
            id="modal-title" 
            className="text-lg font-bold text-white"
          >
            {title}
          </h2>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="
              p-2 rounded-lg
              text-gray-400 hover:text-white
              hover:bg-gray-800
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-punk-magenta
            "
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};