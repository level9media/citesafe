import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.levelninemedia.citesafe',
  appName: 'CiteSafe',
  webDir: 'dist',
  server: {
    // Point to your live production URL so the app always uses the real backend
    url: 'https://citesafe.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
  },
};

export default config;
