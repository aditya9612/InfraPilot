import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import type { ReactNode } from "react";

export type Role =
  | "Admin"
  | "ProjectManager"
  | "SiteEngineer"
  | "Accountant"
  | "Client";

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  token: {
    access_token: string;
    token_type: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => {
    const stored = localStorage.getItem("infrapilot_user");
    if (!stored) return false;
    try {
      const storedUser = JSON.parse(stored);
      const token = storedUser.token?.access_token || storedUser.token;
      const isMockToken =
        token === "mock_test_token_client_transparency" ||
        token === "mock_accountant_token" ||
        token === "mock_manager_token";
      return storedUser.role === "Client" && !isMockToken;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem("infrapilot_user");
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const storedUser = JSON.parse(stored);
        const token = storedUser.token?.access_token || storedUser.token;
        const isMockToken =
          token === "mock_test_token_client_transparency" ||
          token === "mock_accountant_token" ||
          token === "mock_manager_token";

        if (storedUser.role === "Client" && !isMockToken) {
          const profile = await authService.getMe();
          const updatedUser: User = {
            ...storedUser,
            name: profile.full_name,
            role: profile.role as Role,
          };
          setUser(updatedUser);
          localStorage.setItem("infrapilot_user", JSON.stringify(updatedUser));
        } else {
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        localStorage.removeItem("infrapilot_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("infrapilot_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("infrapilot_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
