import { useState } from 'react';
import { RefreshCw, Download, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, FileText, PieChart, Activity, Bell } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';

// --- MOCK DATA ---
const REVENUE_EXPENSE_DATA = [
  { month: 'Jan', revenue: 120, expense: 90 },
  { month: 'Feb', revenue: 150, expense: 110 },
  { month: 'Mar', revenue: 180, expense: 130 },
  { month: 'Apr', revenue: 160, expense: 140 },
  { month: 'May', revenue: 210, expense: 160 },
  { month: 'Jun', revenue: 250, expense: 180 },
];

const CASH_FLOW_DATA = [
  { month: 'Jan', inflow: 140, outflow: 100 },
  { month: 'Feb', inflow: 160, outflow: 120 },
  { month: 'Mar', inflow: 200, outflow: 150 },
  { month: 'Apr', inflow: 180, outflow: 160 },
  { month: 'May', inflow: 230, outflow: 170 },
  { month: 'Jun', inflow: 270, outflow: 190 },
];

const RECEIVABLE_AGING = [
  { period: '0-30 Days', amount: '₹80 Lakh', percentage: 38 },
  { period: '31-60 Days', amount: '₹60 Lakh', percentage: 28 },
  { period: '61-90 Days', amount: '₹40 Lakh', percentage: 19 },
  { period: '> 90 Days', amount: '₹30 Lakh', percentage: 15 },
];

const PAYABLE_AGING = [
  { period: '0-30 Days', amount: '₹70 Lakh', percentage: 43 },
  { period: '31-60 Days', amount: '₹50 Lakh', percentage: 31 },
  { period: '61-90 Days', amount: '₹30 Lakh', percentage: 18 },
  { period: '> 90 Days', amount: '₹10 Lakh', percentage: 8 },
];

const PROJECT_COST_SUMMARY = [
  { project: 'Metro', budget: '5 Cr', expense: '3 Cr', remaining: '2 Cr', status: 'On Track' },
  { project: 'Tower A', budget: '2 Cr', expense: '1.5 Cr', remaining: '50 Lakh', status: 'Warning' },
  { project: 'Road', budget: '8 Cr', expense: '6 Cr', remaining: '2 Cr', status: 'On Track' },
];

const UPCOMING_PAYMENTS = [
  { to: 'BuildCorp Materials', date: '28 May 2026', amount: '₹12,50,000' },
  { to: 'Aditya Equipment', date: '30 May 2026', amount: '₹4,30,000' },
];

const UPCOMING_COLLECTIONS = [
  { from: 'Govt. Metro Corp', date: '01 Jun 2026', amount: '₹45,000,000' },
  { from: 'Zenith Estates', date: '05 Jun 2026', amount: '₹18,00,000' },
];

const RECENT_ACTIVITIES = [
  { time: '10:45 AM', text: 'Invoice INV-004 approved by Manager.' },
  { time: '09:12 AM', text: 'Payment of ₹12L received from Zenith Estates.' },
];

const NOTIFICATIONS = [
  { text: 'GST Return filing due in 3 days.', type: 'warning' },
  { text: 'Pending approval for Petty Cash voucher #442.', type: 'info' },
];

export default function AccountantDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAction = (actionName: string) => {
    alert(`${actionName} action triggered successfully!`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-100 shadow-lg rounded-lg p-3 text-xs font-inter">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {entry.value}L
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Navbar title="Dashboard" breadcrumb={['InfraPilot', 'Accountant', 'Dashboard']} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8 space-y-6">

        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Overview</h2>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Financial Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefresh} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              Refresh
            </button>
            <button onClick={() => handleAction('Export Dashboard Report')} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* TOP WIDGETS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Cash', value: '₹15.2 Cr', icon: <DollarSign className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Bank', value: '₹8.4 Cr', icon: <Wallet className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' },
            { label: 'Receivable', value: '₹2.1 Cr', icon: <ArrowDownRight className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Payable', value: '₹1.6 Cr', icon: <ArrowUpRight className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50 border-rose-100' },
            { label: 'GST Due', value: '₹24 Lakh', icon: <FileText className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50 border-amber-100' },
            { label: 'Profit', value: '₹3.5 Cr', icon: <PieChart className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50 border-purple-100' },
          ].map((widget, i) => (
            <div key={i} onClick={() => handleAction(`View ${widget.label} Details`)} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between transition-shadow hover:shadow-md cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl border ${widget.bg}`}>
                  {widget.icon}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{widget.label}</p>
                <p className="text-xl font-black text-slate-800">{widget.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expense */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-sm">Revenue vs Expense Chart</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_EXPENSE_DATA} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}L`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-sm">Cash Flow Graph</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CASH_FLOW_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="inflow" name="Inflow" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="outflow" name="Outflow" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AGING TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Receivable Aging</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RECEIVABLE_AGING.map((item, idx) => (
                    <tr key={idx} onClick={() => handleAction(`View Receivable Aging for ${item.period}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.period}</td>
                      <td className="px-4 py-3 text-xs font-black text-indigo-600 text-right">{item.amount}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Payable Aging</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PAYABLE_AGING.map((item, idx) => (
                    <tr key={idx} onClick={() => handleAction(`View Payable Aging for ${item.period}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.period}</td>
                      <td className="px-4 py-3 text-xs font-black text-rose-600 text-right">{item.amount}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PROJECT COST SUMMARY */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Project Cost Summary</h3>
            <button onClick={() => handleAction('View All Project Costs')} className="text-xs font-bold text-primary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Budget</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expense</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PROJECT_COST_SUMMARY.map((p, idx) => (
                  <tr key={idx} onClick={() => handleAction(`View Cost Details for ${p.project}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-4 text-sm font-bold text-slate-800">{p.project}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-600 text-right">{p.budget}</td>
                    <td className="px-4 py-4 text-sm font-bold text-rose-600 text-right">{p.expense}</td>
                    <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right">{p.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LISTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Upcoming Payments */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Upcoming Payments</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              {UPCOMING_PAYMENTS.map((item, idx) => (
                <div key={idx} onClick={() => handleAction(`Process Payment to ${item.to}`)} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.to}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <p className="text-xs font-black text-rose-600">{item.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Collections */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Upcoming Collections</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              {UPCOMING_COLLECTIONS.map((item, idx) => (
                <div key={idx} onClick={() => handleAction(`Record Collection from ${item.from}`)} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.from}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <p className="text-xs font-black text-indigo-600">{item.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> Recent Activities</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              {RECENT_ACTIVITIES.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{item.text}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500" /> Notifications</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              {NOTIFICATIONS.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-xs font-bold leading-relaxed shadow-sm cursor-pointer hover:shadow-md transition-shadow ${item.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

        </div>

      </PageTransition>
    </>
  );
}
