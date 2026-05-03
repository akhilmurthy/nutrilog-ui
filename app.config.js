import 'dotenv/config';

/** @type {import("@expo/webpack-config").ExpoConfig} */
export default {
  expo: {
    name: 'nutrilog',
    slug: 'nutrilog',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'nutrilog',

    userInterfaceStyle: 'automatic',

    ios: {
      supportsTablet: true,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/logo.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.yourco.nutrilog',
      edgeToEdgeEnabled: true,
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/logo.png',
      name: 'Nutrilog',
      shortName: 'Nutrilog',
      themeColor: '#0c371e',
      backgroundColor: '#0c371e',
      display: 'standalone',
    },

    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/logo.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      MEASUREMENT_ID: process.env.MEASUREMENT_ID,
    },
  },
};
