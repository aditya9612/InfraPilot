import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import toast from 'react-hot-toast';
import { 
    Filter, Search, Plus, Eye, Calendar, User, 
    CheckCircle, Clock, AlertCircle, XCircle, List, Grid, 
    Download, Share2, ChevronDown, ChevronUp, Folder,
    Paperclip, Send, X, FileText, Edit2, Trash2, Play
} from 'lucide-react';
import ConfirmModal from "../../../components/common/ConfirmModal";
import CreateTaskDrawer from './CreateTaskDrawer';
import Modal from '../../../components/common/Modal';
import { projectService } from '../../../services/projectService';
import type { Task, ProjectMember, ProjectStatus } from '../../../types/project';

interface FrontendTask extends Omit<Task, 'priority'> {
    priority: "LOW" | "MEDIUM" | "HIGH";
    assignedBy: { name: string; role: string };
    assignedTo: { name: string; role: string };
    hasHistory: boolean;
    projectName?: string;
    audio_data?: string;
}



const priorityBadges: Record<string, string> = {
    LOW: "bg-emerald-500 text-white",
    MEDIUM: "bg-blue-500 text-white",
    HIGH: "bg-rose-500 text-white",
};

const mapPriority = (priority: number | string): "LOW" | "MEDIUM" | "HIGH" => {
    if (priority === 1 || priority === "High" || priority === "HIGH") return "HIGH";
    if (priority === 2 || priority === "Medium" || priority === "MEDIUM") return "MEDIUM";
    return "LOW";
};

const TaskManagementPage = () => {
    const [projectId, setProjectId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<FrontendTask[]>([]);
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [departmentFilter, setDepartmentFilter] = useState("All Departments");
    const [ownershipFilter, setOwnershipFilter] = useState("Entire View");

    const [activeTab, setActiveTab] = useState("All Tasks");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    
    // Project Accordion State
    const [expandedProjects, setExpandedProjects] = useState<number[]>([]);
    
    // Modal State
    const [selectedTask, setSelectedTask] = useState<FrontendTask | null>(null);
    const [modalTab, setModalTab] = useState<"Details" | "Activity" | "Comments">("Details");

    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditTask, setSelectedEditTask] = useState<FrontendTask | null>(null);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        try {
            const [fetchedTasks, fetchedMembers] = await Promise.all([
                projectService.getTasks(projectId),
                projectService.getProjectMembers(projectId)
            ]);
            
            const membersList: ProjectMember[] = Array.isArray(fetchedMembers) ? fetchedMembers : (fetchedMembers.items || fetchedMembers.data || []);

            const userStr = localStorage.getItem("infrapilot_user");
            let pName = "Unknown Project";
            if (userStr) {
                const user = JSON.parse(userStr);
                const assignedProjects = user.assigned_projects || [];
                const matched = assignedProjects.find((p: any) => p.id === projectId);
                if (matched) pName = matched.name;
            }

            const mappedTasks: FrontendTask[] = (Array.isArray(fetchedTasks) ? fetchedTasks : (fetchedTasks.items || fetchedTasks.data || [])).map((t: Task & { audio_data?: string }) => {
                const assignee = membersList.find(m => m.user_id === t.assigned_user_id);
                // Hardcoding assigner to Admin for now or if we had a created_by field
                const assigner = { name: "System / Admin", role: "Manager" };
                
                return {
                    ...t,
                    priority: mapPriority(t.priority),
                    assignedBy: assigner,
                    assignedTo: { 
                        name: assignee?.full_name || "Unassigned", 
                        role: assignee?.role || "Engineer" 
                    },
                    hasHistory: false,
                    projectName: pName,
                    audio_data: t.audio_data
                };
            });
            setTasks(mappedTasks);
        } catch (error) {
            console.error("Failed to fetch task data:", error);
            toast.error("Failed to load tasks");
        }
    }, [projectId]);

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    setProjectId(Number(pId));
                } else {
                    setProjectId(92);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
            }
        }
    }, []);

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId, fetchData]);

    const openEditModal = (task: FrontendTask) => {
        setSelectedEditTask(task);
        setIsEditModalOpen(true);
    };

    const handleEditFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!projectId || !selectedEditTask) return;
        const formData = new FormData(e.currentTarget);
        
        try {
            const updatedTaskData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as string,
                status: formData.get('status') as string,
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') as string,
                assigned_user_ids: [parseInt(formData.get('assigned_user_id') as string) || 1]
            };

            const updatedTaskResponse = await projectService.updateTask(projectId, selectedEditTask.id, updatedTaskData);
            
            // Optimistic UI Update
            setTasks(prevTasks => prevTasks.map(t => {
                if (t.id === selectedEditTask.id) {
                    const selectEl = document.querySelector('select[name="assigned_user_id"]') as HTMLSelectElement;
                    const assignedName = selectEl ? selectEl.options[selectEl.selectedIndex].text : t.assignedTo.name;
                    return {
                        ...t,
                        ...updatedTaskData,
                        ...updatedTaskResponse,
                        priority: mapPriority(updatedTaskData.priority),
                        status: updatedTaskData.status as any,
                        assigned_user_id: updatedTaskData.assigned_user_ids[0],
                        assignedTo: {
                            ...t.assignedTo,
                            name: assignedName
                        }
                    };
                }
                return t;
            }));

            toast.success("Task updated successfully");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update task");
        }
    };



    const toggleProject = (id: number) => {
        setExpandedProjects(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const openTaskModal = async (task: FrontendTask) => {
        if (!projectId) return;
        try {
            const fetchedTask = await projectService.getTask(projectId, task.id);
            setSelectedTask({
                ...task,
                ...fetchedTask,
                priority: task.priority
            });
            setModalTab("Details");
        } catch (error) {
            toast.error("Failed to fetch task details");
        }
    };

    const handleDeleteTask = (taskId: number) => {
        setDeleteId(taskId);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteTask = async () => {
        if (!projectId || !deleteId) return;
        setIsSubmitting(true);
        try {
            await projectService.deleteTask(projectId, deleteId);
            toast.success("Task deleted successfully");
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to delete task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (!projectId) return;
        
        try {
            await projectService.updateTaskStatus(projectId, taskId, newStatus);
            toast.success("Status updated");
            fetchData();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            let match = true;
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) match = false;
            if (statusFilter !== "All Status" && t.status !== statusFilter) match = false;
            if (ownershipFilter === "My Projects" && t.assignedTo.name === "Unassigned") match = false; 
            // Add departmentFilter logic if needed later
            return match;
        });
    }, [tasks, searchQuery, statusFilter, ownershipFilter]);

    return (
        <>
            <Navbar title="Task Management" breadcrumb={["Engineer", "Task Management"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                
                {/* ─── Header Section ──────────────────────────────────────────────────────── */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Task Management</h1>
                        <p className="text-slate-500 text-sm">Efficiently organize, track, and manage all your tasks in one place</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTab !== "Project Tasks" && (
                            <button 
                                onClick={() => setIsCreateDrawerOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-indigo-600 transition-colors whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                Create Task
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Tabs Section ──────────────────────────────────────────────────────── */}
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 mb-6 border border-slate-200">
                    <button 
                        onClick={() => setActiveTab("All Tasks")}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === "All Tasks" 
                                ? "bg-indigo-500 text-white shadow-sm" 
                                : "text-slate-500 hover:bg-slate-200"
                        }`}
                    >
                        All Tasks
                    </button>
                    <button 
                        onClick={() => setActiveTab("Project Tasks")}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === "Project Tasks" 
                                ? "bg-indigo-500 text-white shadow-sm" 
                                : "text-slate-500 hover:bg-slate-200"
                        }`}
                    >
                        Project Tasks
                    </button>
                </div>

                {/* ─── Stats Cards Section ──────────────────────────────────────────────────────── */}
                {activeTab === "All Tasks" ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div onClick={() => setStatusFilter("All Status")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "All Status" ? 'border-primary ring-1 ring-primary shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "All Status" ? 'text-primary' : 'text-slate-400'}`}>Total Tasks</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                                <List className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Planned")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Planned" ? 'border-slate-500 ring-1 ring-slate-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Planned" ? 'text-slate-600' : 'text-slate-400'}`}>Planned</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Planned').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("In Progress")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "In Progress" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "In Progress" ? 'text-blue-500' : 'text-slate-400'}`}>In Progress</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'In Progress').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Completed")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Completed" ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Completed" ? 'text-emerald-500' : 'text-slate-400'}`}>Completed</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Completed').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Cancelled")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Cancelled" ? 'border-rose-500 ring-1 ring-rose-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Cancelled" ? 'text-rose-500' : 'text-slate-400'}`}>Cancelled</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Cancelled').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div onClick={() => setStatusFilter("All Status")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "All Status" ? 'border-primary ring-1 ring-primary shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "All Status" ? 'text-primary' : 'text-slate-400'}`}>Total Tasks</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                                <List className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Planned")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Planned" ? 'border-slate-500 ring-1 ring-slate-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Planned" ? 'text-slate-600' : 'text-slate-400'}`}>To Do</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Planned').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("In Progress")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "In Progress" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "In Progress" ? 'text-blue-500' : 'text-slate-400'}`}>In Progress</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'In Progress').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Completed")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Completed" ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Completed" ? 'text-emerald-500' : 'text-slate-400'}`}>Completed</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Completed').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Cancelled")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Cancelled" ? 'border-rose-500 ring-1 ring-rose-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Cancelled" ? 'text-rose-500' : 'text-slate-400'}`}>Cancelled</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Cancelled').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Filters Section ──────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                    
                    {activeTab === "All Tasks" ? (
                        <>
                            {/* All Tasks Filters Toolbar */}
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-6 text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                                            <Filter className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">All Tasks Filters</span>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 bg-slate-50 hover:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Status</span>
                                        <select 
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors"
                                        >
                                            <option>All Status</option>
                                            <option>Planned</option>
                                            <option>In Progress</option>
                                            <option>Completed</option>
                                            <option>Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Filter</span>
                                        <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors">
                                            <option>All Tasks</option>
                                            <option>Created Tasks</option>
                                            <option>Received Tasks</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Department</span>
                                        <select 
                                            value={departmentFilter}
                                            onChange={(e) => setDepartmentFilter(e.target.value)}
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors"
                                        >
                                            <option>All Departments</option>
                                            <option>Engineering</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-xl transition-colors border ${viewMode === 'list' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-xl transition-colors border ${viewMode === 'grid' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <Grid className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm">
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                </div>
                            </div>

                            {/* All Tasks Content */}
                            <div className="p-6 bg-slate-50 flex-1">
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredTasks.map(task => (
                                            <div key={task.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${task.status === 'Cancelled' ? 'border-rose-200' : 'border-slate-200'}`}>
                                                <div className="p-5 flex-1">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${priorityBadges[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                            {task.status === "Cancelled" && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white">
                                                                    CANCELLED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Cancelled' ? 'bg-rose-500' : task.status === 'Planned' ? 'bg-slate-400' : 'bg-blue-500'}`} />
                                                    </div>

                                                    <h3 className="text-base font-bold text-slate-800 mb-1">{task.title}</h3>
                                                    <p className="text-xs text-slate-500 mb-5 min-h-[32px] line-clamp-2">{task.description}</p>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-500">To:</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-slate-800">{task.assignedTo.name}</p>
                                                                <p className="text-[10px] text-slate-500">{task.assignedTo.role}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-500">By:</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-slate-800">{task.assignedBy.name}</p>
                                                                <p className="text-[10px] text-slate-500">{task.assignedBy.role}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-500">Due:</span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-800">{new Date(task.end_date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                    <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                                                        <Share2 className="w-3.5 h-3.5" />
                                                        View History
                                                    </button>
                                                    <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openTaskModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View Details">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto custom-scrollbar bg-white rounded-xl border border-slate-200">
                                        <table className="w-full text-left border-collapse block md:table">
                                            <thead className="hidden md:table-header-group">
                                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Project</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned By</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Assignment</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Priority</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="block md:table-row-group">
                                                {filteredTasks.map((task) => (
                                                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors block md:table-row">
                                                        <td className="p-4 block md:table-cell">
                                                            <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                            <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{task.description}</p>
                                                            {task.audio_data && (
                                                                <div className="mt-2 flex items-center gap-2 max-w-[160px] bg-slate-100/80 rounded-full p-1 pr-3 border border-slate-200/50">
                                                                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer" onClick={(e) => {
                                                                        const audio = e.currentTarget.parentElement?.querySelector('audio');
                                                                        if (audio) { audio.paused ? audio.play() : audio.pause(); }
                                                                    }}>
                                                                        <Play className="w-3 h-3 ml-0.5" />
                                                                    </div>
                                                                    <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden flex items-center">
                                                                        <div className="h-full bg-emerald-500 w-1/3"></div>
                                                                    </div>
                                                                    <audio src={task.audio_data} className="hidden" />
                                                                    <span className="text-[10px] font-bold text-slate-400">0:00</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 whitespace-nowrap">
                                                                {task.projectName}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <User className="w-3 h-3" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{task.assignedBy.name}</p>
                                                                    <p className="text-[10px] text-slate-500">{task.assignedBy.role}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <User className="w-3 h-3" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{task.assignedTo.name}</p>
                                                                    <p className="text-[10px] text-slate-500">{task.assignedTo.role}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${task.assignedTo.name === 'Unassigned' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {task.assignedTo.name === 'Unassigned' ? 'UNASSIGNED' : 'ASSIGNED'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                {new Date(task.end_date).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="relative inline-block w-full min-w-[130px]">
                                                                <select 
                                                                    value={task.status}
                                                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                                                                >
                                                                    <option value="Planned">Planned</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Completed">Completed</option>
                                                                    <option value="Cancelled">Cancelled</option>
                                                                </select>
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <div className={`w-2 h-2 rounded-full ${
                                                                        task.status === 'Cancelled' ? 'bg-rose-500' : 
                                                                        task.status === 'Completed' ? 'bg-emerald-500' : 
                                                                        task.status === 'In Progress' ? 'bg-blue-500' : 
                                                                        'bg-slate-400'
                                                                    }`}></div>
                                                                </div>
                                                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => openTaskModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View Details">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="Edit">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Project Tasks Filters Toolbar */}
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-6 text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                                            <Filter className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">Filter Projects</span>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search projects or task..."
                                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 bg-slate-50 hover:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Status</span>
                                        <select 
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors"
                                        >
                                            <option value="All Status">All Status</option>
                                            <option value="Planned">Planned</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Ownership</span>
                                        <select 
                                            value={ownershipFilter}
                                            onChange={(e) => setOwnershipFilter(e.target.value)}
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors"
                                        >
                                            <option value="Entire View">Entire View</option>
                                            <option value="My Projects">My Projects</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Project List */}
                            <div className="p-6 bg-slate-50 flex-1 space-y-4">
                                {[{ id: projectId || 92, name: 'Current Project', tasksCount: filteredTasks.length, status: 'Planned' as ProjectStatus, tasks: filteredTasks }].map(project => {
                                    const isExpanded = expandedProjects.includes(project.id);
                                    return (
                                        <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div 
                                                onClick={() => toggleProject(project.id)}
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        <Folder className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800 mb-1">{project.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-500 text-[10px] font-bold">
                                                                <Calendar className="w-3 h-3" />
                                                                {project.tasksCount} Tasks
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                project.status === 'Planned' ? 'border-slate-200 text-slate-500' : 'border-emerald-200 text-emerald-500 bg-emerald-50'
                                                            }`}>
                                                                {project.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-slate-400">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                            
                                            {isExpanded && (
                                                <div className="border-t border-slate-200">
                                                    <div className="overflow-x-auto custom-scrollbar">
                                                        <table className="w-full text-left border-collapse min-w-[800px] block md:table">
                                                            <thead className="hidden md:table-header-group">
                                                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task Intelligence</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Priority</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="block md:table-row-group">
                                                                {project.tasks.length > 0 ? (
                                                                    project.tasks.map((task) => (
                                                                        <tr key={task.id} className="block md:table-row border-b border-slate-200 md:border-none p-4 md:p-0">
                                                                            <td className="p-2 md:p-4 block md:table-cell before:content-['Task:'] md:before:content-none before:font-bold before:mr-2 before:text-[10px] before:uppercase before:text-slate-500">{task.title}</td>
                                                                            <td className="p-2 md:p-4 block md:table-cell before:content-['Assigned:'] md:before:content-none before:font-bold before:mr-2 before:text-[10px] before:uppercase before:text-slate-500">{task.assignedTo.name}</td>
                                                                            <td className="p-2 md:p-4 block md:table-cell before:content-['Deadline:'] md:before:content-none before:font-bold before:mr-2 before:text-[10px] before:uppercase before:text-slate-500">{new Date(task.end_date).toLocaleDateString()}</td>
                                                                            <td className="p-2 md:p-4 block md:table-cell before:content-['Status:'] md:before:content-none before:font-bold before:mr-2 before:text-[10px] before:uppercase before:text-slate-500">{task.status}</td>
                                                                            <td className="p-2 md:p-4 block md:table-cell before:content-['Priority:'] md:before:content-none before:font-bold before:mr-2 before:text-[10px] before:uppercase before:text-slate-500">{task.priority}</td>
                                                                            <td className="p-2 md:p-4 block md:table-cell md:text-center mt-2 md:mt-0 border-t md:border-none border-slate-100 pt-3 md:pt-4">
                                                                                <button onClick={() => openTaskModal(task)} className="p-2 bg-indigo-50 md:bg-transparent text-indigo-600 md:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl md:rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto" title="View Details">
                                                                                    <Eye className="w-4 h-4 md:mx-auto" />
                                                                                    <span className="md:hidden text-xs font-bold">View Task</span>
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr className="block md:table-row">
                                                                        <td colSpan={6} className="p-12 text-center text-sm font-bold text-slate-800 bg-white block md:table-cell">
                                                                            No matching tasks found in this project.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </PageTransition>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-sky-200 p-6 flex items-start justify-between relative border-b border-sky-300">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedTask.title}</h2>
                                <p className="text-slate-600 text-sm mt-1">Detailed view of task assignments and progress</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTask(null)}
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex bg-white border-b border-slate-200 px-6 pt-4 gap-4 overflow-x-auto custom-scrollbar">
                            <button 
                                onClick={() => setModalTab("Details")}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Details' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Details
                            </button>
                            <button 
                                onClick={() => setModalTab("Activity")}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Activity' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Activity
                            </button>
                            <button 
                                onClick={() => setModalTab("Comments")}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Comments' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Comments
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {modalTab === "Details" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Description</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.description || "No description provided."}</p>
                                        
                                        {selectedTask.audio_data && (
                                            <div className="mt-4 ml-8 flex items-center gap-3 max-w-sm bg-slate-50 rounded-full p-2 pr-4 border border-slate-200 shadow-sm">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:bg-emerald-600 transition-colors" onClick={(e) => {
                                                    const audio = e.currentTarget.parentElement?.querySelector('audio');
                                                    if (audio) { audio.paused ? audio.play() : audio.pause(); }
                                                }}>
                                                    <Play className="w-4 h-4 ml-0.5" />
                                                </div>
                                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex items-center">
                                                    <div className="h-full bg-emerald-500 w-1/3"></div>
                                                </div>
                                                <audio src={selectedTask.audio_data} className="hidden" />
                                                <span className="text-xs font-bold text-slate-400">0:00</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Assigned By</span>
                                        </div>
                                        <div className="pl-8">
                                            <p className="text-sm text-slate-600">{selectedTask.assignedBy.name}</p>
                                            <p className="text-xs text-slate-500">{selectedTask.assignedBy.role}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Assigned To</span>
                                        </div>
                                        <div className="pl-8">
                                            <p className="text-sm text-slate-600">{selectedTask.assignedTo.name}</p>
                                            <p className="text-xs text-slate-500">{selectedTask.assignedTo.role}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Priority</span>
                                        </div>
                                        <div className="pl-8">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityBadges[selectedTask.priority]}`}>
                                                {selectedTask.priority.charAt(0) + selectedTask.priority.slice(1).toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Deadline</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{new Date(selectedTask.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <Clock className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Start Date</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : "Not available"}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Status</span>
                                        </div>
                                        <div className="pl-8 flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${selectedTask.status === 'Cancelled' ? 'bg-rose-500' : selectedTask.status === 'Completed' ? 'bg-emerald-500' : selectedTask.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                            <p className="text-sm text-slate-600 font-medium">{selectedTask.status}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalTab === "Comments" && (
                                <div className="flex flex-col h-full min-h-[400px]">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-purple-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800">Task Discussion</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Chat with team members about this task</p>
                                    </div>

                                    <div className="flex-1 bg-[#F4F1E9] rounded-xl border border-slate-200 flex flex-col justify-center items-center p-8 mb-4">
                                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-purple-500">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">No comments yet</h3>
                                        <p className="text-sm text-slate-500">Start the conversation!</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <input 
                                            type="text" 
                                            placeholder="Type a message" 
                                            className="flex-1 bg-white border border-slate-300 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                        />
                                        <button className="w-10 h-10 rounded-full bg-purple-400 hover:bg-purple-500 text-white flex items-center justify-center transition-colors shadow-sm">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalTab === "Activity" && (
                                <div className="flex flex-col h-full min-h-[300px] items-center justify-center">
                                    <div className="text-slate-400 mb-2">
                                        <Clock className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">No activity yet</h3>
                                    <p className="text-sm text-slate-500">History and audit logs will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Task Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Task"
                maxWidth="max-w-3xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            form="edit-task-form"
                            type="submit"
                            className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 active:scale-95"
                        >
                            Update Task
                        </button>
                    </>
                }
            >
                <form id="edit-task-form" onSubmit={handleEditFormSubmit} className="space-y-6 font-inter">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
                            Basic Information
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Task Title <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    name="title"
                                    defaultValue={selectedEditTask?.title}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Description <span className="text-rose-500">*</span>
                                </label>
                                <textarea 
                                    name="description"
                                    rows={4}
                                    defaultValue={selectedEditTask?.description}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 resize-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Assign To <span className="text-rose-500">*</span>
                                    </label>
                                    <select 
                                        name="assigned_user_id"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value={selectedEditTask?.assigned_user_id || 1}>{selectedEditTask?.assignedTo?.name || "Select User"}</option>
                                        <option value="1">Suresh Chaudhari</option>
                                        <option value="2">Vishal Sathe</option>
                                        <option value="3">Amit Khare</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Priority <span className="text-rose-500">*</span>
                                    </label>
                                    <select 
                                        name="priority"
                                        defaultValue={selectedEditTask?.priority}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Status <span className="text-rose-500">*</span>
                                    </label>
                                    <select 
                                        name="status"
                                        defaultValue={selectedEditTask?.status}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="Planned">Planned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Start Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="date"
                                        name="start_date"
                                        defaultValue={selectedEditTask?.start_date ? new Date(selectedEditTask.start_date).toISOString().split('T')[0] : ''}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Deadline <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="date"
                                        name="end_date"
                                        defaultValue={selectedEditTask?.end_date ? new Date(selectedEditTask.end_date).toISOString().split('T')[0] : ''}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Create Task Drawer */}
            <CreateTaskDrawer 
                isOpen={isCreateDrawerOpen} 
                onClose={() => setIsCreateDrawerOpen(false)}
                projectId={projectId}
                onSuccess={() => {
                    fetchData();
                    setIsCreateDrawerOpen(false);
                }}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDeleteTask}
                title="Discard Task Entry"
                message="Are you sure you want to delete this task record? This action will permanently remove the entry and all its progress history."
                confirmText="Archive Record"
                type="danger"
                isLoading={isSubmitting}
            />
        </>
    );
};

export default TaskManagementPage;
