import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

interface CreateJVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jvData: any) => void;
  initialData?: any | null;
}

const CreateJVModal: React.FC<CreateJVModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    debit_account: "",
    credit_account: "",
    amount: 0,
    narration: "",
    reference: `JV-${new Date().getFullYear().toString().slice(-2)}-00${Math.floor(Math.random() * 10)}`,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || new Date().toISOString().split('T')[0],
        debit_account: initialData.debit_account || "",
        credit_account: initialData.credit_account || "",
        amount: initialData.amount || 0,
        narration: initialData.narration || "",
        reference: initialData.reference || `JV-${new Date().getFullYear().toString().slice(-2)}-00${Math.floor(Math.random() * 10)}`,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        debit_account: "",
        credit_account: "",
        amount: 0,
        narration: "",
        reference: `JV-${new Date().getFullYear().toString().slice(-2)}-00${Math.floor(Math.random() * 10)}`,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.debit_account || !formData.credit_account || formData.amount <= 0) {
      toast.error("Please fill in all accounting legs and amount");
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Journal Voucher" : "Create Journal Voucher"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">JV Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Reference #</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
        </div>

        <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 relative">
                <div className="absolute top-4 right-4 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded uppercase tracking-wider">Debit</div>
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 block">Debit Account (Ledger)</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 font-black"
                    placeholder="Search account head..."
                    value={formData.debit_account}
                    onChange={e => setFormData({ ...formData, debit_account: e.target.value })}
                />
            </div>

            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 relative">
                <div className="absolute top-4 right-4 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded uppercase tracking-wider">Credit</div>
                <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1.5 block">Credit Account (Ledger)</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 font-black"
                    placeholder="Search account head..."
                    value={formData.credit_account}
                    onChange={e => setFormData({ ...formData, credit_account: e.target.value })}
                />
            </div>
        </div>

        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Amount (₹)</label>
            <input
                type="number"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
            {formData.amount > 0 && (
                <div className="flex items-center gap-2 mt-2 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Balanced Voucher</span>
                </div>
            )}
        </div>

        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Narration / Remarks</label>
            <textarea
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                placeholder="Being laptop purchased for site engineer..."
                value={formData.narration}
                onChange={e => setFormData({ ...formData, narration: e.target.value })}
            />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
            {initialData ? "Save JV Updates" : "Post Journal Entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateJVModal;
