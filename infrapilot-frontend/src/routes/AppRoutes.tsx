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
import ProjectsPage from "../pages/admin/ProjectsPage";
import UsersPage from "../pages/admin/UsersPage";
import ContractorsPage from "../pages/admin/ContractorsPage";
import ClientsPage from "../pages/admin/ClientsPage";
import EngineersPage from "../pages/admin/EngineersPage";
import BOQPage from "../pages/admin/BOQPage";
import InventoryPage from "../pages/admin/InventoryPage";
import FinancePage from "../pages/admin/FinancePage";
import ApprovalsPage from "../pages/admin/ApprovalsPage";
import ReportsPage from "../pages/admin/ReportsPage";
import NotificationsPage from "../pages/admin/NotificationsPage";
import DocumentsPage from "../pages/admin/DocumentsPage";
import MasterDataPage from "../pages/admin/MasterDataPage";
import IntegrationsPage from "../pages/admin/IntegrationsPage";
import SettingsPage from "../pages/admin/SettingsPage";

// Client Pages
import ClientOverviewPage from "../pages/client/ClientOverviewPage";
import ClientProgressPage from "../pages/client/ClientProgressPage";
import ClientFinancialsSummaryPage from "../pages/client/financials/ClientFinancialsSummaryPage";
import ClientInvoicesPage from "../pages/client/financials/ClientInvoicesPage";
import ClientPaymentsPage from "../pages/client/financials/ClientPaymentsPage";
import ClientPhotosPage from "../pages/client/site-updates/ClientPhotosPage";
import ClientDSRSummaryPage from "../pages/client/site-updates/ClientDSRSummaryPage";
import ClientIssuesPage from "../pages/client/ClientIssuesPage";
import ClientDocumentsPage from "../pages/client/ClientDocumentsPage";
import ClientPendingApprovalsPage from "../pages/client/approvals/ClientPendingApprovalsPage";
import ClientApprovedItemsPage from "../pages/client/approvals/ClientApprovedItemsPage";
import ClientMessagesPage from "../pages/client/communication/ClientMessagesPage";
import ClientAnnouncementsPage from "../pages/client/communication/ClientAnnouncementsPage";
import ClientMonthlyProgressReportPage from "../pages/client/reports/ClientMonthlyProgressReportPage";
import ClientFinancialReportPage from "../pages/client/reports/ClientFinancialReportPage";
import ClientWorkSummaryPage from "../pages/client/reports/ClientWorkSummaryPage";
import ClientSettingsPage from "../pages/client/ClientSettingsPage";

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

        <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute allowedRoles={["Project Manager"]}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/engineer" element={<ProtectedRoute allowedRoles={["Site Engineer"]}><EngineerDashboard /></ProtectedRoute>} />
        <Route path="/contractor" element={<ProtectedRoute allowedRoles={["Contractor"]}><ContractorDashboard /></ProtectedRoute>} />
        <Route path="/accountant" element={<ProtectedRoute allowedRoles={["Accountant"]}><AccountantDashboard /></ProtectedRoute>} />
        <Route path="/client" element={<ProtectedRoute allowedRoles={["Client"]}><ClientDashboard /></ProtectedRoute>} />
        
        {/* Client Routes */}
        <Route path="/client/overview" element={<ProtectedRoute allowedRoles={["Client"]}><ClientOverviewPage /></ProtectedRoute>} />
        <Route path="/client/progress" element={<ProtectedRoute allowedRoles={["Client"]}><ClientProgressPage /></ProtectedRoute>} />
        <Route path="/client/financials" element={<Navigate to="/client/financials/summary" replace />} />
        <Route path="/client/financials/summary" element={<ProtectedRoute allowedRoles={["Client"]}><ClientFinancialsSummaryPage /></ProtectedRoute>} />
        <Route path="/client/financials/invoices" element={<ProtectedRoute allowedRoles={["Client"]}><ClientInvoicesPage /></ProtectedRoute>} />
        <Route path="/client/financials/payments" element={<ProtectedRoute allowedRoles={["Client"]}><ClientPaymentsPage /></ProtectedRoute>} />
        <Route path="/client/site-updates" element={<Navigate to="/client/site-updates/photos" replace />} />
        <Route path="/client/site-updates/photos" element={<ProtectedRoute allowedRoles={["Client"]}><ClientPhotosPage /></ProtectedRoute>} />
        <Route path="/client/site-updates/dsr" element={<ProtectedRoute allowedRoles={["Client"]}><ClientDSRSummaryPage /></ProtectedRoute>} />
        <Route path="/client/issues" element={<ProtectedRoute allowedRoles={["Client"]}><ClientIssuesPage /></ProtectedRoute>} />
        <Route path="/client/documents" element={<ProtectedRoute allowedRoles={["Client"]}><ClientDocumentsPage /></ProtectedRoute>} />
        <Route path="/client/approvals" element={<Navigate to="/client/approvals/pending" replace />} />
        <Route path="/client/approvals/pending" element={<ProtectedRoute allowedRoles={["Client"]}><ClientPendingApprovalsPage /></ProtectedRoute>} />
        <Route path="/client/approvals/approved" element={<ProtectedRoute allowedRoles={["Client"]}><ClientApprovedItemsPage /></ProtectedRoute>} />
        <Route path="/client/communication" element={<Navigate to="/client/communication/messages" replace />} />
        <Route path="/client/communication/messages" element={<ProtectedRoute allowedRoles={["Client"]}><ClientMessagesPage /></ProtectedRoute>} />
        <Route path="/client/communication/announcements" element={<ProtectedRoute allowedRoles={["Client"]}><ClientAnnouncementsPage /></ProtectedRoute>} />
        <Route path="/client/reports" element={<Navigate to="/client/reports/monthly" replace />} />
        <Route path="/client/reports/monthly" element={<ProtectedRoute allowedRoles={["Client"]}><ClientMonthlyProgressReportPage /></ProtectedRoute>} />
        <Route path="/client/reports/financial" element={<ProtectedRoute allowedRoles={["Client"]}><ClientFinancialReportPage /></ProtectedRoute>} />
        <Route path="/client/reports/work-summary" element={<ProtectedRoute allowedRoles={["Client"]}><ClientWorkSummaryPage /></ProtectedRoute>} />
        <Route path="/client/settings" element={<ProtectedRoute allowedRoles={["Client"]}><ClientSettingsPage /></ProtectedRoute>} />

        <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={["Admin"]}><ProjectsPage /></ProtectedRoute>} />
        <Route path="/manager/projects" element={<ProtectedRoute allowedRoles={["Project Manager"]}><ProjectsPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["Admin"]}><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/contractors" element={<ProtectedRoute allowedRoles={["Admin"]}><ContractorsPage /></ProtectedRoute>} />
        <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={["Admin"]}><ClientsPage /></ProtectedRoute>} />
        <Route path="/admin/engineers" element={<ProtectedRoute allowedRoles={["Admin"]}><EngineersPage /></ProtectedRoute>} />
        <Route path="/admin/boq" element={<ProtectedRoute allowedRoles={["Admin"]}><BOQPage /></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={["Admin"]}><InventoryPage /></ProtectedRoute>} />
        <Route path="/admin/finance" element={<ProtectedRoute allowedRoles={["Admin"]}><FinancePage /></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={["Admin"]}><ApprovalsPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["Admin"]}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["Admin"]}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute allowedRoles={["Admin"]}><DocumentsPage /></ProtectedRoute>} />
        <Route path="/admin/master-data" element={<ProtectedRoute allowedRoles={["Admin"]}><MasterDataPage /></ProtectedRoute>} />
        <Route path="/admin/integrations" element={<ProtectedRoute allowedRoles={["Admin"]}><IntegrationsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["Admin"]}><SettingsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;