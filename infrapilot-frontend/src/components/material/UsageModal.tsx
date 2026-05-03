import React, { useState } from 'react';
import Modal from '../common/Modal';
import type { Material, UsagePayload } from '../../types/material';
import { materialService } from '../../services/materialService';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    material: Material | null;
    onSuccess: (updated: Material) => void;
}

const UsageModal: React.FC<Props> = ({ isOpen, onClose, material, onSuccess }) => {
    const [formData, setFormData] = useState<UsagePayload>({
        quantity: 0,
        project_id: material?.project_id || 1,
        issue_type: 'SITE'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!material) return;
        
        if (formData.quantity > material.remaining_stock) {
            toast.error(`Error: Quantity exceeds available stock (${material.remaining_stock} ${material.unit})`);
            return;
        }

        setIsSubmitting(true);
        try {
            const updated = await materialService.addUsage(material.id, formData);
            toast.success('Consumption logged successfully');
            if (updated.alert_type === 'LOW_STOCK') {
                toast('Low Stock Alert!', { icon: '⚠️', duration: 4000 });
            }
            onSuccess(updated);
            onClose();
        } catch (error) {
            toast.error('Failed to log consumption');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Log Material Consumption"
            maxWidth="max-w-md"
            footer={
                <div className="flex gap-4 w-full">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || formData.quantity <= 0}
                        className="flex-1 py-3 bg-amber-500 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm Consumption'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Available Inventory</p>
                        <span className="px-2 py-0.5 bg-amber-200/50 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-widest">Live Stock</span>
                    </div>
                    <p className="text-2xl font-black text-amber-900 tabular-nums">
                        {material?.remaining_stock.toLocaleString()} <span className="text-sm text-amber-600 font-bold">{material?.unit}</span>
                    </p>
                    <p className="text-[10px] text-amber-600/70 font-bold mt-1">Personnel: Site Engineer • Location: Project Site</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Consumption Quantity *</label>
                        <input 
                            type="number" 
                            max={material?.remaining_stock}
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-black text-slate-800 outline-none focus:border-amber-500 transition-all tabular-nums"
                            placeholder="0.00"
                        />
                        {formData.quantity > (material?.remaining_stock || 0) && (
                            <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1 animate-pulse">Insufficient stock for this operation</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Issue Context *</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, issue_type: 'SITE'})}
                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.issue_type === 'SITE' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                Site Issue
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, issue_type: 'SYSTEM'})}
                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.issue_type === 'SYSTEM' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                System Adjust
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default UsageModal;
