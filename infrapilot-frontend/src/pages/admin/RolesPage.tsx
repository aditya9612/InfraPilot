import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateRoleModal from "../../components/forms/CreateRoleModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
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
    name: "Contractor",
    description: "Submit progress reports, material requests, and sub-bills.",
    userCount: 12,
    color: "rose-500",
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

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: string, name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleCreateOrUpdateRole = (roleData: any) => {
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
    } else {
      setRoles(prev => [...prev, roleData]);
    }
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setRoleToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      setRoles(roles.filter(role => role.id !== roleToDelete.id));
      toast.success(`Role "${roleToDelete.name}" deleted successfully!`);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
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
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden`}>
                          <div className={`w-3 h-3 rounded-full bg-${role.color} animate-pulse`} />
                        </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(role)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          title="Edit Role"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(role.id, role.name)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Role"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the "${roleToDelete?.name}" role? This action cannot be undone and will affect all associated users.`}
        confirmText="Yes, Delete Role"
        type="danger"
      />
    </>
  );
};

export default RolesPage;
