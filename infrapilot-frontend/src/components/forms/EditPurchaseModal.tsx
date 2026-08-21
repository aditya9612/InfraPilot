import React, { useState, useEffect } from "react";
import { X, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { equipmentService } from "../../services/equipmentService";
import { boqService } from "../../services/boqService";

interface EditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseId: number | null;
    projectId: number;
    projectName: string;
    onSuccess: () => void;
}

const EditPurchaseModal: React.FC<EditPurchaseModalProps> = ({
    isOpen,
    onClose,
    purchaseId,
    projectId,
    projectName,
    onSuccess,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [boqItems, setBoqItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        vendor_name: "",
        invoice_number: "",
        quantity: 1,
        unit_price: 0,
        warranty_end_date: "",
        notes: "",
        boq_item_id: 0,
    });

    useEffect(() => {
        if (isOpen && purchaseId && projectId) {
            boqService.getBoqsByProject(projectId).then(res => setBoqItems(res || []));
            fetchPurchaseDetails();
        }
    }, [isOpen, purchaseId, projectId]);

    const fetchPurchaseDetails = async () => {
        setIsLoading(true);
        try {
            const data = await equipmentService.getPurchase(purchaseId!);
            setFormData({
                vendor_name: data.vendor_name || "",
                invoice_number: data.invoice_number || "",
                quantity: data.quantity || 1,
                unit_price: data.unit_price || 0,
                warranty_end_date: data.warranty_end_date || "",
                notes: data.notes || "",
                boq_item_id: data.boq_item_id || 0,
            });
        } catch (error) {
            console.error("Failed to load purchase:", error);
            toast.error("Could not load purchase details.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ["quantity", "unit_price", "boq_item_id"].includes(name) ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await equipmentService.updatePurchase(purchaseId!, {
                ...formData,
                project_id: projectId,
                boq_item_id: formData.boq_item_id && formData.boq_item_id > 0 ? formData.boq_item_id : null,
                warranty_end_date: formData.warranty_end_date || null,
            });
            toast.success("Purchase updated successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to update purchase. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="flex justify-center min-h-full p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl border border-slate-100 animate-in zoom-in-95 duration-300 relative self-center my-8">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <Edit2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Edit Purchase
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Update information for Purchase #{purchaseId}
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

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vendor Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Vendor Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="vendor_name"
                                        value={formData.vendor_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                        placeholder="Enter vendor name"
                                    />
                                </div>

                                {/* Invoice Number */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        name="invoice_number"
                                        value={formData.invoice_number}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                        placeholder="Enter invoice number"
                                    />
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Quantity <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Unit Price */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Unit Price <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Warranty End Date */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Warranty End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="warranty_end_date"
                                        value={formData.warranty_end_date}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Notes */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                        placeholder="Enter any additional notes..."
                                    />
                                </div>

                                {/* Project Name (Read Only) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Project Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        readOnly
                                        className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* BOQ Item ID */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        BOQ Item
                                    </label>
                                    <select
                                        name="boq_item_id"
                                        value={formData.boq_item_id}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all appearance-none"
                                    >
                                        <option value={0}>None</option>
                                        {boqItems.map((boq) => (
                                            <option key={boq.id} value={boq.id}>{boq.item_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-8 mt-4 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-2 px-8 py-3 bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Edit2 className="w-4 h-4" />
                                    )}
                                    {isSubmitting ? "Updating..." : "Update Purchase"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditPurchaseModal;
