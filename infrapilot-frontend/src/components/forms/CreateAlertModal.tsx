import React, { useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

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
  const [formData, setFormData] = useState({
    type: "Safety",
    message: "",
    target: "Project Manager",
    status: "Normal",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.target.trim()) newErrors.target = "User target is required.";
    if (!formData.message.trim()) newErrors.message = "Alert message is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setErrors({});
    onSubmit(formData);
    setFormData({
      type: "Safety",
      message: "",
      target: "Project Manager",
      status: "Normal",
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
                <option value="Safety">Safety</option>
                <option value="Delay">Delay</option>
                <option value="Budget">Budget</option>
                <option value="System">System</option>
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
            <input
              type="text"
              placeholder="e.g. Project Manager, Site Engineer"
              className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium ${
                errors.target
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
              }`}
              value={formData.target}
              onChange={(e) => {
                setFormData({ ...formData, target: e.target.value });
                if (errors.target) setErrors({ ...errors, target: "" });
              }}
            />
            {errors.target && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.target}</p>}
          </div>

          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Alert message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter the alert message here..."
              className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-medium resize-none ${
                errors.message
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
