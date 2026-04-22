import {Slot} from 'expo-router';
import {useEffect, useState} from 'react';
import {PaperProvider} from 'react-native-paper';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {onAuthStateChanged, signOut as firebaseSignOut} from 'firebase/auth';
import {auth as firebaseAuth} from '../lib/firebase';
import {AuthContext} from '../context/AuthContext';
import {ProfileProvider} from '../context/ProfileContext';
import {AppTheme} from '../theme';

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
      <AuthContext.Provider value={auth}>
        <ProfileProvider>
          <PaperProvider theme={AppTheme}>
            <Slot />
          </PaperProvider>
        </ProfileProvider>
      </AuthContext.Provider>
    </GestureHandlerRootView>
  );
}
