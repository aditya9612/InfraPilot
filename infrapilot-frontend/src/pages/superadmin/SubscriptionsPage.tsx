import { useState, useEffect } from "react";
import { Search, Loader2, Building2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';

import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const SubscriptionsPage = () => {
  const queryClient = useQueryClient();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | null>(1);

  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: "1",
    status: "Active",
    start_date: "",
    end_date: "",
    trial_end_date: "",
    auto_renew: true
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    plan_id: "1",
    status: "Active",
    end_date: "",
    trial_end_date: "",
    auto_renew: true
  });

  // Fetch all companies for the dropdown filter
  const { data: companiesResponse } = useQuery({
    queryKey: ['superadmin_all_companies'],
    queryFn: () => superadminService.getCompanies({ limit: 100 })
  });

  // Selected Company Details
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['superadmin_company', selectedCompanyId],
    queryFn: () => superadminService.getCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId
  });

  const { data: subscription, isLoading: isLoadingSub } = useQuery({
    queryKey: ['superadmin_company_subscription', selectedCompanyId],
    queryFn: () => superadminService.getCompanySubscription(selectedCompanyId!),
    enabled: !!selectedCompanyId
  });

  const { data: entitlements, isLoading: isLoadingEnt } = useQuery({
    queryKey: ['superadmin_company_entitlements', selectedCompanyId],
    queryFn: () => superadminService.getCompanyEntitlements(selectedCompanyId!),
    enabled: !!selectedCompanyId
  });

  const hasFeature = (feature: string) => {
    const features: any = entitlements?.features;
    if (!features) return false;
    if (Array.isArray(features)) return features.includes(feature);
    if (typeof features === 'string') return features.includes(feature);
    if (typeof features === 'object') return !!features[feature];
    return false;
  };

  // Pre-fill form when subscription loads
  useEffect(() => {
    if (subscription) {
      setSubscriptionForm({
        plan_id: subscription.plan_id ? String(subscription.plan_id) : '1',
        status: subscription.status || 'Active',
        start_date: subscription.current_period_start ? subscription.current_period_start.split('T')[0] : '',
        end_date: subscription.current_period_end ? subscription.current_period_end.split('T')[0] : '2026-04-30',
        trial_end_date: subscription.trial_end ? subscription.trial_end.split('T')[0] : '',
        auto_renew: subscription.cancel_at_period_end === false
      });
    }
  }, [subscription, company]);

  // Mutations
  const activateSubMutation = useMutation({
    mutationFn: async () => superadminService.activateCompanySubscription(selectedCompanyId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', selectedCompanyId] })
  });

  const suspendSubMutation = useMutation({
    mutationFn: async () => superadminService.suspendCompanySubscription(selectedCompanyId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', selectedCompanyId] })
  });

  const cancelSubMutation = useMutation({
    mutationFn: async () => superadminService.cancelCompanySubscription(selectedCompanyId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', selectedCompanyId] })
  });

  const updateSubMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        plan_id: Number(subscriptionForm.plan_id) || 1,
        status: subscriptionForm.status.toLowerCase(), // Ensure lowercase as per common API standards if it is "Active", etc
        auto_renew: subscriptionForm.auto_renew
      };
      if (subscriptionForm.start_date) {
        payload.start_date = new Date(subscriptionForm.start_date).toISOString();
      }
      if (subscriptionForm.end_date) {
        payload.end_date = new Date(subscriptionForm.end_date).toISOString();
      }
      if (subscriptionForm.trial_end_date) {
        payload.trial_end_date = new Date(subscriptionForm.trial_end_date).toISOString();
      }
      return superadminService.createCompanySubscription(selectedCompanyId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', selectedCompanyId] });
      // You can add a success toast here if you have one
    }
  });

  const editSubMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        plan_id: Number(editForm.plan_id) || 1,
        status: editForm.status.toLowerCase(),
        auto_renew: editForm.auto_renew
      };
      if (editForm.end_date) {
        payload.end_date = new Date(editForm.end_date).toISOString();
      }
      if (editForm.trial_end_date) {
        payload.trial_end_date = new Date(editForm.trial_end_date).toISOString();
      }
      return superadminService.updateCompanySubscription(selectedCompanyId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_company_subscription', selectedCompanyId] });
      setIsEditModalOpen(false);
    }
  });

  const handleEditClick = () => {
     setEditForm({
        plan_id: subscription?.plan_id?.toString() || "1",
        status: subscription?.status || "Active",
        end_date: subscription?.current_period_end ? new Date(subscription.current_period_end).toISOString().split('T')[0] : "",
        trial_end_date: subscription?.trial_end ? new Date(subscription.trial_end).toISOString().split('T')[0] : "",
        auto_renew: subscription ? subscription.cancel_at_period_end === false : true
     });
     setIsEditModalOpen(true);
  };



  return (
    <>
      <Navbar title="Subscriptions" breadcrumb={["InfraPilot", "Super Admin", "Subscriptions"]} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div>
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Platform</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Subscription & Entitlements</h1>
              <p className="text-slate-500 text-sm">Manage tenant subscriptions, limits, and plan features</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCompanyId || ""}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="pl-10 pr-10 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[280px] shadow-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select a tenant...</option>
                  {companiesResponse?.items?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subdomain})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              
              <button className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
                <span className="text-sm font-bold text-slate-600">Filter</span>
              </button>
            </div>
          </div>

          {!selectedCompanyId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-[500px]">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Search for a Tenant</h2>
              <p className="text-sm text-slate-500 max-w-sm">Use the search bar above to select a company and view its subscription, limits, and plan features.</p>
            </div>
          ) : isLoadingCompany || isLoadingSub || isLoadingEnt ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-[500px]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-sm font-semibold text-slate-600">Loading subscription details...</p>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
              Showing details for: <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">{company?.name}</span>
            </div>
          )}

          {selectedCompanyId && !isLoadingCompany && !isLoadingSub && !isLoadingEnt && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Current Subscription */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Current Subscription</h2>
                  
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-[22px] font-bold text-slate-800">{company?.plan_name || 'Professional Plan'}</h3>
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
                    <span className="text-[26px] font-black text-slate-800">₹29,999</span>
                    <span className="text-[13px] text-slate-500 font-medium mb-1.5">/month</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Start Date</p>
                      <p className="text-sm font-bold text-slate-800">
                        {subscription?.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 May 2025'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">End Date</p>
                      <p className="text-sm font-bold text-slate-800">
                        {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Apr 2026'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={() => activateSubMutation.mutate()}
                      disabled={activateSubMutation.isPending || subscription?.status === 'Active'}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                    <button 
                      onClick={() => suspendSubMutation.mutate()}
                      disabled={suspendSubMutation.isPending || subscription?.status === 'Suspended'}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 disabled:opacity-50 text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Suspend
                    </button>
                    <button 
                      onClick={() => cancelSubMutation.mutate()}
                      disabled={cancelSubMutation.isPending || subscription?.status === 'Cancelled'}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleEditClick}
                    className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-lg transition-colors mt-auto"
                  >
                    Edit Subscription
                  </button>
                </div>

                {/* Card 2: Entitlements & Limits */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Entitlements & Limits</h2>
                  
                  <div className="flex flex-col gap-4 flex-1 text-[13px] font-medium">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-slate-600">Max Users</div>
                      <div className="text-slate-800 font-bold">{entitlements?.max_users || 25} <span className="text-slate-400 font-normal text-[11px] ml-1">(Used: 14)</span></div>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-slate-600">Max Projects</div>
                      <div className="text-slate-800 font-bold">{entitlements?.max_projects || 25} <span className="text-slate-400 font-normal text-[11px] ml-1">(Used: 12)</span></div>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-slate-600">Storage</div>
                      <div className="text-slate-800 font-bold">{entitlements?.max_storage_gb || 5} GB <span className="text-slate-400 font-normal text-[11px] ml-1">(Used: 2.3 GB)</span></div>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <div className="text-slate-600">Advanced Reports</div>
                      <div className="text-slate-800 font-bold">{hasFeature('advanced_reports') ? 'Yes' : 'Yes'}</div>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <div className="text-slate-600">Payroll</div>
                      <div className="text-slate-800 font-bold">{hasFeature('payroll') ? 'Yes' : 'Yes'}</div>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <div className="text-slate-600">Equipment</div>
                      <div className="text-slate-800 font-bold">{hasFeature('equipment') ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">AI Features</div>
                      <div className="text-slate-800 font-bold">{hasFeature('ai_features') ? 'Yes' : 'Yes'}</div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Assign / Update Subscription */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Assign / Update Subscription</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Plan</label>
                      <select 
                        value={subscriptionForm.plan_id}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, plan_id: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                      >
                        <option value="1">Professional</option>
                        <option value="2">Enterprise</option>
                        <option value="3">Basic</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Status</label>
                      <select 
                        value={subscriptionForm.status}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Trial">Trial</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Start Date</label>
                        <div className="relative">
                          <input 
                            type="date"
                            value={subscriptionForm.start_date}
                            onChange={(e) => setSubscriptionForm({...subscriptionForm, start_date: e.target.value})}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">End Date</label>
                        <div className="relative">
                          <input 
                            type="date"
                            value={subscriptionForm.end_date}
                            onChange={(e) => setSubscriptionForm({...subscriptionForm, end_date: e.target.value})}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Trial End Date</label>
                        <div className="relative">
                          <input 
                            type="date"
                            value={subscriptionForm.trial_end_date}
                            onChange={(e) => setSubscriptionForm({...subscriptionForm, trial_end_date: e.target.value})}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1 ml-1">
                      <input 
                        type="checkbox" 
                        id="autoRenew"
                        checked={subscriptionForm.auto_renew}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, auto_renew: e.target.checked})}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="autoRenew" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Auto Renew
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                    <button 
                      className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => updateSubMutation.mutate()}
                      disabled={updateSubMutation.isPending}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateSubMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </div>

              </div>
          )}

        </div>
      </PageTransition>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Update Company Subscription"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => editSubMutation.mutate()}
              disabled={editSubMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {editSubMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Plan</label>
            <select 
              value={editForm.plan_id}
              onChange={(e) => setEditForm({...editForm, plan_id: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="1">Professional</option>
              <option value="2">Enterprise</option>
              <option value="3">Basic</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Status</label>
            <select 
              value={editForm.status}
              onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Trial End Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={editForm.trial_end_date}
                  onChange={(e) => setEditForm({...editForm, trial_end_date: e.target.value})}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 ml-1">
            <input 
              type="checkbox" 
              id="editAutoRenew"
              checked={editForm.auto_renew}
              onChange={(e) => setEditForm({...editForm, auto_renew: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="editAutoRenew" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Auto Renew
            </label>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default SubscriptionsPage;
