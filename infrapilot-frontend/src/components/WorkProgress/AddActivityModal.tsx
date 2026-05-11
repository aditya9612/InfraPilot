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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300";

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
                required type="text" placeholder="e.g. Excavation, RCC, Brickwork"
                className={inputClasses}
                value={formData.activity_name} onChange={e => setFormData({...formData, activity_name: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClasses}>BOQ Reference Code</label>
              <input 
                type="number" placeholder="Enter numeric code"
                className={inputClasses}
                value={formData.boq_code} onChange={e => setFormData({...formData, boq_code: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClasses}>Current Status*</label>
              <select className={inputClasses} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
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
                required type="number" min="0" step="any"
                className={inputClasses}
                value={formData.planned_quantity} onChange={e => setFormData({...formData, planned_quantity: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className={labelClasses}>Unit of Measure*</label>
              <select className={inputClasses} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
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
                required type="date" className={inputClasses}
                value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClasses}>Estimated Completion*</label>
              <input 
                required type="date" className={inputClasses}
                value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddActivityModal;
