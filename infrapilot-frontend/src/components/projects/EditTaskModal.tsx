import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import type { Task, TaskStatus, ProjectMember } from "../../types/project";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  members: ProjectMember[];
  onSubmit?: (taskData: any) => void;
}

const EditTaskModal = ({
  isOpen,
  onClose,
  task,
  members,
  onSubmit,
}: EditTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    status: "Planned" as TaskStatus,
    start_date: "",
    end_date: "",
    assigned_user_id: 0,
    completion_percentage: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        start_date: task.start_date,
        end_date: task.end_date,
        assigned_user_id: task.assigned_user_id,
        completion_percentage: task.completion_percentage,
      });
    }
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["priority", "assigned_user_id", "completion_percentage"].includes(name) 
        ? parseInt(value) 
        : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.start_date) newErrors.start_date = "Start date is required.";
    if (!formData.end_date) newErrors.end_date = "End date is required.";
    if (!formData.assigned_user_id) newErrors.assigned_user_id = "Assigned user is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !task) return;

    setIsLoading(true);
    try {
      const requestBody = {
        ...formData,
        task_id: task.id,
        project_id: task.project_id,
        // The backend expects 'percentage' for progress updates
        percentage: formData.completion_percentage,
      };
      
      if (onSubmit) {
        await onSubmit(requestBody);
      }
      
      toast.success("Task updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        form="edit-task-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Saving Changes..." : "Update Task"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Task Details"
      footer={modalFooter}
    >
      <form id="edit-task-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Task Definition</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
              <input
                required type="text" name="title" value={formData.title} onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.title ? 'border-red-500' : 'border-slate-200'} rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
              <textarea
                required name="description" value={formData.description} onChange={handleChange} rows={3}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.description ? 'border-red-500' : 'border-slate-200'} rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Status & Owner</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <select
                  name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Assigned To</label>
                <select
                  name="assigned_user_id" value={formData.assigned_user_id} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Progress</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Completion %</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" name="completion_percentage" min="0" max="100" value={formData.completion_percentage} onChange={handleChange}
                    disabled={isLoading}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-bold text-slate-700 min-w-[30px]">{formData.completion_percentage}%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Priority (Low 3 - 1 High)</label>
                <select
                  name="priority" value={formData.priority} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value={1}>High Priority</option>
                  <option value={2}>Medium Priority</option>
                  <option value={3}>Low Priority</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                <input
                  type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                <input
                  type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
