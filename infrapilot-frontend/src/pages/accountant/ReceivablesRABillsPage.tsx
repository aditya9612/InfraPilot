import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const ReceivablesRABillsPage = () => {
  return (
    <>
      <Navbar 
        title="Running Account (RA) Bills" 
        breadcrumb={["Accountant", "Receivables", "RA Bills"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">RA Bills (Progress Billing)</h1>
            <p className="text-slate-500 text-sm">Manage cumulative bills based on site work measurements and certifications.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all text-nowrap">
            + New RA Bill
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Construction Work Measurement Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for RA Billing integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default ReceivablesRABillsPage;
