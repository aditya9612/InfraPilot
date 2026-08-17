import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { ActivityItem, DailyProgressRequest } from "../../types/workProgress";

interface LogProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DailyProgressRequest) => Promise<void>;
  activity: ActivityItem | null;
  activitiesList?: ActivityItem[];
  engineerId: number;
}

const LogProgressModal = ({ isOpen, onClose, onSubmit, activity, activitiesList = [], engineerId }: LogProgressModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activity_id: "",
    entry_date: new Date().toISOString().split("T")[0],
    today_progress: "" as any,
    remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        activity_id: activity ? String(activity.id) : "",
        entry_date: new Date().toISOString().split("T")[0],
        today_progress: "" as any,
        remarks: "",
      });
      setErrors({});
    }
  }, [isOpen, activity]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.activity_id) errs.activity_id = "Activity selection is required";
    if (!formData.entry_date) errs.entry_date = "Date is required";
    if (!formData.today_progress || formData.today_progress <= 0) {
      errs.today_progress = "Executed quantity must be greater than 0";
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
        activity_id: Number(formData.activity_id),
        entry_date: formData.entry_date,
        today_progress: formData.today_progress,
        remarks: formData.remarks,
        created_by: engineerId,
      });
      setErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let val: any = value;
    if (name === "today_progress") {
      val = value === "" ? "" : Number(value);
      if (typeof val === "number" && val < 0) return;
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors(prev => { const { [name]: _, ...rest } = prev; return rest; });
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
  const inputClasses = (error?: string) =>
    `w-full px-4 py-2.5 bg-white border ${error ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-primary/20 focus:border-primary"} rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 font-inter`;

  const selectedActivity = activity || activitiesList.find(a => String(a.id) === formData.activity_id);

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
        form="log-progress-form"
        type="submit"
        disabled={isSubmitting || !formData.activity_id}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
      >
        {isSubmitting ? "Syncing..." : "Add Daily Progress"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Daily Progress" footer={modalFooter} maxWidth="max-w-2xl">
      <form id="log-progress-form" onSubmit={handleSubmit} className="space-y-6 p-2 font-inter">

        {/* Basic Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
          {activity ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logging For</p>
              <h4 className="text-lg font-bold text-slate-800">{activity.activity_name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-slate-500">Current: {Number(activity.completion_percentage || 0).toFixed(1)}%</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activity.unit}</span>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClasses}>Select Target Activity *</label>
              <select
                required name="activity_id"
                className={inputClasses(errors.activity_id)}
                value={formData.activity_id} onChange={handleChange}
              >
                <option value="">Select from project registry</option>
                {activitiesList.map(a => (
                  <option key={a.id} value={a.id}>{a.activity_name}</option>
                ))}
              </select>
              {errors.activity_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.activity_id}</p>}
            </div>
          )}
        </div>

        {/* Execution Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Execution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Entry Date <span className="text-rose-500">*</span></label>
              <input
                required type="date" name="entry_date"
                className={inputClasses(errors.entry_date)}
                value={formData.entry_date} onChange={handleChange}
              />
              {errors.entry_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.entry_date}</p>}
            </div>
            <div>
              <label className={labelClasses}>
                Today Progress{selectedActivity ? ` (${selectedActivity.unit}) — Remaining: ${selectedActivity.remaining_quantity || 0}` : ""} <span className="text-rose-500">*</span>
              </label>
              <input
                required type="number" name="today_progress" min="0" step="any" placeholder="Enter quantity"
                className={`${inputClasses(errors.today_progress)} ${selectedActivity && selectedActivity.remaining_quantity <= 0 ? "bg-slate-50 cursor-not-allowed opacity-60" : ""}`}
                value={formData.today_progress} onChange={handleChange}
                disabled={!!(selectedActivity && selectedActivity.remaining_quantity <= 0)}
              />
              {errors.today_progress && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.today_progress}</p>}
              {selectedActivity && selectedActivity.remaining_quantity <= 0 && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">Quantity fully utilized.</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Additional Information</h3>
          <label className={labelClasses}>Remarks</label>
          <textarea
            name="remarks" rows={3} placeholder="Describe site conditions or progress..."
            className={`${inputClasses(errors.remarks)} resize-none`}
            value={formData.remarks} onChange={handleChange}
          />
          {errors.remarks && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.remarks}</p>}
        </div>

      </form>
    </Modal>
  );
};

export default LogProgressModal;
