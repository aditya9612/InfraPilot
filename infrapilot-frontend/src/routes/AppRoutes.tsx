import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import EngineerDashboard from "../pages/dashboard/EngineerDashboard";
import ContractorDashboard from "../pages/dashboard/ContractorDashboard";
import AccountantDashboard from "../pages/dashboard/AccountantDashboard";
import ClientDashboard from "../pages/dashboard/ClientDashboard";
import Unauthorized from "../pages/Unauthorized";
import ProjectsPage from "../pages/ProjectsPage";

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  const paths: Record<string, string> = {
    Admin: "/admin", "Project Manager": "/manager",
    "Site Engineer": "/engineer", Contractor: "/contractor", Accountant: "/accountant",
    Client: "/client",
  };
  return <Navigate to={paths[user!.role]} replace />;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={["Project Manager"]}><ManagerDashboard /></ProtectedRoute>
        } />
        <Route path="/engineer" element={
          <ProtectedRoute allowedRoles={["Site Engineer"]}><EngineerDashboard /></ProtectedRoute>
        } />
        <Route path="/contractor" element={
          <ProtectedRoute allowedRoles={["Contractor"]}><ContractorDashboard /></ProtectedRoute>
        } />
        <Route path="/accountant" element={
          <ProtectedRoute allowedRoles={["Accountant"]}><AccountantDashboard /></ProtectedRoute>
        } />
        <Route path="/client" element={
          <ProtectedRoute allowedRoles={["Client"]}><ClientDashboard /></ProtectedRoute>
        } />
         
          {/* project page */}
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/projects"
          element={
            <ProtectedRoute allowedRoles={["Project Manager"]}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
