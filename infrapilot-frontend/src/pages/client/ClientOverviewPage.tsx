import Navbar from "../../components/common/Navbar";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { drawingService } from "../../services/drawingService";
import type { Drawing } from "../../services/drawingService";
import { approvalService } from "../../services/approvalService";
import toast from "react-hot-toast";

import { dashboardService, type ClientDashboardData } from "../../services/dashboardService";
import { dsrService, type DSRItem } from "../../services/dsrService";

const auditData = [
  { name: "Phase 1", projected: 1.2, actual: 1.1 },
  { name: "Phase 2", projected: 2.5, actual: 2.8, alert: true },
  { name: "Phase 3", projected: 1.8, actual: 1.5 },
];

const ClientOverviewPage = () => {
  const [latestDrawing, setLatestDrawing] = useState<Drawing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(() => {
    return localStorage.getItem("APR-018-signed") === "true";
  });
  
  // Signature Drawing Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Client Dashboard API states
  const [stats, setStats] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dsrReports, setDsrReports] = useState<DSRItem[]>([]);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const drawings = await drawingService.getLatestDrawings(1);
        if (drawings.length > 0) {
          setLatestDrawing(drawings[0]);
        }
      } catch (error) {
        console.error("Failed to fetch latest drawing for dashboard");
      }
    };

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const data = await dashboardService.getClientDashboard(1);
        setStats(data);
        
        const dsrData = await dsrService.getProjectDsr(1);
        setDsrReports(dsrData.items || []);
      } catch (error) {
        console.error("Failed to fetch client dashboard stats or DSR:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatest();
    loadDashboard();
  }, []);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr || "";
    }
  };

  const summaryData = [
    { 
      label: "Completion Progress", 
      main: isLoading ? "..." : `${stats?.progress_percent ?? 0}%`, 
      sub: isLoading ? "..." : `Status: ${stats?.status ?? "PLANNED"}` 
    },
    { 
      label: "Total Project Value", 
      main: isLoading ? "..." : formatCurrency(stats?.budget_total ?? 0), 
      sub: "Sanctioned Budget" 
    },
    { 
      label: "Total Expenses", 
      main: isLoading ? "..." : formatCurrency(stats?.total_expense ?? 0), 
      sub: "Actual Spent to Date" 
    },
    { 
      label: "Budget Utilization", 
      main: isLoading ? "..." : `${stats?.budget_used_percent ?? 0}%`, 
      sub: "Efficiency Ratio" 
    },
    { 
      label: "Fund Availability", 
      main: isLoading ? "..." : formatCurrency(stats?.remaining_budget ?? 0), 
      sub: "Remaining Balance" 
    },
    { 
      label: "Milestone Tracking", 
      main: isLoading ? "..." : `${stats?.milestones_completed ?? 0} / ${stats?.milestones_total ?? 0}`, 
      sub: "Completed / Total" 
    },
    { 
      label: "Task Execution", 
      main: isLoading ? "..." : `${stats?.tasks_completed ?? 0} / ${stats?.tasks_total ?? 0}`, 
      sub: "Completed / Total" 
    },
    { 
      label: "Project Timeline", 
      main: isLoading ? "..." : `${stats?.days_remaining ?? 0} Days`, 
      sub: isLoading ? "..." : (stats?.start_date && stats?.end_date ? `${formatDate(stats.start_date)} - ${formatDate(stats.end_date)}` : "") 
    },
  ];

  const dynamicAuditData = stats && stats.budget_total > 0 ? [
    { 
      name: "Phase 1", 
      projected: (stats.budget_total * 0.25) / 10000000, 
      actual: (stats.total_expense * 0.28) / 10000000, 
      alert: (stats.total_expense * 0.28) > (stats.budget_total * 0.25) 
    },
    { 
      name: "Phase 2", 
      projected: (stats.budget_total * 0.45) / 10000000, 
      actual: (stats.total_expense * 0.48) / 10000000, 
      alert: (stats.total_expense * 0.48) > (stats.budget_total * 0.45) 
    },
    { 
      name: "Phase 3", 
      projected: (stats.budget_total * 0.30) / 10000000, 
      actual: (stats.total_expense * 0.24) / 10000000, 
      alert: (stats.total_expense * 0.24) > (stats.budget_total * 0.30) 
    }
  ] : [
    { name: "Phase 1", projected: 1.2, actual: 1.1 },
    { name: "Phase 2", projected: 2.5, actual: 2.8, alert: true },
    { name: "Phase 3", projected: 1.8, actual: 1.5 }
  ];

  // HTML5 Canvas Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // dark slate

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSigned) setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleApproveVariation = async () => {
    setIsSigning(true);
    try {
      await approvalService.approveApproval("APR-018", "Approved via Command Center digital signature");
      localStorage.setItem("APR-018-signed", "true");
      setIsSigned(true);
      toast.success("Variation Request APR-018 signed & approved successfully!", {
        style: { borderRadius: "16px", background: "#10b981", color: "#fff", fontWeight: "bold" },
        icon: "✓"
      });
      setIsModalOpen(false);
      clearCanvas();
    } catch (error) {
      console.error("Failed to sign variation:", error);
      toast.error("Failed to approve variation order. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadDsr = async (dsrId: number, date: string) => {
    try {
      const response = await fetch(`/api/v1/dsr/${dsrId}/pdf`);
      if (!response.ok) throw new Error('Failed to fetch DSR');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DSR_Report_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DSR download failed:', error);
    }
  };

  const dynamicExecutionFeed = dsrReports.length > 0 ? dsrReports.slice(0, 3).map((item) => {
    const today = new Date().toISOString().split('T')[0];
    const itemDate = item.report_date;
    let timeStr = formatDate(itemDate).toUpperCase();
    if (itemDate === today) {
      timeStr = "TODAY'S WORK";
    }
    return {
      text: item.work_done,
      time: timeStr,
      status: item.status === 'Draft' ? 'pending' : 'done',
      dsrId: item.id,
      date: item.report_date
    };
  }) : [
    { text: "Slab reinforcement for Phase 3 completed", time: "TODAY'S WORK", status: "done", dsrId: 1, date: "18-May-2026" },
    { text: "Main gate structure framing initiated", time: "YESTERDAY", status: "pending", dsrId: 2, date: "17-May-2026" },
    { text: "Basement 2 lighting fixtures installed", time: "2 DAYS AGO", status: "done", dsrId: 3, date: "16-May-2026" },
  ];

  const dynamicSiteEvidence = dsrReports.length > 0 ? dsrReports.flatMap(item => 
    (item.photos || []).map(p => ({
      title: item.work_done.substring(0, 45) + (item.work_done.length > 45 ? '...' : ''),
      date: formatDate(item.report_date),
      img: p.file_url.startsWith('http') || p.file_url.startsWith('/') ? p.file_url : `/${p.file_url}`
    }))
  ).slice(0, 4) : [
    { title: "Slab reinforcement check", date: "TODAY", img: "/photos/slab_reinforcement.png" },
    { title: "Foundation concrete pour", date: "29 MAR 2026", img: "/photos/foundation.png" },
    { title: "Brickwork progress - L1", date: "30 MAR 2026", img: "/photos/masonry.png" },
  ];

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">PROJECT COMMAND CENTER</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">SARA CITY</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PROJECT STATUS: {isLoading ? "..." : (stats?.status === "PLANNED" ? "PLANNED" : "HEALTHY")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Status: <span className="text-slate-800 capitalize">{isLoading ? "..." : (stats?.status?.toLowerCase() ?? "Planned")}</span></p>
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
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                    <circle cx="96" cy="96" r="88" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    <circle 
                      cx="96" cy="96" r="88" fill="transparent" stroke="#2563eb" strokeWidth="12" 
                      strokeDasharray={2 * Math.PI * 88} 
                      strokeDashoffset={2 * Math.PI * 88 * (1 - (stats?.progress_percent ?? 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black text-slate-800 tracking-tight">{isLoading ? "..." : `${stats?.progress_percent ?? 0}%`}</span>
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
                   <BarChart data={dynamicAuditData} barGap={12}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(v) => `${v}Cr`} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                     <Bar dataKey="projected" fill="#F1F5F9" radius={[6, 6, 0, 0]} barSize={40} />
                     <Bar dataKey="actual" radius={[6, 6, 0, 0]} barSize={40}>
                       {dynamicAuditData.map((entry, index) => (
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
            {isSigned ? (
              <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-8 -mt-8 flex items-end justify-start p-6 text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic">AUTHORIZED</p>
                <h3 className="text-sm font-bold text-slate-800 leading-tight mb-2">
                  Variation Order Approved
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mb-4">
                  APR-018: Steel Price Surge variation signed & finalized.
                </p>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl uppercase tracking-widest border border-emerald-100">
                  Signed & Approved ✓
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-red-50/50 to-white rounded-3xl p-6 shadow-sm border border-red-100/50 flex flex-col items-center text-center relative">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 italic">VARIATION ALERT</p>
                <h3 className="text-sm font-bold text-slate-800 leading-tight mb-4">
                  Phase 2 structural budget variation of ₹20L requires signature.
                </h3>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95"
                >
                  SIGN NOW
                </button>
              </div>
            )}

            {/* Live Feed */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">LIVE EXECUTION FEED</h3>
               <div className="space-y-8 relative">
                 <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-100" />
                 {dynamicExecutionFeed.map((item, i) => (
                  <div key={i} className="flex gap-4 group hover:translate-x-1 transition-transform cursor-pointer">
                    <div className={`w-1 h-10 rounded-full shrink-0 ${item.status === 'done' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.time}</p>
                        <button 
                          className="p-1 rounded bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Download DSR"
                          onClick={() => handleDownloadDsr(item.dsrId, item.date)}
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
                  to="/client/communication/messages?contactId=1"
                  className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 p-5 rounded-3xl flex items-center justify-between group cursor-pointer"
               >
                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">Project Manager Chat</h4>
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
                 {dynamicSiteEvidence.map((item, i) => (
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

      {/* Signature Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 italic">VARIATION ORDER AUTHORIZATION</p>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Sign Variation Request</h3>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  clearCanvas();
                }}
                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 flex-1">
              {/* Variation Details */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded-full">
                      Variation APR-018
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-2.5">
                      Variation Order — Steel Price Surge
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">COST IMPACT</p>
                    <p className="text-lg font-black text-slate-850">₹20,00,000</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Steel market price increase of 15% affecting reinforcement works for Phase 2. Requires authorized client signature to proceed with material procurement.
                </p>
              </div>

              {/* Signature Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    DRAW DIGITAL SIGNATURE
                  </label>
                  {hasSigned && (
                    <button 
                      onClick={clearCanvas}
                      className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden group hover:border-slate-350 transition-colors">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 select-none">
                      <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Draw your signature in this box</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button
                disabled={isSigning}
                onClick={() => {
                  setIsModalOpen(false);
                  clearCanvas();
                }}
                className="flex-1 py-3.5 px-4 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 text-center disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={!hasSigned || isSigning}
                onClick={handleApproveVariation}
                className="flex-1 py-3.5 px-4 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-center flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isSigning ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    APPROVE & AUTHORIZE
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ClientOverviewPage;
