import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { useProject } from "../../context/ProjectContext";
import { boqService } from "../../services/boqService";
import toast from "react-hot-toast";
import {
    List,
    DollarSign,
    TrendingUp,
    Search,
    Filter,
    Download,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    History
} from "lucide-react";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import type { BoqItem } from "../../types/boq";


/* ─── page ───────────────────────────────────────────────────── */
const ManagerBOQPage = () => {
    const { selectedProjectId } = useProject();
    const { tab } = useParams();
    const navigate = useNavigate();
    const [boqData, setBoqData] = useState<BoqItem[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Map URL param to tab ID
    const tabMap: Record<string, string> = useMemo(() => ({
        list: "boq-list",
        budget: "budget",
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

    const fetchBOQData = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            const [items, stats] = await Promise.all([
                boqService.getBoqsByProject(selectedProjectId),
                boqService.getBoqSummary(selectedProjectId)
            ]);
            setBoqData(items);
            setSummary(stats);
        } catch (error) {
            console.error("Failed to fetch BOQ data", error);
            toast.error("Failed to sync BOQ data");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchBOQData();
    }, [fetchBOQData]);

    const tabs = [
        { id: "boq-list", label: "BOQ List", icon: <List className="w-4 h-4" /> },
        { id: "budget", label: "Budget Monitoring", icon: <DollarSign className="w-4 h-4" /> },
        { id: "cost-tracking", label: "Cost Tracking", icon: <TrendingUp className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar
                title="BOQ & Estimation"
                breadcrumb={["Manager", "BOQ", tabs.find((t) => t.id === activeTab)?.label || "BOQ List"]}
            />

            <PageTransition className="p-6 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BOQ Command Center</h1>
                        <p className="text-slate-500 mt-1">Monitor quantities, costs, and project budget performance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchBOQData}
                            className="p-2.5 text-slate-400 hover:text-primary transition-all bg-white border border-slate-200 rounded-xl shadow-sm"
                        >
                            <History className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* summary stats */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Budget</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">{formatCompactCurrency(summary.estimated || 0)}</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Across {boqData.length} line items</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actual Cost</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">{formatCompactCurrency(summary.actual || 0)}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                {(summary.actual > summary.estimated) ? (
                                    <ArrowUpRight className="w-3 h-3 text-rose-500" />
                                ) : (
                                    <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                                )}
                                <span className={`text-xs font-bold ${summary.actual > summary.estimated ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {Math.abs(((summary.actual - summary.estimated) / summary.estimated) * 100).toFixed(1)}% {summary.actual > summary.estimated ? 'over budget' : 'under budget'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variance</span>
                            </div>
                            <h3 className={`text-2xl font-black ${summary.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCompactCurrency(Math.abs(summary.difference || 0))}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Net savings / overage</p>
                        </div>
                    </div>
                )}

                {/* tabs bar */}
                <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner overflow-x-auto max-w-full">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`
                relative flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all
                ${activeTab === t.id
                                    ? "text-primary"
                                    : "text-slate-500 hover:text-slate-700"
                                }
              `}
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

                {/* tab content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {activeTab === "boq-list" && <BOQListView items={boqData} isLoading={isLoading} />}
                        {activeTab === "budget" && <BudgetView summary={summary} items={boqData} isLoading={isLoading} />}
                        {activeTab === "cost-tracking" && <CostTrackingView items={boqData} isLoading={isLoading} />}
                    </motion.div>
                </AnimatePresence>
            </PageTransition>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   1. BOQ LIST VIEW
   ════════════════════════════════════════════════════════════ */
const BOQListView = ({ items, isLoading }: { items: BoqItem[]; isLoading: boolean }) => {
    const [search, setSearch] = useState("");
    const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category?.toLowerCase() || "").includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search BOQ items…"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse font-bold tracking-widest text-xs uppercase">Loading BOQ Items...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Item Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4 text-right">Unit Cost</th>
                                    <th className="px-6 py-4 text-right">Total Estimated</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">No BOQ items found.</td></tr>
                                ) : (
                                    filtered.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-800">{item.item_name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-black text-primary/80 tracking-widest uppercase">{item.category}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-600">{item.quantity} <span className="text-slate-400 font-medium">{item.unit}</span></span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-bold text-slate-600">{formatCompactCurrency(Number(item.unit_cost || 0))}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-slate-900">{formatCompactCurrency(Number(item.total_cost || 0))}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${item.status === "ACTIVE" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                                    }`}>
                                                    {item.status || "Planned"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
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
