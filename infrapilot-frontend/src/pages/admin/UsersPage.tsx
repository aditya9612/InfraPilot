import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const usersData = [
  {
    id: 1,
    name: "Aditya Kumar",
    email: "aditya@infrapilot.com",
    mobile: "+91 98765 43210",
    role: "Admin",
    project: "Skyline Tower A",
    loginAccess: true,
    status: "Active",
    avatar: "AK"
  },
  {
    id: 2,
    name: "Rahul Sharma",
    email: "rahul.s@infrapilot.com",
    mobile: "+91 98765 43211",
    role: "Site Engineer",
    project: "Metro Extension Ph-II",
    loginAccess: true,
    status: "Active",
    avatar: "RS"
  },
  {
    id: 3,
    name: "Priya Nair",
    email: "priya.n@contractor.com",
    mobile: "+91 98765 43212",
    role: "Contractor",
    project: "Grand Vista Residency",
    loginAccess: true,
    status: "Inactive",
    avatar: "PN"
  },
  {
    id: 4,
    name: "Amit Kapur",
    email: "amit.k@client.com",
    mobile: "+91 98765 43213",
    role: "Client",
    project: "Skyline Tower A",
    loginAccess: false,
    status: "Active",
    avatar: "AK"
  },
];

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = usersData.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Navbar title="User Management" breadcrumb={["Admin", "Users"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Users</h1>
            <p className="text-slate-500 text-sm">Manage user access, roles, and project assignments.</p>
          </div>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            + Add New User
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
              <select className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 px-3 py-2 outline-none">
                <option>All Roles</option>
                <option>Admin</option>
                <option>Engineer</option>
                <option>Contractor</option>
                <option>Client</option>
              </select>
              <select className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 px-3 py-2 outline-none">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Assigned Project</th>
                  <th className="px-6 py-4">Login Access</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-xs shadow-sm">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{user.name}</p>
                          <p className="text-slate-400 text-xs font-medium">{user.email}</p>
                          <p className="text-slate-400 text-[10px] font-medium">{user.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {user.project}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.loginAccess ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={`text-xs font-bold ${user.loginAccess ? "text-emerald-600" : "text-slate-400"}`}>
                          {user.loginAccess ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        user.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">No users found matching your search.</p>
            </div>
          )}

          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {filteredUsers.length} of {usersData.length} Users
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50">Next</button>
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default UsersPage;
