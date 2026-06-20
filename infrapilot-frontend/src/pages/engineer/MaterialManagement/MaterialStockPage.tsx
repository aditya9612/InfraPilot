import { useState, useEffect, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Search, RotateCcw, ChevronLeft, ChevronRight,
    FileText, FileDown, Sliders
} from "lucide-react";
import { materialService, type InventoryItem, type MaterialReport, type MaterialLog } from "../../../services/materialService";
import { projectService } from "../../../services/projectService";

type TabType = "Stock Overview" | "Global Inventory" | "Reports" | "Inventory Adjustment";

const MaterialStockPage = () => {
    const formatINR = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(amount));
    };

    const [activeTab, setActiveTab] = useState<TabType>("Stock Overview");
    const [projectId, setProjectId] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data States
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [globalInventory, setGlobalInventory] = useState<InventoryItem[]>([]);
    const [reports, setReports] = useState<MaterialReport[]>([]);
    const [adjustments, setAdjustments] = useState<MaterialLog[]>([]);
    const [valuation, setValuation] = useState({ total_value: 0 });
    const [reportSummary, setReportSummary] = useState<any>({});
    const [projectsList, setProjectsList] = useState<any[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) setProjectId(Number(pId));
            } catch (e) { console.error(e); }
        }

        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                setProjectsList(Array.isArray(res) ? res : (res.items || res.data || []));
            } catch (err) {}
        };
        fetchProjects();
    }, []);

    const handleProjectChange = (newProjectId: number) => {
        setProjectId(newProjectId);
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.user) {
                    user.user.project_id = newProjectId;
                } else {
                    user.project_id = newProjectId;
                }
                localStorage.setItem("infrapilot_user", JSON.stringify(user));
            } catch (e) { }
        }
    };

    // Modals
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustmentForm, setAdjustmentForm] = useState({ material_id: 0, new_stock: 0, reason: "" });
    const [selectedInventoryForAdj, setSelectedInventoryForAdj] = useState<InventoryItem | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [logType, setLogType] = useState<string>("ADJUSTMENT");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchStock = async () => {
        setIsLoading(true);
        try {
            const [inv, val, reportData] = await Promise.all([
                materialService.getProjectInventory(projectId),
                materialService.getInventoryValuation(),
                materialService.getMaterialReport(projectId).catch(() => ({ summary: {}, materials: [] }))
            ]);
            setInventory(inv);
            setValuation(val);
            if (reportData.summary) {
                setReportSummary(reportData.summary);
            }
        } catch (e) { toast.error("Failed to load stock data"); }
        finally { setIsLoading(false); }
    };

    const fetchReports = async () => {
        setIsLoading(true);
        try { 
            const data = await materialService.getMaterialReport(projectId); 
            setReports(data.materials); 
            setReportSummary(data.summary);
        }
        catch (e) { toast.error("Failed to load reports"); }
        finally { setIsLoading(false); }
    };

    const fetchAdjustments = async () => {
        setIsLoading(true);
        try { 
            const data = await materialService.getLogs({ project_id: projectId, type: logType === "" ? undefined : logType }); 
            setAdjustments(data); 
        }
        catch (e) { toast.error("Failed to load adjustments"); }
        finally { setIsLoading(false); }
    };

    const fetchGlobalInventory = async () => {
        setIsLoading(true);
        try { const data = await materialService.getInventory(); setGlobalInventory(data); }
        catch (e) { toast.error("Failed to load global inventory"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        setCurrentPage(1);
        if (activeTab === "Stock Overview") fetchStock();
        else if (activeTab === "Global Inventory") fetchGlobalInventory();
        else if (activeTab === "Reports") fetchReports();
        else if (activeTab === "Inventory Adjustment") { fetchAdjustments(); fetchStock(); }
    }, [activeTab, projectId, logType]);

    const stats = useMemo(() => {
        return {
            totalItems: inventory.length,
            totalValue: valuation.total_value || inventory.reduce((a, b) => a + (b.total_value || 0), 0),
            criticalCount: inventory.filter(i => i.remaining_stock < 10).length,
        };
    }, [inventory, valuation]);

    // Derived Lists
    const filteredInventory = useMemo(() => inventory.filter(i => i.material_name.toLowerCase().includes(searchTerm.toLowerCase())), [inventory, searchTerm]);
    const paginatedInventory = useMemo(() => filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredInventory, currentPage, itemsPerPage]);

    const filteredGlobalInventory = useMemo(() => globalInventory.filter(i => i.material_name.toLowerCase().includes(searchTerm.toLowerCase())), [globalInventory, searchTerm]);
    const paginatedGlobalInventory = useMemo(() => filteredGlobalInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredGlobalInventory, currentPage, itemsPerPage]);

    const filteredReports = useMemo(() => {
        let res = reports.filter(r => r.material_name.toLowerCase().includes(searchTerm.toLowerCase()));
        res.sort((a, b) => sortOrder === "latest" ? b.material_id - a.material_id : a.material_id - b.material_id);
        return res;
    }, [reports, searchTerm, sortOrder]);
    const paginatedReports = useMemo(() => filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredReports, currentPage, itemsPerPage]);

    const filteredAdjustments = useMemo(() => adjustments.filter(a => a.issue_type.toLowerCase().includes(searchTerm.toLowerCase())), [adjustments, searchTerm]);
    const paginatedAdjustments = useMemo(() => filteredAdjustments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredAdjustments, currentPage, itemsPerPage]);

    // Actions
    const handleDownload = async (type: 'pdf' | 'excel') => {
        setIsExporting(true);
        const t = toast.loading(`Generating ${type.toUpperCase()}...`);
        try {
            if (type === 'pdf') {
                await materialService.exportPdf(projectId, sortOrder);
            } else {
                await materialService.exportExcel(projectId, sortOrder);
            }
            toast.success("Download complete", { id: t });
        } catch (e) { 
            toast.error("Export failed", { id: t }); 
            console.error(e);
        }
        finally { setIsExporting(false); }
    };

    const handleAdjustmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            await materialService.adjustInventory(adjustmentForm);
            toast.success("Inventory adjusted!");
            setIsAdjustmentModalOpen(false);
            fetchAdjustments(); fetchStock();
        } catch (e) { toast.error("Failed to adjust inventory"); }
        finally { setIsSubmitting(false); }
    };

    const renderPagination = (total: number) => {
        const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky bottom-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-200 rounded-lg text-[11px] font-medium px-2 py-1 outline-none bg-white">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                    Showing {total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} records
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"><ChevronLeft className="w-4 h-4" /></button>
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || total === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar title="Material Stock" breadcrumb={["Engineer", "Material Management", "Stock & Inventory"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ─── Header ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Stock & Inventory Management
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Monitor inventory levels, view strategic reports, and perform physical audits.
                        </p>
                    </div>
                    {activeTab === "Reports" && (
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleDownload('pdf')} disabled={isExporting} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 rounded-xl text-xs font-bold transition-all border border-rose-100 shadow-sm">
                                <FileDown className="w-4 h-4" /> PDF Report
                            </button>
                            <button onClick={() => handleDownload('excel')} disabled={isExporting} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 rounded-xl text-xs font-bold transition-all border border-emerald-100 shadow-sm">
                                <FileText className="w-4 h-4" /> Excel Sheet
                            </button>
                        </div>
                    )}
                    {activeTab === "Inventory Adjustment" && (
                        <button onClick={() => { setAdjustmentForm({ material_id: inventory.length > 0 ? inventory[0].material_id : 0, new_stock: 0, reason: "" }); setSelectedInventoryForAdj(null); setIsAdjustmentModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95">
                            <Sliders className="w-4 h-4" /> Audit Adjustment
                        </button>
                    )}
                </div>

                {/* Tabs & Project Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto max-w-full scrollbar-none">
                        {(["Stock Overview", "Global Inventory", "Reports", "Inventory Adjustment"] as TabType[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Project Filter */}
                    {activeTab !== "Global Inventory" && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500">Project:</span>
                            <select value={projectId} onChange={(e) => handleProjectChange(Number(e.target.value))} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm min-w-[200px]">
                                {projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === "Stock Overview" && (
                    <div className="space-y-8 flex-1 flex flex-col min-h-0">
                        <div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Stock Valuation Stats</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    {
                                        title: "Total Materials",
                                        value: reportSummary?.total_materials || stats.totalItems,
                                        sub: "Types Configured",
                                        accent: "text-blue-500",
                                    },
                                    {
                                        title: "Total Purchased",
                                        value: reportSummary?.total_purchased || 0,
                                        sub: "Lifetime Purchase",
                                        accent: "text-indigo-500",
                                    },
                                    {
                                        title: "Total Used",
                                        value: reportSummary?.total_used || 0,
                                        sub: "Total Consumption",
                                        accent: "text-orange-500",
                                    },
                                    {
                                        title: "Total Remaining",
                                        value: reportSummary?.total_remaining || 0,
                                        sub: "Available Stock Qty",
                                        accent: "text-emerald-500",
                                    },
                                    {
                                        title: "Gross Stock Value",
                                        value: formatINR(reportSummary?.total_stock_value || stats.totalValue),
                                        sub: "Valuation of Remaining",
                                        accent: "text-teal-600",
                                    },
                                    {
                                        title: "Total Payment Given",
                                        value: formatINR(reportSummary?.total_payment_given || 0),
                                        sub: "Paid to Suppliers",
                                        accent: "text-purple-600",
                                    },
                                    {
                                        title: "Pending Payments",
                                        value: formatINR(reportSummary?.total_payment_pending || 0),
                                        sub: "Outstanding Due",
                                        accent: "text-rose-500",
                                    },
                                    {
                                        title: "Stock Status",
                                        value: `${reportSummary?.in_stock_count || 0} In`,
                                        sub: `${reportSummary?.low_stock_count || 0} Low, ${reportSummary?.out_of_stock_count || 0} Out`,
                                        accent: "text-slate-700",
                                    },
                                ].map((s, i) => (
                                    <div
                                        key={i}
                                        className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all cursor-default hover:scale-[1.02] flex flex-col justify-center`}
                                    >
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            {s.title}
                                        </p>
                                        <p className={`text-xl font-bold truncate ${s.accent}`}>{s.value}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
                                            {s.sub}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4 h-full flex flex-col min-h-0">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Project Inventory</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                            <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                    <input type="text" placeholder="Search inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                </div>
                                <button onClick={fetchStock} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                            </div>
                            <div className="flex-1 overflow-auto scrollbar-thin">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0">
                                        <tr><th className="px-6 py-4">Material Name</th><th className="px-6 py-4 text-center">Remaining Stock</th><th className="px-6 py-4 text-right">Avg Rate</th><th className="px-6 py-4 text-right">Total Value</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr> : paginatedInventory.map(i => (
                                            <tr key={i.material_id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{i.material_name}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-center text-emerald-600">{i.remaining_stock}</td>
                                                <td className="px-6 py-4 text-sm text-right text-slate-600">{formatINR(i.avg_rate)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(i.total_value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(filteredInventory.length)}
                        </div>
                    </div>
                    </div>
                )}

                {activeTab === "Global Inventory" && (
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">All Projects Stock</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                            <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                    <input type="text" placeholder="Search across all projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                </div>
                                <button onClick={fetchGlobalInventory} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                            </div>
                            <div className="flex-1 overflow-auto scrollbar-thin">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0">
                                        <tr><th className="px-6 py-4">Material Name</th><th className="px-6 py-4 text-center">Remaining Stock</th><th className="px-6 py-4">Unit</th><th className="px-6 py-4 text-right">Avg Rate</th><th className="px-6 py-4 text-right">Total Value</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr> : paginatedGlobalInventory.map((i, idx) => (
                                            <tr key={`${i.project_id}-${i.material_id}-${idx}`} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{i.material_name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${i.remaining_stock > 50 ? 'bg-emerald-50 text-emerald-600' : i.remaining_stock > 10 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {i.remaining_stock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{i.unit}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">{formatINR(i.avg_rate)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(i.total_value)}</td>
                                            </tr>
                                        ))}
                                        {!isLoading && paginatedGlobalInventory.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No global inventory found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(filteredGlobalInventory.length)}
                    </div>
                    </div>
                )}

                {activeTab === "Reports" && (
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Consumption & Stock Reports</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                <input type="text" placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div className="flex items-center gap-2">
                                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-sm">
                                    <option value="latest">LATEST FIRST</option>
                                    <option value="oldest">OLDEST FIRST</option>
                                </select>
                            </div>
                            <button onClick={fetchReports} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        <div className="flex-1 overflow-auto scrollbar-thin">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0">
                                    <tr><th className="px-6 py-4">Material Name</th><th className="px-6 py-4 text-center">Total Purchased</th><th className="px-6 py-4 text-center">Total Used</th><th className="px-6 py-4 text-center">Remaining</th><th className="px-6 py-4 text-right">Total Cost</th><th className="px-6 py-4 text-right text-rose-500">Pending Pay</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr> : paginatedReports.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{r.material_name}</td>
                                            <td className="px-6 py-4 text-sm text-center text-blue-600">{r.total_purchased}</td>
                                            <td className="px-6 py-4 text-sm text-center text-orange-600">{r.total_used}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-center text-emerald-600">{r.remaining_stock}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-right text-slate-800">{formatINR(r.total_cost)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-right text-rose-600">{formatINR(r.payment_pending)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination(filteredReports.length)}
                        </div>
                    </div>
                )}

                {activeTab === "Inventory Adjustment" && (
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Audit Adjustments Log</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                <input type="text" placeholder="Search adjustments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div className="flex items-center gap-2">
                                <select value={logType} onChange={(e) => setLogType(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-sm">
                                    <option value="">-- All Types --</option>
                                    <option value="PURCHASE">PURCHASE</option>
                                    <option value="USAGE">USAGE</option>
                                    <option value="TRANSFER_IN">TRANSFER_IN</option>
                                    <option value="TRANSFER_OUT">TRANSFER_OUT</option>
                                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                                </select>
                            </div>
                            <button onClick={fetchAdjustments} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        <div className="flex-1 overflow-auto scrollbar-thin">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0">
                                    <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-center">Qty Changed</th><th className="px-6 py-4">Remarks</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr> : paginatedAdjustments.map((a, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm text-slate-600">{new Date(a.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 rounded text-[9px] font-bold bg-amber-50 text-amber-600">{a.type} / {a.issue_type}</span></td>
                                            <td className="px-6 py-4 text-sm font-bold text-center">{a.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">Manual Audit Adjustment</td>
                                        </tr>
                                    ))}
                                    {!isLoading && paginatedAdjustments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No adjustments found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination(filteredAdjustments.length)}
                        </div>
                    </div>
                )}
            </PageTransition>

            {/* Adjustment Modal */}
            <Modal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} title="Physical Audit Adjustment" maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="adjustment-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Processing..." : "Commit Adjustment"}</button></>}>
                <form id="adjustment-form" onSubmit={handleAdjustmentSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Adjustment Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">material_id *</label>
                                <select required value={adjustmentForm.material_id || ""} onChange={e => {
                                    const val = Number(e.target.value);
                                    setAdjustmentForm({ ...adjustmentForm, material_id: val });
                                    setSelectedInventoryForAdj(inventory.find(i => i.material_id === val) || null);
                                }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-amber-500">
                                    <option value="">Select Material</option>
                                    {inventory.map(i => <option key={i.material_id} value={i.material_id}>{i.material_name}</option>)}
                                </select>
                            </div>
                            {selectedInventoryForAdj && (
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-amber-800">Current System Stock:</span>
                                    <span className="font-bold text-amber-600 text-lg">{selectedInventoryForAdj.remaining_stock} <span className="text-sm">{selectedInventoryForAdj.unit}</span></span>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">new_stock *</label>
                                <input type="number" required value={adjustmentForm.new_stock || ""} onChange={e => setAdjustmentForm({ ...adjustmentForm, new_stock: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-amber-500" placeholder="e.g. 500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">reason *</label>
                                <textarea required value={adjustmentForm.reason} onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-amber-500" rows={3} placeholder="e.g. Physical count discrepancy found during month-end audit." />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default MaterialStockPage;
