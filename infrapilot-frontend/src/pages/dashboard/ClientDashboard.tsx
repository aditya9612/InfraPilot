import Navbar from "../../components/common/Navbar";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const costData = [
  { name: "Phase 1", budget: 1.2, actual: 1.1 },
  { name: "Phase 2", budget: 2.5, actual: 2.7 },
  { name: "Phase 3", budget: 1.8, actual: 1.5 },
];

const sitePhotos = [
  { id: 1, url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=400&h=300&fit=crop", date: "Today", desc: "Slab reinforcement check" },
  { id: 2, url: "https://images.unsplash.com/photo-1503387762-592dea58ef21?w=400&h=300&fit=crop", date: "29 Mar 2026", desc: "Foundation concrete pour" },
  { id: 3, url: "https://images.unsplash.com/photo-1590486803833-ffc45744a3ae?w=400&h=300&fit=crop", date: "30 Mar 2026", desc: "Brickwork progress - L1" },
];

const updates = [
  { id: 1, text: "Slab reinforcement for Phase 3 completed", time: "Today's Work", icon: "🏗️" },
  { id: 2, text: "Main gate structure framing completed", time: "Yesterday", icon: "✔" },
  { id: 3, text: "Electrical wirings for 1st floor delivered", time: "2 days ago", icon: "🚚" },
];

const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Project Command Center</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Skyline Tower Project</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-black text-slate-700">Project Status: Healthy</p>
            </div>
          </div>
        </div>
        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Overall Progress", value: "68%", sub: "Phase 3 in progress", icon: "📊", color: "text-blue-600 bg-blue-50" },
            { label: "Budget / Spent", value: "₹8.2Cr / ₹5.3Cr", sub: "Actual vs Projection", icon: "📉", color: "text-indigo-600 bg-indigo-50" },
            { label: "Total Paid / Pending", value: "₹4.8Cr / ₹0.5Cr", sub: "Financial Clearance", icon: "💰", color: "text-emerald-600 bg-emerald-50" },
            { label: "Expected Completion", value: "12 Oct 2026", sub: "Target Timeline", icon: "📅", color: "text-amber-600 bg-amber-50" },
            { label: "Days Remaining", value: "188 Days", sub: "Operational Runway", icon: "⏳", color: "text-orange-600 bg-orange-50" },
            { label: "Open Issues", value: "3 Open", sub: "Variation Approvals", icon: "⚠️", color: "text-red-600 bg-red-50" },
            { label: "Latest Update", value: "Slab Reinforcement", sub: "Today's Execution", icon: "🚀", color: "text-purple-600 bg-purple-50" },
            { label: "Client Account", value: user?.name || "Client", sub: "Premium Access", icon: "👤", color: "text-slate-600 bg-slate-50" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group">
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-xl mb-6 shadow-inner group-hover:scale-110 transition-transform`}>{card.icon}</div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-xl font-black text-slate-800 tracking-tight leading-none">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Project Progress Viz */}
            <div className="bg-white rounded-[48px] p-12 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                    <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={628.3} strokeDashoffset={628.3 * (1 - 0.68)} className="text-primary rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/20" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black text-slate-800 tracking-tighter">68%</span>
                    <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Project Progress</span>
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Structural Phase III: <br/>Roof Slab & MEP Hookups</h2>
                    <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">Today's Work focus: Finalizing rebar arrangement for the primary roof slab and ensuring plumbing sleeves are accurately placed.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Last Completed</p>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-tight">4th Floor Column Pour</p>
                    </div>
                    <div className="p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20">
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1 italic">Upcoming Today</p>
                      <p className="text-xs font-black text-white uppercase tracking-tight">Casting Prep Meeting</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Financial Status Bar Chart */}
            <div className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Cost Management Audit</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Projected Budget vs Actual Real-time Spent (₹ Cr)</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Projected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Actual</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} unit="Cr" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }} />
                    <Bar dataKey="budget" fill="#F1F5F9" radius={[12, 12, 0, 0]} barSize={40} />
                    <Bar dataKey="actual" fill="#2563EB" radius={[12, 12, 0, 0]} barSize={40}>
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Site Photos Gallery Snippet */}
            <div className="space-y-6 pb-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Site Evidence</h2>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Explore Full Gallery</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {sitePhotos.map(photo => (
                  <div key={photo.id} className="group cursor-pointer">
                    <div className="aspect-[4/3] rounded-[40px] overflow-hidden mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                      <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <p className="text-sm font-black text-slate-800 px-2 tracking-tight">{photo.desc}</p>
                    <p className="text-[10px] text-slate-400 font-bold px-2 mt-1 uppercase tracking-widest">{photo.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Side Module: Alerts, Updates, and Actions */}
          <div className="space-y-10">
            {/* Timeline Stream */}
            <div className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-10 border-b border-slate-50 pb-4">Live Execution Feed</h2>
              <div className="space-y-10 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {updates.map(update => (
                  <div key={update.id} className="relative pl-12">
                    <span className="absolute left-0 top-0 w-8 h-8 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm shadow-md shadow-slate-100 group-hover:scale-110 transition-transform">{update.icon}</span>
                    <p className="text-[13px] font-bold text-slate-800 leading-relaxed tracking-tight">{update.text}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{update.time}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Critical Alert */}
            <div className="p-8 bg-red-50 border border-red-100 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-xl shadow-red-200 shrink-0">⚠️</div>
                <div className="flex-1">
                  <p className="text-[11px] font-black text-red-600 uppercase tracking-widest italic">Variation Alert</p>
                  <p className="text-sm text-red-500 font-bold mt-2 leading-relaxed">Phase 2 structural budget variation of ₹20L requires signature.</p>
                  <button className="mt-4 px-6 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">Sign Now</button>
                </div>
              </div>
            </div>
            {/* Quick Portal Switcher */}
            <div className="bg-slate-900 rounded-[48px] p-8 text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6 italic">Support Access</p>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                    <div className="text-left">
                      <p className="text-sm font-black tracking-tight">Site Engineer Chat</p>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Available Now</p>
                    </div>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-5 bg-primary rounded-3xl shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all group">
                    <div className="text-left">
                      <p className="text-sm font-black tracking-tight text-white">Instant Portal Bot</p>
                      <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">AI Assistance</p>
                    </div>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">⚡</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboard;
