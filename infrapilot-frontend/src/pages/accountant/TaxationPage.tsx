import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const TaxationPage = () => {
  return (
    <>
      <Navbar 
        title="GST & Taxation" 
        breadcrumb={["Accountant", "Compliance", "Taxation"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tax Compliance</h1>
            <p className="text-slate-500 text-sm">Manage GST filings, TDS deductions, and tax audit reports.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            Download GST Report
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Tax Computations Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Taxation integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default TaxationPage;
