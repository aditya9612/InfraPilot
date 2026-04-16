import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import InvoiceTable from "../../components/dashboard/InvoiceTable";
import FinanceChart from "../../components/dashboard/FinanceChart";
import BOQSummary from "../../components/dashboard/BOQSummary";
import TransactionFeed from "../../components/dashboard/TransactionFeed";

const AccountantDashboard = () => {
  return (
    <>
      <Navbar
        title="Accountant Dashboard"
        breadcrumb={["InfraPilot", "Dashboard", "Financial Overview"]}
      />
      
      <main className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)] font-inter">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* External Header - Standardized Pattern */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Command Center</h1>
              <p className="text-slate-500 mt-1 capitalize">Welcome, Head Accountant • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Focus:</span>
                <select className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer">
                  <option>All Operations</option>
                  <option>Skyline Residency</option>
                  <option>Metropolis Hub</option>
                  <option>Greenfield Airport</option>
                </select>
              </div>
              <button className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Create Invoice
              </button>
            </div>
          </div>

          {/* Primary KPI Grid - 6 Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Project Budget"
              value="₹42.5Cr"
              sub="Total Sanctioned"
              icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <StatCard
              title="Total Spent (खर्च)"
              value="₹12.4Cr"
              sub="29% Consumption"
              accent="text-rose-600"
              icon={<svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <StatCard
              title="Receivables"
              value="₹4.2Cr"
              sub="Outstanding Dues"
              accent="text-emerald-600"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <StatCard
              title="Pending Payables"
              value="₹1.8Cr"
              sub="Unpaid Vouchers"
              accent="text-amber-600"
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Cash Balance"
              value="₹2.15Cr"
              sub="Liquid & Petty"
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            />
            <StatCard
              title="Profit / Loss"
               value="+ ₹82L"
              sub="Net Realized"
              accent="text-emerald-600"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Progress Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Financial Consumption Status</h3>
                    <p className="text-xs text-slate-400 mt-1">Total Spent vs Available Project Balance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">29.1% <span className="text-xs font-normal text-rose-500 ml-1">Consumed</span></p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-rose-500 h-full" style={{ width: "29%" }} />
                  <div className="bg-slate-200 h-full flex-1" />
                </div>
                <div className="flex gap-6 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Actual Spend</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200" /> Buffer Balance</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Monthly Expense Analysis</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Categorized spending trends for FY 2026-27</p>
                    </div>
                 </div>
                 <div className="h-[300px]">
                    <FinanceChart />
                 </div>
              </div>
              
              <InvoiceTable />
            </div>

            {/* Sidebar Section */}
            <div className="space-y-6">
              <BOQSummary />
              <TransactionFeed />
              
              {/* Specialized Financial Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-5">Financial Operations</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group border-l-4 border-l-blue-500">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">New Expense</p>
                      <p className="text-[10px] text-slate-400">Record a site voucher</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group border-l-4 border-l-emerald-500">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Post Receipt</p>
                      <p className="text-[10px] text-slate-400">Log incoming payment</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group border-l-4 border-l-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">GST Summary</p>
                      <p className="text-[10px] text-slate-400">Generate monthly GSTR</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AccountantDashboard;

