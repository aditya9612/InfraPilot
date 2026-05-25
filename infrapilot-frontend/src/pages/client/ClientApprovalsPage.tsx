import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { approvalService } from "../../services/approvalService";
import type { ApprovalItem } from "../../services/approvalService";

const statusStyle: Record<string, string> = {
  "Pending Client": "bg-amber-50 text-amber-700 border border-amber-200",
  "Pending": "bg-amber-50 text-amber-700 border border-amber-200",
  "Approved": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Rejected": "bg-red-50 text-red-700 border border-red-200",
};

const ClientApprovalsPage = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getApprovals();
      setApprovals(data);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm("Are you sure you want to approve this request?")) return;
    try {
      await approvalService.approve(id, "Approved by Client");
      fetchApprovals();
    } catch (err) {
      console.error("Failed to approve", err);
      alert("Failed to process approval.");
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      await approvalService.reject(id, "Rejected by Client");
      fetchApprovals();
    } catch (err) {
      console.error("Failed to reject", err);
      alert("Failed to process rejection.");
    }
  };

  const pendingCount = approvals.filter(a => a.status === "Pending").length;

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Approvals</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Variation orders, design changes & approvals requiring your action</p>
        </div>

        {/* Action Required Banner */}
        {!loading && pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-lg shrink-0 z-10 shadow-lg shadow-amber-500/30">!</div>
            <div className="z-10">
              <p className="text-sm font-black text-amber-800">{pendingCount} Approval{pendingCount > 1 ? 's' : ''} Pending Your Action</p>
              <p className="text-xs text-amber-600 font-bold mt-1">Please review and provide your authorization for the pending requests below.</p>
            </div>
          </div>
        )}

        {/* Approvals List */}
        <div className="space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
               <p className="text-[10px] font-black uppercase tracking-widest">Fetching Approvals...</p>
             </div>
          ) : approvals.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-3xl shadow-sm border border-slate-100">
               <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p className="text-xs font-black uppercase tracking-widest">No approvals found</p>
             </div>
          ) : approvals.map((apr) => (
            <div key={apr.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APR-{String(apr.id).padStart(3, '0')}</p>
                  <h3 className="text-sm font-black text-slate-800 mt-0.5 capitalize">{apr.entity_type} Approval</h3>
                  <div className="flex gap-4 mt-2">
                    <p className="text-[10px] font-bold text-slate-500">Related Entity ID: <span className="text-slate-700 font-black">#{apr.entity_id}</span></p>
                    {apr.remarks && <p className="text-[10px] font-bold text-slate-500">Remarks: <span className="text-slate-700 font-black">{apr.remarks}</span></p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusStyle[apr.status] || "bg-slate-50 border border-slate-200 text-slate-600"}`}>
                    {apr.status}
                  </span>
                  {apr.status === "Pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(apr.id)} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">Approve</button>
                      <button onClick={() => handleReject(apr.id)} className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 active:scale-95 transition-all">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ClientApprovalsPage;
