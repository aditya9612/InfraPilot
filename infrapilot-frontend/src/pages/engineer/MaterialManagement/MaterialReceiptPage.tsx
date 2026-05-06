import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  Eye, 
  Edit2, 
  Trash2,
  Tag,
  Truck,
  Database,
  CreditCard
} from "lucide-react";
import { materialService, type MaterialItem, type MaterialLog, type CreateMaterialRequest } from "../../../services/materialService";

const CATEGORIES = ["Construction", "Electrical", "Plumbing", "Finishing", "Other"];
const UNITS = ["Bags", "Kg", "Ton", "Litre", "Nos", "Sqft", "Rft", "Cum"];
const RATE_TYPES = ["FIXED", "VARIABLE"];
const ISSUE_TYPES = ["SYSTEM", "MANUAL"];

const MaterialReceiptPage = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const projectId = 1;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form States
  const [formData, setFormData] = useState<Partial<CreateMaterialRequest>>({
    project_id: projectId,
    material_name: "",
    category: "Construction",
    unit: "Bags",
    supplier_id: 0,
    purchase_rate: 0,
    rate_type: "FIXED",
    quantity_purchased: 0,
    payment_given: 0,
    minimum_stock_level: 0
  });

  const [purchaseData, setPurchaseData] = useState({
    quantity: 0,
    amount_paid: 0,
    issue_type: "SYSTEM"
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mList, lList] = await Promise.all([
        materialService.listMaterials(projectId),
        materialService.getLogs({ project_id: projectId, type: "PURCHASE" })
      ]);
      setMaterials(mList || []);
      setLogs(lList || []);
    } catch (error) {
      toast.error("Failed to load material data");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await materialService.createMaterial(formData as CreateMaterialRequest);
      toast.success("Material added successfully!");
      setIsAddModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to add material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setIsSubmitting(true);
    try {
      await materialService.updateMaterial(selectedMaterial.id, {
        material_name: formData.material_name!,
        category: formData.category!,
        unit: formData.unit!,
        supplier_id: formData.supplier_id!,
        purchase_rate: formData.purchase_rate!,
        rate_type: formData.rate_type!,
        minimum_stock_level: formData.minimum_stock_level!
      });
      toast.success("Material updated successfully!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setIsSubmitting(true);
    try {
      await materialService.recordPurchase(selectedMaterial.id, {
        ...purchaseData,
        project_id: projectId
      });
      toast.success("Purchase recorded successfully!");
      setIsPurchaseModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to record purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await materialService.deleteMaterial(deleteId);
      toast.success("Material deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalMaterials: materials.length,
      totalPurchased: materials.reduce((acc, curr) => acc + (curr.quantity_purchased || 0), 0),
      totalAmount: materials.reduce((acc, curr) => acc + (curr.total_amount || 0), 0),
      paymentPending: materials.reduce((acc, curr) => acc + (curr.payment_pending || 0), 0),
    };
  }, [materials]);

  const alertBadge = (type: string) => {
    switch (type) {
      case "IN_STOCK": return "bg-emerald-100 text-emerald-600";
      case "LOW_STOCK": return "bg-rose-100 text-rose-600";
      case "OUT_OF_STOCK": return "bg-rose-100 text-rose-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold font-inter";
  const sectionClasses = "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter";
  const sectionTitleClasses = "text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center gap-2 font-inter";

  return (
    <>
      <Navbar title="Material Receipt" breadcrumb={["Engineer", "Logistics", "Material Receipt"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Material Receipt</h1>
            <p className="text-slate-500 text-sm font-inter">Manage material procurement and purchases</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({
                    project_id: projectId,
                    material_name: "",
                    category: "Construction",
                    unit: "Bags",
                    supplier_id: 0,
                    purchase_rate: 0,
                    rate_type: "FIXED",
                    quantity_purchased: 0,
                    payment_given: 0,
                    minimum_stock_level: 0
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
            <button
              onClick={() => {
                if (materials.length > 0) {
                    setSelectedMaterial(materials[0]);
                    setPurchaseData({ quantity: 0, amount_paid: 0, issue_type: "SYSTEM" });
                    setIsPurchaseModalOpen(true);
                } else {
                    toast.error("Please add a material first");
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-emerald-500 text-emerald-600 bg-white rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all active:scale-95 font-inter"
            >
              <ShoppingCart className="w-4 h-4" />
              Record Purchase
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <StatCard
            title="Total Materials"
            value={stats.totalMaterials.toString()}
            sub="Types registered"
            icon={<Package className="w-5 h-5" />}
            accent="text-blue-500"
          />
          <StatCard
            title="Total Purchased Qty"
            value={stats.totalPurchased.toLocaleString()}
            sub="Total units"
            icon={<ShoppingCart className="w-5 h-5" />}
            accent="text-emerald-500"
          />
          <StatCard
            title="Total Amount"
            value={`₹${stats.totalAmount.toLocaleString()}`}
            sub="Gross purchase value"
            icon={<DollarSign className="w-5 h-5" />}
            accent="text-amber-500"
          />
          <StatCard
            title="Payment Pending"
            value={`₹${stats.paymentPending.toLocaleString()}`}
            sub="Outstanding balance"
            icon={<Clock className="w-5 h-5" />}
            accent="text-rose-500"
          />
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Materials Ledger</h3>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Code</th>
                  <th className="px-6 py-4 font-inter">Material Name</th>
                  <th className="px-6 py-4 font-inter">Category</th>
                  <th className="px-6 py-4 font-inter">Unit</th>
                  <th className="px-6 py-4 font-inter">Supplier</th>
                  <th className="px-6 py-4 font-inter text-center">Qty Purchased</th>
                  <th className="px-6 py-4 font-inter text-right">Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Total Amount</th>
                  <th className="px-6 py-4 font-inter text-right text-rose-500">Payment Pending</th>
                  <th className="px-6 py-4 font-inter">Alert</th>
                  <th className="px-6 py-4 font-inter text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin font-inter" />
                    </td>
                  </tr>
                ) : materials.length > 0 ? (
                  materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-inter">{m.material_code}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm font-inter">{m.material_name}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase font-inter">{m.category}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 font-inter">{m.unit}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 font-inter">{m.supplier_name || `SID: ${m.supplier_id}`}</td>
                      <td className="px-6 py-4 text-center font-black text-slate-800 text-sm font-inter">{m.quantity_purchased}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 font-inter">₹{m.purchase_rate}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-sm font-inter">₹{m.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 text-sm font-inter">₹{m.payment_pending?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter ${alertBadge(m.alert_type)}`}>
                          {m.alert_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-inter">
                          <button 
                            onClick={async () => { 
                                try {
                                    const details = await materialService.getMaterial(m.id);
                                    setSelectedMaterial(details); 
                                    setIsDetailModalOpen(true); 
                                } catch (error) {
                                    toast.error("Failed to fetch material details");
                                }
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all font-inter"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                                try {
                                    const details = await materialService.getMaterial(m.id);
                                    setSelectedMaterial(details);
                                    setFormData({
                                        material_name: details.material_name,
                                        category: details.category,
                                        unit: details.unit,
                                        supplier_id: details.supplier_id,
                                        purchase_rate: details.purchase_rate,
                                        rate_type: details.rate_type,
                                        minimum_stock_level: details.minimum_stock_level
                                    });
                                    setIsEditModalOpen(true);
                                } catch (error) {
                                    toast.error("Failed to fetch latest material data");
                                }
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all font-inter"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                                setSelectedMaterial(m);
                                setPurchaseData({ quantity: 0, amount_paid: 0, issue_type: "SYSTEM" });
                                setIsPurchaseModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all font-inter"
                            title="Purchase"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setDeleteId(m.id); setIsDeleteModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all font-inter"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center text-slate-400 font-medium font-inter">No materials found. Add one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Purchase Logs</h3>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Date</th>
                  <th className="px-6 py-4 font-inter">Material</th>
                  <th className="px-6 py-4 font-inter text-center">Qty</th>
                  <th className="px-6 py-4 font-inter text-right">Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Amount</th>
                  <th className="px-6 py-4 font-inter text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm font-inter">MID: {log.material_id}</td>
                      <td className="px-6 py-4 text-center font-black text-slate-800 text-sm font-inter">{log.quantity}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 font-inter">₹{log.rate}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-sm font-inter">₹{log.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-sm font-inter">₹{log.amount_paid?.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium font-inter">No purchase history available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      {/* Modals */}
      {/* Add Material Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Material"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleAddSubmit} className="p-6 space-y-6 font-inter">
          {/* Material Registry Section */}
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <Tag className="w-4 h-4 text-primary" />
              Material Registry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClasses}>Material Name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. UltraTech Cement"
                />
              </div>
              <div>
                <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClasses}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Unit <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={inputClasses}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Supplier & Procurement Section */}
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <Truck className="w-4 h-4 text-amber-500" />
              Supplier & Procurement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Supplier ID <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Purchase Rate <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.purchase_rate}
                  onChange={(e) => setFormData({ ...formData, purchase_rate: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div>
                  <label className={labelClasses}>Rate Type <span className="text-rose-500">*</span></label>
                  <select
                      required
                      value={formData.rate_type}
                      onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                      className={inputClasses}
                  >
                      {RATE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
              </div>
              <div>
                <label className={labelClasses}>Minimum Stock Level <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.minimum_stock_level}
                  onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Initial Stock & Payment Section */}
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Initial Stock & Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Quantity Purchased <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.quantity_purchased}
                  onChange={(e) => setFormData({ ...formData, quantity_purchased: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Payment Given <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.payment_given}
                  onChange={(e) => setFormData({ ...formData, payment_given: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 font-inter">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 font-inter"
            >
              {isSubmitting ? "Processing..." : "Add Material"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Material Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Material"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleEditSubmit} className="p-6 space-y-6 font-inter">
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <Tag className="w-4 h-4 text-primary" />
              General Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClasses}>Material Name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClasses}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Unit <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={inputClasses}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <Truck className="w-4 h-4 text-amber-500" />
              Logistics & Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Supplier ID <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Purchase Rate <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.purchase_rate}
                  onChange={(e) => setFormData({ ...formData, purchase_rate: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Rate Type <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.rate_type}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                  className={inputClasses}
                >
                  {RATE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Minimum Stock Level <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.minimum_stock_level}
                  onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-bold italic-none ml-1 uppercase tracking-widest font-inter flex items-center gap-2">
            <Clock className="w-3 h-3" />
            * Quantity Purchased and Payment Given are historical records and not editable.
          </p>
          
          <div className="flex gap-3 pt-4 font-inter">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 font-inter"
            >
              {isSubmitting ? "Updating..." : "Update Material"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Record Purchase"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handlePurchaseSubmit} className="p-6 space-y-6 font-inter">
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              Purchase Details
            </h3>
            <div className="space-y-4 font-inter">
                <div className="font-inter">
                    <label className={labelClasses}>Select Material <span className="text-rose-500">*</span></label>
                    <select
                        required
                        value={selectedMaterial?.id || ""}
                        onChange={(e) => setSelectedMaterial(materials.find(m => m.id === Number(e.target.value)) || null)}
                        className={inputClasses}
                    >
                        {materials.map(m => <option key={m.id} value={m.id}>{m.material_name} ({m.material_code})</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4 font-inter">
                  <div className="font-inter">
                    <label className={labelClasses}>Quantity <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="number"
                      value={purchaseData.quantity}
                      onChange={(e) => setPurchaseData({ ...purchaseData, quantity: Number(e.target.value) })}
                      className={inputClasses}
                      placeholder="0"
                    />
                  </div>
                  <div className="font-inter">
                    <label className={labelClasses}>Amount Paid <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="number"
                      value={purchaseData.amount_paid}
                      onChange={(e) => setPurchaseData({ ...purchaseData, amount_paid: Number(e.target.value) })}
                      className={inputClasses}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="font-inter">
                    <label className={labelClasses}>Issue Type <span className="text-rose-500">*</span></label>
                    <select
                        required
                        value={purchaseData.issue_type}
                        onChange={(e) => setPurchaseData({ ...purchaseData, issue_type: e.target.value })}
                        className={inputClasses}
                    >
                        {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 font-inter">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-[2] py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-70 font-inter"
            >
              {isSubmitting ? "Processing..." : "Record Purchase"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Material"
        message="Are you sure you want to delete this material?"
        confirmText={isSubmitting ? "Deleting..." : "Delete"}
        type="danger"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Material Insight"
        maxWidth="max-w-xl"
      >
        {selectedMaterial && (
            <div className="p-6 font-inter space-y-8 font-inter">
                <div className="bg-primary rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden font-inter">
                    <div className="relative z-10 font-inter">
                        <div className="flex items-center gap-3 mb-2 font-inter">
                            <h3 className="text-2xl font-black tracking-tight font-inter">{selectedMaterial.material_name}</h3>
                            <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{selectedMaterial.material_code}</span>
                        </div>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4 font-inter">{selectedMaterial.category}</p>
                        <div className="px-4 py-2 bg-white/20 rounded-full inline-block font-inter">
                            <span className="text-xs font-black uppercase tracking-widest font-inter">Supplier: {selectedMaterial.supplier_name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 font-inter">
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Total Purchased</p>
                        <p className="text-xl font-black text-slate-800 font-inter">{selectedMaterial.quantity_purchased} {selectedMaterial.unit}</p>
                    </div>
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Total Used</p>
                        <p className="text-xl font-black text-slate-800 font-inter">{selectedMaterial.quantity_used} {selectedMaterial.unit}</p>
                    </div>
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Remaining Stock</p>
                        <p className="text-xl font-black text-emerald-600 font-inter">{selectedMaterial.remaining_stock} {selectedMaterial.unit}</p>
                    </div>
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Pending Payment</p>
                        <p className="text-xl font-black text-rose-500 font-inter">₹{selectedMaterial.payment_pending?.toLocaleString()}</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 font-inter"
                >
                    Close
                </button>
            </div>
        )}
      </Modal>
    </>
  );
};

export default MaterialReceiptPage;
