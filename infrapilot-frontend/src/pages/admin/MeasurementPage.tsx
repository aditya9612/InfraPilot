import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/common/ConfirmModal";
import { measurementService } from "../../services/measurementService";
import { projectService } from "../../services/projectService";
import type { Measurement } from "../../types/measurement";
import type { Project } from "../../types/project";
import toast from "react-hot-toast";
import { 
  Ruler, 
  Trash2, 
  Plus, 
  Search,
  Edit3
} from "lucide-react";

const MeasurementPage = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [_isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Measurement | null>(null);
  
  const [formData, setFormData] = useState({
    project_id: "",
    final_area: "",
    approved_rate: "",
    extra_area: "",
    extra_rate: ""
  });

  // Initial load of projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await projectService.getProjects(100);
        const items = Array.isArray(res) ? res : res.items || [];
        setProjects(items);
        if (items.length > 0) {
          setSelectedProject(items[0].id.toString());
        }
      } catch (error) {
        toast.error("System offline: Project matrix inaccessible");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedProject) return;
    try {
      setIsLoading(true);
      const measData = await measurementService.getMeasurementsByProject(Number(selectedProject));
      setMeasurements(measData);
    } catch (error) {
      setMeasurements([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.final_area || !formData.approved_rate) {
      toast.error("Incomplete coordinate set detected");
      return;
    }

    try {
      toast.loading("Broadcasting field data...", { id: "save" });
      const data = {
        project_id: Number(formData.project_id),
        final_area: Number(formData.final_area),
        approved_rate: Number(formData.approved_rate),
        extra_area: Number(formData.extra_area || 0),
        extra_rate: Number(formData.extra_rate || 0)
      };

      if (editingItem) {
        await measurementService.updateMeasurement(editingItem.id, data);
        toast.success("Measurement record recalibrated", { id: "save" });
      } else {
        await measurementService.createMeasurement(data);
        toast.success("New measurement synchronized", { id: "save" });
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        project_id: selectedProject,
        final_area: "",
        approved_rate: "",
        extra_area: "",
        extra_rate: ""
      });
      fetchData();
    } catch (error) {
      toast.error("Transmission failed: Check node connectivity", { id: "save" });
    }
  };

  const handleEdit = (m: Measurement) => {
    setEditingItem(m);
    setFormData({
      project_id: m.project_id.toString(),
      final_area: m.final_area.toString(),
      approved_rate: m.approved_rate.toString(),
      extra_area: m.extra_area.toString(),
      extra_rate: m.extra_rate.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetId) return;
    try {
      await measurementService.deleteMeasurement(targetId);
      toast.success("Record purged from mainframes");
      setIsDeleteOpen(false);
      setTargetId(null);
      fetchData();
    } catch (error) {
      toast.error("Purge aborted: Safety protocols active");
    }
  };

  const totalFinal = measurements.reduce((acc, curr) => acc + (curr.final_area * curr.approved_rate), 0);
  const totalExtra = measurements.reduce((acc, curr) => acc + (curr.extra_area * curr.extra_rate), 0);

  return (
    <>
      <Navbar title="Field Measurements" breadcrumb={["Admin", "Finance", "Measurements"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
              Certified Measurements
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Synchronized with Project Matrix
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({ ...formData, project_id: selectedProject });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl text-sm font-black shadow-2xl shadow-primary/30 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            Record New Area
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Total Certified" 
            value={`₹${((totalFinal + totalExtra) / 100000).toFixed(2)}L`} 
            sub="Combined aggregate value"
            accent="text-primary"
          />
          <StatCard 
            title="Standard Area" 
            value={`₹${(totalFinal / 100000).toFixed(2)}L`} 
            sub="Based on approved rates"
            accent="text-emerald-500"
          />
          <StatCard 
            title="Extra Deviation" 
            value={`₹${(totalExtra / 100000).toFixed(2)}L`} 
            sub="Non-standard work value"
            accent="text-amber-500"
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-6 bg-[#fcfdfe]">
            <div className="relative flex-1 max-w-md">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] absolute -top-3 left-6 bg-white px-3 py-0.5 rounded-full border border-slate-100 shadow-sm z-10">
                Active Project Node
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-11 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Project Node...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
            </div>
            {isLoading && (
              <div className="animate-pulse flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Node...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-6">ID</th>
                  <th className="px-8 py-6">Final Area (sq.ft)</th>
                  <th className="px-8 py-6">Approved Rate</th>
                  <th className="px-8 py-6">Extra (Area/Rate)</th>
                  <th className="px-8 py-6">Total Value</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {measurements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Ruler className="w-16 h-16 text-slate-300" />
                        <p className="text-slate-400 text-sm font-black tracking-tight">Node data empty. Record first measurement.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  measurements.map((m, index) => {
                    const lineTotal = (m.final_area * m.approved_rate) + (m.extra_area * m.extra_rate);
                    return (
                      <tr key={`meas-${m.id}-${index}`} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6 font-black text-slate-400 text-xs">#{m.id}</td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-700">{m.final_area.toLocaleString()} <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">Units</span></p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-emerald-600">₹{m.approved_rate.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600">{m.extra_area} sq.ft</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase">@ ₹{m.extra_rate}/unit</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-primary">₹{lineTotal.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(m)}
                              className="p-3 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setTargetId(m.id); setIsDeleteOpen(true); }}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white/20 overflow-hidden">
            <div className="p-12">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                {editingItem ? "Recalibrate Record" : "New Field Measurement"}
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Data input for financial certification</p>
              
              <form onSubmit={handleCreateOrUpdate} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Project Node</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/20 transition-all appearance-none"
                  >
                    <option value="">Select Node</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Standard Certs</p>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Area</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.final_area}
                            onChange={(e) => setFormData({ ...formData, final_area: e.target.value })}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approved Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.approved_rate}
                            onChange={(e) => setFormData({ ...formData, approved_rate: e.target.value })}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-100/50">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Extra Deviations</p>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extra Area</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.extra_area}
                            onChange={(e) => setFormData({ ...formData, extra_area: e.target.value })}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extra Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.extra_rate}
                            onChange={(e) => setFormData({ ...formData, extra_rate: e.target.value })}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                    className="flex-1 px-8 py-5 text-sm font-black text-slate-400 hover:text-slate-600 transition-all"
                  >
                    Abort Sync
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-5 bg-primary text-white rounded-[1.5rem] text-sm font-black shadow-2xl shadow-primary/20 hover:bg-blue-600 transition-all"
                  >
                    {editingItem ? "Recalibrate Matrix" : "Authorize Entry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Authorize Record Purge"
        message="Are you certain you wish to terminate this measurement sequence? This action is irreversible."
        confirmText="Purge Record"
        type="danger"
      />
    </>
  );
};

export default MeasurementPage;
