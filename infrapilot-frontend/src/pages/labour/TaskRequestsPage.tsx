import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { Send, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Request {
    id: string;
    title: string;
    category: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    date: string;
    urgency: 'Low' | 'Medium' | 'High';
}

const TaskRequestsPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('New Task');
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [description, setDescription] = useState('');

    const [requests, setRequests] = useState<Request[]>([
        { id: 'REQ-401', title: 'Need help with plumbing', category: 'Support', status: 'Pending', date: '16 Jun 2026', urgency: 'High' },
        { id: 'REQ-402', title: 'Requesting tiling for Room 204', category: 'New Task', status: 'Approved', date: '15 Jun 2026', urgency: 'Medium' },
        { id: 'REQ-403', title: 'Broken drill machine', category: 'Repair', status: 'Rejected', date: '14 Jun 2026', urgency: 'High' },
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
            category,
            status: 'Pending',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            urgency
        };

        setRequests([newReq, ...requests]);
        setTitle('');
        setDescription('');
        toast.success("Task request sent!");
    };

    return (
        <>
            <Navbar title="Task Requests" breadcrumb={['InfraPilot', 'Labour', 'Requests']} />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">
                <div className="w-full h-full space-y-10">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Request a Task</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2 ml-1">Submit new task requirements to your engineer</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                        {/* Request Form */}
                        <div className="xl:col-span-7">
                            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</span>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="What needs to be done?"
                                                className="mt-2 w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-slate-700"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</span>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="mt-2 w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-slate-700 appearance-none"
                                            >
                                                <option>New Task</option>
                                                <option>Support</option>
                                                <option>Repair</option>
                                                <option>Correction</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgency Level</span>
                                    <div className="flex gap-4">
                                        {(['Low', 'Medium', 'High'] as const).map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setUrgency(lvl)}
                                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${urgency === lvl ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</span>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide more context about the task..."
                                            className="mt-2 w-full p-6 bg-slate-50 border border-slate-100 rounded-[35px] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm font-bold text-slate-700 min-h-[180px] resize-none shadow-inner"
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[30px] font-black uppercase tracking-[0.25em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100"
                                >
                                    Send Request <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>

                        {/* Recent Requests */}
                        <div className="xl:col-span-5 space-y-8">
                            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm h-fit">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                        Recent Activity <Clock className="w-5 h-5 text-slate-300" />
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {requests.map(req => (
                                        <div key={req.id} className="p-6 rounded-[32px] border border-slate-50 bg-slate-50 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-lg hover:shadow-slate-100 group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{req.id}</span>
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${req.urgency === 'High' ? 'bg-rose-50 text-rose-500' : req.urgency === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {req.urgency}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-700 mt-2 line-clamp-1">{req.title}</h3>
                                                </div>
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-500' : req.status === 'Rejected' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                                    {req.status === 'Approved' ? <CheckCircle className="w-5 h-5" /> : req.status === 'Rejected' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{req.category}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{req.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-8 py-4 bg-slate-50 text-slate-400 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all">
                                    Load All History
                                </button>
                            </div>

                            <div className="bg-indigo-900 p-10 rounded-[50px] text-white relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <AlertCircle className="w-32 h-32" />
                                </div>
                                <h3 className="text-lg font-black mb-4 relative z-10">Pro Tip</h3>
                                <p className="text-xs font-bold text-indigo-200 leading-loose relative z-10">
                                    Include as much detail as possible in your requests. This helps engineers approve your tasks faster.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default TaskRequestsPage;
