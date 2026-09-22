import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import type { Expense } from "../../types/expense";
import type { Project } from "../../types/project";
import { boqService } from "../../services/boqService";
import type { BoqItem } from "../../types/boq";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: any) => void | Promise<void>;
  projects: Project[];
  initialData?: Expense | null;
}

const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    project_id: "",
    category: "Material",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_mode: "Cash",
    remarks: "",
    boq_item_id: "",
  });
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [isFetchingBoqs, setIsFetchingBoqs] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: String(initialData.project_id),
        category: initialData.category,
        amount: String(initialData.amount),
        expense_date: initialData.expense_date.split("T")[0],
        payment_mode: initialData.payment_mode,
        remarks: initialData.description || "",
        boq_item_id: initialData.boq_item_id ? String(initialData.boq_item_id) : "",
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetchBoqs = async () => {
      if (!formData.project_id) {
        setBoqItems([]);
        return;
      }
      setIsFetchingBoqs(true);
      try {
        const items = await boqService.getBoqItems(Number(formData.project_id));
        setBoqItems(items || []);
      } catch (error) {
        console.error("Failed to fetch BOQ items", error);
      } finally {
        setIsFetchingBoqs(false);
      }
    };
    fetchBoqs();
  }, [formData.project_id]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setErrors({});
    const submissionData = {
      project_id: Number(formData.project_id) || 0,
      category: formData.category,
      description: formData.remarks,
      amount: Number(formData.amount),
      expense_date: formData.expense_date,
      payment_mode: formData.payment_mode,
      boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : 0,
    };

    // Await the parent handler — it controls closing the modal on success/failure
    await onSubmit(submissionData);
  };

  const categories = [
    "Material", "Construction", "Contractor", "Labor", "Labour Advance",
    "Subcontractor", "Equipment Rental", "Fuel", "Office Rent", "Travel",
    "Salaries", "Utilities", "Stationery", "Marketing"
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Expense" : "Record New Expense"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Classification */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Expense Classification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Category <span className="text-rose-500">*</span></label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Project (Optional)</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">None (General Expense)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              {formData.project_id && (
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    BOQ Item (Mandatory for Project Expenses)
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    value={formData.boq_item_id}
                    onChange={e => setFormData({ ...formData, boq_item_id: e.target.value })}
                  >
                    <option value="">Select BOQ Item...</option>
                    {boqItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} {item.unit ? `(${item.unit})` : ""}
                      </option>
                    ))}
                  </select>
                  {isFetchingBoqs && (
                    <p className="text-[10px] text-primary animate-pulse font-bold ml-1">Fetching project items...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Financials & Audit */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Financials & Logistics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Amount (₹) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-4 transition-all outline-none font-bold ${errors.amount
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  placeholder="0"
                  value={formData.amount}
                  onChange={e => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (errors.amount) setErrors({ ...errors, amount: "" });
                  }}
                />
                {errors.amount && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.amount}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Expense Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium"
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Mode</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  value={formData.payment_mode}
                  onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
                  placeholder="Describe this expense (maps to description in backend)..."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            {initialData ? "Update Record" : "Save Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateExpenseModal;
