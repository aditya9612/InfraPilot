import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { projectService } from "../../services/projectService";

const costData = [
  { name: "Phase 1", budget: 1.2, actual: 1.1 },
  { name: "Phase 2", budget: 2.5, actual: 2.7 },
  { name: "Phase 3", budget: 2.0, actual: 1.5 },
  { name: "Phase 4", budget: 1.5, actual: 0 },
  { name: "Phase 5", budget: 1.0, actual: 0 },
];

const invoices = [
  { id: "INV-2026-42", desc: "Steel & Shuttering — Phase 3", amount: "₹38,40,000", date: "28 Mar 2026", status: "Paid" },
  { id: "INV-2026-41", desc: "Labour Charges — Feb 2026", amount: "₹12,00,000", date: "05 Mar 2026", status: "Paid" },
  { id: "INV-2026-40", desc: "Variation — Steel Price Surge", amount: "₹20,00,000", date: "20 Feb 2026", status: "Pending" },
  { id: "INV-2026-39", desc: "RCC Work — 3rd Floor", amount: "₹45,00,000", date: "15 Feb 2026", status: "Paid" },
];

const ClientFinancialsPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjectById(projectId);
        setProjectData(data);
      } catch (err) {
        console.error("Failed to fetch project for financials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <>
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials"]} />
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{projectData?.project_name || "Financials"}</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Budget, cost tracking & invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Contract", value: "₹8.2 Cr", icon: "📋", color: "bg-slate-50 text-slate-600" },
            { label: "Amount Paid", value: "₹5.3 Cr", icon: "✅", color: "bg-emerald-50 text-emerald-600" },
            { label: "Pending", value: "₹2.9 Cr", icon: "⏳", color: "bg-amber-50 text-amber-600" },
            { label: "Variation Orders", value: "₹20 L", icon: "⚠️", color: "bg-red-50 text-red-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-start min-h-[140px]">
              <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-lg mb-4`}>{c.icon}</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Phase-wise Budget vs Actual</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /><span className="text-[10px] font-bold text-slate-400">Budget</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /><span className="text-[10px] font-bold text-slate-400">Actual</span></div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} unit="Cr" />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="actual" radius={[4, 4, 0, 0]} barSize={20}>
                    {costData.map((entry, index) => (
                      <Cell key={index} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Recent Invoices</h2>
            <div className="space-y-3">
              {invoices.map((inv, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{inv.desc}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{inv.id} · {inv.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-600">{inv.amount}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${inv.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientFinancialsPage;
