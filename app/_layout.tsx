import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";
import { AppTheme } from "../theme";

export default function Layout() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("userToken").then((stored) => {
      setToken(stored);
      setLoading(false);
    });
  }, []);

  const auth = {
    signIn: async (t: string) => {
      await AsyncStorage.setItem("userToken", t);
      setToken(t);
    },
    signOut: async () => {
      await AsyncStorage.removeItem("userToken");
      setToken(null);
    },
    token,
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={auth}>
      <PaperProvider theme={AppTheme}>
        <Slot />
      </PaperProvider>
    </AuthContext.Provider>
  );
}
