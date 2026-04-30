import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { EquipmentItem, UpdateEquipmentRequest } from "../../services/equipmentService";

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateEquipmentRequest) => Promise<void>;
  equipment: EquipmentItem | null;
}

const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipment,
}) => {
  const [formData, setFormData] = useState<UpdateEquipmentRequest>({
    project_id: equipment?.project_id || 0,
    equipment_name: equipment?.equipment_name || "",
    equipment_code: equipment?.equipment_code || "",
    operator_name: equipment?.operator_name || "",
    working_hours: equipment?.working_hours || 0,
    fuel_used: equipment?.fuel_used || 0,
    condition: equipment?.condition || "good",
    rental_cost: equipment?.rental_cost || 0,
    maintenance_date: equipment?.maintenance_date || new Date().toISOString().split("T")[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setFormData({
        project_id: equipment.project_id,
        equipment_name: equipment.equipment_name,
        equipment_code: equipment.equipment_code,
        operator_name: equipment.operator_name,
        working_hours: equipment.working_hours,
        fuel_used: equipment.fuel_used,
        condition: equipment.condition,
        rental_cost: equipment.rental_cost,
        maintenance_date: equipment.maintenance_date,
      });
    }
  }, [equipment, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === "number" ? (value === "" ? 0 : Number(value)) : value;

    setFormData((prev: UpdateEquipmentRequest) => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors((prev: Record<string, string>) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.equipment_name?.trim()) errs.equipment_name = "Equipment Name is required";
    if (!formData.equipment_code?.trim()) errs.equipment_code = "Equipment Code is required";
    if (!formData.operator_name?.trim()) errs.operator_name = "Operator Name is required";
    if ((formData.working_hours ?? 0) <= 0) errs.working_hours = "Working hours must be greater than 0";
    if ((formData.fuel_used ?? 0) < 0) errs.fuel_used = "Fuel used cannot be negative";
    if ((formData.rental_cost ?? 0) < 0) errs.rental_cost = "Rental cost cannot be negative";
    if (!formData.maintenance_date) errs.maintenance_date = "Maintenance date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || !validate()) return;

    setIsLoading(true);
    try {
      await onSubmit(equipment.id, formData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        form="edit-equipment-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Update Equipment"}
      </button>
    </>
  );

  if (!isOpen || !equipment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Equipment Log"
      footer={modalFooter}
      maxWidth="max-w-4xl"
    >
      <form id="edit-equipment-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Identity & Operator */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Identity & Operator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="equipment_name"
                value={formData.equipment_name || ""}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.equipment_name ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.equipment_name && (
                <p className="text-red-500 text-[10px] mt-1">{errors.equipment_name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Equipment Code <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="equipment_code"
                value={formData.equipment_code || ""}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.equipment_code ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.equipment_code && (
                <p className="text-red-500 text-[10px] mt-1">{errors.equipment_code}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Operator Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="operator_name"
                value={formData.operator_name || ""}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.operator_name ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.operator_name && (
                <p className="text-red-500 text-[10px] mt-1">{errors.operator_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Technicals & Commercials */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Technicals & Commercials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Engine Hours <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="working_hours"
                value={formData.working_hours || 0}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.working_hours ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.working_hours && (
                <p className="text-red-500 text-[10px] mt-1">{errors.working_hours}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Fuel Used (Ltr) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="fuel_used"
                value={formData.fuel_used || 0}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.fuel_used ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.fuel_used && (
                <p className="text-red-500 text-[10px] mt-1">{errors.fuel_used}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition || "good"}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all"
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Needs Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Rental Cost <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="rental_cost"
                value={formData.rental_cost || 0}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.rental_cost ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.rental_cost && (
                <p className="text-red-500 text-[10px] mt-1">{errors.rental_cost}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Maintenance Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                name="maintenance_date"
                value={formData.maintenance_date || ""}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.maintenance_date ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.maintenance_date && (
                <p className="text-red-500 text-[10px] mt-1">{errors.maintenance_date}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditEquipmentModal;
