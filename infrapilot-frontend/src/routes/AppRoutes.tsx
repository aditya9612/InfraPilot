import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/common/DashboardLayout";
import Login from "../pages/auth/Login";

// Admin Pages
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import ProjectsPage from "../pages/admin/ProjectsPage";
import UsersPage from "../pages/admin/UsersPage";
import ContractorsPage from "../pages/admin/ContractorsPage";
import ClientsPage from "../pages/admin/ClientsPage";
import EngineersPage from "../pages/admin/EngineersPage";
import BOQPage from "../pages/admin/BOQPage";
import InventoryPage from "../pages/admin/InventoryPage";
import FinancePage from "../pages/admin/FinancePage";
import ApprovalsPage from "../pages/admin/ApprovalsPage";
import AdminReportsPage from "../pages/admin/ReportsPage";
import NotificationsPage from "../pages/admin/NotificationsPage";
import DocumentsPage from "../pages/admin/DocumentsPage";
import MasterDataPage from "../pages/admin/MasterDataPage";
import IntegrationsPage from "../pages/admin/IntegrationsPage";
import AdminSettingsPage from "../pages/admin/SettingsPage";
import RolesPage from "../pages/admin/RolesPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import ProjectDetailsPage from "../pages/projects/ProjectDetailsPage";

// Other Roles Dashboard & Shared
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import ContractorDashboard from "../pages/dashboard/ContractorDashboard";
import AccountantDashboard from "../pages/dashboard/AccountantDashboard";
import ClientDashboard from "../pages/dashboard/ClientDashboard";
import Unauthorized from "../pages/Unauthorized";

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

// Engineer Pages
import EngineerDashboard from "../pages/engineer/EngineerDashboard";
import DSRPage from "../pages/engineer/DSRPage";
import ActivityListPage from "../pages/engineer/WorkProgress/ActivityListPage";
import DailyProgressEntryPage from "../pages/engineer/WorkProgress/DailyProgressEntryPage";
import AttendancePage from "../pages/engineer/LaborManagement/AttendancePage";
import LaborDetailsPage from "../pages/engineer/LaborManagement/LaborDetailsPage";
import MaterialReceiptPage from "../pages/engineer/MaterialManagement/MaterialReceiptPage";
import MaterialConsumptionPage from "../pages/engineer/MaterialManagement/MaterialConsumptionPage";
import StockListPage from "../pages/engineer/MaterialManagement/StockListPage";
import MachineryPage from "../pages/engineer/MachineryPage";
import InspectionPage from "../pages/engineer/QualityControl/InspectionPage";
import TestReportsPage from "../pages/engineer/QualityControl/TestReportsPage";
import SafetyChecklistPage from "../pages/engineer/SafetyManagement/SafetyChecklistPage";
import IncidentReportPage from "../pages/engineer/SafetyManagement/IncidentReportPage";
import IssueTrackerPage from "../pages/engineer/IssueTrackerPage";
import SitePhotosPage from "../pages/engineer/SitePhotosPage";
import DrawingsPage from "../pages/engineer/DrawingsPage";
import ChecklistsPage from "../pages/engineer/ChecklistsPage";
import MaterialRequestPage from "../pages/engineer/Approvals/MaterialRequestPage";
import WorkApprovalPage from "../pages/engineer/Approvals/WorkApprovalPage";
import ReportsPage from "../pages/engineer/ReportsPage";
import SettingsPage from "../pages/engineer/SettingsPage";

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
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Admin Routes */}
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
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/reports/progress" element={<AdminReportsPage />} />
              <Route path="/admin/reports/financial" element={<AdminReportsPage />} />
              <Route path="/admin/reports/labor" element={<AdminReportsPage />} />
              <Route path="/admin/reports/consumption" element={<AdminReportsPage />} />
              <Route path="/admin/reports/performance" element={<AdminReportsPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/documents" element={<DocumentsPage />} />
              <Route path="/admin/master-data" element={<MasterDataPage />} />
              <Route path="/admin/master-data/materials" element={<MasterDataPage />} />
              <Route path="/admin/master-data/labor" element={<MasterDataPage />} />
              <Route path="/admin/master-data/activities" element={<MasterDataPage />} />
              <Route path="/admin/master-data/units" element={<MasterDataPage />} />
              <Route path="/admin/integrations" element={<IntegrationsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Project Manager"]} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/projects" element={<ProjectsPage />} />
              <Route path="/manager/projects/:id" element={<ProjectDetailsPage />} />
            </Route>

            {/* Engineer Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Site Engineer"]} />}>
              <Route path="/engineer" element={<EngineerDashboard />} />
              <Route path="/engineer/dsr" element={<DSRPage />} />
              <Route path="/engineer/progress" element={<Navigate to="/engineer/progress/activities" replace />} />
              <Route path="/engineer/progress/activities" element={<ActivityListPage />} />
              <Route path="/engineer/progress/entry" element={<DailyProgressEntryPage />} />
              <Route path="/engineer/labor" element={<Navigate to="/engineer/labor/attendance" replace />} />
              <Route path="/engineer/labor/attendance" element={<AttendancePage />} />
              <Route path="/engineer/labor/details" element={<LaborDetailsPage />} />
              <Route path="/engineer/material" element={<Navigate to="/engineer/material/receipt" replace />} />
              <Route path="/engineer/material/receipt" element={<MaterialReceiptPage />} />
              <Route path="/engineer/material/consumption" element={<MaterialConsumptionPage />} />
              <Route path="/engineer/material/stock" element={<StockListPage />} />
              <Route path="/engineer/machinery" element={<MachineryPage />} />
              <Route path="/engineer/qc" element={<Navigate to="/engineer/qc/inspection" replace />} />
              <Route path="/engineer/qc/inspection" element={<InspectionPage />} />
              <Route path="/engineer/qc/reports" element={<TestReportsPage />} />
              <Route path="/engineer/safety" element={<Navigate to="/engineer/safety/checklist" replace />} />
              <Route path="/engineer/safety/checklist" element={<SafetyChecklistPage />} />
              <Route path="/engineer/safety/incident" element={<IncidentReportPage />} />
              <Route path="/engineer/issues" element={<IssueTrackerPage />} />
              <Route path="/engineer/photos" element={<SitePhotosPage />} />
              <Route path="/engineer/drawings" element={<DrawingsPage />} />
              <Route path="/engineer/checklists" element={<ChecklistsPage />} />
              <Route path="/engineer/approvals" element={<Navigate to="/engineer/approvals/material" replace />} />
              <Route path="/engineer/approvals/material" element={<MaterialRequestPage />} />
              <Route path="/engineer/approvals/work" element={<WorkApprovalPage />} />
              <Route path="/engineer/reports" element={<ReportsPage />} />
              <Route path="/engineer/settings" element={<SettingsPage />} />
            </Route>

            {/* Contractor Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Contractor"]} />}>
              <Route path="/contractor" element={<ContractorDashboard />} />
            </Route>

            {/* Accountant Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Accountant"]} />}>
              <Route path="/accountant" element={<AccountantDashboard />} />
            </Route>

            {/* Client Routes */}
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