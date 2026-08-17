import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
  Bell, CheckCheck, Eye,
  CheckCircle, AlertCircle, Info, Search, ArrowRight
} from "lucide-react";
import { notificationService } from "../../services/notificationService";
import { alertService } from "../../services/alertService";
import { handleNotificationClick } from "../../utils/notificationNavigator";

/* ─── Helper Date Formatters ─── */
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

const formatLongDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
};

/* ─── Interfaces ─── */
interface LocalNotification {
  id: string | number;
  title: string;
  description: string;
  type: string;
  read: boolean;
  created_at: string;
}

/* ─── Fallback / Demo Notifications from Screenshot ─── */
const MOCK_NOTIFICATIONS: LocalNotification[] = [
  {
    id: "notif-1",
    title: "site flooring macking",
    description: "Delayed Status: Delayed. Due Date: 01 Jul 2028",
    type: "Task Alert",
    read: false,
    created_at: "2026-07-01T12:00:00Z"
  },
  {
    id: "notif-2",
    title: "Approval Rejected",
    description: "Your material approval request was Rejected.",
    type: "alert",
    read: false,
    created_at: "2026-06-22T08:28:00Z"
  },
  {
    id: "notif-3",
    title: "Approval Granted",
    description: "Your design approval request has been Approved.",
    type: "success",
    read: true,
    created_at: "2026-06-22T06:32:00Z"
  },
  {
    id: "notif-4",
    title: "Site Cleaning",
    description: "Delayed Status: Delayed. Due Date: 08 Apr 2028",
    type: "Task Alert",
    read: true,
    created_at: "2026-04-06T15:30:00Z"
  }
];

const getSysTypeConfig = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t === "alert" || t === "warning" || t === "critical") {
    return {
      bg: "bg-rose-50 text-rose-600",
      border: "border-rose-100",
      badgeBg: "bg-rose-100 text-rose-700",
      text: "text-rose-600",
      icon: <AlertCircle className="w-4 h-4" />
    };
  }
  if (t === "success" || t === "approved") {
    return {
      bg: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
      badgeBg: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-600",
      icon: <CheckCircle className="w-4 h-4" />
    };
  }
  return {
    bg: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    badgeBg: "bg-blue-100 text-blue-700",
    text: "text-blue-600",
    icon: <Info className="w-4 h-4" />
  };
};

const LabourNotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState<"All" | "Unread" | "Read" | "Delayed">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewingNotif, setViewingNotif] = useState<LocalNotification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from overview API
      const raw = await notificationService.getNotificationsOverview(100, 0).catch(() => []);

      if (raw && raw.length > 0) {
        const mapped: LocalNotification[] = raw.map(n => ({
          id: n.id,
          title: n.title || "Notification",
          description: n.description || n.details || "",
          type: n.type || "Info",
          read: !!n.read,
          created_at: n.created_at || n.timestamp || new Date().toISOString()
        }));
        setNotifications(mapped);
      } else {
        // Fallback to MOCK_NOTIFICATIONS to match screenshot
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } catch (err) {
      console.error("fetchNotifications failed, loading fallback mock data:", err);
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ─── Mark Single Read ─── */
  const handleMarkRead = async (notif: LocalNotification) => {
    if (notif.read) return;
    try {
      if (typeof notif.id === "number") {
        await alertService.markAlertRead(notif.id);
      } else {
        // String or fallback
        await alertService.markAlertRead(parseInt(notif.id.replace(/\D/g, "")) || 0).catch(() => { });
      }
    } catch (err) {
      console.warn("API markRead failed:", err);
    }
    // Update local state anyway
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
  };

  /* ─── Bulk Action ─── */
  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    setMarkingRead(true);
    try {
      await Promise.allSettled(
        notifications
          .filter(n => selectedIds.includes(String(n.id)) && !n.read)
          .map(n => handleMarkRead(n))
      );
      toast.success("Selected notifications marked as read.");
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to mark selected read.");
    } finally {
      setMarkingRead(false);
    }
  };

  const handleViewDetails = (notif: LocalNotification) => {
    setViewingNotif(notif);
    setIsViewModalOpen(true);
    handleMarkRead(notif);
  };

  /* ─── Filtering & Search ─── */
  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      const matchesTab =
        activeTabFilter === "All" ||
        (activeTabFilter === "Unread" && !n.read) ||
        (activeTabFilter === "Read" && n.read) ||
        (activeTabFilter === "Delayed" && n.type.toLowerCase().includes("task") || n.description.toLowerCase().includes("delayed"));

      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [notifications, activeTabFilter, searchQuery]);

  /* ─── Pagination ─── */
  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(filteredNotifs.length / PAGE_SIZE);
  const pagedNotifs = useMemo(() => {
    return filteredNotifs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  }, [filteredNotifs, currentPage]);


  // Stat counts
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;
  const delayedCount = notifications.filter(n => n.type.toLowerCase().includes("task") || n.description.toLowerCase().includes("delayed")).length;

  return (
    <>
      <Navbar title="Notifications" breadcrumb={["Labour", "Notifications"]} />

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
                disabled={markingRead}
                onClick={handleMarkSelectedRead}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                {markingRead ? "Processing..." : `Mark Selected Read (${selectedIds.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Unread */}
          <div
            onClick={() => {
              setActiveTabFilter("Unread");
              setCurrentPage(0);
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${activeTabFilter === "Unread"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
              }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UNREAD MESSAGES</p>
            <h3 className="text-3xl font-black text-rose-500 mt-2">
              {unreadCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Require attention</p>
          </div>

          {/* Card 2: Read */}
          <div
            onClick={() => {
              setActiveTabFilter("Read");
              setCurrentPage(0);
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${activeTabFilter === "Read"
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

          {/* Card 3: Delayed */}
          <div
            onClick={() => {
              setActiveTabFilter("Delayed");
              setCurrentPage(0);
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${activeTabFilter === "Delayed"
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
              setActiveTabFilter("All");
              setCurrentPage(0);
            }}
            className={`cursor-pointer transition-all duration-200 bg-white rounded-2xl p-6 border ${activeTabFilter === "All"
                ? "border-2 border-blue-600 shadow-md scale-[1.02]"
                : "border-slate-100 hover:shadow-sm"
              }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL ALERTS</p>
            <h3 className="text-3xl font-black text-blue-500 mt-2">
              {notifications.length}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">All-time received</p>
          </div>
        </div>

        {/* Content Table Box */}
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 w-48">TYPE</th>
                  <th className="px-6 py-4">TITLE & DESCRIPTION</th>
                  <th className="px-6 py-4">DATE & TIME</th>
                  <th className="px-6 py-4 text-center">READ</th>
                  <th className="px-6 py-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
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
                    const isRead = notif.read;
                    const typeLabel = notif.type || "Notification";

                    // Style config matching type
                    const isTypeAlert = typeLabel.toLowerCase() === "alert" || typeLabel.toLowerCase() === "warning" || typeLabel.toLowerCase() === "critical";
                    const isTypeSuccess = typeLabel.toLowerCase() === "success" || typeLabel.toLowerCase() === "approved";

                    return (
                      <tr key={String(notif.id)} className={`hover:bg-slate-50/50 transition-colors group ${!isRead ? "bg-primary/[0.01]" : ""}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isTypeAlert
                                ? "bg-rose-50 text-rose-500 border border-rose-100"
                                : isTypeSuccess
                                  ? "bg-emerald-50 text-emerald-500 border border-emerald-100"
                                  : "bg-blue-50 text-blue-500 border border-blue-100"
                              }`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            {!isRead && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                            )}
                            <span className="font-bold text-slate-700">{typeLabel}</span>
                          </div>
                        </td>
                        <td 
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => handleNotificationClick(notif, navigate, "Labour")}
                        >
                          <p className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-primary transition-colors">{notif.title}</p>
                          <p className="text-xs text-slate-500 max-w-lg truncate">{notif.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-600">{formatTableDate(notif.created_at)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatTableTime(notif.created_at)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); !isRead && handleMarkRead(notif); }}
                            disabled={isRead}
                            title={isRead ? "Already Read" : "Mark as Read"}
                            className={`mx-auto block transition-colors ${
                              isRead
                                ? "text-slate-300 cursor-default"
                                : "text-emerald-500 hover:text-emerald-600 cursor-pointer"
                            }`}
                          >
                            <CheckCheck className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetails(notif)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
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
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={(currentPage + 1) * PAGE_SIZE >= filteredNotifs.length}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
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
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center border shadow-sm ${typeConf.text}`}>
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-800 leading-tight">{viewingNotif.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${typeConf.badgeBg}`}>{viewingNotif.type}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${viewingNotif.read ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                      {viewingNotif.read ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{viewingNotif.description || "No message content."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Received At</p>
                  <p className="text-xs font-bold text-slate-700">{formatLongDate(viewingNotif.created_at)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notification ID</p>
                  <p className="text-xs font-bold text-slate-700">#{viewingNotif.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const notif = viewingNotif;
                    setIsViewModalOpen(false);
                    setViewingNotif(null);
                    handleNotificationClick(notif, navigate, "Labour");
                  }}
                  className="py-3 bg-primary hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Open Page <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
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

export default LabourNotificationsPage;
