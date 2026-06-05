import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { issueService } from "../../services/issueService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { Search, Plus, Filter, ChevronDown, ChevronLeft, ChevronRight, Clock, CheckCircle2, History, X } from "lucide-react";
import toast from "react-hot-toast";

const ClientIssuesPage = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL STATUS");
  const [priorityFilter, setPriorityFilter] = useState("ALL PRIORITY");

  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    category: "Material",
    priority: "Medium",
    reported_date: new Date().toISOString().split('T')[0]
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { projectId } = useClientProjectId();

  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await issueService.listIssuesByProject(projectId);
      
      // The API returns data directly or in an items array
      const allIssues = Array.isArray(response) ? response : (response.items || []);
      
      // Client View logic: Show issues reported by Client OR general project constraints (Material, Delay, Quality)
      // Hide internal engineering constraints (Labor, Safety Protocols if internal)
      const clientFacingIssues = allIssues.filter((i: any) => 
        i.reporter_role === "Client" || 
        i.source === "Client" ||
        ["Material", "Delay", "Quality", "General"].includes(i.category) ||
        !["Labor Constraint", "Machine Downtime", "Safety Protocol"].includes(i.category)
      );
      
      setIssues(clientFacingIssues.sort((a: any, b: any) => 
        new Date(b.reported_date || b.created_at).getTime() - new Date(a.reported_date || a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Failed to fetch project issues:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    let result = issues;
    
    if (searchQuery) {
      result = result.filter(i => 
        i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.business_id || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "ALL STATUS") {
      const targetStatus = statusFilter === "OPEN" ? "Open" : statusFilter === "PENDING" ? "In Progress" : "Resolved";
      result = result.filter(i => i.status === targetStatus);
    }

    if (priorityFilter !== "ALL PRIORITY") {
      result = result.filter(i => i.priority?.toUpperCase() === priorityFilter);
    }

    setFilteredIssues(result);
    setCurrentPage(1);
  }, [issues, searchQuery, statusFilter, priorityFilter]);

  const handleViewIssue = async (id: number) => {
    try {
      setFetchingDetail(true);
      setIsViewModalOpen(true);
      const data = await issueService.getIssue(id);
      setSelectedIssue(data);
    } catch (error) {
      console.error("Failed to fetch issue detail:", error);
      toast.error("Could not load details.");
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
        category: "Material",
        priority: "Medium",
        reported_date: new Date().toISOString().split('T')[0]
      });
      toast.success("Issue logged in vault.");
      fetchIssues();
    } catch (error) {
      toast.error("Failed to lodge issue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status !== 'Resolved').length,
    highPriority: issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== 'Resolved').length,
    resolved: issues.filter(i => i.status === 'Resolved').length
  };

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Issues & Risks"]} />
      <div className="p-8 bg-[#f8fafc] min-h-screen font-inter pb-20">
          
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
             <h1 className="text-4xl font-black text-slate-800 tracking-tight">Constraint Management Vault</h1>
             <p className="text-slate-400 font-medium mt-2 text-sm tracking-tight font-inter">Official repository for site impediments and reported project risks.</p>
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 font-inter font-inter"
          >
            <Plus className="w-5 h-5 font-inter" />
            Log Issue
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 font-inter">
          {[
            { label: "TOTAL LOGS", value: stats.total, sub: "Archive Records", color: "text-slate-800", filter: "ALL STATUS" },
            { label: "PENDING", value: stats.pending, sub: "Action Required", color: "text-rose-500", filter: "PENDING" },
            { label: "HIGH PRIORITY", value: stats.highPriority, sub: "Critical Impact", color: "text-orange-500", filter: "HIGH" },
            { label: "RESOLVED", value: stats.resolved, sub: "Resolution Rate", color: "text-emerald-500", filter: "RESOLVED" },
          ].map((card, i) => (
            <div 
                key={i} 
                onClick={() => i === 0 ? setStatusFilter("ALL STATUS") : i === 1 ? setStatusFilter("PENDING") : i === 2 ? setPriorityFilter("HIGH") : setStatusFilter("RESOLVED")}
                className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 group font-inter font-inter"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-inter">{card.label}</p>
              <h3 className={`text-4xl font-black ${card.color} mb-1 tracking-tighter`}>{card.value}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight font-inter">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col font-inter">
          
          {/* Filter Bar */}
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-xl font-inter font-inter">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-inter" />
              <input 
                type="text"
                placeholder="Search by title, description or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-full py-4 pl-14 pr-8 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400 font-inter font-inter"
              />
            </div>
            
            <div className="flex items-center gap-6 font-inter">
              <Filter className="w-5 h-5 text-slate-300 mr-2 font-inter font-inter" />
              
              <div className="flex items-center gap-4 font-inter">
                <div className="relative font-inter font-inter">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-6 pr-12 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white shadow-sm transition-all font-inter"
                  >
                    <option>ALL STATUS</option>
                    <option>OPEN</option>
                    <option>PENDING</option>
                    <option>RESOLVED</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none font-inter" />
                </div>

                <div className="relative font-inter font-inter">
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-6 pr-12 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white shadow-sm transition-all font-inter font-inter"
                  >
                    <option>ALL PRIORITY</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none font-inter" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 font-inter">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="p-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[35%] font-inter">Issue Identifier</th>
                  <th className="p-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[20%] font-inter">Status Profile</th>
                  <th className="p-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[20%] font-inter">Priority Level</th>
                  <th className="p-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[25%] text-right pr-14 font-inter">Timeline Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {loading && issues.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="p-20 text-center font-inter">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 font-inter" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter font-inter">Synchronizing Vault Records...</p>
                     </td>
                   </tr>
                ) : paginatedIssues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center font-inter">
                      <p className="text-sm font-medium text-slate-400 font-inter">No site constraints detected.</p>
                    </td>
                  </tr>
                ) : paginatedIssues.map((issue) => (
                  <tr 
                    key={issue.id} 
                    onClick={() => handleViewIssue(issue.id)}
                    className="group hover:bg-slate-50/50 transition-all cursor-pointer align-top font-inter"
                  >
                    <td className="p-10">
                       <p className="text-sm font-black text-slate-800 tracking-tight mb-1 font-inter">{issue.title}</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-inter">{issue.business_id || `ISS-${issue.id}`} • {issue.category}</p>
                    </td>
                    <td className="p-10">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border font-inter ${
                        issue.status?.toLowerCase() === 'open' 
                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                        : issue.status?.toLowerCase() === 'in progress' || issue.status?.toLowerCase() === 'pending'
                        ? 'bg-orange-50 text-orange-600 border-orange-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {issue.status?.toUpperCase() || 'OPEN'}
                      </span>
                    </td>
                    <td className="p-10">
                       <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border font-inter ${
                        issue.priority?.toLowerCase() === 'critical' 
                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20' 
                        : issue.priority?.toLowerCase() === 'high'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : issue.priority?.toLowerCase() === 'medium'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100 font-inter'
                      }`}>
                        {issue.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="p-10 text-right pr-14 font-inter">
                        <p className="text-sm font-black text-slate-700 tracking-tight mb-0.5 font-inter">{issue.reported_date || new Date(issue.created_at).toLocaleDateString()}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-inter font-inter">REPORTED</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-10 py-8 border-t border-slate-50 bg-white mt-auto flex items-center justify-between font-inter">
             <div className="flex items-center gap-3 font-inter">
                <span className="text-sm font-medium text-slate-500 tracking-tight font-inter">Records per page:</span>
                <div className="relative font-inter">
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-10 shadow-sm hover:border-slate-300 transition-all font-inter"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none font-inter" />
                </div>
             </div>

             <div className="text-sm font-semibold text-slate-400 tracking-tight font-inter">
                Showing {filteredIssues.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredIssues.length)} of {filteredIssues.length} records
             </div>

             <div className="flex items-center gap-2 font-inter">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 font-inter"
                >
                  <ChevronLeft className="w-5 h-5 font-inter" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all font-inter ${
                      currentPage === page 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm font-inter"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 font-inter"
                >
                  <ChevronRight className="w-5 h-5 font-inter" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* View Detail Modal - High Fidelity */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedIssue(null);
        }}
        title=""
        maxWidth="max-w-2xl"
      >
        <div className="-mt-12 font-inter">
            <div className="flex items-center justify-between mb-8 font-inter">
               <h3 className="text-xl font-black text-slate-700 tracking-tight font-inter">Constraint Intelligence Overview</h3>
            </div>

            {fetchingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 font-inter">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin font-inter" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Extracting Archive Intelligence...</p>
            </div>
            ) : selectedIssue && (
            <div className="space-y-10 font-inter">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl font-inter">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 font-inter" />
                    <div className="relative z-10 font-inter">
                        <div className="flex items-center gap-4 mb-4 font-inter">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 font-inter">
                                {selectedIssue.category?.toUpperCase() || 'GENERAL'}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${
                                selectedIssue.priority?.toLowerCase() === 'critical' ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white/10 border-white/20'
                            }`}>
                                {selectedIssue.priority?.toUpperCase()} PRIORITY
                            </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-snug mb-6 font-inter">{selectedIssue.title}</h2>
                        
                        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 font-inter">
                            <div className="flex items-center gap-3 font-inter">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 font-inter">
                                    <Clock className="w-5 h-5 font-inter font-inter" />
                                </div>
                                <div className="font-inter">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest font-inter">REPORTED ON</p>
                                    <p className="text-sm font-bold text-white font-inter">{selectedIssue.reported_date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 font-inter">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 font-inter font-inter">
                                    <CheckCircle2 className="w-5 h-5 font-inter font-inter" />
                                </div>
                                <div className="font-inter font-inter">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest font-inter">VAULT ID</p>
                                    <p className="text-sm font-bold text-white font-inter">{selectedIssue.business_id || `ISS-${selectedIssue.id}`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-4 px-2 font-inter">
                    <div className="flex items-center gap-3 font-inter">
                        <History className="w-4 h-4 text-blue-500 font-inter" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Detailed Observation</h4>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 relative font-inter font-inter">
                        <p className="text-base text-slate-600 font-bold italic leading-relaxed font-inter font-inter">
                            "{selectedIssue.description}"
                        </p>
                    </div>
                </div>

                {/* Resolution */}
                {selectedIssue.resolution && (
                <div className="space-y-4 px-2 font-inter">
                    <div className="flex items-center gap-3 font-inter">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 font-inter" />
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-inter">Official Resolution Narrative</h4>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8 font-inter font-inter">
                        <p className="text-base font-black text-emerald-900 leading-relaxed font-inter font-inter">
                            {selectedIssue.resolution}
                        </p>
                    </div>
                </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex justify-end font-inter">
                   <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-10 py-4 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-slate-900/10 active:scale-95 font-inter"
                   >
                    Dismiss Archive
                   </button>
                </div>
            </div>
            )}
        </div>
      </Modal>

      {/* Create Issue Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title=""
        maxWidth="max-w-2xl"
      >
        <div className="-mt-12 font-inter">
            <div className="mb-8 flex items-center justify-between font-inter">
               <h3 className="text-xl font-black text-slate-700 tracking-tight font-inter">Vault Entry: New Site Constraint</h3>
            </div>
            
            <form onSubmit={handleCreateIssue} className="space-y-8 font-inter font-inter">
            <div className="space-y-6 font-inter">
                <div className="font-inter">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">CONSTRAINT TITLE</label>
                <input 
                    required
                    type="text" 
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-inter font-inter"
                    placeholder="Brief identifying name for this issue..."
                />
                </div>
                
                <div className="grid grid-cols-2 gap-6 font-inter">
                    <div className="font-inter">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">CATEGORY PROFILE font-inter</label>
                        <div className="relative font-inter">
                            <select 
                                value={newIssue.category}
                                onChange={(e) => setNewIssue({...newIssue, category: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer font-inter font-inter font-inter"
                            >
                                <option value="Material">Material Constraint</option>
                                <option value="Safety">Safety Protocol</option>
                                <option value="Delay">Project Delay</option>
                                <option value="Quality">Quality Concern</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none font-inter" />
                        </div>
                    </div>
                    <div className="font-inter">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">PRIORITY RATING font-inter</label>
                        <div className="relative font-inter font-inter">
                            <select 
                                value={newIssue.priority}
                                onChange={(e) => setNewIssue({...newIssue, priority: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer font-inter"
                            >
                                <option value="Low">Low - Informative</option>
                                <option value="Medium">Medium - Regular</option>
                                <option value="High">High - Urgent</option>
                                <option value="Critical">Critical - immediate</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none font-inter" />
                        </div>
                    </div>
                </div>

                <div className="font-inter">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">DETAILED OBSERVATION NARRATIVE</label>
                <textarea 
                    required
                    rows={5}
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none font-inter"
                    placeholder="Provide a comprehensive breakdown of the constraint..."
                />
                </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-end gap-4 font-inter">
                <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-inter font-inter"
                >
                Cancel Entry
                </button>
                <button 
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3 disabled:opacity-50 active:scale-95 font-inter font-inter"
                >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin font-inter" /> : null}
                {isSubmitting ? "FILING..." : "LODGE CONSTRAINT"}
                </button>
            </div>
            </form>
        </div>
      </Modal>
    </>
  );
};

export default ClientIssuesPage;
