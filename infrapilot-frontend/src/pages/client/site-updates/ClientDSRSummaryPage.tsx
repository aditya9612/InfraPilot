import { useEffect, useState } from "react";
import Navbar from "../../../components/common/Navbar";
import { dsrService } from "../../../services/dsrService";

const fallbackDsrReports = [
  { 
    id: "DSR-2026-089",
    backendId: null,
    date: "01 Apr 2026", 
    workDone: "Casting of Floor 4 slab completed with M25 concrete. Vibrators were used continuously during the pour.", 
    workPlanned: "Removal of formwork from Floor 3 and preparation of Level 4 columns.",
    labourCount: 28, 
    materialUsed: "Cement: 120 bags, Steel: 2.1 Tons, Concrete: 45 Cum",
    remarks: "Slab finish achieved as per specifications. No safety incidents reported.",
    photos: ["https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=200&h=150&fit=crop", "https://images.unsplash.com/photo-1503387762-592dea58ef21?w=200&h=150&fit=crop"]
  },
  { 
    id: "DSR-2026-088",
    backendId: null,
    date: "31 Mar 2026", 
    workDone: "Placement of slab reinforcement for Floor 4. Inspection of electrical conduits by consultant.", 
    workPlanned: "Casting of Floor 4 slab.",
    labourCount: 24, 
    materialUsed: "Steel: 4.5 Tons, PVC Conduits: 180m, Binding Wire: 40kg",
    remarks: "Reinforcement checked and approved by PM. Concrete pump mobilization confirmed.",
    photos: ["https://images.unsplash.com/photo-1590486803833-ffc45744a3ae?w=200&h=150&fit=crop"]
  },
  { 
    id: "DSR-2026-087",
    backendId: null,
    date: "30 Mar 2026", 
    workDone: "Shuttering and formwork for Floor 4 slab. Brickwork on Level 1 (Apartments A & B).", 
    workPlanned: "Reinforcement steel tying for Floor 4.",
    labourCount: 22, 
    materialUsed: "Plywood: 15 sheets, Bricks: 2500, Cement: 12 bags",
    remarks: "Wait for plumbing layout approval for Level 4 bathroom shafts.",
    photos: []
  },
];

const ClientDSRSummaryPage = () => {
  const [reports, setReports] = useState<any[]>(fallbackDsrReports);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response: any = await dsrService.getDsrByProject(96);
        
        // Defensively parse different possible response structures
        let itemsToProcess: any[] = [];
        if (Array.isArray(response)) {
          itemsToProcess = response;
        } else if (response?.items && Array.isArray(response.items)) {
          itemsToProcess = response.items;
        } else if (response?.data && Array.isArray(response.data)) {
          itemsToProcess = response.data;
        } else if (response && response.project_id) {
          itemsToProcess = [response];
        }

        if (itemsToProcess.length > 0) {
          const formattedReports = itemsToProcess.map((item: any) => ({
            id: item.business_id || `DSR-${item.id}`,
            backendId: item.id,
            date: item.report_date ? new Date(item.report_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
            workDone: item.work_done,
            workPlanned: item.work_planned,
            labourCount: item.total_labour || 0,
            materialUsed: item.material_used || "None specified",
            remarks: item.remarks || "No remarks available",
            photos: item.photos && Array.isArray(item.photos) ? item.photos.map((p: any) => 
               p.file_url ? (p.file_url.startsWith('http') ? p.file_url : `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/${p.file_url.startsWith('/') ? p.file_url.slice(1) : p.file_url}`) : ""
            ).filter(Boolean) : []
          }));
          setReports(formattedReports);
        }
      } catch (error) {
        console.error("Failed to fetch DSRs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleDownloadPDF = async (report: any) => {
    if (report.backendId) {
      try {
        // Hit the backend API strictly for PDF download
        await dsrService.exportDsrPdf(report.backendId);
      } catch (error) {
        console.error("API PDF download failed", error);
        alert("Failed to download PDF from server. Please try again later.");
      }
    } else {
      alert("No backend ID available to download PDF for this report.");
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Summary"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Site Report Summary</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Detailed daily work progress, resource logs, and field reports</p>
        </div>

        <div className="space-y-8">
          {loading ? (
             <div className="flex justify-center p-12">
               <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12h4z"></path>
               </svg>
             </div>
          ) : reports.map((report, i) => (
            <div key={i} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group relative overflow-hidden">
              {/* Header / Date */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10 pb-8 border-b border-slate-50">
                <div className="flex items-start gap-6">
                   <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{report.date.split(' ')[2] || 'YEAR'}</span>
                      <span className="text-2xl font-black tracking-tighter leading-none my-1">{report.date.split(' ')[0] || 'DD'}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{report.date.split(' ')[1] || 'MON'}</span>
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Field Summary: {report.id}</h2>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Report</span>
                         </div>
                         <button
                            onClick={() => handleDownloadPDF(report)}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer shadow-sm active:scale-95 transition-transform"
                            title="Download Report PDF"
                         >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">Download PDF</span>
                         </button>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Labour Force</p>
                      <p className="text-lg font-black text-slate-800">{report.labourCount}</p>
                   </div>
                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Photos</p>
                      <p className="text-lg font-black text-slate-800">{report.photos.length}</p>
                   </div>
                </div>
              </div>

              {/* Core Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                 <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="w-4 h-0.5 bg-primary rounded-full" />
                         Work Done Today
                      </h3>
                      <p className="text-sm text-slate-700 font-bold leading-relaxed">{report.workDone}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="w-4 h-0.5 bg-slate-300 rounded-full" />
                         Work Planned (Tomorrow)
                      </h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{report.workPlanned}</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Material Consumption</h3>
                      <p className="text-xs text-slate-600 font-black tracking-tight leading-6">{report.materialUsed}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Engineer's Remarks</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed border-l-2 border-amber-200 pl-4 py-1">{report.remarks}</p>
                    </div>
                 </div>
              </div>

              {/* Photos Preview */}
              {report.photos.length > 0 && (
                <div className="pt-8 border-t border-slate-50">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Field Snapshots</h3>
                   <div className="flex gap-4">
                      {report.photos.map((url: string, index: number) => (
                        <div key={index} className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:scale-105 transition-transform cursor-zoom-in">
                           <img src={url} alt="Site update" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-[9px] font-black uppercase text-center px-2">
                         View All Photos
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ClientDSRSummaryPage;
