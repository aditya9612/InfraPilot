import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import {
    Clock,
    Calendar,
    MapPin,
    ArrowRight,
    Info,
    ChevronRight,
    Loader2,
    User
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { AttendanceRecord, TodayStatusResponse } from '../../services/attendanceService';
import toast from 'react-hot-toast';
import CheckInModal from '../../components/labour/CheckInModal';
import CheckOutModal from '../../components/labour/CheckOutModal';

const AttendancePage: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [historyFilter, setHistoryFilter] = useState('All');
    const [statusData, setStatusData] = useState<TodayStatusResponse | null>(null);
    const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [status, list] = await Promise.all([
                attendanceService.getTodayStatus(),
                attendanceService.getListAttendance({ page_size: 10 })
            ]);
            setStatusData(status);
            setAttendanceList(list.data);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            toast.error('Failed to load attendance details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCheckIn = async (data: any) => {
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('attendance_date', new Date().toISOString().split('T')[0]);
            formData.append('project_id', "1"); // Static or from context
            formData.append('status', 'present');
            formData.append('in_time', new Date().toISOString());
            formData.append('check_in_latitude', data.latitude?.toString() || "");
            formData.append('check_in_longitude', data.longitude?.toString() || "");
            formData.append('check_in_address', data.resolved_address || data.location_address || "");
            formData.append('task_id', data.task_id || "");
            formData.append('task_description', data.task_description || "");
            
            if (data.check_in_image) {
                // Convert base64 to file if needed or handle accordingly
                const blob = await (await fetch(data.check_in_image)).blob();
                formData.append('check_in_image', blob, 'checkin.png');
            }

            await attendanceService.checkIn(formData);
            toast.success('Check-in successful!');
            fetchData();
            setIsCheckInModalOpen(false);
        } catch (error) {
            console.error('Check-in error:', error);
            toast.error('Check-in failed');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCheckOut = async (data: any) => {
        if (!statusData?.attendance?.id) return;
        setIsActionLoading(true);
        try {
            await attendanceService.checkOut(statusData.attendance.id, {
                out_time: new Date().toISOString(),
                check_out_address: data.location_address || "Pune", // Static or dynamic
                remarks: data.remarks || "Work completed",
                status: 'present'
            });
            toast.success('Check-out successful!');
            fetchData();
            setIsCheckOutModalOpen(false);
        } catch (error) {
            console.error('Check-out error:', error);
            toast.error('Check-out failed');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#0062ff] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Employee Logs...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar
                title="Attendance Management"
                breadcrumb={['Engineer', 'Human Resources', 'Attendance Management']}
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

                                <div className="flex items-center gap-2 text-slate-400 mb-12">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-xs font-bold italic">
                                        {statusData?.attendance?.check_in_address || "Location not available"}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                    {statusData?.checked_in ? (
                                        <>
                                            <div className="w-24 h-24 rounded-full border-[6px] border-emerald-50 flex items-center justify-center relative">
                                                <div className="absolute inset-0 rounded-full border border-emerald-200 animate-ping opacity-20" />
                                                <div className="absolute inset-0 rounded-full border border-emerald-400" />
                                                <Clock className="w-10 h-10 text-emerald-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-800 tracking-tight">Active Shift</p>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Checked in at {new Date(statusData.attendance?.in_time || "").toLocaleTimeString()}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-24 h-24 rounded-full border-[6px] border-slate-50 flex items-center justify-center relative">
                                                <div className="absolute inset-0 rounded-full border border-slate-200" />
                                                <Info className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-black text-slate-400 tracking-tight">Not Checked in Yet.</p>
                                        </>
                                    )}
                                </div>

                                {statusData?.checked_in ? (
                                    <button 
                                        onClick={() => setIsCheckOutModalOpen(true)}
                                        disabled={statusData.checked_out || isActionLoading}
                                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-rose-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                    >
                                        {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        {statusData.checked_out ? "Already Checked Out" : "Check Out"}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsCheckInModalOpen(true)}
                                        disabled={isActionLoading}
                                        className="w-full bg-[#0062ff] hover:bg-[#0056e0] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                    >
                                        {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
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
                                        {['Today', 'Yesterday', 'All', 'Date'].map(filter => (
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
                                                'date', 'labour name', 'labour Id', 'Department', 
                                                'work location', 'checkin', 'checkout', 'hours', 
                                                'location', 'selfie', 'status', 'work summary'
                                            ].map(head => (
                                                <th key={head} className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">
                                                    {head}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceList.length > 0 ? (
                                            attendanceList.map((record) => (
                                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                                                        {record.attendance_date}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                                {record.full_name?.charAt(0) || 'L'}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{record.full_name || 'Labour'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-500">
                                                        #{record.user_id || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                                                        {/* Department Placeholder */}
                                                        Site Ops
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                                                        {record.work_location_type || 'Field'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                                                        {record.in_time ? new Date(record.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600">
                                                        {record.out_time ? new Date(record.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-800">
                                                        {record.working_hours || 0} hrs
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <p className="text-[10px] font-bold text-slate-400 max-w-[150px] truncate" title={record.check_in_address || ''}>
                                                            {record.check_in_address || 'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${record.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {record.is_approved ? 'Approved' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                                                        {record.work_summary || 'No summary'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={12} className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                                                            <Info className="w-8 h-8 text-slate-200" />
                                                        </div>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No records found</p>
                                                    </div>
                                                </td>
                                            </tr>
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

            <CheckInModal 
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                onSubmit={handleCheckIn}
                projectId={1}
            />

            <CheckOutModal
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                onSubmit={handleCheckOut}
                attendanceId={statusData?.attendance?.id || 0}
            />
        </>
    );
};

export default AttendancePage;
