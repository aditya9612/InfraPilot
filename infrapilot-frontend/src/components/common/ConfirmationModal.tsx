import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    confirmClass?: string;
    isLoading?: boolean;
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed? This action cannot be undone.",
    confirmLabel = "Confirm",
    confirmClass = "bg-rose-500 hover:bg-rose-600 shadow-rose-200",
    isLoading = false,
}: ConfirmationModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        };
    }, [isOpen]);

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
                    <div className="absolute inset-0" onClick={onClose} />

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
                                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                                </div>
                                <h2 className="text-base font-black text-slate-800">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-6">
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-2.5 text-white rounded-2xl font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-wait ${confirmClass}`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        confirmLabel
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

export default ConfirmationModal;
