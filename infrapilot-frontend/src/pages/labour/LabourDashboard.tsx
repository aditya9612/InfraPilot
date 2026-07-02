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
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const LabourDashboard: React.FC = () => {
    const { user } = useAuth();
    const { speak } = useTextToAudio();
    const navigate = useNavigate();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statsData, setStatsData] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        earnings: '₹0'
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const data = await dashboardService.getLabourDashboard();
                if (data) {
                    setStatsData({
                        total: data.total_tasks || 0,
                        completed: data.completed_tasks || 0,
                        pending: data.pending_tasks || 0,
                        earnings: `₹${(data.earnings_current_month || 0).toLocaleString()}`
                    });
                    
                    // Map API tasks to UI Task interface
                    const mappedTasks: Task[] = (data.tasks || []).map((t: any) => ({
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
                }
            } catch (err) {
                console.error("Failed to fetch labour dashboard data", err);
                toast.error("Could not load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.name]);

    const handleUpdateTask = (id: string, status: string) => {
        // Optimistic UI update
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
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                        Urban Heights
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <User className="w-3.5 h-3.5 text-emerald-500" />
                                        M/S Sharma Contractors
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
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
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
