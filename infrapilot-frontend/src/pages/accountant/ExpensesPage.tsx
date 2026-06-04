import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateExpenseModal from "../../components/forms/CreateExpenseModal";
import ViewExpenseModal from "../../components/forms/ViewExpenseModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { expenseService } from "../../services/expenseService";

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

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
              {activeTab === "All" ? "Company Expenses" : `${activeTab} Expenses`}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Monitor site costs, overheads, and petty cash transactions.</p>
          </div>
          <button
            onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-60"
          >
            <span className="text-base leading-none">+</span> Record Expense
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Card Header */}
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {activeTab === 'All' ? 'All Expenses' : `${activeTab} Expenses`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Site costs, overheads and petty cash records</p>
            </div>
            <button
              onClick={() => {
                const rows = filteredExpenses.map(e => [
                  e.expense_date, `"${e.category}"`, e.expense_type, `"${e.description}"`, `"${e.paid_by}"`, e.payment_mode, e.amount
                ].join(','));
                const csv = ['Date,Category,Type,Description,Paid By,Mode,Amount (INR)', ...rows].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Expenses_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:border-primary/30 hover:text-primary transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50 whitespace-nowrap">
                  <th className="px-6 py-4">Expense Date</th>
                  <th className="px-6 py-4">Expense Type</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Paid By</th>
                  <th className="px-6 py-4">Payment Mode</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-center">Attach Bill</th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{exp.expense_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                        exp.expense_type === "Direct" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                      }`}>{exp.expense_type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{exp.category}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800 text-right tabular-nums">₹{exp.amount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{exp.paid_by}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{exp.payment_mode}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                    <td className="px-6 py-4 text-center">
                        <button className="text-primary hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-all mx-auto block" title="View Bill">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewExpense(exp)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
