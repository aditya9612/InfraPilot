import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../components/common/Modal";
import { notificationService, type Notification } from "../../services/notificationService";

const EngineerNotificationsPage = () => {
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
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeStatFilter === "Unread" && n.read) return false;
    if (activeStatFilter === "Read" && !n.read) return false;
    if (activeStatFilter === "Approval" && n.type !== "Approval") return false;

    return true;
  });

  const paginatedNotifs = filteredNotifs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead("SiteEngineer", notifications);
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
      <Navbar title="My Notifications" breadcrumb={["Engineer", "Notifications"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notification Center</h1>
            <p className="text-slate-500 text-sm">View all your alerts, approvals, and system messages.</p>
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
          <div className="p-4 border-b border-slate-50">
            <div className="relative flex-1 max-w-md">
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
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredNotifs.length > 0 && filteredNotifs.every(n => selectedIds.includes(n.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 w-48">Type</th>
                  <th className="px-6 py-4">Title & Description</th>
                  <th className="px-6 py-4">Date & Time</th>
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
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            notif.type === "Alert" ? "bg-rose-50 text-rose-600" : notif.type === "Approval" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          {!notif.read && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full"></span>
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
                        <p className="text-xs font-bold text-slate-600">{new Date(notif.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewDetails(notif)}
                        className="px-4 py-2 text-[10px] font-bold text-white bg-primary hover:bg-blue-600 uppercase tracking-widest rounded-xl transition-all font-inter shadow-lg shadow-primary/20 active:scale-95"
                      >
                        <Eye className="px-4 py-2 text-[10px] font-bold text-white bg-primary hover:bg-blue-600 uppercase tracking-widest rounded-xl transition-all font-inter shadow-lg shadow-primary/20 active:scale-95" />
                        <span className="px-4 py-2 text-[10px] font-bold text-white bg-primary hover:bg-blue-600 uppercase tracking-widest rounded-xl transition-all font-inter shadow-lg shadow-primary/20 active:scale-95">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredNotifs.length > 0 && (
            <div className="p-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rows per page</span>
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Middle: Current info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredNotifs.length)} of {filteredNotifs.length} records
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
                      const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / itemsPerPage));
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
                          const pageNum = page as number;
                          const isActive = currentPage === pageNum;
                          return (
                              <button
                                  key={`page-${pageNum}`}
                                  onClick={() => setCurrentPage(pageNum)}
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
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredNotifs.length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.max(1, Math.ceil(filteredNotifs.length / itemsPerPage)) || filteredNotifs.length === 0}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
            </div>
          )}
          {filteredNotifs.length === 0 && (
            <div className="p-20 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-lg">No Notifications</p>
              <p className="text-slate-500 text-sm">You're all caught up!</p>
            </div>
          )}
        </div>
      </PageTransition>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Notification Details"
        maxWidth="max-w-md"
      >
        {viewingNotif && (
            <div className="p-6 font-inter">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${viewingNotif.type === 'Alert' ? 'bg-rose-100 text-rose-600' : viewingNotif.type === 'Approval' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{viewingNotif.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(viewingNotif.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{viewingNotif.details}</p>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all uppercase tracking-widest text-xs">
                    Dismiss
                </button>
            </div>
        )}
      </Modal>
    </>
  );
};

export default EngineerNotificationsPage;
