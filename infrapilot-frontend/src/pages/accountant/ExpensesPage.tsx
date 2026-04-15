import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const ExpensesPage = () => {
  return (
    <>
      <Navbar 
        title="Expenses Oversight" 
        breadcrumb={["Accountant", "Finance", "Expenses"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Expenses</h1>
            <p className="text-slate-500 text-sm">Track site overheads, administrative costs, and miscellaneous spends.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            + Add Expense
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Expense Analysis Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Expense Tracking integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default ExpensesPage;
