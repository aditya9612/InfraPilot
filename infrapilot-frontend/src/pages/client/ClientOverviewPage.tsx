import Navbar from "../../components/common/Navbar";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ClientProgressTimeline from "../../components/dashboard/ClientProgressTimeline";

const summaryData = [
  { label: "OVERALL PROGRESS", main: "68%", sub: "PHASE 3 IN PROGRESS", icon: "📊", iconBg: "bg-blue-50" },
  { label: "BUDGET / SPENT", main: "₹8.2Cr / ₹5.3Cr", sub: "ACTUAL VS PROJECTION", icon: "📉", iconBg: "bg-indigo-50" },
  { label: "TOTAL PAID / PENDING", main: "₹4.8Cr / ₹0.5Cr", sub: "FINANCIAL CLEARANCE", icon: "💰", iconBg: "bg-emerald-50" },
  { label: "EXPECTED COMPLETION", main: "12 Oct 2026", sub: "TARGET TIMELINE", icon: "📅", iconBg: "bg-amber-50" },
  { label: "DAYS REMAINING", main: "188 Days", sub: "OPERATIONAL RUNWAY", icon: "⏳", iconBg: "bg-orange-50" },
  { label: "OPEN ISSUES", main: "3 Open", sub: "VARIATION APPROVALS", icon: "⚠️", iconBg: "bg-red-50" },
  { label: "LATEST UPDATE", main: "Slab Reinforcement", sub: "TODAY'S EXECUTION", icon: "🚀", iconBg: "bg-purple-50" },
  { label: "CLIENT ACCOUNT", main: "Mock Client", sub: "CLIENT ACCESS", icon: "👤", iconBg: "bg-slate-50" },
];

const executionFeed = [
  { text: "Slab reinforcement for Phase 3 completed", time: "TODAY'S WORK", status: "done" },
  { text: "Main gate structure framing initiated", time: "YESTERDAY", status: "pending" },
  { text: "Basement 2 lighting fixtures installed", time: "2 DAYS AGO", status: "done" },
];

const siteEvidence = [
  { title: "Slab reinforcement check", date: "TODAY", img: "/photos/slab_reinforcement.png" },
  { title: "Foundation concrete pour", date: "29 MAR 2026", img: "/photos/foundation.png" },
  { title: "Brickwork progress - L1", date: "30 MAR 2026", img: "/photos/masonry.png" },
];

const ClientOverviewPage = () => {
  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">PROJECT COMMAND CENTER</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Skyline Tower Project</h1>
          </div>
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-100/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Project Status: Healthy</span>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {summaryData.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/60 flex flex-col items-start gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110 duration-300`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{card.main}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

          {/* Left Side - Charts */}
          <div className="lg:col-span-8 space-y-8">

            {/* Progress Visualization */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="96" cy="96" r="88" fill="transparent" stroke="#2563eb" strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - 0.68)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-slate-800 tracking-tight">68%</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">PROJECT PROGRESS</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Structural Phase III:<br />Roof Slab & MEP Hookups</h2>
                <p className="text-slate-400 leading-relaxed text-sm font-medium">
                  Today's Work focus: Finalizing rebar arrangement for the primary roof slab and ensuring plumbing sleeves are accurately placed.
                </p>
                <div className="flex gap-4 mt-8">
                  <div className="h-10 px-6 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center cursor-not-allowed">PREVIOUS</div>
                  <div className="h-10 px-6 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">VIEW DETAILS</div>
                </div>
              </div>
            </div>

            {/* Cost Audit Bar Chart - REPLACED WITH TIMELINE FOR BETTER TRANSPARENCY */}
            <ClientProgressTimeline />
          </div>

          {/* Right Side - Actions & Feed */}
          <div className="lg:col-span-4 space-y-8">

            {/* Variation Alert */}
            <div className="bg-gradient-to-br from-red-50/50 to-white rounded-[40px] p-8 shadow-sm border border-red-100/50 flex flex-col items-center text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-red-500/10 flex items-center justify-center text-3xl mb-6 ring-1 ring-red-100">
                ⚠️
              </div>
              <p className="text-[11px] font-black text-red-500 uppercase tracking-widest italic mb-2">VARIATION ALERT</p>
              <h3 className="text-lg font-bold text-slate-800 leading-tight mb-6">
                Phase 2 structural budget variation of ₹20L requires signature.
              </h3>
              <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95">
                SIGN NOW
              </button>
            </div>

            {/* Live Feed */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">LIVE EXECUTION FEED</h3>
              <div className="space-y-8 relative">
                <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-100" />
                {executionFeed.map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 z-10 border-4 border-white ${item.status === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {item.status === 'done' ? '✓' : '•'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-snug mb-1">{item.text}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Access */}
            <div className="bg-[#0B1428] rounded-[40px] p-8 shadow-2xl flex flex-col gap-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 italic">SUPPORT ACCESS</p>
              <Link
                to="/client/communication/messages?contactId=2"
                className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 p-5 rounded-3xl flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">Site Engineer Chat</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">AVAILABLE NOW</p>
                </div>
                <div className="text-white transform group-hover:translate-x-1 transition-transform">→</div>
              </Link>
              <div className="bg-blue-600 hover:bg-blue-700 transition-colors p-5 rounded-3xl flex items-center justify-between group cursor-pointer shadow-xl shadow-blue-600/20">
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">Instant Portal Bot</h4>
                  <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">AI ASSISTANCE</p>
                </div>
                <div className="text-white">⚡</div>
              </div>
            </div>
          </div>
        </div>

        {/* Site Evidence Gallery */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recent Site Evidence</h2>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-1">EXPLORE FULL GALLERY</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteEvidence.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-[32px] overflow-hidden mb-4 bg-slate-200 border border-slate-100 shadow-sm relative">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientOverviewPage;
