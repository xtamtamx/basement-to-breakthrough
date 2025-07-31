import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouch } from '@hooks/useTouch';
import { SwipeDirection } from '@game/types';
import { haptics } from '@utils/mobile';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface SwipeableTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  showIndicator?: boolean;
  className?: string;
}

export const SwipeableTabs: React.FC<SwipeableTabsProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  showIndicator = true,
  className = ''
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    if (defaultTab) {
      const index = tabs.findIndex(t => t.id === defaultTab);
      return index >= 0 ? index : 0;
    }
    return 0;
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabChange = (index: number) => {
    if (index < 0 || index >= tabs.length) return;
    
    setActiveTabIndex(index);
    haptics.light();
    onTabChange?.(tabs[index].id);
    
    // Scroll tab into view
    const tabElement = tabRefs.current[index];
    if (tabElement) {
      tabElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
  };

  const touchHandlers = useTouch({
    onSwipe: (direction: SwipeDirection) => {
      if (direction === SwipeDirection.LEFT && activeTabIndex < tabs.length - 1) {
        handleTabChange(activeTabIndex + 1);
      } else if (direction === SwipeDirection.RIGHT && activeTabIndex > 0) {
        handleTabChange(activeTabIndex - 1);
      }
    },
    swipeThreshold: 50
  });

  useEffect(() => {
    // Initialize tab refs array
    tabRefs.current = tabRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab headers */}
      <div className="relative border-b border-gray-800">
        <div className="overflow-x-auto scrollbar-hide-x">
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[index] = el)}
                onClick={() => handleTabChange(index)}
                className={`
                  flex items-center gap-2 px-4 py-3 whitespace-nowrap
                  transition-colors duration-200
                  ${activeTabIndex === index 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                  }
                `}
              >
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active indicator */}
        {showIndicator && (
          <motion.div
            className="absolute bottom-0 h-0.5 bg-punk-magenta"
            layoutId="activeTab"
            initial={false}
            animate={{
              x: tabRefs.current[activeTabIndex]?.offsetLeft || 0,
              width: tabRefs.current[activeTabIndex]?.offsetWidth || 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </div>

      {/* Tab content */}
      <div 
        ref={contentRef}
        className="flex-1 relative overflow-hidden"
        {...touchHandlers}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tabs[activeTabIndex].id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {tabs[activeTabIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab indicators (dots) */}
      {tabs.length > 1 && (
        <div className="flex justify-center gap-2 py-2">
          {tabs.map((_, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${activeTabIndex === index 
                  ? 'bg-punk-magenta w-6' 
                  : 'bg-gray-600'
                }
              `}
              aria-label={`Go to tab ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};