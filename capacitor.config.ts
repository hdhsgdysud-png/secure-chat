import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scc.falcon',
  appName: 'FALCON',
  webDir: 'public',
  server: {
    allowNavigation: ['*']
  }
};

export default config;