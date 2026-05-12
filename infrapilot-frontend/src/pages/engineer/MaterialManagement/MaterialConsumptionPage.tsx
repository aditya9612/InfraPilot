import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import { 
  Package, 
  Activity, 
  Database,
  ClipboardCheck,
  Search,
  RotateCcw
} from "lucide-react";
import { materialService, type InventoryItem, type MaterialLog, type IssueType } from "../../../services/materialService";

const ISSUE_TYPES = ["SITE", "STORE"];

const MaterialConsumptionPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Stock" | "Value">("All");

  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  
  const [usageData, setUsageData] = useState({
    quantity: 0,
    issue_type: "SITE"
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [invList, lList] = await Promise.all([
        materialService.getInventory(),
        materialService.getLogs({ project_id: projectId || 0, type: "USAGE" })
      ]);
      setInventory(invList || []);
      setLogs(lList || []);
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
          setProjectId(Number(pId));
        } else {
          setProjectId(36);
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

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    setIsSubmitting(true);
    try {
      await materialService.recordUsage(selectedInventory.id, {
        ...usageData,
        issue_type: usageData.issue_type as IssueType,
        project_id: projectId || 0
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

  return (
    <>
      <Navbar title="Material Consumption" breadcrumb={["Engineer", "Logistics", "Material Consumption"]} />
      <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Material Consumption Ledger</h1>
            <p className="text-slate-500 text-sm italic-none">Track and manage project material usage across site locations.</p>
          </div>
          <button
            onClick={() => {
              if (inventory.length > 0) {
                setSelectedInventory(inventory[0]);
                setUsageData({ quantity: 0, issue_type: "SITE" });
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

        {/* Stats with Interactive Filtering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Materials"
              value={stats.totalMaterials.toString()}
              sub="Inventory scope"
              icon={<Package className={`w-5 h-5 ${activeStatFilter === "All" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
              accent="text-blue-500"
            />
          </div>
          <div onClick={() => setActiveStatFilter("Stock")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Stock" ? "ring-2 ring-orange-500 bg-orange-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Remaining Stock"
              value={stats.totalRemaining.toLocaleString()}
              sub="Available on site"
              icon={<Database className={`w-5 h-5 ${activeStatFilter === "Stock" ? "text-orange-500 scale-110" : "text-slate-400 group-hover:text-orange-500"} transition-all`} />}
              accent="text-orange-500"
            />
          </div>
          <div onClick={() => setActiveStatFilter("Value")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Value" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Inventory Value"
              value={`₹${stats.totalValue.toLocaleString()}`}
              sub="Current valuation"
              icon={<Activity className={`w-5 h-5 ${activeStatFilter === "Value" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
              accent="text-emerald-500"
            />
          </div>
        </div>

        {/* Consumption Registry Container */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by material name or ID..."
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
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing inventory...</p>
                    </td>
                  </tr>
                ) : filteredInventory.length > 0 ? (
                  filteredInventory.map((inv) => (
                    <tr key={inv.material_id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter">
                        <div className="flex flex-col font-inter">
                          <span className="text-sm font-bold text-slate-800 font-inter">{inv.material_name}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">MID-#{inv.material_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className={`text-sm font-black font-inter ${inv.remaining_stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {inv.remaining_stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter uppercase tracking-widest">{inv.unit}</td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter">₹{inv.avg_rate?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-slate-800 font-inter">₹{inv.total_value?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <button 
                          onClick={() => {
                            setSelectedInventory(inv);
                            setUsageData({ quantity: 0, issue_type: "SITE" });
                            setIsUsageModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-50 text-slate-600 hover:text-white hover:bg-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-rose-500 font-inter active:scale-95"
                        >
                          Use Material
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">
                      No matching materials found in the inventory vault.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage Logs Container */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter italic-none">Material Audit Logs (Usage)</h3>
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
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-inter">
                        <span className="font-bold text-slate-700 text-sm font-inter uppercase italic-none">
                            {inventory.find(inv => inv.material_id === log.material_id)?.material_name || `MID: ${log.material_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-rose-500 text-sm font-inter italic-none">-{log.quantity}</td>
                      <td className="px-6 py-4 font-inter">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 font-inter">{log.issue_type}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 font-inter italic-none">Project Audit-#{log.project_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">No historical usage records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
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
              disabled={isSubmitting || usageData.quantity <= 0 || usageData.quantity > (selectedInventory?.remaining_stock || 0)}
              onClick={handleUsageSubmit}
              className="flex-[2] py-3 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              {isSubmitting ? "Syncing..." : "Confirm Disbursement"}
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6 font-inter">
          <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-4 font-inter">
              <div className="p-2 bg-white rounded-xl shadow-sm font-inter">
                  <ClipboardCheck className="w-5 h-5 text-rose-500 font-inter" />
              </div>
              <div className="font-inter">
                  <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1 font-inter">Audit Context</p>
                  <p className="text-xs font-black text-rose-600 font-inter italic-none">{selectedInventory?.material_name}</p>
                  <p className="text-[10px] text-rose-500 font-bold font-inter italic-none mt-1">Vault Balance: {selectedInventory?.remaining_stock} {selectedInventory?.unit}</p>
              </div>
          </div>
          
          <div className="space-y-5 font-inter">
            <div className="font-inter">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Resource Selection *</label>
                <select
                    required
                    value={selectedInventory?.material_id || ""}
                    onChange={(e) => setSelectedInventory(inventory.find(inv => inv.material_id === Number(e.target.value)) || null)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
                >
                    {inventory.map(inv => <option key={inv.material_id} value={inv.material_id}>{inv.material_name} (Bal: {inv.remaining_stock})</option>)}
                </select>
            </div>
            <div className="font-inter">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Disbursement Quantity *</label>
              <input
                required
                type="number"
                max={selectedInventory?.remaining_stock}
                value={usageData.quantity}
                onChange={(e) => setUsageData({ ...usageData, quantity: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
                placeholder="0"
              />
              <p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 ml-1 tracking-widest font-inter italic-none">Limit: {selectedInventory?.remaining_stock} {selectedInventory?.unit}</p>
            </div>
            <div className="font-inter">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Logistics Channel *</label>
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
        </div>
      </Modal>
    </>
  );
};

export default MaterialConsumptionPage;
