import React from 'react';
import { Clock, MoreVertical, Circle, Calendar } from 'lucide-react';
import type { Task } from '../../types/task';

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
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Task ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Project Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Task Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Priority</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Progress</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Start Date</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">End Date</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tasks.map((task) => {
                            const priority = getPriorityInfo(task.priority);
                            return (
                                <tr
                                    key={task.id}
                                    className={`transition-colors group ${task.status === 'Completed' ? 'cursor-default' : 'hover:bg-slate-50/50 cursor-pointer'}`}
                                    onClick={() => task.status !== 'Completed' && onSelectTask(task)}
                                >
                                    <td className="px-8 py-6">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{task.id}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{task.project}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">{task.name}</h3>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusBadgeStyle(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${priority.color} bg-white group-hover:shadow-sm transition-all`}>
                                            <Circle className="w-2 h-2 fill-current opacity-40" />
                                            {priority.label}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2 min-w-[120px]">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-slate-800">{task.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out ${getProgressBarColor(task.status)}`}
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                                            {task.startDate}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-blue-500 uppercase tracking-tight">
                                            <Calendar className="w-3.5 h-3.5 text-blue-300" />
                                            {task.endDate}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskList;
