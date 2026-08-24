import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";
import {
  Plus,
  Calendar,
  AlertCircle,
  Search,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { workProgressService } from "../../../services/workProgressService";
import { projectService } from "../../../services/projectService";
import type { ActivityItem, DailyEntry } from "../../../types/workProgress";
import { useProject } from "../../../context/ProjectContext";


// Modular Components
import LogProgressModal from "../../../components/WorkProgress/LogProgressModal";
import EditDailyEntryModal from "../../../components/WorkProgress/EditDailyEntryModal";
import ConfirmModal from "../../../components/common/ConfirmModal";


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
  const { selectedProjectId, setSelectedProjectId } = useProject();
  const projectId = selectedProjectId || 0;

  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    // Fetch projects for the dropdown
    projectService.getProjects(100, 0).then((data: any) => {
      const list = Array.isArray(data) ? data : (data.items || data.data || []);
      setProjectsList(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id || list[0].project_id);
      }
    }).catch(() => { });
  }, [selectedProjectId, setSelectedProjectId]);

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'summary' | 'history' | 'delay'>('all');
  const [delayActivities, setDelayActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedToday, setHasLoadedToday] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [todayActivities, setTodayActivities] = useState<DailyEntry[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]); // for dropdown
  const [projectSummary, setProjectSummary] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeStatFilter, setActiveStatFilter] = useState("All Logs");

  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'today') setActiveStatFilter("All Logs");
    else if (activeTab === 'history') setActiveStatFilter("All History");
    else if (activeTab === 'delay') setActiveStatFilter("All Delayed");
  }, [activeTab]);

  // Input states for Tab 1 cards

  // Input states for Tab 1 cards


  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
  const [isDeleteEntryModalOpen, setIsDeleteEntryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);


  const loadActivities = useCallback(async () => {
    try {
      const data = await workProgressService.listActivities(projectId || 0, undefined, 100, 0);
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
      const res = await workProgressService.getTodayProgress(engineer_id, projectId || undefined);
      const entries = res?.data || res || [];
      setTodayActivities(entries as DailyEntry[]);
      setAllEntries(entries as DailyEntry[]);
      setHasLoadedToday(true);
    } catch (err) {
      toast.error("Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  }, [engineer_id, hasLoadedToday, projectId]);

  const loadAllEntries = useCallback(async () => {
    try {
      if (!hasLoadedAll) {
        setLoading(true);
      }
      const res = await workProgressService.listDailyEntries(undefined, undefined, projectId || undefined);
      setAllEntries(res || []);
      setHasLoadedAll(true);
    } catch (err) {
      console.error("Load Entries Error:", err);
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  }, [hasLoadedAll, projectId]);

  const loadActivityHistory = useCallback(async () => {
    try {
      if (!hasLoadedHistory) setLoading(true);
      const activityId = selectedActivityId === "all"
        ? undefined
        : Number(selectedActivityId);
      const res = await workProgressService.getActivityHistory(activityId, projectId);
      const rawHistory = res?.history || res?.data || (Array.isArray(res) ? res : []);
      
      const normalizedHistory = rawHistory.map((item: any) => ({
        ...item,
        activity_id: item.activity_id || activityId,
        action: item.action || "DAILY_PROGRESS_UPDATE",
        new_value: item.new_value || {
          status: item.status || "ON_TRACK",
          today_progress: item.today_progress || 0,
          total_completed: item.running_total || item.total_completed || 0
        }
      }));
      
      setActivityHistory(normalizedHistory);
      setHasLoadedHistory(true);
    } catch (err) {
      console.error("Load History Error:", err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [hasLoadedHistory, selectedActivityId, projectId]);

  const loadDelayReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workProgressService.getDelayReport(projectId || undefined);
      const data = res?.data || [];
      const filtered = data.filter((a: any) => a.project_id === undefined || String(a.project_id) === String(projectId || 0));
      setDelayActivities(filtered);
    } catch (err) {
      console.error("Load Delay Error:", err);
      toast.error("Failed to load delay report");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadProjectSummary = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await workProgressService.getProjectSummary(projectId);
      setProjectSummary(res);
    } catch (err) {
      console.error("Load Project Summary Error", err);
    }
  }, [projectId]);

  useEffect(() => {
    loadActivities();
    loadProjectSummary();
  }, [loadActivities, loadProjectSummary]);

  useEffect(() => {
    if (activeTab === 'today') {
      loadTodayProgress();
    } else if (activeTab === 'all') {
      loadAllEntries();
    } else if (activeTab === 'history') {
      loadActivityHistory();
    } else if (activeTab === 'delay') {
      loadDelayReport();
    } else if (activeTab === 'summary') {
      loadProjectSummary();
    }
  }, [activeTab, loadTodayProgress, loadAllEntries, loadActivityHistory, loadDelayReport, loadProjectSummary, projectId]);

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

  const handleEditEntrySubmit = async (id: number, data: { today_progress: number; remarks: string }) => {
    try {
      await workProgressService.updateDailyEntry(id, data);
      toast.success("Daily entry updated successfully!");
      setIsEditEntryModalOpen(false);
      loadActivities();
      if (activeTab === 'today') loadTodayProgress();
      else loadAllEntries();
    } catch (err) {
      toast.error("Failed to update daily entry");
    }
  };

  const handleDeleteEntrySubmit = async () => {
    if (!deleteEntryId) return;
    try {
      await workProgressService.deleteDailyEntry(deleteEntryId);
      toast.success("Daily entry deleted successfully!");
      setIsDeleteEntryModalOpen(false);
      loadActivities();
      if (activeTab === 'today') loadTodayProgress();
      else loadAllEntries();
    } catch (err) {
      toast.error("Failed to delete daily entry");
    }
  };



  const baseTodayActivities = useMemo(() => {
    return todayActivities.filter(e => {
      const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id));
      const matchesSearch = searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.activity_id) === String(selectedActivityId);
      const matchesStatus = statusFilter === "all" || (a?.status || "Not Started").toUpperCase().replace(/ /g, "_") === statusFilter.toUpperCase().replace(/ /g, "_");
      return matchesSearch && matchesActivity && matchesStatus;
    });
  }, [todayActivities, searchTerm, activitiesList, selectedActivityId, statusFilter]);

  const filteredTodayActivities = useMemo(() => {
    if (activeStatFilter === "All Logs") return baseTodayActivities;
    return baseTodayActivities.filter(e => {
      const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id));
      const s = (a?.status || "Not Started").toLowerCase().replace("_", " ");
      if (activeStatFilter === "On Track Logs") return s === "on track";
      if (activeStatFilter === "Completed Logs") return s === "completed";
      if (activeStatFilter === "Delayed Logs") return s === "delay";
      return true;
    });
  }, [baseTodayActivities, activeStatFilter, activitiesList]);

  const baseAllEntries = useMemo(() => {
    let list = allEntries;
    if (filterDate) {
      list = list.filter(e => e.entry_date === filterDate);
    }
    return list.filter(e => {
      const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id));
      const matchesSearch = searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.activity_id) === String(selectedActivityId);
      const matchesStatus = statusFilter === "all" || (a?.status || "Not Started").toUpperCase().replace(/ /g, "_") === statusFilter.toUpperCase().replace(/ /g, "_");
      return matchesSearch && matchesActivity && matchesStatus;
    });
  }, [allEntries, filterDate, searchTerm, activitiesList, selectedActivityId, statusFilter]);

  const filteredAllEntries = useMemo(() => {
    if (activeStatFilter === "All Logs") return baseAllEntries;
    return baseAllEntries.filter(e => {
      const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id));
      const s = (a?.status || "Not Started").toLowerCase().replace("_", " ");
      if (activeStatFilter === "On Track Logs") return s === "on track";
      if (activeStatFilter === "Completed Logs") return s === "completed";
      if (activeStatFilter === "Delayed Logs") return s === "delay";
      return true;
    });
  }, [baseAllEntries, activeStatFilter, activitiesList]);

  const baseHistoryEntries = useMemo(() => {
    let list = activityHistory;
    if (filterDate) {
      list = list.filter(e => {
        const d = new Date(e.created_at);
        if (isNaN(d.getTime())) return true;
        return d.toISOString().split('T')[0] === filterDate;
      });
    }
    return list.filter(e => {
      const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id));
      const matchesSearch = searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.activity_id) === String(selectedActivityId);
      const entryStatus = e.new_value?.status || a?.status || "DELAY";
      const matchesStatus = statusFilter === "all" || entryStatus.toUpperCase().replace(/ /g, "_") === statusFilter.toUpperCase().replace(/ /g, "_");
      return matchesSearch && matchesActivity && matchesStatus;
    });
  }, [activityHistory, filterDate, searchTerm, activitiesList, selectedActivityId, statusFilter]);

  const filteredHistoryEntries = useMemo(() => {
    if (activeStatFilter === "All History") return baseHistoryEntries;
    return baseHistoryEntries.filter(e => {
      if (activeStatFilter === "Progress Updates") return Number(e.new_value?.today_progress) > 0;
      if (activeStatFilter === "Status Changes") return e.action === "STATUS_CHANGE" || (e.new_value?.status && e.new_value.status !== e.old_value?.status);
      return true;
    });
  }, [baseHistoryEntries, activeStatFilter]);

  const filteredDelayActivities = useMemo(() => {
    let list = delayActivities;
    list = list.filter(e => {
      const matchesSearch = searchTerm === "" ||
        e.activity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.boq_code && String(e.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
    if (activeStatFilter === "All Delayed") return list;
    return list.filter(e => {
      const p = Number(e.completion_percentage || 0);
      if (activeStatFilter === "Critical (< 25%)") return p < 25;
      if (activeStatFilter === "Moderate (25% - 75%)") return p >= 25 && p <= 75;
      if (activeStatFilter === "Almost Done (> 75%)") return p > 75;
      return true;
    });
  }, [delayActivities, activeStatFilter, searchTerm, selectedActivityId, statusFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'delay') {
      return { total: delayActivities.length, yieldRate: '0%', completed: 0, delayed: delayActivities.length, momentum: '0' };
    }

    if (activeTab === 'today') {
      const list = baseTodayActivities;
      const total = list.length;

      const delayedCount = list.filter(e => {
        const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id));
        return a?.status?.toLowerCase().includes("delay");
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
      const delayed = list.filter(e => e.new_value?.status?.toLowerCase().includes("delay")).length;
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
  }, [activeTab, searchTerm, filterDate, selectedActivityId]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTodayEntries = filteredTodayActivities.slice(startIndex, endIndex);
  const paginatedAllEntries = filteredAllEntries.slice(startIndex, endIndex);
  const paginatedHistoryEntries = filteredHistoryEntries.slice(startIndex, endIndex);
  const paginatedDelayActivities = filteredDelayActivities.slice(startIndex, endIndex);

  const getCurrentListLength = () => {
    switch (activeTab) {
      case 'today': return filteredTodayActivities.length;
      case 'all': return filteredAllEntries.length;
      case 'history': return filteredHistoryEntries.length;
      case 'delay': return filteredDelayActivities.length;
      default: return 0;
    }
  };

  const totalPages = Math.ceil(getCurrentListLength() / itemsPerPage);

  const renderStatCards = () => {
    let cards: any[] = [];
    if (activeTab === 'all' || activeTab === 'today') {
      const base = activeTab === 'today' ? baseTodayActivities : baseAllEntries;
      cards = [
        { label: "All Logs", count: base.length, colorClass: "text-slate-800", sub: "Total Entries" },
        { label: "On Track Logs", count: base.filter(e => { const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id)); return (a?.status || "").toLowerCase().replace("_", " ") === "on track"; }).length, colorClass: "text-blue-500", sub: "Performing as expected" },
        { label: "Completed Logs", count: base.filter(e => { const a = activitiesList.find(act => Number(act.id) === Number(e.activity_id)); return (a?.status || "").toLowerCase() === "completed"; }).length, colorClass: "text-emerald-500", sub: "100% Progress" }
      ];
    } else if (activeTab === 'history') {
      cards = [
        { label: "All History", count: baseHistoryEntries.length, colorClass: "text-slate-800", sub: "Complete Log" },
        { label: "Progress Updates", count: baseHistoryEntries.filter(e => Number(e.new_value?.today_progress) > 0).length, colorClass: "text-blue-500", sub: "Actual Progress Added" },
        { label: "Status Changes", count: baseHistoryEntries.filter(e => e.action === "STATUS_CHANGE" || (e.new_value?.status && e.new_value.status !== e.old_value?.status)).length, colorClass: "text-amber-500", sub: "Lifecycle Events" }
      ];
    } else if (activeTab === 'delay') {
      cards = [
        { label: "All Delayed", count: delayActivities.length, colorClass: "text-rose-500", sub: "Total Delayed" },
        { label: "Critical (< 25%)", count: delayActivities.filter(e => Number(e.completion_percentage || 0) < 25).length, colorClass: "text-red-600", sub: "High Risk" },
        { label: "Moderate (25% - 75%)", count: delayActivities.filter(e => Number(e.completion_percentage || 0) >= 25 && Number(e.completion_percentage || 0) <= 75).length, colorClass: "text-amber-500", sub: "At Risk" },
        { label: "Almost Done (> 75%)", count: delayActivities.filter(e => Number(e.completion_percentage || 0) > 75).length, colorClass: "text-emerald-500", sub: "Near Completion" }
      ];
    }

    if (cards.length === 0) return null;

    return (
      <div className={`grid grid-cols-1 ${cards.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-8 font-inter`}>
        {cards.map(c => (
          <div
            key={c.label}
            onClick={() => {
              setActiveStatFilter(c.label);
              setCurrentPage(1);
            }}
            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group ${activeStatFilter === c.label ? "ring-2 ring-primary/20" : ""}`}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors font-inter">
              {c.label}
            </p>
            <p className={`text-2xl font-bold font-inter ${c.colorClass}`}>{c.count}</p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">
              {c.sub}
            </p>
          </div>
        ))}
      </div>
    );
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
            {activeTab === 'all' && (
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

        {renderStatCards()}

        {/* ─── Navigation Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-8 border-b border-slate-200 mb-8 font-inter px-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ALL DAILY ENTRIES
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'today' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            TODAY'S PROGRESS
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            PROJECT SUMMARY
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ACTIVITY HISTORY
          </button>
          <button
            onClick={() => setActiveTab('delay')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'delay' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            DELAY REPORT
          </button>
        </div>

        <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* ─── Registry Container ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
            {/* Integrated Filter Bar */}
            {activeTab !== 'summary' && (
              <div className="p-4 border-b border-slate-50 flex flex-row items-center gap-4 bg-white font-inter flex-nowrap overflow-x-auto overflow-y-hidden scrollbar-none w-full">

                {/* 1. Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-md font-inter shrink-0">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by activity ref or BOQ identity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                  />
                </div>

                {/* 2. Date Filter */}
                {activeTab === 'all' && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm font-inter shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter w-[95px]"
                    />
                  </div>
                )}

                {/* 3. Project Filter */}
                <div className="flex items-center gap-2 font-inter shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden xl:inline-block">Project:</span>
                  <select
                    value={projectId || ""}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest font-inter shadow-sm max-w-[150px] truncate"
                  >
                    <option value="">ALL PROJECTS</option>
                    {projectsList.map(p => (
                      <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.name || p.project_name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. All Activity Filter */}
                {(activeTab === 'all' || activeTab === 'history') && (
                  <div className="flex items-center gap-2 font-inter shrink-0">
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm max-w-[130px] truncate"
                    >
                      <option value="all">ALL ACTIVITIES</option>
                      {activitiesList.map(a => (
                        <option key={a.id} value={a.id}>{a.activity_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 5. Status Filter */}
                {(activeTab === 'all' || activeTab === 'history') && (
                  <div className="flex items-center gap-2 font-inter shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm max-w-[130px] truncate"
                    >
                      <option value="all">ALL STATUS</option>
                      <option value="ON_TRACK">ON TRACK</option>
                      <option value="DELAY">DELAY</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                )}

              </div>
            )}

            <div className="flex-1 overflow-auto p-10 font-inter scrollbar-thin scrollbar-thumb-slate-200">
              {activeTab === 'summary' && (
                <div className="flex flex-col gap-8">
                  {/* Project Details */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 font-inter">Project Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 font-inter tracking-widest uppercase">Project Name</p>
                        <p className="text-2xl font-bold text-slate-800 font-inter truncate">
                          {projectSummary?.project?.project_name || "N/A"}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 font-inter tracking-widest uppercase">Overall Progress</p>
                        <p className="text-2xl font-bold text-primary font-inter">
                          {projectSummary?.summary?.overall_progress_percentage || projectSummary?.completion_percentage || "0"}%
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 font-inter tracking-widest uppercase">Avg Activity Progress</p>
                        <p className="text-2xl font-bold text-emerald-600 font-inter">
                          {projectSummary?.summary?.average_activity_progress || "0"}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 font-inter">Activity Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { title: "TOTAL", value: projectSummary?.summary?.total_activities || projectSummary?.total_activities || stats.total.toString(), accent: "text-slate-800", bg: "bg-slate-50", border: "border-slate-200" },
                        { title: "COMPLETED", value: projectSummary?.summary?.completed_activities || projectSummary?.completed_activities || stats.completed.toString(), accent: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                        { title: "ON TRACK", value: projectSummary?.summary?.on_track_activities || projectSummary?.on_track_activities || "0", accent: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                        { title: "DELAYED", value: projectSummary?.summary?.delayed_activities || projectSummary?.delayed_activities || stats.delayed.toString(), accent: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
                        { title: "NOT STARTED", value: projectSummary?.summary?.not_started_activities || projectSummary?.not_started_activities || "0", accent: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
                      ].map((s) => (
                        <div key={s.title} className={`${s.bg} border ${s.border} rounded-xl p-5 transition-all hover:shadow-md`}>
                          <p className="text-[10px] font-bold text-slate-500 mb-1 font-inter uppercase tracking-widest">{s.title}</p>
                          <p className={`text-3xl font-bold ${s.accent} font-inter`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Stats */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 font-inter">Quantity Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: "PLANNED QUANTITY", value: projectSummary?.summary?.planned_quantity || "0.00", icon: "📦" },
                        { title: "COMPLETED QUANTITY", value: projectSummary?.summary?.completed_quantity || "0.00", icon: "✅" },
                        { title: "REMAINING QUANTITY", value: projectSummary?.summary?.remaining_quantity || "0.00", icon: "⏳" },
                      ].map((s) => (
                        <div key={s.title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 mb-1 font-inter tracking-widest uppercase">{s.title}</p>
                            <p className="text-2xl font-bold text-slate-800 font-inter">{s.value}</p>
                          </div>
                          <div className="text-4xl opacity-80">{s.icon}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'today' || activeTab === 'all') && (
                <>
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                    <table className="w-full text-left font-inter min-w-[1200px]">
                      <thead>
                        <tr className="bg-white text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 font-inter">
                          <th className="px-6 py-4 font-inter whitespace-nowrap">ACTIVITY</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">DATE</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">PROGRESS ADDED</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">REMARKS</th>
                          <th className="px-6 py-4 font-inter whitespace-nowrap">LOGGED AT</th>
                          {activeTab === 'all' && <th className="px-6 py-4 font-inter whitespace-nowrap text-right">ACTIONS</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-inter bg-white">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-20 text-center font-inter">
                              <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Loading Data...</p>
                            </td>
                          </tr>
                        ) : (activeTab === 'today' ? paginatedTodayEntries : paginatedAllEntries).length > 0 ? (activeTab === 'today' ? paginatedTodayEntries : paginatedAllEntries).map((e) => {
                          const currentActivity = activitiesList.find(a => Number(a.id) === Number(e.activity_id));
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-[13px] font-bold text-slate-700 whitespace-nowrap">
                                {currentActivity?.activity_name || "-"}
                                {currentActivity?.boq_code && <span className="block text-[11px] font-medium text-slate-400 mt-1">{currentActivity.boq_code}</span>}
                              </td>
                              <td className="px-6 py-6 font-inter text-[13px] font-medium text-slate-600">
                                {currentActivity?.start_date ? new Date(currentActivity.start_date).toLocaleDateString() : "-"}
                              </td>
                              <td className="px-6 py-6 font-inter text-[13px] font-bold text-blue-600">
                                {e.today_progress} {currentActivity?.unit || ""}
                              </td>
                              <td className="px-6 py-6 font-inter text-[13px] font-medium text-slate-600 max-w-[250px] truncate" title={e.remarks || (e as any).remark || (e as any).notes}>{e.remarks || (e as any).remark || (e as any).notes || "-"}</td>
                              <td className="px-6 py-6 font-inter text-[13px] font-medium text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleString() : "-"}</td>
                              {activeTab === 'all' && (
                                <td className="px-6 py-6 font-inter">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => { setSelectedEntry(e); setIsEditEntryModalOpen(true); }}
                                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                      title="Edit Entry"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => { setDeleteEntryId(e.id); setIsDeleteEntryModalOpen(true); }}
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                      title="Delete Entry"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center font-inter bg-slate-50 border-dashed border border-slate-200 rounded-2xl">
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
                  {!loading && (activeTab === 'today' ? filteredTodayActivities.length : filteredAllEntries.length) > 0 && (
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
                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, (activeTab === 'today' ? filteredTodayActivities.length : filteredAllEntries.length))} of {(activeTab === 'today' ? filteredTodayActivities.length : filteredAllEntries.length)} records
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
                          const totalItems = (activeTab === 'today' ? filteredTodayActivities.length : filteredAllEntries.length);
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
                          disabled={currentPage === Math.max(1, totalPages) || (activeTab === 'today' ? filteredTodayActivities.length : filteredAllEntries.length) === 0}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'history' && (
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
                          const currentActivity = activitiesList.find(a => Number(a.id) === Number(e.activity_id)) || activitiesList[index % activitiesList.length];
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
              )}
              {activeTab === 'delay' && (
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
                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary' : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'}`}
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
        isOpen={isEditEntryModalOpen}
        onClose={() => setIsEditEntryModalOpen(false)}
        onSubmit={handleEditEntrySubmit}
        entry={selectedEntry}
      />

      <ConfirmModal
        isOpen={isDeleteEntryModalOpen}
        onClose={() => setIsDeleteEntryModalOpen(false)}
        onConfirm={handleDeleteEntrySubmit}
        title="Delete Daily Entry"
        message="Are you sure you want to delete this daily progress entry? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default DailyProgressEntryPage;

