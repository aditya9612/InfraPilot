import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const REPORTS = [
  { id: "pnl", title: "Profit & Loss", description: "View revenue, costs, and net profit over a specific period.", icon: "trending-up", color: "bg-emerald-50 text-emerald-600" },
  { id: "balance-sheet", title: "Balance Sheet", description: "Snapshot of company's assets, liabilities, and equity.", icon: "layers", color: "bg-blue-50 text-primary" },
  { id: "cash-flow", title: "Cash Flow", description: "Track the inflow and outflow of cash across operations.", icon: "activity", color: "bg-amber-50 text-amber-600" },
  { id: "trial-balance", title: "Trial Balance", description: "Verify the mathematical accuracy of ledger accounts.", icon: "book-open", color: "bg-purple-50 text-purple-600" },
  { id: "expense", title: "Expense Report", description: "Detailed breakdown of all direct and indirect expenses.", icon: "dollar-sign", color: "bg-rose-50 text-rose-600" },
  { id: "vendor-ledger", title: "Vendor Ledger", description: "Account statements for all suppliers and contractors.", icon: "truck", color: "bg-slate-50 text-slate-600" },
  { id: "client-ledger", title: "Client Ledger", description: "Account statements and outstanding balances for clients.", icon: "users", color: "bg-indigo-50 text-indigo-600" },
  { id: "gst", title: "GST Report", description: "Consolidated report for GSTR-1 and GSTR-3B filings.", icon: "percent", color: "bg-teal-50 text-teal-600" },
];

const ReportIcon = ({ color }: { color: string }) => {
  return (
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    </div>
  );
};

const AccountantReportsPage = () => {
  const { reportId } = useParams<{ reportId: string }>();

  if (reportId) {
    const activeReport = REPORTS.find(r => r.id === reportId);
    
    return (
        <>
            <Navbar title={`${activeReport?.title || 'Report'}`} breadcrumb={["Accountant", "Reports", activeReport?.title || "View"]} />
            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <Link to="/accountant/reports" className="inline-flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-[0.2em] hover:translate-x-[-4px] transition-transform mb-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            Back to Reports Hub
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">{activeReport?.title} Statement</h2>
                        <p className="text-slate-500 text-sm mt-1">For the period: <span className="font-bold text-slate-700 underline underline-offset-4 decoration-primary/30">01 April 2024</span> to <span className="font-bold text-slate-700 underline underline-offset-4 decoration-primary/30">30 April 2024</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export PDF
                        </button>
                        <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
                            Print Report
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: "Opening Balance", value: "₹45,20,000", color: "text-slate-600", bg: "bg-slate-50/50" },
                        { label: reportId === 'pnl' ? "Total Revenue" : "Total Assets", value: "₹1,25,80,000", color: "text-emerald-600", bg: "bg-emerald-50/30" },
                        { label: reportId === 'pnl' ? "Total Expenses" : "Total Liabilities", value: "₹82,40,000", color: "text-rose-600", bg: "bg-rose-50/30" },
                        { label: "Net Movement", value: "₹43,40,000", color: "text-primary", bg: "bg-blue-50/30" },
                    ].map((card, i) => (
                        <div key={i} className={`p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group ${card.bg}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">{card.label}</p>
                            <p className={`text-2xl font-black tracking-tight relative z-10 ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Report Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Statement of Accounts</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">GENERATED ON: {new Date().toLocaleString()}</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            Currency: <span className="text-slate-800">INR (₹)</span>
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-6 py-4">Particulars / Transaction</th>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4 text-right">Debit</th>
                                    <th className="px-6 py-4 text-right">Credit</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { p: "Opening Balance B/F", r: "-", d: "-", c: "-", b: "45,20,000.00", bold: true },
                                    { p: "Project Revenue - Site Alpha", r: "INV/24/082", d: "-", c: "12,50,000.00", b: "57,70,000.00" },
                                    { p: "Material Procurement - Steel", r: "PV/24/110", d: "4,20,000.00", c: "-", b: "53,50,000.00" },
                                    { p: "Labor Wages - Week 14", r: "PR/24/014", d: "2,15,000.00", c: "-", b: "51,35,000.00" },
                                    { p: "GST Liability Payment", r: "TAX/24/004", d: "1,85,000.00", c: "-", b: "49,50,000.00" },
                                    { p: "Equipment Hire Charges", r: "EXP/24/442", d: "85,000.00", c: "-", b: "48,65,000.00" },
                                    { p: "Retention Release - Client X", r: "RCT/24/005", d: "-", c: "5,00,000.00", b: "53,65,000.00" },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className={`px-6 py-4 text-sm ${row.bold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>{row.p}</td>
                                        <td className="px-6 py-4 text-[11px] font-mono text-slate-500">{row.r}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-rose-500">{row.d}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-500">{row.c}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 tracking-tight">{row.b}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50/50 text-slate-700 border-t border-slate-200">
                                    <td colSpan={2} className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] border-r border-slate-200">Closing Balance C/F</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold border-r border-slate-200">9,05,000.00</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold border-r border-slate-200">17,50,000.00</td>
                                    <td className="px-6 py-4 text-right text-lg font-bold text-primary">53,65,000.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed max-w-3xl">
                            This is an auto-generated <span className="text-primary">{activeReport?.title}</span> statement based on the ledger entries recorded in the InfraPilot system. 
                            As per organizational policy, all financial statements generated here should be verified with physical vouchers and signed by the Chief Accountant before official audit submission.
                        </p>
                    </div>
                </div>
            </PageTransition>
        </>
    );
  }

  return (
    <>
      <Navbar title="Financial Reports" breadcrumb={["Accountant", "Analytics", "Reports Hub"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Analytics</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Reports Hub</h1>
            <p className="text-slate-500 text-sm mt-1">Generate comprehensive financial statements, ledger analytics, and compliance filings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {REPORTS.map(report => (
                <Link 
                    key={report.id} 
                    to={`/accountant/reports/${report.id}`}
                    className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                    </div>
                    
                    <ReportIcon color={report.color} />
                    
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors tracking-tight">{report.title}</h3>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed flex-grow">{report.description}</p>
                    
                    <div className="mt-8 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        Generate Statement 
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </Link>
            ))}
        </div>
      </PageTransition>
    </>
  );
};

export default AccountantReportsPage;
