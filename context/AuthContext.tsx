import { createContext, useContext } from "react";

type AuthContextType = {
  signIn: (token: string) => void;
  signOut: () => void;
  token: string | null;
};

export const AuthContext = createContext<AuthContextType>({
  signIn: () => {},
  signOut: () => {},
  token: null,
});

export const useAuth = () => useContext(AuthContext);
