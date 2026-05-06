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
  ArrowUpRight,
  ClipboardCheck
} from "lucide-react";
import { materialService, type MaterialItem, type MaterialLog } from "../../../services/materialService";

const ISSUE_TYPES = ["SITE", "STORE"];

const MaterialConsumptionPage = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const projectId = 1;

  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  
  const [usageData, setUsageData] = useState({
    quantity: 0,
    issue_type: "SITE"
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mList, lList] = await Promise.all([
        materialService.listMaterials(projectId),
        materialService.getLogs({ project_id: projectId, type: "USAGE" })
      ]);
      setMaterials(mList);
      setLogs(lList);
    } catch (error) {
      toast.error("Failed to load consumption data");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setIsSubmitting(true);
    try {
      await materialService.recordUsage(selectedMaterial.id, {
        ...usageData,
        project_id: projectId
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
      totalMaterials: materials.length,
      totalUsed: materials.reduce((acc, curr) => acc + (curr.quantity_used || 0), 0),
      totalRemaining: materials.reduce((acc, curr) => acc + (curr.remaining_stock || 0), 0),
    };
  }, [materials]);

  const alertBadge = (type: string) => {
    switch (type) {
      case "IN_STOCK": return "bg-emerald-100 text-emerald-600";
      case "LOW_STOCK": return "bg-red-100 text-red-600";
      case "OUT_OF_STOCK": return "bg-red-100 text-red-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      <Navbar title="Material Consumption" breadcrumb={["Engineer", "Logistics", "Material Consumption"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Material Consumption</h1>
            <p className="text-slate-500 text-sm font-inter">Track material usage on site</p>
          </div>
          <button
            onClick={() => {
              if (materials.length > 0) {
                setSelectedMaterial(materials[0]);
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-inter">
          <StatCard
            title="Total Materials"
            value={stats.totalMaterials.toString()}
            sub="Inventory scope"
            icon={<Package className="w-5 h-5" />}
            accent="text-blue-500"
          />
          <StatCard
            title="Total Used Qty"
            value={stats.totalUsed.toLocaleString()}
            sub="Total consumption"
            icon={<Activity className="w-5 h-5" />}
            accent="text-orange-500"
          />
          <StatCard
            title="Remaining Stock"
            value={stats.totalRemaining.toLocaleString()}
            sub="Available on site"
            icon={<Database className="w-5 h-5" />}
            accent="text-emerald-500"
          />
        </div>

        {/* Consumption Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Consumption Tracking</h3>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Code</th>
                  <th className="px-6 py-4 font-inter">Material Name</th>
                  <th className="px-6 py-4 font-inter">Unit</th>
                  <th className="px-6 py-4 font-inter text-center">Qty Purchased</th>
                  <th className="px-6 py-4 font-inter text-center">Qty Used</th>
                  <th className="px-6 py-4 font-inter text-center text-emerald-600">Remaining</th>
                  <th className="px-6 py-4 font-inter text-center">Min Level</th>
                  <th className="px-6 py-4 font-inter">Alert</th>
                  <th className="px-6 py-4 font-inter text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center">
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
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 font-inter">{m.unit}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600 font-inter">{m.quantity_purchased}</td>
                      <td className="px-6 py-4 text-center font-bold text-orange-600 font-inter">{m.quantity_used}</td>
                      <td className="px-6 py-4 text-center font-black text-emerald-600 text-sm font-inter">{m.remaining_stock}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-400 font-inter">{m.minimum_stock_level}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter ${alertBadge(m.alert_type)}`}>
                          {m.alert_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedMaterial(m);
                            setUsageData({ quantity: 0, issue_type: "SITE" });
                            setIsUsageModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-orange-200 font-inter"
                        >
                          Use Material
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center text-slate-400 font-medium font-inter">No material data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage Logs */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Usage History</h3>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Date</th>
                  <th className="px-6 py-4 font-inter">Material</th>
                  <th className="px-6 py-4 font-inter text-center">Qty Used</th>
                  <th className="px-6 py-4 font-inter">Issue Type</th>
                  <th className="px-6 py-4 font-inter">Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm font-inter">MID: {log.material_id}</td>
                      <td className="px-6 py-4 text-center font-black text-orange-600 text-sm font-inter">{log.quantity}</td>
                      <td className="px-6 py-4 font-inter">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{log.issue_type}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 font-inter">Project #{log.project_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium font-inter">No usage history available.</td>
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
        title="Record Site Material Usage"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUsageSubmit} className="p-6 space-y-6 font-inter">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3 font-inter">
              <ClipboardCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 font-inter" />
              <div className="font-inter">
                  <p className="text-xs font-bold text-orange-800 font-inter">Recording for {selectedMaterial?.material_name}</p>
                  <p className="text-[10px] text-orange-600 font-medium font-inter">Available Stock: {selectedMaterial?.remaining_stock} {selectedMaterial?.unit}</p>
              </div>
          </div>
          
          <div className="space-y-4 font-inter">
            <div className="font-inter">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Select Material *</label>
                <select
                    required
                    value={selectedMaterial?.id || ""}
                    onChange={(e) => setSelectedMaterial(materials.find(m => m.id === Number(e.target.value)) || null)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all font-bold font-inter"
                >
                    {materials.map(m => <option key={m.id} value={m.id}>{m.material_name} ({m.remaining_stock} {m.unit} left)</option>)}
                </select>
            </div>
            <div className="font-inter">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Quantity Used *</label>
              <input
                required
                type="number"
                max={selectedMaterial?.remaining_stock}
                value={usageData.quantity}
                onChange={(e) => setUsageData({ ...usageData, quantity: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all font-bold font-inter"
                placeholder="0"
              />
              <p className="text-[10px] text-slate-400 font-bold mt-1 ml-1 uppercase font-inter">Cannot exceed remaining stock</p>
            </div>
            <div className="font-inter">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Issue Type *</label>
                <select
                    required
                    value={usageData.issue_type}
                    onChange={(e) => setUsageData({ ...usageData, issue_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all font-bold font-inter"
                >
                    {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 font-inter">
            <button
              type="button"
              onClick={() => setIsUsageModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all font-inter"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting || usageData.quantity <= 0 || usageData.quantity > (selectedMaterial?.remaining_stock || 0)}
              type="submit"
              className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              {isSubmitting ? "Processing..." : "Record Usage"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MaterialConsumptionPage;
