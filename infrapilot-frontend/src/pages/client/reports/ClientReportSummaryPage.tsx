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
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-20">
        {/* Page Header */}
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
              <p className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[10px]">
                {projectData?.project_name || "Active Project"}
              </p>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Report <span className="text-blue-600">Summary</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Standardized Execution Intelligence & Analytics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Tabs - Modern Segmented Control */}
            <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-[22px] shadow-sm border border-slate-200/60 items-center">
              {["Daily", "Weekly", "Monthly", "Quarterly"].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type as any)}
                  className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${reportType === type
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {type}
                </button>
              ))}

              <div className="h-8 w-px bg-slate-200/60 mx-2"></div>

              <div className="relative">
                <button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100/50 transition-all active:scale-95"
                >
                  Explore
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isNavOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isNavOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNavOpen(false)}></div>
                    <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-slate-200/50 border border-slate-200/60 py-4 z-50 animate-in fade-in zoom-in-95 duration-200 h-[450px] overflow-y-auto scrollbar-hide">
                      <div className="px-6 py-2 mb-2 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Links</p>
                      </div>
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
                        <div key={item.label} className="px-3 group/item">
                          <button
                            onClick={() => {
                              navigate(item.path);
                              setIsNavOpen(false);
                            }}
                            className="w-full flex items-center gap-4 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl transition-all text-left"
                          >
                            <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover/item:bg-blue-100/50 flex items-center justify-center transition-colors">
                              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                              </svg>
                            </div>
                            {item.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-[22px] shadow-sm border border-slate-200/60 hover:border-slate-300 transition-colors group">
              <div className="flex flex-col">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reference Date</label>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="text-xs font-black text-slate-800 outline-none bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                disabled={exporting || exportingExcel}
                className={`flex items-center gap-3 px-7 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-200/50 active:scale-95 ${exporting || exportingExcel
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
              >
                {exportingExcel ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {exportingExcel ? 'Processing' : 'Excel Report'}
              </button>

              <button
                onClick={handleExportProjectPDF}
                disabled={exporting || exportingExcel}
                className={`flex items-center gap-3 px-7 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${exporting || exportingExcel
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {exporting ? 'Generating' : 'PDF Report'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-sm rounded-[40px] border-2 border-dashed border-slate-200 animate-pulse">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Intelligence Engine</p>
              <p className="text-sm font-bold text-slate-600">Synchronizing Project Data Matrix...</p>
            </div>
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
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {/* Summary Highlights Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Daily Status Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Report Status</p>
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${dsr?.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-orange-50 text-orange-600 shadow-inner'}`}>
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-slate-900 leading-tight">{dsr?.status}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{dsr?.business_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Workforce Deployment Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Total Deployment</p>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{dsr?.total_labour}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Personnel</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="h-1.5 flex-1 bg-emerald-500 rounded-full"></div>
                        <div className="h-1.5 flex-1 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Skilled: {dsr?.skilled_labour}</p>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Unskilled: {dsr?.unskilled_labour}</p>
                      </div>
                    </div>

                    {/* Site Weather */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Site Condition</p>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[24px] flex items-center justify-center group-hover:rotate-12 transition-all duration-500 shadow-inner">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-slate-900 capitalize">{dsr?.weather}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Optimal for Ops</p>
                        </div>
                      </div>
                    </div>

                    {/* Site Location */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Project Geo-Tag</p>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[24px] flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-500 shadow-inner">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <p className="text-xs font-black text-slate-800 truncate leading-tight mb-1">{dsr?.site_location || "N/A"}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">{dsr?.latitude?.toFixed(4)}° N, {dsr?.longitude?.toFixed(4)}° E</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Workforce Analytics Row */}
                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-blue-100/50 transition-all duration-1000"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50/50 rounded-full -ml-32 -mb-32 blur-[80px]"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Resource Utilization</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Workforce <span className="text-blue-600">Distribution</span></h3>
                          </div>
                          <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.1em]">Live Sync Active</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
                          {labourData?.labour_summary?.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col group/stat hover:-translate-y-1 transition-transform">
                              <span className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover/stat:text-blue-600 transition-colors">{item.count}</span>
                              <div className="h-1 w-12 bg-slate-100 rounded-full mb-3">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{item.skill_type} Labour</span>
                            </div>
                          )) || (
                              <>
                                <div className="flex flex-col group/stat hover:-translate-y-1 transition-transform">
                                  <span className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{dsr?.skilled_labour}</span>
                                  <div className="h-1 w-12 bg-slate-100 rounded-full mb-3">
                                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skilled (Daily)</span>
                                </div>
                                <div className="flex flex-col group/stat hover:-translate-y-1 transition-transform">
                                  <span className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{dsr?.unskilled_labour}</span>
                                  <div className="h-1 w-12 bg-slate-100 rounded-full mb-3">
                                    <div className="h-full bg-blue-600 rounded-full w-full"></div>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unskilled (Daily)</span>
                                </div>
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Main Data Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Work Summary - Take 8 columns */}
                    <div className="lg:col-span-8 bg-white rounded-[40px] p-10 shadow-sm border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-10">
                          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Execution Intelligence</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detailed Activity Log</p>
                          </div>
                        </div>

                        <div className="space-y-12 mb-10">
                          <div className="relative pl-10 border-l-2 border-emerald-100 hover:border-emerald-500 transition-colors group">
                            <div className="absolute -left-3 top-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Milestones Accomplished</h4>
                            <p className="text-slate-700 font-bold text-2xl tracking-tight leading-relaxed group-hover:text-slate-900 transition-colors">
                            &ldquo;{dsr?.work_done || "No work activity logged for today."}&rdquo;
                            </p>
                          </div>

                          <div className="relative pl-10 border-l-2 border-blue-100 hover:border-blue-500 transition-colors group">
                            <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-[10px] text-white font-bold">➔</div>
                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Planned Trajectory</h4>
                            <p className="text-slate-700 font-bold text-2xl tracking-tight leading-relaxed group-hover:text-slate-900 transition-colors">
                            &ldquo;{dsr?.work_planned || "No future tasks scheduled yet."}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-5 bg-slate-50 rounded-[28px] border border-slate-100">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Updated: {new Date(dsr?.updated_at || "").toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Sidebar Stats - Take 4 columns */}
                    <div className="lg:col-span-4 space-y-8">
                      {/* Inventory Card */}
                      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-200/60">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Log</h3>
                          <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="space-y-4">
                          <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 group hover:border-emerald-200 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Materials Received</p>
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{dsr?.material_received || "Zero intake recorded"}</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 group hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Materials Consumed</p>
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            </div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{dsr?.material_used || "Zero consumption recorded"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Issues/Observations Card */}
                      <div className={`rounded-[40px] p-8 border transition-all duration-500 ${dsr?.issues ? 'bg-rose-50 border-rose-100 shadow-xl shadow-rose-100/50' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${dsr?.issues ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${dsr?.issues ? 'text-rose-600' : 'text-slate-400'}`}>Risk Observations</h3>
                        </div>
                        <p className={`text-sm font-bold leading-relaxed italic ${dsr?.issues ? 'text-rose-900' : 'text-slate-500'}`}>
                          &ldquo;{dsr?.issues || "No critical issues or safety observations reported for this session."}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Weekly Report Content */}
            {reportType === "Weekly" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-200/60 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">Velocity Insight</span>
                      </div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-6">Weekly <span className="text-blue-600">Momentum</span></h2>
                      <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">This cycle demonstrated a consistent delivery velocity of <span className="text-slate-900 font-bold">{weeklyProgress?.weekly_progress_percent || 0}%</span> across <span className="text-slate-900 font-bold">{weeklyProgress?.tasks_count || 0}</span> monitored activity streams.</p>

                      <div className="grid grid-cols-2 gap-6 mt-10">
                        <div className="bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 group/item hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Weekly Delta</p>
                          <p className="text-3xl font-black text-emerald-500">+{weeklyProgress?.weekly_progress_percent}%</p>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 group/item hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Milestone Hit Rate</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{Math.floor((weeklyProgress?.tasks_count || 0) * 0.8)} <span className="text-sm text-slate-400 font-bold">/ {weeklyProgress?.tasks_count || 0}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-64 h-64 flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 bg-blue-600/5 rounded-full animate-pulse"></div>
                      <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" className="fill-none stroke-slate-100" strokeWidth="8" />
                        <circle
                          cx="60" cy="60" r="52"
                          className="fill-none stroke-blue-600 transition-all duration-[1500ms] ease-out-expo"
                          strokeWidth="10"
                          strokeDasharray={`${(weeklyProgress?.weekly_progress_percent || 0) * 3.26} 326`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-4xl font-black text-blue-600 leading-none tracking-tighter">{weeklyProgress?.weekly_progress_percent || 0}%</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 leading-tight">Target<br/>Precision</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white rounded-[40px] p-10 shadow-sm border border-slate-200/60">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Stream</h3>
                      <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Log</button>
                    </div>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white rounded-[18px] flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">W{i}</div>
                            <div>
                              <p className="text-sm font-black text-slate-900 mb-0.5">Execution Phase Alpha-#{100 + i}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide italic">Verified by Site Engineer</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-[9px] font-black uppercase tracking-tight">On Track</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-4 bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Ops Directives</p>
                      <p className="text-xl font-medium text-white leading-relaxed italic opacity-90 tracking-tight">
                        &ldquo;Project scaling is within parameters. Optimize resource buffers for upcoming structural integration phase.&rdquo;
                      </p>
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 text-white flex items-center justify-center text-[11px] font-black border border-white/10">PM</div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">S. Malhotra</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Operations Director</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly & Quarterly & Unified Report Content */}
            {(reportType === "Monthly" || reportType === "Quarterly") && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between h-60 hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{projectReport?.summary?.total_tasks || 0}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baseline Modules Identified</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between h-60 hover:shadow-xl transition-all group border-b-4 border-b-emerald-500">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-emerald-600 tracking-tighter mb-2">{projectReport?.summary?.completed_tasks || 0}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Successfully Executed</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between h-60 hover:shadow-xl transition-all group border-b-4 border-b-orange-500">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-orange-600 tracking-tighter mb-2">{projectReport?.summary?.open_issues || 0}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anomalies Detected</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between h-60 hover:shadow-xl transition-all group border-b-4 border-b-blue-500">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-blue-600 tracking-tighter mb-2">{projectReport?.summary?.overall_progress || 0}%</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Project Health</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-[48px] p-12 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full -mr-64 -mt-64 blur-[120px] group-hover:bg-blue-600/20 transition-all duration-1000"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full -ml-40 -mb-40 blur-[100px]"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                            <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[11px]">Financial Performance Profile</p>
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter mb-12">Profitability <br /> <span className="text-blue-500 text-shadow-glow">Analytics Matrix</span></h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          <div className="bg-white/[0.03] backdrop-blur-md rounded-[32px] p-8 border border-white/10 hover:bg-white/[0.06] transition-colors">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Gross Billing</p>
                            <p className="text-3xl font-black text-white tracking-tighter">₹{projectReport?.financials?.total_invoice?.toLocaleString() || 0}</p>
                          </div>
                          <div className="bg-white/[0.03] backdrop-blur-md rounded-[32px] p-8 border border-white/10 hover:bg-white/[0.06] transition-colors">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Operating Expense</p>
                            <p className="text-3xl font-black text-rose-400 tracking-tighter">₹{projectReport?.financials?.total_expense?.toLocaleString() || 0}</p>
                          </div>
                          <div className="bg-white/[0.03] backdrop-blur-md rounded-[32px] p-8 border border-white/10 hover:bg-white/[0.06] transition-colors ring-2 ring-emerald-500/20">
                            <p className="text-emerald-400/40 text-[10px] font-black uppercase tracking-widest mb-3">Net Realized Profit</p>
                            <p className="text-4xl font-black text-emerald-400 tracking-tighter">₹{projectReport?.financials?.profit?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="w-72 h-72 flex flex-col items-center justify-center p-10 bg-blue-600 rounded-full shadow-[0_0_80px_rgba(37,99,235,0.3)] text-center shrink-0 hover:scale-105 transition-transform duration-500">
                        <svg className="w-8 h-8 text-white/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Generation Timestamp</p>
                        <p className="text-sm font-black text-white leading-relaxed tracking-wide">
                          {projectReport?.generated_at ? new Date(projectReport.generated_at).toLocaleString() : 'PENDING'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[40px] p-10 border border-slate-200/60 shadow-sm group hover:shadow-xl transition-all">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Execution Lifespan</h4>
                    <div className="flex items-center gap-10">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Commencement</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{projectReport?.date_range?.start_date || 'N/A'}</p>
                      </div>
                      <div className="h-12 w-px bg-slate-100"></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Snapshot End</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{projectReport?.date_range?.end_date || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-[40px] p-10 border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reporting Classification</h4>
                      <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                        {projectReport?.report_type || reportType}
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      </p>
                    </div>
                    {projectReport?.quarter && (
                      <div className="px-8 py-4 bg-blue-950 text-blue-400 rounded-3xl font-black text-xs tracking-[0.2em] shadow-lg shadow-blue-900/20">
                        Q{projectReport.quarter} STAGE
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
