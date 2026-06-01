import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { reportService } from "../../services/reportService";

const OverviewCard = ({ title, value, sub, active, red }: any) => (
  <div className={`bg-white p-6 rounded-3xl border-2 ${active ? 'border-blue-600' : 'border-slate-100'} shadow-sm flex flex-col justify-between h-40 transition-all hover:shadow-md`}>
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h3>
    <div>
      <p className={`text-4xl font-black ${red ? 'text-[#EF4444]' : 'text-slate-800'} tracking-tight`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{sub}</p>
    </div>
  </div>
);

const ReportCard = ({ level, title, desc, stats, size, time, onPDF, onExcel, onView, colorClass, icon }: any) => (
  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col h-full overflow-hidden group font-inter">
    <div className="p-8 pb-4">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${colorClass.replace('text', 'bg')} bg-opacity-10 flex items-center justify-center ${colorClass}`}>
            {icon ? <img src={icon} alt="" className="w-6 h-6" /> : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{level}</p>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{size}</p>
      </div>
      <p className="text-xs font-bold text-slate-500 leading-relaxed mb-8">{desc}</p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
        {stats.map((stat: any, i: number) => (
          <div key={i}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-sm font-black text-slate-800 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-auto p-8 pt-4 border-t border-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{time || "Today, 08:30 AM"}</p>
        <button
          onClick={onView}
          title="View Details"
          className="p-1.5 ml-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onPDF} className="px-4 py-2 bg-[#FEF2F2] text-[#EF4444] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#FEE2E2] transition-colors active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          PDF
        </button>
        <button onClick={onExcel} className="px-4 py-2 bg-[#EFF6FF] text-[#2563EB] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#DBEAFE] transition-colors active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Excel
        </button>
      </div>
    </div>
  </div>
);

const ClientReportsPage = () => {
  const navigate = useNavigate();
  const { projectId } = useClientProjectId();
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any>(null);
  const [materialSummary, setMaterialSummary] = useState<any[]>([]);
  const [issueSummary, setIssueSummary] = useState<any>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [frequency, setFrequency] = useState("All Cycles");

  const fetchAllReports = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const pid = projectId;
      const [daily, weekly, material, issues] = await Promise.all([
        reportService.getDailyReport(pid, reportDate),
        reportService.getWeeklyProgress(pid),
        reportService.getMaterialReport(pid),
        reportService.getIssueReport(pid)
      ]);
      setDailyReport(daily.dsr || daily);
      setWeeklyProgress(weekly);
      setMaterialSummary(Array.isArray(material) ? material : []);
      setIssueSummary(issues);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchAllReports();
    }
  }, [projectId, reportDate]);

  const downloadFile = (blob: Blob, fileName: string, type: string) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportDailyPDF = async () => {
    if (!projectId) return;
    try {
      const blob = await reportService.exportDailyPDF(projectId, reportDate);
      downloadFile(blob, `Daily_Report_${reportDate}.pdf`, 'application/pdf');
    } catch (error) { console.error(error); }
  };

  const handleExportLabourExcel = async () => {
    if (!projectId) return;
    try {
      const blob = await reportService.exportLabourExcel(projectId);
      downloadFile(blob, `Labour_Report.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) { console.error(error); }
  };

  const handleExportMaterialExcel = async () => {
    if (!projectId) return;
    try {
      const blob = await reportService.exportMaterialExcel(projectId);
      downloadFile(blob, `Material_Report.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) { console.error(error); }
  };

  const handleExportIssueExcel = async () => {
    if (!projectId) return;
    try {
      const blob = await reportService.exportIssueExcel(projectId);
      downloadFile(blob, `Issues_Report.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) { console.error(error); }
  };

  const handleExportProjectPDF = async () => {
    if (!projectId) return;
    try {
      const date = new Date(reportDate);
      const blob = await reportService.exportProjectReportPDF(projectId, "monthly", date.getMonth() + 1, date.getFullYear());
      downloadFile(blob, `Project_Report_${reportDate}.pdf`, 'application/pdf');
    } catch (error) { console.error(error); }
  };

  const handleExportProjectExcel = async () => {
    if (!projectId) return;
    try {
      const date = new Date(reportDate);
      const blob = await reportService.exportProjectReportExcel(projectId, "monthly", date.getMonth() + 1, date.getFullYear());
      downloadFile(blob, `Project_Report_${reportDate}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) { console.error(error); }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter pb-20 overflow-x-hidden">
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports"]} />

      {/* PAGE HEADER */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <span>InfraPilot</span>
              <span className="text-[8px] mt-0.5 opacity-40">/</span>
              <span>Client</span>
              <span className="text-[8px] mt-0.5 opacity-40">/</span>
              <span className="text-slate-600">Reports</span>
            </nav>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Reports</h1>
            <p className="text-sm font-bold text-slate-400 max-w-2xl">Generate, view, and export daily, weekly, labour, material, and issue reports.</p>
          </div>
          <button
            onClick={fetchAllReports}
            disabled={loading}
            className="bg-white hover:bg-slate-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-slate-200 active:scale-95 shadow-sm text-slate-600 whitespace-nowrap disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "REFRESHING..." : "REFRESH REPORTS"}
          </button>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <OverviewCard title="TOTAL REPORTS" value="5" sub="Available in Catalog" active />
          <OverviewCard title="GENERATED TODAY" value="3" sub="Recent Site Logs" />
          <OverviewCard title="AVG. REPORT SIZE" value="1.8 MB" sub="Inventory Volume" />
          <OverviewCard title="OPEN ISSUES" value={issueSummary?.open || 29} sub="High Priority Items" red />
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5 shrink-0">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200/50">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Report Catalog Filter</h3>
          </div>

          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-1.5 z-10">Search</label>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
            <div className="relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-1.5 z-10">Report Date</label>
              <input
                type="date"
                value={reportDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none"
              />
            </div>
            <div className="relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-1.5 z-10">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer"
              >
                <option>All Cycles</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
              <svg className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <button onClick={handleExportProjectPDF} className="px-7 py-4 bg-[#2563EB] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF
            </button>
            <button onClick={handleExportProjectExcel} className="px-7 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export
            </button>
          </div>
        </div>

        {/* CARDS GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4 col-span-full">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Insights...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {[
              {
                level: "DAILY", title: "Daily Report", size: "1.2 MB", colorClass: "text-orange-600",
                frequency: "Daily", time: "Today, 08:30 AM",
                desc: "Full summary of today's site operations — labour deployed, work completed, materials consumed, and any issues logged.",
                stats: [
                  { label: "TOTAL LABOUR", value: `${dailyReport?.total_labour || 2} Workers` },
                  { label: "SKILLED", value: dailyReport?.skilled_labour || 2 },
                  { label: "WEATHER", value: dailyReport?.weather || 'Sunny' },
                  { label: "LOCATION", value: dailyReport?.site_location?.split('\n')[0] || 'Hinjawadi Phase 1' }
                ],
                onPDF: handleExportDailyPDF, onExcel: handleExportDailyPDF,
                onView: () => navigate("/client/site-updates/dsr")
              },
              {
                level: "WEEKLY", title: "Weekly Progress", size: "4.5 MB", colorClass: "text-blue-600",
                frequency: "Weekly", time: "Yesterday, 06:15 PM",
                desc: "7-day performance summary covering milestone achievements, planned vs actual progress, and workforce trends.",
                stats: [
                  { label: "OVERALL COMPLETION", value: `${weeklyProgress?.weekly_progress_percent || 25}%` },
                  { label: "COMPLETED ACTIVITIES", value: weeklyProgress?.tasks_count || 0 },
                  { label: "TOTAL ACTIVITIES", value: "10" },
                  { label: "STATUS", value: "In Progress" }
                ],
                onPDF: handleExportDailyPDF, onExcel: handleExportDailyPDF,
                onView: () => navigate("/client/progress")
              },
              {
                level: "DAILY", title: "Labour Report", size: "0.8 MB", colorClass: "text-yellow-600",
                frequency: "Daily", time: "Today, 07:00 AM",
                desc: "Workforce breakdown by skill category, attendance, overtime, and contractor-wise deployment summary.",
                stats: [
                  { label: "TOTAL WORKERS", value: dailyReport?.total_labour || 2 },
                  { label: "ACTIVE", value: dailyReport?.total_labour || 2 },
                  { label: "INACTIVE", value: "0" },
                  { label: "SHIFT", value: "Day" }
                ],
                onPDF: handleExportLabourExcel, onExcel: handleExportLabourExcel,
                onView: () => navigate("/client/reports/labour")
              },
              {
                level: "DAILY", title: "Material Consumption", size: "2.1 MB", colorClass: "text-red-600",
                frequency: "Daily", time: "2 Hours Ago",
                desc: "Inflow vs outflow reconciliation for all materials — cement, steel, aggregates — with stock closing balances.",
                stats: [
                  { label: "TOTAL STOCK ITEMS", value: materialSummary.length || "9" },
                  { label: "STOCK QTY", value: materialSummary[0]?.remaining_stock || "16961.0" },
                  { label: "STOCK VALUE", value: `₹${materialSummary[0]?.total_cost || "8880.2"}k` },
                  { label: "STATUS", value: "Updated" }
                ],
                onPDF: handleExportMaterialExcel, onExcel: handleExportMaterialExcel,
                onView: () => navigate("/client/reports/material")
              },
              {
                level: "AS NEEDED", title: "Issue Report", size: "0.5 MB", colorClass: "text-amber-600",
                frequency: "As Needed", time: "5 Mins Ago",
                desc: "Logged site issues, safety observations, delays, and their current resolution status and priority levels.",
                stats: [
                  { label: "OPEN ISSUES", value: issueSummary?.open || 29 },
                  { label: "CRITICAL", value: "14" },
                  { label: "RESOLVED", value: issueSummary?.closed || 1 },
                  { label: "TOTAL", value: "30" }
                ],
                onPDF: handleExportIssueExcel, onExcel: handleExportIssueExcel,
                onView: () => navigate("/client/reports/issues")
              }
            ]
              .filter(report => {
                const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  report.desc.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesFrequency = frequency === "All Cycles" || report.frequency === frequency;
                return matchesSearch && matchesFrequency;
              })
              .map((report, idx) => (
                <ReportCard key={idx} {...report} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientReportsPage;
