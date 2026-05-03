import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Package,
    TrendingUp,
    Activity,
    Search,
    Plus,
    Edit2,
    Trash2,
    Eye,
    Filter,
    Layers,
    ArrowUpRight,
    AlertOctagon
} from "lucide-react";

import { inventoryService } from "../../../services/inventoryService.ts";
import type { MaterialStock } from "../../../types/inventory.ts";

// ─── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_STOCK: MaterialStock[] = [
    {
        id: 1,
        material_name: "Grade-43 Cement",
        category: "Consumables",
        current_stock: 450,
        unit: "Bags",
        min_stock_level: 100,
        last_updated: "2026-04-13",
        status: "Available",
    },
    {
        id: 2,
        material_name: "TMT Steel 12mm",
        category: "Reinforcement",
        current_stock: 12.5,
        unit: "MT",
        min_stock_level: 5.0,
        last_updated: "2026-04-12",
        status: "Available",
    },
    {
        id: 3,
        material_name: "Binding Wire",
        category: "Hardware",
        current_stock: 45,
        unit: "Kg",
        min_stock_level: 50,
        last_updated: "2026-04-11",
        status: "Low Stock",
    },
];

const MaterialStockPage = () => {
    const [stockList, setStockList] = useState<MaterialStock[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");

    // Modal States
    const [selectedStock, setSelectedStock] = useState<MaterialStock | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const fetchStock = useCallback(async () => {
        setIsLoading(true);
        try {
            let apiData: MaterialStock[] = [];
            try {
                const response = await inventoryService.getStock();
                apiData = response.items;
            } catch (err) {
                console.warn("API unavailable, using demo data.");
            }

            if (apiData.length === 0) {
                setStockList(DEMO_STOCK);
            } else {
                setStockList(apiData);
            }
        } catch (error) {
            toast.error("Failed to sync inventory vault");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    const filteredList = useMemo(() => {
        return stockList.filter(item => {
            const matchesSearch = item.material_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [stockList, searchTerm, categoryFilter]);

    const stats = {
        totalItems: stockList.length,
        lowStock: stockList.filter(s => s.status === "Low Stock").length,
        totalValue: "₹42.5L",
        turnover: "14%",
    };

    return (
        <>
            <Navbar title="Inventory Vault" breadcrumb={["Engineer", "Material", "Live Stock"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resource Equilibrium Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none">Live auditing of site materials and critical stock thresholds.</p>
                    </div>
                    <button
                        onClick={() => toast.success("Opening Receipt Portal...")}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Receipt
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Stock Entities"
                        value={stats.totalItems.toString()}
                        sub="Registered SKU"
                        accent="text-slate-800"
                        icon={<Package className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Low Threshold"
                        value={stats.lowStock.toString()}
                        sub="Urgent Procurement"
                        accent="text-rose-500"
                        icon={<AlertOctagon className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Inventory Value"
                        value={stats.totalValue}
                        sub="Current Asset Worth"
                        accent="text-emerald-500"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Monthly Turnover"
                        value={stats.turnover}
                        sub="Consumption Rate"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by material name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                            >
                                <option>All Categories</option>
                                <option>Consumables</option>
                                <option>Reinforcement</option>
                                <option>Hardware</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing inventory vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Material Entity</th>
                                        <th className="px-6 py-4 font-inter text-center">Quantitative Levels</th>
                                        <th className="px-6 py-4 font-inter text-center">Live Status</th>
                                        <th className="px-6 py-4 font-inter">Audit Trail</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex items-center gap-3 font-inter">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 font-inter">
                                                            <Layers className="w-5 h-5 text-slate-400 font-inter" />
                                                        </div>
                                                        <div className="flex flex-col font-inter">
                                                            <span className="text-sm font-bold text-slate-800 font-inter uppercase">{item.material_name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{item.category}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter text-center">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 tabular-nums font-inter">{item.current_stock} {item.unit}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold font-inter">Min Threshold: {item.min_stock_level} {item.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter text-center">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${item.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 font-inter">
                                                            <ArrowUpRight className="w-3 h-3 text-emerald-500 font-inter" />
                                                            <span className="font-bold uppercase tracking-widest">LAST SYNC</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold font-inter">{item.last_updated}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 font-inter">
                                                        <button
                                                            onClick={() => { setSelectedStock(item); setIsDetailOpen(true); }}
                                                            className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 font-inter ${item.status === 'Available' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}
                                                            title="View Intelligence"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                            title="Modify Record"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                            title="Archive Entry"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                                                No resources found in the live inventory ledger.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Material Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedStock && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Inventory Equilibrium Analysis</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">{selectedStock.material_name}</h3>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Current Level</p>
                                        <p className="text-2xl font-black text-emerald-400 font-inter italic-none">{selectedStock.current_stock} {selectedStock.unit}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Critical Threshold</p>
                                        <p className="text-lg font-black font-inter italic-none">{selectedStock.min_stock_level} {selectedStock.unit}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 font-inter">
                                <div className="flex items-center justify-between mb-4 font-inter">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Threshold Saturation</p>
                                    <span className="text-[10px] font-black text-emerald-500 font-inter italic-none">SAFE OPERATING ZONE</span>
                                </div>
                                <div className="w-full h-3 bg-white rounded-full border border-slate-200 overflow-hidden font-inter">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min((selectedStock.current_stock / selectedStock.min_stock_level) * 50, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 font-inter">
                                <div className="font-inter">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Resource Category</p>
                                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedStock.category}</p>
                                </div>
                                <div className="font-inter">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit Integrity</p>
                                    <p className="text-sm font-black text-slate-800 font-inter italic-none">Verified {selectedStock.last_updated}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDetailOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
                        >
                            Dismiss Material Insight
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialStockPage;
