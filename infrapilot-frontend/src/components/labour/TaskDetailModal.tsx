import React, { useState } from 'react';
import { X, Camera, AlertCircle, Mic, MessageSquare, Play, Pause, BarChart2, Calendar, CheckCircle, User, Briefcase, Tag, Flag } from 'lucide-react';
import VoiceSubmission from './VoiceSubmission';

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
    beforeImages?: string[];
    afterImages?: string[];
    comments?: string;
}

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdateStatus }) => {
    const [isRecordingMode, setIsRecordingMode] = useState(false);

    if (!isOpen || !task) return null;

    const handleVoiceSend = (blob: Blob) => {
        console.log("Audio blob received:", blob);
        setIsRecordingMode(false);
    };

    const statusColors = {
        'Pending': 'bg-slate-100 text-slate-600',
        'In Progress': 'bg-blue-50 text-blue-600',
        'Completed': 'bg-emerald-50 text-emerald-600',
        'Hold': 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block">Task Detail</span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[task.status]}`}>
                                {task.status}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-2 truncate">
                            {task.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                {task.id}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Flag className={`w-3.5 h-3.5 ${task.priority === 'High' ? 'text-rose-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                                {task.priority} Priority
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 shadow-sm">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Project</label>
                            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                {task.project}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Contractor</label>
                            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
                                <User className="w-4 h-4 text-emerald-500" />
                                {task.contractorId || 'SHARMA-01'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Assigned By</label>
                            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
                                <User className="w-4 h-4 text-blue-500" />
                                {task.assignedFrom || 'Site Engineer'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Start Date</label>
                            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
                                <Calendar className="w-4 h-4 text-amber-500" />
                                {task.startDate}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">End Date</label>
                            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
                                <Calendar className="w-4 h-4 text-rose-500" />
                                {task.endDate}
                            </p>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                                <BarChart2 className="w-4 h-4 text-indigo-500" />
                                Work Progress
                            </h3>
                            <span className="text-lg font-black text-indigo-600">{task.progress}%</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                            <div className="h-full bg-indigo-600 rounded-full transition-all duration-700 shadow-lg shadow-indigo-200" style={{ width: `${task.progress}%` }} />
                        </div>
                    </section>

                    {/* Description */}
                    <section>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Description</h3>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                            "{task.description}"
                        </div>
                    </section>

                    {/* Work Images Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Work Photo Updates</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Before Work</span>
                                    <button className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                                        <Camera className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-indigo-300 hover:bg-slate-100/50 transition-all cursor-pointer">
                                    <Camera className="w-8 h-8 opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">After Work</span>
                                    <button className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors">
                                        <Camera className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-emerald-300 hover:bg-slate-100/50 transition-all cursor-pointer">
                                    <Camera className="w-8 h-8 opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Status Update Actions */}
                    <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                                <MessageSquare className="w-4 h-4 text-indigo-500" />
                                Status Updates
                            </h3>
                            {!isRecordingMode && (
                                <button
                                    onClick={() => setIsRecordingMode(true)}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                                >
                                    <Mic className="w-3.5 h-3.5" />
                                    Add Voice Note
                                </button>
                            )}
                        </div>

                        {isRecordingMode ? (
                            <VoiceSubmission onSend={handleVoiceSend} />
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <button
                                    onClick={() => onUpdateStatus(task.id, 'In Progress')}
                                    className="group flex flex-col items-center justify-center p-5 rounded-3xl border border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all gap-3 hover:-translate-y-1 active:translate-y-0"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200/50 transition-colors">
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Start Work</span>
                                </button>
                                <button
                                    onClick={() => onUpdateStatus(task.id, 'Completed')}
                                    className="group flex flex-col items-center justify-center p-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all gap-3 hover:-translate-y-1 active:translate-y-0"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 transition-colors">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Mark Finished</span>
                                </button>
                                <button
                                    onClick={() => onUpdateStatus(task.id, 'Hold')}
                                    className="group flex flex-col items-center justify-center p-5 rounded-3xl border border-amber-100 bg-amber-50/50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all gap-3 hover:-translate-y-1 active:translate-y-0"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200/50 transition-colors">
                                        <Pause className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Put on Hold</span>
                                </button>
                                <button
                                    onClick={() => onUpdateStatus(task.id, 'Pending')}
                                    className="group flex flex-col items-center justify-center p-5 rounded-3xl border border-slate-100 bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all gap-3 hover:-translate-y-1 active:translate-y-0"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-slate-800 flex items-center justify-center transition-colors">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Reset Mode</span>
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
