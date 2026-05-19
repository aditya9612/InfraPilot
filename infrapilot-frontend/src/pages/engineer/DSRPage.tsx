import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
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
    Check,
    X,
    Send
} from "lucide-react";

import { dsrService } from "../../services/dsrService";
import { sitePhotoService } from "../../services/sitePhotoService";
import type { DsrItem, CreateDsrRequest, UpdateDsrRequest } from "../../types/dsr";

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
    const [projectId, setProjectId] = useState<number | null>(null);


    // Filter state for StatCards
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Pending" | "Efficiency">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 20;

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedDsr, setSelectedDsr] = useState<DsrItem | null>(null);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const resolveProjectId = async () => {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const pId = user?.project_id || user?.user?.project_id;
                    if (pId) {
                        setProjectId(Number(pId));
                    } else {
                        // Default fallback for Site Engineer context
                        setProjectId(36);
                    }
                }
            } catch (err) {
                console.error("Failed to resolve project context", err);
                setProjectId(36);
            }
        };
        resolveProjectId();
    }, []);

    const fetchDsr = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const offset = (currentPage - 1) * itemsPerPage;
            const response = await dsrService.getDsrByProject(projectId, { 
                limit: itemsPerPage, 
                offset
            });
            const apiData = response.items;
            setTotalItems(response.meta.total);

            // Resolve photos for each item
            const itemsWithPhotos = await Promise.all(apiData.map(async (item: any) => {
                let photos = item.photos?.map((p: any) => ({
                    id: p.id,
                    url: p.url || p.file_url
                })) || [];

                if (photos.length === 0) {
                    try {
                        const extraPhotos = await dsrService.getDsrPhotos(item.id);
                        if (extraPhotos && extraPhotos.length > 0) {
                            photos = extraPhotos;
                        }
                    } catch (e) {}
                }
                return { ...item, photos };
            }));

            setDsrList(itemsWithPhotos);
        } catch (error) {
            console.error("Fetch DSR Error:", error);
            toast.error("Failed to sync DSR logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentPage]);

    useEffect(() => {
        fetchDsr();
    }, [fetchDsr]);

    const handleView = async (id: number) => {
        setLoadingId(id);
        try {
            const data = await dsrService.getDsrById(id);
            let photos = data.photos?.map((p: any) => ({
                id: p.id,
                url: p.url || p.file_url
            })) || [];

            if (photos.length === 0) {
                try {
                    const extraPhotos = await dsrService.getDsrPhotos(data.id);
                    if (extraPhotos && extraPhotos.length > 0) {
                        photos = extraPhotos;
                    }
                } catch (e) {}
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

            if (photos.length === 0) {
                try {
                    const extraPhotos = await dsrService.getDsrPhotos(data.id);
                    if (extraPhotos && extraPhotos.length > 0) {
                        photos = extraPhotos;
                    }
                } catch (e) {}
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

    const handleCreate = async (data: CreateDsrRequest) => {
        try {
            const payload = { ...data, project_id: projectId || 0 };
            const created = await dsrService.createDsr(payload);
            toast.success("DSR submitted successfully!");
            setIsCreateOpen(false);
            
            if (created) {
                const normalizedCreated = {
                    ...created,
                    photos: created.photos || []
                };
                setDsrList(prev => [normalizedCreated, ...prev]);
            }

            // Small delay to allow backend persistence if needed, though usually not necessary
            setTimeout(() => {
                fetchDsr();
            }, 500);
        } catch (error) {
            console.error("DSR Creation Failed:", error);
            toast.error("Failed to submit DSR. Please check all fields.");
        }
    };

    const handleUpdate = async (id: number, data: UpdateDsrRequest) => {
        try {
            const updatedDsr = await dsrService.updateDsr(id, data);
            toast.success("DSR updated successfully!");
            setDsrList(prev => prev.map(item => item.id === id ? { ...item, ...updatedDsr } : item));
            fetchDsr();
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update DSR");
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

    const handleApproveDsr = async (id: number) => {
        const toastId = toast.loading("Approving DSR log...");
        try {
            await dsrService.approveDsr(id);
            toast.success("DSR approved successfully!", { id: toastId });
            fetchDsr();
        } catch (err) {
            toast.error("Failed to approve DSR", { id: toastId });
        }
    };

    const handleRejectDsr = async (id: number) => {
        const toastId = toast.loading("Rejecting DSR log...");
        try {
            await dsrService.rejectDsr(id);
            toast.success("DSR rejected successfully!", { id: toastId });
            fetchDsr();
        } catch (err) {
            toast.error("Failed to reject DSR", { id: toastId });
        }
    };

    const handleExportExcel = async () => {
        if (!projectId) return;
        const toastId = toast.loading("Generating Excel report...");
        setIsExporting(true);
        try {
            await dsrService.exportDsrExcel(projectId, {});
            toast.success("Excel report exported successfully!", { id: toastId });
        } catch (err) {
            console.error("Export Error:", err);
            toast.error("Failed to export Excel report", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const filteredList = useMemo(() => {
        let data = dsrList;

        // Apply StatCard Filter
        if (activeStatFilter === "Compliance") {
            data = data.filter(d => d.status === "Verified" || d.status === "Approved");
        } else if (activeStatFilter === "Pending") {
            data = data.filter(d => d.status === "Submitted" || d.status === "Draft");
        } else if (activeStatFilter === "Efficiency") {
            data = data.filter(d => d.status !== "Rejected" && d.status !== "Draft");
        }

        return data.filter(dsr => {
            const matchesSearch = dsr.work_done.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (dsr.business_id && dsr.business_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                dsr.site_location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || dsr.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [dsrList, searchTerm, statusFilter, activeStatFilter]);

    const stats = useMemo(() => {
        const total = dsrList.length;
        const verified = dsrList.filter(d => d.status === "Verified" || d.status === "Approved").length;
        const pending = dsrList.filter(d => d.status === "Submitted" || d.status === "Draft").length;
        const complianceVal = total > 0 ? Math.round((verified / total) * 100) : 0;
        
        // Efficiency could be measured by (Verified + Submitted) / Total for momentum
        const active = dsrList.filter(d => d.status !== "Rejected" && d.status !== "Draft").length;
        const efficiencyVal = total > 0 ? Math.round((active / total) * 100) : 0;

        return {
            total,
            verified,
            pending,
            complianceRate: `${complianceVal}%`,
            efficiency: `${efficiencyVal}%`
        };
    }, [dsrList]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, activeStatFilter, projectId]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <>
            <Navbar title="Daily Site Reports" breadcrumb={["Engineer", "Site Records", "DSR Vault"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Daily Ledger</h1>
                        <p className="text-slate-500 text-sm">Historical record of activities, labour, and material movements.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDsr}
                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
                            title="Sync Data"
                        >
                            <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 font-inter disabled:opacity-50"
                        >
                            {isExporting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                            {isExporting ? "Exporting..." : "Export"}
                        </button>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                        >
                            <Plus className="w-4 h-4" />
                            New Entry
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer transition-all ${activeStatFilter === "All" ? "ring-2 ring-primary/20 rounded-xl" : ""}`}>
                        <StatCard
                            title="Total Logs"
                            value={stats.total.toString()}
                            sub="Verified Archives"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer transition-all ${activeStatFilter === "Compliance" ? "ring-2 ring-emerald-500/20 rounded-xl" : ""}`}>
                        <StatCard
                            title="Compliance"
                            value={stats.complianceRate}
                            sub="Verification Rate"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer transition-all ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500/20 rounded-xl" : ""}`}>
                        <StatCard
                            title="Pending Audit"
                            value={stats.pending.toString()}
                            sub="Action Required"
                            accent="text-rose-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Efficiency")} className={`cursor-pointer transition-all ${activeStatFilter === "Efficiency" ? "ring-2 ring-blue-500/20 rounded-xl" : ""}`}>
                        <StatCard
                            title="Efficiency"
                            value={stats.efficiency}
                            sub="Project Momentum"
                            accent="text-blue-500" />
                    </div>
                </div>

                {/* ── Filter Bar & Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter min-h-[400px]">
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
                                <option value="Verified">Verified</option>
                                <option value="Rejected">Rejected</option>
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

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing DSR vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Report Details</th>
                                        <th className="px-6 py-4 font-inter">Work Summary</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Resources</th>
                                        <th className="px-6 py-4 font-inter">Site Media</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((dsr) => (
                                            <tr key={dsr.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{dsr.report_date}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{dsr.business_id || `DSR-${dsr.id}`} • {dsr.report_type}</span>
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
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${dsr.status ? statusBadge[dsr.status] : "bg-slate-100 text-slate-500"} font-inter`}>
                                                        {dsr.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <p className="text-[10px] font-bold text-slate-800 font-inter">{dsr.total_labour || 0} Total Labour</p>
                                                        <p className="text-[9px] font-bold text-slate-500 font-inter mt-0.5">{dsr.skilled_labour || 0} Skilled, {dsr.unskilled_labour || 0} Unskilled</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter mt-1.5">{dsr.weather} Weather</p>
                                                    </div>
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
                                                        <div className="flex items-center gap-1.5 mr-2">
                                                            <button
                                                                onClick={() => handleApproveDsr(dsr.id)}
                                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100 active:scale-95 flex items-center justify-center font-inter"
                                                                title="Approve DSR"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectDsr(dsr.id)}
                                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 active:scale-95 flex items-center justify-center font-inter"
                                                                title="Reject DSR"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubmitDsr(dsr.id)}
                                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 active:scale-95 flex items-center justify-center font-inter"
                                                                title="Submit DSR"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => handleView(dsr.id)}
                                                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center font-inter"
                                                            title="View Insight"
                                                            disabled={loadingId === dsr.id}
                                                        >
                                                            {loadingId === dsr.id ? (
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-inter">
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
                        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white sticky left-0 font-inter">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                            </span>
                            <div className="flex gap-2 font-inter">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                                    Page {currentPage} of {totalPages || 1}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedDsr.photos.map((photo) => (
                                        <div key={photo.id} className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-[4/3] group relative">
                                            <img
                                                src={sitePhotoService.resolveUrl(photo.url) || ""}
                                                alt="Site Documentation"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Weather Condition</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.weather}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Personnel</p>
                                        <p className="text-sm font-bold text-slate-800 mb-1">{selectedDsr.total_labour || 0} Units</p>
                                        <p className="text-[10px] font-bold text-slate-500">{selectedDsr.skilled_labour || 0} Skilled • {selectedDsr.unskilled_labour || 0} Unskilled</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Registry ID</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.business_id || `DSR-${selectedDsr.id}`}</p>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Material Received</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDsr.material_received || "Nil"}</p>
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
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-600 font-medium">
                                    {selectedDsr.issues || "No operational constraints reported today."}
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
                onSubmit={handleCreate}
                projectId={projectId || 36}
            />

            <EditDSRModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdate}
                dsr={selectedDsr}
                projectId={projectId || 36}
            />
        </>
    );
};

export default DSRPage;
