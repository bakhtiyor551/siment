import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tj.siment.blocks',
  appName: 'Siment',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
