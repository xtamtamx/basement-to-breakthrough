import React, { ReactNode } from 'react';
import { getDeviceInfo } from '@utils/mobile';

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  bottomNav?: ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  header,
  footer,
  bottomNav,
}) => {
  const deviceInfo = getDeviceInfo();
  
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--pixel-black)' }}>
      {/* Header with safe area */}
      {header && (
        <header className="flex-shrink-0 glass-panel-dark backdrop-blur-md" style={{ borderRadius: 0 }}>
          <div className="safe-area-container">
            {header}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="safe-area-container">
          {children}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0">
          <div className="safe-area-container">
            {footer}
          </div>
        </footer>
      )}

      {/* Bottom Navigation */}
      {bottomNav && (
        <nav className="mobile-bottom-nav glass-panel-dark backdrop-blur-md" style={{ borderRadius: 0 }}>
          {bottomNav}
        </nav>
      )}
    </div>
  );
};

// Mobile-optimized header component
interface MobileHeaderProps {
  title: string;
  subtitle?: ReactNode;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
}) => {
  return (
    <div className="flex items-center justify-between py-3 min-h-[56px]">
      {/* Left Action */}
      <div className="flex-shrink-0 w-12">
        {leftAction}
      </div>

      {/* Title */}
      <div className="flex-1 text-center px-2">
        <h1 className="pixel-text pixel-text-lg pixel-text-shadow truncate">{title}</h1>
        {subtitle && (
          <div className="mt-1">{subtitle}</div>
        )}
      </div>

      {/* Right Action */}
      <div className="flex-shrink-0 w-12">
        {rightAction}
      </div>
    </div>
  );
};

// Bottom navigation item
interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        flex-1 py-2 px-3 relative
        ${active ? 'pixel-text' : 'pixel-text'}
        transition-none
      `}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 pixel-badge pixel-badge-red" style={{ minWidth: '16px', height: '16px', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="pixel-text pixel-text-sm mt-1" style={{ 
        color: active ? 'var(--pixel-yellow)' : 'var(--pixel-gray)',
        textShadow: active ? '0 0 10px var(--pixel-yellow)' : 'none'
      }}>{label}</span>
    </button>
  );
};