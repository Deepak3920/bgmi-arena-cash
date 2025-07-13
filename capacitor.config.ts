import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9c8af82f362a460dbae76ae978e566a0',
  appName: 'bgmi-arena-cash',
  webDir: 'dist',
  server: {
    url: 'https://9c8af82f-362a-460d-bae7-6ae978e566a0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  }
};

export default config;