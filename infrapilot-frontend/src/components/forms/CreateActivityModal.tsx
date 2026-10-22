import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Check } from "lucide-react";
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
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const resolveUnitId = (unitVal: any, unitList: MasterEntity[]) => {
      if (!unitVal && unitVal !== 0) return "";
      if (typeof unitVal === "object" && unitVal !== null) {
        if (unitVal.id) return unitVal.id;
        unitVal = unitVal.name || "";
      }
      const strVal = String(unitVal).trim();
      const byId = unitList.find((u) => String(u.id) === strVal);
      if (byId) return byId.id;
      const byName = unitList.find(
        (u) => u.name && u.name.trim().toLowerCase() === strVal.toLowerCase()
      );
      if (byName) return byName.id;
      return unitVal;
    };

    const loadModalData = async () => {
      if (!isOpen) return;

      let currentUnits = units;
      if (currentUnits.length === 0) {
        setIsLoadingUnits(true);
        try {
          currentUnits = await masterService.getEntities("units");
          if (!isCancelled) setUnits(currentUnits);
        } catch (error) {
          console.error("Failed to fetch units", error);
        } finally {
          if (!isCancelled) setIsLoadingUnits(false);
        }
      }

      if (initialData) {
        const rawUnit = initialData.default_unit_id ?? initialData.unit_id ?? initialData.unitId ?? initialData.unit ?? "";
        const resolvedUnitId = resolveUnitId(rawUnit, currentUnits);

        if (!isCancelled) {
          setFormData({
            ...initialData,
            default_unit_id: resolvedUnitId,
            is_active: initialData.is_active ?? true,
            type: "Activity"
          });
        }
      } else {
        if (!isCancelled) {
          setFormData({
            name: "",
            category: "",
            default_unit_id: "",
            is_active: true,
            type: "Activity"
          });
        }
      }
      if (!isCancelled) setErrors({});
    };

    loadModalData();

    return () => {
      isCancelled = true;
    };
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Activity name is required.";
    if (!formData.category.trim()) newErrors.category = "Category is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setErrors({});
    const submitData = { ...formData };
    if (submitData.default_unit_id === "") {
      delete (submitData as any).default_unit_id;
    }
    onSubmit(submitData);
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
        {initialData ? "Save changes" : "Save Activity type"}
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

          <div className="space-y-1 relative" ref={unitDropdownRef}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Default Unit
            </label>
            <button
              type="button"
              disabled={isLoadingUnits}
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm font-medium flex items-center justify-between text-left transition-all ${
                errors.default_unit_id
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
              } ${isUnitDropdownOpen ? "border-primary ring-2 ring-primary/20 bg-white" : ""}`}
            >
              <span className={formData.default_unit_id ? "text-slate-800 font-semibold" : "text-gray-400"}>
                {units.find(u => String(u.id) === String(formData.default_unit_id))?.name || (isLoadingUnits ? "Loading units..." : "Select Unit")}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUnitDropdownOpen ? "rotate-180 text-primary" : ""}`} />
            </button>

            {isUnitDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-50 py-1">
                <div
                  onClick={() => {
                    setFormData({ ...formData, default_unit_id: "" });
                    setIsUnitDropdownOpen(false);
                  }}
                  className="h-10 px-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <span>Select Unit</span>
                  {!formData.default_unit_id && <Check className="w-4 h-4 text-primary" />}
                </div>
                {units.map((unit) => {
                  const isSelected = String(unit.id) === String(formData.default_unit_id);
                  return (
                    <div
                      key={unit.id}
                      onClick={() => {
                        setFormData({ ...formData, default_unit_id: unit.id });
                        setIsUnitDropdownOpen(false);
                      }}
                      className={`h-10 px-3.5 flex items-center justify-between cursor-pointer text-sm font-medium transition-colors ${
                        isSelected ? "bg-primary/5 text-primary font-semibold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{unit.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.default_unit_id && (
              <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.default_unit_id}</p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateActivityModal;
