import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/common/DashboardLayout";
import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import EngineerDashboard from "../pages/engineer/EngineerDashboard";
import AccountantDashboard from "../pages/dashboard/AccountantDashboard";
import Unauthorized from "../pages/Unauthorized";
import ProjectsPage from "../pages/admin/ProjectsPage";
import UsersPage from "../pages/admin/UsersPage";
import ClientsPage from "../pages/admin/ClientsPage";
import ClientDetailPage from "../pages/admin/ClientDetailPage";
import OwnersListPage from "../pages/admin/OwnersListPage";
import AgreementUploadPage from "../pages/admin/AgreementUploadPage";
import PaymentTrackerPage from "../pages/admin/PaymentTrackerPage";
import OwnerLedgerPage from "../pages/admin/OwnerLedgerPage";
import AutoCADPage from "../pages/admin/AutoCADPage";
import EngineersPage from "../pages/admin/EngineersPage";
import EngineerProfilePage from "../pages/admin/EngineerProfilePage";
import BOQPage from "../pages/admin/BOQPage";
import InventoryPage from "../pages/admin/InventoryPage";
import FinancePage from "../pages/admin/FinancePage";
import ApprovalsPage from "../pages/admin/ApprovalsPage";
import NotificationsPage from "../pages/admin/NotificationsPage";
import DocumentsPage from "../pages/admin/DocumentsPage";
import MasterDataPage from "../pages/admin/MasterDataPage";
import IntegrationsPage from "../pages/admin/IntegrationsPage";
import SettingsPage from "../pages/admin/SettingsPage";
import ReportsPage from "../pages/admin/ReportsPage";
import RolesPage from "../pages/admin/RolesPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import MeasurementPage from "../pages/admin/MeasurementPage";
import ProjectDetailsPage from "../pages/projects/ProjectDetailsPage";
import BOQDetailPage from "../pages/admin/BOQDetailPage";
import AllInvoicesPage from "../pages/admin/AllInvoicesPage";
import CreateInvoicePage from "../pages/admin/CreateInvoicePage";
import QuotationsPage from "../pages/admin/QuotationsPage";
import ManagerApprovalsPage from "../pages/manager/ApprovalsPage";
import QCGovernancePage from "../pages/manager/QCGovernancePage";
import DSRApprovalPage from "../pages/manager/DSRApprovalPage";
import ResourceOrchestratorPage from "../pages/manager/ResourceOrchestratorPage";
import ManagerSettingsPage from "../pages/manager/ManagerSettingsPage";
import WorkProgressPage from "../pages/manager/WorkProgressPage";
import ManagerTasksPage from "../pages/manager/ManagerTasksPage";
import ManagerProcurementPage from "../pages/manager/ManagerProcurementPage";
import ManagerBOQPage from "../pages/manager/ManagerBOQPage";
import ManagerQualityPage from "../pages/manager/ManagerQualityPage";
import ManagerSafetyPage from "../pages/manager/ManagerSafetyPage";
import LabourRegistryPage from "../pages/manager/Resources/LabourRegistryPage";
import EquipmentRegistryPage from "../pages/manager/Resources/EquipmentRegistryPage";
import MaterialInventoryPage from "../pages/manager/Resources/MaterialInventoryPage";

// Client Pages
import ClientOverviewPage from "../pages/client/ClientOverviewPage";
import ClientProjectOverviewPage from "../pages/client/ClientProjectOverviewPage";
import ClientProgressPage from "../pages/client/ClientProgressPage";

import ClientPhotosPage from "../pages/client/site-updates/ClientPhotosPage";
import ClientDSRSummaryPage from "../pages/client/site-updates/ClientDSRSummaryPage";
import ClientIssuesPage from "../pages/client/ClientIssuesPage";
import ClientDocumentsPage from "../pages/client/ClientDocumentsPage";
import ClientApprovalsPage from "../pages/client/ClientApprovalsPage";
import ClientMessagesPage from "../pages/client/communication/ClientMessagesPage";
import ClientAnnouncementsPage from "../pages/client/communication/ClientAnnouncementsPage";
import ClientReportsPage from "../pages/client/ClientReportsPage";
import ClientLabourReportPage from "../pages/client/project-data/ClientLabourReportPage";
import ClientMaterialReportPage from "../pages/client/project-data/ClientMaterialReportPage";
import ClientIssueReportPage from "../pages/client/project-data/ClientIssueReportPage";
import ClientCombinedReportPage from "../pages/client/project-data/ClientCombinedReportPage";
import ClientContractorPerformancePage from "../pages/client/project-data/ClientContractorPerformancePage";
import ClientProjectReportPage from "../pages/client/project-data/ClientProjectReportPage";
import ClientProfitLossPage from "../pages/client/project-data/ClientProfitLossPage";
import ClientCashflowPage from "../pages/client/project-data/ClientCashflowPage";
import ClientAssetReportPage from "../pages/client/project-data/ClientAssetReportPage";
import ClientIndividualReportPage from "../pages/client/project-data/ClientIndividualReportPage";
import ClientFinancialDetailsPage from "../pages/client/project-data/ClientFinancialDetailsPage";
import ClientMonthlyProgressPage from "../pages/client/project-data/ClientMonthlyProgressPage";
import ClientTaskStatusPage from "../pages/client/project-data/ClientTaskStatusPage";
import ClientSettingsPage from "../pages/client/ClientSettingsPage";
import ClientPaymentPage from "../pages/client/payment/ClientPaymentPage";
import ChatDashboard from "../pages/chat/ChatDashboard";

// Engineer Pages
import DSRPage from "../pages/engineer/DSRPage";
import SitePhotosPage from "../pages/engineer/SitePhotosPage";
import EngineerReportsPage from "../pages/engineer/ReportsPage";
import EngineerSettingsPage from "../pages/engineer/SettingsPage";
import EngineerNotificationsPage from "../pages/engineer/NotificationsPage";
import ActivityListPage from "../pages/engineer/WorkProgress/ActivityListPage";
import DailyProgressEntryPage from "../pages/engineer/WorkProgress/DailyProgressEntryPage";
import AttendancePage from "../pages/engineer/LabourManagement/AttendancePage";
import LabourAttendancePage from "../pages/engineer/LabourManagement/LabourAttendancePage";
import PaymentPage from "../pages/engineer/LabourManagement/PaymentPage";
import PayrollReportPage from "../pages/engineer/LabourManagement/PayrollReportPage";
import LaborDetailsPage from "../pages/engineer/LabourManagement/LaborDetailsPage";
import LabourTaskDetailPage from "../pages/engineer/LabourManagement/LabourTaskDetailPage";
import MaterialReceiptPage from "../pages/engineer/MaterialManagement/MaterialReceiptPage";
import MaterialConsumptionPage from "../pages/engineer/MaterialManagement/MaterialConsumptionPage";
import MaterialStockPage from "../pages/engineer/MaterialManagement/MaterialStockPage";
import MaterialHistoryPage from "../pages/engineer/MaterialManagement/MaterialHistoryPage";
import QCInspectionPage from "../pages/engineer/QC/QCInspectionPage";
import MachineryPage from "../pages/engineer/MachineryManagement/MachineryPage";
import SafetyManagementPage from "../pages/engineer/Safety/SafetyManagementPage";
import IssueTrackerPage from "../pages/engineer/IssueTracker/IssueTrackerPage";
import DrawingsDocumentsPage from "../pages/engineer/Drawings/DrawingsDocumentsPage";
import ChecklistsPage from "../pages/engineer/Checklists/ChecklistsPage";
import MaterialRequestPage from "../pages/engineer/Approvals/MaterialRequestPage";
import WorkApprovalPage from "../pages/engineer/Approvals/WorkApprovalPage";
import TaskManagementPage from "../pages/engineer/TaskManagement/TaskManagementPage";




// Accountant Pages
import ChartOfAccountsPage from "../pages/accountant/ChartOfAccountsPage";
import ReceivablesPage from "../pages/accountant/ReceivablesPage";
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
import ClientDashboard from "../pages/dashboard/ClientDashboard";
import LabourDashboard from "../pages/labour/LabourDashboard";
import MyTasksPage from "../pages/labour/MyTasksPage";
import PaymentsPage from "../pages/labour/PaymentsPage";
import LabourSettingsPage from "../pages/labour/LabourSettingsPage";
import LabourAttendancePageSelf from "../pages/labour/AttendancePage";
import WorkUpdatesPage from "../pages/labour/WorkUpdatesPage";
import TaskRequestsPage from "../pages/labour/TaskRequestsPage";
import LabourNotificationsPage from "../pages/labour/LabourNotificationsPage";

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  const paths: Record<string, string> = {
    Admin: "/admin",
    ProjectManager: "/manager",
    SiteEngineer: "/engineer",
    Accountant: "/accountant",
    Client: "/client",
    Labour: "/labour",
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
              <Route path="/admin/boq/:id" element={<BOQDetailPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/roles" element={<RolesPage />} />
              <Route
                path="/admin/users/permissions"
                element={<PermissionsPage />}
              />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
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
              <Route path="/admin/engineers/:id" element={<EngineerProfilePage />} />
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
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="compliance/qc" element={<QCGovernancePage />} />
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
              <Route path="/admin/reports/labour" element={<ReportsPage />} />
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
              <Route path="/admin/invoices/all" element={<AllInvoicesPage />} />
              <Route path="/admin/quotations" element={<QuotationsPage />} />
              <Route path="/admin/quotations/view/:id" element={<CreateInvoicePage />} />
              <Route path="/admin/invoices/create" element={<CreateInvoicePage />} />
              <Route path="/admin/master-data" element={<MasterDataPage />} />
              <Route
                path="/admin/master-data/materials"
                element={<MasterDataPage />}
              />
              <Route
                path="/admin/master-data/labour"
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

            {/* Shared Collaboration Routes */}
            <Route path="/chat" element={<ChatDashboard />} />

            {/* Manager Specific Routes */}
            <Route path="/manager" element={<ProtectedRoute allowedRoles={["ProjectManager"]} />}>
              <Route index element={<ManagerDashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/list" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              <Route path="work-progress" element={<WorkProgressPage />} />
              <Route path="work-progress/:tab" element={<WorkProgressPage />} />
              <Route path="tasks" element={<ManagerTasksPage />} />
              <Route path="tasks/:tab" element={<ManagerTasksPage />} />
              <Route path="approvals" element={<ManagerApprovalsPage />} />
              <Route path="approvals/dsr" element={<DSRApprovalPage />} />
              <Route path="approvals/material" element={<ManagerApprovalsPage />} />
              <Route path="approvals/expense" element={<ManagerApprovalsPage />} />
              <Route path="boq" element={<ManagerBOQPage />} />
              <Route path="boq/:tab" element={<ManagerBOQPage />} />
              <Route path="procurement" element={<ManagerProcurementPage />} />
              <Route path="procurement/:tab" element={<ManagerProcurementPage />} />
              <Route path="quality" element={<ManagerQualityPage />} />
              <Route path="quality/:tab" element={<ManagerQualityPage />} />
              <Route path="safety" element={<ManagerSafetyPage />} />
              <Route path="safety/:tab" element={<ManagerSafetyPage />} />
              <Route path="labour" element={<LabourRegistryPage />} />
              <Route path="labour/:id" element={<LabourTaskDetailPage />} />
              <Route path="resources/labour" element={<LabourRegistryPage />} />
              <Route path="resources/equipment" element={<EquipmentRegistryPage />} />
              <Route path="resources/materials" element={<MaterialInventoryPage />} />
              <Route path="resources/orchestrator" element={<ResourceOrchestratorPage />} />
              <Route path="compliance/qc" element={<QCGovernancePage />} />
              <Route path="compliance/safety" element={<SafetyManagementPage />} />
              <Route path="settings" element={<ManagerSettingsPage />} />
            </Route>

            {/* Client Specific Routes */}
            <Route
              element={<ProtectedRoute allowedRoles={["Client"]} />}
            >
              {/* Dashboard */}
              <Route path="/client" element={<ClientDashboard />} />

              {/* Projects */}
              <Route path="/client/projects" element={<ProjectsPage />} />
              <Route path="/client/projects/:id" element={<ProjectDetailsPage />} />

              {/* Overview */}
              <Route path="/client/overview" element={<ClientOverviewPage />} />
              <Route path="/client/project-overview" element={<ClientProjectOverviewPage />} />

              {/* Progress */}
              <Route path="/client/progress" element={<ClientProgressPage />} />

              {/* Site Updates */}
              <Route
                path="/client/site-updates/photos"
                element={<ClientPhotosPage />}
              />
              <Route
                path="/client/site-updates/dsr"
                element={<ClientDSRSummaryPage />}
              />
              {/* Legacy paths for backward compatibility */}
              <Route
                path="/client/photos"
                element={<ClientPhotosPage />}
              />
              <Route
                path="/client/dsr-summary"
                element={<ClientDSRSummaryPage />}
              />

              {/* Issues */}
              <Route
                path="/client/issues"
                element={<ClientIssuesPage />}
              />

              {/* Documents */}
              <Route
                path="/client/documents"
                element={<ClientDocumentsPage />}
              />

              {/* Approvals */}
              <Route
                path="/client/approvals"
                element={<ClientApprovalsPage />}
              />
              <Route
                path="/client/pending-approvals"
                element={<ClientApprovalsPage />}
              />
              <Route
                path="/client/approved-items"
                element={<ClientApprovalsPage />}
              />

              {/* Payment */}
              <Route path="/client/payment" element={<Navigate to="/client/payment/quotation" replace />} />
              <Route path="/client/payment/:tab" element={<ClientPaymentPage />} />

              {/* Communication */}
              <Route
                path="/client/communication/messages"
                element={<ClientMessagesPage />}
              />
              <Route
                path="/client/communication/announcements"
                element={<ClientAnnouncementsPage />}
              />
              {/* Legacy paths for backward compatibility */}
              <Route
                path="/client/messages"
                element={<ClientMessagesPage />}
              />
              <Route
                path="/client/announcements"
                element={<ClientAnnouncementsPage />}
              />

              {/* Reports Dashboard */}
              <Route path="/client/reports" element={<ClientReportsPage />} />
              <Route path="/client/reports/summary" element={<ClientReportsPage />} />

              {/* Specific Report Pages */}
              <Route path="/client/reports/labour" element={<ClientLabourReportPage />} />
              <Route path="/client/reports/material" element={<ClientMaterialReportPage />} />
              <Route path="/client/reports/issues" element={<ClientIssueReportPage />} />
              <Route path="/client/reports/combined" element={<ClientCombinedReportPage />} />
              <Route path="/client/reports/contractor" element={<ClientContractorPerformancePage />} />
              <Route path="/client/reports/project" element={<ClientProjectReportPage />} />
              <Route path="/client/reports/profit-loss" element={<ClientProfitLossPage />} />
              <Route path="/client/reports/cashflow" element={<ClientCashflowPage />} />
              <Route path="/client/reports/assets" element={<ClientAssetReportPage />} />
              <Route path="/client/reports/client-report" element={<ClientIndividualReportPage />} />
              <Route path="/client/reports/financial" element={<ClientFinancialDetailsPage />} />
              <Route path="/client/reports/work" element={<ClientTaskStatusPage />} />

              {/* High Level Report Pages */}
              <Route path="/client/monthly-progress-report" element={<ClientMonthlyProgressPage />} />
              <Route path="/client/financial-report" element={<ClientFinancialDetailsPage />} />
              <Route path="/client/work-summary" element={<ClientTaskStatusPage />} />

              {/* Settings */}
              <Route
                path="/client/settings"
                element={<ClientSettingsPage />}
              />
            </Route>

            {/* Engineer Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SiteEngineer"]} />}>
              <Route path="/engineer" element={<EngineerDashboard />} />
              <Route path="/engineer/dsr" element={<DSRPage />} />
              <Route path="/engineer/photos" element={<SitePhotosPage />} />
              <Route path="/engineer/reports" element={<EngineerReportsPage />} />
              <Route path="/engineer/notifications" element={<EngineerNotificationsPage />} />
              <Route path="/engineer/settings" element={<EngineerSettingsPage />} />
              <Route path="/engineer/progress/activities" element={<ActivityListPage />} />
              <Route path="/engineer/progress/entry" element={<DailyProgressEntryPage />} />
              <Route path="/engineer/labor/list" element={<LaborDetailsPage />} />
              <Route path="/engineer/labor/:id" element={<LabourTaskDetailPage />} />
              <Route path="/engineer/labor/attendance" element={<AttendancePage />} />
              <Route path="/engineer/labor/labour-attendance" element={<LabourAttendancePage />} />
              <Route path="/engineer/labor/payments" element={<PaymentPage />} />
              <Route path="/engineer/labor/reports" element={<PayrollReportPage />} />
              <Route path="/engineer/tasks" element={<TaskManagementPage />} />
              <Route path="/engineer/material/receipt" element={<MaterialReceiptPage />} />
              <Route path="/engineer/material/consumption" element={<MaterialConsumptionPage />} />
              <Route path="/engineer/material/stock" element={<MaterialStockPage />} />
              <Route path="/engineer/material/history" element={<MaterialHistoryPage />} />
              <Route path="/engineer/qc/inspection" element={<QCInspectionPage />} />
              <Route path="/engineer/qc/reports" element={<QCInspectionPage />} />
              <Route path="/engineer/machinery" element={<MachineryPage />} />
              <Route path="/engineer/safety/checklist" element={<SafetyManagementPage />} />
              <Route path="/engineer/safety/incident" element={<SafetyManagementPage />} />
              <Route path="/engineer/issues" element={<IssueTrackerPage />} />
              <Route path="/engineer/drawings" element={<DrawingsDocumentsPage />} />
              <Route path="/engineer/checklists" element={<ChecklistsPage />} />
              <Route path="/engineer/approvals/material" element={<MaterialRequestPage />} />
              <Route path="/engineer/approvals/work" element={<WorkApprovalPage />} />
            </Route>

            {/* Labour Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Labour"]} />}>
              <Route path="/labour" element={<LabourDashboard />} />
              <Route path="/labour/attendance" element={<LabourAttendancePageSelf />} />
              <Route path="/labour/tasks" element={<MyTasksPage />} />
              <Route path="/labour/work-updates" element={<WorkUpdatesPage />} />
              <Route path="/labour/task-requests" element={<TaskRequestsPage />} />
              <Route path="/labour/notifications" element={<LabourNotificationsPage />} />
              <Route path="/labour/payments" element={<PaymentsPage />} />
              <Route path="/labour/settings" element={<LabourSettingsPage />} />
            </Route>

            {/* Contractor Routes - Temporarily commented out as Contractor is not in UserRole type */}
            {/* <Route element={<ProtectedRoute allowedRoles={["Contractor"]} />}>
              <Route path="/contractor" element={<ContractorDashboard />} />
            </Route> */}

            {/* Accountant Specific Routes */}
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
                element={<Navigate to="/accountant/receivables/dashboard" replace />}
              />
              <Route
                path="/accountant/receivables/:subpage"
                element={<ReceivablesPage />}
              />
              {/* Legacy direct routes — kept for back-compat */}
              <Route
                path="/accountant/receivables/ra-bills"
                element={<ReceivablesPage />}
              />
              <Route
                path="/accountant/receivables/credit-notes"
                element={<ReceivablesPage />}
              />
              <Route
                path="/accountant/expenses"
                element={<Navigate to="/accountant/expenses/dashboard" replace />}
              />
              <Route
                path="/accountant/expenses/:category"
                element={<ExpensesPage />}
              />
              <Route
                path="/accountant/payables"
                element={<Navigate to="/accountant/payables/dashboard" replace />}
              />
              <Route
                path="/accountant/payables/:category"
                element={<PayablesPage />}
              />
              <Route
                path="/accountant/payments"
                element={<Navigate to="/accountant/payments/dashboard" replace />}
              />
              <Route
                path="/accountant/payments/:category"
                element={<PaymentsReceiptsPage />}
              />
              <Route
                path="/accountant/taxation"
                element={<Navigate to="/accountant/taxation/dashboard" replace />}
              />
              <Route
                path="/accountant/taxation/:category"
                element={<TaxationPage />}
              />
              <Route
                path="/accountant/payroll"
                element={<Navigate to="/accountant/payroll/dashboard" replace />}
              />
              <Route
                path="/accountant/payroll/:category"
                element={<PayrollPage />}
              />
              <Route
                path="/accountant/banking"
                element={<Navigate to="/accountant/banking/dashboard" replace />}
              />
              <Route
                path="/accountant/banking/:category"
                element={<BankingPage />}
              />
              <Route
                path="/accountant/journal"
                element={<Navigate to="/accountant/journal/dashboard" replace />}
              />
              <Route
                path="/accountant/journal/:category"
                element={<JournalEntriesPage />}
              />
              <Route
                path="/accountant/assets"
                element={<Navigate to="/accountant/assets/dashboard" replace />}
              />
              <Route
                path="/accountant/assets/:category"
                element={<FixedAssetsPage />}
              />
              <Route
                path="/accountant/reports"
                element={<Navigate to="/accountant/reports/dashboard" replace />}
              />
              <Route
                path="/accountant/reports/:category"
                element={<AccountantReportsPage />}
              />
              <Route
                path="/accountant/reports/:reportId"
                element={<AccountantReportsPage />}
              />
              <Route
                path="/accountant/settings"
                element={<Navigate to="/accountant/settings/company" replace />}
              />
              <Route
                path="/accountant/settings/:category"
                element={<AccountantSettingsPage />}
              />
            </Route>


          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
