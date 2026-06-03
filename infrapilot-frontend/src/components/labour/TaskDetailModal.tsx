import React, { useState } from 'react';
import { X, Camera, CheckCircle2, AlertCircle, Clock, Mic, MessageSquare, Play, Pause, BarChart2, Calendar, CheckCircle } from 'lucide-react';
import VoiceSubmission from './VoiceSubmission';

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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 block">Task Details</span>
                        <h2 className="text-xl font-bold text-slate-800">{task.name}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-100">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Progress Section */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-indigo-500" />
                                Work Progress
                            </label>
                            <span className="text-lg font-black text-indigo-600">{task.progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${task.progress}%` }} />
                        </div>
                    </section>

                    {/* Voice Update Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Status Updates
                            </span>
                            {!isRecordingMode && (
                                <button
                                    onClick={() => setIsRecordingMode(true)}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest"
                                >
                                    <Mic className="w-3 h-3" />
                                    Add Voice Note
                                </button>
                            )}
                        </div>

                        {isRecordingMode ? (
                            <VoiceSubmission onSend={handleVoiceSend} />
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                <button onClick={() => onUpdateStatus(task.id, 'In Progress')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors gap-1.5">
                                    <Play className="w-4 h-4 fill-current" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Start</span>
                                </button>
                                <button onClick={() => onUpdateStatus(task.id, 'Completed')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-green-100 bg-green-50 text-green-600 hover:bg-green-100 transition-colors gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Finish</span>
                                </button>
                                <button onClick={() => onUpdateStatus(task.id, 'Hold')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors gap-1.5">
                                    <Pause className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Pause</span>
                                </button>
                                <button onClick={() => onUpdateStatus(task.id, 'Pending')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-colors gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Reset</span>
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
