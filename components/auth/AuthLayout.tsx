import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
});
