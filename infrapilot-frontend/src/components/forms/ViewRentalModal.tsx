import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Tag, Package, Activity, Clock, FileDigit, IndianRupee } from "lucide-react";
import type { RentalItem } from '../../services/equipmentService';
import { equipmentService } from '../../services/equipmentService';

interface ViewRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    rentalId: number | null;
    rentalItem?: RentalItem | null;
    equipmentName: string;
    projectName: string;
}

const ViewRentalModal: React.FC<ViewRentalModalProps> = ({
    isOpen,
    onClose,
    rentalId,
    rentalItem,
    equipmentName,
    projectName
}) => {
    const [rental, setRental] = useState<RentalItem | null>(rentalItem || null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Immediately use passed rentalItem to prevent blank UI or glitching
        if (rentalItem) {
            setRental(rentalItem);
        }

        if (rentalId) {
            let isMounted = true;
            if (!rentalItem) {
                setIsLoading(true);
            }
            equipmentService.getRental(rentalId)
                .then((data) => {
                    if (isMounted && data) {
                        setRental(data);
                    }
                })
                .catch((error) => {
                    console.error("Failed to fetch rental details", error);
                })
                .finally(() => {
                    if (isMounted) setIsLoading(false);
                });

            return () => { isMounted = false; };
        }
    }, [isOpen, rentalId, rentalItem]);

    if (!isOpen) return null;

    const displayRental = rental || rentalItem;

    return (
        <div
            className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="flex justify-center min-h-full p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-300 relative self-center my-8">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0 sm:rounded-t-[2rem]">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Rental Details
                                </h3>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {isLoading && !displayRental ? (
                            <div className="p-12 flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm font-semibold text-slate-500">Loading rental details...</p>
                            </div>
                        ) : !displayRental ? (
                            <div className="p-8 text-center text-slate-500 font-medium">
                                Rental record details could not be found.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Equipment */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Equipment</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{equipmentName || (displayRental as any).equipment_name || `Equipment #${displayRental.equipment_id}`}</p>
                                    </div>

                                    {/* Project */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{projectName || `Project #${displayRental.project_id || 'N/A'}`}</p>
                                    </div>

                                    {/* Client Info */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.client_name || "N/A"}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${displayRental.status === 'COMPLETED' || displayRental.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {displayRental.status || (displayRental.is_completed ? 'COMPLETED' : 'ACTIVE')}
                                        </span>
                                    </div>

                                    {/* Start Date */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Date</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.start_date || "—"}</p>
                                    </div>

                                    {/* End Date */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Date</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.end_date || "—"}</p>
                                    </div>

                                    {/* Duration */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.duration ? `${displayRental.duration} ${displayRental.duration === 1 ? 'Day' : 'Days'}` : "—"}</p>
                                    </div>

                                    {/* Billing Reference */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileDigit className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice ID</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.invoice_id ? `INV-${displayRental.invoice_id}` : 'None'}</p>
                                    </div>

                                    {/* Per Day Cost */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Per Day Rate</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">₹{(Number(displayRental.per_day_cost) || 0).toLocaleString()}</p>
                                    </div>

                                    {/* Total Amount */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-emerald-500/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="w-4 h-4 text-emerald-600" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Rental Cost</p>
                                        </div>
                                        <p className="text-lg font-black text-emerald-600">
                                            ₹{(Number(displayRental.rental_cost) || 0).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* BOQ Item ID */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileDigit className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">BOQ Item ID</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.boq_item_id || 'None'}</p>
                                    </div>

                                    {/* Client ID */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client ID</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{displayRental.client_id || 'None'}</p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {displayRental.notes && displayRental.notes !== 'null' && (
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes / Terms</p>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{displayRental.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end rounded-b-[2rem]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2 tracking-wide"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewRentalModal;
