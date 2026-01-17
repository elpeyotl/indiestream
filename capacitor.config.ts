import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'art.indiestream.app',
  appName: 'Indiestream',
  webDir: 'www',

  // Load from production URL (since we have a server-side backend)
  server: {
    url: 'https://indiestream.vercel.app',
    cleartext: false,
  },

  // iOS-specific settings
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#09090b',
    preferredContentMode: 'mobile',
  },

  // Android-specific settings
  android: {
    backgroundColor: '#09090b',
    // Allow media playback to continue in background
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },

  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#09090b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
    },
  },
};

export default config;
