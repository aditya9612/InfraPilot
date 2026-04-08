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

// ── Engineer Pages ──────────────────────────────────────────────────────────
import DSRPage              from "../pages/engineer/DSRPage";
import WorkProgressPage     from "../pages/engineer/WorkProgressPage";
import LaborManagementPage  from "../pages/engineer/LaborManagementPage";
import MaterialManagementPage from "../pages/engineer/MaterialManagementPage";
import MachineryPage        from "../pages/engineer/MachineryPage";
import QualityControlPage   from "../pages/engineer/QualityControlPage";
import SafetyManagementPage from "../pages/engineer/SafetyManagementPage";
import IssueTrackerPage     from "../pages/engineer/IssueTrackerPage";
import SitePhotosPage       from "../pages/engineer/SitePhotosPage";
import DrawingsPage         from "../pages/engineer/DrawingsPage";
import ChecklistsPage       from "../pages/engineer/ChecklistsPage";
import ApprovalsPage        from "../pages/engineer/ApprovalsPage";
import ReportsPage          from "../pages/engineer/ReportsPage";
import EngineerSettingsPage from "../pages/engineer/EngineerSettingsPage";

// ── Role guard wrapper ──────────────────────────────────────────────────────
const E = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={["Site Engineer"]}>{children as React.ReactElement}</ProtectedRoute>
);

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  const paths: Record<string, string> = {
    Admin: "/admin", "Project Manager": "/manager",
    "Site Engineer": "/engineer", Contractor: "/contractor",
    Accountant: "/accountant", Client: "/client",
  };
  return <Navigate to={paths[user!.role]} replace />;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Other roles */}
        <Route path="/admin"     element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/manager"   element={<ProtectedRoute allowedRoles={["Project Manager"]}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/contractor"element={<ProtectedRoute allowedRoles={["Contractor"]}><ContractorDashboard /></ProtectedRoute>} />
        <Route path="/accountant"element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantDashboard /></ProtectedRoute>} />
        <Route path="/client"    element={<ProtectedRoute allowedRoles={["Client"]}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/admin/projects"   element={<ProtectedRoute allowedRoles={["Admin"]}><ProjectsPage /></ProtectedRoute>} />
        <Route path="/manager/projects" element={<ProtectedRoute allowedRoles={["Project Manager"]}><ProjectsPage /></ProtectedRoute>} />

        {/* ── Site Engineer ── */}
        <Route path="/engineer"                    element={<E><EngineerDashboard /></E>} />
        <Route path="/engineer/dsr"                element={<E><DSRPage /></E>} />

        {/* Work Progress – with submenus */}
        <Route path="/engineer/work-progress"                   element={<Navigate to="/engineer/work-progress/activities" replace />} />
        <Route path="/engineer/work-progress/activities"        element={<E><WorkProgressPage /></E>} />
        <Route path="/engineer/work-progress/entry"             element={<E><WorkProgressPage /></E>} />

        {/* Labor Management – with submenus */}
        <Route path="/engineer/labor"                           element={<Navigate to="/engineer/labor/attendance" replace />} />
        <Route path="/engineer/labor/attendance"                element={<E><LaborManagementPage /></E>} />
        <Route path="/engineer/labor/details"                   element={<E><LaborManagementPage /></E>} />

        {/* Material Management – with submenus */}
        <Route path="/engineer/materials"                       element={<Navigate to="/engineer/materials/stock" replace />} />
        <Route path="/engineer/materials/stock"                 element={<E><MaterialManagementPage /></E>} />
        <Route path="/engineer/materials/receipt"               element={<E><MaterialManagementPage /></E>} />
        <Route path="/engineer/materials/consumption"           element={<E><MaterialManagementPage /></E>} />

        {/* Machinery */}
        <Route path="/engineer/machinery"                       element={<E><MachineryPage /></E>} />

        {/* Quality Control – with submenus */}
        <Route path="/engineer/quality-control"                 element={<Navigate to="/engineer/quality-control/inspections" replace />} />
        <Route path="/engineer/quality-control/inspections"     element={<E><QualityControlPage /></E>} />
        <Route path="/engineer/quality-control/test-reports"    element={<E><QualityControlPage /></E>} />

        {/* Safety – with submenus */}
        <Route path="/engineer/safety"                          element={<Navigate to="/engineer/safety/checklist" replace />} />
        <Route path="/engineer/safety/checklist"                element={<E><SafetyManagementPage /></E>} />
        <Route path="/engineer/safety/incidents"                element={<E><SafetyManagementPage /></E>} />

        {/* Other pages */}
        <Route path="/engineer/issues"                          element={<E><IssueTrackerPage /></E>} />
        <Route path="/engineer/photos"                          element={<E><SitePhotosPage /></E>} />
        <Route path="/engineer/drawings"                        element={<E><DrawingsPage /></E>} />
        <Route path="/engineer/checklists"                      element={<E><ChecklistsPage /></E>} />

        {/* Approvals – with submenus */}
        <Route path="/engineer/approvals"                       element={<E><ApprovalsPage /></E>} />
        <Route path="/engineer/approvals/material"              element={<E><ApprovalsPage /></E>} />
        <Route path="/engineer/approvals/work"                  element={<E><ApprovalsPage /></E>} />

        <Route path="/engineer/reports"                         element={<E><ReportsPage /></E>} />
        <Route path="/engineer/settings"                        element={<E><EngineerSettingsPage /></E>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
