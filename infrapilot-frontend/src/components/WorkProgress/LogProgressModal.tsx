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
  const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success', message: string, fields?: string[] } | null>(null);

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
    const errorFields: string[] = [];

    if (!formData.activity_id) {
      errs.activity_id = "Activity selection is required";
      errorFields.push("Target Activity");
    }
    if (!formData.entry_date) {
      errs.entry_date = "Date is required";
      errorFields.push("Entry Date");
    }
    if (!formData.today_progress || formData.today_progress <= 0) {
      errs.today_progress = "Executed quantity must be greater than 0";
      errorFields.push("Today Progress");
    }

    if (Object.keys(errs).length > 0) {
      setFormNotification({ type: 'error', message: 'Please fill in all mandatory details correctly.', fields: errorFields });
      setTimeout(() => setFormNotification(null), 5000);
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
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

  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1 font-inter";
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
        {isSubmitting ? "Saving..." : "Save daily progress"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Daily Progress" footer={modalFooter} maxWidth="max-w-2xl">
      <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideDownIn {
              from { transform: translateY(-100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
          }
      `}} />
      
      {/* Top-right floating toast */}
      {formNotification && (
        <div
          style={{
            position: 'fixed',
            top: '18px',
            right: '18px',
            zIndex: 99999,
            minWidth: '260px',
            maxWidth: '380px',
            animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <style>{`
            @keyframes slideDownIn {
              from { opacity: 0; transform: translateY(-16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div
            className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)', border: '1px solid #f1f5f9' }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
              }`}>
              <span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
              {formNotification.type === 'error'
                ? `Please fill in all mandatory details correctly. \nMissing: ${(formNotification.fields || []).join(', ')}`
                : formNotification.message}
            </p>
            <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
          </div>
        </div>
      )}

      <form id="log-progress-form" onSubmit={handleSubmit} className="space-y-6 p-2 font-inter relative">
        {/* Inline Validation Error Banner */}
        {formNotification && formNotification.type === 'error' && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-600">Validation Error</p>
              <p className="text-xs text-red-500 mt-0.5">Please provide all required information to continue.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(formNotification.fields || []).map(field => (
                  <span key={field} className="px-2 py-1 bg-white border border-red-100 rounded text-[10px] font-bold text-red-600 uppercase tracking-wider">
                    {field}
                  </span>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">Basic Information</h3>
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
              <label className={labelClasses}>Select Target Activity <span className="text-rose-500">*</span></label>
              <select
                name="activity_id"
                className={inputClasses(errors.activity_id)}
                value={formData.activity_id} onChange={handleChange}
              >
                <option value="">Select from project registry</option>
                {activitiesList.map(a => (
                  <option key={a.id} value={a.id}>{a.activity_name}</option>
                ))}
              </select>
              {errors.activity_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-wider">REQUIRED</p>}
            </div>
          )}
        </div>

        {/* Execution Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">Execution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Entry Date <span className="text-rose-500">*</span></label>
              <input
                type="date" name="entry_date"
                className={inputClasses(errors.entry_date)}
                value={formData.entry_date} onChange={handleChange}
              />
              {errors.entry_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-wider">REQUIRED</p>}
            </div>
            <div>
              <label className={labelClasses}>
                Today Progress{selectedActivity ? ` (${selectedActivity.unit}) — Remaining: ${selectedActivity.remaining_quantity || 0}` : ""} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number" name="today_progress" min="0" step="any" placeholder="Enter quantity"
                className={`${inputClasses(errors.today_progress)} ${selectedActivity && selectedActivity.remaining_quantity <= 0 ? "bg-slate-50 cursor-not-allowed opacity-60" : ""}`}
                value={formData.today_progress} onChange={handleChange}
                disabled={!!(selectedActivity && selectedActivity.remaining_quantity <= 0)}
              />
              {errors.today_progress && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-wider">REQUIRED</p>}
              {selectedActivity && selectedActivity.remaining_quantity <= 0 && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">Quantity fully utilized.</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">Additional Information</h3>
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
