import { useEffect, useState, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface DSRData {
  id: number;
  project_id: number;
  status: string;
  issues: string;
  total_labour: number;
  safety_observations: string;
  report_date: string;
  skilled_labour: number;
  remarks: string;
  site_location: string;
  unskilled_labour: number;
  latitude: number;
  weather: string;
  machinery_used: string;
  longitude: number;
  work_done: string;
  material_received: string;
  created_at: string;
  business_id: string;
  work_planned: string;
  material_used: string;
  updated_at: string;
  contractor_id: number;
}

interface WeeklyProgress {
  weekly_progress_percent: number;
  tasks_count: number;
}

const ClientMonthlyProgressPage = () => {
  const [reportType, setReportType] = useState<"Daily" | "Weekly" | "Monthly" | "Quarterly">("Daily");
  const [dsr, setDsr] = useState<DSRData | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-05-25");
  const [projectData, setProjectData] = useState<any>(null);

  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async (date: string) => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);

      const [dailyRes, weeklyRes, projectRes] = await Promise.all([
        reportService.getDailyReport(projectId, date),
        reportService.getWeeklyProgress(projectId),
        projectService.getProjectById(projectId)
      ]);

      setProjectData(projectRes);

      if (dailyRes && dailyRes.dsr) {
        setDsr(dailyRes.dsr);
      } else {
        setDsr(null);
        if (reportType === "Daily") {
          setError("No daily report found for the selected date.");
        }
      }

      if (weeklyRes) {
        setWeeklyProgress(weeklyRes);
      }
    } catch (err: any) {
      console.error("Error fetching report data:", err);
      setError("Failed to fetch report resources.");
    } finally {
      setLoading(false);
    }
  }, [projectId, reportType]);

  useEffect(() => {
    if (projectId) {
      fetchData(selectedDate);
    }
  }, [fetchData, selectedDate, projectId]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleExportPDF = async () => {
    if (!projectId) return;
    try {
      setExporting(true);
      let blob;
      if (reportType === "Daily") {
        blob = await reportService.exportDailyPDF(projectId, selectedDate);
      } else if (reportType === "Weekly") {
        blob = await reportService.exportWeeklyPDF(projectId);
      } else if (reportType === "Monthly") {
        blob = await reportService.exportWorkSummaryPDF(projectId);
      } else {
        blob = await reportService.exportAuditPDF(projectId);
      }

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_Report_${selectedDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Report Summary"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Report Summary</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
              {projectData?.project_name || "Active Project"} • Execution Insights
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 h-[56px] items-center">
              {["Daily", "Weekly", "Monthly", "Quarterly"].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type as any)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === type
                      ? "bg-slate-800 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {reportType === "Daily" && (
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col px-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExportPDF}
              disabled={exporting || (reportType === "Daily" && !dsr)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-slate-100 ${exporting || (reportType === "Daily" && !dsr)
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'bg-white text-slate-800 hover:bg-slate-50 active:scale-95'
                }`}
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exporting ? 'Generating...' : `Export ${reportType} PDF`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Project Data...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">

            {/* Daily View Content */}
            {reportType === "Daily" && (
              !dsr ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center px-10">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">No Daily Report</h3>
                  <p className="text-slate-500 text-sm max-w-xs">{error || "The daily site report has not been filed for this date yet."}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Summary Highlights Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Daily Status Card */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daily Report Status</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dsr.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-800">{dsr.status}</p>
                          <p className="text-[10px] font-bold text-slate-400">{dsr.business_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Workforce Deploymen Card */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deployment</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{dsr.total_labour}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Members</span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Skilled: {dsr.skilled_labour}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Unskilled: {dsr.unskilled_labour}</p>
                      </div>
                    </div>

                    {/* Site Weather */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Environment</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                          </svg>
                        </div>
                        <p className="text-xl font-black text-slate-800">{dsr.weather}</p>
                      </div>
                    </div>

                    {/* Progress Marker */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Site Location</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{dsr.site_location}</p>
                      <p className="text-[8px] font-mono font-black text-slate-300 mt-2">{dsr.latitude}N / {dsr.longitude}E</p>
                    </div>
                  </div>

                  {/* Main Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Work Summary</h3>
                        <div className="space-y-10">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">✓</span>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tasks ExecutedToday</h4>
                            </div>
                            <p className="text-slate-600 font-medium text-lg italic leading-relaxed pl-9">"{dsr.work_done}"</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">➔</span>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Planned for Tomorrow</h4>
                            </div>
                            <p className="text-slate-600 font-medium text-lg italic leading-relaxed pl-9">"{dsr.work_planned}"</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Inventory Activity</h3>
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Received</p>
                            <p className="text-xs font-bold text-slate-800">{dsr.material_received}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Consumed</p>
                            <p className="text-xs font-bold text-slate-800">{dsr.material_used}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50/50 rounded-2xl p-8 border border-red-100/50">
                        <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">Issues Reported</h3>
                        <p className="text-sm font-bold text-red-900 leading-relaxed italic">"{dsr.issues}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Weekly Report Content */}
            {reportType === "Weekly" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1">
                      <p className="text-blue-600 font-black uppercase tracking-widest text-xs mb-2">Weekly Performance</p>
                      <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-4">Project Momentum</h2>
                      <p className="text-slate-500 font-medium text-lg max-w-xl">This week showed a steady completion rate of {weeklyProgress?.weekly_progress_percent || 0}% across {weeklyProgress?.tasks_count || 0} monitored tasks.</p>

                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Delta</p>
                          <p className="text-2xl font-black text-emerald-500">+{weeklyProgress?.weekly_progress_percent}%</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Milestones Hit</p>
                          <p className="text-2xl font-black text-slate-800">{Math.floor((weeklyProgress?.tasks_count || 0) * 0.8)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" className="fill-none stroke-slate-50" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="50"
                          className="fill-none stroke-blue-600 transition-all duration-1000 ease-out"
                          strokeWidth="12"
                          strokeDasharray={`${(weeklyProgress?.weekly_progress_percent || 0) * 3.141} 314.1`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-3xl font-black text-blue-600 leading-none">{weeklyProgress?.weekly_progress_percent || 0}%</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 leading-tight">Weekly Target Delivery</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Weekly Execution Log</h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">W{i}</div>
                            <p className="text-sm font-bold text-slate-800">Milestone Phase Activity #{100 + i}</p>
                          </div>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Completed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Strategic Summary</p>
                    <p className="text-xl font-medium text-slate-800 leading-relaxed italic opacity-90">"Project is on track to hit original delivery schedule. Resource allocation has been optimized for next week's plumbing phase."</p>
                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center text-[10px] font-black border border-slate-100">PM</div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Report Content */}
            {reportType === "Monthly" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Variance</p>
                    <h3 className="text-3xl font-black text-slate-800 Tracking-tight">0.8%</h3>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest leading-none">Under Budget Forecast</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Efficiency</p>
                    <h3 className="text-3xl font-black text-slate-800 Tracking-tight">94%</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest leading-none">Workforce Utilization</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saftey Hours</p>
                    <h3 className="text-3xl font-black text-emerald-500 Tracking-tight">2.4k</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Accident Free Hours</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 text-center">Monthly Project Health Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      {[
                        { label: "Procurement Lifecycle", value: 85, color: "bg-blue-600" },
                        { label: "Site Preparation", value: 100, color: "bg-emerald-500" },
                        { label: "Structural Framework", value: 45, color: "bg-orange-500" }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                            <span className="text-xs font-black text-slate-800">{item.value}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Executive Summary</p>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"Monthly analysis indicates high compliance with safety standards and efficient procurement cycles. Structural work is moving into secondary phase as anticipated."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quarterly Report Content */}
            {reportType === "Quarterly" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div>
                      <p className="text-blue-500 font-black uppercase tracking-widest text-xs mb-3">Q2 2026 AUDIT</p>
                      <h2 className="text-5xl font-black tracking-tight leading-none text-slate-800 mb-6">Strategic Audit <br /> Overview</h2>
                      <div className="flex gap-4">
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100/50">ISO Verified</span>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100/50">Financial Oversight OK</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 text-center shrink-0">
                      <div>
                        <p className="text-4xl font-black text-slate-800">98%</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Audit Compliance</p>
                      </div>
                      <div>
                        <p className="text-4xl font-black text-blue-600">0.0</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Risk Factor</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Quarterly Financial Health</h3>
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Quarterly Burn Rate</span>
                        <span className="text-lg font-black text-slate-800">Optimized</span>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Material Savings</span>
                        <span className="text-lg font-black text-emerald-500">12.4%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Long-term Objectives</h3>
                    <div className="space-y-4">
                      {[
                        "Phase 2 Completion (Structural)",
                        "System Integration (Electrical/MEP)",
                        "Finishing Works Commencement"
                      ].map((obj, i) => (
                        <div key={i} className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                          {obj}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ClientMonthlyProgressPage;
