import { useState, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { CreateActivityRequest } from "../../types/workProgress";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityRequest) => Promise<void>;
  projectId: number;
  engineerId: number;
}

const UNITS = ["Cum", "Sqm", "Rft", "Nos", "Kg", "Ton", "Bag"];
const STATUSES = ["Not Started", "On Track", "Delay"];

const AddActivityModal = ({ isOpen, onClose, onSubmit, projectId, engineerId }: AddActivityModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activity_name: "",
    boq_code: "" as any,
    planned_quantity: 0,
    unit: "Cum",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "Not Started"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.activity_name.trim()) {
      errs.activity_name = "Activity name is required";
    } else if (/[0-9]/.test(formData.activity_name)) {
      errs.activity_name = "Activity name must be alphabetic only (no numbers)";
    }

    if (!formData.planned_quantity || formData.planned_quantity <= 0) {
      errs.planned_quantity = "Planned quantity must be greater than 0";
    }

    if (!formData.start_date) errs.start_date = "Start date is required";
    if (!formData.end_date) errs.end_date = "End date is required";
    
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errs.end_date = "End date cannot be before start date";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        project_id: projectId,
        engineer_id: engineerId,
        boq_code: formData.boq_code ? Number(formData.boq_code) : null
      });
      setFormData({
        activity_name: "",
        boq_code: "",
        planned_quantity: 0,
        unit: "Cum",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        status: "Not Started"
      });
      setErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "activity_name" && /[0-9]/.test(value)) {
        setErrors(prev => ({ ...prev, [name]: "Numbers are not allowed in activity name" }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => {
            const { [name]: _, ...rest } = prev;
            return rest;
        });
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
  const inputClasses = (error?: string) => `
    w-full px-4 py-2.5 bg-white border 
    ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
    rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 font-inter
  `;

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="add-activity-form"
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isSubmitting ? "Provisioning..." : "Add Activity Entry"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Activity Registry" footer={modalFooter} maxWidth="max-w-2xl">
      <form id="add-activity-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between">
            Activity Identity
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Fields *</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClasses}>Activity Name*</label>
              <input 
                required type="text" name="activity_name" placeholder="e.g. Excavation, RCC, Brickwork"
                className={inputClasses(errors.activity_name)}
                value={formData.activity_name} onChange={handleChange}
              />
              {errors.activity_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.activity_name}</p>}
            </div>
            <div>
              <label className={labelClasses}>BOQ Reference Code</label>
              <input 
                type="number" name="boq_code" placeholder="Enter numeric code"
                className={inputClasses()}
                value={formData.boq_code} onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClasses}>Current Status*</label>
              <select name="status" className={inputClasses()} value={formData.status} onChange={handleChange}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Logistics & Metrics Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Logistics & Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Planned Quantity*</label>
              <input 
                required type="number" name="planned_quantity" min="0" step="any"
                className={inputClasses(errors.planned_quantity)}
                value={formData.planned_quantity} onChange={e => setFormData({...formData, planned_quantity: Number(e.target.value)})}
              />
              {errors.planned_quantity && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.planned_quantity}</p>}
            </div>
            <div>
              <label className={labelClasses}>Unit of Measure*</label>
              <select name="unit" className={inputClasses()} value={formData.unit} onChange={handleChange}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Execution Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Mobilization Date*</label>
              <input 
                required type="date" name="start_date" className={inputClasses(errors.start_date)}
                value={formData.start_date} onChange={handleChange}
              />
              {errors.start_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelClasses}>Estimated Completion*</label>
              <input 
                required type="date" name="end_date" className={inputClasses(errors.end_date)}
                value={formData.end_date} onChange={handleChange}
              />
              {errors.end_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.end_date}</p>}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddActivityModal;
