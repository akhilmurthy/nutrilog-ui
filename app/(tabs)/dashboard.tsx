import HomeCard from '@/components/HomeCard';
import {View, Text, StyleSheet} from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard</Text>
      <HomeCard/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  text: {fontSize: 24, fontWeight: '600'},
});
