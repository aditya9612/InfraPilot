import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateExpenseModal from "../../components/forms/CreateExpenseModal";
import ViewExpenseModal from "../../components/forms/ViewExpenseModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { expenseService } from "../../services/expenseService";
import { Eye, Edit2, Trash2 } from "lucide-react";

const MOCK_EXPENSES = [
  {
    id: 1,
    expense_date: "2024-03-28",
    expense_type: "Direct",
    category: "Material",
    amount: 15000,
    paid_by: "Rahul Sharma",
    payment_mode: "UPI",
    description: "Purchase of local sand for site A",
    status: "Active",
  },
  {
    id: 2,
    expense_date: "2024-03-29",
    expense_type: "Indirect",
    category: "Office Rent",
    amount: 45000,
    paid_by: "Admin Cash",
    payment_mode: "Bank Transfer",
    description: "Monthly office rent - Mumbai HQ",
    status: "Active",
  },
  {
    id: 3,
    expense_date: "2024-04-01",
    expense_type: "Direct",
    category: "Labor",
    amount: 8500,
    paid_by: "Site Supervisor",
    payment_mode: "Cash",
    description: "Daily wages for unorganized labor",
    status: "Active",
  },
];

const ExpensesPage = () => {
  const { category } = useParams<{ category: string }>();
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (id: number) => {
    setExpenseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      setExpenses(prev => prev.filter(e => e.id !== expenseToDelete));
      toast.success("Expense deleted successfully");
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  useEffect(() => {
    if (category) {
      const mapping: Record<string, string> = {
        direct: "Direct",
        indirect: "Indirect",
      };
      setActiveTab(mapping[category.toLowerCase()] || "All");
    } else {
      setActiveTab("All");
    }
  }, [category]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateExpense = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedExpense) {
        // Edit mode
        setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? { ...e, ...data, amount: Number(data.amount), description: data.remarks || data.description } : e));
        toast.success("Expense updated successfully!");
      } else {
        // Build payload matching POST /api/v1/expenses
        const payload = {
            project_id: data.project_id ? Number(data.project_id) : 1,
            category: data.category,
            description: data.remarks || data.description || "",
            amount: Number(data.amount),
            expense_date: data.expense_date,
            payment_mode: data.payment_mode,
            ...(data.boq_item_id ? { boq_item_id: Number(data.boq_item_id) } : {}),
        };

        const created = await expenseService.createExpense(payload);

        // Prepend the server-returned record to the local list
        setExpenses((prev) => [
            {
            ...created,
            expense_type: data.expense_type || "Direct",
            paid_by: data.paid_by || "",
            status: "Active",
            },
            ...prev,
        ]);
        toast.success("Expense recorded successfully!");
      }
      setIsModalOpen(false);
      setSelectedExpense(null);
    } catch (error: any) {
      console.error("Failed to process expense:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Failed to process expense. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses =
    activeTab === "All"
      ? expenses
      : expenses.filter((e) => e.expense_type === activeTab);

  return (
    <>
      <Navbar
        title="Expense Tracking"
        breadcrumb={["Accountant", "Finance", "Expenses"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "All"
                ? "Company Expenses"
                : `${activeTab} Obligations`}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Monitor site costs, overheads, and petty cash transactions.
            </p>
          </div>
          <button
            onClick={() => {
                setSelectedExpense(null);
                setIsModalOpen(true);
            }}
            disabled={isSubmitting}
            className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xl">+</span> Record New Expense
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 py-5">Category & Date</th>
                  <th className="px-6 py-5">Description</th>
                  <th className="px-6 py-5">Payment Details</th>
                  <th className="px-6 py-5 text-right">Amount</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black text-[10px] shadow-sm">EXP</div>
                        <div>
                            <p className="text-sm font-black text-slate-700">
                                {exp.category}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {exp.expense_date}
                            </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-600 font-bold max-w-xs truncate">
                        {exp.description}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter mt-0.5">
                        {exp.expense_type} Account
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">
                         {exp.paid_by}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Mode: {exp.payment_mode}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-sm font-black text-slate-800">
                        ₹{exp.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                          Verified
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <button 
                          onClick={() => handleViewExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"
                          title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                          title="Edit Record"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                          title="Delete Expense"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      <CreateExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateExpense}
        projects={[]} // In a real app, fetch projects here
      />

      <ViewExpenseModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        expense={selectedExpense}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmText="Delete Expense"
        type="danger"
      />
    </>
  );
};

export default ExpensesPage;
