import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateAlertModal from "../../components/forms/CreateAlertModal";
import toast from "react-hot-toast";
import { Eye, Trash2 } from "lucide-react";
import AlertDetailsModal from "../../components/dashboard/AlertDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import SortDropdown from "../../components/common/SortDropdown";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";


const NotificationsPage = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingAlert, setViewingAlert] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const PAGE_SIZE = 10;

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.listAlerts(100, 0);
      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast.error("Could not load system alerts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    const list = alerts.filter(a =>
      (a.message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.alert_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.status || "Normal").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...list].sort((a, b) => {
      const aVal = new Date(a.created_at || 0).getTime();
      const bVal = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? bVal - aVal : aVal - bVal;
    });
  }, [alerts, searchTerm, sortOrder]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const pagedAlerts = filteredAlerts.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handleMarkAllRead = async () => {
    const unreadAlerts = alerts.filter(a => !a.is_read);
    if (unreadAlerts.length === 0) return;

    toast.promise(
      Promise.all(unreadAlerts.map(a => notificationService.markAlertRead(a.id, a.source || 'general'))),
      {
        loading: 'Marking as read...',
        success: 'All alerts marked as read',
        error: 'Failed to update alerts',
      }
    );
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const handleSendAlert = async (data: any) => {
    if (!user) {
      toast.error("User session not found");
      return;
    }

    try {
      await notificationService.createAlert({
        project_id: data.project_id || 1, // Default to 1 if not provided
        alert_type: data.type || "System",
        message: data.message,
        user_id: Number(user.id) || 1
      });
      toast.success("Alert broadcasted successfully!");
      fetchAlerts();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Broadcast failed:", error.response?.data || error.message);
      toast.error(error.response?.data?.detail || "Failed to send alert. Check server logs.");
    }
  };

  const confirmDelete = async () => {
    if (alertToDelete) {
      try {
        await notificationService.deleteAlert(alertToDelete);
        setAlerts(prev => prev.filter(a => a.id !== alertToDelete));
        toast.success("Alert removed.");
      } catch (error) {
        toast.error("Failed to delete alert");
      } finally {
        setIsDeleteModalOpen(false);
        setAlertToDelete(null);
      }
    }
  };



  return (
    <>
      <Navbar title="Notifications & Alerts" breadcrumb={["Admin", "Notifications"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Alerts & Notifications</h1>
            <p className="text-slate-500 text-sm">Monitor critical project signals, budget overruns, and safety compliance.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              Mark All Read
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + Send Alert
            </button>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Unread Alerts" value={alerts.filter(a => !a.is_read).length.toString()} sub="Action required" accent="text-primary" />
          <StatCard title="Critical Issues" value={alerts.filter(a => a.status === "Critical").length.toString()} sub="Requires immediate action" accent="text-rose-500" />
          <StatCard title="Total Broadcasts" value={alerts.length.toString()} sub="All-time alerts sent" accent="text-emerald-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-50">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search alerts by type or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Alert Type</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No alerts found.
                    </td>
                  </tr>
                ) : (
                  pagedAlerts.map((alert) => (
                    <tr key={alert.id} className={`hover:bg-slate-50/50 transition-colors group ${!alert.is_read ? "bg-primary/[0.02]" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert.source === "project" ? "bg-rose-50 text-rose-600" :
                                alert.source === "task" ? "bg-emerald-50 text-emerald-600" :
                                  "bg-blue-50 text-blue-600"
                              }`}>
                              {alert.source === "project" ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                              ) : alert.source === "task" ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              )}
                            </div>
                            {!alert.is_read && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-bold text-xs transition-colors group-hover:text-primary ${!alert.is_read ? "text-slate-900" : "text-slate-500"}`}>
                              {alert.source === "project" ? "Project" : alert.source === "task" ? "Task" : "System"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{alert.alert_type || alert.type || "Update"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm max-w-sm line-clamp-1 group-hover:text-primary transition-colors ${!alert.is_read ? "text-slate-800 font-semibold" : "text-slate-500 font-medium"}`}>{alert.message}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">
                        {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${alert.status === "Critical" ? "bg-rose-100 text-rose-600" : alert.status === "Warning" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                          }`}>
                          {alert.status || "Normal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => {
                              setViewingAlert(alert);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>

                          <button
                            onClick={() => {
                              setAlertToDelete(alert.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                            title="Delete Alert"
                          >
                            <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredAlerts.length)} of {filteredAlerts.length} Alerts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                  {currentPage + 1}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {filteredAlerts.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">No alerts matching your search.</p>
            </div>
          )}
        </div>
      </PageTransition>

      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSendAlert}
      />

      <AlertDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingAlert(null);
        }}
        alert={viewingAlert}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAlertToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Alert"
        message="Are you sure you want to delete this alert? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default NotificationsPage;
