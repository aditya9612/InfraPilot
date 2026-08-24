import { useState } from "react";
import Modal from "../common/Modal";
import { Calendar, Download, FileText, ArrowRight, Filter } from "lucide-react";

export interface IssueFilterSelection {
    status: string | null;
    priority: string | null;
    start_date: string | null;
    end_date: string | null;
}

interface IssueFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    format: "PDF" | "Excel";
    onConfirm: (filters: IssueFilterSelection) => void;
}

const STATUS_OPTIONS = ["OPEN", "CLOSED"];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];

const IssueFilterModal = ({ isOpen, onClose, format, onConfirm }: IssueFilterModalProps) => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    const [status, setStatus] = useState<string>("");
    const [priority, setPriority] = useState<string>("");
    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(today);

    const handleConfirm = () => {
        onConfirm({
            status: status || null,
            priority: priority || null,
            start_date: startDate || null,
            end_date: endDate || null,
        });
        onClose();
    };

    const handleReset = () => {
        setStatus("");
        setPriority("");
        setStartDate(firstOfMonth);
        setEndDate(today);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Site Issues Report — Filters" maxWidth="max-w-md">
            <div className="p-4 space-y-5">

                {/* Format badge */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${format === "PDF" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
                        {format === "PDF" ? <Download size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">{format} Export</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter issues before exporting</p>
                    </div>
                </div>

                {/* Status filter */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setStatus("")}
                            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${status === ""
                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                                }`}
                        >
                            All
                        </button>
                        {STATUS_OPTIONS.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${status === s
                                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                                    }`}
                            >
                                {s.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Priority filter */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Priority
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setPriority("")}
                            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${priority === ""
                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                                }`}
                        >
                            All
                        </button>
                        {PRIORITY_OPTIONS.map(p => {
                            const color =
                                p === "HIGH" ? "bg-rose-50 text-rose-600 border-rose-200" :
                                    p === "MEDIUM" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                        "bg-emerald-50 text-emerald-600 border-emerald-200";
                            const activeColor =
                                p === "HIGH" ? "bg-rose-500 text-white border-rose-500" :
                                    p === "MEDIUM" ? "bg-amber-500 text-white border-amber-500" :
                                        "bg-emerald-500 text-white border-emerald-500";
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${priority === p ? activeColor : color
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            Start Date
                        </label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            End Date
                        </label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleReset}
                        className="px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <Filter size={13} />
                        Reset
                    </button>
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
                        Export Report
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default IssueFilterModal;
