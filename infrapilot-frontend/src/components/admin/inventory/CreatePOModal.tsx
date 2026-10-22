import React, { useState, useMemo, useEffect, useRef } from "react";
import type { Material, Supplier, POCreate } from "../../../types/material";
import { boqService } from "../../../services/boqService";
import { ChevronDown, Check, Search } from "lucide-react";

interface CreatePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: POCreate) => Promise<void>;
    suppliers: Supplier[];
    projects: any[];
    inventory: Material[];
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    suppliers,
    projects,
    inventory,
}) => {
    const initialFormData: POCreate = {
        supplier_id: 0,
        project_id: 0,
        material_id: 0,
        boq_item_id: 0,
        quantity: 0,
        rate: 0,
    };
    const [formData, setFormData] = useState<POCreate>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [boqItems, setBoqItems] = useState<any[]>([]);
    const [loadingBoqs, setLoadingBoqs] = useState(false);
    const [isBoqDropdownOpen, setIsBoqDropdownOpen] = useState(false);
    const [boqSearch, setBoqSearch] = useState("");
    const boqDropdownRef = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        setFormData(initialFormData);
        setIsBoqDropdownOpen(false);
        setBoqSearch("");
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setIsBoqDropdownOpen(false);
            setBoqSearch("");
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (boqDropdownRef.current && !boqDropdownRef.current.contains(e.target as Node)) {
                setIsBoqDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch BOQ items dynamically when a project is selected
    useEffect(() => {
        if (formData.project_id) {
            let active = true;
            const fetchBoqs = async () => {
                setLoadingBoqs(true);
                try {
                    const items = await boqService.getBoqItems(formData.project_id);
                    if (active) setBoqItems(items);
                } catch (error) {
                    console.error("Failed to fetch BOQ items", error);
                } finally {
                    if (active) setLoadingBoqs(false);
                }
            };
            fetchBoqs();
            return () => { active = false; };
        } else {
            setBoqItems([]);
        }
    }, [formData.project_id]);

    // Present supplier materials for explicit procurement mapping
    const filteredMaterials = useMemo(() => {
        return inventory.filter(m =>
            m.project_id === formData.project_id &&
            (formData.supplier_id === 0 || m.supplier_id === formData.supplier_id)
        );
    }, [inventory, formData.project_id, formData.supplier_id]);

    // Reset material if it's no longer in the filtered list
    useEffect(() => {
        if (formData.material_id !== 0) {
            const isValid = filteredMaterials.some((m: any) => m.id === formData.material_id || m.material_id === formData.material_id);
            if (!isValid) {
                setFormData(prev => ({ ...prev, material_id: 0, rate: 0 }));
            }
        }
    }, [filteredMaterials]);

    const filteredBoqItems = useMemo(() => {
        if (!boqSearch.trim()) return boqItems;
        const q = boqSearch.toLowerCase();
        return boqItems.filter(b => (b.item_name || b.name || "").toLowerCase().includes(q));
    }, [boqItems, boqSearch]);

    const selectedBoqLabel = useMemo(() => {
        if (!formData.project_id) return "Select Project First";
        if (loadingBoqs) return "Loading BOQ items...";
        if (!formData.boq_item_id) return "None";
        const b = boqItems.find(item => item.id === formData.boq_item_id);
        return b ? (b.item_name || b.name) : "None";
    }, [formData.project_id, formData.boq_item_id, loadingBoqs, boqItems]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.supplier_id || !formData.project_id || !formData.material_id) {
            return;
        }
        setLoading(true);
        try {
            const payload = { ...formData };
            if (!payload.boq_item_id) {
                delete payload.boq_item_id;
            }
            await onSubmit(payload);
            setFormData({
                supplier_id: 0,
                project_id: 0,
                material_id: 0,
                boq_item_id: 0,
                quantity: 0,
                rate: 0,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const selectedMaterial = inventory.find(m => m.id === formData.material_id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity font-inter">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-indigo-50/50">
                    <div>
                        <h2 className="text-xl font-black text-indigo-900 tracking-tight">Create Purchase Order</h2>

                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Project Selection */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deliver To Project <span className="text-rose-500">*</span></label>
                            <select
                                required
                                value={formData.project_id || ""}
                                onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                            >
                                <option value="" disabled>Select Project Site</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Supplier Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier <span className="text-rose-500">*</span></label>
                            <select
                                required
                                value={formData.supplier_id || ""}
                                onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                            >
                                <option value="" disabled>Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Material Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material <span className="text-rose-500">*</span></label>
                            <select
                                required
                                disabled={!formData.supplier_id || !formData.project_id}
                                value={formData.material_id || ""}
                                onChange={(e) => {
                                    const mid = Number(e.target.value);
                                    const mat = filteredMaterials.find((m: any) => m.id === mid || m.material_id === mid);
                                    setFormData({ ...formData, material_id: mid, rate: mat?.purchase_rate || mat?.avg_rate || 0 });
                                }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none ${(!formData.supplier_id || !formData.project_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="" disabled>
                                    {!formData.project_id || !formData.supplier_id
                                        ? "Select Project & Supplier First"
                                        : filteredMaterials.length === 0
                                            ? "No materials associated with this supplier at this site"
                                            : "Select Material"}
                                </option>
                                {filteredMaterials.map((m: any) => (
                                    <option key={m.id || m.material_id} value={m.material_id || m.id}>
                                        {m.name || m.material_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* BOQ Selection (Optional) */}
                        <div className="space-y-1.5 relative" ref={boqDropdownRef}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">BOQ Item (Optional)</label>
                            <button
                                type="button"
                                disabled={!formData.project_id || loadingBoqs}
                                onClick={() => setIsBoqDropdownOpen(prev => !prev)}
                                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold flex items-center justify-between text-left outline-none ${(!formData.project_id || loadingBoqs) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span className={`truncate ${formData.boq_item_id ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {selectedBoqLabel}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isBoqDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                            </button>

                            {isBoqDropdownOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                    {boqItems.length > 5 && (
                                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={boqSearch}
                                                    onChange={(e) => setBoqSearch(e.target.value)}
                                                    placeholder="Search BOQ item..."
                                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                                        <div
                                            onClick={() => {
                                                setFormData({ ...formData, boq_item_id: 0 });
                                                setIsBoqDropdownOpen(false);
                                                setBoqSearch("");
                                            }}
                                            className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                                !formData.boq_item_id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>None</span>
                                            {!formData.boq_item_id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                                        </div>
                                        {filteredBoqItems.map((b) => {
                                            const isSelected = formData.boq_item_id === b.id;
                                            return (
                                                <div
                                                    key={b.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, boq_item_id: b.id });
                                                        setIsBoqDropdownOpen(false);
                                                        setBoqSearch("");
                                                    }}
                                                    className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                                        isSelected ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                                                    }`}
                                                >
                                                    <span className="truncate">{b.item_name || b.name}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                                                </div>
                                            );
                                        })}
                                        {filteredBoqItems.length === 0 && boqItems.length > 0 && (
                                            <div className="px-4 py-3 text-xs text-slate-400 text-center italic">
                                                No BOQ items match search
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.quantity || ""}
                                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                                    {selectedMaterial?.unit || "Units"}
                                </span>
                            </div>
                        </div>

                        {/* Rate */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Rate <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.rate || ""}
                                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="md:col-span-2 bg-slate-50 rounded-2xl p-5 flex justify-between items-center border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Total</span>
                            <span className="text-xl font-black text-slate-800">₹{(formData.quantity * formData.rate).toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                        <button type="button" onClick={handleClose} className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading || filteredMaterials.length === 0}
                            className="flex-1 px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Issuing Order..." : "Save Purchase Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePOModal;
