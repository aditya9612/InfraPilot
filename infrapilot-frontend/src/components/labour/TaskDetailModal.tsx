import React, { useState, useRef, useEffect } from 'react';
import { 
    X, FileText, User, Calendar, Clock, CheckSquare, 
    History, MessageSquare, Play, 
    MoreHorizontal, Paperclip, Send, Volume2, Info
} from 'lucide-react';
import { useTextToAudio } from '../../utils/useTextToAudio';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

interface Task {
    id: string;
    project_id?: number | string;
    name: string;
    project: string;
    contractorId?: string;
    assignedFrom?: 'Self' | 'Site Engineer' | string;
    assignedTo?: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Hold' | 'Planned';
    priority: 'High' | 'Medium' | 'Low';
    startDate: string;
    endDate: string;
    progress: number;
    beforeImages?: string[];
    afterImages?: string[];
    comments?: string;
    audioUrl?: string;
    imageUrl?: string;
}

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'Details' | 'Activity' | 'Comments'>('Details');
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [activities, setActivities] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progressUpdate, setProgressUpdate] = useState({ percentage: 0, description: '' });
    
    const { speak } = useTextToAudio();

    // Audio player state
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Reset audio state when task changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [task?.id]);

    const formatTime = (secs: number) => {
        if (!secs || isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handlePlayPause = () => {
        if (task?.audioUrl) {
            if (!audioRef.current) {
                audioRef.current = new Audio(task.audioUrl);
                audioRef.current.onloadedmetadata = () => setDuration(audioRef.current!.duration);
                audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current!.currentTime);
                audioRef.current.onended = () => { setIsPlaying(false); setCurrentTime(0); };
            }
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            speak(task?.description || 'No instruction found.');
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = pct * duration;
    };

    const projectId = task?.project_id ? Number(task.project_id) : 92;
    const taskId = task?.id ? Number(task.id) : 0;

    React.useEffect(() => {
        if (isOpen && task) {
            if (activeTab === 'Comments') {
                fetchComments();
            } else if (activeTab === 'Activity') {
                fetchActivity();
            }
        }
    }, [isOpen, task, activeTab]);

    const fetchComments = async () => {
        try {
            const data = await projectService.getTaskComments(projectId, taskId);
            setComments(Array.isArray(data) ? data : (data.items || []));
        } catch (err) {
            console.error('Failed to fetch comments');
        }
    };

    const fetchActivity = async () => {
        try {
            const data = await projectService.getTaskProgressHistory(projectId, taskId);
            setActivities(Array.isArray(data) ? data : (data.items || []));
        } catch (err) {
            console.error('Failed to fetch activities');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            await projectService.createTaskComment(projectId, taskId, { comment: newComment });
            setNewComment('');
            fetchComments();
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProgress = async () => {
        if (progressUpdate.percentage < 0 || progressUpdate.percentage > 100) {
            toast.error('Percentage must be between 0 and 100');
            return;
        }
        setIsSubmitting(true);
        try {
            await projectService.updateTaskProgress(projectId, taskId, {
                completion_percentage: progressUpdate.percentage,
                description: progressUpdate.description || 'Progress update'
            });
            setProgressUpdate({ percentage: 0, description: '' });
            fetchActivity();
            toast.success('Progress updated');
        } catch (err) {
            toast.error('Failed to update progress');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !task) return null;

    const renderDetails = () => (
        <div className="space-y-6">
            {/* Task Title Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Task Title</span>
                <p className="text-sm font-black text-slate-800">{task.name}</p>
            </div>

            {/* Description Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <span className="text-xs font-black text-slate-800 block mb-1">Description</span>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        {task.description && task.description !== 'NA' ? task.description : 'No description provided.'}
                    </p>
                </div>
            </div>

            {/* Assigned By & To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-800 block mb-1">Assigned By</span>
                        <p className="text-sm text-slate-500 font-medium">{task.assignedFrom || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-800 block mb-1">Assigned To</span>
                        <p className="text-sm text-slate-500 font-medium">{task.assignedTo || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Labour</p>
                    </div>
                </div>
            </div>

            {/* Priority & Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                        <span className="text-xs font-black text-slate-800 block mb-3">Priority</span>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            task.priority === 'High' ? 'bg-rose-500 text-white' : 
                            task.priority === 'Medium' ? 'bg-amber-500 text-white' : 
                            'bg-blue-500 text-white'
                        }`}>
                            {task.priority || 'LOW'}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-800 block mb-1">Deadline</span>
                        <p className="text-sm text-slate-500 font-medium">{task.endDate || '6/27/2026'}</p>
                    </div>
                </div>
            </div>

            {/* Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-800 block mb-1">Start Date</span>
                        <p className="text-sm text-slate-500 font-medium">{task.startDate || '6/27/2026'}</p>
                    </div>
                </div>
                <div className="hidden md:block"></div>
            </div>

            {/* Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <CheckSquare className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-800 block mb-1">Status</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-sm font-medium text-slate-500">{task.status === 'Pending' ? 'Planned' : task.status}</span>
                </div>
            </div>

            {/* Project Classification */}
            <div>
                <h3 className="text-sm font-black text-slate-800 mb-4 px-1">Project Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Project</span>
                        <p className="text-sm font-black text-slate-800">{task.project}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Milestone</span>
                        <p className="text-sm font-black text-slate-800">None</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">BOQ</span>
                        <p className="text-sm font-black text-slate-800">None</p>
                    </div>
                </div>
            </div>

            {/* Execution & Delays */}
            <div>
                <h3 className="text-sm font-black text-slate-800 mb-4 px-1">Execution & Delays</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Actual Start</span>
                        <p className="text-sm font-black text-slate-800">N/A</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Actual End</span>
                        <p className="text-sm font-black text-slate-800">N/A</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Duration</span>
                        <p className="text-sm font-black text-slate-800">0 days</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Delay Status</span>
                        <p className="text-sm font-black text-emerald-600">On Track</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Completion</span>
                        <p className="text-sm font-black text-blue-600">{task.progress}%</p>
                    </div>
                </div>
            </div>

            {/* Financials */}
            <div>
                <h3 className="text-sm font-black text-slate-800 mb-4 px-1">Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Planned Cost</span>
                        <p className="text-sm font-black text-slate-800">₹0</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Actual Cost</span>
                        <p className="text-sm font-black text-slate-800">₹0</p>
                    </div>
                </div>
            </div>

            {/* Media & Instructions */}
            <div>
                <h3 className="text-sm font-black text-slate-800 mb-4 px-1">Media & Instructions</h3>
                <div className="space-y-4">
                    {/* Audio Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Audio Instruction</span>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                            {/* Play / Pause button */}
                            <button
                                onClick={handlePlayPause}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-800 hover:text-blue-600 transition-colors flex-shrink-0"
                            >
                                {isPlaying ? (
                                    /* Pause icon — two vertical bars */
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <rect x="5" y="4" width="4" height="16" rx="1" />
                                        <rect x="15" y="4" width="4" height="16" rx="1" />
                                    </svg>
                                ) : (
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                            </button>

                            {/* Progress track — clickable */}
                            <div
                                className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden cursor-pointer relative"
                                onClick={handleSeek}
                            >
                                <div
                                    className="h-full bg-slate-800 rounded-full transition-none"
                                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                                />
                            </div>

                            {/* Time display */}
                            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">
                                {task?.audioUrl ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '0:00'}
                            </span>
                            <Volume2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <button>
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Image Card */}
                    {task.imageUrl && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Instruction Image</span>
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
                                <img 
                                    src={task.imageUrl} 
                                    alt="Instruction"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Click to expand</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderActivity = () => (
        <div className="space-y-6">
            {/* Activities List */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Recent Activity History</h4>
                {activities.length > 0 ? (
                    <div className="space-y-3">
                        {activities.map((act, index) => (
                            <div key={index} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-black text-slate-800">Status Update: {act.completion_percentage}%</p>
                                        <span className="text-[9px] font-bold text-slate-400">{new Date(act.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{act.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <History className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No activity logged yet</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderComments = () => (
        <div className="flex flex-col h-[500px]">
            {/* Thread Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-4 h-4 text-[#0062ff]" />
                    <span className="text-sm font-black text-slate-800">Task Discussion</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chat with team members about this task</p>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 custom-scrollbar">
                {comments.length > 0 ? (
                    comments.map((c, index) => (
                        <div key={index} className={`flex items-start gap-3 ${c.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className={`p-3 rounded-2xl max-w-[80%] ${c.user_id === user?.id ? 'bg-[#0062ff] text-white' : 'bg-slate-50 text-slate-800'}`}>
                                <div className="flex items-center gap-2 mb-1 justify-between">
                                    <span className={`text-[10px] font-black uppercase ${c.user_id === user?.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {c.user_name || 'Team Member'}
                                    </span>
                                    <span className={`text-[8px] font-bold ${c.user_id === user?.id ? 'text-blue-200' : 'text-slate-300'}`}>
                                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs font-medium leading-relaxed">{c.comment || c.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-8 bg-[#FDFBF7] rounded-3xl border border-slate-100">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-blue-200" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-1">No comments yet</h3>
                        <p className="text-sm text-slate-400 font-medium">Start the conversation!</p>
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="w-full pl-12 pr-16 py-4 bg-white border border-slate-200 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all placeholder:text-slate-300 shadow-md shadow-slate-100/50"
                />
                <button className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    <Paperclip className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleAddComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#0062ff] hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none"
                >
                    <Send className="w-4 h-4 fill-current ml-0.5" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-[#F8FAFC] w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">work update</h2>
                            <p className="text-[10px] text-blue-100 font-medium opacity-90 uppercase tracking-wider">Detailed view of task assignments and progress</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-6 flex items-center gap-2 border-b border-slate-100">
                    {(['Details', 'Activity', 'Comments'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-t-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                    ? 'bg-white text-slate-800 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]' 
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white shadow-inner custom-scrollbar">
                    {activeTab === 'Details' && renderDetails()}
                    {activeTab === 'Activity' && renderActivity()}
                    {activeTab === 'Comments' && renderComments()}
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
