import React from 'react';
import { UserCheck, UserX } from 'lucide-react';

interface AttendanceCardProps {
    isPresent: boolean;
    onPresent: () => void;
    onAbsent: () => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
    isPresent,
    onPresent,
    onAbsent
}) => {
    return (
        <div className="bg-white p-1.5 pl-4 rounded-2xl border border-slate-200 flex items-center gap-6 shadow-sm">
            <div className="flex items-center gap-3 pr-2 border-r border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onPresent}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isPresent
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100 active:scale-95'
                        }`}
                >
                    <UserCheck className="w-3 h-3" />
                    Present
                </button>
                <button
                    onClick={onAbsent}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${!isPresent
                            ? 'bg-rose-50 text-rose-600 border border-rose-100 cursor-default'
                            : 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-100 active:scale-95'
                        }`}
                >
                    <UserX className="w-3 h-3" />
                    Absent
                </button>
            </div>
        </div>
    );
};

export default AttendanceCard;

