import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
    Filter, Search, Calendar,
    CheckCircle, Clock, XCircle, List, Grid,
    Eye, Clipboard, ChevronDown, RefreshCw,
    Volume2, VolumeX
} from 'lucide-react';

interface Task {
    id: string; // prefixed e.g. TSK-131
    rawId: number; // numeric id
    title: string;
    project: string;
    assignedBy: string;
    assignedTo: string;
    assignedUserIds: string[]; // all assigned user IDs
    assignment: string;
    priority: 'Low' | 'Medium' | 'High';
    startDate: string;
    deadline: string;
    status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
    completion_percentage: number;
    beforePhotos?: string[];
    afterPhotos?: string[];
    audioUrl?: string | null;
}

const mapBackendTaskToFrontend = (item: any): Task => {
    let status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled' = 'Planned';
    const rawStatus = String(item.status || '').toLowerCase();
    if (rawStatus === 'completed') status = 'Completed';
    else if (rawStatus === 'in progress' || rawStatus === 'in_progress') status = 'In Progress';
    else if (rawStatus === 'cancelled' || rawStatus === 'hold') status = 'Cancelled';

    let priority: 'Low' | 'Medium' | 'High' = 'Medium';
    const rawPriority = String(item.priority || '').toLowerCase();
    if (rawPriority === 'low' || rawPriority === '1') priority = 'Low';
    else if (rawPriority === 'high' || rawPriority === '3') priority = 'High';
    else if (rawPriority === 'medium' || rawPriority === '2') priority = 'Medium';

    const assignedBy = item.created_by_user_name || 'Site Engineer';

    let assignedTo = 'Self';
    if (item.assigned_users && Array.isArray(item.assigned_users)) {
        if (item.assigned_users.length > 0) {
            assignedTo = item.assigned_users.map((u: any) => typeof u === 'object' ? u.name : u).join(', ');
        }
    }

    // Collect all assigned user IDs from the assigned_users array
    const assignedUserIds: string[] = [];
    if (item.assigned_users && Array.isArray(item.assigned_users)) {
        item.assigned_users.forEach((u: any) => {
            const uid = typeof u === 'object' ? (u.id ?? u.user_id) : u;
            if (uid !== null && uid !== undefined) assignedUserIds.push(String(uid));
        });
    } else if (item.assigned_user_id) {
        assignedUserIds.push(String(item.assigned_user_id));
    }

    return {
        id: `TSK-${item.id}`,
        rawId: Number(item.id),
        title: item.title || 'Unnamed Task',
        project: item.project_name || `Project ${item.project_id || 1}`,
        assignedBy,
        assignedTo,
        assignedUserIds,
        assignment: item.description ? (item.description.slice(0, 30) + (item.description.length > 30 ? '...' : '')) : 'General Work',
        priority,
        startDate: item.start_date || new Date().toISOString().split('T')[0],
        deadline: item.end_date || new Date().toISOString().split('T')[0],
        status,
        completion_percentage: Number(item.completion_percentage) || 0,
        beforePhotos: item.instruction_image_url ? [item.instruction_image_url] : [],
        afterPhotos: [],
        audioUrl: item.audio_instruction_url || null
    };
};

const MyTasksPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [activeTab, setActiveTab] = useState('Planned Tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [assignedFilter, setAssignedFilter] = useState('ALL TASKS');
    const [departmentFilter, setDepartmentFilter] = useState('All Departments');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal triggers
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // Selected Task context
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Status update state
    const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
    const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
    const [modalStatusUpdating, setModalStatusUpdating] = useState(false);

    // Per-tab result cache — avoids re-fetching on tab switch
    const [tabCache, setTabCache] = useState<Record<string, Task[]>>({});

    const projectId = user?.project_id || (user as any)?.user?.project_id || 1;
    const STATUS_OPTIONS: Task['status'][] = ['Planned', 'In Progress', 'Completed', 'Cancelled'];

    /**
     * Fetch tasks from the backend using tab-specific server-side filters:
     *  - Planned Tasks  → GET /tasks?status=Planned
     *  - My Tasks       → GET /tasks?assigned_user_id=<user.id>  (e.g. 174)
     *  - Project Tasks  → GET /tasks  (no filter — all project tasks)
     */
    const fetchTasksForTab = async (tab: string, forceRefresh = false) => {
        // Return cached results unless a force-refresh is requested
        if (!forceRefresh && tabCache[tab]) {
            setTasks(tabCache[tab]);
            return;
        }

        setLoading(true);
        try {
            const params: Record<string, any> = { limit: 100, offset: 0 };

            if (tab === 'Planned Tasks') {
                params.status = 'Planned';
                params.limit = 20;
                params.offset = 0;
            } else if (tab === 'My Tasks') {
                // Send the logged-in user's real backend ID as assigned_user_id filter
                const userId = Number(user?.id) || 174;
                params.assigned_user_id = userId;
                params.status = 'Planned';
                params.limit = 20;
                params.offset = 0;
            }
            // Project Tasks: no extra params → returns all project tasks

            const rawTasks = await projectService.getTasks(Number(projectId), params);
            const mapped = rawTasks.map(mapBackendTaskToFrontend);

            setTasks(mapped);
            setTabCache(prev => ({ ...prev, [tab]: mapped }));

            // Keep localStorage in sync for WorkUpdatesPage
            localStorage.setItem('labour_tasks', JSON.stringify(mapped));
        } catch (error) {
            console.error(`Failed to load tasks for tab "${tab}":`, error);
            // Fall back to localStorage cache if available
            const saved = localStorage.getItem('labour_tasks');
            if (saved) {
                try { setTasks(JSON.parse(saved)); } catch (_) { }
            }
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch from backend whenever the active tab or project changes
    useEffect(() => {
        fetchTasksForTab(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, projectId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (openStatusDropdown === null) return;
        const handler = () => setOpenStatusDropdown(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [openStatusDropdown]);

    // Handle GET task details
    const handleViewDetails = async (taskId: number) => {
        try {
            setDetailLoading(true);
            setIsDetailModalOpen(true);
            const data = await projectService.getTask(Number(projectId), taskId);
            setSelectedTask(data);
        } catch (err) {
            console.error("Failed to fetch task details:", err);
            toast.error("Failed to load task details");
            setIsDetailModalOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    // After a status update, bust the tab cache so the next fetch reflects the change
    const handleUpdateStatus = async (taskId: number, newStatus: Task['status'], fromModal = false) => {
        const prevTasks = tasks;
        const prevSelectedTask = selectedTask;

        // Optimistic update
        setTasks(prev => prev.map(t => t.rawId === taskId ? { ...t, status: newStatus } : t));
        if (fromModal && selectedTask) {
            setSelectedTask((prev: any) => prev ? { ...prev, status: newStatus } : prev);
        }
        setOpenStatusDropdown(null);

        try {
            if (fromModal) setModalStatusUpdating(true);
            else setStatusUpdating(taskId);

            await projectService.updateTaskStatus(Number(projectId), taskId, newStatus);
            toast.success(`Status updated to "${newStatus}"`);

            // Bust the tab cache so re-visiting any tab fetches fresh data
            setTabCache({});

            // Sync localStorage
            const updated = prevTasks.map(t => t.rawId === taskId ? { ...t, status: newStatus } : t);
            localStorage.setItem('labour_tasks', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to update task status:', err);
            toast.error('Failed to update status. Please try again.');
            setTasks(prevTasks);
            if (fromModal) setSelectedTask(prevSelectedTask);
        } finally {
            if (fromModal) setModalStatusUpdating(false);
            else setStatusUpdating(null);
        }
    };

    // Client-side secondary filters: search + status dropdown + assignment dropdown
    // Tab filtering is now done server-side (separate API call per tab)
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'All Status' || t.status === statusFilter;

            const currentUserId = String(user?.id || '');
            const currentUserName = (user?.name || '').toLowerCase();
            const isAssignedToMe =
                (currentUserId !== '' && t.assignedUserIds.includes(currentUserId)) ||
                (currentUserName !== '' && t.assignedTo.toLowerCase().includes(currentUserName));
            const matchesAssignment = assignedFilter === 'ALL TASKS' || isAssignedToMe;

            return matchesSearch && matchesStatus && matchesAssignment;
        });
    }, [tasks, searchQuery, statusFilter, assignedFilter, user?.id, user?.name]);

    const priorityBadge = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-rose-500 text-white';
            case 'Medium': return 'bg-blue-500 text-white';
            case 'Low': return 'bg-emerald-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Planned': return 'bg-slate-50 text-slate-600 border-slate-100';
            case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    return (
        <>
            <Navbar title="Task Management" breadcrumb={['Labour', 'Task Management']} />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Task Management</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Efficiently organize, track, and manage all your tasks in one place.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit mb-10">
                    {['Planned Tasks', 'My Tasks', 'Project Tasks'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
                    {[
                        { label: 'TOTAL TASKS', count: tasks.length, icon: List, color: 'indigo', status: 'All Status' },
                        { label: 'PLANNED', count: tasks.filter(t => t.status === 'Planned').length, icon: Calendar, color: 'slate', status: 'Planned' },
                        { label: 'IN PROGRESS', count: tasks.filter(t => t.status === 'In Progress').length, icon: Clock, color: 'blue', status: 'In Progress' },
                        { label: 'COMPLETED', count: tasks.filter(t => t.status === 'Completed').length, icon: CheckCircle, color: 'emerald', status: 'Completed' },
                        { label: 'CANCELLED', count: tasks.filter(t => t.status === 'Cancelled').length, icon: XCircle, color: 'rose', status: 'Cancelled' },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            onClick={() => setStatusFilter(stat.status)}
                            className={`bg-white p-6 rounded-[32px] border-2 transition-all cursor-pointer group hover:-translate-y-1 ${statusFilter === stat.status ? `border-${stat.color}-500 shadow-xl shadow-${stat.color}-50` : 'border-transparent shadow-sm hover:border-slate-100'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${statusFilter === stat.status ? `text-${stat.color}-600` : 'text-slate-400'}`}>{stat.label}</p>
                                    <h3 className="text-3xl font-black text-slate-800">{stat.count}</h3>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${statusFilter === stat.status ? `bg-${stat.color}-50 text-${stat.color}-500` : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters View Table Container */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">

                    {/* Filter Bar */}
                    <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row items-center justify-between gap-8 bg-slate-50/20">
                        <div className="flex flex-col md:flex-row items-center gap-8 w-full xl:w-auto">
                            <div className="flex items-center gap-4 text-slate-800 group">
                                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:rotate-12">
                                    <Filter className="w-5 h-5" />
                                </div>
                                <span className="font-black text-sm tracking-tight">All Tasks Filters</span>
                            </div>

                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto justify-end">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Status</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all min-w-[140px]"
                                >
                                    <option value="All Status">All Status</option>
                                    <option value="Planned">Planned</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Filter</span>
                                <select
                                    value={assignedFilter}
                                    onChange={(e) => setAssignedFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all min-w-[140px]"
                                >
                                    <option value="ALL TASKS">ALL TASKS</option>
                                    <option value="MY TASKS">MY TASKS</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Department</span>
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all min-w-[160px]"
                                >
                                    <option value="All Departments">ALL DEPARTMENTS</option>
                                    <option value="CONSTRUCTION">CONSTRUCTION</option>
                                    <option value="FINISHING">FINISHING</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 md:mt-5">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 rounded-xl transition-all shadow-sm ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 rounded-xl transition-all shadow-sm ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                            Loading Tasks...
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-8">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No tasks found</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* Table View */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        {['TASK', 'PROJECT', 'ASSIGNED BY', 'ASSIGNED TO', 'ASSIGNMENT', 'PRIORITY', 'TIMELINE', 'STATUS', 'AUDIO', 'ACTIONS'].map(header => (
                                            <th key={header} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map(task => (
                                        <tr
                                            key={task.id}
                                            onClick={() => navigate(`/labour/work-updates?taskId=${task.id}`)}
                                            className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 cursor-pointer"
                                        >
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 tracking-tight">{task.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{task.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-slate-600">{task.project}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                        {task.assignedBy.split(' ')[0][0]}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{task.assignedBy}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-500">
                                                        {task.assignedTo.split(' ')[0][0]}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{task.assignedTo}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{task.assignment}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityBadge(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1 text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Start Date" />
                                                        <span className="text-[10px] font-bold">{new Date(task.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                        <span className="text-[10px] text-slate-300 mx-1">-</span>
                                                        <span className="text-[10px] font-bold">{new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="End Date" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Calendar className="w-2.5 h-2.5 opacity-40" />
                                                        <span>Task Duration</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={() => setOpenStatusDropdown(openStatusDropdown === task.rawId ? null : task.rawId)}
                                                        disabled={statusUpdating === task.rawId}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-sm ${statusBadge(task.status)} ${statusUpdating === task.rawId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-300'}`}
                                                        title="Click to change status"
                                                    >
                                                        {statusUpdating === task.rawId
                                                            ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                            : <>{task.status}<ChevronDown className="w-2.5 h-2.5" /></>}
                                                    </button>
                                                    {openStatusDropdown === task.rawId && (
                                                        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-slate-100 rounded-2xl shadow-xl py-1 min-w-[160px] overflow-hidden">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-4 pt-2 pb-1">Change Status</p>
                                                            {STATUS_OPTIONS.map(s => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => handleUpdateStatus(task.rawId, s)}
                                                                    className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${task.status === s ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s === 'Completed' ? 'bg-emerald-500' :
                                                                        s === 'In Progress' ? 'bg-blue-500' :
                                                                            s === 'Planned' ? 'bg-slate-400' : 'bg-rose-500'
                                                                        }`} />
                                                                    {s}
                                                                    {task.status === s && <CheckCircle className="w-3 h-3 ml-auto text-indigo-500" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                                {task.audioUrl ? (
                                                    <button
                                                        onClick={() => {
                                                            const audio = new Audio(task.audioUrl!);
                                                            audio.play().catch(() => toast.error('Could not play audio'));
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-sm"
                                                        title="Play audio instruction"
                                                    >
                                                        <Volume2 className="w-3.5 h-3.5" />
                                                        Play
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase tracking-widest">
                                                        <VolumeX className="w-3.5 h-3.5" />
                                                        N/A
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleViewDetails(task.rawId)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-8 bg-slate-50/10">
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => navigate(`/labour/work-updates?taskId=${task.id}`)}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityBadge(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setOpenStatusDropdown(openStatusDropdown === task.rawId ? null : task.rawId)}
                                                    disabled={statusUpdating === task.rawId}
                                                    className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-sm cursor-pointer ${statusBadge(task.status)}`}
                                                    title="Click to change status"
                                                >
                                                    {statusUpdating === task.rawId
                                                        ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                        : <>{task.status}<ChevronDown className="w-2.5 h-2.5 ml-0.5" /></>}
                                                </button>
                                                {openStatusDropdown === task.rawId && (
                                                    <div className="absolute z-50 top-full mt-1 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl py-1 min-w-[160px] overflow-hidden">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-4 pt-2 pb-1">Change Status</p>
                                                        {STATUS_OPTIONS.map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleUpdateStatus(task.rawId, s)}
                                                                className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${task.status === s ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s === 'Completed' ? 'bg-emerald-500' :
                                                                    s === 'In Progress' ? 'bg-blue-500' :
                                                                        s === 'Planned' ? 'bg-slate-400' : 'bg-rose-500'
                                                                    }`} />
                                                                {s}
                                                                {task.status === s && <CheckCircle className="w-3 h-3 ml-auto text-indigo-500" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2 line-clamp-1">{task.title}</h3>
                                        <p className="text-slate-400 text-xs font-medium mb-4 line-clamp-2">{task.assignment}</p>

                                        <div className="border-t border-slate-50 pt-4 space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-400">Project:</span>
                                                <span className="font-bold text-slate-700">{task.project}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-400">Timeline:</span>
                                                <span className="font-bold text-slate-700">
                                                    {new Date(task.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-400">Assigned To:</span>
                                                <span className="font-bold text-indigo-600 truncate max-w-[150px]">{task.assignedTo}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleViewDetails(task.rawId)}
                                            className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/labour/work-updates?taskId=${task.id}`)}
                                            className="p-2.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            title="Submit Progress"
                                        >
                                            <Clipboard className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* Task Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Task Details"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-between gap-3 px-6 pb-6">
                        {/* Status updater in modal */}
                        {selectedTask && (
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Status:</span>
                                <div className="flex items-center gap-1.5">
                                    {STATUS_OPTIONS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleUpdateStatus(selectedTask.id, s, true)}
                                            disabled={modalStatusUpdating}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${selectedTask.status === s
                                                ? (s === 'Completed' ? 'bg-emerald-500 text-white border-emerald-500' :
                                                    s === 'In Progress' ? 'bg-blue-500 text-white border-blue-500' :
                                                        s === 'Planned' ? 'bg-slate-700 text-white border-slate-700' :
                                                            'bg-rose-500 text-white border-rose-500')
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                                } ${modalStatusUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {modalStatusUpdating && selectedTask.status === s
                                                ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                : null
                                            }
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsDetailModalOpen(false)}
                            className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-inter ml-auto"
                        >
                            Close
                        </button>
                    </div>
                }
            >
                {detailLoading ? (
                    <div className="py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                        Loading Task Details...
                    </div>
                ) : selectedTask ? (
                    <div className="p-6 space-y-6 font-inter text-slate-700">
                        <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedTask.title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">TASK ID: TSK-{selectedTask.id}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityBadge(selectedTask.priority)}`}>
                                    {selectedTask.priority}
                                </span>
                                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusBadge(selectedTask.status)}`}>
                                    {selectedTask.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</h4>
                                <p className="text-sm font-medium leading-relaxed text-slate-600">
                                    {selectedTask.description || "No description provided for this task."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeline</h4>
                                    <div className="flex flex-col text-sm font-bold text-slate-700">
                                        <span>Start: {selectedTask.start_date || 'N/A'}</span>
                                        <span>End: {selectedTask.end_date || 'N/A'}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration & Delay</h4>
                                    <div className="flex flex-col text-sm font-bold text-slate-700">
                                        <span>Execution: {selectedTask.execution_duration || 0} days</span>
                                        <span>Delayed: {selectedTask.is_delayed ? `${selectedTask.delay_days} days` : 'No Delay'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-50 pt-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignment Info</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                                            S
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Created By</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedTask.created_by_user_name || 'Site Engineer'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-500 shrink-0">
                                            A
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assigned Labour / Team</p>
                                            <p className="text-xs font-bold text-slate-700">
                                                {selectedTask.assigned_users && selectedTask.assigned_users.length > 0
                                                    ? selectedTask.assigned_users.map((u: any) => typeof u === 'object' ? u.name : `User ${u}`).join(', ')
                                                    : 'No assigned users'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Before Work & After Work Photos */}
                            <div className="border-t border-slate-50 pt-4">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Before Work Photos */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Before Work</h4>
                                        {selectedTask.instruction_image_url ? (
                                            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                <img
                                                    src={selectedTask.instruction_image_url}
                                                    alt="Before Work"
                                                    className="w-full h-40 object-cover hover:scale-105 transition-transform cursor-pointer"
                                                    onClick={() => window.open(selectedTask.instruction_image_url, '_blank')}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-40 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                                <span className="text-slate-300 text-2xl">📷</span>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No photo</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* After Work Photos */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">After Work</h4>
                                        {selectedTask.after_work_image_url ? (
                                            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                <img
                                                    src={selectedTask.after_work_image_url}
                                                    alt="After Work"
                                                    className="w-full h-40 object-cover hover:scale-105 transition-transform cursor-pointer"
                                                    onClick={() => window.open(selectedTask.after_work_image_url, '_blank')}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-40 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                                <span className="text-slate-300 text-2xl">📷</span>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No photo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </>
    );
};

export default MyTasksPage;
