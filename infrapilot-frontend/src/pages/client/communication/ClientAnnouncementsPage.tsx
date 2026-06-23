import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { notificationService } from "../../../services/notificationService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const ClientAnnouncementsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { projectId } = useClientProjectId();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const all = await notificationService.getAllNotifications();

      // Only keep project + task alerts — exclude general /alerts which contain dummy/test data
      const relevantAlerts = all.filter(
        (n: any) => n.source === "project" || n.source === "task"
      );

      // Filter by current project if projectId is set
      const filtered = projectId
        ? relevantAlerts.filter((n: any) => {
            const nPid = Number(n.project_id);
            const pid = Number(projectId);
            return nPid === pid || !n.project_id;
          })
        : relevantAlerts;

      setNotifications(filtered);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [projectId]);

  const handleMarkRead = async (id: string | number, source?: string) => {
    try {
      await notificationService.markAsRead(id, source || "general");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n))
      );
      toast.success("Marked as acknowledged");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead("All", notifications);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
      toast.success("All notifications acknowledged");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Remove this notification?")) return;
    try {
      await notificationService.deleteAlert(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const displayable = notifications;

  const filteredNotifs = displayable
    .filter((n) => {
      if (statusFilter === "Read") return n.read || n.is_read;
      if (statusFilter === "Unread") return !(n.read || n.is_read);
      return true;
    })
    .sort((a, b) => {
      const aRead = a.read || a.is_read;
      const bRead = b.read || b.is_read;
      if (!aRead && bRead) return -1;
      if (aRead && !bRead) return 1;
      return new Date(b.timestamp || b.created_at || 0).getTime() - new Date(a.timestamp || a.created_at || 0).getTime();
    });

  const totalCount = displayable.length;
  const readCount = displayable.filter((n) => n.read || n.is_read).length;
  const unreadCount = displayable.filter((n) => !(n.read || n.is_read)).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBadgeStyle = (type: string, alertType: string) => {
    const combined = `${type || ""} ${alertType || ""}`.toLowerCase();
    if (combined.includes("critical") || combined.includes("delay") || combined.includes("material")) return "bg-red-50 text-red-600 border-red-100";
    if (combined.includes("warning") || combined.includes("pending")) return "bg-amber-50 text-amber-600 border-amber-100";
    if (combined.includes("approved") || combined.includes("complete")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-blue-50 text-blue-600 border-blue-100";
  };

  const getSourceLabel = (n: any) => {
    if (n.source === "task" || String(n.id).startsWith("task-") || String(n.id).startsWith("t-")) return "Task Alert";
    if (n.source === "project" || String(n.id).startsWith("proj-") || String(n.id).startsWith("p-")) return "Project Update";
    return "System Notification";
  };

  const getTitle = (n: any) =>
    n.title && n.title !== "System Alert" && n.title !== "Task Update" && n.title !== "Project Alert"
      ? n.title
      : n.project_name
      ? n.project_name
      : n.description || n.message || "Notification";

  const getBody = (n: any) =>
    n.details || n.description || n.message || "";

  const getType = (n: any) =>
    n.alert_type || n.type || "Info";

  return (
    <>
      <Navbar
        title="Notifications"
        breadcrumb={["InfraPilot", "Client", "Communication", "Announcements"]}
      />
      <div className="p-8 bg-[#f8fafc] min-h-screen font-inter pb-20">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              Official Project Notifications
            </h1>
            <p className="text-slate-400 font-medium mt-1 text-sm tracking-tight">
              Important project updates, task alerts, and official system communications.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Mark All Read
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Notifications", value: totalCount, sub: "All Notifications", color: "text-slate-800", icon: "📢", filter: "All" },
            { label: "Read Notifications", value: readCount, sub: "Acknowledged", color: "text-emerald-500", icon: "✅", filter: "Read" },
            { label: "Unread Notifications", value: unreadCount, sub: "Action Required", color: "text-blue-500", icon: "🔔", filter: "Unread" },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => setStatusFilter(card.filter)}
              className={`bg-white p-8 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${statusFilter === card.filter ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500" : "border-slate-100 shadow-sm hover:shadow-md"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${statusFilter === card.filter ? "bg-blue-500 text-white shadow-lg" : "bg-slate-50"}`}>
                  {card.icon}
                </div>
              </div>
              <h3 className={`text-4xl font-black ${card.color} mb-1 tracking-tighter`}>
                {loading ? "—" : card.value}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing notification feed...</p>
            </div>
          ) : filteredNotifs.length > 0 ? (
            filteredNotifs.map((n) => {
              const isRead = n.read || n.is_read;
              const type = getType(n);
              const badgeStyle = getBadgeStyle(n.type, type);
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-md group relative flex flex-col md:flex-row gap-6 items-start ${isRead ? "border-slate-100 opacity-80" : "border-slate-100 shadow-sm"}`}
                >
                  {/* Unread dot */}
                  {!isRead && (
                    <div className="absolute top-6 left-6 flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                    </div>
                  )}

                  <div className={`flex-1 ${!isRead ? "pl-6" : ""}`}>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getSourceLabel(n)}</p>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeStyle}`}>
                        {type}
                      </span>
                      <p className="text-[9px] text-slate-400 font-bold">{formatDate(n.timestamp || n.created_at)}</p>
                      {isRead && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                          Read
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-2">
                      {getTitle(n)}
                    </h2>

                    {getBody(n) && getBody(n) !== getTitle(n) && (
                      <p className="text-[13px] font-medium text-slate-500 mb-3 leading-relaxed line-clamp-2">
                        {getBody(n)}
                      </p>
                    )}

                    {n.end_date && (
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date:</span>
                        <span className="text-[10px] font-black text-slate-700">{formatDate(n.end_date)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">S</div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Published via System Oracle</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setSelectedNotif(n); setIsModalOpen(true); }}
                      className="p-2 text-slate-300 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-xl active:scale-95"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => !isRead && handleMarkRead(n.id, n.source)}
                      disabled={isRead}
                      className={`p-2 rounded-xl transition-all ${isRead ? "text-slate-200 cursor-default" : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95"}`}
                      title={isRead ? "Acknowledged" : "Mark as Read"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 border-dashed">
              <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No notifications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Notification Intelligence"
        maxWidth="max-w-xl"
      >
        {selectedNotif && (
          <div className="font-inter">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6 p-5 bg-blue-600 rounded-2xl text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">
                {selectedNotif.source === "task" ? "📋" : selectedNotif.source === "project" ? "🏗️" : "📢"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-white truncate">{getTitle(selectedNotif)}</h3>
                  <span className="shrink-0 px-2 py-0.5 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/30">
                    {getType(selectedNotif)}
                  </span>
                </div>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">{getSourceLabel(selectedNotif)}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Description */}
              {getBody(selectedNotif) && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Details</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{getBody(selectedNotif)}</p>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                  <p className="text-xs font-black text-slate-700">{formatDate(selectedNotif.timestamp || selectedNotif.created_at)}</p>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-xs font-black ${(selectedNotif.read || selectedNotif.is_read) ? "text-emerald-600" : "text-blue-600"}`}>
                    {(selectedNotif.read || selectedNotif.is_read) ? "Acknowledged" : "Active / Unread"}
                  </p>
                </div>
                {selectedNotif.project_id && (
                  <div className="p-4 bg-white border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project ID</p>
                    <p className="text-xs font-black text-slate-700">PRJ-{selectedNotif.project_id}</p>
                  </div>
                )}
                {selectedNotif.project_name && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Project</p>
                    <p className="text-xs font-black text-blue-700">{selectedNotif.project_name}</p>
                  </div>
                )}
                {selectedNotif.end_date && (
                  <div className="p-4 bg-white border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
                    <p className="text-xs font-black text-slate-700">{formatDate(selectedNotif.end_date)}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
            >
              Dismiss
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientAnnouncementsPage;
