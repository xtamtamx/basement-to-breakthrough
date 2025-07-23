import React from 'react';
import { AnimatePresence } from 'framer-motion';

interface ModalManagerProps {
  children: React.ReactNode;
}

export const ModalManager: React.FC<ModalManagerProps> = ({ children }) => {
  // Get all children that are modals
  const childArray = React.Children.toArray(children);
  const activeModal = childArray.find(child => {
    if (!React.isValidElement(child)) return false;
    // Check if the modal is open (has isOpen prop or is conditionally rendered)
    return child.props?.isOpen || (child.type && child.props);
  });

  return (
    <AnimatePresence mode="wait">
      {activeModal && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 40 }}
          />
          {/* Modal Content */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 41 }}
          >
            {activeModal}
          </div>
        </>
      )}
    </AnimatePresence>
  );
};