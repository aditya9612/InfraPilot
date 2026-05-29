import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import AttendanceCard from '../../components/labour/AttendanceCard';
import TaskList from '../../components/labour/TaskList';
import TaskDetailModal from '../../components/labour/TaskDetailModal';
import PaymentTracker from '../../components/labour/PaymentTracker';
import PageTransition from '../../components/common/PageTransition';
import Navbar from '../../components/common/Navbar';
import {
    Clipboard,
    CheckCircle,
    AlertCircle,
    Clock,
    Volume2,
    Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
    id: string;
    name: string;
    project: string;
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
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Mock Tasks - Exact match to Image 1
    const [tasks, setTasks] = useState<Task[]>([
        { id: 'T-001', name: 'FOUNDATION REINFORCEMENT', project: 'Urban Heights', description: 'Reinforcing foundation columns', status: 'In Progress', priority: 'High', startDate: '2026-05-27', endDate: '2026-05-30', progress: 65 },
        { id: 'T-002', name: 'CONCRETING SECTION B', project: 'Urban Heights', description: 'Pouring concrete for section B', status: 'Pending', priority: 'Medium', startDate: '2026-05-28', endDate: '2026-06-02', progress: 0 },
        { id: 'T-003', name: 'CLEAR DEBRIS', project: 'Urban Heights', description: 'Remove construction waste', status: 'Completed', priority: 'Low', startDate: '2026-05-26', endDate: '2026-05-28', progress: 100 },
    ]);

    const handleCheckIn = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(() => {
                setIsCheckedIn(true);
                speak(`Check-in successful`);
                toast.success("Checked in successfully!");
            }, () => {
                toast.error("Location access required for check-in");
            });
        }
    };

    const handleCheckOut = () => {
        setIsCheckedIn(false);
        speak("Checked out successfully");
        toast.success("Checked out!");
    };

    const handleUpdateTask = (id: string, status: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any, progress: status === 'Completed' ? 100 : t.progress } : t));
        setIsTaskModalOpen(false);
        toast.success(`Task ${status}!`);
    };

    const stats = [
        { label: 'Total Tasks', value: 12, icon: Clipboard, color: 'text-blue-500' },
        { label: 'Completed', value: 8, icon: CheckCircle, color: 'text-green-500' },
        { label: 'Pending', value: 3, icon: AlertCircle, color: 'text-orange-500' },
        { label: 'In Progress', value: 1, icon: Clock, color: 'text-purple-500' },
    ];

    return (
        <PageTransition className="min-h-screen bg-slate-50 font-inter">
            <Navbar
                title="Labour Overview"
                breadcrumb={['InfraPilot', 'Dashboard', 'Labour']}
            />

            <div className="p-6 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                                Namaste, {user?.name || 'Gopal Yadav'}
                            </h1>
                            <button
                                onClick={() => speak(`Namaste, ${user?.name || 'Gopal Yadav'}`)}
                                className="p-1 px-2 rounded-full hover:bg-white text-slate-300 transition-colors"
                                title="Speak greeting"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-500 text-sm">Track your work and payments here</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <AttendanceCard
                            isCheckedIn={isCheckedIn}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                        />
                    </div>
                </div>

                {/* Top Feature Stats - Aligned with Admin's StatCard grid */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Work Snapshot
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[140px] transition-transform hover:scale-[1.01]">
                                <div>
                                    <div className="inline-flex p-2 rounded-xl bg-slate-50">
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{stat.label}</span>
                                    <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid - Balanced spacing */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Assigned Tasks Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Assigned Tasks</h2>
                                <button onClick={() => speak("Assigned Tasks")} className="text-slate-300 hover:text-indigo-500 transition-colors">
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => toast.success("Feature coming soon!")}
                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" />
                                Self-Assign
                            </button>
                        </div>

                        <TaskList
                            tasks={tasks}
                            onSelectTask={(t) => { setSelectedTask(t as any); setIsTaskModalOpen(true); }}
                            onSelfAssign={(id) => handleUpdateTask(id, 'In Progress')}
                        />
                    </div>

                    {/* Payment Status Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Payment Status</h2>
                            <button onClick={() => speak("Payment Status")} className="text-slate-300 hover:text-indigo-500 transition-colors">
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>

                        <PaymentTracker />
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
    );
};

export default LabourDashboard;
