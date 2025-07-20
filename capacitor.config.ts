import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.basementtobreakthrough.app',
  appName: 'Basement to Breakthrough',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    hostname: 'basementtobreakthrough.app'
  },
  backgroundColor: '#000000',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#000000',
    scrollEnabled: false,
    overrideUserAgent: 'BasementToBreakthrough/1.0 iOS'
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
    captureInput: true,
    overrideUserAgent: 'BasementToBreakthrough/1.0 Android',
    webContentsDebuggingEnabled: false // Set to true for development
  }
};

export default config;
