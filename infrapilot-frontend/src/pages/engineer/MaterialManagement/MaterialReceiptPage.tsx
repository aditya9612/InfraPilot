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
  CreditCard,
  Search,
  RotateCcw
} from "lucide-react";
import { materialService, type MaterialItem, type MaterialLog, type CreateMaterialRequest, type IssueType, type RateType } from "../../../services/materialService";

const CATEGORIES = ["Construction", "Electrical", "Plumbing", "Finishing", "Other"];
const UNITS = ["Bags", "Kg", "Ton", "Litre", "Nos", "Sqft", "Rft", "Cum"];
const RATE_TYPES = ["FIXED", "VARIABLE"];
const ISSUE_TYPES = ["SYSTEM", "MANUAL"];

const MaterialReceiptPage = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Purchased" | "Amount" | "Pending">("All");

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
    project_id: projectId || 0,
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
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [mList, lList] = await Promise.all([
        materialService.listMaterials(projectId),
        materialService.getLogs({ project_id: projectId || 0, type: "PURCHASE" })
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
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const pId = user?.project_id || user?.user?.project_id;
        if (pId) {
          const finalPId = Number(pId);
          setProjectId(finalPId);
          setFormData((prev: Partial<CreateMaterialRequest>) => ({ ...prev, project_id: finalPId }));
        } else {
          setProjectId(36);
          setFormData((prev: Partial<CreateMaterialRequest>) => ({ ...prev, project_id: 36 }));
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(36);
      }
    }
  }, []);

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
        issue_type: purchaseData.issue_type as IssueType,
        project_id: projectId || 0
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

  const filteredMaterials = useMemo(() => {
    let data = materials;

    // Apply StatCard Filter
    if (activeStatFilter === "Pending") {
      data = data.filter(m => m.payment_pending > 0);
    } else if (activeStatFilter === "Purchased") {
      data = data.filter(m => m.quantity_purchased > 0);
    }

    return data.filter(m => 
      searchTerm === "" || 
      m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.material_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm, activeStatFilter]);

  const alertBadge = (type: string) => {
    switch (type) {
      case "IN_STOCK": return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "LOW_STOCK": return "bg-amber-100 text-amber-600 border-amber-200";
      case "OUT_OF_STOCK": return "bg-rose-100 text-rose-600 border-rose-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary font-inter";
  const sectionClasses = "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter";
  const sectionTitleClasses = "text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2 flex items-center gap-2 font-inter";

  return (
    <>
      <Navbar title="Material Receipt" breadcrumb={["Engineer", "Logistics", "Material Receipt"]} />
      <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter">Material Procurement Ledger</h1>
            <p className="text-slate-500 text-sm italic-none font-inter">Register new materials and track acquisition history.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={() => {
                setFormData({
                    project_id: projectId || 0,
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
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
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
              className="flex items-center gap-2 px-4 py-2 border border-emerald-500 text-emerald-600 bg-white rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all active:scale-95 font-inter shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Record Purchase
            </button>
          </div>
        </div>

        {/* Stats Row with Interactive Filtering */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Materials"
              value={stats.totalMaterials.toString()}
              sub="Types registered"
              icon={<Package className={`w-5 h-5 ${activeStatFilter === "All" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
              accent="text-blue-500"
            />
          </div>
          <div onClick={() => setActiveStatFilter("Purchased")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Purchased" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Purchased"
              value={stats.totalPurchased.toLocaleString()}
              sub="Total units"
              icon={<ShoppingCart className={`w-5 h-5 ${activeStatFilter === "Purchased" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
              accent="text-emerald-500"
            />
          </div>
          <div onClick={() => setActiveStatFilter("Amount")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Amount" ? "ring-2 ring-amber-500 bg-amber-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Amount"
              value={`₹${stats.totalAmount.toLocaleString()}`}
              sub="Gross purchase value"
              icon={<DollarSign className={`w-5 h-5 ${activeStatFilter === "Amount" ? "text-amber-500 scale-110" : "text-slate-400 group-hover:text-amber-500"} transition-all`} />}
              accent="text-amber-500"
            />
          </div>
          <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500 bg-rose-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Payment Pending"
              value={`₹${stats.paymentPending.toLocaleString()}`}
              sub="Outstanding balance"
              icon={<Clock className={`w-5 h-5 ${activeStatFilter === "Pending" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
              accent="text-rose-500"
            />
          </div>
        </div>

        {/* Materials Registry Container */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by material name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
              />
            </div>
            {activeStatFilter !== "All" && (
              <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto font-inter scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left font-inter min-w-[1400px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Identity</th>
                  <th className="px-6 py-4 font-inter">Material Description</th>
                  <th className="px-6 py-4 font-inter">Logistics</th>
                  <th className="px-6 py-4 font-inter">Supplier</th>
                  <th className="px-6 py-4 font-inter text-center">Intensity (Qty)</th>
                  <th className="px-6 py-4 font-inter text-right">Procurement Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Commitment (Total)</th>
                  <th className="px-6 py-4 font-inter text-right text-rose-500">Pending Dues</th>
                  <th className="px-6 py-4 font-inter">Threshold Alert</th>
                  <th className="px-6 py-4 font-inter text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing registry...</p>
                    </td>
                  </tr>
                ) : filteredMaterials.length > 0 ? (
                  filteredMaterials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-inter uppercase tracking-widest">{m.material_code}</span>
                      </td>
                      <td className="px-6 py-4 font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter italic-none">{m.material_name}</span>
                      </td>
                      <td className="px-6 py-4 font-inter">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg uppercase border border-slate-100 font-inter tracking-widest">{m.category}</span>
                      </td>
                      <td className="px-6 py-4 font-inter">
                        <div className="flex flex-col font-inter">
                          <span className="text-xs font-bold text-slate-700 font-inter italic-none truncate max-w-[120px]">{m.supplier_name || `SID-#{m.supplier_id}`}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter italic-none">Vendor</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <div className="flex flex-col font-inter">
                          <span className="text-sm font-black text-slate-800 font-inter italic-none">{m.quantity_purchased.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">{m.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter tabular-nums">₹{m.purchase_rate.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-slate-800 font-inter tabular-nums">₹{m.total_amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-rose-600 font-inter tabular-nums">₹{m.payment_pending?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 font-inter">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${alertBadge(m.alert_type)} font-inter`}>
                          {m.alert_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <div className="flex items-center justify-end gap-2 font-inter">
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
                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                            title="View Intelligence"
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
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all font-inter"
                            title="Modify Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                                setSelectedMaterial(m);
                                setPurchaseData({ quantity: 0, amount_paid: 0, issue_type: "SYSTEM" });
                                setIsPurchaseModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all font-inter"
                            title="Acquisition"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setDeleteId(m.id); setIsDeleteModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                            title="Archive Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">No material resources found in the project vault.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Logs Container */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter italic-none">Historical Purchase Logs</h3>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Log Date</th>
                  <th className="px-6 py-4 font-inter">Resource Description</th>
                  <th className="px-6 py-4 font-inter text-center">Intensity (Qty)</th>
                  <th className="px-6 py-4 font-inter text-right">Procurement Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Commitment (Total)</th>
                  <th className="px-6 py-4 font-inter text-right">Disbursement (Paid)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-inter">
                        <div className="flex flex-col font-inter">
                            <span className="font-bold text-slate-800 text-sm font-inter italic-none">
                                {materials.find(m => m.id === log.material_id)?.material_name || `MID-#{log.material_id}`}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 font-inter tracking-widest uppercase">
                                {materials.find(m => m.id === log.material_id)?.material_code || "Unknown Code"}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-800 text-sm font-inter italic-none">+{log.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter tabular-nums">₹{log.rate.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-slate-800 font-inter tabular-nums">₹{log.total_amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-emerald-600 font-inter tabular-nums">₹{log.amount_paid?.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">No acquisition history recorded for this project.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? "Modify Resource Parameters" : "Register Project Resource"}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex gap-3 px-6 pb-6 font-inter">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="flex-1 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-inter"
            >
              Cancel
            </button>
            <button
              onClick={isEditModalOpen ? handleEditSubmit : handleAddSubmit}
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 font-inter"
            >
              {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Commit Resource")}
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6 font-inter">
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <Tag className="w-4 h-4 text-primary" />
              Intelligence Identifier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div className="md:col-span-2 font-inter">
                <label className={labelClasses}>Descriptive Name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. TMT Steel Bars (12mm)"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Context Category <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClasses}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Standard Unit <span className="text-rose-500">*</span></label>
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
              Procurement Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div className="font-inter">
                <label className={labelClasses}>Supplier Context (ID) <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="0"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Acquisition Rate <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.purchase_rate}
                  onChange={(e) => setFormData({ ...formData, purchase_rate: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="0.00"
                />
              </div>
              <div className="font-inter">
                  <label className={labelClasses}>Rate Protocol <span className="text-rose-500">*</span></label>
                  <select
                      required
                      value={formData.rate_type}
                      onChange={(e) => setFormData({ ...formData, rate_type: e.target.value as RateType })}
                      className={inputClasses}
                  >
                      {RATE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Inventory Floor (Min) <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  value={formData.minimum_stock_level}
                  onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {!isEditModalOpen && (
            <div className={sectionClasses}>
                <h3 className={sectionTitleClasses}>
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Initial Commitment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
                <div className="font-inter">
                    <label className={labelClasses}>Initial Quantity <span className="text-rose-500">*</span></label>
                    <input
                    required
                    type="number"
                    value={formData.quantity_purchased}
                    onChange={(e) => setFormData({ ...formData, quantity_purchased: Number(e.target.value) })}
                    className={inputClasses}
                    placeholder="0"
                    />
                </div>
                <div className="font-inter">
                    <label className={labelClasses}>Initial Disbursement <span className="text-rose-500">*</span></label>
                    <input
                    required
                    type="number"
                    value={formData.payment_given}
                    onChange={(e) => setFormData({ ...formData, payment_given: Number(e.target.value) })}
                    className={inputClasses}
                    placeholder="0.00"
                    />
                </div>
                </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Acquire Resource"
        maxWidth="max-w-xl"
        footer={
          <div className="flex gap-3 px-6 pb-6 font-inter">
            <button
              onClick={() => setIsPurchaseModalOpen(false)}
              className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting || purchaseData.quantity <= 0}
              onClick={handlePurchaseSubmit}
              className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-70 font-inter"
            >
              {isSubmitting ? "Syncing..." : "Confirm Acquisition"}
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6 font-inter">
          <div className={sectionClasses}>
            <h3 className={sectionTitleClasses}>
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              Acquisition Matrix
            </h3>
            <div className="space-y-5 font-inter">
                <div className="font-inter">
                    <label className={labelClasses}>Resource Target <span className="text-rose-500">*</span></label>
                    <select
                        required
                        value={selectedMaterial?.id || ""}
                        onChange={(e) => setSelectedMaterial(materials.find(m => m.id === Number(e.target.value)) || null)}
                        className={inputClasses}
                    >
                        {materials.map(m => <option key={m.id} value={m.id}>{m.material_name} ({m.material_code})</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-5 font-inter">
                  <div className="font-inter">
                    <label className={labelClasses}>Quantity Target <span className="text-rose-500">*</span></label>
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
                    <label className={labelClasses}>Disbursement Amount <span className="text-rose-500">*</span></label>
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
                    <label className={labelClasses}>Protocol Type <span className="text-rose-500">*</span></label>
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
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Resource Intelligence Insight"
        maxWidth="max-w-2xl"
      >
        {selectedMaterial && (
            <div className="p-6 font-inter space-y-8 italic-none">
                <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden font-inter">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="relative z-10 flex items-center gap-8 font-inter">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner group relative font-inter">
                            <Package className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 font-inter">
                            <div className="flex items-center gap-3 mb-2 font-inter">
                                <h3 className="text-2xl font-black tracking-tight uppercase">{selectedMaterial.material_name}</h3>
                                <span className="px-3 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedMaterial.material_code}</span>
                            </div>
                            <div className="bg-white/15 px-4 py-2 rounded-xl border border-white/10 inline-flex items-center gap-3 font-inter">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Category:</span>
                                <span className="text-xs font-black uppercase tracking-widest">{selectedMaterial.category}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 px-2 font-inter">
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Total Acquisition</p>
                        <p className="text-xl font-black text-slate-800 font-inter italic-none">{selectedMaterial.quantity_purchased.toLocaleString()} {selectedMaterial.unit}</p>
                    </div>
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Total Commitment</p>
                        <p className="text-xl font-black text-slate-800 font-inter italic-none">₹{selectedMaterial.total_amount?.toLocaleString()}</p>
                    </div>
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Payment Disbursed</p>
                        <p className="text-xl font-black text-emerald-600 font-inter italic-none">₹{selectedMaterial.payment_given?.toLocaleString()}</p>
                    </div>
                    <div className="font-inter">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Pending Dues</p>
                        <p className="text-xl font-black text-rose-600 font-inter italic-none">₹{selectedMaterial.payment_pending?.toLocaleString()}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full py-5 bg-primary text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl shadow-primary/20 active:scale-95 font-inter italic-none"
                >
                    Dismiss Resource Insight
                </button>
            </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Archive Material Record"
        message="Are you sure you want to discard this material from the project vault? This action will permanently remove all associated audit logs and acquisition history."
        confirmText="Archive Resource"
        type="danger"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default MaterialReceiptPage;
