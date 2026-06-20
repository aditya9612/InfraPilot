import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { Camera, Clipboard, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
    id: string;
    title: string;
    project: string;
    assignedBy: string;
    assignedTo: string;
    assignment: string;
    priority: 'Low' | 'Medium' | 'High';
    startDate: string;
    deadline: string;
    status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
    completion_percentage: number;
    beforePhotos?: string[];
    afterPhotos?: string[];
}

const WorkUpdatesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const taskId = searchParams.get('taskId');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [progress, setProgress] = useState('');
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

    // --- Rich List state for Before / After ---
    interface WorkItem {
        id: string;
        text: string;
        photo?: string;
        status: 'prior' | 'today';
        isCompleted?: boolean;
    }

    const [beforeTasks, setBeforeTasks] = useState<WorkItem[]>([]);
    const [afterTasks, setAfterTasks] = useState<WorkItem[]>([]);

    const [priorPhotos] = useState<string[]>([
        "https://images.unsplash.com/photo-1503387762-592dee581106?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400"
    ]);

    const [beforeInput, setBeforeInput] = useState('');
    const [afterInput, setAfterInput] = useState('');

    // Load tasks from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("labour_tasks");
        if (saved) {
            try {
                setTasks(JSON.parse(saved));
                return;
            } catch (e) {
                console.error("Failed to parse labour_tasks", e);
            }
        }
        
        const defaultTasks: Task[] = [
            { 
                id: 'T-001', 
                title: 'Foundation Reinforcement', 
                project: 'New Sara City', 
                assignedBy: 'Eng. Sharma', 
                assignedTo: 'Gopal Yadav',
                assignment: 'Rebar Placement',
                priority: 'High', 
                startDate: '2026-06-15',
                deadline: '2026-06-20', 
                status: 'In Progress',
                completion_percentage: 65,
                beforePhotos: ["https://images.unsplash.com/photo-1503387762-592dee581106?auto=format&fit=crop&q=80&w=400"],
                afterPhotos: []
            },
            { 
                id: 'T-002', 
                title: 'Concreting Section B', 
                project: 'New Sara City', 
                assignedBy: 'Eng. Verma', 
                assignedTo: 'Gopal Yadav',
                assignment: 'Concrete Pouring',
                priority: 'Medium', 
                startDate: '2026-06-18',
                deadline: '2026-06-21', 
                status: 'Planned',
                completion_percentage: 0,
                beforePhotos: [],
                afterPhotos: []
            },
            { 
                id: 'T-003', 
                title: 'Site Cleaning', 
                project: 'Green Valley', 
                assignedBy: 'Admin', 
                assignedTo: 'Gopal Yadav',
                assignment: 'Debris Removal',
                priority: 'Low', 
                startDate: '2026-06-17',
                deadline: '2026-06-18', 
                status: 'Completed',
                completion_percentage: 100,
                beforePhotos: ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400"],
                afterPhotos: ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400"]
            }
        ];
        localStorage.setItem("labour_tasks", JSON.stringify(defaultTasks));
        setTasks(defaultTasks);
    }, []);

    const activeTask = tasks.find(t => t.id === taskId);

    // Dynamic photos pre-fill when active task changes
    useEffect(() => {
        if (activeTask) {
            setBeforePhotos(activeTask.beforePhotos || []);
            setAfterPhotos(activeTask.afterPhotos || []);
            setProgress(activeTask.title + " work update logging.");
            setBeforeTasks([
                { id: '1', text: `Verify reinforcement dimensions for ${activeTask.title}`, status: 'prior' },
                { id: '2', text: `Verify subgrade prep for ${activeTask.assignment}`, status: 'prior' }
            ]);
            setAfterTasks([]);
        } else {
            setBeforePhotos([]);
            setAfterPhotos([]);
            setProgress('');
            setBeforeTasks([]);
            setAfterTasks([]);
        }
    }, [taskId, tasks]);

    const updateTaskPhotosAndStatus = (updatedBeforePhotos: string[], updatedAfterPhotos: string[]) => {
        if (!activeTask) return;

        let newStatus = activeTask.status;
        let completion_percentage = activeTask.completion_percentage;

        // Upload Before Work photo -> Status = In Progress
        if (updatedBeforePhotos.length > 0 && activeTask.status === 'Planned') {
            newStatus = 'In Progress';
            completion_percentage = 20;
            toast.success("Task status updated to In Progress!");
        }

        // Upload After Work photo -> Status = Completed
        if (updatedAfterPhotos.length > 0) {
            newStatus = 'Completed';
            completion_percentage = 100;
            toast.success("Task status updated to Completed!");
        } else if (updatedAfterPhotos.length === 0 && updatedBeforePhotos.length > 0 && activeTask.status === 'Completed') {
            // Revert status if after photos are deleted
            newStatus = 'In Progress';
            completion_percentage = 65;
        } else if (updatedBeforePhotos.length === 0 && updatedAfterPhotos.length === 0) {
            // Revert to planned if both are empty
            newStatus = 'Planned';
            completion_percentage = 0;
        }

        const updatedTasks = tasks.map(t => {
            if (t.id === activeTask.id) {
                return {
                    ...t,
                    status: newStatus,
                    completion_percentage,
                    beforePhotos: updatedBeforePhotos,
                    afterPhotos: updatedAfterPhotos
                };
            }
            return t;
        });

        setTasks(updatedTasks);
        localStorage.setItem("labour_tasks", JSON.stringify(updatedTasks));
    };

    const addItem = (type: 'before' | 'after') => {
        const val = type === 'before' ? beforeInput.trim() : afterInput.trim();
        if (!val) return;
        const newItem: WorkItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: val,
            status: 'today'
        };
        if (type === 'before') {
            setBeforeTasks(prev => [...prev, newItem]);
            setBeforeInput('');
        } else {
            setAfterTasks(prev => [...prev, newItem]);
            setAfterInput('');
        }
    };

    const removeItem = (type: 'before' | 'after', id: string) => {
        if (type === 'before') setBeforeTasks(prev => prev.filter(item => item.id !== id));
        else setAfterTasks(prev => prev.filter(item => item.id !== id));
    };

    const handlePhotoUpload = (type: 'before' | 'after') => {
        const mockUrl = type === 'before' 
            ? "https://images.unsplash.com/photo-1503387762-592dee581106?auto=format&fit=crop&q=80&w=400"
            : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400";
            
        if (type === 'before') {
            const nextPhotos = [...beforePhotos, mockUrl];
            setBeforePhotos(nextPhotos);
            toast.success("Before photo uploaded!");
            updateTaskPhotosAndStatus(nextPhotos, afterPhotos);
        } else {
            const nextPhotos = [...afterPhotos, mockUrl];
            setAfterPhotos(nextPhotos);
            toast.success("After photo uploaded!");
            updateTaskPhotosAndStatus(beforePhotos, nextPhotos);
        }
    };

    const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
        if (type === 'before') {
            const nextPhotos = beforePhotos.filter((_, i) => i !== index);
            setBeforePhotos(nextPhotos);
            toast.success("Before photo removed!");
            updateTaskPhotosAndStatus(nextPhotos, afterPhotos);
        } else {
            const nextPhotos = afterPhotos.filter((_, i) => i !== index);
            setAfterPhotos(nextPhotos);
            toast.success("After photo removed!");
            updateTaskPhotosAndStatus(beforePhotos, nextPhotos);
        }
    };

    const handleSubmit = () => {
        if (!progress || beforePhotos.length === 0 || afterPhotos.length === 0) {
            toast.error("Please fill in all details and upload photos!");
            return;
        }
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: 'Submitting update...',
                success: 'Daily update submitted successfully!',
                error: 'Could not submit update.',
            }
        ).then(() => {
            // Trigger completion status on submit if not already complete
            if (activeTask && activeTask.status !== 'Completed') {
                updateTaskPhotosAndStatus(beforePhotos, [...afterPhotos, "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400"]);
            }
            toast.success("Task completed successfully!");
            navigate('/labour/tasks');
        });
    };

    return (
        <>
            <Navbar title="Work Updates" breadcrumb={['InfraPilot', 'Labour', 'Daily Update']} />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">
                <div className="w-full h-full space-y-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Today's Progress</h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2 ml-1">Submit your site updates and photos</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Session: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    {activeTask ? (
                        /* Active Task Card */
                        <div className="bg-indigo-900 text-white p-8 rounded-[40px] border border-indigo-950 shadow-xl relative overflow-hidden">
                            {/* Background pattern */}
                            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
                            
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="px-3.5 py-1 bg-white/20 text-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            {activeTask.id}
                                        </span>
                                        <span className="px-3.5 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            {activeTask.project}
                                        </span>
                                        <span className={`px-3.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            activeTask.priority === 'High' ? 'bg-rose-500 text-white' : 
                                            activeTask.priority === 'Medium' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
                                        }`}>
                                            {activeTask.priority} Priority
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">{activeTask.title}</h2>
                                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mt-1.5">
                                            Assignment: {activeTask.assignment} • Assigned by {activeTask.assignedBy}
                                        </p>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full md:w-96 space-y-2">
                                        <div className="flex justify-between text-xs font-black tracking-wider text-indigo-200 uppercase">
                                            <span>Progress</span>
                                            <span>{activeTask.completion_percentage}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${activeTask.completion_percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row md:flex-col gap-4 shrink-0 justify-end items-stretch sm:items-center md:items-stretch">
                                    <div className="bg-white/10 px-6 py-4 rounded-3xl border border-white/10 flex flex-col items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Current Status</span>
                                        <span className="text-base font-black uppercase tracking-widest mt-1 text-emerald-300">
                                            {activeTask.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSearchParams({})}
                                            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Deselect Task
                                        </button>
                                        <button 
                                            onClick={() => navigate('/labour/tasks')}
                                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/20 transition-all"
                                        >
                                            Back to Tasks
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Task Selector Banner (If no active task) */
                        <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
                            <div className="max-w-2xl">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Select a Task to Update</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1.5 mb-8">
                                    You must select a task to upload photos and report progress.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {tasks.map(task => (
                                    <div 
                                        key={task.id}
                                        onClick={() => setSearchParams({ taskId: task.id })}
                                        className="bg-slate-50 hover:bg-indigo-50/50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 shadow-sm cursor-pointer group transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-wider transition-colors">
                                                {task.id}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                                task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-slate-800 text-sm tracking-tight leading-snug group-hover:text-indigo-900 transition-colors">
                                            {task.title}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                                            Project: {task.project}
                                        </p>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                                            <div className="bg-indigo-600 h-full" style={{ width: `${task.completion_percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTask && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in duration-300">
                            {/* Main Content Area */}
                            <div className="xl:col-span-8 space-y-10">
                                {/* Daily Progress Info */}
                                <section className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-14 h-14 rounded-[22px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                                            <TrendingUp className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Work Details</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Describe your accomplishments</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={progress}
                                            onChange={(e) => setProgress(e.target.value)}
                                            placeholder="Example: Completed brickwork for 2 rooms on Level 2 section A. All reinforcement inspections cleared..."
                                            className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[35px] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-base font-bold text-slate-700 min-h-[220px] placeholder:text-slate-300 resize-none shadow-inner"
                                        />
                                        <div className="absolute right-6 bottom-6 flex items-center gap-2">
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${progress.length > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {progress.length} characters
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Before & After Cards */}
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-10">

                                    {/* ── Before Work Card ── */}
                                    <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Before Work</h2>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Initial site state</p>
                                            </div>
                                            <div className="px-4 py-1.5 bg-indigo-50 rounded-full">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{beforePhotos.length} / 4</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {beforePhotos.map((url, i) => (
                                                <div key={i} className="relative aspect-square rounded-[24px] overflow-hidden group shadow-sm border border-slate-50">
                                                    <img src={url} alt="Before" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <button
                                                            onClick={() => handleRemovePhoto('before', i)}
                                                            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-rose-500 text-white transition-all transform hover:rotate-12 flex items-center justify-center backdrop-blur-md border border-white/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {beforePhotos.length < 4 && (
                                                <button
                                                    onClick={() => handlePhotoUpload('before')}
                                                    className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group/btn bg-slate-50/50"
                                                >
                                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                                        <Camera className="w-5 h-5 text-indigo-500" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Photo</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100" />

                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prior Tasks & Reference</p>
                                                <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">from yesterday</span>
                                            </div>
                                            
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                {priorPhotos.map((url, i) => (
                                                    <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                                        <img src={url} alt="Prior" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={beforeInput}
                                                        onChange={e => setBeforeInput(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addItem('before')}
                                                        placeholder="Add initial observation..."
                                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                                                    />
                                                    <button
                                                        onClick={() => addItem('before')}
                                                        className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm shadow-indigo-200"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <ul className="flex flex-col gap-2">
                                                    {beforeTasks.map((item) => (
                                                        <li key={item.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 group/item border transition-all ${item.status === 'prior' ? 'bg-slate-50/50 border-slate-100' : 'bg-indigo-50/30 border-indigo-100 animate-in fade-in slide-in-from-left-2'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${item.status === 'prior' ? 'bg-slate-300' : 'bg-indigo-400'}`} />
                                                            <div className="flex-1">
                                                                <span className={`text-xs font-bold leading-snug ${item.status === 'prior' ? 'text-slate-500' : 'text-indigo-900'}`}>{item.text}</span>
                                                                {item.status === 'prior' && <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1">Pending from yesterday</p>}
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem('before', item.id)}
                                                                className="opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 shrink-0"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── After Work Card ── */}
                                    <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg font-black text-slate-800 tracking-tight">After Work</h2>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Final completion state</p>
                                            </div>
                                            <div className="px-4 py-1.5 bg-emerald-50 rounded-full">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{afterPhotos.length} / 4</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {afterPhotos.map((url, i) => (
                                                <div key={i} className="relative aspect-square rounded-[24px] overflow-hidden group shadow-sm border border-slate-50">
                                                    <img src={url} alt="After" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <button
                                                            onClick={() => handleRemovePhoto('after', i)}
                                                            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-rose-500 text-white transition-all transform hover:rotate-12 flex items-center justify-center backdrop-blur-md border border-white/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {afterPhotos.length < 4 && (
                                                <button
                                                    onClick={() => handlePhotoUpload('after')}
                                                    className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group/btn bg-slate-50/50"
                                                >
                                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                                        <Camera className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Photo</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100" />

                                        <div className="flex flex-col gap-6">
                                            {/* Prior Reference in After Card */}
                                            <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100/50">
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference: Prior State</p>
                                                </div>
                                                
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                                                    {priorPhotos.map((url, i) => (
                                                        <div key={i} className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white shadow-sm opacity-50">
                                                            <img src={url} alt="Prior" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>

                                                <ul className="flex flex-col gap-2">
                                                    {beforeTasks.filter(t => t.status === 'prior').map((item) => (
                                                        <li key={item.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100">
                                                            <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                            <span className="text-[10px] font-bold text-slate-500 truncate">{item.text}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="border-t border-slate-100" />

                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed Today</p>
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>

                                                <div className="flex gap-2 mb-4">
                                                    <input
                                                        type="text"
                                                        value={afterInput}
                                                        onChange={e => setAfterInput(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addItem('after')}
                                                        placeholder="Add specific completion..."
                                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                                                    />
                                                    <button
                                                        onClick={() => addItem('after')}
                                                        className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm shadow-emerald-200"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <ul className="flex flex-col gap-2">
                                                    {afterTasks.length > 0 ? (
                                                        afterTasks.map((item) => (
                                                            <li key={item.id} className="flex items-start gap-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl px-4 py-3 group/item animate-in fade-in slide-in-from-right-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                                                <span className="flex-1 text-xs font-bold text-emerald-900 leading-snug">{item.text}</span>
                                                                <button
                                                                    onClick={() => removeItem('after', item.id)}
                                                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity text-emerald-300 hover:text-rose-500 shrink-0"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <div className="py-8 border-2 border-dashed border-slate-50 rounded-[30px] flex flex-col items-center justify-center gap-2 opacity-40">
                                                            <Clipboard className="w-6 h-6 text-slate-300" />
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No completions added</p>
                                                        </div>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Summary & Submit Sidebar */}
                            <div className="xl:col-span-4 h-fit space-y-8 sticky top-24">
                                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <h2 className="text-2xl font-black mb-10 tracking-tight text-slate-800">Summary</h2>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Words</span>
                                            </div>
                                            <span className="text-xl font-black text-slate-800">{progress.split(' ').filter(x => x).length}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <Camera className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Media</span>
                                            </div>
                                            <span className="text-xl font-black text-slate-800">{beforePhotos.length + afterPhotos.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <CheckCircle className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Items</span>
                                            </div>
                                            <span className="text-xl font-black text-slate-800">{beforeTasks.length + afterTasks.length}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSubmit}
                                        className="w-full mt-10 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-[30px] font-black uppercase tracking-[0.25em] text-[11px] text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                                    >
                                        Submit Update <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <p className="text-[9px] font-bold text-center text-slate-400 mt-6 uppercase tracking-widest opacity-80 italic">Your update will be reviewed by Site Engineer</p>
                                </div>

                                <div className="bg-amber-50 p-10 rounded-[50px] border border-amber-100 relative overflow-hidden group">
                                    <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Clipboard className="w-32 h-32 text-amber-900" />
                                    </div>
                                    <div className="flex items-center gap-4 text-amber-600 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Clipboard className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Guidelines</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        {[
                                            "Use natural site light for photos",
                                            "Clear debris before 'after' photo",
                                            "Mention exact level/section",
                                            "Note any material shortages"
                                        ].map((guide, i) => (
                                            <li key={i} className="flex gap-4 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                                                <p className="text-xs font-bold text-amber-800 tracking-tight leading-relaxed">{guide}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>
        </>
    );
};

export default WorkUpdatesPage;
