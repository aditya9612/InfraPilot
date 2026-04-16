import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const BankingPage = () => {
  return (
    <>
      <Navbar 
        title="Bank & Cash" 
        breadcrumb={["Accountant", "Finance", "Banking"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bank & Cash Management</h1>
            <p className="text-slate-500 text-sm">Monitor bank balances, reconcile statements, and manage petty cash.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            Reconcile Statement
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Bank Accounts & Cash Flow Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Banking integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default BankingPage;
