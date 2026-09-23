import { useState, type FormEvent, useEffect } from "react";
import Modal from "../common/Modal";

import { labourService } from "../../services/labourService";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";

interface CreateTaskRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: any[]; // List of available projects for dropdown
}

export default function CreateTaskRequestModal({ isOpen, onClose, onSuccess, projects }: CreateTaskRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    category: "",
    priority: "MEDIUM",
    description: "",
    assigned_to: "",
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Since we might need users for the assigned_to dropdown
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        project_id: "",
        title: "",
        category: "",
        priority: "MEDIUM",
        description: "",
        assigned_to: "",
      });
      setAttachmentFile(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Fetch all labourers globally or filtered by project if one is selected
    labourService.getLabours(formData.project_id ? Number(formData.project_id) : undefined, { limit: 100 })
      .then((data: any) => {
        const members = Array.isArray(data) ? data : (data?.items || data?.data || []);
        setUsers(members);
      })
      .catch(() => setUsers([]));
  }, [formData.project_id, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormNotification(null);
    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!formData.project_id) { newErrors.project_id = "Required"; missingFields.push("Project"); }
    if (!formData.title.trim()) { newErrors.title = "Required"; missingFields.push("Title"); }
    if (!formData.category.trim()) { newErrors.category = "Required"; missingFields.push("Category"); }
    if (!formData.priority) { newErrors.priority = "Required"; missingFields.push("Priority"); }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormNotification({ type: 'error', message: `Mandatory fields required: ${missingFields.join(', ')}`, fields: missingFields });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload: any = {
        project_id: Number(formData.project_id),
      };
      if (formData.title) payload.title = formData.title;
      if (formData.category) payload.category = formData.category;
      if (formData.priority) payload.priority = formData.priority;
      if (formData.description) payload.description = formData.description;
      if (formData.assigned_to) payload.assigned_to = Number(formData.assigned_to);
      if (attachmentFile) payload.attachment = attachmentFile;

      await projectService.createTaskRequest(Number(formData.project_id), payload);
      toast.success("Task Request created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.detail?.[0]?.msg || "Failed to create task request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (error?: string) => `
    w-full px-4 py-2.5 bg-white border 
    ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
    rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 font-inter
  `;
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1 font-inter";

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
        form="create-task-request-form"
        type="submit"
        disabled={isSubmitting || !formData.project_id}
        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating..." : "Save Task Request"}
      </button>
    </>

  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task Request" footer={modalFooter} maxWidth="max-w-xl">
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
      <form id="create-task-request-form" onSubmit={handleSubmit} className="space-y-4 font-inter">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>Assigned Project <span className="text-rose-500">*</span></label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className={inputClasses(errors.project_id)}
              >
                <option value="">Select a Project</option>
                {projects.map((p: any) => (
                  <option key={p.id || p.project_id} value={p.id || p.project_id}>
                    {p.project_name || p.name || `Project #${p.id || p.project_id}`}
                  </option>
                ))}
              </select>
              {errors.project_id && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.project_id}</p>}
            </div>
            
            <div>
              <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Construction"
                className={inputClasses(errors.category)}
              />
              {errors.category && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.category}</p>}
            </div>
        </div>

        <div>
          <label className={labelClasses}>Title <span className="text-rose-500">*</span></label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Needs Material"
            className={inputClasses(errors.title)}
          />
          {errors.title && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.title}</p>}
        </div>

        <div>
          <label className={labelClasses}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of the task request..."
            className={`${inputClasses(errors.description)} resize-none`}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClasses}>Assigned To</label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className={inputClasses(errors.assigned_to)}
            >
              <option value="">Unassigned</option>
              {users.map((u: any) => {
                const user = u.user || u;
                return (
                  <option key={user.id || user.user_id} value={user.id || user.user_id}>
                    {user.full_name || user.name || user.labour_name || `User ${user.id || user.user_id}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Priority <span className="text-rose-500">*</span></label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputClasses(errors.priority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            {errors.priority && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">{errors.priority}</p>}
          </div>
        </div>
        
        <div>
          <label className={labelClasses}>Attachment</label>
          <input 
            type="file" 
            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer font-inter text-slate-500" 
          />
        </div>
      </form>
    </Modal >
  );
}
