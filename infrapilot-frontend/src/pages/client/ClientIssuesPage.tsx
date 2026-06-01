import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { issueService } from "../../services/issueService";
import { useClientProjectId } from "../../hooks/useClientProjectId";

const ClientIssuesPage = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    category: "Delay",
    priority: "Medium",
    reported_date: new Date().toISOString().split('T')[0]
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { projectId } = useClientProjectId();

  const fetchIssues = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await issueService.listIssuesByProject(projectId);
      const allIssues = response.items || [];
      
      // Filter issues to only show those raised by the client
      // We check for specific categories or reporter flags that correspond to client-facing issues
      const clientIssues = allIssues.filter((i: any) => 
        i.reporter_role === "Client" || 
        i.category === "Client Feedback" || 
        i.source === "Client" ||
        // Fallback: If no explicit role, we show issues that don't have engineering-specific categories
        !["Safety Flag", "Labor Constraint", "Material Shortage"].includes(i.category)
      );
      
      setIssues(clientIssues);
    } catch (error) {
      console.error("Failed to fetch project issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId]);

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

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      setIsSubmitting(true);
      await issueService.createIssue({ ...newIssue, project_id: projectId });
      setIsCreateModalOpen(false);
      setNewIssue({
        title: "",
        description: "",
        category: "Delay",
        priority: "Medium",
        reported_date: new Date().toISOString().split('T')[0]
      });
      fetchIssues();
    } catch (error) {
      console.error("Failed to create issue:", error);
      alert("Failed to lodge issue.");
    } finally {
      setIsSubmitting(false);
    }
  };





  const stats = {
    open: issues.filter(i => i.status === 'Open').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length
  };

  // Pagination Logic
  const totalRecords = issues.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
  const currentItems = issues.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Issues & Risks"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Client Issue Ledger</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Tracking and resolution of issues reported by you regarding project quality or progress</p>
            </div>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Log New Issue
            </button>
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
                  {currentItems.map((issue) => (
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
                        <span className={`text-[10px] font-black uppercase tracking-widest ${issue.priority === 'Critical' ? 'text-red-500' :
                            issue.priority === 'High' ? 'text-red-500' : // Fallback for existing "High" data
                            issue.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="py-8 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${issue.status === 'Open' ? 'bg-red-50 text-red-600' :
                            issue.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="py-8 text-center">
                        <div className="flex items-center justify-center gap-3">
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination UI */}
              <div className="py-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Records per page:</p>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {[5, 10, 20, 50, 100].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] font-bold text-slate-400 tracking-wider">
                  Showing <span className="text-slate-800">{totalRecords > 0 ? startIndex + 1 : 0} - {endIndex}</span> of <span className="text-slate-800">{totalRecords}</span> records
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1.5">
                    {getPageNumbers().map((p, i) => (
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-slate-300 font-black">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(Number(p))}
                          className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                            currentPage === p 
                             ? "bg-primary text-white shadow-lg shadow-blue-500/20 scale-110" 
                             : "text-slate-400 border border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
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
              <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${selectedIssue.status === 'Open' ? 'bg-red-50 text-red-600 border border-red-100' :
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
              <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                "{selectedIssue.description}"
              </p>
            </div>

            {selectedIssue.resolution && (
              <div className="p-8 bg-emerald-900 text-white rounded-2xl shadow-xl shadow-emerald-900/20 relative overflow-hidden">
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

      {/* Create Issue Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lodge New Issue"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateIssue} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Title</label>
              <input 
                required
                type="text" 
                value={newIssue.title}
                onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Briefly describe the concern"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
              <select 
                value={newIssue.category}
                onChange={(e) => setNewIssue({...newIssue, category: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Material">Material</option>
                <option value="Safety">Safety</option>
                <option value="Delay">Delay</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
              <select 
                value={newIssue.priority}
                onChange={(e) => setNewIssue({...newIssue, priority: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Observations</label>
              <textarea 
                required
                rows={5}
                value={newIssue.description}
                onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Provide as much detail as possible to help us address the issue quickly..."
              />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
             <button 
               type="button"
               onClick={() => setIsCreateModalOpen(false)}
               className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
             >
               Cancel
             </button>
             <button 
               type="submit"
               disabled={isSubmitting}
               className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
             >
               {isSubmitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
               {isSubmitting ? "LODGING..." : "LODGE ISSUE"}
             </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ClientIssuesPage;
