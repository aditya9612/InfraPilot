import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import { financeService } from "../../services/financeService";
import { dashboardService } from "../../services/dashboardService";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const revenueExpenseData = [
  { month: "Jan", revenue: 42, expense: 31 },
  { month: "Feb", revenue: 55, expense: 38 },
  { month: "Mar", revenue: 38, expense: 42 },
  { month: "Apr", revenue: 68, expense: 45 },
  { month: "May", revenue: 72, expense: 52 },
  { month: "Jun", revenue: 61, expense: 48 },
  { month: "Jul", revenue: 85, expense: 56 },
  { month: "Aug", revenue: 78, expense: 62 },
];

const cashFlowData = [
  { month: "Jan", inflow: 48, outflow: 35, closing: 13 },
  { month: "Feb", inflow: 62, outflow: 41, closing: 34 },
  { month: "Mar", inflow: 45, outflow: 48, closing: 31 },
  { month: "Apr", inflow: 75, outflow: 52, closing: 54 },
  { month: "May", inflow: 82, outflow: 59, closing: 77 },
  { month: "Jun", inflow: 70, outflow: 63, closing: 84 },
];

const projectCostData = [
  { name: "Tower A – Skyline Residency", budget: 500, spent: 300, remaining: 200, color: "#6366f1" },
  { name: "Tower B – Metropolis Hub", budget: 200, spent: 120, remaining: 80, color: "#10b981" },
  { name: "Block C – Green Valley", budget: 350, spent: 280, remaining: 70, color: "#f59e0b" },
  { name: "NH-48 Expansion", budget: 450, spent: 190, remaining: 260, color: "#3b82f6" },
];

const receivables = [
  { client: "Greenfield Developers", invoice: "INV-2041", amount: "₹3,20,000", dueDate: "20 Jun 2026", status: "Overdue" },
  { client: "Metro Infra Ltd.", invoice: "INV-2038", amount: "₹5,50,000", dueDate: "25 Jun 2026", status: "Due Soon" },
  { client: "Skyline Builders", invoice: "INV-2035", amount: "₹1,80,000", dueDate: "02 Jul 2026", status: "Pending" },
  { client: "Coastal Projects", invoice: "INV-2033", amount: "₹8,90,000", dueDate: "10 Jul 2026", status: "Pending" },
];

const payables = [
  { vendor: "Ultratech Cement", billNo: "BILL-801", amount: "₹1,25,000", dueDate: "18 Jun 2026", status: "Overdue" },
  { vendor: "Jindal Steel Works", billNo: "BILL-802", amount: "₹4,20,000", dueDate: "22 Jun 2026", status: "Due Soon" },
  { vendor: "L&T Electrical", billNo: "BILL-803", amount: "₹2,80,000", dueDate: "28 Jun 2026", status: "Pending" },
  { vendor: "Site Contractors Pvt.", billNo: "BILL-804", amount: "₹75,000", dueDate: "05 Jul 2026", status: "Pending" },
];

const upcomingPayments = [
  { label: "Today", items: [{ name: "Vendor Payment – Ultratech", amount: "₹50,000", icon: "🧱" }] },
  { label: "Tomorrow", items: [{ name: "Salary Processing", amount: "₹3,50,000", icon: "👷" }] },
  { label: "In 5 Days", items: [{ name: "GST Payment", amount: "₹1,20,000", icon: "🏛️" }, { name: "Contractor Bill", amount: "₹85,000", icon: "📄" }] },
];

const upcomingReceipts = [
  { label: "Today", items: [{ name: "Client Invoice – Skyline", amount: "₹1,80,000", icon: "🏢" }] },
  { label: "Tomorrow", items: [{ name: "RA Bill Collection", amount: "₹4,50,000", icon: "📋" }] },
  { label: "In 5 Days", items: [{ name: "Advance Payment – Metro Infra", amount: "₹2,00,000", icon: "💰" }] },
];

const recentActivities = [
  { time: "09:00 AM", title: "Vendor Bill Approved", desc: "Ultratech Cement – BILL-801 ₹1,25,000", icon: "✅", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { time: "10:15 AM", title: "Payment Received", desc: "Invoice INV-2033 from Coastal Projects – ₹8,90,000", icon: "💰", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { time: "11:30 AM", title: "Salary Processed", desc: "June payroll disbursed – ₹3,50,000", icon: "👷", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { time: "12:45 PM", title: "GST Return Filed", desc: "GSTR-1 for May 2026 filed successfully", icon: "🏛️", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { time: "02:00 PM", title: "RA Bill Generated", desc: "Tower A – Phase 2 RA Bill ₹12,00,000", icon: "📋", color: "bg-violet-50 text-violet-600 border-violet-100" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Overdue: "bg-rose-50 text-rose-600 border border-rose-100",
    "Due Soon": "bg-amber-50 text-amber-600 border border-amber-100",
    Pending: "bg-slate-100 text-slate-500 border border-slate-200",
    Paid: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  };
  return map[status] || "bg-slate-100 text-slate-500";
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: ₹{p.value}L
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

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
      percentage: 0,
    },
  });

  const [showQAMenu, setShowQAMenu] = useState(false);
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

  // KPI values
  const cashBalance = stats?.vitals?.cash_balance || 2450000;
  const bankBalance = stats?.vitals?.bank_balance || 5500000;
  const receivablesAmt = stats?.vitals?.outstanding_receivables || 1200000;
  const payablesAmt = stats?.vitals?.pending_payables || 850000;
  const totalBudget = stats?.consumption_status?.total_budget || 15000000;
  const totalSpent = stats?.consumption_status?.total_spent || stats?.vitals?.total_expense || 8600000;
  const pl = stats?.vitals?.profit_loss ?? ((stats?.vitals?.total_revenue || 0) - totalSpent);
  const isProfit = pl >= 0;
  const gstDue = stats?.vitals?.gst_due || 120000;

  const formatLakh = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} Lakh`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  const quickActions = [
    { id: "invoice", label: "+ Create Invoice", icon: "🧾", color: "bg-primary text-white hover:bg-blue-600" },
    { id: "rabill", label: "+ Create RA Bill", icon: "📋", color: "bg-indigo-500 text-white hover:bg-indigo-600" },
    { id: "vendor", label: "+ Create Vendor Bill", icon: "🧱", color: "bg-amber-500 text-white hover:bg-amber-600" },
    { id: "payment", label: "+ Record Payment", icon: "💳", color: "bg-emerald-500 text-white hover:bg-emerald-600" },
    { id: "journal", label: "+ Journal Entry", icon: "📒", color: "bg-violet-500 text-white hover:bg-violet-600" },
  ];

  return (
    <>
      <Navbar
        title="Accountant Dashboard"
        breadcrumb={["InfraPilot", "Dashboard", "Financial Overview"]}
      />

      <main className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-12">
        <div className="w-full">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Command Center</h1>
              <p className="text-slate-500 text-sm mt-1">
                Welcome back, Head Accountant •{" "}
                <span className="text-primary font-bold">
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Project Focus */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm hover:border-primary/30 transition-all">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Focus:</span>
                <select className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer">
                  <option>All Operations</option>
                  <option>Skyline Residency</option>
                  <option>Metropolis Hub</option>
                  <option>Green Valley</option>
                  <option>NH-48 Expansion</option>
                </select>
              </div>

              {/* Quick Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowQAMenu(!showQAMenu)}
                  className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="text-lg">⚡</span> Quick Actions
                  <svg className={`w-4 h-4 transition-transform ${showQAMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showQAMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                      Financial Actions
                    </div>
                    {quickActions.map((qa) => (
                      <button
                        key={qa.id}
                        onClick={() => {
                          if (qa.id === "invoice" || qa.id === "vendor") {
                            setActiveCreateType(qa.id === "invoice" ? "owner" : "expense");
                            setIsModalOpen(true);
                          } else {
                            toast.success(`${qa.label} — coming soon`);
                          }
                          setShowQAMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all flex items-center gap-3"
                      >
                        <span className="text-lg">{qa.icon}</span>
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* 1. KPI CARDS — Row 1: Cash Balance, Bank Balance, Receivables, Payables */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Financial Overview</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <StatCard
                title="Cash Balance"
                value={formatLakh(cashBalance)}
                sub="Available Liquidity"
                accent="text-indigo-600"
                trend={{ value: "4.2%", isUp: true }}
                icon={
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                }
              />
              <StatCard
                title="Bank Balance"
                value={formatLakh(bankBalance)}
                sub="Across All Accounts"
                accent="text-blue-600"
                trend={{ value: "2.8%", isUp: true }}
                icon={
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                }
              />
              <StatCard
                title="Outstanding Receivables"
                value={formatLakh(receivablesAmt)}
                sub="Amounts to Collect"
                accent="text-emerald-600"
                trend={{ value: "1.5%", isUp: false }}
                icon={
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                }
              />
              <StatCard
                title="Pending Payables"
                value={formatLakh(payablesAmt)}
                sub="Dues to be Paid"
                accent="text-rose-600"
                trend={{ value: "3.1%", isUp: true }}
                icon={
                  <div className="p-2 bg-rose-50 rounded-xl">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                }
              />
            </div>

            {/* KPI Row 2: Budget, Spent, Net Profit, GST Due */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Budget"
                value={formatLakh(totalBudget)}
                sub="Sanctioned Budget"
                accent="text-violet-600"
                icon={
                  <div className="p-2 bg-violet-50 rounded-xl">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                }
              />
              <StatCard
                title="Total Spent"
                value={formatLakh(totalSpent)}
                sub="Actual Expenditure"
                accent="text-amber-600"
                trend={{ value: `${stats?.consumption_status?.percentage || Math.round((totalSpent / totalBudget) * 100)}% of budget`, isUp: false }}
                icon={
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                }
              />
              <StatCard
                title="Net Profit"
                value={`${isProfit ? "+" : "-"}${formatLakh(Math.abs(pl))}`}
                sub={isProfit ? "Net Profit (Gain)" : "Net Loss"}
                accent={isProfit ? "text-emerald-600" : "text-rose-600"}
                icon={
                  <div className={`p-2 rounded-xl ${isProfit ? "bg-emerald-50" : "bg-rose-50"}`}>
                    <svg className={`w-5 h-5 ${isProfit ? "text-emerald-600" : "text-rose-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isProfit
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />}
                    </svg>
                  </div>
                }
              />
              <StatCard
                title="GST Due"
                value={formatLakh(gstDue)}
                sub="Pending GST Liability"
                accent="text-orange-600"
                trend={{ value: "Due 20 Jun", isUp: false }}
                icon={
                  <div className="p-2 bg-orange-50 rounded-xl">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                }
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* 2 & 3. Charts: Revenue vs Expense  |  Cash Flow */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
            {/* Revenue vs Expense */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Revenue vs Expense</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly comparison – FY 2026-27</p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                  FY 2026-27
                </span>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueExpenseData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barCategoryGap="30%">
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                    <Bar dataKey="revenue" name="Revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="url(#expGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Flow */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Cash Flow</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Inflow · Outflow · Closing Balance</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Inflow</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Outflow</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Closing</span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="closingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="inflow" name="Cash Inflow" stroke="#10b981" strokeWidth={2.5} fill="url(#inflowGrad)" dot={false} />
                    <Area type="monotone" dataKey="outflow" name="Cash Outflow" stroke="#f43f5e" strokeWidth={2.5} fill="url(#outflowGrad)" dot={false} />
                    <Area type="monotone" dataKey="closing" name="Closing Balance" stroke="#3b82f6" strokeWidth={2.5} fill="url(#closingGrad)" dot={false} strokeDasharray="5 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* 4. Project Cost Summary */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Project Cost Summary</h2>
                <p className="text-xs text-slate-400 mt-0.5">Budget vs Spent vs Remaining per project</p>
              </div>
              <button className="text-xs font-bold text-primary hover:underline">View All Projects</button>
            </div>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
              <div className="col-span-3">Project</div>
              <div className="col-span-2 text-right">Budget</div>
              <div className="col-span-2 text-right">Spent</div>
              <div className="col-span-2 text-right">Remaining</div>
              <div className="col-span-3">Progress</div>
            </div>
            <div className="space-y-3">
              {projectCostData.map((p) => {
                const pct = Math.round((p.spent / p.budget) * 100);
                const isOver = pct > 85;
                return (
                  <div key={p.name} className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 px-2 py-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50">
                    <div className="md:col-span-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <p className="text-xs font-bold text-slate-700 leading-tight">{p.name}</p>
                    </div>
                    <div className="md:col-span-2 text-xs font-semibold text-slate-600 md:text-right">₹{p.budget} Lakh</div>
                    <div className="md:col-span-2 text-xs font-semibold text-slate-600 md:text-right">₹{p.spent} Lakh</div>
                    <div className={`md:col-span-2 text-xs font-bold md:text-right ${isOver ? "text-rose-500" : "text-emerald-600"}`}>₹{p.remaining} Lakh</div>
                    <div className="md:col-span-3 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? "#f43f5e" : p.color }}
                        />
                      </div>
                      <span className={`text-[10px] font-black w-9 text-right ${isOver ? "text-rose-500" : "text-slate-500"}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* 5 & 6. Outstanding Receivables | Pending Payables */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Outstanding Receivables */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Outstanding Receivables</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Invoices pending collection</p>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/60">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {receivables.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{r.client}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.invoice}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>{r.dueDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => toast.success("Reminder sent!")} title="Send Reminder" className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all text-[10px] font-bold">🔔</button>
                            <button onClick={() => toast.success("Opening Ledger…")} title="View Ledger" className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all text-[10px] font-bold">📒</button>
                            <button onClick={() => toast.success("Recording payment…")} title="Record Payment" className="p-1 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all text-[10px] font-bold">✅</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Payables */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Pending Payables</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Vendor bills awaiting payment</p>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/60">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill No</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payables.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{p.vendor}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.billNo}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{p.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.dueDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => toast.success("Payment approved!")} title="Approve Payment" className="p-1 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all text-[10px]">✅</button>
                            <button onClick={() => toast.success("Payment scheduled!")} title="Schedule Payment" className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all text-[10px]">🗓️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* 7. Upcoming Payments  |  Upcoming Receipts  |  8. Recent Activities */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Payments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Upcoming Payments</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Scheduled outflows</p>
                </div>
                <span className="text-lg">💸</span>
              </div>
              <div className="space-y-4">
                {upcomingPayments.map((group, gi) => (
                  <div key={gi}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="w-4 h-0.5 bg-slate-200 rounded-full inline-block" />
                      {group.label}
                    </p>
                    {group.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-rose-50/30 hover:border-rose-100 transition-all mb-2 last:mb-0">
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                          <p className="text-[10px] text-rose-500 font-bold mt-0.5">{item.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Receipts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Upcoming Receipts</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Expected inflows</p>
                </div>
                <span className="text-lg">📥</span>
              </div>
              <div className="space-y-4">
                {upcomingReceipts.map((group, gi) => (
                  <div key={gi}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="w-4 h-0.5 bg-slate-200 rounded-full inline-block" />
                      {group.label}
                    </p>
                    {group.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all mb-2 last:mb-0">
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{item.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Recent Activities</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Today's financial events</p>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 rounded-full" />
                <div className="space-y-4">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="flex gap-4 items-start pl-10 relative">
                      <div className={`absolute left-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm border shadow-sm ${act.color}`}>
                        {act.icon}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-slate-700">{act.title}</p>
                          <span className="text-[9px] font-bold text-slate-300 ml-2 whitespace-nowrap">{act.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{act.desc}</p>
                      </div>
                    </div>
                  ))}
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
