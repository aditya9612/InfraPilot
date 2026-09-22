import React from "react";
import type { Supplier } from "../../../types/material";

interface ViewSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
}

const ViewSupplierModal: React.FC<ViewSupplierModalProps> = ({ isOpen, onClose, supplier }) => {
    if (!isOpen || !supplier) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col font-inter animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Supplier Details</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Supplier Name</p>
                            <h3 className="text-xl font-bold text-slate-800 mt-1">{supplier.name}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 font-black text-slate-400 text-xl">
                            {supplier.name.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Person</p>
                            <p className="font-bold text-slate-700">{supplier.contactPerson || "N/A"}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GST Number</p>
                            <p className="font-bold text-slate-700 uppercase">{supplier.gst || "N/A"}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                            <p className="font-semibold text-slate-700">{supplier.phone || supplier.contact?.match(/\d{10}/)?.[0] || (supplier.contact?.includes("@") ? "N/A" : supplier.contact) || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                            <p className="font-semibold text-slate-700">{supplier.email || supplier.contact?.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing Address</p>
                            <p className="font-semibold text-slate-700 whitespace-pre-wrap">{supplier.address || "N/A"}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewSupplierModal;
