import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { Calendar, FileText, Download, ArrowRight, Loader2 } from "lucide-react";

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
    onConfirm: (selection: PLPeriodSelection) => void | Promise<void>;
}

const REPORT_TYPES = [
    { id: "weekly",    label: "Weekly",    icon: "📆" },
    { id: "yearly",    label: "Yearly",    icon: "🗓️" },
    { id: "quarterly", label: "Quarterly", icon: "📊" },
];

const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const isValidCalendarDate = (dateStr: string): boolean => {
    if (!dateStr || typeof dateStr !== "string") return false;
    const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);

    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;

    // Leap year calculation
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (d > daysInMonths[m - 1]) return false;

    const testDate = new Date(y, m - 1, d);
    return testDate.getFullYear() === y && testDate.getMonth() === m - 1 && testDate.getDate() === d;
};

const PLPeriodModal = ({ isOpen, onClose, reportName, format, onConfirm }: PLPeriodModalProps) => {
    const now = new Date();
    const firstDayOfCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const [type, setType] = useState<PLPeriodSelection["type"]>("yearly");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const [year, setYear] = useState(now.getFullYear());
    const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));

    const currentYear = now.getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const startStr = formatLocalDate(weekStart);
            const endStr = formatLocalDate(weekEnd);

            setStartDate(startStr < firstDayOfCurrentMonth ? firstDayOfCurrentMonth : startStr);
            setEndDate(endStr < firstDayOfCurrentMonth ? firstDayOfCurrentMonth : endStr);
            setStartDateError("");
            setEndDateError("");
            setIsGenerating(false);
        }
    }, [isOpen, firstDayOfCurrentMonth]);

    const handleConfirm = async () => {
        if (isGenerating) return;

        const selection: PLPeriodSelection = { type, year };
        if (type === "weekly") {
            if (startDateError || !startDate || !isValidCalendarDate(startDate)) {
                setStartDateError("Please enter a valid date");
                toast.error("Please enter a valid date");
                return;
            }
            if (endDateError || !endDate || !isValidCalendarDate(endDate)) {
                setEndDateError("Please enter a valid date");
                toast.error("Please enter a valid date");
                return;
            }
            if (startDate < firstDayOfCurrentMonth || endDate < firstDayOfCurrentMonth) {
                const msg = "Dates from previous months cannot be selected for the weekly report";
                setStartDateError(startDate < firstDayOfCurrentMonth ? msg : "");
                setEndDateError(endDate < firstDayOfCurrentMonth ? msg : "");
                toast.error(msg);
                return;
            }
            if (endDate < startDate) {
                setEndDateError("End date cannot be before start date");
                toast.error("End date cannot be before start date");
                return;
            }
            selection.start_date = startDate;
            selection.end_date = endDate;
        }
        if (type === "quarterly") selection.quarter = quarter;

        try {
            setIsGenerating(true);
            await onConfirm(selection);
            onClose();
        } catch (error) {
            console.error("Failed to generate report", error);
        } finally {
            setIsGenerating(false);
        }
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
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    min={firstDayOfCurrentMonth}
                                    value={startDate}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (e.target.validity?.badInput) {
                                            setStartDateError("Please enter a valid date");
                                            setStartDate("");
                                            return;
                                        }
                                        if (val && !isValidCalendarDate(val)) {
                                            setStartDateError("Please enter a valid date");
                                        } else if (val && val < firstDayOfCurrentMonth) {
                                            setStartDateError("Dates from previous months cannot be selected for the weekly report");
                                        } else {
                                            setStartDateError("");
                                        }
                                        setStartDate(val);
                                    }}
                                    onBlur={e => {
                                        if (e.target.validity?.badInput || (!e.target.value && e.target.validationMessage)) {
                                            setStartDateError("Please enter a valid date");
                                        }
                                    }}
                                    className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all ${
                                        startDateError ? "border-rose-400 ring-2 ring-rose-400/20" : "border-slate-200"
                                    }`}
                                />
                            </div>
                            {startDateError && (
                                <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 leading-tight">{startDateError}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    min={startDate && startDate > firstDayOfCurrentMonth ? startDate : firstDayOfCurrentMonth}
                                    value={endDate}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (e.target.validity?.badInput) {
                                            setEndDateError("Please enter a valid date");
                                            setEndDate("");
                                            return;
                                        }
                                        if (val && !isValidCalendarDate(val)) {
                                            setEndDateError("Please enter a valid date");
                                        } else if (val && val < firstDayOfCurrentMonth) {
                                            setEndDateError("Dates from previous months cannot be selected for the weekly report");
                                        } else if (startDate && val && val < startDate) {
                                            setEndDateError("End date cannot be before start date");
                                        } else {
                                            setEndDateError("");
                                        }
                                        setEndDate(val);
                                    }}
                                    onBlur={e => {
                                        if (e.target.validity?.badInput || (!e.target.value && e.target.validationMessage)) {
                                            setEndDateError("Please enter a valid date");
                                        }
                                    }}
                                    className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all ${
                                        endDateError ? "border-rose-400 ring-2 ring-rose-400/20" : "border-slate-200"
                                    }`}
                                />
                            </div>
                            {endDateError && (
                                <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 leading-tight">{endDateError}</p>
                            )}
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
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isGenerating}
                        className="flex-[2] px-4 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group">
                        {isGenerating && <Loader2 size={14} className="animate-spin" />}
                        {isGenerating ? "Generating Report..." : "Generate Report"}
                        {!isGenerating && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PLPeriodModal;
