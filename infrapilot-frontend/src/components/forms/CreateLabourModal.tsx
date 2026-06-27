import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
        skill_category: "Unskilled",
        default_daily_wage: 0,
        default_working_hours: 8,
        default_ot_rate_per_hour: 0,
        is_active: true,
        type: "Labour"
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                default_daily_wage: initialData.default_daily_wage ?? 0,
                default_working_hours: initialData.default_working_hours ?? 8,
                default_ot_rate_per_hour: initialData.default_ot_rate_per_hour ?? 0,
                is_active: initialData.is_active ?? true,
                type: "Labour"
            });
        } else {
            setFormData({
                name: "",
                category: "",
                skill_category: "Unskilled",
                default_daily_wage: 0,
                default_working_hours: 8,
                default_ot_rate_per_hour: 0,
                is_active: true,
                type: "Labour"
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Labour type name is required.";
        if (!formData.category.trim()) newErrors.category = "Category is required.";

        if (formData.default_daily_wage < 0) newErrors.default_daily_wage = "Daily wage cannot be negative.";
        if (formData.default_ot_rate_per_hour < 0) newErrors.default_ot_rate_per_hour = "OT rate cannot be negative.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in all required fields.");
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
                {initialData ? "Save changes" : "Create labour type"}
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
            <form id="labour-master-form" onSubmit={handleSubmit} className="space-y-6">
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
                        {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.name}</p>}
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
                        {errors.category && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.category}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Skill Category</label>
                            <select
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                value={formData.skill_category}
                                onChange={(e) => setFormData({ ...formData, skill_category: e.target.value })}
                            >
                                <option value="Unskilled">Unskilled</option>
                                <option value="Semi-Skilled">Semi-Skilled</option>
                                <option value="Skilled">Skilled</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Daily Wage (₹)</label>
                            <input
                                type="number"
                                placeholder="700"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                value={formData.default_daily_wage}
                                onChange={(e) => setFormData({ ...formData, default_daily_wage: Number(e.target.value) })}
                            />
                            {errors.default_daily_wage && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.default_daily_wage}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Working Hours</label>
                            <input
                                type="number"
                                placeholder="8"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                value={formData.default_working_hours}
                                onChange={(e) => setFormData({ ...formData, default_working_hours: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">OT Rate / Hour (₹)</label>
                            <input
                                type="number"
                                placeholder="90"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                value={formData.default_ot_rate_per_hour}
                                onChange={(e) => setFormData({ ...formData, default_ot_rate_per_hour: Number(e.target.value) })}
                            />
                            {errors.default_ot_rate_per_hour && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.default_ot_rate_per_hour}</p>}
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
