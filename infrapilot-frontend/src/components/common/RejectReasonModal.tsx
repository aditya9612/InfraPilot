import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, X, AlertCircle } from "lucide-react";

interface RejectReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title?: string;
    isLoading?: boolean;
    minLength?: number;
}

const RejectReasonModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Reject Quotation",
    isLoading = false,
    minLength = 3,
}: RejectReasonModalProps) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setReason("");
            setError(null);
            setTouched(false);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        setTouched(true);
        const trimmed = reason.trim();
        if (!trimmed) {
            setError("Please enter a valid reason.");
            return;
        }
        if (trimmed.length < minLength) {
            setError(`Reason must be at least ${minLength} characters long.`);
            return;
        }
        setError(null);
        onConfirm(trimmed);
    };

    const handleClose = () => {
        setReason("");
        setError(null);
        setTouched(false);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setReason(val);
        const trimmed = val.trim();
        if (trimmed.length > 0 && trimmed.length < minLength) {
            setError(`Reason must be at least ${minLength} characters long.`);
        } else if (trimmed.length >= minLength) {
            setError(null);
        }
    };

    const isTooShort = reason.trim().length > 0 && reason.trim().length < minLength;
    const showErrorMessage = error || isTooShort || (touched && reason.trim().length === 0);

    const content = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                >
                    <div className="absolute inset-0" onClick={handleClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 12 }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-50">
                                    <XCircle className="w-5 h-5 text-rose-500" />
                                </div>
                                <h2 className="text-base font-black text-slate-800">{title}</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Reason for Rejection
                            </p>
                            <textarea
                                value={reason}
                                onChange={handleChange}
                                onBlur={() => setTouched(true)}
                                placeholder="Describe why this quotation is being rejected..."
                                rows={4}
                                autoFocus
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm text-slate-700 font-medium resize-none outline-none transition-all placeholder:text-slate-300 ${
                                    showErrorMessage
                                        ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                                        : "border-slate-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                                }`}
                            />
                            {showErrorMessage && (
                                <p className="text-xs text-rose-500 mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                        {isTooShort
                                            ? `Reason must be at least ${minLength} characters long.`
                                            : error || "Please enter a valid reason."}
                                    </span>
                                </p>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading || reason.trim().length < minLength}
                                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Rejecting...
                                        </span>
                                    ) : (
                                        "Confirm Reject"
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};

export default RejectReasonModal;
