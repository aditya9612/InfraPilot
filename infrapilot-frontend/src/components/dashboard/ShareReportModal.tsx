import React, { useState } from "react";
import Modal from "../common/Modal";
import { Mail, MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

interface ShareReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName: string;
    onShare: (type: "email" | "whatsapp", target: string) => Promise<void>;
}

const ShareReportModal = ({
    isOpen,
    onClose,
    reportName,
    onShare,
}: ShareReportModalProps) => {
    const [shareType, setShareType] = useState<"email" | "whatsapp">("email");
    const [target, setTarget] = useState("");
    const [isSharing, setIsSharing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!target) {
            toast.error(`Please enter a valid ${shareType === "email" ? "email address" : "phone number"}`);
            return;
        }

        setIsSharing(true);
        try {
            await onShare(shareType, target);
            toast.success(`Report shared successfully via ${shareType}!`);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to share report");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Share Report: ${reportName}`}
            maxWidth="max-w-md"
        >
            <div className="space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button
                        onClick={() => { setShareType("email"); setTarget(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${shareType === "email"
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <Mail size={18} />
                        Email
                    </button>
                    <button
                        onClick={() => { setShareType("whatsapp"); setTarget(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${shareType === "whatsapp"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <MessageCircle size={18} />
                        WhatsApp
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                            Recipient {shareType === "email" ? "Email Address" : "Phone Number"}
                        </label>
                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${shareType === "email" ? "text-primary/40 group-focus-within:text-primary" : "text-emerald-500/40 group-focus-within:text-emerald-500"}`}>
                                {shareType === "email" ? <Mail size={18} /> : <MessageCircle size={18} />}
                            </div>
                            <input
                                type={shareType === "email" ? "email" : "tel"}
                                placeholder={shareType === "email" ? "manager@infrapilot.in" : "+91 98765 43210"}
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                                required
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium px-1 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-primary rounded-full"></span>
                            Secure transmission via InfraPilot analytics hub.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-2xl transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSharing}
                            className={`flex-[1.5] py-3.5 ${shareType === "email" ? "bg-primary shadow-primary/20" : "bg-emerald-600 shadow-emerald-600/20"} text-white text-xs font-black rounded-2xl shadow-lg hover:brightness-110 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                            {isSharing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={16} strokeWidth={2.5} />
                            )}
                            {isSharing ? "Sharing..." : "Send Intelligence"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ShareReportModal;
