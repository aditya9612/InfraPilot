import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { useProject } from "../../context/ProjectContext";
import { boqService } from "../../services/boqService";
import { projectService } from "../../services/projectService";
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

    Bell,
    Plus,
    ClipboardList,
    Sparkles,
} from "lucide-react";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import type { BoqItem, BoqSummary } from "../../types/boq";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToCSV } from "../../utils/csvExport";
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
import AddBoqItemModal from "../../components/forms/AddBoqItemModal";
import EditBoqItemModal from "../../components/forms/EditBoqItemModal";


/* ─── page ───────────────────────────────────────────────────── */
const BOQPage = () => {
    const { selectedProjectId, assignedProjects } = useProject();
    const { tab } = useParams();
    const navigate = useNavigate();

    const [boqData, setBoqData] = useState<BoqItem[]>([]);
    const [projectMap, setProjectMap] = useState<Record<number, string>>({});
    const [activityTypeMap, setActivityTypeMap] = useState<Record<number, string>>({});
    const [boqGroups, setBoqGroups] = useState<any[]>([]);

    const [summary, setSummary] = useState<BoqSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [itemRefreshCounter, setItemRefreshCounter] = useState(0);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");
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
    const [isAddBoqItemModalOpen, setIsAddBoqItemModalOpen] = useState(false);
    const [selectedBoqGroupId, setSelectedBoqGroupId] = useState<number | null>(null);

    // Advanced Feature States
    const [versionsList, setVersionsList] = useState<number[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<number | "latest">("latest");
    const [isActualsModalOpen, setIsActualsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [activeItemForModal, setActiveItemForModal] = useState<BoqItem | null>(null);
    const [exportMenuId, setExportMenuId] = useState<number | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setExportMenuId(null);
            }
        };
        if (exportMenuId !== null) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [exportMenuId]);
    const [isExporting, setIsExporting] = useState(false);
    const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
    const [optimizationBoqId, setOptimizationBoqId] = useState<number | null>(null);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
    const [generatedTasksList, setGeneratedTasksList] = useState<any[]>([]);

    // Select Milestone for Generate Tasks
    const [isSelectMilestoneModalOpen, setIsSelectMilestoneModalOpen] = useState(false);
    const [milestonesList, setMilestonesList] = useState<any[]>([]);
    const [pendingGenerateTaskBoqId, setPendingGenerateTaskBoqId] = useState<number | null>(null);
    const [pendingGenerateTaskBoqName, setPendingGenerateTaskBoqName] = useState<string>("");


    // Map URL param to tab ID
    const tabMap: Record<string, string> = useMemo(() => ({
        list: "boq-list",
        items: "item-list",
        cost: "cost-tracking"
    }), []);

    const activeTab = tabMap[tab || ""] || "boq-list";

    const handleTabChange = (tabId: string) => {
        const urlParam = Object.keys(tabMap).find(key => tabMap[key] === tabId);
        if (urlParam) {
            navigate(`/admin/boq/${urlParam}`);
        } else {
            navigate(`/admin/boq`);
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

                // Fetch activity types
                const activityTypes = await masterService.getEntities("activity-types");
                const activityMap: Record<number, string> = {};
                activityTypes.forEach((a: any) => {
                    activityMap[a.id] = a.name;
                });
                setActivityTypeMap(activityMap);

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

    // Fetch BOQ groups whenever project changes
    useEffect(() => {
        if (!selectedProjectId) { setBoqGroups([]); return; }
        boqService.getBoqsByProject(Number(selectedProjectId))
            .then(async (items: any[]) => {
                // Allow UI filters to handle visibility; don't hard-filter Drafts when fetching raw BOQs
                const masters = items;

                // Fetch details for each master to get the correct internal boq_group_id to avoid 404s
                const enrichedMasters = await Promise.all(masters.map(async (m: any) => {
                    try {
                        const detail = await boqService.getBoqById(m.id);
                        return { ...m, true_group_id: detail.boq_group_id || m.boq_group_id || m.id };
                    } catch {
                        return { ...m, true_group_id: m.boq_group_id || m.id };
                    }
                }));

                setBoqGroups(enrichedMasters);
            })
            .catch(() => { setBoqGroups([]); });
    }, [selectedProjectId, itemRefreshCounter]);

    const refreshBoqs = useCallback(async () => {
        if (!selectedProjectId) {
            setBoqData([]);
            setTotalItems(0);
            setSummary(null);
            return;
        }

        setIsLoading(true);
        try {
            const filters: any = {
                search: searchTerm || null,
                status: statusFilter === "all" ? null : statusFilter,
                approval_status: approvalStatusFilter === "all" ? null : approvalStatusFilter,
                category: categoryFilter === "all" ? null : categoryFilter,
                project_id: selectedProjectId,
                version_no: selectedVersion === "latest" ? null : Number(selectedVersion),
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
            };

            const res = await boqService.getBoqs(filters);

            // Allow UI filters to handle visibility; don't hard-filter Drafts when fetching raw BOQs
            const masterItems = res.items;
            setBoqData(masterItems);
            setTotalItems(res.total || masterItems.length);

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
        approvalStatusFilter,
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
    }, [searchTerm, statusFilter, approvalStatusFilter, categoryFilter, selectedProjectId, selectedVersion]);

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
                if (!selectedProjectId) {
                    toast.error("Please select a project first.");
                    return;
                }
                await boqService.createBoq({
                    ...data,
                    project_id: selectedProjectId
                });
                toast.success("BOQ item created successfully!");
            }
            await refreshBoqs();
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast.error(editingItem ? "Failed to update BOQ" : "Failed to create BOQ item");
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

    const handleExport = async (item: BoqItem, format: "excel" | "pdf" | "json") => {
        if (isExporting) return;

        setIsExporting(true);
        setExportMenuId(null);
        const dateStr = new Date().toISOString().split("T")[0];
        const projectName = selectedProjectId ? projectMap[Number(selectedProjectId)] : "All_Projects";
        const boqId = item?.id;

        if (!boqId) {
            toast.error("Unable to determine BOQ ID for export");
            setIsExporting(false);
            return;
        }

        const filters = {
            search: searchTerm || null,
            status: statusFilter === "all" ? null : statusFilter,
            category: categoryFilter === "all" ? null : categoryFilter,
            version_no: selectedVersion === "latest" ? null : Number(selectedVersion),
        };

        toast.loading(`Preparing ${format.toUpperCase()}...`, { id: "export" });

        try {
            // Call: GET /api/v1/boq/{boq_id}/export/json|excel|pdf
            const data = await boqService.exportBoq(boqId, format, filters);

            const ext = format === "json" ? "json" : format === "excel" ? "xlsx" : "pdf";
            const fileName = `BOQ_${projectName}_${dateStr}.${ext}`;

            if (format === "json") {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                const mimeType = format === "excel"
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "application/pdf";
                const blob = new Blob([data], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
            toast.success(`${format.toUpperCase()} exported successfully!`, { id: "export" });

        } catch (apiError: any) {
            // Backend endpoint not available — fall back to client-side generation
            console.warn(`Backend /boq/${boqId}/export/${format} unavailable, using client-side fallback`);

            try {
                if (format === "pdf") {
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text("BOQ Management Report", 14, 22);
                    doc.setFontSize(11);
                    doc.text(`Project: ${projectName}`, 14, 30);
                    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 37);
                    autoTable(doc, {
                        startY: 45,
                        head: [["Item Name", "Category", "Qty & Unit", "Unit Cost", "Est. Total", "Status"]],
                        body: [item].map((item: any) => [
                            item.item_name,
                            item.category,
                            `${item.quantity} ${item.unit}`,
                            `₹${Number(item.unit_cost).toLocaleString()}`,
                            `₹${Number(item.total_cost || 0).toLocaleString()}`,
                            item.status,
                        ]),
                        headStyles: { fillColor: [37, 99, 235] },
                    });
                    doc.save(`BOQ_${projectName}_${item.item_name}_${dateStr}.pdf`);
                    toast.success("PDF generated successfully", { id: "export" });

                } else if (format === "excel") {
                    exportToCSV([item], `BOQ_${projectName}_${item.item_name}_${dateStr}.csv`, {
                        item_name: "Item Name",
                        category: "Category",
                        quantity: "Quantity",
                        unit: "Unit",
                        unit_cost: "Unit Cost",
                        total_cost: "Total Cost",
                        status: "Status",
                    });
                    toast.success("CSV exported successfully", { id: "export" });

                } else {
                    const blob = new Blob([JSON.stringify([item], null, 2)], { type: "application/json" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `BOQ_${projectName}_${item.item_name}_${dateStr}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("JSON exported successfully", { id: "export" });
                }
            } catch (fallbackErr) {
                console.error("Client-side export fallback failed:", fallbackErr);
                toast.error("Export failed. Please try again.", { id: "export" });
            }
        } finally {
            setIsExporting(false);
            setExportMenuId(null);
        }
    };

    const openActualsModal = (item: BoqItem) => {
        setActiveItemForModal(item);
        setIsActualsModalOpen(true);
    };

    const handleAddBoqItemSubmit = async (data: any) => {
        if (!selectedBoqGroupId) {
            toast.error("No BOQ Group selected.");
            return;
        }
        try {
            await boqService.addBoqItem(selectedBoqGroupId, data);
            toast.success("BOQ Item added successfully!");
            await refreshBoqs();
            setItemRefreshCounter(prev => prev + 1);
            setIsAddBoqItemModalOpen(false);
            setSelectedBoqGroupId(null);
            handleTabChange("item-list");
        } catch (error) {
            toast.error("Failed to add BOQ item");
        }
    };

    const handleDownloadReport = async (item: BoqItem) => {
        try {
            toast.loading("Generating report...", { id: "report" });
            const data = await boqService.getBoqReport(item.id, "pdf");
            const blob = new Blob([data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `BOQ_Report_${item.item_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Report downloaded!", { id: "report" });
        } catch (error) {
            toast.error("Failed to download report", { id: "report" });
        }
    };

    const handleViewAlerts = async (item: BoqItem) => {
        try {
            const alerts = await boqService.getBoqAlerts(item.id);
            if (alerts.length === 0) {
                toast.success(`No alerts for ${item.item_name}!`);
            } else {
                toast.error(`Found ${alerts.length} alerts for ${item.item_name}.`);
            }
        } catch (error) {
            toast.error("Failed to fetch alerts");
        }
    };

    const openHistoryModal = (item: BoqItem) => {
        setActiveItemForModal(item);
        setIsHistoryModalOpen(true);
    };

    const openSelectMilestoneModal = async (item: BoqItem) => {
        setPendingGenerateTaskBoqId(item.id);
        setPendingGenerateTaskBoqName(item.item_name);

        if (selectedProjectId) {
            try {
                const ms = await projectService.getMilestones(Number(selectedProjectId));
                setMilestonesList(ms);
            } catch (error) {
                console.error("Failed to fetch milestones", error);
            }
        }
        setIsSelectMilestoneModalOpen(true);
    };

    const handleGenerateTasks = async (milestoneId: number) => {
        if (!pendingGenerateTaskBoqId) return;
        const loadingToast = toast.loading("Generating tasks for " + pendingGenerateTaskBoqName + "...");
        try {
            const result = await boqService.generateTasksFromBoq(pendingGenerateTaskBoqId, milestoneId);
            toast.dismiss(loadingToast);
            toast.success("Tasks generated successfully!");
            setIsSelectMilestoneModalOpen(false);

            // Expected result to have a list of tasks. Handle array or object wrapping an array, or a single task object.
            const tasks = Array.isArray(result) ? result : (result.tasks || result.data || (result.task_id ? [result] : []));
            setGeneratedTasksList(tasks);
            setIsTasksModalOpen(true);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Failed to generate tasks");
        }
    };

    const openOptimizationModal = (item: BoqItem) => {
        setOptimizationBoqId(item.id);
        setIsOptimizationModalOpen(true);
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

    const handleViewDetails = async (item: BoqItem) => {
        try {
            const details = await boqService.getBoqById(item.id);
            setViewingItem(details);
            setIsViewModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch BOQ details.");
            console.error(error);
        }
    };

    const tabs = [
        { id: "boq-list", label: `BOQ List (${totalItems})`, icon: <List className="w-4 h-4" /> },
        { id: "item-list", label: "BOQ Item List", icon: <Layers className="w-4 h-4" /> },
        { id: "cost-tracking", label: "Cost Tracking", icon: <TrendingUp className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                title="BOQ & Estimation"
                breadcrumb={["Admin", "Work & BOQ", tabs.find((t) => t.id === activeTab)?.label || "BOQ List"]}
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
                        <ProjectSelector variant="page" hideAllProjects={true} />

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
                            Create BOQ
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                                            value={approvalStatusFilter}
                                            onChange={(e) => setApprovalStatusFilter(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                        >
                                            <option value="all">All Approvals</option>
                                            <option value="pending">Pending</option>
                                            <option value="under_review">Under Review</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
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
                                                                    <div className="relative" ref={exportMenuId === item.id ? exportMenuRef : null}>
                                                                        <button onClick={() => setExportMenuId(exportMenuId === item.id ? null : item.id)} className={`p-1.5 transition-colors ${exportMenuId === item.id ? "text-primary bg-primary/10 rounded-lg" : "text-slate-500 hover:text-primary"}`} title="Export Details">
                                                                            <Upload className="w-4 h-4" />
                                                                        </button>
                                                                        {exportMenuId === item.id && (
                                                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                                <button onClick={(e) => { e.stopPropagation(); handleExport(item, "excel"); }} disabled={isExporting} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                                                                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                                                                    CSV (.csv)
                                                                                </button>
                                                                                <button onClick={(e) => { e.stopPropagation(); handleExport(item, "pdf"); }} disabled={isExporting} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all">
                                                                                    <FileText className="w-4 h-4 text-rose-500" />
                                                                                    PDF Report
                                                                                </button>
                                                                                <button onClick={(e) => { e.stopPropagation(); handleExport(item, "json"); }} disabled={isExporting} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all">
                                                                                    <FileJson className="w-4 h-4 text-amber-500" />
                                                                                    JSON Data
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button onClick={() => { setSelectedBoqGroupId(item.true_group_id || item.boq_group_id || item.id); setIsAddBoqItemModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-primary transition-colors" title="Add Item to Group"><Plus className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleViewDetails(item)} className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                                                                    <button onClick={() => openActualsModal(item)} className="p-1.5 text-slate-500 hover:text-emerald-600 transition-colors" title="Update Actuals"><TrendingUp className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleDownloadReport(item)} className="p-1.5 text-slate-500 hover:text-indigo-500 transition-colors" title="Download Report"><FileText className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleViewAlerts(item)} className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors" title="View Alerts"><Bell className="w-4 h-4" /></button>
                                                                    <button onClick={() => openOptimizationModal(item)} className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors" title="Optimize BOQ"><Sparkles className="w-4 h-4" /></button>
                                                                    <button onClick={() => openHistoryModal(item)} className="p-1.5 text-slate-500 hover:text-violet-600 transition-colors" title="View History"><History className="w-4 h-4" /></button>
                                                                    <button onClick={() => openSelectMilestoneModal(item)} className="p-1.5 text-slate-500 hover:text-fuchsia-600 transition-colors" title="Generate Tasks"><ClipboardList className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleDeleteClick(item.id)} disabled={item.approval_status === "Approved"} className={`p-1.5 transition-colors ${item.approval_status === "Approved" ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-rose-600"}`} title={item.approval_status === "Approved" ? "Cannot delete an approved item" : "Delete"}><Trash2 className="w-4 h-4" /></button>
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
                        {activeTab === "item-list" && (
                            <ItemListView
                                projectId={selectedProjectId !== null ? String(selectedProjectId) : null}
                                boqGroups={boqGroups}
                            />
                        )}
                        {activeTab === "cost-tracking" && <CostTrackingView projectId={selectedProjectId !== null ? String(selectedProjectId) : null} selectedVersion={selectedVersion} />}
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

            <AddBoqItemModal
                isOpen={isAddBoqItemModalOpen}
                onClose={() => { setIsAddBoqItemModalOpen(false); setSelectedBoqGroupId(null); }}
                onSubmit={handleAddBoqItemSubmit}
                projects={assignedProjects}
                groupId={selectedBoqGroupId}
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

            {/* Generated Tasks Modal */}
            {isTasksModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Generated Tasks</h3>
                                <p className="text-xs text-slate-500 font-medium">Tasks created from: <span className="text-primary font-bold">{activeItemForModal?.item_name}</span></p>
                            </div>
                            <button
                                onClick={() => setIsTasksModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {generatedTasksList.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 font-medium">
                                    No tasks were returned. The generation process might be incomplete or the BOQ has no detailed sub-items to generate tasks for.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {generatedTasksList.map((task, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800">{task.task_name || task.name || `Task #${idx + 1}`}</h4>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">
                                                    {task.status || "Pending"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-3">{task.description || "No description provided."}</p>
                                            {task.milestone_id && (
                                                <div className="text-xs text-slate-400 font-medium">Milestone ID: {task.milestone_id}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-50 text-center bg-white">
                            <button
                                onClick={() => setIsTasksModalOpen(false)}
                                className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Milestone Modal */}
            {isSelectMilestoneModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Generate Tasks</h3>
                                <p className="text-xs text-slate-500 font-medium">Select parameters to generate tasks</p>
                            </div>
                            <button
                                onClick={() => setIsSelectMilestoneModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50/30 max-h-[60vh] overflow-y-auto space-y-6">

                            {/* BOQ Selection (Read-only since it's selected from row) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target BOQ</label>
                                <div className="w-full p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                                    <span className="font-bold text-primary">{pendingGenerateTaskBoqName}</span>
                                </div>
                            </div>

                            {/* Milestone Selection (List) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Milestone</label>
                                {milestonesList.length === 0 ? (
                                    <div className="text-center py-6 bg-white border border-slate-100 rounded-xl">
                                        <p className="text-slate-500 font-medium text-sm">No milestones found for this project.</p>
                                        <button onClick={() => handleGenerateTasks(0)} className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-200">
                                            Generate Without Milestone
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {milestonesList.map((ms) => (
                                            <button
                                                key={ms.id}
                                                onClick={() => handleGenerateTasks(ms.id)}
                                                className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-primary hover:shadow-md hover:bg-primary/5 transition-all group flex items-center justify-between"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-700 group-hover:text-primary transition-colors block">{ms.name}</span>
                                                    <div className="text-xs text-slate-400 mt-1">{ms.date || "No date set"}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ms.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {ms.status || "Upcoming"}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}

                                        <div className="pt-4 mt-4 border-t border-slate-100">
                                            <button onClick={() => handleGenerateTasks(0)} className="w-full p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 font-bold text-sm hover:border-slate-400 hover:text-slate-700 transition-colors bg-white">
                                                Skip & Generate Without Milestone
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <OptimizationModal
                isOpen={isOptimizationModalOpen}
                onClose={() => { setIsOptimizationModalOpen(false); setOptimizationBoqId(null); }}
                projectId={optimizationBoqId || undefined}
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
   COST TRACKING VIEW
   ════════════════════════════════════════════════════════════ */
const CostTrackingView = ({ projectId, selectedVersion }: { projectId: string | null; selectedVersion: number | "latest" }) => {
    const [comparisonData, setComparisonData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!projectId) {
            setComparisonData([]);
            return;
        }
        const fetchComparison = async () => {
            setLoading(true);
            try {
                const data = await boqService.getBoqComparison(Number(projectId), selectedVersion);
                setComparisonData(data || []);
            } catch (error) {
                console.error("Failed to fetch comparison data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchComparison();
    }, [projectId, selectedVersion]);

    useEffect(() => {
        setCurrentPage(1);
    }, [projectId, selectedVersion]);

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a project to view cost tracking.</p>
            </div>
        );
    }

    const totalItems = comparisonData.length;
    const paginatedData = comparisonData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Variance Analysis Report</h3>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        </div>
                    ) : (
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
                                {paginatedData.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest relative">No items available.</td></tr>
                                ) : (
                                    paginatedData.map((item, idx) => {
                                        const variance = Number(item.variance || 0);
                                        const estimated = Number(item.estimated || 0);
                                        const actual = Number(item.actual || 0);
                                        const efficiency = actual > 0 ? (estimated / actual) * 100 : 100;

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-800">{item.item_name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs font-bold text-slate-400">{formatCompactCurrency(estimated)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs font-bold text-slate-600">{formatCompactCurrency(actual)}</span>
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
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {!loading && totalItems > 0 && (
                    <Pagination
                        currentPage={currentPage - 1}
                        totalItems={totalItems}
                        pageSize={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page + 1)}
                    />
                )}
            </div>
        </div>
    );
};

export default BOQPage;

/* ═══════════════════════════════════════════════════════════════
   ITEM LIST VIEW
   ════════════════════════════════════════════════════════════ */
const ItemListView = ({
    projectId,
    boqGroups
}: {
    projectId: string | null;
    boqGroups: any[];
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const itemsPerPage = 10;

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshItems = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        if (boqGroups && boqGroups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(boqGroups[0].true_group_id || boqGroups[0].boq_group_id || boqGroups[0].id);
        }
    }, [boqGroups, selectedGroupId]);

    // Fetch items for the specifically selected group
    useEffect(() => {
        if (!selectedGroupId) {
            setItems([]);
            return;
        }

        const fetchItems = async () => {
            setLoading(true);
            try {
                const groupItems = await boqService.getGroupItems(selectedGroupId);
                setItems(groupItems);
            } catch (error) {
                console.error("Failed to fetch group items", error);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [selectedGroupId, refreshTrigger]);

    useEffect(() => {
        setCurrentPage(1);
    }, [boqGroups, refreshTrigger]);

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a project to view item list.</p>
            </div>
        );
    }

    const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">All Items</h3>
                        <p className="text-xs text-slate-500 font-medium">List of all items across BOQ groups.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by BOQ:</label>
                        <select
                            value={selectedGroupId || ""}
                            onChange={(e) => {
                                setSelectedGroupId(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer min-w-[200px]"
                        >
                            <option value="" disabled>Select BOQ Group</option>
                            {boqGroups?.map(group => (
                                <option key={group.id} value={group.true_group_id || group.boq_group_id || group.id}>{group.item_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4 text-right">Unit Rate</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest font-inter">Loading items...</td></tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest font-inter">No items available.</td></tr>
                            ) : (
                                paginatedItems.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-800">{item.item_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-slate-500 line-clamp-1">{item.description}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-700">{item.quantity} {item.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-slate-700">{formatCompactCurrency(item.unit_cost)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {item.status || "Active"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                {/* View button removed as per request */}
                                                <button onClick={() => { setItemToEdit(item); setIsEditModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors" title="Edit Item"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => { setItemToDelete(item.id); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors" title="Delete Item"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {items.length > itemsPerPage && (
                    <div className="p-4 border-t border-slate-50 flex justify-center bg-slate-50/30">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={items.length}
                            pageSize={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            <EditBoqItemModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setItemToEdit(null); }}
                onSubmit={async (data) => {
                    if (itemToEdit) {
                        await boqService.updateGroupItem(itemToEdit.id, data);
                        toast.success("Item updated successfully");
                        refreshItems();
                        setIsEditModalOpen(false);
                        setItemToEdit(null);
                    }
                }}
                initialData={itemToEdit}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                onConfirm={async () => {
                    if (itemToDelete) {
                        try {
                            await boqService.deleteGroupItem(itemToDelete);
                            toast.success("Item deleted successfully");
                            refreshItems();
                        } catch (e) {
                            toast.error("Failed to delete item");
                        } finally {
                            setIsDeleteModalOpen(false);
                            setItemToDelete(null);
                        }
                    }
                }}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
};
