import React from 'react';
import { MapPin } from 'lucide-react';

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
        <div className="bg-white p-1.5 pl-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{isCheckedIn ? 'Checked In' : 'Checked Out'}</span>
                </div>
            </div>

            {isCheckedIn ? (
                <button
                    onClick={onCheckOut}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isCheckedIn
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-100 active:scale-95'
                        : 'bg-rose-50 text-rose-600 border border-rose-100 cursor-default'
                        }`}
                >
                    Check Out
                </button>
            ) : (
                <button
                    onClick={onCheckIn}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${!isCheckedIn
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100 active:scale-95'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                        }`}
                >
                    <MapPin className="w-3 h-3" />
                    Checked In
                </button>
            )}
        </div>
    );
};

export default AttendanceCard;
