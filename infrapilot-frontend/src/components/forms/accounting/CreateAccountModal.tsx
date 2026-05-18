import { useState } from "react";
import Modal from "../../common/Modal";
import { accountingService } from "../../../services/accountingService";
import type { ChartAccount, AccountType } from "../../../types/accounting";
import toast from "react-hot-toast";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentAccounts: ChartAccount[];
  onSubmitMock?: (data: any) => void;
  initialData?: any;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentAccounts,
  onSubmitMock,
  initialData
}) => {
  const [formData, setFormData] = useState({
    account_name: initialData?.account_name || "",
    account_code: initialData?.account_code || "",
    account_type: (initialData?.account_type || "Asset") as AccountType,
    parent_account_id: initialData?.parent_account_id || "",
    opening_balance: initialData?.opening_balance || 0,
    description: initialData?.description || ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.account_name.trim()) newErrors.account_name = "Account name is required.";
    if (!formData.account_code.toString().trim()) {
      newErrors.account_code = "Account code is required.";
    } else if (isNaN(Number(formData.account_code))) {
      newErrors.account_code = "Account code must be numeric.";
    }
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (onSubmitMock) {
      onSubmitMock(formData);
      return;
    }

    try {
      setIsSubmitting(true);
      await accountingService.createAccount(formData);
      toast.success(initialData ? "Account updated successfully!" : "Account created successfully!");
      onSuccess();
      onClose();
      setFormData({
        account_name: "",
        account_code: "",
        account_type: "Asset",
        parent_account_id: "",
        opening_balance: 0,
        description: ""
      });
    } catch (error) {
      toast.error("Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten accounts for the dropdown
  const flattenAccounts = (accounts: ChartAccount[], level = 0): {id: string, name: string}[] => {
    let result: {id: string, name: string}[] = [];
    accounts.forEach(acc => {
      result.push({ id: acc.id, name: `${"— ".repeat(level)}${acc.account_name}` });
      if (acc.children) {
        result = [...result, ...flattenAccounts(acc.children, level + 1)];
      }
    });
    return result;
  };

  const accountList = flattenAccounts(parentAccounts);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit General Ledger Account" : "Create General Ledger Account"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Account Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="account_name"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.account_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
              placeholder="e.g. Bank of India - 1234"
              value={formData.account_name}
              onChange={handleChange}
            />
            {errors.account_name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.account_name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Account Code <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="account_code"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.account_code ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all font-bold`}
              placeholder="e.g. 101001"
              value={formData.account_code}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {errors.account_code && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.account_code}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={formData.account_type}
              onChange={e => setFormData({ ...formData, account_type: e.target.value as AccountType })}
            >
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Parent Account</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={formData.parent_account_id}
              onChange={e => setFormData({ ...formData, parent_account_id: e.target.value })}
            >
              <option value="">None (Primary Level)</option>
              {accountList.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Opening Balance (₹)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            value={formData.opening_balance}
            onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description <span className="text-red-500">*</span></label>
          <textarea
            name="description"
            rows={2}
            className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.description ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all resize-none`}
            placeholder="Describe the purpose of this account..."
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.description}</p>}
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Creating..." : "Save Account"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
