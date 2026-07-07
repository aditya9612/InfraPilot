import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import PermissionMatrix from "../../components/admin/PermissionMatrix";
import toast from "react-hot-toast";
import type { UserRole } from "../../types/user";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: Permission[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ROLES: UserRole[] = ["Admin", "ProjectManager", "SiteEngineer", "Accountant", "Client", "Labour"];

const INITIAL_CATEGORIES: PermissionCategory[] = [
  {
    id: "proj",
    name: "Project Management",
    permissions: [
      { id: "p1", name: "Create Projects", description: "Allow user to initialize new construction projects.", enabled: true },
      { id: "p2", name: "Edit Timelines", description: "Modify start/end dates and milestone targets.", enabled: true },
      { id: "p3", name: "Archive Projects", description: "Permission to move completed projects to archives.", enabled: false },
    ],
  },
  {
    id: "fin",
    name: "Financial Access",
    permissions: [
      { id: "f1", name: "View Budgets", description: "Access total budget vs actual expenditure data.", enabled: true },
      { id: "f2", name: "Approve Invoices", description: "Sign-off on contractor and material invoices.", enabled: false },
      { id: "f3", name: "Expense Tracking", description: "Log daily site petty cash and overheads.", enabled: true },
    ],
  },
  {
    id: "inv",
    name: "Inventory & Materials",
    permissions: [
      { id: "i1", name: "Request Materials", description: "Create purchase requests for site materials.", enabled: true },
      { id: "i2", name: "Stock Audit", description: "Perform physical stock checks and update counts.", enabled: false },
    ],
  },
];

// Initialize role-based permissions state
const INITIAL_ROLE_PERMISSIONS = ROLES.reduce((acc, role) => {
  // Deep clone INITIAL_CATEGORIES for each role
  acc[role] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
  
  // Custom presets for specific roles
  if (role === "Accountant") {
    acc[role].forEach((cat: any) => cat.permissions.forEach((p: any) => p.enabled = p.name.toLowerCase().includes("view")));
  } else if (role === "Admin") {
    acc[role].forEach((cat: any) => cat.permissions.forEach((p: any) => p.enabled = true));
  }
  
  return acc;
}, {} as Record<UserRole, PermissionCategory[]>);

const PermissionsPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("Admin");
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, PermissionCategory[]>>(INITIAL_ROLE_PERMISSIONS);
  const [isSaving, setIsSaving] = useState(false);

  const currentCategories = rolePermissions[selectedRole];

  const handleToggle = (id: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map(cat => ({
        ...cat,
        permissions: cat.permissions.map(p => 
          p.id === id ? { ...p, enabled: !p.enabled } : p
        )
      }))
    }));
  };

  const handleApplyPreset = (type: 'all' | 'none' | 'read') => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map(cat => ({
        ...cat,
        permissions: cat.permissions.map(p => ({
          ...p,
          enabled: type === 'all' ? true : type === 'none' ? false : p.name.toLowerCase().includes('view')
        }))
      }))
    }));
    toast.success(`${type === 'all' ? 'Full Access' : type === 'none' ? 'Revoke All' : 'View Only'} preset applied to ${selectedRole}`, {
      style: { borderRadius: '12px', background: '#333', color: '#fff' }
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Permissions Matrix saved successfully!", {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
      console.log("Saved Matrix Data:", rolePermissions);
    }, 1500);
  };

  const handleDiscard = () => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: JSON.parse(JSON.stringify(INITIAL_ROLE_PERMISSIONS[selectedRole]))
    }));
    toast("Changes discarded for " + selectedRole, {
      icon: '🔄',
      style: { borderRadius: '12px', background: '#333', color: '#fff' }
    });
  };

  return (
    <>
      <Navbar
        title="Access Permissions"
        breadcrumb={["Admin", "Users", "Permissions"]}
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
          {/* External Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Access Permissions</h1>
              <p className="text-slate-500 text-sm">
                Configure detailed access controls and feature permissions for each user role.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleDiscard}
                disabled={isSaving}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
              >
                  Discard
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70"
              >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : "Save Matrix"}
              </button>
            </div>
          </div>

          {/* Master Card Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Controls Bar */}
            <div className="p-4 bg-slate-50/10 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-center gap-4 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedRole === role
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-white text-slate-500 border border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Presets:</span>
                <button 
                  onClick={() => handleApplyPreset('read')}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all"
                >
                  VIEW ONLY
                </button>
                <button 
                  onClick={() => handleApplyPreset('all')}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all"
                >
                  FULL ACCESS
                </button>
                <button 
                  onClick={() => handleApplyPreset('none')}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all"
                >
                  REVOKE ALL
                </button>
              </div>
            </div>

            {/* Permission Matrix */}
            <PermissionMatrix
              categories={currentCategories}
              onToggle={handleToggle}
              roleName={selectedRole}
            />

        </div>
      </PageTransition>
    </>
  );
};

export default PermissionsPage;
