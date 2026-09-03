import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, ShieldOff, Loader2, Filter, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, X, Eye, ShieldCheck, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const CompaniesPage = () => {
  const queryClient = useQueryClient();
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCompanyId, setEditingCompanyId] = useState<number | string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | string | null>(null);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendingCompanyId, setSuspendingCompanyId] = useState<number | string | null>(null);

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivatingCompanyId, setDeactivatingCompanyId] = useState<number | string | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("All");
  const [subscriptionFilter, setSubscriptionFilter] = useState("All");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, isActiveFilter, subscriptionFilter, itemsPerPage]);

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ['superadmin_companies', { search, isActiveFilter, subscriptionFilter, currentPage, itemsPerPage }],
    queryFn: () => superadminService.getCompanies({ 
      q: search || undefined,
      is_active: isActiveFilter === "All" ? undefined : isActiveFilter === "Active",
      subscription_status: subscriptionFilter === "All" ? undefined : subscriptionFilter,
      limit: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage
    })
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['superadmin_plans'],
    queryFn: () => superadminService.getPlans()
  });

  const companies = response?.items || [];

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    plan_id: "",
    admin_email: "",
    admin_name: "",
    admin_mobile: "",
    admin_password: "",
    send_email: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const createCompanyMutation = useMutation({
    mutationFn: async () => {
      const companyPayload = {
        name: formData.name,
        subdomain: formData.subdomain,
        plan_id: formData.plan_id ? parseInt(formData.plan_id) : 0
      };
      await superadminService.createCompany(companyPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_companies'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
      setIsCompanyModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || err.message || "Failed to create company");
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!editingCompanyId) return;
      const companyPayload = {
        name: formData.name,
        subdomain: formData.subdomain
      };
      await superadminService.updateCompany(editingCompanyId, companyPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_companies'] });
      setIsCompanyModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || err.message || "Failed to update company");
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!deletingCompanyId) return;
      await superadminService.deleteCompany(deletingCompanyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_companies'] });
      setIsDeleteModalOpen(false);
      setDeletingCompanyId(null);
    }
  });

  const activateCompanyMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await superadminService.activateCompany(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_companies'] });
    }
  });

  const deactivateCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!deactivatingCompanyId) return;
      await superadminService.updateCompanyStatus(deactivatingCompanyId, { is_active: false, reason: deactivateReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_companies'] });
      setIsDeactivateModalOpen(false);
      setDeactivatingCompanyId(null);
      setDeactivateReason("");
    }
  });

  const suspendCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!suspendingCompanyId) return;
      await superadminService.suspendCompany(suspendingCompanyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_companies'] });
      setIsSuspendModalOpen(false);
      setSuspendingCompanyId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "", subdomain: "", plan_id: "", admin_email: "", 
      admin_name: "", admin_mobile: "", admin_password: "", send_email: true
    });
    setFormError("");
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    resetForm();
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditModal = (company: any) => {
    setModalMode("edit");
    setEditingCompanyId(company.id);
    setFormData({
      name: company.name || "",
      subdomain: company.subdomain || "",
      plan_id: company.plan_id?.toString() || "",
      admin_email: "",
      admin_name: "",
      admin_mobile: "",
      admin_password: "",
      send_email: false,
    });
    setFormError("");
    setIsCompanyModalOpen(true);
  };

  const handleOpenDeleteModal = (companyId: string | number) => {
    setDeletingCompanyId(companyId);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    if (modalMode === "add") {
      await createCompanyMutation.mutateAsync();
    } else {
      await updateCompanyMutation.mutateAsync();
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Navbar title="Companies" breadcrumb={["InfraPilot", "Super Admin", "Companies"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
        <div className="max-w-[1600px] w-full mx-auto flex gap-6 relative flex-1 min-h-0">
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 flex flex-col min-h-0`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Companies / Tenants
                </h1>
                <p className="text-slate-500 text-sm">
                  Manage SaaS tenants, subscriptions, and access
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Company
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                <div className="relative flex-1 max-w-md font-inter">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search companies, subdomain or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 font-inter"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 font-inter">
                  <div className="flex items-center gap-2 font-inter">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter">
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <select value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter">
                    <option value="All">All Subscriptions</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Trial">Trial</option>
                  </select>
                  {(isActiveFilter !== "All" || subscriptionFilter !== "All") && (
                    <button onClick={() => { setIsActiveFilter("All"); setSubscriptionFilter("All"); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                {isLoading ? (
                  <div className="p-20 text-center font-inter">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4 font-inter" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing companies vault...</p>
                  </div>
                ) : isError ? (
                  <div className="p-20 text-center text-rose-500 font-inter font-bold">
                    Error loading companies: {(error as any)?.message}
                  </div>
                ) : companies.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                    No companies found matching the criteria.
                  </div>
                ) : (
                  <table className="w-full text-left font-inter min-w-[1200px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                        <th className="px-6 py-4 font-inter">Company Info</th>
                        <th className="px-6 py-4 font-inter">Subdomain</th>
                        <th className="px-6 py-4 font-inter">Plan Details</th>
                        <th className="px-6 py-4 text-center font-inter">Usage</th>
                        <th className="px-6 py-4 font-inter">Subscription</th>
                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-inter">
                      {companies.map((company) => (
                        <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                          <td className="px-6 py-4 font-inter">
                            <div className="flex flex-col font-inter">
                              <Link to={`/superadmin/companies/${company.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors font-inter">
                                {company.name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">ID: #{company.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className="text-sm font-bold text-blue-600 font-inter">{company.subdomain}</span>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className="text-sm font-semibold text-slate-600 font-inter">{company.plan_name || "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-center font-inter">
                            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600">
                              <span title="Users">{company.user_count ?? 0} U</span>
                              <span title="Projects">{company.project_count ?? 0} P</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${
                              company.subscription_status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              company.subscription_status === 'Suspended' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              company.subscription_status === 'Trial' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              company.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {company.subscription_status || (company.is_active ? 'Active' : 'Unknown')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-inter">
                            <div className="flex justify-end gap-3">
                              <Link to={`/superadmin/companies/${company.id}`} className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg" title="View"><Eye className="w-4 h-4" /></Link>
                              <button onClick={() => handleOpenEditModal(company)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl" title="Edit"><Edit2 className="w-4 h-4" /></button>
                              <button 
                                onClick={() => {
                                  if (company.is_active) {
                                    setDeactivatingCompanyId(company.id);
                                    setDeactivateReason("");
                                    setIsDeactivateModalOpen(true);
                                  } else {
                                    activateCompanyMutation.mutate(company.id);
                                  }
                                }}
                                disabled={activateCompanyMutation.isPending || deactivateCompanyMutation.isPending}
                                className={`transition-colors ${(activateCompanyMutation.isPending || deactivateCompanyMutation.isPending) ? 'opacity-50 cursor-not-allowed' : company.is_active ? 'text-slate-400 hover:text-rose-600' : 'text-slate-400 hover:text-emerald-600'}`}
                              >
                                {company.is_active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => {
                                  setSuspendingCompanyId(company.id);
                                  setIsSuspendModalOpen(true);
                                }} 
                                title="Suspend Company"
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleOpenDeleteModal(company.id)} title="Delete Company" className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!isLoading && companies.length > 0 && response && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                  {/* Left: Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-blue-600 bg-white shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Center: Showing info */}
                  <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                    Showing {(response.page - 1) * response.size + 1} - {Math.min(response.page * response.size, response.total)} of {response.total} records
                  </div>

                  {/* Right: Pagination */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {(() => {
                      const totalPages = response.pages || Math.ceil(response.total / response.size) || 1;
                      let pages = [];
                      
                      if (totalPages <= 5) {
                        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                      } else {
                        if (currentPage <= 3) {
                          pages = [1, 2, 3, 4, '...', totalPages];
                        } else if (currentPage >= totalPages - 2) {
                          pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                        } else {
                          pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                        }
                      }

                      return pages.map((page, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof page === 'number' && setCurrentPage(page)}
                          disabled={typeof page !== 'number'}
                          className={`
                            min-w-[28px] h-7 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center
                            ${page === currentPage
                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
                              : page === '...'
                                ? 'bg-transparent border-transparent text-slate-400 cursor-default shadow-none'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-slate-300'}
                            ${typeof page === 'number' ? 'border' : ''}
                          `}
                        >
                          {page}
                        </button>
                      ));
                    })()}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(response.pages, prev + 1))}
                      disabled={currentPage >= (response.pages || 1)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add/Edit Company Centered Modal */}
          {isCompanyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                    {modalMode === "add" ? "Add Company Registry" : "Update Company Registry"}
                  </h2>
                  <button type="button" onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                  <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                    {formError && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg border border-rose-100">
                        {formError}
                      </div>
                    )}
                    
                    {/* Section 1: Company Identity */}
                    <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-5">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-slate-800">Company Identity</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REQUIRED FIELDS *</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Company Name*</label>
                          <input name="name" value={formData.name} onChange={handleInputChange} required type="text" placeholder="Enter company name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Subdomain*</label>
                          <div className="flex items-stretch w-full shadow-sm rounded-lg">
                            <input name="subdomain" value={formData.subdomain} onChange={handleInputChange} required type="text" placeholder="yourcompany" className="flex-1 min-w-0 border border-slate-200 rounded-l-lg px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none" />
                            <span className="bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg px-3 py-2 text-sm text-slate-500 font-medium whitespace-nowrap flex items-center">.infrapilot.com</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Company Plan */}
                    {modalMode === "add" && (
                      <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-5">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-bold text-slate-800">Company Plan</h3>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REQUIRED FIELDS *</span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Select Plan*</label>
                          <select name="plan_id" value={formData.plan_id} onChange={handleInputChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none bg-white">
                            <option value="">Choose a plan</option>
                            {plans.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                  </form>
                </div>

                <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white rounded-b-2xl">
                  <button type="button" onClick={() => setIsCompanyModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button form="company-form" type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex justify-center items-center gap-2">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modalMode === "add" ? "Add Company" : "Update Company"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Deactivate Confirmation Modal */}
          {isDeactivateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white">
                  <h2 className="text-[15px] font-bold text-[#0B213F]">Deactivate Company</h2>
                  <button type="button" onClick={() => setIsDeactivateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col space-y-4">
                  <div className="flex flex-col items-center text-center space-y-4 mb-2">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2">
                      <ShieldOff className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                      Are you sure you want to deactivate this company? <br />
                      Please provide a reason for deactivation.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Reason <span className="text-rose-500">*</span></label>
                    <textarea 
                      value={deactivateReason} 
                      onChange={(e) => setDeactivateReason(e.target.value)} 
                      required 
                      placeholder="Enter reason for deactivation" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-rose-500 focus:outline-none resize-none min-h-[80px]" 
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-slate-50 flex items-center justify-end gap-3 bg-white">
                  <button type="button" onClick={() => setIsDeactivateModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={() => deactivateCompanyMutation.mutate()} 
                    disabled={deactivateCompanyMutation.isPending || !deactivateReason.trim()}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {deactivateCompanyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white">
                  <h2 className="text-[15px] font-bold text-[#0B213F]">Discard Company Entry</h2>
                  <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                    Are you sure you want to delete this company record? <br />
                    This action will permanently remove the entry and all its data history from the system.
                  </p>
                </div>

                <div className="p-5 border-t border-slate-50 flex items-center justify-end gap-3 bg-white">
                  <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={() => deleteCompanyMutation.mutate()} 
                    disabled={deleteCompanyMutation.isPending}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {deleteCompanyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Archive Record
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suspend Confirmation Modal */}
          {isSuspendModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white">
                  <h2 className="text-[15px] font-bold text-[#0B213F]">Suspend Company</h2>
                  <button type="button" onClick={() => setIsSuspendModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2">
                    <Ban className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                    Are you sure you want to suspend this company? <br />
                    This will block access for all users in this tenant.
                  </p>
                </div>

                <div className="p-5 border-t border-slate-50 flex items-center justify-end gap-3 bg-white">
                  <button type="button" onClick={() => setIsSuspendModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={() => suspendCompanyMutation.mutate()} 
                    disabled={suspendCompanyMutation.isPending}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {suspendCompanyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Suspend
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </>
  );
};

export default CompaniesPage;
