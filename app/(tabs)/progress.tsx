import {View, Text, StyleSheet} from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress 📈</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  text: {fontSize: 24, fontWeight: '600'},
});
