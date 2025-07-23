export const theme = {
  colors: {
    // Primary punk colors
    punk: {
      pink: '#FF006E',
      magenta: '#EC4899',
      neon: '#FF10F0',
    },
    
    // Metal colors
    metal: {
      red: '#DC2626',
      blood: '#991B1B',
      rust: '#92400E',
    },
    
    // Success/Money
    success: {
      green: '#10B981',
      emerald: '#059669',
      mint: '#34D399',
    },
    
    // Warning/Energy
    warning: {
      yellow: '#F59E0B',
      amber: '#D97706',
      gold: '#FCD34D',
    },
    
    // Info/Synergy
    info: {
      purple: '#8B5CF6',
      violet: '#7C3AED',
      indigo: '#6366F1',
    },
    
    // Backgrounds
    bg: {
      primary: '#0A0A0A',
      secondary: '#111111',
      tertiary: '#1A1A1A',
      card: '#161616',
      hover: '#1F1F1F',
    },
    
    // Borders
    border: {
      default: '#2A2A2A',
      light: '#333333',
      bright: '#444444',
    },
    
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1A1',
      muted: '#6B7280',
      dim: '#4B5563',
    },
  },
  
  typography: {
    fonts: {
      display: "'Bebas Neue', 'Impact', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
      '4xl': '2.5rem',  // 40px
      '5xl': '3rem',    // 48px
    },
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  radii: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
    glow: {
      pink: '0 0 20px rgba(255, 0, 110, 0.5)',
      purple: '0 0 20px rgba(139, 92, 246, 0.5)',
      green: '0 0 20px rgba(16, 185, 129, 0.5)',
    },
  },
  
  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },
};

export type Theme = typeof theme;