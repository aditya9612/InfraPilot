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
      label: "Invoices & Estimates",
      path: "/admin/invoices",
      icon: "file-text",
      subNav: [
        { label: "All Invoices", path: "/admin/invoices/all", icon: "list" },
        {
          label: "Owner",
          path: "/admin/quotations",
          icon: "user-check",
          subNav: [
            { label: "Quotation", path: "/admin/quotations", icon: "file-text" },
            { label: "Final Measurement", path: "/admin/measurements", icon: "tool" },
          ],
        },
        { label: "Labour", path: "/admin/invoices/all?type=labour", icon: "users" },
        { label: "Material", path: "/admin/invoices/all?type=material", icon: "package" },
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
    { label: "Project Managers", path: "/admin/managers", icon: "briefcase" },
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
        {
          label: "Equipment Management",
          path: "/admin/equipment",
          icon: "tool",
        },
      ],
    },
    {
      label: "Finance & Accounts",
      path: "/admin/finance",
      icon: "dollar-sign",
      subNav: [
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
          label: "Approval Requests",
          path: "/admin/approvals",
          icon: "list",
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
    {
      label: "Notifications",
      path: "/admin/notifications",
      icon: "bell",
    },
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
    // { label: "Integrations", path: "/admin/integrations", icon: "link" }, // Temporarily hidden
    { label: "Chat", path: "/chat", icon: "message-circle" },
    { label: "Settings", path: "/admin/settings", icon: "settings" },
  ],
  ProjectManager: [
    { label: "Dashboard", path: "/manager", icon: "grid" },
    { label: "Projects", path: "/manager/projects", icon: "folder" },
    {
      label: "Work Progress",
      path: "/manager/work-progress",
      icon: "bar-chart",
      subNav: [
        { label: "Activity List", path: "/manager/work-progress/activities", icon: "list" },
        { label: "Daily Progress Entry", path: "/manager/work-progress/entry", icon: "clipboard" },
      ]
    },
    {
      label: "Task Management",
      path: "/manager/tasks",
      icon: "check-square",
    },
    {
      label: "Resources",
      path: "/manager/resources",
      icon: "users",
      subNav: [
        { label: "Resource Hub", path: "/manager/resources/orchestrator", icon: "grid" },
        { label: "Site Engineer & Labour", path: "/manager/resources/labour", icon: "users" },
        { label: "Equipment", path: "/manager/resources/equipment", icon: "tool" },
      ]
    },
    {
      label: "Material Management",
      path: "/manager/material/receipt",
      icon: "package",
      subNav: [
        { label: "Material Receipt", path: "/manager/material/receipt", icon: "package" },
        { label: "Material Consumption", path: "/manager/material/consumption", icon: "tool" },
        { label: "Stock Summary", path: "/manager/material/stock", icon: "database" },
      ],
    },
    {
      label: "BOQ & Estimation",
      path: "/manager/boq",
      icon: "list",
      subNav: [
        { label: "BOQ", path: "/manager/boq/list", icon: "file-text" },
        { label: "Cost Tracking", path: "/manager/boq/cost", icon: "trending-up" },
      ]
    },
    {
      label: "Procurement",
      path: "/manager/procurement",
      icon: "shopping-cart",
      subNav: [
        { label: "Site Requests", path: "/manager/procurement/requests", icon: "package" },
      ]
    },
    {
      label: "Quality Control (QC)",
      path: "/manager/quality",
      icon: "check-circle",
      subNav: [
        { label: "Inspection", path: "/manager/quality/inspections", icon: "search" },
        { label: "Test Reports", path: "/manager/quality/reports", icon: "file-text" },
      ]
    },
    {
      label: "Safety",
      path: "/manager/safety",
      icon: "shield",
      subNav: [
        { label: "Safety Checklist", path: "/manager/safety/incidents", icon: "alert-triangle" },
        { label: "Incident Report", path: "/manager/safety/actions", icon: "check-square" },
      ]
    },
    {
      label: "Documents",
      path: "/manager/documents",
      icon: "folder",
    },
    {
      label: "Approvals",
      path: "/manager/approvals",
      icon: "check-circle",
    },
    { label: "Reports", path: "/manager/reports", icon: "bar-chart" },
    { label: "Chat", path: "/chat", icon: "message-circle" },
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
      label: "Labour Management",
      path: "/engineer/labor",
      icon: "users",
      subNav: [
        { label: "Labour Registry", path: "/engineer/labor/list", icon: "list" },
        { label: "Daily Attendance", path: "/engineer/labor/attendance", icon: "calendar" },
        { label: "Salary & Advances", path: "/engineer/labor/payments", icon: "dollar-sign" },
        { label: "Payroll Reports", path: "/engineer/labor/reports", icon: "file-text" },
      ],
    },
    {
      label: "Task Management",
      path: "/engineer/tasks",
      icon: "check-square",
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
      label: "Approvals",
      path: "/engineer/approvals",
      icon: "check-circle",
      subNav: [
        { label: "Resources Request", path: "/engineer/approvals/material", icon: "package" },
        { label: "Approvals", path: "/engineer/approvals/work", icon: "check-circle" },
      ],
    },
    { label: "Reports", path: "/engineer/reports", icon: "bar-chart" },
    { label: "Chat", path: "/chat", icon: "message-circle" },
    { label: "Settings", path: "/engineer/settings", icon: "settings" },
  ],
  Accountant: [
    { label: "Dashboard", path: "/accountant", icon: "grid" },
    {
      label: "Chart of Accounts",
      path: "/accountant/chart-of-accounts",
      icon: "book-open",
    },
    {
      label: "Receivables",
      path: "/accountant/receivables/dashboard",
      icon: "trending-up",
    },
    {
      label: "Payables",
      path: "/accountant/payables/dashboard",
      icon: "shopping-cart",
    },
    {
      label: "Expenses",
      path: "/accountant/expenses/dashboard",
      icon: "dollar-sign",
    },
    {
      label: "Payments & Receipts",
      path: "/accountant/payments/dashboard",
      icon: "credit-card",
    },
    {
      label: "GST & Taxation",
      path: "/accountant/taxation/dashboard",
      icon: "percent",
    },
    {
      label: "Payroll",
      path: "/accountant/payroll/dashboard",
      icon: "users",
    },
    {
      label: "Bank & Cash",
      path: "/accountant/banking/dashboard",
      icon: "home",
    },
    {
      label: "Journal Entries",
      path: "/accountant/journal/dashboard",
      icon: "edit-3",
    },
    {
      label: "Fixed Assets",
      path: "/accountant/assets/dashboard",
      icon: "layers",
    },
    {
      label: "Reports",
      path: "/accountant/reports/dashboard",
      icon: "bar-chart",
    },
    {
      label: "Approvals",
      path: "/accountant/approvals/dashboard",
      icon: "check-circle",
    },
    {
      label: "Chat",
      path: "/chat",
      icon: "message-circle",
    },
    {
      label: "Settings",
      path: "/accountant/settings",
      icon: "settings",
    },
  ],
  Client: [
    { label: "Dashboard", path: "/client", icon: "grid" },
    { label: "Project Overview", path: "/client/overview", icon: "info" },
    { label: "Work Progress", path: "/client/progress", icon: "bar-chart" },

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
    { label: "Approvals", path: "/client/approvals", icon: "check-circle" },
    { label: "Invoice", path: "/client/invoices", icon: "file-text" },
    {
      label: "Payment",
      path: "/client/payment",
      icon: "credit-card",
      subNav: [
        { label: "Quotation approval", path: "/client/payment/quotation", icon: "file-text" },
        { label: "Payment history", path: "/client/payment/history", icon: "clock" },
      ],
    },
    { label: "Chat", path: "/chat", icon: "message-circle" },
    { label: "Notifications", path: "/client/notifications", icon: "bell" },
    {
      label: "Reports",
      path: "/client/reports",
      icon: "bar-chart",
      subNav: [
        { label: "Report Summary", path: "/client/reports/summary", icon: "file-text" },
        { label: "Financial Summary", path: "/client/reports/financial", icon: "dollar-sign" },
        { label: "Work Summary", path: "/client/reports/work", icon: "activity" },
      ],
    },
    { label: "Settings", path: "/client/settings", icon: "settings" },
  ],
  Labour: [
    { label: "Dashboard", path: "/labour", icon: "grid" },
    {
      label: "Attendance",
      path: "/labour/attendance",
      icon: "calendar",
    },
    { label: "My Tasks", path: "/labour/tasks", icon: "clipboard" },
    { label: "Work Updates", path: "/labour/work-updates", icon: "activity" },
    { label: "Task Requests", path: "/labour/task-requests", icon: "plus-circle" },
    { label: "Payments", path: "/labour/payments", icon: "wallet" },
    { label: "Chat", path: "/chat", icon: "message-circle" },
    { label: "Notifications", path: "/labour/notifications", icon: "bell" },
    { label: "Settings", path: "/labour/settings", icon: "settings" },
  ],
};
