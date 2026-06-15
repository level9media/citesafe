import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.levelninemedia.citesafe',
  appName: 'CiteSafe',
  webDir: 'dist/public', // Vite outputs to dist/public per vite.config.ts build.outDir
  // NOTE: No server.url override — app uses bundled assets, API calls go to citesafe.app via fetch
  // This makes it feel like a real native app, not a browser wrapper
  ios: {
    contentInset: 'always',
    backgroundColor: '#1F2224',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1F2224',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1F2224',
    },
    // @capacitor/browser — SFSafariViewController for in-app OAuth on iOS.
    // The citesafe:// URL scheme must also be registered in ios/App/App/Info.plist
    // (CFBundleURLTypes) so the OS knows to route the deep link back to this app.
    Browser: {
      androidxBrowserVersion: '1.8.0',
    },
  },
};

export default config;
