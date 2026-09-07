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
import { useProject } from "../../../context/ProjectContext";
import { workProgressService } from "../../../services/workProgressService";
import { userService } from "../../../services/userService";
import type { ActivityItem, DailyEntry } from "../../../types/workProgress";


// Modular Components
import LogProgressModal from "../../../components/WorkProgress/LogProgressModal";
import EditDailyEntryModal from "../../../components/WorkProgress/EditDailyEntryModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import ProjectSelector from "../../../components/common/ProjectSelector";


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
  const engineer_id = user?.id ? Number(user.id) : undefined;
  const { selectedProjectId: projectId } = useProject();

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'summary' | 'history' | 'delay' | 'logs'>('all');
  const [delayActivities, setDelayActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedToday, setHasLoadedToday] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [todayActivities, setTodayActivities] = useState<DailyEntry[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);

  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]); // for dropdown
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const [projectSummary, setProjectSummary] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");
  const [activeStatFilter, setActiveStatFilter] = useState("All Logs");
  const [delayStatusFilter, setDelayStatusFilter] = useState("all");

  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'today') setActiveStatFilter("All Logs");
    else if (activeTab === 'history') setActiveStatFilter("All History");
    else if (activeTab === 'delay') setActiveStatFilter("All Delayed");
  }, [activeTab]);

  // Reset loaded states when project changes
  useEffect(() => {
    setHasLoadedToday(false);
    setHasLoadedAll(false);
    setHasLoadedHistory(false);
    setSelectedActivityId("all");
    setTodayActivities([]);
    setAllEntries([]);
    setActivityHistory([]);
    setDelayActivities([]);
    setGlobalLogs([]);
    setProjectSummary(null);
  }, [projectId]);

  // Input states for Tab 1 cards

  // Input states for Tab 1 cards


  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
  const [isDeleteEntryModalOpen, setIsDeleteEntryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);


  const loadActivities = useCallback(async () => {
    if (!projectId) return;
    try {
      // Backend caps limit at 100, so paginate to get all activities
      let allActivities: any[] = [];
      let offset = 0;
      const batchSize = 100;
      while (true) {
        const batch = await workProgressService.listActivities(projectId, undefined, batchSize, offset);
        if (!batch || batch.length === 0) break;
        allActivities = allActivities.concat(batch);
        if (batch.length < batchSize) break; // last page
        offset += batchSize;
      }
      const data = allActivities;
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
    if (!projectId) return;
    try {
      if (!hasLoadedToday) {
        setLoading(true);
      }
      const res = await workProgressService.getTodayProgress(engineer_id, projectId);
      let entries: any[] = [];
      if (Array.isArray(res)) entries = res;
      else if (res && Array.isArray((res as any).data)) entries = (res as any).data;
      else if (res && (res as any).data && Array.isArray((res as any).data.data)) entries = (res as any).data.data;
      else if (res && Array.isArray((res as any).progress)) entries = (res as any).progress;

      setTodayActivities(entries as DailyEntry[]);
      setHasLoadedToday(true);

      const uniqueUserIds = [...new Set(
        entries
          .map((e: any) => {
            if (e.created_by && typeof e.created_by === 'object') {
              return e.created_by.user_id || e.created_by.id;
            }
            return e.created_by || e.created_by_user_id || e.changed_by;
          })
          .filter((id: any) => id && typeof id === 'number')
      )] as number[];
      if (uniqueUserIds.length > 0) {
        const newMap: Record<number, string> = {};
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const u = await userService.getUserById(uid);
              if (u) newMap[uid] = u.full_name || u.username || `User #${uid}`;
            } catch {
              // ignore missing user entries
            }
          })
        );
        setUsersMap(prev => ({ ...prev, ...newMap }));
      }
    } catch (err) {
      toast.error("Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  }, [hasLoadedToday, projectId]);

  const loadAllEntries = useCallback(async () => {
    if (!projectId) return;
    try {
      if (!hasLoadedAll) {
        setLoading(true);
      }
      let allEntriesList: any[] = [];
      let offset = 0;
      const limit = 100;
      while (true) {
        const res = await workProgressService.listDailyEntries(undefined, undefined, projectId, limit, offset);

        let batch: any[] = [];
        if (Array.isArray(res)) batch = res;
        else if (res && Array.isArray((res as any).data)) batch = (res as any).data;
        else if (res && (res as any).data && Array.isArray((res as any).data.data)) batch = (res as any).data.data;

        if (!batch || batch.length === 0) break;
        allEntriesList = allEntriesList.concat(batch);
        if (batch.length < limit) break;
        offset += limit;
      }

      const entries = allEntriesList;
      setAllEntries(entries);
      setHasLoadedAll(true);

      // Resolve created_by IDs to names using per-user fetch (works with PM role)
      const uniqueUserIds = [...new Set(
        entries
          .map((e: any) => {
            if (e.created_by && typeof e.created_by === 'object') {
              return e.created_by.user_id || e.created_by.id;
            }
            return e.created_by || e.created_by_user_id;
          })
          .filter((id: any) => id && typeof id === 'number')
      )] as number[];
      if (uniqueUserIds.length > 0) {
        const newMap: Record<number, string> = {};
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const u = await userService.getUserById(uid);
              if (u) newMap[uid] = u.full_name || u.username || `User #${uid}`;
            } catch { /* silently skip unresolvable users */ }
          })
        );
        setUsersMap(prev => ({ ...prev, ...newMap }));
      }
    } catch (err) {
      console.error("Load Entries Error:", err);
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  }, [hasLoadedAll, projectId]);

  const loadActivityHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      if (!hasLoadedHistory) setLoading(true);

      let historyArr: any[] = [];
      if (selectedActivityId === "all") {
        // Fetch history for all activities in parallel
        const promises = activitiesList.map(a => workProgressService.getActivityHistory(a.id, projectId).catch(() => null));
        const results = await Promise.all(promises);
        results.forEach(r => {
          if (!r) return;
          let hist: any[] = [];
          if (Array.isArray(r)) hist = r;
          else if (r && Array.isArray((r as any).history)) hist = (r as any).history;
          else if (r && Array.isArray((r as any).activity)) hist = (r as any).activity;
          else if (r && Array.isArray((r as any).data)) hist = (r as any).data;
          else if (r && (r as any).data && Array.isArray((r as any).data.data)) hist = (r as any).data.data;

          if (r && (r as any).activity && (r as any).activity.id) {
            hist = hist.map((h: any) => ({ ...h, activity_id: (r as any).activity.id, activity: (r as any).activity }));
          }
          historyArr = historyArr.concat(hist);
        });
      } else {
        const r = await workProgressService.getActivityHistory(Number(selectedActivityId), projectId);
        let hist: any[] = [];
        if (Array.isArray(r)) hist = r;
        else if (r && Array.isArray((r as any).history)) hist = (r as any).history;
        else if (r && Array.isArray((r as any).activity)) hist = (r as any).activity;
        else if (r && Array.isArray((r as any).data)) hist = (r as any).data;
        else if (r && (r as any).data && Array.isArray((r as any).data.data)) hist = (r as any).data.data;

        if (r && (r as any).activity && (r as any).activity.id) {
          hist = hist.map((h: any) => ({ ...h, activity_id: (r as any).activity.id, activity: (r as any).activity }));
        }
        historyArr = hist;
      }

      // Sort by created_at descending if available
      historyArr.sort((a, b) => {
        const da = new Date(a.created_at || a.entry_date || 0).getTime();
        const db = new Date(b.created_at || b.entry_date || 0).getTime();
        return db - da;
      });

      setActivityHistory(historyArr);
      setHasLoadedHistory(true);
    } catch (err) {
      console.error("Load History Error:", err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [hasLoadedHistory, selectedActivityId, activitiesList, projectId]);

  const loadDelayReport = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await workProgressService.getDelayReport(projectId);

      let delayArr: any[] = [];
      if (Array.isArray(res)) delayArr = res;
      else if (res && Array.isArray((res as any).data)) delayArr = (res as any).data;
      else if (res && (res as any).data && Array.isArray((res as any).data.data)) delayArr = (res as any).data.data;

      setDelayActivities(delayArr);
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
  }, [loadActivities, loadProjectSummary, projectId]);

  useEffect(() => {
    if (!projectId) return;
    if (activeTab === 'today') {
      loadTodayProgress();
    } else if (activeTab === 'all') {
      loadAllEntries();
    } else if (activeTab === 'delay') {
      loadDelayReport();
    } else if (activeTab === 'history') {
      loadActivityHistory();
    } else if (activeTab === 'logs') {
      // noop
    } else if (activeTab === 'summary') {
      loadProjectSummary();
    }
  }, [activeTab, loadTodayProgress, loadAllEntries, loadDelayReport, loadActivityHistory, loadProjectSummary, projectId]);

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
      const a = activitiesList.find(act => String(act.id) === String(e.activity_id));
      // if (!a) return false; // Relaxed to allow displaying logs even if activity data is missing
      const matchesSearch = searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.activity_id) === String(selectedActivityId);
      return matchesSearch && matchesActivity;
    });
  }, [todayActivities, searchTerm, activitiesList, selectedActivityId]);

  const filteredTodayActivities = useMemo(() => {
    if (activeStatFilter === "All Logs") return baseTodayActivities;
    return baseTodayActivities.filter(e => {
      const a = activitiesList.find(act => act.id === e.activity_id);
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
      const a = activitiesList.find(act => String(act.id) === String(e.activity_id));
      // if (!a) return false;
      const matchesSearch = searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.activity_id) === String(selectedActivityId);
      return matchesSearch && matchesActivity;
    });
  }, [allEntries, filterDate, searchTerm, activitiesList, selectedActivityId]);

  const filteredAllEntries = useMemo(() => {
    if (activeStatFilter === "All Logs") return baseAllEntries;
    return baseAllEntries.filter(e => {
      const a = activitiesList.find(act => act.id === e.activity_id);
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
      const a = activitiesList.find(act => String(act.id) === String(e.activity_id));
      // if (!a) return false;
      const matchesSearch = searchTerm === "" ||
        a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.activity_id) === String(selectedActivityId);
      return matchesSearch && matchesActivity;
    });
  }, [activityHistory, filterDate, searchTerm, activitiesList, selectedActivityId]);

  const filteredHistoryEntries = useMemo(() => {
    if (activeStatFilter === "All History") return baseHistoryEntries;
    return baseHistoryEntries.filter(e => {
      if (activeStatFilter === "Progress Updates") return Number(e.today_progress || e.new_value?.today_progress || 0) > 0;
      if (activeStatFilter === "Status Changes") return e.action === "STATUS_CHANGE" || (e.status && e.old_status && e.status !== e.old_status) || (e.new_value?.status && e.new_value.status !== e.old_value?.status);
      return true;
    });
  }, [baseHistoryEntries, activeStatFilter]);

  const filteredDelayActivities = useMemo(() => {
    let list = delayActivities;
    list = list.filter(e => {
      const matchesSearch = searchTerm === "" ||
        e.activity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.boq_code && String(e.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesActivity = selectedActivityId === "all" || String(e.id) === String(selectedActivityId);

      const matchesStatus = delayStatusFilter === "all" || (e.status || "DELAY").toUpperCase() === delayStatusFilter.toUpperCase();

      return matchesSearch && matchesActivity && matchesStatus;
    });
    if (activeStatFilter === "All Delayed") return list;
    return list.filter(e => {
      const p = Number(e.completion_percentage || 0);
      if (activeStatFilter === "Critical (< 25%)") return p < 25;
      if (activeStatFilter === "Moderate (25% - 75%)") return p >= 25 && p <= 75;
      if (activeStatFilter === "Almost Done (> 75%)") return p > 75;
      return true;
    });
  }, [delayActivities, activeStatFilter, searchTerm, selectedActivityId, delayStatusFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'delay') {
      return { total: delayActivities.length, yieldRate: '0%', completed: 0, delayed: delayActivities.length, momentum: '0' };
    }
    if (activeTab === 'logs') {
      return { total: globalLogs.length, yieldRate: '0%', completed: 0, delayed: 0, momentum: '0' };
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
        return Number(e.today_progress) >= 100 || Number(e.new_value?.today_progress) >= 100;
      }).length;
      const delayed = list.filter(e => e.status?.toLowerCase() === "delay" || e.new_value?.status?.toLowerCase() === "delay").length;
      const yieldRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const totalProgress = list.reduce((sum, e) => sum + (Number(e.today_progress) || Number(e.new_value?.today_progress) || 0), 0);

      return {
        total,
        completed,
        delayed,
        yieldRate: `${yieldRate}%`,
        momentum: `${totalProgress}`
      };
    }
  }, [activeTab, baseTodayActivities, baseHistoryEntries, delayActivities, activitiesList, globalLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterDate, selectedActivityId, projectId]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTodayEntries = filteredTodayActivities.slice(startIndex, endIndex);
  const paginatedAllEntries = filteredAllEntries.slice(startIndex, endIndex);
  const paginatedHistoryEntries = filteredHistoryEntries.slice(startIndex, endIndex);
  const paginatedDelayActivities = filteredDelayActivities.slice(startIndex, endIndex);
  const paginatedGlobalLogs = globalLogs.slice(startIndex, endIndex);

  const getCurrentListLength = () => {
    switch (activeTab) {
      case 'today': return filteredTodayActivities.length;
      case 'all': return filteredAllEntries.length;
      case 'history': return filteredHistoryEntries.length;
      case 'delay': return filteredDelayActivities.length;
      case 'logs': return globalLogs.length;
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
        { label: "On Track Logs", count: base.filter(e => { const a = activitiesList.find(act => act.id === e.activity_id); return (a?.status || "").toLowerCase().replace("_", " ") === "on track"; }).length, colorClass: "text-blue-500", sub: "Performing as expected" },
        { label: "Completed Logs", count: base.filter(e => { const a = activitiesList.find(act => act.id === e.activity_id); return (a?.status || "").toLowerCase() === "completed"; }).length, colorClass: "text-emerald-500", sub: "100% Progress" }
      ];
    } else if (activeTab === 'history') {
      cards = [
        { label: "All History", count: baseHistoryEntries.length, colorClass: "text-slate-800", sub: "Complete Log" },
        { label: "Progress Updates", count: baseHistoryEntries.filter(e => Number(e.today_progress || e.new_value?.today_progress || 0) > 0).length, colorClass: "text-blue-500", sub: "Actual Progress Added" }
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

    const gridCols = cards.length === 2 ? "sm:grid-cols-2 lg:grid-cols-2" : cards.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

    return (
      <div className={`grid grid-cols-1 ${gridCols} gap-6 mb-8 font-inter`}>
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
      <Navbar title="Daily Work Progress" breadcrumb={["Manager", "Work Progress", "Daily Progress"]} />
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
            <ProjectSelector variant="page" />
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
                  {activeTab === 'delay' && (
                    <select
                      value={delayStatusFilter}
                      onChange={(e) => setDelayStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="DELAY">Delay</option>
                      <option value="ON TRACK">On Track</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="NOT STARTED">Not Started</option>
                    </select>
                  )}
                  {(activeTab === 'all' || activeTab === 'history') && (
                    <div className="flex items-center gap-3 font-inter">
                      {activeTab === 'all' && (
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm font-inter">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-transparent text-[11px] font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter"
                          />
                        </div>
                      )}
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
                </div>
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
                          <th className="px-6 py-4 font-inter whitespace-nowrap">CREATED BY</th>
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
                          const currentActivity = activitiesList.find(a => a.id === e.activity_id);
                          const creatorId = (e as any).created_by && typeof (e as any).created_by === 'object'
                            ? ((e as any).created_by.user_id || (e as any).created_by.id)
                            : (e as any).created_by || (e as any).created_by_user_id || (e as any).changed_by;
                          const creatorName = (e as any).created_by_name
                            || ((e as any).created_by && typeof (e as any).created_by === 'object'
                              ? ((e as any).created_by.full_name || (e as any).created_by.name)
                              : undefined)
                            || (creatorId ? (usersMap[creatorId] || `User #${creatorId}`) : "-");
                          const displayDate = e.entry_date || e.created_at ? new Date(e.entry_date || e.created_at).toLocaleDateString() : "-";
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-[13px] font-bold text-slate-700 whitespace-nowrap">
                                {currentActivity?.activity_name || "-"}
                              </td>
                              <td className="px-6 py-6 font-inter text-[13px] font-medium text-slate-600">{displayDate}</td>
                              <td className="px-6 py-6 font-inter text-[13px] font-bold text-blue-600">
                                {e.today_progress} {currentActivity?.unit || ""}
                              </td>
                              <td className="px-6 py-6 font-inter text-[13px] font-medium text-slate-600 max-w-[250px] truncate" title={e.remarks || (e as any).remark || (e as any).notes}>{e.remarks || (e as any).remark || (e as any).notes || "-"}</td>
                              <td className="px-6 py-6 font-inter text-[13px] font-medium text-slate-700 whitespace-nowrap">{creatorName}</td>
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
              {activeTab === 'logs' && (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                  <table className="w-full text-left font-inter min-w-[1200px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-50 font-inter">
                        <th className="px-6 py-4 font-inter whitespace-nowrap">Date & Time</th>
                        <th className="px-6 py-4 font-inter whitespace-nowrap">Activity</th>
                        <th className="px-6 py-4 font-inter whitespace-nowrap">Action</th>
                        <th className="px-6 py-4 font-inter whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 font-inter whitespace-nowrap">Progress Added</th>
                        <th className="px-6 py-4 font-inter whitespace-nowrap">Total Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-inter bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-20 text-center font-inter">
                            <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Loading Data...</p>
                          </td>
                        </tr>
                      ) : paginatedGlobalLogs.length > 0 ? (
                        paginatedGlobalLogs.map((log: any, idx) => {
                          const currentActivity = activitiesList.find(a => a.id === log.activity_id);
                          return (
                            <tr key={log.id || idx} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">
                                {log.created_at ? new Date(log.created_at).toLocaleString() : log.entry_date || "-"}
                              </td>
                              <td className="px-6 py-6 font-inter text-[13px] font-bold text-slate-700 whitespace-nowrap">
                                {currentActivity?.activity_name || `Activity #${log.activity_id || 'N/A'}`}
                              </td>
                              <td className="px-6 py-6 font-inter text-xs font-bold text-slate-500 uppercase tracking-tight">
                                {log.action || "-"}
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[log.new_value?.status || ""] || "bg-slate-100 text-slate-500"} font-inter`}>
                                  {log.new_value?.status || "-"}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-2 font-inter">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary font-inter" />
                                  <span className="text-sm font-bold text-primary font-inter">
                                    {log.new_value?.today_progress || 0} {currentActivity?.unit || ""}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700">
                                {log.new_value?.total_completed || 0} {currentActivity?.unit || ""}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center font-inter bg-slate-50 border-dashed border border-slate-200 rounded-2xl">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4 font-inter" />
                            <h3 className="text-xl font-bold text-slate-400 tracking-tight font-inter uppercase">No Logs Found</h3>
                            <p className="text-sm font-medium text-slate-400 font-inter max-w-sm mx-auto">There are no global work progress logs available.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {globalLogs.length > itemsPerPage && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between font-inter bg-slate-50/30">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Show</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-white border border-slate-200 text-slate-600 text-xs rounded-lg focus:ring-primary focus:border-primary block p-1.5 font-bold shadow-sm"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, globalLogs.length)} of {globalLogs.length} records
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {(() => {
                          const totalItems = globalLogs.length;
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
                            if (page === '...') return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
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
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(globalLogs.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.max(1, Math.ceil(globalLogs.length / itemsPerPage)) || globalLogs.length === 0}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                          const currentActivity = activitiesList.find(a => a.id === e.activity_id) || e.activity || activitiesList[index % activitiesList.length];
                          return (
                            <tr key={e.id || index} className="hover:bg-slate-50/50 transition-colors group font-inter">
                              <td className="px-6 py-6 font-inter text-sm font-medium text-slate-600">
                                {e.created_at ? new Date(e.created_at).toLocaleString() : e.start_date || e.entry_date || "-"}
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700 whitespace-nowrap">
                                {e.activity_name || currentActivity?.activity_name || "-"}
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[e.status || e.new_value?.status || currentActivity?.status || ""] || "bg-emerald-50 text-emerald-600"} font-inter`}>
                                  {e.status || e.new_value?.status || currentActivity?.status || "ON_TRACK"}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-inter">
                                <div className="flex items-center gap-2 font-inter">
                                  <TrendingUp className="w-3.5 h-3.5 text-primary font-inter" />
                                  <span className="text-sm font-bold text-primary font-inter">
                                    {e.today_progress || e.new_value?.today_progress || 0} {currentActivity?.unit || ""}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-inter text-sm font-bold text-slate-700">
                                {e.running_total || e.new_value?.total_completed || 0} {currentActivity?.unit || ""}
                              </td>
                              <td className="px-6 py-6 font-inter text-xs font-bold text-slate-500 uppercase tracking-tight">
                                {e.action || "DAILY_PROGRESS"}
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
        engineerId={engineer_id || 0}
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

