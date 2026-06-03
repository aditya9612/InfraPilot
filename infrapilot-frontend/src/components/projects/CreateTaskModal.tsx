import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { boqService } from "../../services/boqService";
import type { BoqItem } from "../../types/boq";
import type { TaskStatus, ProjectMember } from "../../types/project";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: ProjectMember[];
  onSubmit?: (taskData: any) => void;
}

const CreateTaskModal = ({
  isOpen,
  onClose,
  projectId,
  members,
  onSubmit,
}: CreateTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    status: "Planned" as TaskStatus,
    start_date: "",
    end_date: "",
    assigned_user_id: members[0]?.user_id || "",
    boq_id: "",
  });
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Sync default assigned user when members load
  useEffect(() => {
    if (members.length > 0 && !formData.assigned_user_id) {
      setFormData(prev => ({ ...prev, assigned_user_id: members[0].user_id }));
    }
  }, [members, formData.assigned_user_id]);

  useEffect(() => {
    const fetchBoqItems = async () => {
      try {
        const response = await boqService.getBoqs({ project_id: projectId });
        setBoqItems(response.items || []);
      } catch (error) {
        console.error("Failed to fetch BOQ items for task creation:", error);
      }
    };
    if (isOpen && projectId) {
      fetchBoqItems();
    }
  }, [isOpen, projectId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === "priority" || name === "assigned_user_id" || name === "boq_id")
        ? (value ? parseInt(value) : "")
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
    if (!validate()) return;

    setIsLoading(true);
    try {
      const requestBody = {
        project_id: projectId,
        ...formData,
        boq_id: formData.boq_id || null,
        // Send redundant fields for backend compatibility (Tasks and Activities)
        activity_name: formData.title,
        engineer_id: formData.assigned_user_id,
        assigned_to: formData.assigned_user_id,
        user_id: formData.assigned_user_id,
        lead_id: formData.assigned_user_id,
        assigned_to_id: formData.assigned_user_id,
      };

      console.log("Creating Task (Request Body):", requestBody);

      if (onSubmit) {
        await onSubmit(requestBody);
      }

      toast.success(`Task "${formData.title}" assigned successfully!`, {
        style: {
          borderRadius: "12px",
          background: "#333",
          color: "#fff",
          fontSize: "14px",
          fontWeight: "600",
        },
      });

      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: 1,
        status: "Planned",
        start_date: "",
        end_date: "",
        assigned_user_id: members[0]?.user_id || "",
        boq_id: "",
      });
    } catch (error) {
      // Error is handled by the parent's toast
      console.error("Task Creation Error:", error);
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
        form="create-task-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Assigning Task..." : "Assign Task"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Site Task"
      footer={modalFooter}
    >
      <form id="create-task-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Activity Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Task Title <span className="text-red-500">*</span></label>
              <input
                required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Site Cleaning"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                required name="description" value={formData.description} onChange={handleChange} placeholder="Detailed instructions for the site team" rows={3}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300 resize-none`}
              />
              {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* Assignment & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Assignment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Assigned To</label>
                <select
                  name="assigned_user_id" value={formData.assigned_user_id || ""} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="">Select a team member</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role})</option>
                  ))}
                </select>
                {errors.assigned_user_id && <p className="text-[10px] text-red-500 mt-1">{errors.assigned_user_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Priority (1-5)</label>
                <input
                  type="number" name="priority" min="1" max="5" value={formData.priority} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Link to BOQ Activity</label>
                <select
                  name="boq_id" value={formData.boq_id || ""} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="">Select BOQ Item (Optional)</option>
                  {boqItems.map(item => (
                    <option key={item.id} value={item.id}>{item.item_name} ({item.category})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                <input
                  type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border ${errors.start_date ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all text-slate-700`}
                />
                {errors.start_date && <p className="text-[10px] text-red-500 mt-1">{errors.start_date}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                <input
                  type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border ${errors.end_date ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all text-slate-700`}
                />
                {errors.end_date && <p className="text-[10px] text-red-500 mt-1">{errors.end_date}</p>}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
