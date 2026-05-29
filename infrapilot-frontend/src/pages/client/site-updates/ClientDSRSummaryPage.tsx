import { useEffect, useState } from "react";
import Navbar from "../../../components/common/Navbar";
import { dsrService } from "../../../services/dsrService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";


const ClientDSRSummaryPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{id: number, url: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    if (!window.confirm("Are you sure you want to delete this photo from the official site record?")) return;
    
    try {
      await dsrService.deleteDsrPhoto(selectedPhoto.id);
      // Refresh reports to reflect deletion
      setReports(prev => prev.map(report => ({
        ...report,
        gallery: report.gallery.filter((p: any) => p.id !== selectedPhoto.id)
      })));
      setSelectedPhoto(null);
    } catch (err) {
      console.error("Deletion failed:", err);
      alert("Failed to delete photo from repository.");
    }
  };

  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchDsrData = async () => {
      try {
        const response: any = await dsrService.getDsrByProject(projectId);
        let items: any[] = Array.isArray(response) ? response : (response.items || response.data || []);
        
        const formatted = await Promise.all(items.map(async (item: any) => {
          // Helper to resolve static asset URLs correctly
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
            formattedDate: item.report_date ? new Date(item.report_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
            gallery
          };
        }));
        setReports(formatted);
      } catch (error) {
        console.error("DSR Suite fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDsrData();
  }, [projectId]);





  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Suite"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Site Report Suite</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Insights, Analytics & Field Logs</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
               onClick={async () => {
                 try {
                   if (projectId) await dsrService.exportDsrExcel(projectId!);
                 } catch (err) {
                   alert("Excel export failed. Please ensure the project has submitted reports.");
                 }
               }}
               className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               Export Excel Ledger
            </button>

          </div>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing field reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center border border-slate-100">
               <p className="text-slate-400 font-black uppercase tracking-widest">No site reports documented yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-6 pl-8 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Report Details</th>
                      <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4 min-w-[250px]">Achievements</th>
                      <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Next Steps</th>
                      <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Issues & Safety</th>
                      <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Material Log</th>
                      <th className="p-6 pr-8 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Management Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group align-top">
                        <td className="p-6 pl-8">
                          <div className="flex flex-col items-start gap-2">
                            <p className="text-sm font-black text-slate-800 tracking-tight uppercase">{report.business_id || `DSR-${report.id}`}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500">{report.formattedDate}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${report.status === 'Draft' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-600'}`}>
                              {report.status || 'SUBMITTED'}
                            </span>
                            
                            {(report.total_labour || report.weather) && (
                              <div className="mt-2 text-[9px] text-slate-400 font-medium">
                                {report.total_labour && <span className="block"><span className="font-bold uppercase">Labor:</span> {report.total_labour}</span>}
                                {report.weather && <span className="block mt-0.5"><span className="font-bold uppercase">Weather:</span> {report.weather}</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.work_done || "—"}</p>
                          {report.gallery && report.gallery.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {report.gallery.map((photo: any, idx: number) => (
                                <div 
                                  key={photo.id || idx} 
                                  onClick={() => setSelectedPhoto(photo)}
                                  className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-110 hover:shadow-lg origin-bottom-left cursor-zoom-in group/photo relative"
                                >
                                  <img src={photo.url} alt="Snap" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-primary/20 opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <p className="text-xs text-slate-500 italic leading-relaxed">{report.work_planned || "—"}</p>
                        </td>
                        <td className="p-6 space-y-3">
                          <div>
                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Hazards / Issues</p>
                            <p className="text-[11px] text-slate-700 font-medium">{report.issues || "None reported"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance</p>
                            <p className="text-[11px] text-slate-600">{report.safety_observations || "Verified"}</p>
                          </div>
                        </td>
                        <td className="p-6 space-y-2">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Consumed</p>
                            <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{report.material_used || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Received</p>
                            <p className="text-[11px] text-slate-600 italic leading-relaxed">{report.material_received || "—"}</p>
                          </div>
                        </td>
                        <td className="p-6 pr-8">
                          <p className="text-[11px] font-black text-slate-700 leading-relaxed">{report.remarks || "—"}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute -top-12 left-0 flex gap-2">
               <button 
                  onClick={(e) => { e.stopPropagation(); handleDeletePhoto(); }}
                  className="px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center gap-2"
               >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Purge Photo
               </button>
            </div>
            <img 
              src={selectedPhoto.url} 
              alt="Site Update Full View" 
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ClientDSRSummaryPage;
