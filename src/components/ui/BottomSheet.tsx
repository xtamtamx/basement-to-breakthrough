import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { haptics } from '@utils/mobile';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentages of screen height (0-100)
  defaultSnapPoint?: number;
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [25, 75],
  defaultSnapPoint = 0,
  showHandle = true,
  closeOnOverlayClick = true,
  maxHeight = '90vh'
}) => {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getSnapPointHeight = (percentage: number) => {
    return window.innerHeight * (percentage / 100);
  };

  const findNearestSnapPoint = (y: number): number => {
    const heights = snapPoints.map(p => getSnapPointHeight(p));
    const distances = heights.map(h => Math.abs(window.innerHeight - y - h));
    const minDistance = Math.min(...distances);
    return distances.indexOf(minDistance);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = info.point.y;
    
    // Close if dragged down significantly or with high velocity
    if (velocity > 500 || (currentY > window.innerHeight * 0.8 && velocity > 0)) {
      haptics.light();
      onClose();
      return;
    }

    // Snap to nearest point
    const nearestIndex = findNearestSnapPoint(currentY);
    setCurrentSnapIndex(nearestIndex);
    haptics.light();
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset snap point when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(defaultSnapPoint);
    }
  }, [isOpen, defaultSnapPoint]);

  if (!isOpen) return null;

  const currentHeight = getSnapPointHeight(snapPoints[currentSnapIndex]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ 
              y: window.innerHeight - currentHeight,
              transition: { type: 'spring', damping: 30, stiffness: 300 }
            }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-2xl shadow-2xl"
            style={{ maxHeight, touchAction: 'none' }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="px-4 pb-3 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">{title}</h3>
              </div>
            )}

            {/* Content */}
            <div 
              ref={contentRef}
              className="overflow-y-auto overscroll-contain"
              style={{ 
                maxHeight: `calc(${maxHeight} - ${showHandle ? '48px' : '0px'} - ${title ? '60px' : '0px'})`,
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="p-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};