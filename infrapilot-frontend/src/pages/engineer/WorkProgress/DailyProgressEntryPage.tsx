import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import { 
  Plus, 
  Calendar,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layout,
  Edit2,
  Trash2,
  Activity as ActivityIcon,
  Search,
  RotateCcw,
  AlertTriangle,
  History,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { workProgressService } from "../../../services/workProgressService";
import type { ActivityItem, DailyEntry, ProjectSummary } from "../../../types/workProgress";

// Modular Components
import LogProgressModal from "../../../components/WorkProgress/LogProgressModal";
import EditDailyEntryModal from "../../../components/WorkProgress/EditDailyEntryModal";

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50",
  "Delay": "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50",
  "Completed": "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50",
  "Not Started": "bg-slate-50 text-slate-500 border-slate-100 shadow-slate-50"
};

const DailyProgressEntryPage = () => {
  const { user } = useAuth();
  const engineer_id = Number(user?.id) || 1;
  const [projectId, setProjectId] = useState<number>(36);

  useEffect(() => {
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const pId = user?.project_id || user?.user?.project_id || user?.id;
        if (pId) setProjectId(Number(pId));
      } catch (e) {
        console.error("Failed to resolve project ID", e);
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]); // for dropdown

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Delayed" | "Completed" | "Momentum">("All");

  // Input states for Tab 1 cards
  const [cardInputs, setCardInputs] = useState<Record<number, number>>({});

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await workProgressService.getProjectSummary(projectId);
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const loadActivities = useCallback(async () => {
    try {
      const data = await workProgressService.listActivities(projectId, engineer_id);
      setActivitiesList(data);
    } catch (err) {
      console.error(err);
    }
  }, [projectId, engineer_id]);

  const loadTodayProgress = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workProgressService.getTodayProgress(engineer_id);
      setTodayActivities(data);
    } catch (err) {
      toast.error("Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  }, [engineer_id]);

  const loadAllEntries = useCallback(async () => {
    try {
      setLoading(true);
      const activity_id = selectedActivityId === "all" ? undefined : Number(selectedActivityId);
      const data = await workProgressService.listDailyEntries(activity_id, filterDate);
      setAllEntries(data);
    } catch (err) {
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  }, [selectedActivityId, filterDate]);

  useEffect(() => {
    loadSummary();
    loadActivities();
  }, [loadSummary, loadActivities]);

  useEffect(() => {
    if (activeTab === 'today') {
      loadTodayProgress();
    } else {
      loadAllEntries();
    }
  }, [activeTab, loadTodayProgress, loadAllEntries]);

  const handleSaveCardProgress = async (activity_id: number) => {
    const today_progress = cardInputs[activity_id];
    if (!today_progress || today_progress <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const toastId = toast.loading("Syncing progress with project ledger...");
    try {
      await workProgressService.siteEngineerProgressEntry({
        activity_id,
        entry_date: new Date().toISOString().split("T")[0],
        today_progress,
        remarks: "",
        created_by: engineer_id
      });
      toast.success("Progress synchronized successfully!", { id: toastId });
      loadTodayProgress();
      loadSummary();
      setCardInputs(prev => ({ ...prev, [activity_id]: 0 }));
    } catch (err) {
      toast.error("Failed to save progress", { id: toastId });
    }
  };

  const handleLogModalSubmit = async (data: any) => {
    try {
      await workProgressService.addDailyProgress(data);
      toast.success("Progress logged successfully!");
      setIsLogModalOpen(false);
      if (activeTab === 'today') loadTodayProgress();
      else loadAllEntries();
      loadSummary();
    } catch (err) {
      toast.error("Failed to log progress");
    }
  };

  const handleEditSubmit = async (id: number, data: any) => {
    try {
      await workProgressService.updateDailyEntry(id, data);
      toast.success("Entry updated successfully!");
      setIsEditModalOpen(false);
      loadAllEntries();
      loadSummary();
    } catch (err) {
      toast.error("Failed to update entry");
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm("Are you sure you want to permanently purge this entry from the project ledger?")) return;
    try {
      await workProgressService.deleteDailyEntry(id);
      toast.success("Entry purged successfully!");
      loadAllEntries();
      loadSummary();
    } catch (err) {
      toast.error("Purge failed");
    }
  };

  const filteredTodayActivities = useMemo(() => {
    let data = todayActivities;

    // Apply StatCard Filter
    if (activeStatFilter === "Delayed") {
      data = data.filter(a => a.status === "Delay");
    } else if (activeStatFilter === "Completed") {
      data = data.filter(a => a.completion_percentage === 100);
    }

    return data.filter(a => 
      searchTerm === "" || 
      a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [todayActivities, searchTerm, activeStatFilter]);

  const filteredHistoryEntries = useMemo(() => {
    return allEntries.filter(e => {
        const activity = activitiesList.find(a => a.id === e.activity_id);
        const activityName = activity?.activity_name.toLowerCase() || "";
        const boqCode = String(activity?.boq_code || "").toLowerCase();
        return searchTerm === "" || activityName.includes(searchTerm.toLowerCase()) || boqCode.includes(searchTerm.toLowerCase());
    });
  }, [allEntries, activitiesList, searchTerm]);

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return "bg-emerald-500 shadow-emerald-500/20";
    if (percent >= 40) return "bg-blue-500 shadow-blue-500/20";
    if (percent > 0) return "bg-amber-500 shadow-amber-500/20";
    return "bg-slate-200";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDate(new Date().toISOString().split("T")[0]);
    setSelectedActivityId("all");
    setActiveStatFilter("All");
  };

  return (
    <>
      <Navbar title="Field Progress Terminal" breadcrumb={["Engineer", "Work Progress", "Field Logs"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter uppercase">Field Execution Reporting Terminal</h1>
            <p className="text-slate-500 text-sm italic-none font-inter">Sync daily execution intelligence with the project's primary ledger.</p>
          </div>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
          >
            <Plus className="w-4 h-4" />
            Provision Manual Log
          </button>
        </div>

        {/* ── Interactive Stats ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-slate-800 bg-slate-100 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Active Registry"
              value={(summary?.total_activities || 0).toString()}
              sub="Tasks in Terminal"
              accent="text-slate-800"
              icon={<Layout className={`w-5 h-5 ${activeStatFilter === "All" ? "text-slate-800 scale-110" : "text-slate-400 group-hover:text-slate-800"} transition-all`} />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("Completed")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Completed" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Yield Rate"
              value={`${Math.round(((summary?.completed_activities || 0) / (summary?.total_activities || 1)) * 100)}%`}
              sub="Project Completion"
              accent="text-emerald-500"
              icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Completed" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("Delayed")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Delayed" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Critical Delay"
              value={(summary?.delayed_activities || 0).toString()}
              sub="Inertia Items"
              accent="text-rose-500"
              icon={<AlertTriangle className={`w-5 h-5 ${activeStatFilter === "Delayed" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
            />
          </div>
          <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
            <StatCard
              title="Momentum"
              value="88%"
              sub="Operational Pulse"
              accent="text-blue-500"
              icon={<ActivityIcon className="w-5 h-5 text-blue-500" />}
            />
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────────────── */}
        <div className="flex items-center gap-10 border-b border-slate-200 mb-10 font-inter">
            <button 
                onClick={() => setActiveTab('today')}
                className={`pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'today' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
                Daily Execution Log
            </button>
            <button 
                onClick={() => setActiveTab('all')}
                className={`pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
                Historical Intelligence
            </button>
        </div>

        {/* ── Registry Container ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
            {/* Integrated Filter Bar */}
            <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                <div className="relative flex-1 max-w-md font-inter">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by activity ref or BOQ identity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter shadow-inner"
                    />
                </div>
                
                <div className="flex items-center gap-3 font-inter">
                    {activeTab === 'all' && (
                        <div className="flex items-center gap-3 font-inter">
                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm font-inter">
                                <Calendar className="w-4 h-4 text-primary" />
                                <input 
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter"
                                />
                            </div>
                            <select
                                value={selectedActivityId}
                                onChange={(e) => setSelectedActivityId(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm"
                            >
                                <option value="all">All Activities</option>
                                {activitiesList.map(a => (
                                    <option key={a.id} value={a.id}>{a.activity_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeStatFilter !== "All" && (
                        <button onClick={resetFilters} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-10 font-inter">
                {activeTab === 'today' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-inter">
                        {loading ? (
                            <div className="col-span-full py-32 text-center font-inter">
                                <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Field Intelligence...</p>
                            </div>
                        ) : filteredTodayActivities.length > 0 ? filteredTodayActivities.map((a) => (
                            <div key={a.id} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 font-inter group relative overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-40 h-40 bg-slate-50 rounded-full group-hover:scale-[2] transition-transform duration-1000 opacity-30" />
                                
                                <div className="relative z-10 font-inter">
                                    <div className="flex items-center justify-between mb-8 font-inter">
                                        <span className="font-mono text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase font-inter">{a.boq_code || "No BOQ Identity"}</span>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${statusBadge[a.status] || "bg-slate-50 text-slate-500 border-slate-100 shadow-slate-50"}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight italic-none font-inter leading-tight">{a.activity_name}</h3>
                                    
                                    <div className="mb-10 font-inter">
                                        <div className="flex items-center justify-between mb-3 font-inter">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Strategic Intensity</span>
                                            <span className="text-sm font-black text-slate-800 font-inter">{a.completion_percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner font-inter">
                                            <div
                                              className={`h-full rounded-full transition-all duration-1000 shadow-lg ${getProgressColor(a.completion_percentage)}`}
                                              style={{ width: `${a.completion_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 p-6 bg-slate-50/50 rounded-[2rem] mb-10 border border-slate-100 backdrop-blur-xl shadow-inner font-inter">
                                        <div className="text-center font-inter">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Provisioned</p>
                                            <p className="text-base font-black text-slate-800 italic-none font-inter">{a.planned_quantity} <span className="text-[10px] text-slate-400 font-inter tracking-widest">{a.unit}</span></p>
                                        </div>
                                        <div className="text-center border-x border-slate-200 px-2 font-inter">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Executed</p>
                                            <p className="text-base font-black text-blue-600 italic-none font-inter">{a.total_completed} <span className="text-[10px] text-slate-400 font-inter tracking-widest">{a.unit}</span></p>
                                        </div>
                                        <div className="text-center font-inter">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Remaining</p>
                                            <p className="text-base font-black text-slate-800 italic-none font-inter">{a.remaining_quantity} <span className="text-[10px] text-slate-400 font-inter tracking-widest">{a.unit}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-8 font-inter">
                                        <div className="font-inter">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 font-inter">Daily Execution Volume *</label>
                                            <div className="flex items-center gap-4 font-inter">
                                                <div className="flex-1 relative font-inter">
                                                    <input 
                                                        type="number" min="0" placeholder="Qty done today..."
                                                        value={cardInputs[a.id] || ""}
                                                        onChange={(e) => setCardInputs({ ...cardInputs, [a.id]: Number(e.target.value) })}
                                                        className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-inter shadow-sm"
                                                    />
                                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">{a.unit}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleSaveCardProgress(a.id)}
                                                    className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 group font-inter"
                                                >
                                                    <Save className="w-6 h-6 group-hover:scale-110 transition-transform font-inter" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between font-inter">
                                            <div className="flex items-center gap-3 text-slate-400 font-inter">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic-none font-inter">{a.start_date} → {a.end_date}</span>
                                            </div>
                                            {a.completion_percentage === 100 && (
                                                <div className="flex items-center gap-2 text-emerald-500 font-inter">
                                                    <CheckCircle2 className="w-4 h-4 font-inter" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest font-inter">Strategic Objective Yielded</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-40 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200 font-inter">
                                <AlertCircle className="w-20 h-20 text-slate-200 mx-auto mb-8 font-inter" />
                                <h3 className="text-2xl font-black text-slate-400 tracking-tight italic-none font-inter uppercase">Field Registry Exhausted</h3>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic-none mt-2 font-inter">No active items requiring immediate execution logs discovered.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Temporal Signature</th>
                                    <th className="px-6 py-4 font-inter">Execution Identity</th>
                                    <th className="px-6 py-4 font-inter">Intensity (Volume)</th>
                                    <th className="px-6 py-4 font-inter">Narrative</th>
                                    <th className="px-6 py-4 text-right font-inter">Audit Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-32 text-center font-inter">
                                        <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6 font-inter" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 font-inter">Synchronizing Intelligence Vault...</p>
                                    </td></tr>
                                ) : filteredHistoryEntries.length > 0 ? filteredHistoryEntries.map((e) => {
                                    const currentActivity = activitiesList.find(a => a.id === e.activity_id);
                                    return (
                                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-6 font-inter">
                                              <div className="flex items-center gap-3 font-inter">
                                                <History className="w-3.5 h-3.5 text-slate-300 font-inter" />
                                                <span className="text-sm font-black text-slate-800 italic-none font-inter uppercase tracking-tight">{e.entry_date}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-6 font-inter">
                                                <p className="font-black text-slate-800 text-sm italic-none font-inter leading-tight uppercase tracking-tight">
                                                    {currentActivity?.activity_name || "Unknown Strategic Item"}
                                                </p>
                                                <span className="text-[10px] font-mono text-slate-400 font-black uppercase tracking-widest font-inter">{currentActivity?.boq_code || "—"}</span>
                                            </td>
                                            <td className="px-6 py-6 font-inter">
                                                <div className="flex items-center gap-2 font-inter">
                                                  <TrendingUp className="w-3.5 h-3.5 text-blue-500 font-inter" />
                                                  <span className="text-sm font-black text-blue-600 italic-none font-inter">
                                                      {e.today_progress} {currentActivity?.unit}
                                                  </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-inter text-xs font-bold text-slate-500 max-w-xs truncate italic-none font-inter uppercase tracking-tight">{e.remarks || "No Operational Narrative Provided"}</td>
                                            <td className="px-6 py-6 font-inter">
                                                <div className="flex items-center justify-end gap-3 font-inter">
                                                    <button 
                                                        onClick={() => { 
                                                            setSelectedEntry(e);
                                                            setIsEditModalOpen(true);
                                                        }} 
                                                        className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100 font-inter"
                                                        title="Modify Entry"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteEntry(e.id)} 
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 font-inter"
                                                        title="Purge Record"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-32 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] font-inter italic-none">
                                            No historical execution records discovered in the intelligence vault.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </PageTransition>

      {/* Modals */}
      <LogProgressModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onSubmit={handleLogModalSubmit}
        activity={null}
        activitiesList={activitiesList}
        engineerId={engineer_id}
      />

      <EditDailyEntryModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSubmit={handleEditSubmit}
        entry={selectedEntry}
      />
    </>
  );
};

export default DailyProgressEntryPage;
