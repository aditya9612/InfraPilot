import DashboardLayout from "../../../components/common/DashboardLayout";
import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const costData = [
  { name: "Phase 1", budget: 1.2, actual: 1.1 },
  { name: "Phase 2", budget: 2.5, actual: 2.7 },
  { name: "Phase 3", budget: 2.0, actual: 1.5 },
  { name: "Phase 4", budget: 1.5, actual: 0 },
  { name: "Phase 5", budget: 1.0, actual: 0 },
];

const ClientFinancialsSummaryPage = () => (
  <DashboardLayout>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials", "Summary"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Summary</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Overview of project budget and actual expenditures</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Budget", value: "₹8.2 Cr", icon: "📋", color: "text-slate-600 bg-slate-50" },
          { label: "Total Spent", value: "₹5.3 Cr", icon: "✅", color: "text-emerald-600 bg-emerald-50" },
          { label: "Remaining Budget", value: "₹2.9 Cr", icon: "⏳", color: "text-amber-600 bg-amber-50" },
          { label: "Variation Orders", value: "₹20 L", icon: "⚠️", color: "text-red-600 bg-red-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className={`w-10 h-10 ${card.color} rounded-2xl flex items-center justify-center text-lg mb-4 shadow-inner`}>
              {card.icon}
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Phase-wise Cost Tracking</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actual Spent</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="Cr" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="actual" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40}>
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-3xl mb-6 shadow-inner text-primary">📊</div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Budget Utilization</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">64.6% of the total project budget has been utilized across completed phases.</p>
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <div className="flex justify-between mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
                 <span className="text-xs font-black text-slate-800">68%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                 <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
               </div>
            </div>
            <button className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Download Report</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default ClientFinancialsSummaryPage;
