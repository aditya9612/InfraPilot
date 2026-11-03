import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Bell, CheckCheck, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import { notificationService, type Notification } from "../../services/notificationService";

const ManagerNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingNotif, setViewingNotif] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Unread" | "Read" | "Approval">("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeStatFilter]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const data = await notificationService.getNotifications();
    setNotifications(data);
  };

  const filteredNotifs = notifications.filter(n => {
    const matchesSearch =
      (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeStatFilter === "Unread" && n.read) return false;
    if (activeStatFilter === "Read" && !n.read) return false;
    if (activeStatFilter === "Approval" && n.type !== "Approval") return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / itemsPerPage));
  const paginatedNotifs = filteredNotifs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead("ProjectManager", notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setSelectedIds([]);
  };

  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    await Promise.all(selectedIds.map(id => notificationService.markAsRead(id)));
    setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n));
    setSelectedIds([]);
  };

  const handleToggleSelectAll = () => {
    const allIds = filteredNotifs.map(n => n.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const union = new Set([...prev, ...allIds]);
        return Array.from(union);
      });
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
      await notificationService.markAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
  };

  return (
    <>
      <Navbar title="My Notifications" breadcrumb={["Manager", "Notifications"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notification Center</h1>
            <p className="text-slate-500 text-sm">View all your project alerts, approvals, and system messages.</p>
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
          </div>
        </div>

        {/* Notification Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            onClick={() => setActiveStatFilter("Unread")}
            className={`cursor-pointer transition-all duration-200 rounded-xl hover:-translate-y-0.5 ${
              activeStatFilter === "Unread" ? "ring-2 ring-rose-500 ring-offset-2 shadow-md scale-[1.02]" : "hover:shadow-sm"
            }`}
          >
            <StatCard title="Unread Messages" value={notifications.filter(n => !n.read).length.toString()} sub="Require attention" accent="text-rose-500" />
          </div>
          <div
            onClick={() => setActiveStatFilter("Read")}
            className={`cursor-pointer transition-all duration-200 rounded-xl hover:-translate-y-0.5 ${
              activeStatFilter === "Read" ? "ring-2 ring-emerald-500 ring-offset-2 shadow-md scale-[1.02]" : "hover:shadow-sm"
            }`}
          >
            <StatCard title="Read Messages" value={notifications.filter(n => n.read).length.toString()} sub="Processed messages" accent="text-emerald-500" />
          </div>
          <div
            onClick={() => setActiveStatFilter("Approval")}
            className={`cursor-pointer transition-all duration-200 rounded-xl hover:-translate-y-0.5 ${
              activeStatFilter === "Approval" ? "ring-2 ring-blue-500 ring-offset-2 shadow-md scale-[1.02]" : "hover:shadow-sm"
            }`}
          >
            <StatCard title="Approvals" value={notifications.filter(n => n.type === "Approval").length.toString()} sub="Material & Work Requests" accent="text-blue-500" />
          </div>
          <div
            onClick={() => setActiveStatFilter("All")}
            className={`cursor-pointer transition-all duration-200 rounded-xl hover:-translate-y-0.5 ${
              activeStatFilter === "All" ? "ring-2 ring-primary ring-offset-2 shadow-md scale-[1.02]" : "hover:shadow-sm"
            }`}
          >
            <StatCard title="Total Alerts" value={notifications.length.toString()} sub="All-time received" accent="text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
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
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredNotifs.length > 0 && filteredNotifs.every(n => selectedIds.includes(n.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 w-44">Type</th>
                  <th className="px-6 py-4 min-w-[200px]">Title</th>
                  <th className="px-6 py-4 min-w-[280px]">Message</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedNotifs.map((notif) => (
                  <tr key={notif.id} className={`hover:bg-slate-50/50 transition-colors group ${!notif.read ? "bg-primary/[0.02]" : ""}`}>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notif.id)}
                        onChange={() => handleToggleSelect(notif.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        notif.type === "Approval"
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : notif.type === "System"
                            ? "bg-purple-50 text-purple-600 border border-purple-100"
                            : notif.type === "Alert"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          notif.type === "Approval"
                            ? "bg-blue-500"
                            : notif.type === "System"
                              ? "bg-purple-500"
                              : notif.type === "Alert"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                        }`} />
                        {notif.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm ${!notif.read ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                        {notif.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {notif.description || (notif as any).message || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                      {notif.time}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(notif)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedNotifs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No notifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredNotifs.length > 0 && (
            <div className="p-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifs.length)} of {filteredNotifs.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      {/* View Notification Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Notification Details"
        maxWidth="max-w-md"
      >
        {viewingNotif && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                viewingNotif.type === "Approval"
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : viewingNotif.type === "System"
                    ? "bg-purple-50 text-purple-600 border border-purple-100"
                    : viewingNotif.type === "Alert"
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {viewingNotif.type}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {viewingNotif.time}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {viewingNotif.title}
              </h3>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                {viewingNotif.description}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ManagerNotificationsPage;

