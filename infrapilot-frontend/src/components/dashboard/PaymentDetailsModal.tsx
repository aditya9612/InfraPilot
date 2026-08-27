import React from "react";
import type { ClientPayment } from "../../services/clientPaymentService";
import { X } from "lucide-react";

interface PaymentDetailsModalProps {
    payment: ClientPayment | null;
    onClose: () => void;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ payment, onClose }) => {
    if (!payment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Payment Details</h2>
                        <p className="text-xs text-slate-500 font-mono">REF: {payment.payment_no || payment.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Status</p>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-widest uppercase
                                ${(payment.payment_status || '').toLowerCase() === 'completed' || (payment.payment_status || '').toLowerCase() === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                                    (payment.payment_status || '').toLowerCase() === 'failed' || (payment.payment_status || '').toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                {payment.payment_status || 'Pending'}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Amount</p>
                            <p className="text-2xl font-black text-emerald-600">₹{Number(payment.amount).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Client</p>
                            <p className="font-bold text-slate-700">{payment.user_name || payment.client_name || "N/A"}</p>
                        </div>

                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Payment Mode</p>
                            <p className="font-bold text-slate-700 uppercase">{payment.payment_method || payment.method || "N/A"}</p>
                        </div>
                        {payment.bank_name && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Bank Name</p>
                                <p className="font-bold text-slate-700">{payment.bank_name}</p>
                            </div>
                        )}
                        {payment.cheque_no && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cheque No</p>
                                <p className="font-bold text-slate-700">{payment.cheque_no}</p>
                            </div>
                        )}
                        {payment.reference_no && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Reference No</p>
                                <p className="font-bold text-slate-700">{payment.reference_no}</p>
                            </div>
                        )}
                        {payment.transaction_id && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Transaction ID</p>
                                <p className="font-bold text-slate-700">{payment.transaction_id}</p>
                            </div>
                        )}
                        {payment.invoice_no && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Invoice No</p>
                                <p className="font-bold text-slate-700">{payment.invoice_no}</p>
                            </div>
                        )}
                        {payment.invoice_status && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Invoice Status</p>
                                <p className="font-bold text-slate-700 uppercase">{payment.invoice_status}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Payment Date</p>
                            <p className="font-bold text-slate-700">{new Date(payment.payment_date).toLocaleString()}</p>
                        </div>
                        {payment.verified_at && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Verified At</p>
                                <p className="font-bold text-slate-700">{new Date(payment.verified_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Remarks</p>
                        <div className="p-3 bg-slate-50 text-slate-500 text-sm rounded-xl border border-slate-100 italic">
                            {payment.remarks || "No remarks provided."}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;
