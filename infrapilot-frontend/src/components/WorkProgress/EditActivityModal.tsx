import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { ActivityItem, UpdateActivityRequest } from "../../types/workProgress";

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateActivityRequest) => Promise<void>;
  activity: ActivityItem | null;
}

const UNITS = ["Cum", "Sqm", "Rft", "Nos", "Kg", "Ton", "Bag"];
const STATUSES = ["Not Started", "On Track", "Delay"];

const EditActivityModal = ({ isOpen, onClose, onSubmit, activity }: EditActivityModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateActivityRequest>({
    activity_name: "",
    planned_quantity: 0,
    unit: "Cum",
    start_date: "",
    end_date: "",
    status: "Not Started"
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name,
        planned_quantity: activity.planned_quantity,
        unit: activity.unit,
        start_date: activity.start_date,
        end_date: activity.end_date,
        status: activity.status
      });
    }
  }, [activity]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    setIsSubmitting(true);
    try {
      await onSubmit(activity.id, formData);
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
        form="edit-activity-form"
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isSubmitting ? "Updating..." : "Synchronize Record"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modify Activity Registry" footer={modalFooter} maxWidth="max-w-2xl">
      <form id="edit-activity-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Activity Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClasses}>Activity Name*</label>
              <input 
                required type="text"
                className={inputClasses}
                value={formData.activity_name} onChange={e => setFormData({...formData, activity_name: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Current Operational Status*</label>
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
              <label className={labelClasses}>Provisioned Quantity*</label>
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

export default EditActivityModal;
