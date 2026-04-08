import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/common/DashboardLayout";
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
import RolesPage from "../pages/admin/RolesPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import ProjectDetailsPage from "../pages/projects/ProjectDetailsPage";

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
    Admin: "/admin",
    "Project Manager": "/manager",
    "Site Engineer": "/engineer",
    Contractor: "/contractor",
    Accountant: "/accountant",
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
        <Route path="/login" element={<Login />} />
        {/* Persistent Dashboard Layout Group */}
        <Route element={<ProtectedRoute />}> {/* No role restriction here, inner routes will handle */}
          <Route element={<DashboardLayout />}>
            {/* Admin Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/projects" element={<ProjectsPage />} />
              <Route path="/admin/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/roles" element={<RolesPage />} />
              <Route path="/admin/users/permissions" element={<PermissionsPage />} />
              <Route path="/admin/contractors" element={<ContractorsPage />} />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/engineers" element={<EngineersPage />} />
              <Route path="/admin/boq" element={<BOQPage />} />
              <Route path="/admin/boq/setup" element={<BOQPage />} />
              <Route path="/admin/boq/activities" element={<BOQPage />} />
              <Route path="/admin/inventory" element={<InventoryPage />} />
              <Route path="/admin/inventory/master" element={<InventoryPage />} />
              <Route path="/admin/inventory/stock" element={<InventoryPage />} />
              <Route path="/admin/finance" element={<FinancePage />} />
              <Route path="/admin/finance/invoices" element={<FinancePage />} />
              <Route path="/admin/finance/payments" element={<FinancePage />} />
              <Route path="/admin/finance/expenses" element={<FinancePage />} />
              <Route path="/admin/finance/profit" element={<FinancePage />} />
              <Route path="/admin/approvals" element={<ApprovalsPage />} />
              <Route path="/admin/approvals/material" element={<ApprovalsPage />} />
              <Route path="/admin/approvals/billing" element={<ApprovalsPage />} />
              <Route path="/admin/approvals/expense" element={<ApprovalsPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/reports/progress" element={<ReportsPage />} />
              <Route path="/admin/reports/financial" element={<ReportsPage />} />
              <Route path="/admin/reports/labor" element={<ReportsPage />} />
              <Route path="/admin/reports/consumption" element={<ReportsPage />} />
              <Route path="/admin/reports/performance" element={<ReportsPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/documents" element={<DocumentsPage />} />
              <Route path="/admin/master-data" element={<MasterDataPage />} />
              <Route path="/admin/master-data/materials" element={<MasterDataPage />} />
              <Route path="/admin/master-data/labor" element={<MasterDataPage />} />
              <Route path="/admin/master-data/activities" element={<MasterDataPage />} />
              <Route path="/admin/master-data/units" element={<MasterDataPage />} />
              <Route path="/admin/integrations" element={<IntegrationsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
            {/* Manager Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Project Manager"]} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/projects" element={<ProjectsPage />} />
              <Route path="/manager/projects/:id" element={<ProjectDetailsPage />} />
            </Route>
            {/* Engineer Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Site Engineer"]} />}>
              <Route path="/engineer" element={<EngineerDashboard />} />
            </Route>
            {/* Contractor Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Contractor"]} />}>
              <Route path="/contractor" element={<ContractorDashboard />} />
            </Route>
            {/* Accountant Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Accountant"]} />}>
              <Route path="/accountant" element={<AccountantDashboard />} />
            </Route>
            {/* Client Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Client"]} />}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/overview" element={<ClientOverviewPage />} />
              <Route path="/client/progress" element={<ClientProgressPage />} />
              <Route path="/client/financials" element={<Navigate to="/client/financials/summary" replace />} />
              <Route path="/client/financials/summary" element={<ClientFinancialsSummaryPage />} />
              <Route path="/client/financials/invoices" element={<ClientInvoicesPage />} />
              <Route path="/client/financials/payments" element={<ClientPaymentsPage />} />
              <Route path="/client/site-updates" element={<Navigate to="/client/site-updates/photos" replace />} />
              <Route path="/client/site-updates/photos" element={<ClientPhotosPage />} />
              <Route path="/client/site-updates/dsr" element={<ClientDSRSummaryPage />} />
              <Route path="/client/issues" element={<ClientIssuesPage />} />
              <Route path="/client/documents" element={<ClientDocumentsPage />} />
              <Route path="/client/approvals" element={<Navigate to="/client/approvals/pending" replace />} />
              <Route path="/client/approvals/pending" element={<ClientPendingApprovalsPage />} />
              <Route path="/client/approvals/approved" element={<ClientApprovedItemsPage />} />
              <Route path="/client/communication" element={<Navigate to="/client/communication/messages" replace />} />
              <Route path="/client/communication/messages" element={<ClientMessagesPage />} />
              <Route path="/client/communication/announcements" element={<ClientAnnouncementsPage />} />
              <Route path="/client/reports" element={<Navigate to="/client/reports/monthly" replace />} />
              <Route path="/client/reports/monthly" element={<ClientMonthlyProgressReportPage />} />
              <Route path="/client/reports/financial" element={<ClientFinancialReportPage />} />
              <Route path="/client/reports/work-summary" element={<ClientWorkSummaryPage />} />
              <Route path="/client/settings" element={<ClientSettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;