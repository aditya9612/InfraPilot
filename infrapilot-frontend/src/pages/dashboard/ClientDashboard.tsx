import Navbar from "../../components/common/Navbar";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/common/Modal";
import NewProjectModal from "../../components/dashboard/NewProjectModal";
import CreateUserModal from "../../components/forms/CreateUserModal";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
import CreateReportModal from "../../components/dashboard/CreateReportModal";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { dashboardService, type ClientDashboardData } from "../../services/dashboardService";

const costData = [
  { name: "Initial Phase", budget: 70000, actual: 6195 },
];

const sitePhotos = [
  { id: 1, url: "/photos/slab_reinforcement.png", date: "Today", desc: "Slab reinforcement check" },
  { id: 2, url: "/photos/foundation.png", date: "29 Mar 2026", desc: "Foundation concrete pour" },
  { id: 3, url: "/photos/masonry.png", date: "30 Mar 2026", desc: "Brickwork progress - L1" },
];

const updates = [
  { id: 1, text: "Slab reinforcement for Phase 3 completed", time: "Today's Work", icon: "🏗️" },
  { id: 2, text: "Main gate structure framing completed", time: "Yesterday", icon: "✔" },
  { id: 3, text: "Electrical wirings for 1st floor delivered", time: "2 days ago", icon: "🚚" },
];

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBotOpen, setIsBotOpen] = useState(false);
  
  // Admin Action States
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isBOQModalOpen, setIsBOQModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [stats, setStats] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      const data = await dashboardService.getClientDashboard(1);
      setStats(data);
      setIsLoading(false);
    };
    loadDashboard();
  }, []);

  const handleCreateProject = async (data: any) => {
    toast.success("Project created successfully (Mock Mode)");
    setIsNewProjectModalOpen(false);
  };

  const handleCreateUser = async (data: any) => {
    toast.success("User created successfully (Mock Mode)");
    setIsUserModalOpen(false);
  };

  const handleCreateBOQ = async (data: any) => {
    toast.success("BOQ created successfully (Mock Mode)");
    setIsBOQModalOpen(false);
  };

  const botMessages = [
    { role: "assistant", text: "Hello! I am your InfraPilot AI assistant. How can I help you today?", time: "Just now" },
    { role: "user", text: "What is the current status of Phase 3?", time: "Just now" },
    { role: "assistant", text: "Phase 3 (Roof Slab & MEP Hookups) is currently 42% complete. Rebar arrangement is the current focus today.", time: "Just now" },
  ];

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Project Pulse
            </h1>
            <p className="text-slate-500 text-sm">
              Real-time infrastructure health and budget monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              + New Project
            </button>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              + Add User
            </button>
            <button
              onClick={() => navigate("/admin/clients")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              + Add Client
            </button>
            <button
              onClick={() => setIsBOQModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              + Create BOQ
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              Create Report
            </button>
          </div>
        </div>
        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Overall Progress", value: isLoading ? "..." : `${stats?.progress_percent}%`, sub: "Project Halfway Mark", icon: "📊", color: "text-blue-600 bg-blue-50" },
            { label: "Budget / Spent", value: isLoading ? "..." : `₹${stats?.budget_total.toLocaleString()} / ₹${stats?.total_expense.toLocaleString()}`, sub: `${stats?.budget_used_percent}% Budget Utilized`, icon: "📉", color: "text-indigo-600 bg-indigo-50" },
            { label: "Remaining Budget", value: isLoading ? "..." : `₹${stats?.remaining_budget.toLocaleString()}`, sub: "Available Funds", icon: "💰", color: "text-emerald-600 bg-emerald-50" },
            { label: "Completion Date", value: isLoading ? "..." : stats?.end_date, sub: "Target Deadline", icon: "📅", color: "text-amber-600 bg-amber-50" },
            { label: "Days Remaining", value: isLoading ? "..." : `${stats?.days_remaining} Days`, sub: "Deadline Reached", icon: "⏳", color: "text-orange-600 bg-orange-50" },
            { label: "Milestones", value: isLoading ? "..." : `${stats?.milestones_completed} / ${stats?.milestones_total}`, sub: "Completed / Total", icon: "🏆", color: "text-purple-600 bg-purple-50" },
            { label: "Tasks", value: isLoading ? "..." : `${stats?.tasks_completed} / ${stats?.tasks_total}`, sub: "Completed / Total", icon: "✅", color: "text-slate-600 bg-slate-50" },
            { label: "Client Account", value: user?.name || "Mock Client", sub: `${user?.role || "Premium"} Access`, icon: "👤", color: "text-slate-600 bg-slate-50" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-lg mb-4 shadow-inner group-hover:scale-110 transition-transform`}>{card.icon}</div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-2 uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Project Progress Viz */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                    <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={628.3} strokeDashoffset={628.3 * (1 - (stats?.progress_percent || 0) / 100)} className="text-primary rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/20" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-slate-800 tracking-tighter">{isLoading ? "..." : `${stats?.progress_percent}%`}</span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Project Progress</span>
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Structural Phase III: <br/>Roof Slab & MEP Hookups</h2>
                    <p className="text-slate-500 text-xs font-medium mt-2 leading-relaxed">Today's Work focus: Finalizing rebar arrangement for the primary roof slab and ensuring plumbing sleeves are accurately placed.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Last Completed</p>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">4th Floor Column Pour</p>
                    </div>
                    <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
                      <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1 italic">Upcoming Today</p>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">Casting Prep Meeting</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Financial Status Bar Chart */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Cost Management Audit</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Projected Budget vs Actual Real-time Spent (₹)</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Projected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Actual</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart 
                    data={stats ? [{ name: "Current Project", budget: stats.budget_total, actual: stats.total_expense }] : costData} 
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} unit="" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }} />
                    <Bar dataKey="budget" fill="#F1F5F9" radius={[12, 12, 0, 0]} barSize={40} />
                    <Bar dataKey="actual" fill="#2563EB" radius={[12, 12, 0, 0]} barSize={40}>
                      {(stats ? [{ name: "Current Project", budget: stats.budget_total, actual: stats.total_expense }] : costData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Project Execution Tracking */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Execution Tracking</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Key Milestones</p>
                      <p className="text-base font-bold text-slate-800">{isLoading ? "..." : `${stats?.milestones_completed} / ${stats?.milestones_total}`} Completed</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 italic">Target: {stats?.milestones_total} Milestones</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-1000" 
                      style={{ width: `${(stats?.milestones_completed || 0) / (stats?.milestones_total || 1) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Next: Foundation Structural Completion</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                      <p className="text-base font-bold text-slate-800">{isLoading ? "..." : `${stats?.tasks_completed} / ${stats?.tasks_total}`} Completed</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 italic">Current Sprint</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${(stats?.tasks_completed || 0) / (stats?.tasks_total || 1) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active: Site Preparation & Leveling</p>
                </div>
              </div>
            </div>
            {/* Site Photos Gallery Snippet */}
            <div className="space-y-6 pb-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Site Evidence</h2>
                <button 
                  onClick={() => navigate("/client/site-updates/photos")}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Explore Full Gallery
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {sitePhotos.map(photo => (
                  <div key={photo.id} className="group cursor-pointer">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                      <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 px-2 tracking-tight">{photo.desc}</p>
                    <p className="text-[10px] text-slate-400 font-semibold px-2 mt-1 uppercase tracking-widest">{photo.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Side Module: Alerts, Updates, and Actions */}
          <div className="space-y-10">
            {/* Timeline Stream */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Live Execution Feed</h2>
              <div className="space-y-10 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {updates.map(update => (
                  <div key={update.id} className="relative pl-12">
                    <span className="absolute left-0 top-0 w-8 h-8 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm shadow-md shadow-slate-100 group-hover:scale-110 transition-transform">{update.icon}</span>
                    <p className="text-[13px] font-bold text-slate-800 leading-relaxed tracking-tight">{update.text}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{update.time}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Critical Alert */}
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-xl shadow-red-200 shrink-0">⚠️</div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest italic">Variation Alert</p>
                  <p className="text-sm text-red-500 font-semibold mt-2 leading-relaxed">Phase 2 structural budget variation of ₹20L requires signature.</p>
                  <button className="mt-4 px-6 py-2.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">Sign Now</button>
                </div>
              </div>
            </div>
            {/* Quick Portal Switcher */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-6 italic">Support Access</p>
                <div className="space-y-4">
                  <button 
                    onClick={() => navigate("/client/communication/messages")}
                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold tracking-tight">Site Engineer Chat</p>
                      <p className="text-[9px] text-white/50 font-semibold uppercase tracking-widest">Available Now</p>
                    </div>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                  <button 
                    onClick={() => setIsBotOpen(true)}
                    className="w-full flex items-center justify-between p-5 bg-primary rounded-2xl shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold tracking-tight text-white">Instant Portal Bot</p>
                      <p className="text-[9px] text-white/70 font-semibold uppercase tracking-widest">AI Assistance</p>
                    </div>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">⚡</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <Modal 
        isOpen={isBotOpen} 
        onClose={() => setIsBotOpen(false)} 
        title="InfraPilot AI Assistant"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
            {botMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm"}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <p className={`text-[9px] mt-1 font-bold uppercase tracking-widest ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-primary transition-all">
              <input 
                placeholder="Ask anything about your project..." 
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400 font-bold"
                onKeyPress={(e) => e.key === "Enter" && setIsBotOpen(false)}
              />
              <button 
                onClick={() => setIsBotOpen(false)}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-4 font-bold uppercase tracking-[0.2em]">Powered by InfraPilot AI Core</p>
          </div>
        </div>
      </Modal>

      {/* Admin Action Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleCreateUser}
      />
      <CreateBOQModal
        isOpen={isBOQModalOpen}
        onClose={() => setIsBOQModalOpen(false)}
        onSubmit={handleCreateBOQ}
        projects={[]}
      />
      <CreateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projects={[]}
      />
    </>
  );
};

export default ClientDashboard;
