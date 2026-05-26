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
  Eye,
  Edit2,
  Trash2,
  Search,
  RotateCcw
  ,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { materialService, type MaterialItem, type CreateMaterialRequest, type IssueType, type RateType, type Supplier } from "../../../services/materialService";
import { projectService } from "../../../services/projectService";

const CATEGORIES = ["Construction", "Electrical", "Plumbing", "Finishing", "Other"];
const UNITS = ["Bags", "Kg", "Ton", "Litre", "Nos", "Sqft", "Rft", "Cum"];
const RATE_TYPES = ["FIXED", "VARIABLE"];
const ISSUE_TYPES = ["SYSTEM", "SITE", "DAMAGE", "LOSS", "VENDOR", "TRANSFER", "ADJUSTMENT", "PURCHASE"];

const MaterialReceiptPage = () => {
  const formatINR = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    rate: 0,
    amount_paid: 0,
    project_id: projectId || 1,
    issue_type: "SYSTEM"
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      // Fetch suppliers
      let sList: Supplier[] = [];
      try {
        sList = await materialService.getSuppliers();
      } catch (err) {
        console.warn("Failed to load suppliers", err);
      }

      // If no suppliers exist, automatically register a default supplier to prevent creation failures
      if (!sList || sList.length === 0) {
        try {
          const defaultSup = await materialService.createSupplier({
            name: "Aman patil",
            contact: "9876543210",
            address: "Main Construction Yard"
          });
          sList = [defaultSup];
        } catch (createErr) {
          console.warn("Failed to create default supplier", createErr);
        }
      }
      setSuppliers(sList || []);

      const mList = await materialService.listMaterials(projectId);
      setMaterials(mList || []);
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
          setPurchaseData((prev) => ({ ...prev, project_id: finalPId }));
        } else {
          setProjectId(92);
          setFormData((prev: Partial<CreateMaterialRequest>) => ({ ...prev, project_id: 92 }));
          setPurchaseData((prev) => ({ ...prev, project_id: 92 }));
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(92);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectService.getProjects(100, 0);
        const list = Array.isArray(res) ? res : (res.items || res.data || []);
        setProjectsList(list);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newMaterial = await materialService.createMaterial(formData as CreateMaterialRequest);
      toast.success("Material added successfully!");
      setIsAddModalOpen(false);
      // Immediately push to state so it shows up in the list even before fetch completes
      setMaterials(prev => [newMaterial, ...prev]);
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

  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMaterials, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeStatFilter]);

  const alertBadge = (type: string) => {
    switch (type) {
      case "IN_STOCK": return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "LOW_STOCK": return "bg-amber-100 text-amber-600 border-amber-200";
      case "OUT_OF_STOCK": return "bg-rose-100 text-rose-600 border-rose-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary";

  return (
    <>
      <Navbar title="Material Receipt" breadcrumb={["Engineer", "Logistics", "Material Receipt"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Material Procurement Ledger</h1>
            <p className="text-slate-500 text-sm font-inter">Register new materials and track acquisition history.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={fetchData}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
              title="Sync Ledger"
            >
              <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setFormData({
                  project_id: "" as any,
                  material_name: "",
                  category: "Construction",
                  unit: "Bags",
                  supplier_id: suppliers.length > 0 ? suppliers[0].id : 0,
                  purchase_rate: 0,
                  rate_type: "FIXED",
                  quantity_purchased: 0,
                  payment_given: 0,
                  minimum_stock_level: 0
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
            <button
              onClick={() => {
                if (materials.length > 0) {
                  setSelectedMaterial(null);
                  setPurchaseData({ quantity: 0, rate: materials[0].purchase_rate || 0, amount_paid: 0, project_id: "" as any, issue_type: "SYSTEM" });
                  setIsPurchaseModalOpen(true);
                } else {
                  toast.error("Please add a material first");
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-emerald-500 text-emerald-600 bg-white rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all active:scale-95 font-inter shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Record Purchase
            </button>
          </div>
        </div>

        {/* Stats Row with Interactive Filtering */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Materials"
              value={stats.totalMaterials.toString()}
              sub="Types registered"
              accent="text-blue-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Purchased")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Purchased" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Purchased"
              value={stats.totalPurchased.toLocaleString()}
              sub="Total units"
              accent="text-emerald-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Amount")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Amount" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Amount"
              value={formatINR(stats.totalAmount)}
              sub="Gross purchase value"
              accent="text-amber-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Payment Pending"
              value={formatINR(stats.paymentPending)}
              sub="Outstanding balance"
              accent="text-rose-500" />
          </div>
        </div>

        {/* Materials Registry Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by material name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
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
                  <th className="px-6 py-4 font-inter">material_name</th>
                  <th className="px-6 py-4 font-inter">category</th>
                  <th className="px-6 py-4 font-inter">unit</th>
                  <th className="px-6 py-4 font-inter">supplier_name</th>
                  <th className="px-6 py-4 font-inter text-right">purchase_rate</th>
                  <th className="px-6 py-4 font-inter">rate_type</th>
                  <th className="px-6 py-4 font-inter text-center">quantity_purchased</th>
                  <th className="px-6 py-4 font-inter text-center">quantity_used</th>
                  <th className="px-6 py-4 font-inter text-center">remaining_stock</th>
                  <th className="px-6 py-4 font-inter text-right">total_amount</th>
                  <th className="px-6 py-4 font-inter text-right">payment_given</th>
                  <th className="px-6 py-4 font-inter text-right">payment_pending</th>
                  <th className="px-6 py-4 font-inter text-right">extra_paid</th>
                  <th className="px-6 py-4 font-inter text-center">minimum_stock_level</th>
                  <th className="px-6 py-4 font-inter text-center">alert_type</th>
                  <th className="px-6 py-4 font-inter text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={16} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing registry...</p>
                    </td>
                  </tr>
                ) : paginatedMaterials.length > 0 ? (
                  paginatedMaterials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter"><span className="text-sm font-bold text-slate-800 font-inter">{m.material_name}</span></td>
                      <td className="px-6 py-4 font-inter"><span className="text-sm font-bold text-slate-800 font-inter">{m.category}</span></td>
                      <td className="px-6 py-4 font-inter"><span className="text-sm font-bold text-slate-800 font-inter">{m.unit}</span></td>
                      <td className="px-6 py-4 font-inter"><span className="text-sm font-bold text-slate-800 font-inter">{m.supplier_name}</span></td>
                      <td className="px-6 py-4 font-inter text-right"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{formatINR(m.purchase_rate)}</span></td>
                      <td className="px-6 py-4 font-inter"><span className="text-sm font-bold text-slate-800 font-inter">{m.rate_type}</span></td>
                      <td className="px-6 py-4 font-inter text-center"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{m.quantity_purchased}</span></td>
                      <td className="px-6 py-4 font-inter text-center"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{m.quantity_used}</span></td>
                      <td className="px-6 py-4 font-inter text-center"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{m.remaining_stock}</span></td>
                      <td className="px-6 py-4 font-inter text-right"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{formatINR(m.total_amount)}</span></td>
                      <td className="px-6 py-4 font-inter text-right"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{formatINR(m.payment_given)}</span></td>
                      <td className="px-6 py-4 font-inter text-right"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{formatINR(m.payment_pending)}</span></td>
                      <td className="px-6 py-4 font-inter text-right"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{formatINR(m.extra_paid)}</span></td>
                      <td className="px-6 py-4 font-inter text-center"><span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{m.minimum_stock_level}</span></td>
                      <td className="px-6 py-4 font-inter text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${
                          m.alert_type === 'IN_STOCK'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : m.alert_type === 'LOW_STOCK'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {m.alert_type?.replace(/_/g, ' ')}
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
                              setPurchaseData({ quantity: 0, rate: m.purchase_rate || 0, amount_paid: 0, project_id: "" as any, issue_type: "SYSTEM" });
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
                    <td colSpan={16} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">No material resources found in the project vault.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white sticky left-0 font-inter">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              PAGE {currentPage} OF {Math.max(1, Math.ceil(filteredMaterials.length / itemsPerPage))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(filteredMaterials.length / itemsPerPage)), prev + 1))}
                disabled={currentPage === Math.max(1, Math.ceil(filteredMaterials.length / itemsPerPage))}
                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </PageTransition>

      {/* Add / Edit Modal */}
      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Project Resource"
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isSubmitting ? "Syncing..." : "Commit Resources"}
            </button>
          </>
        }
      >
        <form id="add-material-form" onSubmit={handleAddSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter">
                <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.project_id || ""}
                  onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                  className={inputClasses}
                >
                  <option value="">Select Project</option>
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Material Name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. Cement"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClasses}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Unit <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.unit || ""}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={inputClasses}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Procurement Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Procurement Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter md:col-span-2">
                <label className={labelClasses}>Supplier <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.supplier_id || ""}
                  onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                  className={inputClasses}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => {
                    const supId = s.id ?? (s as any).supplier_id;
                    const supName = typeof s === "string" ? s : (s.name || (s as any).supplier_name || `Supplier #${supId}`);
                    return (
                      <option key={supId} value={supId}>{supName}</option>
                    );
                  })}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Purchase Rate <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={formData.purchase_rate || ""}
                  onChange={(e) => setFormData({ ...formData, purchase_rate: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="355"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Rate Type <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.rate_type || ""}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value as RateType })}
                  className={inputClasses}
                >
                  {RATE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="font-inter md:col-span-2">
                <label className={labelClasses}>Quantity Purchased <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={formData.quantity_purchased || ""}
                  onChange={(e) => setFormData({ ...formData, quantity_purchased: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="200"
                />
              </div>
            </div>
          </div>

          {/* Financial & Stock Config */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Financial & Stock Config
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter">
                <label className={labelClasses}>Payment Given <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={formData.payment_given || ""}
                  onChange={(e) => setFormData({ ...formData, payment_given: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="71000"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Minimum Stock Level <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={formData.minimum_stock_level || ""}
                  onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="200"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Material"
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isSubmitting ? "Updating..." : "Update Material"}
            </button>
          </>
        }
      >
        <form id="edit-material-form" onSubmit={handleEditSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter">
                <label className={labelClasses}>material_name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. Cement"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>category <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClasses}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>unit <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.unit || ""}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={inputClasses}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Procurement Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Procurement Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter md:col-span-2">
                <label className={labelClasses}>supplier_id <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.supplier_id || ""}
                  onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                  className={inputClasses}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => {
                    const supId = s.id ?? (s as any).supplier_id;
                    const supName = typeof s === "string" ? s : (s.name || (s as any).supplier_name || `Supplier #${supId}`);
                    return (
                      <option key={supId} value={supId}>{supName}</option>
                    );
                  })}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>purchase_rate <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={formData.purchase_rate || ""}
                  onChange={(e) => setFormData({ ...formData, purchase_rate: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="355"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>rate_type <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={formData.rate_type || ""}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value as RateType })}
                  className={inputClasses}
                >
                  {RATE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Stock Config */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Stock Config
            </h3>
            <div className="font-inter">
              <label className={labelClasses}>minimum_stock_level <span className="text-rose-500">*</span></label>
              <input
                required
                type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                value={formData.minimum_stock_level || ""}
                onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })}
                className={inputClasses}
                placeholder="200"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Purchase Material"
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handlePurchaseSubmit}
              className={`px-8 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isSubmitting ? "Processing..." : "Add Purchase"}
            </button>
          </>
        }
      >
        <form id="purchase-material-form" onSubmit={handlePurchaseSubmit} className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Purchase Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter md:col-span-2">
                <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={purchaseData.project_id || ""}
                  onChange={(e) => setPurchaseData({ ...purchaseData, project_id: Number(e.target.value) })}
                  className={inputClasses}
                >
                  <option value="">Select Project</option>
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="font-inter md:col-span-2">
                <label className={labelClasses}>Material <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={selectedMaterial?.id || ""}
                  onChange={(e) => {
                    const newMaterial = materials.find(m => m.id === Number(e.target.value)) || null;
                    setSelectedMaterial(newMaterial);
                    if (newMaterial) {
                      setPurchaseData(prev => ({ ...prev, rate: newMaterial.purchase_rate || 0 }));
                    }
                  }}
                  className={inputClasses}
                >
                  <option value="">Select Material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.material_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Quantity <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={purchaseData.quantity || ""}
                  onChange={(e) => setPurchaseData({ ...purchaseData, quantity: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="70"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Rate <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={purchaseData.rate || ""}
                  onChange={(e) => setPurchaseData({ ...purchaseData, rate: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="355"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Amount Paid <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={purchaseData.amount_paid || ""}
                  onChange={(e) => setPurchaseData({ ...purchaseData, amount_paid: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="21000"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Issue Type <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={purchaseData.issue_type}
                  onChange={(e) => setPurchaseData({ ...purchaseData, issue_type: e.target.value as IssueType })}
                  className={inputClasses}
                >
                  {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Material Details"
        maxWidth="max-w-2xl"
      >
        {selectedMaterial && (
          <div className="p-6 font-inter space-y-6">
            {/* Header */}
            <div className="bg-primary rounded-2xl p-6 text-white shadow-xl relative overflow-hidden font-inter">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="relative z-10 flex items-center gap-5 font-inter">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 font-inter">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="font-inter">
                  <h3 className="text-xl font-bold tracking-tight uppercase font-inter">{selectedMaterial.material_name}</h3>
                  <span className="text-xs text-white/70 font-inter">{selectedMaterial.category} &bull; {selectedMaterial.unit}</span>
                </div>
                <div className="ml-auto font-inter">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border font-inter ${
                    selectedMaterial.alert_type === 'IN_STOCK'
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                      : selectedMaterial.alert_type === 'LOW_STOCK'
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      : 'bg-white/10 text-white/70 border-white/20'
                  }`}>
                    {selectedMaterial.alert_type?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* All Fields Grid */}
            <div className="grid grid-cols-2 gap-4 font-inter">
              {/* Supplier */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">supplier_name</p>
                <p className="text-sm font-bold text-slate-800 font-inter">{selectedMaterial.supplier_name || '—'}</p>
              </div>
              {/* Rate Type */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">rate_type</p>
                <p className="text-sm font-bold text-slate-800 font-inter">{selectedMaterial.rate_type}</p>
              </div>
              {/* Purchase Rate */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">purchase_rate</p>
                <p className="text-sm font-bold text-slate-800 tabular-nums font-inter">{formatINR(selectedMaterial.purchase_rate)}</p>
              </div>
              {/* Minimum Stock Level */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">minimum_stock_level</p>
                <p className="text-sm font-bold text-slate-800 tabular-nums font-inter">{selectedMaterial.minimum_stock_level}</p>
              </div>
              {/* Quantity Purchased */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">quantity_purchased</p>
                <p className="text-sm font-bold text-slate-800 tabular-nums font-inter">{selectedMaterial.quantity_purchased}</p>
              </div>
              {/* Quantity Used */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">quantity_used</p>
                <p className="text-sm font-bold text-slate-800 tabular-nums font-inter">{selectedMaterial.quantity_used}</p>
              </div>
              {/* Remaining Stock */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">remaining_stock</p>
                <p className="text-lg font-bold text-slate-800 tabular-nums font-inter">{selectedMaterial.remaining_stock} <span className="text-sm text-slate-400">{selectedMaterial.unit}</span></p>
              </div>
              {/* Total Amount */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">total_amount</p>
                <p className="text-sm font-bold text-slate-800 tabular-nums font-inter">{formatINR(selectedMaterial.total_amount)}</p>
              </div>
              {/* Payment Given */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">payment_given</p>
                <p className="text-sm font-bold text-emerald-600 tabular-nums font-inter">{formatINR(selectedMaterial.payment_given)}</p>
              </div>
              {/* Payment Pending */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">payment_pending</p>
                <p className="text-sm font-bold text-rose-600 tabular-nums font-inter">{formatINR(selectedMaterial.payment_pending)}</p>
              </div>
              {/* Extra Paid */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-inter">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">extra_paid</p>
                <p className="text-sm font-bold text-slate-800 tabular-nums font-inter">{formatINR(selectedMaterial.extra_paid)}</p>
              </div>
            </div>

            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full py-3 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95 font-inter"
            >
              Close
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
