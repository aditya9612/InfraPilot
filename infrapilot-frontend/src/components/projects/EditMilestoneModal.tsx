import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import type { Milestone } from "../../types/project";

interface EditMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  onSubmit?: (milestoneData: any) => void;
}

const EditMilestoneModal = ({
  isOpen,
  onClose,
  milestone,
  onSubmit,
}: EditMilestoneModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title,
        description: milestone.description,
        start_date: milestone.start_date,
        end_date: milestone.end_date,
      });
    }
  }, [milestone]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    else if (formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date cannot be before start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !milestone) return;

    setIsLoading(true);
    // Simulate API call based on USER provided documentation
    setTimeout(() => {
      const requestBody = {
        project_id: milestone.project_id,
        milestone_id: milestone.id,
        ...formData,
      };

      console.log("Updating Milestone (Request Body):", requestBody);

      if (onSubmit) onSubmit(requestBody);
      setIsLoading(false);

      toast.success(`Milestone "${formData.title}" updated successfully!`, {
        style: {
          borderRadius: '12px',
          background: '#333',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600'
        },
      });
      onClose();
    }, 1000);
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
        form="edit-milestone-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Updating..." : "Save Changes"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Milestone Details"
      footer={modalFooter}
    >
      <form id="edit-milestone-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                required type="text" name="title" value={formData.title} onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
            </div>



            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                required name="description" value={formData.description} onChange={handleChange} rows={3}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all resize-none`}
              />
              {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Scheduling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </form>
    </Modal>
  );
};

export default EditMilestoneModal;
