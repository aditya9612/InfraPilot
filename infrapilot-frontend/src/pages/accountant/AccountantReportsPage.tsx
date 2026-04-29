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

const ReportIcon = ({ name }: { name: string }) => {
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

  // If a specific report is selected, render dummy report data
  if (reportId) {
    const activeReport = REPORTS.find(r => r.id === reportId);
    
    return (
        <>
            <Navbar title={`${activeReport?.title || 'Report'}`} breadcrumb={["Accountant", "Reports", activeReport?.title || "View"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/accountant/reports" className="text-primary text-xs font-bold hover:underline mb-2 block">← Back to Reports Hub</Link>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeReport?.title} Statement</h2>
                        <p className="text-slate-500 text-sm font-medium">For the period: 01 April 2024 to 30 April 2024</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export PDF
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                            Print Report
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Opening Balance", value: "₹45,20,000", color: "text-slate-600" },
                        { label: reportId === 'pnl' ? "Total Revenue" : "Total Assets", value: "₹1,25,80,000", color: "text-emerald-600" },
                        { label: reportId === 'pnl' ? "Total Expenses" : "Total Liabilities", value: "₹82,40,000", color: "text-rose-600" },
                        { label: "Net Movement", value: "₹43,40,000", color: "text-primary" },
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Report Table */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Statement of Accounts</h3>
                        <span className="text-[10px] font-bold text-slate-400">All amounts in Indian Rupees (₹)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-8 py-5">Particulars / Transaction</th>
                                    <th className="px-8 py-5">Reference</th>
                                    <th className="px-8 py-5 text-right">Debit</th>
                                    <th className="px-8 py-5 text-right">Credit</th>
                                    <th className="px-8 py-5 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium text-sm text-slate-700">
                                {[
                                    { p: "Opening Balance B/F", r: "-", d: "-", c: "-", b: "45,20,000.00" },
                                    { p: "Project Revenue - Site Alpha", r: "INV/24/082", d: "-", c: "12,50,000.00", b: "57,70,000.00" },
                                    { p: "Material Procurement - Steel", r: "PV/24/110", d: "4,20,000.00", c: "-", b: "53,50,000.00" },
                                    { p: "Labor Wages - Week 14", r: "PR/24/014", d: "2,15,000.00", c: "-", b: "51,35,000.00" },
                                    { p: "GST Liability Payment", r: "TAX/24/004", d: "1,85,000.00", c: "-", b: "49,50,000.00" },
                                    { p: "Equipment Hire Charges", r: "EXP/24/442", d: "85,000.00", c: "-", b: "48,65,000.00" },
                                    { p: "Retention Release - Client X", r: "RCT/24/005", d: "-", c: "5,00,000.00", b: "53,65,000.00" },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-bold">{row.p}</td>
                                        <td className="px-8 py-5 text-xs text-slate-400">{row.r}</td>
                                        <td className="px-8 py-5 text-right text-rose-500">{row.d}</td>
                                        <td className="px-8 py-5 text-right text-emerald-500">{row.c}</td>
                                        <td className="px-8 py-5 text-right font-black">{row.b}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900 text-white font-black text-sm">
                                    <td colSpan={2} className="px-8 py-6 uppercase tracking-widest">Closing Balance C/F</td>
                                    <td className="px-8 py-6 text-right">9,05,000.00</td>
                                    <td className="px-8 py-6 text-right">17,50,000.00</td>
                                    <td className="px-8 py-6 text-right text-primary text-lg">53,65,000.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="flex items-center gap-3 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="w-10 h-10 bg-blue-100 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        This is an auto-generated {activeReport?.title} statement based on the ledger entries recorded in the InfraPilot system. Please verify with physical vouchers for official audit purposes.
                    </p>
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
                    <ReportIcon name={report.icon} />
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
