import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  confirmSignUp as authConfirmSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  getCurrentUser,
} from "@/services/auth/services";

interface AuthUser {
  userId: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser({ userId: u.userId, username: u.username }))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await authSignIn(email, password);
    const u = await getCurrentUser();
    setUser({ userId: u.userId, username: u.username });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await authSignUp(email, password);
    const needsConfirmation = result.nextStep.signUpStep === "CONFIRM_SIGN_UP";
    return { needsConfirmation };
  }, []);

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    await authConfirmSignUp(email, code);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        confirmSignUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
