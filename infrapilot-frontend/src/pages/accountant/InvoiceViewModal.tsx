import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import api from "../../services/api";
import Modal from "../../components/common/Modal";

export default function InvoiceViewModal({ invoiceId, projects, onClose }: { invoiceId: number | null; projects: any[]; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${invoiceId}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load invoice details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) {
      load();
    } else {
      setData(null);
    }
  }, [invoiceId]);

  const p = projects?.find(proj => proj.id === data?.project_id);
  const projectName = p ? p.project_name : data?.project_id;
  const ownerName = p ? p.client_name : data?.owner_id;

  return (
    <Modal isOpen={!!invoiceId} onClose={onClose} title="Invoice Profile" maxWidth="max-w-4xl">
      {loading ? (
        <div className="p-20 text-center text-slate-400 font-inter">
          <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Parsing Details...</p>
        </div>
      ) : data ? (
        <div className="p-6 font-inter h-full overflow-y-auto">
          {/* Header card */}
          <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative flex-shrink-0">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold tracking-tight">Invoice</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/20`}>{data.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">Type: {data.type || '—'}</span>
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">Total: ₹{data.total_amount?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Name</p>
              <p className="text-sm font-semibold text-slate-700">{projectName}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Owner Name</p>
              <p className="text-sm font-semibold text-slate-700">{ownerName}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">type</p>
              <p className="text-sm font-semibold text-slate-700">{data.type}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">reference_id</p>
              <p className="text-sm font-semibold text-slate-700">{data.reference_id}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">amount</p>
              <p className="text-sm font-semibold text-slate-700">{data.amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">gst_percent</p>
              <p className="text-sm font-semibold text-slate-700">{data.gst_percent}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">gst_amount</p>
              <p className="text-sm font-semibold text-slate-700">{data.gst_amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">tax_percent</p>
              <p className="text-sm font-semibold text-slate-700">{data.tax_percent}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">tax_amount</p>
              <p className="text-sm font-semibold text-slate-700">{data.tax_amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">total_amount</p>
              <p className="text-sm font-semibold text-slate-700">{data.total_amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">paid_amount</p>
              <p className="text-sm font-semibold text-slate-700">{data.paid_amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">pending_amount</p>
              <p className="text-sm font-semibold text-slate-700">{data.pending_amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">status</p>
              <p className="text-sm font-semibold text-slate-700">{data.status}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">description</p>
              <p className="text-sm font-semibold text-slate-700">{data.description}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">created_at</p>
              <p className="text-sm font-semibold text-slate-700">{data.created_at}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-slate-500">Failed to load data.</div>
      )}
    </Modal>
  );
}
