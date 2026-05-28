import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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

const ClientReportSummaryPage = () => {
  const [reportType, setReportType] = useState<"Daily" | "Weekly" | "Monthly" | "Quarterly">("Daily");
  const [dsr, setDsr] = useState<DSRData | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-05-25");
  const [projectData, setProjectData] = useState<any>(null);
  const [projectReport, setProjectReport] = useState<any>(null);
  const [labourData, setLabourData] = useState<any>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();

  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async (date: string) => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);

      const dateObj = new Date(date);
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();

      const [projectRes, reportRes, labourRes, dailyRes, weeklyRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getProjectReport(projectId, reportType.toLowerCase(), month, year),
        reportService.getLabourReport(projectId),
        reportService.getDailyReport(projectId, date),
        reportService.getWeeklyProgress(projectId)
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (reportRes.status === 'fulfilled') {
        console.log("Unified Project Report Fetched:", reportRes.value);
        setProjectReport(reportRes.value);
      }
      if (labourRes.status === 'fulfilled') {
        setLabourData(labourRes.value);
      }

      if (dailyRes.status === 'fulfilled' && dailyRes.value?.dsr) {
        setDsr(dailyRes.value.dsr);
      } else {
        setDsr(null);
        if (reportType === "Daily") {
          setError("No daily report found for the selected date.");
        }
      }

      if (weeklyRes.status === 'fulfilled') {
        setWeeklyProgress(weeklyRes.value);
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


  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      setExportingExcel(true);
      const dateObj = new Date(selectedDate);
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();
      
      const blob = await reportService.exportProjectReportExcel(projectId, reportType.toLowerCase(), month, year);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_Report_${reportType}_${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Excel:", err);
      alert("Failed to export Excel report.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportProjectPDF = async () => {
    if (!projectId) return;
    try {
      setExporting(true);
      const dateObj = new Date(selectedDate);
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();

      const blob = await reportService.exportProjectReportPDF(projectId, reportType.toLowerCase(), month, year);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Consolidated_Project_Report_${reportType}_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Project PDF:", err);
      alert("Failed to export Consolidated PDF.");
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

              <div className="h-8 w-px bg-slate-100 mx-2"></div>

              <div className="relative">
                <button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Quick Navigation
                  <svg className={`w-3 h-3 transition-transform ${isNavOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isNavOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNavOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 h-[400px] overflow-y-auto">
                      {[
                        { label: "Labour Report", path: "/client/reports/labour", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                        { label: "Material Report", path: "/client/reports/material", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
                        { label: "Issue Report", path: "/client/reports/issues", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
                        { label: "Client Report", path: "/client/reports/client-report", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                        { label: "Combined Report", path: "/client/reports/combined", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                        { label: "Contractor Performance", path: "/client/reports/contractor", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { label: "Project Report", path: "/client/reports/project", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                        { label: "Report Summary", path: "/client/reports/summary", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }
                      ].map((item) => (
                        <div key={item.label} className="px-2 group/item">
                          <button
                            onClick={() => {
                              navigate(item.path);
                              setIsNavOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all text-left"
                          >
                            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            {item.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

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

            <div className={`flex gap-4 ${reportType === "Daily" ? "flex-col" : "flex-row items-center"}`}>
              <button
                onClick={handleExportExcel}
                disabled={exporting || exportingExcel}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-slate-100 ${exporting || exportingExcel
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}
              >
                {exportingExcel ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {exportingExcel ? 'Processing...' : 'Export Project Excel'}
              </button>

              <button
                onClick={handleExportProjectPDF}
                disabled={exporting || exportingExcel}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-slate-100 ${exporting || exportingExcel
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'bg-white text-slate-800 hover:bg-slate-50 active:scale-95'
                  }`}
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {exporting ? 'Generating...' : 'Export Project PDF'}
              </button>
            </div>
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
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Summary Highlights Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Daily Status Card */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daily Report Status</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dsr?.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-800">{dsr?.status}</p>
                          <p className="text-[10px] font-bold text-slate-400">{dsr?.business_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Workforce Deployment Card */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deployment</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{dsr?.total_labour}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Members</span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Skilled: {dsr?.skilled_labour}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Unskilled: {dsr?.unskilled_labour}</p>
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
                        <p className="text-xl font-black text-slate-800">{dsr?.weather}</p>
                      </div>
                    </div>

                    {/* Site Location */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Site Location</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xs font-black">LOC</div>
                        <div className="flex flex-col">
                          <p className="text-xs font-black text-slate-800">{dsr?.site_location || "N/A"}</p>
                          <p className="text-[9px] font-bold text-slate-400">{dsr?.latitude?.toFixed(4)} / {dsr?.longitude?.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workforce Analytics Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                      <div className="flex justify-between items-center mb-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workforce Distribution</p>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-tighter">Live Manpower</span>
                      </div>
                      <div className="flex gap-12">
                        {labourData?.labour_summary?.map((item: any, idx: number) => (
                          <div key={idx} className="flex flex-col">
                            <span className="text-3xl font-black text-slate-800">{item.count}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.skill_type} Labour</span>
                          </div>
                        )) || (
                            <>
                              <div className="flex flex-col">
                                <span className="text-3xl font-black text-slate-800">{dsr?.skilled_labour}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Skilled (Daily)</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-3xl font-black text-slate-800">{dsr?.unskilled_labour}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Unskilled (Daily)</span>
                              </div>
                            </>
                          )}
                      </div>
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
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tasks Executed Today</h4>
                            </div>
                            <p className="text-slate-600 font-medium text-lg italic leading-relaxed pl-9">"{dsr?.work_done}"</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">➔</span>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Planned for Tomorrow</h4>
                            </div>
                            <p className="text-slate-600 font-medium text-lg italic leading-relaxed pl-9">"{dsr?.work_planned}"</p>
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
                            <p className="text-xs font-bold text-slate-800">{dsr?.material_received}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Consumed</p>
                            <p className="text-xs font-bold text-slate-800">{dsr?.material_used}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50/50 rounded-2xl p-8 border border-red-100/50">
                        <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">Issues Reported</h3>
                        <p className="text-sm font-bold text-red-900 leading-relaxed italic">"{dsr?.issues}"</p>
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

            {/* Monthly & Quarterly & Unified Report Content */}
            {(reportType === "Monthly" || reportType === "Quarterly") && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tasks</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">{projectReport?.summary?.total_tasks || 0}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Modules Identified</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
                    <h3 className="text-4xl font-black text-emerald-500 tracking-tight">{projectReport?.summary?.completed_tasks || 0}</h3>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest leading-none">Successfully Executed</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Issues</p>
                    <h3 className="text-4xl font-black text-orange-500 tracking-tight">{projectReport?.summary?.open_issues || 0}</h3>
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest leading-none">Requires Attention</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between h-56">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</p>
                    <h3 className="text-4xl font-black text-blue-600 tracking-tight">{projectReport?.summary?.overall_progress || 0}%</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest leading-none">Project Health</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                      <div className="flex-1">
                        <p className="text-blue-400 font-extrabold uppercase tracking-[0.2em] text-[10px] mb-4">Financial performance</p>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">Profitability <br /> <span className="text-blue-400">Analysis</span></h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Total Invoice</p>
                            <p className="text-2xl font-black text-white">₹{projectReport?.financials?.total_invoice?.toLocaleString() || 0}</p>
                          </div>
                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Total Expense</p>
                            <p className="text-2xl font-black text-rose-400">₹{projectReport?.financials?.total_expense?.toLocaleString() || 0}</p>
                          </div>
                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Net Profit</p>
                            <p className="text-3xl font-black text-emerald-400">₹{projectReport?.financials?.profit?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="w-64 h-64 flex flex-col items-center justify-center p-8 bg-blue-600 rounded-Full shadow-2xl shadow-blue-500/20 text-center shrink-0">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Generation At</p>
                        <p className="text-xs font-bold text-white leading-relaxed">
                          {projectReport?.generated_at ? new Date(projectReport.generated_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Period</h4>
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Start Date</p>
                        <p className="text-lg font-black text-slate-800">{projectReport?.date_range?.start_date || 'N/A'}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-100"></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">End Date</p>
                        <p className="text-lg font-black text-slate-800">{projectReport?.date_range?.end_date || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Report Type</h4>
                      <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">{projectReport?.report_type || reportType}</p>
                    </div>
                    {projectReport?.quarter && (
                      <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs">
                        QUARTER {projectReport.quarter}
                      </div>
                    )}
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

export default ClientReportSummaryPage;
