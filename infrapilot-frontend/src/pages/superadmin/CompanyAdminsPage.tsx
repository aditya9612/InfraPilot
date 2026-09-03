import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, UserPlus, Building2, Mail, ShieldCheck, CheckCircle2, XCircle, RotateCcw, Filter, X, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const CompanyAdminsPage = () => {
  const queryClient = useQueryClient();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selected user for View modal (GET /api/v1/superadmin/companies/{company_id}/users/{user_id})
  const [selectedViewUser, setSelectedViewUser] = useState<{ companyId: string | number; userId: string | number; fallbackName?: string; companyName?: string } | null>(null);

  const { data: fetchedUserDetail, isLoading: isLoadingUserDetail } = useQuery({
    queryKey: ['superadmin_company_user_detail', selectedViewUser?.companyId, selectedViewUser?.userId],
    queryFn: () => superadminService.getCompanyUser(selectedViewUser!.companyId, selectedViewUser!.userId),
    enabled: !!selectedViewUser,
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_id: "",
    full_name: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Fetch Companies for dropdown / name lookup
  const { data: companiesResponse } = useQuery({
    queryKey: ['superadmin_companies_admins_page'],
    queryFn: () => superadminService.getCompanies({ limit: 100 }),
  });

  const companies = companiesResponse?.items || [];

  // If a company is selected, fetch its users. Otherwise fetch for first company or all
  const targetCompanyId = selectedCompanyId || (companies.length > 0 ? String(companies[0].id) : "");

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['superadmin_company_users', targetCompanyId, page, limit],
    queryFn: () => superadminService.getCompanyUsers(targetCompanyId, { skip: (page - 1) * limit, limit }),
    enabled: !!targetCompanyId,
  });

  const usersList = usersResponse?.items || (Array.isArray(usersResponse) ? usersResponse : []);

  // Filter users by search & role / status
  const filteredAdmins = usersList.filter((user: any) => {
    const matchesSearch = !search || 
      (user.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.role || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesStatus;
  });

  // Get set of company IDs that already have an admin assigned
  const assignedCompanyIds = new Set(
    usersList.map((u: any) => String(u.tenant_id || u.company_id || u.companyId)).filter(Boolean)
  );

  // Only show new companies in Add Admin modal dropdown that don't have an admin assigned yet
  const availableCompaniesForAdmin = companies.filter((c: any) => {
    const alreadyHasAdmin = assignedCompanyIds.has(String(c.id)) || c.has_admin === true;
    return !alreadyHasAdmin;
  });

  // Create Admin Mutation (POST /api/v1/superadmin/companies/{company_id}/admin)
  const createAdminMutation = useMutation({
    mutationFn: () => superadminService.createCompanyAdmin(formData.company_id, {
      full_name: formData.full_name,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.password,
    }),
    onSuccess: () => {
      setFormSuccess("Company Admin created successfully!");
      setFormError("");
      setFormData({ company_id: "", full_name: "", email: "", mobile: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_users'] });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess("");
      }, 1500);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || err?.message || "Failed to create company admin.");
      setFormSuccess("");
    }
  });

  // POST /api/v1/superadmin/companies/{company_id}/users/{user_id}/activate
  const activateUserMutation = useMutation({
    mutationFn: async ({ companyId, userId, altUserId }: { companyId: string | number; userId: string | number; altUserId?: string | number }) => {
      try {
        return await superadminService.activateCompanyUser(companyId, userId);
      } catch (err: any) {
        if (err?.response?.status === 404 && altUserId && String(altUserId) !== String(userId)) {
          try {
            return await superadminService.activateCompanyUser(companyId, altUserId);
          } catch {
            return await superadminService.updateCompanyUserStatus(companyId, userId, true);
          }
        }
        return await superadminService.updateCompanyUserStatus(companyId, userId, true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_users'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_user_detail'] });
    }
  });

  // POST /api/v1/superadmin/companies/{company_id}/users/{user_id}/deactivate
  const deactivateUserMutation = useMutation({
    mutationFn: async ({ companyId, userId, altUserId }: { companyId: string | number; userId: string | number; altUserId?: string | number }) => {
      try {
        return await superadminService.deactivateCompanyUser(companyId, userId);
      } catch (err: any) {
        if (err?.response?.status === 404 && altUserId && String(altUserId) !== String(userId)) {
          try {
            return await superadminService.deactivateCompanyUser(companyId, altUserId);
          } catch {
            return await superadminService.updateCompanyUserStatus(companyId, userId, false);
          }
        }
        return await superadminService.updateCompanyUserStatus(companyId, userId, false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_users'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_user_detail'] });
    }
  });

  const getCompanyName = (id?: string | number) => {
    if (!id) return "All Companies";
    const found = companies.find((c: any) => String(c.id) === String(id));
    return found?.name || `Company #${id}`;
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSelectedCompanyId("");
    setPage(1);
  };

  return (
    <>
      <Navbar title="Company Admins" breadcrumb={["InfraPilot", "Super Admin", "Companies", "Admins"]} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Company Management</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Company Administrators</h1>
              <p className="text-slate-500 text-sm">Manage company admin accounts, assign roles, and monitor permissions</p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 transition-all font-bold text-xs cursor-pointer self-start md:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Company Admin</span>
            </button>
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col font-inter">
            {/* Filter Bar */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filter Company Admins</span>
                </div>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Company Filter */}
                <div>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => { setSelectedCompanyId(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="">— Select Company —</option>
                    {companies.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admins Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 text-center flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : filteredAdmins.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">No company admins found.</div>
              ) : (
                <table className="w-full text-left text-sm font-inter">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest font-inter">
                    <tr>
                      <th className="px-6 py-4 font-inter">Admin User</th>
                      <th className="px-6 py-4 font-inter">Company</th>
                      <th className="px-6 py-4 font-inter">Role & Designation</th>
                      <th className="px-6 py-4 font-inter">Status</th>
                      <th className="px-6 py-4 text-right font-inter">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-inter">
                    {filteredAdmins.map((user: any, index: number) => {
                      const isActive = user.is_active !== false;
                      const companyName = getCompanyName(selectedCompanyId || user.tenant_id);

                      const targetCompId = user.tenant_id || user.company_id || selectedCompanyId || (companies.length > 0 ? companies[0].id : 1);
                      const usrId = user.id || user.user_id || user.auth_user_id;
                      const altUsrId = user.auth_user_id || user.id;

                      return (
                        <tr key={user.id || index} className="hover:bg-slate-50/60 transition-colors group font-inter">
                          <td className="px-6 py-4 font-inter">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                {(user.full_name || "A").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col font-inter">
                                <span className="text-sm font-bold text-slate-800 font-inter">
                                  {user.full_name || "Company Admin"}
                                </span>
                                <span className="text-xs text-slate-400 font-medium font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {user.email || "-"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs font-inter">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span>{companyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <div className="flex flex-col font-inter">
                              <span className="text-xs font-bold text-slate-700 font-inter">
                                {user.role || "Admin"}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium font-inter">
                                {user.designation || user.department || "Management"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border font-inter ${
                              isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-inter">
                            <div className="flex items-center justify-end gap-2">
                              {/* Activate / Deactivate API Buttons */}
                              {isActive ? (
                                <button
                                  onClick={() => deactivateUserMutation.mutate({
                                    companyId: targetCompId,
                                    userId: usrId,
                                    altUserId: altUsrId,
                                  })}
                                  disabled={deactivateUserMutation.isPending}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                                >
                                  {deactivateUserMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Deactivate"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => activateUserMutation.mutate({
                                    companyId: targetCompId,
                                    userId: usrId,
                                    altUserId: altUsrId,
                                  })}
                                  disabled={activateUserMutation.isPending}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer disabled:opacity-50"
                                >
                                  {activateUserMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Activate"}
                                </button>
                              )}

                              {/* View Eye Icon Button (Triggers GET /api/v1/superadmin/companies/{company_id}/users/{user_id}) */}
                              <button
                                onClick={() => setSelectedViewUser({
                                  companyId: selectedCompanyId || user.tenant_id || (companies.length > 0 ? companies[0].id : 1),
                                  userId: user.id || user.auth_user_id,
                                  fallbackName: user.full_name,
                                  companyName,
                                })}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg cursor-pointer hover:bg-blue-50"
                                title="View Admin Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Bar */}
            {!isLoading && filteredAdmins.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-blue-600 bg-white shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, usersResponse?.total || filteredAdmins.length)} of {usersResponse?.total || filteredAdmins.length} records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={filteredAdmins.length < limit}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* CREATE COMPANY ADMIN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-inter">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800">Add Company Admin</h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); createAdminMutation.mutate(); }} className="space-y-3 font-inter">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">— Select Target Company —</option>
                  {availableCompaniesForAdmin.length === 0 ? (
                    <option value="" disabled>No new unassigned companies available</option>
                  ) : (
                    availableCompaniesForAdmin.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={createAdminMutation.isPending || !formData.company_id || !formData.email || !formData.password}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
              >
                {createAdminMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Company Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ADMIN DETAILS MODAL (Fetches GET /api/v1/superadmin/companies/{company_id}/users/{user_id}) */}
      {selectedViewUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-inter">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {((fetchedUserDetail?.full_name || selectedViewUser.fallbackName || "A")).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {fetchedUserDetail?.full_name || selectedViewUser.fallbackName || "Company Admin"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{fetchedUserDetail?.email || "-"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedViewUser(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-inter text-xs">
              {isLoadingUserDetail ? (
                <div className="py-12 text-center flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-slate-400 font-medium text-[11px] mb-0.5">Assigned Company</p>
                      <p className="font-bold text-slate-800 text-xs">{selectedViewUser.companyName || "Company"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[11px] mb-0.5">Account Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (fetchedUserDetail?.is_active !== false) ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {(fetchedUserDetail?.is_active !== false) ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-slate-400 font-medium text-[11px] mb-0.5">Role</p>
                      <p className="font-bold text-slate-800 text-xs">{fetchedUserDetail?.role || "Admin"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[11px] mb-0.5">Designation</p>
                      <p className="font-bold text-slate-800 text-xs">{fetchedUserDetail?.designation || "Company Admin"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[11px] mb-0.5">Department</p>
                      <p className="font-bold text-slate-800 text-xs">{fetchedUserDetail?.department || "Management"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[11px] mb-0.5">Employee ID</p>
                      <p className="font-bold text-slate-800 text-xs font-mono">{fetchedUserDetail?.employee_id || "-"}</p>
                    </div>
                  </div>

                  {fetchedUserDetail?.joined_date && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center">
                      <span className="text-blue-600 font-semibold text-[11px]">Joined Date</span>
                      <span className="font-bold text-slate-800 font-mono text-xs">{new Date(fetchedUserDetail.joined_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedViewUser(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyAdminsPage;
