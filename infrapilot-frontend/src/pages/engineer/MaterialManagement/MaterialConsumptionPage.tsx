import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import {
  Activity,
  Search,
  RotateCcw
  ,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown
} from "lucide-react";
import { materialService, type InventoryItem, type IssueType } from "../../../services/materialService";
import { projectService } from "../../../services/projectService";

const ISSUE_TYPES = [
  "SYSTEM",
  "SITE",
  "DAMAGE",
  "LOSS",
  "VENDOR",
  "TRANSFER",
  "ADJUSTMENT",
  "PURCHASE"
];

const MaterialConsumptionPage = () => {
  const formatINR = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [currentPageInv, setCurrentPageInv] = useState(1);
  const [itemsPerPageInv, setItemsPerPageInv] = useState(10);

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Stock" | "Value">("All");

  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [materialsList, setMaterialsList] = useState<any[]>([]);

  const [usageData, setUsageData] = useState<{ quantity: number | string; project_id: number; issue_type: string }>({
    quantity: "",
    project_id: projectId || 1,
    issue_type: "SITE"
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [invList, realList] = await Promise.all([
        materialService.getInventory(projectId),
        materialService.listMaterials(projectId)
      ]);

      const realIds = new Set((realList || []).map(m => m.id));
      const realNames = new Set((realList || []).map(m => m.material_name.toLowerCase()));

      const filteredInv = (invList || []).filter(item =>
        realNames.has(item.material_name.toLowerCase()) ||
        realIds.has(item.material_id) ||
        realIds.has(item.id)
      );

      setInventory(filteredInv);
      setMaterialsList(realList || []);
    } catch (error) {
      toast.error("Failed to load consumption data");
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
          setUsageData((prev) => ({ ...prev, project_id: finalPId }));
        } else {
          setProjectId(92);
          setUsageData((prev) => ({ ...prev, project_id: 92 }));
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

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    setIsSubmitting(true);
    try {
      const targetMatId = selectedInventory.id ?? selectedInventory.material_id;
      await materialService.recordUsage(targetMatId, {
        quantity: Number(usageData.quantity),
        project_id: Number(usageData.project_id),
        issue_type: usageData.issue_type as IssueType
      });
      toast.success("Material usage recorded!");
      setIsUsageModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to record usage");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalMaterials: inventory.length,
      totalRemaining: inventory.reduce((acc, curr) => acc + (curr.remaining_stock || 0), 0),
      totalValue: inventory.reduce((acc, curr) => acc + (curr.total_value || 0), 0),
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let data = [...inventory];

    // Apply StatCard Filter
    if (activeStatFilter === "Stock") {
      data = data.filter(i => i.remaining_stock > 0);
    }

    data = data.filter(i =>
      searchTerm === "" ||
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.material_id).includes(searchTerm)
    );

    data.sort((a, b) => {
      if (sortOrder === "latest") {
        return Number(b.material_id) - Number(a.material_id);
      } else {
        return Number(a.material_id) - Number(b.material_id);
      }
    });

    return data;
  }, [inventory, searchTerm, activeStatFilter, sortOrder]);

  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPageInv - 1) * itemsPerPageInv;
    return filteredInventory.slice(startIndex, startIndex + itemsPerPageInv);
  }, [filteredInventory, currentPageInv]);



  useEffect(() => {
    setCurrentPageInv(1);
  }, [searchTerm, activeStatFilter, sortOrder]);

  return (
    <>
      <Navbar title="Material Consumption" breadcrumb={["Engineer", "Logistics", "Material Consumption"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Consumption</h1>
            <p className="text-slate-500 text-sm">Track and manage project material usage across site locations.</p>
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
                if (inventory.length > 0) {
                  setSelectedInventory(inventory[0]);
                  setUsageData({ quantity: "", project_id: "" as any, issue_type: "SITE" });
                  setIsUsageModalOpen(true);
                } else {
                  toast.error("No materials available for usage");
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 font-inter"
            >
              <Activity className="w-4 h-4" />
              Usage Material
            </button>
          </div>
        </div>

        {/* Stats with Interactive Filtering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Materials"
              value={stats.totalMaterials.toString()}
              sub="Inventory scope"
              accent="text-blue-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Stock")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Stock" ? "ring-2 ring-orange-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Remaining Stock"
              value={stats.totalRemaining.toLocaleString()}
              sub="Available on site"
              accent="text-orange-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Value")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Value" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Inventory Value"
              value={formatINR(stats.totalValue)}
              sub="Current valuation"
              accent="text-emerald-500" />
          </div>
        </div>

        {/* Consumption Registry Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by material name or ID..."
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

            <div className="relative flex items-center font-inter">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Clock className="w-4 h-4" />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <div className="absolute right-3 text-slate-400 pointer-events-none">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">material_name</th>
                  <th className="px-6 py-4 font-inter text-center text-emerald-600">remaining_stock</th>
                  <th className="px-6 py-4 font-inter">unit</th>
                  <th className="px-6 py-4 font-inter text-right">avg_rate</th>
                  <th className="px-6 py-4 font-inter text-right">total_value</th>
                  <th className="px-6 py-4 font-inter text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin font-inter mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing inventory...</p>
                    </td>
                  </tr>
                ) : paginatedInventory.length > 0 ? (
                  paginatedInventory.map((inv) => (
                    <tr key={inv.material_id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter">
                        <div className="flex flex-col font-inter">
                          <span className="text-sm font-bold text-slate-800 font-inter">{inv.material_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className={`text-sm font-bold font-inter ${inv.remaining_stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {inv.remaining_stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter uppercase tracking-widest">{inv.unit}</td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter">{formatINR(inv.avg_rate)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{formatINR(inv.total_value)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <button
                          onClick={() => {
                            setSelectedInventory(inv);
                            setUsageData({ quantity: "", project_id: "" as any, issue_type: "SITE" });
                            setIsUsageModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-50 text-slate-600 hover:text-white hover:bg-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 hover:border-rose-500 font-inter active:scale-95"
                        >
                          Usage Material
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                      No matching materials found in the inventory vault.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inventory Pagination */}
          {filteredInventory.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
              {/* Left: Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                <select
                  value={itemsPerPageInv}
                  onChange={(e) => { setItemsPerPageInv(Number(e.target.value)); setCurrentPageInv(1); }}
                  className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Center: Showing info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {(currentPageInv - 1) * itemsPerPageInv + 1} - {Math.min(currentPageInv * itemsPerPageInv, filteredInventory.length)} of {filteredInventory.length} records
              </div>

              {/* Right: Pagination */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPageInv(prev => Math.max(1, prev - 1))}
                  disabled={currentPageInv === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const totalItems = filteredInventory.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPageInv));
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPageInv <= 3) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (currentPageInv >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPageInv - 1, currentPageInv, currentPageInv + 1, '...', totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                    }
                    const pageNum = page as number;
                    const isActive = currentPageInv === pageNum;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPageInv(pageNum)}
                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                            ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}

                <button
                  onClick={() => setCurrentPageInv(prev => Math.min(Math.ceil(filteredInventory.length / itemsPerPageInv), prev + 1))}
                  disabled={currentPageInv === Math.max(1, Math.ceil(filteredInventory.length / itemsPerPageInv)) || filteredInventory.length === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </PageTransition>

      {/* Record Usage Modal */}
      <Modal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        title="Material Usage"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3 px-6 pb-6 font-inter">
            <button
              onClick={() => setIsUsageModalOpen(false)}
              className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleUsageSubmit}
              className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              {isSubmitting ? "SYNCING..." : "ADD USAGE"}
            </button>
          </div>
        }
      >
        <form id="usage-material-form" onSubmit={handleUsageSubmit} className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
              Disbursement Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="font-inter md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Project <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={usageData.project_id}
                  onChange={(e) => setUsageData({ ...usageData, project_id: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-primary/20 focus:border-primary font-inter"
                >
                  <option value="">Select Project</option>
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="font-inter md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Material <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={selectedInventory?.material_id || ""}
                  onChange={(e) => {
                    const targetId = Number(e.target.value);
                    const matchedInv = inventory.find(inv => inv.material_id === targetId || inv.id === targetId);
                    if (matchedInv) {
                      setSelectedInventory(matchedInv);
                    } else {
                      const matchedMat = materialsList.find(m => m.id === targetId);
                      setSelectedInventory({
                        id: targetId,
                        material_id: targetId,
                        material_name: matchedMat?.material_name || "",
                        remaining_stock: 0,
                        unit: matchedMat?.unit || "Bags",
                        avg_rate: matchedMat?.purchase_rate || 0,
                        total_value: 0
                      } as InventoryItem);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-primary/20 focus:border-primary font-inter"
                >
                  <option value="">Select Material</option>
                  {materialsList.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.material_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="font-inter">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Quantity <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  value={usageData.quantity}
                  onChange={(e) => setUsageData({ ...usageData, quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-primary/20 focus:border-primary font-inter"
                  placeholder="30"
                />
              </div>
              <div className="font-inter">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Issue Type <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={usageData.issue_type}
                  onChange={(e) => setUsageData({ ...usageData, issue_type: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-primary/20 focus:border-primary font-inter"
                >
                  {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MaterialConsumptionPage;
