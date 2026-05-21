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
  ChevronRight
} from "lucide-react";
import { materialService, type InventoryItem, type MaterialLog, type IssueType } from "../../../services/materialService";

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [currentPageInv, setCurrentPageInv] = useState(1);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const itemsPerPageInv = 10;
  const itemsPerPageLogs = 10;

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
      const [invList, lList, realList] = await Promise.all([
        materialService.getInventory(projectId),
        materialService.getLogs({ project_id: projectId || 0, type: "USAGE" }),
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
      setLogs(lList || []);
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
    let data = inventory;

    // Apply StatCard Filter
    if (activeStatFilter === "Stock") {
      data = data.filter(i => i.remaining_stock > 0);
    }

    return data.filter(i =>
      searchTerm === "" ||
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.material_id).includes(searchTerm)
    );
  }, [inventory, searchTerm, activeStatFilter]);

  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPageInv - 1) * itemsPerPageInv;
    return filteredInventory.slice(startIndex, startIndex + itemsPerPageInv);
  }, [filteredInventory, currentPageInv]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPageLogs - 1) * itemsPerPageLogs;
    return logs.slice(startIndex, startIndex + itemsPerPageLogs);
  }, [logs, currentPageLogs]);

  useEffect(() => {
    setCurrentPageInv(1);
  }, [searchTerm, activeStatFilter]);

  return (
    <>
      <Navbar title="Material Consumption" breadcrumb={["Engineer", "Logistics", "Material Consumption"]} />
      <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Consumption Ledger</h1>
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
                  setUsageData({ quantity: "", project_id: projectId || 1, issue_type: "SITE" });
                  setIsUsageModalOpen(true);
                } else {
                  toast.error("No materials available for usage");
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 font-inter"
            >
              <Activity className="w-4 h-4" />
              Log Usage
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
              value={`₹${stats.totalValue.toLocaleString()}`}
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
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Material Identity</th>
                  <th className="px-6 py-4 font-inter text-center text-emerald-600">Inventory Status</th>
                  <th className="px-6 py-4 font-inter">Unit</th>
                  <th className="px-6 py-4 font-inter text-right">Valuation Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Holding Value</th>
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
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">MID-#{inv.material_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className={`text-sm font-bold font-inter ${inv.remaining_stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {inv.remaining_stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter uppercase tracking-widest">{inv.unit}</td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter">₹{inv.avg_rate?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">₹{inv.total_value?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <button
                          onClick={() => {
                            setSelectedInventory(inv);
                            setUsageData({ quantity: "", project_id: projectId || 1, issue_type: "SITE" });
                            setIsUsageModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-50 text-slate-600 hover:text-white hover:bg-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 hover:border-rose-500 font-inter active:scale-95"
                        >
                          Use Material
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
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-end font-inter">
            <div className="flex items-center gap-2 font-inter">
              <button
                onClick={() => setCurrentPageInv(prev => Math.max(prev - 1, 1))}
                disabled={currentPageInv === 1}
                className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                Page {currentPageInv} of 20
              </div>
              <button
                onClick={() => setCurrentPageInv(prev => Math.min(prev + 1, 20))}
                disabled={currentPageInv === 20}
                className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Usage Logs Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white font-inter">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-inter">Material Audit Logs (Usage)</h3>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Audit Date</th>
                  <th className="px-6 py-4 font-inter">Resource Description</th>
                  <th className="px-6 py-4 font-inter text-center">Intensity (Qty)</th>
                  <th className="px-6 py-4 font-inter">Disbursement Type</th>
                  <th className="px-6 py-4 font-inter">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-inter">
                        <span className="font-bold text-slate-700 text-sm font-inter uppercase">
                          {inventory.find(inv => inv.material_id === log.material_id)?.material_name || `MID: ${log.material_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-rose-500 text-sm font-inter">-{log.quantity}</td>
                      <td className="px-6 py-4 font-inter">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-slate-200 font-inter">{log.issue_type}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 font-inter">Project Audit-#{log.project_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">No historical usage records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Logs Pagination */}
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-end font-inter">
            <div className="flex items-center gap-2 font-inter">
              <button
                onClick={() => setCurrentPageLogs(prev => Math.max(prev - 1, 1))}
                disabled={currentPageLogs === 1}
                className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                Page {currentPageLogs} of 20
              </div>
              <button
                onClick={() => setCurrentPageLogs(prev => Math.min(prev + 1, 20))}
                disabled={currentPageLogs === 20}
                className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Record Usage Modal */}
      <Modal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        title="Disburse Project Material"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-3 px-6 pb-6 font-inter">
            <button
              onClick={() => setIsUsageModalOpen(false)}
              className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleUsageSubmit}
              className="flex-[2] py-3 bg-rose-500 text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              {isSubmitting ? "Syncing..." : "Confirm Disbursement"}
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-5 font-inter">
          <div className="font-inter">
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
            >
              <option value="">Select Material</option>
              {materialsList.map(mat => (
                <option key={mat.id} value={mat.id}>
                  {mat.material_name} (ID: {mat.id})
                </option>
              ))}
            </select>
          </div>
          <div className="font-inter">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">quantity <span className="text-rose-500">*</span></label>
            <input
              required
              type="number"
              value={usageData.quantity}
              onChange={(e) => setUsageData({ ...usageData, quantity: e.target.value === "" ? "" : Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
              placeholder="30"
            />
          </div>
          <div className="font-inter">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">project_id <span className="text-rose-500">*</span></label>
            <input
              required
              type="number"
              value={usageData.project_id}
              onChange={(e) => setUsageData({ ...usageData, project_id: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
              placeholder="1"
            />
          </div>
          <div className="font-inter">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">issue_type <span className="text-rose-500">*</span></label>
            <select
              required
              value={usageData.issue_type}
              onChange={(e) => setUsageData({ ...usageData, issue_type: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
            >
              {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MaterialConsumptionPage;
