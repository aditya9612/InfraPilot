import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Plus, Link } from 'lucide-react';

interface ReceiveRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitNew: (data: { equipment_name: string; equipment_code: string; condition: string; expected_end_date: string }) => Promise<void>;
    onSubmitLegacy: (equipment_id: number) => Promise<void>;
    equipmentList: any[];
}

const ReceiveRentalModal: React.FC<ReceiveRentalModalProps> = ({
    isOpen, onClose, onSubmitNew, onSubmitLegacy, equipmentList
}) => {
    const [mode, setMode] = useState<'NEW' | 'LEGACY'>('NEW');
    const [isLoading, setIsLoading] = useState(false);

    // Legacy State
    const [equipmentId, setEquipmentId] = useState<number | ''>('');
    const [legacyError, setLegacyError] = useState<string>('');

    // New State
    const [formData, setFormData] = useState({
        equipment_name: '',
        equipment_code: '',
        condition: 'GOOD',
        expected_end_date: ''
    });
    const [newErrors, setNewErrors] = useState<Record<string, string>>({});

    const handleChangeNew = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (newErrors[name]) setNewErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateNewForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.equipment_name.trim()) errors.equipment_name = 'Equipment name is required';
        if (!formData.equipment_code.trim()) errors.equipment_code = 'Equipment code is required';
        if (!formData.condition) errors.condition = 'Condition is required';
        if (!formData.expected_end_date) errors.expected_end_date = 'Expected end date is required';
        setNewErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'LEGACY') {
            if (!equipmentId) {
                setLegacyError('Please select an equipment to link');
                return;
            }
            setIsLoading(true);
            try {
                await onSubmitLegacy(Number(equipmentId));
                setEquipmentId('');
                setLegacyError('');
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        } else {
            if (!validateNewForm()) return;
            setIsLoading(true);
            try {
                await onSubmitNew(formData);
                setFormData({ equipment_name: '', equipment_code: '', condition: 'GOOD', expected_end_date: '' });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
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
                form="receive-rental-form"
                type="submit"
                disabled={isLoading}
                className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
                {isLoading ? 'Processing...' : mode === 'NEW' ? 'Create & Receive' : 'Link & Receive'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Receive Rental Equipment"
            footer={modalFooter}
            maxWidth="max-w-md"
        >
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner">
                <button
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${mode === 'NEW' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setMode('NEW')}
                >
                    <Plus className="w-4 h-4" /> Create New
                </button>
                <button
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${mode === 'LEGACY' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setMode('LEGACY')}
                >
                    <Link className="w-4 h-4" /> Link Existing
                </button>
            </div>

            <form id="receive-rental-form" onSubmit={handleSubmit} className="space-y-6">
                {mode === 'LEGACY' ? (
                    <div className="animate-in fade-in duration-300 slide-in-from-right-4 space-y-4">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 mb-2">
                            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                <strong>Legacy Mode:</strong> Select an existing equipment from the registry to manually link to this purchase order. This matches the behavior of previously created equipment records.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Select Equipment to Link <span className="text-rose-500">*</span></label>
                            <select
                                value={equipmentId}
                                onChange={(e) => {
                                    setEquipmentId(e.target.value ? Number(e.target.value) : '');
                                    setLegacyError('');
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                            >
                                <option value="">Select Equipment</option>
                                {equipmentList.map(eq => (
                                    <option key={eq.id} value={eq.id}>
                                        {eq.equipment_code} - {eq.equipment_name || 'N/A'}
                                    </option>
                                ))}
                            </select>
                            {legacyError && <p className="mt-1.5 text-[10px] text-rose-500 font-bold ml-1">{legacyError}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in duration-300 slide-in-from-left-4">
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/60 mb-2">
                            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                <strong>Primary Mode:</strong> Fills out minimum viable details. Submitting this form runs the primary route which automatically provisions a new linked Equipment record upon receipt.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Equipment Name <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                name="equipment_name"
                                value={formData.equipment_name}
                                onChange={handleChangeNew}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                                placeholder="e.g. Excavator XT-900"
                            />
                            {newErrors.equipment_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{newErrors.equipment_name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Equipment Code <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                name="equipment_code"
                                value={formData.equipment_code}
                                onChange={handleChangeNew}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                                placeholder="e.g. EQ-001"
                            />
                            {newErrors.equipment_code && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{newErrors.equipment_code}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Condition <span className="text-rose-500">*</span></label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChangeNew}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                            >
                                <option value="NEW">New</option>
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                                <option value="POOR">Poor</option>
                            </select>
                            {newErrors.condition && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{newErrors.condition}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Expected End Date <span className="text-rose-500">*</span></label>
                            <input
                                type="date"
                                name="expected_end_date"
                                value={formData.expected_end_date}
                                onChange={handleChangeNew}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                            />
                            {newErrors.expected_end_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{newErrors.expected_end_date}</p>}
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default ReceiveRentalModal;
