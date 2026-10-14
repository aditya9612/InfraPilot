import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { boqService } from '../../services/boqService';
import type { CreateRentalRequest } from '../../services/equipmentService';
import { CustomSelect } from '../common/CustomDropdown';

interface CreateRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (equipmentId: number, data: CreateRentalRequest) => Promise<void>;
    equipmentList: any[];
    projects: any[];
}

const CreateRentalModal: React.FC<CreateRentalModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    equipmentList,
    projects
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [equipmentId, setEquipmentId] = useState<number | ''>('');
    const [boqItems, setBoqItems] = useState<any[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);

    // Core payload
    const [formData, setFormData] = useState<CreateRentalRequest>({
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        rental_cost: 0,
        client_name: '',
        notes: '',
        expected_end_date: '',
        is_received: false,
        is_returned: false,
        project_id: null,
        boq_item_id: null,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) {
            setServerError(null);
            setErrors({});
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (serverError) setServerError(null);
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    useEffect(() => {
        if (formData.project_id) {
            boqService.getBoqsByProject(Number(formData.project_id))
                .then(setBoqItems)
                .catch(console.error);
        } else {
            setBoqItems([]);
            if (formData.boq_item_id) {
                setFormData(prev => ({ ...prev, boq_item_id: null }));
            }
        }
    }, [formData.project_id]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!equipmentId) newErrors.equipment_id = 'Equipment selection is required';
        if (!formData.start_date) newErrors.start_date = 'Start date is required';
        if (!formData.end_date) newErrors.end_date = 'End date is required';
        if (!formData.rental_cost) newErrors.rental_cost = 'Rental cost is required';
        if (!formData.client_name) newErrors.client_name = 'Client name is required';
        if (!formData.expected_end_date) newErrors.expected_end_date = 'Expected end date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setIsLoading(true);
        setServerError(null);
        try {
            const payload = {
                ...formData,
                rental_cost: Number(formData.rental_cost),
                project_id: formData.project_id ? Number(formData.project_id) : null,
                boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : null,
            };
            await onSubmit(Number(equipmentId), payload);
            setEquipmentId('');
            setFormData({
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                rental_cost: 0,
                client_name: '',
                notes: '',
                expected_end_date: '',
                is_received: false,
                is_returned: false,
                project_id: null,
                boq_item_id: null,
            });
            setServerError(null);
        } catch (error: any) {
            console.error('Submit error', error);
            const data = error?.response?.data;
            const status = error?.response?.status;
            const detail = data?.detail || data?.message || data?.error;
            const detailStr = typeof detail === 'string' ? detail : JSON.stringify(detail || '');

            let errMsg = 'Failed to create rental';
            if (status === 409 || /already exists|duplicate|rental code/i.test(detailStr)) {
                errMsg = "A rental with this Rental Code already exists.";
            } else if (typeof data?.detail === 'string') {
                errMsg = data.detail;
            } else if (Array.isArray(data?.detail)) {
                errMsg = data.detail.map((d: any) => {
                    const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
                    const msg = d.msg || d.message || JSON.stringify(d);
                    return field ? `${field}: ${msg}` : msg;
                }).join(', ');
            } else if (typeof data?.message === 'string') {
                errMsg = data.message;
            } else if (typeof data?.error === 'string') {
                errMsg = data.error;
            } else if (typeof error?.message === 'string') {
                errMsg = error.message;
            }
            setServerError(errMsg);
            toast.error(errMsg);
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
                form="create-rental-form"
                type="submit"
                disabled={isLoading}
                className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
                {isLoading ? 'Creating...' : 'Create Rental'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Rental"
            footer={modalFooter}
            maxWidth="max-w-3xl"
        >
            <form id="create-rental-form" onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Server Error Alert */}
                    {serverError && (
                        <div className="md:col-span-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
                            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                            <span className="flex-1">{serverError}</span>
                        </div>
                    )}

                    {/* Equipment Selection */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Equipment <span className="text-rose-500">*</span></label>
                        <CustomSelect
                            value={equipmentId}
                            onChange={(val) => {
                                setEquipmentId(val ? Number(val) : '');
                                if (errors.equipment_id) {
                                    setErrors(prev => ({ ...prev, equipment_id: '' }));
                                }
                                if (serverError) setServerError(null);
                            }}
                            options={[
                                { id: '', label: 'Select Equipment' },
                                ...equipmentList.map(eq => ({
                                    id: eq.id,
                                    label: eq.equipment_name || eq.equipment_code || `Equipment #${eq.id}`
                                }))
                            ]}
                            placeholder="Select Equipment"
                            searchable={equipmentList.length > 5}
                            maxHeight="max-h-52"
                            error={!!errors.equipment_id}
                        />
                        {errors.equipment_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.equipment_id}</p>}
                    </div>

                    {/* Client Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Client Name <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                            placeholder="Client Name"
                        />
                        {errors.client_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.client_name}</p>}
                    </div>

                    {/* Project */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Project Link (Optional)</label>
                        <CustomSelect
                            value={formData.project_id || ''}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, project_id: val ? Number(val) : null }));
                                if (serverError) setServerError(null);
                            }}
                            options={[
                                { id: '', label: 'No Project Affiliation' },
                                ...projects.map(p => ({
                                    id: p.id,
                                    label: p.project_name || `Project #${p.id}`
                                }))
                            ]}
                            placeholder="No Project Affiliation"
                            searchable={projects.length > 5}
                            maxHeight="max-h-52"
                        />
                    </div>

                    {/* BOQ Item ID */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">BOQ Item (Optional)</label>
                        <CustomSelect
                            value={formData.boq_item_id || ''}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, boq_item_id: val ? Number(val) : null }));
                                if (serverError) setServerError(null);
                            }}
                            options={[
                                { id: '', label: 'Select BOQ Item' },
                                ...boqItems.map(item => ({
                                    id: item.id,
                                    label: item.item_name || `Item #${item.id}`
                                }))
                            ]}
                            placeholder={!formData.project_id ? "Select a project first" : "Select BOQ Item"}
                            searchable={boqItems.length > 5}
                            disabled={!formData.project_id || boqItems.length === 0}
                            maxHeight="max-h-52"
                        />
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Start Date <span className="text-rose-500">*</span></label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                        />
                        {errors.start_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.start_date}</p>}
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">End Date <span className="text-rose-500">*</span></label>
                        <input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                        />
                        {errors.end_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.end_date}</p>}
                    </div>

                    {/* Rental Cost */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Rental Cost / Rate <span className="text-rose-500">*</span></label>
                        <input
                            type="number"
                            name="rental_cost"
                            value={formData.rental_cost}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                            placeholder="0"
                        />
                        {errors.rental_cost && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.rental_cost}</p>}
                    </div>

                    {/* Expected End Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Expected End Date <span className="text-rose-500">*</span></label>
                        <input
                            type="date"
                            name="expected_end_date"
                            required
                            value={formData.expected_end_date}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 bg-white border ${errors.expected_end_date ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'} focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all`}
                        />
                        {errors.expected_end_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.expected_end_date}</p>}
                    </div>

                    {/* Status Checks */}
                    <div className="flex items-center gap-6 md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_received"
                                checked={formData.is_received}
                                onChange={handleChange}
                                className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                            />
                            Equipment Received
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_returned"
                                checked={formData.is_returned}
                                onChange={handleChange}
                                className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                            />
                            Equipment Returned
                        </label>
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Notes / Terms</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all resize-none"
                            placeholder="Any specific rental terms..."
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateRentalModal;
