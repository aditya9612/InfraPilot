import type { Role } from "../context/AuthContext";

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  subNav?: MenuItem[];
  disabled?: boolean;
}

export const sidebarMenus: Record<Role, MenuItem[]> = {
  Admin: [
    { label: "Dashboard", path: "/admin", icon: "grid" },
    { label: "Projects", path: "/admin/projects", icon: "folder" },
    {
      label: "Estimates / Invoices",
      path: "/admin/invoices",
      icon: "file-text",
      subNav: [
        { label: "All Invoices", path: "/admin/invoices/all", icon: "list" },
        { label: "Quotations", path: "/admin/quotations", icon: "file-text" },
        { label: "Create Invoice", path: "/admin/invoices/create", icon: "plus" },
        { label: "Measurements", path: "/admin/measurements", icon: "tool" },
      ],
    },
    {
      label: "User & Role Management",
      path: "/admin/users",
      icon: "users",
      subNav: [
        { label: "Users", path: "/admin/users", icon: "users" },
        { label: "Roles", path: "/admin/users/roles", icon: "user-check" },
        {
          label: "Permissions",
          path: "/admin/users/permissions",
          icon: "check-circle",
        },
      ],
    },
    { label: "Clients", path: "/admin/clients", icon: "user-check" },
    {
      label: "Owner Management",
      path: "/admin/owners",
      icon: "briefcase",
      subNav: [
        { label: "Owners List", path: "/admin/owners/list", icon: "list" },
        {
          label: "Agreements",
          path: "/admin/owners/agreements",
          icon: "file-text",
        },
        {
          label: "Track Payments",
          path: "/admin/owners/payments",
          icon: "credit-card",
        },
        {
          label: "Owner Ledger",
          path: "/admin/owners/ledger",
          icon: "book-open",
        },
      ],
    },
    { label: "AutoCAD Viewer", path: "/admin/autocad", icon: "layers" },
    { label: "Site Engineers", path: "/admin/engineers", icon: "tool" },
    {
      label: "Work & BOQ",
      path: "/admin/boq",
      icon: "clipboard",
      subNav: [
        { label: "BOQ Setup", path: "/admin/boq/setup", icon: "list" },
        {
          label: "Activity List",
          path: "/admin/boq/activities",
          icon: "activity",
        },
      ],
    },
    {
      label: "Material & Inventory",
      path: "/admin/inventory",
      icon: "package",
      subNav: [
        {
          label: "Material Master",
          path: "/admin/inventory/master",
          icon: "database",
        },
        {
          label: "Inventory Management",
          path: "/admin/inventory/stock",
          icon: "box",
        },
      ],
    },
    {
      label: "Finance & Accounts",
      path: "/admin/finance",
      icon: "dollar-sign",
      subNav: [
        {
          label: "Invoices",
          path: "/admin/finance/invoices",
          icon: "file-text",
        },
        {
          label: "Payments",
          path: "/admin/finance/payments",
          icon: "credit-card",
        },
        {
          label: "Expenses",
          path: "/admin/finance/expenses",
          icon: "dollar-sign",
        },
        {
          label: "Profit Tracking",
          path: "/admin/finance/profit",
          icon: "trending-up",
        },
      ],
    },
    {
      label: "Approvals & Workflow",
      path: "/admin/approvals",
      icon: "check-circle",
      subNav: [
        {
          label: "Material Approval",
          path: "/admin/approvals/material",
          icon: "package",
        },
        {
          label: "Billing Approval",
          path: "/admin/approvals/billing",
          icon: "file-text",
        },
        {
          label: "Expense Approval",
          path: "/admin/approvals/expense",
          icon: "dollar-sign",
        },
      ],
    },
    {
      label: "Reports & Analytics",
      path: "/admin/reports",
      icon: "bar-chart",
      subNav: [
        {
          label: "Progress Report",
          path: "/admin/reports/progress",
          icon: "trending-up",
        },
        {
          label: "Financial Report",
          path: "/admin/reports/financial",
          icon: "dollar-sign",
        },
        { label: "Labour Report", path: "/admin/reports/labour", icon: "users" },
        {
          label: "Material Consumption",
          path: "/admin/reports/consumption",
          icon: "package",
        },
      ],
    },
    { label: "Notifications", path: "/admin/notifications", icon: "bell" },
    { label: "Documents", path: "/admin/documents", icon: "file-text" },
    {
      label: "Master Data",
      path: "/admin/master-data",
      icon: "database",
      subNav: [
        {
          label: "Material Master",
          path: "/admin/master-data/materials",
          icon: "package",
        },
        {
          label: "Labour Types",
          path: "/admin/master-data/labour",
          icon: "users",
        },
        {
          label: "Activity Types",
          path: "/admin/master-data/activities",
          icon: "list",
        },
        { label: "Units", path: "/admin/master-data/units", icon: "tool" },
      ],
    },
    { label: "Integrations", path: "/admin/integrations", icon: "link" },
    { label: "Settings", path: "/admin/settings", icon: "settings" },
  ],
  ProjectManager: [
    { label: "Dashboard", path: "/manager", icon: "grid" },
    { label: "Projects", path: "/manager/projects", icon: "folder" },
    {
      label: "Approvals",
      path: "/manager/approvals",
      icon: "check-circle",
      subNav: [
        { label: "DSR Approval", path: "/manager/approvals/dsr", icon: "clipboard-list" },
        { label: "Material Approval", path: "/manager/approvals/material", icon: "package" },
        { label: "Expense Approval", path: "/manager/approvals/expense", icon: "dollar-sign" },
      ],
    },
    { label: "BOQ", path: "/manager/boq", icon: "list" },
    {
      label: "Resources",
      path: "/manager/resources",
      icon: "users",
      subNav: [
        { label: "Deployment Hub", path: "/manager/resources/orchestrator", icon: "map" },
        { label: "Site Engineers", path: "/manager/projects", icon: "user-check" },
      ],
    },
    { label: "Labour", path: "/manager/labour", icon: "users" },
    {
      label: "Compliance Hub",
      path: "/manager/compliance",
      icon: "shield",
      subNav: [
        { label: "QC Governance", path: "/manager/compliance/qc", icon: "check-circle" },
        { label: "Safety Audit", path: "/manager/compliance/safety", icon: "alert-triangle" },
      ],
    },
    { label: "Settings", path: "/manager/settings", icon: "settings" },
  ],
  SiteEngineer: [
    { label: "Dashboard", path: "/engineer", icon: "grid" },
    { label: "Daily Site Report (DSR)", path: "/engineer/dsr", icon: "clipboard" },
    {
      label: "Work Progress",
      path: "/engineer/progress",
      icon: "bar-chart",
      subNav: [
        { label: "Activity List", path: "/engineer/progress/activities", icon: "list" },
        { label: "Daily Progress Entry", path: "/engineer/progress/entry", icon: "clipboard" },
      ],
    },
    {
      label: "Labor Management",
      path: "/engineer/labor",
      icon: "users",
      subNav: [
        { label: "Labor Registry", path: "/engineer/labor/list", icon: "list" },
        { label: "Daily Attendance", path: "/engineer/labor/attendance", icon: "calendar" },
        { label: "Salary & Advances", path: "/engineer/labor/payments", icon: "dollar-sign" },
        { label: "Payroll Reports", path: "/engineer/labor/reports", icon: "file-text" },
      ],
    },
    {
      label: "Material Management",
      path: "/engineer/material/receipt",
      icon: "package",
      subNav: [
        { label: "Material Receipt", path: "/engineer/material/receipt", icon: "package" },
        { label: "Material Consumption", path: "/engineer/material/consumption", icon: "tool" },
        { label: "Stock Summary", path: "/engineer/material/stock", icon: "database" },
      ],
    },
    { label: "Machinery & Equipment", path: "/engineer/machinery", icon: "tool" },
    {
      label: "Quality Control (QC)",
      path: "/engineer/qc",
      icon: "check-circle",
      subNav: [
        { label: "Inspection", path: "/engineer/qc/inspection", icon: "search" },
        { label: "Test Reports", path: "/engineer/qc/reports", icon: "file-text" },
      ],
    },
    {
      label: "Safety Management",
      path: "/engineer/safety",
      icon: "alert-triangle",
      subNav: [
        { label: "Safety Checklist", path: "/engineer/safety/checklist", icon: "check-square" },
        { label: "Incident Report", path: "/engineer/safety/incident", icon: "file-text" },
      ],
    },
    { label: "Issue / Delay Tracker", path: "/engineer/issues", icon: "alert-triangle" },
    { label: "Site Photos", path: "/engineer/photos", icon: "camera" },
    { label: "Drawings & Documents", path: "/engineer/drawings", icon: "folder" },
    { label: "Checklists", path: "/engineer/checklists", icon: "list" },
    {
      label: "Approvals & Requests",
      path: "/engineer/approvals",
      icon: "check-circle",
      subNav: [
        { label: "Material Request", path: "/engineer/approvals/material", icon: "package" },
        { label: "Work Approval", path: "/engineer/approvals/work", icon: "check-circle" },
      ],
    },
    { label: "Reports", path: "/engineer/reports", icon: "bar-chart" },
    { label: "Settings", path: "/engineer/settings", icon: "settings" },
  ],
  Accountant: [
    { label: "Dashboard", path: "/accountant", icon: "grid" },
    {
      label: "Chart of Accounts",
      path: "/accountant/chart-of-accounts",
      icon: "book-open",
      subNav: [
        { label: "Assets", path: "/accountant/chart-of-accounts/assets", icon: "dollar-sign" },
        { label: "Liabilities", path: "/accountant/chart-of-accounts/liabilities", icon: "activity" },
        { label: "Income", path: "/accountant/chart-of-accounts/income", icon: "trending-up" },
        { label: "Expenses", path: "/accountant/chart-of-accounts/expenses", icon: "trending-down" },
      ],
    },
    {
      label: "Receivables",
      path: "/accountant/receivables",
      icon: "trending-up",
      subNav: [
        {
          label: "Invoices",
          path: "/accountant/receivables/invoices",
          icon: "file-text",
        },
        {
          label: "RA Bills",
          path: "/accountant/receivables/ra-bills",
          icon: "activity",
        },
        {
          label: "Credit Notes",
          path: "/accountant/receivables/credit-notes",
          icon: "rotate-ccw",
        },
      ],
    },
    {
      label: "Payables",
      path: "/accountant/payables",
      icon: "shopping-cart",
      subNav: [
        { label: "Vendor Bills", path: "/accountant/payables/vendor", icon: "truck" },
        { label: "Contractor Bills", path: "/accountant/payables/contractor", icon: "tool" },
      ],
    },
    {
      label: "Expenses",
      path: "/accountant/expenses",
      icon: "dollar-sign",
      subNav: [
        { label: "Direct Expenses", path: "/accountant/expenses/direct", icon: "activity" },
        { label: "Indirect Expenses", path: "/accountant/expenses/indirect", icon: "briefcase" },
      ],
    },
    {
      label: "Payments & Receipts",
      path: "/accountant/payments",
      icon: "credit-card",
      subNav: [
        { label: "Receive Payment", path: "/accountant/payments/receipt", icon: "trending-up" },
        { label: "Make Payment", path: "/accountant/payments/payment", icon: "trending-down" },
      ],
    },
    {
      label: "GST & Taxation",
      path: "/accountant/taxation",
      icon: "percent",
      subNav: [
        { label: "GST Invoices", path: "/accountant/taxation/gst-invoices", icon: "file-text" },
        { label: "GST Returns", path: "/accountant/taxation/gst-returns", icon: "bar-chart" },
        { label: "TDS", path: "/accountant/taxation/tds", icon: "dollar-sign" },
      ],
    },
    {
      label: "Payroll",
      path: "/accountant/payroll",
      icon: "users",
      subNav: [
        { label: "Salary", path: "/accountant/payroll/salary", icon: "briefcase" },
        { label: "Wages", path: "/accountant/payroll/wages", icon: "activity" },
        { label: "Contractor Payment", path: "/accountant/payroll/contractor", icon: "tool" },
      ],
    },
    {
      label: "Bank & Cash",
      path: "/accountant/banking",
      icon: "home",
      subNav: [
        { label: "Bank Accounts", path: "/accountant/banking/accounts", icon: "briefcase" },
        { label: "Cash Book", path: "/accountant/banking/cash", icon: "dollar-sign" },
        { label: "Bank Reconciliation", path: "/accountant/banking/reconciliation", icon: "refresh-cw" },
      ],
    },
    { label: "Journal Entries", path: "/accountant/journal", icon: "edit-3" },
    {
      label: "Fixed Assets",
      path: "/accountant/assets",
      icon: "layers",
      subNav: [
        { label: "Asset Register", path: "/accountant/assets/register", icon: "box" },
        { label: "Depreciation", path: "/accountant/assets/depreciation", icon: "trending-down" },
      ],
    },
    { label: "Reports", path: "/accountant/reports", icon: "bar-chart" },
    { label: "Settings", path: "/accountant/settings", icon: "settings" },
  ],
  Client: [
    { label: "Dashboard", path: "/client", icon: "grid" },
    { label: "Work Progress", path: "/client/progress", icon: "bar-chart" },
    {
      label: "Financials",
      path: "/client/financials",
      icon: "dollar-sign",
      subNav: [
        { label: "Summary", path: "/client/financials", icon: "bar-chart" },
        { label: "Invoices", path: "/client/financials/invoices", icon: "file-text" },
        { label: "Payments", path: "/client/financials/payments", icon: "credit-card" },
      ],
    },
    {
      label: "Site Updates",
      path: "/client/site-updates",
      icon: "camera",
      subNav: [
        { label: "Daily reports", path: "/client/site-updates/dsr", icon: "clipboard" },
        { label: "Photos", path: "/client/site-updates/photos", icon: "camera" },
      ],
    },
    { label: "Issues & Risks", path: "/client/issues", icon: "alert-triangle" },
    { label: "Documents & Drawings", path: "/client/documents", icon: "folder" },
    {
      label: "Approvals",
      path: "/client/approvals",
      icon: "check-circle",
      subNav: [
        { label: "Pending Approvals", path: "/client/approvals/pending", icon: "clock" },
        { label: "Approved Items", path: "/client/approvals/approved", icon: "check-circle" },
      ],
    },
    {
      label: "Communication",
      path: "/client/communication",
      icon: "message-circle",
      subNav: [
        { label: "Messages", path: "/client/communication/messages", icon: "mail" },
        { label: "Announcements", path: "/client/communication/announcements", icon: "bell" },
      ],
    },
    {
      label: "Reports",
      path: "/client/reports",
      icon: "bar-chart",
      subNav: [
        { label: "Monthly Report", path: "/client/reports/progress", icon: "file-text" },
        { label: "Financial Summary", path: "/client/reports/financial", icon: "dollar-sign" },
        { label: "Work Summary", path: "/client/reports/work", icon: "activity" },
      ],
    },
    { label: "Settings", path: "/client/settings", icon: "settings" },
  ],
};
