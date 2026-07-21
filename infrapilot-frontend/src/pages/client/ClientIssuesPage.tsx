import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { issueService } from "../../services/issueService";
import { projectService } from "../../services/projectService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { Search, Plus, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [projectName, setProjectName] = useState("Loading...");

  const { projectId } = useClientProjectId();

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await projectService.getProjectById(projectId);
      setProjectName(data.project_name || "New sara city");
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await issueService.getIssues({ project_id: projectId, limit: 1000 });

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
      result = result.filter(i => {
        const s = i.status?.toLowerCase();
        if (statusFilter === "OPEN" || statusFilter === "PENDING") {
          return s === 'open' || s === 'in progress' || s === 'pending';
        }
        if (statusFilter === "CLOSED" || statusFilter === "RESOLVED") {
          return s === 'resolved' || s === 'closed';
        }
        return true;
      });
    }

    if (priorityFilter !== "ALL PRIORITY") {
      if (priorityFilter === "HIGH") {
        result = result.filter(i => i.priority?.toLowerCase() === 'high' || i.priority?.toLowerCase() === 'critical');
      } else {
        result = result.filter(i => i.priority?.toUpperCase() === priorityFilter);
      }
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
    pending: issues.filter(i => i.status?.toLowerCase() !== 'resolved' && i.status?.toLowerCase() !== 'closed').length,
    highPriority: issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status?.toLowerCase() !== 'resolved' && i.status?.toLowerCase() !== 'closed').length,
    resolved: issues.filter(i => i.status?.toLowerCase() === 'resolved' || i.status?.toLowerCase() === 'closed').length
  };

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Navbar title="Issues & Risks" breadcrumb={["InfraPilot", "Client", "Issues & Risks"]} />
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
              onClick={() => {
                if (i === 0) { setStatusFilter("ALL STATUS"); setPriorityFilter("ALL PRIORITY"); }
                else if (i === 1) { setStatusFilter("PENDING"); setPriorityFilter("ALL PRIORITY"); }
                else if (i === 2) { setPriorityFilter("HIGH"); setStatusFilter("ALL STATUS"); }
                else { setStatusFilter("RESOLVED"); setPriorityFilter("ALL PRIORITY"); }
              }}
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
          <div className="px-8 py-6 border-b border-slate-50 mt-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search Bar - Pill Shape */}
              <div className="relative w-full max-w-[50%] group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-100/50 rounded-full py-4 pl-14 pr-8 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Action Filters */}
              <div className="flex items-center gap-3">
                <div className="p-3.5 bg-white border border-slate-100 rounded-xl text-slate-400">
                  {/* Funnel Icon to match image */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-2xl py-3.5 pl-6 pr-14 text-[11px] font-black uppercase tracking-widest text-[#475569] outline-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                  >
                    <option>ALL STATUS</option>
                    <option>OPEN</option>
                    <option>CLOSED</option>
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-2xl py-3.5 pl-6 pr-14 text-[11px] font-black uppercase tracking-widest text-[#475569] outline-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                  >
                    <option>ALL PRIORITY</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 font-inter">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/20">
                  <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%] font-inter">ISSUE IDENTIFIER</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[18%] font-inter">STATUS PROFILE</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[18%] font-inter">PRIORITY LEVEL</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[24%] font-inter">TIMELINE AUDIT</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%] text-right pr-14 font-inter">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {loading && issues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center font-inter">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 font-inter" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Synchronizing Vault Records...</p>
                    </td>
                  </tr>
                ) : paginatedIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center font-inter">
                      <p className="text-sm font-medium text-slate-400 font-inter">No site constraints detected.</p>
                    </td>
                  </tr>
                ) : paginatedIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="group hover:bg-slate-50/50 transition-all align-top font-inter border-b border-slate-50 last:border-0"
                  >
                    <td className="py-6 px-10">
                      <p className="text-sm font-black text-slate-800 tracking-tight mb-0.5 font-inter">{issue.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">{issue.category}</p>
                    </td>
                    <td className="py-6 px-10">
                      <span className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border font-inter ${issue.status?.toLowerCase() === 'open'
                        ? 'bg-transparent text-rose-500 border-rose-500/30'
                        : issue.status?.toLowerCase() === 'in progress' || issue.status?.toLowerCase() === 'pending'
                          ? 'bg-transparent text-orange-500 border-orange-500/30'
                          : 'bg-transparent text-emerald-500 border-emerald-500/30'
                        }`}>
                        {issue.status?.toUpperCase() || 'OPEN'}
                      </span>
                    </td>
                    <td className="py-6 px-10">
                      <span className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border font-inter ${issue.priority?.toLowerCase() === 'critical'
                        ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-sm'
                        : issue.priority?.toLowerCase() === 'high'
                          ? 'bg-transparent text-[#E11D48] border-[#E11D48]/30'
                          : issue.priority?.toLowerCase() === 'medium'
                            ? 'bg-transparent text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-transparent text-blue-500 border-blue-500/30 font-inter'
                        }`}>
                        {issue.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-6 px-10 font-inter">
                      <p className="text-sm font-black text-slate-700 tracking-tight mb-0.5 font-inter">{issue.reported_date || new Date(issue.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">REPORTED</p>
                    </td>
                    <td className="py-6 px-10 text-right pr-14 font-inter">
                      <button
                        onClick={() => handleViewIssue(issue.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center justify-center font-inter"
                      >
                        {/* Eye Icon */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all font-inter ${currentPage === page
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

      {/* View Detail Modal - Constraint Intelligence Insight */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedIssue(null);
        }}
        title="Constraint Intelligence Insight"
        maxWidth="max-w-lg"
      >
        <div className="font-inter">
          {fetchingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : selectedIssue && (
            <div className="space-y-6">
              {/* Blue Hero Card */}
              <div className="bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-blue-500/60 backdrop-blur flex items-center justify-center text-2xl font-black text-white">
                      {(selectedIssue.title?.[0] || "I").toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-blue-600" />
                  </div>
                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-lg font-black leading-tight">{selectedIssue.title}</h2>
                      <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-black uppercase tracking-widest">
                        {selectedIssue.status?.toUpperCase() || "OPEN"}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200 font-bold uppercase tracking-widest mb-3">
                      ✉ ISSUE.REF-#{selectedIssue.id}
                    </p>
                    <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${selectedIssue.priority?.toLowerCase() === 'high' || selectedIssue.priority?.toLowerCase() === 'critical'
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/10 border-white/20 text-white'
                      }`}>
                      PRIORITY: {selectedIssue.priority?.toUpperCase() || "MEDIUM"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issue Parameters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Parameters</p>
                </div>

                {/* Project / Category / Priority row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project</p>
                    <p className="text-sm font-black text-slate-800 uppercase">{projectName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                    <p className="text-sm font-black text-slate-800 uppercase">{selectedIssue.category || "General"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                    <p className={`text-sm font-black uppercase ${selectedIssue.priority?.toLowerCase() === 'high' || selectedIssue.priority?.toLowerCase() === 'critical'
                        ? 'text-red-500'
                        : selectedIssue.priority?.toLowerCase() === 'medium'
                          ? 'text-orange-500'
                          : 'text-slate-700'
                      }`}>{selectedIssue.priority?.toUpperCase() || "MEDIUM"}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-4">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {selectedIssue.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sequence Audit */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequence Audit</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reported</p>
                    <p className="text-sm font-black text-slate-800">{selectedIssue.reported_date || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference</p>
                    <p className="text-sm font-black text-slate-800">{selectedIssue.business_id || `ISS-#${selectedIssue.id}`}</p>
                  </div>
                </div>
              </div>

              {/* Resolution (if exists) */}
              {selectedIssue.resolution && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resolution</p>
                  <p className="text-sm text-emerald-800 font-bold leading-relaxed">{selectedIssue.resolution}</p>
                </div>
              )}

              {/* DISMISS Button */}
              <button
                onClick={() => { setIsViewModalOpen(false); setSelectedIssue(null); }}
                className="w-full py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </Modal>


      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log Issue"
        maxWidth="max-w-2xl"
      >
        <div className="pt-2">
          <form onSubmit={handleCreateIssue} className="space-y-6">
            {/* Project Section */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-black text-slate-800 mb-4 font-inter">Project</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 font-inter">
                  PROJECT <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <select
                    disabled
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold text-slate-700 outline-none appearance-none cursor-not-allowed font-inter"
                  >
                    <option>{projectName}</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Issue Details Section */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-black text-slate-800 mb-4 font-inter">Issue Details</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 font-inter">
                    TITLE <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    placeholder="e.g. Sand delivery delay"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all font-inter"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 font-inter">
                      CATEGORY <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={newIssue.category}
                        onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white shadow-sm transition-all font-inter"
                      >
                        <option value="Material">Material</option>
                        <option value="Safety">Safety</option>
                        <option value="Delay">Delay</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 font-inter">
                      PRIORITY <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={newIssue.priority}
                        onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white shadow-sm transition-all font-inter"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 font-inter">
                    REPORTED DATE <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={newIssue.reported_date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewIssue({ ...newIssue, reported_date: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold text-slate-700 outline-none hover:bg-white transition-all font-inter"
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-black text-slate-800 mb-4 font-inter">Description</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 font-inter">
                  DESCRIPTION <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 px-5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none font-inter"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-6 pt-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors font-inter"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl text-sm font-black tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 font-inter"
              >
                {isSubmitting ? "Logging..." : "Log Issue"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default ClientIssuesPage;
