import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const AccountantReportsPage = () => {
  return (
    <>
      <Navbar 
        title="Financial Reports" 
        breadcrumb={["Accountant", "Finance", "Reports"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Statements</h1>
            <p className="text-slate-500 text-sm">Generate Balance Sheets, P&L, and Trial Balance reports.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { name: "Profit & Loss Account", desc: "Statement of revenues and expenses." },
             { name: "Balance Sheet", desc: "Snapshot of assets, liabilities, and equity." },
             { name: "Trial Balance", desc: "List of all GL accounts and their balances." },
             { name: "Cash Flow Statement", desc: "Analysis of incoming and outgoing cash." },
             { name: "Ledger Summary", desc: "Detailed activity for specific GL accounts." },
             { name: "Aging Analysis", desc: "Status of receivables and payables over time." },
           ].map((report) => (
             <div key={report.name} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-800">{report.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{report.desc}</p>
             </div>
           ))}
        </div>
      </PageTransition>
    </>
  );
};

export default AccountantReportsPage;
