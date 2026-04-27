import { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialStock {
    id: number;
    materialName: string;
    unit: "Bag" | "Kg" | "Ton" | "Liters" | "No";
    openingStock: number;
    receivedQuantity: number;
    usedQuantity: number;
    closingStock: number;
    supplierName: string;
    billNumber: string;
    location: string;
    minStockLevel: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockStock: MaterialStock[] = [
    {
        id: 1,
        materialName: "UltraTech Cement",
        unit: "Bag",
        openingStock: 1000,
        receivedQuantity: 500,
        usedQuantity: 120,
        closingStock: 1380, // (1000+500)-120
        supplierName: "Global Builders",
        billNumber: "INV-2026-001",
        location: "Main Site Store",
        minStockLevel: 200,
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        openingStock: 15,
        receivedQuantity: 5,
        usedQuantity: 1.5,
        closingStock: 18.5,
        supplierName: "Iron Traders",
        billNumber: "INV-2026-042",
        location: "Block-A Yard",
        minStockLevel: 2,
    },
    {
        id: 3,
        materialName: "River Sand (Fine)",
        unit: "Ton",
        openingStock: 50,
        receivedQuantity: 0,
        usedQuantity: 48.5,
        closingStock: 1.5,
        supplierName: "Apex Aggregates",
        billNumber: "INV-2026-099",
        location: "Aggregate Bin",
        minStockLevel: 10,
    },
];

const MaterialStockPage = () => {
    const [stockList] = useState<MaterialStock[]>(mockStock);
    const [selectedStock, setSelectedStock] = useState<MaterialStock | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Summary stats
    const totalMaterials = stockList.length;
    const lowStockItems = stockList.filter(s => s.closingStock < s.minStockLevel).length;

    const filteredList = useMemo(() => {
        return stockList.filter((item) =>
            item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stockList, searchTerm]);

    return (
        <>
            <Navbar title="Material Stock" breadcrumb={["InfraPilot", "Engineer", "Inventory", "Stock"]} />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">Inventory Balance Registry</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Master Stock Ledger</h1>
                        <p className="text-slate-500 text-sm font-medium font-inter leading-relaxed max-w-xl">Real-time calculate: Opening + Received - Used. Threshold alerts notify when stock is critical.</p>
                    </div>
                </div>

                {/* ── Summary Stats (DSR Style) ───────────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">Stock Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Items</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{totalMaterials}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Unique Material SKUs</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Low Stock Alert</p>
                            <p className={`text-2xl font-bold font-inter ${lowStockItems > 0 ? "text-rose-600" : "text-emerald-500"}`}>{lowStockItems}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Under Safety Threshold</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter italic-none">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search stock ledger..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 w-64 font-inter"
                        />
                    </div>
                </div>

                {/* ── Ledger Grid (DSR Card Style) ───────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter underline-none">
                        {filteredList.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col relative group underline-none">
                                <div className="flex items-center justify-between mb-1 font-inter italic-none">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SKU #{item.id}</span>
                                    {item.closingStock < item.minStockLevel && (
                                        <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg bg-rose-50 text-rose-600 animate-pulse">Low Stock</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2 italic-none uppercase tracking-wider">{item.unit} · {item.location}</p>
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-4 tracking-tight">{item.materialName}</p>

                                <div className="grid grid-cols-2 gap-3 mt-auto border-t border-slate-50 pt-4 font-inter">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Closing Stock</p>
                                        <p className={`text-2xl font-bold font-inter tabular-nums ${item.closingStock < item.minStockLevel ? "text-rose-600" : "text-emerald-600"}`}>{item.closingStock}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-inter">Available Now</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Unit/Supplier</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter truncate uppercase tracking-tighter">{item.unit} / {item.supplierName.split(' ')[0]}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-inter">Main Detail</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <button
                                        onClick={() => setSelectedStock(item)}
                                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all font-inter border border-slate-100"
                                    >
                                        Stock Management Detail
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageTransition>

            {/* Stock Insight Modal (DSR Parity) */}
            <Modal isOpen={!!selectedStock} onClose={() => setSelectedStock(null)} title="Inventory Stock Management" maxWidth="max-w-xl">
                {selectedStock && (
                    <div className="bg-white p-6 italic-none text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className={`rounded-[2rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden font-inter transition-all ${selectedStock.closingStock < selectedStock.minStockLevel ? "bg-rose-600 shadow-rose-200" : "bg-blue-600 shadow-blue-200"}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl font-inter" />
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 font-inter">Stock Health Insight</p>
                                <div className="flex items-center justify-between mb-8 font-inter">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedStock.materialName}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner font-inter">
                                        <svg className="w-6 h-6 opacity-40 text-white font-inter" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 font-inter">Closing Balance</p>
                                        <p className="text-xl font-black font-inter">{selectedStock.closingStock} {selectedStock.unit}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 font-inter">Status</p>
                                        <p className="text-xl font-black font-inter">{selectedStock.closingStock < selectedStock.minStockLevel ? "LOW STOCK" : "NORMAL"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 mb-10 px-1 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Inventory Flow Analysis</p>
                                <div className={`grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 pl-6 ${selectedStock.closingStock < selectedStock.minStockLevel ? "border-rose-500" : "border-blue-500"}`}>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Opening Stock</p><p className="text-sm font-black text-slate-800 tabular-nums font-inter">{selectedStock.openingStock}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Received (+)</p><p className="text-sm font-black text-emerald-600 tabular-nums font-inter">+{selectedStock.receivedQuantity}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Used (-)</p><p className="text-sm font-black text-rose-500 tabular-nums font-inter">-{selectedStock.usedQuantity}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Safety Threshold</p><p className="text-sm font-black text-slate-800 tabular-nums font-inter">{selectedStock.minStockLevel}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Purchased From</p><p className="text-sm font-black text-slate-800 font-inter leading-tight">{selectedStock.supplierName}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Last Bill No</p><p className="text-sm font-black text-slate-800 font-inter tabular-nums">{selectedStock.billNumber}</p></div>
                                    <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Storage Location</p><p className="text-sm font-black text-slate-800 font-inter">{selectedStock.location}</p></div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedStock(null)} className="flex-1 w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter underline-none">Close Stock Detail</button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialStockPage;
