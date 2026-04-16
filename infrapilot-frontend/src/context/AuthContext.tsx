import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

<<<<<<< HEAD
export type Role = "Admin" | "Project Manager" | "Site Engineer" | "Contractor" | "Accountant" | "Client";
=======
export type Role =
  | "Admin"
  | "Project Manager"
  | "Site Engineer"
  | "Contractor"
  | "Accountant"
  | "Client";
>>>>>>> testing

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: Role;
<<<<<<< HEAD
  token: string;
=======
  token: {
    access_token: string;
    token_type: string;
  };
>>>>>>> testing
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("infrapilot_user");
<<<<<<< HEAD
    return stored ? JSON.parse(stored) : null;
=======
    if (stored) return JSON.parse(stored);
    return null;
>>>>>>> testing
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("infrapilot_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("infrapilot_user");
  };

  return (
<<<<<<< HEAD
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
=======
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
>>>>>>> testing
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
