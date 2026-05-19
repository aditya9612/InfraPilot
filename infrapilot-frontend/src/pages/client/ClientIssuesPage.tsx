import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import CreateIssueModal from "../../components/forms/CreateIssueModal";
import toast from "react-hot-toast";
import { issueService } from "../../services/issueService";

const ClientIssuesPage = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: ""
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr || "";
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const apiFilters: any = {};
      if (filters.status) apiFilters.status = filters.status;
      if (filters.priority) apiFilters.priority = filters.priority;
      if (filters.category) apiFilters.category = filters.category;
      if (filters.search) apiFilters.search = filters.search;
      
      const response = await issueService.getProjectIssues(1, apiFilters);
      setIssues(response.items || []);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      toast.error("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const handleCreateIssue = async (data: any) => {
    try {
      const payload = {
        project_id: 1,
        title: data.title,
        category: data.type,
        description: data.description,
        reported_date: new Date().toISOString().split('T')[0],
        priority: data.impactLevel
      };

      await issueService.createIssue(payload);
      
      toast.success("Issue reported successfully!", {
        style: { borderRadius: "12px", background: "#333", color: "#fff" },
        icon: "🚩",
      });
      setIsModalOpen(false);
      fetchIssues();
    } catch (error) {
      console.error("Failed to report issue:", error);
      toast.error("Failed to report issue. Please try again.");
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Issues & Risks"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Issues & Risk Ledger</h1>
            <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Real-time tracking of project hurdles, safety flags, and mitigation strategies</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Report New Issue
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
           <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
              <span className="text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search issues..."
                className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-800 placeholder:text-slate-300 w-48"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
           </div>
           <select 
             className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none cursor-pointer"
             value={filters.status}
             onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
           >
             <option value="">All Status</option>
             <option value="Open">Open</option>
             <option value="Closed">Closed</option>
           </select>
           <select 
             className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none cursor-pointer"
             value={filters.category}
             onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
           >
             <option value="">All Categories</option>
             <option value="Material">Material</option>
             <option value="Safety">Safety</option>
             <option value="Delay">Delay</option>
           </select>
           <select 
             className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none cursor-pointer"
             value={filters.priority}
             onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
           >
             <option value="">All Priorities</option>
             <option value="High">High</option>
             <option value="Medium">Medium</option>
             <option value="Low">Low</option>
           </select>
           {(filters.search || filters.status || filters.priority) && (
             <button 
               onClick={() => setFilters({ status: "", priority: "", category: "", search: "" })}
               className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline"
             >
               Clear Filters
             </button>
           )}
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[
            { label: "Open Issues", count: issues.filter(i => i.status === 'Open').length, color: "bg-red-50 text-red-600 border-red-100" },
            { label: "Closed Issues", count: issues.filter(i => i.status === 'Closed').length, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-2xl border ${stat.color} flex items-center justify-between shadow-sm`}>
               <p className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
               <p className="text-2xl font-bold">{stat.count}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 px-8 py-4">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <Loader2 className="w-12 h-12 mb-4 animate-spin text-rose-500 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest">Scanning project risks...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest">No issues reported</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                   <tr className="border-b border-slate-50">
                     <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Issue Detail</th>
                     <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                     <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Impact</th>
                     <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                     <th className="py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reported</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {issues.map((issue, i) => (
                     <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="py-8 pr-10 max-w-lg">
                          <p className="text-sm font-bold text-slate-800 mb-1">{issue.title}</p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{issue.description}</p>
                          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-80">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Resolution Strategy</p>
                             <p className="text-[10px] text-slate-600 font-bold">{issue.resolution || "Under evaluation by project engineering team."}</p>
                          </div>
                       </td>
                       <td className="py-8">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">
                             {issue.category || issue.type}
                          </span>
                       </td>
                       <td className="py-8 text-center">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            issue.priority === 'High' || issue.priority === 'Critical' || issue.impactLevel === 'High' || issue.impactLevel === 'Critical' ? 'text-red-500' : 
                            issue.priority === 'Medium' || issue.impactLevel === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                             {issue.priority || issue.impactLevel}
                          </span>
                       </td>
                       <td className="py-8 text-center">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                            issue.status === 'Open' ? 'bg-red-50 text-red-600' : 
                            issue.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                             {issue.status}
                          </span>
                       </td>
                       <td className="py-8 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-400">{formatDate(issue.reported_date) || issue.reportedDate}</p>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <CreateIssueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateIssue}
      />
    </>
  );
};

export default ClientIssuesPage;
