import {Image, StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import logoImage from '../assets/images/logo.png';

export default function AuthHeader() {
  return (
    <View style={styles.header}>
      <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      <Text style={styles.appName}>NutriLog</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#eef3e0',
  },
});
