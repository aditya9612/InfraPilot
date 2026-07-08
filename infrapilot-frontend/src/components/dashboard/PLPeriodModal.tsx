import { useState } from "react";
import Modal from "../common/Modal";
import { Calendar, FileText, Download, ArrowRight } from "lucide-react";

export interface PLPeriodSelection {
    type: "weekly" | "yearly" | "quarterly";
    start_date?: string;
    end_date?: string;
    year?: number;
    quarter?: number;
}

interface PLPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName: string;
    format: "PDF" | "Excel";
    onConfirm: (selection: PLPeriodSelection) => void;
}

const REPORT_TYPES = [
    { id: "weekly",    label: "Weekly",    icon: "📆" },
    { id: "yearly",    label: "Yearly",    icon: "🗓️" },
    { id: "quarterly", label: "Quarterly", icon: "📊" },
];

const PLPeriodModal = ({ isOpen, onClose, reportName, format, onConfirm }: PLPeriodModalProps) => {
    const now = new Date();
    const [type, setType] = useState<PLPeriodSelection["type"]>("yearly");

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const [startDate, setStartDate] = useState(weekStart.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(weekEnd.toISOString().split("T")[0]);

    const [year, setYear] = useState(now.getFullYear());
    const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));

    const currentYear = now.getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

    const handleConfirm = () => {
        const selection: PLPeriodSelection = { type, year };
        if (type === "weekly") { selection.start_date = startDate; selection.end_date = endDate; }
        if (type === "quarterly") selection.quarter = quarter;
        onConfirm(selection);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${reportName} — Select Period`} maxWidth="max-w-md">
            <div className="p-4 space-y-5">
                {/* Format badge */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${format === "PDF" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
                        {format === "PDF" ? <Download size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">{format} Export</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choose report period</p>
                    </div>
                </div>

                {/* Type selector */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Report Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {REPORT_TYPES.map(t => (
                            <button key={t.id} type="button"
                                onClick={() => setType(t.id as PLPeriodSelection["type"])}
                                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-black transition-all ${
                                    type === t.id
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                                }`}
                            >
                                <span className="text-lg">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Weekly date range */}
                {type === "weekly" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Yearly — only year selector */}
                {type === "yearly" && (
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Year</label>
                        <select value={year} onChange={e => setYear(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}

                {/* Quarterly */}
                {type === "quarterly" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quarter</label>
                            <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none">
                                <option value={1}>Q1 (Jan–Mar)</option>
                                <option value={2}>Q2 (Apr–Jun)</option>
                                <option value={3}>Q3 (Jul–Sep)</option>
                                <option value={4}>Q4 (Oct–Dec)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Year</label>
                            <select value={year} onChange={e => setYear(Number(e.target.value))}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95">
                        Cancel
                    </button>
                    <button onClick={handleConfirm}
                        className="flex-[2] px-4 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 group">
                        Generate Report
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PLPeriodModal;
