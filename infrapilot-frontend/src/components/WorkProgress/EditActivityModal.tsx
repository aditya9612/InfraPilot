import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { ActivityItem, UpdateActivityRequest } from "../../types/workProgress";
import { masterService } from "../../services/masterService";
import { projectService } from "../../services/projectService";

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateActivityRequest) => Promise<void>;
  activity: ActivityItem | null;
}

const uniqueById = (arr: any[]) => {
  const seen = new Set();
  return arr.filter(item => {
    const id = item.id || item.user_id || item.name;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};


const EditActivityModal = ({ isOpen, onClose, onSubmit, activity }: EditActivityModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateActivityRequest>({
    activity_name: "",
    planned_quantity: 0,
    unit: "Cum",
    start_date: "",
    end_date: "",
    status: "NOT_STARTED",
    engineer_id: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unitList, setUnitList] = useState<any[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      masterService.getEntities("units")
        .then(res => setUnitList(uniqueById(Array.isArray(res) ? res : [])))
        .catch(err => console.error("Failed to fetch units", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activity?.project_id) {
      projectService.getProjectMembers(activity.project_id)
        .then(mems => {
          const memberList = Array.isArray(mems) ? mems : (mems.items || mems.data || []);
          const engineers = memberList.filter((m: any) =>
            (m.role === 'SiteEngineer' || m.role?.name === 'SiteEngineer' || m.user?.role === 'SiteEngineer')
          ).map((m: any) => ({
            id: m.user_id || m.id || m.user?.id,
            name: m.full_name || m.name || m.user?.full_name || `Engineer #${m.user_id || m.id}`
          }));
          setSiteEngineers(uniqueById(engineers));
        })
        .catch(err => console.error("Failed to fetch site engineers", err));
    }
  }, [isOpen, activity?.project_id]);

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name,
        planned_quantity: activity.planned_quantity,
        unit: activity.unit,
        start_date: activity.start_date,
        end_date: activity.end_date,
        status: activity.status,
        engineer_id: activity.engineer_id
      });
    }
  }, [activity]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.activity_name?.trim()) {
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
    if (!activity || !validate()) return;
    setIsSubmitting(true);
    try {
      // Status is already in backend enum format (NOT_STARTED, ON_TRACK, DELAY, COMPLETED)
      await onSubmit(activity.id, formData);
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
        form="edit-activity-form"
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isSubmitting ? "Updating..." : "Edit Activity Record"}
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
                required type="text" name="activity_name"
                className={inputClasses(errors.activity_name)}
                value={formData.activity_name} onChange={handleChange}
              />
              {errors.activity_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.activity_name}</p>}
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
                required type="number" name="planned_quantity" min="0" step="any"
                className={inputClasses(errors.planned_quantity)}
                value={formData.planned_quantity} onChange={e => setFormData({ ...formData, planned_quantity: Number(e.target.value) })}
              />
              {errors.planned_quantity && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.planned_quantity}</p>}
            </div>
            <div>
              <label className={labelClasses}>Unit of Measure*</label>
              <select name="unit" className={inputClasses()} value={formData.unit} onChange={handleChange}>
                <option value="">Select Unit</option>
                {unitList.map(u => <option key={u.id || u.name} value={u.name}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between">
              Re-Assignment
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional</span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClasses}>Assigned Site Engineer</label>
                <select
                  name="engineer_id"
                  className={inputClasses()}
                  value={formData.engineer_id || ""}
                  onChange={(e) => setFormData({ ...formData, engineer_id: Number(e.target.value) || undefined })}
                >
                  <option value="">No Assignment (Select to Assign)</option>
                  {siteEngineers.map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-400 font-medium ml-1 italic font-inter">
                  Update the engineer responsible for this activity.
                </p>
              </div>
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

export default EditActivityModal;
