import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { approvalService } from "../../../services/approvalService";
import toast from "react-hot-toast";

const ClientApprovedApprovalsPage = () => {
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const data = await approvalService.getApprovals();
        const approved = data.filter((a: any) => a.status === "Approved");
        setApprovedList(approved);
      } catch (err) {
        console.error("Failed to fetch approved approvals", err);
        toast.error("Failed to load approved approvals");
      } finally {
        setLoading(false);
      }
    };
    fetchApproved();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Approved"]} />
        <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
          <p className="text-slate-600">Loading approved approvals...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Approved"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-6">Approved Approvals</h1>
        {approvedList.length === 0 ? (
          <p className="text-slate-500">No approved items found.</p>
        ) : (
          <div className="space-y-6">
            {approvedList.map((apr, i) => (
              <div key={i} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-black uppercase text-slate-400">{apr.requestType || apr.entity_type}</span>
                  <span className="text-xs text-slate-400">ID: {apr.id}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{apr.description}</h2>
                <p className="text-slate-600">{apr.remarks}</p>
                <p className="mt-2 text-sm text-slate-500">Requested by: {apr.requested_by || apr.requestedBy}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ClientApprovedApprovalsPage;
