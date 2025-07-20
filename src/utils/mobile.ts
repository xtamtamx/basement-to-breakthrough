import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Check if running on native platform
export const isNative = Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// Initialize mobile-specific features
export const initializeMobile = async () => {
  if (!isNative) return;

  try {
    // Set status bar to dark style to match our theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
    
    // Hide splash screen after a brief delay
    setTimeout(async () => {
      await SplashScreen.hide({ fadeOutDuration: 300 });
    }, 1000);

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
      // Add game pause/resume logic here
    });

    // Handle back button on Android
    if (getPlatform() === 'android') {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        }
      });
    }
  } catch (error) {
    console.error('Error initializing mobile features:', error);
  }
};

// Haptic feedback utilities
export const haptics = {
  light: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  },
  
  medium: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Medium });
  },
  
  heavy: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Heavy });
  },
  
  selection: async () => {
    if (!isNative) return;
    await Haptics.selectionStart();
    setTimeout(() => Haptics.selectionEnd(), 50);
  },
  
  success: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Success });
  },
  
  warning: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Warning });
  },
  
  error: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Error });
  }
};

// Device info utilities
export const getDeviceInfo = () => {
  return {
    platform: getPlatform(),
    isNative: isNative,
    isIOS: getPlatform() === 'ios',
    isAndroid: getPlatform() === 'android',
    isWeb: getPlatform() === 'web'
  };
};

// Safe area utilities
export const getSafeAreaInsets = () => {
  // These will be handled by CSS env() variables
  return {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)'
  };
};