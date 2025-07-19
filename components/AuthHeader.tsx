import { Image, StyleSheet, View } from "react-native";

export default function AuthHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={{
          uri: "https://firebase.google.com/downloads/brand-guidelines/PNG/logo-vertical.png",
        }}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
