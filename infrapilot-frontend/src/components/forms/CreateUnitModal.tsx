import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

interface CreateUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const CreateUnitModal: React.FC<CreateUnitModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        unique_code: "",
        category: "",
        type: "Unit",
        is_active: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                type: "Unit"
            });
        } else {
            setFormData({
                name: "",
                unique_code: "",
                category: "",
                type: "Unit",
                is_active: true
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Unit name is required.";
        if (!formData.unique_code.trim()) newErrors.unique_code = "Unique code is required.";
        if (!formData.category.trim()) newErrors.category = "Category is required.";

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
                form="unit-master-form"
                type="submit"
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
                {initialData ? "Save changes" : "Create unit"}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Unit" : "Create Unit"}
            footer={modalFooter}
        >
            <form id="unit-master-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Unit Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Square Feet"
                                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.name ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Unique Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. UOM-001"
                                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-mono font-bold ${errors.unique_code ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                                value={formData.unique_code}
                                onChange={(e) => setFormData({ ...formData, unique_code: e.target.value })}
                            />
                            {errors.unique_code && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.unique_code}</p>}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Category <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Area"
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.category ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        {errors.category && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.category}</p>}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="unit-active"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="unit-active" className="text-sm font-medium text-gray-600">Is Active</label>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateUnitModal;
