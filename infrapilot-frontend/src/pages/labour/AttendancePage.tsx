import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { labourService } from '../../services/labourService';
import SelfCheckInModal from '../engineer/LabourManagement/components/SelfCheckInModal';
import SelfCheckOutModal from '../engineer/LabourManagement/components/SelfCheckOutModal';
import {
    Clock,
    Calendar,
    MapPin,
    ArrowRight,
    Info,
    ChevronRight,
    Eye,
    X
} from 'lucide-react';

const AttendancePage: React.FC = () => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [historyFilter, setHistoryFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [checkedInState, setCheckedInState] = useState<'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT'>('NOT_CHECKED_IN');
    const [history, setHistory] = useState<any[]>([]);

    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
    const [viewRecord, setViewRecord] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAttendanceData = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            // Fetch today status
            try {
                const todayData = await labourService.getTodayStatus(user.id);
                setTodayRecord(todayData?.attendance || null);

                if (todayData) {
                    const hasCheckedIn = todayData.checked_in === true || (todayData.attendance && todayData.attendance.in_time);
                    const hasCheckedOut = todayData.checked_out === true || (todayData.attendance && todayData.attendance.out_time);
                    
                    if (hasCheckedIn && !hasCheckedOut) {
                        setCheckedInState('CHECKED_IN');
                    } else if (hasCheckedOut) {
                        setCheckedInState('CHECKED_OUT');
                    } else {
                        setCheckedInState('NOT_CHECKED_IN');
                    }
                } else {
                    setCheckedInState('NOT_CHECKED_IN');
                }
            } catch (err) {
                console.warn("Failed to fetch today status", err);
                setTodayRecord(null);
                setCheckedInState('NOT_CHECKED_IN');
            }

            // Fetch history
            try {
                const historyData = await labourService.getSelfAttendances({
                    user_id: user.id,
                    limit: 50
                });
                setHistory(historyData?.items || []);
            } catch (err) {
                console.warn("Failed to fetch history", err);
                setHistory([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [user?.id]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB');
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return "-";
        try {
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) {
                if (/^\d{2}:\d{2}/.test(timeStr)) {
                    return timeStr.slice(0, 5);
                }
                return timeStr;
            }
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timeStr;
        }
    };

    const filteredHistory = history.filter(item => {
        if (historyFilter === 'All') return true;
        const recordDateStr = item.attendance_date;
        if (!recordDateStr) return false;
        
        const recordDate = new Date(recordDateStr);
        const today = new Date();
        
        if (historyFilter === 'Today') {
            return recordDate.toDateString() === today.toDateString();
        }
        if (historyFilter === 'Yesterday') {
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            return recordDate.toDateString() === yesterday.toDateString();
        }
        return true;
    });

    return (
        <>
            <Navbar
                title="Attendance Management"
                breadcrumb={['Labour', 'Attendance Management']}
            />
            <PageTransition className="bg-[#f8fafc] min-h-screen font-inter">
                <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 pb-20">

                    {/* Header Summary Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#7c7cfc] flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Clock className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Management</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <p className="text-sm font-bold text-slate-500">
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })} | {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="space-y-6">

                        {/* Attendance Status Card */}
                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0062ff] opacity-[0.02] rounded-full -mr-32 -mt-32 blur-3xl" />

                            <div className="relative z-10">
                                <h2 className="text-lg font-black text-slate-800 tracking-tight mb-1">Today's Status</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">Your attendance status for today</p>

                                <div className="flex items-center gap-2 text-slate-600 mb-12">
                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-bold">
                                        {checkedInState === 'CHECKED_IN' && todayRecord ? `Checked in at ${todayRecord.check_in_address || "Site"}` :
                                         checkedInState === 'CHECKED_OUT' && todayRecord ? `Checked out from ${todayRecord.check_out_address || "Site"}` :
                                         "Location not active"}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                    <div className="w-24 h-24 rounded-full border-[6px] border-slate-50 flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border border-slate-200" />
                                        <Info className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-400 tracking-tight">
                                        {loading ? "Loading today's status..." : 
                                         checkedInState === 'CHECKED_IN' ? `Checked In at ${formatTime(todayRecord?.in_time)}` :
                                         checkedInState === 'CHECKED_OUT' ? "Shift Completed for Today." : 
                                         "Not Checked in Yet."}
                                    </p>
                                </div>

                                {loading ? (
                                    <button disabled className="w-full bg-slate-100 text-slate-400 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-3 cursor-not-allowed">
                                        Loading...
                                    </button>
                                ) : checkedInState === 'CHECKED_OUT' ? (
                                    <button disabled className="w-full bg-slate-100 text-slate-400 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-3 cursor-not-allowed">
                                        Shift Completed
                                    </button>
                                ) : checkedInState === 'CHECKED_IN' ? (
                                    <button 
                                        onClick={() => setIsCheckOutOpen(true)}
                                        className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-rose-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] group/btn"
                                    >
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        Check Out
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsCheckInOpen(true)}
                                        className="w-full bg-[#0062ff] hover:bg-[#0056e0] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] group/btn"
                                    >
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        Check In
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Attendance History Card */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance History</h2>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Your Attendance records</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="text-base font-black text-slate-800 tracking-tight">Quick Filters</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {['All', 'Today', 'Yesterday'].map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setHistoryFilter(filter)}
                                                className={`px-8 py-3 rounded-2xl text-sm font-black transition-all border ${historyFilter === filter
                                                        ? 'bg-[#0062ff] text-white border-transparent shadow-xl shadow-blue-100'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            {[
                                                'labour name', 'task id', 'worker code', 'attendance date',
                                                'in time', 'out time', 'working hours', 'overtime hours', 'action'
                                            ].map(head => (
                                                <th key={head} className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">
                                                    {head}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={9} className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                    Loading history...
                                                </td>
                                            </tr>
                                        ) : filteredHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                                                            <Info className="w-8 h-8 text-slate-200" />
                                                        </div>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No records found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistory.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.labour_name || item.name || user?.name || "Self"}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{item.task_id || "-"}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{item.worker_code || "-"}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">
                                                        {formatDate(item.attendance_date)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-emerald-600 font-bold">
                                                        {formatTime(item.in_time)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-rose-500 font-bold">
                                                        {formatTime(item.out_time)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{item.working_hours ?? "0"} hrs</td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{item.overtime_hours ?? "0"} hrs</td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => { setViewRecord(item); setIsViewModalOpen(true); }}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50" disabled>
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <span className="w-8 h-8 rounded-lg bg-[#0062ff] text-white flex items-center justify-center text-xs font-black">1</span>
                                    </div>
                                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50" disabled>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sorted by Date (Latest First)</p>
                            </div>
                        </div>

                    </div>
                </div>
            </PageTransition>

            <SelfCheckInModal 
                isOpen={isCheckInOpen}
                onClose={() => setIsCheckInOpen(false)}
                onSuccess={fetchAttendanceData}
            />

            <SelfCheckOutModal 
                isOpen={isCheckOutOpen}
                onClose={() => setIsCheckOutOpen(false)}
                onSuccess={fetchAttendanceData}
                attendanceId={todayRecord?.id}
            />

            {/* View Attendance Detail Modal */}
            {isViewModalOpen && viewRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
                    <div className="relative bg-white rounded-[28px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Attendance Details</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {formatDate(viewRecord.attendance_date)}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Labour Name', value: viewRecord.labour_name || viewRecord.name || user?.name || 'Self' },
                                { label: 'Task ID', value: viewRecord.task_id || '-' },
                                { label: 'Worker Code', value: viewRecord.worker_code || '-' },
                                { label: 'Attendance Date', value: formatDate(viewRecord.attendance_date) },
                                { label: 'In Time', value: formatTime(viewRecord.in_time), color: 'text-emerald-600' },
                                { label: 'Out Time', value: formatTime(viewRecord.out_time), color: 'text-rose-500' },
                                { label: 'Working Hours', value: `${viewRecord.working_hours ?? '0'} hrs` },
                                { label: 'Overtime Hours', value: `${viewRecord.overtime_hours ?? '0'} hrs` },
                                { label: 'Check-In Address', value: viewRecord.check_in_address || '-' },
                                { label: 'Check-Out Address', value: viewRecord.check_out_address || '-' },
                            ].map((field, i) => (
                                <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</span>
                                    <span className={`text-sm font-bold ${(field as any).color || 'text-slate-700'}`}>{field.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-full py-3.5 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AttendancePage;
