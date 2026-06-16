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
    Search
} from 'lucide-react';

const AttendancePage: React.FC = () => {
    const [view, setView] = useState<'self' | 'labour'>('self');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [historyFilter, setHistoryFilter] = useState('Today');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

                    {/* View Switcher Tabs */}
                    <div className="flex justify-center">
                        <div className="bg-white p-1.5 rounded-full border border-slate-100 shadow-sm flex items-center min-w-[320px]">
                            <button 
                                onClick={() => setView('self')}
                                className={`flex-1 py-3 px-6 rounded-full text-xs font-black transition-all ${
                                    view === 'self' 
                                    ? 'bg-[#7c7cfc] text-white shadow-lg shadow-indigo-100' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Self Attendance
                            </button>
                            <button 
                                onClick={() => setView('labour')}
                                className={`flex-1 py-3 px-6 rounded-full text-xs font-black transition-all ${
                                    view === 'labour' 
                                    ? 'bg-[#7c7cfc] text-white shadow-lg shadow-indigo-100' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Labour Attendance
                            </button>
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
                                    <span className="text-xs font-bold italic">Location not available</span>
                                </div>

                                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                    <div className="w-24 h-24 rounded-full border-[6px] border-slate-50 flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border border-slate-200" />
                                        <Info className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-400 tracking-tight">Not Checked in Yet.</p>
                                </div>

                                <button className="w-full bg-[#0062ff] hover:bg-[#0056e0] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] group/btn">
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    Check In
                                </button>
                            </div>
                        </div>

                        {/* Attendance History Card */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 pb-4">
                                <h2 className="text-lg font-black text-slate-800 tracking-tight mb-1">Attendance History</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Attendance Records</p>
                                
                                <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest whitespace-nowrap">Quick Filters</span>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                            {['Today', 'Yesterday', 'All', 'Date'].map(filter => (
                                                <button 
                                                    key={filter}
                                                    onClick={() => setHistoryFilter(filter)}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap flex items-center gap-2 ${
                                                        historyFilter === filter 
                                                        ? 'bg-[#0062ff] text-white border-transparent shadow-md' 
                                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    {filter === 'Date' && <Calendar className="w-3.5 h-3.5" />}
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                            <Search className="w-4 h-4 text-slate-300" />
                                            <input 
                                                type="text" 
                                                placeholder="Search records..." 
                                                className="bg-transparent outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300 w-40 md:w-56"
                                            />
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Showing 0 records
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            {[
                                                'labour_id', 'labour_name', 'worker_code', 'attendance_date', 
                                                'in_time', 'out_time', 'working_hours', 'overtime_hours', 
                                                'task_id', 'check_in_address', 'check_out_address'
                                            ].map(head => (
                                                <th key={head} className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">
                                                    {head.replace(/_/g, ' ')}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colSpan={11} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                                                        <Info className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No records found</p>
                                                </div>
                                            </td>
                                        </tr>
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
        </>
    );
};

export default AttendancePage;
