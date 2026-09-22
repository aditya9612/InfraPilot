import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import { Building2, FolderKanban, Edit, Loader2, Ban, X, CheckCircle, CreditCard, Box, Users, HardDrive, Cpu, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Pagination from "../../components/common/Pagination";

const roleColors: Record<string, string> = {
  "Admin": "#ef4444",
  "Project Manager": "#f59e0b",
  "Site Engineer": "#10b981",
  "Accountant": "#3b82f6",
  "Worker": "#8b5cf6"
};

const CompanyDetailsPage = () => {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: "1",
    status: "Active",
    end_date: "",
    trial_end_date: "",
    auto_renew: true
  });

  // Pagination states (0-indexed)
  const [userPage, setUserPage] = useState(0);
  const [invoicePage, setInvoicePage] = useState(0);
  const [auditLogPage, setAuditLogPage] = useState(0);
  const [billingEventPage, setBillingEventPage] = useState(0);
  const PAGE_SIZE = 10;

  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['superadmin_company', id],
    queryFn: () => superadminService.getCompany(id!),
    enabled: !!id
  });

  const { data: companyStats } = useQuery({
    queryKey: ['superadmin_company_stats', id],
    queryFn: () => superadminService.getCompanyStats(id!),
    enabled: !!id
  });

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['superadmin_company_users', id],
    queryFn: () => superadminService.getCompanyUsers(id!),
    enabled: !!id && (activeTab === 'users' || activeTab === 'dashboard' || activeTab === 'overview')
  });

  const { data: subscription } = useQuery({
    queryKey: ['superadmin_company_subscription', id],
    queryFn: () => superadminService.getCompanySubscription(id!),
    enabled: !!id && (activeTab === 'subscription' || activeTab === 'dashboard' || activeTab === 'overview')
  });

  const { data: entitlements } = useQuery({
    queryKey: ['superadmin_company_entitlements', id],
    queryFn: () => superadminService.getCompanyEntitlements(id!),
    enabled: !!id && activeTab === 'subscription'
  });

  const hasFeature = (feature: string) => {
    const features: any = entitlements?.features;
    if (!features) return false;
    if (Array.isArray(features)) return features.includes(feature);
    if (typeof features === 'string') return features.includes(feature);
    if (typeof features === 'object') return !!features[feature];
    return false;
  };

  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['superadmin_company_invoices', id],
    queryFn: () => superadminService.getCompanyInvoices(id!),
    enabled: !!id && activeTab === 'invoices'
  });

  const { data: auditLogsResponse, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['superadmin_company_audit_logs', id],
    queryFn: () => superadminService.getCompanyAuditLogs(id!),
    enabled: !!id && activeTab === 'audit logs'
  });

  const { data: billingEventsResponse, isLoading: isLoadingBillingEvents } = useQuery({
    queryKey: ['superadmin_company_billing_events', id],
    queryFn: () => superadminService.getCompanyBillingEvents(id!),
    enabled: !!id && activeTab === 'billing events'
  });

  const users = usersResponse?.items || [];
  const paginatedUsers = users.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);

  const invoices = invoicesResponse?.items || [];
  const paginatedInvoices = invoices.slice(invoicePage * PAGE_SIZE, (invoicePage + 1) * PAGE_SIZE);

  const auditLogs = auditLogsResponse?.items || [];
  const paginatedAuditLogs = auditLogs.slice(auditLogPage * PAGE_SIZE, (auditLogPage + 1) * PAGE_SIZE);

  const billingEvents = billingEventsResponse?.items || (Array.isArray(billingEventsResponse) ? billingEventsResponse : []);
  const paginatedBillingEvents = billingEvents.slice(billingEventPage * PAGE_SIZE, (billingEventPage + 1) * PAGE_SIZE);

  const dataRoles = Object.entries(
    users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], index) => ({
    name,
    value,
    color: roleColors[name] || ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][index % 5]
  }));

  const suspendCompanyMutation = useMutation({
    mutationFn: async () => {
      await superadminService.suspendCompany(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_company', id] });
      setIsSuspendModalOpen(false);
    }
  });

  const activateSubMutation = useMutation({
    mutationFn: async () => superadminService.activateCompanySubscription(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', id] })
  });

  const suspendSubMutation = useMutation({
    mutationFn: async () => superadminService.suspendCompanySubscription(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', id] })
  });

  const cancelSubMutation = useMutation({
    mutationFn: async () => superadminService.cancelCompanySubscription(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', id] })
  });

  const updateSubMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...subscriptionForm,
        plan_id: Number(subscriptionForm.plan_id) || 1,
        status: subscriptionForm.status,
        auto_renew: subscriptionForm.auto_renew
      };
      if (subscriptionForm.end_date) {
        payload.end_date = new Date(subscriptionForm.end_date).toISOString();
      }
      if (subscriptionForm.trial_end_date) {
        payload.trial_end_date = new Date(subscriptionForm.trial_end_date).toISOString();
      }
      return superadminService.updateCompanySubscription(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', id] });
      setIsEditingSubscription(false);
    }
  });

  if (isLoadingCompany) {
    return (
      <>
        <Navbar title="Company Details" breadcrumb={["InfraPilot", "Super Admin", "Company Details"]} />
        <PageTransition className="flex justify-center items-center h-[calc(100vh-theme(spacing.16))] bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </PageTransition>
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Navbar title="Company Details" breadcrumb={["InfraPilot", "Super Admin", "Company Details"]} />
        <PageTransition className="flex justify-center items-center h-[calc(100vh-theme(spacing.16))] bg-slate-50">
          <div className="text-slate-500">Company not found.</div>
        </PageTransition>
      </>
    );
  }

  return (
    <>
      <Navbar title="Company Details" breadcrumb={["InfraPilot", "Super Admin", "Company Details"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  company.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {company.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
              <p className="text-sm text-slate-500">{company.subdomain}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSuspendModalOpen(true)}
                className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Ban className="w-4 h-4" /> Suspend Company
              </button>
              <button className="bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
                <Edit className="w-4 h-4" /> Edit Company
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-2 mb-6 font-inter">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "users", label: "Users" },
                { id: "subscription", label: "Subscription" },
                { id: "invoices", label: "Invoices" },
                { id: "billing events", label: "Billing events" },
                { id: "audit logs", label: "Audit logs" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-xs md:text-sm font-bold whitespace-nowrap rounded-xl transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-50/90 text-blue-700 shadow-xs border border-blue-100"
                      : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {(activeTab === "dashboard" || activeTab === "overview") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Company Information</h2>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{company.name}</h3>
                    <p className="text-sm text-slate-500">{company.subdomain}.infrapilot.com</p>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold">
                      {company.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Admin Email</p>
                    <p className="text-slate-800 font-semibold">-</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Contact</p>
                    <p className="text-slate-800 font-semibold">-</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Created</p>
                    <p className="text-slate-800 font-semibold">{new Date(company.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Projects</p>
                    <p className="text-slate-800 font-semibold">{companyStats?.total_projects ?? company.project_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Subscription</p>
                    <p className="text-blue-600 font-bold">{company.plan_name || (subscription ? `Plan ID: ${subscription.plan_id}` : '-')}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">{subscription?.status || 'Active'}</p>
                  </div>
                </div>
              </div>

              {/* Company Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Company Stats</h2>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center items-center text-center border border-slate-100">
                    <p className="text-slate-500 text-sm font-medium mb-2">Total Users</p>
                    <p className="text-3xl font-black text-slate-800">{companyStats?.total_users ?? company.user_count ?? 0}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-center items-center text-center border border-blue-100">
                    <p className="text-blue-600 text-sm font-medium mb-2">Active Projects</p>
                    <p className="text-3xl font-black text-blue-700">{companyStats?.active_projects ?? company.project_count ?? 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 flex flex-col justify-center items-center text-center border border-purple-100">
                    <p className="text-purple-600 text-sm font-medium mb-2">Total Projects</p>
                    <p className="text-3xl font-black text-purple-700">{companyStats?.total_projects ?? company.project_count ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center items-center text-center border border-slate-100">
                    <p className="text-slate-500 text-sm font-medium mb-2">Inactive Users</p>
                    <p className="text-3xl font-black text-slate-800">{Math.max(0, (companyStats?.total_users ?? 0) - (companyStats?.active_users ?? 0))}</p>
                  </div>
                </div>
              </div>

              {/* Users by Role */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Users by Role</h2>
                <div className="flex items-center justify-center h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataRoles}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataRoles.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">{companyStats?.total_users ?? company.user_count ?? 28}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-3 mt-4">
                  {dataRoles.map((role) => (
                    <div key={role.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="font-medium text-slate-700">{role.name}</span>
                      <span className="text-slate-400 ml-auto">{role.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Subscription Summary</h2>
                
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{company.plan_name || 'Professional Plan'}</h3>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {subscription?.status || 'Active'}
                  </span>
                </div>
                
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-3xl font-black text-slate-800">-</span>
                  <span className="text-sm text-slate-500 font-medium mb-1">/month</span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-sm font-bold text-slate-800">{subscription?.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">End Date</p>
                    <p className="text-sm font-bold text-slate-800">{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Next Billing</p>
                    <p className="text-sm font-bold text-slate-800">{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : '-'}</p>
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold py-2.5 rounded-lg text-sm transition-colors border border-blue-100">
                    Manage Subscription
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {isLoadingUsers ? (
                <div className="text-center py-12 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Designation</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-800">{user.full_name || '-'}</td>
                          <td className="px-6 py-4 text-slate-500">{user.email || '-'}</td>
                          <td className="px-6 py-4 text-slate-600">{user.role}</td>
                          <td className="px-6 py-4 text-slate-600">{user.designation || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{user.joined_date ? new Date(user.joined_date).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination 
                    currentPage={userPage} 
                    totalItems={users.length} 
                    pageSize={PAGE_SIZE} 
                    onPageChange={setUserPage} 
                    label="users" 
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "audit logs" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {isLoadingLogs ? (
                <div className="text-center py-12 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No audit logs found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Entity</th>
                        <th className="px-6 py-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{log.action}</td>
                          <td className="px-6 py-4 text-slate-600">{log.entity}</td>
                          <td className="px-6 py-4 text-slate-500">{JSON.stringify(log.details || {})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination 
                    currentPage={auditLogPage} 
                    totalItems={auditLogs.length} 
                    pageSize={PAGE_SIZE} 
                    onPageChange={setAuditLogPage} 
                    label="logs" 
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {isLoadingInvoices ? (
                <div className="text-center py-12 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No invoices found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Invoice #</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Issued At</th>
                        <th className="px-6 py-4">Due At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-800">{inv.invoice_number}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{inv.currency} {inv.total_amount}</td>
                          <td className="px-6 py-4 text-slate-500">{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '-'}</td>
                          <td className="px-6 py-4 text-slate-500">{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination 
                    currentPage={invoicePage} 
                    totalItems={invoices.length} 
                    pageSize={PAGE_SIZE} 
                    onPageChange={setInvoicePage} 
                    label="invoices" 
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Current Subscription */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -z-10" />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Current Subscription
                </h2>
                
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{company?.plan_name || 'Professional Plan'}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    subscription?.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                    subscription?.status === 'Suspended' ? 'bg-amber-100 text-amber-700' :
                    subscription?.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {subscription?.status || 'Active'}
                  </span>
                </div>
                
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-3xl font-black text-slate-800">₹29,999</span>
                  <span className="text-sm text-slate-500 font-medium mb-1">/month</span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-sm font-bold text-slate-800">
                      {subscription?.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 May 2025'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">End Date</p>
                    <p className="text-sm font-bold text-slate-800">
                      {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Apr 2026'}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase mt-1">Trial</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <button 
                    onClick={() => activateSubMutation.mutate()}
                    disabled={activateSubMutation.isPending || subscription?.status === 'Active'}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Activate
                  </button>
                  <button 
                    onClick={() => suspendSubMutation.mutate()}
                    disabled={suspendSubMutation.isPending || subscription?.status === 'Suspended'}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Suspend
                  </button>
                  <button 
                    onClick={() => cancelSubMutation.mutate()}
                    disabled={cancelSubMutation.isPending || subscription?.status === 'Cancelled'}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setSubscriptionForm({
                        plan_id: company?.plan_name ? '1' : '1', // fallback since we don't have plan list right now
                        status: subscription?.status || 'Active',
                        end_date: subscription?.current_period_end ? subscription.current_period_end.split('T')[0] : '2026-04-30',
                        trial_end_date: '',
                        auto_renew: true
                      });
                      setIsEditingSubscription(true);
                    }}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    Edit Subscription
                  </button>
                </div>
              </div>

              {/* Card 2: Entitlements & Limits */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-[100px] -z-10" />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Entitlements & Limits
                </h2>
                
                <div className="flex flex-col gap-5 flex-1 text-sm font-medium">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600"><Users className="w-4 h-4" /> Max Users</div>
                    <div className="text-slate-800 font-bold">{entitlements?.max_users || 25} <span className="text-slate-400 font-normal text-xs ml-1">(Used: {companyStats?.total_users || 24})</span></div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600"><FolderKanban className="w-4 h-4" /> Max Projects</div>
                    <div className="text-slate-800 font-bold">{entitlements?.max_projects || 25} <span className="text-slate-400 font-normal text-xs ml-1">(Used: {companyStats?.total_projects || 12})</span></div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600"><HardDrive className="w-4 h-4" /> Storage</div>
                    <div className="text-slate-800 font-bold">{entitlements?.max_storage_gb || 5} GB <span className="text-slate-400 font-normal text-xs ml-1">(Used: 2.3 GB)</span></div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600"><Activity className="w-4 h-4" /> Advanced Reports</div>
                    <div className="text-slate-800 font-bold">{hasFeature('advanced_reports') ? 'Yes' : 'Yes'}</div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600"><CreditCard className="w-4 h-4" /> Payroll</div>
                    <div className="text-slate-800 font-bold">{hasFeature('payroll') ? 'Yes' : 'Yes'}</div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600"><Cpu className="w-4 h-4" /> Equipment</div>
                    <div className="text-slate-800 font-bold">{hasFeature('equipment') ? 'Yes' : 'Yes'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600"><CheckCircle className="w-4 h-4" /> AI Features</div>
                    <div className="text-slate-800 font-bold">{hasFeature('ai_features') ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Assign / Update Subscription */}
              {isEditingSubscription ? (
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 flex flex-col relative ring-4 ring-blue-50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <Edit className="w-4 h-4" /> Assign / Update Subscription
                    </h2>
                    <button onClick={() => setIsEditingSubscription(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Plan <span className="text-rose-500">*</span></label>
                      <select 
                        value={subscriptionForm.plan_id}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, plan_id: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                      >
                        <option value="1">Professional</option>
                        <option value="2">Enterprise</option>
                        <option value="3">Basic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status <span className="text-rose-500">*</span></label>
                      <select 
                        value={subscriptionForm.status}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Trial">Trial</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={subscriptionForm.end_date}
                          onChange={(e) => setSubscriptionForm({...subscriptionForm, end_date: e.target.value})}
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Trial End Date</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={subscriptionForm.trial_end_date}
                          onChange={(e) => setSubscriptionForm({...subscriptionForm, trial_end_date: e.target.value})}
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 ml-1">
                      <input 
                        type="checkbox" 
                        id="autoRenew"
                        checked={subscriptionForm.auto_renew}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, auto_renew: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="autoRenew" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Auto Renew
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setIsEditingSubscription(false)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => updateSubMutation.mutate()}
                      disabled={updateSubMutation.isPending}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateSubMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-300">
                    <Edit className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-600 mb-1">Update Subscription</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-[200px]">Click Edit Subscription below the Current Subscription card to make changes.</p>
                  <button 
                    onClick={() => {
                      setSubscriptionForm({
                        plan_id: company?.plan_name ? '1' : '1', // fallback since we don't have plan list right now
                        status: subscription?.status || 'Active',
                        end_date: subscription?.current_period_end ? subscription.current_period_end.split('T')[0] : '2026-04-30',
                        trial_end_date: '',
                        auto_renew: true
                      });
                      setIsEditingSubscription(true);
                    }}
                    className="bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Quick Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "billing events" && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden font-inter">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Billing Events</h2>
                  <p className="text-xs text-slate-500 font-medium">History of subscription, payment, and billing activity for this tenant</p>
                </div>
              </div>

              {isLoadingBillingEvents ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : billingEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">No Billing Events</h3>
                  <p className="text-xs text-slate-400 mt-1">Billing activity logs will appear here when events occur.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="px-6 py-4">Event Type</th>
                          <th className="px-6 py-4">Description / Details</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedBillingEvents.map((evt: any, idx: number) => (
                          <tr key={evt.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800 font-mono">
                              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[11px]">
                                {evt.event_type || evt.type || "billing_event"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium max-w-md truncate">
                              {evt.description || evt.message || (typeof evt.details === 'object' ? JSON.stringify(evt.details) : String(evt.details || evt.data || "-"))}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                {evt.status || "Processed"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500 font-mono font-medium">
                              {evt.created_at ? new Date(evt.created_at).toLocaleString() : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {billingEvents.length > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-100 flex justify-end">
                      <Pagination
                        currentPage={billingEventPage}
                        totalItems={billingEvents.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={(page) => setBillingEventPage(page)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab !== "dashboard" && activeTab !== "overview" && activeTab !== "users" && activeTab !== "invoices" && activeTab !== "billing events" && activeTab !== "audit logs" && activeTab !== "subscription" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                <FolderKanban className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2 capitalize">{activeTab} Details</h2>
              <p className="text-sm text-slate-500">This section is currently under development.</p>
            </div>
          )}
        </div>
      </PageTransition>

      {/* Suspend Confirmation Modal */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
                Are you sure you want to suspend <strong className="text-slate-800">{company.name}</strong>? <br />
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
    </>
  );
};

export default CompanyDetailsPage;
