import React from 'react';
import { UserCheck, UserX } from 'lucide-react';

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
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
            <button
                onClick={onCheckIn}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    isCheckedIn
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                }`}
            >
                <UserCheck className="w-3.5 h-3.5" />
                Present
            </button>
            <button
                onClick={onCheckOut}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    !isCheckedIn
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                }`}
            >
                <UserX className="w-3.5 h-3.5" />
                Absent
            </button>
        </div>
    );
};

export default AttendanceCard;
