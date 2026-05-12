import React, { useState } from "react";
import { FileCheck, Tag, MessageSquare, DollarSign } from "lucide-react";
import Modal from "../common/Modal";

interface CreateApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateApprovalModal: React.FC<CreateApprovalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "Variation",
    amountQuantity: "",
    description: "",
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
    if (!formData.title.trim()) newErrors.title = "Subject is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.amountQuantity.trim()) newErrors.amountQuantity = "Value or quantity is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        await onSubmit(formData);
        onClose();
        setFormData({
            title: "",
            type: "Variation",
            amountQuantity: "",
            description: "",
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
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
      >
        Cancel
      </button>
      <button
        form="approval-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 ${isLoading ? "opacity-70" : "active:scale-95"}`}
      >
        {isLoading ? "Submitting..." : "Submit for Approval"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Approval Request"
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form id="approval-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Subject / Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <FileCheck size={16} />
            </span>
            <input
              type="text"
              name="title"
              placeholder="e.g. Extra Masonry Work for Boundary Wall"
              value={formData.title}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.title ? "border-rose-400" : "border-slate-200"} rounded-xl text-sm focus:border-blue-500 transition-all outline-none`}
            />
          </div>
          {errors.title && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Request Type
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Tag size={16} />
              </span>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 transition-all outline-none appearance-none"
              >
                <option value="Variation">Variation Order</option>
                <option value="Billing">Billing / Payment</option>
                <option value="Material">Material Selection</option>
                <option value="Design">Design Change</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Value / Quantity <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <DollarSign size={16} />
              </span>
              <input
                type="text"
                name="amountQuantity"
                placeholder="e.g. ₹2,50,000 or 500 Sq.Ft"
                value={formData.amountQuantity}
                onChange={handleChange}
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.amountQuantity ? "border-rose-400" : "border-slate-200"} rounded-xl text-sm focus:border-blue-500 transition-all outline-none`}
              />
            </div>
            {errors.amountQuantity && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.amountQuantity}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <MessageSquare size={16} />
            </span>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide full context and justification for this request..."
              value={formData.description}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.description ? "border-rose-400" : "border-slate-200"} rounded-xl text-sm focus:border-blue-500 transition-all outline-none resize-none`}
            />
          </div>
          {errors.description && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.description}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default CreateApprovalModal;
