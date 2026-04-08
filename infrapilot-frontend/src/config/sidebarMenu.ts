import type { Role } from "../context/AuthContext";

export interface SubMenuItem {
  label: string;
  path: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  children?: SubMenuItem[];
}

export const sidebarMenus: Record<Role, MenuItem[]> = {
  Admin: [
    { label: "Dashboard", path: "/admin", icon: "grid" },
    { label: "Projects", path: "/admin/projects", icon: "folder" },
    { label: "Users", path: "/admin/users", icon: "users" },
    { label: "Reports", path: "/admin/reports", icon: "bar-chart" },
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
    { label: "Daily Site Report", path: "/engineer/dsr", icon: "file-text" },

    {
      label: "Work Progress", path: "/engineer/work-progress", icon: "bar-chart",
      children: [
        { label: "Activity List", path: "/engineer/work-progress/activities" },
        { label: "Daily Progress Entry", path: "/engineer/work-progress/entry" },
      ],
    },

    {
      label: "Labor Management", path: "/engineer/labor", icon: "users",
      children: [
        { label: "Attendance", path: "/engineer/labor/attendance" },
        { label: "Labor Details", path: "/engineer/labor/details" },
      ],
    },

    {
      label: "Material Mgmt", path: "/engineer/materials", icon: "package",
      children: [
        { label: "Stock", path: "/engineer/materials/stock" },
        { label: "Material Receipt", path: "/engineer/materials/receipt" },
        { label: "Material Consumption", path: "/engineer/materials/consumption" },
      ],
    },

    { label: "Machinery", path: "/engineer/machinery", icon: "tool" },

    {
      label: "Quality Control", path: "/engineer/quality-control", icon: "check-square",
      children: [
        { label: "Inspections", path: "/engineer/quality-control/inspections" },
        { label: "Test Reports", path: "/engineer/quality-control/test-reports" },
      ],
    },

    {
      label: "Safety", path: "/engineer/safety", icon: "shield",
      children: [
        { label: "Safety Checklist", path: "/engineer/safety/checklist" },
        { label: "Incident Report", path: "/engineer/safety/incidents" },
      ],
    },

    { label: "Issue Tracker", path: "/engineer/issues", icon: "alert-triangle" },
    { label: "Site Photos", path: "/engineer/photos", icon: "camera" },
    { label: "Drawings & Docs", path: "/engineer/drawings", icon: "folder" },
    { label: "Checklists", path: "/engineer/checklists", icon: "list" },

    {
      label: "Approvals", path: "/engineer/approvals", icon: "clipboard",
      children: [
        { label: "Material Request", path: "/engineer/approvals/material" },
        { label: "Work Approval", path: "/engineer/approvals/work" },
      ],
    },

    { label: "Reports", path: "/engineer/reports", icon: "bar-chart" },
    { label: "Settings", path: "/engineer/settings", icon: "settings" },
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
