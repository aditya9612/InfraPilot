import React, { useState } from 'react';
import Modal from '../common/Modal';
import type { Material, PurchasePayload } from '../../types/material';
import { materialService } from '../../services/materialService';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    material: Material | null;
    onSuccess: (updated: Material) => void;
}

const PurchaseModal: React.FC<Props> = ({ isOpen, onClose, material, onSuccess }) => {
    const [formData, setFormData] = useState<PurchasePayload>({
        quantity: 0,
        amount_paid: 0,
        project_id: material?.project_id || 1,
        issue_type: 'SITE'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const expectedCost = formData.quantity * (material?.purchase_rate || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!material) return;
        
        setIsSubmitting(true);
        try {
            const updated = await materialService.addPurchase(material.id, formData);
            toast.success('Inventory replenished successfully');
            onSuccess(updated);
            onClose();
        } catch (error) {
            toast.error('Failed to log purchase');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Replenish Inventory"
            maxWidth="max-w-md"
            footer={
                <div className="flex gap-4 w-full">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || formData.quantity <= 0}
                        className="flex-1 py-3 bg-emerald-500 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating Stock...' : 'Confirm Purchase'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Current Inventory</p>
                        <span className="px-2 py-0.5 bg-emerald-200/50 text-emerald-700 text-[9px] font-black rounded-lg uppercase tracking-widest">In Stock</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-900 tabular-nums">
                        {material?.remaining_stock.toLocaleString()} <span className="text-sm text-emerald-600 font-bold">{material?.unit}</span>
                    </p>
                    <p className="text-[10px] text-emerald-600/70 font-bold mt-1">Ref. Rate: ₹{material?.purchase_rate.toLocaleString()} / {material?.unit}</p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">New Quantity *</label>
                            <input 
                                type="number" 
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-emerald-500 transition-all tabular-nums"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Amount Paid *</label>
                            <input 
                                type="number" 
                                value={formData.amount_paid}
                                onChange={(e) => setFormData({...formData, amount_paid: parseFloat(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-emerald-500 transition-all tabular-nums"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Total Cost</p>
                        <p className="text-sm font-black text-slate-800 italic-none">₹{expectedCost.toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Purchase Mode *</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, issue_type: 'SITE'})}
                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.issue_type === 'SITE' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                Fresh Supply
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, issue_type: 'SYSTEM'})}
                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.issue_type === 'SYSTEM' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                Stock Correction
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PurchaseModal;
