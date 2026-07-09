import { useEffect, useState, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import { dsrService } from "../../../services/dsrService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { Search, MapPin, ChevronDown, ImageIcon, Trash2, X, Maximize2, RefreshCw, FileDown, Eye, ChevronLeft, ChevronRight, Calendar, FileText, Package, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const ClientDSRSummaryPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{id: number, url: string} | null>(null);
  const [selectedReportForView, setSelectedReportForView] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL STATUS");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { projectId } = useClientProjectId();

  const fetchDsrData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      // HARDCODE THE LIMIT IN REQUEST TO ENSURE IT PASSES
      const response: any = await dsrService.getDsrByProject(projectId, { limit: 100, offset: 0 });
      
      // Force verify that the URL being hit actually has the limit=100 if the service allows it, 
      // but since the service is using standard params, we'll try to re-verify the service.
      if (response.meta?.total !== undefined) {
        setTotalCount(response.meta.total);
      } else {
        setTotalCount(Array.isArray(response) ? response.length : (response.items?.length || 0));
      }

      let items: any[] = Array.isArray(response) ? response : (response.items || response.data || []);
      
      const formatted = await Promise.all(items.map(async (item: any) => {
        const resolveStaticUrl = (path: string) => {
          if (!path) return "";
          if (path.startsWith('http') || path.startsWith('data:')) return path;
          let baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
          const cleanBase = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          const cleanPath = path.startsWith('/') ? path : `/${path}`;
          return `${cleanBase}${cleanPath}`;
        };

        let gallery: any[] = [];
        try {
          const photoData = await dsrService.getDsrPhotos(item.id);
          gallery = photoData.map((p: any) => ({
            id: p.id,
            url: resolveStaticUrl(p.url)
          }));
        } catch (e) {
          gallery = (item.photos || []).map((p: any) => ({
            id: p.id,
            url: resolveStaticUrl(p.url || p.file_url || "")
          })).filter((p: any) => p.url);
        }

        return {
          ...item,
          formattedDate: item.report_date ? new Date(item.report_date).toLocaleDateString('en-GB') : "N/A", // DD/MM/YYYY
          gallery
        };
      }));
      setReports(formatted.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()));
    } catch (error) {
      console.error("DSR Suite fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDsrData();
  }, [fetchDsrData]);

  useEffect(() => {
    let result = reports;
    if (searchQuery) {
      result = result.filter(r => 
        r.work_done?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.report_date?.includes(searchQuery) ||
        (r.business_id || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (dateFilter) {
      result = result.filter(r => r.report_date?.startsWith(dateFilter));
    }
    if (statusFilter !== "ALL STATUS") {
      result = result.filter(r => r.status?.toUpperCase() === statusFilter);
    }
    setFilteredReports(result);
    setCurrentPage(1);
  }, [reports, searchQuery, statusFilter, dateFilter]);

  const stats = {
    total: totalCount || reports.length,
    drafts: reports.filter(r => r.status?.toLowerCase() === 'draft' || !r.status).length,
    submitted: reports.filter(r => r.status?.toLowerCase() === 'submitted').length,
    approved: reports.filter(r => r.status?.toLowerCase() === 'approved' || r.status?.toLowerCase() === 'verified').length
  };

  // Perform local pagination on the fetched 100 records for UI cleanliness
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    if (!window.confirm("Delete this photo from records?")) return;
    try {
      await dsrService.deleteDsrPhoto(selectedPhoto.id);
      setReports(prev => prev.map(report => ({
        ...report,
        gallery: report.gallery.filter((p: any) => p.id !== selectedPhoto.id)
      })));
      setSelectedPhoto(null);
      toast.success("Photo removed from record.");
    } catch (err) {
      console.error("Deletion failed:", err);
      toast.error("Failed to delete photo.");
    }
  };

  const handleExport = async () => {
    try {
        if (projectId) {
            await dsrService.exportDsrExcel(projectId);
            toast.success("Excel ledger exported successfully.");
        }
    } catch (err) {
        toast.error("Failed to export ledger.");
    }
  };

  return (
    <>
      <Navbar title="Site Updates" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Suite"]} />
      <div className="p-8 bg-[#f8fafc] min-h-screen font-inter pb-20">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Project Daily Ledger</h1>
            <p className="text-slate-400 font-medium mt-1 text-sm tracking-tight font-inter">Historical record of activities, labour, and material movements.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={fetchDsrData}
               className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
               title="Refresh Data"
             >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
             </button>
             
             <button 
               onClick={handleExport}
               className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
             >
               <FileDown className="w-4 h-4" />
               Export
             </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 font-inter">
          {[
            { label: "TOTAL LOGS", value: stats.total, sub: "All Time Records", color: "text-slate-800", filter: "ALL STATUS" },
            { label: "DRAFT REPORTS", value: stats.drafts, sub: "Pending Submission", color: "text-slate-800", filter: "DRAFT" },
            { label: "SUBMITTED REPORTS", value: stats.submitted, sub: "Pending Audit", color: "text-blue-600", filter: "SUBMITTED" },
            { label: "APPROVED REPORTS", value: stats.approved, sub: "Verified & Approved", color: "text-emerald-500", filter: "APPROVED" },
          ].map((card, i) => (
            <div 
                key={i} 
                onClick={() => setStatusFilter(card.filter)}
                className={`bg-white p-8 rounded-2xl border transition-all h-full flex flex-col justify-between cursor-pointer group hover:scale-[1.02] active:scale-95 ${statusFilter === card.filter ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{card.label}</p>
              <h3 className={`text-4xl font-black ${card.color} mb-1 tracking-tighter tracking-tighter`}>{card.value}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col font-inter">
          
          {/* Filter Bar */}
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-8 flex-1">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by activity, location or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-full py-4 pl-14 pr-8 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400 font-inter"
                />
              </div>

              <div className="flex items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Filter By Date:</p>
                <div className="relative group">
                  <input
                    type="date"
                    value={dateFilter}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-3 w-[155px] text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none hover:bg-white transition-all shadow-sm font-inter"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter("")}
                      className="absolute -right-2 -top-2 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-95"
                      title="Clear Date"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <p className="text-[10px] font-black uppercase tracking-widest font-inter">Status:</p>
              <div className="relative group">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-6 pr-12 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm font-inter"
                >
                  <option>ALL STATUS</option>
                  <option>DRAFT</option>
                  <option>SUBMITTED</option>
                  <option>APPROVED</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[18%]">Report Details</th>
                  <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[32%]">Work Summary</th>
                  <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[12%]">Status</th>
                  <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[25%] text-left font-inter">Site Media</th>
                  <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[13%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {loading && reports.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Loading Ledger Records...</p>
                     </td>
                   </tr>
                ) : paginatedReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <p className="text-sm font-medium text-slate-400">No reports found matching your criteria.</p>
                    </td>
                  </tr>
                ) : paginatedReports.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50/50 transition-all cursor-default align-top font-inter">
                    <td className="p-8">
                       <p className="text-sm font-black text-slate-800 tracking-tight mb-0.5">{report.formattedDate}</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-inter">Daily Ledger</p>
                    </td>
                    <td className="p-8">
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-700 leading-snug break-words max-w-sm">
                          {report.work_done || "No summary provided"}
                        </p>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <p className="text-[10px] font-bold uppercase tracking-tight truncate max-w-xs">
                            {report.contractor_name ? `${report.contractor_name} · ` : ""}{report.site_location || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ${
                        report.status?.toLowerCase() === 'submitted' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : report.status?.toLowerCase() === 'approved'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-white text-slate-400 border-slate-100 shadow-sm font-inter'
                      }`}>
                        {report.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </td>
                    <td className="p-8">
                        <div className="flex items-center gap-3">
                            {report.gallery && report.gallery.length > 0 ? (
                            report.gallery.slice(0, 4).map((img: any, idx: number) => (
                                <div 
                                    key={img.id || idx} 
                                    onClick={() => setSelectedPhoto(img)}
                                    className="w-14 h-14 rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:scale-105 cursor-zoom-in group/img bg-slate-50 relative shrink-0"
                                >
                                    <img src={img.url} className="w-full h-full object-cover" alt="Site" />
                                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <Maximize2 className="w-3.5 h-3.5 text-white shadow-sm shadow-sm shadow-sm shadow-sm" />
                                    </div>
                                </div>
                            ))
                            ) : (
                                <div className="w-14 h-14 rounded-xl border border-slate-50 bg-slate-50 flex items-center justify-center text-slate-200">
                                    <ImageIcon className="w-5 h-5 font-inter font-inter font-inter font-inter font-inter" />
                                </div>
                            )}
                            {report.gallery?.length > 4 && (
                                <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 font-inter font-inter">
                                    +{report.gallery.length - 4}
                                </div>
                            )}
                        </div>
                    </td>
                    <td className="p-8 text-right pr-12 font-inter font-inter">
                       <div className="flex items-center justify-end">
                          <button 
                            onClick={() => setSelectedReportForView(report)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-all hover:bg-slate-100 rounded-xl active:scale-95"
                            title="View Intelligence Insights"
                          >
                            <Eye className="w-5 h-5 font-inter" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-10 py-8 border-t border-slate-50 bg-white mt-auto flex items-center justify-between font-inter mt-auto">
             <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 font-inter font-inter">Records per page:</span>
                <div className="relative">
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-10 shadow-sm hover:border-slate-300 transition-all font-inter"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none font-inter" />
                </div>
             </div>

             <div className="text-sm font-semibold text-slate-400 tracking-tight font-inter">
                Showing {filteredReports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} records
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm font-inter"
                >
                  <ChevronLeft className="w-5 h-5 font-inter" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all font-inter ${
                      currentPage === page 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <ChevronRight className="w-5 h-5 font-inter font-inter" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* View Intelligence Insights Modal - DSR Intelligence Insight */}
      {selectedReportForView && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1e293b]/70 backdrop-blur-md p-4 animate-in fade-in transition-all"
          onClick={() => setSelectedReportForView(null)}
        >
          <div
            className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-inter"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 shrink-0">
              <h3 className="text-base font-black text-slate-800 tracking-tight">DSR Intelligence Insight</h3>
              <button
                onClick={() => setSelectedReportForView(null)}
                className="text-slate-300 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">

                {/* Blue Hero Card */}
                <div className="bg-blue-600 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-blue-500/50 flex items-center justify-center text-2xl font-black text-white overflow-hidden">
                        {selectedReportForView.gallery?.[0]?.url
                          ? <img src={selectedReportForView.gallery[0].url} className="w-full h-full object-cover" alt="" />
                          : (selectedReportForView.business_id?.[0] || "D").toUpperCase()
                        }
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-400 border-2 border-blue-600" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-lg font-black leading-tight">
                          {selectedReportForView.business_id || `DSR0${selectedReportForView.id}`}
                        </h2>
                        <span className="px-2 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-widest">
                          {selectedReportForView.status?.toUpperCase() || "SUBMITTED"}
                        </span>
                      </div>
                      <div className="flex items-start gap-4 text-blue-200 text-xs font-bold mb-3">
                        <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {selectedReportForView.formattedDate || (selectedReportForView.report_date ? new Date(selectedReportForView.report_date).toLocaleDateString('en-GB') : "N/A")}
                        </span>
                        <span className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{selectedReportForView.site_location || ""}</span>
                        </span>
                      </div>
                      <span className="inline-block px-4 py-1.5 bg-white/20 border border-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        WEATHER: {selectedReportForView.weather?.toUpperCase() || "SUNNY"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Site Documentation - kept as-is */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    SITE DOCUMENTATION ({selectedReportForView.gallery?.length || 0})
                  </h4>
                  <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 group">
                    {selectedReportForView.gallery?.[0] ? (
                      <div className="aspect-[4/2.5] relative">
                        <img src={selectedReportForView.gallery[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Primary Site View" />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => setSelectedPhoto(selectedReportForView.gallery[0])}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-full text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[4/2] flex flex-col items-center justify-center text-slate-300 gap-4">
                        <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                        <p className="text-xs font-black uppercase tracking-widest">No primary imagery available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operational Intelligence */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Intelligence</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Weather Condition</p>
                      <p className="text-sm font-black text-slate-800">{selectedReportForView.weather || "Sunny"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contractor</p>
                      <p className="text-sm font-black text-blue-600">{selectedReportForView.contractor_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created By</p>
                      <p className="text-sm font-black text-slate-800">{selectedReportForView.created_by_name || selectedReportForView.created_by || selectedReportForView.engineer_name || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Personnel</p>
                    <p className="text-2xl font-black text-slate-800">{selectedReportForView.total_labour || 0}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {selectedReportForView.skilled_labour || 0} Skilled • {selectedReportForView.unskilled_labour || 0} Unskilled
                    </p>
                  </div>
                </div>

                {/* Work Narrative */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Narrative</p>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Work Completed Today</p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-slate-700 font-medium">
                        {selectedReportForView.work_done || "No work activity recorded."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Work Planned</p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-slate-700 font-medium">
                        {selectedReportForView.work_planned || "No future plan documented."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resource Logistics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Logistics</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Material Received</p>
                      <p className="text-sm font-black text-slate-800">{selectedReportForView.material_received || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Material Used</p>
                      <p className="text-sm font-black text-slate-800">{selectedReportForView.material_used || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Machinery Used</p>
                      <p className="text-sm font-black text-slate-800">{selectedReportForView.machinery_used || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Constraints & Observations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Constraints & Observations</p>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Issues</p>
                    <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-rose-500 font-medium">
                        {selectedReportForView.issues || selectedReportForView.constraints || "no issue found"}
                      </p>
                    </div>
                  </div>

                  {selectedReportForView.safety_observations && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Safety Observations</p>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <p className="text-sm text-amber-600 font-medium">{selectedReportForView.safety_observations}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks</p>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-blue-600 font-medium">
                        {selectedReportForView.remarks || "NO remark found"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => setSelectedReportForView(null)}
                  className="w-full py-4 bg-blue-600 text-white text-sm font-black tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                >
                  Dismiss Report
                </button>

              </div>
            </div>
          </div>
        </div>
      )}


      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 transition-all duration-300 animate-in fade-in font-inter"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Floating Controls at Top Right of Viewport */}
          <div className="absolute top-6 right-6 flex gap-4 font-inter z-[110]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={handleDeletePhoto}
              className="w-12 h-12 bg-white/10 hover:bg-rose-600 rounded-full flex items-center justify-center text-white transition-all shadow-xl hover:scale-105 active:scale-95"
              title="Delete Photo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-xl hover:scale-105 active:scale-95"
              title="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-6xl flex flex-col items-center gap-4 font-inter" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedPhoto.url} 
              alt="Site Record" 
              className="max-h-[80vh] w-full object-contain rounded-2xl shadow-2xl border-2 border-white/10 select-none animate-in zoom-in-95 duration-500" 
            />
            <div className="bg-white/10 backdrop-blur-md px-10 py-4 rounded-full border border-white/10 font-inter">
              <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Official Field Documentation</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientDSRSummaryPage;
