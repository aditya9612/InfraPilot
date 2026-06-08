import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import InvoiceTable from "../../components/dashboard/InvoiceTable";
import FinanceChart from "../../components/dashboard/FinanceChart";
import BOQSummary from "../../components/dashboard/BOQSummary";
import TransactionFeed from "../../components/dashboard/TransactionFeed";
import { financeService } from "../../services/financeService";
import { dashboardService } from "../../services/dashboardService";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import toast from "react-hot-toast";

const AccountantDashboard = () => {
  const [stats, setStats] = useState<any>({
    vitals: {
      total_revenue: 0,
      total_expense: 0,
      pending_payments_count: 0,
      total_invoices_count: 0,
      outstanding_receivables: 0,
      pending_payables: 0,
      cash_balance: 0,
      profit_loss: 0,
    },
    consumption_status: {
      total_budget: 0,
      total_spent: 0,
      percentage: 0
    }
  });

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCreateType, setActiveCreateType] = useState<any>("owner");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getAccountantDashboard();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch accountant dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      await financeService.createInvoice(data);
      toast.success("Invoice created successfully");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
    }
  };
  return (
    <>
      <Navbar
        title="Accountant Dashboard"
        breadcrumb={["InfraPilot", "Dashboard", "Financial Overview"]}
      />

      <main className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
                Financial Command Center
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Welcome back, Head Accountant •{" "}
                <span className="text-primary font-bold">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm hover:border-primary/30 transition-all">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Project Focus:
                </span>
                <select className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer">
                  <option>All Operations</option>
                  <option>Skyline Residency</option>
                  <option>Metropolis Hub</option>
                  <option>Greenfield Airport</option>
                </select>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Create Invoice
                  <svg
                    className={`w-4 h-4 transition-transform ${showTypeSelector ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showTypeSelector && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                      Select Category
                    </div>
                    {[
                      { id: "labour", label: "Labour Invoice", icon: "👷" },
                      { id: "material", label: "Material Supply", icon: "🏗️" },
                      { id: "owner", label: "Owner Billing", icon: "🏢" },
                      { id: "expense", label: "Site Expense", icon: "💵" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setActiveCreateType(type.id);
                          setIsModalOpen(true);
                          setShowTypeSelector(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all flex items-center gap-3"
                      >
                        <span className="text-xl group-hover:scale-125 transition-transform">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Vitals */}
          <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Financial Vitals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Total Project Budget */}
            <StatCard
              title="Total Project Budget"
              value={`₹${(stats?.consumption_status?.total_budget || 0).toLocaleString("en-IN")}`}
              sub="Sanctioned Budget"
              accent="text-blue-700"
              icon={
                <div className="p-2 bg-blue-50 rounded-xl shadow-inner">
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h4l2-3h4l2 3h4a2 2 0 012 2v12a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11v6m-3-3h6" /></svg>
                </div>
              }
            />

            {/* 2. Total Spent (खर्च) */}
            <StatCard
              title="Total (Spent)"
              value={`₹${(stats?.consumption_status?.total_spent || stats?.vitals?.total_expense || 0).toLocaleString("en-IN")}`}
              sub="Actual Expenditure"
              accent="text-rose-600"
              icon={
                <div className="p-2 bg-rose-50 rounded-xl shadow-inner">
                  <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
              }
            />

            {/* 3. Outstanding Receivables */}
            <StatCard
              title="Outstanding Receivables"
              value={`₹${(stats?.vitals?.outstanding_receivables || 0).toLocaleString("en-IN")}`}
              sub="Amounts to Collect"
              accent="text-emerald-600"
              icon={
                <div className="p-2 bg-emerald-50 rounded-xl shadow-inner">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
              }
            />

            {/* 4. Pending Payables */}
            <StatCard
              title="Pending Payables"
              value={`₹${(stats?.vitals?.pending_payables || stats?.vitals?.pending_payments_count || 0).toLocaleString("en-IN")}`}
              sub="Dues to be Paid"
              accent="text-amber-600"
              icon={
                <div className="p-2 bg-amber-50 rounded-xl shadow-inner">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              }
            />

            {/* 5. Cash Balance */}
            <StatCard
              title="Cash Balance"
              value={`₹${(stats?.vitals?.cash_balance || 0).toLocaleString("en-IN")}`}
              sub="Available Liquidity"
              accent="text-indigo-600"
              icon={
                <div className="p-2 bg-indigo-50 rounded-xl shadow-inner">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              }
            />

            {/* 6. Profit / Loss */}
            {(() => {
              const pl = stats?.vitals?.profit_loss ??
                ((stats?.vitals?.total_revenue || 0) - (stats?.consumption_status?.total_spent || stats?.vitals?.total_expense || 0));
              const isProfit = pl >= 0;
              return (
                <StatCard
                  title="Profit / Loss"
                  value={`${isProfit ? '+' : '-'}₹${Math.abs(pl).toLocaleString("en-IN")}`}
                  sub={isProfit ? "Net Profit" : "Net Loss"}
                  accent={isProfit ? "text-emerald-600" : "text-rose-600"}
                  icon={
                    <div className={`p-2 rounded-xl shadow-inner ${isProfit ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      <svg className={`w-6 h-6 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isProfit
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        }
                      </svg>
                    </div>
                  }
                />
              );
            })()}
          </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6">
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Progress Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <svg className="w-24 h-24 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                </div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Financial Consumption Status
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Total spent vs available project balance
                    </p>
                  </div>
                  <span className="w-fit px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                    {stats?.consumption_status?.percentage || 0}% Consumed
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="bg-rose-500 h-full shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-1000"
                    style={{ width: `${stats?.consumption_status?.percentage || 0}%` }}
                  />
                  <div className="bg-slate-200/50 h-full flex-1" />
                </div>
                <div className="flex items-center gap-5 mt-5 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-rose-500" />
                    <span className="text-[10px] font-bold text-slate-400">Actual Spend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400">Buffer Balance</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Monthly Expense Analysis
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Categorized spending trends for FY 2026-27
                    </p>
                  </div>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-xl uppercase tracking-widest">FY 2026-27</span>
                </div>
                <div className="h-[350px]">
                  <FinanceChart />
                </div>
              </div>

              <InvoiceTable />
              <BOQSummary />
            </div>

            {/* Sidebar Section */}
            <div className="space-y-8">
              <TransactionFeed />

              {/* Specialized Financial Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    Financial Operations
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quick Actions & Tools</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => { setActiveCreateType("expense"); setIsModalOpen(true); }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group border-l-4 border-l-blue-500 active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">New Expense</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Record a site voucher
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActiveCreateType("owner"); setIsModalOpen(true); }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group border-l-4 border-l-emerald-500 active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">Post Receipt</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Log incoming payment
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => toast.success("GST Summary exported successfully")}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all group border-l-4 border-l-slate-700 active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">GST Summary</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Generate monthly GSTR
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={[]}
        onSubmit={handleCreateOrUpdate}
        initialType={activeCreateType}
      />
    </>
  );
};

export default AccountantDashboard;
