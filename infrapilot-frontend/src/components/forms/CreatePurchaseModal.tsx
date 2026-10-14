import React, { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { CustomSelect } from "../common/CustomDropdown";
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
        purchase_type: "",
        asset_id: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        vendor_name: "",
        invoice_number: "",
        quantity: "" as any,
        unit_price: "" as any,
        warranty_end_date: "",
        notes: "",
        boq_item_id: 0,
        project_id: 0
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: "" }));
        setFormData(prev => ({
            ...prev,
            [name]: ["asset_id", "boq_item_id", "project_id"].includes(name) ? Number(value) : value
        } as any));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!formData.purchase_type) {
            newErrors.purchase_type = "Please select a purchase type.";
        }
        if (!formData.asset_id || formData.asset_id === 0) {
            newErrors.asset_id = "Please select an asset.";
            toast.error("Please fill required fields.");
        }
        if (!formData.vendor_name || formData.vendor_name.length < 2) {
            newErrors.vendor_name = "Vendor name must be at least 2 characters.";
        }
        if (!formData.invoice_number || formData.invoice_number.trim().length < 2) {
            newErrors.invoice_number = "Invoice number is required and must be at least 2 characters.";
        }
        if (!formData.unit_price || Number(formData.unit_price) <= 0) {
            newErrors.unit_price = "Unit price must be greater than 0.";
        }
        if (!formData.quantity || Number(formData.quantity) <= 0) {
            newErrors.quantity = "Quantity must be greater than 0.";
        }
        if (!formData.purchase_date) {
            newErrors.purchase_date = "Purchase date is required.";
        }
        if (!formData.warranty_end_date) {
            newErrors.warranty_end_date = "Warranty end date is required.";
        }
        if (!formData.project_id || formData.project_id === 0) {
            newErrors.project_id = "Project selection is required.";
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
                boq_item_id: formData.boq_item_id && formData.boq_item_id > 0 ? formData.boq_item_id : null,
                warranty_end_date: formData.warranty_end_date || undefined,
                quantity: formData.quantity ? Number(formData.quantity) : 0,
                unit_price: formData.unit_price ? Number(formData.unit_price) : 0,
                total_amount: (formData.quantity ? Number(formData.quantity) : 0) * (formData.unit_price ? Number(formData.unit_price) : 0),
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
                    const field = d.loc[d.loc.length - 1];
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

    const modalFooter = (
        <div className="flex items-center justify-end gap-3 w-full">
            <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                form="create-purchase-form"
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
                {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <ShoppingCart className="w-4 h-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Purchase"}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Purchase"
            footer={modalFooter}
            maxWidth="max-w-3xl"
        >
            <form id="create-purchase-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Purchase Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Purchase Type <span className="text-rose-500">*</span>
                        </label>
                        <CustomSelect
                            value={formData.purchase_type}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, purchase_type: val }));
                                if (fieldErrors.purchase_type) setFieldErrors(prev => ({ ...prev, purchase_type: "" }));
                            }}
                            options={[
                                { id: "", label: "Select Type..." },
                                { id: "NEW", label: "New" },
                                { id: "USED", label: "Used" },
                                { id: "RENT", label: "Rental" },
                                { id: "SPARE_PART", label: "Spare Part" }
                            ]}
                            placeholder="Select Type..."
                            maxHeight="max-h-52"
                            error={!!fieldErrors.purchase_type}
                        />
                        {fieldErrors.purchase_type && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.purchase_type}</p>
                        )}
                    </div>

                    {/* Asset */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Asset <span className="text-rose-500">*</span>
                        </label>
                        <CustomSelect
                            value={formData.asset_id || 0}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, asset_id: Number(val) }));
                                if (fieldErrors.asset_id) setFieldErrors(prev => ({ ...prev, asset_id: "" }));
                            }}
                            options={[
                                { id: 0, label: "Select Asset..." },
                                ...assets.map((asset) => ({
                                    id: asset.id,
                                    label: asset.equipment_name || asset.equipment_code || `Asset #${asset.id}`
                                }))
                            ]}
                            placeholder="Select Asset..."
                            searchable={assets.length > 5}
                            maxHeight="max-h-52"
                            error={!!fieldErrors.asset_id}
                        />
                        {fieldErrors.asset_id && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.asset_id}</p>
                        )}
                    </div>

                    {/* Purchase Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Purchase Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${fieldErrors.purchase_date ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                        />
                        {fieldErrors.purchase_date && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.purchase_date}</p>
                        )}
                    </div>

                    {/* Vendor Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Vendor Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="vendor_name"
                            value={formData.vendor_name}
                            onChange={handleChange}
                            required
                            minLength={2}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${fieldErrors.vendor_name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                            placeholder="Enter vendor name"
                        />
                        {fieldErrors.vendor_name && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.vendor_name}</p>
                        )}
                    </div>

                    {/* Invoice Number */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Invoice Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="invoice_number"
                            value={formData.invoice_number}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${fieldErrors.invoice_number ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                            placeholder="Enter invoice number"
                        />
                        {fieldErrors.invoice_number && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.invoice_number}</p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="1"
                            required
                            placeholder="Enter quantity"
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${fieldErrors.quantity ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                        />
                        {fieldErrors.quantity && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.quantity}</p>
                        )}
                    </div>

                    {/* Unit Price */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
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
                            placeholder="Enter unit price"
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${fieldErrors.unit_price ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                        />
                        {fieldErrors.unit_price && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.unit_price}</p>
                        )}
                    </div>

                    {/* Warranty End Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Warranty End Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="warranty_end_date"
                            value={formData.warranty_end_date}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${fieldErrors.warranty_end_date ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                        />
                        {fieldErrors.warranty_end_date && (
                            <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.warranty_end_date}</p>
                        )}
                    </div>

                    {/* Project Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Project Name <span className="text-rose-500">*</span>
                        </label>
                        {projects && projects.length > 0 ? (
                            <>
                                <CustomSelect
                                    value={formData.project_id || 0}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, project_id: Number(val) }));
                                        if (fieldErrors.project_id) setFieldErrors(prev => ({ ...prev, project_id: "" }));
                                    }}
                                    options={[
                                        { id: 0, label: "Select Project..." },
                                        ...projects.map((p) => ({
                                            id: p.id,
                                            label: p.project_name || p.name || `Project #${p.id}`
                                        }))
                                    ]}
                                    placeholder="Select Project..."
                                    searchable={projects.length > 5}
                                    maxHeight="max-h-52"
                                    error={!!fieldErrors.project_id}
                                />
                                {fieldErrors.project_id && (
                                    <p className="text-rose-500 text-[10px] font-bold ml-1 mt-1">{fieldErrors.project_id}</p>
                                )}
                            </>
                        ) : (
                            <input
                                type="text"
                                value={projectName}
                                readOnly
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                            />
                        )}
                    </div>

                    {/* BOQ Item ID */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            BOQ Item (Optional)
                        </label>
                        <CustomSelect
                            value={formData.boq_item_id || 0}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, boq_item_id: Number(val) }));
                            }}
                            options={[
                                { id: 0, label: "None" },
                                ...boqItems.map((boq) => ({
                                    id: boq.id,
                                    label: boq.item_name || `Item #${boq.id}`
                                }))
                            ]}
                            placeholder={!formData.project_id ? "Select a project first" : "None"}
                            searchable={boqItems.length > 5}
                            disabled={!formData.project_id || boqItems.length === 0}
                            maxHeight="max-h-52"
                        />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            placeholder="Enter any additional notes..."
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreatePurchaseModal;
