import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import {
  Plus,
  Calendar,
  Save,
  AlertCircle,
  Trash2,
  Search,
  RotateCcw,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { workProgressService } from "../../../services/workProgressService";
import type { ActivityItem, DailyEntry } from "../../../types/workProgress";

// Modular Components
import LogProgressModal from "../../../components/WorkProgress/LogProgressModal";
import EditDailyEntryModal from "../../../components/WorkProgress/EditDailyEntryModal";


const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50",
  "ON_TRACK": "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50",
  "ON TRACK": "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50",
  "Delay": "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50",
  "Completed": "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50",
  "Not Started": "bg-slate-50 text-slate-500 border-slate-100 shadow-slate-50"
};

const DailyProgressEntryPage = () => {
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
          setProjectId(92);
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(92);
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [loading, setLoading] = useState(true);
  const [hasLoadedToday, setHasLoadedToday] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]); // for dropdown
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Delayed" | "Completed" | "Momentum">("All");

  // Input states for Tab 1 cards
  const [cardInputs, setCardInputs] = useState<Record<number, number>>({});

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry] = useState<DailyEntry | null>(null);


  const loadActivities = useCallback(async () => {
    try {
      const data = await workProgressService.listActivities(projectId || 92, engineer_id);
      const normalizedData = data.map((a: any) => {
        let status = a.status;
        if (status) {
          const upper = status.toUpperCase().replace(/_/g, " ");
          if (upper === "NOT STARTED" || upper === "NOT_STARTED") status = "Not Started";
          if (upper === "ON TRACK" || upper === "ON_TRACK") status = "On Track";
          if (upper === "DELAY") status = "Delay";
          if (upper === "COMPLETED") status = "Completed";
        }
        return {
          ...a,
          status: status || "Not Started"
        };
      });
      setActivitiesList(normalizedData);
    } catch (err) {
      console.error(err);
    }
  }, [projectId, engineer_id]);

  const loadTodayProgress = useCallback(async () => {
    try {
      if (!hasLoadedToday) {
        setLoading(true);
      }
      const [data, entries] = await Promise.all([
        workProgressService.getTodayProgress(engineer_id),
        workProgressService.listDailyEntries(undefined, new Date().toISOString().split("T")[0])
      ]);
      setTodayActivities(data);
      setAllEntries(entries);
      setHasLoadedToday(true);
    } catch (err) {
      toast.error("Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  }, [engineer_id, hasLoadedToday]);

  const loadAllEntries = useCallback(async () => {
    try {
      if (!hasLoadedAll) {
        setLoading(true);
      }
      const activityId = selectedActivityId === "all"
        ? (activitiesList[0]?.id || 1)
        : Number(selectedActivityId);
      const res = await workProgressService.getActivityHistory(activityId);
      setAllEntries(res?.data || []);
      setHasLoadedAll(true);
    } catch (err) {
      console.error("Load Entries Error:", err);
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  }, [hasLoadedAll, selectedActivityId, activitiesList]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

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
      loadActivities();
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
      loadActivities();
      if (activeTab === 'today') loadTodayProgress();
      else loadAllEntries();
    } catch (err) {
      toast.error("Failed to log progress");
    }
  };

  const handleEditSubmit = async (id: number, data: any) => {
    try {
      await workProgressService.updateDailyEntry(id, data);
      toast.success("Entry updated successfully!");
      setIsEditModalOpen(false);
      loadActivities();
      loadAllEntries();
    } catch (err) {
      toast.error("Failed to update entry");
    }
  };

  const handleDeleteEntry = async (id: number) => {
    const toastId = toast.loading("Purging daily entry...");
    try {
      await workProgressService.deleteDailyEntry(id);
      toast.success("Daily Entry Deleted", { id: toastId });
      loadActivities();
      if (activeTab === 'today') {
        loadTodayProgress();
      } else {
        loadAllEntries();
      }
    } catch (err) {
      toast.error("Purge failed", { id: toastId });
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
    let list = allEntries;
    
    if (selectedActivityId !== "all") {
      list = list.filter(e => e.activity_id === Number(selectedActivityId));
    }
    
    if (filterDate) {
      list = list.filter(e => e.entry_date === filterDate);
    }

    if (activeStatFilter === "Delayed") {
      list = list.filter(e => {
        const act = activitiesList.find(a => a.id === e.activity_id);
        return act?.status === "Delay";
      });
    } else if (activeStatFilter === "Completed") {
      list = list.filter(e => {
        const act = activitiesList.find(a => a.id === e.activity_id);
        return act?.status === "Completed" || act?.completion_percentage === 100;
      });
    }

    return list.filter(e => {
      const activity = activitiesList.find(a => a.id === e.activity_id);
      const activityName = activity?.activity_name.toLowerCase() || "";
      const boqCode = String(activity?.boq_code || "").toLowerCase();
      return searchTerm === "" || activityName.includes(searchTerm.toLowerCase()) || boqCode.includes(searchTerm.toLowerCase());
    });
  }, [allEntries, activitiesList, searchTerm, selectedActivityId, filterDate, activeStatFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'today') {
      const list = filteredTodayActivities;
      const total = list.length;
      const completed = list.filter(a => a.status === "Completed" || a.completion_percentage === 100).length;
      const delayed = list.filter(a => a.status === "Delay").length;
      const yieldRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      const todayStr = new Date().toISOString().split("T")[0];
      const activitiesWithTodayLog = allEntries.filter(e => e.entry_date === todayStr).length;
      const momentumRate = total > 0 ? Math.round((activitiesWithTodayLog / total) * 100) : 0;

      return {
        total,
        completed,
        delayed,
        yieldRate: `${yieldRate}%`,
        momentum: `${momentumRate}%`
      };
    } else {
      const list = filteredHistoryEntries;
      const total = list.length;
      const completed = list.filter(e => {
        const status = e.new_value?.status;
        return status === "Completed" || status === "ON_TRACK" || status === "ON TRACK" || status === "On Track";
      }).length;
      const delayed = list.filter(e => e.new_value?.status === "Delay").length;
      const yieldRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      const todayStr = new Date().toISOString().split("T")[0];
      const activitiesWithTodayLog = list.filter(e => e.entry_date === todayStr).length;
      const momentumRate = total > 0 ? Math.round((activitiesWithTodayLog / total) * 100) : 0;

      return {
        total,
        completed,
        delayed,
        yieldRate: `${yieldRate}%`,
        momentum: `${momentumRate}%`
      };
    }
  }, [activeTab, filteredTodayActivities, filteredHistoryEntries, allEntries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterDate, selectedActivityId, activeStatFilter]);

  const paginatedTodayActivities = filteredTodayActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const paginatedHistoryEntries = filteredHistoryEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const momentum = stats.momentum;

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return "bg-emerald-500 shadow-emerald-500/20";
    if (percent >= 40) return "bg-blue-500 shadow-blue-500/20";
    if (percent > 0) return "bg-amber-500 shadow-amber-500/20";
    return "bg-slate-200";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDate(""); // Clear date to show all history
    setSelectedActivityId("all");
    setActiveStatFilter("All");
  };

  return (
    <>
      <Navbar title="Field Progress Terminal" breadcrumb={["Engineer", "Work Progress", "Field Logs"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter uppercase">Field Execution Reporting Terminal</h1>
            <p className="text-slate-500 text-sm font-inter">Sync daily execution intelligence with the project's primary ledger.</p>
          </div>
          {activeTab === 'today' && (
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
            >
              <Plus className="w-4 h-4" />
              Daily Entry
            </button>
          )}
        </div>

        {/* â”€â”€ Interactive Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Active Registry"
              value={stats.total.toString()}
              sub="Tasks in Terminal"
              accent="text-slate-800" />
          </div>
          <div onClick={() => setActiveStatFilter("Completed")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Completed" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Yield Rate"
              value={stats.yieldRate}
              sub="Project Completion"
              accent="text-emerald-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Delayed")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Delayed" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Critical Delay"
              value={stats.delayed.toString()}
              sub="Inertia Items"
              accent="text-rose-500" />
          </div>
          <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
            <StatCard
              title="Momentum"
              value={momentum}
              sub="Operational Pulse"
              accent="text-blue-500" />
          </div>
        </div>

        {/* â”€â”€ Scrollable Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* â”€â”€ Navigation Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex items-center gap-10 border-b border-slate-200 mb-10 font-inter">
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-5 text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'today' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              daily execution log
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-5 text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              historical intelligence
            </button>
          </div>

          {/* â”€â”€ Registry Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
            {/* Integrated Filter Bar */}
            <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
              <div className="relative flex-1 max-w-md font-inter">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by activity ref or BOQ identity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
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
                        className="bg-transparent text-[11px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter"
                      />
                    </div>
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm"
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

            <div className="flex-1 overflow-auto p-10 font-inter scrollbar-thin scrollbar-thumb-slate-200">
              {activeTab === 'today' ? (
                <>
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                    <table className="w-full text-left font-inter min-w-[1200px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                          <th className="px-6 py-4 font-inter">activity_id</th>
                          <th className="px-6 py-4 font-inter">completion_percentage</th>
                          <th className="px-6 py-4 font-inter">volumes</th>
                          <th className="px-6 py-4 font-inter">today_progress</th>
                          <th className="px-6 py-4 text-right font-inter">actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-20 text-center font-inter">
                              <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Syncing Field Intelligence...</p>
                            </td>
                          </tr>
                        ) : paginatedTodayActivities.length > 0 ? paginatedTodayActivities.map((a) => {
                          const todayStr = new Date().toISOString().split("T")[0];
                          const todayEntry = allEntries.find(ent => ent.activity_id === a.id && ent.entry_date === todayStr);
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter">
                                <p className="font-bold text-slate-800 text-sm font-inter leading-tight tracking-tight">
                                  {a.activity_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest font-inter">{a.boq_code || "No BOQ Identity"}</span>
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border font-inter ${statusBadge[a.status] || "bg-slate-50 text-slate-500 border-slate-100 shadow-slate-50"}`}>
                                    {a.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-3 font-inter">
                                  <span className="text-sm font-bold text-slate-800 font-inter">{a.completion_percentage.toFixed(1)}%</span>
                                  <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden font-inter">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(a.completion_percentage)}`} style={{ width: `${a.completion_percentage}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-xs text-slate-500 font-bold">
                                {a.planned_quantity} / <span className="text-primary">{a.total_completed}</span> / {a.remaining_quantity} <span className="text-[10px] text-slate-400">{a.unit}</span>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-2 max-w-[200px] font-inter">
                                  <input
                                    type="number" min="0" placeholder={`Qty (${a.unit})`}
                                    value={cardInputs[a.id] || ""}
                                    onChange={(e) => setCardInputs({ ...cardInputs, [a.id]: Number(e.target.value) })}
                                    className="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
                                  />
                                  <button
                                    onClick={() => handleSaveCardProgress(a.id)}
                                    className="p-2 bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 group font-inter"
                                    title="Save Progress"
                                  >
                                    <Save className="w-4 h-4 transition-transform font-inter" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-right">
                                <div className="flex items-center justify-end gap-3 font-inter">
                                  <button
                                    onClick={() => {
                                      if (todayEntry) {
                                        handleDeleteEntry(todayEntry.id);
                                      } else {
                                        toast.error("No daily progress logged today to remove.");
                                      }
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 font-inter"
                                    title="Purge Daily Progress"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center font-inter bg-slate-50 border-dashed border border-slate-200 rounded-2xl">
                              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4 font-inter" />
                              <h3 className="text-xl font-bold text-slate-400 tracking-tight font-inter uppercase">Field Registry Exhausted</h3>
                              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 font-inter">No active items requiring immediate execution logs discovered.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* â”€â”€ Pagination for Today's Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {!loading && filteredTodayActivities.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-end bg-white sticky left-0 font-inter">
                      <div className="flex gap-2 font-inter">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                          Page {currentPage} of 20
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(20, prev + 1))}
                          disabled={currentPage === 20}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                    <table className="w-full text-left font-inter min-w-[1200px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                          <th className="px-6 py-4 font-inter">activity_id</th>
                          <th className="px-6 py-4 font-inter">action</th>
                          <th className="px-6 py-4 font-inter">status</th>
                          <th className="px-6 py-4 font-inter">today_progress</th>
                          <th className="px-6 py-4 font-inter">total_completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter">
                        {paginatedHistoryEntries.length > 0 ? paginatedHistoryEntries.map((e, index) => {
                          const currentActivity = activitiesList.find(a => a.id === e.activity_id) || activitiesList[index % activitiesList.length];
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter">
                                <p className="font-bold text-slate-800 text-sm font-inter leading-tight uppercase tracking-tight">
                                  {currentActivity?.activity_name || "Unknown Strategic Item"}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest font-inter">{currentActivity?.id || e.activity_id}</span>
                              </td>
                              <td className="px-6 py-6 font-inter text-xs font-bold text-slate-500 uppercase tracking-tight">
                                DAILY_PROGRESS_UPDATE
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[currentActivity?.status || ""] || "bg-slate-100 text-slate-500"} font-inter`}>
                                  {currentActivity?.status || "Not Started"}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-2 font-inter">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary font-inter" />
                                  <span className="text-sm font-bold text-primary font-inter">
                                    {e.today_progress} {currentActivity?.unit || ""}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700">
                                {currentActivity?.total_completed || 0} {currentActivity?.unit || ""}
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-32 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                              No historical execution records discovered in the intelligence vault.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* â”€â”€ Pagination for Historical Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {filteredHistoryEntries.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-end bg-white sticky left-0 font-inter">
                      <div className="flex gap-2 font-inter">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                          Page {currentPage} of 20
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(20, prev + 1))}
                          disabled={currentPage === 20}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
