import React from "react";
import type { PurchaseOrder } from "../../../types/material";
import { FileText, MapPin, Hash, CheckCircle, Package } from "lucide-react";

interface ViewPOModalProps {
    isOpen: boolean;
    po: PurchaseOrder | null;
    projectMap: Record<number, string>;
    onClose: () => void;
}

const ViewPOModal: React.FC<ViewPOModalProps> = ({ isOpen, po, projectMap, onClose }) => {
    if (!isOpen || !po) return null;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "COMPLETED": return { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" };
            case "PENDING": return { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" };
            case "CANCELLED": return { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" };
            default: return { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-500" };
        }
    };

    const statusConfig = getStatusConfig(po.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Purchase Order Details</h2>
                            <p className="text-sm font-bold text-slate-500 mt-0.5">PO-{po.id.toString().padStart(4, "0")}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${statusConfig.bg} ${statusConfig.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            {po.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Package className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Material</span>
                            </div>
                            <p className="font-bold text-slate-800">{po.material_name}</p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Project Site</span>
                            </div>
                            <p className="font-bold text-slate-800">
                                {projectMap[po.project_id] || "Unknown Site"}
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Order Summary</h3>
                        </div>
                        <div className="p-4 bg-white space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-500">Unit Price</span>
                                <span className="font-bold text-slate-700">₹{po.rate.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-500">Quantity Ordered</span>
                                <span className="font-bold text-slate-700">{po.quantity} Units</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                <span className="font-black text-slate-800">Total Valuation</span>
                                <span className="text-lg font-black text-primary">₹{po.total_amount.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewPOModal;
