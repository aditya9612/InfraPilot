import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";
import type { JSX } from "react";

interface Props {
  children?: JSX.Element;
  allowedRoles?: Role[];
}

const DELETED_ACCOUNT_MSG = "Your account has been delete. Please contact Admin.";

const isClientDeleted = (user: any) => {
  if (!user) return false;
  try {
    const raw = localStorage.getItem("infrapilot_deleted_clients");
    if (!raw) return false;
    const deletedList = JSON.parse(raw);
    const cleanMob = (user.mobile || user.phone || "").replace(/\D/g, "").slice(-10);
    const uid = String(user.id || user.user_id || "");
    const email = (user.email || "").toLowerCase();
    return deletedList.some((d: any) => {
      const dMob = (d.mobile || d.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanMob && dMob && cleanMob === dMob) return true;
      if (uid && d.id && String(d.id) === uid) return true;
      if (email && d.email && d.email.toLowerCase() === email) return true;
      return false;
    });
  } catch {
    return false;
  }
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (user && isClientDeleted(user)) {
    try {
      localStorage.removeItem("infrapilot_user");
      localStorage.removeItem("client_selected_project_id");
      logout?.();
    } catch { }
    return <Navigate to="/login" state={{ error: DELETED_ACCOUNT_MSG }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
