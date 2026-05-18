import React, { useState } from "react";
import { AlertTriangle, Tag, MessageSquare, ShieldAlert } from "lucide-react";
import Modal from "../common/Modal";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "General",
    impactLevel: "Medium",
    description: "",
    resolution: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Issue title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const payload = {
          ...formData,
          date: new Date().toISOString().split('T')[0],
        };
        await onSubmit(payload);
        onClose();
        setFormData({
            title: "",
            type: "General",
            impactLevel: "Medium",
            description: "",
            resolution: "",
        });
      } catch (error) {
        console.error("Submission error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="issue-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all flex items-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
      >
        {isLoading ? "Reporting..." : "Report Issue"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Project Issue / Risk"
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form id="issue-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <AlertTriangle size={16} />
            </span>
            <input
              type="text"
              name="title"
              placeholder="e.g. Structural steel delay for Phase 3"
              value={formData.title}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.title ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm focus:border-primary transition-all outline-none`}
            />
          </div>
          {errors.title && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Issue Type
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Tag size={16} />
              </span>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
              >
                <option value="Material">Material</option>
                <option value="Delay">Delay</option>
                <option value="Safety">Safety</option>
                <option value="Financial">Financial</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Impact Level */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Impact Level
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ShieldAlert size={16} />
              </span>
              <select
                name="impactLevel"
                value={formData.impactLevel}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
              >
                <option value="Low">Low Impact</option>
                <option value="Medium">Medium Impact</option>
                <option value="High">Critical / High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <MessageSquare size={16} />
            </span>
            <textarea
              name="description"
              rows={3}
              placeholder="Provide detailed information about the issue..."
              value={formData.description}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.description ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm focus:border-primary transition-all outline-none resize-none`}
            />
          </div>
          {errors.description && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.description}</p>}
        </div>

        {/* Resolution */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Proposed Resolution / Strategy (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <MessageSquare size={16} className="opacity-50" />
            </span>
            <textarea
              name="resolution"
              rows={2}
              placeholder="How can this be resolved or mitigated?"
              value={formData.resolution}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
