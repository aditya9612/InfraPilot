import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateExpenseModal from "../../components/forms/CreateExpenseModal";
import toast from "react-hot-toast";

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
    status: "Active"
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
    status: "Active"
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
    status: "Active"
  }
];

const ExpensesPage = () => {
  const { category } = useParams<{ category: string }>();
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        const mapping: Record<string, string> = {
            direct: "Direct",
            indirect: "Indirect"
        };
        setActiveTab(mapping[category.toLowerCase()] || "All");
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const handleCreateExpense = (data: any) => {
    const newExpense = {
        ...data,
        id: expenses.length + 1,
        status: "Active"
    };
    setExpenses(prev => [newExpense, ...prev]);
    toast.success("Expense recorded successfully!");
  };

  const filteredExpenses = activeTab === "All" 
    ? expenses 
    : expenses.filter(e => e.expense_type === activeTab);

  return (
    <>
      <Navbar title="Expense Tracking" breadcrumb={["Accountant", "Finance", "Expenses"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {activeTab === "All" ? "Company Expenses" : `${activeTab} Expenses`}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Monitor site costs, overheads, and petty cash transactions.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Record New Expense
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Date & Category</th>
                            <th className="px-6 py-5">Description</th>
                            <th className="px-6 py-5">Payment Details</th>
                            <th className="px-6 py-5 text-right">Amount</th>
                            <th className="px-6 py-5 text-center">Receipt</th>
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{exp.category}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{exp.expense_date}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs text-slate-600 font-medium max-w-xs truncate">{exp.description}</p>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">{exp.expense_type} Expense</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-700">Paid By: {exp.paid_by}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{exp.payment_mode}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-800">₹{exp.amount.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <button className="p-2 text-slate-300 hover:text-primary transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    </button>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                    </button>
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
    </>
  );
};

export default ExpensesPage;
