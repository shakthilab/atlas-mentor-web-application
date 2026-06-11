import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.educrm.app',
  appName: 'Atlas Mentor',
  webDir: 'dist/atlas-mentor-web-app',
  server: {
    androidScheme: 'https',
  },
};

export default config;
