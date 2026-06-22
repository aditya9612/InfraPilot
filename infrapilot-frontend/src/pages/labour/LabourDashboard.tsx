import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import AttendanceCard from '../../components/labour/AttendanceCard';
import TaskList from '../../components/labour/TaskList';
import TaskDetailModal from '../../components/labour/TaskDetailModal';
import PageTransition from '../../components/common/PageTransition';
import Navbar from '../../components/common/Navbar';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import type { LabourDashboardData } from '../../services/dashboardService';
import { useEffect } from 'react';
import {
    Clipboard,
    CheckCircle,
    XCircle,
    AlertCircle,
    Volume2,
    Briefcase,
    User,
    TrendingUp,
    ArrowRight,
    Play
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
    id: string;
    name: string;
    project: string;
    contractorId?: string;
    assignedFrom?: 'Self' | 'Site Engineer';
    description: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Hold';
    priority: 'High' | 'Medium' | 'Low';
    startDate: string;
    endDate: string;
    progress: number;
}

const LabourDashboard: React.FC = () => {
    const { user } = useAuth();
    const { speak } = useTextToAudio();
    const navigate = useNavigate();
    const [isPresent, setIsPresent] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState<LabourDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await dashboardService.getLabourDashboard();
                if (response.success) {
                    setDashboardData(response.data);
                    setIsPresent(response.data.check_in_status === 'PRESENT');
                    
                    // Map recent tasks from API
                    const mappedTasks: Task[] = response.data.recent_tasks.map((t: any) => ({
                        id: t.id || `T-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                        name: t.name || 'UNNAMED TASK',
                        project: response.data.project_name || 'NO PROJECT',
                        description: t.description || '',
                        status: t.status || 'Pending',
                        priority: t.priority || 'Medium',
                        startDate: t.start_date || '',
                        endDate: t.end_date || '',
                        progress: t.progress || 0
                    }));
                    setTasks(mappedTasks);
                }
            } catch (error) {
                console.error('Error fetching labour dashboard:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleUpdateTask = (_id: string, status: string) => {
        toast.success(`Task ${status}!`);
        setIsTaskModalOpen(false);
    };

    const stats = [
        { label: 'Total Tasks', value: dashboardData?.total_tasks || 0, icon: Clipboard, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Completed', value: dashboardData?.completed_tasks || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Pending', value: dashboardData?.pending_tasks || 0, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'This Month Earnings', value: `₹${dashboardData?.this_month_earnings?.toLocaleString() || '0'}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ];

    const quickActions = [
        { label: 'Check In', icon: CheckCircle, color: 'bg-emerald-500', onClick: () => navigate('/labour/attendance') },
        { label: 'Check Out', icon: XCircle, color: 'bg-rose-500', onClick: () => navigate('/labour/attendance') },
        { label: 'View Tasks', icon: Clipboard, color: 'bg-blue-500', onClick: () => navigate('/labour/tasks') },
        { label: 'Work Updates', icon: Play, color: 'bg-indigo-500', onClick: () => navigate('/labour/work-updates') },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar
                title="Labour Portal"
                breadcrumb={['InfraPilot', 'Dashboard']}
            />
            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-20">
                {/* ── Welcome & Top Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-2xl shadow-sm">
                                👋
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                        Welcome, {dashboardData?.user_name || user?.name || 'User'}
                                    </h1>
                                    <button onClick={() => speak(`Welcome, ${dashboardData?.user_name || user?.name || 'User'}`)} className="text-slate-300 hover:text-indigo-500">
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                        {dashboardData?.project_name || 'No Project Assigned'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <User className="w-3.5 h-3.5 text-emerald-500" />
                                        {dashboardData?.contractor_name || 'Independent'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center lg:justify-end">
                        <AttendanceCard
                            isPresent={isPresent}
                            onPresent={() => { setIsPresent(true); toast.success("Marked as Present"); }}
                            onAbsent={() => { setIsPresent(false); toast.error("Marked as Absent"); }}
                        />
                    </div>
                </div>

                {/* ── Statistics Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                            <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className="text-xl md:text-2xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Main Dashboard Layout ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column: Tasks & Quick Actions */}
                    <div className="xl:col-span-12 space-y-8">
                        {/* Quick Action Grid */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 px-1">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Quick Actions</h2>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={action.onClick}
                                        className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:bg-slate-50 transition-all hover:-translate-y-1 active:translate-y-0"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-lg shadow-current/20`}>
                                            <action.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div>
                            <div className="flex justify-between items-center mb-6 px-1">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Tasks</h2>
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group">
                                    View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <TaskList
                                tasks={tasks}
                                onSelectTask={(t) => { setSelectedTask(t as any); setIsTaskModalOpen(true); }}
                                onSelfAssign={(id) => handleUpdateTask(id, 'In Progress')}
                            />
                        </div>

                        {/* Recent Activities */}
                        <div>
                            <div className="flex justify-between items-center mb-6 px-1">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Activities</h2>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6">
                                {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
                                    <div className="space-y-6">
                                        {dashboardData.recent_activity.map((activity: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                                        activity.type === 'Task' ? 'bg-blue-50 text-blue-600' :
                                                        activity.type === 'Attendance' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-slate-50 text-slate-600'
                                                    }`}>
                                                        {activity.type === 'Task' ? <Clipboard className="w-5 h-5" /> :
                                                         activity.type === 'Attendance' ? <CheckCircle className="w-5 h-5" /> :
                                                         <Briefcase className="w-5 h-5" />}
                                                    </div>
                                                    {idx !== dashboardData.recent_activity.length - 1 && (
                                                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-100" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-800 mb-0.5">{activity.description}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.time || 'Just now'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                                            <TrendingUp className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No activities yet</h3>
                                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Your recent work updates and attendance will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activity & Payments */}
                    <div className="xl:col-span-12 space-y-8">
                    </div>
                </div>

                <TaskDetailModal
                    isOpen={isTaskModalOpen}
                    task={selectedTask}
                    onClose={() => setIsTaskModalOpen(false)}
                    onUpdateStatus={handleUpdateTask}
                />
            </PageTransition>
        </>
    );
};

export default LabourDashboard;
