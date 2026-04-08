import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

const docs = [
  { name: "Master Service Agreement - Phase 3", type: "Agreement", uploadDate: "02 Apr 2026", version: "v2.1", size: "2.4 MB" },
  { name: "Architectural Drawing - Floor 4 Layout", type: "Drawing", uploadDate: "28 Mar 2026", version: "v1.4", size: "12.8 MB" },
  { name: "Structural Reinforcement - Slab S3", type: "Drawing", uploadDate: "20 Mar 2026", version: "v1.2", size: "8.5 MB" },
  { name: "Procurement Invoice - Steel & Cement", type: "Invoice", uploadDate: "15 Mar 2026", version: "v1.0", size: "1.1 MB" },
  { name: "Electrical & Plumbing Layout - L3", type: "Drawing", uploadDate: "10 Mar 2026", version: "v1.1", size: "6.2 MB" },
  { name: "Legal Clearance Receipt", type: "Agreement", uploadDate: "05 Mar 2026", version: "v1.0", size: "0.8 MB" },
];

const ClientDocumentsPage = () => (
  <DashboardLayout>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Documents & Drawings"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Document Vault</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Secure access to all project agreements, drawings, and financial records</p>
      </div>

      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Repository Ledger</h2>
            <div className="flex gap-2">
               {["All", "Agreement", "Drawing", "Invoice"].map((t, i) => (
                 <button key={i} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>{t}</button>
               ))}
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
               <tr className="bg-slate-50/50 border-b border-slate-100">
                 <th className="p-6 pl-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Name</th>
                 <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                 <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Version</th>
                 <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Upload Date</th>
                 <th className="p-6 pr-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {docs.map((doc, i) => (
                 <tr key={i} className="group hover:bg-slate-50 transition-colors">
                   <td className="p-6 pl-10">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary text-lg shadow-inner">
                            {doc.type === "Drawing" ? "📐" : doc.type === "Agreement" ? "📜" : "🧾"}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800 leading-tight">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{doc.size}</p>
                         </div>
                      </div>
                   </td>
                   <td className="p-6 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                        doc.type === 'Agreement' ? 'bg-emerald-50 text-emerald-600' : 
                        doc.type === 'Drawing' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                         {doc.type}
                      </span>
                   </td>
                   <td className="p-6 text-center whitespace-nowrap">
                      <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{doc.version}</span>
                   </td>
                   <td className="p-6 text-center whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-500">{doc.uploadDate}</p>
                   </td>
                   <td className="p-6 pr-10 text-right">
                      <button className="text-primary hover:text-blue-700 text-[10px] font-black uppercase tracking-widest transition-colors">
                         Download
                      </button>
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

export default ClientDocumentsPage;
