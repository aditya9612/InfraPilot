import type { Role } from "../context/AuthContext";

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
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
    { label: "Progress", path: "/client/progress", icon: "bar-chart" },
    { label: "Site Photos", path: "/client/photos", icon: "package" },
    { label: "Documents", path: "/client/documents", icon: "file-text" },
  ],
};
