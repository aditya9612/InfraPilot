import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import PermissionMatrix from "../../components/admin/PermissionMatrix";
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
const ROLES: UserRole[] = ["Admin", "Project Manager", "Site Engineer", "Contractor", "Accountant", "Client"];

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

const PermissionsPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("Admin");
  const [categories, setCategories] = useState<PermissionCategory[]>(INITIAL_CATEGORIES);

  const handleToggle = (id: string) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      permissions: cat.permissions.map(p => 
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
    })));
  };

  const handleApplyPreset = (type: 'all' | 'none' | 'read') => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      permissions: cat.permissions.map(p => ({
        ...p,
        enabled: type === 'all' ? true : type === 'none' ? false : p.name.toLowerCase().includes('view')
      }))
    })));
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
              <button className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                  Discard
              </button>
              <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
                  Save Matrix
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
              categories={categories}
              onToggle={handleToggle}
              roleName={selectedRole}
            />

        </div>
      </PageTransition>
    </>
  );
};

export default PermissionsPage;
