import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface EditInvoiceItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        description: string;
        unit: string;
        quantity: number;
        rate: number;
    } | null;
    onSave: (updatedItem: any) => void;
}

const EditInvoiceItemModal = ({ isOpen, onClose, item, onSave }: EditInvoiceItemModalProps) => {
    const [formData, setFormData] = useState({
        description: "",
        unit: "",
        quantity: 0,
        rate: 0
    });

    useEffect(() => {
        if (item) {
            setFormData({
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                rate: item.rate
            });
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSave = () => {
        onSave({
            ...item,
            ...formData,
            amount: formData.quantity * formData.rate
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Edit Invoice Item</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quantity</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rate (₹)</label>
                        <input
                            type="number"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-2">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-widest">Total Amount</span>
                            <span className="text-lg font-black text-indigo-600">₹ {(formData.quantity * formData.rate).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                    >
                        Update Item
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditInvoiceItemModal;
