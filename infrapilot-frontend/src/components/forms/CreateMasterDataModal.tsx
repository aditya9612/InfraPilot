import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

interface CreateMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateMasterDataModal: React.FC<CreateMasterDataModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    type: "Material",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        code: "",
        category: "",
        type: "Material",
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        code: "",
        category: "",
        type: "Material",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Entity name is required.";
    if (!formData.code.trim()) newErrors.code = "Unique code is required.";
    if (!formData.category.trim()) newErrors.category = "Category group is required.";

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
        form="master-data-form"
        type="submit"
        className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        {initialData ? "Save changes" : "Create entity"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Master Entity" : "Create Master Entity"}
      footer={modalFooter}
    >
      <form id="master-data-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Entity configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Entity name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cement (OPC 53)"
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.name
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
              />
              {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Unique code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="MAT-CEM-01"
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-mono font-bold ${errors.code
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    if (errors.code) setErrors({ ...errors, code: "" });
                  }}
                />
                {errors.code && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.code}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  System type <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Material">Material</option>
                  <option value="Labour">Labour</option>
                  <option value="Activity">Activity</option>
                  <option value="Unit">Unit</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Category group <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Construction Material"
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.category
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: "" });
                }}
              />
              {errors.category && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.category}</p>}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMasterDataModal;
