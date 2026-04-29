import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateAlertModal from "../../components/forms/CreateAlertModal";
import toast from "react-hot-toast";
import { Eye, Trash2 } from "lucide-react";
import AlertDetailsModal from "../../components/dashboard/AlertDetailsModal";

const initialAlerts = [
  { id: 1, type: "Delay", message: "Excavation at Skyline Tower A is 3 days behind schedule.", target: "Project Manager, Admin", date: "2026-04-02", status: "Critical", isRead: false },
  { id: 2, type: "Budget", message: "Material procurement for Metro Ph-II exceeded budget by 12%.", target: "Accountant, Admin", date: "2026-04-01", status: "Warning", isRead: false },
  { id: 3, type: "Safety", message: "Weekly safety audit completed. 2 minor issues detected.", target: "Site Engineer", date: "2026-03-30", status: "Normal", isRead: true },
];

const NotificationsPage = () => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingAlert, setViewingAlert] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filteredAlerts = alerts.filter(a => 
    a.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    toast.success("All notifications marked as read.");
  };

  const handleSendAlert = (data: any) => {
    const newAlert = {
      ...data,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      isRead: false
    };
    setAlerts(prev => [newAlert, ...prev]);
    setIsModalOpen(false);
    toast.success("Alert broadcasted successfully!");
  };

  const handleDelete = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success("Alert removed.");
  };

  const toggleRead = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a));
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
          <StatCard title="Unread Alerts" value={alerts.filter(a => !a.isRead).length.toString()} sub="Action required" accent="text-primary" />
          <StatCard title="Critical Issues" value={alerts.filter(a => a.status === "Critical").length.toString()} sub="Requires immediate action" accent="text-rose-500" />
          <StatCard title="Total Broadcasts" value={alerts.length.toString()} sub="All-time alerts sent" accent="text-emerald-500" />
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
                placeholder="Search alerts by type or target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Alert Type</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">User Target</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className={`hover:bg-slate-50/50 transition-colors group ${!alert.isRead ? "bg-primary/[0.02]" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            alert.type === "Delay" ? "bg-amber-50 text-amber-600" : alert.type === "Budget" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {alert.type === "Delay" ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : alert.type === "Budget" ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            )}
                          </div>
                          {!alert.isRead && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <span className={`font-bold transition-colors group-hover:text-primary ${!alert.isRead ? "text-slate-900" : "text-slate-500"}`}>{alert.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm max-w-sm line-clamp-1 group-hover:text-primary transition-colors ${!alert.isRead ? "text-slate-800 font-semibold" : "text-slate-500 font-medium"}`}>{alert.message}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {alert.target}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {alert.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        alert.status === "Critical" ? "bg-rose-100 text-rose-600" : alert.status === "Warning" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      }`}>
                        {alert.status}
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
                          onClick={() => handleDelete(alert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                          title="Delete Alert"
                        >
                          <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </>
  );
};

export default NotificationsPage;
