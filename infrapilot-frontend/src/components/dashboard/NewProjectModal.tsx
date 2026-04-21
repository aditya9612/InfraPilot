import { useState } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (projectData: any) => void;
}

const NewProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
}: NewProjectModalProps) => {
  const [formData, setFormData] = useState({
    project_name: "",
    owner_id: 1,
    description: "",
    start_date: "",
    end_date: "",
    status: "Planned",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "owner_id" ? parseInt(value) || 0 : value,
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
    if (!formData.project_name.trim())
      newErrors.project_name = "Project name is required.";
    if (formData.owner_id <= 0)
      newErrors.owner_id = "Valid Owner ID is required.";
    if (!formData.description.trim())
      newErrors.description = "Description is required.";
    if (!formData.start_date) newErrors.start_date = "Start date is required.";
    if (!formData.end_date) newErrors.end_date = "End date is required.";
    else if (formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date cannot be before start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const requestBody = {
        ...formData,
        owner_id: Number(formData.owner_id),
      };
      if (onSubmit) await onSubmit(requestBody);
      onClose();
    } catch (error) {
      console.error("Project creation error:", error);
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
        form="project-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Create Project"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      footer={modalFooter}
    >
      <form
        id="project-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Project Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                placeholder="e.g. SARA CITY"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.project_name ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.project_name && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.project_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Owner ID <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="owner_id"
                value={formData.owner_id}
                onChange={handleChange}
                placeholder="e.g. 1"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.owner_id ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.owner_id && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.owner_id}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Project Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Project Details"
                rows={3}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.description ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300 resize-none`}
              />
              {errors.description && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.start_date ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all text-slate-700`}
              />
              {errors.start_date && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.start_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.end_date ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all text-slate-700`}
              />
              {errors.end_date && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewProjectModal;
