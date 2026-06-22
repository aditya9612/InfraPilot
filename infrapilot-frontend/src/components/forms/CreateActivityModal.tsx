import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { masterService, type MasterEntity } from "../../services/masterService";

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    default_unit_id: "" as string | number,
    is_active: true,
    type: "Activity"
  });

  const [units, setUnits] = useState<MasterEntity[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      try {
        const data = await masterService.getEntities("units");
        setUnits(data);
      } catch (error) {
        console.error("Failed to fetch units", error);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    if (isOpen) fetchUnits();

    if (initialData) {
      setFormData({
        ...initialData,
        default_unit_id: initialData.default_unit_id ?? "",
        is_active: initialData.is_active ?? true,
        type: "Activity"
      });
    } else {
      setFormData({
        name: "",
        category: "",
        default_unit_id: "",
        is_active: true,
        type: "Activity"
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Activity name is required.";
    if (!formData.category.trim()) newErrors.category = "Category is required.";
    if (!formData.default_unit_id) newErrors.default_unit_id = "Default unit is required.";

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
        form="activity-master-form"
        type="submit"
        className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        {initialData ? "Save changes" : "Create activity"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Activity Type" : "Create Activity Type"}
      footer={modalFooter}
    >
      <form id="activity-master-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Activity Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Excavation"
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
              placeholder="e.g. Civil Work"
              className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.category ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            {errors.category && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Default Unit <span className="text-rose-500">*</span>
              </label>
              <select
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${errors.default_unit_id ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                value={formData.default_unit_id}
                onChange={(e) => setFormData({ ...formData, default_unit_id: e.target.value })}
                disabled={isLoadingUnits}
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.default_unit_id && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.default_unit_id}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="activity-active"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="activity-active" className="text-sm font-medium text-gray-600">
                Is Active
              </label>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateActivityModal;
