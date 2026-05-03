import {Slot} from 'expo-router';
import {useEffect, useState} from 'react';
import {Platform, Dimensions} from 'react-native';
import {PaperProvider} from 'react-native-paper';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider, initialWindowMetrics} from 'react-native-safe-area-context';
import {onAuthStateChanged, signOut as firebaseSignOut} from 'firebase/auth';
import {auth as firebaseAuth} from '../lib/firebase';
import {AuthContext} from '../context/AuthContext';
import {ProfileProvider} from '../context/ProfileContext';
import {AppTheme} from '../theme';

// For web PWA on iOS, provide estimated safe area insets
const getInitialMetrics = () => {
  if (Platform.OS !== 'web') {
    return initialWindowMetrics;
  }
  const {height, width} = Dimensions.get('window');
  // Detect iOS PWA and provide safe area estimates
  const isIOS = /iPad|iPhone|iPod/.test(navigator?.userAgent || '');
  const isStandalone = (window?.navigator as any)?.standalone === true;

  if (isIOS && isStandalone) {
    // iPhone with notch/Dynamic Island typically has ~47px top and ~34px bottom safe area
    return {
      insets: {top: 47, bottom: 34, left: 0, right: 0},
      frame: {x: 0, y: 0, width, height},
    };
  }
  return {
    insets: {top: 0, bottom: 0, left: 0, right: 0},
    frame: {x: 0, y: 0, width, height},
  };
};

export default function Layout() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const auth = {
    signIn: async (t: string) => {
      // Token is set via onAuthStateChanged when Firebase auth succeeds
      setToken(t);
    },
    signOut: async () => {
      await firebaseSignOut(firebaseAuth);
      setToken(null);
    },
    token,
    loading,
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider initialMetrics={getInitialMetrics()}>
        <AuthContext.Provider value={auth}>
          <ProfileProvider>
            <PaperProvider theme={AppTheme}>
              <Slot />
            </PaperProvider>
          </ProfileProvider>
        </AuthContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
