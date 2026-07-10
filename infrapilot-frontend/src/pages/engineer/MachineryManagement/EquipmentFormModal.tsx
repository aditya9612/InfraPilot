import React, { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import { Building2 } from "lucide-react";
import { projectService } from "../../../services/projectService";

interface EquipmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => Promise<void>;
    initialData?: any;
    selectedProjectId?: number | null;
    isViewOnly?: boolean;
}

const conditionDisplay: Record<string, string> = {
    'GOOD': 'GOOD',
    'REPAIR': 'REPAIR',
    'DAMAGED': 'DAMAGED',
    'MAINTENANCE': 'MAINTENANCE',
};

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({ isOpen, onClose, onSave, initialData, selectedProjectId, isViewOnly }) => {
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // If adding new equipment, default the project_id to the currently selected project
            const defaultData = initialData && Object.keys(initialData).length > 0
                ? initialData
                : { project_id: selectedProjectId || undefined };
            setFormData(defaultData);

            const fetchProjects = async () => {
                try {
                    const res = await projectService.getProjects(100, 0);
                    const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(projectsList);
                } catch (err) {
                    console.error("Failed to fetch projects", err);
                }
            };
            fetchProjects();
        }
    }, [isOpen, initialData, selectedProjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewOnly) return;
        setIsSaving(true);
        try {
            await onSave({ ...formData });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const modalFooter = (
        <div className="flex justify-end gap-3 mt-2">
            <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
                {isViewOnly ? "Close" : "Cancel"}
            </button>
            {!isViewOnly && (
                <button
                    form="equipment-form"
                    type="submit"
                    disabled={isSaving}
                    className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                >
                    {isSaving ? "Saving..." : (formData.id ? "Update Equipment" : "Add Equipment")}
                </button>
            )}
        </div>
    );

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = `w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${isViewOnly ? 'opacity-70 bg-slate-50 pointer-events-none' : 'focus:ring-primary/20 focus:border-primary'}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isViewOnly ? "View Equipment" : formData.id ? "Edit Equipment" : "Add Equipment"} maxWidth="max-w-3xl" footer={modalFooter}>
            <form id="equipment-form" onSubmit={handleSubmit} className="p-2 sm:p-4 font-inter space-y-6">
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-primary">{formData.id ? "Change Assigned Project" : "Assign to project"}</h3>
                        </div>
                    </div>
                    {!formData.id && <p className="text-[11px] text-blue-500 mb-4 ml-6">Equipment create hone ke baad automatically project assign ho jayega</p>}
                    <div className="ml-6">
                        <label className={labelClasses}>ASSIGNED PROJECT</label>
                        {formData.project_id ? (
                            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
                                {projects.find(p => Number(p.id) === Number(formData.project_id))?.project_name || projects.find(p => Number(p.id) === Number(formData.project_id))?.name || `Project ${formData.project_id}`}
                            </div>
                        ) : (
                            <select
                                value={formData.project_id || ''}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })}
                                className={inputClasses}
                            >
                                <option value="">-- Select your project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Equipment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Equipment Name *</label>
                            <input type="text" required value={formData.equipment_name || ''} onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Equipment Code *</label>
                            <input type="text" required value={formData.equipment_code || ''} onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Operator Name *</label>
                            <input type="text" required value={formData.operator_name || ''} onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Condition *</label>
                            <select required value={formData.condition || ''} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className={inputClasses}>
                                <option value="">Select condition</option>
                                {Object.keys(conditionDisplay).map(k => <option key={k} value={k}>{conditionDisplay[k]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Rental Cost (₹) *</label>
                            <input type="number" min="0" required value={formData.rental_cost || ''} onChange={(e) => setFormData({ ...formData, rental_cost: Number(e.target.value) })} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Maintenance Date *</label>
                            <input type="date" required value={formData.maintenance_date || ''} onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })} className={inputClasses} />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EquipmentFormModal;
