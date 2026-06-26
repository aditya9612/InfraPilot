import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
    Clipboard,
    Calendar,
    FileText,
    ChevronRight,
    TrendingUp,
    Users,
    CheckCircle2,
    AlertCircle,
    Download,
    BarChart2,
    Image as ImageIcon,
    Search,
    Plus,
    Eye,
    Edit2,
    Trash2,
    ClipboardList,
    RotateCcw
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { workProgressService } from "../../services/workProgressService";
import { reportService } from "../../services/reportService";
import { projectService } from "../../services/projectService";
import type { DailyEntry, ActivityItem, ProjectSummary } from "../../types/workProgress";

import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import toast from "react-hot-toast";
import LogProgressModal from "../../components/WorkProgress/LogProgressModal";
import AddActivityModal from "../../components/WorkProgress/AddActivityModal";
import EditActivityModal from "../../components/WorkProgress/EditActivityModal";
import ActivityDetailModal from "../../components/WorkProgress/ActivityDetailModal";

const WorkProgressPage = () => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || "daily";
    const { user } = useAuth();
    const {
        selectedProjectId: projectId,
        setSelectedProjectId,
        assignedProjects: projects,
        isLoading: isLoadingProjects
    } = useProject();

    const tabs = [
        { id: "activities", label: "Activity Registry", icon: <ClipboardList className="w-4 h-4" /> },
        { id: "daily", label: "Daily Progress", icon: <Clipboard className="w-4 h-4" /> },
        { id: "weekly", label: "Weekly Tracking", icon: <Calendar className="w-4 h-4" /> },
        { id: "history", label: "Activity History", icon: <FileText className="w-4 h-4" /> },
        { id: "delay", label: "Delay Report", icon: <AlertCircle className="w-4 h-4" /> },
        { id: "reports", label: "Reports & Exports", icon: <TrendingUp className="w-4 h-4" /> },
    ];

    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<DailyEntry[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [summary, setSummary] = useState<ProjectSummary | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [delayItems, setDelayItems] = useState<ActivityItem[]>([]);
    const [weeklyData, setWeeklyData] = useState<any>(null);
    const [activeStatFilter, setActiveStatFilter] = useState<string>("All");
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    // Activity CRUD state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const [eData, aData, sData, hData, dData, wData] = await Promise.all([
                workProgressService.listDailyEntries(),
                workProgressService.listActivities(projectId),
                workProgressService.getProjectSummary(projectId),
                workProgressService.getGlobalLogs(),
                workProgressService.getDelayReport(),
                reportService.getWeeklyProgress(projectId)
            ]);
            setEntries(eData);
            setActivities(aData);
            setSummary(sData);
            setHistory(hData.data || []);
            setDelayItems(dData.data || []);
            setWeeklyData(wData);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load progress data");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabChange = (tabId: string) => {
        navigate(`/manager/work-progress/${tabId}`);
    };

    // Activity CRUD handlers
    const handleAddSubmit = async (data: any) => {
        try {
            await workProgressService.createActivity(data);
            toast.success("Activity created successfully!");
            setIsAddModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to create activity");
        }
    };

    const handleEditSubmit = async (id: number, data: any) => {
        try {
            await workProgressService.updateActivity(id, data);
            toast.success("Activity updated successfully!");
            setIsEditModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to update activity");
        }
    };

    const handleActivityLogSubmit = async (data: any) => {
        try {
            await workProgressService.addDailyProgress(data);
            toast.success("Progress logged successfully!");
            setIsActivityLogModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to log progress");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await workProgressService.deleteActivity(deleteId);
            toast.success("Activity deleted successfully!");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to delete activity");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = async (id: number) => {
        try {
            const fresh = await workProgressService.getActivity(id);
            setSelectedActivity(fresh);
            setIsViewModalOpen(true);
        } catch (err) {
            toast.error("Failed to fetch activity details");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar
                title="Work Progress"
                breadcrumb={["Manager", "Work Progress", tabs.find(t => t.id === activeTab)?.label || "Daily"]}
            />

            <PageTransition className="p-6 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Execution Hub</h1>
                            <p className="text-slate-500 mt-1 text-sm">Monitor site velocity, milestones, and daily operational excellence.</p>
                        </div>

                        {/* Project Selection Dropdown */}
                        <div className="relative min-w-[240px]">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <BarChart2 className="w-4 h-4 text-primary" />
                            </div>
                            <select
                                value={projectId || ""}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSelectedProjectId(val);
                                    (window as any).currentProjectId = val;
                                }}
                                disabled={isLoadingProjects}
                                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                            >
                                {isLoadingProjects ? (
                                    <option>Loading Projects...</option>
                                ) : (
                                    <>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.project_name || p.name || `Project #${p.id}`}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4 text-primary" />
                            Export Report
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add Activity
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === t.id
                                ? "text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                                }`}
                        >
                            {activeTab === t.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{t.icon}</span>
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "activities" && (
                            <ActivityListView
                                loading={loading}
                                activities={activities}
                                onAdd={() => setIsAddModalOpen(true)}
                                onView={(a) => handleView(a.id)}
                                onEdit={(a) => { setSelectedActivity(a); setIsEditModalOpen(true); }}
                                onLog={(a) => { setSelectedActivity(a); setIsActivityLogModalOpen(true); }}
                                onDelete={(a) => { setDeleteId(a.id); setIsDeleteModalOpen(true); }}
                                onRefresh={fetchData}
                            />
                        )}
                        {activeTab === "daily" && (
                            <DailyProgressView
                                loading={loading}
                                entries={entries}
                                activities={activities}
                                summary={summary}
                                onLogClick={() => setIsLogModalOpen(true)}
                                activeStatFilter={activeStatFilter}
                                onStatFilterChange={setActiveStatFilter}
                            />
                        )}
                        {activeTab === "weekly" && <WeeklyProgressView loading={loading} data={weeklyData} />}
                        {activeTab === "history" && <ActivityHistoryView loading={loading} history={history} activities={activities} />}
                        {activeTab === "delay" && <DelayReportView loading={loading} items={delayItems} />}
                        {activeTab === "reports" && <ProgressReportsView projectId={projectId || 0} />}
                    </motion.div>
                </AnimatePresence>

                <LogProgressModal
                    isOpen={isLogModalOpen}
                    onClose={() => setIsLogModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            await workProgressService.addDailyProgress(data);
                            toast.success("Progress logged successfully!");
                            setIsLogModalOpen(false);
                            fetchData();
                        } catch (err) {
                            toast.error("Failed to log progress");
                        }
                    }}
                    activity={null}
                    activitiesList={activities}
                    engineerId={Number(user?.id || 0)}
                />

                <AddActivityModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddSubmit}
                    projectId={projectId || 0}
                    engineerId={Number(user?.id || 0)}
                />

                <EditActivityModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleEditSubmit}
                    activity={selectedActivity}
                />

                <ActivityDetailModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    activity={selectedActivity}
                    onEdit={() => setIsEditModalOpen(true)}
                />

                <LogProgressModal
                    isOpen={isActivityLogModalOpen}
                    onClose={() => setIsActivityLogModalOpen(false)}
                    onSubmit={handleActivityLogSubmit}
                    activity={selectedActivity}
                    activitiesList={activities}
                    engineerId={Number(user?.id || 0)}
                />

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Activity"
                    message="Are you sure you want to delete this activity? All progress history will be permanently removed."
                    confirmText="Delete"
                    type="danger"
                    isLoading={isSubmitting}
                />

                {/* Export Format Picker Modal */}
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                    <Download className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Export Work Progress</h3>
                                <p className="text-sm text-slate-500 mt-1">Select the format to download the report for this project.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    disabled={!!isDownloading}
                                    onClick={async () => {
                                        if (!projectId) return;
                                        setIsDownloading("pdf");
                                        try {
                                            await workProgressService.getPdfReport(projectId);
                                            toast.success("PDF report downloaded!");
                                            setIsExportModalOpen(false);
                                        } catch {
                                            toast.error("Failed to download PDF report");
                                        } finally {
                                            setIsDownloading(null);
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2 p-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {isDownloading === "pdf" ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <FileText className="w-6 h-6" />
                                    )}
                                    <span className="text-sm font-bold">PDF</span>
                                    <span className="text-[10px] opacity-60">Formatted Report</span>
                                </button>

                                <button
                                    disabled={!!isDownloading}
                                    onClick={async () => {
                                        if (!projectId) return;
                                        setIsDownloading("excel");
                                        try {
                                            await workProgressService.getExcelReport(projectId);
                                            toast.success("Excel report downloaded!");
                                            setIsExportModalOpen(false);
                                        } catch {
                                            toast.error("Failed to download Excel report");
                                        } finally {
                                            setIsDownloading(null);
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2 p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {isDownloading === "excel" ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <TrendingUp className="w-6 h-6" />
                                    )}
                                    <span className="text-sm font-bold">Excel</span>
                                    <span className="text-[10px] opacity-60">Spreadsheet Data</span>
                                </button>
                            </div>

                            <button
                                onClick={() => { setIsExportModalOpen(false); setIsDownloading(null); }}
                                className="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </PageTransition>
        </div>
    );
};

const statusBadgeClass: Record<string, string> = {
    "ON_TRACK": "bg-emerald-100 text-emerald-600",
    "DELAY": "bg-red-100 text-red-600",
    "COMPLETED": "bg-blue-100 text-blue-600",
    "NOT_STARTED": "bg-slate-100 text-slate-500"
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const ActivityListView = ({
    loading,
    activities,
    onAdd,
    onView,
    onEdit,
    onLog,
    onDelete,
    onRefresh
}: {
    loading: boolean;
    activities: ActivityItem[];
    onAdd: () => void;
    onView: (a: ActivityItem) => void;
    onEdit: (a: ActivityItem) => void;
    onLog: (a: ActivityItem) => void;
    onDelete: (a: ActivityItem) => void;
    onRefresh: () => void;
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Delayed" | "Execution">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const stats = useMemo(() => {
        const total = activities.length;
        const completed = activities.filter(a => a.status === "COMPLETED" || a.completion_percentage === 100).length;
        const delayed = activities.filter(a => a.status === "DELAY").length;
        const onTrack = activities.filter(a => a.status === "ON_TRACK").length;
        const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, delayed, onTrack, complianceRate: `${complianceRate}%` };
    }, [activities]);

    const filteredActivities = useMemo(() => {
        let data = activities;
        if (activeStatFilter === "Compliance") data = data.filter(a => a.completion_percentage === 100);
        else if (activeStatFilter === "Delayed") data = data.filter(a => a.status === "DELAY");
        else if (activeStatFilter === "Execution") data = data.filter(a => a.status === "ON_TRACK");
        return data.filter(a =>
            (searchTerm === "" || a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()))) &&
            (filterStatus === "All Status" || a.status === filterStatus)
        );
    }, [activities, searchTerm, filterStatus, activeStatFilter]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, activeStatFilter]);

    const paginatedActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.max(1, Math.ceil(filteredActivities.length / itemsPerPage));

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: "Total Activities", value: stats.total.toString(), sub: "Active Ledger", accent: "text-slate-800", status: "All" },
                    { title: "Compliance", value: stats.complianceRate, sub: "Completion Rate", accent: "text-blue-500", status: "Compliance" },
                    { title: "Behind Schedule", value: stats.delayed.toString(), sub: "Action Required", accent: "text-rose-500", status: "Delayed" },
                    { title: "Execution", value: stats.onTrack.toString(), sub: "On Track Items", accent: "text-emerald-500", status: "Execution" },
                ].map((s) => (
                    <div
                        key={s.title}
                        onClick={() => setActiveStatFilter(s.status as any)}
                        className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group ${activeStatFilter === s.status ? "ring-2 ring-primary/20" : ""}`}
                    >
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">{s.title}</p>
                        <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Registry Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by activity name or BOQ code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                        >
                            <option value="All Status">ALL STATUS</option>
                            <option value="NOT_STARTED">NOT STARTED</option>
                            <option value="ON_TRACK">ON TRACK</option>
                            <option value="DELAY">DELAY</option>
                            <option value="COMPLETED">COMPLETED</option>
                        </select>
                        {activeStatFilter !== "All" && (
                            <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm">
                            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-inter min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4">Activity Description</th>
                                <th className="px-6 py-4">Logistics</th>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
                                    </td>
                                </tr>
                            ) : paginatedActivities.length > 0 ? paginatedActivities.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm">{a.activity_name}</p>
                                        {a.boq_code && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">BOQ: {a.boq_code}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-800">{a.total_completed} / {a.planned_quantity} {a.unit}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{a.remaining_quantity} Remaining</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600">{formatDate(a.start_date)}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To {formatDate(a.end_date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-24">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                                                <span>Progress</span>
                                                <span>{Number(a.completion_percentage || 0).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${a.completion_percentage || 0}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${statusBadgeClass[a.status] || "bg-slate-100 text-slate-500"}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => onView(a)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onEdit(a)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit Activity">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onLog(a)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Log Progress">
                                                <ClipboardList className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(a)}
                                                disabled={a.status === "ON_TRACK" || a.status === "COMPLETED"}
                                                className={`p-2 rounded-xl transition-all ${a.status === "ON_TRACK" || a.status === "COMPLETED" ? "text-slate-300 opacity-50 cursor-not-allowed" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
                                                title={a.status === "ON_TRACK" || a.status === "COMPLETED" ? "Cannot delete active or completed activities" : "Delete Activity"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-sm">
                                        No activities found in the project registry.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && filteredActivities.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none bg-white shadow-sm"
                            >
                                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} records
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${currentPage === p ? 'bg-primary text-white border border-primary' : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'}`}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DailyProgressView = ({
    loading,
    entries,
    activities,
    summary,
    onLogClick,
    activeStatFilter,
    onStatFilterChange
}: {
    loading: boolean,
    entries: DailyEntry[],
    activities: ActivityItem[],
    summary: ProjectSummary | null,
    onLogClick: () => void,
    activeStatFilter: string,
    onStatFilterChange: (filter: string) => void
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const a = activities.find(act => act.id === e.activity_id);
            const matchesSearch = searchTerm === "" ||
                a?.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a?.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStat = activeStatFilter === "All" ||
                (activeStatFilter === "Completed" && (a?.status === "Completed" || a?.completion_percentage === 100)) ||
                (activeStatFilter === "Delayed" && a?.status === "Delay");

            return matchesSearch && matchesStat;
        });
    }, [entries, activities, searchTerm, activeStatFilter]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => onStatFilterChange("All")} className="cursor-pointer">
                    <StatCard
                        title="Total Activities"
                        value={summary?.total_activities.toString() || "0"}
                        sub="Active Scope"
                        accent={activeStatFilter === "All" ? "text-primary ring-2 ring-primary/20 rounded-2xl p-1" : "text-primary"}
                        icon={<TrendingUp className="w-5 h-5 text-primary" />}
                    />
                </div>
                <div onClick={() => onStatFilterChange("Completed")} className="cursor-pointer">
                    <StatCard
                        title="Completed"
                        value={summary?.completed_activities.toString() || "0"}
                        sub="Finished Activities"
                        accent={activeStatFilter === "Completed" ? "text-emerald-500 ring-2 ring-emerald-500/20 rounded-2xl p-1" : "text-emerald-500"}
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    />
                </div>
                <div onClick={() => onStatFilterChange("Delayed")} className="cursor-pointer">
                    <StatCard
                        title="Delayed"
                        value={summary?.delayed_activities.toString() || "0"}
                        sub="Needs Attention"
                        accent={activeStatFilter === "Delayed" ? "text-rose-500 ring-2 ring-rose-500/20 rounded-2xl p-1" : "text-rose-500"}
                        icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
                    />
                </div>
                <StatCard
                    title="Recent Updates"
                    value={entries.length.toString()}
                    sub="Logs synchronized"
                    accent="text-amber-500"
                    icon={<Clipboard className="w-5 h-5 text-amber-500" />}
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800">Daily Progress Registry</h3>
                        <p className="text-xs text-slate-400">Granular view of site execution and material quantities.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search activity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                            />
                        </div>
                        <button
                            onClick={onLogClick}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Clipboard className="w-4 h-4" />
                            Log Progress
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-inter">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Activity / BOQ</th>
                                <th className="px-6 py-4">Planned</th>
                                <th className="px-6 py-4">Actual</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Logged By</th>
                                <th className="px-6 py-4">Logged At</th>
                                <th className="px-6 py-4">Remarks</th>
                                <th className="px-6 py-4 text-right">Evidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4"><div className="h-10 bg-slate-50 rounded" /></td>
                                    </tr>
                                ))
                            ) : filteredEntries.length > 0 ? filteredEntries.map((e) => {
                                const activity = activities.find(a => a.id === e.activity_id);
                                return (
                                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                                            {e.entry_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-sm">{activity?.activity_name || "Unknown Activity"}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{activity?.boq_code || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                                            {activity?.planned_quantity || "0"} <span className="text-[10px]">{activity?.unit}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-primary">{e.today_progress}</span>
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">{activity?.unit}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${(activity?.status === "On Track" || activity?.status === "ON_TRACK") ? "bg-emerald-50 text-emerald-600" :
                                                activity?.status === "Delay" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-primary"
                                                }`}>
                                                {activity?.status || "In Progress"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UID {e.created_by || 1}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] text-slate-400">
                                            {e.created_at ? new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                                        </td>
                                        <td className="px-6 py-4 max-w-[150px]">
                                            <p className="text-xs text-slate-500 truncate" title={e.remarks}>{e.remarks || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2 group-hover:space-x-1 transition-all duration-300 justify-end">
                                                {e.photos && e.photos.length > 0 ? e.photos.slice(0, 3).map((p, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-lg border-2 border-white overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                                        <img src={p} alt="Site" className="w-full h-full object-cover" />
                                                    </div>
                                                )) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                        <ImageIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                {e.photos && e.photos.length > 3 && (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
                                                        +{e.photos.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <Clipboard className="w-12 h-12 text-slate-200 mb-4" />
                                            <h3 className="text-lg font-bold text-slate-400">No Daily Entries Found</h3>
                                            <p className="text-sm text-slate-400">Site updates will appear here once submitted by engineers.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const WeeklyProgressView = ({ loading, data }: { loading: boolean, data: any }) => {
    // Normalize API response — weekly report may return different shapes
    const milestones: any[] = Array.isArray(data)
        ? data
        : data?.milestones || data?.activities || data?.data || [];

    const statusColor = (status: string) => {
        if (!status) return "border-l-primary";
        const s = status.toLowerCase();
        if (s === "completed") return "border-l-emerald-500";
        if (s.includes("delay") || s === "delayed") return "border-l-rose-500";
        if (s.includes("progress") || s === "on_track" || s === "on track") return "border-l-primary";
        return "border-l-slate-300";
    };

    const statusBadge = (status: string) => {
        if (!status) return "bg-blue-100 text-primary";
        const s = status.toLowerCase();
        if (s === "completed") return "bg-emerald-100 text-emerald-600";
        if (s.includes("delay") || s === "delayed") return "bg-rose-100 text-rose-600";
        return "bg-blue-100 text-primary";
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Weekly Performance Assessment</h3>
                    <p className="text-sm text-slate-500">Milestone analysis and delivery velocity for current cycle.</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">LIVE DATA</span>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                        const isToday = i === new Date().getDay();
                        return (
                            <div key={i} className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${isToday ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 border-slate-200"}`}>
                                <span className="text-xs font-bold opacity-70">{day}</span>
                                <span className={`text-lg font-black ${isToday ? "text-white" : "text-slate-800"}`}>{new Date(Date.now() - (new Date().getDay() - i) * 86400000).getDate()}</span>
                                {i <= new Date().getDay() ? <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> : <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />}
                            </div>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
                        ))
                    ) : milestones.length > 0 ? milestones.map((item: any, i: number) => {
                        const title = item.title || item.activity_name || item.name || "Unnamed Activity";
                        const project = item.project || item.project_name || "Current Project";
                        const progress = item.progress ?? item.completion_percentage ?? 0;
                        const status = item.status || "In Progress";

                        return (
                            <div
                                key={i}
                                className={`p-4 bg-white border border-slate-100 border-l-4 ${statusColor(status)} rounded-xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer`}
                            >
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <BarChart2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                                        <p className="text-xs text-slate-500">{project}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="hidden md:block w-32">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                            <span>Progress</span>
                                            <span>{Number(progress).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(status)}`}>
                                        {status}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center py-16 text-center">
                            <BarChart2 className="w-12 h-12 text-slate-200 mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">No Weekly Data Available</h3>
                            <p className="text-sm text-slate-400 mt-1">Weekly milestone data will appear here once the backend reports are generated for this project.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProgressReportsView = ({ projectId }: { projectId: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
            { title: "Consolidated Daily Reports", icon: <FileText />, desc: "Complete site logs, labor attendance and material intake for the current week.", type: "Daily" },
            { title: "Weekly Milestone Analysis", icon: <TrendingUp />, desc: "Comparative study of planned vs actual progress across all active projects.", type: "Weekly" },
            { title: "Resource Utilization Summary", icon: <Users />, desc: "Deep dive into labor efficiency and machinery uptime metrics.", type: "Resource" },
            { title: "Engineering Audit Logs", icon: <CheckCircle2 />, desc: "Technical compliance and quality control verification reports.", type: "QC" },
            { title: "Delay & Risk Assessment", icon: <AlertCircle />, desc: "Identification of bottlenecks and predictive impact analysis.", type: "Risk" },
            { title: "Monthly Project Scorecard", icon: <BarChart2 />, desc: "Executive summary of holistic project performance and ROI tracking.", type: "Monthly" },
        ].map((report, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4">
                    {report.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{report.type}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Updated 2h ago</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{report.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">{report.desc}</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => toast("Report preview is coming soon!")}
                        className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                    >
                        Preview
                    </button>
                    <button
                        onClick={() => {
                            if (!projectId) return;
                            if (report.type === "Daily" || report.type === "Weekly") {
                                workProgressService.getExcelReport(projectId);
                            } else {
                                workProgressService.getPdfReport(projectId);
                            }
                        }}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all font-inter"
                    >
                        Download
                    </button>
                </div>
            </div>
        ))}
    </div>
);

const ActivityHistoryView = ({ loading, history, activities }: { loading: boolean, history: any[], activities: ActivityItem[] }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Operational Audit Trail</h3>
                <p className="text-sm text-slate-500">Comprehensive chronicle of field execution and value updates.</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">PROJECT {activities[0]?.project_id || 92}</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left font-inter">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                        <th className="px-6 py-4 text-center w-16">#</th>
                        <th className="px-6 py-4">Action & Identity</th>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Status & Delta</th>
                        <th className="px-6 py-4">Remarks</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td colSpan={5} className="px-6 py-4"><div className="h-10 bg-slate-50 rounded" /></td>
                            </tr>
                        ))
                    ) : history.length > 0 ? history.map((item, i) => {
                        const activity = activities.find(a => a.id === item.activity_id);
                        return (
                            <tr key={i} className="hover:bg-slate-50/10 transition-colors">
                                <td className="px-6 py-4 text-center font-bold text-slate-300">{item.id || i + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{activity?.activity_name || "System Event"}</span>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter flex items-center gap-1">
                                            {item.action || "UPDATE"} <span className="text-slate-300">|</span> BY UID {item.changed_by || 1}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                    {item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] w-fit font-bold uppercase tracking-tighter ${(item.new_value?.status === "Delay" || item.action === "DELAY") ? "bg-rose-50 text-rose-600" :
                                            (item.new_value?.status === "Completed" || item.new_value?.completion_percentage === 100) ? "bg-emerald-50 text-emerald-600" :
                                                "bg-blue-50 text-primary"
                                            }`}>
                                            {item.new_value?.status || "Modified"}
                                        </span>
                                        {item.new_value?.today_progress && (
                                            <span className="text-[10px] font-bold text-slate-400">Added {item.new_value.today_progress} {activity?.unit}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[11px] text-slate-500 italic max-w-[200px] truncate" title={item.remarks}>{item.remarks || "No remarks recorded."}</p>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-sm">No operational logs found in the registry.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const DelayReportView = ({ loading, items }: { loading: boolean, items: ActivityItem[] }) => (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-xl shadow-rose-500/5 overflow-hidden">
        <div className="p-6 border-b border-rose-50 bg-rose-50/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500 rounded-lg text-white shadow-lg shadow-rose-500/20">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Critical Delay Assessment</h3>
                    <p className="text-sm text-slate-500">Activities currently identified as "Below Velocity" or "Behind Schedule".</p>
                </div>
            </div>
            <button className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Report
            </button>
        </div>
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-slate-50 rounded-2xl h-32" />
                    ))
                ) : items.length > 0 ? items.map((item, i) => (
                    <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-rose-300 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{item.activity_name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.boq_code || "GENERIC SCOPE"}</p>
                            </div>
                            <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded uppercase tracking-tighter">DELAY</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Target Completion</span>
                                <span className="font-bold text-slate-700">{item.end_date || "TBD"}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${item.completion_percentage}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-rose-500">{item.completion_percentage}% Complete</span>
                                <span className="text-slate-400">{item.remaining_quantity} {item.unit} Remaining</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-2 py-20 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <CheckCircle2 className="w-12 h-12 text-emerald-100 mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">No Critical Delays</h3>
                        <p className="text-sm text-slate-300 uppercase tracking-widest font-inter">Project velocity is within acceptable parameters.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default WorkProgressPage;
