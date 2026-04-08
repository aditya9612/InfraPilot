import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const costData = [
  { name: "Phase 1", budget: 1.2, actual: 1.1 },
  { name: "Phase 2", budget: 2.5, actual: 2.7 },
  { name: "Phase 3", budget: 1.8, actual: 1.5 },
];

const sitePhotos = [
  { id: 1, url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=400&h=300&fit=crop", date: "28 Mar 2026", desc: "Slab reinforcement check" },
  { id: 2, url: "https://images.unsplash.com/photo-1503387762-592dea58ef21?w=400&h=300&fit=crop", date: "29 Mar 2026", desc: "Foundation concrete pour" },
  { id: 3, url: "https://images.unsplash.com/photo-1590486803833-ffc45744a3ae?w=400&h=300&fit=crop", date: "30 Mar 2026", desc: "Brickwork progress - L1" },
];

const updates = [
  { id: 1, text: "Main gate structure framing completed", time: "3h ago", icon: "✔" },
  { id: 2, text: "Electrical wirings for 1st floor delivered", time: "Yesterday", icon: "🚚" },
  { id: 3, text: "Weekly site safety audit passed", time: "2 days ago", icon: "🛡️" },
];

const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Navbar
        title="Project Transparency Portal"
        breadcrumb={["InfraPilot", "Client", "Dashboard"]}
      />

      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome, {user?.name || "Mr. Sharma"}</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time Project Tracking</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <select className="bg-transparent text-sm font-bold text-slate-700 outline-none">
              <option>Skyline Tower Project</option>
              <option>Grand Vista Residency</option>
            </select>
          </div>
        </div>

        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Overall Progress", value: "68%", sub: "Phase 3 in progress", icon: "🏗️", color: "text-blue-600 bg-blue-50" },
            { label: "Total Budget Used", value: "₹5.3Cr", sub: "/ ₹8.2Cr Total", icon: "💰", color: "text-emerald-600 bg-emerald-50" },
            { label: "Timeline Status", value: "On Track", sub: "3 days ahead", icon: "⏱️", color: "text-purple-600 bg-purple-50" },
            { label: "Completion Date", value: "12 Oct", sub: "Target date 2026", icon: "📅", color: "text-amber-600 bg-amber-50" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
              <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-400 font-bold mt-2">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            
            {/* Project Progress Viz */}
            <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            strokeDasharray={552.92} strokeDashoffset={552.92 * (1 - 0.68)}
                            className="text-primary rounded-full transition-all duration-1000" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-800">68%</span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">COMPLETE</span>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Main Building Structure</h2>
                    <p className="text-slate-400 text-sm mt-1">Currently working on Roof Slab Casting and Waterproofing.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Phase</p>
                      <p className="text-sm font-bold text-slate-700">4th Floor Slab ✔</p>
                    </div>
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Next Phase</p>
                      <p className="text-sm font-bold text-primary italic">Finishing & MEP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Cost Overview */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Financial Status</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">PROJECTED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-slate-500">ACTUAL SPENT</span>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="Cr" />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="actual" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32}>
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Site Photos */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Recent Site Photos</h2>
                <button className="text-xs font-bold text-primary hover:underline">View Gallery</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {sitePhotos.map(photo => (
                  <div key={photo.id} className="group cursor-pointer">
                    <div className="aspect-[4/3] rounded-[24px] overflow-hidden mb-3 shadow-sm group-hover:shadow-xl transition-all">
                      <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 px-1">{photo.desc}</p>
                    <p className="text-[10px] text-slate-400 font-bold px-1 mt-0.5">{photo.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            
            {/* Updates */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Latest Updates</h2>
              <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {updates.map(update => (
                  <div key={update.id} className="relative pl-10 flex flex-col gap-1">
                    <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-xs shadow-sm shadow-blue-100">{update.icon}</span>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{update.text}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{update.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm shadow-red-200 shrink-0">⚠️</div>
              <div>
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Notice to Client</p>
                <p className="text-[11px] text-red-500 font-bold mt-1 leading-relaxed">Phase 2 budget exceeded by ₹20L due to steel price surge. Approval pending for variation bill.</p>
                <button className="mt-3 text-[10px] font-black text-red-600 underline">VIEW DETAILS</button>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8 font-black">Project Documents</h2>
              <div className="space-y-3">
                {[
                  { name: "Progress Report - Mar 2026", date: "2d ago" },
                  { name: "Project Schedule v2.4", date: "1w ago" },
                  { name: "Invoice #INV-2026-42", date: "3 Mar" },
                ].map((doc, i) => (
                  <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 hover:border-blue-100 flex items-center justify-between group cursor-pointer transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{doc.date}</p>
                    </div>
                    <button className="p-2 bg-white rounded-xl border border-slate-100 text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication */}
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 bg-slate-800 rounded-[24px] text-center group hover:bg-slate-700 transition-colors">
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">💬</span>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Chat with<br/>Engineer</p>
              </button>
              <button className="p-6 bg-primary rounded-[24px] text-center group hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">⚡</span>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Request<br/>Instant Info</p>
              </button>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
