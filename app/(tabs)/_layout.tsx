import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { token } = useAuth();

  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 10,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = "home";
          switch (route.name) {
            case "home":
              iconName = "home";
              break;
            case "settings":
              iconName = "settings";
              break;
          }

          return (
            <MaterialIcons
              name={iconName as any}
              size={focused ? 28 : 24}
              color={focused ? "#007AFF" : "#999"}
            />
          );
        },
      })}
    />
  );
}
