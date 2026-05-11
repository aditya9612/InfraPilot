import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { DailyEntry } from "../../types/workProgress";

interface EditDailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: { today_progress: number; remarks: string }) => Promise<void>;
  entry: DailyEntry | null;
}

const EditDailyEntryModal = ({ isOpen, onClose, onSubmit, entry }: EditDailyEntryModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    today_progress: 0,
    remarks: ""
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        today_progress: entry.today_progress,
        remarks: entry.remarks
      });
    }
  }, [entry]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    setIsSubmitting(true);
    try {
      await onSubmit(entry.id, formData);
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
        form="edit-daily-entry-form"
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isSubmitting ? "Syncing..." : "Update Field Record"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Field Record" footer={modalFooter} maxWidth="max-w-lg">
      <form id="edit-daily-entry-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Execution Logistics
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Quantity Executed*</label>
              <input 
                required type="number" min="0" step="any" className={inputClasses}
                value={formData.today_progress} onChange={e => setFormData({...formData, today_progress: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className={labelClasses}>Operational Narrative</label>
              <textarea 
                rows={3} className={`${inputClasses} resize-none font-inter italic-none`}
                placeholder="Optional remarks..."
                value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditDailyEntryModal;
