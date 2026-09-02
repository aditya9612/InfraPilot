import { useState, useEffect } from "react";
import { FileText, CreditCard } from "lucide-react";
import api from "../../services/api";
import Modal from "../../components/common/Modal";
import { userService } from "../../services/userService";
import { projectService } from "../../services/projectService";
import { financeService } from "../../services/financeService";
import toast from "react-hot-toast";
import { PROJECTS } from "../../config/projectSeed";

const KNOWN_PROJECT_MAP: Record<string, string> = {
  "1": "Sara City",
  "2": "Metro Heights",
  "3": "Green Gardens",
  "4": "Skyline Towers",
  "5": "Riverfront Residency",
  "6": "Emerald Park",
  "7": "City Plaza",
  "8": "Royal Palms",
  "9": "Grand Horizons",
  "10": "Ocean View Residences",
};

export default function InvoiceViewModal({ invoiceId, projects, onClose, onSuccess }: { invoiceId: number | null; projects: any[]; onClose: () => void; onSuccess?: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchedOwnerName, setFetchedOwnerName] = useState<string>("");
  const [fetchedProjectName, setFetchedProjectName] = useState<string>("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", mode: "Bank Transfer", reference: "" });
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [res, txRes] = await Promise.all([
          api.get(`/invoices/${invoiceId}`),
          financeService.getInvoiceTransactions(invoiceId as number)
        ]);
        setData(res.data);
        setTransactions(txRes || []);
        
        if (res.data?.project_name) {
          setFetchedProjectName(res.data.project_name);
        } else if (res.data?.project_id) {
          const strId = String(res.data.project_id).trim();
          const p = projects?.find(proj => String(proj.id ?? proj.project_id) === strId);
          if (p) {
            setFetchedProjectName(p.name || p.project_name || p.client_name);
          } else {
            const seed = PROJECTS.find(proj => String(proj.id) === strId);
            if (seed) {
              setFetchedProjectName(seed.project_name);
            } else if (KNOWN_PROJECT_MAP[strId]) {
              setFetchedProjectName(KNOWN_PROJECT_MAP[strId]);
            } else {
              try {
                const proj = await projectService.getProjectById(res.data.project_id);
                setFetchedProjectName(proj.name || proj.project_name || KNOWN_PROJECT_MAP[strId] || `Project #${strId}`);
              } catch (e) {
                setFetchedProjectName(KNOWN_PROJECT_MAP[strId] || `Project #${strId}`);
              }
            }
          }
        }

        if (res.data?.owner_id) {
          try {
            const user = await userService.getUserById(res.data.owner_id);
            setFetchedOwnerName(user?.name || user?.full_name || res.data.owner_id);
          } catch (e) {
            setFetchedOwnerName(res.data.owner_id);
          }
        }
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
      setFetchedOwnerName("");
      setFetchedProjectName("");
    }
  }, [invoiceId, projects]);

  const projectName = fetchedProjectName || data?.project_id;
  const ownerName = fetchedOwnerName || data?.owner_id;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;
    setIsPaying(true);
    try {
      await financeService.payInvoice(invoiceId as number, {
        amount: Number(paymentData.amount),
        payment_mode: paymentData.mode,
        reference_no: paymentData.reference
      });
      toast.success("Payment recorded successfully!");
      setShowPaymentForm(false);
      setPaymentData({ amount: "", mode: "Bank Transfer", reference: "" });
      
      // Refresh data
      const [res, txRes] = await Promise.all([
        api.get(`/invoices/${invoiceId}`),
        financeService.getInvoiceTransactions(invoiceId as number)
      ]);
      setData(res.data);
      setTransactions(txRes || []);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to record payment");
    } finally {
      setIsPaying(false);
    }
  };

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
              <p className="text-sm font-semibold text-slate-700">{data.reference_id || 'N/A'}</p>
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

          {/* Payment Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-slate-400" /> Transactions & Payments</h4>
              {data.status !== "Paid" && data.status !== "certified" && (
                <button onClick={() => setShowPaymentForm(!showPaymentForm)} className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                  {showPaymentForm ? "Cancel" : "Record Payment"}
                </button>
              )}
            </div>
            
            {showPaymentForm && (
              <form onSubmit={handlePaymentSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount</label>
                    <input type="number" step="any" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Enter amount" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Mode</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={paymentData.mode} onChange={e => setPaymentData({...paymentData, mode: e.target.value})}>
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reference No.</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g. UTR/Cheque No." value={paymentData.reference} onChange={e => setPaymentData({...paymentData, reference: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={isPaying || !paymentData.amount} className="bg-emerald-500 text-white text-xs font-bold px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50">
                    {isPaying ? "Saving..." : "Submit Payment"}
                  </button>
                </div>
              </form>
            )}

            {transactions.length === 0 ? (
              <div className="text-center py-6 border border-slate-100 rounded-xl bg-slate-50/50">
                <p className="text-sm text-slate-400 font-semibold">No transactions found for this invoice.</p>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx: any, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-xs text-slate-500">{tx.date || tx.payment_date || tx.created_at || "—"}</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-600">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{tx.mode || tx.payment_mode || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{tx.reference || tx.ref_no || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-slate-500">Failed to load data.</div>
      )}
    </Modal>
  );
}
