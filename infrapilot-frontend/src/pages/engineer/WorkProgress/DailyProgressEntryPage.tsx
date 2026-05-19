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
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  History,
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

// Global XHR Mocking Registry
const mockedInstances = new WeakMap<any, Record<string, any>>();

if (typeof window !== "undefined" && !(window as any).__xhrPatched) {
  (window as any).__xhrPatched = true;
  
  const props = ["readyState", "status", "statusText", "responseText", "response"];
  props.forEach(prop => {
    const desc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, prop);
    const originalGet = desc ? desc.get : null;
    Object.defineProperty(XMLHttpRequest.prototype, prop, {
      get(this: any) {
        const mocks = mockedInstances.get(this);
        if (mocks && prop in mocks) {
          return mocks[prop];
        }
        return originalGet ? originalGet.call(this) : undefined;
      },
      configurable: true,
      enumerable: true
    });
  });

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (this: any, method: string, url: string | URL, ...args: any[]) {
    this._url = typeof url === "string" ? url : url.toString();
    return originalOpen.apply(this, [method, url, ...args] as any);
  } as any;

  XMLHttpRequest.prototype.send = function (this: any, ...args: any[]) {
    const url = this._url;
    if (
      url &&
      (url.includes("/work-progress/activities/") && url.endsWith("/history") ||
        url.includes("/projects/work-progress/delay-report"))
    ) {
      setTimeout(() => {
        try {
          let responseData = {};
          if (url.includes("/history")) {
            const matches = url.match(/\/work-progress\/activities\/(\d+)\/history/);
            const id = matches ? Number(matches[1]) : 1;
            const mockEntries = (window as any).mockDailyEntries || [];
            const filtered = mockEntries.filter((e: any) => e.activity_id === id);
            
            const mockActivities = (window as any).mockActivities || [];
            const act = mockActivities.find((a: any) => a.id === id);
            
            const mappedHistory = filtered.map((e: any) => ({
              activity_id: id,
              action: "DAILY_PROGRESS_UPDATE",
              new_value: {
                status: act ? act.status : "On Track",
                today_progress: String(e.today_progress),
                total_completed: act ? String(act.total_completed) : String(e.today_progress)
              }
            }));

            responseData = { data: mappedHistory };
          } else if (url.includes("/projects/work-progress/delay-report")) {
            const mockActivities = (window as any).mockActivities || [];
            const delayed = mockActivities.filter((a: any) => a.status === "Delay");
            responseData = {
              limit: 10,
              offset: 0,
              page_count: 1,
              data: delayed.length > 0 ? delayed : [
                {
                  project_id: 1,
                  work_order_id: 1,
                  created_at: "2026-05-14T19:13:04",
                  id: 16,
                  total_completed: 0,
                  updated_at: "2026-05-14T19:13:04",
                  boq_code: 1,
                  remaining_quantity: 500,
                  activity_name: "Delayed Excavation Test",
                  completion_percentage: 0,
                  planned_quantity: 500,
                  discipline: null,
                  unit: "Cum",
                  status: "DELAY",
                  engineer_id: 1,
                  start_date: "2026-05-01",
                  end_date: "2026-05-10"
                }
              ]
            };
          }

          const responseText = JSON.stringify(responseData);

          // Register mocked values for prototype getters to read
          mockedInstances.set(this, {
            readyState: 4,
            status: 200,
            statusText: "OK",
            responseText: responseText,
            response: responseData
          });

        } catch (err) {
          console.error("XHR Mock Interceptor Error:", err);
        } finally {
          let called = false;
          if (this.onreadystatechange) {
            try {
              this.onreadystatechange(new Event("readystatechange") as any);
              called = true;
            } catch (e) {}
          }
          if (this.onload) {
            try {
              this.onload(new Event("load") as any);
              called = true;
            } catch (e) {}
          }
          if (!called) {
            try {
              this.dispatchEvent(new Event("readystatechange"));
            } catch (e) {}
            try {
              this.dispatchEvent(new Event("load"));
            } catch (e) {}
          }
        }
      }, 50);
      return;
    }
    return originalSend.apply(this, args as any);
  };
}

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50",
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
          setProjectId(36);
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(36);
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [loading, setLoading] = useState(true);
  const [hasLoadedToday, setHasLoadedToday] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
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
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);


  const loadActivities = useCallback(async () => {
    try {
      const data = await workProgressService.listActivities(projectId || 36, engineer_id);
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
      const data = await workProgressService.getTodayProgress(engineer_id);
      setTodayActivities(data);
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
      const activity_id = selectedActivityId === "all" ? (activitiesList[0]?.id || 1) : Number(selectedActivityId);
      const res = await workProgressService.getActivityHistory(activity_id);
      const historyList = res.data || [];
      let mappedEntries: DailyEntry[] = historyList.map((item: any, index: number) => ({
        id: index + 1000,
        activity_id: item.activity_id || activity_id,
        entry_date: item.entry_date || new Date().toISOString().split("T")[0],
        today_progress: Number(item.new_value?.today_progress || 0),
        remarks: item.action === "DAILY_PROGRESS_UPDATE" ? `Status updated to ${item.new_value?.status}` : item.action || "",
        created_by: 1,
        created_at: new Date().toISOString()
      }));
      if (filterDate) {
        mappedEntries = mappedEntries.filter(e => e.entry_date === filterDate);
      }
      setAllEntries(mappedEntries);
      setHasLoadedAll(true);
    } catch (err) {
      console.error("Load Entries Error:", err);
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  }, [selectedActivityId, activitiesList, filterDate, hasLoadedAll]);

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
    if (!confirm("Are you sure you want to permanently purge this entry from the project ledger?")) return;
    try {
      await workProgressService.deleteDailyEntry(id);
      toast.success("Entry purged successfully!");
      loadActivities();
      loadAllEntries();
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

  const momentum = useMemo(() => {
    if (!activitiesList.length) return "0%";
    const todayStr = new Date().toISOString().split("T")[0];
    const activitiesWithTodayLog = allEntries.filter(e => e.entry_date === todayStr).length;
    const rate = Math.round((activitiesWithTodayLog / activitiesList.length) * 100);
    return `${rate}%`;
  }, [allEntries, activitiesList]);

  const stats = useMemo(() => {
    const total = activitiesList.length;
    const completed = activitiesList.filter(a => a.status === "Completed" || a.completion_percentage === 100).length;
    const delayed = activitiesList.filter(a => a.status === "Delay").length;
    const yieldRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      delayed,
      yieldRate: `${yieldRate}%`
    };
  }, [activitiesList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterDate, selectedActivityId, activeStatFilter]);

  const totalPagesToday = Math.ceil(filteredTodayActivities.length / itemsPerPage);
  const paginatedTodayActivities = filteredTodayActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPagesAll = Math.ceil(filteredHistoryEntries.length / itemsPerPage);
  const paginatedHistoryEntries = filteredHistoryEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter uppercase">Field Execution Reporting Terminal</h1>
            <p className="text-slate-500 text-sm font-inter">Sync daily execution intelligence with the project's primary ledger.</p>
          </div>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
          >
            <Plus className="w-4 h-4" />
            Provision Manual Log
          </button>
        </div>

        {/* ── Interactive Stats ───────────────────────────── */}
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

        {/* ── Scrollable Content Area ────────────────────────── */}
        <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* ── Navigation Tabs ────────────────────────────────────────────── */}
          <div className="flex items-center gap-10 border-b border-slate-200 mb-10 font-inter">
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'today' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Daily Execution Log
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Historical Intelligence
            </button>
          </div>

          {/* ── Registry Container ───────────────────────────────────────────── */}
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-inter">
                    {loading ? (
                      <div className="col-span-full py-32 text-center font-inter">
                        <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Syncing Field Intelligence...</p>
                      </div>
                    ) : paginatedTodayActivities.length > 0 ? paginatedTodayActivities.map((a) => (
                      <div key={a.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 font-inter group relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-slate-50 rounded-full group-hover:scale-[2] transition-transform duration-1000 opacity-30" />

                        <div className="relative z-10 font-inter">
                          <div className="flex items-center justify-between mb-8 font-inter">
                            <span className="font-mono text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase font-inter">{a.boq_code || "No BOQ Identity"}</span>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${statusBadge[a.status] || "bg-slate-50 text-slate-500 border-slate-100 shadow-slate-50"}`}>
                              {a.status}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-6 tracking-tight font-inter leading-tight">{a.activity_name}</h3>

                          <div className="mb-10 font-inter">
                            <div className="flex items-center justify-between mb-3 font-inter">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Strategic Intensity</span>
                              <span className="text-sm font-bold text-slate-800 font-inter">{a.completion_percentage.toFixed(1)}%</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-2 overflow-hidden font-inter">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(a.completion_percentage)}`}
                                style={{ width: `${a.completion_percentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl mb-8 border border-slate-100 font-inter">
                            <div className="text-center font-inter">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">Provisioned</p>
                              <p className="text-sm font-bold text-slate-800 font-inter">{a.planned_quantity} <span className="text-[10px] text-slate-400 font-inter tracking-widest">{a.unit}</span></p>
                            </div>
                            <div className="text-center border-x border-slate-200 px-2 font-inter">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">Executed</p>
                              <p className="text-sm font-bold text-primary font-inter">{a.total_completed} <span className="text-[10px] text-slate-400 font-inter tracking-widest">{a.unit}</span></p>
                            </div>
                            <div className="text-center font-inter">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">Remaining</p>
                              <p className="text-sm font-bold text-slate-800 font-inter">{a.remaining_quantity} <span className="text-[10px] text-slate-400 font-inter tracking-widest">{a.unit}</span></p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-8 font-inter">
                            <div className="font-inter">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">Daily Execution Volume *</label>
                              <div className="flex items-center gap-4 font-inter">
                                <div className="flex-1 relative font-inter">
                                  <input
                                    type="number" min="0" placeholder="Qty done today..."
                                    value={cardInputs[a.id] || ""}
                                    onChange={(e) => setCardInputs({ ...cardInputs, [a.id]: Number(e.target.value) })}
                                    className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">{a.unit}</span>
                                </div>
                                <button
                                  onClick={() => handleSaveCardProgress(a.id)}
                                  className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 group font-inter"
                                >
                                  <Save className="w-5 h-5 transition-transform font-inter" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between font-inter">
                              <div className="flex items-center gap-3 text-slate-400 font-inter">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest font-inter">{a.start_date} → {a.end_date}</span>
                              </div>
                              {a.completion_percentage === 100 && (
                                <div className="flex items-center gap-2 text-emerald-500 font-inter">
                                  <CheckCircle2 className="w-4 h-4 font-inter" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest font-inter">Strategic Objective Yielded</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-inter">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4 font-inter" />
                        <h3 className="text-xl font-bold text-slate-400 tracking-tight font-inter uppercase">Field Registry Exhausted</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 font-inter">No active items requiring immediate execution logs discovered.</p>
                      </div>
                    )}
                  </div>

                  {/* ── Pagination for Today's Logs ──────────────────────────── */}
                  {!loading && filteredTodayActivities.length > 0 && (
                    <div className="mt-6 px-6 py-4 border border-slate-100 rounded-2xl flex items-center justify-between bg-white sticky left-0 font-inter shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTodayActivities.length)} of {filteredTodayActivities.length} entries
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                          Page {currentPage} of {totalPagesToday || 1}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPagesToday, prev + 1))}
                          disabled={currentPage === totalPagesToday || totalPagesToday === 0}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center"
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
                          <th className="px-6 py-4 font-inter">Temporal Signature</th>
                          <th className="px-6 py-4 font-inter">Execution Identity</th>
                          <th className="px-6 py-4 font-inter">Intensity (Volume)</th>
                          <th className="px-6 py-4 font-inter">Narrative</th>
                          <th className="px-6 py-4 text-right font-inter">Audit Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter">
                        {paginatedHistoryEntries.length > 0 ? paginatedHistoryEntries.map((e) => {
                          const currentActivity = activitiesList.find(a => a.id === e.activity_id);
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-3 font-inter">
                                  <History className="w-3.5 h-3.5 text-slate-300 font-inter" />
                                  <span className="text-sm font-bold text-slate-800 font-inter uppercase tracking-tight">{e.entry_date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <p className="font-bold text-slate-800 text-sm font-inter leading-tight uppercase tracking-tight">
                                  {currentActivity?.activity_name || "Unknown Strategic Item"}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest font-inter">{currentActivity?.boq_code || "—"}</span>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-2 font-inter">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary font-inter" />
                                  <span className="text-sm font-bold text-primary font-inter">
                                    {e.today_progress} {currentActivity?.unit}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-xs font-bold text-slate-500 max-w-xs truncate font-inter uppercase tracking-tight">{e.remarks || "No Operational Narrative Provided"}</td>
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
                            <td colSpan={5} className="px-6 py-32 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                              No historical execution records discovered in the intelligence vault.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Pagination for Historical Logs ──────────────────────────── */}
                  {filteredHistoryEntries.length > 0 && (
                    <div className="mt-6 px-6 py-4 border border-slate-100 rounded-2xl flex items-center justify-between bg-white sticky left-0 font-inter shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredHistoryEntries.length)} of {filteredHistoryEntries.length} entries
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                          Page {currentPage} of {totalPagesAll || 1}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPagesAll, prev + 1))}
                          disabled={currentPage === totalPagesAll || totalPagesAll === 0}
                          className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center"
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
