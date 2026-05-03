import {getApps, initializeApp, getApp} from 'firebase/app';
import {initializeAuth, getAuth, Auth, browserLocalPersistence} from 'firebase/auth';
import Constants from 'expo-constants';
import {Platform} from 'react-native';

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  MEASUREMENT_ID,
} = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: MEASUREMENT_ID,
};

// Initialize app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize auth with platform-specific persistence
let auth: Auth;

const initAuth = async () => {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } else {
      // Dynamic import for React Native only
      const {getReactNativePersistence} = await import('firebase/auth');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  } catch (error: any) {
    if (error.code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
};

// For web, initialize synchronously
if (Platform.OS === 'web') {
  try {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } catch (error: any) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
} else {
  // For native, use getAuth as fallback (initAuth will be called when needed)
  auth = getAuth(app);
}

export {app, auth, initAuth};
