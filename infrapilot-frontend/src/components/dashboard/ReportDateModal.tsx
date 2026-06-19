import { useState } from "react";
import Modal from "../common/Modal";
import { Calendar, Download, FileText, ArrowRight } from "lucide-react";

interface ReportDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName: string;
    isRange?: boolean;
    onConfirm: (startDate: string, endDate: string) => void;
    format: "PDF" | "Excel";
}

const ReportDateModal = ({
    isOpen,
    onClose,
    reportName,
    isRange = true,
    onConfirm,
    format
}: ReportDateModalProps) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfYear = `${new Date().getFullYear()}-01-01`;

    const [startDate, setStartDate] = useState(firstDayOfYear);
    const [endDate, setEndDate] = useState(today);

    const handleConfirm = () => {
        onConfirm(startDate, endDate);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={reportName}
            maxWidth="max-w-md"
        >
            <div className="p-4">
                <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${format === 'PDF' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {format === 'PDF' ? <Download size={24} /> : <FileText size={24} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800">{format} Export</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select time period for generation</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {isRange ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-3">
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
                        Generate Report
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportDateModal;
