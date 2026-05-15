import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { approvalService } from "../../services/approvalService";
import type { ClientApproval } from "../../services/approvalService";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const statusStyle: Record<string, string> = {
  "Pending Client": "bg-amber-50 text-amber-700 border border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const ClientApprovalsPage = () => {
  const [approvals, setApprovals] = useState<ClientApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getApprovals(1);
      setApprovals(data);
    } catch (error) {
      toast.error("Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      toast.loading(`${action === "approve" ? "Approving" : "Rejecting"} variation...`, { id: "approval-toast" });
      if (action === "approve") {
        await approvalService.approveApproval(id, "we approved it");
      } else {
        await approvalService.rejectApproval(id, "we rejectedit");
      }
      toast.success(`Variation ${action === "approve" ? "approved" : "rejected"} successfully.`, { id: "approval-toast" });
      fetchApprovals(); // Refresh list
    } catch (error) {
      toast.error(`Failed to ${action} variation.`, { id: "approval-toast" });
    }
  };

  const pendingApproval = approvals.find(a => a.status === "Pending Client");

  if (loading) {
    return (
      <>
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4 opacity-50" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading approval ledger...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Approvals</h1>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Variation orders, design changes & strategic authorizations</p>
        </div>

        {/* Action Required Banner */}
        {pendingApproval && (
          <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-8 flex flex-col md:flex-row items-center gap-6 mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-16 h-16 bg-amber-500 rounded-[20px] flex items-center justify-center text-white text-3xl shrink-0 shadow-xl shadow-amber-500/20">!</div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-lg font-black text-amber-900 tracking-tight">Immediate Action Required</p>
              <p className="text-[11px] text-amber-700 font-bold mt-1 tracking-tight uppercase opacity-80">{pendingApproval.id} — {pendingApproval.title} requires your final authorization.</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                <button 
                  onClick={() => handleAction(pendingApproval.id, "approve")}
                  className="px-8 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Confirm Approval
                </button>
                <button 
                  onClick={() => handleAction(pendingApproval.id, "reject")}
                  className="px-8 py-3 bg-white border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-100 transition-all shadow-sm"
                >
                  Decline Variation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approvals List */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request History</h2>
            <div className="h-px flex-1 bg-slate-100 mx-6 opacity-50" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{approvals.length} Records</span>
          </div>
          
          {approvals.map((apr, i) => (
            <div key={apr.id} className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-primary bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">{apr.id}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${statusStyle[apr.status]}`}>{apr.status}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{apr.title}</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Submission Date</span>
                      <span className="text-xs font-bold text-slate-600 mt-1">{apr.submitted}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Decision Deadline</span>
                      <span className="text-xs font-bold text-slate-600 mt-1">{apr.deadline}</span>
                    </div>
                    {apr.amount !== "—" && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial Impact</span>
                        <span className="text-xs font-black text-slate-900 mt-1">{apr.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {apr.status === "Pending Client" && (
                  <div className="flex gap-3 shrink-0">
                    <button 
                      onClick={() => handleAction(apr.id, "approve")}
                      className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button 
                      onClick={() => handleAction(apr.id, "reject")}
                      className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95 border border-red-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ClientApprovalsPage;
