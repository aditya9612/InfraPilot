import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    unique_code: "",
    category: "",
    unit: "",
    brand: "",
    specification: "",
    hsn_code: "",
    default_rate: 0,
    minimum_stock_level: 0,
    is_active: true,
    type: "Material"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        type: "Material"
      });
    } else {
      setFormData({
        name: "",
        unique_code: "",
        category: "",
        unit: "",
        brand: "",
        specification: "",
        hsn_code: "",
        default_rate: 0,
        minimum_stock_level: 0,
        is_active: true,
        type: "Material"
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Material name is required.";
    if (!formData.unique_code.trim()) newErrors.unique_code = "Unique code is required.";
    if (!formData.category.trim()) newErrors.category = "Category is required.";
    if (!formData.unit.trim()) newErrors.unit = "Unit is required.";

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
        form="material-master-form"
        type="submit"
        className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        {initialData ? "Save changes" : "Create material"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Material Master" : "Create Material Master"}
      footer={modalFooter}
    >
      <form id="material-master-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Material Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. UltraTech Cement"
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.name ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Unique Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MAT-CEMENT-001"
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-mono font-bold ${errors.unique_code ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                value={formData.unique_code}
                onChange={(e) => setFormData({ ...formData, unique_code: e.target.value })}
              />
              {errors.unique_code && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.unique_code}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cement"
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.category ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              {errors.category && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.category}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Unit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bag, Kg, Meter"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. UltraTech"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Specification</label>
            <textarea
              placeholder="e.g. OPC 53 Grade"
              rows={2}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              value={formData.specification}
              onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">HSN Code</label>
              <input
                type="text"
                placeholder="e.g. 25232930"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Default Rate (₹)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                value={formData.default_rate}
                onChange={(e) => setFormData({ ...formData, default_rate: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Min Stock Level</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                value={formData.minimum_stock_level}
                onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="material-active"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="material-active" className="text-sm font-medium text-gray-600">Is Active</label>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMaterialModal;
