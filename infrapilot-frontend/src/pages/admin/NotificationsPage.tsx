import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Bell, CheckCheck, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateAlertModal from "../../components/forms/CreateAlertModal";
import toast from "react-hot-toast";
import { notificationService, type Notification } from "../../services/notificationService";
import { projectService } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";

interface NotificationsPageProps {
  filter?: "alerts" | "system";
}

const NotificationsPage = ({ filter }: NotificationsPageProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"alerts" | "system">(filter ?? "alerts");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Sync tab when filter prop changes (e.g. navigating between routes)
  useEffect(() => {
    if (filter) setActiveTab(filter);
  }, [filter]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingNotif, setViewingNotif] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState<string | number | null>(null);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Unread" | "Read" | "Approval">("All");
  const [currentPage, setCurrentPage] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchNotifications(activeTab);
    fetchProjects();
  }, [activeTab]);

  const fetchNotifications = async (tab: "alerts" | "system") => {
    setIsLoading(true);
    setNotifications([]);
    try {
      const data = tab === "alerts"
        ? await notificationService.getAlertsOnly()
        : await notificationService.getSystemNotificationsOnly();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      toast.error("Could not load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectService.getProjects(100, 0);
      const items = Array.isArray(res) ? res : (res.items || []);
      setProjects(items);
    } catch (err) {
      console.warn("Failed to fetch projects for filter", err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    // Stat card filter only — route-level data is already pre-filtered by API
    const matchesStatFilter =
      activeStatFilter === "All" ||
      (activeStatFilter === "Unread" && !n.read) ||
      (activeStatFilter === "Read" && n.read) ||
      (activeStatFilter === "Approval" && n.type === "Approval");

    const matchesSearch =
      !searchTerm.trim() ||
      (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.project_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.user_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject =
      selectedProjectId === "All" ||
      Number(n.project_id) === Number(selectedProjectId);

    const matchesSource =
      sourceFilter === "All" ||
      (n.source || "general").toLowerCase() === sourceFilter.toLowerCase();

    return matchesStatFilter && matchesSearch && matchesProject && matchesSource;
  });

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(0);
    setSelectedIds([]);
  }, [searchTerm, activeStatFilter, filter, selectedProjectId, sourceFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / PAGE_SIZE));
  const pagedNotifs = filteredNotifs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead("Admin", notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setSelectedIds([]);
  };

  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    const toMark = notifications.filter(n => selectedIds.includes(n.id) && !n.read);
    await Promise.all(toMark.map(n => notificationService.markAsRead(n.id as any, n.source)));
    setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n));
    setSelectedIds([]);
    toast.success(`${toMark.length} notification(s) marked as read.`);
  };

  const handleToggleSelectAll = () => {
    const allIds = pagedNotifs.map(n => n.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleToggleSelect = (id: number | string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleViewDetails = async (notif: Notification) => {
    setViewingNotif(notif);
    setIsViewModalOpen(true);
    if (!notif.read) {
      await notificationService.markAsRead(notif.id, notif.source);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
  };

  const handleDelete = async () => {
    if (!notifToDelete) return;
    try {
      await notificationService.deleteAlert(notifToDelete);
      setNotifications(prev => prev.filter(n => n.id !== notifToDelete));
      toast.success("Notification removed.");
    } catch (err) {
      toast.error("Failed to delete notification.");
    } finally {
      setIsDeleteModalOpen(false);
      setNotifToDelete(null);
    }
  };

  const handleSendAlert = async (data: any) => {
    if (!user) { toast.error("User session not found"); return; }
    try {
      await notificationService.createAlert({
        project_id: data.project_id || 1,
        alert_type: `${data.status || "Normal"}||${data.type || "System"}`,
        message: data.message,
        user_id: Number(user.id) || 1
      });
      toast.success("Alert broadcasted successfully!");
      setIsCreateModalOpen(false);
      fetchNotifications(activeTab);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send alert.");
    }
  };

  const typeColor = (type: string) =>
    type === "Alert" ? "bg-rose-50 text-rose-600" :
      type === "Approval" ? "bg-emerald-50 text-emerald-600" :
        type === "System" ? "bg-amber-50 text-amber-600" :
          "bg-blue-50 text-blue-600";

  const sourceLabel = (source?: string) =>
    source === "project" ? "Project" :
      source === "task" ? "Task" :
        source === "system" ? "System" :
          source === "direct" ? "Direct" :
            "General";

  return (
    <>
      <Navbar
        title="Notifications & Alerts"
        breadcrumb={["Admin", "Notifications"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notification & Alert Center</h1>
            <p className="text-slate-500 text-sm">View all alerts, approvals, and system messages.</p>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleMarkSelectedRead}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark Selected Read ({selectedIds.length})
              </button>
            )}
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            {activeTab === "alerts" && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
              >
                + Send Alert
              </button>
            )}
          </div>
        </div>

        {/* Alerts / System Notification Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
          {([
            { key: "alerts", label: "Alerts" },
            { key: "system", label: "System Notifications" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setActiveStatFilter("All");
                setSearchTerm("");
                setSourceFilter("All");
                setSelectedProjectId("All");
                fetchNotifications(t.key);
              }}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === t.key ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Stat Cards — clickable to filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              f: "All" as const,
              label: "Total",
              sub: activeTab === "alerts" ? "All alerts received" : "All system notifications",
              count: notifications.length,
              accent: "text-primary",
              ring: "ring-primary",
            },
            {
              f: "Unread" as const,
              label: "Unread",
              sub: "Require attention",
              count: notifications.filter(n => !n.read).length,
              accent: "text-rose-500",
              ring: "ring-rose-500",
            },
            {
              f: "Read" as const,
              label: "Read",
              sub: "Processed messages",
              count: notifications.filter(n => n.read).length,
              accent: "text-emerald-500",
              ring: "ring-emerald-500",
            },
            activeTab === "alerts"
              ? {
                  f: "Approval" as const,
                  label: "Alerts",
                  sub: "Project & task alerts",
                  count: notifications.filter(n => n.type === "Alert").length,
                  accent: "text-amber-500",
                  ring: "ring-amber-500",
                }
              : {
                  f: "Approval" as const,
                  label: "System",
                  sub: "System messages",
                  count: notifications.filter(n => n.type === "System" || n.source === "system").length,
                  accent: "text-blue-500",
                  ring: "ring-blue-500",
                },
          ].map(({ f, label, sub, count, accent, ring }) => (
            <div
              key={f}
              onClick={() => setActiveStatFilter(f)}
              className={`cursor-pointer transition-all duration-200 rounded-xl hover:-translate-y-0.5 ${activeStatFilter === f ? `ring-2 ${ring} ring-offset-2 shadow-md scale-[1.02]` : "hover:shadow-sm"}`}
            >
              <StatCard title={label} value={count.toString()} sub={sub} accent={accent} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-50">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
                />
              </div>

              <div className="w-full sm:w-64">
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter appearance-none cursor-pointer"
                  >
                    <option value="All">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              {activeTab === "alerts" && (
                <select
                  value={sourceFilter}
                  onChange={(e) => { setSourceFilter(e.target.value); }}
                  className={`px-3 py-2 border rounded-xl text-sm font-medium outline-none transition-all font-inter ${
                    sourceFilter !== "All"
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <option value="All">All Sources</option>
                  <option value="general">General</option>
                  <option value="project">Project</option>
                  <option value="task">Task</option>
                  <option value="system">System</option>
                  <option value="direct">Direct</option>
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={pagedNotifs.length > 0 && pagedNotifs.every(n => selectedIds.includes(n.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 w-48">Type</th>
                  <th className="px-6 py-4">Title & Description</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredNotifs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="p-20 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-lg">No Notifications</p>
                        <p className="text-slate-500 text-sm">You're all caught up!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedNotifs.map((notif) => (
                    <tr key={String(notif.id)} className={`hover:bg-slate-50/50 transition-colors group ${!notif.read ? "bg-primary/[0.02]" : ""}`}>
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
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColor(notif.type)}`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            {!notif.read && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-bold transition-colors group-hover:text-primary ${!notif.read ? "text-slate-900" : "text-slate-500"}`}>{notif.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm mb-0.5 group-hover:text-primary transition-colors ${!notif.read ? "text-slate-800 font-bold" : "text-slate-600 font-semibold"}`}>{notif.title}</p>
                        <p className="text-xs text-slate-500 max-w-lg truncate">{notif.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-500 uppercase tracking-widest">
                          {sourceLabel(notif.source)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest ${
                          notif.read
                            ? "bg-slate-100 text-slate-500"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {notif.read ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-600">{new Date(notif.timestamp).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(notif.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(notif)}
                            className="p-1.5 text-slate-400 hover:text-primary transition-all rounded-lg hover:bg-primary/5"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setNotifToDelete(notif.id); setIsDeleteModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {filteredNotifs.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredNotifs.length)} of {filteredNotifs.length} {activeTab === "alerts" ? "Alerts" : "Notifications"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                {currentPage + 1}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
        title="Notification Details"
        maxWidth="max-w-md"
      >
        {viewingNotif && (
          <div className="font-inter">
            {/* Header Section */}
            <div className={`p-6 bg-gradient-to-br ${viewingNotif.type === "Alert" ? "from-rose-500 to-rose-600" :
              viewingNotif.type === "Approval" ? "from-emerald-500 to-emerald-600" :
                "from-blue-500 to-blue-600"
              } text-white`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold leading-tight">{viewingNotif.title}</h3>
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-[10px] font-black rounded-lg uppercase tracking-tighter border border-white/20">
                      {viewingNotif.status || "NORMAL"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {new Date(viewingNotif.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Message Section */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Alert Message
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                    {viewingNotif.details || viewingNotif.description || "No additional details provided."}
                  </p>
                </div>
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    Project
                  </div>
                  <p className="text-sm font-black text-slate-700 uppercase tracking-tight">
                    {viewingNotif.project_name || "Enterprise Global"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Timestamp
                  </div>
                  <p className="text-xs font-bold text-slate-600">
                    {new Date(viewingNotif.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Acknowledgment
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${viewingNotif.read ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <p className="text-xs font-bold text-slate-600">
                      {viewingNotif.read ? "Marked as Read" : "Requires Attention"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Data */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7C4 4.79 7.582 3 12 3s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  Additional Information
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 italic text-xs font-bold uppercase tracking-widest">
                  — No metadata attached —
                </div>
              </div>

              <button
                onClick={() => { setIsViewModalOpen(false); setViewingNotif(null); }}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200 active:scale-[0.98]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Alert Modal */}
      <CreateAlertModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSendAlert}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setNotifToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default NotificationsPage;
