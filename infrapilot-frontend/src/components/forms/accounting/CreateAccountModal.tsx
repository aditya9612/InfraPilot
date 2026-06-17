import { useState, useEffect } from "react";
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
  initialData?: Partial<ChartAccount> | null;
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
    account_name: "",
    account_code: "",
    account_type: "Asset" as AccountType,
    parent_account_id: "",
    opening_balance: 0,
    description: "",
    status: "Active"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form data if initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          account_name: initialData.account_name || "",
          account_code: initialData.account_code || "",
          account_type: initialData.account_type || "Asset",
          parent_account_id: initialData.parent_account_id || "",
          opening_balance: initialData.opening_balance || 0,
          description: initialData.description || "",
          status: initialData.is_active !== false ? "Active" : "Inactive",
        });
      } else {
        setFormData({
          account_name: "",
          account_code: "",
          account_type: "Asset",
          parent_account_id: "",
          opening_balance: 0,
          description: "",
          status: "Active"
        });
      }
    }
  }, [isOpen, initialData]);

  // Auto Generate Account Code (mock logic)
  useEffect(() => {
    if (!initialData && formData.account_type && formData.account_name && !formData.account_code) {
      const prefix = formData.account_type.substring(0, 3).toUpperCase();
      const suffix = Math.floor(100 + Math.random() * 900); // random 3 digits
      setFormData(prev => ({ ...prev, account_code: `${prefix}${suffix}` }));
    }
  }, [formData.account_type, formData.account_name, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name) {
      toast.error("Account name is required.");
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
        description: "",
        status: "Active"
      });
    } catch (error) {
      toast.error("Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten accounts for the dropdown based on selected account type
  const flattenAccounts = (accounts: ChartAccount[], type: AccountType, level = 0): { id: string, name: string }[] => {
    let result: { id: string, name: string }[] = [];
    accounts.forEach(acc => {
      // Only include accounts that match the selected type to be valid parents
      if (acc.account_type === type) {
        result.push({ id: acc.id, name: `${"— ".repeat(level)}${acc.account_name}` });
      }
      if (acc.children) {
        result = [...result, ...flattenAccounts(acc.children, type, level + 1)];
      }
    });
    return result;
  };

  const accountList = flattenAccounts(parentAccounts, formData.account_type);

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (error?: string) => `
    w-full px-4 py-2.5 bg-white border 
    ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
    rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create General Ledger Account"
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="account-form" type="submit" disabled={isSubmitting} className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}>
            {isSubmitting ? "Creating..." : (initialData ? "Update Account" : "Create Account")}
          </button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl shadow-inner">
            {initialData ? "✏️" : "🏦"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{initialData ? "Edit Account" : "Create New Account"}</h2>
            <p className="text-sm text-slate-500 font-medium">{initialData ? "Update existing general ledger account" : "Add a new account to the general ledger"}</p>
          </div>
        </div>
        {/* Basic Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Account Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                className={inputClasses()}
                placeholder="e.g. Petty Cash - Site A"
                value={formData.account_name}
                onChange={e => setFormData({ ...formData, account_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Account Code</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  className={`${inputClasses()} bg-slate-50 cursor-not-allowed text-slate-500 font-mono`}
                  placeholder="Auto-generated"
                  value={formData.account_code}
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-widest">Auto</span>
              </div>
            </div>
            <div>
              <label className={labelClasses}>Account Type <span className="text-rose-500">*</span></label>
              <select
                className={inputClasses()}
                value={formData.account_type}
                onChange={e => setFormData({ ...formData, account_type: e.target.value as AccountType, parent_account_id: "" })}
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Parent Account <span className="text-rose-500">*</span></label>
              <select
                required
                className={inputClasses()}
                value={formData.parent_account_id}
                onChange={e => setFormData({ ...formData, parent_account_id: e.target.value })}
              >
                <option value="" disabled>Select Parent Account</option>
                {accountList.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Additional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Opening Balance (₹)</label>
              <input
                type="number"
                className={inputClasses()}
                value={formData.opening_balance}
                onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className={labelClasses}>Status</label>
              <select
                className={inputClasses()}
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Description</label>
              <textarea
                rows={3}
                className={`${inputClasses()} resize-none`}
                placeholder="Describe the purpose of this account..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
