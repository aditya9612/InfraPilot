import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import AttendanceCard from '../../components/labour/AttendanceCard';
import TaskList from '../../components/labour/TaskList';
import TaskDetailModal from '../../components/labour/TaskDetailModal';
import PageTransition from '../../components/common/PageTransition';
import Navbar from '../../components/common/Navbar';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { attendanceService } from '../../services/attendanceService';
import type { Task } from '../../types/task';
import {
    Clipboard,
    CheckCircle,
    AlertCircle,
    Calendar,
    Volume2,
    Briefcase,
    User,
    TrendingUp,
    ArrowRight,
    Camera,
    Play,
    Loader2,
    Activity,
    Clock,
    Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RecentActivity {
    title: string;
    description: string;
    time: string;
}

const formatDateTimeDisplay = (rawTime?: string) => {
    if (!rawTime) {
        return { time: '--:--', date: '--/--/----' };
    }

    const trimmed = rawTime.trim();

    // 1. Check if ISO string or parseable Date string
    const d = new Date(trimmed);
    if (!isNaN(d.getTime()) && (trimmed.includes('-') || trimmed.includes('T') || (trimmed.includes('/') && trimmed.length > 8))) {
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const timeFormatted = `${formattedHours}:${formattedMinutes} ${ampm}`;

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const dateFormatted = `${day}/${month}/${year}`;

        return { time: timeFormatted, date: dateFormatted };
    }

    // 2. Check if it's already a time string like "07:51 AM"
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return { time: trimmed, date: `${day}/${month}/${year}` };
    }

    // 3. Check if it's a date string like "16 JUL 2026"
    const monthMap: Record<string, string> = {
        JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
        JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 3 && monthMap[parts[1].toUpperCase()]) {
        const day = parts[0].padStart(2, '0');
        const month = monthMap[parts[1].toUpperCase()];
        const year = parts[2];
        return { time: '12:00 PM', date: `${day}/${month}/${year}` };
    }

    return { time: trimmed, date: '' };
};

const LabourDashboard: React.FC = () => {
    const { user } = useAuth();
    const { speak } = useTextToAudio();
    const navigate = useNavigate();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [_isCheckedOut, setIsCheckedOut] = useState(false);
    const [selectedTask, _setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [statsData, setStatsData] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        earnings: '₹0'
    });
    const [projectName, setProjectName] = useState<string>('Urban Heights');
    const [contractorName, setContractorName] = useState<string>('M/S Sharma Contractors');

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const data = await dashboardService.getLabourDashboard();
                console.log('LabourDashboard: Received data:', data);
                if (data) {
                    const rawEarnings = data.this_month_earnings ?? data.earnings_current_month ?? data.earnings ?? data.total_earnings ?? 0;
                    const numEarnings = typeof rawEarnings === 'number' ? rawEarnings : parseFloat(rawEarnings);
                    const formattedEarnings = !isNaN(numEarnings) 
                        ? Number(numEarnings.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                        : '0';

                    setStatsData({
                        total: data.total_tasks ?? data.total ?? data.tasks_total ?? 0,
                        completed: data.completed_tasks ?? data.completed ?? data.tasks_completed ?? 0,
                        pending: data.pending_tasks ?? data.pending ?? data.tasks_pending ?? 0,
                        earnings: `₹${formattedEarnings}`
                    });
                    if (data.project_name) setProjectName(data.project_name);
                    if (data.contractor_name) setContractorName(data.contractor_name);

                    // Map API tasks to UI Task interface
                    const rawTasks = data.tasks || data.recent_tasks || data.assigned_tasks || [];
                    const mappedTasks: Task[] = rawTasks.map((t: any) => ({
                        id: t.id || t.task_id || `T-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                        name: t.name || t.title || t.task_name || 'UNNAMED TASK',
                        project: t.project_name || t.project || 'General',
                        assignedTo: t.assigned_to_name || user?.name || 'Self',
                        assignedFrom: t.assigned_from === 'self' ? 'Self' : 'Site Engineer',
                        description: t.description || 'No description provided.',
                        status: (t.status === 'in_progress' ? 'In Progress' : (t.status?.charAt(0).toUpperCase() + t.status?.slice(1))) || 'Pending',
                        priority: t.priority || 'Medium',
                        startDate: t.start_date || new Date().toISOString().split('T')[0],
                        endDate: t.end_date || new Date().toISOString().split('T')[0],
                        progress: t.progress_percent || (t.status === 'completed' ? 100 : 0)
                    }));
                    setTasks(mappedTasks);

                    // Map recent_activity from API
                    const rawActivities = data.recent_activity || data.recent_activities || [];
                    setRecentActivities(rawActivities.map((a: any) => ({
                        title: a.title || a.type || a.activity_type || 'Activity',
                        description: a.description || a.message || a.details || '',
                        time: a.time || a.created_at || a.timestamp || '',
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch labour dashboard data", err);
                toast.error("Could not load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();

        // Fetch today's attendance status so the card reflects reality on load
        const fetchTodayStatus = async () => {
            try {
                const status = await attendanceService.getTodayStatus();
                const hasCheckedIn = !!(status.checked_in || status.attendance?.in_time || status.attendance?.check_in_time);
                const hasCheckedOut = !!(status.checked_out || status.attendance?.out_time || status.attendance?.check_out_time);
                setIsCheckedIn(hasCheckedIn);
                setIsCheckedOut(hasCheckedOut);
            } catch (err) {
                console.warn('Could not fetch today attendance status:', err);
            }
        };
        fetchTodayStatus();
    }, [user?.name]);

    const handleUpdateTask = (id: string, status: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
        localStorage.setItem(`task_status_${id}`, status);
        toast.success(`Task marked as ${status}!`);
        setIsTaskModalOpen(false);
    };

    const handleTaskClick = (task: Task) => {
        if (task.status === 'Completed') return;
        navigate(`/labour/work-updates?taskId=${task.id}&projectId=92&taskName=${encodeURIComponent(task.name)}&taskCategory=${encodeURIComponent(task.priority)}`);
    };

    const stats = [
        { label: 'Total Tasks', value: statsData.total, icon: Clipboard, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Completed', value: statsData.completed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Pending', value: statsData.pending, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'This Month Earnings', value: statsData.earnings, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ];

    const quickActions = [
        { label: 'Check In', icon: Camera, color: 'bg-emerald-500', onClick: () => navigate('/labour/attendance') },
        { label: 'Check Out', icon: Calendar, color: 'bg-rose-500', onClick: () => navigate('/labour/attendance') },
        { label: 'View Tasks', icon: Clipboard, color: 'bg-blue-500', onClick: () => navigate('/labour/tasks') },
        { label: 'Work Updates', icon: Play, color: 'bg-indigo-500', onClick: () => navigate('/labour/work-updates') },
    ];

    // Icon colour cycling for activities
    const activityAccents = [
        { dot: 'bg-indigo-500', icon: 'text-indigo-500', bg: 'bg-indigo-50' },
        { dot: 'bg-emerald-500', icon: 'text-emerald-500', bg: 'bg-emerald-50' },
        { dot: 'bg-amber-500', icon: 'text-amber-500', bg: 'bg-amber-50' },
        { dot: 'bg-rose-500', icon: 'text-rose-500', bg: 'bg-rose-50' },
        { dot: 'bg-blue-500', icon: 'text-blue-500', bg: 'bg-blue-50' },
    ];

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
                                        Welcome, {user?.name || 'Gopal Yadav'}
                                    </h1>
                                    <button onClick={() => speak(`Welcome, ${user?.name || 'Gopal Yadav'}`)} className="text-slate-300 hover:text-indigo-500">
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                        {projectName}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        <User className="w-3.5 h-3.5 text-emerald-500" />
                                        {contractorName}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center lg:justify-end">
                        <AttendanceCard
                            isCheckedIn={isCheckedIn}
                            onCheckIn={() => setIsCheckedIn(true)}
                            onCheckOut={() => setIsCheckedIn(false)}
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
                            <p className="text-xl md:text-2xl font-black text-slate-800">{isLoading ? '...' : stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Main Dashboard Layout ── */}
                <div className="space-y-8">

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
                            <button onClick={() => navigate('/labour/tasks')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group">
                                View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 italic text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Synchronizing tasks...
                            </div>
                        ) : (
                            <TaskList
                                tasks={tasks.slice(0, 3)}
                                onSelectTask={handleTaskClick}
                                onSelfAssign={(id) => handleUpdateTask(id, 'In Progress')}
                            />
                        )}
                    </div>

                    {/* Recent Activity — full width below Recent Tasks */}
                    <div>
                        {/* Section heading — outside the card, same as Recent Tasks */}
                        <div className="flex items-center gap-3 mb-6 px-1">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Activity</h2>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        {/* Card — matches TaskList card exactly */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            {isLoading ? (
                                /* Skeleton rows matching TaskList height */
                                <div className="divide-y divide-slate-50">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-6 px-8 py-6 animate-pulse">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                                                <div className="h-2.5 bg-slate-50 rounded-full w-1/2" />
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : recentActivities.length === 0 ? (
                                /* Empty state */
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                        <Zap className="w-6 h-6 text-slate-200" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Activity Yet</p>
                                    <p className="text-[11px] text-slate-300 mt-1 font-medium">Your activity will appear here</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        {/* Header row — identical to TaskList thead */}
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Activity</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Description</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">DATE AND TIME</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {recentActivities.map((activity, i) => {
                                                const accent = activityAccents[i % activityAccents.length];
                                                const { time, date } = formatDateTimeDisplay(activity.time);
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                        {/* Activity title with icon */}
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-xl ${accent.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                                                    <Activity className={`w-3.5 h-3.5 ${accent.icon}`} />
                                                                </div>
                                                                <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
                                                                    {activity.title}
                                                                </h3>
                                                            </div>
                                                        </td>
                                                        {/* Description */}
                                                        <td className="px-8 py-6 max-w-xs">
                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate">
                                                                {activity.description || '—'}
                                                             </p>
                                                        </td>
                                                        {/* Date & Time */}
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-start gap-2">
                                                                <Clock className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                                                                <div className="flex flex-col text-xs font-bold text-slate-700 leading-snug">
                                                                    <span>{time}</span>
                                                                    {date && <span className="text-[11px] font-medium text-slate-500">{date}</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
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

