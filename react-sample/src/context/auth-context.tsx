import { createContext } from "react";
import { AuthService } from "../services/auth-service";
import { useEffect, useState, useContext, type ReactNode } from "react";

interface AuthContextType {
  authService: AuthService;
  isInitialized: boolean;
  isAuthenticated: boolean;
}

export const authContext = createContext<AuthContextType | null>(null);

const authService = new AuthService();

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Subscribe to initialization observable
    const sub = authService.onInitializationComplete$.subscribe((complete) => {
      setIsInitialized(complete);
      if (complete) {
        setIsAuthenticated(authService.isAuthenticated);
      }
    });

    return () => sub.unsubscribe();
  }, []);

  // Update authentication state when auth operations complete
  useEffect(() => {
    if (isInitialized) {
      setIsAuthenticated(authService.isAuthenticated);
    }
  }, [isInitialized]);

  return (
    <authContext.Provider value={{ authService, isInitialized, isAuthenticated }}>{children}</authContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(authContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
