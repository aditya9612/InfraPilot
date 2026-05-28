import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import toast from 'react-hot-toast';
import { 
    Filter, Search, Plus, Eye, Calendar, User, 
    CheckCircle, Clock, AlertCircle, XCircle, List, Grid, 
    Download, Share2, ChevronDown, ChevronUp, Folder,
    Paperclip, Send, X, FileText, Edit2, Trash2
} from 'lucide-react';
import CreateTaskDrawer from './CreateTaskDrawer';
import Modal from '../../../components/common/Modal';
import { projectService } from '../../../services/projectService';
import type { Task, ProjectMember, ProjectStatus } from '../../../types/project';

interface FrontendTask extends Omit<Task, 'priority'> {
    priority: "LOW" | "MEDIUM" | "HIGH";
    assignedBy: { name: string; role: string };
    assignedTo: { name: string; role: string };
    hasHistory: boolean;
}



const priorityBadges: Record<string, string> = {
    LOW: "bg-emerald-500 text-white",
    MEDIUM: "bg-blue-500 text-white",
    HIGH: "bg-rose-500 text-white",
};

const mapPriority = (priority: number): "LOW" | "MEDIUM" | "HIGH" => {
    if (priority === 1) return "HIGH";
    if (priority === 2) return "MEDIUM";
    return "LOW";
};

const TaskManagementPage = () => {
    const [projectId, setProjectId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<FrontendTask[]>([]);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [departmentFilter, setDepartmentFilter] = useState("All Departments");

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

            const mappedTasks: FrontendTask[] = (Array.isArray(fetchedTasks) ? fetchedTasks : (fetchedTasks.items || fetchedTasks.data || [])).map((t: Task) => {
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
                    hasHistory: false
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
            await projectService.updateTask(projectId, selectedEditTask.id, {
                ...selectedEditTask,
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                start_date: formData.get('start_date') as string || selectedEditTask.start_date,
                end_date: formData.get('end_date') as string || selectedEditTask.end_date
            });
            toast.success("Task updated successfully");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update task");
        }
    };

    const handleGenerateDemoTasks = async () => {
        if (!projectId) return;
        try {
            const demoTasks = [
                { title: "Site Inspection", description: "Perform routine site safety check", priority: 1, start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] },
                { title: "Material Procurement", description: "Order 500 bags of cement", priority: 2, start_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], end_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] },
                { title: "Client Meeting Prep", description: "Prepare slides for the milestone meeting", priority: 3, start_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], end_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0] },
            ];
            for (const t of demoTasks) {
                await projectService.createTask(projectId, t);
            }
            toast.success("Demo tasks generated successfully");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate demo tasks");
        }
    };

    const toggleProject = (id: number) => {
        setExpandedProjects(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const openTaskModal = (task: FrontendTask) => {
        setSelectedTask(task);
        setModalTab("Details");
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!projectId) return;
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        
        try {
            await projectService.deleteTask(projectId, taskId);
            toast.success("Task deleted successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (!projectId) return;
        
        try {
            // Find task to send full object if necessary, or just status
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            await projectService.updateTask(projectId, taskId, {
                ...task,
                status: newStatus
            });
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
            if (statusFilter === "Overdue" && !t.is_delayed) match = false;
            else if (statusFilter !== "All Status" && statusFilter !== "Overdue" && t.status !== statusFilter) match = false;
            // Add departmentFilter logic if needed later
            return match;
        });
    }, [tasks, searchQuery, statusFilter]);

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
                        <button
                            onClick={handleGenerateDemoTasks}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm shadow-sm hover:bg-slate-200 transition-colors whitespace-nowrap"
                        >
                            Generate Demo Tasks
                        </button>
                        <button 
                            onClick={() => setIsCreateDrawerOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-indigo-600 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Create Task
                        </button>
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
                        <div onClick={() => setStatusFilter("All Status")} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                                <List className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("In Progress")} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'In Progress').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Completed")} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Completed').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Overdue")} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.is_delayed).length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Delayed")} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Delayed</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Delayed').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                                <h3 className="text-2xl font-black text-slate-800">0</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                <List className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To Do</p>
                                <h3 className="text-2xl font-black text-slate-800">0</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                                <h3 className="text-2xl font-black text-slate-800">0</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                                <h3 className="text-2xl font-black text-slate-800">0</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
                                <h3 className="text-2xl font-black text-slate-800">0</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                <AlertCircle className="w-5 h-5" />
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
                                            <option>Overdue</option>
                                            <option>Delayed</option>
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
                                            <div key={task.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${task.status === 'Delayed' ? 'border-rose-200' : 'border-slate-200'}`}>
                                                <div className="p-5 flex-1">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${priorityBadges[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                            {task.status === "Delayed" && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white">
                                                                    DELAYED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Delayed' ? 'bg-rose-500' : task.status === 'Planned' ? 'bg-slate-400' : 'bg-blue-500'}`} />
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
                                                    <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openTaskModal(task)} className="px-4 py-2 text-[10px] font-bold text-white bg-primary hover:bg-blue-600 uppercase tracking-widest rounded-xl transition-all font-inter shadow-lg shadow-primary/20 active:scale-95">
                                                            VIEW DETAILS
                                                        </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned By</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Priority</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Selfies</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTasks.map((task) => (
                                                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4">
                                                            <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                            <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{task.description}</p>
                                                        </td>
                                                        <td className="p-4">
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
                                                        <td className="p-4">
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
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                {new Date(task.end_date).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center -space-x-2">
                                                                <div className="relative group cursor-pointer" title="Start Selfie">
                                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center relative z-20 shadow-sm overflow-hidden">
                                                                        <User className="w-4 h-4 text-emerald-600" />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                                                                        <Eye className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="relative group cursor-pointer" title="End Selfie">
                                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-100 flex items-center justify-center relative z-10 shadow-sm overflow-hidden">
                                                                        <User className="w-4 h-4 text-rose-600" />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                                                                        <Eye className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="relative inline-block w-full min-w-[130px]">
                                                                <select 
                                                                    value={task.status}
                                                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                                                                >
                                                                    <option value="To Do">To Do</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Completed">Completed</option>
                                                                    <option value="Delayed">Delayed</option>
                                                                </select>
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <div className={`w-2 h-2 rounded-full ${
                                                                        task.status === 'Delayed' ? 'bg-rose-500' : 
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
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => openTaskModal(task)} className="px-4 py-2 text-[10px] font-bold text-white bg-primary hover:bg-blue-600 uppercase tracking-widest rounded-xl transition-all font-inter shadow-lg shadow-primary/20 active:scale-95">
                                                            VIEW DETAILS
                                                        </button>
                                                                <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
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
                                            placeholder="Search projects or task..."
                                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 bg-slate-50 hover:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Status</span>
                                        <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors">
                                            <option>All Status</option>
                                            <option>Planned</option>
                                            <option>Completed</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Ownership</span>
                                        <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer bg-slate-50 hover:bg-white transition-colors">
                                            <option>Entire View</option>
                                            <option>My Projects</option>
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
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                                            <thead>
                                                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task Intelligence</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Priority</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {project.tasks.length > 0 ? (
                                                                    project.tasks.map((task) => (
                                                                        <tr key={task.id}>
                                                                            <td className="p-4">{task.title}</td>
                                                                            <td className="p-4">{task.assignedTo.name}</td>
                                                                            <td className="p-4">{new Date(task.end_date).toLocaleDateString()}</td>
                                                                            <td className="p-4">{task.status}</td>
                                                                            <td className="p-4">{task.priority}</td>
                                                                            <td className="p-4 text-center"><Eye className="w-4 h-4 mx-auto" /></td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={6} className="p-12 text-center text-sm font-bold text-slate-800 bg-white">
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
                        <div className="flex bg-white border-b border-slate-200 px-6 pt-4 gap-4">
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
                        <div className="p-6 overflow-y-auto flex-1">
                            {modalTab === "Details" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Description</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.description || "No description provided."}</p>
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
                                            <div className={`w-2.5 h-2.5 rounded-full ${selectedTask.status === 'Delayed' ? 'bg-rose-500' : selectedTask.status === 'Completed' ? 'bg-emerald-500' : selectedTask.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
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
                maxWidth="max-w-2xl"
                hideHeader
            >
                <form onSubmit={handleEditFormSubmit} className="flex flex-col h-full font-inter">
                    {/* Custom Header */}
                    <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-sm -rotate-3">
                                <Edit2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Task</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Update task details and assignment</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Task Title <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                type="text"
                                name="title"
                                defaultValue={selectedEditTask?.title}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Description <span className="text-rose-500">*</span>
                            </label>
                            <textarea 
                                name="description"
                                rows={4}
                                defaultValue={selectedEditTask?.description}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <User className="w-4 h-4 text-indigo-500" />
                                    Assign To
                                </label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option>{selectedEditTask?.assignedTo?.name || ""}</option>
                                    <option>Suresh Chaudhari</option>
                                    <option>Vishal Sathe</option>
                                    <option>Amit Khare</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                    Start Date
                                </label>
                                <input 
                                    type="date"
                                    name="start_date"
                                    defaultValue={selectedEditTask?.start_date ? new Date(selectedEditTask.start_date).toISOString().split('T')[0] : ''}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                    Deadline <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="date"
                                    name="end_date"
                                    defaultValue={selectedEditTask?.end_date ? new Date(selectedEditTask.end_date).toISOString().split('T')[0] : ''}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <FileText className="w-4 h-4 text-indigo-500" />
                                    Project (Optional)
                                </label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option>None</option>
                                    <option>Shopex</option>
                                    <option>Test Project</option>
                                    <option>staffly</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-3xl">
                        <button 
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm active:scale-95"
                        >
                            Save Changes
                        </button>
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
        </>
    );
};

export default TaskManagementPage;
