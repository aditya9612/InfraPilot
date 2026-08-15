import React from "react";
import Modal from "../../common/Modal";
import type { Transfer } from "../../../types/material";
import { ArrowRight, Box, Truck, User } from "lucide-react";

interface ViewTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    transfer: Transfer | null;
}

const ViewTransferModal: React.FC<ViewTransferModalProps> = ({
    isOpen,
    onClose,
    transfer,
}) => {
    if (!transfer) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED": return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>;
            case "PENDING": return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>;
            case "CANCELLED": return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider">Cancelled</span>;
            default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Transfer Details"
            maxWidth="max-w-xl"
        >
            <div className="p-6 font-inter">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            TR-{transfer.id.toString().padStart(4, '0')}
                        </h2>
                    </div>
                    <div>
                        {getStatusBadge(transfer.status)}
                    </div>
                </div>

                {/* Route Information */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Transfer Route
                    </h3>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source</p>
                            <p className="font-bold text-slate-700">{transfer.from_project.name}</p>
                        </div>

                        <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                            <ArrowRight className="w-5 h-5" />
                        </div>

                        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                            <p className="font-bold text-slate-700">{transfer.to_project.name}</p>
                        </div>
                    </div>
                </div>

                {/* Item Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <Box className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
                            <p className="text-sm font-bold text-slate-800">{transfer.material.name}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Code: {transfer.material.code}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                            <p className="text-sm font-bold text-slate-800">{transfer.quantity} units</p>
                        </div>
                    </div>
                </div>

                {/* Requested By - (Using generic label since api might not return initiator explicitly in this mock) */}
                <div className="mt-4 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transfer ID Reference</p>
                        <p className="text-sm font-bold text-slate-800">Transfer Request #{transfer.id}</p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default ViewTransferModal;
