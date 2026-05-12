import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface CreateRABillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (billData: any) => void;
  initialData?: any | null;
}

const CreateRABillModal: React.FC<CreateRABillModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    bill_no: "",
    project: "",
    client: "",
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: "Submitted",
    certified_by: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    if (initialData) {
      setFormData({
        bill_no: initialData.bill_no || "",
        project: initialData.project || "",
        client: initialData.client || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        amount: initialData.amount || 0,
        status: initialData.status || "Submitted",
        certified_by: initialData.certified_by || "",
      });
    } else {
      setFormData({
        bill_no: `RA/${new Date().getFullYear()}/00${Math.floor(Math.random() * 100)}`,
        project: "",
        client: "",
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        status: "Submitted",
        certified_by: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.bill_no.trim()) newErrors.bill_no = "Bill number is required.";
    if (!formData.project.trim()) newErrors.project = "Project name is required.";
    if (!formData.client.trim()) newErrors.client = "Client name is required.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (formData.amount <= 0) newErrors.amount = "Amount must be greater than 0.";
    if (!formData.certified_by.trim()) newErrors.certified_by = "Certifying body is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit RA Bill" : "Create New RA Bill"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">RA Bill Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="bill_no"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.bill_no ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                value={formData.bill_no}
                onChange={handleChange}
              />
              {errors.bill_no && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.bill_no}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Project Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="project"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.project ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="e.g. Site Alpha - Mumbai"
                value={formData.project}
                onChange={handleChange}
              />
              {errors.project && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.project}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Client Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="client"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.client ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="e.g. Reliance Industries"
                value={formData.client}
                onChange={handleChange}
              />
              {errors.client && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.client}</p>}
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Submission Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="date"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.date ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.date}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Bill Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="amount"
                min="0"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.amount ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all font-bold`}
                value={formData.amount || ""}
                onChange={handleChange}
              />
              {errors.amount && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">PMC / Certifying Body <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="certified_by"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.certified_by ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="e.g. PMC - Tata Projects"
                value={formData.certified_by}
                onChange={handleChange}
              />
              {errors.certified_by && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.certified_by}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            {initialData ? "Save Record Updates" : "Create RA Bill"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRABillModal;
