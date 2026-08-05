import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";
import { workProgressService } from "../../services/workProgressService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { Eye, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import ActivityDetailModal from "../../components/WorkProgress/ActivityDetailModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const ClientProgressPage = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const { projectId } = useClientProjectId();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const fetchProgressData = async () => {
      try {
        setLoadingActivities(true);
        const response = await projectService.getWorkProgressActivities(projectId, undefined, 50);
        const fetchedActivities = Array.isArray(response) ? response : (response.data || response.items || []);
        setActivities(fetchedActivities);
      } catch (err) {
        console.error("Failed to fetch work progress activities:", err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchProgressData();
  }, [projectId]);

  const handleExportPdf = async () => {
    if (!activities || activities.length === 0) {
      toast.error("No activity data to export");
      return;
    }
    setExportingPdf(true);
    const toastId = toast.loading("Generating PDF report...");
    try {
      if (projectId) {
        try {
          await workProgressService.getPdfReport(projectId);
          toast.success("PDF report downloaded!", { id: toastId });
          setExportingPdf(false);
          return;
        } catch (apiErr) {
          console.warn("Backend PDF export failed, falling back to local generation:", apiErr);
        }
      }

      const doc = new jsPDF({ orientation: "landscape" }) as any;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 24, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("WORK PROGRESS REPORT", 14, 16);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 280, 16, { align: "right" });

      const tableRows = activities.map((act) => [
        act.activity_name || "—",
        `${act.total_completed ?? 0} / ${act.planned_quantity ?? 0}`,
        act.remaining_quantity ?? 0,
        `${act.completion_percentage ?? 0}%`,
        act.unit || "—",
        `${act.start_date || "—"} to ${act.end_date || "—"}`,
        (act.status || "—").replace(/_/g, " ").toUpperCase()
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["Activity Name", "Completed / Planned", "Remaining", "% Completion", "Unit", "Timeline", "Status"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Work_Progress_Report_${projectId || "client"}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF report exported!", { id: toastId });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF report", { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!activities || activities.length === 0) {
      toast.error("No activity data to export");
      return;
    }
    setExportingExcel(true);
    const toastId = toast.loading("Generating Excel report...");
    try {
      if (projectId) {
        try {
          await workProgressService.getExcelReport(projectId);
          toast.success("Excel report downloaded!", { id: toastId });
          setExportingExcel(false);
          return;
        } catch (apiErr) {
          console.warn("Backend Excel export failed, falling back to local generation:", apiErr);
        }
      }

      const rows = activities.map((act) => ({
        "Activity Name": act.activity_name || "—",
        "Discipline": act.discipline || "—",
        "Planned Quantity": act.planned_quantity ?? 0,
        "Total Completed": act.total_completed ?? 0,
        "Remaining Quantity": act.remaining_quantity ?? 0,
        "% Completion": `${act.completion_percentage ?? 0}%`,
        "Unit": act.unit || "—",
        "Start Date": act.start_date || "—",
        "End Date": act.end_date || "—",
        "Status": (act.status || "—").replace(/_/g, " ").toUpperCase()
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Work Progress");
      XLSX.writeFile(wb, `Work_Progress_Report_${projectId || "client"}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel report exported!", { id: toastId });
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to generate Excel report", { id: toastId });
    } finally {
      setExportingExcel(false);
    }
  };

  // Filtering Logic
  const filteredActivities = activities.filter(act => {
    if (filterStatus === "ALL") return true;
    const status = act.status?.toUpperCase() || "";
    if (filterStatus === "ON_TRACK") return ["ON_TRACK", "ON TRACK"].includes(status);
    if (filterStatus === "COMPLETED") return ["COMPLETED"].includes(status);
    if (filterStatus === "DELAYED") return ["DELAY", "DELAYED", "DELAY_ONGOING"].includes(status);
    if (filterStatus === "NOT_STARTED") return ["NOT_STARTED", "NOT STARTED"].includes(status);
    return true;
  });

  // Pagination Logic
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Compute status counts
  const stats = {
    all: activities.length,
    onTrack: activities.filter(a => ["ON TRACK", "ON_TRACK", "On Track"].includes(a.status?.toUpperCase() || a.status)).length,
    completed: activities.filter(a => ["COMPLETED", "Completed"].includes(a.status?.toUpperCase() || a.status)).length,
    notStarted: activities.filter(a => ["NOT_STARTED", "NOT STARTED", "Not Started"].includes(a.status?.toUpperCase() || a.status)).length,
    delayed: activities.filter(a => ["DELAY", "DELAYED", "Delayed", "DELAY_ONGOING"].includes(a.status?.toUpperCase() || a.status)).length,
  };

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "ON_TRACK", label: "On Track" },
    { value: "DELAY", label: "Delay" },
    { value: "COMPLETED", label: "Completed" },
  ];

  return (
    <>
      <Navbar title="Work Progress" breadcrumb={["InfraPilot", "Client", "Work Progress"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Work Progress</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time construction progress tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {exportingPdf ? (
                <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              {exportingPdf ? "Exporting..." : "Download PDF"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {exportingExcel ? (
                <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              )}
              {exportingExcel ? "Exporting..." : "Download Excel"}
            </button>
          </div>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { id: "ALL", label: "Total Activities", sub: "All time records", count: stats.all, color: "text-slate-800" },
            { id: "ON_TRACK", label: "On Track", sub: "Performing Well", count: stats.onTrack, color: "text-blue-500" },
            { id: "COMPLETED", label: "Completed", sub: "Phase Accomplished", count: stats.completed, color: "text-emerald-500" },
            { id: "DELAYED", label: "Delayed", sub: "Intervention Required", count: stats.delayed, color: "text-rose-500" }
          ].map(card => (
            <button
              key={card.id}
              onClick={() => {
                setFilterStatus(card.id);
                setCurrentPage(1);
              }}
              className={`p-6 rounded-2xl bg-white border transition-all flex flex-col items-start gap-4 text-left group active:scale-[0.98] ${filterStatus === card.id
                ? "border-blue-500 shadow-lg shadow-blue-50"
                : "border-slate-100 shadow-sm hover:border-slate-200"
                }`}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {card.label}
              </span>
              <span className={`text-4xl font-black tracking-tighter leading-none ${card.color}`}>
                {card.count}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {card.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Detailed Activity Progress — now from API */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
              Detailed Activity Progress
            </h2>

            {/* STATUS label + dropdown — placed right next to title in marked place */}
            <div className="flex items-center gap-2.5" ref={dropdownRef}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Status:
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-[11px] font-extrabold text-slate-700 transition-all cursor-pointer uppercase tracking-wider min-w-[130px] justify-between shadow-sm"
                >
                  <span>{statusOptions.find(o => o.value === filterStatus)?.label ?? "All Status"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {statusOptions.map((opt) => {
                      const isSelected = filterStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFilterStatus(opt.value);
                            setCurrentPage(1);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Name</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed / Planned</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">% Completion</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 pr-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingActivities ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                      <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading activities...
                      </div>
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">No activities found.</td>
                  </tr>
                ) : (
                  paginatedActivities.map((act, i) => {
                    const statusColor =
                      ["COMPLETED", "Completed", "ON TRACK", "ON_TRACK", "On Track"].includes(act.status) ? "bg-green-500" :
                        ["IN_PROGRESS", "In Progress", "IN PROGRESS"].includes(act.status) ? "bg-blue-500" :
                          ["DELAY", "DELAYED", "Delayed", "DELAY_ONGOING"].includes(act.status) ? "bg-red-500" :
                            ["NOT_STARTED", "NOT STARTED", "Not Started"].includes(act.status) ? "bg-amber-500" :
                              "bg-slate-300";
                    const statusBg = "bg-slate-50 text-slate-500";
                    const barColor =
                      ["DELAY", "DELAYED", "Delayed", "DELAY_ONGOING"].includes(act.status) ? "bg-red-500" : "bg-blue-600";

                    return (
                      <tr key={act.id || i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-8">
                          <p className="text-sm font-bold text-slate-700">{act.activity_name}</p>
                          {act.discipline && <p className="text-[10px] text-slate-400 mt-0.5">{act.discipline}</p>}
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-600">
                            {act.total_completed} <span className="text-slate-300">/</span> {act.planned_quantity}
                          </p>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">{act.remaining_quantity}</td>
                        <td className="p-4 w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${act.completion_percentage}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-700 w-8">{act.completion_percentage}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">{act.unit || "—"}</td>
                        <td className="p-4 whitespace-nowrap">
                          <p className="text-[10px] font-bold text-slate-500">{act.start_date} to {act.end_date}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusBg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
                            {act.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 pr-8 text-right">
                          <button
                            onClick={() => setSelectedActivity(act)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          {!loadingActivities && totalItems > 0 && (
            <div className="px-8 py-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records per page:</p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    {[5, 10, 20, 50].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-slate-800 font-black">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-800 font-black">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-slate-800 font-black">{totalItems}</span> records
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </button>

                <div className="flex items-center gap-1.5 mx-2">
                  {getPageNumbers().map((p, i) => (
                    typeof p === "number" ? (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 ${currentPage === p ? 'bg-primary text-white shadow-lg shadow-blue-200 border-transparent' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={i} className="text-slate-300 font-black px-1 text-xs">{p}</span>
                    )
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  Next
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Details Modal */}
      <ActivityDetailModal
        isOpen={selectedActivity !== null}
        onClose={() => setSelectedActivity(null)}
        activity={selectedActivity}
      />
    </>
  );
};

export default ClientProgressPage;

