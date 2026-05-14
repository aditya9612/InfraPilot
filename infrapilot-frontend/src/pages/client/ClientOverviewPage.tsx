import Navbar from "../../components/common/Navbar";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { motion } from "framer-motion";

const auditData = [
  { name: "Phase 1", projected: 1.2, actual: 1.1 },
  { name: "Phase 2", projected: 2.5, actual: 2.8, alert: true },
  { name: "Phase 3", projected: 1.8, actual: 1.5 },
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

const summaryData = [
  { label: "Completion Progress", main: "68%", sub: "Phase 3 In-Progress" },
  { label: "Total Project Value", main: "₹22.2 Cr", sub: "Sanctioned Budget" },
  { label: "Total Expenses", main: "₹15.1 Cr", sub: "Actual Spent to Date" },
  { label: "Budget Utilization", main: "68.01%", sub: "Efficiency Ratio" },
  { label: "Fund Availability", main: "₹7.1 Cr", sub: "Remaining Balance" },
  { label: "Milestone Tracking", main: "12 / 18", sub: "Completed / Total" },
  { label: "Task Execution", main: "94 / 142", sub: "Completed / Total" },
  { label: "Project Timeline", main: "142 Days", sub: "Oct 15 - Sept 30" },
];

const ClientOverviewPage = () => {
  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">PROJECT COMMAND CENTER</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">Skyline Tower Project</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PROJECT STATUS: HEALTHY</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Status: <span className="text-slate-800">Planned</span></p>
          </div>
        </div>

        {/* Project Overview Section */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-12">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em]">Project Overview</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">On Track</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Name</p>
              <p className="text-xs font-bold text-slate-800">Skyline Tower - Phase 3 Extension</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Location</p>
              <p className="text-xs font-bold text-slate-800">Worli, Mumbai South Central</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Type</p>
              <p className="text-xs font-bold text-slate-800">Residential High-Rise (A+ Category)</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date / End Date</p>
              <p className="text-xs font-bold text-slate-800">Oct 15, 2025 / Sept 30, 2026</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Manager</p>
              <p className="text-xs font-bold text-slate-800">Rajesh Kumar (PMP Certified)</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Site Engineer</p>
              <p className="text-xs font-bold text-slate-800">Amit Sharma (M.Tech Structural)</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contractor Name</p>
              <p className="text-xs font-bold text-slate-800">Precision Buildcon Pvt Ltd</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Budget</p>
              <p className="text-xs font-bold text-slate-800">₹22,20,00,000.00 (Incl. GST)</p>
            </div>
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
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/60 flex flex-col items-start gap-3 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{card.label}</p>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{card.main}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{card.sub}</p>
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
                 <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Structural Phase III:<br/>Roof Slab & MEP Hookups</h2>
                 <p className="text-slate-400 leading-relaxed text-sm font-medium">
                   Today's Work focus: Finalizing rebar arrangement for the primary roof slab and ensuring plumbing sleeves are accurately placed.
                 </p>
                 <div className="flex gap-4 mt-8">
                    <div className="h-10 px-6 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center cursor-not-allowed">PREVIOUS</div>
                    <Link to="/client/work-focus-details" className="h-10 px-6 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">VIEW DETAILS</Link>
                 </div>
               </div>
            </div>

            {/* Cost Audit Bar Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-8">
                 <div>
                   <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Cost Management Audit</h2>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PROJECTED BUDGET VS ACTUAL REAL-TIME SPENT (₹ CR)</p>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase">PROJECTED</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase">ACTUAL</span>
                   </div>
                 </div>
               </div>
               
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={auditData} barGap={12}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(v) => `${v}Cr`} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                     <Bar dataKey="projected" fill="#F1F5F9" radius={[6, 6, 0, 0]} barSize={40} />
                     <Bar dataKey="actual" radius={[6, 6, 0, 0]} barSize={40}>
                       {auditData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.alert ? '#ef4444' : '#2563eb'} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* Right Side - Actions & Feed */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Variation Alert */}
            <div className="bg-gradient-to-br from-red-50/50 to-white rounded-3xl p-6 shadow-sm border border-red-100/50 flex flex-col items-center text-center relative">
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 italic">VARIATION ALERT</p>
               <h3 className="text-sm font-bold text-slate-800 leading-tight mb-4">
                 Phase 2 structural budget variation of ₹20L requires signature.
               </h3>
               <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95">
                 SIGN NOW
               </button>
            </div>

            {/* Live Feed */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">LIVE EXECUTION FEED</h3>
               <div className="space-y-8 relative">
                 <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-100" />
                 {executionFeed.map((item, i) => (
                  <div key={i} className="flex gap-4 group hover:translate-x-1 transition-transform cursor-pointer">
                    <div className={`w-1 h-10 rounded-full shrink-0 ${item.status === 'done' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.time}</p>
                        <button 
                          className="p-1 rounded bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Download DSR"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-tight mt-1">{item.text}</p>
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
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recent Site Evidence</h2>
                 <Link to="/client/site-updates/photos" className="text-[9px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-600 pb-0.5 hover:text-blue-700 hover:border-blue-700 transition-colors">EXPLORE FULL GALLERY</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {siteEvidence.map((item, i) => (
                   <div key={i} className="group cursor-pointer">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-slate-200 border border-slate-100 shadow-sm relative">
                         <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.date}</p>
                   </div>
                 ))}
              </div>
           </div>
      </div>
    </>
  );
};

export default ClientOverviewPage;
