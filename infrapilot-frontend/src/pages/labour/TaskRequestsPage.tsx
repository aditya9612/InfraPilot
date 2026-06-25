import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { 
    Send, 
    Clock, 
    CheckCircle, 
    XCircle, 
    RotateCcw, 
    ClipboardList,
    ChevronDown,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Undo,
    Redo,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Request {
    id: string;
    title: string;
    project: string;
    category: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    date: string;
    priority: 'Low' | 'Medium' | 'High';
}

const TaskRequestsPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [project, setProject] = useState('Urban Heights');
    const [category, setCategory] = useState('New Task');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [description, setDescription] = useState('');

    const [requests, setRequests] = useState<Request[]>([
        { id: 'REQ-401', title: 'Need help with plumbing', project: 'Urban Heights', category: 'Support', status: 'Pending', date: '16 Jun 2026', priority: 'High' },
        { id: 'REQ-402', title: 'Requesting tiling for Room 204', project: 'Urban Heights', category: 'New Task', status: 'Approved', date: '15 Jun 2026', priority: 'Medium' },
        { id: 'REQ-403', title: 'Broken drill machine', project: 'Urban Heights', category: 'Repair', status: 'Rejected', date: '14 Jun 2026', priority: 'High' },
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) {
            toast.error("Please provide a title and description");
            return;
        }

        const newReq: Request = {
            id: `REQ-${Math.floor(Math.random() * 900) + 100}`,
            title,
            project,
            category,
            status: 'Pending',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            priority
        };

        setRequests([newReq, ...requests]);
        handleReset();
        toast.success("Task request submitted!");
    };

    const handleReset = () => {
        setTitle('');
        setProject('Urban Heights');
        setDescription('');
        setCategory('New Task');
        setPriority('Medium');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar 
                title="Task Requests" 
                breadcrumb={['InfraPilot', 'Labour', 'Requests', 'Request a Task']} 
            />
            <PageTransition className="p-4 md:p-8 lg:p-12 font-inter pb-32">
                <div className="max-w-[1600px] mx-auto space-y-10">
                    
                    {/* Header with improved typography */}
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Request a Task</h1>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            SUBMIT NEW TASK REQUIREMENTS TO YOUR ENGINEER
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Main Form Section */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                
                                {/* Form Header */}
                                <div className="p-8 border-b border-slate-50 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <ClipboardList className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Task Information</h2>
                                        <p className="text-sm text-slate-400 font-medium">Provide the details of the task you need</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                    {/* Title and Category Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                                Task Title <span className="text-rose-500">*</span>
                                            </label>
                                            <input 
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="What needs to be done?"
                                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                                Category <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select 
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-indigo-400 transition-all"
                                                >
                                                    <option>New Task</option>
                                                    <option>Support</option>
                                                    <option>Repair</option>
                                                    <option>Correction</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                            Project Name <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={project}
                                                onChange={(e) => setProject(e.target.value)}
                                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-indigo-400 transition-all"
                                            >
                                                <option>Urban Heights</option>
                                                <option>Skyline Residency</option>
                                                <option>Elite Plaza</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Priority Selection with Dot indicator */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                            Priority <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex bg-slate-50/50 p-1 rounded-2xl border border-slate-200 gap-1">
                                            {(['Low', 'Medium', 'High'] as const).map(lvl => (
                                                <button
                                                    key={lvl}
                                                    type="button"
                                                    onClick={() => setPriority(lvl)}
                                                    className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                                        priority === lvl 
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                                                        : 'text-slate-500 hover:bg-white hover:text-slate-800'
                                                    }`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        lvl === 'Low' ? 'bg-emerald-400' : 
                                                        lvl === 'Medium' ? 'bg-amber-400' : 'bg-rose-400'
                                                    } ${priority === lvl ? 'bg-white' : ''}`} />
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detailed Description with Text Editor style */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                            Detailed Description <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-400 transition-all">
                                            <div className="flex items-center gap-1 p-3 bg-slate-50/50 border-b border-slate-200">
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><Bold className="w-4 h-4" /></button>
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><Italic className="w-4 h-4" /></button>
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><Underline className="w-4 h-4" /></button>
                                                <div className="w-px h-6 bg-slate-200 mx-2" />
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><List className="w-4 h-4" /></button>
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><ListOrdered className="w-4 h-4" /></button>
                                                <div className="w-px h-6 bg-slate-200 mx-2" />
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><Undo className="w-4 h-4" /></button>
                                                <button type="button" className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><Redo className="w-4 h-4" /></button>
                                            </div>
                                            <textarea 
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                                                placeholder="Provide more context about the task..."
                                                className="w-full p-5 min-h-[160px] focus:outline-none text-slate-700 text-sm font-medium placeholder:text-slate-300 border-none bg-white"
                                            />
                                            <div className="p-2 px-5 bg-slate-50/30 flex justify-end">
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{description.length}/1000</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            RESET FORM <RotateCcw className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            SUBMIT REQUEST <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sidebar Sections */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Recent Activity Card */}
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Recent Activity</h2>
                                        <Clock className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
                                </div>

                                <div className="space-y-4">
                                    {requests.map(req => (
                                        <div key={req.id} className="p-5 rounded-2xl bg-white border border-slate-50 transition-all hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-50 group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{req.id}</span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                                                            req.priority === 'High' ? 'text-rose-500' : 
                                                            req.priority === 'Medium' ? 'text-amber-500' : 'text-slate-400'
                                                        }`}>
                                                            {req.priority}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xs font-black text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{req.title}</h3>
                                                </div>
                                                <div className={`shrink-0 flex items-center justify-center ${
                                                    req.status === 'Approved' ? 'text-emerald-500' : 
                                                    req.status === 'Rejected' ? 'text-rose-500' : 'text-amber-400'
                                                }`}>
                                                    {req.status === 'Approved' ? <CheckCircle className="w-5 h-5" /> : req.status === 'Rejected' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{req.category}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{req.project}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400">{req.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                                    <RotateCcw className="w-3 h-3" />
                                    LOAD ALL HISTORY
                                </button>
                            </div>

                            {/* Important Guidelines Card */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-[32px] p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Important Guidelines</h2>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        'Provide a clear and detailed description',
                                        'Select the correct priority level',
                                        'Attach relevant files if necessary',
                                        'Our engineer will review and respond soon'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                            <span className="text-[11px] font-bold text-slate-600 leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>


                        </div>
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default TaskRequestsPage;
