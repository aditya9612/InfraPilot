import type { Role } from "../context/AuthContext";

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  subMenu?: MenuItem[];
}

export const sidebarMenus: Record<Role, MenuItem[]> = {
  Admin: [
    { label: "Dashboard", path: "/admin", icon: "grid" },
    { label: "Projects", path: "/admin/projects", icon: "folder" },
    { label: "Users & Roles", path: "/admin/users", icon: "users" },
    { label: "Contractors", path: "/admin/contractors", icon: "briefcase" },
    { label: "Clients", path: "/admin/clients", icon: "user-check" },
    { label: "Site Engineers", path: "/admin/engineers", icon: "tool" },
    { label: "Work & BOQ", path: "/admin/boq", icon: "clipboard" },
    { label: "Material & Inventory", path: "/admin/inventory", icon: "package" },
    { label: "Finance & Accounts", path: "/admin/finance", icon: "dollar-sign" },
    { label: "Approvals & Workflow", path: "/admin/approvals", icon: "check-circle" },
    { label: "Reports & Analytics", path: "/admin/reports", icon: "bar-chart" },
    { label: "Notifications", path: "/admin/notifications", icon: "bell" },
    { label: "Documents", path: "/admin/documents", icon: "file-text" },
    { label: "Master Data", path: "/admin/master-data", icon: "database" },
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
    { label: "Project Overview", path: "/client/overview", icon: "folder" },
    { label: "Work Progress", path: "/client/progress", icon: "bar-chart" },
    {
      label: "Financials",
      path: "/client/financials",
      icon: "dollar-sign",
      subMenu: [
        { label: "Invoices", path: "/client/financials/invoices", icon: "file-text" },
        { label: "Payments", path: "/client/financials/payments", icon: "credit-card" },
        { label: "Summary", path: "/client/financials/summary", icon: "bar-chart" },
      ],
    },
    {
      label: "Site Updates",
      path: "/client/site-updates",
      icon: "camera",
      subMenu: [
        { label: "DSR Summary", path: "/client/site-updates/dsr", icon: "clipboard" },
        { label: "Photos", path: "/client/site-updates/photos", icon: "package" },
      ],
    },
    { label: "Issues & Risks", path: "/client/issues", icon: "alert-triangle" },
    { label: "Documents & Drawings", path: "/client/documents", icon: "file-text" },
    {
      label: "Approvals",
      path: "/client/approvals",
      icon: "check-circle",
      subMenu: [
        { label: "Pending Approvals", path: "/client/approvals/pending", icon: "clock" },
        { label: "Approved Items", path: "/client/approvals/approved", icon: "check-circle" },
      ],
    },
    {
      label: "Communication",
      path: "/client/communication",
      icon: "message-circle",
      subMenu: [
        { label: "Messages", path: "/client/communication/messages", icon: "mail" },
        { label: "Announcements", path: "/client/communication/announcements", icon: "bell" },
      ],
    },
    {
      label: "Reports",
      path: "/client/reports",
      icon: "clipboard",
      subMenu: [
        { label: "Monthly Progress Report", path: "/client/reports/monthly", icon: "calendar" },
        { label: "Financial Report", path: "/client/reports/financial", icon: "dollar-sign" },
        { label: "Work Summary", path: "/client/reports/work-summary", icon: "activity" },
      ],
    },
    { label: "Settings", path: "/client/settings", icon: "settings" },
  ],
};
