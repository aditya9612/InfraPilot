import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taskRequestService } from '../../services/taskRequestService';
import type { TaskRequest } from '../../services/taskRequestService';
import {
    Send,
    RotateCcw,
    ClipboardList,
    ChevronDown,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Calendar,
    RefreshCw,
    MoreVertical,
    Edit3,
    XCircle
} from 'lucide-react';

interface Project {
    id: number;
    name: string;
}

const TaskRequestsPage: React.FC = () => {
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [project, setProject] = useState('');
    const [category, setCategory] = useState('New Task');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [description, setDescription] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [assignedTo, setAssignedTo] = useState(0);

    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // List State
    const [requests, setRequests] = useState<TaskRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRequest, setEditingRequest] = useState<TaskRequest | null>(null);

    const fetchRequests = React.useCallback(async () => {
        setIsLoadingRequests(true);
        try {
            const data = await taskRequestService.getRequests();
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            toast.error("Could not load active requests");
        } finally {
            setIsLoadingRequests(false);
        }
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            setLoadingProjects(true);
            try {
                const assigned = await projectService.getAssignedProjects(Number(user.id));
                const mapped: Project[] = assigned.map((p: any) => ({
                    id: p.id || p.project_id,
                    name: p.project_name || p.name || `Project ${p.id}`,
                }));

                // If no assigned projects found but user has a default project, use that
                if (mapped.length === 0 && user.project_id && user.project_name) {
                    mapped.push({ id: user.project_id, name: user.project_name });
                }

                setProjects(mapped);
                if (mapped.length > 0) setProject(String(mapped[0].id));
            } catch (err) {
                console.error('Failed to load assigned projects:', err);
                // Fallback to user's default project
                if (user.project_id && user.project_name) {
                    setProjects([{ id: user.project_id, name: user.project_name }]);
                    setProject(String(user.project_id));
                }
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchProjects();
        fetchRequests();
    }, [user, fetchRequests]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !project) {
            toast.error("Please provide all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingRequest) {
                // Update existing
                await taskRequestService.updateRequest(editingRequest.id, {
                    title,
                    description,
                    category,
                    priority,
                    project_id: project,
                    attachment_url: attachmentUrl,
                    assigned_to: assignedTo
                });
                toast.success("Task request updated successfully!");
            } else {
                // Create new
                await taskRequestService.createRequest({
                    title,
                    description,
                    category,
                    priority,
                    project_id: project,
                    attachment_url: attachmentUrl,
                    assigned_to: assignedTo
                });
                toast.success("Task request submitted successfully!");
            }
            handleReset();
            fetchRequests(); // Refresh the list
        } catch (err) {
            toast.error(editingRequest ? "Failed to update request" : "Failed to submit task request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (req: TaskRequest) => {
        setEditingRequest(req);
        setTitle(req.title);
        setDescription(req.description);
        setCategory(req.category);
        setPriority(req.priority as any);
        setProject(String(req.project_id || ''));
        setAttachmentUrl(req.attachment_url || '');
        setAssignedTo(req.assigned_to || 0);
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReset = () => {
        setTitle('');
        setProject(projects.length > 0 ? String(projects[0].id) : '');
        setDescription('');
        setCategory('New Task');
        setPriority('Medium');
        setAttachmentUrl('');
        setAssignedTo(0);
        setEditingRequest(null);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar
                title="Task Requests"
                breadcrumb={['InfraPilot', 'Labour', 'Requests', 'Request a Task']}
            />
            <PageTransition className="p-4 md:p-8 lg:p-12 font-inter pb-32">
                <div className="max-w-[1600px] mx-auto space-y-10">

                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Request a Task</h1>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            SUBMIT NEW TASK REQUIREMENTS TO YOUR ENGINEER
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">

                        {/* Form Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                <ClipboardList className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingRequest ? 'Edit Task Request' : 'Task Information'}
                                </h2>
                                <p className="text-sm text-slate-400 font-medium">
                                    {editingRequest ? `Updating request #${editingRequest.id}` : 'Provide the details of the task you need'}
                                </p>
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

                            {/* Project Selection — dynamically populated from API */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                    Project Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={project}
                                        onChange={(e) => setProject(e.target.value)}
                                        disabled={loadingProjects}
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-indigo-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loadingProjects ? (
                                            <option value="">Loading projects...</option>
                                        ) : projects.length === 0 ? (
                                            <option value="">No projects assigned</option>
                                        ) : (
                                            projects.map((p) => (
                                                <option key={p.id} value={String(p.id)}>{p.name}</option>
                                            ))
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Attachment and Assigned To Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                        Attachment URL
                                    </label>
                                    <input
                                        type="text"
                                        value={attachmentUrl}
                                        onChange={(e) => setAttachmentUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                        Assigned To (ID)
                                    </label>
                                    <input
                                        type="number"
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(Number(e.target.value))}
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Priority Selection */}
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
                                            className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${priority === lvl
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

                            {/* Detailed Description */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                    Detailed Description <span className="text-rose-500">*</span>
                                </label>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-400 transition-all">
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
                                    {editingRequest ? 'CANCEL EDIT' : 'RESET FORM'} 
                                    {editingRequest ? <XCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 py-4 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 ${
                                        editingRequest ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
                                    }`}
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRequest ? <Edit3 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    {editingRequest ? 'UPDATE REQUEST' : 'SUBMIT REQUEST'}
                                </button>
                            </div>

                        </form>
                    </div>

                    {/* Active Requests List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Requests</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    TRACK THE STATUS OF YOUR SUBMITTED REQUISITIONS
                                </p>
                            </div>
                            <button 
                                onClick={fetchRequests}
                                className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all active:rotate-180 duration-500"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                            {isLoadingRequests ? (
                                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Synchronizing Data...</p>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 opacity-30">
                                    <ClipboardList className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">No requests found</p>
                                    <p className="text-[11px] font-medium text-slate-300 mt-2">Submit your first task request using the form above</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {requests.map((req, idx) => (
                                                <tr key={req.id || idx} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800 mb-0.5">{req.title}</h4>
                                                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{req.description}</p>
                                                            {req.attachment_url && (
                                                                <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-indigo-600 uppercase mt-1 inline-block hover:underline">
                                                                    View Attachment
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tight w-fit">
                                                                {req.category}
                                                            </span>
                                                            <span className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Assigned: {req.assigned_to || 'None'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                                            req.priority === 'High' ? 'text-rose-500' :
                                                            req.priority === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                                                        }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                                req.priority === 'High' ? 'bg-rose-500' :
                                                                req.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`} />
                                                            {req.priority}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                            {req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Today'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            {req.status?.toLowerCase() === 'approved' ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            ) : req.status?.toLowerCase() === 'rejected' ? (
                                                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                                            ) : (
                                                                <Clock className="w-4 h-4 text-amber-500" />
                                                            )}
                                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                                                {req.status || 'Pending'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEdit(req)}
                                                            className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-amber-500 hover:border-amber-100 transition-all"
                                                            title="Edit Request"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default TaskRequestsPage;
