import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import CreateDSRModal from "../../../components/forms/CreateDSRModal";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileText, Printer, Plus, Loader2 } from "lucide-react";
import { dsrService } from "../../../services/dsrService";

const INITIAL_DSR_DATA = [
  { 
    id: "DSR-2026-089", 
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
    date: "31 Mar 2026", 
    workDone: "Placement of slab reinforcement for Floor 4. Inspection of electrical conduits by consultant.", 
    workPlanned: "Casting of Floor 4 slab.",
    labourCount: 24, 
    materialUsed: "Steel: 4.5 Tons, PVC Conduits: 180m, Binding Wire: 40kg",
    remarks: "Reinforcement checked and approved by PM. Concrete pump mobilization confirmed.",
    photos: ["https://images.unsplash.com/photo-1590486803833-ffc45744a3ae?w=200&h=150&fit=crop"]
  },
];

const INITIAL_DSR_REPORTS = [
  { 
    id: "DSR-2026-089", 
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
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDsr = async () => {
    setLoading(true);
    try {
      const response = await dsrService.getProjectDsr(1);
      // Map API items to the UI structure if needed, or update UI to use API fields
      const mappedReports = response.items.map(item => ({
        id: item.business_id,
        date: new Date(item.report_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        workDone: item.work_done,
        workPlanned: item.work_planned,
        labourCount: item.total_labour,
        materialUsed: item.material_used,
        remarks: item.remarks,
        photos: item.photos.map(p => {
           // Handle relative URLs if necessary
           return p.file_url.startsWith('http') ? p.file_url : `/${p.file_url}`;
        })
      }));
      setReports(mappedReports);
      if (reports.length > 0) {
        toast.success("DSR Records Synced!");
      }
    } catch (err) {
      toast.error("Failed to load site reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDsr();
  }, []);

  const downloadDSR = (report: any) => {
    try {
      toast.loading("Generating PDF...", { id: "dsr-pdf" });
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("DAILY SITE REPORT", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Report ID: ${report.id}`, 14, 30);
      doc.text(`Date: ${report.date}`, 160, 30);
      
      // Project Info Section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.text("Field Progress Summary", 14, 55);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 58, 196, 58);
      
      // Content Table
      autoTable(doc, {
        startY: 65,
        theme: 'grid',
        head: [['Metric', 'Details']],
        body: [
          ['Labour Strength', `${report.labourCount} Personnel`],
          ['Work Done Today', report.workDone],
          ['Work Planned (Tomorrow)', report.workPlanned || 'N/A'],
          ['Material Consumption', report.materialUsed],
          ['Remarks / Observations', report.remarks || 'None reported'],
        ],
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
          1: { cellWidth: 'auto' }
        },
        styles: { fontSize: 10, cellPadding: 5 }
      });
      
      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Generated via InfraPilot Transparency Portal", 14, finalY);
      doc.text("Confidential Construction Document", 160, finalY);
      
      doc.save(`${report.id}_Report.pdf`);
      toast.success("Report downloaded!", { id: "dsr-pdf" });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to generate PDF", { id: "dsr-pdf" });
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Summary"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Site Report Summary</h1>
            <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Detailed daily work progress, resource logs, and field reports</p>
          </div>
          <button 
            onClick={fetchDsr}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} className={loading ? "animate-spin" : ""} />
            {loading ? "Syncing..." : "Fetch Daily Reports"}
          </button>
        </div>

        <div className="space-y-8">
          {loading && reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">Fetching daily reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest">No site reports found</p>
            </div>
          ) : (
            reports.map((report, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 group relative overflow-hidden">
              {/* Header / Date */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10 pb-8 border-b border-slate-50">
                <div className="flex items-start gap-6">
                   <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{report.date.split(' ')[2]}</span>
                      <span className="text-2xl font-bold tracking-tighter leading-none my-1">{report.date.split(' ')[0]}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{report.date.split(' ')[1]}</span>
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Field Summary: {report.id}</h2>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Active Report</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => downloadDSR(report)}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                              title="Download PDF"
                            >
                               <Download size={16} />
                            </button>
                            <button 
                              onClick={() => window.print()}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="Print Report"
                            >
                               <Printer size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labour Force</p>
                      <p className="text-lg font-bold text-slate-800">{report.labourCount}</p>
                   </div>
                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Photos</p>
                      <p className="text-lg font-bold text-slate-800">{report.photos?.length || 0}</p>
                   </div>
                </div>
              </div>

              {/* Core Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                 <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="w-4 h-0.5 bg-primary rounded-full" />
                         Work Done Today
                      </h3>
                      <p className="text-sm text-slate-700 font-bold leading-relaxed">{report.workDone}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="w-4 h-0.5 bg-slate-300 rounded-full" />
                         Work Planned (Tomorrow)
                      </h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{report.workPlanned}</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={12} />
                        Material Consumption
                      </h3>
                      <p className="text-xs text-slate-600 font-bold tracking-tight leading-6">{report.materialUsed}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3">Engineer's Remarks</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed border-l-2 border-amber-200 pl-4 py-1">{report.remarks || "No additional remarks."}</p>
                    </div>
                 </div>
              </div>

              {/* Photos Preview */}
              {report.photos && report.photos.length > 0 && (
                <div className="pt-8 border-t border-slate-50">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Field Snapshots</h3>
                   <div className="flex gap-4">
                      {report.photos.map((url: string, index: number) => (
                        <div key={index} className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:scale-105 transition-transform cursor-zoom-in">
                           <img src={url} alt="Site update" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-[9px] font-bold uppercase text-center px-2">
                         View All Photos
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </div>
    </>
  );
};

export default ClientDSRSummaryPage;
