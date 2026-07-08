import React from 'react';

interface AttendanceCardProps {
    isCheckedIn: boolean;
    onCheckIn: () => void;
    onCheckOut: () => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
    isCheckedIn,
    onCheckIn,
    onCheckOut
}) => {
    return (
        <div className="bg-white p-1.5 px-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm font-inter">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                    onClick={isCheckedIn ? undefined : onCheckIn}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                        isCheckedIn
                            ? "bg-emerald-500 text-white shadow-sm border border-emerald-500 cursor-default"
                            : "text-slate-400 hover:text-slate-600 cursor-pointer"
                    }`}
                >
                    Checked In
                </button>
                <button
                    onClick={!isCheckedIn ? undefined : onCheckOut}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                        !isCheckedIn
                            ? "bg-emerald-500 text-white shadow-sm border border-emerald-500 cursor-default"
                            : "text-slate-400 hover:text-slate-600 cursor-pointer"
                    }`}
                >
                    Checked Out
                </button>
            </div>
        </div>
    );
};

export default AttendanceCard;
