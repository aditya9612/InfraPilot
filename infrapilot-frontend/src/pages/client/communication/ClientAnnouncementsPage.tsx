import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { alertService, type Alert } from "../../../services/alertService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const ClientAnnouncementsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { projectId } = useClientProjectId();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [generalData, projectAlertsRaw, taskAlertsRaw] = await Promise.all([
        alertService.getAlerts(),
        projectService.getProjectAlerts(),
        projectService.getTaskAlerts()
      ]);

      // Map project alerts to the standard Alert interface
      const mappedProjectAlerts: Alert[] = projectAlertsRaw.map((p: any) => ({
        id: `p-${p.project_id}`,
        project_id: p.project_id,
        alert_type: p.status, // e.g. "Delayed", "Ongoing" (In Progress), "Planned"
        message: p.project_name || "Project Update",
        project_name: p.project_name,
        end_date: p.end_date,
        user_id: 0,
        status: 'active',
        created_at: new Date().toISOString() // Project alerts are snapshots, use current time
      }));

      // Map task alerts to the standard Alert interface
      const mappedTaskAlerts: Alert[] = taskAlertsRaw.map((t: any) => ({
        id: `t-${t.task_id}`,
        project_id: t.project_id,
        alert_type: t.status || "Delayed",
        message: t.title || "Task Alert",
        project_name: t.project_name || "Task Constraint",
        end_date: t.end_date,
        user_id: 0,
        status: 'active',
        created_at: new Date().toISOString()
      }));

      const combined = [...generalData, ...mappedProjectAlerts, ...mappedTaskAlerts];

      const filtered = projectId
        ? combined.filter(a => Number(a.project_id) === Number(projectId))
        : combined;
      setAlerts(filtered);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [projectId]);

  const handleMarkRead = async (id: string | number) => {
    if (typeof id === 'string' && (id.startsWith('p-') || id.startsWith('t-'))) {
      // Local state only for virtual alerts
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a));
      toast.success("Acknowledged");
      return;
    }
    try {
      await alertService.markAlertRead(id as number);
      toast.success("Marked as read");
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Delete this notification?")) return;
    if (typeof id === 'string' && (id.startsWith('p-') || id.startsWith('t-'))) {
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Removed");
      return;
    }
    try {
      await alertService.deleteAlert(id as number);
      toast.success("Notification deleted");
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  // 1. First, define the base set of alerts that are allowed to be shown (filtered by project and type)
  const displayableAlerts = alerts.filter(a => {
    // Show only specific types: Delay, Planning, In Progress, New Alerts, Safety, Quality, etc.
    const allowedTypes = [
      "Delay", "MaterialDelay", "Planning", "InProgress", "In Progress", "In-Progress",
      "Announcement", "NewAlert", "New Alert", "Safety", "Quality", "Material",
      "Task", "Milestone", "Alert", "Warning", "Critical", "Info", "Approval"
    ];
    return allowedTypes.some(t => a.alert_type.toLowerCase().replace(/[^a-z]/g, '') === t.toLowerCase().replace(/[^a-z]/g, ''));
  });

  // 2. Then, apply status filtering for the actual list display
  const filteredAlerts = displayableAlerts.filter(a => {
    const statusMatch = statusFilter === "All"
      || (statusFilter === "Read" && a.status === 'read')
      || (statusFilter === "Unread" && (a.status === 'active' || !a.status));
    return statusMatch;
  }).sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (type: string) => {
    if (type === 'Critical' || type === 'MaterialDelay') return 'bg-red-50 text-red-600';
    if (type === 'Warning') return 'bg-amber-50 text-amber-600';
    return 'bg-blue-50 text-blue-600';
  };

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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Notifications", value: displayableAlerts.length, sub: "All Notifications", color: "text-slate-800", icon: "📢", filter: "All" },
            { label: "Read Notifications", value: displayableAlerts.filter(a => a.status === 'read').length, sub: "Acknowledged", color: "text-emerald-500", icon: "✅", filter: "Read" },
            { label: "Unread Notifications", value: displayableAlerts.filter(a => a.status === 'active' || !a.status).length, sub: "Action Required", color: "text-blue-500", icon: "🔔", filter: "Unread" },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => setStatusFilter(card.filter)}
              className={`bg-white p-6 rounded-3xl border transition-all h-full flex flex-col justify-between cursor-pointer ${statusFilter === card.filter ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${statusFilter === card.filter ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50'}`}>{card.icon}</div>
              </div>
              <h3 className={`text-4xl font-black ${card.color} mb-1 tracking-tighter`}>{card.value}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">establishing secure channel...</p>
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((ann) => (
              <div key={ann.id} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 group relative flex flex-col md:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {ann.status === 'active' && (
                        <div className="relative flex items-center justify-center mr-1">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                        </div>
                      )}
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ann.id.toString().startsWith('t-') ? "Task Alert" : "Project Update"}</p>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getPriorityColor(ann.alert_type)}`}>
                      {ann.alert_type}
                    </div>
                    <p className="text-[9px] text-slate-400 font-black">{formatDate(ann.created_at)}</p>
                  </div>

                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-3">
                    {ann.project_name ? ann.project_name : ann.message}
                  </h2>

                  {ann.end_date && (
                    <div className="flex items-center gap-3 mb-3 bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date:</span>
                      <span className="text-[10px] font-black text-slate-700">{formatDate(ann.end_date)}</span>
                    </div>
                  )}

                  {ann.project_name && (
                    <p className="text-[12px] font-bold text-slate-500 mb-4 italic">
                      Current Status: <span className="text-slate-800 not-italic">{ann.alert_type}</span>
                    </p>
                  )}

                  {!ann.project_name && (
                    <p className="text-[13px] font-bold text-slate-600 mb-4 leading-relaxed">{ann.message}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">S</div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Published via System Oracle</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedAlert(ann);
                      setIsModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-blue-600 transition-all transform hover:scale-110"
                    title="View Details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button
                    onClick={() => ann.status !== 'read' && handleMarkRead(ann.id)}
                    disabled={ann.status === 'read'}
                    className={`transition-all transform ${ann.status === 'read'
                      ? 'text-slate-300 cursor-default'
                      : 'text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95'
                      }`}
                    title={ann.status === 'read' ? "Acknowledged" : "Mark as Read"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="text-slate-400 hover:text-red-600 transition-all transform hover:scale-110"
                    title="Delete Notification"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 border-dashed">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No notifications found.</p>
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
        {selectedAlert && (
          <div className="p-8 font-inter">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${getPriorityColor(selectedAlert.alert_type)}`}>
                📢
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedAlert.alert_type}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction ID: {selectedAlert.id}</p>
              </div>
              <div className={`ml-auto px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedAlert.status === 'read' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 animate-pulse'}`}>
                {selectedAlert.status === 'read' ? 'Acknowledged' : 'Active Alert'}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Narrative & Insight</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Identifier</p>
                  <p className="text-xs font-black text-slate-700">PRJ-{selectedAlert.project_id}</p>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeline Audit</p>
                  <p className="text-xs font-black text-slate-700">{formatDate(selectedAlert.created_at)}</p>
                </div>
              </div>

              {selectedAlert.project_name && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Project Context</p>
                    <p className="text-xs font-black text-blue-700">{selectedAlert.project_name}</p>
                  </div>
                  {selectedAlert.end_date && (
                    <div className="text-right">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Target End Date</p>
                      <p className="text-xs font-black text-blue-700">{formatDate(selectedAlert.end_date)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg"
            >
              Close Intelligence View
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientAnnouncementsPage;
