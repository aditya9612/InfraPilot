import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import type { Material, MaterialUpdate } from '../../types/material';
import { materialService } from '../../services/materialService';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    material: Material | null;
    onSuccess: () => void;
}

const EditMaterialModal: React.FC<Props> = ({ isOpen, onClose, material, onSuccess }) => {
    const [formData, setFormData] = useState<MaterialUpdate>({
        material_name: '',
        category: '',
        unit: 'Bags',
        supplier_id: 1,
        purchase_rate: 0,
        rate_type: 'FIXED',
        minimum_stock_level: 10
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (material) {
            setFormData({
                material_name: material.material_name,
                category: material.category,
                unit: material.unit,
                supplier_id: material.supplier_id,
                purchase_rate: material.purchase_rate,
                rate_type: material.rate_type,
                minimum_stock_level: material.minimum_stock_level
            });
        }
    }, [material]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!material) return;
        setIsSubmitting(true);
        try {
            await materialService.updateMaterial(material.id, formData);
            toast.success('Material updated successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to update material');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Update Material Profile"
            maxWidth="max-w-4xl"
            footer={
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all font-inter">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                    >
                        {isSubmitting ? 'Updating...' : 'Save Changes'}
                    </button>
                </div>
            }
        >
            <form className="space-y-6 p-1" onSubmit={handleSubmit}>
                {/* Section 1: Material Identity */}
                <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 font-inter">Material Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">MATERIAL CODE (READ-ONLY)</label>
                            <input 
                                type="text" 
                                value={material?.material_code || ''} 
                                readOnly 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 outline-none font-inter"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">CURRENT STOCK</label>
                            <input 
                                type="text" 
                                value={`${material?.remaining_stock || 0} ${material?.unit || ''}`} 
                                readOnly 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 outline-none font-inter"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">MATERIAL NAME *</label>
                            <input 
                                type="text" 
                                value={formData.material_name}
                                onChange={(e) => setFormData({...formData, material_name: e.target.value})}
                                placeholder="e.g. Ambuja Cement" 
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">CATEGORY *</label>
                            <input 
                                type="text" 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                placeholder="Construction" 
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">UNIT *</label>
                            <select 
                                value={formData.unit}
                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700 cursor-pointer"
                                required
                            >
                                <option value="Bags">Bags</option>
                                <option value="Kg">Kg</option>
                                <option value="Ton">Ton</option>
                                <option value="Litre">Litre</option>
                                <option value="Nos">Nos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Professional Configuration */}
                <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 font-inter">Professional Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">SUPPLIER ID *</label>
                            <input 
                                type="number" 
                                value={formData.supplier_id}
                                onChange={(e) => setFormData({...formData, supplier_id: parseInt(e.target.value)})}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">MIN. ALERT LEVEL *</label>
                            <input 
                                type="number" 
                                value={formData.minimum_stock_level}
                                onChange={(e) => setFormData({...formData, minimum_stock_level: parseFloat(e.target.value)})}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-rose-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">PURCHASE RATE *</label>
                            <input 
                                type="number" 
                                value={formData.purchase_rate}
                                onChange={(e) => setFormData({...formData, purchase_rate: parseFloat(e.target.value)})}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">RATE TYPE *</label>
                            <select 
                                value={formData.rate_type}
                                onChange={(e) => setFormData({...formData, rate_type: e.target.value as any})}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700 cursor-pointer"
                                required
                            >
                                <option value="FIXED">FIXED</option>
                                <option value="VARIABLE">VARIABLE</option>
                            </select>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EditMaterialModal;
