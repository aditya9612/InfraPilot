import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Plus, Link } from 'lucide-react';
import { CustomSelect } from '../common/CustomDropdown';

interface ReceiveRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitNew: (data: { equipment_name: string; equipment_code: string; condition: string }) => Promise<void>;
    onSubmitLegacy: (equipment_id: number) => Promise<void>;
    equipmentList: any[];
    selectedPurchase?: any;
}

const ReceiveRentalModal: React.FC<ReceiveRentalModalProps> = ({
    isOpen, onClose, onSubmitNew, onSubmitLegacy, equipmentList, selectedPurchase
}) => {
    const [mode, setMode] = useState<'NEW' | 'LEGACY'>('NEW');
    const [isLoading, setIsLoading] = useState(false);

    // Legacy State
    const [equipmentId, setEquipmentId] = useState<number | ''>('');
    const [legacyError, setLegacyError] = useState<string>('');

    // New State
    const [selectedEqId, setSelectedEqId] = useState<number | string>('');
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [formData, setFormData] = useState({
        equipment_name: '',
        equipment_code: '',
        condition: 'GOOD'
    });
    const [newErrors, setNewErrors] = useState<Record<string, string>>({});

    // Auto-select equipment when modal opens or equipmentList / selectedPurchase changes
    useEffect(() => {
        if (!isOpen) return;

        setNewErrors({});
        setLegacyError('');

        // Find equipment matching purchase's asset_id or purchase's equipment name
        let matchedEq = null;
        if (selectedPurchase?.asset_id) {
            matchedEq = equipmentList.find(eq => eq.id === selectedPurchase.asset_id);
        }
        if (!matchedEq && selectedPurchase?.equipment_name) {
            matchedEq = equipmentList.find(eq => (eq.equipment_name || '').toLowerCase() === (selectedPurchase.equipment_name || '').toLowerCase());
        }
        if (!matchedEq && equipmentList.length > 0) {
            matchedEq = equipmentList[0];
        }

        if (matchedEq) {
            setSelectedEqId(matchedEq.id);
            setEquipmentId(matchedEq.id);
            setFormData({
                equipment_name: matchedEq.equipment_name || '',
                equipment_code: matchedEq.equipment_code || '',
                condition: 'GOOD'
            });
        } else {
            setSelectedEqId('');
            setEquipmentId('');
            setFormData({
                equipment_name: selectedPurchase?.equipment_name || '',
                equipment_code: '',
                condition: 'GOOD'
            });
        }
        setIsManualEntry(false);
    }, [isOpen, selectedPurchase, equipmentList]);

    const handleSelectEquipmentForNew = (val: any) => {
        setSelectedEqId(val);
        const selected = equipmentList.find(eq => String(eq.id) === String(val));
        if (selected) {
            setFormData(prev => ({
                ...prev,
                equipment_name: selected.equipment_name || '',
                equipment_code: selected.equipment_code || ''
            }));
            if (newErrors.equipment_name) setNewErrors(prev => ({ ...prev, equipment_name: '' }));
            if (newErrors.equipment_code) setNewErrors(prev => ({ ...prev, equipment_code: '' }));
        } else {
            setFormData(prev => ({
                ...prev,
                equipment_name: '',
                equipment_code: ''
            }));
        }
    };

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
                setFormData({ equipment_name: '', equipment_code: '', condition: 'GOOD' });
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
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                                Select Equipment to Link <span className="text-rose-500">*</span>
                            </label>
                            <CustomSelect
                                options={[
                                    { id: '', label: 'Select Equipment' },
                                    ...equipmentList.map(eq => ({
                                        id: eq.id,
                                        label: `${eq.equipment_code} - ${eq.equipment_name || 'N/A'}`,
                                        searchKey: `${eq.equipment_code} ${eq.equipment_name}`
                                    }))
                                ]}
                                value={equipmentId}
                                onChange={(val) => {
                                    setEquipmentId(val ? Number(val) : '');
                                    setLegacyError('');
                                }}
                                placeholder="Select Equipment"
                                searchable={true}
                                maxHeight="max-h-52"
                                error={!!legacyError}
                            />
                            {legacyError && <p className="mt-1.5 text-[10px] text-rose-500 font-bold ml-1">{legacyError}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in duration-300 slide-in-from-left-4">
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/60 mb-2">
                            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                <strong>Primary Mode:</strong> Automatically selects or provisions equipment upon receipt. Submitting will register the physical equipment record and update the purchase status.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 ml-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Equipment Name <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextManual = !isManualEntry;
                                        setIsManualEntry(nextManual);
                                        if (!nextManual && equipmentList.length > 0) {
                                            const eq = equipmentList.find(e => String(e.id) === String(selectedEqId)) || equipmentList[0];
                                            if (eq) {
                                                setSelectedEqId(eq.id);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    equipment_name: eq.equipment_name || '',
                                                    equipment_code: eq.equipment_code || ''
                                                }));
                                            }
                                        }
                                    }}
                                    className="text-[11px] font-bold text-primary hover:underline"
                                >
                                    {isManualEntry ? "Select from list" : "Enter manually"}
                                </button>
                            </div>

                            {isManualEntry ? (
                                <input
                                    type="text"
                                    name="equipment_name"
                                    value={formData.equipment_name}
                                    onChange={handleChangeNew}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                                    placeholder="e.g. Excavator XT-900"
                                />
                            ) : (
                                <CustomSelect
                                    options={equipmentList.map(eq => ({
                                        id: eq.id,
                                        label: eq.equipment_name || eq.equipment_code || `Equipment #${eq.id}`,
                                        badge: eq.equipment_code,
                                        searchKey: `${eq.equipment_name} ${eq.equipment_code}`
                                    }))}
                                    value={selectedEqId}
                                    onChange={handleSelectEquipmentForNew}
                                    placeholder="Select Equipment Name"
                                    searchable={true}
                                    maxHeight="max-h-52"
                                    error={!!newErrors.equipment_name}
                                />
                            )}
                            {newErrors.equipment_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{newErrors.equipment_name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                                Equipment Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="equipment_code"
                                value={formData.equipment_code}
                                onChange={handleChangeNew}
                                readOnly={!isManualEntry}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all shadow-sm font-mono ${
                                    !isManualEntry 
                                        ? 'bg-slate-50 border-slate-200 text-slate-800 cursor-default' 
                                        : 'bg-white border-slate-200 text-slate-800 focus:ring-primary/20 focus:border-primary'
                                }`}
                                placeholder="e.g. EQ-001"
                            />
                            {!isManualEntry && (
                                <p className="mt-1 text-[10px] text-slate-400 font-medium ml-1">
                                    Auto-populated from selected equipment
                                </p>
                            )}
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
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default ReceiveRentalModal;
