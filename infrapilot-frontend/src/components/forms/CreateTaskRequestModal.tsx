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
    if (formData.project_id) {
      labourService.getLabours(Number(formData.project_id), { limit: 100 })
        .then((data: any) => setUsers(data.items || []))
        .catch(() => setUsers([]));
    } else {
      setUsers([]);
    }
  }, [formData.project_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      toast.error("Project is required");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!formData.priority) {
      toast.error("Priority is required");
      return;
    }
    if (!formData.assigned_to) {
      toast.error("Assigning a user is required");
      return;
    }

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

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
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
        {isSubmitting ? "Creating..." : "Create Task Request"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task Request" footer={modalFooter} maxWidth="max-w-xl">
      <form id="create-task-request-form" onSubmit={handleSubmit} className="space-y-4 font-inter">

        <div>
          <label className={labelClasses}>Assigned Project <span className="text-rose-500">*</span></label>
          <select
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className={inputClasses}
            required
          >
            <option value="">Select a Project</option>
            {projects.map((p: any) => (
              <option key={p.id || p.project_id} value={p.id || p.project_id}>
                {p.project_name || p.name || `Project #${p.id || p.project_id}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Title <span className="text-rose-500">*</span></label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Needs Material"
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClasses}>Assigned To <span className="text-rose-500">*</span></label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className={inputClasses}
              required
            >
              <option value="" disabled>Unassigned</option>
              {users.map((u: any) => (
                <option key={u.id || u.labour_id} value={u.id || u.labour_id}>
                  {u.labour_name || u.name || u.full_name || `User ${u.id || u.labour_id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Priority <span className="text-rose-500">*</span></label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </form>
    </Modal >
  );
}
