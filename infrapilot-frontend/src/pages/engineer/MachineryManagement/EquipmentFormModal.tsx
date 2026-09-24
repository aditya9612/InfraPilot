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
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success', message?: string, fields?: string[] } | null>(null);

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
        
        const missingFields: string[] = [];
        if (!formData.equipment_name) missingFields.push("Equipment Name");
        if (!formData.equipment_code) missingFields.push("Equipment Code");
        if (!formData.condition) missingFields.push("Condition");
        if (formData.rental_cost === undefined || formData.rental_cost === null || formData.rental_cost === '') missingFields.push("Rental Cost");
        if (!formData.maintenance_date) missingFields.push("Maintenance Date");

        if (missingFields.length > 0) {
            setFormNotification({ type: 'error', fields: missingFields });
            return;
        }

        setIsSaving(true);
        setFormNotification(null);
        try {
            await onSave({ ...formData });
            onClose();
        } catch (error: any) {
            setFormNotification({ type: 'error', message: error.message || "Failed to save equipment. Please try again." });
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
                    {isSaving ? "Saving..." : (formData.id ? "Edit Equipment" : "Save Equipment")}
                </button>
            )}
        </div>
    );

    const labelClasses = "block text-[11px] font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 ml-1";
    const inputClasses = `w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${isViewOnly ? 'opacity-70 bg-slate-50 pointer-events-none' : 'focus:ring-primary/20 focus:border-primary'}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isViewOnly ? "View Equipment" : formData.id ? "Edit Equipment" : "Add Equipment"} maxWidth="max-w-3xl" footer={modalFooter}>
            {/* Top-right floating toast */}
            {formNotification && (
                <div style={{ position: 'fixed', top: '18px', right: '18px', zIndex: 99999, minWidth: '260px', maxWidth: '380px', animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)' }}>
                    <style>{`@keyframes slideDownIn { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    <div className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)', border: '1px solid #f1f5f9' }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}><span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span></div>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{formNotification.type === 'error' ? (formNotification.fields ? `Mandatory fields required: ${formNotification.fields.join(', ')}` : formNotification.message) : formNotification.message}</p>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
                    </div>
                </div>
            )}
            <form id="equipment-form" onSubmit={handleSubmit} noValidate className="p-2 sm:p-4 font-inter space-y-6">
                {/* Inline Validation Error Banner */}
                {formNotification && formNotification.type === 'error' && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-600">Validation Error</p>
                            <p className="text-xs text-red-500 mt-0.5">{formNotification.fields ? `Mandatory fields required: ${formNotification.fields.join(', ')}` : formNotification.message}</p>
                        </div>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                    </div>
                )}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-primary">{formData.id ? "Change Assigned Project" : "Assign to project"}</h3>
                        </div>
                    </div>
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
                            <label className={labelClasses}>Equipment Name <span className="text-rose-500">*</span></label>
                            <input type="text" required value={formData.equipment_name || ''} onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })} className={`${inputClasses} ${formNotification?.fields?.includes("Equipment Name") ? "!border-rose-500 !bg-rose-50" : ""}`} />
                            {formNotification?.fields?.includes("Equipment Name") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>Equipment Code <span className="text-rose-500">*</span></label>
                            <input type="text" required value={formData.equipment_code || ''} onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })} className={`${inputClasses} ${formNotification?.fields?.includes("Equipment Code") ? "!border-rose-500 !bg-rose-50" : ""}`} />
                            {formNotification?.fields?.includes("Equipment Code") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>Operator Name</label>
                            <input type="text" value={formData.operator_name || ''} onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Condition <span className="text-rose-500">*</span></label>
                            <select required value={formData.condition || ''} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className={`${inputClasses} ${formNotification?.fields?.includes("Condition") ? "!border-rose-500 !bg-rose-50" : ""}`}>
                                <option value="">Select condition</option>
                                {Object.keys(conditionDisplay).map(k => <option key={k} value={k}>{conditionDisplay[k]}</option>)}
                            </select>
                            {formNotification?.fields?.includes("Condition") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                        </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className={labelClasses}>Rental Cost (₹) <span className="text-rose-500">*</span></label>
                                    <input type="number" min="0" required value={formData.rental_cost || ''} onChange={(e) => setFormData({ ...formData, rental_cost: Number(e.target.value) })} className={`${inputClasses} ${formNotification?.fields?.includes("Rental Cost") ? "!border-rose-500 !bg-rose-50" : ""}`} />
                                    {formNotification?.fields?.includes("Rental Cost") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                                </div>
                                <div className="w-[140px]">
                                    <label className={labelClasses}>Unit</label>
                                    <select value={formData.cost_unit || 'PER_MONTH'} onChange={(e) => setFormData({ ...formData, cost_unit: e.target.value })} className={inputClasses}>
                                        <option value="PER_MONTH">Per Month</option>
                                        <option value="PER_DAY">Per Day</option>
                                    </select>
                                </div>
                            </div>
                        <div>
                            <label className={labelClasses}>Maintenance Date <span className="text-rose-500">*</span></label>
                            <input type="date" required value={formData.maintenance_date || ''} onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })} className={`${inputClasses} ${formNotification?.fields?.includes("Maintenance Date") ? "!border-rose-500 !bg-rose-50" : ""}`} />
                            {formNotification?.fields?.includes("Maintenance Date") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EquipmentFormModal;
