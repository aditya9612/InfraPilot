import DashboardLayout from "../../../components/common/DashboardLayout";
import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Oct", cost: 1.2 },
  { month: "Nov", cost: 2.1 },
  { month: "Dec", cost: 3.4 },
  { month: "Jan", cost: 4.2 },
  { month: "Feb", cost: 4.8 },
  { month: "Mar", cost: 5.3 },
];

const ClientFinancialReportPage = () => (
  <DashboardLayout>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Financial Report"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial & Audit Reports</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time budget utilization vs actual expenditure analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 h-[450px] flex flex-col">
          <div className="mb-8">
             <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Cumulative Spent (₹ Cr)</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total expenditure tracked over the last 6 months</p>
          </div>
          <div className="flex-1">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="Cr" />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                 <Bar dataKey="cost" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
               <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-10">Quarterly Audit Summary</h2>
               <div className="space-y-6">
                  {[
                    { label: "Total Budget Utilized", val: "₹5.3 Cr", change: "+12.5%", color: "text-blue-600" },
                    { label: "Budget Savings (Variance)", val: "₹0.9 Cr", change: "On Track", color: "text-emerald-600" },
                    { label: "Pending Vendor Payments", val: "₹0.2 Cr", change: "3 Pending", color: "text-amber-600" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className={`text-2xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">{stat.change}</span>
                    </div>
                  ))}
               </div>
            </div>
            <button className="w-full mt-8 py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all">
                Download Detailed Audit PDF
            </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default ClientFinancialReportPage;
