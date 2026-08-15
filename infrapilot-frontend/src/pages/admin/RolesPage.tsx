import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import CreateRoleModal from "../../components/forms/CreateRoleModal";
import type { Role } from "../../types/user";

const INITIAL_ROLES: Role[] = [
  {
    id: "1",
    name: "Admin",
    description: "Full system access, user management, and configuration capabilities.",
    userCount: 3,
    color: "primary",
    is_active: true,
  },
  {
    id: "2",
    name: "Project Manager",
    description: "Oversees multiple projects, budgets, and team assignments.",
    userCount: 8,
    color: "indigo-500",
    is_active: true,
  },
  {
    id: "3",
    name: "Site Engineer",
    description: "Site-level updates, daily logs, and execution monitoring.",
    userCount: 15,
    color: "emerald-500",
    is_active: true,
  },
  {
    id: "4",
    name: "Accountant",
    description: "Financial oversight, invoice approvals, and expense tracking.",
    userCount: 4,
    color: "amber-500",
    is_active: true,
  },
  {
    id: "5",
    name: "Labour",
    description: "Workforce executing operations and tasks at various project sites.",
    userCount: 0,
    color: "sky-500",
    is_active: true,
  },
  {
    id: "6",
    name: "Client",
    description: "Read-only access to specific project progress and timelines.",
    userCount: 10,
    color: "slate-500",
    is_active: true,
  },
];

import { useEffect, useRef } from "react";
import { userService } from "../../services/userService";

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const roleStatusOverrides = useRef<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleCreateOrUpdateRole = (roleData: any) => {
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
    } else {
      setRoles(prev => [...prev, roleData]);
    }
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const fetchDynamicRoles = async () => {
    try {
      const rawRoles = await userService.getRoles(statusFilter === "all" ? undefined : statusFilter);

      const updatedRoles = INITIAL_ROLES.map(blueprint => {
        const matchedAPI = rawRoles.find((r: any) =>
          r && ((r.name && r.name.toLowerCase().replace(/\s+/g, '') === blueprint.name.toLowerCase().replace(/\s+/g, '')) ||
            (r.role && r.role.toLowerCase().replace(/\s+/g, '') === blueprint.name.toLowerCase().replace(/\s+/g, '')))
        );

        if (matchedAPI) {
          const isActive = roleStatusOverrides.current[blueprint.name] !== undefined
            ? roleStatusOverrides.current[blueprint.name]
            : (matchedAPI.is_active !== undefined ? matchedAPI.is_active : blueprint.is_active);

          return {
            ...blueprint,
            userCount: matchedAPI.count !== undefined ? matchedAPI.count :
              (matchedAPI.user_count !== undefined ? matchedAPI.user_count :
                (matchedAPI.total !== undefined ? matchedAPI.total : blueprint.userCount)),
            is_active: isActive
          };
        }

        const fallbackActive = roleStatusOverrides.current[blueprint.name] !== undefined ? roleStatusOverrides.current[blueprint.name] : blueprint.is_active;
        return { ...blueprint, userCount: 0, is_active: fallbackActive };
      });

      setRoles(updatedRoles);
    } catch (error) {
      console.error("Failed to map dynamic roles from API:", error);
    }
  };

  useEffect(() => {
    fetchDynamicRoles();
  }, [statusFilter]);

  const handleToggleStatus = async (roleName: string, currentStatus: boolean) => {
    try {
      if (roleName.toLowerCase() === 'admin' && currentStatus) {
        toast.error("Admin role users cannot be deactivated.");
        return;
      }
      const newStatus = !currentStatus;

      // Update our local visual state overrides first so it snaps instantly and holds!
      roleStatusOverrides.current[roleName] = newStatus;

      setRoles(prevRoles => prevRoles.map(role =>
        role.name === roleName ? { ...role, is_active: newStatus } : role
      ));

      await userService.toggleRoleStatus(roleName.replace(/\s+/g, ''), newStatus);
      toast.success(`Successfully ${newStatus ? 'activated' : 'deactivated'} all users in the ${roleName} role!`);
      setTimeout(() => fetchDynamicRoles(), 500);
    } catch (error: any) {
      // Revert on error
      roleStatusOverrides.current[roleName] = currentStatus;
      setRoles(prevRoles => prevRoles.map(role =>
        role.name === roleName ? { ...role, is_active: currentStatus } : role
      ));
      toast.error(error.response?.data?.detail || "Failed to update users");
    }
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && role.is_active) ||
      (statusFilter === "inactive" && !role.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Navbar
        title="Roles Management"
        breadcrumb={["Admin", "Users", "Roles"]}
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* External Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Roles</h1>
            <p className="text-slate-500 text-sm">
              Define access hierarchies and permissions for all platform users.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRole(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 hover:shadow-xl transition-all active:scale-95"
          >
            + Create Custom Role
          </button>
        </div>

        {/* Master Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/20">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by role name or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "active" | "inactive");
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 px-3 py-2 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Roles Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-4">Role Details</th>
                  <th className="px-8 py-4">Description</th>
                  <th className="px-8 py-4 text-center">Assigned Users</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                    <td className="px-8 py-5 text-sm">
                      <div className="flex items-center">
                        <div>
                          <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                            {role.name}
                          </p>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            ID: {role.id.padStart(3, '0')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
                        {role.description}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                        {role.userCount}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${role.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={`text-xs font-bold ${role.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                          {role.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleToggleStatus(role.name, role.is_active)}
                          disabled={role.name.toLowerCase() === 'admin'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${role.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            } ${role.name.toLowerCase() === 'admin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={role.is_active ? "Deactivate Role Users" : "Activate Role Users"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${role.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Internal Footer Statistics */}
          <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} System Roles
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </PageTransition>

      <CreateRoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        onSubmit={handleCreateOrUpdateRole}
        initialData={editingRole}
      />
    </>
  );
};

export default RolesPage;
