import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const ChartOfAccountsPage = () => {
  return (
    <>
      <Navbar 
        title="Chart of Accounts" 
        breadcrumb={["Accountant", "Finance", "GL Accounts"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Chart of Accounts</h1>
            <p className="text-slate-500 text-sm">Manage General Ledger (GL) accounts, hierarchies, and codes.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            + New Account
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Account Hierarchy Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Chart of Accounts integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default ChartOfAccountsPage;
