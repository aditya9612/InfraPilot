import React from 'react';
import { X, FileText, Calendar, Tag, Package, Activity, Clock, FileDigit, IndianRupee } from "lucide-react";
import type { RentalItem } from '../../services/equipmentService';

interface ViewRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    rental: RentalItem | null;
    equipmentName: string;
    projectName: string;
}

const ViewRentalModal: React.FC<ViewRentalModalProps> = ({
    isOpen,
    onClose,
    rental,
    equipmentName,
    projectName
}) => {
    if (!isOpen || !rental) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="flex justify-center min-h-full p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-300 relative self-center my-8">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0 sm:rounded-t-[2rem]">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Rental Details
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    View information for Rental #{rental.id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Equipment */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Equipment</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{equipmentName}</p>
                                </div>

                                {/* Project */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{projectName}</p>
                                </div>

                                {/* Client Info */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client Name</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{rental.client_name || "N/A"}</p>
                                </div>

                                {/* Status */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${rental.status === 'COMPLETED' || rental.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {rental.status || (rental.is_completed ? 'COMPLETED' : 'ACTIVE')}
                                    </span>
                                </div>

                                {/* Start Date */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Date</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{rental.start_date}</p>
                                </div>

                                {/* End Date */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Date</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{rental.end_date}</p>
                                </div>

                                {/* Duration */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{rental.duration} Day(s)</p>
                                </div>

                                {/* Billing Reference */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileDigit className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice ID</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{rental.invoice_id ? `INV-${rental.invoice_id}` : 'None'}</p>
                                </div>

                                {/* Per Day Cost */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <IndianRupee className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Per Day Rate</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">₹{rental.per_day_cost}</p>
                                </div>

                                {/* Total Amount */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-emerald-500/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Rental Cost</p>
                                    </div>
                                    <p className="text-lg font-black text-emerald-600">
                                        ₹{rental.rental_cost}
                                    </p>
                                </div>
                            </div>

                            {/* Notes */}
                            {rental.notes && rental.notes !== 'null' && (
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes / Terms</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{rental.notes}</p>
                                </div>
                            )}

                            {/* Created At */}
                            <div className="text-right mt-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Record logged: {new Date(rental.created_at || '').toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewRentalModal;
