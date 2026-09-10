import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { Transfer } from "../../types/material";

interface UpdateTransferStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    transfer: Transfer | null;
    onSubmit: (id: number, status: Transfer["status"]) => Promise<void>;
}

export default function UpdateTransferStatusModal({
    isOpen,
    onClose,
    transfer,
    onSubmit,
}: UpdateTransferStatusModalProps) {
    const [status, setStatus] = useState<Transfer["status"]>("PENDING");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (transfer) {
            setStatus(transfer.status);
        }
    }, [transfer]);

    if (!isOpen || !transfer) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(transfer.id, status);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Transfer Status"
            maxWidth="max-w-md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="update-transfer-status-form"
                        disabled={submitting}
                        className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {submitting ? "Updating..." : "Update"}
                    </button>
                </>
            }
        >
            <form id="update-transfer-status-form" onSubmit={handleSubmit} className="p-8">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Status Details</h3>

                <div className="space-y-6">
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            TRANSFER NAME <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            readOnly
                            disabled
                            value={transfer.material?.name || "Unknown Material"}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            STATUS <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Transfer["status"])}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
