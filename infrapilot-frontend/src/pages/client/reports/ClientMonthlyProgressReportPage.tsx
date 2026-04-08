import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const reportData = [
  { month: "Oct", progress: 15 },
  { month: "Nov", progress: 28 },
  { month: "Dec", progress: 42 },
  { month: "Jan", progress: 55 },
  { month: "Feb", progress: 62 },
  { month: "Mar", progress: 68 },
];

const reports = [
  { name: "Monthly Execution Report - March 2026", date: "02 Apr 2026", size: "4.2 MB", type: "PDF", category: "Structural" },
  { name: "Monthly Execution Report - February 2026", date: "01 Mar 2026", size: "3.8 MB", type: "PDF", category: "Foundation" },
  { name: "Monthly Execution Report - January 2026", date: "02 Feb 2026", size: "4.5 MB", type: "PDF", category: "Site Prep" },
  { name: "Monthly Execution Report - December 2025", date: "03 Jan 2026", size: "3.2 MB", type: "PDF", category: "Initial Works" },
];

const ClientMonthlyProgressReportPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Monthly Progress"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Monthly Progress Reports</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Official monthly execution summaries and milestone documentation</p>
      </div>

      {/* Report Controls */}
      <div className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Date Range</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5">
               <input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" defaultValue="2026-03-01" />
               <span className="text-[10px] font-black text-slate-300">TO</span>
               <input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" defaultValue="2026-03-31" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-colors">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             Download PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all">
             <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             Download Excel
          </button>
        </div>
      </div>

      <div className="mb-10 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Progress Growth (Cumulative %)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="%" />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="progress" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Report Archive</h2>
          <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
             <button className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">2026</button>
             <button className="px-4 py-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg">2025</button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {reports.map((report, i) => (
            <div key={i} className="p-8 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex flex-col items-center justify-center shadow-inner border border-red-100 group-hover:scale-110 transition-transform">
                   <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">PDF</span>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                   <h3 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{report.name}</h3>
                   <div className="flex gap-4 mt-1.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Released: {report.date}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Category: {report.category}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Size: {report.size}</p>
                   </div>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 shadow-xl shadow-blue-500/20">
                View Report
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default ClientMonthlyProgressReportPage;
