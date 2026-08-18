import { useState, useEffect } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight, IndianRupee, Wallet, FileText, PieChart, Activity, Bell, Download } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { dashboardService } from '../../services/dashboardService';
import toast from 'react-hot-toast';



export default function AccountantDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardService.getAccountantDashboard();
      setDashboardData(response);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const handleAction = (actionName: string) => {
    alert(`${actionName} action triggered successfully!`);
  };

  const handleExport = async () => {
    try {
      const toastId = toast.loading('Exporting dashboard...');
      const blob = await dashboardService.exportAccountantDashboard();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Accountant_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Dashboard exported successfully!', { id: toastId });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export dashboard');
    }
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

  const revenueExpenseData = dashboardData?.revenue_vs_expense || [];
  const cashFlowData = dashboardData?.cash_flow || [];
  const receivableAging = dashboardData?.receivable_aging || [];
  const payableAging = dashboardData?.payable_aging || [];
  const projectCostSummary = dashboardData?.project_cost_summary || [];
  const upcomingPayments = dashboardData?.upcoming_payments || [];
  const upcomingCollections = dashboardData?.upcoming_collections || [];
  const recentActivities = dashboardData?.recent_activities || [];
  const notifications = dashboardData?.notifications || [];

  const widgets = [
    { label: 'Cash', value: dashboardData?.kpi_cards?.cash_balance !== undefined ? `₹${dashboardData.kpi_cards.cash_balance}` : '₹0', icon: <IndianRupee className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Bank', value: dashboardData?.kpi_cards?.bank_balance !== undefined ? `₹${dashboardData.kpi_cards.bank_balance}` : '₹0', icon: <Wallet className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' },
    { label: 'Receivable', value: dashboardData?.kpi_cards?.receivables !== undefined ? `₹${dashboardData.kpi_cards.receivables}` : '₹0', icon: <ArrowDownRight className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Payable', value: dashboardData?.kpi_cards?.payables !== undefined ? `₹${dashboardData.kpi_cards.payables}` : '₹0', icon: <ArrowUpRight className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50 border-rose-100' },
    { label: 'Total Budget', value: dashboardData?.kpi_cards?.total_budget !== undefined ? `₹${dashboardData.kpi_cards.total_budget}` : '₹0', icon: <Wallet className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50 border-teal-100' },
    { label: 'Total Spent', value: dashboardData?.kpi_cards?.total_spent !== undefined ? `₹${dashboardData.kpi_cards.total_spent}` : '₹0', icon: <Activity className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50 border-orange-100' },
    { label: 'GST Due', value: dashboardData?.kpi_cards?.gst_due !== undefined ? `₹${dashboardData.kpi_cards.gst_due}` : '₹0', icon: <FileText className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50 border-amber-100' },
    { label: 'Profit', value: dashboardData?.kpi_cards?.net_profit !== undefined ? `₹${dashboardData.kpi_cards.net_profit}` : '₹0', icon: <PieChart className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50 border-purple-100' },
  ];

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
            <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm shadow-indigo-600/20 active:scale-95">
              <Download className="w-4 h-4" />
              Export Dashboard Report
            </button>
            <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50 active:scale-95">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* TOP WIDGETS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {widgets.map((widget, i) => (
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
                <BarChart data={revenueExpenseData} barSize={12}>
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
                <LineChart data={cashFlowData}>
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
                  {receivableAging.map((item: any, idx: number) => (
                    <tr key={idx} onClick={() => handleAction(`View Receivable Aging for ${item.period}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.period}</td>
                      <td className="px-4 py-3 text-xs font-black text-indigo-600 text-right">₹{item.amount}</td>
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
                  {payableAging.map((item: any, idx: number) => (
                    <tr key={idx} onClick={() => handleAction(`View Payable Aging for ${item.period}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.period}</td>
                      <td className="px-4 py-3 text-xs font-black text-rose-600 text-right">₹{item.amount}</td>
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
            {projectCostSummary.length > 3 && (
              <button 
                onClick={() => setShowAllProjects(!showAllProjects)} 
                className="text-xs font-bold text-primary hover:underline"
              >
                {showAllProjects ? 'View Less' : 'View All'}
              </button>
            )}
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
                {(showAllProjects ? projectCostSummary : projectCostSummary.slice(0, 3)).map((p: any, idx: number) => (
                  <tr key={idx} onClick={() => handleAction(`View Cost Details for ${p.project_name}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-4 text-sm font-bold text-slate-800">{p.project_name}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-600 text-right">₹{p.budgeted}</td>
                    <td className="px-4 py-4 text-sm font-bold text-rose-600 text-right">₹{p.spent}</td>
                    <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right">₹{p.remaining}</td>
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
              {upcomingPayments.map((item: any, idx: number) => (
                <div key={idx} onClick={() => handleAction(`Process Payment to ${item.entity_name || item.to}`)} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.entity_name || item.to}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <p className="text-xs font-black text-rose-600">₹{item.amount}</p>
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
              {upcomingCollections.map((item: any, idx: number) => (
                <div key={idx} onClick={() => handleAction(`Record Collection from ${item.entity_name || item.from}`)} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.entity_name || item.from}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <p className="text-xs font-black text-indigo-600">₹{item.amount}</p>
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
              {recentActivities.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{item.activity || item.text}</p>
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
              {notifications.map((item: any, idx: number) => {
                const text = typeof item === 'string' ? item : item.text;
                const type = typeof item === 'string' ? 'info' : item.type;
                return (
                  <div key={idx} className={`p-3 rounded-xl border text-xs font-bold leading-relaxed shadow-sm cursor-pointer hover:shadow-md transition-shadow ${type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    {text}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </PageTransition>
    </>
  );
}
