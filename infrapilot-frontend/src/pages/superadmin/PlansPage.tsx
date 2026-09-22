import { useState } from "react";
import { Check, Edit2, Loader2, Eye, Type, AlignLeft, DollarSign, Calendar, Globe, List, ToggleRight, Hash, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";

const PlansPage = () => {
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading, isError, error } = useQuery({
    queryKey: ['superadmin_plans'],
    queryFn: () => superadminService.getPlans()
  });

  const DEFAULT_PLAN_FEATURES = JSON.stringify({
    payroll: true,
    equipment: true,
    max_users: 200,
    storage_gb: 250,
    ai_features: true,
    max_projects: 100,
    advanced_reports: true
  }, null, 2);

  // Add Plan State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", code: "", description: "", price: 0, billing_interval: "monthly", currency: "INR", features: DEFAULT_PLAN_FEATURES, is_active: true
  });

  // Edit Plan State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPlanId, setEditPlanId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", price: 0, billing_interval: "monthly", currency: "INR", features: DEFAULT_PLAN_FEATURES, is_active: true
  });

  // View Plan State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPlanId, setViewPlanId] = useState<number | null>(null);

  const { data: viewPlanData, isLoading: isViewing } = useQuery({
    queryKey: ['superadmin_plan', viewPlanId],
    queryFn: () => superadminService.getPlan(viewPlanId!),
    enabled: !!viewPlanId
  });

  // Delete Plan State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return superadminService.deletePlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_plans'] });
      setIsDeleteModalOpen(false);
    }
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: async () => {
      let parsedFeatures = {};
      try { parsedFeatures = JSON.parse(addForm.features); } catch (e) { }
      return superadminService.createPlan({
        ...addForm,
        features: parsedFeatures
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_plans'] });
      setIsAddModalOpen(false);
      setAddForm({ name: "", code: "", description: "", price: 0, billing_interval: "monthly", currency: "INR", features: DEFAULT_PLAN_FEATURES, is_active: true });
    }
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      let parsedFeatures = {};
      try { parsedFeatures = JSON.parse(editForm.features); } catch (e) { }
      return superadminService.updatePlan(editPlanId!, {
        ...editForm,
        features: parsedFeatures
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_plans'] });
      setIsEditModalOpen(false);
    }
  });

  const handleEditClick = (plan: any) => {
    setEditPlanId(plan.id);
    setEditForm({
      name: plan.name || "",
      description: plan.description || "",
      price: plan.price || 0,
      billing_interval: plan.billing_interval || "monthly",
      currency: plan.currency || "INR",
      features: plan.features ? JSON.stringify(plan.features, null, 2) : "{}",
      is_active: plan.is_active ?? true
    });
    setIsEditModalOpen(true);
  };

  const handleViewClick = (plan: any) => {
    setViewPlanId(plan.id);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <Navbar title="Subscription Plans" breadcrumb={["InfraPilot", "Super Admin", "Plans"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Plans & Pricing</h1>
              <p className="text-sm text-slate-500">Manage subscription tiers, features, and pricing</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >

              Add Plans
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {isLoading ? (
              <div className="col-span-3 flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : isError ? (
              <div className="col-span-3 text-center py-8 text-rose-500">Error loading plans: {(error as any)?.message}</div>
            ) : plans.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-slate-500">No plans found.</div>
            ) : plans.map((plan) => {
              const isPopular = plan.name.toLowerCase().includes('professional');
              const planColor = plan.name.toLowerCase().includes('starter') ? 'text-emerald-500' :
                plan.name.toLowerCase().includes('enterprise') ? 'text-amber-500' : 'text-indigo-600';

              const featuresList = plan.features
                ? (Array.isArray(plan.features) ? plan.features : Object.entries(plan.features).map(([k, v]) => v === true ? k : `${k}: ${v}`))
                : [];

              return (
                <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border ${isPopular ? 'border-indigo-500 shadow-md relative' : 'border-slate-200'} p-8 flex flex-col`}>
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                      Most Popular
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h2 className={`text-xl font-bold ${planColor} mb-4`}>{plan.name}</h2>
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <span className="text-3xl font-black text-slate-800">₹{plan.price}</span>
                      <span className="text-sm text-slate-500 font-medium mb-1">/{plan.billing_interval || 'month'}</span>
                    </div>
                    <p className="text-xs text-slate-500 px-4">{plan.description || "Perfect for getting started"}</p>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 mb-8">
                      {featuresList.map((feature: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                          <Check className={`w-4 h-4 mt-0.5 ${planColor}`} />
                          {String(feature)}
                        </li>
                      ))}
                      {featuresList.length === 0 && (
                        <li className="flex items-start gap-3 text-sm text-slate-400 italic">No features listed</li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-6">
                      {plan.is_active ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Active</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Inactive</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleViewClick(plan)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg"
                          title="View Plan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(plan)}
                          className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletePlanId(plan.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageTransition>

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Plan"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Plan
            </button>
          </div>
        }
      >
        <div className="p-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Plan Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Type className="w-3.5 h-3.5 text-blue-500" /> Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter plan name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <AlignLeft className="w-3.5 h-3.5 text-blue-500" /> Description
                </label>
                <textarea
                  placeholder="Enter plan description"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Hash className="w-3.5 h-3.5 text-blue-500" /> Plan Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. starter_monthly"
                  value={addForm.code}
                  onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Billing Interval <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.billing_interval}
                  onChange={(e) => setAddForm({ ...addForm, billing_interval: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.currency}
                  onChange={(e) => setAddForm({ ...addForm, currency: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <List className="w-3.5 h-3.5 text-blue-500" /> Features (JSON)
                </label>
                <textarea
                  value={addForm.features}
                  onChange={(e) => setAddForm({ ...addForm, features: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-mono text-slate-600 focus:ring-1 focus:ring-blue-500"
                  rows={8}
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider">
                  <ToggleRight className="w-3.5 h-3.5 text-blue-500" /> Status
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.is_active}
                    onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  <span className="ml-3 text-sm font-semibold text-slate-700">{addForm.is_active ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Plan"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Plan
            </button>
          </div>
        }
      >
        <div className="p-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Plan Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Type className="w-3.5 h-3.5 text-blue-500" /> Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter plan name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <AlignLeft className="w-3.5 h-3.5 text-blue-500" /> Description
                </label>
                <textarea
                  placeholder="Enter plan description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Billing Interval <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.billing_interval}
                  onChange={(e) => setEditForm({ ...editForm, billing_interval: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.currency}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-2">
                  <List className="w-3.5 h-3.5 text-blue-500" /> Features (JSON)
                </label>
                <textarea
                  value={editForm.features}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-mono text-slate-600 focus:ring-1 focus:ring-blue-500"
                  rows={8}
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider">
                  <ToggleRight className="w-3.5 h-3.5 text-blue-500" /> Status
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  <span className="ml-3 text-sm font-semibold text-slate-700">{editForm.is_active ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Plan Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Plan Details"
        maxWidth="max-w-2xl"
        bodyPadding="p-0"
        footer={
          <div className="flex items-center justify-end gap-6 w-full px-2 py-1">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                if (viewPlanData) handleEditClick(viewPlanData);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Edit Plan
            </button>
          </div>
        }
      >
        <div className="flex flex-col">
          {isViewing ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : viewPlanData ? (
            <>
              {/* Blue Header Section */}
              <div className="bg-[#1a56ff] text-white p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-bold">{viewPlanData.name}</h2>
                  <span className="bg-white/20 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                    CODE: {viewPlanData.code}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-2">PRICE</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{viewPlanData.currency} {viewPlanData.price}</span>
                  <span className="text-lg font-medium text-blue-100 mb-1">/{viewPlanData.billing_interval}</span>
                </div>
              </div>

              {/* Grid Details Section */}
              <div className="p-8 grid grid-cols-3 gap-y-8 gap-x-6 bg-white">
                <div>
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">PLAN NAME</div>
                  <div className="text-sm text-slate-800 font-bold">{viewPlanData.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">PLAN CODE</div>
                  <div className="text-sm text-slate-800 font-bold">{viewPlanData.code}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">STATUS</div>
                  <div className="text-sm font-bold">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${viewPlanData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {viewPlanData.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">PRICE</div>
                  <div className="text-sm text-slate-800 font-bold">{viewPlanData.currency} {viewPlanData.price}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">BILLING INTERVAL</div>
                  <div className="text-sm text-slate-800 font-bold capitalize">{viewPlanData.billing_interval}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">CURRENCY</div>
                  <div className="text-sm text-slate-800 font-bold">{viewPlanData.currency}</div>
                </div>
                <div className="col-span-3">
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">DESCRIPTION</div>
                  <div className="text-sm text-slate-800 font-medium">{viewPlanData.description || '-'}</div>
                </div>
                <div className="col-span-3">
                  <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider mb-1">FEATURES</div>
                  <pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto border border-slate-100 text-slate-600 font-mono">
                    {viewPlanData.features ? JSON.stringify(viewPlanData.features, null, 2) : '{}'}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 font-medium">Failed to load plan details.</div>
          )}
        </div>
      </Modal>

      {/* Delete Plan Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Plan"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end w-full gap-6 px-2 py-1">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deletePlanId!)}
              disabled={deleteMutation.isPending}
              className="px-6 py-2.5 bg-[#FF1F4F] hover:bg-[#E01742] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-red-200"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Plan
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center text-center py-8 px-6 bg-white">
          <div className="w-16 h-16 bg-[#FFF0F3] text-[#FF1F4F] rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-slate-600 text-sm leading-relaxed max-w-[280px]">
            Are you sure you want to delete this plan? This action will permanently remove the entry.
          </p>
        </div>
      </Modal>

    </>
  );
};

export default PlansPage;
