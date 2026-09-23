import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface CreateLabourModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const CreateLabourModal: React.FC<CreateLabourModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        skill_category: "",
        default_daily_wage: "" as number | string,
        default_working_hours: "" as number | string,
        default_ot_rate_per_hour: "" as number | string,
        is_active: true,
        type: "Labour"
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                default_daily_wage: initialData.default_daily_wage ?? "",
                default_working_hours: initialData.default_working_hours ?? "",
                default_ot_rate_per_hour: initialData.default_ot_rate_per_hour ?? "",
                is_active: initialData.is_active ?? true,
                type: "Labour"
            });
        } else {
            setFormData({
                name: "",
                category: "",
                skill_category: "",
                default_daily_wage: "",
                default_working_hours: "",
                default_ot_rate_per_hour: "",
                is_active: true,
                type: "Labour"
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);
        const newErrors: Record<string, string> = {};
        const missingFields: string[] = [];

        if (!formData.name.trim()) { newErrors.name = "Required"; missingFields.push("Labour Type Name"); }
        if (!formData.category.trim()) { newErrors.category = "Required"; missingFields.push("Category"); }
        if (!formData.skill_category) { newErrors.skill_category = "Required"; missingFields.push("Skill Category"); }

        if (formData.default_daily_wage === "" || Number(formData.default_daily_wage) < 0) { newErrors.default_daily_wage = "Required/Invalid"; missingFields.push("Daily Wage"); }
        if (formData.default_ot_rate_per_hour === "" || Number(formData.default_ot_rate_per_hour) < 0) { newErrors.default_ot_rate_per_hour = "Required/Invalid"; missingFields.push("OT Rate / Hour"); }
        if (formData.default_working_hours === "" || Number(formData.default_working_hours) <= 0) { newErrors.default_working_hours = "Required/Invalid"; missingFields.push("Working Hours"); }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setFormNotification({ type: 'error', message: 'Please fill in all mandatory details correctly.', fields: missingFields });
            setTimeout(() => setFormNotification(null), 5000);
            return;
        }

        setErrors({});
        onSubmit(formData);
    };

    const modalFooter = (
        <div className="flex justify-end gap-3 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
                Cancel
            </button>
            <button
                form="labour-master-form"
                type="submit"
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
                {initialData ? "Save changes" : "Save Labour type"}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Labour Type" : "Create Labour Type"}
            footer={modalFooter}
        >
            {/* Top-right floating toast */}
            {formNotification && (
                <div
                    style={{
                        position: 'fixed',
                        top: '18px',
                        right: '18px',
                        zIndex: 99999,
                        minWidth: '260px',
                        maxWidth: '380px',
                        animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <style>{`
            @keyframes slideDownIn {
              from { opacity: 0; transform: translateY(-16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
                    <div
                        className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5"
                        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)', border: '1px solid #f1f5f9' }}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}>
                            <span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
                            {formNotification.type === 'error'
                                ? `Please fill in all mandatory details correctly. \nMissing: ${(formNotification.fields || []).join(', ')}`
                                : formNotification.message}
                        </p>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
                    </div>
                </div>
            )}
            <form id="labour-master-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Inline Validation Error Banner */}
                {formNotification && formNotification.type === 'error' && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-600">Validation Error</p>
                            <p className="text-xs text-red-500 mt-0.5">Please provide all required information to continue.</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(formNotification.fields || []).map(field => (
                                    <span key={field} className="px-2 py-1 bg-white border border-red-100 rounded text-[10px] font-bold text-red-600 uppercase tracking-wider">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Labour Type Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Helper, Mason"
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.name ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Category <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. General"
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.category ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        {errors.category && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Skill Category <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-bold ${errors.skill_category ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10"}`}
                                value={formData.skill_category}
                                onChange={(e) => {
                                    setFormData({ ...formData, skill_category: e.target.value });
                                    if (e.target.value) setErrors(prev => ({ ...prev, skill_category: "" }));
                                }}
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="Unskilled">Unskilled</option>
                                <option value="Semi Skilled">Semi Skilled</option>
                                <option value="Skilled">Skilled</option>
                            </select>
                            {errors.skill_category && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Daily Wage (₹) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="700"
                                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.default_daily_wage ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                                value={formData.default_daily_wage}
                                onChange={(e) => setFormData({ ...formData, default_daily_wage: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                            {errors.default_daily_wage && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Working Hours <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="8"
                                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.default_working_hours ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                                value={formData.default_working_hours}
                                onChange={(e) => setFormData({ ...formData, default_working_hours: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                            {errors.default_working_hours && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                OT Rate / Hour (₹) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="90"
                                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.default_ot_rate_per_hour ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                                value={formData.default_ot_rate_per_hour}
                                onChange={(e) => setFormData({ ...formData, default_ot_rate_per_hour: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                            {errors.default_ot_rate_per_hour && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="labour-active"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="labour-active" className="text-sm font-medium text-gray-600">Is Active</label>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateLabourModal;
