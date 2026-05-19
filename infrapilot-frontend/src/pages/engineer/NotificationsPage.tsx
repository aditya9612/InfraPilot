import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Bell, CheckCheck } from "lucide-react";
import Modal from "../../components/common/Modal";
import { notificationService, type Notification } from "../../services/notificationService";

const EngineerNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingNotif, setViewingNotif] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Unread" | "Read" | "Approval">("All");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const data = await notificationService.getNotifications("SiteEngineer");
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

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead("SiteEngineer");
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

  const handleToggleSelect = (id: number) => {
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
      
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-inter">
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
                {filteredNotifs.map((notif) => (
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
                        className="p-2 text-slate-400 hover:text-primary bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all shadow-sm flex items-center gap-2 ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
