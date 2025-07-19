import {useRouter} from 'expo-router';
import {
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
} from 'firebase/auth';
import {useState} from 'react';
import {StyleSheet} from 'react-native';
import {Button, Text, useTheme} from 'react-native-paper';

import AuthHeader from '../../components/AuthHeader';
import AuthInput from '../../components/AuthInput';
import AuthLayout from '../../components/AuthLayout';
import {useAuth} from '../../context/AuthContext';
import {app} from '../../lib/firebase';

export default function Register() {
  const {signIn} = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const auth = getAuth(app);
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCred.user, {
        displayName: fullName,
      });

      const token = await userCred.user.getIdToken();
      await signIn(token);
      router.replace('/');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader />

      <Text style={[styles.loginLink, {color: theme.colors.onSurface}]}>
        Already have an account?{' '}
        <Text
          style={[styles.link, {color: theme.colors.primary}]}
          onPress={() => router.push('/(auth)/login')}>
          Log in
        </Text>
      </Text>

      <AuthInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
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

      <Button mode="contained" onPress={handleRegister}>
        Create Account
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loginLink: {
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 10,
  },
  link: {
    fontWeight: '500',
  },
});
