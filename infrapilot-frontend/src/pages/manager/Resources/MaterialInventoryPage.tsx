import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";
import {
    Search, RotateCcw,
    FileDown
} from "lucide-react";
import { materialService, type InventoryItem, type MaterialReport, type MaterialLog } from "../../../services/materialService";
import { useAuth } from "../../../context/AuthContext";
import { useProject } from "../../../context/ProjectContext";

type TabType = "Stock Overview" | "Consolidated Stock" | "Reports" | "Inventory Adjustment";

const MaterialInventoryPage = () => {
    const { selectedProjectId: globalProjectId, assignedProjects, isLoading: isProjectLoading } = useProject();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("Stock Overview");
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [globalInventory, setGlobalInventory] = useState<InventoryItem[]>([]);
    const [reports, setReports] = useState<MaterialReport[]>([]);
    const [adjustments, setAdjustments] = useState<MaterialLog[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    const projectId = globalProjectId || (user as any)?.project_id;

    const formatINR = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(amount));
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "Stock Overview") {
                const inv = await materialService.getProjectInventory(projectId);
                setInventory(inv);
            } else if (activeTab === "Consolidated Stock") {
                const inv = await materialService.getInventory();
                setGlobalInventory(inv);
            } else if (activeTab === "Reports") {
                const data = await materialService.getMaterialReport(projectId);
                setReports(data.materials);
            } else if (activeTab === "Inventory Adjustment") {
                const data = await materialService.getLogs({ project_id: projectId, type: "ADJUSTMENT" });
                setAdjustments(data);
            }
        } catch (e) {
            toast.error("Failed to sync inventory data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isProjectLoading) return;
        fetchData();
    }, [activeTab, globalProjectId, isProjectLoading]);

    // Reset page when tab or search changes
    useEffect(() => { setCurrentPage(0); }, [activeTab, searchTerm]);

    const filteredInventory = (inventory || []).filter(i => (i.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const pagedInventory = filteredInventory.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const filteredReports = (reports || []).filter(r => (r.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()));
    // We can add pagination to reports later if needed, for now just use the filtered list to keep it simple and fix the blank issue

    const filteredAdjustments = (adjustments || []).filter(a => ((a as any).material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (a.type || "").toLowerCase().includes(searchTerm.toLowerCase()));

    useEffect(() => {
        console.log(`MaterialInventoryPage State - Tab: ${activeTab}, Inventory Count: ${inventory?.length}, Reports Count: ${reports?.length}, CurrentPage: ${currentPage}`);
    }, [activeTab, inventory, reports, currentPage]);

    const renderStockOverview = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Material Name</th>
                    <th className="px-6 py-4 text-center">Remaining Stock</th>
                    <th className="px-6 py-4 text-right">Avg Rate</th>
                    <th className="px-6 py-4 text-right">Total Value</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Syncing ledger...</td></tr>
                ) : pagedInventory.length > 0 ? pagedInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.material_name}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg font-bold ${item.remaining_stock < 10 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {item.remaining_stock}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">{formatINR(item.avg_rate)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">{formatINR(item.total_value)}</td>
                    </tr>
                )) : (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">No materials found in local stock</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderStockPagination = () => {
        if (filteredInventory.length <= PAGE_SIZE) return null;
        const totalPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
        return (
            <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredInventory.length)} of {filteredInventory.length} Materials
                </p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">{currentPage + 1}</div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        );
    };

    const renderGlobalInventory = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Material</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-right">Unit Rate</th>
                    <th className="px-6 py-4 text-right">Value</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading global stock...</td></tr>
                ) : (globalInventory || [])
                    .filter(i => assignedProjects.some(p => p.id === i.project_id))
                    .filter(i => i.material_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((i, idx) => {
                        const project = assignedProjects.find(p => p.id === i.project_id);
                        return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{i.material_name}</td>
                                <td className="px-6 py-4 text-xs font-bold text-primary">
                                    {project?.project_name || `PRJ-${i.project_id}`}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-700">{i.remaining_stock} <span className="text-[10px] text-slate-400 uppercase">{i.unit}</span></td>
                                <td className="px-6 py-4 text-right text-slate-600">{formatINR(i.avg_rate)}</td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatINR(i.total_value)}</td>
                            </tr>
                        );
                    })}
            </tbody>
        </table>
    );

    const renderReports = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Material</th>
                    <th className="px-6 py-4 text-center">Purchased</th>
                    <th className="px-6 py-4 text-center">Used</th>
                    <th className="px-6 py-4 text-right">Costing</th>
                    <th className="px-6 py-4 text-right text-rose-500">Payables</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">Generating reports...</td></tr>
                ) : filteredReports.length > 0 ? filteredReports.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{r.material_name}</td>
                        <td className="px-6 py-4 text-center text-blue-600 font-medium">{r.total_purchased}</td>
                        <td className="px-6 py-4 text-center text-orange-600 font-medium">{r.total_used}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{formatINR(r.total_cost)}</td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600">{formatINR(r.payment_pending)}</td>
                    </tr>
                )) : (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No material reports available</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderAdjustments = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action Type</th>
                    <th className="px-6 py-4 text-center">Qty Offset</th>
                    <th className="px-6 py-4">Audit Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Fetching audit logs...</td></tr>
                ) : filteredAdjustments.length > 0 ? filteredAdjustments.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(a.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-tight">{a.type} / {a.issue_type}</span></td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{a.quantity}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-400 italic">Manual Adjustment Commited</td>
                    </tr>
                )) : (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">No adjustment logs found</td></tr>
                )}
            </tbody>
        </table>
    );

    return (
        <>
            <Navbar title="Inventory Ledger" breadcrumb={["Manager", "Resources", "Material Inventory"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Inventory & Stock</h1>
                        <p className="text-slate-500 text-sm">Strategic oversight of material procurement, consumption, and site-specific stock levels.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-100 shadow-sm h-10 transition-all active:scale-95">
                            <FileDown className="w-4 h-4" /> Export Ledger
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto max-w-full no-scrollbar">
                    {(["Stock Overview", "Consolidated Stock", "Reports", "Inventory Adjustment"] as TabType[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <div className="relative max-w-md w-full">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-primary transition-all"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === "Stock Overview" && renderStockOverview()}
                        {activeTab === "Consolidated Stock" && renderGlobalInventory()}
                        {activeTab === "Reports" && renderReports()}
                        {activeTab === "Inventory Adjustment" && renderAdjustments()}
                    </div>
                    {activeTab === "Stock Overview" && renderStockPagination()}
                </div>
            </PageTransition>
        </>
    );
};

export default MaterialInventoryPage;
