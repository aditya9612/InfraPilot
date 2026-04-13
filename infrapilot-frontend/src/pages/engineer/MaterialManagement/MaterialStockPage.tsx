import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialStock {
    id: number;
    materialName: string;
    unit: "Bag" | "Kg" | "Ton";
    openingStock: number;
    receivedQuantity: number;
    usedQuantity: number;
    closingStock: number;
    location: "Store" | "Site";
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
        closingStock: 1380,
        location: "Store",
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        openingStock: 15,
        receivedQuantity: 5,
        usedQuantity: 1.5,
        closingStock: 18.5,
        location: "Site",
    },
];

// ─── Profile Field Helper ──────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
    mono = false,
}: {
    label: string;
    value: string;
    accent?: string;
    mono?: boolean;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${mono ? "font-mono tracking-tight" : ""} ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const MaterialStockPage = () => {
    const [stockList] = useState<MaterialStock[]>(mockStock);
    const [selectedStock, setSelectedStock] = useState<MaterialStock | null>(null);

    return (
        <>
            <Navbar
                title="Material Stock"
                breadcrumb={["InfraPilot", "Engineer", "Material", "Stock"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="mb-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                        Inventory Registry
                    </p>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                        Current Stock Levels
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Live overview of opening stock, received, used, and closing balances.
                    </p>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {stockList.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                            {item.materialName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{item.materialName}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Closing Stock</p>
                                        <p className="text-xl font-black text-blue-600">{item.closingStock} {item.unit}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-6 gap-x-8 py-6 border-y border-slate-50">
                                    <ProfileField label="OPENING STOCK" value={`${item.openingStock} ${item.unit}`} />
                                    <ProfileField label="RECEIVED (+)" value={`${item.receivedQuantity} ${item.unit}`} accent="text-emerald-600" />
                                    <ProfileField label="USED (-)" value={`${item.usedQuantity} ${item.unit}`} accent="text-rose-600" />
                                    <ProfileField label="UNIT" value={item.unit} />
                                </div>

                                <button
                                    onClick={() => setSelectedStock(item)}
                                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                                >
                                    View Full Stock Metrics
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedStock}
                onClose={() => setSelectedStock(null)}
                title="Inventory Balance Details"
                maxWidth="max-w-4xl"
            >
                {selectedStock && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedStock.materialName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                                        {selectedStock.materialName}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg">
                                            <span className="text-xs font-black text-white tracking-wide">Closing Balance: {selectedStock.closingStock} {selectedStock.unit}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Balance Sheet</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="OPENING BALANCE" value={`${selectedStock.openingStock} ${selectedStock.unit}`} />
                                    <ProfileField label="TOTAL RECEIVED" value={`${selectedStock.receivedQuantity} ${selectedStock.unit}`} accent="text-emerald-600" />
                                    <ProfileField label="TOTAL CONSUMED" value={`${selectedStock.usedQuantity} ${selectedStock.unit}`} accent="text-rose-600" />
                                    <ProfileField label="CLOSING STOCK" value={`${selectedStock.closingStock} ${selectedStock.unit}`} accent="text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedStock(null)}
                                className="px-12 py-3 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Close Metrics
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialStockPage;
