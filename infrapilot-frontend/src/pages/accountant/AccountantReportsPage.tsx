import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const REPORTS = [
  { id: "pnl", title: "Profit & Loss", description: "View revenue, costs, and net profit over a specific period.", icon: "trending-up" },
  { id: "balance-sheet", title: "Balance Sheet", description: "Snapshot of company's assets, liabilities, and equity.", icon: "layers" },
  { id: "cash-flow", title: "Cash Flow", description: "Track the inflow and outflow of cash across operations.", icon: "activity" },
  { id: "trial-balance", title: "Trial Balance", description: "Verify the mathematical accuracy of ledger accounts.", icon: "book-open" },
  { id: "expense", title: "Expense Report", description: "Detailed breakdown of all direct and indirect expenses.", icon: "dollar-sign" },
  { id: "vendor-ledger", title: "Vendor Ledger", description: "Account statements for all suppliers and contractors.", icon: "truck" },
  { id: "client-ledger", title: "Client Ledger", description: "Account statements and outstanding balances for clients.", icon: "users" },
  { id: "gst", title: "GST Report", description: "Consolidated report for GSTR-1 and GSTR-3B filings.", icon: "percent" },
];

const ReportIcon = () => {
  // A simple mapping to render an icon based on the name string.
  // In a real app, you would reuse your existing icon components.
  return (
    <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    </div>
  );
};

const AccountantReportsPage = () => {
  const { reportId } = useParams<{ reportId: string }>();

  // If a specific report is selected, render a placeholder for that report
  if (reportId) {
    const activeReport = REPORTS.find(r => r.id === reportId);
    
    return (
        <>
            <Navbar title={`${activeReport?.title || 'Report'}`} breadcrumb={["Accountant", "Reports", activeReport?.title || "View"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="bg-white rounded-[32px] p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[60vh]">
                    <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">{activeReport?.title} Report Builder</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        The dynamic report generation engine for {activeReport?.title} is currently being connected to the live financial database.
                    </p>
                    <Link 
                        to="/accountant/reports"
                        className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                    >
                        ← Back to Reports Hub
                    </Link>
                </div>
            </PageTransition>
        </>
    );
  }

  // Otherwise, render the Reports Hub Grid
  return (
    <>
      <Navbar title="Financial Reports" breadcrumb={["Accountant", "Analytics", "Reports Hub"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reports Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Generate comprehensive financial statements and compliance reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {REPORTS.map(report => (
                <Link 
                    key={report.id} 
                    to={`/accountant/reports/${report.id}`}
                    className="group bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer flex flex-col h-full"
                >
                    <ReportIcon />
                    <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed flex-grow">{report.description}</p>
                    
                    <div className="mt-6 flex items-center text-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        Generate Report →
                    </div>
                </Link>
            ))}
        </div>
      </PageTransition>
    </>
  );
};

export default AccountantReportsPage;
