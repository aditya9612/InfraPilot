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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL STATUS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { projectId } = useClientProjectId();

  const fetchDsrData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response: any = await dsrService.getDsrByProject(projectId);
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
          formattedDate: item.report_date ? new Date(item.report_date).toLocaleDateString('en-CA') : "N/A", // YYYY-MM-DD
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
    if (statusFilter !== "ALL STATUS") {
      result = result.filter(r => r.status?.toUpperCase() === statusFilter);
    }
    setFilteredReports(result);
    setCurrentPage(1);
  }, [reports, searchQuery, statusFilter]);

  const stats = {
    total: reports.length,
    drafts: reports.filter(r => r.status?.toLowerCase() === 'draft' || !r.status).length,
    submitted: reports.filter(r => r.status?.toLowerCase() === 'submitted').length,
    approved: reports.filter(r => r.status?.toLowerCase() === 'approved' || r.status?.toLowerCase() === 'verified').length
  };

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
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Suite"]} />
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
                          <p className="text-[10px] font-bold uppercase tracking-tight truncate max-w-xs">{report.site_address || report.project_location || "pune"}</p>
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

      {/* View Intelligence Intelligence Insights Modal */}
      {selectedReportForView && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1e293b]/70 backdrop-blur-md p-4 animate-in fade-in transition-all"
          onClick={() => setSelectedReportForView(null)}
        >
          <div 
            className="bg-white max-w-2xl w-full rounded-[2.5rem] shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] font-inter"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-10 py-8 flex items-center justify-between border-b border-slate-50 shrink-0 font-inter">
               <h3 className="text-xl font-black text-slate-700 tracking-tight font-inter">DSR Intelligence Insight</h3>
               <button 
                onClick={() => setSelectedReportForView(null)}
                className="text-slate-300 hover:text-slate-600 transition-colors font-inter"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10 font-inter space-y-12 pb-16 custom-scrollbar">
               
               {/* Hero Summary Card */}
               <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 font-inter">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl font-inter" />
                  
                  <div className="flex items-start gap-8 relative z-10 font-inter">
                     <div className="w-24 h-24 rounded-[1.5rem] bg-slate-900 border-4 border-white/20 overflow-hidden shrink-0 relative group font-inter">
                        <img 
                            src={selectedReportForView.gallery?.[0]?.url || ""} 
                            className="w-full h-full object-cover font-inter" 
                            alt="Logo" 
                        />
                        <div className="absolute bottom-2 right-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-slate-900 shadow-sm font-inter" />
                     </div>
                     
                     <div className="flex-1 font-inter">
                        <div className="flex items-center gap-4 mb-4 font-inter">
                            <h2 className="text-3xl font-black tracking-tight font-inter">{selectedReportForView.business_id || `DSR0${selectedReportForView.id}`}</h2>
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 font-inter">
                                {selectedReportForView.status || 'SUBMITTED'}
                            </span>
                        </div>
                        
                        <div className="space-y-3 font-inter">
                           <div className="flex items-center gap-2 text-white/70 font-inter">
                              <Calendar className="w-4 h-4 font-inter" />
                              <p className="text-sm font-bold font-inter">{selectedReportForView.formattedDate}</p>
                           </div>
                           <div className="flex items-start gap-2 text-white/70 font-inter">
                              <MapPin className="w-4 h-4 mt-0.5 shrink-0 font-inter" />
                              <p className="text-xs font-bold leading-relaxed font-inter">{selectedReportForView.site_address || selectedReportForView.project_location || "pune"}</p>
                           </div>
                        </div>

                        <div className="mt-8 font-inter">
                           <span className="px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-lg font-inter">
                              WEATHER: {selectedReportForView.weather?.toUpperCase() || 'SUNNY'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Site Documentation Section */}
               <div className="space-y-6 font-inter">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">SITE DOCUMENTATION ({selectedReportForView.gallery?.length || 0})</h4>
                  <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm bg-slate-50 group font-inter">
                    {selectedReportForView.gallery?.[0] ? (
                        <div className="aspect-[4/2.5] relative font-inter">
                            <img src={selectedReportForView.gallery[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 font-inter" alt="Primary Site View font-inter" />
                            <div className="absolute inset-0 bg-slate-900/10 font-inter" />
                        </div>
                    ) : (
                        <div className="aspect-[4/2] flex flex-col items-center justify-center text-slate-300 gap-4 font-inter">
                           <ImageIcon className="w-12 h-12 stroke-[1.5] font-inter" />
                           <p className="text-xs font-black uppercase tracking-widest font-inter">No primary imagery available</p>
                        </div>
                    )}
                  </div>
               </div>

               {/* Operational Intelligence Section */}
               <div className="space-y-8 font-inter font-inter">
                  <div className="flex items-center gap-3 font-inter">
                     <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm font-inter">
                        <RefreshCw className="w-4 h-4 font-inter" />
                     </div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">OPERATIONAL INTELLIGENCE</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-10 px-2 font-inter">
                     <div className="font-inter">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter font-inter">WEATHER CONDITION</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight font-inter">{selectedReportForView.weather || 'Sunny'}</p>
                     </div>
                     <div className="font-inter font-inter">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">TOTAL PERSONNEL</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight font-inter">{selectedReportForView.total_labour || 0} Units</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight font-inter">{selectedReportForView.skilled_labour || 0} Skilled • {selectedReportForView.unskilled_labour || 0} Unskilled</p>
                     </div>
                     <div className="font-inter font-inter">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">REGISTRY ID</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight font-inter">{selectedReportForView.business_id || `DSR0${selectedReportForView.id}`}</p>
                     </div>
                  </div>
               </div>

               {/* Work Narrative Section */}
               <div className="space-y-8 font-inter">
                  <div className="flex items-center gap-3 font-inter">
                     <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shadow-sm font-inter">
                        <FileText className="w-4 h-4 font-inter" />
                     </div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">WORK NARRATIVE</h4>
                  </div>
                  
                  <div className="px-2 font-inter">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">WORK COMPLETED TODAY</p>
                     <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-6 relative font-inter">
                        <p className="text-sm text-slate-600 font-bold italic leading-relaxed font-inter">
                           "{selectedReportForView.work_done || "No work activity recorded for this shift."}"
                        </p>
                     </div>
                  </div>
               </div>

               {/* Resource Logistics Section */}
               <div className="space-y-8 font-inter">
                  <div className="flex items-center gap-3 font-inter font-inter">
                     <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm font-inter">
                        <Package className="w-4 h-4 font-inter" />
                     </div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter font-inter">RESOURCE LOGISTICS</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-12 px-2 font-inter">
                     <div className="font-inter">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">MATERIAL RECEIVED</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-relaxed font-inter font-inter">{selectedReportForView.material_received || "None reported today"}</p>
                     </div>
                     <div className="font-inter">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">MACHINERY USED</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-relaxed font-inter">{selectedReportForView.machinery_used || "No heavy equipment logged"}</p>
                     </div>
                  </div>
               </div>

               {/* Constraints & Observations Section */}
               <div className="space-y-8 font-inter">
                  <div className="flex items-center gap-3 font-inter">
                     <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm font-inter">
                        <AlertCircle className="w-4 h-4 font-inter font-inter" />
                     </div>
                     <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] font-inter">CONSTRAINTS & OBSERVATIONS</h4>
                  </div>
                  
                  <div className="px-2 font-inter">
                     <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-6 font-inter font-inter">
                        <p className="text-sm text-rose-600 font-bold leading-relaxed font-inter font-inter">
                           {selectedReportForView.issues || selectedReportForView.constraints || "No critical constraints documented."}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Dismiss Button */}
               <div className="pt-10 font-inter">
                  <button 
                    onClick={() => setSelectedReportForView(null)}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl text-sm font-black tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-[0.98] font-inter font-inter"
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-8 transition-all duration-300 animate-in fade-in font-inter"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center gap-6 font-inter font-inter" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-16 right-0 flex gap-4 font-inter">
              <button 
                onClick={handleDeletePhoto}
                className="w-12 h-12 bg-white/10 hover:bg-rose-600 rounded-full flex items-center justify-center text-white transition-all shadow-xl font-inter font-inter font-inter font-inter"
              >
                <Trash2 className="w-5 h-5 font-inter" />
              </button>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-xl font-inter font-inter font-inter font-inter"
              >
                <X className="w-6 h-6 font-inter" />
              </button>
            </div>
            <img 
              src={selectedPhoto.url} 
              alt="Site Record" 
              className="max-h-[80vh] w-auto rounded-[2.5rem] shadow-2xl border-4 border-white/20 select-none animate-in zoom-in-95 duration-500 object-contain font-inter font-inter" 
            />
            <div className="bg-white/10 backdrop-blur-md px-10 py-5 rounded-full border border-white/10 font-inter">
              <p className="text-[11px] font-black text-white uppercase tracking-[0.4em] font-inter font-inter">Official Field Documentation</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientDSRSummaryPage;
