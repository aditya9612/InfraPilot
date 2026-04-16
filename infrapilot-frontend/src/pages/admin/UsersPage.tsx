import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateUserModal from "../../components/forms/CreateUserModal";
<<<<<<< HEAD
import UserDetailsModal from "../../components/dashboard/UserDetailModal";
=======
import toast from "react-hot-toast";
import UserDetailsModal from "../../components/dashboard/UserDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
>>>>>>> testing
import type { User } from "../../types/user";

const INITIAL_USERS: User[] = [
  {
    user_id: 1,
<<<<<<< HEAD
    full_name: "Aditya Kumar",
    email: "aditya@infrapilot.com",
    mobile_number: "+91 98765 43210",
    role: "Admin",
    designation: "Admin",
    address: "Pune",
    pan_number: "ABCDE1234F",
    aadhaar_number: "123412341234",
    profile_image: "",
    joining_date: "2024-03-30",
    is_active: true,
  },
  {
    user_id: 2,
    full_name: "Rahul Sharma",
    email: "rahul.s@infrapilot.com",
    mobile_number: "+91 98765 43211",
    role: "Site Engineer",
    designation: "Project Lead",
    address: "Mumbai",
    pan_number: "FGHIJ5678K",
    aadhaar_number: "567856785678",
    profile_image: "",
    joining_date: "2024-01-15",
    is_active: true,
  },
  {
    user_id: 3,
    full_name: "Priya Nair",
    email: "priya.n@contractor.com",
    mobile_number: "+91 98765 43212",
    role: "Contractor",
    designation: "Managing Director",
    address: "Bangalore",
    pan_number: "KLMNO9012P",
    aadhaar_number: "901290129012",
    profile_image: "",
    joining_date: "2023-11-20",
    is_active: false,
  }
=======
    full_name: "Rahul Sharma",
    email: "rahul.s@infrapilot.com",
    mobile_number: "+91 98765 43210",
    role: "Admin",
    designation: "System Administrator",
    pan_number: "ABCDE1234F",
    aadhaar_number: "1234 5678 9012",
    joining_date: "12 Jan 2024",
    address: "Pune, Maharashtra",
    is_active: true,
    profile_image: "https://i.pravatar.cc/150?u=rahul",
  },
  {
    user_id: 2,
    full_name: "Priya Patel",
    email: "priya.p@infrapilot.com",
    mobile_number: "+91 98765 43211",
    role: "Project Manager",
    designation: "Senior Project Manager",
    pan_number: "FGHIJ5678K",
    aadhaar_number: "2345 6789 0123",
    joining_date: "15 Feb 2024",
    address: "Mumbai, Maharashtra",
    is_active: true,
    profile_image: "https://i.pravatar.cc/150?u=priya",
  },
  {
    user_id: 3,
    full_name: "Amit Kumar",
    email: "amit.k@infrapilot.com",
    mobile_number: "+91 98765 43212",
    role: "Site Engineer",
    designation: "Civil Engineer",
    pan_number: "KLMNO9012P",
    aadhaar_number: "3456 7890 1234",
    joining_date: "10 Mar 2024",
    address: "Delhi, India",
    is_active: true,
    profile_image: "https://i.pravatar.cc/150?u=amit",
  },
>>>>>>> testing
];

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<< HEAD
=======
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
>>>>>>> testing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
<<<<<<< HEAD

  const handleCreateOrUpdateUser = (userData: any) => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? { ...u, ...userData } : u));
    } else {
      const newUser: User = {
        ...userData,
        user_id: users.length + 1,
      };
      setUsers(prev => [...prev, newUser]);
=======
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const handleCreateOrUpdateUser = (userData: any) => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? { ...u, ...userData } : u));
      toast.success("User updated successfully!");
    } else {
      const newUser = {
        ...userData,
        user_id: Math.floor(Math.random() * 10000),
        joining_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        is_active: true,
      };
      setUsers(prev => [newUser, ...prev]);
      toast.success("User created successfully!");
>>>>>>> testing
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

<<<<<<< HEAD
  const handleDeleteClick = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(prev => prev.filter(u => u.user_id !== userId));
=======
  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.user_id !== userToDelete));
      toast.success("User deleted successfully!");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
>>>>>>> testing
    }
  };

  const handleViewDetails = (user: User) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Navbar title="User Management" breadcrumb={["Admin", "Users"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
<<<<<<< HEAD
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">
              System Users
            </h1>
            <p className="text-slate-500 text-sm font-medium">
=======
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              System Users
            </h1>
            <p className="text-slate-500 text-sm">
>>>>>>> testing
              Manage user access, roles, and project assignments.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
<<<<<<< HEAD
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
=======
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
>>>>>>> testing
          >
            + Add New User
          </button>
        </div>

<<<<<<< HEAD
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-6 bg-slate-50/20">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
=======
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
>>>>>>> testing
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
<<<<<<< HEAD
                placeholder="Search name, email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-2.5 outline-none shadow-sm focus:border-primary transition-all">
=======
                placeholder="Search by name, email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 px-3 py-2 outline-none">
>>>>>>> testing
                <option>All Roles</option>
                <option>Admin</option>
                <option>Engineer</option>
                <option>Contractor</option>
                <option>Client</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
<<<<<<< HEAD
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-8 py-5">User Details</th>
                  <th className="px-8 py-5">Role / Designation</th>
                  <th className="px-8 py-5">Credentials</th>
                  <th className="px-8 py-5">Joined</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5 text-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-primary border border-slate-100 flex items-center justify-center font-black text-xs shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                          {user.profile_image ? (
                            <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            user.full_name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 group-hover:text-primary transition-colors text-sm tracking-tight">
                            {user.full_name}
                          </p>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="w-fit px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/10">
                          {user.role}
                        </span>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.designation}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                      <p className="mb-1">PAN: <span className="text-slate-600 font-black">{user.pan_number}</span></p>
                      <p>UID: <span className="text-slate-600 font-black">{user.aadhaar_number}</span></p>
                    </td>
                    <td className="px-8 py-5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {user.joining_date}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"}`}
                        />
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          {user.is_active ? "Active" : "Offline"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          title="View Details"
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
=======
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
                {filteredUsers.length === 0 ? (
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
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                            {user.full_name}
                          </p>
                          <p className="text-slate-400 text-xs font-medium">
                            {user.email}
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
>>>>>>> testing
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          title="Update User"
<<<<<<< HEAD
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
=======
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
>>>>>>> testing
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.user_id)}
                          title="Delete User"
<<<<<<< HEAD
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
=======
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
>>>>>>> testing
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
<<<<<<< HEAD
                ))}
=======
                )))}
>>>>>>> testing
              </tbody>
            </table>
          </div>

<<<<<<< HEAD
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                No users found matching "{searchTerm}"
              </p>
            </div>
          )}

          <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              Showing {filteredUsers.length} of {users.length} Records
            </p>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest cursor-not-allowed"
                disabled
              >
                Previous
              </button>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95">
                Next Page →
              </button>
            </div>
          </div>
=======
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               Showing {filteredUsers.length} Users
             </p>
           </div>
>>>>>>> testing
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
<<<<<<< HEAD
=======

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
>>>>>>> testing
    </>
  );
};

export default UsersPage;
