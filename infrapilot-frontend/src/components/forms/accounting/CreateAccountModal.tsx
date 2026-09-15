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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.code) newErrors.code = "Code is required";
    if (!formData.type) newErrors.type = "Type is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all mandatory fields");
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

  const labelClasses = "block text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (error?: string) => 
    `w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${
        error 
            ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50 focus:bg-white' 
            : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
    }`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    if (name === 'parent_id') {
      parsedValue = value === "" ? "" : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

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
            {isSubmitting ? "Saving..." : initialData ? "Edit Account" : "Save Account"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="name"
              className={inputClasses(errors.name)}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelClasses}>Code <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="code"
              className={inputClasses(errors.code)}
              value={formData.code}
              onChange={handleChange}
            />
            {errors.code && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.code}</p>}
          </div>
          <div>
            <label className={labelClasses}>Type <span className="text-rose-500">*</span></label>
            <select
              name="type"
              className={inputClasses(errors.type)}
              value={formData.type}
              onChange={handleChange}
            >
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
            {errors.type && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.type}</p>}
          </div>
          <div>
            <label className={labelClasses}>Parent ID</label>
            <input
              type="number"
              name="parent_id"
              className={inputClasses()}
              value={formData.parent_id === null ? "" : formData.parent_id}
              onChange={handleChange}
              placeholder="Leave empty if none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
