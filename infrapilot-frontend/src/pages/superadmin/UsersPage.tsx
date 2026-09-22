import { useState } from "react";
import { Search, Plus, ShieldOff, Edit2, Loader2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const UsersPage = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const { data: companiesResponse } = useQuery({
    queryKey: ['superadmin_companies'],
    queryFn: () => superadminService.getCompanies()
  });

  const { data: usersResponse, isLoading: isLoadingUsers, isError } = useQuery({
    queryKey: ['superadmin_company_users', selectedCompanyId],
    queryFn: () => superadminService.getCompanyUsers(selectedCompanyId),
    enabled: !!selectedCompanyId
  });

  const companies = companiesResponse?.items || [];
  const users = usersResponse?.items || [];

  return (
    <>
      <Navbar title="Users" breadcrumb={["InfraPilot", "Super Admin", "Users"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="max-w-[1600px] mx-auto flex gap-6 relative">
      <div className={`flex-1 transition-all duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Company Users & Admin</h1>
            <p className="text-sm text-slate-500">Manage all tenant users and administrators (Select a company to view users)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 min-w-[250px] shadow-sm"
              />
            </div>
            
            <select 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white shadow-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
            >
              <option value="">Select a Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <button
              disabled={!selectedCompanyId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Admin
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!selectedCompanyId ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      Please select a company to view its users.
                    </td>
                  </tr>
                ) : isLoadingUsers ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-rose-500">Failed to load users for this company.</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">No users found in this company.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{user.full_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email || '-'}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        <span className={`text-xs font-bold ${
                          user.role === 'Admin' ? 'text-amber-600' :
                          user.role === 'Project Manager' ? 'text-blue-600' :
                          'text-slate-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.designation || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{user.joined_date ? new Date(user.joined_date).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button className="text-slate-400 hover:text-amber-600 transition-colors"><ShieldOff className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {users.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
              <span>Showing {users.length} users</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50">←</button>
                <button className="px-3 py-1 border border-slate-200 rounded bg-blue-50 text-blue-600 font-bold">1</button>
                <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
      </PageTransition>
    </>
  );
};

export default UsersPage;
