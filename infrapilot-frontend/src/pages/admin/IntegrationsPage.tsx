import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState([
    { id: "whatsapp", name: "WhatsApp Business", category: "Communication", description: "Automated site updates and daily reports via WhatsApp.", status: "Connected", icon: "💬", color: "bg-green-500" },
    { id: "tally", name: "TallyPrime", category: "Accounting", description: "Seamless sync of material invoices and labor payments.", status: "Disconnected", icon: "📊", color: "bg-blue-600" },
    { id: "drive", name: "Google Drive", category: "Cloud Storage", description: "Sync project blueprints and site photos to cloud.", status: "Connected", icon: "📁", color: "bg-yellow-500" },
    { id: "s3", name: "AWS S3", category: "Storage", description: "High-performance storage for AutoCAD and 3D files.", status: "Disconnected", icon: "☁️", color: "bg-orange-500" },
    { id: "razorpay", name: "Razorpay", category: "Payments", description: "Direct payment integration for vendors and contractors.", status: "Disconnected", icon: "💳", color: "bg-indigo-600" },
  ]);

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        const newStatus = int.status === "Connected" ? "Disconnected" : "Connected";
        if (newStatus === "Connected") toast.success(`${int.name} connected!`);
        else toast.error(`${int.name} disconnected.`);
        return { ...int, status: newStatus };
      }
      return int;
    }));
  };

  return (
    <>
      <Navbar title="External Integrations" breadcrumb={["Admin", "Configuration", "Integrations"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
             <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Ecosystem & Add-ons</h1>
             <p className="text-slate-500 text-sm font-medium mt-1">Connect your existing tools to InfraPilot for a unified workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((int) => (
              <div key={int.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden group">
                 <div className="p-6 flex items-start gap-4">
                    <div className={`w-12 h-12 ${int.color} text-white rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-${int.color.split('-')[1]}-200 shrink-0 group-hover:scale-110 transition-transform`}>
                       {int.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-slate-800 truncate pr-2">{int.name}</h3>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            int.status === "Connected" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          }`}>
                            {int.status}
                          </span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{int.category}</p>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                         {int.description}
                       </p>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <button className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Documentation</button>
                          <button 
                            onClick={() => toggleConnection(int.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              int.status === "Connected" 
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100" 
                                : "bg-primary/5 text-primary hover:bg-primary/10"
                            }`}
                          >
                            {int.status === "Connected" ? "Disconnect" : "Connect Now"}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            ))}

            {/* Custom Integration Request Card */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 hover:bg-white transition-all">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm mb-4 group-hover:bg-primary/10 group-hover:text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
               </div>
               <h4 className="font-bold text-slate-700 mb-1">Request Custom Integration</h4>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Feature</p>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default IntegrationsPage;
