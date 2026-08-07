import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ClipboardList,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileDown
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { workProgressService } from "../../../services/workProgressService";
import { projectService } from "../../../services/projectService";
import { reportService } from "../../../services/reportService";
import api from "../../../services/api";
import type { ActivityItem } from "../../../types/workProgress";
import { useProject } from "../../../context/ProjectContext";

// Modular Components
import AddActivityModal from "../../../components/WorkProgress/AddActivityModal";
import EditActivityModal from "../../../components/WorkProgress/EditActivityModal";
import ActivityDetailModal from "../../../components/WorkProgress/ActivityDetailModal";
import LogProgressModal from "../../../components/WorkProgress/LogProgressModal";

const statusBadge: Record<string, string> = {
  "ON_TRACK": "bg-emerald-100 text-emerald-600",
  "DELAY": "bg-red-100 text-red-600",
  "COMPLETED": "bg-blue-100 text-blue-600",
  "NOT_STARTED": "bg-slate-100 text-slate-500"
};

const ActivityListPage = () => {
  const { user } = useAuth();
  const engineer_id = Number(user?.id) || 1;
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportPdf = async () => {
    if (!projectId) {
        toast.error("Project ID is required");
        return;
    }
    setIsExportingPdf(true);
    const toastId = toast.loading("Generating PDF report...");
    try {
        const blob = await reportService.exportWeeklyPDF(projectId);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Work_Progress_Report_${projectId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("PDF report exported!", { id: toastId });
    } catch (err: any) {
        console.error("PDF Export failed:", err);
        toast.error("Export failed", { id: toastId });
    } finally {
        setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!projectId) {
        toast.error("Project ID is required");
        return;
    }
    setIsExportingExcel(true);
    const toastId = toast.loading("Generating Excel report...");
    try {
        const blob = await reportService.exportWeeklyExcel(projectId);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Work_Progress_Report_${projectId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Excel report exported!", { id: toastId });
    } catch (err: any) {
        console.error("Excel Export failed:", err);
        toast.error("Export failed", { id: toastId });
    } finally {
        setIsExportingExcel(false);
    }
  };

  const { selectedProjectId, setSelectedProjectId } = useProject();
  const projectId = selectedProjectId || 0;

  const handleProjectChange = (id: number) => {
    setSelectedProjectId(id);
  };

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [workOrdersList, setWorkOrdersList] = useState<any[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<number | "">("");
  const [workOrderSummary, setWorkOrderSummary] = useState<any>(null);

  useEffect(() => {
    projectService.getProjects(100, 0).then((data: any) => {
        setProjectsList(Array.isArray(data) ? data : (data.items || data.data || []));
    }).catch(() => {});

    api.get("/work-orders").then((res: any) => {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
        // simple unique filter
        const unique = Array.from(new Map(items.map((i: any) => [i.id, i])).values());
        setWorkOrdersList(unique);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedWorkOrder) {
      workProgressService.getWorkOrderProgressSummary(Number(selectedWorkOrder))
        .then(data => setWorkOrderSummary(data))
        .catch(err => {
          console.error("Failed to load summary", err);
          setWorkOrderSummary(null);
        });
    } else {
      setWorkOrderSummary(null);
    }
  }, [selectedWorkOrder]);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Delayed" | "Execution">("All");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      // Pass project_id from Settings page to API — backend returns only that project's activities
      const data = await workProgressService.listActivities(projectId ?? undefined, undefined, 100, 0);
      // Keep raw API status values — no normalization needed
      const normalizedData = data.map((a: any) => ({
        ...a,
        status: a.status || "NOT_STARTED"
      }));
      setActivities(normalizedData);
    } catch (err) {
      console.error("Load Activities Error:", err);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const stats = useMemo(() => {
    const total = activities.length;
    const completed = activities.filter(a => a.status === "COMPLETED" || a.completion_percentage === 100).length;
    const delayed = activities.filter(a => a.status === "DELAY").length;
    const onTrack = activities.filter(a => a.status === "ON_TRACK").length;

    const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      delayed,
      onTrack,
      complianceRate: `${complianceRate}%`
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let data = activities;

    // Apply StatCard Filter
    if (activeStatFilter === "Compliance") {
      data = data.filter(a => a.completion_percentage === 100);
    } else if (activeStatFilter === "Delayed") {
      data = data.filter(a => a.status === "DELAY");
    } else if (activeStatFilter === "Execution") {
      data = data.filter(a => a.status === "ON_TRACK");
    }

    const filtered = data.filter(a =>
      (searchTerm === "" || a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.boq_code && String(a.boq_code).toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterStatus === "All Status" || a.status === filterStatus) &&
      (selectedWorkOrder === "" || a.work_order_id === Number(selectedWorkOrder))
    );
    return [...filtered].sort((a, b) => b.id - a.id);
  }, [activities, searchTerm, filterStatus, activeStatFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, activeStatFilter, selectedWorkOrder]);

  const paginatedActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddSubmit = async (data: any) => {
    try {
      await workProgressService.createActivity(data);
      toast.success("Activity created successfully!");
      setIsAddModalOpen(false);
      loadActivities();
    } catch (err) {
      toast.error("Failed to create activity");
    }
  };

  const handleEditSubmit = async (id: number, data: any) => {
    try {
      await workProgressService.updateActivity(id, data);
      toast.success("Activity updated successfully!");
      setIsEditModalOpen(false);
      // Refetch fresh activity detail and reload list
      try {
        const fresh = await workProgressService.getActivity(id);
        setSelectedActivity(fresh);
      } catch (_) { }
      loadActivities();
    } catch (err) {
      toast.error("Failed to update activity");
    }
  };

  const handleLogSubmit = async (data: any) => {
    try {
      await workProgressService.addDailyProgress(data);
      toast.success("Progress logged successfully!");
      setIsLogModalOpen(false);
      loadActivities();
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
      loadActivities();
    } catch (err) {
      toast.error("Failed to delete activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      const freshActivity = await workProgressService.getActivity(id);
      setSelectedActivity(freshActivity);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch activity details:", err);
      toast.error("Failed to fetch activity details");
    }
  };


  return (
    <>
      <Navbar title="Activity List" breadcrumb={["InfraPilot", "Engineer", "Work Progress"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Project Work Progress
            </h1>
            <p className="text-slate-500 text-sm">
              Historical record of project activities and BOQ execution momentum.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadActivities}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
              title="Sync Ledger"
            >
              <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              {isExportingPdf ? "Exporting..." : "Export PDF"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              {isExportingExcel ? "Exporting..." : "Export Excel"}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </button>
          </div>
        </div>

        {/* ─── Summary Stats with Interactive Filtering ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Tasks",
              value: stats.total.toString(),
              sub: "Active Ledger",
              accent: "text-slate-800",
              status: "All",
            },
            {
              title: "Compliance",
              value: stats.complianceRate,
              sub: "Completion Rate",
              accent: "text-blue-500",
              status: "Compliance",
            },
            {
              title: "Behind Schedule",
              value: stats.delayed.toString(),
              sub: "Action Required",
              accent: "text-rose-500",
              status: "Delayed",
            },
            {
              title: "Execution",
              value: stats.onTrack.toString(),
              sub: "On Track Items",
              accent: "text-emerald-500",
              status: "Execution",
            },
          ].map((s) => (
            <div
              key={s.title}
              onClick={() => setActiveStatFilter(s.status as any)}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group ${activeStatFilter === s.status ? "ring-2 ring-primary/20" : ""}`}
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                {s.title}
              </p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Work Order Summary Card ───────────────────────────────────────────── */}
        {selectedWorkOrder && workOrderSummary && (
          <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden font-inter">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mb-1">Work Order Progress</p>
                <h3 className="text-xl font-bold tracking-tight">Work Order #{selectedWorkOrder} Overview</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mb-1">Total Budget</p>
                  <p className="text-lg font-bold">₹{workOrderSummary.total_budget?.toLocaleString("en-IN") || 0}</p>
                </div>
                <div className="w-px h-8 bg-white/20 mx-2"></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Amount Certified</p>
                  <p className="text-lg font-bold">₹{workOrderSummary.amount_certified?.toLocaleString("en-IN") || 0}</p>
                </div>
                <div className="w-px h-8 bg-white/20 mx-2"></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">Pending Value</p>
                  <p className="text-lg font-bold">₹{workOrderSummary.pending_value?.toLocaleString("en-IN") || 0}</p>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-primary-100">Overall Completion</span>
                <span>{workOrderSummary.progress_percentage || 0}%</span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${workOrderSummary.progress_percentage || 0}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Filter Bar & Registry Container ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          {/* Integrated Filter Bar */}
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by activity name or BOQ code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
              />
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-3 font-inter">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project:</span>
              <select
                value={projectId || ""}
                onChange={(e) => handleProjectChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest font-inter"
              >
                <option value="">ALL PROJECTS</option>
                {projectsList.map(p => (
                  <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
            {/* Work Order Filter */}
            <div className="flex items-center gap-3 font-inter">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Order:</span>
              <select
                value={selectedWorkOrder}
                onChange={(e) => setSelectedWorkOrder(e.target.value ? Number(e.target.value) : "")}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest font-inter max-w-[200px]"
              >
                <option value="">ALL WORK ORDERS</option>
                {workOrdersList.map(w => (
                  <option key={w.id} value={w.id}>{w.title || w.work_order_no || w.work_order_number || `WO #${w.id}`}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 font-inter">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest"
              >
                <option value="All Status">ALL STATUS</option>
                <option value="NOT_STARTED">NOT_STARTED</option>
                <option value="ON_TRACK">ON_TRACK</option>
                <option value="DELAY">DELAY</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
              {activeStatFilter !== "All" && (
                <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Activity Description</th>
                  <th className="px-6 py-4 font-inter">Logistics</th>

                  <th className="px-6 py-4 font-inter">Timeline</th>
                  <th className="px-6 py-4 font-inter">Status</th>
                  <th className="px-6 py-4 text-right font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing Ledger...</p>
                    </td>
                  </tr>
                ) : paginatedActivities.length > 0 ? paginatedActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                    <td className="px-6 py-4 font-inter">
                      <p className="font-bold text-slate-800 text-sm font-inter">{a.activity_name}</p>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <div className="flex flex-col font-inter">
                        <span className="text-[10px] font-bold text-slate-800 font-inter">{a.total_completed} / {a.planned_quantity} {a.unit}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">{a.remaining_quantity} Remaining</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-inter">
                      <div className="flex flex-col font-inter">
                        <span className="text-xs font-bold text-slate-600 font-inter">{formatDate(a.start_date)}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">To {formatDate(a.end_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusBadge[a.status] || "bg-slate-100 text-slate-500"} font-inter`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <div className="flex items-center justify-end gap-2 font-inter">
                        <button
                          onClick={() => handleView(a.id)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedActivity(a); setIsEditModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                          title="Modify Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedActivity(a); setIsLogModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all font-inter"
                          title="Log Field Entry"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(a.id); setIsDeleteModalOpen(true); }}
                          disabled={a.status === "ON_TRACK" || a.status === "COMPLETED"}
                          className={`p-2 rounded-xl transition-all font-inter ${a.status === "ON_TRACK" || a.status === "COMPLETED"
                            ? "text-slate-300 opacity-50 cursor-not-allowed"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                          title={a.status === "ON_TRACK" || a.status === "COMPLETED" ? "Cannot delete active or completed activities" : "Archive Entry"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-inter">
                      No activities found in the project registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Controls ── */}
          {!loading && filteredActivities.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
              {/* Left: Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Center: Showing info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} records
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
                  const totalItems = filteredActivities.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
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
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredActivities.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.max(1, Math.ceil(filteredActivities.length / itemsPerPage)) || filteredActivities.length === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        projectId={projectId || 0}
        engineerId={engineer_id}
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
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSubmit={handleLogSubmit}
        activity={selectedActivity}
        engineerId={engineer_id}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Discard Activity Entry"
        message="Are you sure you want to delete this activity record? This action will permanently remove the entry and all its progress history from the project ledger."
        confirmText="Archive Record"
        type="danger"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default ActivityListPage;
