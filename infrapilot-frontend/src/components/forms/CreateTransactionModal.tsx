import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: any) => void;
  initialData?: any | null;
}

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    type: "Receipt",
    party_name: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    mode: "Bank Transfer",
    reference: "",
    linked_id: "",
    remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.party_name.trim()) newErrors.party_name = "Party name is required.";
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be > 0.";
    if (!formData.date) newErrors.date = "Date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "Receipt",
        party_name: initialData.party_name || "",
        amount: String(initialData.amount || ""),
        date: initialData.date || new Date().toISOString().split("T")[0],
        mode: initialData.mode || "Bank Transfer",
        reference: initialData.reference || "",
        linked_id: initialData.linked_id || "",
        remarks: initialData.remarks || "",
      });
    } else {
      setFormData({
        type: "Receipt",
        party_name: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        mode: "Bank Transfer",
        reference: "",
        linked_id: "",
        remarks: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Transaction" : "Record New Transaction"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Transaction Type
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "Receipt" })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  formData.type === "Receipt"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "Payment" })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  formData.type === "Payment"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Payment
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.amount ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-bold transition-all`}
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                if (errors.amount) setErrors(prev => ({ ...prev, amount: "" }));
              }}
            />
            {errors.amount && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.amount}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.party_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
              placeholder="Client or Vendor Name"
              value={formData.party_name}
              onChange={(e) => {
                setFormData({ ...formData, party_name: e.target.value });
                if (errors.party_name) setErrors(prev => ({ ...prev, party_name: "" }));
              }}
            />
            {errors.party_name && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.party_name}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.date ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Payment Mode
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            >
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Cheque</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Reference Number
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="UTR / UPI Ref / Cheque No"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Linked Invoice / Bill
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="e.g. INV-001 or BILL-404"
              value={formData.linked_id}
              onChange={(e) => setFormData({ ...formData, linked_id: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Remarks
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Additional details..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            {initialData ? "Save Changes" : "Save Transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTransactionModal;
