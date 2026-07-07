import { useState } from "react";
import Modal from "../common/Modal";
import { Calendar, Download, FileText, ArrowRight, Filter } from "lucide-react";

export interface AssetFilterSelection {
    start_date: string | null;
    end_date: string | null;
    min_value: number | null;
    max_value: number | null;
}

interface AssetFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    format: "PDF" | "Excel";
    onConfirm: (filters: AssetFilterSelection) => void;
}

const AssetFilterModal = ({ isOpen, onClose, format, onConfirm }: AssetFilterModalProps) => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [minValue, setMinValue] = useState("");
    const [maxValue, setMaxValue] = useState("");

    const handleConfirm = () => {
        onConfirm({
            start_date: startDate || null,
            end_date: endDate || null,
            min_value: minValue !== "" ? Number(minValue) : null,
            max_value: maxValue !== "" ? Number(maxValue) : null,
        });
        onClose();
    };

    const handleReset = () => {
        setStartDate(firstOfMonth);
        setEndDate(today);
        setMinValue("");
        setMaxValue("");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fixed Assets Report — Filters" maxWidth="max-w-md">
            <div className="p-4 space-y-5">

                {/* Format badge */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${format === "PDF" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
                        {format === "PDF" ? <Download size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">{format} Export</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter assets before exporting</p>
                    </div>
                </div>

                {/* Purchase Date Range */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Purchase Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1">Start Date</label>
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
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1">End Date</label>
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
                </div>

                {/* Value Range */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Current Value Range (₹)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1">Min Value</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="e.g. 10000"
                                value={minValue}
                                onChange={e => setMinValue(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1">Max Value</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="e.g. 500000"
                                value={maxValue}
                                onChange={e => setMaxValue(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
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

export default AssetFilterModal;
