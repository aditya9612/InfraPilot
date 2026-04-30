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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.category) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit(formData);
  };

  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
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
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Entity name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cement (OPC 53)"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Unique code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="MAT-CEM-01"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-mono font-bold"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  System type <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Material">Material</option>
                  <option value="Labor">Labor</option>
                  <option value="Activity">Activity</option>
                  <option value="Unit">Unit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Category group <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Construction Material"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMasterDataModal;
