import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";

export type Role =
  | "Admin"
  | "ProjectManager"
  | "SiteEngineer"
  | "Accountant"
  | "Client"
  | "Labour";

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  profile_image?: string | null;
  token: {
    access_token: string;
    token_type: string;
  };
  project_id?: number;
  project_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("infrapilot_user");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("AuthContext: Corrupted user data in localStorage, clearing...", e);
      localStorage.removeItem("infrapilot_user");
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("infrapilot_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (e) {
        console.warn("AuthContext: Corrupted user data in storage event, clearing...", e);
        localStorage.removeItem("infrapilot_user");
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("infrapilot_user", JSON.stringify(userData));
    if (userData.project_id) {
      localStorage.setItem("client_selected_project_id", String(userData.project_id));
      localStorage.setItem("infrapilot_selected_project_id", String(userData.project_id));
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("infrapilot_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, refreshUser, isAuthenticated: !!user }}
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
