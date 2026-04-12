import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const stockData = [
    { id: 1, name: "Cement (OPC 53)", unit: "Bag", opening: 1200, received: 500, used: 150, closing: 1550, minLevel: 200, location: "Store", supplier: "UltraTech Ltd", bill: "GRN-8821", worker: "Ram Singh", contractor: "ABC Constructions" },
    { id: 2, name: "TMT Bars (12mm)", unit: "Ton", opening: 45, received: 10, used: 8, closing: 47, minLevel: 5, location: "Site", supplier: "Jindal Steel", bill: "INV-4530", worker: "Shyam Lal", contractor: "ABC Constructions" },
    { id: 3, name: "Coarse Sand", unit: "Cu.m", opening: 220, received: 0, used: 35, closing: 185, minLevel: 50, location: "Store", supplier: "Local Vendor", bill: "CHL-992", worker: "Mohan Das", contractor: "XYZ Infra" },
    { id: 4, name: "Bricks (Class A)", unit: "Nos", opening: 25000, received: 10000, used: 4500, closing: 30500, minLevel: 5000, location: "Site", supplier: "Brick Works", bill: "BW-442", worker: "Arjun K", contractor: "Local Force" },
];

const StockListPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedStock, setSelectedStock] = useState<any | null>(null);

    const filteredStock = stockData.filter(
        (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = () => {
        setIsDownloading(true);
        toast.loading("Compiling CSV Dataset...", { id: "download", position: "top-right" });

        setTimeout(() => {
            setIsDownloading(false);
            toast.success("Inventory analytics exported!", { id: "download", position: "top-right" });
        }, 1500);
    };

    return (
        <>
            <Navbar title="Material Stock Inventory" breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Material", "Stock"]} />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24  tracking-tighter">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Global Asset Ledger</h1>
                            <p className="text-slate-500 text-sm font-medium">Real-time resource quantification and shift-based attribution.</p>
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                        >
                            {isDownloading ? "PROCESSING..." : "EXPORT ANALYTICS"}
                        </button>
                    </div>
                    {/* Top Widgets */}
                    <div className="mb-12">
                        <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Inventory Vitals & Workforce Pulse
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCard title="Total Assets" value="124" sub="Tracked resources" accent="text-blue-600" />
                            <StatCard title="Critical Stock" value="08" sub="Below safety threshold" accent="text-rose-600" />
                            <StatCard title="Valuation" value="₹1.2Cr" sub="Total warehouse value" accent="text-green-600" />
                            <StatCard title="Active Workers" value="42" sub="Tracking material ops" accent="text-amber-500" />
                        </div>
                    </div>



                    {/* Navigation Tabs */}
                    <div className="flex gap-4 p-2 bg-slate-100/50 rounded-[32px] w-fit mb-12 border border-slate-200/50 backdrop-blur-xl ">
                        <Link to="/engineer/material/receipt" className="px-10 py-4 text-[10px] font-black tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-all  ">
                            Receipt Protocol
                        </Link>
                        <Link to="/engineer/material/consumption" className="px-10 py-4 text-[10px] font-black tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-all  ">
                            Depletion Entry
                        </Link>
                        <button className="px-10 py-4 bg-white text-[10px] font-black tracking-[0.2em] text-blue-600 shadow-2xl shadow-blue-500/10 rounded-[24px]   border border-blue-50">
                            Live Inventory
                        </button>
                    </div>

                    {/* Controls Section */}
                    <div className="mb-10">
                        <div className="relative group ">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                        {filteredStock.map((s) => (
                            <div
                                key={s.id}
                                className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden cursor-pointer"
                                onClick={() => setSelectedStock(s)}
                            >
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all ${s.closing <= s.minLevel ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]" : "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"}`} />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-blue-600 transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm px-2 text-center leading-tight uppercase font-black">
                                            STK-{s.id}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 block">Station: {s.location}</span>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-tight font-black">{s.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase tracking-widest">{s.worker}</p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border transition-all ${s.closing <= s.minLevel ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                        {s.closing <= s.minLevel ? 'CRITICAL' : 'STABLE'}
                                    </span>
                                </div>

                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 grid grid-cols-2 gap-8 uppercase">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block font-black">Live Inventory</span>
                                        <p className={`text-3xl font-black tracking-tighter italic ${s.closing <= s.minLevel ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>{s.closing.toLocaleString()} <span className="text-sm font-bold text-slate-400">{s.unit}</span></p>
                                        <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-widest underline underline-offset-4 decoration-amber-200">Min Level: {s.minLevel}</p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-8 font-black">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block font-black">Inbound Flow</span>
                                        <p className="text-xl font-black tracking-tight text-blue-600 italic font-black">+{s.received}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Protocol Sync</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-4 pt-2 border-t border-slate-50 mt-auto uppercase">
                                    <div className="flex flex-col font-black">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1 font-black">Custodian Force</span>
                                        <span className="text-sm font-black text-slate-700 tracking-tighter italic underline underline-offset-4 decoration-slate-200 font-black">{s.worker}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                            →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Modal
                        isOpen={!!selectedStock}
                        onClose={() => setSelectedStock(null)}
                        title="Material Resource Intelligence"
                        maxWidth="max-w-4xl"
                    >
                        {selectedStock && (
                            <div className="p-10 bg-white">
                                {/* Premium Banner */}
                                <div className="admin-pulse-details-banner">
                                    <div className="admin-pulse-details-icon-container bg-blue-600">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedStock.name}</h2>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-white tracking-tighter leading-none">{selectedStock.closing.toLocaleString()}</p>
                                                <span className="text-[10px] font-black text-blue-300 tracking-[0.2em] uppercase">{selectedStock.unit.toUpperCase()} AVAILABLE</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">{selectedStock.location} STORAGE STATION</h3>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] border ${selectedStock.closing <= selectedStock.minLevel ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-blue-600 text-white border-blue-400'}`}>
                                                {selectedStock.closing <= selectedStock.minLevel ? 'CRITICAL POLARITY' : 'STABLE LEVELS'}
                                            </span>
                                        </div>
                                        <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Asset Hash: STK-{selectedStock.id}-SYNC</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12">
                                    {/* Left Column: Intelligence Matrix */}
                                    <div className="space-y-10">
                                        <div>
                                            <div className="admin-pulse-details-section-header">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                <h3 className="admin-pulse-details-section-title">Inventory Intelligence Matrix</h3>
                                            </div>
                                            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 font-black uppercase">
                                                <div className="grid grid-cols-3 gap-6 text-center">
                                                    <div className="admin-pulse-details-group">
                                                        <span className="admin-pulse-details-label">Opening</span>
                                                        <p className="text-xl font-black text-slate-400 italic">{selectedStock.opening}</p>
                                                    </div>
                                                    <div className="admin-pulse-details-group">
                                                        <span className="admin-pulse-details-label text-emerald-600">Inbound</span>
                                                        <p className="text-2xl font-black text-emerald-600 italic">+{selectedStock.received}</p>
                                                    </div>
                                                    <div className="admin-pulse-details-group">
                                                        <span className="admin-pulse-details-label text-rose-500">Outbound</span>
                                                        <p className="text-2xl font-black text-rose-500 italic">-{selectedStock.used}</p>
                                                    </div>
                                                </div>
                                                <div className="h-px bg-slate-200 my-8" />
                                                <div className="flex items-center justify-between">
                                                    <div className="admin-pulse-details-group">
                                                        <span className="admin-pulse-details-label block mb-2">Health Threshold</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                                            <p className="text-xl font-black text-slate-800 tracking-tight italic">{selectedStock.minLevel} {selectedStock.unit.toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="admin-pulse-details-label block mb-2">Live Availability</span>
                                                        <p className="text-3xl font-black text-blue-600 tracking-tighter italic">{selectedStock.closing} {selectedStock.unit.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="admin-pulse-details-section-header">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                <h3 className="admin-pulse-details-section-title">Asset Ownership & Vendor</h3>
                                            </div>
                                            <div className="p-8 bg-blue-50/30 rounded-[32px] border border-blue-100 font-black uppercase">
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div className="admin-pulse-details-group">
                                                        <span className="admin-pulse-details-label">Acquisition Channel</span>
                                                        <p className="text-lg font-black text-slate-800 italic underline underline-offset-4 decoration-blue-200">{selectedStock.supplier}</p>
                                                    </div>
                                                    <div className="admin-pulse-details-group">
                                                        <span className="admin-pulse-details-label">Logistical Voucher</span>
                                                        <p className="text-lg font-black text-slate-800 italic">{selectedStock.bill}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Force Attribution */}
                                    <div className="space-y-10 font-black uppercase">
                                        <div>
                                            <div className="admin-pulse-details-section-header">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                <h3 className="admin-pulse-details-section-title">Force Attribution Pulse</h3>
                                            </div>
                                            <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 min-h-[300px] font-black uppercase shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
                                                <div className="space-y-8 relative z-10">
                                                    <div>
                                                        <span className="admin-pulse-details-label mb-2 block text-slate-400">Master Articulator</span>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-700 flex items-center justify-center text-sm font-black text-slate-900 shadow-xl">
                                                                {selectedStock.worker.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <p className="text-2xl font-black text-white tracking-tighter italic">{selectedStock.worker}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-8 border-t border-slate-800">
                                                        <span className="admin-pulse-details-label mb-2 block text-slate-400">Operational Contractor</span>
                                                        <p className="text-2xl font-black text-blue-400 tracking-tighter italic">{selectedStock.contractor}</p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                                                    <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">TELEMETRY ACTIVE: STATION {selectedStock.location.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between font-black uppercase">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-black">Lifecycle Integrity</span>
                                                <p className="text-2xl font-black text-slate-800 tracking-tighter italic font-black">ACTIVE ASSET</p>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedStock.closing <= selectedStock.minLevel ? 'bg-rose-600 shadow-rose-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">INVENTORY ANALYTICS VERIFIED BY INFRAPILOT CORE</span>
                                    <button onClick={() => setSelectedStock(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                        Deactivate View
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>
                </div>
            </PageTransition>
        </>
    );
};

export default StockListPage;
