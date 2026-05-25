import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { issueService } from "../../services/issueService";

const ClientIssuesPage = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const projectId = 96; // Scoped to Project 96

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issueService.listIssuesByProject(projectId);
      setIssues(response.items || []);
    } catch (error) {
      console.error("Failed to fetch project issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleViewIssue = async (id: number) => {
    try {
      setFetchingDetail(true);
      setIsViewModalOpen(true);
      const data = await issueService.getIssue(id);
      setSelectedIssue(data);
    } catch (error) {
      console.error("Failed to fetch issue detail:", error);
      alert("Could not load issue details.");
      setIsViewModalOpen(false);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleDownloadIssue = (issue: any) => {
    const lines = [
      `ISSUE REPORT — InfraPilot`,
      `================================`,
      `ID         : ${issue.business_id || issue.id}`,
      `Title      : ${issue.title}`,
      `Category   : ${issue.category}`,
      `Priority   : ${issue.priority}`,
      `Status     : ${issue.status}`,
      `Reported   : ${issue.reported_date || 'N/A'}`,
      `Assigned To: ${issue.assigned_to || 'Pending Assignment'}`,
      ``,
      `Description:`,
      issue.description || '—',
      ``,
      `Resolution:`,
      issue.resolution || 'No resolution documented yet.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Issue_${issue.business_id || issue.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.parentNode?.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const stats = {
    open: issues.filter(i => i.status === 'Open').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length
  };

  return (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Issues & Risks"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Issues & Risk Ledger</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time tracking of project hurdles, safety flags, and mitigation strategies</p>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Open Issues", count: stats.open, color: "bg-white text-slate-400 border-slate-100" },
          { label: "In Progress", count: stats.inProgress, color: "bg-white text-slate-400 border-slate-100" },
          { label: "Resolved", count: stats.resolved, color: "bg-white text-slate-400 border-slate-100" },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${stat.color} flex items-center justify-between shadow-sm`}>
             <p className="text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
             <p className="text-3xl font-black text-blue-600">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-4 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
             <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Site Risks...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
             <p className="text-xs font-black uppercase tracking-widest">No site hurdles documented at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Issue Detail</th>
                  <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Priority</th>
                  <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {issues.map((issue) => (
                  <tr key={issue.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-8 pr-10 max-w-lg">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[8px] font-black text-slate-300">#{issue.business_id || issue.id}</span>
                           <p className="text-sm font-black text-slate-800">{issue.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{issue.description}</p>
                        {issue.resolution && (
                          <div className="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                             <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">Resolution Narrative</p>
                             <p className="text-[10px] text-slate-600 font-bold">{issue.resolution}</p>
                          </div>
                        )}
                    </td>
                    <td className="py-8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                          {issue.category}
                        </span>
                    </td>
                    <td className="py-8 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          issue.priority === 'High' ? 'text-red-500' : 
                          issue.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                          {issue.priority}
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
                    <td className="py-8 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* View button */}
                        <button
                          onClick={() => handleViewIssue(issue.id)}
                          title="View Details"
                          className="w-9 h-9 rounded-xl text-slate-400 hover:text-primary transition-colors flex items-center justify-center active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* Download button */}
                        <button
                          onClick={() => handleDownloadIssue(issue)}
                          title="Download Report"
                          className="w-9 h-9 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* View Detail Modal */}
    <Modal
      isOpen={isViewModalOpen}
      onClose={() => {
        setIsViewModalOpen(false);
        setSelectedIssue(null);
      }}
      title={fetchingDetail ? "Auditing Issue..." : `Documentation: ${selectedIssue?.business_id || "Detail"}`}
      maxWidth="max-w-2xl"
    >
       {fetchingDetail ? (
         <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pulling Archive Records...</p>
         </div>
       ) : selectedIssue && (
         <div className="space-y-8">
            <div className="flex items-start justify-between gap-6">
               <div className="flex-1">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 block">{selectedIssue.category} • {selectedIssue.priority} Impact</span>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{selectedIssue.title}</h2>
               </div>
               <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                 selectedIssue.status === 'Open' ? 'bg-red-50 text-red-600 border border-red-100' :
                 selectedIssue.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                 'bg-emerald-50 text-emerald-600 border border-emerald-100'
               }`}>
                 {selectedIssue.status}
               </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reported On</p>
                  <p className="text-sm font-bold text-blue-600">{selectedIssue.reported_date}</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned To</p>
                  <p className="text-sm font-bold text-blue-600">{selectedIssue.assigned_to || "Pending Assignment"}</p>
               </div>
            </div>

            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <span className="w-4 h-0.5 bg-slate-200 rounded-full" />
                 Detailed Observation
               </p>
               <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-[32px] border border-slate-100 italic">
                 "{selectedIssue.description}"
               </p>
            </div>

            {selectedIssue.resolution && (
              <div className="p-8 bg-emerald-900 text-white rounded-[40px] shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Official Resolution Strategy
                 </p>
                 <p className="text-base font-bold text-emerald-50 leading-relaxed">
                   {selectedIssue.resolution}
                 </p>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => setIsViewModalOpen(false)}
                 className="px-8 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
               >
                 Close Archive
               </button>
            </div>
         </div>
       )}
    </Modal>
  </>
);
};

export default ClientIssuesPage;
