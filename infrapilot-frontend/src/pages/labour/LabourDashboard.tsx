import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import AttendanceCard from '../../components/labour/AttendanceCard';
import TaskList from '../../components/labour/TaskList';
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
    Camera,
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
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const [tasks] = useState<Task[]>([
        { id: 'T-001', name: 'FOUNDATION REINFORCEMENT', project: 'Urban Heights', description: 'Reinforcing foundation columns', status: 'In Progress', priority: 'High', startDate: '2026-05-27', endDate: '2026-05-30', progress: 65 },
        { id: 'T-002', name: 'CONCRETING SECTION B', project: 'Urban Heights', description: 'Pouring concrete for section B', status: 'Pending', priority: 'Medium', startDate: '2026-05-28', endDate: '2026-06-02', progress: 0 },
        { id: 'T-003', name: 'CLEAR DEBRIS', project: 'Urban Heights', description: 'Remove construction waste', status: 'Completed', priority: 'Low', startDate: '2026-05-26', endDate: '2026-05-28', progress: 100 },
    ]);

    const handleUpdateTask = (_id: string, status: string) => {
        toast.success(`Task ${status}!`);
        setIsTaskModalOpen(false);
    };

    const stats = [
        { label: 'Total Tasks', value: 12, icon: Clipboard, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Completed', value: 8, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Pending', value: 3, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'This Month Earnings', value: '₹14,500', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
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
