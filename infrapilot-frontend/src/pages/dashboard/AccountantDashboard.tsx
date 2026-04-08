import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import InvoiceTable from "../../components/dashboard/InvoiceTable";
import ExpenseTable from "../../components/dashboard/ExpenseTable";
import FinanceChart from "../../components/dashboard/FinanceChart";
import BOQSummary from "../../components/dashboard/BOQSummary";
import TransactionFeed from "../../components/dashboard/TransactionFeed";

const AccountantDashboard = () => {
  return (
    <DashboardLayout>
      <Navbar
        title="Accountant Dashboard"
        breadcrumb={["InfraPilot", "Dashboard", "Accountant"]}
        action={{ label: "Financial Report" }}
      />
      
      <main className="p-6 bg-slate-50/50 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome, Accountant</h1>
              <p className="text-sm text-slate-500">Financial overview for today, March 30, 2026.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Project:</span>
                <select className="text-sm font-bold text-slate-700 outline-none bg-transparent">
                  <option>All Projects</option>
                  <option>Skyline Residency</option>
                  <option>Metropolis Hub</option>
                </select>
              </div>
              <button className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Invoice
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value="₹12.4Cr"
              sub="₹2.4Cr this quarter"
              accent="text-emerald-600"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              trend={{ value: "₹42L", isUp: true }}
            />
            <StatCard
              title="Total Invoices"
              value="156"
              sub="12 pending approval"
              icon={<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              trend={{ value: "+8", isUp: true }}
            />
            <StatCard
              title="Pending Payments"
              value="₹62.4L"
              sub="4 invoices overdue"
              accent="text-amber-600"
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              trend={{ value: "₹12L", isUp: false }}
            />
            <StatCard
              title="Total Expenses"
              value="₹8.2Cr"
              sub="66% of revenue"
              accent="text-rose-600"
              icon={<svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              trend={{ value: "4%", isUp: false }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Section - Invoice & Finance */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Progress Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800">Overall Payment Status</h3>
                    <p className="text-xs text-slate-400 mt-1">Total Collections vs Pending Invoices</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">82% <span className="text-xs font-normal text-emerald-500">Collected</span></p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: "82%" }} />
                  <div className="bg-amber-500 h-full" style={{ width: "12%" }} />
                  <div className="bg-rose-500 h-full" style={{ width: "6%" }} />
                </div>
                <div className="flex gap-6 mt-4 justify-center text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Paid</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pending</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue</div>
                </div>
              </div>

              <InvoiceTable />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FinanceChart />
                <ExpenseTable />
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="space-y-6">
              <BOQSummary />
              <TransactionFeed />
              
              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold text-slate-800 mb-4">Financial Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-xs font-bold text-slate-700">Add Expense</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <span className="text-xs font-bold text-slate-700">Record Payment</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="text-xs font-bold text-slate-700">Generate GST Report</span>
                  </button>
                </div>
              </div>

              {/* Reports Export Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                </div>
                <h3 className="font-bold text-white mb-2 relative z-10">Financial Report</h3>
                <p className="text-xs text-slate-400 mb-4 relative z-10">Download detailed project cost analysis for Mar 2026.</p>
                <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors relative z-10">
                  Export to Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default AccountantDashboard;

