import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface CreateBankingRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recordData: any) => void;
  initialData?: any | null;
}

const CreateBankingRecordModal: React.FC<CreateBankingRecordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    type: "accounts",
    account_name: "",
    bank_name: "",
    account_number: "",
    ifsc: "",
    opening_balance: 0,
    current_balance: 0,
    last_transaction: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.account_name.trim()) newErrors.account_name = "Account name is required.";
    if (formData.type === "accounts") {
        if (!formData.bank_name.trim()) newErrors.bank_name = "Bank name is required.";
        if (!formData.account_number.trim()) newErrors.account_number = "Account number is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "accounts",
        account_name: initialData.account_name || "",
        bank_name: initialData.bank_name || "",
        account_number: initialData.account_number || "",
        ifsc: initialData.ifsc || "",
        opening_balance: initialData.opening_balance || 0,
        current_balance: initialData.current_balance || 0,
        last_transaction: initialData.last_transaction || "",
      });
    } else {
      setFormData({
        type: "accounts",
        account_name: "",
        bank_name: "",
        account_number: "",
        ifsc: "",
        opening_balance: 0,
        current_balance: 0,
        last_transaction: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Account Details" : "Add New Banking Record"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Record Type</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="accounts">Bank Account</option>
                <option value="cash">Cash Account / Petty Cash</option>
                <option value="reconciliation">Reconciliation Record</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Account / Holder Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.account_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-bold transition-all`}
                placeholder="e.g. Main Operations Account"
                value={formData.account_name}
                onChange={e => {
                    setFormData({ ...formData, account_name: e.target.value });
                    if (errors.account_name) setErrors(prev => ({ ...prev, account_name: "" }));
                }}
              />
              {errors.account_name && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.account_name}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Bank Name {formData.type === "accounts" && <span className="text-red-500">*</span>}</label>
              <input
                type="text"
                disabled={formData.type === "cash"}
                className={`w-full px-4 py-2.5 ${formData.type === "cash" ? "bg-slate-100 cursor-not-allowed" : "bg-slate-50"} border ${errors.bank_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-bold transition-all`}
                placeholder={formData.type === "cash" ? "Cash-in-Hand" : "e.g. HDFC Bank"}
                value={formData.type === "cash" ? "Cash-in-Hand" : formData.bank_name}
                onChange={e => {
                    setFormData({ ...formData, bank_name: e.target.value });
                    if (errors.bank_name) setErrors(prev => ({ ...prev, bank_name: "" }));
                }}
              />
              {errors.bank_name && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.bank_name}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Account Number {formData.type === "accounts" && <span className="text-red-500">*</span>}</label>
              <input
                type="text"
                disabled={formData.type === "cash"}
                className={`w-full px-4 py-2.5 ${formData.type === "cash" ? "bg-slate-100 cursor-not-allowed" : "bg-slate-50"} border ${errors.account_number ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-bold transition-all`}
                placeholder="Account Number"
                value={formData.type === "cash" ? "-" : formData.account_number}
                onChange={e => {
                    setFormData({ ...formData, account_number: e.target.value });
                    if (errors.account_number) setErrors(prev => ({ ...prev, account_number: "" }));
                }}
              />
              {errors.account_number && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.account_number}</p>}
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">IFSC Code</label>
              <input
                type="text"
                disabled={formData.type === "cash"}
                className={`w-full px-4 py-2.5 ${formData.type === "cash" ? "bg-slate-100 cursor-not-allowed" : "bg-slate-50"} border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none uppercase font-bold`}
                placeholder="IFSC Code"
                value={formData.type === "cash" ? "-" : formData.ifsc}
                onChange={e => setFormData({ ...formData, ifsc: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Opening Balance (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-black"
                value={formData.opening_balance}
                onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Current Balance (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-black text-slate-900"
                value={formData.current_balance}
                onChange={e => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">History Label / Memo</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Last audit on 15th April"
                value={formData.last_transaction}
                onChange={e => setFormData({ ...formData, last_transaction: e.target.value })}
              />
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
            {initialData ? "Save Record Updates" : "Add Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBankingRecordModal;
