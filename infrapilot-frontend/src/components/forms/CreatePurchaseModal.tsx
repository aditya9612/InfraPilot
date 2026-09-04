import React, { useState, useEffect } from "react";
import { X, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { equipmentService } from "../../services/equipmentService";
import { boqService } from "../../services/boqService";

interface CreatePurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    projectName: string;
    projects?: any[];
    onSuccess: () => void;
}

const CreatePurchaseModal: React.FC<CreatePurchaseModalProps> = ({
    isOpen,
    onClose,
    projectId,
    projectName,
    projects,
    onSuccess,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [assets, setAssets] = useState<any[]>([]);
    const [boqItems, setBoqItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        purchase_type: "NEW",
        asset_id: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        vendor_name: "",
        invoice_number: "",
        quantity: 1,
        unit_price: 0,
        warranty_end_date: "",
        notes: "",
        boq_item_id: 0,
        project_id: projectId || 0
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, project_id: projectId || 0, boq_item_id: 0 }));
            setFieldErrors({});

            // Load all available equipment recursively to bypass 100 limit
            const fetchAssets = async () => {
                let allEq: any[] = [];
                let offset = 0;
                while (true) {
                    const res = await equipmentService.listEquipment({ limit: 100, offset }).catch(() => ({ items: [] }));
                    const items = res.items || [];
                    allEq = allEq.concat(items);
                    if (items.length < 100) break;
                    offset += 100;
                }
                setAssets(allEq);
            };
            fetchAssets();
        }
    }, [isOpen, projectId]);

    useEffect(() => {
        if (isOpen) {
            if (formData.project_id && formData.project_id > 0) {
                boqService.getBoqsByProject(formData.project_id).then(res => setBoqItems(res || []));
            } else {
                setBoqItems([]);
            }
        }
    }, [isOpen, formData.project_id]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFieldErrors(prev => ({ ...prev, [name]: "" }));
        setFormData(prev => ({
            ...prev,
            [name]: ["asset_id", "quantity", "unit_price", "boq_item_id", "project_id"].includes(name) ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!formData.asset_id || formData.asset_id === 0) {
            newErrors.asset_id = "Please select an asset.";
            toast.error("Please select an asset.");
        }
        if (!formData.vendor_name || formData.vendor_name.length < 2) {
            newErrors.vendor_name = "Vendor name must be at least 2 characters.";
        }
        if (!formData.invoice_number || formData.invoice_number.length < 2) {
            newErrors.invoice_number = "Invoice number must be at least 2 characters.";
        }
        if (!formData.unit_price || formData.unit_price <= 0) {
            newErrors.unit_price = "Unit price must be greater than 0.";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await equipmentService.createPurchase({
                ...formData,
                project_id: formData.project_id && formData.project_id > 0 ? formData.project_id : 0,
                // send null when no BOQ item selected (0 fails BE validation)
                boq_item_id: formData.boq_item_id && formData.boq_item_id > 0 ? formData.boq_item_id : null,
                // send null when no warranty date
                warranty_end_date: formData.warranty_end_date || null,
            });
            toast.success("Purchase created successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            let errorMessage = "Failed to create purchase. Please try again.";
            const detail = error.response?.data?.detail;
            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (Array.isArray(detail)) {
                errorMessage = "Please fix the errors below.";
                const backendErrors: Record<string, string> = {};
                detail.forEach(d => {
                    const field = d.loc[d.loc.length - 1]; // get 'vendor_name' from loc array
                    backendErrors[field] = d.msg;
                });
                setFieldErrors(backendErrors);
            } else if (error.response?.data?.message) {
                errorMessage = error.response?.data?.message;
            }
            toast.error(errorMessage);
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
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Create Purchase
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Record a new equipment or material purchase
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

                    <form onSubmit={handleSubmit} className="p-8" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Purchase Type */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Purchase Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    name="purchase_type"
                                    value={formData.purchase_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all appearance-none"
                                >
                                    <option value="NEW">New</option>
                                    <option value="USED">Used</option>
                                    <option value="RENT">Rental</option>
                                    <option value="SPARE_PART">Spare Part</option>
                                </select>
                            </div>

                            {/* Asset ID */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Asset <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    name="asset_id"
                                    value={formData.asset_id}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none transition-all appearance-none ${fieldErrors.asset_id ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 focus:border-primary'}`}
                                >
                                    <option value={0}>Select Asset...</option>
                                    {assets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>{asset.equipment_name || asset.equipment_code}</option>
                                    ))}
                                </select>
                                {fieldErrors.asset_id && (
                                    <p className="text-rose-500 text-xs font-bold px-1 m-0 mt-1">{fieldErrors.asset_id}</p>
                                )}
                            </div>

                            {/* Purchase Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Purchase Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={formData.purchase_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

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
                                    minLength={2}
                                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none transition-all ${fieldErrors.vendor_name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 focus:border-primary'}`}
                                    placeholder="Enter vendor name"
                                />
                                {fieldErrors.vendor_name && (
                                    <p className="text-rose-500 text-xs font-bold px-1 m-0 mt-1">{fieldErrors.vendor_name}</p>
                                )}
                            </div>

                            {/* Invoice Number */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Invoice Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="invoice_number"
                                    value={formData.invoice_number}
                                    onChange={handleChange}
                                    required
                                    minLength={2}
                                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none transition-all ${fieldErrors.invoice_number ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 focus:border-primary'}`}
                                    placeholder="Enter invoice number"
                                />
                                {fieldErrors.invoice_number && (
                                    <p className="text-rose-500 text-xs font-bold px-1 m-0 mt-1">{fieldErrors.invoice_number}</p>
                                )}
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    min="1"
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
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none transition-all ${fieldErrors.unit_price ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 focus:border-primary'}`}
                                />
                                {fieldErrors.unit_price && (
                                    <p className="text-rose-500 text-xs font-bold px-1 m-0 mt-1">{fieldErrors.unit_price}</p>
                                )}
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

                            {/* Project Name (Dropdown or Read Only) */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Project Name
                                </label>
                                {projects && projects.length > 0 ? (
                                    <select
                                        name="project_id"
                                        value={formData.project_id}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all appearance-none"
                                    >
                                        <option value={0}>Global / Unassigned</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.project_name || p.name || `Project #${p.id}`}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={projectName}
                                        readOnly
                                        className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed"
                                    />
                                )}
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
                                className="flex-2 px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ShoppingCart className="w-4 h-4" />
                                )}
                                {isSubmitting ? "Creating..." : "Create Purchase"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePurchaseModal;
