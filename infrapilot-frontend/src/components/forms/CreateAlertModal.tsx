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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error("Please enter an alert message.");
      return;
    }
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
        className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
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
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
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
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
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
              required
              placeholder="e.g. Project Manager, Site Engineer"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-medium"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            />
          </div>

          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Alert message <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter the alert message here..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAlertModal;
