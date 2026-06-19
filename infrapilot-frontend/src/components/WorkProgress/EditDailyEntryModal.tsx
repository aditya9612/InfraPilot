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
    today_progress: "" as any,
    remarks: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && entry) {
      setFormData({
        today_progress: entry.today_progress === 0 ? "" : entry.today_progress,
        remarks: entry.remarks
      });
    }
  }, [isOpen, entry]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (formData.today_progress !== "" && formData.today_progress !== undefined) {
      if (Number(formData.today_progress) < 0) {
        errs.today_progress = "Quantity cannot be negative";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!entry || !validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(entry.id, formData);
      setErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let val: any = value;
    if (name === "today_progress") {
      val = value === "" ? "" : Number(value);
      if (typeof val === "number" && val < 0) return;
    }
    setFormData(prev => ({ ...prev, [name]: val }));
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
        form="edit-daily-entry-form"
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isSubmitting ? "Syncing..." : "Update Daily Entry"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Daily Entry" footer={modalFooter} maxWidth="max-w-2xl">
      <form id="edit-daily-entry-form" onSubmit={handleSubmit} className="space-y-6 p-2 font-inter">
        {/* Basic Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Basic Information
          </h3>
          <div>
            <label className={labelClasses}>Entry Date</label>
            <input
              type="date"
              disabled
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 outline-none transition-all font-inter"
              value={entry?.entry_date || ""}
            />
          </div>
        </div>

        {/* Execution Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Execution Details
          </h3>
          <div>
            <label className={labelClasses}>Today Progress</label>
            <input
              type="number" name="today_progress" min="0" step="any" placeholder="Enter quantity"
              className={inputClasses(errors.today_progress)}
              value={formData.today_progress} onChange={handleChange}
            />
            {errors.today_progress && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.today_progress}</p>}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Additional Information
          </h3>
          <label className={labelClasses}>Remarks</label>
          <textarea
            name="remarks" rows={3} className={`${inputClasses(errors.remarks)} resize-none font-inter`}
            placeholder="Describe site conditions or progress..."
            value={formData.remarks} onChange={handleChange}
          />
          {errors.remarks && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.remarks}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default EditDailyEntryModal;
