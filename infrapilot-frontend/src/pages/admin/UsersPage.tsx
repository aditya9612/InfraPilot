import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateUserModal from "../../components/forms/CreateUserModal";
import toast from "react-hot-toast";
import UserDetailsModal from "../../components/dashboard/UserDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { userService } from "../../services/userService";
import type { User } from "../../types/user";

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await userService.getAllUsers(100, 0);
      const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);
      setUsers(userList);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdateUser = async (userData: any) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.user_id, userData);
        toast.success("User updated successfully!");
      } else {
        await userService.createUser(userData);
        toast.success("User created successfully!");
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(editingUser ? "Failed to update user" : "Failed to create user");
      console.error(error);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        await userService.deleteUser(userToDelete);
        toast.success("User deleted successfully!");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
        console.error(error);
      }
    }
  };

  const handleViewDetails = async (user: User) => {
    try {
      const toastId = toast.loading("Loading user details...");
      const freshUser = await userService.getUserById(user.user_id);
      toast.dismiss(toastId);
      setViewingUser(freshUser);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to fetch latest details");
      console.error("Failed to fetch user by ID", error);
      // Fallback to table row data
      setViewingUser(user);
      setIsViewModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameStr = user.full_name || "";
    const emailStr = user.email || "";
    const roleStr = user.role || "";

    const matchesSearch = nameStr.toLowerCase().includes(term) ||
      emailStr.toLowerCase().includes(term) ||
      roleStr.toLowerCase().includes(term);

    const matchesRole = roleFilter === "All Roles" || roleStr === roleFilter;

    const matchesStatus = statusFilter === "All Status" ||
      (statusFilter === "Active" && user.is_active) ||
      (statusFilter === "Inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <>
      <Navbar title="User Management" breadcrumb={["Admin", "Users"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              System Users
            </h1>
            <p className="text-slate-500 text-sm">
              Manage user access, roles, and project assignments.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
          >
            + Add New User
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 px-3 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="All Roles">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="ProjectManager">Project Manager</option>
                <option value="SiteEngineer">Site Engineer</option>
                <option value="Accountant">Accountant</option>
                <option value="Client">Client</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 px-3 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role / Designation</th>
                  <th className="px-6 py-4">PAN / Aadhaar</th>
                  <th className="px-6 py-4">Joined On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.user_id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                            {user.profile_image && !user.profile_image.startsWith('blob:') ? (
                              <img
                                src={user.profile_image}
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = (user.full_name || "Unknown")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase();
                                }}
                              />
                            ) : (
                              (user.full_name || "Unknown")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                              {user.full_name || "Unknown"}
                            </p>
                            <p className="text-slate-400 text-xs font-medium">
                              {user.email || "No Email"}
                            </p>
                            <p className="text-slate-400 text-[10px] font-medium tracking-tight">
                              {user.mobile_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="w-fit px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-wider">
                            {user.role}
                          </span>
                          <p className="text-xs text-slate-500 font-medium">
                            {user.designation}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">
                        <p>PAN: {user.pan_number}</p>
                        <p>UID: {user.aadhaar_number}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {user.joining_date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                          />
                          <span
                            className={`text-xs font-bold ${user.is_active ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            title="View Details"
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditClick(user)}
                            title="Update User"
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.user_id)}
                            title="Delete User"
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {filteredUsers.length} Users
            </p>
          </div>
        </div>
      </PageTransition>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreateOrUpdateUser}
        initialData={editingUser}
      />

      <UserDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingUser(null);
        }}
        user={viewingUser}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and the user will lose all access immediately."
        confirmText="Delete User"
        type="danger"
      />
    </>
  );
};

export default UsersPage;
