import { useState, useEffect, useRef, type FormEvent } from "react";
import Modal from "../common/Modal";
import type { CreateActivityRequest } from "../../types/workProgress";
import { projectService } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityRequest) => Promise<void>;
  projectId: number;
  engineerId: number;
}

import { boqService } from "../../services/boqService";
import api from "../../services/api";
import { workProgressService } from "../../services/workProgressService";

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
  const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);

  // Auto-hide form notification after 3 seconds
  useEffect(() => {
    if (formNotification) {
      const timer = setTimeout(() => {
        setFormNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formNotification]);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    project_id: "",
    boq_item_id: "" as any,
    start_date: "",
    end_date: "",
    work_order_id: "" as any,
    engineer_id: "" as any
  });

  const [allBoqs, setAllBoqs] = useState<any[]>([]);
  const [allWorkOrders, setAllWorkOrders] = useState<any[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<'boq' | 'work_order' | null>(null);
  const boqDropdownRef = useRef<HTMLDivElement>(null);
  const workOrderDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        openDropdown === 'boq' &&
        boqDropdownRef.current &&
        !boqDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
      if (
        openDropdown === 'work_order' &&
        workOrderDropdownRef.current &&
        !workOrderDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    if (!isOpen) {
      setOpenDropdown(null);
      setFormNotification(null);
      setErrors({});
    }
  }, [isOpen]);
  const [existingActivities, setExistingActivities] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, project_id: "" }));

      const fetchAllData = async () => {
        try {
          // Fetch assigned projects for the current user (e.g. Site Engineer)
          const res: any = await projectService.getAssignedProjects(Number(user?.id));
          setProjects(Array.isArray(res) ? res : (res.items || res.data || []));
        } catch (error) {
          console.error("Failed to fetch assigned projects", error);
        }
      };

      fetchAllData();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchProjectSpecificData = async () => {
      const projectIdToFetch = Number(formData.project_id) || projectId;
      if (!projectIdToFetch) {
        setSiteEngineers([]);
        setAllBoqs([]);
        setAllWorkOrders([]);
        setExistingActivities([]);
        return;
      }

      // Fetch existing activities to prevent duplicates
      workProgressService.listActivities(projectIdToFetch, undefined, 100)
        .then(acts => setExistingActivities(acts || []))
        .catch(err => { console.error("Failed to fetch existing activities", err); setExistingActivities([]); });

      // Fetch BOQs for this project
      boqService.getBoqs({ limit: 100, project_id: projectIdToFetch })
        .then(boqs => setAllBoqs(uniqueById(Array.isArray(boqs.items) ? boqs.items : [])))
        .catch(err => { console.error("Failed to fetch BOQs", err); setAllBoqs([]); });

      // Fetch Work Orders for this project (and boq item if selected)
      const woParams: any = { project_id: projectIdToFetch };
      if (formData.boq_item_id) {
        woParams.boq_id = formData.boq_item_id;
      }
      api.get(`/work-orders`, { params: woParams })
        .then(woRes => setAllWorkOrders(uniqueById(Array.isArray(woRes.data) ? woRes.data : (woRes.data.items || []))))
        .catch(err => { console.error("Failed to fetch Work Orders", err); setAllWorkOrders([]); });

      // Fetch Site Engineers
      try {
        const res = await projectService.getProjectMembers(projectIdToFetch);
        const allUsers = Array.isArray(res) ? res : (res.items || res.data || []);
        const engineers = allUsers
          .filter((u: any) => {
            const role = typeof u.role === 'string' ? u.role : u.role?.name || u.user?.role || '';
            const normalizedRole = role.toLowerCase().replace(/\s/g, '');
            const isEngineerRole = normalizedRole === 'siteengineer' || normalizedRole === 'engineer' || normalizedRole === 'member';

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
      fetchProjectSpecificData();
    }
  }, [isOpen, formData.project_id, projectId, formData.boq_item_id]);

    const isCombinationUsed = (boqId: any, woId: any) => {
    return existingActivities.some(a =>
      (a.boq_item_id == boqId || a.boq_code == boqId) &&
      (a.work_order_id == woId || (!a.work_order_id && !woId))
    );
  };

  const isBoqCompleted = (boq: any) => {
    const boqId = Number(boq.id || boq.boq_id);
    const boqName = (boq.item_name || boq.name || '').trim().toLowerCase();

    // 1. Direct status/completion on BOQ item
    if (boq.is_completed === true) return true;
    const bStatus = (boq.status || '').toUpperCase().replace(/\s+/g, '_');
    if (bStatus === 'COMPLETED' || bStatus === 'INACTIVE') return true;

    const boqQty = Number(boq.quantity);
    const boqActual = Number(boq.actual_quantity);
    if (!isNaN(boqQty) && !isNaN(boqActual) && boqQty > 0 && boqActual >= boqQty) {
      return true;
    }

    // 2. Check activities associated with this BOQ item
    const relatedActs = existingActivities.filter(a => {
      const aBoqId = Number(a.boq_item_id || a.boq_code || a.boq_id);
      if (boqId > 0 && aBoqId > 0 && aBoqId === boqId) return true;
      const aName = (a.activity_name || '').trim().toLowerCase();
      if (boqName && aName && aName === boqName) return true;
      return false;
    });

    if (relatedActs.length > 0) {
      const isAnyCompleted = relatedActs.some(a => {
        const st = (a.status || '').toUpperCase().replace(/\s+/g, '_');
        const planned = Number(a.planned_quantity || 0);
        const completed = Number(a.total_completed || 0);
        const remaining = a.remaining_quantity !== undefined && a.remaining_quantity !== null
          ? Number(a.remaining_quantity)
          : (planned - completed);
        const pct = Number(a.completion_percentage || 0);

        return (
          st === 'COMPLETED' ||
          pct >= 100 ||
          (planned > 0 && remaining <= 0) ||
          (planned > 0 && completed >= planned)
        );
      });
      if (isAnyCompleted) return true;

      const totalPlanned = relatedActs.reduce((sum, a) => sum + Number(a.planned_quantity || 0), 0);
      const totalCompleted = relatedActs.reduce((sum, a) => sum + Number(a.total_completed || 0), 0);
      if (totalPlanned > 0 && totalCompleted >= totalPlanned) {
        return true;
      }
    }

    return false;
  };

  const isWorkOrderCompleted = (wo: any) => {
    const woId = Number(wo.id);
    const woStatus = (wo.status || '').toUpperCase().replace(/\s+/g, '_');
    const woDesc = (wo.work_description || wo.work_order_number || '').trim().toLowerCase();

    // 1. Direct status or quantity on Work Order
    if (woStatus === 'COMPLETED' || woStatus === 'CANCELLED' || woStatus === 'INACTIVE') {
      return true;
    }
    const totalQty = Number(wo.total_quantity || 0);
    const completedQty = Number(wo.completed_quantity || 0);
    if (totalQty > 0 && completedQty >= totalQty) {
      return true;
    }

    // 2. Check activities associated with this Work Order
    const relatedActs = existingActivities.filter(a => {
      const aWoId = Number(a.work_order_id);
      if (woId > 0 && aWoId > 0 && aWoId === woId) return true;
      const aName = (a.activity_name || '').trim().toLowerCase();
      if (woDesc && aName && aName.includes(woDesc)) return true;
      return false;
    });

    if (relatedActs.length > 0) {
      const isAnyCompleted = relatedActs.some(a => {
        const st = (a.status || '').toUpperCase().replace(/\s+/g, '_');
        const planned = Number(a.planned_quantity || 0);
        const completed = Number(a.total_completed || 0);
        const remaining = a.remaining_quantity !== undefined && a.remaining_quantity !== null
          ? Number(a.remaining_quantity)
          : (planned - completed);
        const pct = Number(a.completion_percentage || 0);

        return (
          st === 'COMPLETED' ||
          pct >= 100 ||
          (planned > 0 && remaining <= 0) ||
          (planned > 0 && completed >= planned)
        );
      });
      if (isAnyCompleted) return true;
    }

    return false;
  };

  const displayedBoqs = (formData.project_id ? allBoqs.filter(b => b.project_id == formData.project_id || !b.project_id) : allBoqs)
    .filter(b => !isBoqCompleted(b));

  const displayedWorkOrders = (() => {
    let wos = allWorkOrders;
    if (formData.project_id) {
      wos = wos.filter(w => w.project_id == formData.project_id || !w.project_id);
    }
    if (formData.boq_item_id) {
      wos = wos.filter(w => !isCombinationUsed(formData.boq_item_id, w.id));
    }
    return wos.filter(w => !isWorkOrderCompleted(w));
  })();



  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!formData.project_id) {
      errs.project_id = "Project is required";
      missingFields.push("Project");
    }

    if (!formData.boq_item_id) {
      errs.boq_item_id = "BOQ Item is required";
      missingFields.push("BOQ Item");
    }

    if (!formData.engineer_id) {
      errs.engineer_id = "Assign Site Engineer is required";
      missingFields.push("Assign Site Engineer");
    }

    if (formData.work_order_id && Number(formData.work_order_id) <= 0) {
      errs.work_order_id = "Work Order ID must be greater than 0";
    }

    if (!formData.start_date) {
      errs.start_date = "Start Date is required";
      missingFields.push("Start Date");
    }
    if (!formData.end_date) {
      errs.end_date = "End Date is required";
      missingFields.push("End Date");
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errs.end_date = "End date cannot be before start date";
    }

    setErrors(errs);

    const totalRequiredCount = 5;
    if (missingFields.length === totalRequiredCount) {
      // All required fields are blank: display generic toast message
      setFormNotification({ type: 'error', message: 'Please fill in all required fields.' });
      toast.error('Please fill in all required fields.');
    } else {
      // If only one or partial required fields are missing: highlight specific field(s) with inline message, no generic toast
      setFormNotification(null);
    }

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormNotification(null);
    if (!validate()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        project_id: Number(formData.project_id) || projectId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : null,
        work_order_id: formData.work_order_id ? Number(formData.work_order_id) : null,
        engineer_id: formData.engineer_id ? Number(formData.engineer_id) : (engineerId || null)
      });
      setFormData({
        project_id: "",
        boq_item_id: "",
        start_date: "",
        end_date: "",
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

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Reset dependent fields when project changes
      if (name === "project_id") {
        newData.boq_item_id = "";
        newData.work_order_id = "";
        newData.engineer_id = "";
      }

      // Reset dependent fields when BOQ changes
      if (name === "boq_item_id") {
        newData.work_order_id = "";
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

  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1 font-inter";
  const inputClasses = (error?: string) => `
    w-full px-4 py-2.5 bg-white border 
    ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
    rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 font-inter
  `;

  const handleClose = () => {
    setOpenDropdown(null);
    setFormNotification(null);
    setErrors({});
    onClose();
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={handleClose}
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
        {isSubmitting ? "Saving..." : "Save activity"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Activity Registry" footer={modalFooter} maxWidth="max-w-2xl">
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
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}>
              <span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
              {formNotification.type === 'error'
                ? `Mandatory fields required: ${(formNotification.fields || []).join(', ')}`
                : formNotification.message}
            </p>
            <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
          </div>
        </div>
      )}
      <form id="add-activity-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Inline Validation Error Banner */}
        {formNotification && formNotification.type === 'error' && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-600">Validation Error</p>
              <p className="text-xs text-red-500 mt-0.5">Mandatory fields required: {(formNotification.fields || []).join(', ')}</p>
            </div>
            <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
          </div>
        )}
        {/* Core Identity Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
            Activity Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Project<span className="text-rose-500">*</span></label>
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
              {errors.project_id && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.project_id}</p>}
            </div>

            <div className="relative font-inter" ref={boqDropdownRef}>
              <label className={labelClasses}>BOQ Item <span className="text-rose-500">*</span></label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(prev => prev === 'boq' ? null : 'boq')}
                  className={`w-full text-left appearance-none bg-slate-50 border ${errors.boq_item_id ? 'border-rose-500' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex justify-between items-center gap-2 overflow-hidden`}
                >
                  <span className={`truncate min-w-0 flex-1 ${formData.boq_item_id ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {formData.boq_item_id
                      ? (() => { const b = allBoqs.find((b: any) => (b.id || b.boq_id) == formData.boq_item_id); return b ? (b.item_name || `BOQ #${b.id || b.boq_id}`) : `BOQ #${formData.boq_item_id}`; })()
                      : '-- Select BOQ Item --'}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      openDropdown === 'boq' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'boq' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto overflow-x-hidden">
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleChange({ target: { name: 'boq_item_id', value: '' } } as any);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          !formData.boq_item_id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        -- Select BOQ Item --
                      </button>
                      {displayedBoqs.length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">No eligible BOQ Items with pending quantities</div>
                      )}
                      {displayedBoqs.map((b: any) => (
                        <button
                          key={b.id || b.boq_id}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: 'boq_item_id', value: b.id || b.boq_id } } as any);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                            (formData.boq_item_id == (b.id || b.boq_id))
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {b.item_name || `BOQ #${b.id || b.boq_id}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {errors.boq_item_id && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.boq_item_id}</p>}
            </div>
            <div className="relative font-inter" ref={workOrderDropdownRef}>
              <label className={labelClasses}>Work Order</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(prev => prev === 'work_order' ? null : 'work_order')}
                  className={`w-full text-left appearance-none bg-slate-50 border ${errors.work_order_id ? 'border-rose-500' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex justify-between items-center gap-2 overflow-hidden`}
                >
                  <span className={`truncate min-w-0 flex-1 ${formData.work_order_id ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {formData.work_order_id
                      ? (() => { const w = allWorkOrders.find((w: any) => w.id == formData.work_order_id); return w ? (w.work_description || w.work_order_number || `Work Order #${w.id}`) : `Work Order #${formData.work_order_id}`; })()
                      : '-- Select Work Order --'}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      openDropdown === 'work_order' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'work_order' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto overflow-x-hidden">
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleChange({ target: { name: 'work_order_id', value: '' } } as any);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          !formData.work_order_id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        -- Select Work Order --
                      </button>
                      {displayedWorkOrders.length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">No eligible Work Orders with pending quantities</div>
                      )}
                      {displayedWorkOrders.map((w: any) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: 'work_order_id', value: w.id } } as any);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                            (formData.work_order_id == w.id)
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {w.work_description || w.work_order_number || `Work Order #${w.id}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {errors.work_order_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.work_order_id}</p>}
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between">
            Assignment
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClasses}>Assign Site Engineer <span className="text-rose-500">*</span></label>
              <select
                name="engineer_id"
                className={inputClasses(errors.engineer_id)}
                value={formData.engineer_id}
                onChange={handleChange}
              >
                <option value="">-- Select Site Engineer --</option>
                {siteEngineers.map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name}
                  </option>
                ))}
              </select>
              {errors.engineer_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.engineer_id}</p>}
              <p className="mt-1 text-[10px] text-slate-400 font-medium ml-1 italic font-inter">
                Assign this activity to a specific site engineer for execution tracking.
              </p>
            </div>
          </div>
        </div>


        {/* Timeline Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
            Execution Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Start Date <span className="text-rose-500">*</span></label>
              <input
                type="date" name="start_date" className={inputClasses(errors.start_date)}
                value={formData.start_date} onChange={handleChange}
              />
              {errors.start_date && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelClasses}>End Date <span className="text-rose-500">*</span></label>
              <input
                type="date" name="end_date" className={inputClasses(errors.end_date)}
                value={formData.end_date} onChange={handleChange}
              />
              {errors.end_date && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.end_date}</p>}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddActivityModal;
