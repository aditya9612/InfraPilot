import { useEffect, useState } from "react";
import Navbar from "../../../components/common/Navbar";
import { dsrService } from "../../../services/dsrService";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const ClientDSRSummaryPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [labourTrend, setLabourTrend] = useState<any[]>([]);
  const [contractorAnalytics, setContractorAnalytics] = useState<any[]>([]);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');

  const projectId = 96; // Scoped to Project 96 as per current requirements

  useEffect(() => {
    const fetchDsrData = async () => {
      try {
        setLoading(true);
        
        // Parallel fetching for performance
        const [dsrRes, trendRes, contractorRes, mapRes] = await Promise.allSettled([
          dsrService.getDsrByProject(projectId),
          dsrService.getLabourTrend(projectId),
          dsrService.getContractorAnalytics(projectId),
          dsrService.getDsrMapPoints(projectId)
        ]);

        // Process DSR Reports
        if (dsrRes.status === 'fulfilled') {
          const response: any = dsrRes.value;
          let items: any[] = Array.isArray(response) ? response : (response.items || response.data || []);
          
          const formatted = items.map((item: any) => ({
            ...item,
            formattedDate: item.report_date ? new Date(item.report_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
            gallery: item.photos && Array.isArray(item.photos) ? item.photos.map((p: any) => 
               p.file_url ? (p.file_url.startsWith('http') ? p.file_url : `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/${p.file_url.startsWith('/') ? p.file_url.slice(1) : p.file_url}`) : ""
            ).filter(Boolean) : []
          }));
          setReports(formatted);
        }

        // Process Analytics
        if (trendRes.status === 'fulfilled') {
          setLabourTrend(Array.isArray(trendRes.value) ? trendRes.value : []);
        }
        if (contractorRes.status === 'fulfilled') {
          setContractorAnalytics(Array.isArray(contractorRes.value) ? contractorRes.value : []);
        }
        if (mapRes.status === 'fulfilled') {
          setMapPoints(Array.isArray(mapRes.value) ? mapRes.value : []);
        }

      } catch (error) {
        console.error("DSR Suite fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDsrData();
  }, []);



  const COLORS = ['#2563eb', '#0d9488', '#7c3aed', '#f59e0b', '#dc2626'];

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "DSR Suite"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Site Report Suite</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Project {projectId} • Insights, Analytics & Field Logs</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
               onClick={async () => {
                 try {
                   await dsrService.exportDsrExcel(projectId);
                 } catch (err) {
                   alert("Excel export failed. Please ensure the project has submitted reports.");
                 }
               }}
               className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               Export Excel Ledger
            </button>
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Field Logs
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Trends & Stats
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'analytics' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Labour Trend Chart */}
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Labour Resource Trend</h2>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-full uppercase">Last 30 Days</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={labourTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{fontWeight: '900', fontSize: '12px'}}
                      />
                      <Line type="monotone" dataKey="labour" stroke="#2563eb" strokeWidth={4} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Contractor Distribution */}
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Contractor Presence</h2>
                </div>
                <div className="h-[300px] w-full flex items-center">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contractorAnalytics} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="contractor" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="entries" radius={[0, 10, 10, 0]} barSize={20}>
                          {contractorAnalytics.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Map Points Visualization */}
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Verified Site Map Entries</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mapPoints.map((point) => (
                    <div key={point.date} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center group hover:bg-primary transition-colors">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-200 mb-1">{new Date(point.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</p>
                       <p className="text-white font-bold text-xs">{point.lat.toFixed(2)}, {point.lng.toFixed(2)}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing field reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100">
                 <p className="text-slate-400 font-black uppercase tracking-widest">No site reports documented yet.</p>
              </div>
            ) : reports.map((report) => (
              <div key={report.id} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group">
                
                {/* Report Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10 pb-8 border-b border-slate-50">
                  <div className="flex items-start gap-6">
                    <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">DSR</span>
                      <span className="text-2xl font-black tracking-tighter leading-none my-1">{report.report_date?.split('-')[2]}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{report.formattedDate?.split(' ')[1]}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">{report.business_id || `Report #${report.id}`}</h2>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${report.status === 'Draft' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {report.status || 'SUBMITTED'}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="text-[9px] font-black uppercase tracking-widest">{report.site_location || "Verified Site"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { l: 'Total Labor', v: report.total_labour || 0, c: 'text-blue-600' },
                      { l: 'Contractor', v: report.contractor_name || 'Sai Infra', c: 'text-slate-700' },
                      { l: 'Weather', v: report.weather || 'Sunny', c: 'text-amber-500' },
                    ].map((st, idx) => (
                      <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center min-w-[100px]">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{st.l}</p>
                        <p className={`text-sm font-black ${st.c}`}>{st.v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Report Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Left Column: Progress */}
                  <div className="lg:col-span-8 space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary" /> Progress Achievements
                      </h3>
                      <div className="bg-slate-50/30 p-6 rounded-3xl border border-slate-50">
                        <p className="text-sm text-slate-700 font-bold leading-relaxed">{report.work_done}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Planned Next Steps</h4>
                        <p className="text-xs text-slate-500 font-medium italic border-l-2 border-slate-200 pl-4">{report.work_planned}</p>
                      </div>
                      <div>
                        <h4 className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">Site Issues & Hazards</h4>
                        <p className="text-xs text-slate-500 font-medium border-l-2 border-rose-100 pl-4">{report.issues || "No critical issues reported."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Resources & Remarks */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-900/10 text-white">
                       <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">Material Log</h3>
                       <p className="text-[11px] font-bold text-slate-300 leading-relaxed mb-4">Used: {report.material_used || "Standard inventory"}</p>
                       <p className="text-[11px] font-bold text-emerald-400 leading-relaxed italic">Received: {report.material_received || "None"}</p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                       <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Safety & Compliance</h3>
                       <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{report.safety_observations || "All safety protocols followed."}</p>
                    </div>

                    <div className="px-2">
                       <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Management Remarks</h3>
                       <p className="text-[11px] font-black text-slate-700 leading-relaxed">{report.remarks || "No specialized remarks."}</p>
                    </div>
                  </div>
                </div>

                {/* Image Gallery */}
                {report.gallery && report.gallery.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-slate-50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Field Verification Snapshots</h3>
                    <div className="flex flex-wrap gap-4">
                      {report.gallery.map((url: string, idx: number) => (
                        <div key={idx} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-110 cursor-zoom-in">
                          <img src={url} alt="Site update" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ClientDSRSummaryPage;
