import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const stockLevels = [
    {
        id: "STK-1001",
        material_name: "OPC 43 Grade Cement",
        unit: "Bag",
        opening_stock: 450,
        received_quantity: 500,
        used_quantity: 120,
        closing_stock: 830,
        supplier_name: "UltraTech Cement Ltd",
        bill_number: "Multiple",
        location: "Main Store",
        status: "Healthy",
        min_stock: 200,
        last_updated: "2026-04-12",
    },
    {
        id: "STK-1002",
        material_name: "TMT Steel 16mm",
        unit: "Ton",
        opening_stock: 20.5,
        received_quantity: 8.0,
        used_quantity: 4.5,
        closing_stock: 24.0,
        supplier_name: "Tata Tiscon",
        bill_number: "TT/ST-991",
        location: "Material Yard B",
        status: "Restock Advised",
        min_stock: 25.0,
        last_updated: "2026-04-12",
    },
    {
        id: "STK-1003",
        material_name: "Coarse Sand",
        unit: "Cum",
        opening_stock: 120,
        received_quantity: 200,
        used_quantity: 45,
        closing_stock: 275,
        supplier_name: "Local Vendor Aggregate",
        bill_number: "GR-4451",
        location: "North Bunkers",
        status: "Healthy",
        min_stock: 50,
        last_updated: "2026-04-11",
    },
];

const StockListPage = () => {
    const [selectedStock, setSelectedStock] = useState<any>(null);


    return (
        <>
            <Navbar
                title="Inventory Intelligence Hub"
                breadcrumb={["InfraPilot", "Materials", "Stock Real-time"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
                            Stock Dossier & Vitals
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Real-time synchronization of material assets, depletion tracking, and reorder intelligence.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => toast.error("Stock Audit only available from Admin Panel")}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-xs tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center gap-2 uppercase"
                        >
                            Request Stock Audit
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-8 flex items-center gap-2 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        Real-time Inventory Delta
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard
                            title="Total SKU Active"
                            value="42"
                            sub="Resources tracked"
                            accent="text-slate-900"
                        />
                        <StatCard
                            title="Critical Reorder"
                            value="03"
                            sub="Below threshold"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Inventory Value"
                            value="₹ 1.2M"
                            sub="Estimated"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Audit Index"
                            value="98%"
                            sub="Health Score"
                            accent="text-blue-600"
                        />
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] flex items-center gap-2 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inventory Dossier View
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {stockLevels.map((stock) => (
                            <div
                                key={stock.id}
                                className="group relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer overflow-hidden border-b-4 border-b-transparent hover:border-b-blue-600"
                                onClick={() => setSelectedStock(stock)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest mb-1 uppercase">
                                            Stock Record ID: {stock.id}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-800">
                                            As of {stock.last_updated}
                                        </span>
                                    </div>
                                    <span
                                        className={`px-4 py-1.5 text-[9px] font-black tracking-widest rounded-xl border transition-all ${stock.status === "Healthy"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5 px-4"
                                            : "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5 px-4"
                                            }`}
                                    >
                                        {stock.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-[1.1]">
                                        {stock.material_name}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Location: {stock.location}
                                    </p>
                                </div>

                                <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">
                                                Current Quantum
                                            </span>
                                            <div className="flex items-baseline gap-2 leading-none">
                                                <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                                                    {stock.closing_stock}
                                                </span>
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    {stock.unit}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Safety Min
                                            </span>
                                            <span className="text-sm font-black text-slate-800">
                                                {stock.min_stock} {stock.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 px-1">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">
                                            Opening (Base)
                                        </span>
                                        <span className="text-xs font-bold text-slate-600">
                                            {stock.opening_stock} {stock.unit}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">
                                            Inflow Total
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600 font-black">
                                            + {stock.received_quantity}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase text-rose-400">
                                            Utilized Total
                                        </span>
                                        <span className="text-xs font-bold text-rose-600 font-black">
                                            - {stock.used_quantity}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">
                                            Main Supplier
                                        </span>
                                        <span className="text-xs font-bold text-slate-600 uppercase truncate">
                                            {stock.supplier_name.split(" ")[0]}...
                                        </span>
                                    </div>
                                </div>

                                <div className="absolute right-8 bottom-8 w-12 h-12 rounded-[20px] bg-slate-900 flex items-center justify-center text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl shadow-slate-200">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2.5"
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            <Modal
                isOpen={!!selectedStock}
                onClose={() => setSelectedStock(null)}
                title="Inventory Asset Intelligence"
                maxWidth="max-w-4xl"
            >
                {selectedStock && (
                    <div className="p-10 bg-white">
                        <div className="admin-pulse-details-banner !bg-slate-900">
                            <div className="admin-pulse-details-icon-container">📊</div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none text-white">
                                        {selectedStock.material_name.toUpperCase()}
                                    </h2>
                                    <span className="admin-pulse-status-badge bg-white/20 text-white border border-white/30 backdrop-blur-md">
                                        {selectedStock.status}
                                    </span>
                                </div>
                                <p className="text-slate-100/80 text-sm font-bold tracking-tight mb-1">
                                    Location: {selectedStock.location}
                                </p>
                                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Asset ID: {selectedStock.id} | Unit: {selectedStock.unit}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title uppercase">
                                            Current Holding
                                        </h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-[32px] p-10 border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                            Net Available Quantum
                                        </span>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-6xl font-black text-slate-900 tracking-tighter">
                                                {selectedStock.closing_stock}
                                            </span>
                                            <span className="text-lg font-black text-slate-400 uppercase tracking-widest">
                                                {selectedStock.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title uppercase">
                                            Supplier & Reference
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase">
                                                Primary Supplier
                                            </span>
                                            <p className="admin-pulse-details-value uppercase">
                                                {selectedStock.supplier_name}
                                            </p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase">
                                                Invoice / Bill Ref
                                            </span>
                                            <p className="admin-pulse-details-value uppercase text-blue-600">
                                                {selectedStock.bill_number}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title uppercase">
                                            Inventory Reconciliation
                                        </h3>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { label: "Opening (Base Line)", value: selectedStock.opening_stock, color: "text-slate-600" },
                                            { label: "Inbound (Total Flow)", value: `+ ${selectedStock.received_quantity}`, color: "text-emerald-600" },
                                            { label: "Outbound (Operational)", value: `- ${selectedStock.used_quantity}`, color: "text-rose-600" },
                                            { label: "Safety Min Guard", value: selectedStock.min_stock, color: "text-amber-600" },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {item.label}
                                                </span>
                                                <span className={`text-sm font-black ${item.color}`}>
                                                    {item.value} {selectedStock.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50/30 rounded-[32px] border border-blue-100/50">
                                    <span className="admin-pulse-details-label text-blue-600 mb-4 uppercase">
                                        Resource Status Analysis
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${selectedStock.status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <p className="text-xs font-bold text-slate-700">
                                            Inventory levels are currently <span className={selectedStock.status === 'Healthy' ? 'text-emerald-600' : 'text-rose-600'}>{selectedStock.status.toLowerCase()}</span> based on site consumption metrics.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                                STOCK MASTER LOG REF: {selectedStock.id}-2026
                            </span>
                            <button
                                onClick={() => setSelectedStock(null)}
                                className="bg-slate-900 text-white px-12 py-5 rounded-2xl text-[11px] font-black tracking-widest hover:bg-black transition-all uppercase"
                            >
                                Close Stock Analysis
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default StockListPage;
