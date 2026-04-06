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
        { label: "Permissions", path: "/admin/users/permissions", icon: "check-circle" },
      ],
    },
    { label: "Contractors", path: "/admin/contractors", icon: "briefcase" },
    { label: "Clients", path: "/admin/clients", icon: "user-check" },
    { label: "Site Engineers", path: "/admin/engineers", icon: "tool" },
    {
      label: "Work & BOQ",
      path: "/admin/boq",
      icon: "clipboard",
      subNav: [
        { label: "BOQ Setup", path: "/admin/boq/setup", icon: "list" },
        { label: "Activity List", path: "/admin/boq/activities", icon: "activity" },
      ],
    },
    {
      label: "Material & Inventory",
      path: "/admin/inventory",
      icon: "package",
      subNav: [
        { label: "Material Master", path: "/admin/inventory/master", icon: "database" },
        { label: "Stock Management", path: "/admin/inventory/stock", icon: "box" },
      ],
    },
    {
      label: "Finance & Accounts",
      path: "/admin/finance",
      icon: "dollar-sign",
      subNav: [
        { label: "Invoices", path: "/admin/finance/invoices", icon: "file-text" },
        { label: "Payments", path: "/admin/finance/payments", icon: "credit-card" },
        { label: "Expenses", path: "/admin/finance/expenses", icon: "dollar-sign" },
        { label: "Profit Tracking", path: "/admin/finance/profit", icon: "trending-up" },
      ],
    },
    {
      label: "Approvals & Workflow",
      path: "/admin/approvals",
      icon: "check-circle",
      subNav: [
        { label: "Material Approval", path: "/admin/approvals/material", icon: "package" },
        { label: "Billing Approval", path: "/admin/approvals/billing", icon: "file-text" },
        { label: "Expense Approval", path: "/admin/approvals/expense", icon: "dollar-sign" },
      ],
    },
    {
      label: "Reports & Analytics",
      path: "/admin/reports",
      icon: "bar-chart",
      subNav: [
        { label: "Progress Report", path: "/admin/reports/progress", icon: "trending-up" },
        { label: "Financial Report", path: "/admin/reports/financial", icon: "dollar-sign" },
        { label: "Labor Report", path: "/admin/reports/labor", icon: "users" },
        { label: "Material Consumption", path: "/admin/reports/consumption", icon: "package" },
        { label: "Contractor Performance", path: "/admin/reports/performance", icon: "briefcase" },
      ],
    },
    { label: "Notifications", path: "/admin/notifications", icon: "bell" },
    { label: "Documents", path: "/admin/documents", icon: "file-text" },
    {
      label: "Master Data",
      path: "/admin/master-data",
      icon: "database",
      subNav: [
        { label: "Material Master", path: "/admin/master-data/materials", icon: "package" },
        { label: "Labor Types", path: "/admin/master-data/labor", icon: "users" },
        { label: "Activity Types", path: "/admin/master-data/activities", icon: "list" },
        { label: "Units", path: "/admin/master-data/units", icon: "tool" },
      ],
    },
    { label: "Integrations", path: "/admin/integrations", icon: "link" },
    { label: "Settings", path: "/admin/settings", icon: "settings" },
  ],
  "Project Manager": [
    { label: "Dashboard", path: "/manager", icon: "grid" },
    { label: "Projects", path: "/manager/projects", icon: "folder" },
    { label: "BOQ", path: "/manager/boq", icon: "list" },
    { label: "Labour", path: "/manager/labour", icon: "users" },
    { label: "Materials", path: "/manager/materials", icon: "package" },
  ],
  "Site Engineer": [
    { label: "Dashboard", path: "/engineer", icon: "grid" },
    { label: "Tasks", path: "/engineer/tasks", icon: "check-square" },
    { label: "Equipment", path: "/engineer/equipment", icon: "tool" },
    { label: "Reports", path: "/engineer/reports", icon: "file-text" },
  ],
  Contractor: [
    { label: "Dashboard", path: "/contractor", icon: "grid" },
    { label: "Work Orders", path: "/contractor/orders", icon: "clipboard" },
    { label: "Invoices", path: "/contractor/invoices", icon: "file" },
    { label: "Documents", path: "/contractor/documents", icon: "folder" },
  ],
  Accountant: [
    { label: "Dashboard", path: "/accountant", icon: "grid" },
    { label: "Budget", path: "/accountant/budget", icon: "dollar-sign" },
    { label: "Invoices", path: "/accountant/invoices", icon: "file-text" },
    { label: "Payments", path: "/accountant/payments", icon: "credit-card" },
    { label: "Reports", path: "/accountant/reports", icon: "bar-chart" },
  ],
  Client: [
    { label: "Dashboard", path: "/client", icon: "grid" },
    { label: "Progress", path: "/client/progress", icon: "bar-chart" },
    { label: "Site Photos", path: "/client/photos", icon: "package" },
    { label: "Documents", path: "/client/documents", icon: "file-text" },
  ],
};
