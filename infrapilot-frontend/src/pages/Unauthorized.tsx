import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";

const ROLE_PATHS: Record<Role, string> = {
  Admin: "/admin",
  "Project Manager": "/manager",
  "Site Engineer": "/engineer",
  Contractor: "/contractor",
  Accountant: "/accountant",
  Client: "/client",
};

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-200 mb-4">403</p>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm mb-6">You don't have permission to view this page.</p>
        <button
          onClick={() => navigate(user ? ROLE_PATHS[user.role] : "/")}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
