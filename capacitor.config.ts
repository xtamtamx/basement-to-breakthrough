import type { CapacitorConfig } from '@capacitor/cli';

/**
 * ORIENTATION: this game is landscape-first.
 *
 * Capacitor 7 has no cross-platform orientation key in CapacitorConfig, so the
 * lock must be applied in the generated native projects after running
 * `npx cap add ios` / `npx cap add android`:
 *
 * iOS — ios/App/App/Info.plist:
 *   <key>UISupportedInterfaceOrientations</key>
 *   <array>
 *     <string>UIInterfaceOrientationLandscapeLeft</string>
 *     <string>UIInterfaceOrientationLandscapeRight</string>
 *   </array>
 *   <key>UISupportedInterfaceOrientations~ipad</key>
 *   <array>
 *     <string>UIInterfaceOrientationLandscapeLeft</string>
 *     <string>UIInterfaceOrientationLandscapeRight</string>
 *   </array>
 *
 * Android — android/app/src/main/AndroidManifest.xml (main activity):
 *   <activity ... android:screenOrientation="sensorLandscape">
 *
 * Runtime lock (native): @capacitor/screen-orientation is now a dependency and
 * initializeMobile() calls ScreenOrientation.lock({ orientation: 'landscape' })
 * at startup (no-op on web — see src/utils/mobile.ts). The native Info.plist /
 * AndroidManifest entries above are still required so the app launches in
 * landscape before JS runs and the OS never offers portrait. See DEVICE.md.
 */
const config: CapacitorConfig = {
  // NOTE: appId is the permanent native bundle identifier. Set to match the
  // "Settling Up" branding; change the reverse-domain to one you control before
  // generating the native projects / submitting to the stores.
  appId: 'com.settlingup.app',
  appName: 'Settling Up',
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
