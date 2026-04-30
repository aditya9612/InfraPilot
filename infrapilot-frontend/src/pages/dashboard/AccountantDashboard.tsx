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
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_invoices: 0,
    pending_payments: 0,
    total_expense: 0,
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

      <main className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)] font-inter">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* External Header - Standardized Pattern */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4 mt-2">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Financial Command Center
              </h1>
              <p className="text-slate-500 font-medium mt-1">
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
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm group hover:border-primary/30 transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Project Focus:
                </span>
                <select className="text-sm font-black text-slate-700 outline-none bg-transparent cursor-pointer">
                  <option>All Operations</option>
                  <option>Skyline Residency</option>
                  <option>Metropolis Hub</option>
                  <option>Greenfield Airport</option>
                </select>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  className="bg-primary text-white text-sm font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"
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
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
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
                        className="w-full text-left px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 hover:text-primary transition-all flex items-center gap-4 group"
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

          {/* Primary KPI Grid - 4 Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={`₹${stats.total_revenue.toLocaleString("en-IN")}`}
              sub="Total Income Generated"
              icon={
                <div className="p-2 bg-indigo-50 rounded-xl shadow-inner">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
              }
            />
            <StatCard
              title="Total Expense"
              value={`₹${stats.total_expense.toLocaleString("en-IN")}`}
              sub="Overall Expenditure"
              accent="text-rose-600"
              icon={
                <div className="p-2 bg-rose-50 rounded-xl shadow-inner">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
              }
            />
            <StatCard
              title="Pending Payments"
              value={`₹${stats.pending_payments.toLocaleString("en-IN")}`}
              sub="Outstanding Dues"
              accent="text-amber-600"
              icon={
                <div className="p-2 bg-amber-50 rounded-xl shadow-inner">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              }
            />
            <StatCard
              title="Total Invoices"
              value={stats.total_invoices.toString()}
              sub="Generated Invoices"
              icon={
                <div className="p-2 bg-blue-50 rounded-xl shadow-inner">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Progress Section */}
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <svg className="w-24 h-24 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                </div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">
                      Financial Consumption Status
                    </h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Total Spent vs Available Project Balance
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 tracking-tight">
                      29.1%{" "}
                      <span className="text-xs font-black text-rose-500 uppercase tracking-widest ml-1 bg-rose-50 px-2.5 py-1 rounded-lg">
                        Consumed
                      </span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="bg-rose-500 h-full shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    style={{ width: "29%" }}
                  />
                  <div className="bg-slate-200/50 h-full flex-1" />
                </div>
                <div className="flex gap-8 mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2 group cursor-help">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" /> 
                    <span className="group-hover:text-slate-600 transition-colors">Actual Spend</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-help">
                    <span className="w-3 h-3 rounded-full bg-slate-200" /> 
                    <span className="group-hover:text-slate-600 transition-colors">Buffer Balance</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">
                      Monthly Expense Analysis
                    </h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Categorized spending trends for FY 2026-27
                    </p>
                  </div>
                  <button className="p-3 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-2xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>
                <div className="h-[350px]">
                  <FinanceChart />
                </div>
              </div>

              <InvoiceTable />
            </div>

            {/* Sidebar Section */}
            <div className="space-y-8">
              <BOQSummary />
              <TransactionFeed />

              {/* Specialized Financial Actions */}
              <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8">
                <div className="mb-8">
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">
                        Financial Operations
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Quick Actions & Tools</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button className="flex items-center gap-5 p-5 rounded-[24px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group border-l-4 border-l-blue-500 active:scale-95">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm shadow-primary/10">
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
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        New Expense
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Record a site voucher
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-5 p-5 rounded-[24px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 transition-all group border-l-4 border-l-emerald-500 active:scale-95">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm shadow-emerald-500/10">
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
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        Post Receipt
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Log incoming payment
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-5 p-5 rounded-[24px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-500/5 transition-all group border-l-4 border-l-slate-800 active:scale-95">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform shadow-sm shadow-slate-500/10">
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
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        GST Summary
                      </p>
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
