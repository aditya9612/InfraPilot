import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import {
  Bell, CheckCheck,
  CheckCircle, AlertCircle, Info, Search, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { handleNotificationClick } from "../../utils/notificationNavigator";

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

const formatDateTime = (dateStr: string) => {
  try {
    const ts = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface SysNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  reference_id?: number | string | null;
  entity_type?: string | null;
  link?: string | null;
  entity_id?: number | string | null;
  url?: string | null;
}

type FilterType = "All" | "Unread" | "Read";

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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SysNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [viewingNotif, setViewingNotif] = useState<SysNotification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [markingAllRead, setMarkingAllRead] = useState(false);

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

  const handleToggleSelectAll = (pagedNotifs: SysNotification[]) => {
    const pagedIds = pagedNotifs.map(n => n.id);
    const allSelected = pagedIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pagedIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pagedIds])));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  /* ── Fetch (System Notifications only - No Task alerts) ───────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      const raw = res.data;
      const items: any[] = Array.isArray(raw) ? raw : raw?.items || raw?.data || raw?.notifications || [];

      // Filter out any task notifications
      const clientItems = items.filter((n: any) => {
        const entity = String(n.entity || n.entity_type || n.notification_type || '').toLowerCase();
        const title = String(n.title || n.alert_type || '').toLowerCase();
        const message = String(n.message || n.description || n.content || n.details || '').toLowerCase();
        const type = String(n.type || '').toLowerCase();
        const link = String(n.link || n.url || n.action_url || '').toLowerCase();

        const isTask = (
          entity.includes('task') ||
          title.includes('task') ||
          message.includes('task') ||
          type.includes('task') ||
          link.includes('task')
        );

        return !isTask;
      });

      setNotifications(clientItems.map((n: any) => ({
        id: n.id,
        title: n.title || n.alert_type || "Notification",
        message: n.message || n.description || n.content || "",
        type: n.type || "Info",
        is_read: !!(n.is_read || n.read),
        created_at: n.created_at || n.timestamp || new Date().toISOString(),
        reference_id: n.reference_id || n.related_id || null,
        entity_type: n.entity_type || n.entity || null,
        link: n.link || n.url || null,
        entity_id: n.entity_id || n.reference_id || n.related_id || null,
      })));
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
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error("markSysRead failed:", err); }
  };

  const markRead = (notif: SysNotification) => {
    if (notif.is_read) return;
    markSysRead(notif.id);
  };

  const handleDirectNavigate = async (notif: SysNotification) => {
    markRead(notif);
    await handleNotificationClick(notif, navigate, "Client");
  };

  const handleViewDetails = async (notif: SysNotification) => {
    setViewingNotif(notif);
    setIsViewModalOpen(true);
    markRead(notif);
  };

  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    setMarkingAllRead(true);
    try {
      const selectedToMark = notifications.filter(n => selectedIds.includes(n.id) && !n.is_read);
      if (selectedToMark.length > 0) {
        await Promise.allSettled(selectedToMark.map(n => markSysRead(n.id)));
      }
      setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n));
      toast.success("Selected notifications marked as read.");
      setSelectedIds([]);
    } catch {
      toast.error("Failed to mark selected read.");
    } finally {
      setMarkingAllRead(false);
    }
  };

  /* ── Derived lists ──────────────────────────────────────────────────── */
  const sortedNotifs = [...notifications].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredNotifs = sortedNotifs.filter(n => {
    const matchFilter =
      filter === "All" ||
      (filter === "Unread" && !n.is_read) ||
      (filter === "Read" && n.is_read);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || (n.type && n.type.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / PAGE_SIZE));
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
                disabled={markingAllRead}
                onClick={handleMarkSelectedRead}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                {markingAllRead ? "Processing..." : `Mark Selected Read (${selectedIds.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Stat Cards - clickable to filter (3 Clean Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Unread */}
          <div
            onClick={() => handleSetFilter("Unread")}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              filter === "Unread"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REQUIRE ATTENTION</p>
            <h3 className="text-3xl font-black text-rose-500 mt-2">
              {unreadCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Unread messages</p>
          </div>

          {/* Card 2: Read */}
          <div
            onClick={() => handleSetFilter("Read")}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              filter === "Read"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PROCESSED MESSAGES</p>
            <h3 className="text-3xl font-black text-emerald-500 mt-2">
              {readCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Read messages</p>
          </div>

          {/* Card 3: Total All-time */}
          <div
            onClick={() => handleSetFilter("All")}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${
              filter === "All"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ALL-TIME RECEIVED</p>
            <h3 className="text-3xl font-black text-blue-500 mt-2">
              {notifications.length}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Total notifications</p>
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
          </div>

          {/* Table */}
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={pagedNotifs.length > 0 && pagedNotifs.every(n => selectedIds.includes(n.id))}
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
                    const isTypeAlert = notif.type.toLowerCase() === "alert" || notif.type.toLowerCase() === "critical" || notif.type.toLowerCase() === "warning";
                    const isTypeSuccess = notif.type.toLowerCase() === "success" || notif.type.toLowerCase() === "approved";
                    const typeLabelStr = notif.type || "Notification";
                    const timestampVal = notif.created_at;

                    return (
                      <tr key={notif.id} className={`hover:bg-slate-50/50 transition-colors group ${!notif.is_read ? "bg-primary/[0.01]" : ""}`}>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(notif.id)}
                            onChange={() => handleToggleSelect(notif.id)}
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
                            {notif.message}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-600">{formatTableDate(timestampVal)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatTableTime(timestampVal)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDirectNavigate(notif)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                              title="Go to related page"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(notif)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                              Details
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                {currentPage + 1}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
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
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    const notif = viewingNotif;
                    setIsViewModalOpen(false);
                    setViewingNotif(null);
                    handleDirectNavigate(notif);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Open Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
};

export default ClientNotificationsPage;
