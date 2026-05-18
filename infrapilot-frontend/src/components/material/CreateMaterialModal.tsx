import React, { useState } from 'react';
import Modal from '../common/Modal';
import type { MaterialCreate } from '../../types/material';
import { materialService } from '../../services/materialService';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateMaterialModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<MaterialCreate>({
        project_id: 1, // Defaulting to project 1
        material_name: '',
        category: '',
        unit: 'Bags',
        supplier_id: 1,
        purchase_rate: 0,
        rate_type: 'FIXED',
        quantity_purchased: 0,
        payment_given: 0,
        minimum_stock_level: 10
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalAmount = formData.quantity_purchased * formData.purchase_rate;
    const paymentPending = totalAmount - formData.payment_given;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await materialService.createMaterial(formData);
            toast.success('Material registered successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to create material');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Register New Material"
            maxWidth="max-w-4xl"
            footer={
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all font-inter">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                    >
                        {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                    </button>
                </div>
            }
        >
            <form className="space-y-6 p-1" onSubmit={handleSubmit}>
                {/* Section 1: Basic Information */}
                <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 font-inter">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">PROJECT ID *</label>
                            <input 
                                type="number" 
                                value={formData.project_id}
                                onChange={(e) => setFormData({...formData, project_id: parseInt(e.target.value)})}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">MATERIAL NAME *</label>
                            <input 
                                type="text" 
                                value={formData.material_name}
                                onChange={(e) => setFormData({...formData, material_name: e.target.value})}
                                placeholder="e.g. Cement, TMT Steel" 
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
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
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
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
                    </div>
                </div>

                {/* Section 2: Procurement Details */}
                <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 font-inter">Procurement Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">QUANTITY PURCHASED *</label>
                            <input 
                                type="number" 
                                value={formData.quantity_purchased}
                                onChange={(e) => setFormData({...formData, quantity_purchased: parseFloat(e.target.value)})}
                                placeholder="200"
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">PAYMENT GIVEN *</label>
                            <input 
                                type="number" 
                                value={formData.payment_given}
                                onChange={(e) => setFormData({...formData, payment_given: parseFloat(e.target.value)})}
                                placeholder="71000"
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-emerald-600 placeholder:text-slate-300 placeholder:font-normal"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 font-inter">MINIMUM STOCK LEVEL *</label>
                            <input 
                                type="number" 
                                value={formData.minimum_stock_level}
                                onChange={(e) => setFormData({...formData, minimum_stock_level: parseFloat(e.target.value)})}
                                placeholder="200"
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter font-bold text-rose-500 placeholder:text-slate-300 placeholder:font-normal"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Settlement Summary */}
                <div className="bg-primary rounded-[1.5rem] p-6 grid grid-cols-2 gap-8 text-white shadow-xl shadow-primary/20 font-inter">
                    <div className="space-y-1 font-inter">
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] font-inter">Procurement Total</p>
                        <p className="text-2xl font-black italic-none tracking-tight font-inter">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right space-y-1 border-l border-white/10 pl-8 font-inter">
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] font-inter">Settlement Balance</p>
                        <p className={`text-2xl font-black italic-none tracking-tight font-inter ${paymentPending > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                            {paymentPending > 0 ? `₹${paymentPending.toLocaleString()}` : 'SETTLED'}
                        </p>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateMaterialModal;
