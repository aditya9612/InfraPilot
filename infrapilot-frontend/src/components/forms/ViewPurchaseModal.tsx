import React, { useState, useEffect } from "react";
import { X, FileText, Calendar, Tag, DollarSign, Package, AlertCircle } from "lucide-react";
import { equipmentService } from "../../services/equipmentService";
import toast from "react-hot-toast";

interface ViewPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseId: number | null;
    projectName: string;
}

const ViewPurchaseModal: React.FC<ViewPurchaseModalProps> = ({
    isOpen,
    onClose,
    purchaseId,
    projectName,
}) => {
    const [purchase, setPurchase] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [boqName, setBoqName] = useState<string>("None");

    useEffect(() => {
        if (isOpen && purchaseId) {
            fetchPurchase();
        } else {
            setPurchase(null);
            setBoqName("None");
        }
    }, [isOpen, purchaseId]);

    const fetchPurchase = async () => {
        setIsLoading(true);
        try {
            const data = await equipmentService.getPurchase(purchaseId!);
            setPurchase(data);
            
            // Fetch BOQ Name if boq_item_id exists
            if (data.project_id && data.boq_item_id) {
                const { boqService } = await import("../../services/boqService");
                const boqs = await boqService.getBoqsByProject(data.project_id);
                const item = boqs.find(b => b.id === data.boq_item_id);
                if (item) setBoqName(item.item_name);
            }
        } catch (error) {
            console.error("Failed to fetch purchase details:", error);
            toast.error("Could not load purchase details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="flex justify-center min-h-full p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-300 relative self-center my-8">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Purchase Details
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    View information for Purchase #{purchaseId}
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

                    <div className="p-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : !purchase ? (
                            <div className="text-center py-12 text-slate-500">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>No details found.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Asset Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.asset_name || `Asset #${purchase.asset_id}`}</p>
                                    </div>

                                    {/* Purchase Type */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purchase Type</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.purchase_type}</p>
                                    </div>

                                    {/* Vendor Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vendor Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.vendor_name || "N/A"}</p>
                                    </div>

                                    {/* Invoice Number */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Number</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.invoice_number || "N/A"}</p>
                                    </div>

                                    {/* Purchase Date */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purchase Date</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.purchase_date}</p>
                                    </div>

                                    {/* Warranty End Date */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Warranty End Date</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.warranty_end_date || "N/A"}</p>
                                    </div>
                                    
                                    {/* Quantity & Unit Price */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qty & Unit Price</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{purchase.quantity} × ₹{purchase.unit_price}</p>
                                    </div>

                                    {/* Total Amount */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-primary/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Total Amount</p>
                                        </div>
                                        <p className="text-lg font-black text-primary">₹{purchase.total_amount?.toLocaleString() || (purchase.quantity * purchase.unit_price).toLocaleString()}</p>
                                    </div>

                                    {/* Created At */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Created At</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {purchase.created_at ? new Date(purchase.created_at).toLocaleString() : "N/A"}
                                        </p>
                                    </div>

                                    {/* Project Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{projectName}</p>
                                    </div>

                                    {/* BOQ Item Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">BOQ Item Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{boqName}</p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {purchase.notes && (
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</p>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{purchase.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPurchaseModal;
