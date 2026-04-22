import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import type { Expense, ExpenseCreateData } from "../../types/expense";
import type { Project } from "../../types/project";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: any) => void;
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
    expense_type: "Direct" as "Direct" | "Indirect",
    category: "Material",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    paid_by: "",
    payment_mode: "Cash",
    remarks: "",
    attachment: null as File | null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: String(initialData.project_id),
        expense_type: (initialData as any).expense_type || "Direct",
        category: initialData.category,
        amount: String(initialData.amount),
        expense_date: initialData.expense_date.split("T")[0],
        paid_by: (initialData as any).paid_by || "",
        payment_mode: initialData.payment_mode,
        remarks: initialData.description || "",
        attachment: null,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      toast.error("Please fill in required fields (Amount, Category)");
      return;
    }

    const submissionData = {
      ...formData,
      amount: Number(formData.amount),
      description: formData.remarks,
    };

    onSubmit(submissionData);
    onClose();
  };

  const categories = formData.expense_type === "Direct" 
    ? ["Material", "Labor", "Subcontractor", "Equipment Rental", "Fuel"]
    : ["Office Rent", "Travel", "Salaries", "Utilities", "Stationery", "Marketing"];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Expense" : "Record New Expense"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
             <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Expense Type</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button
                    type="button"
                    onClick={() => setFormData({ ...formData, expense_type: "Direct", category: "Material" })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.expense_type === "Direct" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                 >
                    Direct
                 </button>
                 <button
                    type="button"
                    onClick={() => setFormData({ ...formData, expense_type: "Indirect", category: "Office Rent" })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.expense_type === "Indirect" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                 >
                    Indirect
                 </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Category</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Project (Optional)</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">None (General Expense)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Amount (₹)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Expense Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Paid By</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Project Manager Name"
                value={formData.paid_by}
                onChange={e => setFormData({ ...formData, paid_by: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payment Mode</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Remarks</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                placeholder="Any additional details..."
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Attach Bill</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <svg className="w-6 h-6 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <p className="text-[10px] text-slate-500 font-bold">Upload Receipt</p>
                    </div>
                    <input type="file" className="hidden" onChange={e => setFormData({ ...formData, attachment: e.target.files ? e.target.files[0] : null })} />
                </label>
              </div>
              {formData.attachment && <p className="text-[10px] text-primary font-bold mt-1">Attached: {formData.attachment.name}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-10 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            {initialData ? "Update Record" : "Record Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateExpenseModal;
