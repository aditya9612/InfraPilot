import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import AttendanceCard from '../../components/labour/AttendanceCard';
import TaskDetailModal from '../../components/labour/TaskDetailModal';
import PageTransition from '../../components/common/PageTransition';
import Navbar from '../../components/common/Navbar';
import { useNavigate } from 'react-router-dom';
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
    Play,
    IndianRupee,
    Activity,
    MapPin,
    CheckSquare,
    UserCheck,
    UserX,
    Loader2,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { labourService } from '../../services/labourService';

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

interface ActivityItem {
    id?: string | number;
    type?: string;
    action?: string;
    description?: string;
    message?: string;
    title?: string;
    timestamp?: string;
    created_at?: string;
    time?: string;
    status?: string;
    location?: string;
    task_name?: string;
}

interface DashboardData {
    user_name: string;
    project_name: string | null;
    contractor_name: string | null;
    check_in_status: string;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    this_month_earnings: number;
    recent_tasks: any[];
    recent_activity: ActivityItem[];
}

// Helper to determine activity icon + color from action/type
const getActivityMeta = (item: ActivityItem) => {
    const type = (item.type || item.action || '').toLowerCase();
    const desc = (item.description || item.message || item.title || '').toLowerCase();

    if (type.includes('check_in') || type.includes('checkin') || desc.includes('checked in')) {
        return { icon: UserCheck, color: 'emerald', label: 'Present', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' };
    }
    if (type.includes('check_out') || type.includes('checkout') || desc.includes('checked out')) {
        return { icon: UserX, color: 'rose', label: 'Absent', bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' };
    }
    if (type.includes('task') && (type.includes('complet') || desc.includes('complet'))) {
        return { icon: CheckSquare, color: 'indigo', label: 'Task Completed', bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' };
    }
    if (type.includes('task') || desc.includes('task')) {
        return { icon: Clipboard, color: 'blue', label: 'Task Update', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' };
    }
    if (type.includes('payment') || type.includes('earning') || desc.includes('payment') || desc.includes('wage')) {
        return { icon: IndianRupee, color: 'amber', label: 'Payment', bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' };
    }
    if (type.includes('attendance') || desc.includes('attendance')) {
        return { icon: Calendar, color: 'violet', label: 'Attendance', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' };
    }
    return { icon: Activity, color: 'slate', label: 'Activity', bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-100' };
};

const formatTimestamp = (ts?: string): string => {
    if (!ts) return '';
    try {
        const date = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
        return ts;
    }
};

const SkeletonRow = () => (
    <div className="flex items-start gap-4 p-4 animate-pulse">
        <div className="w-10 h-10 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-100 rounded-full w-3/4" />
            <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full w-12" />
    </div>
);

const LabourDashboard: React.FC = () => {
    const { user } = useAuth();
    const { speak } = useTextToAudio();
    const navigate = useNavigate();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const data = await labourService.getLabourDashboard();
                setDashData(data);
                // Sync check-in status robustly (handles 'CHECKED IN', 'CHECKED_IN', 'NOT CHECKED IN', etc.)
                const checkedIn = data.check_in_status === 'CHECKED IN' || String(data.check_in_status).toUpperCase().replace(/_/g, ' ') === 'CHECKED IN';
                setIsCheckedIn(checkedIn);
            } catch (err) {
                console.error('Failed to load dashboard', err);
                toast.error('Could not load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handleUpdateTask = (_id: string, status: string) => {
        toast.success(`Task ${status}!`);
        setIsTaskModalOpen(false);
    };

    const displayName = dashData?.user_name || user?.name || 'Worker';
    const projectName = dashData?.project_name || 'No Project Assigned';
    const contractorName = dashData?.contractor_name || 'No Contractor';

    const stats = [
        {
            label: 'Total Tasks',
            value: loading ? '—' : (dashData?.total_tasks ?? 0),
            icon: Clipboard,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            accent: 'border-blue-100'
        },
        {
            label: 'Completed',
            value: loading ? '—' : (dashData?.completed_tasks ?? 0),
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            accent: 'border-emerald-100'
        },
        {
            label: 'Pending',
            value: loading ? '—' : (dashData?.pending_tasks ?? 0),
            icon: AlertCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
            accent: 'border-rose-100'
        },
        {
            label: 'This Month Earnings',
            value: loading ? '—' : `₹${(dashData?.this_month_earnings ?? 0).toLocaleString('en-IN')}`,
            icon: TrendingUp,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            accent: 'border-indigo-100'
        },
    ];

    const quickActions = [
        { label: 'Present', icon: UserCheck, color: 'bg-emerald-500', shadow: 'shadow-emerald-200', onClick: () => navigate('/labour/attendance') },
        { label: 'Absent', icon: UserX, color: 'bg-rose-500', shadow: 'shadow-rose-200', onClick: () => navigate('/labour/attendance') },
        { label: 'View Tasks', icon: Clipboard, color: 'bg-blue-500', shadow: 'shadow-blue-200', onClick: () => navigate('/labour/tasks') },
        { label: 'Work Updates', icon: Play, color: 'bg-indigo-500', shadow: 'shadow-indigo-200', onClick: () => navigate('/labour/work-updates') },
    ];

    const recentActivity: ActivityItem[] = dashData?.recent_activity || [];
    const recentTasks: any[] = dashData?.recent_tasks || [];

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
                                        Welcome, {displayName}
                                    </h1>
                                    <button onClick={() => speak(`Welcome, ${displayName}`)} className="text-slate-300 hover:text-indigo-500 transition-colors">
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                        {projectName}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <User className="w-3.5 h-3.5 text-emerald-500" />
                                        {contractorName}
                                    </div>
                                    {/* Check-in status badge */}
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        isCheckedIn
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center lg:justify-end">
                        <AttendanceCard
                            isCheckedIn={isCheckedIn}
                            onCheckIn={() => navigate('/labour/attendance')}
                            onCheckOut={() => navigate('/labour/attendance')}
                        />
                    </div>
                </div>

                {/* ── Statistics Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className={`bg-white p-5 rounded-3xl border ${stat.accent} shadow-sm transition-all hover:shadow-md group`}>
                            <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            {loading ? (
                                <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
                            ) : (
                                <p className="text-xl md:text-2xl font-black text-slate-800">{stat.value}</p>
                            )}
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
                                        <div className={`w-12 h-12 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-lg ${action.shadow}`}>
                                            <action.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Tasks from API */}
                        <div>
                            <div className="flex justify-between items-center mb-6 px-1">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Tasks</h2>
                                <button
                                    onClick={() => navigate('/labour/tasks')}
                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group hover:text-indigo-800 transition-colors"
                                >
                                    View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="divide-y divide-slate-50">
                                        {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                                    </div>
                                ) : recentTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 px-8">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                            <Clipboard className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400">No tasks assigned yet</p>
                                        <p className="text-[10px] text-slate-300 mt-1 font-medium">Tasks assigned to you will appear here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {recentTasks.map((task: any, idx: number) => {
                                            const statusColors: Record<string, string> = {
                                                completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                                'in progress': 'bg-blue-50 text-blue-600 border-blue-100',
                                                pending: 'bg-amber-50 text-amber-600 border-amber-100',
                                                hold: 'bg-rose-50 text-rose-600 border-rose-100',
                                            };
                                            const status = (task.status || '').toLowerCase();
                                            const statusClass = statusColors[status] || 'bg-slate-50 text-slate-500 border-slate-100';
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => navigate(`/labour/work-updates?taskId=${task.id || task.task_id}`)}
                                                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                >
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                        <Clipboard className="w-4 h-4 text-indigo-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-800 tracking-tight truncate">
                                                            {task.title || task.name || task.task_name || 'Unnamed Task'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                                            {task.project_name || task.project || ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusClass}`}>
                                                            {task.status || 'Pending'}
                                                        </span>
                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    {/* Recent Activity */}
                    <div>
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Activity</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="divide-y divide-slate-50">
                                    {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 px-8">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                        <Activity className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-black text-slate-400">No activity yet</p>
                                    <p className="text-[10px] text-slate-300 mt-1 font-medium">Your actions will be recorded here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {recentActivity.map((item, idx) => {
                                        const meta = getActivityMeta(item);
                                        const ts = item.timestamp || item.created_at || item.time || '';
                                        const title = item.description || item.message || item.title || item.action || 'Activity';
                                        const sub = item.task_name || item.location || item.status || '';
                                        const IconComp = meta.icon;

                                        return (
                                            <div
                                                key={item.id || idx}
                                                className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                                            >
                                                {/* Icon */}
                                                <div className={`w-10 h-10 rounded-2xl ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                                    <IconComp className={`w-4 h-4 ${meta.text}`} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-slate-800 leading-snug truncate">
                                                        {title}
                                                    </p>
                                                    {sub && (
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide flex items-center gap-1 truncate">
                                                            {item.location ? <MapPin className="w-2.5 h-2.5 shrink-0" /> : null}
                                                            {sub}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Time */}
                                                <div className="shrink-0 flex flex-col items-end gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                                        {formatTimestamp(ts)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${meta.bg} ${meta.text}`}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Footer with loading indicator */}
                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-50">
                                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading activity...</span>
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
