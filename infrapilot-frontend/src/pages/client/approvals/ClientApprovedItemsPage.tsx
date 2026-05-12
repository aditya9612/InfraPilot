import Navbar from "../../../components/common/Navbar";

const approvedItems = [
  { id: "APR-017", requestType: "Design", description: "Design Change — Staircase Width Increase from 1.2m to 1.5m.", amountQuantity: "₹3,50,000", requestedBy: "Lead Architect", approvedOn: "15 Feb 2026", remarks: "Requested for better fire safety compliance and aesthetic flow." },
  { id: "APR-016", requestType: "Material", description: "Additional Floor Finishing Upgrade — Premium Vitrified Tiles.", amountQuantity: "₹8,00,000", requestedBy: "Projects Dept", approvedOn: "25 Jan 2026", remarks: "Change from standard tiles as per client preference for the master suite." },
  { id: "APR-015", requestType: "Billing", description: "Subcontractor Change — MEP Works (Mobilization Advance).", amountQuantity: "₹5,00,000", requestedBy: "Finance Team", approvedOn: "07 Jan 2026", remarks: "New subcontractor vetted and approved for high-rise plumbing specialty." },
  { id: "APR-014", requestType: "Design", description: "Schedule Extension — Monsoon Delay Buffer Adjustment.", amountQuantity: "15 Days", requestedBy: "Site Engineer", approvedOn: "20 Aug 2025", remarks: "Approval to recalibrate the Phase 2 timeline due to flooding." },
];

const ClientApprovedItemsPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Approved"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Approved Items Audit</h1>
        <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Historical log of all signed-off project requests and variations</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 px-8 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
             <thead>
               <tr className="border-b border-slate-50">
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Request ID</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detail & Description</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Type</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Value / Qty</th>
                 <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Signed On</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {approvedItems.map((item, i) => (
                 <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                   <td className="py-8">
                      <p className="text-xs font-bold text-slate-800 font-mono tracking-tight">{item.id}</p>
                   </td>
                   <td className="py-8 pr-10 max-w-lg">
                      <p className="text-sm font-bold text-slate-700 mb-1">{item.description}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">Requested by: {item.requestedBy}</p>
                   </td>
                   <td className="py-8 text-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                        item.requestType === 'Billing' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        item.requestType === 'Material' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                         {item.requestType}
                      </span>
                   </td>
                   <td className="py-8 text-center">
                      <p className="text-sm font-bold text-slate-800">{item.amountQuantity}</p>
                   </td>
                   <td className="py-8 whitespace-nowrap text-right pr-6">
                      <div className="flex items-center justify-end gap-2 text-emerald-600">
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                         <div>
                            <p className="text-xs font-bold">{item.approvedOn}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digitally Signed</p>
                         </div>
                      </div>
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

export default ClientApprovedItemsPage;
