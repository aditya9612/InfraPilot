import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

const issues = [
  { 
    id: "ISS-042", 
    title: "Phase 2 Budget Overrun — Steel Price Surge", 
    type: "Material", 
    description: "Unexpected 15% increase in structural steel prices affecting the procurement for Phase 2 slab casting.", 
    reportedDate: "02 Apr 2026", 
    status: "Open", 
    impactLevel: "High", 
    resolution: "Negotiating bulk purchase discount with secondary vendors to offset costs."
  },
  { 
    id: "ISS-038", 
    title: "Slab Curing Delay due to Unusual Rains", 
    type: "Delay", 
    description: "Unseasonal heavy rainfall has extended the mandatory curing period for the Level 3 main slab by 3 days.", 
    reportedDate: "28 Mar 2026", 
    status: "In Progress", 
    impactLevel: "Medium", 
    resolution: "Accelerating internal masonry work to compensate for lost outdoor structural time."
  },
  { 
    id: "ISS-035", 
    title: "Safety Harness Compliance Audit", 
    type: "Safety", 
    description: "Quarterly audit identified 2 worn harnesses that required immediate replacement to maintain site safety standards.", 
    reportedDate: "15 Mar 2026", 
    status: "Resolved", 
    impactLevel: "Medium", 
    resolution: "Purchased 5 new certified harnesses; safety briefing conducted for all high-altitude workers."
  },
  { 
    id: "ISS-031", 
    title: "Plumbing Material Shortage", 
    type: "Material", 
    description: "Shortage of 4-inch PVC pipes delayed the internal piping work for Apartment Wing B.", 
    reportedDate: "05 Mar 2026", 
    status: "Resolved", 
    impactLevel: "Low", 
    resolution: "Alternative supplier mobilized within 48 hours. Inventory restocked."
  }
];

const ClientIssuesPage = () => (
  <DashboardLayout>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Issues & Risks"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Issues & Risk Ledger</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time tracking of project hurdles, safety flags, and mitigation strategies</p>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Open Issues", count: 1, color: "bg-red-50 text-red-600 border-red-100" },
          { label: "In Progress", count: 1, color: "bg-amber-50 text-amber-600 border-amber-100" },
          { label: "Resolved", count: 2, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-3xl border ${stat.color} flex items-center justify-between shadow-sm`}>
             <p className="text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
             <p className="text-3xl font-black">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100 px-8 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
             <thead>
               <tr className="border-b border-slate-50">
                 <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Issue Detail</th>
                 <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                 <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Impact</th>
                 <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                 <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {issues.map((issue, i) => (
                 <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                   <td className="py-8 pr-10 max-w-lg">
                      <p className="text-sm font-black text-slate-800 mb-1">{issue.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{issue.description}</p>
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-80">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Resolution Strategy</p>
                         <p className="text-[10px] text-slate-600 font-bold">{issue.resolution}</p>
                      </div>
                   </td>
                   <td className="py-8">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">
                         {issue.type}
                      </span>
                   </td>
                   <td className="py-8 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        issue.impactLevel === 'High' ? 'text-red-500' : 
                        issue.impactLevel === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                         {issue.impactLevel}
                      </span>
                   </td>
                   <td className="py-8 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                        issue.status === 'Open' ? 'bg-red-50 text-red-600' : 
                        issue.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                         {issue.status}
                      </span>
                   </td>
                   <td className="py-8 whitespace-nowrap">
                      <p className="text-xs font-black text-slate-400">{issue.reportedDate}</p>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default ClientIssuesPage;
