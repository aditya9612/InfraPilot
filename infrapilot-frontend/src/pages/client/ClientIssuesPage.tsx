import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { issueService } from "../../services/issueService";

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

const ClientIssuesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueCategory, setIssueCategory] = useState("Material");
  const [issueImpact, setIssueImpact] = useState("High");
  const [issueDescription, setIssueDescription] = useState("");
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});

  const handleCreateIssue = async () => {
    // Validate inputs
    const errors: { title?: string; description?: string } = {};
    if (!issueTitle.trim()) errors.title = "Issue title is required";
    if (!issueDescription.trim()) errors.description = "Issue description is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Prepare payload matching API schema
    const payload = {
      project_id: 96,
      title: issueTitle,
      category: issueCategory,
      description: issueDescription,
      reported_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      priority: issueImpact,
    };

    console.log(">>> Submitting create issue with payload:", JSON.stringify(payload));

    try {
      const response = await issueService.createIssue(payload);
      console.log('>>> Issue created successfully:', JSON.stringify(response));
      alert(`Issue created successfully! ID: ${response.id}, Business ID: ${response.business_id}`);
      // Reset form
      setIsCreateModalOpen(false);
      setIssueTitle("");
      setIssueDescription("");
      setIssueCategory("Material");
      setIssueImpact("High");
    } catch (err: any) {
      console.error('>>> Error creating issue:', err);
      console.error('>>> Error response data:', err?.response?.data);
      console.error('>>> Error response status:', err?.response?.status);
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Unknown error';
      alert(`Failed to create issue: ${errorMsg}`);
    }
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
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto text-center shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Issue
        </button>
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

    {/* Create Issue Modal */}
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      title="Create New Issue"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Issue Title</label>
          <input 
            type="text" 
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            placeholder="E.g., Plumbing material delay" 
            className={`w-full bg-slate-50 border ${formErrors.title ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'} rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors`} 
          />
          {formErrors.title && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{formErrors.title}</p>}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
            <select 
              value={issueCategory}
              onChange={(e) => setIssueCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-colors"
            >
              <option>Material</option>
              <option>Safety</option>
              <option>Delay</option>
              <option>Financial</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Impact Level</label>
            <select 
              value={issueImpact}
              onChange={(e) => setIssueImpact(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-colors"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
          <textarea 
            placeholder="Describe the issue in detail..." 
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            rows={4} 
            className={`w-full bg-slate-50 border ${formErrors.description ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'} rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors resize-none custom-scrollbar`} 
          />
          {formErrors.description && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{formErrors.description}</p>}
        </div>
        <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
           <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
           <button onClick={handleCreateIssue} className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">Submit Issue</button>
        </div>
      </div>
    </Modal>
  </>
);
};

export default ClientIssuesPage;
