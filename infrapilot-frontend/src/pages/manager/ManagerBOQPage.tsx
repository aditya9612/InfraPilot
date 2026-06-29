import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { useProject } from "../../context/ProjectContext";
import { boqService } from "../../services/boqService";
import { approvalService } from "../../services/approvalService";
import { masterService } from "../../services/masterService";
import toast from "react-hot-toast";
import {
    List,
    TrendingUp,
    Search,
    Download,
    History,
    FileJson,
    FileSpreadsheet,
    FileText,
    Layers,
    RefreshCcw,
    Upload,
    Eye,
    Trash2,
    Pencil,
    FileCheck,
} from "lucide-react";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import type { BoqItem, BoqSummary } from "../../types/boq";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToCSV } from "../../utils/csvExport";
import StatCard from "../../components/common/StatCard";
import Pagination from "../../components/common/Pagination";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
import BOQDetailsModal from "../../components/dashboard/BOQDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import UpdateActualsModal from "../../components/forms/UpdateActualsModal";
import BOQHistoryModal from "../../components/dashboard/BOQHistoryModal";
import OptimizationModal from "../../components/dashboard/OptimizationModal";
import BulkImportBOQModal from "../../components/forms/BulkImportBOQModal";
import ProjectSelector from "../../components/common/ProjectSelector";
import { BOQ_CATEGORIES } from "../../config/constants";


/* ─── page ───────────────────────────────────────────────────── */
const ManagerBOQPage = () => {
    const { selectedProjectId, assignedProjects } = useProject();
    const { tab } = useParams();
    const navigate = useNavigate();

    const [boqData, setBoqData] = useState<BoqItem[]>([]);
    const [projectMap, setProjectMap] = useState<Record<number, string>>({});
    const [activityTypeMap, setActivityTypeMap] = useState<Record<number, string>>({});
    const [summary, setSummary] = useState<BoqSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState<BoqItem | null>(null);
    const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Advanced Feature States
    const [versionsList, setVersionsList] = useState<number[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<number | "latest">("latest");
    const [isActualsModalOpen, setIsActualsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [activeItemForModal, setActiveItemForModal] = useState<BoqItem | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        if (isExportMenuOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isExportMenuOpen]);
    const [isExporting, setIsExporting] = useState(false);
    const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

    // Map URL param to tab ID
    const tabMap: Record<string, string> = useMemo(() => ({
        list: "boq-list",
        cost: "cost-tracking"
    }), []);

    const activeTab = tabMap[tab || ""] || "boq-list";

    const handleTabChange = (tabId: string) => {
        const urlParam = Object.keys(tabMap).find(key => tabMap[key] === tabId);
        if (urlParam) {
            navigate(`/manager/boq/${urlParam}`);
        } else {
            navigate(`/manager/boq`);
        }
    };

    // Fetch BOQs and setup projects mapping on mount or when assignedProjects change
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Build project map from assigned projects
                const map: Record<number, string> = {};
                assignedProjects.forEach((p: any) => {
                    map[p.id] = p.project_name;
                });
                setProjectMap(map);

                // Fetch activity types for mapping
                try {
                    const activityRes = await masterService.getEntities('activity-types');
                    const aMap: Record<number, string> = {};
                    activityRes.forEach((a: any) => {
                        aMap[a.id] = a.name;
                    });
                    setActivityTypeMap(aMap);
                } catch (err) {
                    console.error("Failed to fetch activity types", err);
                }

                // Initial fetch
                await refreshBoqs();
            } catch (error) {
                toast.error("Failed to load initial data");
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [assignedProjects]);

    const refreshBoqs = useCallback(async () => {
        setIsLoading(true);
        try {
            const filters: any = {
                search: searchTerm || null,
                status: statusFilter === "all" ? null : statusFilter,
                category: categoryFilter === "all" ? null : categoryFilter,
                project_id: selectedProjectId || null,
                version_no: selectedVersion === "latest" ? null : Number(selectedVersion),
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
            };

            const res = await boqService.getBoqs(filters);

            // Filter out deleted and inactive items from the local state
            const activeItems = res.items.filter((item: any) =>
                item.status?.toLowerCase() !== 'deleted' &&
                item.status?.toLowerCase() !== 'inactive'
            );

            setBoqData(activeItems);
            setTotalItems(res.total || activeItems.length);

            // Also refresh summary if project is selected
            if (selectedProjectId) {
                const stats = await boqService.getBoqSummary(Number(selectedProjectId), selectedVersion);
                setSummary(stats);
            } else {
                setSummary(null);
            }
        } catch (error) {
            console.error("Failed to refresh BOQs", error);
        } finally {
            setIsLoading(false);
        }
    }, [
        searchTerm,
        statusFilter,
        categoryFilter,
        selectedProjectId,
        selectedVersion,
        currentPage,
        itemsPerPage
    ]);

    // Re-fetch when filters or page change
    useEffect(() => {
        refreshBoqs();
    }, [refreshBoqs]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, categoryFilter, selectedProjectId, selectedVersion]);

    // Fetch versions when boqData changes
    useEffect(() => {
        const fetchVersions = async () => {
            const firstItem = boqData[0];
            if (firstItem && firstItem.id) {
                try {
                    const versions = await boqService.getBoqVersions(firstItem.id);
                    setVersionsList(versions);
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        setVersionsList([]);
                    } else {
                        console.error("Failed to fetch versions", error);
                    }
                }
            } else {
                setVersionsList([]);
                setSelectedVersion("latest");
            }
        };
        fetchVersions();
    }, [boqData]);

    const handleCreateOrUpdateBOQ = async (data: any) => {
        try {
            if (editingItem) {
                await boqService.updateBoqItem(editingItem.id, data);
                toast.success("BOQ item updated successfully!");
            } else {
                const newItem = await boqService.createBoq(data);
                toast.success("BOQ item created successfully!");

                // Automatically request approval for new items
                try {
                    await approvalService.createApproval({
                        entity_type: "boq",
                        entity_id: newItem.id,
                        remarks: `Initial approval request for ${newItem.item_name}`,
                    });
                    toast.success("Approval request initiated!");
                } catch (approveErr) {
                    console.error("Auto-approval error:", approveErr);
                    toast.error("Failed to auto-initiate approval. Use manual action.");
                }
            }
            await refreshBoqs();
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast.error(editingItem ? "Failed to update BOQ" : "Failed to create BOQ");
        }
    };

    const handleRequestApproval = async (item: BoqItem) => {
        try {
            await approvalService.createApproval({
                entity_type: "boq",
                entity_id: item.id,
                remarks: `Requesting approval for BOQ item: ${item.item_name}`,
            });
            toast.success("Approval request sent successfully!");
            refreshBoqs();
        } catch (error) {
            toast.error("Failed to send approval request");
            console.error("Approval Request Error:", error);
        }
    };

    const handleEditClick = (item: BoqItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await boqService.deleteBoq(itemToDelete);
                toast.success("BOQ item deleted successfully!");
                await refreshBoqs();
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            } catch (error) {
                toast.error("Failed to delete BOQ item");
            }
        }
    };


    const handleUpdateActualsSubmit = async (data: {
        actual_quantity: number;
        actual_cost: number;
    }) => {
        if (activeItemForModal) {
            try {
                await boqService.updateBoqActuals(activeItemForModal.id, data);
                toast.success("Actuals updated successfully!");
                await refreshBoqs();
            } catch (error) {
                toast.error("Failed to update actuals");
            }
        }
    };

    const handleCreateVersion = async () => {
        if (!selectedProjectId) {
            toast.error("Please select a project first");
            return;
        }

        const firstItem = boqData[0];
        if (!firstItem) {
            toast.error("No items found to version");
            return;
        }

        try {
            const res = await boqService.createBoqVersion(firstItem.id);
            toast.success(res.message || "New version created!");
            await refreshBoqs();
            if (res.version) {
                setSelectedVersion(res.version);
            }
        } catch (error) {
            toast.error("Failed to create new version");
        }
    };

    const handleExport = async (format: "excel" | "pdf" | "json") => {
        if (isExporting) return;
        if (boqData.length === 0) {
            toast.error("No data to export");
            return;
        }

        try {
            setIsExporting(true);
            const firstItem = boqData[0];
            const isProjectLevel = !!selectedProjectId;

            const exportId = firstItem?.boq_group_id || (isProjectLevel ? Number(selectedProjectId) : firstItem?.id);
            if (!exportId) {
                toast.error("Unable to determine export context");
                return;
            }

            const filters = {
                search: searchTerm || null,
                status: statusFilter === "all" ? null : statusFilter,
                category: categoryFilter === "all" ? null : categoryFilter,
                version_no: selectedVersion === "latest" ? null : Number(selectedVersion),
            };

            toast.loading(`Preparing ${format.toUpperCase()}...`, { id: "export" });
            const data = await boqService.exportBoq(exportId, format, filters);
            const fileName = isProjectLevel
                ? `boq_project_${exportId}.${format === "json" ? "json" : format === "excel" ? "csv" : "pdf"}`
                : `boq_export_${exportId}.${format === "json" ? "json" : format === "excel" ? "csv" : "pdf"}`;

            if (format === "json") {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const blob = new Blob([data], { type: format === "excel" ? "text/csv;charset=utf-8;" : "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            }
            toast.success(`${format.toUpperCase()} exported successfully!`, { id: "export" });
        } catch (apiError: any) {
            console.warn("Backend export failed, falling back to client-side generation", apiError);
            const dateStr = new Date().toISOString().split("T")[0];
            const projectName = selectedProjectId ? projectMap[Number(selectedProjectId)] : "All_Projects";

            if (format === "pdf") {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text("BOQ Management Report (Manager)", 14, 22);
                doc.setFontSize(11);
                doc.text(`Project: ${projectName}`, 14, 30);
                doc.text(`Date: ${new Date().toLocaleString()}`, 14, 37);

                const tableData = boqData.map((item) => [
                    item.item_name,
                    item.category,
                    `${item.quantity} ${item.unit}`,
                    `₹${Number(item.unit_cost).toLocaleString()}`,
                    `₹${Number(item.total_cost || 0).toLocaleString()}`,
                    item.status === "Ongoing" || item.status === "ACTIVE" ? "Ongoing" : item.status,
                ]);

                autoTable(doc, {
                    startY: 45,
                    head: [["Item Name", "Category", "Qty & Unit", "Unit Cost", "Est. Total", "Status"]],
                    body: tableData,
                    headStyles: { fillColor: [37, 99, 235] },
                });

                doc.save(`BOQ_Report_Manager_${projectName}_${dateStr}.pdf`);
                toast.success("PDF generated successfully", { id: "export" });
            } else if (format === "excel") {
                exportToCSV(boqData, `BOQ_Report_Manager_${projectName}_${dateStr}.csv`, {
                    item_name: "Item Name",
                    category: "Category",
                    quantity: "Quantity",
                    unit: "Unit",
                    unit_cost: "Unit Cost",
                    total_cost: "Total Cost",
                    status: "Status",
                });
                toast.success("Excel/CSV generated successfully", { id: "export" });
            } else {
                toast.error(`Export failed: ${apiError.response?.data?.detail || "Connection error"}`, { id: "export" });
            }
        } finally {
            setIsExporting(false);
            setIsExportMenuOpen(false);
        }
    };

    const openActualsModal = (item: BoqItem) => {
        setActiveItemForModal(item);
        setIsActualsModalOpen(true);
    };

    const openHistoryModal = (item: BoqItem) => {
        setActiveItemForModal(item);
        setIsHistoryModalOpen(true);
    };

    const filteredBoqData = useMemo(() => {
        return [...boqData].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (dateA !== dateB) {
                return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
            }
            return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
        });
    }, [boqData, sortOrder]);


    const tabs = [
        { id: "boq-list", label: "BOQ List", icon: <List className="w-4 h-4" /> },
        { id: "cost-tracking", label: "Cost Tracking", icon: <TrendingUp className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                title="BOQ & Estimation"
                breadcrumb={["Manager", "BOQ", tabs.find((t) => t.id === activeTab)?.label || "BOQ List"]}
            />

            <PageTransition className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            BOQ Management Hub
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Orchestrate quantities, costs, and project budget performance with precision.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <ProjectSelector variant="page" />

                        <button
                            onClick={() => setIsBulkImportModalOpen(true)}
                            disabled={!selectedProjectId}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${!selectedProjectId
                                ? "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-60"
                                : "bg-white border border-primary/20 text-slate-700 hover:bg-slate-50 shadow-sm active:scale-95"
                                }`}
                        >
                            <Download className={`w-4 h-4 ${!selectedProjectId ? "text-slate-300" : "text-primary"}`} />
                            Import Excel
                        </button>
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            + Add BOQ Item
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Budget Estimate",
                            value: formatCompactCurrency(summary?.estimated || filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0)),
                            sub: summary ? `${summary.total_items} Line Items Registered` : "Aggregated Project View",
                            accent: "bg-blue-500",
                            text: "text-blue-600"
                        },
                        {
                            title: "Actual Incurred",
                            value: formatCompactCurrency(summary?.actual || filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0)),
                            sub: "Real-world Expenditure",
                            accent: "bg-violet-500",
                            text: "text-violet-600"
                        },
                        {
                            title: "Project Variance",
                            value: formatCompactCurrency(Math.abs(summary?.difference || (filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0) - filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0)))),
                            sub: "Budget Gap Analysis",
                            accent: (summary?.difference || (filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0) - filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0))) < 0 ? "bg-rose-500" : "bg-emerald-500",
                            text: (summary?.difference || (filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0) - filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0))) < 0 ? "text-rose-600" : "text-emerald-600"
                        },
                        {
                            title: "Rate Approvals",
                            value: filteredBoqData.filter((i) => i.status?.toLowerCase().includes("review") || i.status?.toLowerCase().includes("draft") || i.status?.toLowerCase().includes("pending")).length.toString(),
                            sub: "Pending Review Items",
                            accent: "bg-amber-500",
                            text: "text-amber-600"
                        },
                    ].map((s) => (
                        <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all group overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-16 h-16 opacity-[0.03] -mr-8 -mt-8 rounded-full ${s.accent} group-hover:scale-150 transition-transform duration-700`}></div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.title}</p>
                                <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className={`h-1 w-8 rounded-full ${s.accent}`}></div>
                                    <p className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{s.sub}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner overflow-x-auto max-w-full">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all ${activeTab === t.id ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            {activeTab === t.id && (
                                <motion.div
                                    layoutId="boqActiveTab"
                                    className="absolute inset-0 bg-white rounded-xl shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{t.icon}</span>
                            <span className="relative z-10 font-bold">{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {activeTab === "boq-list" && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-slate-800">
                                <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search items or descriptions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="completed">Completed</option>
                                            <option value="under review">Under Review</option>
                                            <option value="pending">Pending</option>
                                        </select>

                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                        >
                                            <option value="all">All Categories</option>
                                            {BOQ_CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                        >
                                            <option value="latest">Latest</option>
                                            <option value="oldest">Oldest</option>
                                        </select>

                                        {selectedProjectId && versionsList.length > 0 && (
                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                                <select
                                                    value={selectedVersion}
                                                    onChange={(e) => setSelectedVersion(e.target.value === "latest" ? "latest" : Number(e.target.value))}
                                                    className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-1"
                                                >
                                                    <option value="latest">Latest Ver.</option>
                                                    {versionsList.map((v) => (
                                                        <option key={v} value={v}>Ver. {v}</option>
                                                    ))}
                                                </select>
                                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                                <button onClick={handleCreateVersion} title="Create New Version" className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                                                    <RefreshCcw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="relative" ref={exportMenuRef}>
                                            <button
                                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                Export
                                            </button>
                                            {isExportMenuOpen && (
                                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button onClick={() => handleExport("excel")} disabled={isExporting} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                                        CSV (.csv)
                                                    </button>
                                                    <button onClick={() => handleExport("pdf")} disabled={isExporting} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all">
                                                        <FileText className="w-4 h-4 text-rose-500" />
                                                        PDF Report
                                                    </button>
                                                    <button onClick={() => handleExport("json")} disabled={isExporting} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all">
                                                        <FileJson className="w-4 h-4 text-amber-500" />
                                                        JSON Data
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                            <p className="text-slate-500 font-medium font-inter">Loading items...</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-900/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                                    <th className="px-6 py-5">Identified Item</th>
                                                    <th className="px-6 py-5">Classification</th>
                                                    <th className="px-6 py-5">Quantity Unit</th>
                                                    <th className="px-6 py-5">Unit Rate</th>
                                                    <th className="px-6 py-5">Estimated Total</th>
                                                    <th className="px-6 py-5">Budget Variance</th>
                                                    <th className="px-6 py-5 text-center">Lifecycle</th>
                                                    <th className="px-6 py-5 text-center">Rate Approval</th>
                                                    <th className="px-6 py-5 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredBoqData.length === 0 ? (
                                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest font-inter">No BOQ items found.</td></tr>
                                                ) : (
                                                    filteredBoqData.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-all group text-slate-800">
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <p className="font-black text-slate-700 group-hover:text-slate-900 transition-colors text-xs tracking-tight uppercase">{item.item_name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{projectMap[item.project_id] || "Global Registry"}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col gap-1.5 font-inter">
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest w-fit border border-slate-200">
                                                                        {item.category}
                                                                    </span>
                                                                    {item.activity_type_id && activityTypeMap[item.activity_type_id] && (
                                                                        <div className="flex items-center gap-1.5 ml-0.5">
                                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                                                                                {activityTypeMap[item.activity_type_id]}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-xs font-black text-slate-600 tabular-nums">
                                                                {parseFloat(item.quantity?.toString() || "0").toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-1">{item.unit}</span>
                                                            </td>
                                                            <td className="px-6 py-5 text-xs font-black text-slate-700 tabular-nums">{formatCompactCurrency(Number(item.unit_cost) || 0)}</td>
                                                            <td className="px-6 py-5 text-xs font-black text-blue-600 tabular-nums">{formatCompactCurrency(Number(item.total_cost) || 0)}</td>
                                                            <td className="px-6 py-5 text-xs font-black text-rose-500 tabular-nums">
                                                                {Number(item.variance_cost) > 0 ? `+${formatCompactCurrency(Number(item.variance_cost))}` : formatCompactCurrency(Number(item.variance_cost) || 0)}
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${item.status === "ACTIVE" || item.status === "Ongoing" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
                                                                    {item.status || "Planned"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.approval_status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                    item.approval_status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                        item.approval_status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                            'bg-slate-50 text-slate-400 border-slate-100'
                                                                    }`}>
                                                                    {item.approval_status || 'PENDING'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => { setViewingItem(item); setIsViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                                                                    <button onClick={() => openActualsModal(item)} className="p-1.5 text-slate-500 hover:text-emerald-600 transition-colors" title="Update Actuals"><TrendingUp className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleRequestApproval(item)} className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors" title="Request Approval"><FileCheck className="w-4 h-4" /></button>
                                                                    <button onClick={() => openHistoryModal(item)} className="p-1.5 text-slate-500 hover:text-violet-600 transition-colors" title="View History"><History className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <Pagination
                                    currentPage={currentPage - 1}
                                    totalItems={totalItems}
                                    pageSize={itemsPerPage}
                                    onPageChange={(page) => setCurrentPage(page + 1)}
                                />
                            </div>
                        )}
                        {activeTab === "cost-tracking" && <CostTrackingView items={boqData} isLoading={isLoading} />}
                    </motion.div>
                </AnimatePresence>
            </PageTransition>

            <CreateBOQModal
                isOpen={isModalOpen}
                projects={assignedProjects}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                onSubmit={handleCreateOrUpdateBOQ}
                initialData={editingItem}
            />

            {viewingItem && (
                <BOQDetailsModal
                    isOpen={isViewModalOpen}
                    onClose={() => { setIsViewModalOpen(false); setViewingItem(null); }}
                    boqItem={viewingItem}
                    projectName={viewingItem ? projectMap[viewingItem.project_id] : ""}
                />
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                onConfirm={handleDeleteConfirm}
                title="Delete BOQ Item"
                message="Are you sure you want to delete this BOQ item? This will remove the cost estimation for this specific item."
                confirmText="Delete"
                type="danger"
            />

            <UpdateActualsModal
                isOpen={isActualsModalOpen}
                onClose={() => setIsActualsModalOpen(false)}
                onSubmit={handleUpdateActualsSubmit}
                initialData={activeItemForModal ? {
                    item_name: activeItemForModal.item_name,
                    actual_quantity: activeItemForModal.actual_quantity,
                    actual_cost: activeItemForModal.actual_cost,
                    quantity: activeItemForModal.quantity,
                    unit: activeItemForModal.unit,
                    total_cost: activeItemForModal.total_cost || "0",
                } : undefined}
            />

            {activeItemForModal && (
                <BOQHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    boqId={activeItemForModal.id}
                    itemName={activeItemForModal.item_name}
                />
            )}

            <OptimizationModal
                isOpen={isOptimizationModalOpen}
                onClose={() => setIsOptimizationModalOpen(false)}
                projectId={selectedProjectId || undefined}
            />

            <BulkImportBOQModal
                isOpen={isBulkImportModalOpen}
                onClose={() => setIsBulkImportModalOpen(false)}
                projectId={selectedProjectId || 0}
                onSuccess={refreshBoqs}
            />
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   2. BUDGET VIEW
   ════════════════════════════════════════════════════════════ */
const BudgetView = ({ summary, items }: { summary: any; items: BoqItem[]; isLoading: boolean }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Expense Distribution</h3>
                    <div className="space-y-4">
                        {/* Logic to group by category could go here */}
                        {["Material", "Labour", "Equipment", "General"].map((cat) => {
                            const catItems = items.filter(i => i.category === cat);
                            const est = catItems.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0);
                            const percent = summary?.estimated ? (est / Number(summary.estimated)) * 100 : 0;

                            return (
                                <div key={cat} className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-600">{cat}</span>
                                        <span className="text-slate-400">{formatCompactCurrency(est)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Budget Health Index</h3>
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle
                                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                                    strokeDasharray={364.4}
                                    strokeDashoffset={364.4 * (1 - (summary?.actual ? Math.min(summary.estimated / summary.actual, 1) : 1))}
                                    className={summary?.actual > summary?.estimated ? "text-rose-500" : "text-emerald-500"}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-xl font-black text-slate-900">
                                    {summary?.actual ? ((Number(summary.estimated) / Number(summary.actual)) * 100).toFixed(0) : 100}%
                                </span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Health</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-6 text-center max-w-[200px] font-medium leading-relaxed">
                            {summary?.actual > summary?.estimated
                                ? "Your project is currently over budget. Consider optimizing upcoming activities."
                                : "Budget health is optimal. Project is running within estimated costs."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   3. COST TRACKING VIEW
   ════════════════════════════════════════════════════════════ */
const CostTrackingView = ({ items }: { items: BoqItem[]; isLoading: boolean }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Variance Analysis Report</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4 text-right">Estimated</th>
                                <th className="px-6 py-4 text-right">Actual</th>
                                <th className="px-6 py-4 text-right">Variance</th>
                                <th className="px-6 py-4 text-center">Efficiency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map((item) => {
                                const variance = (Number(item.total_cost || 0)) - (Number(item.actual_cost || 0));
                                const efficiency = Number(item.actual_cost) > 0
                                    ? (Number(item.total_cost || 0) / Number(item.actual_cost)) * 100
                                    : 100;

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-800">{item.item_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-slate-400">{formatCompactCurrency(Number(item.total_cost || 0))}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-slate-600">{formatCompactCurrency(Number(item.actual_cost || 0))}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-black ${variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {variance < 0 ? '-' : '+'}{formatCompactCurrency(Math.abs(variance))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${efficiency < 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(efficiency, 100)}%` }} />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400">{efficiency.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerBOQPage;
