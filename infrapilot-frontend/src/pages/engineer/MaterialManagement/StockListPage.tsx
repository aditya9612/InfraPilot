import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const stockData = [
    { id: 1, name: "Cement (OPC 53)", unit: "Bag", opening: 1200, received: 500, used: 150, closing: 1550, minLevel: 200, location: "Main Store" },
    { id: 2, name: "TMT Bars (12mm)", unit: "Ton", opening: 45, received: 10, used: 8, closing: 47, minLevel: 5, location: "Site Shed" },
    { id: 3, name: "Coarse Sand", unit: "Cu.m", opening: 220, received: 0, used: 35, closing: 185, minLevel: 50, location: "Main Store" },
    { id: 4, name: "Bricks (Class A)", unit: "Nos", opening: 25000, received: 10000, used: 4500, closing: 30500, minLevel: 5000, location: "On-Site" },
];

const StockListPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);

    const filteredStock = stockData.filter(
        (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = () => {
        setIsDownloading(true);
        toast.loading("Preparing CSV file...", { id: "download", position: "top-right" });

        // Simulate file generation delay
        setTimeout(() => {
            setIsDownloading(false);
            toast.success("Inventory report downloaded successfully!", { id: "download", position: "top-right" });

            // Simulating a CSV download trigger
            const data = filteredStock.map(s => `${s.name},${s.unit},${s.location},${s.opening},${s.received},${s.used},${s.closing}`).join("\n");
            console.log("CSV Data generated:", data);
        }, 1500);
    };

    return (
        <>
            <Navbar title="Material Stock Inventory" breadcrumb={["Engineer", "Material", "Stock"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Management</h1>
                            <p className="text-slate-500 text-sm">Real-time stock levels and warehouse inventory.</p>
                        </div>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <Link to="/engineer/material/receipt" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Material Receipt
                        </Link>
                        <Link to="/engineer/material/consumption" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Material Consumption
                        </Link>
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Current Stock
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between mb-8 items-stretch md:items-center">
                        <div className="relative w-full md:w-80">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search materials or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm w-full md:w-auto ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 active:scale-95'}`}
                        >
                            <svg className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {isDownloading ? "Downloading..." : "Download Inventory"}
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-8 py-5">Material Detail</th>
                                        <th className="px-6 py-5">Opening</th>
                                        <th className="px-6 py-5 text-emerald-600">Received (+)</th>
                                        <th className="px-6 py-5 text-rose-500">Consumed (-)</th>
                                        <th className="px-6 py-5">Closing Stock</th>
                                        <th className="px-8 py-5 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStock.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div>
                                                    <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{s.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter">Unit: {s.unit}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                            <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                                            {s.location}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-slate-600">{s.opening.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">+{s.received.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-lg">-{s.used.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-end gap-1">
                                                    <span className="text-xl font-black text-slate-900 tracking-tight">{s.closing.toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">{s.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${s.closing <= s.minLevel ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-500 text-white shadow-emerald-200'
                                                    }`}>
                                                    {s.closing <= s.minLevel ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default StockListPage;
