import React, { useState, useMemo } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import {
    Filter, Search, Calendar,
    CheckCircle, Clock, XCircle, List, Grid,
    Eye, Loader2,
    Play
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TaskDetailModal from '../../components/labour/TaskDetailModal';

interface Task {
    id: number | string;
    title: string;
    project: string;
    assignedBy: string;
    assignedTo: string;
    assignment: string;
    priority: 'Low' | 'Medium' | 'High';
    startDate: string;
    deadline: string;
    status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled' | 'Ongoing' | 'On Hold' | 'Delayed';
    completion_percentage: number;
}

const MyTasksPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { speak } = useTextToAudio();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [activeTab, setActiveTab] = useState('All Tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [departmentFilter, setDepartmentFilter] = useState('ALL DEPARTMENTS');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                limit: 100,
                offset: 0
            };

            // Backend filtering based on active tab
            if (activeTab === 'All Tasks') {
                // Fetch all tasks for All Tasks tab
            } else if (activeTab === 'My Tasks') {
                params.assigned_user_id = user?.id ? Number(user.id) : 181;
            } else if (activeTab === 'Project Tasks') {
                // No specific status or user filter for project tasks
            }

            const projectId = 92; // Using the project ID 92 from the user's reference
            const response = await projectService.getTasks(projectId, params);

            const taskItems = Array.isArray(response) ? response : (response.items || []);

            const mappedTasks: Task[] = taskItems.map((t: any) => {
                // Determine assignee from assigned_users array
                const assignee = t.assigned_users && t.assigned_users.length > 0
                    ? (t.assigned_users[0].full_name || t.assigned_users[0].name || t.assigned_users[0].username || 'Assigned')
                    : (user?.name || 'Labour');

                // Check local storage for status updates
                const localStatus = localStorage.getItem(`task_status_${t.id}`);

                return {
                    id: t.id,
                    title: t.title || 'Untitled Task',
                    project: 'Project ID: ' + (t.project_id || projectId),
                    assignedBy: t.assigned_by_name || 'Site Engineer',
                    assignedTo: assignee,
                    assignment: t.description || 'No details provided',
                    priority: (t.priority === 'Low' || t.priority === 'Medium' || t.priority === 'High') ? t.priority : 'Medium',
                    startDate: t.start_date || '',
                    deadline: t.end_date || '',
                    status: (localStatus || t.status) as any,
                    completion_percentage: (localStatus === 'Completed' ? 100 : (localStatus === 'In Progress' ? 50 : (t.completion_percentage || 0)))
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
    }, [user?.id, activeTab]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 String(t.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 (t.assignment || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === 'All Status' || t.status === statusFilter;
            
            const matchesDepartment = departmentFilter === 'ALL DEPARTMENTS' || 
                                     (t.assignment || '').toUpperCase().includes(departmentFilter.toUpperCase());
            
            const matchesTab = activeTab === 'All Tasks' || 
                               (activeTab === 'My Tasks' && (
                                   (t.assignedTo || '').toLowerCase() === (user?.name || '').toLowerCase() ||
                                   (t.assignedTo || '').toLowerCase() === 'labour'
                               )) ||
                               (activeTab === 'Project Tasks');

            return matchesSearch && matchesStatus && matchesDepartment && matchesTab;
        });
    }, [tasks, searchQuery, statusFilter, departmentFilter, activeTab, user?.name]);

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
            case 'Ongoing': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'On Hold': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Delayed': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    const handleViewTask = async (taskId: number | string) => {
        setIsFetchingDetail(true);
        try {
            const data = await projectService.getTask(1, Number(taskId));
            // Map API response to Modal's expected Task interface
            const mappedTask = {
                id: String(data.id),
                name: data.title || 'Untitled Task',
                project: 'Project ' + (data.project_id || '1'),
                description: data.description || 'No description provided.',
                status: data.status === 'Planned' ? 'Pending' :
                    data.status === 'Completed' ? 'Completed' :
                        data.status === 'On Hold' ? 'Hold' : 'In Progress',
                priority: (data.priority === 'High' || data.priority === 'Medium' || data.priority === 'Low') ? data.priority : 'Medium',
                startDate: data.start_date || '',
                endDate: data.end_date || '',
                progress: data.completion_percentage || 0,
                assignedFrom: data.created_by_user_id === 1 ? 'Site Engineer' : 'Manager'
            };
            setSelectedTask(mappedTask);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching task details:', error);
            toast.error('Failed to load task details');
        } finally {
            setIsFetchingDetail(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            // Map modal status back to API status if needed
            const apiStatus = newStatus === 'Pending' ? 'Planned' :
                newStatus === 'Hold' ? 'On Hold' : newStatus;

            await projectService.updateTaskStatus(1, Number(taskId), apiStatus);
            toast.success('Status updated successfully');
            fetchTasks(); // Refresh list
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Task Matrix...</p>
                </div>
            </div>
        );
    }

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
                    {['All Tasks', 'My Tasks', 'Project Tasks'].map(tab => (
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
                                    <option>All Status</option>
                                    <option>Planned</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Filter</span>
                                <select
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all min-w-[140px]"
                                >
                                    <option>ALL TASKS</option>
                                    <option>MY TASKS</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Department</span>
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all min-w-[160px]"
                                >
                                    <option>ALL DEPARTMENTS</option>
                                    <option>CONSTRUCTION</option>
                                    <option>FINISHING</option>
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

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    {['TASK', 'PROJECT', 'ASSIGNED BY', 'ASSIGNED TO', 'ASSIGNMENT', 'PRIORITY', 'START DATE', 'END DATE', 'VOICE MSG', 'STATUS', 'ACTION'].map(header => (
                                        <th key={header} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr 
                                        key={task.id} 
                                        className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 cursor-pointer"
                                        onClick={() => navigate(`/labour/work-updates?taskId=${task.id}&taskName=${encodeURIComponent(task.title)}&taskCategory=${encodeURIComponent(task.assignment.split('|')[0] || '')}`)}
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
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold text-slate-600">
                                                    {task.startDate === 'Invalid Date' ? 'N/A' : new Date(task.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                <span className="text-[10px] font-bold text-slate-600">
                                                    {task.deadline === 'Invalid Date' ? 'N/A' : new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); speak(task.assignment || 'No voice message available for this task'); }}
                                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                                                title="Play Voice Message"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                            </button>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${statusBadge(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewTask(task.id); }}
                                                    disabled={isFetchingDetail}
                                                    className="p-2 text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
                                                    title="View"
                                                >
                                                    {isFetchingDetail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 px-8">
                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">No tasks found</h3>
                                <p className="text-slate-400 text-sm mt-2 font-medium">Try adjusting your filters or search terms.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            <TaskDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
                onUpdateStatus={handleUpdateTaskStatus}
            />
        </>
    );
};

export default MyTasksPage;
