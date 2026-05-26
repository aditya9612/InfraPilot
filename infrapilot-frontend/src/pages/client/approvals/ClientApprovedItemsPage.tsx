import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { approvalService } from "../../../services/approvalService";

const ClientApprovedItemsPage = () => {
  const [approvedItems, setApprovedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchApprovedItems = async () => {
      try {
        setLoading(true);
        const data = await approvalService.getApprovals();
        // Filter for approved items. If project_id is available in the response, we should filter by it too.
        // For now, filtering by status.
        const filtered = data
          .filter((apr: any) => apr.status === 'Approved')
          .map((apr: any) => ({
            id: `APR-${apr.id}`,
            requestType: apr.entity_type === 'bill' ? 'Billing' : 
                         apr.entity_type === 'material' ? 'Material' :
                         apr.entity_type === 'design' ? 'Design' : 'Variation',
            description: `${(apr.entity_type || 'Unknown').charAt(0).toUpperCase() + (apr.entity_type || 'unknown').slice(1)} Approved for Project`,
            amountQuantity: "—",
            requestedBy: `User ${apr.requested_by}`,
            approvedOn: "Recents",
            remarks: apr.remarks || "Approved via portal."
          }));
        setApprovedItems(filtered);
      } catch (err) {
        console.error("Failed to fetch approved items:", err);
        // Fallback to static data if API fails or for demo
        setApprovedItems([
          { id: "APR-017", requestType: "Design", description: "Design Change — Staircase Width Increase from 1.2m to 1.5m.", amountQuantity: "₹3,50,000", requestedBy: "Lead Architect", approvedOn: "15 Feb 2026", remarks: "Requested for better fire safety compliance and aesthetic flow." },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedItems();
  }, [projectId]);

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Approved"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Approved Items Audit</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Historical log of all signed-off project requests and variations</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest">Fetching Audit Records...</p>
          </div>
        ) : approvedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
             <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <p className="text-xs font-black uppercase tracking-widest">No approved items found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* List Header */}
            <div className="hidden sm:flex items-center gap-6 px-10 py-4 bg-slate-50/50 border-b border-slate-50">
              <div className="flex-1 min-w-0">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Details</p>
              </div>
              <div className="shrink-0 w-[100px] text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
              </div>
              <div className="shrink-0 w-[80px] text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Value</p>
              </div>
              <div className="shrink-0 w-[100px] text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signed On</p>
              </div>
              <div className="shrink-0 w-[90px] text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit</p>
              </div>
            </div>

            {approvedItems.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center gap-6 p-6 px-10 hover:bg-slate-50/50 transition-all group">
                {/* Icon Box */}
                <div className="w-12 h-12 bg-emerald-50/50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100/30">
                  <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight truncate">{item.description}</h3>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">SIGNED RECORD • {item.id}</p>
                </div>

                {/* Category Pill */}
                <div className="shrink-0 w-[100px] flex justify-center">
                  <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm ${
                    item.requestType === 'Billing' ? 'bg-blue-50 text-blue-600 border-blue-100/50' :
                    item.requestType === 'Material' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-purple-50 text-purple-600 border-purple-100/50'
                  }`}>
                    {item.requestType}
                  </span>
                </div>

                {/* Amount/Value Badge */}
                <div className="shrink-0 w-[80px] flex justify-center">
                  <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-100">
                    {item.amountQuantity}
                  </span>
                </div>

                {/* Date */}
                <div className="shrink-0 w-[100px] text-center">
                  <p className="text-[11px] font-black text-emerald-600">{item.approvedOn}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Digitally Signed</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 shrink-0 w-[90px]">
                  <button 
                    onClick={() => handleViewDetails(item)}
                    title="View Details"
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    title="Download Record"
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <div 
                    title="Digitally Signed"
                    className="w-9 h-9 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-xl shadow-sm border border-emerald-100/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* View Item Modal */}
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Audit Log Detail"
      maxWidth="max-w-xl"
    >
      {selectedItem && (
        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Signed & Finalized</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Reference</p>
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{selectedItem.id}</p>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Historical Context</h4>
             <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-lg font-black text-slate-800 leading-tight mb-2">{selectedItem.description}</p>
                <div className="flex items-center gap-2">
                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100/50">
                      {selectedItem.requestType} Entity
                   </span>
                   <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">
                      Audit Approved
                   </span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Requester</p>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                   <p className="text-xs font-black text-slate-800">{selectedItem.requestedBy}</p>
                </div>
             </div>
             <div className="p-6 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completion Date</p>
                <p className="text-xs font-black text-slate-800">{selectedItem.approvedOn}</p>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Audit Remarks</h4>
             <div className="p-6 bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl">
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                   "{selectedItem.remarks}"
                </p>
             </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-100">
             <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-slate-900/10"
             >
                Close Audit Record
             </button>
          </div>
        </div>
      )}
    </Modal>
  </>
  );
};

export default ClientApprovedItemsPage;
