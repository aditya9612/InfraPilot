import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taskRequestService } from '../../services/taskRequestService';
import type { TaskRequest } from '../../services/taskRequestService';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
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
    Edit3,
    XCircle,
    Eye,
    Trash2,
    ImagePlus,
    X
} from 'lucide-react';

interface Project {
    id: number;
    name: string;
}

const TaskRequestsPage: React.FC = () => {
    const { user } = useAuth();

    const formatDate = (dateStr?: string) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        if (isNaN(date.getTime())) return dateStr || '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatImageUrl = (url?: string, requestId?: number, title?: string) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('blob:')) {
            return url;
        }

        // Check local storage caches
        if (requestId) {
            const cachedById = localStorage.getItem(`task_req_att_${requestId}`);
            if (cachedById) return cachedById;
        }
        if (title) {
            const cachedByTitle = localStorage.getItem(`task_req_att_title_${title}`);
            if (cachedByTitle) return cachedByTitle;
        }
        const cachedByName = localStorage.getItem(`task_req_att_name_${url}`);
        if (cachedByName) return cachedByName;

        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Resolve backend URL
        let baseUrl = import.meta.env.VITE_API_URL || '';
        try {
            const parsed = new URL(baseUrl, window.location.origin);
            baseUrl = parsed.origin;
        } catch {
            baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
        }

        let cleanPath = url;
        if (!cleanPath.startsWith('/') && !cleanPath.startsWith('uploads/') && !cleanPath.startsWith('static/')) {
            cleanPath = `/uploads/${cleanPath}`;
        } else if (!cleanPath.startsWith('/')) {
            cleanPath = `/${cleanPath}`;
        }

        return `${baseUrl}${cleanPath}`;
    };

    const [title, setTitle] = useState('');
    const [project, setProject] = useState('');
    const [category, setCategory] = useState('New Task');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [description, setDescription] = useState('');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentFileName, setAttachmentFileName] = useState('');
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [assignedTo, setAssignedTo] = useState(0);

    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // List State
    const [requests, setRequests] = useState<TaskRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRequest, setEditingRequest] = useState<TaskRequest | null>(null);
    const [viewingRequest, setViewingRequest] = useState<TaskRequest | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Pagination State (0-indexed)
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const paginatedRequests = useMemo(() => {
        const start = currentPage * pageSize;
        return requests.slice(start, start + pageSize);
    }, [requests, currentPage, pageSize]);

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(requests.length / pageSize) - 1);
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [requests.length, pageSize, currentPage]);

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
                const res = await projectService.getProjects(100, 0);
                const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
                const mapped: Project[] = items.map((p: any) => ({
                    id: p.id || p.project_id,
                    name: p.project_name || p.name || `Project ${p.id}`,
                }));

                // Fallback to user default project if list is empty
                if (mapped.length === 0 && user.project_id && user.project_name) {
                    mapped.push({ id: user.project_id, name: user.project_name });
                }

                setProjects(mapped);
                if (mapped.length > 0) setProject(String(mapped[0].id));
            } catch (err) {
                console.error('Failed to load projects from API:', err);
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

    const formatApiError = (err: any, fallback: string): string => {
        if (!err) return fallback;
        if (typeof err === 'string') return err;
        const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            return detail
                .map((item: any) => {
                    if (typeof item === 'string') return item;
                    const loc = Array.isArray(item?.loc) ? item.loc.filter((l: any) => l !== 'body').join('.') : item?.loc;
                    const msg = item?.msg || item?.message || 'Field validation error';
                    if (loc) {
                        const formattedField = String(loc).replace(/_/g, ' ');
                        const capitalized = formattedField.charAt(0).toUpperCase() + formattedField.slice(1);
                        return `${capitalized}: ${msg}`;
                    }
                    return msg;
                })
                .filter(Boolean)
                .join('; ') || fallback;
        }
        if (detail && typeof detail === 'object') {
            try {
                return JSON.stringify(detail);
            } catch (_) {
                return fallback;
            }
        }
        return fallback;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !project) {
            toast.error("Please provide all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("project_id", String(project));
            formData.append("title", title);
            formData.append("category", category || "New Task");
            formData.append("priority", priority || "Medium");

            if (description) {
                formData.append("description", description);
            }

            if (assignedTo && Number(assignedTo) > 0) {
                formData.append("assigned_to", String(assignedTo));
            }

            if (attachmentFile) {
                formData.append("attachment", attachmentFile);
            }

            if (editingRequest) {
                // PUT /api/v1/projects/task-requests/{id} (multipart/form-data)
                await taskRequestService.updateRequest(editingRequest.id, formData);
                if (attachmentUrl) {
                    localStorage.setItem(`task_req_att_${editingRequest.id}`, attachmentUrl);
                    localStorage.setItem(`task_req_att_title_${title}`, attachmentUrl);
                    if (attachmentFileName) localStorage.setItem(`task_req_att_name_${attachmentFileName}`, attachmentUrl);
                }
                toast.success("Task request updated successfully!");
            } else {
                // POST /api/v1/projects/task-requests (multipart/form-data)
                const res: any = await taskRequestService.createRequest(formData);
                const createdId = res?.id || res?.data?.id || res?.request_id;
                if (attachmentUrl) {
                    if (createdId) localStorage.setItem(`task_req_att_${createdId}`, attachmentUrl);
                    localStorage.setItem(`task_req_att_title_${title}`, attachmentUrl);
                    if (attachmentFileName) localStorage.setItem(`task_req_att_name_${attachmentFileName}`, attachmentUrl);
                }
                toast.success("Task request submitted successfully!");
            }
            handleReset();
            fetchRequests(); // Refresh the list
        } catch (err: any) {
            const msg = formatApiError(err, editingRequest ? "Failed to update request" : "Failed to submit task request");
            toast.error(msg);
            console.error("Task request submit error:", err?.response?.data ?? err);
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
        setAttachmentFile(null);
        if (req.attachment_url) {
            setAttachmentPreview(formatImageUrl(req.attachment_url, req.id, req.title));
        } else {
            setAttachmentPreview(null);
        }
        setAttachmentFileName('');
        setAssignedTo(req.assigned_to || 0);

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this task request?")) return;
        try {
            await taskRequestService.deleteRequest(id);
            toast.success("Task request deleted successfully!");
            fetchRequests(); // Refresh the list
        } catch (err: any) {
            const msg = formatApiError(err, "Failed to delete request");
            toast.error(msg);
            console.error("Delete request error:", err);
        }
    };

    const handleReset = () => {
        setTitle('');
        setProject(projects.length > 0 ? String(projects[0].id) : '');
        setDescription('');
        setCategory('New Task');
        setPriority('Medium');
        setAttachmentFile(null);
        setAttachmentUrl('');
        setAttachmentFileName('');
        setAssignedTo(0);
        setAttachmentPreview(null);
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
                                        Category
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-indigo-400 transition-all"
                                        >
                                            <option value="">Select Category (Optional)</option>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                        Photo Attachment
                                    </label>
                                    <div className="relative h-[104px]">
                                        {attachmentPreview ? (
                                            <div className="relative w-full h-full rounded-xl border border-indigo-300 overflow-hidden bg-slate-50">
                                                <img src={attachmentPreview} alt="attachment preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setAttachmentPreview(null); setAttachmentUrl(''); setAttachmentFile(null); setAttachmentFileName(''); }}
                                                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center gap-1.5 w-full h-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                                                <ImagePlus className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500">Upload Photo</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setAttachmentFile(file);
                                                        setAttachmentFileName(file.name);
                                                        const preview = URL.createObjectURL(file);
                                                        setAttachmentPreview(preview);
                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            const dataUrl = reader.result as string;
                                                            setAttachmentUrl(dataUrl);
                                                            localStorage.setItem(`task_req_att_name_${file.name}`, dataUrl);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">
                                        Assigned To (ID)
                                    </label>
                                    <div className="h-[104px] flex items-center px-5 bg-slate-50/50 border border-slate-200 rounded-xl focus-within:border-indigo-400 transition-all">
                                        <input
                                            type="number"
                                            value={assignedTo || ''}
                                            onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : 0)}
                                            placeholder="Enter Engineer ID (Optional)"
                                            className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                                        />
                                    </div>
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
                                            <div className={`w-2 h-2 rounded-full ${lvl === 'Low' ? 'bg-emerald-400' :
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
                                    className={`flex-1 py-4 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 ${editingRequest ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
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
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {paginatedRequests.map((req, idx) => (
                                                <tr key={req.id || idx} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <h4 className="text-sm font-bold text-slate-800">{req.title}</h4>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-sm text-slate-600 font-medium max-w-[200px] truncate" title={req.description}>
                                                            {req.description}
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tight w-fit">
                                                            {req.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {(() => {
                                                            const p = (req.priority || '').toString().toUpperCase();
                                                            const isHigh = p === 'HIGH';
                                                            const isMedium = p === 'MEDIUM';
                                                            return (
                                                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isHigh ? 'text-rose-500' : isMedium ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                                    {req.priority}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                         {req.attachment_url ? (() => {
                                                             const resolvedImg = formatImageUrl(req.attachment_url, req.id, req.title);
                                                             const fileName = req.attachment_url.split('/').pop()?.split('\\').pop() || 'Attachment';
                                                             return (
                                                                 <div
                                                                     onClick={() => setPreviewImage(resolvedImg || req.attachment_url || null)}
                                                                     className="relative group/thumb w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                                                                     title={`View ${fileName}`}
                                                                 >
                                                                     <img
                                                                         src={resolvedImg}
                                                                         alt={fileName}
                                                                         className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                                                                         onError={(e) => {
                                                                             const target = e.target as HTMLElement;
                                                                             target.style.display = 'none';
                                                                             const parent = target.parentElement;
                                                                             if (parent) {
                                                                                 const fallback = parent.querySelector('.img-thumb-fallback') as HTMLElement;
                                                                                 if (fallback) fallback.style.display = 'flex';
                                                                             }
                                                                         }}
                                                                     />
                                                                     <div className="img-thumb-fallback hidden flex-col items-center justify-center text-slate-400 p-1 text-center">
                                                                         <ImagePlus className="w-5 h-5 text-indigo-400" />
                                                                     </div>
                                                                     <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                         <Eye className="w-4 h-4" />
                                                                     </div>
                                                                 </div>
                                                             );
                                                         })() : (
                                                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Attachment</span>
                                                         )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                            {formatDate(req.created_at)}
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
                                                            onClick={() => setViewingRequest(req)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(req)}
                                                            className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                                            title="Edit Request"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(req.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                            title="Delete Request"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!isLoadingRequests && requests.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={requests.length}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                    label="requests"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* View Request Details Modal */}
                <Modal
                    isOpen={viewingRequest !== null}
                    onClose={() => setViewingRequest(null)}
                    title="Task Request Details"
                    maxWidth="max-w-xl"
                >
                    {viewingRequest && (
                        <div className="space-y-6 p-2 font-inter text-slate-700">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    Task Title
                                </span>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {viewingRequest.title}
                                </h3>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    Description
                                </span>
                                <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl whitespace-pre-line border border-slate-100">
                                    {viewingRequest.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                        Category
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider inline-block">
                                        {viewingRequest.category}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                        Priority
                                    </span>
                                    {(() => {
                                        const p = (viewingRequest.priority || '').toString().toUpperCase();
                                        const isHigh = p === 'HIGH';
                                        const isMedium = p === 'MEDIUM';
                                        return (
                                            <span className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                                                isHigh ? 'text-rose-500' : isMedium ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full ${
                                                    isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} />
                                                {viewingRequest.priority}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                        Project ID
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {viewingRequest.project_id || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                        Date Submitted
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {formatDate(viewingRequest.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    Status
                                </span>
                                <div className="flex items-center gap-2">
                                    {viewingRequest.status?.toLowerCase() === 'approved' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : viewingRequest.status?.toLowerCase() === 'rejected' ? (
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    ) : (
                                        <Clock className="w-4 h-4 text-amber-500" />
                                    )}
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                                        {viewingRequest.status || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {viewingRequest.attachment_url && (() => {
                                const resolvedModalImg = formatImageUrl(viewingRequest.attachment_url, viewingRequest.id, viewingRequest.title);
                                return (
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                            Attachment Preview
                                        </span>
                                        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 p-3 flex flex-col items-center justify-center">
                                            <img
                                                src={resolvedModalImg}
                                                alt="Attachment"
                                                className="max-h-56 rounded-xl object-contain shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
                                                onClick={() => setPreviewImage(resolvedModalImg)}
                                                onError={(e) => {
                                                    const target = e.target as HTMLElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.img-modal-fallback') as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                            <div className="img-modal-fallback hidden flex-col items-center justify-center p-6 text-center">
                                                <ImagePlus className="w-10 h-10 text-indigo-400 mb-2" />
                                                <p className="text-xs font-bold text-slate-700">{viewingRequest.attachment_url}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setViewingRequest(null)}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Full Image Preview Modal */}
                <Modal
                    isOpen={previewImage !== null}
                    onClose={() => setPreviewImage(null)}
                    title="Attachment Image Preview"
                    maxWidth="max-w-3xl"
                >
                    {previewImage && (
                        <div className="p-4 flex flex-col items-center justify-center gap-4">
                            <div className="relative w-full min-h-[200px] max-h-[70vh] flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 p-3">
                                <img
                                    src={formatImageUrl(previewImage)}
                                    alt="Attachment Full Preview"
                                    className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
                                    onError={(e) => {
                                        const target = e.target as HTMLElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const fallback = parent.querySelector('.full-img-fallback') as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div className="full-img-fallback hidden flex-col items-center justify-center p-10 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3 shadow-sm">
                                        <ImagePlus className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-1">
                                        Attachment: {previewImage.split('/').pop()?.split('\\').pop()}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium max-w-md break-all">
                                        {previewImage}
                                    </p>
                                </div>
                            </div>
                            {(previewImage.startsWith('http') || previewImage.startsWith('data:') || previewImage.startsWith('blob:')) && (
                                <a
                                    href={formatImageUrl(previewImage)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-100"
                                >
                                    <Eye className="w-4 h-4" /> Open Full Image
                                </a>
                            )}
                        </div>
                    )}
                </Modal>
            </PageTransition>
        </div>
    );
};

export default TaskRequestsPage;
