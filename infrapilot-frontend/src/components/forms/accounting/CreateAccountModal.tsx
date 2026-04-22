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
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentAccounts,
  onSubmitMock
}) => {
  const [formData, setFormData] = useState({
    account_name: "",
    account_code: "",
    account_type: "Asset" as AccountType,
    parent_account_id: "",
    opening_balance: 0,
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name || !formData.account_code) {
      toast.error("Account name and code are required.");
      return;
    }

    if (onSubmitMock) {
      onSubmitMock(formData);
      return;
    }

    try {
      setIsSubmitting(true);
      await accountingService.createAccount(formData);
      toast.success("Account created successfully!");
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
      title="Create General Ledger Account"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Account Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="e.g. Bank of India - 1234"
              value={formData.account_name}
              onChange={e => setFormData({ ...formData, account_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Account Code</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="e.g. 1010-001"
              value={formData.account_code}
              onChange={e => setFormData({ ...formData, account_code: e.target.value })}
            />
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
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
          <textarea
            rows={2}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            placeholder="Describe the purpose of this account..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
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
