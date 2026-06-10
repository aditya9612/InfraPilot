import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
  Plus,
  Calendar,
  AlertCircle,
  Search,
  RotateCcw,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2
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

  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'delay'>('today');
  const [delayActivities, setDelayActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedToday, setHasLoadedToday] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [todayActivities, setTodayActivities] = useState<DailyEntry[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]); // for dropdown
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Delayed" | "Completed" | "Momentum">("All");

  // Input states for Tab 1 cards


  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


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
      const entries = await workProgressService.listDailyEntries();
      setTodayActivities(entries);
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

  const loadDelayReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workProgressService.getDelayReport();
      setDelayActivities(res?.data || []);
    } catch (err) {
      console.error("Load Delay Error:", err);
      toast.error("Failed to load delay report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    if (activeTab === 'today') {
      loadTodayProgress();
    } else if (activeTab === 'all') {
      loadAllEntries();
    } else if (activeTab === 'delay') {
      loadDelayReport();
    }
  }, [activeTab, loadTodayProgress, loadAllEntries, loadDelayReport]);

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
      if (activeTab === 'today') {
        loadTodayProgress();
      } else {
        loadAllEntries();
      }
    } catch (err) {
      toast.error("Failed to update entry");
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    setIsDeleting(true);
    try {
      await workProgressService.deleteDailyEntry(deleteEntryId);
      toast.success("Entry deleted successfully!");
      setIsDeleteModalOpen(false);
      loadActivities();
      if (activeTab === 'today') {
        loadTodayProgress();
      } else {
        loadAllEntries();
      }
    } catch (err) {
      toast.error("Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const baseTodayActivities = useMemo(() => {
    return todayActivities.filter(e => {
      const a = activitiesList.find(act => act.id === e.activity_id);
      return searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [todayActivities, searchTerm, activitiesList]);

  const filteredTodayActivities = useMemo(() => {
    let data = baseTodayActivities;

    if (activeStatFilter === "Delayed") {
      data = data.filter(e => {
        const a = activitiesList.find(act => act.id === e.activity_id);
        return a?.status === "Delay" || a?.status === "DELAY";
      });
    } else if (activeStatFilter === "Completed") {
      data = data.filter(e => Number(e.today_progress) >= 100);
    }

    return data;
  }, [baseTodayActivities, activeStatFilter, activitiesList]);

  const baseHistoryEntries = useMemo(() => {
    let list = allEntries;

    if (selectedActivityId !== "all") {
      list = list.filter(e => e.activity_id === Number(selectedActivityId));
    }

    if (filterDate) {
      list = list.filter(e => e.entry_date === filterDate);
    }

    return list.filter(e => {
      const activity = activitiesList.find(a => a.id === e.activity_id);
      const activityName = activity?.activity_name.toLowerCase() || "";
      const boqCode = String(activity?.boq_code || "").toLowerCase();
      return searchTerm === "" || activityName.includes(searchTerm.toLowerCase()) || boqCode.includes(searchTerm.toLowerCase());
    });
  }, [allEntries, activitiesList, searchTerm, selectedActivityId, filterDate]);

  const filteredHistoryEntries = useMemo(() => {
    let list = baseHistoryEntries;

    if (activeStatFilter === "Delayed") {
      list = list.filter(e => {
        return e.new_value?.status?.toLowerCase() === "delay";
      });
    } else if (activeStatFilter === "Completed") {
      list = list.filter(e => {
        return Number(e.new_value?.today_progress) >= 100;
      });
    }

    return list;
  }, [baseHistoryEntries, activeStatFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'delay') {
      return { total: delayActivities.length, yieldRate: '0%', completed: 0, delayed: delayActivities.length, momentum: '0' };
    }

    if (activeTab === 'today') {
      const list = baseTodayActivities;
      const total = list.length;

      const delayedCount = list.filter(e => {
        const a = activitiesList.find(act => act.id === e.activity_id);
        return a?.status === "Delay" || a?.status === "DELAY";
      }).length;

      const completedCount = list.filter(e => {
        return Number(e.today_progress) >= 100;
      }).length;

      const yieldRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const totalProgress = list.reduce((sum, e) => sum + (Number(e.today_progress) || 0), 0);

      return {
        total,
        completed: completedCount,
        delayed: delayedCount,
        yieldRate: `${yieldRate}%`,
        momentum: `${totalProgress}`
      };
    } else {
      const list = baseHistoryEntries;
      const total = list.length;
      const completed = list.filter(e => {
        return Number(e.new_value?.today_progress) >= 100;
      }).length;
      const delayed = list.filter(e => e.new_value?.status?.toLowerCase() === "delay").length;
      const yieldRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const totalProgress = list.reduce((sum, e) => sum + (Number(e.new_value?.today_progress) || 0), 0);

      return {
        total,
        completed,
        delayed,
        yieldRate: `${yieldRate}%`,
        momentum: `${totalProgress}`
      };
    }
  }, [activeTab, baseTodayActivities, baseHistoryEntries, delayActivities, activitiesList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterDate, selectedActivityId, activeStatFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTodayEntries = filteredTodayActivities.slice(startIndex, endIndex);
  const paginatedHistoryEntries = filteredHistoryEntries.slice(startIndex, endIndex);
  const paginatedDelayActivities = delayActivities.slice(startIndex, endIndex);
  const totalPages = Math.ceil((activeTab === 'today' ? filteredTodayActivities.length : activeTab === 'delay' ? delayActivities.length : filteredHistoryEntries.length) / itemsPerPage);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDate(""); // Clear date to show all history
    setSelectedActivityId("all");
    setActiveStatFilter("All");
  };



  return (
    <>
      <Navbar title="Daily Work Progress" breadcrumb={["Engineer", "Work Progress", "Daily Progress"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Daily Work Progress
            </h1>
            <p className="text-slate-500 text-sm">
              Log and track daily execution activities on site.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'today' && (
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Daily Progress
              </button>
            )}
          </div>
        </div>

        {/* ─── Interactive Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Total Logs",
              value: stats.total.toString(),
              sub: "Entries Displayed",
              accent: "text-slate-800",
              status: "All",
            },
            {
              title: "Finished Logs",
              value: stats.completed.toString(),
              sub: "100% Progress Reached",
              accent: "text-emerald-500",
              status: "Completed",
            },
            {
              title: "Delayed Logs",
              value: stats.delayed.toString(),
              sub: "Critical Items",
              accent: "text-rose-500",
              status: "Delayed",
            },
          ].map((s) => (
            <div
              key={s.title}
              onClick={() => setActiveStatFilter(s.status as any)}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group ${activeStatFilter === s.status ? "ring-2 ring-primary/20" : ""}`}
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                {s.title}
              </p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                {s.sub}
              </p>
            </div>
          ))}
        </div>


        {/* â”€â”€ Scrollable Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* â”€â”€ Navigation Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex items-center gap-10 border-b border-slate-200 mb-10 font-inter">
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-5 text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'today' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Today's Progress
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-5 text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Progress History
            </button>
            <button
              onClick={() => setActiveTab('delay')}
              className={`pb-5 text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'delay' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Delayed Activities
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
                        <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-50 font-inter">
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Activity</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Date</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Progress Added</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Remarks</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Logged At</th>
                          <th className="px-6 py-4 text-right font-inter whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="py-20 text-center font-inter">
                              <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Loading Data...</p>
                            </td>
                          </tr>
                        ) : paginatedTodayEntries.length > 0 ? paginatedTodayEntries.map((e) => {
                          const currentActivity = activitiesList.find(a => a.id === e.activity_id);
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700 whitespace-nowrap">
                                {currentActivity?.activity_name || "-"}
                                {currentActivity?.boq_code && <span className="block text-xs font-medium text-slate-400 mt-1">{currentActivity.boq_code}</span>}
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">{e.entry_date}</td>
                              <td className="px-6 py-6 font-inter">
                                <span className="text-sm font-bold text-primary">{e.today_progress} {currentActivity?.unit || ""}</span>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600 max-w-[200px] truncate" title={e.remarks}>{e.remarks || "-"}</td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">{e.created_at ? new Date(e.created_at).toLocaleString() : "-"}</td>
                              <td className="px-6 py-6 font-inter text-right">
                                <div className="flex items-center justify-end gap-3 font-inter">
                                  <button
                                    onClick={() => { setSelectedEntry(e); setIsEditModalOpen(true); }}
                                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 font-inter"
                                    title="Edit Entry"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => { setDeleteEntryId(e.id); setIsDeleteModalOpen(true); }}
                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 font-inter"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-20 text-center font-inter bg-slate-50 border-dashed border border-slate-200 rounded-2xl">
                              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4 font-inter" />
                              <h3 className="text-xl font-bold text-slate-400 tracking-tight font-inter uppercase">Field Registry Exhausted</h3>
                              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 font-inter">No execution logs discovered for today.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* â”€â”€ Pagination for Today's Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {!loading && (activeTab === 'today' ? todayActivities.length : activeTab === 'delay' ? delayActivities.length : filteredHistoryEntries.length) > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                      {/* Left: Items per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, (activeTab === 'today' ? filteredTodayActivities.length : activeTab === 'delay' ? delayActivities.length : filteredHistoryEntries.length))} of {(activeTab === 'today' ? filteredTodayActivities.length : activeTab === 'delay' ? delayActivities.length : filteredHistoryEntries.length)} records
                      </div>

                      {/* Right: Pagination */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                          const totalItems = (activeTab === 'today' ? filteredTodayActivities.length : activeTab === 'delay' ? delayActivities.length : filteredHistoryEntries.length);
                          const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                          const pages = [];
                          if (totalPages <= 5) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            if (currentPage <= 3) {
                              pages.push(1, 2, 3, 4, '...', totalPages);
                            } else if (currentPage >= totalPages - 2) {
                              pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                            } else {
                              pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                            }
                          }

                          return pages.map((page, index) => {
                            if (page === '...') {
                              return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                            }
                            const pageNum = page;
                            const isActive = currentPage === pageNum;
                            return (
                              <button
                                key={`page-${pageNum}`}
                                onClick={() => setCurrentPage(pageNum as number)}
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
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === Math.max(1, totalPages) || (activeTab === 'today' ? filteredTodayActivities.length : activeTab === 'delay' ? delayActivities.length : filteredHistoryEntries.length) === 0}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : activeTab === 'all' ? (
                <>
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                    <table className="w-full text-left font-inter min-w-[1200px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-50 font-inter">
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Date & Time</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Activity</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Status</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Progress Added</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Total Completed</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Action Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter">
                        {paginatedHistoryEntries.length > 0 ? paginatedHistoryEntries.map((e, index) => {
                          const currentActivity = activitiesList.find(a => a.id === e.activity_id) || activitiesList[index % activitiesList.length];
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">
                                {e.created_at ? new Date(e.created_at).toLocaleString() : e.entry_date || "-"}
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700 whitespace-nowrap">
                                {currentActivity?.activity_name || "-"}
                                {currentActivity?.boq_code && <span className="block text-xs font-medium text-slate-400 mt-1">{currentActivity.boq_code}</span>}
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[e.new_value?.status || ""] || "bg-rose-50 text-rose-600"} font-inter`}>
                                  {e.new_value?.status || "DELAY"}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-2 font-inter">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary font-inter" />
                                  <span className="text-sm font-bold text-primary font-inter">
                                    {e.new_value?.today_progress || 0} {currentActivity?.unit || ""}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700">
                                {e.new_value?.total_completed || 0} {currentActivity?.unit || ""}
                              </td>
                              <td className="px-6 py-6 font-inter text-xs font-bold text-slate-500 uppercase tracking-tight">
                                {e.action || "DAILY_PROGRESS_UPDATE"}
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-32 text-center text-slate-400 font-medium text-sm font-inter">
                              No history records found for the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* â”€â”€ Pagination for Historical Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {filteredHistoryEntries.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                      {/* Left: Items per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredHistoryEntries.length)} of {filteredHistoryEntries.length} records
                      </div>

                      {/* Right: Pagination */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                          const totalItems = filteredHistoryEntries.length;
                          const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                          const pages = [];
                          if (totalPages <= 5) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            if (currentPage <= 3) {
                              pages.push(1, 2, 3, 4, '...', totalPages);
                            } else if (currentPage >= totalPages - 2) {
                              pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                            } else {
                              pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                            }
                          }

                          return pages.map((page, index) => {
                            if (page === '...') {
                              return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                            }
                            const pageNum = page;
                            const isActive = currentPage === pageNum;
                            return (
                              <button
                                key={`page-${pageNum}`}
                                onClick={() => setCurrentPage(pageNum as number)}
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
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredHistoryEntries.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.max(1, Math.ceil(filteredHistoryEntries.length / itemsPerPage)) || filteredHistoryEntries.length === 0}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
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
                    <table className="w-full text-left font-inter min-w-[1500px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-50 font-inter">
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Activity</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Status</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Progress (%)</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Completed / Planned</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Remaining</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Start Date</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">End Date</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">Reported On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter">
                        {paginatedDelayActivities.length > 0 ? paginatedDelayActivities.map((e: any) => {
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700 whitespace-nowrap">{e.activity_name || "-"}</td>
                              <td className="px-6 py-6 font-inter">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-rose-50 text-rose-600 font-inter">
                                  {e.status || "DELAY"}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">
                                <span className="text-sm font-bold text-primary">{e.completion_percentage || 0}%</span>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">
                                {e.total_completed || 0} / {e.planned_quantity || 0} <span className="text-xs text-slate-400">{e.unit || ""}</span>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">
                                {e.remaining_quantity || 0} <span className="text-xs text-slate-400">{e.unit || ""}</span>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">{e.start_date || "-"}</td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">{e.end_date || "-"}</td>
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">{e.created_at ? new Date(e.created_at).toLocaleDateString() : "-"}</td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-32 text-center text-slate-400 font-medium text-sm font-inter">
                              No delayed activities found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Pagination for Delay Logs ─────────────────────────────── */}
                  {delayActivities.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                      {/* Left: Items per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, delayActivities.length)} of {delayActivities.length} records
                      </div>

                      {/* Right: Pagination */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                          const totalItems = delayActivities.length;
                          const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                          const pages = [];
                          if (totalPages <= 5) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            if (currentPage <= 3) {
                              pages.push(1, 2, 3, 4, '...', totalPages);
                            } else if (currentPage >= totalPages - 2) {
                              pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                            } else {
                              pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                            }
                          }

                          return pages.map((page, index) => {
                            if (page === '...') {
                              return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                            }
                            const pageNum = page;
                            const isActive = currentPage === pageNum;
                            return (
                              <button
                                key={`page-${pageNum}`}
                                onClick={() => setCurrentPage(pageNum as number)}
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
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(delayActivities.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.max(1, Math.ceil(delayActivities.length / itemsPerPage)) || delayActivities.length === 0}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEntry}
        title="Delete Daily Entry"
        message="Are you sure you want to delete this progress entry? This action is permanent and cannot be undone."
        confirmText="Delete Entry"
        type="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default DailyProgressEntryPage;
