import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { alertService, type Alert } from "../../services/alertService";
import { projectService } from "../../services/projectService";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { Bell, CheckCircle, AlertCircle, Eye, Trash2, Check, Clock } from 'lucide-react';

const LabourNotificationsPage = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem("infrapilot_user");
            let pId = 92;
            if (userStr) {
                const user = JSON.parse(userStr);
                pId = user.project_id || user.user?.project_id || 92;
            }

            // Individual try-catches to prevent one failure from blocking all notifications
            let generalData: Alert[] = [];
            try { generalData = await alertService.getAlerts(); } catch (e) { console.error("General alerts fail", e); }

            let projectAlertsRaw: any[] = [];
            try { projectAlertsRaw = await projectService.getProjectAlerts(); } catch (e) { console.error("Project alerts fail", e); }

            let taskAlertsRaw: any[] = [];
            try { taskAlertsRaw = await projectService.getTaskAlerts(); } catch (e) { console.error("Task alerts fail", e); }

            // Map project alerts
            const mappedProjectAlerts: Alert[] = projectAlertsRaw.map((p: any) => ({
                id: `p-${p.project_id}`,
                project_id: p.project_id,
                alert_type: p.status || "Update",
                message: p.project_name || "Project Update",
                project_name: p.project_name,
                end_date: p.end_date,
                user_id: 0,
                status: 'active',
                created_at: new Date().toISOString()
            }));

            // Map task alerts
            const mappedTaskAlerts: Alert[] = taskAlertsRaw.map((t: any) => ({
                id: `t-${t.task_id}`,
                project_id: t.project_id,
                alert_type: t.status || "Task Alert",
                message: t.title || "Task Alert",
                project_name: t.project_name || "Task Assignment",
                end_date: t.end_date,
                start_date: t.start_date,
                user_id: 0,
                status: 'active',
                created_at: new Date().toISOString()
            }));

            // Force injection of requested "Assigned Task" notification for demonstration
            const demoTask: Alert = {
                id: "t-demo-001",
                project_id: pId,
                alert_type: "Task Assigned",
                message: "Plastering Work - Secondary Hall",
                project_name: "Urban Heights Phase 2",
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
                user_id: 0,
                status: 'active',
                created_at: new Date().toISOString()
            };

            const combined = [...generalData, ...mappedProjectAlerts, ...mappedTaskAlerts, demoTask];

            // Filter for labour's project
            const filtered = combined.filter(a => Number(a.project_id) === Number(pId));
            setAlerts(filtered);
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
            toast.error("Connecting to notification server...");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleMarkRead = async (id: string | number) => {
        if (typeof id === 'string' && (id.startsWith('p-') || id.startsWith('t-'))) {
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

    const displayableAlerts = alerts.filter(a => {
        const allowedTypes = [
            "Delay", "MaterialDelay", "Planning", "InProgress", "In Progress", "In-Progress",
            "Announcement", "NewAlert", "New Alert", "Safety", "Quality", "Material",
            "Task", "Milestone", "Alert", "Warning", "Critical", "Info", "Approval", "Task Assigned"
        ];
        return allowedTypes.some(t => a.alert_type.toLowerCase().replace(/[^a-z]/g, '') === t.toLowerCase().replace(/[^a-z]/g, ''));
    });

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
        const t = type.toLowerCase();
        if (t.includes('critical') || t.includes('delay')) return 'bg-rose-50 text-rose-600';
        if (t.includes('warning') || t.includes('safety')) return 'bg-amber-50 text-amber-600';
        if (t.includes('quality')) return 'bg-emerald-50 text-emerald-600';
        return 'bg-blue-50 text-blue-600';
    };

    const formatDateOnly = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            <Navbar title="Notifications" breadcrumb={["Labour", "Communication", "Alerts"]} />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Official Project Notifications</h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Important project updates, mobilization notices, and official company communications</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: "Total Notifications", value: displayableAlerts.length, sub: "All Notifications", color: "text-slate-800", icon: <Bell className="w-5 h-5" />, filter: "All" },
                        { label: "Read Notifications", value: displayableAlerts.filter(a => a.status === 'read').length, sub: "Acknowledged", color: "text-emerald-500", icon: <CheckCircle className="w-5 h-5" />, filter: "Read" },
                        { label: "Unread Notifications", value: displayableAlerts.filter(a => a.status === 'active' || !a.status).length, sub: "Action Required", color: "text-blue-500", icon: <AlertCircle className="w-5 h-5" />, filter: "Unread" },
                    ].map((card, i) => (
                        <div
                            key={i}
                            onClick={() => setStatusFilter(card.filter)}
                            className={`bg-white p-8 rounded-[40px] border transition-all h-full flex flex-col justify-between cursor-pointer group ${statusFilter === card.filter ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${statusFilter === card.filter ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}>{card.icon}</div>
                            </div>
                            <h3 className={`text-4xl font-black ${card.color} mb-2 tracking-tighter`}>{card.value}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{card.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">establishing secure channel...</p>
                        </div>
                    ) : filteredAlerts.length > 0 ? (
                        filteredAlerts.map((ann) => (
                            <div key={ann.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Action Buttons - Top Right */}
                                <div className="absolute top-8 right-8 flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedAlert(ann);
                                            setIsModalOpen(true);
                                        }}
                                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center group/btn"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => ann.status !== 'read' && handleMarkRead(ann.id)}
                                        disabled={ann.status === 'read'}
                                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center group/btn ${ann.status === 'read'
                                            ? 'bg-emerald-50 text-emerald-400 cursor-default'
                                            : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95'
                                            }`}
                                        title={ann.status === 'read' ? "Acknowledged" : "Mark as Read"}
                                    >
                                        <Check className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center group/btn"
                                        title="Delete Notification"
                                    >
                                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                </div>

                                <div className="pr-36 flex-1 w-full">
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            {ann.status === 'active' && (
                                                <div className="relative flex items-center justify-center mr-1">
                                                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                                                </div>
                                            )}
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ann.id.toString().startsWith('t-') ? "Task Alert" : "Project Update"}</p>
                                        </div>
                                        <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getPriorityColor(ann.alert_type)}`}>
                                            {ann.alert_type}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">{formatDate(ann.created_at)}</p>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-4">
                                        {ann.project_name && !ann.id.toString().startsWith('t-') ? ann.project_name : ann.message}
                                    </h2>

                                    {ann.project_name && (
                                        <p className="text-[14px] font-bold text-slate-500 mb-6 leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                                            Current Status: <span className="text-slate-800 not-italic">{ann.alert_type}</span>
                                        </p>
                                    )}

                                    {!ann.project_name && (
                                        <p className="text-[14px] font-bold text-slate-600 mb-6 leading-relaxed max-w-4xl">{ann.message}</p>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                        <div className="flex items-center gap-3 bg-slate-50 w-fit px-4 py-2 rounded-2xl border border-slate-100">
                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-indigo-500 border border-indigo-50">S</div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Published via System Oracle</span>
                                        </div>
                                        {ann.id.toString().startsWith('t-') && ann.start_date && ann.end_date && (
                                            <div className="flex items-center gap-3 bg-amber-50 w-fit px-4 py-2 rounded-2xl border border-amber-100">
                                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest whitespace-nowrap">
                                                    Duration: {formatDateOnly(ann.start_date)} - {formatDateOnly(ann.end_date)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 border-dashed">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No notifications found.</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Notification Intelligence"
                maxWidth="max-w-xl"
            >
                {selectedAlert && (
                    <div className="p-8 font-inter">
                        <div className="flex items-center gap-5 mb-10">
                            <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-xl shadow-lg ${getPriorityColor(selectedAlert.alert_type)}`}>
                                <Bell className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedAlert.alert_type}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction ID: {selectedAlert.id}</p>
                            </div>
                            <div className={`ml-auto px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedAlert.status === 'read' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600 animate-pulse'}`}>
                                {selectedAlert.status === 'read' ? 'Acknowledged' : 'Active Alert'}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Narrative & Insight</p>
                                <p className="text-base font-bold text-slate-700 leading-relaxed">{selectedAlert.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Identifier</p>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">PRJ-{selectedAlert.project_id}</p>
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Timeline Audit</p>
                                    <p className="text-sm font-black text-slate-700">{formatDate(selectedAlert.created_at)}</p>
                                </div>
                                {selectedAlert.start_date && selectedAlert.end_date && (
                                    <div className="col-span-2 p-6 bg-amber-50/50 border border-amber-100 rounded-[28px] shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Assigned Start</p>
                                            <p className="text-sm font-black text-slate-800">{formatDateOnly(selectedAlert.start_date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Expected End</p>
                                            <p className="text-sm font-black text-slate-800">{formatDateOnly(selectedAlert.end_date)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full mt-10 py-5 bg-slate-900 hover:bg-black text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-[24px] transition-all shadow-xl active:scale-95 border-b-4 border-slate-700 active:border-b-0"
                        >
                            Close Intelligence View
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default LabourNotificationsPage;
