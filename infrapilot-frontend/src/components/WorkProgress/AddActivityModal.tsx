import { useState, useEffect, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { CreateActivityRequest } from "../../types/workProgress";
import { projectService } from "../../services/projectService";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityRequest) => Promise<void>;
  projectId: number;
  engineerId: number;
}

import { boqService } from "../../services/boqService";
import api from "../../services/api";
import { masterService } from "../../services/masterService";

const uniqueById = (arr: any[]) => {
  const seen = new Set();
  return arr.filter(item => {
    const id = item.id || item.boq_id || item.user_id || item.boq_item_id || item.boq_code;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const AddActivityModal = ({ isOpen, onClose, onSubmit, projectId, engineerId }: AddActivityModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    project_id: "",
    activity_name: "",
    boq_item_id: "" as any,
    planned_quantity: "" as any,
    unit: "CUM",
    start_date: "",
    end_date: "",
    status: "NOT_STARTED",
    work_order_id: "" as any,
    engineer_id: "" as any
  });

  const [allBoqs, setAllBoqs] = useState<any[]>([]);
  const [allWorkOrders, setAllWorkOrders] = useState<any[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, project_id: "" }));

      const fetchAllData = async () => {
        try {
          let projectsList = [];
          if (user?.role === "ProjectManager") {
            projectsList = await projectService.getAssignedProjects(Number(user.id));
          } else {
            const res = await projectService.getProjects(100, 0);
            projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
          }
          setProjects(uniqueById(projectsList));
        } catch (err) {
          console.error("Failed to fetch projects", err);
        }

        try {
          const boqs = await boqService.getBoqs({ limit: 100 });
          const items = Array.isArray(boqs.items) ? boqs.items : [];
          setAllBoqs(uniqueById(items));
        } catch (err) {
          console.error("Failed to fetch all BOQs", err);
          setAllBoqs([]);
        }


        try {
          const woRes = await api.get(`/work-orders`).catch(() => ({ data: [] }));
          const items = Array.isArray(woRes.data) ? woRes.data : (woRes.data.items || []);
          setAllWorkOrders(uniqueById(items));
        } catch (err) {
          console.error("Failed to fetch all Work Orders", err);
          setAllWorkOrders([]);
        }

        try {
          const unitsRes = await masterService.getEntities("units");
          setUnitList(Array.isArray(unitsRes) ? unitsRes : []);
        } catch (err) {
          console.error("Failed to fetch units", err);
        }

        try {
          const actTypes = await masterService.getEntities("activity-types");
          setActivityTypes(Array.isArray(actTypes) ? actTypes : []);
        } catch (err) {
          console.error("Failed to fetch activity types", err);
          setActivityTypes([]);
        }
      };

      fetchAllData();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSiteEngineers = async () => {
      try {
        const projectIdToFetch = Number(formData.project_id) || projectId;
        if (!projectIdToFetch) {
          setSiteEngineers([]);
          return;
        }
        const res = await projectService.getProjectMembers(projectIdToFetch);
        const allUsers = Array.isArray(res) ? res : (res.items || res.data || []);
        const engineers = allUsers
          .filter((u: any) => {
            const role = typeof u.role === 'string' ? u.role : u.role?.name || u.user?.role || '';
            const normalizedRole = role.toLowerCase().replace(/\s/g, '');
            const isEngineerRole = normalizedRole === 'siteengineer' || normalizedRole === 'engineer' || normalizedRole === 'member';

            // Ensure the user is assigned to the project. projectService.getProjectMembers
            // usually returns project-specific members, but add extra safety checks
            // for common shapes of member objects.
            const belongsToProject = (() => {
              try {
                if (!projectIdToFetch) return false;
                if (u.project_id && Number(u.project_id) === Number(projectIdToFetch)) return true;
                if (u.user && (u.user.project_id && Number(u.user.project_id) === Number(projectIdToFetch))) return true;
                const assigned = u.assigned_projects || u.projects || u.user?.assigned_projects || u.user?.projects;
                if (Array.isArray(assigned) && assigned.length > 0) {
                  return assigned.some((ap: any) => {
                    const id = ap?.id || ap?.project_id || ap;
                    return Number(id) === Number(projectIdToFetch);
                  });
                }
              } catch (e) {
                return false;
              }
              // fallback: if projectService returned members, assume they belong
              return true;
            })();

            return isEngineerRole && belongsToProject;
          })
          .map((u: any) => ({
            id: u.user_id || u.id || u.user?.id,
            name: u.full_name || u.name || u.user?.full_name || u.user?.name || `Engineer #${u.user_id || u.id}`
          }));
        setSiteEngineers(uniqueById(engineers));
      } catch (err) {
        console.error("Failed to fetch site engineers", err);
        setSiteEngineers([]);
      }
    };

    if (isOpen) {
      fetchSiteEngineers();
    }
  }, [isOpen, formData.project_id, projectId]);

  const displayedBoqs = formData.project_id ? allBoqs.filter(b => b.project_id == formData.project_id || !b.project_id) : allBoqs;
  const displayedWorkOrders = formData.project_id ? allWorkOrders.filter(w => w.project_id == formData.project_id || !w.project_id) : allWorkOrders;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.project_id) {
      errs.project_id = "Project selection is required";
    }

    if (!formData.activity_name.trim()) {
      errs.activity_name = "Activity name is required";
    } else if (/[0-9]/.test(formData.activity_name)) {
      errs.activity_name = "Activity name must be alphabetic only (no numbers)";
    }

    if (formData.planned_quantity === "" || formData.planned_quantity <= 0) {
      errs.planned_quantity = "Planned quantity must be greater than 0";
    }

    if (formData.work_order_id && formData.work_order_id <= 0) {
      errs.work_order_id = "Work Order ID must be greater than 0";
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
        project_id: Number(formData.project_id) || projectId,
        planned_quantity: Number(formData.planned_quantity),
        boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : null,
        work_order_id: formData.work_order_id ? Number(formData.work_order_id) : null,
        engineer_id: formData.engineer_id ? Number(formData.engineer_id) : (engineerId || null)
      });
      setFormData({
        project_id: "",
        activity_name: "",
        boq_item_id: "",
        planned_quantity: "",
        unit: "CUM",
        start_date: "",
        end_date: "",
        status: "NOT_STARTED",
        work_order_id: "" as any,
        engineer_id: "" as any
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
            <div>
              <label className={labelClasses}>Project*</label>
              <select
                name="project_id"
                className={inputClasses(errors.project_id)}
                value={formData.project_id}
                onChange={handleChange}
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>
                ))}
              </select>
              {errors.project_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.project_id}</p>}
            </div>
            <div>
              <label className={labelClasses}>Activity Name*</label>
              <select
                name="activity_name"
                className={inputClasses(errors.activity_name)}
                value={formData.activity_name}
                onChange={handleChange}
                required
              >
                <option value="">Select Activity Name</option>
                {activityTypes.map((act) => (
                  <option key={act.id || act.name} value={act.name}>
                    {act.name}
                  </option>
                ))}
              </select>
              {errors.activity_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.activity_name}</p>}
            </div>
            <div>
              <label className={labelClasses}>BOQ Item</label>
              <select
                name="boq_item_id"
                className={inputClasses(errors.boq_item_id)}
                value={formData.boq_item_id}
                onChange={handleChange}
              >
                <option value="">Select BOQ Item</option>
                {displayedBoqs.map(b => (
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
                className={inputClasses(errors.work_order_id)}
                value={formData.work_order_id}
                onChange={handleChange}
              >
                <option value="">Select Work Order</option>
                {displayedWorkOrders.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.title || w.work_order_no || "Work Order"}
                  </option>
                ))}
              </select>
              {errors.work_order_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.work_order_id}</p>}
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between">
            Assignment
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClasses}>Assign Site Engineer</label>
              <select
                name="engineer_id"
                className={inputClasses()}
                value={formData.engineer_id}
                onChange={handleChange}
              >
                <option value="">No Assignment (Select to Assign)</option>
                {siteEngineers.map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-400 font-medium ml-1 italic font-inter">
                Assign this activity to a specific site engineer for execution tracking.
              </p>
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
                value={formData.planned_quantity} onChange={e => setFormData({ ...formData, planned_quantity: e.target.value })}
              />
              {errors.planned_quantity && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.planned_quantity}</p>}
            </div>
            <div>
              <label className={labelClasses}>Unit of Measure*</label>
              <select name="unit" className={inputClasses()} value={formData.unit} onChange={handleChange}>
                <option value="">Select Unit</option>
                {unitList.map(u => {
                  const unitCode = u.name?.match(/\(([^)]+)\)/)?.[1]?.toUpperCase() || u.name?.toUpperCase() || "";
                  return <option key={u.id || u.unique_code || u.name} value={unitCode}>{u.name}</option>;
                })}
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
              <label className={labelClasses}>Start Date*</label>
              <input
                required type="date" name="start_date" className={inputClasses(errors.start_date)}
                value={formData.start_date} onChange={handleChange}
              />
              {errors.start_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelClasses}>End Date*</label>
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
