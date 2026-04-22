import { createContext, useContext } from "react";

type AuthContextType = {
  signIn: (token: string) => void;
  signOut: () => void;
  token: string | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  signIn: () => {},
  signOut: () => {},
  token: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);
