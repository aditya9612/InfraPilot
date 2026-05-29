import React from 'react';
import { Clock, MoreVertical, Circle } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Hold';
    priority: 'High' | 'Medium' | 'Low';
    startDate: string;
    progress: number;
}

interface TaskListProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
    onSelfAssign: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onSelectTask }) => {
    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'In Progress': return 'bg-blue-50 text-blue-600';
            case 'Completed': return 'bg-green-50 text-green-600';
            case 'Hold': return 'bg-red-50 text-red-600';
            default: return 'bg-orange-50 text-orange-600';
        }
    };

    const getPriorityInfo = (priority: string) => {
        switch (priority) {
            case 'High': return { color: 'text-rose-500', label: 'High Priority' };
            case 'Medium': return { color: 'text-amber-500', label: 'Medium Priority' };
            default: return { color: 'text-slate-400', label: 'Low Priority' };
        }
    };

    const getProgressBarColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-blue-500';
            case 'In Progress': return 'bg-indigo-600';
            default: return 'bg-slate-300';
        }
    };

    return (
        <div className="space-y-4">
            {tasks.map((task) => {
                const priority = getPriorityInfo(task.priority);
                return (
                    <div
                        key={task.id}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                        onClick={() => onSelectTask(task)}
                    >
                        {/* Action Menu */}
                        <button className="absolute top-6 right-6 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all">
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Header: ID & Status */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyle(task.status)}`}>
                                {task.status}
                            </span>
                        </div>

                        {/* Content: Title & Date & Priority */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight uppercase mb-2">
                                    {task.name}
                                </h3>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                    <Clock className="w-3.5 h-3.5 opacity-70" />
                                    <span>Starts: {task.startDate}</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mr-6 ${priority.color}`}>
                                <Circle className="w-2.5 h-2.5 fill-current opacity-20" />
                                {priority.label}
                            </div>
                        </div>

                        {/* Progress Area */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-slate-800">{task.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 ease-out ${getProgressBarColor(task.status)}`}
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TaskList;
