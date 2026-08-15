import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import { accountingService } from "../../../services/accountingService";
import type { ChartAccount } from "../../../types/accounting";
import toast from "react-hot-toast";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmitMock?: (data: any) => void;
  initialData?: Partial<ChartAccount> | null;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSubmitMock,
  initialData
}) => {
  const [formData, setFormData] = useState<{name: string, code: string, type: string, parent_id: number | string | null}>({
    name: "",
    code: "",
    type: "Asset",
    parent_id: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.account_name || "",
          code: initialData.account_code || "",
          type: initialData.account_type || "Asset",
          parent_id: initialData.parent_account_id ? Number(initialData.parent_account_id) : "",
        });
      } else {
        setFormData({
          name: "",
          code: "",
          type: "Asset",
          parent_id: ""
        });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.type) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      ...formData,
      parent_id: formData.parent_id === "" ? null : formData.parent_id
    };

    if (onSubmitMock) {
      onSubmitMock(payload);
      return;
    }

    try {
      setIsSubmitting(true);
      if (initialData && initialData.id) {
        await accountingService.updateAccount(initialData.id, payload);
        toast.success("Account updated successfully!");
      } else {
        await accountingService.createAccount(payload);
        toast.success("Account created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(initialData ? "Failed to update account." : "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Account" : "Create Account"}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}>
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Name *</label>
            <input
              type="text"
              required
              className={inputClasses}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClasses}>Code *</label>
            <input
              type="text"
              required
              className={inputClasses}
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClasses}>Type *</label>
            <select
              required
              className={inputClasses}
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div>
            <label className={labelClasses}>Parent ID</label>
            <input
              type="number"
              className={inputClasses}
              value={formData.parent_id === null ? "" : formData.parent_id}
              onChange={e => setFormData({ ...formData, parent_id: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="Leave empty if none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
