import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.educrm.app',
  appName: 'EduCRM',
  webDir: 'dist/modernize',
  server: {
    androidScheme: 'https',
  },
};

export default config;
