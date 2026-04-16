import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const ReceivablesCreditNotesPage = () => {
  return (
    <>
      <Navbar 
        title="Credit Notes" 
        breadcrumb={["Accountant", "Receivables", "Credit Notes"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Credit Notes</h1>
            <p className="text-slate-500 text-sm">Issue and track credit notes for client bill adjustments or reversals.</p>
          </div>
          <button className="px-6 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all text-nowrap">
            + Issue Credit Note
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Bill Adjustment History Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Credit Note integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default ReceivablesCreditNotesPage;
