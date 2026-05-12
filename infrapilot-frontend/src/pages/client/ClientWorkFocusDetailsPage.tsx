import Navbar from "../../components/common/Navbar";
import { Link } from "react-router-dom";
import { ClipboardList, HardHat, Package, CheckCircle2 } from "lucide-react";

const ClientWorkFocusDetailsPage = () => {
  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard", "Work Focus Details"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE EXECUTION FOCUS
            </p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">Structural Phase III Detail</h2>
            <p className="text-slate-500 mt-2 font-medium">Real-time breakdown of today's critical path activities.</p>
          </div>
          <Link to="/client" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Focus Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Activity</h3>
                    <p className="text-xl font-bold text-slate-800">Slab & MEP Integration</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Today's Work Focus</h4>
                    <p className="text-2xl font-bold text-slate-800 leading-tight tracking-tight">
                      Finalizing rebar arrangement for the primary roof slab and ensuring plumbing sleeves are accurately placed.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm font-bold text-slate-800 uppercase">In Progress (84%)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <HardHat size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personnel</p>
                        <p className="text-sm font-bold text-slate-800 uppercase">18 Skilled Workers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Evidence Section */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] mb-8 pb-4 border-b border-slate-50">Technical Snapshots</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 relative group">
                  <img src="/photos/slab_reinforcement.png" alt="Rebar Detail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest">Rebar Alignment Check</div>
                </div>
                <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 relative group">
                  <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80" alt="MEP Layout" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest">Sleeve Placement Audit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Details */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-6 italic">Material Log</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Reinforcement Steel</p>
                      <p className="text-sm font-bold">4.2 Tons Deployed</p>
                    </div>
                    <Package size={16} className="text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">PVC Sleeves (MEP)</p>
                      <p className="text-sm font-bold">84 Units Installed</p>
                    </div>
                    <Package size={16} className="text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Engineer's Note</h3>
               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs shadow-inner">AS</div>
                 <div>
                   <p className="text-xs font-bold text-slate-800 mb-1 leading-snug">Amit Sharma</p>
                   <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                     "Reinforcement spacing is verified as per GFC drawings. MEP sleeves are secured with wire tying to prevent displacement during casting."
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientWorkFocusDetailsPage;
