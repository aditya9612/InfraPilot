import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import type { ReturnInspectionRequest } from '../../services/equipmentService';

interface CreateReturnInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (equipmentId: number, data: ReturnInspectionRequest) => Promise<void>;
    rentalItem: any;
}

const CreateReturnInspectionModal: React.FC<CreateReturnInspectionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    rentalItem,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    // Core payload
    const [formData, setFormData] = useState<Omit<ReturnInspectionRequest, 'rental_id'>>({
        inspection_date: new Date().toISOString().split('T')[0],
        condition: 'GOOD',
        damage_description: '',
        repair_cost: 0,
        remarks: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.inspection_date) newErrors.inspection_date = 'Inspection date is required';
        if (!formData.condition) newErrors.condition = 'Condition is required';

        if (formData.condition !== 'GOOD' && !formData.damage_description) {
            newErrors.damage_description = 'Damage description is required when condition is not GOOD';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !rentalItem) {
            toast.error('Please fix the validation errors');
            return;
        }

        setIsLoading(true);
        try {
            const payload: ReturnInspectionRequest = {
                rental_id: rentalItem.id,
                inspection_date: formData.inspection_date,
                condition: formData.condition,
                damage_description: formData.damage_description || undefined,
                repair_cost: formData.repair_cost ? Number(formData.repair_cost) : undefined,
                remarks: formData.remarks || undefined,
            };
            await onSubmit(rentalItem.equipment_id, payload);
            setFormData({
                inspection_date: new Date().toISOString().split('T')[0],
                condition: 'GOOD',
                damage_description: '',
                repair_cost: 0,
                remarks: '',
            });
        } catch (error) {
            console.error('Submit error', error);
        } finally {
            setIsLoading(false);
        }
    };

    const modalFooter = (
        <>
            <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                form="create-inspection-form"
                type="submit"
                disabled={isLoading}
                className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
                {isLoading ? 'Submitting...' : 'Submit Inspection'}
            </button>
        </>
    );

    if (!rentalItem && isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Return Inspection"
            footer={modalFooter}
            maxWidth="max-w-2xl"
        >
            <form id="create-inspection-form" onSubmit={handleSubmit} className="space-y-6">

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mb-6">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rental ID</p>
                        <p className="text-sm font-bold text-slate-700">#{rentalItem?.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipment</p>
                        <p className="text-sm font-bold text-slate-700">#{rentalItem?.equipment_id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Inspection Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Inspection Date <span className="text-rose-500">*</span></label>
                        <input
                            type="date"
                            name="inspection_date"
                            value={formData.inspection_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                        />
                        {errors.inspection_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.inspection_date}</p>}
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Condition <span className="text-rose-500">*</span></label>
                        <select
                            name="condition"
                            value={formData.condition}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                        >
                            <option value="GOOD">Good</option>
                            <option value="FAIR">Fair (Normal Wear & Tear)</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="REPAIR_NEEDED">Repair Needed</option>
                        </select>
                        {errors.condition && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.condition}</p>}
                    </div>

                    {/* Damage Description */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Damage Description {formData.condition !== 'GOOD' && <span className="text-rose-500">*</span>}
                        </label>
                        <textarea
                            name="damage_description"
                            value={formData.damage_description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all resize-none"
                            placeholder="Describe any damages found during inspection..."
                        />
                        {errors.damage_description && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.damage_description}</p>}
                    </div>

                    {/* Repair Cost */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Estimated Repair Cost</label>
                        <input
                            type="number"
                            name="repair_cost"
                            value={formData.repair_cost}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                            placeholder="0"
                            min="0"
                        />
                    </div>

                    {/* Remarks */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Additional Remarks</label>
                        <input
                            type="text"
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                            placeholder="Any further notes..."
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateReturnInspectionModal;
