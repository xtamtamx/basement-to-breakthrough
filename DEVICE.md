# Shipping to Device (iOS / Android)

Basement to Breakthrough is a **landscape-first** mobile game built with
React 19 + Vite + vite-plugin-pwa, wrapped for native via **Capacitor 7**.

The web/PWA install path works today. The steps below cover generating the
native iOS/Android projects and locking them to landscape. They require a full
native toolchain (**Xcode + CocoaPods** for iOS, **Android Studio + Android SDK**
for Android) and therefore must be run on a developer machine, not in CI/sandbox.

## Orientation: how the landscape lock works

There are two layers, both required:

1. **Runtime lock (already wired, JS).** `@capacitor/screen-orientation@^7` is a
   dependency. `initializeMobile()` in `src/utils/mobile.ts` calls
   `ScreenOrientation.lock({ orientation: 'landscape' })` at startup on native
   platforms (no-op on web). This enforces landscape once the web view is live.
2. **Native manifest lock (manual, below).** The OS must also be told the app is
   landscape-only so it launches in landscape *before* JS runs and never offers
   portrait. This lives in the generated native projects, which do not exist
   until you run `npx cap add`.

> Note on the plugin version: `@capacitor/screen-orientation@7.0.4` was installed
> (the `^7` line in `package.json`), matching `@capacitor/core@7`.

## 1. Generate the native projects

```bash
# from the project root (basement-to-breakthrough/)
npm ci                # if node_modules is missing
npm run build         # produces dist/ — Capacitor copies this as webDir

npx cap add ios       # creates ios/ (needs Xcode + CocoaPods)
npx cap add android   # creates android/ (needs Android Studio + SDK)
```

`ios/` and `android/` are generated, native-toolchain-specific directories and
are **not** committed in this environment.

## 2. iOS — lock to landscape (Info.plist)

Edit `ios/App/App/Info.plist` and set the supported interface orientations to
landscape only (both iPhone and iPad):

```xml
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

(You can also toggle these in Xcode under the target's *General → Deployment
Info → Device Orientation*, leaving only Landscape Left / Landscape Right.)

## 3. Android — lock to landscape (AndroidManifest.xml)

Edit `android/app/src/main/AndroidManifest.xml` and add
`android:screenOrientation="sensorLandscape"` to the main activity:

```xml
<activity
    android:name=".MainActivity"
    android:screenOrientation="sensorLandscape"
    ... >
```

`sensorLandscape` allows both landscape-left and landscape-right (rotating the
device), matching the iOS config above.

## 4. Sync and run

After editing the native projects, copy the built web assets and native config
into them:

```bash
npm run build        # rebuild web assets if you changed source
npx cap sync         # copies dist/ + installs/updates native plugins

npx cap open ios     # opens Xcode  -> run on simulator/device
npx cap open android # opens Android Studio -> run on emulator/device
```

`npx cap sync` also registers the `@capacitor/screen-orientation` native plugin
into both projects, so the runtime lock works on device.

## Quick checklist

- [ ] `npm run build` succeeds (produces `dist/`)
- [ ] `npx cap add ios` / `npx cap add android`
- [ ] iOS `Info.plist`: `UISupportedInterfaceOrientations` (+ `~ipad`) = landscape only
- [ ] Android `AndroidManifest.xml`: main activity `android:screenOrientation="sensorLandscape"`
- [ ] `npx cap sync`
- [ ] `npx cap open ios` / `npx cap open android`, then run on device
- [ ] Confirm app launches in landscape and cannot rotate to portrait
