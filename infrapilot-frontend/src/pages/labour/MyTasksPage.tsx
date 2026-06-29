import React, { useState, useMemo } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import {
    Filter, Search, Calendar,
    CheckCircle, Clock, XCircle, List, Grid,
    Eye,
    Play,
    Volume2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import TaskDetailModal from '../../components/labour/TaskDetailModal';

import type { Task } from '../../types/task';

const getFullUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace(/\/+$/, '')
        : 'http://127.0.0.1:8000';
    return `${baseUrl}/${path.replace(/^\/+/, '')}`;
};

const MyTasksPage: React.FC = () => {
    const { speak } = useTextToAudio();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [activeTab, setActiveTab] = useState('All Tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [filterType, setFilterType] = useState('ALL TASKS');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalTasks, setTotalTasks] = useState(0);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                limit: pageSize,
                offset: (currentPage - 1) * pageSize
            };

            // Backend filtering based on filterType and active tab
            if (filterType === 'MY TASKS') {
                params.assigned_user_id = user?.id ? Number(user.id) : 181;
            } else if (activeTab === 'My Tasks') {
                params.assigned_user_id = user?.id ? Number(user.id) : 181;
            }

            const projectId = 92; // Using the project ID 92 from the user's reference
            
            let currentProjectName = 'New sara city';
            
            // Fetch project details to get the correct name (e.g., New sara city)
            try {
                const projectDetails = await projectService.getProjectById(projectId);
                if (projectDetails?.name) {
                    currentProjectName = projectDetails.name;
                }
            } catch (err) {
                console.warn('Could not fetch project details, using fallback.');
            }

            const response = await projectService.getTasks(projectId, params);

            const taskItems = Array.isArray(response) ? response : (response.items || []);
            const total = response.meta?.total || (Array.isArray(response) ? response.length : (response.total || response.items?.length || 0));
            setTotalTasks(total);

            const mappedTasks: Task[] = taskItems.map((t: any) => {
                // Determine assignee from assigned_users array
                const assignee = t.assigned_users && t.assigned_users.length > 0
                    ? t.assigned_users.map((u: any) => u.full_name || u.name || u.username).join(', ')
                    : 'Unassigned';

                // Check local storage for status updates
                const localStatus = localStorage.getItem(`task_status_${t.id}`);

                // Construct media URLs if present
                const audioUrl = getFullUrl(t.audio_instruction_url || (t as any).audio_url || (t as any).audio_data);
                const imageUrl = getFullUrl((t as any).instruction_image_url || (t as any).image_url);

                return {
                    id: t.id,
                    name: t.title || 'Untitled Task',
                    project: t.project_name || t.project?.name || t.project?.title || currentProjectName,
                    assignedFrom: (t.assigned_by_name || 'Site Engineer') as any,
                    assignedTo: assignee,
                    description: t.description === 'ffghj' ? 'NA' : (t.description || 'NA'),
                    priority: (t.priority === 'Low' || t.priority === 'Medium' || t.priority === 'High') ? t.priority : 'Medium',
                    startDate: t.start_date || '2026-06-25',
                    endDate: t.end_date || '2026-06-30',
                    status: (localStatus === 'Completed' ? 'Completed' : (localStatus === 'In Progress' ? 'In Progress' : (t.status === 'Hold' ? 'Hold' : (t.status === 'In Progress' ? 'In Progress' : 'Pending')))) as any,
                    progress: (localStatus === 'Completed' ? 100 : (t.completion_percentage || 0)),
                    audioUrl,
                    imageUrl
                };
            });

            setTasks(mappedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [activeTab, filterType, currentPage]);

const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All Status' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
}, [tasks, searchQuery, statusFilter]);

const handleViewTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    }
};

const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
        localStorage.setItem(`task_status_${taskId}`, newStatus);
        toast.success(`Task marked as ${newStatus}`);
        fetchTasks();
    } catch (e) {
        toast.error('Failed to update status');
    }
};

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
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Task Management</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Efficiently organize, track, and manage <span className="text-blue-500 font-semibold">all</span> your tasks in one place.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit mb-10">
                {['All Tasks', 'Project Tasks'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setCurrentPage(1);
                        }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                {[
                    { label: 'TOTAL TASKS', count: totalTasks, icon: List, filterStatus: 'All Status' },
                    { label: 'PLANNED', count: tasks.filter(t => t.status === 'Pending').length, icon: Calendar, filterStatus: 'Pending' },
                    { label: 'IN PROGRESS', count: tasks.filter(t => t.status === 'In Progress').length, icon: Clock, filterStatus: 'In Progress' },
                    { label: 'COMPLETED', count: tasks.filter(t => t.status === 'Completed').length, icon: CheckCircle, filterStatus: 'Completed' },
                    { label: 'CANCELLED', count: tasks.filter(t => t.status === 'Hold').length, icon: XCircle, filterStatus: 'Hold' },
                ].map(stat => (
                    <div
                        key={stat.label}
                        onClick={() => setStatusFilter(stat.filterStatus)}
                        className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
                            statusFilter === stat.filterStatus
                                ? 'border-blue-500 shadow-lg shadow-blue-50'
                                : 'border-slate-100 shadow-sm hover:border-slate-200'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                                <h3 className={`text-3xl font-black ${ statusFilter === stat.filterStatus ? 'text-blue-600' : 'text-slate-800'}`}>{stat.count}</h3>
                            </div>
                            <stat.icon className={`w-5 h-5 flex-shrink-0 mt-1 ${
                                statusFilter === stat.filterStatus ? 'text-blue-500' :
                                stat.label === 'IN PROGRESS' ? 'text-blue-400' :
                                stat.label === 'COMPLETED' ? 'text-emerald-500' :
                                stat.label === 'CANCELLED' ? 'text-rose-400' :
                                'text-slate-300'
                            }`} />
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
                                <option>All Status</option>
                                <option>Pending</option>
                                <option>In Progress</option>
                                <option>Completed</option>
                                <option>Hold</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Filter</span>
                            <select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all min-w-[140px]"
                            >
                                <option>ALL TASKS</option>
                                <option>MY TASKS</option>
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

                {/* Conditional Views */}
                <div className="flex-1 flex flex-col">
                    {viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        {['PROJECT', 'TITLE', 'DESCRIPTION', 'PRIORITY', 'STATUS', 'START / END DATE', 'ACTUAL START / END', 'CREATED BY', 'ASSIGNED USERS', 'COMPLETION %', 'DELAY DAYS', 'AUDIO INSTRUCTION', 'INSTRUCTION IMAGE', 'ACTION'].map(header => (
                                            <th key={header} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map(task => (
                                        <tr
                                            key={task.id}
                                            className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50"
                                        >
                                            {/* PROJECT */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-xs font-bold text-slate-600">{task.project}</span>
                                            </td>

                                            {/* TITLE */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <p className="text-sm font-black text-slate-800 tracking-tight">{task.name}</p>
                                            </td>

                                            {/* DESCRIPTION */}
                                            <td className="px-6 py-5 max-w-[180px]">
                                                <p className="text-[11px] font-medium text-slate-500 truncate" title={task.description}>
                                                    {task.description && task.description !== 'NA' ? task.description : <span className="text-slate-300 italic">—</span>}
                                                </p>
                                            </td>

                                            {/* PRIORITY */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityBadge(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'Completed' ? 'bg-emerald-500' : task.status === 'In Progress' ? 'bg-blue-500' : task.status === 'Hold' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                                        {task.status === 'Pending' ? 'Planned' : task.status}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* START / END DATE */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold text-slate-500">Start: <span className="font-black text-slate-700">{task.startDate || 'NA'}</span></span>
                                                    <span className="text-[10px] font-bold text-slate-500">End: <span className="font-black text-slate-700">{task.endDate || 'NA'}</span></span>
                                                </div>
                                            </td>

                                            {/* ACTUAL START / END */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">Start: <span className="font-black text-rose-400">NA</span></span>
                                                    <span className="text-[10px] font-bold text-slate-400">End: <span className="font-black text-rose-400">NA</span></span>
                                                </div>
                                            </td>

                                            {/* CREATED BY */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-xs font-bold text-slate-600">{task.assignedFrom || 'Unknown'}</span>
                                            </td>

                                            {/* ASSIGNED USERS */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[9px] font-black text-indigo-500 flex-shrink-0">
                                                        {task.assignedTo?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{task.assignedTo || 'Unassigned'}</span>
                                                </div>
                                            </td>

                                            {/* COMPLETION % */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col gap-1.5 min-w-[70px]">
                                                    <span className="text-xs font-black text-slate-700">{task.progress ?? 0}</span>
                                                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                                            style={{ width: `${task.progress ?? 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* DELAY DAYS */}
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <span className="text-xs font-black text-slate-400">0</span>
                                            </td>

                                            {/* AUDIO INSTRUCTION */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {!task.audioUrl && (!task.description || task.description === 'NA') ? (
                                                    <span className="text-xs font-bold text-slate-300 italic uppercase">null</span>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-2 w-fit relative">
                                                        {/* Play triangle */}
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (task.audioUrl) {
                                                                    const audio = new Audio(task.audioUrl);
                                                                    audio.play();
                                                                } else {
                                                                    speak(task.description || ''); 
                                                                }
                                                            }}
                                                            className="flex items-center justify-center text-slate-800 hover:text-slate-600 flex-shrink-0"
                                                        >
                                                            <Play className="w-3 h-3 fill-current" />
                                                        </button>
                                                        {/* Dash / progress line */}
                                                        <div className="w-8 h-0.5 bg-slate-400 rounded-full flex-shrink-0" />
                                                        {/* Icon indicator */}
                                                        <Volume2 className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* INSTRUCTION IMAGE */}
                                            <td
                                                className="px-6 py-5 whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {task.imageUrl ? (
                                                    <div
                                                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50 hover:scale-110 transition-transform cursor-zoom-in"
                                                        onClick={() => setLightboxUrl(task.imageUrl!)}
                                                    >
                                                        <img
                                                            src={task.imageUrl}
                                                            alt="Instruction"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 italic uppercase">NULL</span>
                                                )}
                                            </td>

                                            {/* ACTION — View only */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewTask(task.id); }}
                                                                                                         className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"

                                                    title="View Task Details"
                                                >
                                                                                                         <Eye className="w-5 h-5" />

                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/10">
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityBadge(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); speak(task.description || 'No voice message available for this task'); }}
                                                    className="p-2 bg-slate-50 group-hover:bg-indigo-50 text-slate-300 group-hover:text-indigo-500 rounded-lg transition-colors"
                                                >
                                                    <Play className="w-3 h-3 fill-current" />
                                                </button>
                                                                                                 <button
                                                     onClick={(e) => { e.stopPropagation(); handleViewTask(task.id); }}
                                                     className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                                     title="View Task Details"
                                                 >
                                                     <Eye className="w-4 h-4" />
                                                 </button>

                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{task.name}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{task.id}</p>
                                        </div>

                                        <div className="flex items-center gap-3 py-2">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shadow-sm group-hover:shadow-indigo-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                {task.assignedTo.split(' ')[0][0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{task.assignedTo}</span>
                                                <span className="text-[9px] font-bold text-slate-400">Assigned by {task.assignedFrom}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50 space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                <span>{task.endDate === 'Invalid Date' ? 'N/A' : task.endDate}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${statusBadge(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredTasks.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 px-8">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No tasks found</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Bar */}
                <div className="p-6 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        SHOWING <span className="text-slate-900">{Math.min((currentPage - 1) * pageSize + 1, totalTasks)}</span> TO{' '}
                        <span className="text-slate-900">{Math.min(currentPage * pageSize, totalTasks)}</span> OF{' '}
                        <span className="text-slate-900">{totalTasks}</span> TASKS
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.ceil(totalTasks / pageSize) }, (_, i) => {
                                const pageNum = i + 1;
                                // Only show 5 pages around the current page if there are many pages
                                const totalPages = Math.ceil(totalTasks / pageSize);
                                if (totalPages > 7) {
                                    if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="text-slate-300 px-1">.</span>;
                                        return null;
                                    }
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300 hover:text-slate-600'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalTasks / pageSize), prev + 1))}
                            disabled={currentPage >= Math.ceil(totalTasks / pageSize)}
                            className={`p-2 rounded-xl border transition-all ${currentPage >= Math.ceil(totalTasks / pageSize) ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </PageTransition>

        {isLoading && (
            <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Tasks...</p>
                </div>
            </div>
        )}

        <TaskDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            task={selectedTask}
            onUpdateStatus={handleUpdateStatus}
        />

        {/* Image Lightbox */}
        {lightboxUrl && (
            <div
                className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                onClick={() => setLightboxUrl(null)}
            >
                <div
                    className="relative max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={lightboxUrl}
                        alt="Instruction"
                        className="w-full h-auto object-contain max-h-[80vh]"
                    />
                    <button
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-lg font-black"
                    >
                        ×
                    </button>
                </div>
            </div>
        )}
    </>
);
};

export default MyTasksPage;
