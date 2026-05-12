import { useState, useMemo, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  Clock,
  Layout,
  CheckCircle2,
  TrendingUp,
  ClipboardList,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { workProgressService } from "../../../services/workProgressService";
import type { ActivityItem } from "../../../types/workProgress";

// Modular Components
import AddActivityModal from "../../../components/WorkProgress/AddActivityModal";
import EditActivityModal from "../../../components/WorkProgress/EditActivityModal";
import ActivityDetailModal from "../../../components/WorkProgress/ActivityDetailModal";
import LogProgressModal from "../../../components/WorkProgress/LogProgressModal";

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-600",
  "Delay": "bg-red-100 text-red-600",
  "Completed": "bg-blue-100 text-blue-600",
  "Not Started": "bg-slate-100 text-slate-500"
};

const ActivityListPage = () => {
  const { user } = useAuth();
  const engineer_id = Number(user?.id) || 1;
  const [projectId, setProjectId] = useState<number | null>(null);

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

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Delayed" | "Execution">("All");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadActivities();
  }, [engineer_id]);

  const loadActivities = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await workProgressService.listActivities(projectId || 0, engineer_id);
      setActivities(data);
    } catch (err) {
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: activities.length,
      onTrack: activities.filter(a => a.status === "On Track").length,
      delayed: activities.filter(a => a.status === "Delay").length,
      completed: activities.filter(a => a.completion_percentage === 100).length
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let data = activities;

    // Apply StatCard Filter
    if (activeStatFilter === "Compliance") {
      data = data.filter(a => a.completion_percentage === 100);
    } else if (activeStatFilter === "Delayed") {
      data = data.filter(a => a.status === "Delay");
    } else if (activeStatFilter === "Execution") {
      data = data.filter(a => a.status === "On Track");
    }

    return data.filter(a =>
      (searchTerm === "" || a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (a.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterStatus === "All Status" || a.status === filterStatus)
    );
  }, [activities, searchTerm, filterStatus, activeStatFilter]);

  const handleAddSubmit = async (data: any) => {
    try {
      await workProgressService.createActivity(data);
      toast.success("Activity created successfully!");
      setIsAddModalOpen(false);
      loadActivities();
    } catch (err) {
      toast.error("Failed to create activity");
    }
  };

  const handleEditSubmit = async (id: number, data: any) => {
    try {
      await workProgressService.updateActivity(id, data);
      toast.success("Activity updated successfully!");
      setIsEditModalOpen(false);
      loadActivities();
    } catch (err) {
      toast.error("Failed to update activity");
    }
  };

  const handleLogSubmit = async (data: any) => {
    try {
      await workProgressService.addDailyProgress(data);
      toast.success("Progress logged successfully!");
      setIsLogModalOpen(false);
      loadActivities();
    } catch (err) {
      toast.error("Failed to log progress");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await workProgressService.deleteActivity(deleteId);
      toast.success("Activity deleted successfully!");
      setIsDeleteModalOpen(false);
      loadActivities();
    } catch (err) {
      toast.error("Failed to delete activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return "bg-emerald-500";
    if (percent >= 40) return "bg-blue-500";
    if (percent > 0) return "bg-amber-500";
    return "bg-slate-200";
  };

  return (
    <>
      <Navbar title="Activity List" breadcrumb={["InfraPilot", "Engineer", "Work Progress"]} />
      <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Project Work Progress</h1>
            <p className="text-slate-500 text-sm italic-none">Historical record of project activities and BOQ execution momentum.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>

        {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Total Tasks"
              value={stats.total.toString()}
              sub="Active Ledger"
              accent="text-slate-800"
              icon={<Layout className={`w-5 h-5 ${activeStatFilter === "All" ? "text-primary scale-110" : "text-slate-400 group-hover:text-primary"} transition-all`} />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Compliance" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Compliance"
              value={`${Math.round((stats.completed / (stats.total || 1)) * 100)}%`}
              sub="Completion Rate"
              accent="text-blue-500"
              icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Compliance" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("Delayed")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Delayed" ? "ring-2 ring-rose-500 bg-rose-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Behind Schedule"
              value={stats.delayed.toString()}
              sub="Action Required"
              accent="text-rose-500"
              icon={<Clock className={`w-5 h-5 ${activeStatFilter === "Delayed" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("Execution")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Execution" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Execution"
              value={stats.onTrack.toString()}
              sub="On Track Items"
              accent="text-emerald-500"
              icon={<TrendingUp className={`w-5 h-5 ${activeStatFilter === "Execution" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
            />
          </div>
        </div>

        {/* ── Filter Bar & Registry Container ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          {/* Integrated Filter Bar */}
          <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Search by activity name or BOQ code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
              />
            </div>
            <div className="flex items-center gap-3 font-inter">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest"
              >
                <option value="All Status">All Status</option>
                <option value="Not Started">Not Started</option>
                <option value="On Track">On Track</option>
                <option value="Delay">Delay</option>
                <option value="Completed">Completed</option>
              </select>
              {activeStatFilter !== "All" && (
                <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Ref Code</th>
                  <th className="px-6 py-4 font-inter">Activity Description</th>
                  <th className="px-6 py-4 font-inter">Logistics</th>
                  <th className="px-6 py-4 min-w-[200px] font-inter">% Intensity</th>
                  <th className="px-6 py-4 font-inter">Timeline</th>
                  <th className="px-6 py-4 font-inter">Status</th>
                  <th className="px-6 py-4 text-right font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center font-inter">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing Ledger...</p>
                    </td>
                  </tr>
                ) : filteredActivities.length > 0 ? filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                    <td className="px-6 py-4 font-inter">
                        <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{a.boq_code || "No BOQ"}</span>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <p className="font-bold text-slate-800 text-sm font-inter italic-none">{a.activity_name}</p>
                    </td>
                    <td className="px-6 py-4 font-inter">
                        <div className="flex flex-col font-inter">
                            <span className="text-[10px] font-black text-slate-800 font-inter">{a.total_completed} / {a.planned_quantity} {a.unit}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">{a.remaining_quantity} Remaining</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <div className="flex items-center gap-3 font-inter">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden font-inter">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${getProgressColor(a.completion_percentage)}`} 
                            style={{ width: `${a.completion_percentage}%` }} 
                          />
                        </div>
                        <span className="text-xs font-black text-slate-800 font-inter">{a.completion_percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-inter">
                        <div className="flex flex-col font-inter">
                            <span className="text-xs font-bold text-slate-600 font-inter italic-none">{a.start_date}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">To {a.end_date}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusBadge[a.status] || "bg-slate-100 text-slate-500"} font-inter`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <div className="flex items-center justify-end gap-2 font-inter">
                        <button 
                            onClick={() => { setSelectedActivity(a); setIsViewModalOpen(true); }} 
                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter" 
                            title="View Insight"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => { setSelectedActivity(a); setIsEditModalOpen(true); }} 
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter" 
                            title="Modify Record"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => { setSelectedActivity(a); setIsLogModalOpen(true); }} 
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all font-inter" 
                            title="Log Field Entry"
                        >
                            <ClipboardList className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => { setDeleteId(a.id); setIsDeleteModalOpen(true); }} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter" 
                            title="Archive Entry"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                      No activities found in the project registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      {/* Modals */}
      <AddActivityModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddSubmit}
        projectId={projectId || 0}
        engineerId={engineer_id}
      />

      <EditActivityModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSubmit={handleEditSubmit}
        activity={selectedActivity}
      />

      <ActivityDetailModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        activity={selectedActivity}
        onEdit={() => setIsEditModalOpen(true)}
      />

      <LogProgressModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onSubmit={handleLogSubmit}
        activity={selectedActivity}
        engineerId={engineer_id}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Discard Activity Entry"
        message="Are you sure you want to delete this activity record? This action will permanently remove the entry and all its progress history from the project ledger."
        confirmText="Archive Record"
        type="danger"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default ActivityListPage;
