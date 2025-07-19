import { useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { StyleSheet, View } from "react-native";
import HomeCard from "../../components/HomeCard";

export default function HomeScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <HomeCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
});
