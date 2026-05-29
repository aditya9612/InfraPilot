import React, { useState } from 'react';
import { X, Camera, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    project: string;
    description: string;
    status: string;
    priority: string;
}

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdateStatus }) => {
    const [progress, setProgress] = useState(0);

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 block">Work Update</span>
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
                                <Clock className="w-4 h-4 text-indigo-500" />
                                Work Progress
                            </label>
                            <span className="text-lg font-black text-indigo-600">{progress}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </section>

                    {/* Photo Upload */}
                    <section>
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                            <Camera className="w-4 h-4 text-indigo-500" />
                            Before/After Work Images
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <Camera className="w-5 h-5 text-indigo-500" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Before Work</span>
                            </div>
                            <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <Camera className="w-5 h-5 text-indigo-500" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">After Work</span>
                            </div>
                        </div>
                    </section>

                    {/* Guidelines */}
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                        <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                            Ensure regular progress updates. Quality photography is required for payment verification.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onUpdateStatus(task.id, progress === 100 ? 'Completed' : 'In Progress')}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Save Status
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
