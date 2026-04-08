import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const reportData = [
  { month: "Oct", progress: 15, cost: 1.2 },
  { month: "Nov", progress: 28, cost: 2.1 },
  { month: "Dec", progress: 42, cost: 3.4 },
  { month: "Jan", progress: 55, cost: 4.2 },
  { month: "Feb", progress: 62, cost: 4.8 },
  { month: "Mar", progress: 68, cost: 5.3 },
];

const ClientReportsPage = () => (
  <DashboardLayout>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Reports</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Detailed analytics & monthly performance summaries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Progress Growth (Cumulative %)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="%" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="progress" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Cumulative Spent (₹ Cr)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="Cr" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="cost" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Monthly Report Archive</h2>
        <div className="space-y-3">
          {[
            { name: "Monthly Execution Report - March 2026", date: "02 Apr 2026", type: "PDF" },
            { name: "Financial Audit Report - Q1 2026", date: "25 Mar 2026", type: "PDF" },
            { name: "Safety & Compliance Audit - Feb 2026", date: "05 Mar 2026", type: "PDF" },
            { name: "Quality Control Summary - Jan 2026", date: "02 Feb 2026", type: "PDF" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 font-black text-[10px] shadow-sm">{item.type}</div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{item.date}</p>
                </div>
              </div>
              <button className="p-2.5 bg-white rounded-xl text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default ClientReportsPage;
