import Navbar from "../../../components/common/Navbar";

const workSummary = [
  { activity: "Foundation & Piling", plan: "100%", actual: "100%", status: "Completed", efficiency: "High" },
  { activity: "Basement R.C.C", plan: "100%", actual: "100%", status: "Completed", efficiency: "Medium" },
  { activity: "Ground Floor Structure", plan: "100%", actual: "100%", status: "Completed", efficiency: "High" },
  { activity: "Floor 1-3 Structural Slab", plan: "100%", actual: "100%", status: "Completed", efficiency: "High" },
  { activity: "Floor 4 Structural Slab", plan: "100%", actual: "92%", status: "In Progress", efficiency: "Medium" },
  { activity: "Internal Masonry (L1-L2)", plan: "85%", actual: "72%", status: "In Progress", efficiency: "Low" },
  { activity: "Plumbing & Electrification", plan: "40%", actual: "35%", status: "In Progress", efficiency: "Medium" },
];

const ClientWorkSummaryPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Work Summary"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Work Summary & Efficiency</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time plan vs actual activity completion tracking</p>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 px-8 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
               <tr className="border-b border-slate-50">
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Main Work Category</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Plan %</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Actual %</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Efficiency</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {workSummary.map((work, i) => (
                 <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                   <td className="py-6">
                      <p className="text-xs font-bold text-slate-800 tracking-tight">{work.activity}</p>
                   </td>
                   <td className="py-6 text-center">
                      <p className="text-xs font-bold text-slate-400">{work.plan}</p>
                   </td>
                   <td className="py-6 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-xs font-bold text-slate-800 tracking-tighter">{work.actual}</p>
                        <div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                           <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: work.actual }} />
                        </div>
                      </div>
                   </td>
                   <td className="py-6 text-center">
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                        work.efficiency === "High" ? "bg-emerald-50 text-emerald-600" : 
                        work.efficiency === "Medium" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                      }`}>
                         {work.efficiency}
                      </span>
                   </td>
                   <td className="py-6 text-right pr-4">
                      <span className={`text-[10px] font-bold ${work.status === "Completed" ? "text-emerald-500" : "text-primary"}`}>{work.status}</span>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

export default ClientWorkSummaryPage;
