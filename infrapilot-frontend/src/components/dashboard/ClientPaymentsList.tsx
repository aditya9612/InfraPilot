import { useEffect, useState } from "react";
import { clientPaymentService, type ClientPayment } from "../../services/clientPaymentService";
import { CheckCircle, Download, Search, RefreshCcw, XCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import PaymentDetailsModal from "./PaymentDetailsModal";

const ClientPaymentsList = () => {
    const { selectedProjectId } = useProject();
    const [payments, setPayments] = useState<ClientPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewingPayment, setViewingPayment] = useState<ClientPayment | null>(null);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const data = await clientPaymentService.listPayments(selectedProjectId ? { project_id: selectedProjectId } : undefined);
            setPayments(data.items || []);
        } catch (err) {
            console.error("Failed to fetch payments", err);
            toast.error("Failed to load client payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [selectedProjectId]);

    const handleVerify = async (id: number, action: "approve" | "reject") => {
        try {
            toast.loading(`${action === 'approve' ? 'Verifying' : 'Rejecting'}...`, { id: "action" });
            await clientPaymentService.verifyPayment(id, action);
            toast.success(`Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully`, { id: "action" });
            fetchPayments();
        } catch (error) {
            toast.error(`Failed to ${action}`, { id: "action" });
        }
    };

    const handleDownloadReceipt = async (id: number) => {
        try {
            toast.loading("Downloading receipt...", { id: "receipt" });
            await clientPaymentService.downloadReceipt(id);
            toast.success("Downloaded successfully", { id: "receipt" });
        } catch (error) {
            toast.error("Failed to get receipt", { id: "receipt" });
        }
    };

    const filteredPayments = payments.filter((p) =>
        (p.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.payment_no || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <div className="relative flex-1 max-w-md w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by client or payment ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <button
                    onClick={fetchPayments}
                    className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-all"
                    title="Refresh Payments"
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                            <th className="px-6 py-4">Client & Project</th>
                            <th className="px-6 py-4">Date & Amount</th>
                            <th className="px-6 py-4">Method & Bank</th>
                            <th className="px-6 py-4">Recorded By</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        Loading payments...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                    No payments found.
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-600">{p.user_name || "Unknown Client"}</p>
                                        {p.project_name && <p className="text-[10px] text-slate-500 truncate max-w-[150px]" title={p.project_name}>{p.project_name}</p>}
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-700">
                                        ₹{Number(p.amount).toLocaleString()}
                                        <p className="text-[10px] text-slate-400 font-normal">{new Date(p.payment_date).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-700 uppercase">{p.payment_method || "N/A"}</p>
                                        {p.bank_name && <p className="text-[10px] text-slate-500">{p.bank_name}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-semibold text-slate-600">
                                            {p.verified_by ? `Verifier ID: ${p.verified_by}` : (p.verified_at ? "Verified" : "Pending")}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase
                      ${(p.payment_status || '').toLowerCase() === 'completed' || (p.payment_status || '').toLowerCase() === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                                                (p.payment_status || '').toLowerCase() === 'failed' || (p.payment_status || '').toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.payment_status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {(p.payment_status || '').toLowerCase() !== 'verified' && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerify(p.id, "approve")}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition-all duration-200"
                                                        title="Approve Payment"
                                                    >
                                                        <CheckCircle className="w-4.5 h-4.5" strokeWidth={1.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(p.id, "reject")}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                                                        title="Reject Payment"
                                                    >
                                                        <XCircle className="w-4.5 h-4.5" strokeWidth={1.5} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setViewingPayment(p)}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 transition-all duration-200"
                                                title="View Details"
                                            >
                                                <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadReceipt(p.id)}
                                                className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                                                title="Download Receipt"
                                            >
                                                <Download className="w-4.5 h-4.5" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <PaymentDetailsModal
                payment={viewingPayment}
                onClose={() => setViewingPayment(null)}
            />
        </div>
    );
};

export default ClientPaymentsList;
