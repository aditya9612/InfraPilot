import type { Role } from "../context/AuthContext";

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  subNav?: MenuItem[];
}

export const sidebarMenus: Record<Role, MenuItem[]> = {
  Admin: [
    { label: "Dashboard", path: "/admin", icon: "grid" },
    { label: "Projects", path: "/admin/projects", icon: "folder" },
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
        { label: "Labor Report", path: "/admin/reports/labor", icon: "users" },
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
          label: "Labor Types",
          path: "/admin/master-data/labor",
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
    { label: "BOQ", path: "/manager/boq", icon: "list" },
    { label: "Labour", path: "/manager/labour", icon: "users" },
    { label: "Materials", path: "/manager/materials", icon: "package" },
  ],
  SiteEngineer: [
    { label: "Dashboard", path: "/engineer", icon: "grid" },
    { label: "Tasks", path: "/engineer/tasks", icon: "check-square" },
    { label: "Equipment", path: "/engineer/equipment", icon: "tool" },
    { label: "Reports", path: "/engineer/reports", icon: "file-text" },
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
};
