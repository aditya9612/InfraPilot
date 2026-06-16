import React from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { Calendar, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

interface AttendanceRecord {
    date: string;
    checkIn: string;
    checkOut: string;
    hours: string;
    status: 'Present' | 'Absent' | 'Half Day';
}

const AttendanceHistoryPage: React.FC = () => {
    const history: AttendanceRecord[] = [
        { date: '01 Jun 2026', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h', status: 'Present' },
        { date: '02 Jun 2026', checkIn: '09:15 AM', checkOut: '06:30 PM', hours: '9h 15m', status: 'Present' },
        { date: '03 Jun 2026', checkIn: '09:00 AM', checkOut: '01:00 PM', hours: '4h', status: 'Half Day' },
        { date: '04 Jun 2026', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h', status: 'Present' },
        { date: '05 Jun 2026', checkIn: '09:10 AM', checkOut: '06:05 PM', hours: '8h 55m', status: 'Present' },
        { date: '06 Jun 2026', checkIn: '—', checkOut: '—', hours: '—', status: 'Absent' },
    ];

    return (
        <>
            <Navbar title="Attendance History" breadcrumb={['InfraPilot', 'Labour', 'History']} />
            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-20">
                <div className="w-full h-full">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Records</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Review your past attendance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input placeholder="Search date..." className="text-xs bg-transparent outline-none font-bold text-slate-600" />
                            </div>
                            <button className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                                <Filter className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Present', value: '18', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Absent', value: '2', color: 'text-rose-600', bg: 'bg-rose-50' },
                            { label: 'Half Day', value: '1', color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.bg} p-4 rounded-3xl border border-white/50 shadow-sm`}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* History List */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-50">
                            {history.map((record, i) => (
                                <div key={i} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{record.date.split(' ')[1]}</span>
                                            <span className="text-lg font-black text-slate-800 leading-none">{record.date.split(' ')[0]}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{record.date}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Calendar className="w-3 h-3 text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.hours} Worked</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="flex flex-col items-start md:items-end">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-xs font-black text-slate-700">{record.checkIn}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                                <span className="text-xs font-black text-slate-700">{record.checkOut}</span>
                                            </div>
                                        </div>
                                        <div className="min-w-[100px] text-right">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : record.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50/50 text-center">
                            <button className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
                                Load Previous Month Records
                            </button>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default AttendanceHistoryPage;
