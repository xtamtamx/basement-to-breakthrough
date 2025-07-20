import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SimpleHybridLayoutProps {
  children: ReactNode;
}

export const SimpleHybridLayout: React.FC<SimpleHybridLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="fixed inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(233, 69, 96, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(156, 39, 176, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(0, 188, 212, 0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* Cyber grid */}
      <div className="cyber-grid opacity-20" />

      {/* Scanline effect (subtle) */}
      <div className="scanlines" style={{ opacity: 0.03 }} />

      {/* Main content with glass panel */}
      <div className="relative z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-30"
        style={{
          background: 'linear-gradient(to top, rgba(12, 10, 15, 0.8) 0%, transparent 100%)'
        }}
      />
    </div>
  );
};