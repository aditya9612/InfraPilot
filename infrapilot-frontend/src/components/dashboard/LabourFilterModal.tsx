import { useState } from "react";
import Modal from "../common/Modal";
import { Calendar, Download, FileText, ArrowRight, Filter, Users } from "lucide-react";

export interface LabourFilterSelection {
    date: string | null;
    skill_category: string | null;
}

interface LabourFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    format: "PDF" | "Excel";
    onConfirm: (filters: LabourFilterSelection) => void;
}

const SKILL_CATEGORIES = ["SKILLED", "UNSKILLED", "SEMI_SKILLED", "SUPERVISOR", "ENGINEER"];

const LabourFilterModal = ({ isOpen, onClose, format, onConfirm }: LabourFilterModalProps) => {
    const today = new Date().toISOString().split("T")[0];
    const [date, setDate] = useState(today);
    const [skillCategory, setSkillCategory] = useState("");

    const handleConfirm = () => {
        onConfirm({
            date: date || null,
            skill_category: skillCategory || null,
        });
        onClose();
    };

    const handleReset = () => {
        setDate(today);
        setSkillCategory("");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Labour Distribution — Filters" maxWidth="max-w-md">
            <div className="p-4 space-y-5">

                {/* Format badge */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${format === "PDF" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
                        {format === "PDF" ? <Download size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">{format} Export</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter labour data before exporting</p>
                    </div>
                </div>

                {/* Date filter */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Attendance Date
                    </label>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">Specific date for attendance filter</p>
                </div>

                {/* Skill category filter */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Skill Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSkillCategory("")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                                skillCategory === ""
                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                            }`}
                        >
                            <Users size={12} />
                            All
                        </button>
                        {SKILL_CATEGORIES.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSkillCategory(s)}
                                className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                                    skillCategory === s
                                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary"
                                }`}
                            >
                                {s.replace("_", " ")}
                            </button>
                        ))}
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

export default LabourFilterModal;
