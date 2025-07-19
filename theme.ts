import { MD3DarkTheme as DarkTheme } from "react-native-paper";

export const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#FF6F00",
    background: "#000",
    surface: "#111",
    onPrimary: "#fff",
    onSurface: "#fff",
    text: "#fff",
  },
};
