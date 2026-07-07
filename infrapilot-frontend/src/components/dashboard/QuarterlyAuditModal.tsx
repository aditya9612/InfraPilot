import { useState } from "react";
import Modal from "../common/Modal";
import { ArrowRight, BarChart3 } from "lucide-react";

export interface QuarterlyAuditSelection {
    year: number;
    quarter: number;
}

interface QuarterlyAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selection: QuarterlyAuditSelection) => void;
}

const QUARTERS = [
    { value: 1, label: "Q1", range: "Jan – Mar" },
    { value: 2, label: "Q2", range: "Apr – Jun" },
    { value: 3, label: "Q3", range: "Jul – Sep" },
    { value: 4, label: "Q4", range: "Oct – Dec" },
];

const QuarterlyAuditModal = ({ isOpen, onClose, onConfirm }: QuarterlyAuditModalProps) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

    const [year, setYear] = useState(currentYear);
    const [quarter, setQuarter] = useState(currentQuarter);

    const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

    const handleConfirm = () => {
        onConfirm({ year, quarter });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quarterly Audit Summary" maxWidth="max-w-sm">
            <div className="p-4 space-y-5">

                {/* Header badge */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Select Period</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year &amp; Quarter required</p>
                    </div>
                </div>

                {/* Year selector */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Financial Year
                    </label>
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Quarter selector */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Quarter
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {QUARTERS.map(q => (
                            <button
                                key={q.value}
                                type="button"
                                onClick={() => setQuarter(q.value)}
                                className={`flex flex-col items-center gap-0.5 py-3 rounded-xl border text-xs font-black transition-all ${
                                    quarter === q.value
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                                }`}
                            >
                                <span className="text-sm font-black">{q.label}</span>
                                <span className={`text-[9px] font-bold ${quarter === q.value ? "text-white/70" : "text-slate-400"}`}>
                                    {q.range}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected summary */}
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <BarChart3 size={15} className="text-primary" />
                    <span className="text-xs font-black text-primary">
                        {QUARTERS.find(q => q.value === quarter)?.label} {year} &nbsp;·&nbsp; {QUARTERS.find(q => q.value === quarter)?.range}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-[2] px-4 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 group"
                    >
                        View Summary
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default QuarterlyAuditModal;
