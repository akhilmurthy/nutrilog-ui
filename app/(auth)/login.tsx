// app/(auth)/login.tsx
import {useRouter} from 'expo-router';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {useState} from 'react';

import {StyleSheet} from 'react-native';
import {Button, Text, useTheme} from 'react-native-paper';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import {useAuth} from '../../context/AuthContext';
import {app} from '../../lib/firebase';

export default function Login() {
  const {signIn} = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const token = await userCredential.user.getIdToken();
      await signIn(token);
      router.replace('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader />
      <Text style={styles.signup}>
        Don’t have an account?{' '}
        <Text
          style={[styles.link, {color: theme.colors.primary}]}
          onPress={() => router.push('/(auth)/register')}>
          Sign up
        </Text>
      </Text>

      <AuthInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button mode="contained" onPress={handleLogin}>
        Log In
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  signup: {
    fontSize: 14,
    marginLeft: 10,
  },
  link: {
    color: '#007AFF',
    fontWeight: '500',
  },
});
