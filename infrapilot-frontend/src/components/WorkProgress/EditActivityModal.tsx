import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { ActivityItem, UpdateActivityRequest } from "../../types/workProgress";
import { projectService } from "../../services/projectService";
import { boqService } from "../../services/boqService";
import api from "../../services/api";

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateActivityRequest) => Promise<void>;
  activity: ActivityItem | null;
}

const uniqueById = (arr: any[]) => {
  const seen = new Set();
  return arr.filter(item => {
    const id = item.id || item.boq_id || item.user_id || item.boq_code;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const EditActivityModal = ({ isOpen, onClose, onSubmit, activity }: EditActivityModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateActivityRequest>({
    boq_item_id: undefined,
    work_order_id: undefined,
    start_date: "",
    end_date: "",
    engineer_id: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allBoqs, setAllBoqs] = useState<any[]>([]);
  const [allWorkOrders, setAllWorkOrders] = useState<any[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && activity?.project_id) {
      const pid = activity.project_id;
      // Fetch BOQs
      boqService.getBoqs({ limit: 100, project_id: pid })
        .then(boqs => {
          const items = Array.isArray(boqs.items) ? boqs.items : [];
          setAllBoqs(uniqueById(items));
        })
        .catch(err => {
          console.error("Failed to fetch all BOQs", err);
          setAllBoqs([]);
        });
      // Fetch Work Orders
      const woParams: any = { project_id: pid };
      if (formData.boq_item_id) {
        woParams.boq_id = formData.boq_item_id;
      }
      api.get(`/work-orders`, { params: woParams })
        .then(woRes => {
          const items = Array.isArray(woRes.data) ? woRes.data : (woRes.data.items || []);
          setAllWorkOrders(uniqueById(items));
        })
        .catch(err => {
          console.error("Failed to fetch all Work Orders", err);
          setAllWorkOrders([]);
        });
    }
  }, [isOpen, activity?.project_id, formData.boq_item_id]);

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
        boq_item_id: activity.boq_item_id || undefined,
        work_order_id: activity.work_order_id || undefined,
        start_date: activity.start_date || "",
        end_date: activity.end_date || "",
        engineer_id: activity.engineer_id || undefined
      });
    }
  }, [activity]);

  const validate = () => {
    const errs: Record<string, string> = {};

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
    setFormData(prev => {
      const parsedValue = (name === "boq_item_id" || name === "work_order_id" || name === "engineer_id") && value
        ? Number(value)
        : value;

      const newData = { ...prev, [name]: parsedValue };
      if (name === "boq_item_id") {
        newData.work_order_id = undefined;
      }
      return newData;
    });
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
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between">
            Activity Mapping
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>BOQ Item</label>
              <select
                name="boq_item_id"
                className={inputClasses()}
                value={formData.boq_item_id || ""}
                onChange={handleChange}
              >
                <option value="">Select BOQ Item</option>
                {allBoqs.map(b => (
                  <option key={b.id || b.boq_id} value={b.id || b.boq_id}>
                    {b.item_name || `BOQ #${b.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Work Order</label>
              <select
                name="work_order_id"
                className={inputClasses()}
                value={formData.work_order_id || ""}
                onChange={handleChange}
              >
                <option value="">Select Work Order</option>
                {allWorkOrders.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.work_description || w.work_order_number || `Work Order #${w.id}`}
                  </option>
                ))}
              </select>
            </div>
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
                onChange={(e) => setFormData({ ...formData, engineer_id: e.target.value ? Number(e.target.value) : undefined })}
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
