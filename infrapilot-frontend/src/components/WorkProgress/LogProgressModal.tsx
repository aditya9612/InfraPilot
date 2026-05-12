import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { ActivityItem, DailyProgressRequest } from "../../types/workProgress";

interface LogProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DailyProgressRequest) => Promise<void>;
  activity: ActivityItem | null;
  activitiesList?: ActivityItem[]; // List for selection if activity is null
  engineerId: number;
}

const LogProgressModal = ({ isOpen, onClose, onSubmit, activity, activitiesList = [], engineerId }: LogProgressModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activity_id: "",
    entry_date: new Date().toISOString().split("T")[0],
    today_progress: 0,
    remarks: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        activity_id: activity ? String(activity.id) : "",
        entry_date: new Date().toISOString().split("T")[0],
        today_progress: 0,
        remarks: ""
      });
    }
  }, [isOpen, activity]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.activity_id) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        activity_id: Number(formData.activity_id),
        entry_date: formData.entry_date,
        today_progress: formData.today_progress,
        remarks: formData.remarks,
        created_by: engineerId
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300";

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
        className={`px-8 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isSubmitting ? "Syncing..." : "Commit Field Progress"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Field Provisioning" footer={modalFooter} maxWidth="max-w-lg">
      <form id="log-progress-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Context Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Operational Context
          </h3>
          {activity ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logging For</p>
              <h4 className="text-lg font-bold text-slate-800">{activity.activity_name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-slate-500">Current: {activity.completion_percentage.toFixed(1)}%</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activity.unit}</span>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClasses}>Select Target Activity*</label>
              <select
                required
                className={inputClasses}
                value={formData.activity_id}
                onChange={e => setFormData({ ...formData, activity_id: e.target.value })}
              >
                <option value="">Select from project registry</option>
                {activitiesList.map(a => (
                  <option key={a.id} value={a.id}>{a.activity_name} ({a.boq_code || "No BOQ"})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Execution Metrics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Execution Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Field Log Date*</label>
              <input
                required type="date" className={inputClasses}
                value={formData.entry_date} onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Quantity Executed {selectedActivity ? `(${selectedActivity.unit})` : ""}*</label>
              <input
                required type="number" min="0" step="any" placeholder="Enter field volume"
                className={inputClasses}
                value={formData.today_progress} onChange={e => setFormData({ ...formData, today_progress: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Field Narrative
          </h3>
          <textarea
            rows={3} placeholder="Describe site conditions or obstacles (optional)..."
            className={`${inputClasses} resize-none font-inter`}
            value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};

export default LogProgressModal;
