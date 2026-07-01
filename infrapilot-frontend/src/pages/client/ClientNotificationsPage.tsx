import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import {
  Bell, CheckCheck,
  CheckCircle, AlertCircle, Info, AlertTriangle, Check, Search
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const formatTableDate = (tsStr: string) => {
  try {
    const d = new Date(tsStr);
    return d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return tsStr;
  }
};

const formatTableTime = (tsStr: string) => {
  try {
    const d = new Date(tsStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "";
  }
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface SysNotification {
  kind: "system";
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  reference_id?: number | null;
  entity_type?: string | null;
}

interface TaskNotification {
  kind: "task";
  id: string; // "task-<task_id>"
  task_id: number;
  project_id: number;
  title: string;
  end_date: string;
  status: string;
  is_read: boolean;
}

type AnyNotif = SysNotification | TaskNotification;
type TabType = "All" | "System" | "Delayed Tasks";
type FilterType = "All" | "Unread" | "Read";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const TASK_READ_KEY = "client_task_notif_read_ids";

const getTaskReadIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(TASK_READ_KEY) || "[]"); }
  catch { return []; }
};
const saveTaskReadId = (id: string) => {
  const ids = getTaskReadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(TASK_READ_KEY, JSON.stringify(ids));
  }
};

const formatDate = (dateStr: string) => {
  try {
    const ts = dateStr.endsWith("Z") || dateStr.includes("+") || dateStr.includes("T")
      ? dateStr : dateStr + "T00:00:00Z";
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr: string) => {
  try {
    const ts = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
};

const getSysTypeConfig = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t === "alert" || t === "warning" || t === "critical")
    return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", badgeBg: "bg-rose-100 text-rose-700", icon: <AlertCircle className="w-4 h-4" /> };
  if (t === "success" || t === "approved")
    return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", badgeBg: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="w-4 h-4" /> };
  return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", badgeBg: "bg-blue-100 text-blue-700", icon: <Info className="w-4 h-4" /> };
};

/* ─── Component ──────────────────────────────────────────────────────────── */
const ClientNotificationsPage = () => {
  const [sysNotifs, setSysNotifs] = useState<SysNotification[]>([]);
  const [taskNotifs, setTaskNotifs] = useState<TaskNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [filter, setFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [viewingNotif, setViewingNotif] = useState<AnyNotif | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(0);
    setSelectedIds([]);
  };

  const handleSetFilter = (f: FilterType) => {
    setFilter(f);
    setCurrentPage(0);
    setSelectedIds([]);
  };

  const handleSetSearchQuery = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(0);
    setSelectedIds([]);
  };

  const handleToggleSelectAll = (pagedNotifs: AnyNotif[]) => {
    const pagedIds = pagedNotifs.map(n => String(n.id));
    const allSelected = pagedIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pagedIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pagedIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  /* ── Fetch ──────────────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sysRes, taskRes] = await Promise.allSettled([
        api.get("/notifications"),
        api.get("/projects/alerts/tasks"),
      ]);

      // System notifications
      if (sysRes.status === "fulfilled") {
        const raw = sysRes.value.data;
        const items: any[] = Array.isArray(raw) ? raw : raw?.items || raw?.data || raw?.notifications || [];
        setSysNotifs(items.map((n: any) => ({
          kind: "system" as const,
          id: n.id,
          title: n.title || n.alert_type || "Notification",
          message: n.message || n.description || n.content || "",
          type: n.type || "Info",
          is_read: !!(n.is_read || n.read),
          created_at: n.created_at || n.timestamp || new Date().toISOString(),
          reference_id: n.reference_id || n.related_id || null,
          entity_type: n.entity_type || n.entity || null,
        })));
      }

      // Delayed task notifications
      if (taskRes.status === "fulfilled") {
        const raw = taskRes.value.data;
        const items: any[] = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
        const readIds = getTaskReadIds();
        setTaskNotifs(items.map((t: any) => ({
          kind: "task" as const,
          id: `task-${t.task_id}`,
          task_id: t.task_id,
          project_id: t.project_id,
          title: t.title || "Delayed Task",
          end_date: t.end_date || "",
          status: t.status || "Delayed",
          is_read: readIds.includes(`task-${t.task_id}`),
        })));
      }
    } catch (err) {
      console.error("fetchAll failed:", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Mark read ──────────────────────────────────────────────────────── */
  const markSysRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setSysNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error("markSysRead failed:", err); }
  };

  const markTaskRead = (id: string) => {
    saveTaskReadId(id);
    setTaskNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markRead = (notif: AnyNotif) => {
    if (notif.is_read) return;
    if (notif.kind === "system") markSysRead(notif.id);
    else markTaskRead(notif.id);
  };

  const handleViewDetails = async (notif: AnyNotif) => {
    setViewingNotif(notif);
    setIsViewModalOpen(true);
    markRead(notif);
  };

  const handleMarkAllRead = async () => {
    const unreadSys = sysNotifs.filter(n => !n.is_read);
    const unreadTask = taskNotifs.filter(n => !n.is_read);
    if (unreadSys.length === 0 && unreadTask.length === 0) {
      toast("All notifications are already read."); return;
    }
    setMarkingAllRead(true);
    try {
      // System — try bulk then fallback
      if (unreadSys.length > 0) {
        try {
          await api.put("/notifications/read-all");
          setSysNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {
          await Promise.allSettled(unreadSys.map(n => markSysRead(n.id)));
        }
      }
      // Tasks — local only
      unreadTask.forEach(n => { saveTaskReadId(n.id); });
      setTaskNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(`Marked ${unreadSys.length + unreadTask.length} notification(s) as read.`);
      setSelectedIds([]);
    } catch { toast.error("Failed to mark all as read."); }
    finally { setMarkingAllRead(false); }
  };

  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    setMarkingAllRead(true);
    try {
      const selectedNotifs = allNotifs.filter(n => selectedIds.includes(String(n.id)) && !n.is_read);
      const sysToMark = selectedNotifs.filter((n): n is SysNotification => n.kind === "system");
      const tasksToMark = selectedNotifs.filter((n): n is TaskNotification => n.kind === "task");

      if (sysToMark.length > 0) {
        await Promise.allSettled(sysToMark.map(n => markSysRead(n.id)));
      }
      tasksToMark.forEach(n => { saveTaskReadId(n.id); });
      setTaskNotifs(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n));
      setSysNotifs(prev => prev.map(n => selectedIds.includes(String(n.id)) ? { ...n, is_read: true } : n));
      toast.success("Selected notifications marked as read.");
      setSelectedIds([]);
    } catch {
      toast.error("Failed to mark selected read.");
    } finally {
      setMarkingAllRead(false);
    }
  };

  /* ── Derived lists ──────────────────────────────────────────────────── */
  const allNotifs: AnyNotif[] = [
    ...sysNotifs,
    ...taskNotifs,
  ].sort((a, b) => {
    const dateA = a.kind === "system" ? new Date(a.created_at).getTime() : new Date(a.end_date || 0).getTime();
    const dateB = b.kind === "system" ? new Date(b.created_at).getTime() : new Date(b.end_date || 0).getTime();
    return dateB - dateA;
  });

  const tabFiltered = activeTab === "System"
    ? allNotifs.filter(n => n.kind === "system")
    : activeTab === "Delayed Tasks"
      ? allNotifs.filter(n => n.kind === "task")
      : allNotifs;

  const filteredNotifs = tabFiltered.filter(n => {
    const matchFilter =
      filter === "All" ||
      (filter === "Unread" && !n.is_read) ||
      (filter === "Read" && n.is_read);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) ||
      (n.kind === "system" ? n.message.toLowerCase().includes(q) : n.status.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const unreadCount = allNotifs.filter(n => !n.is_read).length;
  const readCount = allNotifs.filter(n => n.is_read).length;
  const delayedCount = taskNotifs.length;

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(filteredNotifs.length / PAGE_SIZE);
  const pagedNotifs = filteredNotifs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      <Navbar title="Notifications" breadcrumb={["Client", "Notifications"]} />

      <div className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notification Center</h1>
            <p className="text-slate-500 text-sm">View all your alerts, approvals, and system messages.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleMarkSelectedRead}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark Selected Read ({selectedIds.length})
              </button>
            )}
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Stat Cards - clickable to filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Unread */}
          <div
            onClick={() => {
              handleSetActiveTab("All");
              handleSetFilter("Unread");
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              filter === "Unread" && activeTab === "All"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UNREAD MESSAGES</p>
            <h3 className="text-3xl font-black text-rose-505 mt-2">
              {unreadCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Require attention</p>
          </div>

          {/* Card 2: Read */}
          <div
            onClick={() => {
              handleSetActiveTab("All");
              handleSetFilter("Read");
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              filter === "Read" && activeTab === "All"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">READ MESSAGES</p>
            <h3 className="text-3xl font-black text-emerald-500 mt-2">
              {readCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Processed messages</p>
          </div>

          {/* Card 3: Delayed Tasks */}
          <div
            onClick={() => {
              handleSetActiveTab("Delayed Tasks");
              handleSetFilter("All");
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              activeTab === "Delayed Tasks"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DELAYED TASKS</p>
            <h3 className="text-3xl font-black text-blue-500 mt-2">
              {delayedCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Past Due Date</p>
          </div>

          {/* Card 4: Total Alerts */}
          <div
            onClick={() => {
              handleSetActiveTab("All");
              handleSetFilter("All");
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              filter === "All" && activeTab === "All"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL ALERTS</p>
            <h3 className="text-3xl font-black text-blue-500 mt-2">
              {allNotifs.length}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">All-time received</p>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => handleSetSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
              />
            </div>

            {/* Quick tabs/filters side row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {(["All", "System", "Delayed Tasks"] as TabType[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => handleSetActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {(["All", "Unread", "Read"] as FilterType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => handleSetFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      filter === f
                        ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={pagedNotifs.length > 0 && pagedNotifs.every(n => selectedIds.includes(String(n.id)))}
                      onChange={() => handleToggleSelectAll(pagedNotifs)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 w-48">TYPE</th>
                  <th className="px-6 py-4">TITLE & DESCRIPTION</th>
                  <th className="px-6 py-4">DATE & TIME</th>
                  <th className="px-6 py-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6 border-b border-slate-50">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredNotifs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="p-20 text-center">
                        <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-lg">No Notifications</p>
                        <p className="text-slate-500 text-sm">You're all caught up!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedNotifs.map((notif) => {
                    const isSystem = notif.kind === "system";
                    const isTypeAlert = isSystem && (notif.type.toLowerCase() === "alert" || notif.type.toLowerCase() === "critical" || notif.type.toLowerCase() === "warning");
                    const isTypeSuccess = isSystem && (notif.type.toLowerCase() === "success" || notif.type.toLowerCase() === "approved");
                    const typeLabelStr = isSystem ? notif.type : "Task Alert";
                    const timestampVal = isSystem ? notif.created_at : notif.end_date;

                    return (
                      <tr key={String(notif.id)} className={`hover:bg-slate-50/50 transition-colors group ${!notif.is_read ? "bg-primary/[0.01]" : ""}`}>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(notif.id))}
                            onChange={() => handleToggleSelect(String(notif.id))}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isTypeAlert
                                ? "bg-rose-50 text-rose-500 border border-rose-100"
                                : isTypeSuccess
                                ? "bg-emerald-50 text-emerald-500 border border-emerald-100"
                                : "bg-blue-50 text-blue-500 border border-blue-100"
                            }`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            {!notif.is_read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                            )}
                            <span className="font-bold text-slate-700">{typeLabelStr}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-primary transition-colors">{notif.title}</p>
                          <p className="text-xs text-slate-500 max-w-lg truncate">
                            {isSystem ? notif.message : `Delayed Status: ${notif.status}. Due Date: ${formatDate(notif.end_date)}`}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-600">{formatTableDate(timestampVal)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{isSystem ? formatTableTime(timestampVal) : ""}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetails(notif)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {filteredNotifs.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredNotifs.length)} of {filteredNotifs.length} Notifications
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                {currentPage + 1}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Chat Widget */}
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <Link
            to="/chat"
            className="w-14 h-14 bg-slate-900 hover:bg-black text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative group"
            title="Open Team Chat"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              18
            </span>
          </Link>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
        title="Notification Details"
        maxWidth="max-w-md"
      >
        {viewingNotif && (() => {
          if (viewingNotif.kind === "system") {
            const typeConf = getSysTypeConfig(viewingNotif.type);
            return (
              <div className="p-6 font-inter space-y-5">
                <div className={`flex items-center gap-4 p-4 rounded-2xl ${typeConf.bg} border ${typeConf.border}`}>
                  <div className={`w-12 h-12 rounded-xl ${typeConf.bg} ${typeConf.text} flex items-center justify-center border ${typeConf.border} shadow-sm`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 leading-tight">{viewingNotif.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${typeConf.badgeBg}`}>{viewingNotif.type}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${viewingNotif.is_read ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                        {viewingNotif.is_read ? "Read" : "Unread"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{viewingNotif.message || "No message content."}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Received At</p>
                    <p className="text-xs font-bold text-slate-700">{formatDateTime(viewingNotif.created_at)}</p>
                  </div>
                  {viewingNotif.entity_type && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Type</p>
                      <p className="text-xs font-bold text-slate-700 capitalize">{viewingNotif.entity_type}</p>
                    </div>
                  )}
                  {viewingNotif.reference_id && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference ID</p>
                      <p className="text-xs font-bold text-slate-700">#{viewingNotif.reference_id}</p>
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notification ID</p>
                    <p className="text-xs font-bold text-slate-700">#{viewingNotif.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg cursor-pointer"
                >Dismiss</button>
              </div>
            );
          }

          /* Task detail */
          const isOverdue = viewingNotif.end_date && new Date(viewingNotif.end_date) < new Date();
          return (
            <div className="p-6 font-inter space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-800 leading-tight">{viewingNotif.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">{viewingNotif.status}</span>
                    {isOverdue && <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-700">Overdue</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Task ID</p>
                  <p className="text-xs font-bold text-slate-700">#{viewingNotif.task_id}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project ID</p>
                  <p className="text-xs font-bold text-slate-700">#{viewingNotif.project_id}</p>
                </div>
                <div className={`col-span-2 rounded-xl p-3 border ${isOverdue ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isOverdue ? "text-rose-400" : "text-amber-500"}`}>Due Date</p>
                  <p className={`text-sm font-bold ${isOverdue ? "text-rose-700" : "text-slate-700"}`}>
                    {formatDate(viewingNotif.end_date)}
                    {isOverdue && " · Overdue"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg cursor-pointer"
              >Dismiss</button>
            </div>
          );
        })()}
      </Modal>
    </>
  );
};

export default ClientNotificationsPage;

