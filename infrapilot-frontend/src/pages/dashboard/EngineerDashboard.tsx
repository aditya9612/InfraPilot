import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Mock Data ──────────────────────────────────────────────────────────────
const costData = [
  { name: 'Jan', budget: 4000, actual: 4400 },
  { name: 'Feb', budget: 3000, actual: 3200 },
  { name: 'Mar', budget: 5000, actual: 4800 },
  { name: 'Apr', budget: 4500, actual: 4100 },
];

const activityHistory = [
  { id: 1, type: "report", desc: "Daily Report submitted", time: "09:30 AM", icon: "📝" },
  { id: 2, type: "photo", desc: "4 site photos uploaded", time: "10:15 AM", icon: "📸" },
  { id: 3, type: "issue", desc: "Water leakage reported at Level 2", time: "11:00 AM", icon: "⚠️" },
  { id: 4, type: "material", desc: "Steel delivery verified", time: "02:45 PM", icon: "🚚" },
];

const stockStatus = [
  { item: "Cement", status: "Low", value: "5 bags", color: "text-red-500 bg-red-50" },
  { item: "Sand", status: "OK", value: "12m³", color: "text-green-500 bg-green-50" },
  { item: "Steel Rods", status: "Low", value: "200kg", color: "text-orange-500 bg-orange-50" },
];

const EngineerDashboard = () => {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <DashboardLayout>
      <Navbar title="Site Overview" breadcrumb={["InfraPilot", "Engineer", "Dashboard"]} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-24">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Metro Extension Ph-II</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">
              Engineer ID: SE-2025-092 &nbsp;·&nbsp; {today}
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-primary/20 transition-all">
            <span className="text-3xl animate-bounce">☀️</span>
            <div>
              <p className="text-sm font-black text-slate-800">Sunny, 32°C</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mumbai West Site</p>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Labor Today", value: "48", detail: "12 Skilled", icon: "👷", color: "bg-blue-50 text-blue-600" },
            { label: "Active Items", value: "14", detail: "4 Priority", icon: "🏗️", color: "bg-purple-50 text-purple-600" },
            { label: "Open Issues", value: "02", detail: "1 Critical", icon: "⚠️", color: "bg-red-50 text-red-600" },
            { label: "Stock Alert", value: "Low", detail: "Cement/Steel", icon: "📦", color: "bg-orange-50 text-orange-600" },
            { label: "Progress", value: "64%", detail: "On Track", icon: "📈", color: "bg-emerald-50 text-emerald-600" },
            { label: "Activities", value: "08", detail: "Today", icon: "🗓️", color: "bg-slate-50 text-slate-600" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform cursor-default">
              <span className={`w-9 h-9 ${card.color} rounded-xl flex items-center justify-center text-lg`}>{card.icon}</span>
              <div>
                <p className="text-xl font-black text-slate-800 leading-none">{card.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1 truncate">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content: Summary & Cost */}
          <div className="lg:col-span-2 space-y-8">

            {/* Today's Work Summary */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Today's Work Summary</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-50 text-success text-[10px] font-bold rounded-full">LIVE UPDATE</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <p className="text-sm text-slate-600 leading-relaxed font-bold relative z-10">
                  Completed foundation concrete pour for Block A pillars 12-15. Steel reinforcement check for Section 2 is currently in progress.
                  Morning safety brief completed with all staff present. Ready for afternoon site audit.
                </p>
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-200/50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified by Team Leads</p>
                </div>
              </div>
            </div>

            {/* Cost Tracking Graph */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Cost Tracking</h2>
                  <p className="text-xl font-black text-slate-800 tracking-tight">Budget vs Actual <span className="text-slate-300 font-medium">(₹ Lacs)</span></p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  <button className="px-4 py-1.5 bg-white text-primary text-[10px] font-bold rounded-xl shadow-sm">Monthly</button>
                  <button className="px-4 py-1.5 text-slate-400 text-[10px] font-bold rounded-xl">Yearly</button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="budget" name="Budget" fill="#f1f5f9" radius={[8, 8, 8, 8]} barSize={24} />
                    <Bar dataKey="actual" name="Actual" fill="#4f46e5" radius={[8, 8, 8, 8]} barSize={24}>
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#f43f5e' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-8 mt-8 justify-center border-t border-slate-50 pt-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Budgeted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Actual Spent</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Area: Stock & Activity */}
          <div className="space-y-8">

            {/* Material Stock */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Critical Stock</h2>
              <div className="space-y-4">
                {stockStatus.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.status === "Low" ? "bg-red-50" : "bg-green-50"}`}>
                        {item.item === "Cement" ? "🧱" : item.item === "Sand" ? "🏖️" : "🏗️"}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 leading-none">{item.item}</p>
                        <p className={`text-[9px] font-bold mt-1.5 uppercase tracking-tight ${item.status === "Low" ? "text-red-500" : "text-success"}`}>
                          {item.status} · {item.value}
                        </p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white text-slate-400 group-hover:text-primary transition-colors flex items-center justify-center font-bold">+</button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-4 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.2em] border-2 border-dashed border-slate-100 rounded-2xl hover:bg-white hover:border-primary/20 transition-all">
                Full Inventory →
              </button>
            </div>

            {/* Site Pulse (Activity) */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Site Pulse</h2>
              <div className="space-y-8 relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />
                {activityHistory.map((act, i) => (
                  <div key={i} className="flex gap-5 relative z-10 group">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 group-hover:border-primary/50 flex items-center justify-center text-sm shadow-sm transition-colors">
                      {act.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-primary transition-colors">{act.desc}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{act.time} &nbsp;·&nbsp; FIELD LOG</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-10 py-4 bg-slate-900 shadow-xl shadow-slate-200 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all">
                Submit Daily Update
              </button>
            </div>

            {/* Issue Reporting */}
            <button
              onClick={() => setShowIssueForm(true)}
              className="w-full py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-[20px] text-[11px] font-black uppercase tracking-widest border border-red-500/10 transition-all flex items-center justify-center gap-3 group"
            >
              <span className="group-hover:animate-pulse">⚠️</span> Report Site Incident
            </button>

          </div>

        </div>

      </div>

      {/* Simplified Issue Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative">
            <button onClick={() => setShowIssueForm(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 text-3xl leading-none">×</button>
            <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tighter uppercase italic">Log Incident</h3>
            <div className="space-y-5">
              <input type="text" placeholder="What happened?" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none" />
              <textarea placeholder="Tell us more details..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium h-32 focus:ring-2 ring-primary/20 outline-none resize-none" />
              <div className="flex gap-2">
                {["Low", "Medium", "Critical"].map(p => (
                  <button key={p} className="flex-1 py-3 bg-slate-50 text-[10px] font-black text-slate-400 rounded-xl hover:bg-red-500 hover:text-white uppercase transition-all">
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowIssueForm(false)} className="w-full py-5 bg-red-500 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-200 mt-4 active:scale-95 transition-all">
                Publish Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EngineerDashboard;
