import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const JournalEntriesPage = () => {
  return (
    <>
      <Navbar 
        title="Journal Entries" 
        breadcrumb={["Accountant", "Finance", "Journal"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manual Journal Entries</h1>
            <p className="text-slate-500 text-sm">Post manual double-entry vouchers to General Ledger.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            + New Journal Entry
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Journal List Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Journal integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default JournalEntriesPage;
