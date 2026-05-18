import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface CreateCreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cnData: any) => void;
  initialData?: any | null;
}

const CreateCreditNoteModal: React.FC<CreateCreditNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    cn_no: "",
    ref_invoice: "",
    client: "",
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    reason: "",
    status: "Approved",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    if (initialData) {
      setFormData({
        cn_no: initialData.cn_no || "",
        ref_invoice: initialData.ref_invoice || "",
        client: initialData.client || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        amount: initialData.amount || 0,
        reason: initialData.reason || "",
        status: initialData.status || "Approved",
      });
    } else {
      setFormData({
        cn_no: `CN/${new Date().getFullYear()}/00${Math.floor(Math.random() * 100)}`,
        ref_invoice: "",
        client: "",
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        reason: "",
        status: "Approved",
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
    if (!formData.cn_no.trim()) newErrors.cn_no = "Credit note number is required.";
    if (!formData.ref_invoice.trim()) newErrors.ref_invoice = "Reference invoice is required.";
    if (!formData.client.trim()) newErrors.client = "Client name is required.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (formData.amount <= 0) newErrors.amount = "Amount must be greater than 0.";
    if (!formData.reason.trim()) newErrors.reason = "Reason for adjustment is required.";
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
      title={initialData ? "Modify Credit Note" : "Issue Credit Note"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Credit Note # <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="cn_no"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.cn_no ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-rose-500/20"} rounded-xl text-sm outline-none transition-all font-bold`}
                value={formData.cn_no}
                onChange={handleChange}
              />
              {errors.cn_no && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.cn_no}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Reference Invoice <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="ref_invoice"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.ref_invoice ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-rose-500/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="e.g. INV/24/082"
                value={formData.ref_invoice}
                onChange={handleChange}
              />
              {errors.ref_invoice && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.ref_invoice}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Client Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="client"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.client ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-rose-500/20"} rounded-xl text-sm outline-none transition-all`}
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Issuance Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="date"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.date ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-rose-500/20"} rounded-xl text-sm outline-none transition-all`}
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.date}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Adjustment Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="amount"
                min="0"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.amount ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-rose-500/20"} rounded-xl text-sm outline-none transition-all font-bold text-rose-600`}
                value={formData.amount || ""}
                onChange={handleChange}
              />
              {errors.amount && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Reason for Adjustment <span className="text-red-500">*</span></label>
              <textarea
                name="reason"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.reason ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-rose-500/20"} rounded-xl text-sm outline-none resize-none transition-all`}
                rows={3}
                placeholder="e.g. Quantity correction, Damaged returns..."
                value={formData.reason}
                onChange={handleChange}
              />
              {errors.reason && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.reason}</p>}
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
            className="flex-1 px-10 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
          >
            {initialData ? "Save Adjustment" : "Issue Credit Note"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCreditNoteModal;
