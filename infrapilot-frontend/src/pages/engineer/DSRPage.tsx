import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import NewDSREntryModal from "../../components/dashboard/NewDSREntryModal";
import EditDSRModal from "../../components/dashboard/EditDSRModal";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
    FileText,
    Activity,
    Search,
    Plus,
    Edit2,
    Eye,
    MapPin,
    AlertCircle,
    Briefcase,
    Calendar,
    Image as ImageIcon,
    RotateCcw,
    FileDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Trash2
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

import { dsrService } from "../../services/dsrService";
import { reportService } from "../../services/reportService";
import { useProject } from "../../context/ProjectContext";
import { sitePhotoService } from "../../services/sitePhotoService";
import type { DsrItem, LabourTrend, ContractorAnalytics, IssueAnalytics } from "../../types/dsr";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-500",
    Submitted: "bg-blue-100 text-primary",
    Approved: "bg-emerald-100 text-success",
    Verified: "bg-emerald-100 text-success",
    Rejected: "bg-red-100 text-red-600",
};


const DSRPage = () => {
    const [dsrList, setDsrList] = useState<DsrItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const { selectedProjectId } = useProject();
    const projectId = selectedProjectId || 0;

    // Filter state for StatCards
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Draft" | "Submitted" | "Approved">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedDsr, setSelectedDsr] = useState<DsrItem | null>(null);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    // Layout State
    const [activeTab, setActiveTab] = useState<"list" | "analytics">("list");

    // Analytics State
    const [labourTrend, setLabourTrend] = useState<LabourTrend[]>([]);
    const [contractorAnalytics, setContractorAnalytics] = useState<ContractorAnalytics[]>([]);
    const [issueAnalytics, setIssueAnalytics] = useState<IssueAnalytics | null>(null);

    // ─── Export Filter State ───────────────────────────────────────────────────
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFilters, setExportFilters] = useState({ start_date: "", end_date: "", contractor_name: "" });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Generating Excel report...");
        try {
            const params: { start_date?: string; end_date?: string; contractor_name?: string } = {};
            if (exportFilters.start_date) params.start_date = exportFilters.start_date;
            if (exportFilters.end_date) params.end_date = exportFilters.end_date;
            if (exportFilters.contractor_name.trim()) params.contractor_name = exportFilters.contractor_name.trim();
            await dsrService.exportDsrExcel(projectId || 0, params);
            toast.success("Excel report exported!", { id: toastId });
            setIsExportModalOpen(false);
        } catch (err: any) {
            console.error("DSR Export failed:", err);
            if (err.response?.status === 404) {
                toast.error("No DSR records found for selected filters.", { id: toastId });
            } else {
                toast.error("Export failed", { id: toastId });
            }
        } finally {
            setIsExporting(false);
        }
    };
    // ──────────────────────────────────────────────────────────────────────────

    // ─── PDF Export State ──────────────────────────────────────────────────────
    const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);
    const [pdfExportDate, setPdfExportDate] = useState("");
    const [isPdfExporting, setIsPdfExporting] = useState(false);

    const handlePdfExport = async () => {
        if (!pdfExportDate) {
            toast.error("Please select a report date");
            return;
        }
        setIsPdfExporting(true);
        const toastId = toast.loading("Generating PDF report...");
        try {
            const blob = await reportService.exportDailyPDF(projectId || 0, pdfExportDate);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DSR_Report_${pdfExportDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("PDF report exported!", { id: toastId });
            setIsPdfExportModalOpen(false);
        } catch (err: any) {
            console.error("PDF Export failed:", err);
            toast.error("Export failed", { id: toastId });
        } finally {
            setIsPdfExporting(false);
        }
    };
    // ──────────────────────────────────────────────────────────────────────────

    const fetchDsr = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await dsrService.getDsrByProject(projectId, {
                limit: 100,
                offset: 0
            });
            // Strictly enforce project isolation on the frontend
            const apiData = response.items.filter((item: any) => Number(item.project_id) === Number(projectId));
            setTotalItems(apiData.length);

            // Use photos already included in the DSR list response
            // (Removed per-item getDsrPhotos() calls that were causing N duplicate network requests)
            const itemsWithPhotos = apiData.map((item: any) => {
                const photos = item.photos?.map((p: any) => ({
                    id: p.id,
                    url: p.url || p.file_url
                })) || [];
                return { ...item, photos };
            });

            setDsrList(itemsWithPhotos);
        } catch (error) {
            console.error("Fetch DSR Error:", error);
            toast.error("Failed to sync DSR logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDsr();
    }, [fetchDsr]);

    const fetchAnalytics = useCallback(async () => {
        if (!projectId) return;
        try {
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            const endDate = new Date();

            const [labour, contractor, issues] = await Promise.all([
                dsrService.getLabourTrend(projectId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]).catch(() => []),
                dsrService.getContractorAnalytics(projectId).catch(() => []),
                dsrService.getIssueAnalytics(projectId).catch(() => null)
            ]);
            setLabourTrend(labour);
            setContractorAnalytics(contractor);
            setIssueAnalytics(issues);
        } catch (e) {
            console.error("Failed to fetch analytics", e);
        }
    }, [projectId]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleView = async (id: number) => {
        setLoadingId(id);
        try {
            const data = await dsrService.getDsrById(id);
            let photos = data.photos?.map((p: any) => ({
                id: p.id,
                url: p.url || p.file_url
            })) || [];

            try {
                const extraPhotos = await dsrService.getDsrPhotos(data.id);
                if (extraPhotos && Array.isArray(extraPhotos) && extraPhotos.length > 0) {
                    photos = extraPhotos.map((p: any) => ({
                        id: p.id,
                        url: p.url || p.file_url
                    }));
                }
            } catch (e) {
                console.warn(`Could not fetch photos for DSR ${data.id}`, e);
            }

            setSelectedDsr({ ...data, photos });
            setIsDetailOpen(true);
        } catch (error) {
            const localItem = dsrList.find(item => item.id === id);
            if (localItem) {
                setSelectedDsr(localItem);
                setIsDetailOpen(true);
            } else {
                toast.error("Failed to load project ledger details");
            }
        } finally {
            setLoadingId(null);
        }
    };

    const handleEdit = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await dsrService.getDsrById(id);
            let photos = data.photos?.map((p: any) => ({
                id: p.id,
                url: p.url || p.file_url
            })) || [];

            try {
                const extraPhotos = await dsrService.getDsrPhotos(data.id);
                if (extraPhotos && Array.isArray(extraPhotos) && extraPhotos.length > 0) {
                    photos = extraPhotos.map((p: any) => ({
                        id: p.id,
                        url: p.url || p.file_url
                    }));
                }
            } catch (e) {
                console.warn(`Could not fetch photos for DSR ${data.id}`, e);
            }

            setSelectedDsr({ ...data, photos });
            setIsEditOpen(true);
        } catch (error) {
            const localItem = dsrList.find(item => item.id === id);
            if (localItem) {
                setSelectedDsr(localItem);
                setIsEditOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    };



    const handleDeletePhoto = async (photoId: number) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return;
        const tid = toast.loading("Deleting photo...");
        try {
            await dsrService.deleteDsrPhoto(photoId);
            toast.success("Photo deleted successfully", { id: tid });

            if (selectedDsr && selectedDsr.photos) {
                const updatedPhotos = selectedDsr.photos.filter((p: any) => p.id !== photoId);
                setSelectedDsr({ ...selectedDsr, photos: updatedPhotos });
            }
            fetchDsr();
        } catch (error) {
            console.error("Delete photo error", error);
            toast.error("Failed to delete photo", { id: tid });
        }
    };

    const handleSubmitDsr = async (id: number) => {
        const toastId = toast.loading("Submitting report to audit...");
        try {
            await dsrService.submitDsr(id);
            toast.success("DSR submitted for audit!", { id: toastId });
            fetchDsr();
        } catch (err) {
            toast.error("Submission failed", { id: toastId });
        }
    };


    const filteredList = useMemo(() => {
        let data = dsrList;

        // Apply StatCard Filter
        if (activeStatFilter === "Draft") {
            data = data.filter(d => d.status === "Draft");
        } else if (activeStatFilter === "Submitted") {
            data = data.filter(d => d.status === "Submitted");
        } else if (activeStatFilter === "Approved") {
            data = data.filter(d => d.status === "Approved" || d.status === "Verified");
        }

        return data.filter(dsr => {
            const matchesSearch = (dsr.work_done?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (dsr.business_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (dsr.site_location?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || dsr.status === statusFilter || (statusFilter === "Approved" && dsr.status === "Verified");
            return matchesSearch && matchesStatus;
        });
    }, [dsrList, searchTerm, statusFilter, activeStatFilter]);

    const stats = useMemo(() => {
        const total = filteredList.length;
        const draftCount = filteredList.filter(d => d.status === "Draft").length;
        const submittedCount = filteredList.filter(d => d.status === "Submitted").length;
        const approvedCount = filteredList.filter(d => d.status === "Approved" || d.status === "Verified").length;
        const totalLabour = filteredList.reduce((sum, d) => sum + (d.total_labour || 0), 0);

        return {
            total,
            draftCount,
            submittedCount,
            approvedCount,
            totalLabour
        };
    }, [dsrList, totalItems]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, activeStatFilter, projectId]);

    const aggregatedLabourTrend = useMemo(() => {
        return labourTrend.map(item => {
            const date = new Date(item.date);
            return {
                date: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
                labour: item.labour
            };
        });
    }, [labourTrend]);

    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(start, start + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);


    return (
        <>
            <Navbar title="Daily Site Reports" breadcrumb={["Engineer", "Site Records", "DSR Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Project Daily Ledger
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Historical record of activities, labour, and material movements.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={fetchDsr}
                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
                            title="Sync Data"
                        >
                            <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsPdfExportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <FileDown className="w-4 h-4" />
                            Export PDF
                        </button>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-100 transition-all active:scale-95"
                        >
                            <FileDown className="w-4 h-4" />
                            Export Excel
                        </button>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            New Entry
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Total Logs",
                            value: stats.total.toString(),
                            sub: "All Time Records",
                            accent: "text-slate-800",
                            status: "All",
                        },
                        {
                            title: "Draft Reports",
                            value: stats.draftCount.toString(),
                            sub: "Pending Submission",
                            accent: "text-slate-500",
                            status: "Draft",
                        },
                        {
                            title: "Submitted Reports",
                            value: stats.submittedCount.toString(),
                            sub: "Pending Audit",
                            accent: "text-blue-500",
                            status: "Submitted",
                        },
                        {
                            title: "Approved Reports",
                            value: stats.approvedCount.toString(),
                            sub: "Verified & Approved",
                            accent: "text-emerald-500",
                            status: "Approved",
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

                {/* ── Tabs ───────────────────────────────────────────── */}
                <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit mb-6 md:mb-8 border border-slate-200/50">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "list"
                            ? "bg-white text-primary shadow-sm border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        DSR Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "analytics"
                            ? "bg-white text-primary shadow-sm border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Analytics Overview
                    </button>
                </div>

                {activeTab === "analytics" && (
                    <div className="mb-8">
                        {/* ── Analytics Overview ───────────────────────────────────────────── */}
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Analytics Overview</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* Labour Trend Graph */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 font-inter">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary" />
                                    Labour Trend
                                </h3>
                                {labourTrend.length > 0 ? (
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={aggregatedLabourTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Line type="monotone" dataKey="labour" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Labour Count" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-6">No Labour Data</p>
                                )}
                            </div>

                            {/* Contractor Analytics Graph */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 font-inter">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-emerald-500" />
                                    Contractor Performance
                                </h3>
                                {contractorAnalytics.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="h-40 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={contractorAnalytics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="contractor" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="entries" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Entries" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="overflow-y-auto max-h-32 custom-scrollbar border-t border-slate-100 pt-2">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-3 py-2 font-bold text-slate-500 uppercase">Contractor</th>
                                                        <th className="px-3 py-2 font-bold text-slate-500 uppercase text-right">Entries</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {contractorAnalytics.map((c, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-3 py-2 font-medium text-slate-700">{c.contractor}</td>
                                                            <td className="px-3 py-2 font-bold text-emerald-600 text-right">{c.entries}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-6">No Contractor Data</p>
                                )}
                            </div>

                            {/* Issue Analytics */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 font-inter">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    Issue Analytics
                                </h3>
                                {issueAnalytics ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center shadow-sm">
                                            <span className="text-2xl font-black text-rose-600">{issueAnalytics.total_reports}</span>
                                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">Total Reports</span>
                                        </div>
                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex flex-col items-center justify-center text-center shadow-sm">
                                            <span className="text-2xl font-black text-amber-600">{issueAnalytics.reports_with_issues}</span>
                                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">With Issues</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-6">No Issue Data</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "list" && (
                    <div className="mb-8">
                        {/* ── DSR Ledger ───────────────────────────────────────────── */}
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">DSR Ledger</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter flex flex-col">
                            {/* Integrated Filter Bar */}
                            <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                                <div className="relative flex-1 max-w-md font-inter">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Search className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search by activity, location or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 font-inter">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Submitted">Submitted</option>
                                        <option value="Approved">Approved</option>
                                    </select>

                                    {activeStatFilter !== "All" && (
                                        <button
                                            onClick={() => {
                                                setActiveStatFilter("All");
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Reset Filters"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                                {isLoading ? (
                                    <div className="p-20 text-center text-slate-400 font-inter">
                                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Syncing DSR vault...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left font-inter min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                                <th className="px-6 py-4 font-inter">Report Details</th>
                                                <th className="px-6 py-4 font-inter">Work Summary</th>
                                                <th className="px-6 py-4 font-inter">Personnel</th>
                                                <th className="px-6 py-4 font-inter">Status</th>
                                                <th className="px-6 py-4 font-inter">Site Media</th>
                                                <th className="px-6 py-4 text-right font-inter">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-inter">
                                            {paginatedList.length > 0 ? (
                                                paginatedList.map((dsr) => (
                                                    <tr key={dsr.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col font-inter">
                                                                <span className="text-sm font-bold text-slate-800 font-inter">{dsr.report_date}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{dsr.report_type || "Daily Ledger"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col max-w-xs font-inter">
                                                                <span className="text-xs font-bold text-slate-700 truncate font-inter">{dsr.work_done}</span>
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span className="truncate font-inter">{dsr.site_location}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col font-inter">
                                                                <span className="text-[11px] font-bold text-slate-700 font-inter truncate max-w-[150px]">Contractor: <span className="text-primary">{dsr.contractor_name || '-'}</span></span>
                                                                <span className="text-[10px] text-slate-400 font-bold font-inter truncate max-w-[150px] mt-0.5">By: {dsr.created_by_name || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${dsr.status ? statusBadge[dsr.status] : "bg-slate-100 text-slate-500"} font-inter`}>
                                                                {dsr.status}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                                                {dsr.photos && dsr.photos.length > 0 ? (
                                                                    dsr.photos.slice(0, 3).map((photo) => (
                                                                        <div key={photo.id} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:z-10 transition-transform hover:scale-110">
                                                                            <img
                                                                                src={sitePhotoService.resolveUrl(photo.url) || ""}
                                                                                alt="Site"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    ))
                                                                ) : dsr.dsr_image ? (
                                                                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                                                        <img src={sitePhotoService.resolveUrl(dsr.dsr_image) || ""} alt="Site" className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                                        <ImageIcon className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                                {dsr.photos && dsr.photos.length > 3 && (
                                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 z-0">
                                                                        +{dsr.photos.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                                {dsr.status === 'Draft' && (
                                                                    <div className="flex items-center gap-1.5 mr-2">
                                                                        <button
                                                                            onClick={() => handleSubmitDsr(dsr.id)}
                                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 active:scale-95 flex items-center justify-center font-inter"
                                                                            title="Submit DSR"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => handleView(dsr.id)}
                                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                                    disabled={loadingId === dsr.id}
                                                                    title="View Details"
                                                                >
                                                                    {loadingId === dsr.id ? (
                                                                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Eye className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEdit(dsr.id)}
                                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all font-inter"
                                                                    title="Modify Record"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-inter">
                                                        No daily reports found in the project vault.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* ── Pagination Controls ──────────────────────────── */}
                            {!isLoading && dsrList.length > 0 && (
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
                                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} records
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
                                            const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
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
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                                            disabled={currentPage === Math.max(1, Math.ceil(totalItems / itemsPerPage)) || totalItems === 0}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="DSR Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedDsr && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Header Information ────────────────── */}
                        <div className="bg-primary rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            {/* Decorative blur elements */}
                            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                            <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />

                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter shadow-inner">
                                    <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center">
                                        {selectedDsr.photos && selectedDsr.photos.length > 0 ? (
                                            <img
                                                src={sitePhotoService.resolveUrl(selectedDsr.photos[0].url) || ""}
                                                alt="Site avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : selectedDsr.dsr_image ? (
                                            <img
                                                src={sitePhotoService.resolveUrl(selectedDsr.dsr_image) || ""}
                                                alt="Site avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold font-inter font-black">D</span>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-primary text-[8px] font-black z-20
                                        ${selectedDsr.status === 'Approved' || selectedDsr.status === 'Verified' ? 'bg-emerald-500' : selectedDsr.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'} animate-pulse`}
                                    />
                                </div>
                                <div className="flex-1 font-inter">
                                    <div className="flex flex-wrap items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{selectedDsr.business_id || `DSR-${selectedDsr.id}`}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">
                                            {selectedDsr.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-white/60 mb-4 font-inter text-xs font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-white/80" />
                                            {selectedDsr.report_date}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-white/80" />
                                            {selectedDsr.site_location}
                                        </span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">WEATHER: {selectedDsr.weather?.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(selectedDsr.photos && selectedDsr.photos.length > 0) ? (
                            <div className="mb-8">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Site Documentation ({selectedDsr.photos.length})</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedDsr.photos.map((photo, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-100 aspect-square">
                                            <img
                                                src={sitePhotoService.resolveUrl(photo.url) || ""}
                                                alt={`Documentation ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a
                                                    href={sitePhotoService.resolveUrl(photo.url) || ""}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors shadow-lg"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => handleDeletePhoto(photo.id)}
                                                    className="w-10 h-10 ml-2 bg-rose-500/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors shadow-lg"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : selectedDsr.dsr_image && (
                            <div className="mb-8">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Site Documentation</p>
                                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-video">
                                    <img src={sitePhotoService.resolveUrl(selectedDsr.dsr_image) || ""} alt="Site Documentation" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-8 mb-10">
                            {/* Operational Intelligence style section */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Operational Intelligence</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Weather Condition</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.weather}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contractor</p>
                                        <p className="text-sm font-bold text-primary">{selectedDsr.contractor_name || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Created By</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.created_by_name || "N/A"}</p>
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Personnel</p>
                                        <p className="text-sm font-bold text-slate-800 mb-1">{selectedDsr.total_labour || 0}</p>
                                        <p className="text-[10px] font-bold text-slate-500">{selectedDsr.skilled_labour || 0} Skilled • {selectedDsr.unskilled_labour || 0} Unskilled</p>
                                    </div>
                                </div>
                            </div>

                            {/* Work Narrative style section */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Work Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Work Completed Today</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                                            "{selectedDsr.work_done}"
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Work Planned</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                                            "{selectedDsr.work_planned || "No upcoming plans reported"}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resource Logistics style section */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resource Logistics</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Material Received</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.material_received || "Nil"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Material Used</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.material_used || "Nil"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Machinery Used</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.machinery_used || "Nil"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Issues section */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Constraints & Observations</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Issues</p>
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-600 font-medium">
                                            {selectedDsr.issues || "No operational constraints reported today."}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Safety Observations</p>
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-600 font-medium">
                                            {selectedDsr.safety_observations || "No safety observations."}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Remarks</p>
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-600 font-medium">
                                            {selectedDsr.remarks || "No additional remarks."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDetailOpen(false)}
                            className="w-full py-4 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            Dismiss Report
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modals ────────────────────────────────── */}
            <NewDSREntryModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    setIsCreateOpen(false);
                    fetchDsr();
                }}
                projectId={projectId || 36}
            />

            <EditDSRModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSuccess={() => {
                    setIsEditOpen(false);
                    fetchDsr();
                }}
                dsr={selectedDsr}
            />

            {/* ── Export Filter Modal ─────────────────────────────────────────── */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Export DSR to Excel</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Apply filters before downloading (all fields optional)</p>
                            </div>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Start Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={exportFilters.start_date}
                                    onChange={e => setExportFilters(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* End Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={exportFilters.end_date}
                                    onChange={e => setExportFilters(f => ({ ...f, end_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* Contractor Name */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contractor Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Shree Construction"
                                    value={exportFilters.contractor_name}
                                    onChange={e => setExportFilters(f => ({ ...f, contractor_name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setExportFilters({ start_date: "", end_date: "", contractor_name: "" });
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                            >
                                <FileDown className="w-4 h-4" />
                                {isExporting ? "Exporting..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Export PDF Modal ─────────────────────────────────────────── */}
            {isPdfExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Export DSR to PDF</h2>
                            </div>
                            <button
                                onClick={() => setIsPdfExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Report Date <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    value={pdfExportDate}
                                    onChange={e => setPdfExportDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setIsPdfExportModalOpen(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePdfExport}
                                disabled={isPdfExporting || !pdfExportDate}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-rose-200"
                            >
                                <FileDown className="w-4 h-4" />
                                {isPdfExporting ? "Exporting..." : "Download PDF"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DSRPage;
