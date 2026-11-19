import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Bell, CheckCheck, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import { notificationService, type Notification } from "../../services/notificationService";


const formatTableDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === "-" || dateStr === "null") return "—";
  try {
    let s = String(dateStr).trim();
    if (!s.includes('T') && s.includes(' ')) s = s.replace(' ', 'T');
    if (!s.includes('Z') && !s.includes('+') && !/[-+]\d{2}:\d{2}$/.test(s)) s += 'Z';
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return String(dateStr);
  }
};

const formatTableTime = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === "-" || dateStr === "null") return "";
  try {
    let s = String(dateStr).trim();
    if (!s.includes('T') && s.includes(' ')) s = s.replace(' ', 'T');
    if (!s.includes('Z') && !s.includes('+') && !/[-+]\d{2}:\d{2}$/.test(s)) s += 'Z';
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "";
  }
};

const formatFullDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === "-" || dateStr === "null") return "—";
  try {
    let s = String(dateStr).trim();
    if (!s.includes('T') && s.includes(' ')) s = s.replace(' ', 'T');
    if (!s.includes('Z') && !s.includes('+') && !/[-+]\d{2}:\d{2}$/.test(s)) s += 'Z';
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return String(dateStr);
  }
};

const ManagerNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingNotif, setViewingNotif] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
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
    const isRead = !!(n.read || (n as any).is_read);
    const statusText = isRead ? "read" : "unread";
    const matchesSearch =
      (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.description || (n as any).message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      statusText.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeStatFilter === "Unread" && isRead) return false;
    if (activeStatFilter === "Read" && !isRead) return false;
    if (activeStatFilter === "Approval" && n.type !== "Approval") return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / itemsPerPage));
  const paginatedNotifs = filteredNotifs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead("ProjectManager", notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-primary/10 text-primary rounded-xl">
                <Bell className="w-5 h-5" />
              </span>
              Notification Center
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">View all your project alerts, approvals, and system messages.</p>
          </div>
          <div>
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 w-44">Type</th>
                  <th className="px-6 py-4 min-w-[200px]">Title</th>
                  <th className="px-6 py-4 min-w-[280px]">Message</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                  <th className="px-6 py-4 w-28 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedNotifs.map((notif) => (
                  <tr key={notif.id} className={`hover:bg-slate-50/50 transition-colors group ${!notif.read ? "bg-primary/[0.02]" : ""}`}>
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
                      <p className={`text-sm ${!notif.read ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                        {notif.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {notif.description || (notif as any).message || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-600">
                        {formatTableDate(notif.created_at || notif.timestamp || (notif as any).time)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {formatTableTime(notif.created_at || notif.timestamp || (notif as any).time)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest border ${
                        notif.read || (notif as any).is_read
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}>
                        {notif.read || (notif as any).is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(notif)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-blue-600 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
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
            <div className="p-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 font-inter">
              {/* Left: Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none pr-8 cursor-pointer relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.25rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Middle: Info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredNotifs.length)} of {filteredNotifs.length} records
              </div>

              {/* Right: Pagination */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {(() => {
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
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
          <div className="p-6 font-inter">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                viewingNotif.type === 'Alert' 
                  ? 'bg-rose-100 text-rose-600' 
                  : viewingNotif.type === 'Approval' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-blue-100 text-blue-600'
              }`}>
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">{viewingNotif.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-widest border ${
                    viewingNotif.read || (viewingNotif as any).is_read
                      ? "bg-slate-100 text-slate-500 border-slate-200"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}>
                    {viewingNotif.read || (viewingNotif as any).is_read ? "Read" : "Unread"}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {formatFullDateTime(viewingNotif.created_at || viewingNotif.timestamp || (viewingNotif as any).time)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
              <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                {viewingNotif.details || viewingNotif.description || (viewingNotif as any).message || "—"}
              </p>
            </div>
            <button 
              onClick={() => setIsViewModalOpen(false)} 
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ManagerNotificationsPage;

