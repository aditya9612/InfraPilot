import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/common/DashboardLayout";
import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import AccountantDashboard from "../pages/dashboard/AccountantDashboard";
import Unauthorized from "../pages/Unauthorized";
import ProjectsPage from "../pages/admin/ProjectsPage";
import UsersPage from "../pages/admin/UsersPage";
import ClientsPage from "../pages/admin/ClientsPage";
import OwnersListPage from "../pages/admin/OwnersListPage";
import AgreementUploadPage from "../pages/admin/AgreementUploadPage";
import PaymentTrackerPage from "../pages/admin/PaymentTrackerPage";
import OwnerLedgerPage from "../pages/admin/OwnerLedgerPage";
import AutoCADPage from "../pages/admin/AutoCADPage";
import EngineersPage from "../pages/admin/EngineersPage";
import BOQPage from "../pages/admin/BOQPage";
import InventoryPage from "../pages/admin/InventoryPage";
import FinancePage from "../pages/admin/FinancePage";
import ApprovalsPage from "../pages/admin/ApprovalsPage";
// import ReportsPage from "../pages/admin/ReportsPage";
import NotificationsPage from "../pages/admin/NotificationsPage";
import DocumentsPage from "../pages/admin/DocumentsPage";
import MasterDataPage from "../pages/admin/MasterDataPage";
import IntegrationsPage from "../pages/admin/IntegrationsPage";
// import SettingsPage from "../pages/admin/SettingsPage";
import RolesPage from "../pages/admin/RolesPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import MeasurementPage from "../pages/admin/MeasurementPage";
import ProjectDetailsPage from "../pages/projects/ProjectDetailsPage";

// Client Pages
import ClientOverviewPage from "../pages/client/ClientOverviewPage";
import ClientProjectOverviewPage from "../pages/client/ClientProjectOverviewPage";
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
import ClientWorkFocusDetailsPage from "../pages/client/ClientWorkFocusDetailsPage";

// Engineer Pages
import EngineerDashboard from "../pages/engineer/EngineerDashboard";
import DSRPage from "../pages/engineer/DSRPage";
import SitePhotosPage from "../pages/engineer/SitePhotosPage";
import ReportsPage from "../pages/engineer/ReportsPage";
import SettingsPage from "../pages/engineer/SettingsPage";
import ActivityListPage from "../pages/engineer/WorkProgress/ActivityListPage";
import DailyProgressEntryPage from "../pages/engineer/WorkProgress/DailyProgressEntryPage";
import LaborAttendancePage from "../pages/engineer/LaborManagement/LaborAttendancePage";
import LaborReportsPage from "../pages/engineer/LaborManagement/LaborReportsPage";
import LaborDetailsPage from "../pages/engineer/LaborManagement/LaborDetailsPage";
import MaterialReceiptPage from "../pages/engineer/MaterialManagement/MaterialReceiptPage";
import MaterialConsumptionPage from "../pages/engineer/MaterialManagement/MaterialConsumptionPage";
import MaterialStockPage from "../pages/engineer/MaterialManagement/MaterialStockPage";
import QCInspectionPage from "../pages/engineer/QC/QCInspectionPage";
import QCTestReportsPage from "../pages/engineer/QC/QCTestReportsPage";
import MachineryPage from "../pages/engineer/MachineryManagement/MachineryPage";
import SafetyChecklistPage from "../pages/engineer/Safety/SafetyChecklistPage";
import IncidentReportPage from "../pages/engineer/Safety/IncidentReportPage";
import IssueTrackerPage from "../pages/engineer/IssueTracker/IssueTrackerPage";
import DrawingsDocumentsPage from "../pages/engineer/Drawings/DrawingsDocumentsPage";
import ChecklistsPage from "../pages/engineer/Checklists/ChecklistsPage";
import MaterialRequestPage from "../pages/engineer/Approvals/MaterialRequestPage";
import WorkApprovalPage from "../pages/engineer/Approvals/WorkApprovalPage";




// Accountant Pages
import ChartOfAccountsPage from "../pages/accountant/ChartOfAccountsPage";
import ReceivablesPage from "../pages/accountant/ReceivablesPage";
import ReceivablesRABillsPage from "../pages/accountant/ReceivablesRABillsPage";
import ReceivablesCreditNotesPage from "../pages/accountant/ReceivablesCreditNotesPage";
import PayablesPage from "../pages/accountant/PayablesPage";
import ExpensesPage from "../pages/accountant/ExpensesPage";
import PaymentsReceiptsPage from "../pages/accountant/PaymentsReceiptsPage";
import TaxationPage from "../pages/accountant/TaxationPage";
import PayrollPage from "../pages/accountant/PayrollPage";
import BankingPage from "../pages/accountant/BankingPage";
import JournalEntriesPage from "../pages/accountant/JournalEntriesPage";
import FixedAssetsPage from "../pages/accountant/FixedAssetsPage";
import AccountantReportsPage from "../pages/accountant/AccountantReportsPage";
import AccountantSettingsPage from "../pages/accountant/AccountantSettingsPage";

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  const paths: Record<string, string> = {
    Admin: "/admin",
    ProjectManager: "/manager",
    SiteEngineer: "/engineer",
    Accountant: "/accountant",
    Client: "/client",
  };
  return <Navigate to={paths[user!.role] || "/admin"} replace />;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/login" element={<Login />} />
        {/* Persistent Dashboard Layout Group */}
        <Route element={<ProtectedRoute />}>
          {" "}
          {/* No role restriction here, inner routes will handle */}
          <Route element={<DashboardLayout />}>
            {/* Admin Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/projects" element={<ProjectsPage />} />
              <Route
                path="/admin/projects/:id"
                element={<ProjectDetailsPage />}
              />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/roles" element={<RolesPage />} />
              <Route
                path="/admin/users/permissions"
                element={<PermissionsPage />}
              />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/owners/list" element={<OwnersListPage />} />
              <Route
                path="/admin/owners/agreements"
                element={<AgreementUploadPage />}
              />
              <Route
                path="/admin/owners/payments"
                element={<PaymentTrackerPage />}
              />
              <Route
                path="/admin/owners/ledger"
                element={<OwnerLedgerPage />}
              />
              <Route path="/admin/autocad" element={<AutoCADPage />} />
              <Route path="/admin/engineers" element={<EngineersPage />} />
              <Route path="/admin/boq" element={<BOQPage />} />
              <Route path="/admin/boq/setup" element={<BOQPage />} />
              <Route path="/admin/boq/activities" element={<BOQPage />} />
              <Route path="/admin/inventory" element={<InventoryPage />} />
              <Route
                path="/admin/inventory/master"
                element={<InventoryPage />}
              />
              <Route
                path="/admin/inventory/stock"
                element={<InventoryPage />}
              />
              <Route path="/admin/finance" element={<FinancePage />} />
              <Route path="/admin/finance/invoices" element={<FinancePage />} />
              <Route path="/admin/finance/payments" element={<FinancePage />} />
              <Route path="/admin/finance/expenses" element={<FinancePage />} />
              <Route path="/admin/finance/profit" element={<FinancePage />} />
              <Route path="/admin/approvals" element={<ApprovalsPage />} />
              <Route
                path="/admin/approvals/material"
                element={<ApprovalsPage />}
              />
              <Route
                path="/admin/approvals/billing"
                element={<ApprovalsPage />}
              />
              <Route
                path="/admin/approvals/expense"
                element={<ApprovalsPage />}
              />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/reports/progress" element={<ReportsPage />} />
              <Route
                path="/admin/reports/financial"
                element={<ReportsPage />}
              />
              <Route path="/admin/reports/labor" element={<ReportsPage />} />
              <Route
                path="/admin/reports/consumption"
                element={<ReportsPage />}
              />
              <Route
                path="/admin/reports/performance"
                element={<ReportsPage />}
              />
              <Route
                path="/admin/notifications"
                element={<NotificationsPage />}
              />
              <Route path="/admin/documents" element={<DocumentsPage />} />
              <Route path="/admin/measurements" element={<MeasurementPage />} />
              <Route path="/admin/master-data" element={<MasterDataPage />} />
              <Route
                path="/admin/master-data/materials"
                element={<MasterDataPage />}
              />
              <Route
                path="/admin/master-data/labor"
                element={<MasterDataPage />}
              />
              <Route
                path="/admin/master-data/activities"
                element={<MasterDataPage />}
              />
              <Route
                path="/admin/master-data/units"
                element={<MasterDataPage />}
              />
              <Route
                path="/admin/integrations"
                element={<IntegrationsPage />}
              />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
            {/* Manager Specific Routes */}
            <Route
              element={<ProtectedRoute allowedRoles={["ProjectManager"]} />}
            >
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/projects" element={<ProjectsPage />} />
              <Route
                path="/manager/projects/:id"
                element={<ProjectDetailsPage />}
              />
            </Route>

            {/* Engineer Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SiteEngineer"]} />}>
              <Route path="/engineer" element={<EngineerDashboard />} />
              <Route path="/engineer/dsr" element={<DSRPage />} />
              <Route path="/engineer/photos" element={<SitePhotosPage />} />
              <Route path="/engineer/reports" element={<ReportsPage />} />
              <Route path="/engineer/settings" element={<SettingsPage />} />
              <Route path="/engineer/progress/activities" element={<ActivityListPage />} />
              <Route path="/engineer/progress/entry" element={<DailyProgressEntryPage />} />
              <Route path="/engineer/labor/attendance" element={<LaborAttendancePage />} />
              <Route path="/engineer/labor/reports" element={<LaborReportsPage />} />
              <Route path="/engineer/labor/details" element={<LaborDetailsPage />} />
              <Route path="/engineer/material/receipt" element={<MaterialReceiptPage />} />
              <Route path="/engineer/material/consumption" element={<MaterialConsumptionPage />} />
              <Route path="/engineer/material/stock" element={<MaterialStockPage />} />
              <Route path="/engineer/qc/inspection" element={<QCInspectionPage />} />
              <Route path="/engineer/qc/reports" element={<QCTestReportsPage />} />
              <Route path="/engineer/machinery" element={<MachineryPage />} />
              <Route path="/engineer/safety/checklist" element={<SafetyChecklistPage />} />
              <Route path="/engineer/safety/incident" element={<IncidentReportPage />} />
              <Route path="/engineer/issues" element={<IssueTrackerPage />} />
              <Route path="/engineer/drawings" element={<DrawingsDocumentsPage />} />
              <Route path="/engineer/checklists" element={<ChecklistsPage />} />
              <Route path="/engineer/approvals/material" element={<MaterialRequestPage />} />
              <Route path="/engineer/approvals/work" element={<WorkApprovalPage />} />
            </Route>

            {/* Accountant Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Accountant"]} />}>
              <Route path="/accountant" element={<AccountantDashboard />} />
              <Route
                path="/accountant/chart-of-accounts"
                element={<ChartOfAccountsPage />}
              />
              <Route
                path="/accountant/chart-of-accounts/:category"
                element={<ChartOfAccountsPage />}
              />
              <Route
                path="/accountant/receivables"
                element={
                  <Navigate to="/accountant/receivables/invoices" replace />
                }
              />
              <Route
                path="/accountant/receivables/invoices"
                element={<ReceivablesPage />}
              />
              <Route
                path="/accountant/receivables/ra-bills"
                element={<ReceivablesRABillsPage />}
              />
              <Route
                path="/accountant/receivables/credit-notes"
                element={<ReceivablesCreditNotesPage />}
              />
              <Route path="/accountant/expenses" element={<ExpensesPage />} />
              <Route
                path="/accountant/expenses/:category"
                element={<ExpensesPage />}
              />
              <Route path="/accountant/payables" element={<PayablesPage />} />
              <Route
                path="/accountant/payables/:category"
                element={<PayablesPage />}
              />
              <Route
                path="/accountant/payments"
                element={<PaymentsReceiptsPage />}
              />
              <Route
                path="/accountant/payments/:category"
                element={<PaymentsReceiptsPage />}
              />
              <Route path="/accountant/taxation" element={<TaxationPage />} />
              <Route
                path="/accountant/taxation/:category"
                element={<TaxationPage />}
              />
              <Route path="/accountant/payroll" element={<PayrollPage />} />
              <Route
                path="/accountant/payroll/:category"
                element={<PayrollPage />}
              />
              <Route path="/accountant/banking" element={<BankingPage />} />
              <Route
                path="/accountant/banking/:category"
                element={<BankingPage />}
              />
              <Route
                path="/accountant/journal"
                element={<JournalEntriesPage />}
              />
              <Route path="/accountant/assets" element={<FixedAssetsPage />} />
              <Route
                path="/accountant/assets/:category"
                element={<FixedAssetsPage />}
              />
              <Route
                path="/accountant/reports"
                element={<AccountantReportsPage />}
              />
              <Route
                path="/accountant/reports/:reportId"
                element={<AccountantReportsPage />}
              />
              <Route
                path="/accountant/settings"
                element={<AccountantSettingsPage />}
              />
            </Route>

            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Client", "Admin"]} />}>
              <Route path="/client" element={<ClientOverviewPage />} />
              <Route path="/client/overview" element={<ClientOverviewPage />} />
              <Route path="/client/project-overview" element={<ClientProjectOverviewPage />} />
              <Route path="/client/progress" element={<ClientProgressPage />} />
              <Route path="/client/financials/summary" element={<ClientFinancialsSummaryPage />} />
              <Route path="/client/financials/invoices" element={<ClientInvoicesPage />} />
              <Route path="/client/financials/payments" element={<ClientPaymentsPage />} />
              <Route path="/client/site-updates/photos" element={<ClientPhotosPage />} />
              <Route path="/client/site-updates/dsr" element={<ClientDSRSummaryPage />} />
              <Route path="/client/issues" element={<ClientIssuesPage />} />
              <Route path="/client/documents" element={<ClientDocumentsPage />} />
              <Route path="/client/approvals/pending" element={<ClientPendingApprovalsPage />} />
              <Route path="/client/approvals/approved" element={<ClientApprovedItemsPage />} />
              <Route path="/client/communication/messages" element={<ClientMessagesPage />} />
              <Route path="/client/communication/announcements" element={<ClientAnnouncementsPage />} />
              <Route path="/client/reports/monthly" element={<ClientMonthlyProgressReportPage />} />
              <Route path="/client/reports/financial" element={<ClientFinancialReportPage />} />
              <Route path="/client/reports/work" element={<ClientWorkSummaryPage />} />
              <Route path="/client/work-focus-details" element={<ClientWorkFocusDetailsPage />} />
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
