import React, { useState, useEffect } from "react";
import { Send, Building2, Users } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { projectService } from "../../services/projectService";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    type: "Safety",
    message: "",
    target: "Project Manager",
    status: "Normal",
    project_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects(100);
        const projectList = Array.isArray(data) ? data : (data.items || []);
        setProjects(projectList);
        if (projectList.length > 0) {
          setFormData(prev => ({ ...prev, project_id: projectList[0].id.toString() }));
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    if (isOpen) fetchProjects();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.project_id) newErrors.project_id = "Project selection is required.";
    if (!formData.message.trim()) newErrors.message = "Alert message is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setErrors({});
    onSubmit({
      ...formData,
      project_id: Number(formData.project_id)
    });
    setFormData({
      type: "Safety",
      message: "",
      target: "Project Manager",
      status: "Normal",
      project_id: projects.length > 0 ? projects[0].id.toString() : "",
    });
  };

  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>
      <button
        form="alert-form"
        type="submit"
        className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
      >
        <Send size={16} />
        Broadcast Alert
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send System Alert"
      footer={modalFooter}
    >
      <form id="alert-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Communication details</h3>
          </div>

          <div className="mb-4 space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Select Project <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Building2 size={16} />
              </span>
              <select
                className={`w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium appearance-none cursor-pointer ${errors.project_id
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">Choose a site...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id.toString()}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
            {errors.project_id && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.project_id}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Alert type <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Safety">Safety Indicator</option>
                <option value="Delay">Project Delay</option>
                <option value="Budget">Budget Alert</option>
                <option value="System">System Notification</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Priority <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              User target <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Users size={16} />
              </span>
              <select
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              >
                <option value="All">All Users</option>
                <option value="Project Manager">Project Managers</option>
                <option value="Site Engineer">Site Engineers</option>
                <option value="Accountant">Accountants</option>
                <option value="Client">Clients</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Alert message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter the alert message here..."
              className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium resize-none ${errors.message
                ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                }`}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (errors.message) setErrors({ ...errors, message: "" });
              }}
            />
            {errors.message && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.message}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAlertModal;
