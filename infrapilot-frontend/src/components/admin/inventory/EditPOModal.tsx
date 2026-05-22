import React, { useState, useEffect } from "react";
import type { PurchaseOrder } from "../../../types/material";

interface EditPOModalProps {
    isOpen: boolean;
    po: PurchaseOrder | null;
    onClose: () => void;
    onSubmit: (id: number, data: { supplier_id: number; project_id: number; material_id: number; quantity: number; rate: number }) => Promise<void>;
}

const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, po, onClose, onSubmit }) => {
    const [quantity, setQuantity] = useState(0);
    const [rate, setRate] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (po) {
            setQuantity(po.quantity);
            setRate(po.rate);
        }
    }, [po]);

    if (!isOpen || !po) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(po.id, {
                supplier_id: po.supplier_id,
                project_id: po.project_id,
                material_id: po.material_id,
                quantity: Number(quantity),
                rate: Number(rate),
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Edit Purchase Order</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            PO-{po.id.toString().padStart(4, "0")} · {po.material_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            Quantity
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            Rate (₹)
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Total</p>
                        <p className="text-lg font-black text-slate-800">
                            ₹{(quantity * rate).toLocaleString("en-IN")}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPOModal;
