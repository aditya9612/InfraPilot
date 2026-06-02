import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { reportService } from "../../services/reportService";
import { dsrService } from "../../services/dsrService";
import { workProgressService } from "../../services/workProgressService";
import { issueService } from "../../services/issueService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

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
  const [labourSummary, setLabourSummary] = useState<any>(null);

  const fetchAllReports = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const pid = projectId;
      const [daily, weekly, material, issues, labour] = await Promise.all([
        reportService.getDailyReport(pid, reportDate),
        workProgressService.listActivities(pid),
        reportService.getMaterialReport(pid),
        issueService.listIssuesByProject(pid),
        reportService.getLabourReport(pid)
      ]);
      setDailyReport(daily.dsr || daily);
      setWeeklyProgress(weekly);
      const rawMaterials = Array.isArray(material) ? material : (material?.materials || material?.items || material?.data || []);
      const normalizedMaterials = rawMaterials.map((item: any) => ({
        ...item,
        remaining_stock: item.remaining_stock ?? item.remaining_quantity ?? item.current_stock ?? 0,
        total_cost: item.total_cost ?? item.total_valuation ?? ((item.purchase_rate || 0) * (item.remaining_quantity || 0))
      }));
      setMaterialSummary(normalizedMaterials);
      setIssueSummary(issues);
      setLabourSummary(labour);
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

  const generatePremiumPDF = (options: {
    title: string;
    subtitle: string;
    summaryStats: Array<{ label: string; value: string }>;
    tableHeaders: string[][];
    tableBody: any[][];
    fileName: string;
  }) => {
    const { title, subtitle, summaryStats, tableHeaders, tableBody, fileName } = options;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryBlue: [number, number, number] = [15, 23, 42]; // #0F172A
    const accentOrange: [number, number, number] = [249, 115, 22]; // #F97316

    // --- HEADER BACKGROUND ---
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // --- LOGO / BRANDING ---
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INFRA", 14, 25);
    doc.setTextColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.text("PILOT", 42, 25);
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Construction Billing Software", 14, 32);

    // --- REPORT BADGE ---
    doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.roundedRect(pageWidth - 65, 15, 50, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("REPORT", pageWidth - 40, 25, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toUTCString()}`, pageWidth - 14, 36, { align: "right" });

    // --- SUB-HEADER ---
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 60, { align: "center" });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth / 2, 67, { align: "center" });

    // --- ORANGE DIVIDER ---
    doc.setDrawColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.setLineWidth(1);
    doc.line(14, 75, pageWidth - 14, 75);

    // --- CONTACT ROW ---
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const contactY = 88;
    const colWidth = (pageWidth - 28) / 4;
    doc.text("Pune, Maharashtra", 14, contactY);
    doc.text("+91 9999999999", 14 + colWidth, contactY);
    doc.text("info@infrapilot.com", 14 + 2 * colWidth, contactY);
    doc.text("www.infrapilot.com", 14 + 3 * colWidth, contactY);

    // --- SUMMARY SECTION ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 14, 105);

    const statCount = summaryStats.length;
    const statWidth = (pageWidth - 28) / statCount;
    let currentX = 14;
    
    summaryStats.forEach(stat => {
      // Box Top Border (Orange)
      doc.setDrawColor(accentOrange[0], accentOrange[1], accentOrange[2]);
      doc.setLineWidth(1);
      doc.line(currentX, 115, currentX + statWidth - 2, 115);

      // Box Contents
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label.toUpperCase(), currentX + 5, 125);

      doc.setFontSize(16);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFont("helvetica", "bold");
      doc.text(stat.value, currentX + 5, 140);

      currentX += statWidth;
    });

    // --- DETAILS TABLE ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text(`${title.split(' ')[0].toUpperCase()} DETAILS`, 14, 165);

    autoTable(doc, {
      startY: 172,
      head: tableHeaders,
      body: tableBody,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryBlue, 
        textColor: [255, 255, 255], 
        fontSize: 10, 
        fontStyle: 'bold' 
      },
      bodyStyles: { 
        textColor: [30, 41, 59], 
        fontSize: 9 
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] 
      }
    });

    doc.save(fileName);
  };

  const generateCSV = (data: any, filename: string) => {
    let rows: any[] = [];
    if (Array.isArray(data)) {
      rows = data;
    } else {
      const mainList = data?.items || data?.data || data?.work_summary || data?.transactions || data?.dsr || data?.tasks;
      if (Array.isArray(mainList)) {
        const { items, data: _d, work_summary, transactions, dsr, tasks, ...topLevel } = data;
        rows = mainList.map((item: any) => ({
          ...topLevel,
          ...(typeof item === 'object' ? item : { value: item })
        }));
      } else {
        rows = [data];
      }
    }
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row: any) =>
      Object.values(row).map((v: any) => {
        if (v === null || v === undefined) return '""';
        const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = [headers, ...csvRows].join("\n");
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportDailyPDF = async () => {
    if (!projectId) return;
    try {
      toast.loading("Generating Daily Operations Report...", { id: "daily-pdf" });
      const daily = await reportService.getDailyReport(projectId, reportDate);
      const dsr = daily.dsr || daily;

      generatePremiumPDF({
        title: "Daily Operations Report",
        subtitle: `Hinjawadi, Pune | ${new Date(reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        summaryStats: [
          { label: "Total Labour", value: (dsr.total_labour || 0).toString() },
          { label: "Skilled", value: (dsr.skilled_labour || 0).toString() },
          { label: "Unskilled", value: (dsr.unskilled_labour || 0).toString() },
          { label: "Weather", value: dsr.weather || "Sunny" },
          { label: "Status", value: "Updated" }
        ],
        tableHeaders: [["Activity/Work Description", "Qty", "Unit", "Location", "Remarks"]],
        tableBody: (dsr.work_summary || []).map((w: any) => [
          w.activity_name || "-",
          w.completed_qty || "0",
          w.unit || "-",
          w.location || "-",
          w.remarks || "-"
        ]),
        fileName: `Daily_Report_${reportDate}.pdf`
      });
      toast.success("Daily Report PDF downloaded!", { id: "daily-pdf" });
    } catch (error: any) { 
      console.error(error); 
      toast.error(error.message || "Failed to generate Daily Report", { id: "daily-pdf" });
    }
  };

  const handleExportDailyExcel = async () => {
    if (!projectId) return;
    try {
      // Use the dedicated DSR export endpoint which provides proper Excel formatting
      await dsrService.exportDsrExcel(Number(projectId), {
        start_date: reportDate,
        end_date: reportDate
      });
    } catch (error) {
      console.error("DSR Excel export failed, falling back to CSV:", error);
      const data = await reportService.getDailyReport(projectId, reportDate);
      generateCSV(data?.dsr || data, `Daily_Report_${reportDate}.csv`);
    }
  };

  const handleExportWeeklyPDF = async () => {
    if (!projectId) return;
    try {
      toast.loading("Generating Weekly Progress Report...", { id: "weekly-pdf" });
      const weeklyData = await workProgressService.listActivities(projectId);
      const tasks = Array.isArray(weeklyData) ? weeklyData : ((weeklyData as any).items || (weeklyData as any).data || []);
      
      const totalActivities = tasks.length;
      const completedActivities = tasks.filter((a: any) => a.completion_percentage === 100 || a.status === 'Completed').length;
      const overallCompletion = totalActivities > 0 ? Math.round((tasks.reduce((acc: number, val: any) => acc + (Number(val.completion_percentage) || 0), 0)) / totalActivities) : 0;

      generatePremiumPDF({
        title: "Weekly Progress Report",
        subtitle: `Project ID: ${projectId} | Week Ending ${new Date().toLocaleDateString('en-GB')}`,
        summaryStats: [
          { label: "Completion", value: `${overallCompletion}%` },
          { label: "Tasks Done", value: completedActivities.toString() },
          { label: "Total Tasks", value: totalActivities.toString() },
          { label: "Delayed", value: tasks.filter((a: any) => a.status === 'Delay').length.toString() },
          { label: "Status", value: overallCompletion >= 100 ? "Completed" : "In Progress" }
        ],
        tableHeaders: [["Task Name", "Category/BOQ", "Planned Qty", "Progress", "Status"]],
        tableBody: tasks.map((t: any) => [
          t.activity_name || t.task_name || "-",
          t.boq_code || t.category || "Civil",
          t.planned_quantity || t.planned_qty || "0",
          `${t.completion_percentage || t.progress_percent || 0}%`,
          t.status || "On Track"
        ]),
        fileName: `Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`
      });
      toast.success("Weekly Progress PDF generated!", { id: "weekly-pdf" });
    } catch (error) { 
      console.error(error); 
      toast.error("Failed to generate Weekly PDF", { id: "weekly-pdf" });
    }
  };

  const handleExportWeeklyExcel = async () => {
    if (!projectId) return;
    try {
      toast.loading("Generating Weekly Progress Excel...", { id: "weekly-excel" });
      const weeklyData = await workProgressService.listActivities(projectId);
      const tasks = Array.isArray(weeklyData) ? weeklyData : ((weeklyData as any).items || (weeklyData as any).data || []);
      
      // Calculate stats to include in every row for context
      const totalActivities = tasks.length;
      const completedActivities = tasks.filter((a: any) => a.completion_percentage === 100).length;
      const progressPercent = totalActivities > 0 ? Math.round((tasks.reduce((acc: number, val: any) => acc + (Number(val.completion_percentage) || 0), 0)) / totalActivities) : 0;

      const formattedData = tasks.map((t: any) => ({
        Project_ID: projectId,
        Report_Date: new Date().toLocaleDateString(),
        Overall_Completion: `${progressPercent}%`,
        Total_Activities: totalActivities,
        Completed_Activities: completedActivities,
        Activity_Name: t.activity_name || "-",
        Planned_Quantity: t.planned_quantity || 0,
        Completed_Quantity: t.total_completed || 0,
        Progress: `${t.completion_percentage || 0}%`,
        Status: t.status || "-"
      }));

      generateCSV(formattedData, `Weekly_Report_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success("Weekly Progress downloaded!", { id: "weekly-excel" });
    } catch (error) {
      console.error("Weekly Excel export failed:", error);
      toast.error("Failed to export Weekly Excel", { id: "weekly-excel" });
    }
  };

  const handleExportLabourPDF = async () => {
    if (!projectId) return;
    try {
      toast.loading("Generating Labour Deployment Report...", { id: "labour-pdf" });
      const labourRes = await reportService.getLabourReport(projectId);
      const summary: Array<{ skill_type: string; count: number }> =
        labourRes.labour_summary || labourRes.data?.labour_summary || [];
      const totalCount = summary.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);

      generatePremiumPDF({
        title: "Labour Deployment Report",
        subtitle: `Viman Nagar, Pune | ${new Date().toLocaleDateString('en-GB')}`,
        summaryStats: [
          { label: "Total Workers", value: totalCount.toString() },
          { label: "Skilled", value: (summary.find(s => s.skill_type === 'Skilled')?.count || 0).toString() },
          { label: "Unskilled", value: (summary.find(s => s.skill_type === 'Unskilled')?.count || 0).toString() },
          { label: "Contractors", value: "05" },
          { label: "Safety", value: "Verified" }
        ],
        tableHeaders: [["Labour Category/Skill Type", "Strength Deployed", "Remarks/Notes"]],
        tableBody: [...summary.map(s => [s.skill_type || "-", s.count?.toString() || "0", "Daily Attendance Verified"]), ["TOTAL", totalCount.toString(), ""]],
        fileName: `Labour_Report_${new Date().toISOString().split('T')[0]}.pdf`
      });
      toast.success("Labour Report PDF generated!", { id: "labour-pdf" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Labour PDF", { id: "labour-pdf" });
    }
  };

  const handleExportLabourExcel = async () => {
    if (!projectId) return;
    try {
      const blob = await reportService.exportLabourExcel(projectId);
      downloadFile(blob, `Labour_Report.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) { console.error(error); }
  };

  const handleExportMaterialPDF = async () => {
    if (!projectId) return;
    try {
      toast.loading("Downloading Material Report PDF...", { id: "material-pdf" });
      const data = await reportService.exportMaterialPDF(projectId);
      
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || error.detail || "Failed to download Material PDF");
      }
      
      downloadFile(data, `Material_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf');
      toast.success("Material Report PDF downloaded!", { id: "material-pdf" });
    } catch (error: any) { 
      console.error(error); 
      toast.error(error.message || "Failed to download Material PDF", { id: "material-pdf" });
    }
  };

  const handleExportMaterialExcel = async () => {
    if (!projectId) return;
    try {
      const blob = await reportService.exportMaterialExcel(projectId);
      downloadFile(blob, `Material_Report.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) { console.error(error); }
  };

  const handleExportIssuePDF = async () => {
    if (!projectId) return;
    try {
      toast.loading("Generating Site Issues Report...", { id: "issue-pdf" });
      const issuesRes = await issueService.listIssuesByProject(projectId);
      const items = (issuesRes as any).items || (issuesRes as any).data?.items || (Array.isArray(issuesRes) ? issuesRes : []);
      const openCount = items.filter((i: any) => i.status !== 'Resolved').length;

      generatePremiumPDF({
        title: "Site Issues Report",
        subtitle: `Project ID: ${projectId} | Outstanding as of ${new Date().toLocaleDateString('en-GB')}`,
        summaryStats: [
          { label: "Total Issues", value: items.length.toString() },
          { label: "Open Issues", value: openCount.toString() },
          { label: "Resolved", value: (items.length - openCount).toString() },
          { label: "Critical", value: items.filter((i: any) => i.priority === 'High' || i.priority === 'Critical').length.toString() },
          { label: "Status", value: openCount > 5 ? "Critical" : "Stable" }
        ],
        tableHeaders: [["ID", "Issue Title/Description", "Status", "Priority", "Reported By"]],
        tableBody: items.map((i: any) => [
          i.business_id || i.id || "-",
          i.title || i.issue_name || "-",
          i.status || "Open",
          i.priority || "Medium",
          i.reporter_role || i.source || "Site Engineer"
        ]),
        fileName: `Issues_Report_${new Date().toISOString().split('T')[0]}.pdf`
      });
      toast.success("Issues Report PDF generated!", { id: "issue-pdf" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Issues PDF", { id: "issue-pdf" });
    }
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
                onPDF: handleExportDailyPDF, onExcel: handleExportDailyExcel,
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
                onPDF: handleExportWeeklyPDF, onExcel: handleExportWeeklyExcel,
                onView: () => navigate("/client/progress")
              },
              {
                level: "DAILY", title: "Labour Report", size: "0.8 MB", colorClass: "text-yellow-600",
                frequency: "Daily", time: "Today, 07:00 AM",
                desc: "Workforce breakdown by skill category, attendance, overtime, and contractor-wise deployment summary.",
                stats: [
                  { label: "TOTAL WORKERS", value: labourSummary?.total_workers || dailyReport?.total_labour || 0 },
                  { label: "ACTIVE", value: labourSummary?.active_workers || dailyReport?.total_labour || 0 },
                  { label: "INACTIVE", value: labourSummary?.inactive_workers || "0" },
                  { label: "CONTRACTORS", value: labourSummary?.contractors_count || "1" }
                ],
                onPDF: handleExportLabourPDF, onExcel: handleExportLabourExcel,
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
                onPDF: handleExportMaterialPDF, onExcel: handleExportMaterialExcel,
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
                onPDF: handleExportIssuePDF, onExcel: handleExportIssueExcel,
                onView: () => navigate("/client/reports/issues")
              }
            ]
              .filter(report => {
                const matchesSearch = 
                  report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  report.level.toLowerCase().includes(searchQuery.toLowerCase());
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
