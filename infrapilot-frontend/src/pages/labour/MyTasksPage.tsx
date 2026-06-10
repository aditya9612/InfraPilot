import React, { useState } from 'react';
import {
    Search,
    Filter,
    Mic,
    StopCircle,
    Clipboard,
    Plus
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import TaskList from '../../components/labour/TaskList';
import TaskDetailModal from '../../components/labour/TaskDetailModal';
import { useSpeechToText } from '../../utils/useSpeechToText';
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

const MyTasksPage: React.FC = () => {
    const { isListening, transcript, startListening, stopListening } = useSpeechToText();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const [tasks, setTasks] = useState<Task[]>([
        { id: 'T-001', name: 'FOUNDATION REINFORCEMENT', project: 'Urban Heights', contractorId: 'CTR-992', assignedFrom: 'Site Engineer', description: 'Reinforcing foundation columns with 12mm TMT bars', status: 'In Progress', priority: 'High', startDate: '2026-05-27', endDate: '2026-05-30', progress: 65 },
        { id: 'T-002', name: 'CONCRETING SECTION B', project: 'Urban Heights', contractorId: 'CTR-992', assignedFrom: 'Site Engineer', description: 'Pouring concrete for section B foundation', status: 'Pending', priority: 'Medium', startDate: '2026-05-28', endDate: '2026-06-02', progress: 0 },
        { id: 'T-003', name: 'CLEAR DEBRIS', project: 'Urban Heights', contractorId: 'CTR-992', assignedFrom: 'Self', description: 'Remove construction waste from the main entrance', status: 'Completed', priority: 'Low', startDate: '2026-05-26', endDate: '2026-05-28', progress: 100 },
        { id: 'T-004', name: 'BRICKWORK LEVEL 2', project: 'Skyline', contractorId: 'CTR-104', assignedFrom: 'Site Engineer', description: 'Internal partition walls for block A', status: 'Pending', priority: 'High', startDate: '2026-06-01', endDate: '2026-06-05', progress: 0 },
    ]);

    React.useEffect(() => {
        if (transcript) setSearchTerm(transcript);
    }, [transcript]);

    const handleUpdateTask = (id: string, status: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any, progress: status === 'Completed' ? 100 : t.progress } : t));
        setIsTaskModalOpen(false);
        toast.success(`Task ${status}!`);
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.project.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <>
            <Navbar
                title="My Assigned Tasks"
                breadcrumb={['InfraPilot', 'Labour', 'My Tasks']}
            />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Current Workforce Tasks</h1>
                        <p className="text-slate-500 text-sm">View and update your daily assignments</p>
                    </div>
                    <button
                        onClick={() => toast.success("Feature coming soon!")}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Self-Assign Task</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks or projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-sm font-medium"
                        />
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-500'}`}
                            title={isListening ? "Stop listening" : "Search with voice"}
                        >
                            {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-sm font-bold text-slate-600 appearance-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Hold">On Hold</option>
                        </select>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl px-5 py-2.5 flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block">Showing</span>
                            <span className="text-xl font-black text-slate-800">{filteredTasks.length}</span>
                        </div>
                        <Clipboard className="w-5 h-5 text-slate-300" />
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <TaskList
                        tasks={filteredTasks}
                        onSelectTask={(t) => { setSelectedTask(t as any); setIsTaskModalOpen(true); }}
                        onSelfAssign={(id) => handleUpdateTask(id, 'In Progress')}
                    />
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

export default MyTasksPage;
