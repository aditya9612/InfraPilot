import React from "react";
import Modal from "../common/Modal";
import type { IssueItem } from "../../types/issue";

interface IssueDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    issue: IssueItem | null;
    onEdit: (issue: IssueItem) => void;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
    isOpen,
    onClose,
    issue,
    onEdit
}) => {
    if (!issue) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bottleneck Analysis"
            maxWidth="max-w-2xl"
        >
            <div className="bg-white p-8 italic-none font-inter space-y-8">
                {/* ── Blue Hero Card ────────────────────────────────── */}
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Bottleneck Insight</p>
                            <h3 className="text-2xl font-black tracking-tight">{issue.title}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Issue Reference: ISS-{issue.id}</p>
                        </div>
                        <div className="text-right">
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase mb-2 inline-block ${issue.status === "Open" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                Status: {issue.status}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-40">Operational Log</p>
                        </div>
                    </div>
                </div>

                {/* ── Constraint Analytics ────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority Matrix</p>
                        <p className={`text-xl font-black ${issue.priority === "High" ? "text-rose-600" : "text-blue-600"}`}>{issue.priority}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Classification</p>
                        <p className="text-sm font-black text-slate-800 truncate">{issue.category}</p>
                    </div>
                </div>

                {/* ── Technical Breakdown ────────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Constraint Narration</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed italic-none">{issue.description}</p>
                    </div>

                    <div className={`rounded-2xl p-5 border ${issue.status === "Closed" ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"}`}>
                        <p className={`text-[10px] font-black ${issue.status === "Closed" ? "text-emerald-600/60" : "text-amber-600/60"} uppercase tracking-widest mb-2 font-inter`}>Resolution Outcome</p>
                        <p className={`text-sm font-black ${issue.status === "Closed" ? "text-emerald-700" : "text-amber-700"} leading-relaxed italic-none tracking-tight`}>
                            {issue.resolution || "Problem diagnostics active. Awaiting tactical resolution protocol."}
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-slate-100 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Party</span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-600 uppercase">
                                {String(issue.assigned_to || "??").substring(0, 2)}
                            </div>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{issue.assigned_to || "No Lead Assigned"}</span>
                        </div>
                    </div>
                </div>

                {/* ── Action Footer ─────────────────────────────────── */}
                <div className="flex items-center justify-end gap-3 pt-4 font-inter">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                    >
                        Dismiss Insight
                    </button>
                    <button
                        onClick={() => {
                            onEdit(issue);
                        }}
                        className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Modify Registry
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default IssueDetailModal;
