import Navbar from "../../../components/common/Navbar";

const dsrReports = [
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

const ClientDSRSummaryPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Summary"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Site Report Summary</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Detailed daily work progress, resource logs, and field reports</p>
      </div>

      <div className="space-y-8">
        {dsrReports.map((report, i) => (
          <div key={i} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group relative overflow-hidden">
            {/* Header / Date */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10 pb-8 border-b border-slate-50">
              <div className="flex items-start gap-6">
                 <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center min-w-[80px]">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{report.date.split(' ')[2]}</span>
                    <span className="text-2xl font-black tracking-tighter leading-none my-1">{report.date.split(' ')[0]}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{report.date.split(' ')[1]}</span>
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Field Summary: {report.id}</h2>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full border border-blue-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Active Report</span>
                       </div>
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
                    {report.photos.map((url, index) => (
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

export default ClientDSRSummaryPage;
