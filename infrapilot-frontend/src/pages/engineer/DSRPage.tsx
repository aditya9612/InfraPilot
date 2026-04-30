import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import NewDSREntryModal from "../../components/dashboard/NewDSREntryModal";
import EditDSRModal from "../../components/dashboard/EditDSRModal";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { dsrService } from "../../services/dsrService";
import type { DsrItem, CreateDsrRequest, UpdateDsrRequest } from "../../types/dsr";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-500",
    Submitted: "bg-blue-100 text-primary",
    Approved: "bg-emerald-100 text-success",
    Verified: "bg-emerald-100 text-success",
    Rejected: "bg-red-100 text-red-600",
};

// ─── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_DSR: DsrItem[] = [
    {
        id: 101,
        business_id: "DSR-101",
        project_id: 1,
        report_date: new Date().toISOString().split("T")[0],
        report_type: "Daily",
        site_location: "Main Bridge Pier 04",
        weather: "Sunny",
        work_done: "Completed reinforcement for pile cap. Inspection done by consultant.",
        work_planned: "Start shuttering and concrete pouring for pile cap.",
        total_labour: 24,
        skilled_labour: 8,
        unskilled_labour: 16,
        contractor_id: 1,
        machinery_used: "Transit Mixer (2), Excavator (1)",
        material_received: "Steel (5 MT), Cement (100 bags)",
        material_used: "Steel (3 MT), Binding wire (20 kg)",
        status: "Verified",
        remarks: "Work progressing as per schedule.",
        issues: "",
        safety_observations: "All workers using PPE correctly.",
        latitude: 18.5204,
        longitude: 73.8567
    },
    {
        id: 12,
        business_id: "DSR-102",
        project_id: 1,
        report_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        report_type: "Daily",
        site_location: "Approach Road - West Side",
        weather: "Cloudy",
        work_done: "Sub-grade preparation and leveling for 500m stretch.",
        work_planned: "Starting GSB (Granular Sub-Base) layer spreading.",
        total_labour: 18,
        skilled_labour: 4,
        unskilled_labour: 14,
        contractor_id: 1,
        machinery_used: "Grader (1), Roller (1)",
        material_received: "GSB Material (200 cum)",
        material_used: "Nil",
        status: "Submitted",
        remarks: "Minor delay due to morning drizzle.",
        issues: "Minor delay in material delivery.",
        safety_observations: "Site area barricaded.",
        latitude: 18.5210,
        longitude: 73.8580
    },
    {
        id: 103,
        business_id: "DSR-103",
        project_id: 1,
        report_date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
        report_type: "Daily",
        site_location: "Staff Quarter Excavation",
        weather: "Sunny",
        work_done: "Excavation completed for Block A. Footing marking in progress.",
        work_planned: "PCC (Plain Cement Concrete) work for footings.",
        total_labour: 12,
        skilled_labour: 2,
        unskilled_labour: 10,
        contractor_id: 2,
        machinery_used: "JCB Excavator (1)",
        material_received: "Sand (20 cum)",
        material_used: "Sand (5 cum)",
        status: "Draft",
        remarks: "Ready for marking verification.",
        issues: "",
        safety_observations: "First aid kit available on site.",
        latitude: 18.5190,
        longitude: 73.8550
    }
];

const DSRPage = () => {
    // Data State
    const [dsrData, setDsrData] = useState<DsrItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [reportTypeFilter, setReportTypeFilter] = useState("All Reports");
    const [isExporting, setIsExporting] = useState(false);

    // Modal State
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<DsrItem | null>(null);
    const [dsrToDelete, setDsrToDelete] = useState<number | null>(null);

    // Get projectId from user profile or discovery
    const [projectId, setProjectId] = useState<number | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        const user = userStr ? JSON.parse(userStr) : {};
        const pId = user?.project_id || user?.user?.project_id || user?.user?.project?.id || user?.user?.assigned_project?.id;

        if (pId) {
            console.log("DSR: Resolved Project ID from User Profile:", pId);
            setProjectId(Number(pId));
        } else {
            const discoverProject = async () => {
                try {
                    const api = (await import("../../services/api")).default;
                    const { data } = await api.get("/projects");
                    const items = Array.isArray(data) ? data : (data.items || []);
                    if (items.length > 0) {
                        const firstId = items[0].project_id || items[0].id;
                        console.log("DSR: Resolved Project ID from Discovery:", firstId);
                        setProjectId(Number(firstId));
                    }
                } catch (e) {
                    console.error("DSR: Project discovery failed", e);
                    setProjectId(1); // Final fallback
                }
            };
            discoverProject();
        }
    }, []);

    // ─── Data Fetching ──────────────────────────────────────────────────────────
    const fetchDsrList = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoading(true);
            let apiItems: DsrItem[] = [];
            try {
                const response = await dsrService.getDsrByProject(projectId);
                apiItems = response.items || [];
            } catch (err) {
                console.warn("DSR API Error - Falling back to local/demo data");
            }

            // Sync with Local Storage for persistence of demo/newly created items
            const localCache = localStorage.getItem(`dsr_local_${projectId}`);
            const localItems: DsrItem[] = localCache ? JSON.parse(localCache) : [];

            // Merge items (API + Local) and deduplicate by ID or business_id
            const combined = [...apiItems, ...localItems];
            const unique = combined.reduce((acc: DsrItem[], curr) => {
                const exists = acc.find(item => item.id === curr.id || (item.business_id && item.business_id === curr.business_id));
                if (!exists) acc.push(curr);
                return acc;
            }, []);

            // If still empty, seed with Demo Data
            if (unique.length === 0) {
                setDsrData(DEMO_DSR);
                localStorage.setItem(`dsr_local_${projectId}`, JSON.stringify(DEMO_DSR));
            } else {
                setDsrData(unique);
            }
        } catch (error) {
            console.error("Fetch DSR Error:", error);
            toast.error("Failed to fetch DSR list");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDsrList();
    }, [fetchDsrList]);

    // Debounced Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleCreateDsr = async (data: CreateDsrRequest) => {
        try {
            console.log("POST /api/v1/dsr → Request Body:", data);
            const responseItem = await dsrService.createDsr(data);
            console.log("POST /api/v1/dsr → Response Body:", responseItem);

            // Persist the created item locally so it appears immediately in the list
            const cacheKey = `dsr_local_${data.project_id}`;
            const localCache = localStorage.getItem(cacheKey);
            const localItems: DsrItem[] = localCache ? JSON.parse(localCache) : [];
            localStorage.setItem(cacheKey, JSON.stringify([...localItems, responseItem]));

            toast.success("DSR entry created successfully!");
            setIsNewModalOpen(false);
            fetchDsrList();
        } catch (error: any) {
            console.error("POST /api/v1/dsr → Error:", error?.response?.data || error);
            toast.error("Failed to create DSR");
            throw error;
        }
    };

    const handleUpdateDsr = async (id: number, data: UpdateDsrRequest) => {
        try {
            await dsrService.updateDsr(id, data);
            toast.success("DSR entry updated successfully!");
            setIsEditModalOpen(false);
            setSelectedReport(null);
            fetchDsrList();
        } catch (error) {
            toast.error("Failed to update DSR");
            throw error;
        }
    };

    const handleDeleteClick = (id: number) => {
        setDsrToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!dsrToDelete) return;
        try {
            await dsrService.deleteDsr(dsrToDelete);
            toast.success("DSR entry deleted successfully!");
            setIsDeleteModalOpen(false);
            setDsrToDelete(null);
            fetchDsrList();
        } catch (error) {
            toast.error("Failed to delete DSR");
        }
    };

    const handleStatusUpdate = async (
        id: number,
        action: "submit" | "approve" | "reject"
    ) => {
        const endpointMap = { submit: "submit", approve: "approve", reject: "reject" };
        try {
            console.log(`PUT /api/v1/dsr/${id}/${endpointMap[action]} → Request: id=${id}`);
            let response;
            if (action === "submit") response = await dsrService.submitDsr(id);
            else if (action === "approve") response = await dsrService.approveDsr(id);
            else response = await dsrService.rejectDsr(id);
            console.log(`PUT /api/v1/dsr/${id}/${endpointMap[action]} → Response:`, response);

            const statusMap = { submit: "Submitted", approve: "Approved", reject: "Draft" };
            const msgMap = {
                submit: "DSR submitted successfully",
                approve: "DSR approved successfully",
                reject: "DSR rejected and moved to Draft",
            };

            // Optimistically update local state
            setDsrData(prev =>
                prev.map(d =>
                    d.id === id ? { ...d, status: statusMap[action] } : d
                )
            );
            toast.success(msgMap[action]);
            fetchDsrList();
        } catch (error: any) {
            const detail = error?.response?.data?.detail || `Failed to ${action} DSR`;
            console.error(`PUT /api/v1/dsr/${id}/${endpointMap[action]} → Error:`, error?.response?.data);
            toast.error(detail);
        }
    };

    const handleExport = async () => {
        if (isExporting || !projectId) return;
        setIsExporting(true);
        const toastId = toast.loading("Exporting DSR data...");
        try {
            await dsrService.exportDsrExcel(projectId);
            toast.dismiss(toastId);
            toast.success("Export downloaded!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    // ─── Filtering ─────────────────────────────────────────────────────────────
    const filtered = dsrData.filter((report) => {
        const matchesStatus =
            filterStatus === "All Status" || report.status === filterStatus;
        const matchesType =
            reportTypeFilter === "All Reports" ||
            report.report_type === reportTypeFilter;
        const matchesSearch =
            report.site_location
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase()) ||
            report.id.toString().includes(debouncedSearch) ||
            (report.business_id &&
                report.business_id
                    .toLowerCase()
                    .includes(debouncedSearch.toLowerCase()));
        return matchesStatus && matchesType && matchesSearch;
    });

    const stats = {
        total: dsrData.length,
        labor: dsrData.reduce((s, r) => s + Number(r.total_labour || 0), 0),
        approved: dsrData.filter(
            (r) => r.status === "Approved" || r.status === "Verified"
        ).length,
        pending: dsrData.filter((r) => r.status === "Submitted").length,
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar
                title="Daily Site Report"
                breadcrumb={["InfraPilot", "Engineer", "DSR"]}
            />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Daily Site Report Registry
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Field documentation, labor tracking, and work progress logs.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                            {isExporting ? "Exporting..." : "⬇ Export Excel"}
                        </button>
                        <button
                            onClick={() => setIsNewModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            + New DSR Entry
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Total Reports",
                            value: stats.total,
                            sub: "All time logs",
                            accent: "text-slate-800",
                        },
                        {
                            title: "Total Labor",
                            value: stats.labor,
                            sub: "Assigned today",
                            accent: "text-blue-600",
                        },
                        {
                            title: "Approved",
                            value: stats.approved,
                            sub: "Verified by admin",
                            accent: "text-success",
                        },
                        {
                            title: "Pending",
                            value: stats.pending,
                            sub: "Awaiting review",
                            accent: "text-warning",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    {s.title}
                                </p>
                            </div>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                {s.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
                            <svg
                                className="w-3.5 h-3.5 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path
                                    strokeLinecap="round"
                                    strokeWidth="2"
                                    d="M21 21l-4.35-4.35"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search location, ID, or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent text-xs text-slate-500 outline-none w-full placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 outline-none hover:bg-slate-100 transition-all"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Approved">Approved</option>
                                <option value="Verified">Verified</option>
                            </select>
                            <select
                                value={reportTypeFilter}
                                onChange={(e) => setReportTypeFilter(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 outline-none hover:bg-slate-100 transition-all"
                            >
                                <option value="All Reports">All Types</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* DSR Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {isLoading ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                            Loading reports...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                            <p className="text-3xl mb-2">📄</p>
                            <p className="font-bold text-slate-500 text-sm">
                                No DSR entries found
                            </p>
                        </div>
                    ) : (
                        filtered.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-mono font-bold text-slate-400">
                                        {report.business_id || `DSR-${report.id}`}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg ${statusBadge[report.status || "Draft"]
                                            }`}
                                    >
                                        {report.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors truncate">
                                    {report.site_location}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium mb-4">
                                    {report.report_date} · {report.report_type || "Daily"}
                                </p>

                                <p className="text-xs text-slate-500 line-clamp-2 mb-6 h-8">
                                    {report.work_done}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 mt-auto">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                            Labor
                                        </p>
                                        <p className="text-sm font-bold text-blue-600">
                                            {report.total_labour || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                            Weather
                                        </p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {report.weather}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        </button>
                                        {report.status === "Draft" && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(report.id, "submit")}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Submit DSR"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                        {report.status === "Submitted" && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(report.id, "approve")}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Approve DSR"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(report.id, "reject")}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Reject DSR"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {report.status === "Draft" && (
                                        <button
                                            onClick={() => handleDeleteClick(report.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modals */}
                {projectId && (
                    <NewDSREntryModal
                        isOpen={isNewModalOpen}
                        onClose={() => setIsNewModalOpen(false)}
                        onSubmit={handleCreateDsr}
                        projectId={projectId}
                    />
                )}

                <EditDSRModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedReport(null);
                    }}
                    dsr={selectedReport}
                    onSubmit={handleUpdateDsr}
                />

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setDsrToDelete(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete DSR Entry"
                    message="Are you sure you want to delete this DSR entry? This action cannot be undone."
                    confirmText="Delete"
                    type="danger"
                />

                {/* Detail Modal */}
                <Modal
                    isOpen={!!selectedReport && !isEditModalOpen}
                    onClose={() => setSelectedReport(null)}
                    title="DSR Activity Insight"
                    maxWidth="max-w-2xl"
                >
                    {selectedReport && (
                        <div className="p-6">
                            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                                        Operation Blueprint
                                    </p>
                                    <h3 className="text-2xl font-black mb-8">
                                        {selectedReport.site_location}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                                                Workforce
                                            </p>
                                            <p className="text-xl font-black">
                                                {selectedReport.total_labour} (
                                                {selectedReport.skilled_labour || 0}/
                                                {selectedReport.unskilled_labour || 0})
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                                                Status
                                            </p>
                                            <p className="text-xl font-black">
                                                {selectedReport.status?.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Work Progress
                                    </h4>
                                    <div className="border-l-2 border-primary pl-4">
                                        <p className="text-sm font-bold text-slate-800 mb-1">
                                            Done Today:
                                        </p>
                                        <p className="text-sm text-slate-600 mb-4">
                                            {selectedReport.work_done}
                                        </p>
                                        <p className="text-sm font-bold text-slate-800 mb-1">
                                            Planned for Tomorrow:
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {selectedReport.work_planned}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Resource Details
                                        </h4>
                                        <div className="border-l-2 border-blue-400 pl-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                Machinery
                                            </p>
                                            <p className="text-xs text-slate-700 mb-2">
                                                {selectedReport.machinery_used || "None"}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                Weather
                                            </p>
                                            <p className="text-xs text-slate-700">
                                                {selectedReport.weather}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Materials
                                        </h4>
                                        <div className="border-l-2 border-emerald-400 pl-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                Received
                                            </p>
                                            <p className="text-xs text-slate-700 mb-2">
                                                {selectedReport.material_received || "None"}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                Consumed
                                            </p>
                                            <p className="text-xs text-slate-700">
                                                {selectedReport.material_used || "None"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {selectedReport.issues && (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
                                            Alerts / Issues
                                        </h4>
                                        <p className="text-sm text-red-700">{selectedReport.issues}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    Close
                                </button>
                                {selectedReport.status === "Draft" && (
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                                    >
                                        Modify Entry
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            </PageTransition>
        </>
    );
};

export default DSRPage;
