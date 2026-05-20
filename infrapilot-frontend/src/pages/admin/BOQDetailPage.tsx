import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import { boqService } from "../../services/boqService";
import { projectService } from "../../services/projectService";
import type { BoqItem, BoqSummary } from "../../types/boq";
import type { Project } from "../../types/project";
import {
    TrendingUp,
    Layers,
    Download,
    Eye,
    History,
    FileSpreadsheet,
    FileText,
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    AlertCircle,
    LayoutDashboard,
    Table as TableIcon,
    Clock,
    Sparkles,
    Pencil,
    Trash2,
} from "lucide-react";
import UpdateActualsModal from "../../components/forms/UpdateActualsModal";
import BOQHistoryModal from "../../components/dashboard/BOQHistoryModal";
import BOQDetailsModal from "../../components/dashboard/BOQDetailsModal";
import StatCard from "../../components/common/StatCard";
import CreateBOQModal from "../../components/forms/CreateBOQModal";

// ─── Tabs Configuration ──────────────────────────────────────────────────────
const TABS = [
    { id: "overview", label: "Fiscal Overview", icon: LayoutDashboard },
    { id: "ledger", label: "BOQ Ledger", icon: TableIcon },
    { id: "versions", label: "Version History", icon: Clock },
    { id: "optimization", label: "AI Optimization", icon: Sparkles },
];

const BOQDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = id ? parseInt(id) : 0;

    // Data States
    const [project, setProject] = useState<Project | null>(null);
    const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
    const [summary, setSummary] = useState<BoqSummary | null>(null);
    const [versions, setVersions] = useState<number[]>([]);
    const [comparison, setComparison] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    // New Data States
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

    // UI States
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedVersion, setSelectedVersion] = useState<number | "latest">("latest");
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isActualsModalOpen, setIsActualsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<BoqItem | null>(null);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const [projectData, boqSummary, boqComparison] = await Promise.all([
                projectService.getProjectById(projectId),
                boqService.getBoqSummary(projectId),
                boqService.getBoqComparison(projectId)
            ]);

            setProject(projectData);
            setSummary(boqSummary);
            setComparison(boqComparison);

            const res = await boqService.getBoqs({
                project_id: projectId,
                version_no: selectedVersion !== 'latest' ? Number(selectedVersion) : undefined,
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage
            });

            // Filter out deleted and inactive items from the local state
            const activeItems = res.items.filter((item: any) =>
                item.status?.toLowerCase() !== 'deleted' &&
                item.status?.toLowerCase() !== 'inactive'
            );

            setBoqItems(activeItems);
            setTotalItems(res.total || activeItems.length);

            // Fetch versions gracefully using various IDs based on Swagger: /boq/{id}/versions
            try {
                // Try project ID first as it's the primary handle in this view
                const boqVersions = await boqService.getBoqVersions(projectId);
                setVersions(boqVersions);
            } catch (vErr) {
                // Fallback to item-based group ID if project ID fails
                if (res.items.length > 0) {
                    try {
                        const boqIdFromItems = res.items[0].boq_group_id || res.items[0].id;
                        const v2 = await boqService.getBoqVersions(boqIdFromItems);
                        setVersions(v2);
                    } catch (v2Err) {
                        console.warn("Versions not available for this BOQ yet");
                        setVersions([]);
                    }
                } else {
                    setVersions([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch BOQ data", error);
            toast.error("Failed to load BOQ details");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData, currentPage]);

    const handleVersionChange = async (version: number | "latest") => {
        setSelectedVersion(version);
        try {
            const filters = version === "latest" ? { project_id: projectId } : { project_id: projectId, version_no: version };
            const res = await boqService.getBoqs(filters);
            setBoqItems(res.items);
        } catch (error) {
            toast.error("Failed to load version data");
        }
    };

    const handleUpdateActuals = async (data: { actual_quantity: number; actual_cost: number }) => {
        if (!activeItem) return;
        try {
            await boqService.updateBoqActuals(activeItem.id, data);
            toast.success("Actuals updated successfully");
            setIsActualsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update actuals");
        }
    };

    const handleGenerateTasks = async () => {
        setIsGeneratingTasks(true);
        try {
            // Using individual item ID as the handle (e.g. #162) as per user instruction.
            const targetId = boqItems.length > 0 ? boqItems[0].id : null;

            if (!targetId) {
                toast.error("No BOQ items found. Please add an item first.");
                setIsGeneratingTasks(false);
                return;
            }

            console.log(`[BOQ Task Gen] Using Item ID: ${targetId}`);

            try {
                const response = await boqService.generateTasksFromBoq(targetId);
                const taskId = response?.task_id || "Success";
                toast.success(`Tasks generated! (Ref: ${taskId})`);
            } catch (err: any) {
                const msg = err.response?.data?.detail || "Failed to generate tasks. Verify if BOQ items are added.";
                toast.error(msg);
            }
        } catch (error: any) {
            toast.error("An unexpected error occurred during task generation.");
        } finally {
            setIsGeneratingTasks(false);
        }
    };

    const handleAddItem = async (data: any) => {
        if (boqItems.length === 0) {
            toast.error("No active BOQ document found to add items to.");
            return;
        }
        try {
            const boqId = boqItems[0].boq_group_id || boqItems[0].id;
            await boqService.addBoqItem(boqId, data);
            toast.success("Item added to BOQ");
            setIsCreateModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to add item");
        }
    };

    const handleUpdateItem = async (data: any) => {
        if (!activeItem) return;
        try {
            await boqService.updateBoqItem(activeItem.id, data);
            toast.success("Item updated successfully");
            setIsCreateModalOpen(false);
            setActiveItem(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to update item");
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        try {
            await boqService.deleteBoqItem(itemId);
            toast.success("Item deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const fetchSuggestions = useCallback(async () => {
        if (boqItems.length === 0) return;
        try {
            const boqId = boqItems[0].boq_group_id || boqItems[0].id;
            const res = await boqService.getBoqSuggestions(boqId);
            setSuggestions(res.suggestions || []);
        } catch (error) {
            console.error("Failed to fetch suggestions", error);
        }
    }, [boqItems]);

    useEffect(() => {
        if (activeTab === "optimization") {
            fetchSuggestions();
        }
    }, [activeTab, fetchSuggestions]);

    const handleExport = async (format: "excel" | "pdf" | "json") => {
        try {
            if (boqItems.length === 0) {
                toast.error("No items to export");
                return;
            }

            toast.loading(`Preparing ${format.toUpperCase()}...`, { id: "export" });

            const boqId = boqItems[0].boq_group_id || boqItems[0].id;
            const data = await boqService.exportBoq(boqId, format);

            const fileName = `BOQ_Export_${project?.project_name || "Project"}.${format === "excel" ? "xlsx" : format === "json" ? "json" : "pdf"}`;
            const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = fileName; a.click();
            window.URL.revokeObjectURL(url);
            toast.success(`${format.toUpperCase()} exported`, { id: "export" });
        } catch (error) {
            toast.error("Export failed", { id: "export" });
        } finally {
            setIsExportMenuOpen(false);
        }
    };

    if (isLoading && !project) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Navbar title="Work & BOQ Detail" breadcrumb={["Admin", "Work & BOQ", project?.project_name || "Detail"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">

                {/* Back and Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate("/admin/boq")}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-4 font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Master Setup
                    </button>

                    {/* Hero Profile Header */}
                    <div className="relative bg-gradient-to-br from-slate-900 via-primary to-blue-900 rounded-3xl p-8 text-white shadow-2xl">
                        {/* Background Decoration (Clipped) */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl -ml-32 -mb-32" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-black shrink-0 shadow-inner">
                                    {project?.project_name?.charAt(0) || "P"}
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-black tracking-tight">{project?.project_name || "N/A"}</h1>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                                            {project?.status || "Active"}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/70 text-sm font-medium">
                                        <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Owner ID: {project?.owner_id || "N/A"}</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Start: {project?.start_date ? new Date(project.start_date).toLocaleDateString() : "TBD"}</span>
                                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> End: {project?.end_date ? new Date(project.end_date).toLocaleDateString() : "TBD"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-center md:self-end">
                                <button
                                    onClick={handleGenerateTasks}
                                    disabled={isGeneratingTasks || boqItems.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isGeneratingTasks
                                        ? "bg-white/5 text-white/40 cursor-not-allowed"
                                        : "bg-white text-primary hover:bg-slate-50 shadow-lg"
                                        }`}
                                >
                                    {isGeneratingTasks ? (
                                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {isGeneratingTasks ? "Generating..." : "Generate Tasks"}
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-bold transition-all"
                                    >
                                        <Download className="w-4 h-4" /> Export
                                    </button>
                                    {isExportMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] text-slate-700">
                                            <button onClick={() => handleExport("excel")} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV Ledger
                                            </button>
                                            <button onClick={() => handleExport("pdf")} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold">
                                                <FileText className="w-4 h-4 text-rose-500" /> PDF Report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Selection */}
                <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm mb-8 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === tab.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                    {activeTab === "overview" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard
                                    title="Est. Budget"
                                    value={`₹${(summary?.estimated || boqItems.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0)).toLocaleString('en-IN')}`}
                                    sub={`${boqItems.length} items estimated`}
                                    accent="text-primary"
                                />
                                <StatCard
                                    title="Actual Spend"
                                    value={`₹${(summary?.actual || boqItems.reduce((acc, curr) => acc + (Number(curr.actual_cost) || 0), 0)).toLocaleString('en-IN')}`}
                                    sub="Current realized costs"
                                    accent="text-violet-600"
                                />
                                <StatCard
                                    title="Variance"
                                    value={`₹${Math.abs(summary?.difference || ((summary?.estimated || boqItems.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0)) - (summary?.actual || boqItems.reduce((acc, curr) => acc + (Number(curr.actual_cost) || 0), 0)))).toLocaleString('en-IN')}`}
                                    sub={(summary?.difference || 0) < 0 ? "Above Budget" : "Under Budget"}
                                    accent={(summary?.difference || 0) < 0 ? "text-rose-500" : "text-emerald-500"}
                                />
                                <StatCard title="Completion" value={`${Math.round((boqItems.filter(i => i.is_completed).length / (boqItems.length || 1)) * 100)}%`} sub={`${boqItems.filter(i => i.is_completed).length} items finished`} accent="text-amber-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Budget Health</h3>
                                    <div className="space-y-6">
                                        {comparison.slice(0, 4).map((item, idx) => {
                                            const percentage = Math.min(100, (Number(item.actual) / (Number(item.estimated) || 1)) * 100);
                                            return (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                                        <span className="text-slate-400">{item.item_name}</span>
                                                        <span className={item.variance < 0 ? "text-rose-500" : "text-emerald-500"}>
                                                            ₹{Math.abs(item.variance).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${percentage > 100 ? "bg-rose-500" : "bg-primary"}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                                    <div className="p-4 bg-primary/5 rounded-full">
                                        <CheckCircle2 className="w-12 h-12 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Fiscal Integrity Check</h3>
                                    <p className="text-sm text-slate-500 max-w-xs">All BOQ items are synced with the latest site updates and material procurement logs.</p>
                                    <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Download Audit Log</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "ledger" && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-slate-800">Itemized Bill of Quantities</h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setActiveItem(null);
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
                                    >
                                        + Add Item
                                    </button>
                                    <Layers className="w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedVersion}
                                        onChange={(e) => handleVersionChange(e.target.value === "latest" ? "latest" : parseInt(e.target.value))}
                                        className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 outline-none border border-slate-100"
                                    >
                                        <option value="latest">Latest View</option>
                                        {versions.map(v => <option key={v} value={v}>Version v{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f0f7ff] border-b border-blue-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">
                                                ID
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">
                                                Activity Details
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Category</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Quantity</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Est. Cost</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Actual Cost</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Variance</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Status</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {boqItems.map(item => {
                                            const varVal = (Number(item.total_cost) || 0) - (Number(item.actual_cost) || 0);
                                            return (
                                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-6 py-4 text-xs font-bold text-[#4a90e2]">
                                                        #{item.id}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800 group-hover:text-primary transition-all uppercase tracking-tight">{item.item_name}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 line-clamp-1">{item.description}</p>
                                                    </td>
                                                    <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-tighter">{item.category}</span></td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-600">{item.quantity} <span className="text-[10px] text-slate-300">{item.unit}</span></td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-800">₹{(item.total_cost || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-black text-violet-600">₹{(item.actual_cost || 0).toLocaleString()}</td>
                                                    <td className={`px-6 py-4 text-right font-bold ${varVal < 0 ? "text-rose-500" : "text-emerald-500"}`}>₹{Math.abs(varVal).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                                                            item.status === 'Under Review' ? 'bg-amber-100 text-amber-600' :
                                                                item.status === 'Draft' ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {item.status || (item.is_completed ? "Finished" : "Pending")}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => { setActiveItem(item); setIsActualsModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Update Actuals"><TrendingUp className="w-4 h-4" /></button>
                                                            <button onClick={() => { setActiveItem(item); setIsHistoryModalOpen(true); }} className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-xl transition-all" title="History"><History className="w-4 h-4" /></button>
                                                            <button onClick={() => { setActiveItem(item); setIsCreateModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Item"><Pencil className="w-4 h-4" /></button>
                                                            <button onClick={() => { setActiveItem(item); setIsDetailsModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="View Detail"><Eye className="w-4 h-4" /></button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this item?")) {
                                                                        handleDeleteItem(item.id);
                                                                    }
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                                title="Delete Item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination UI - Matched with UsersPage style */}
                            <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} Items
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                                        {currentPage}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalItems / itemsPerPage), p + 1))}
                                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "versions" && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-violet-50 rounded-2xl"><Clock className="w-6 h-6 text-violet-500" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Version Management</h2>
                                    <p className="text-sm text-slate-500">Track and compare historical snapshots of this project's BOQ.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {versions.map(v => (
                                    <div key={v} className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-xs font-black text-slate-800 uppercase tracking-widest">Version v{v}</span>
                                            <button className="text-primary transition-opacity"><ArrowLeft className="w-4 h-4 rotate-180" /></button>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">State</p>
                                        <p className="text-sm font-bold text-slate-700">{v === Math.max(...versions) ? "Master Snapshot (Active)" : "Archived Perspective"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "optimization" && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {suggestions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {suggestions.map((s, idx) => (
                                        <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-amber-400">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-amber-50 rounded-2xl">
                                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <span className="px-3 py-1 bg-rose-50 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    Over Budget: ₹{s.over_budget_by?.toLocaleString()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2">{s.item}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">{s.suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                                    <div className="p-6 bg-amber-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                        <Sparkles className="w-10 h-10 text-amber-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">AI Intelligence Engine</h2>
                                    <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">We're analyzing market trends and historical project data to provide cost-saving suggestions for this BOQ.</p>
                                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest">
                                        <AlertCircle className="w-4 h-4" /> Ready in 24-48h
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PageTransition>

            {activeItem && (
                <>
                    <UpdateActualsModal
                        isOpen={isActualsModalOpen}
                        onClose={() => setIsActualsModalOpen(false)}
                        onSubmit={handleUpdateActuals}
                        initialData={{
                            item_name: activeItem.item_name,
                            actual_quantity: activeItem.actual_quantity,
                            actual_cost: activeItem.actual_cost,
                            quantity: activeItem.quantity,
                            unit: activeItem.unit,
                            total_cost: String(activeItem.total_cost || "0")
                        }}
                    />
                    <BOQHistoryModal
                        isOpen={isHistoryModalOpen}
                        onClose={() => setIsHistoryModalOpen(false)}
                        boqId={activeItem.id}
                        itemName={activeItem.item_name}
                    />
                    <BOQDetailsModal
                        isOpen={isDetailsModalOpen}
                        onClose={() => setIsDetailsModalOpen(false)}
                        boqItem={activeItem}
                        projectName={project?.project_name || ""}
                    />
                </>
            )}
            <CreateBOQModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setActiveItem(null);
                }}
                onSubmit={activeItem ? handleUpdateItem : handleAddItem}
                projects={project ? [project] : []}
                initialData={activeItem}
            />
        </>
    );
};

export default BOQDetailPage;
