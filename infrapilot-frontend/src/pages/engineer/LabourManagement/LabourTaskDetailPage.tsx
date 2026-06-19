import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import Modal from '../../../components/common/Modal';
import { 
    Filter, Search, Eye, Calendar, User, 
    CheckCircle, Clock, AlertCircle, XCircle, List, 
    FileText, X, Mail, Briefcase, Phone,
    Edit2, Trash2, RefreshCw, LayoutGrid, Camera, Play
} from 'lucide-react';
import labourService from '../../../services/labourService';
import { projectService } from '../../../services/projectService';

interface TaskItem {
    id: string;
    title: string;
    subtitle: string;
    assignedBy: { name: string; role: string };
    assignedTo: { name: string; role: string };
    priority: "LOW" | "MEDIUM" | "HIGH";
    deadline: string;
    assignedDate?: string;
    status: "To Do" | "In Progress" | "Completed" | "Overdue" | "Cancelled";
    hasHistory: boolean;
    startWorkImgUrl?: string;
    endWorkImgUrl?: string;
    filterType: "My Tasks" | "Assigned";
    department: "Engineering" | "Plumbing" | "Electrical";
}

const priorityBadges: Record<string, string> = {
    LOW: "bg-emerald-500 text-white",
    MEDIUM: "bg-blue-500 text-white",
    HIGH: "bg-rose-500 text-white",
};

const LabourTaskDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<"All Tasks" | "Labour Detail">("All Tasks");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    const [tasks, setTasks] = useState<any[]>([]);
    
    // Filters and View State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [typeFilter, setTypeFilter] = useState("All Tasks");
    const [departmentFilter, setDepartmentFilter] = useState("All Departments");

    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [modalTab, setModalTab] = useState<"Details" | "Activity" | "Comments">("Details");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditTask, setSelectedEditTask] = useState<any | null>(null);
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    const [weeklyReport, setWeeklyReport] = useState<any>(null);
    const [monthlyReport, setMonthlyReport] = useState<any>(null);
    const [labourInfo, setLabourInfo] = useState<any>(null);
    const [isLoadingReports, setIsLoadingReports] = useState(false);

    useEffect(() => {
        const fetchReportsAndTasks = async () => {
            if (!id) return;
            setIsLoadingReports(true);
            try {
                const [weeklyData, monthlyData, taskList, labourData] = await Promise.all([
                    labourService.getLabourWeeklyReport(id),
                    labourService.getLabourMonthlyReport(id),
                    projectService.getTasks(1, { assigned_user_id: Number(id), limit: 20, offset: 0 }),
                    labourService.getLabourById(Number(id)).catch(() => null)
                ]);
                
                if (weeklyData && weeklyData.length > 0) {
                    setWeeklyReport(weeklyData[0]);
                }
                if (monthlyData && monthlyData.length > 0) {
                    setMonthlyReport(monthlyData[0]);
                }
                if (labourData) {
                    setLabourInfo(labourData);
                }

                // Map tasks to frontend table format
                const mappedTasks = taskList.map((t: any) => ({
                    id: t.id.toString(),
                    title: t.title || 'Untitled Task',
                    subtitle: t.description || 'No description provided.',
                    assignedBy: { name: "Darshan Patil", role: "Admin" }, // Mocked for UI
                    assignedTo: { name: t.assigned_users && t.assigned_users.length > 0 ? (t.assigned_users[0].name || t.assigned_users[0].full_name || 'Employee') : 'Worker', role: "Employee" },
                    priority: t.priority ? t.priority.toUpperCase() : "LOW",
                    deadline: t.end_date ? new Date(t.end_date).toLocaleDateString() : 'N/A',
                    status: t.status === 'Planned' ? 'To Do' : (t.status || 'To Do'),
                    hasHistory: false,
                    startWorkImgUrl: null,
                    endWorkImgUrl: null,
                    filterType: "Assigned",
                    department: "Engineering",
                    _raw: t
                }));
                setTasks(mappedTasks);
            } catch (error) {
                console.error("Failed to fetch labour reports or tasks", error);
            } finally {
                setIsLoadingReports(false);
            }
        };

        fetchReportsAndTasks();
    }, [id]);

    const openTaskModal = async (task: any) => {
        try {
            const fullTask = await projectService.getTask(1, Number(task.id));
            setSelectedTask(fullTask);
            setModalTab("Details");
        } catch (e) {
            console.error("Failed to fetch task details", e);
            setSelectedTask(task._raw || task);
            setModalTab("Details");
        }
    };

    const openEditModal = (task: TaskItem) => {
        setSelectedEditTask(task);
        setIsEditModalOpen(true);
    };


    const handleEditFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEditTask) {
            const form = e.target as HTMLFormElement;
            const title = (form.elements.namedItem("title") as HTMLInputElement).value;
            const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
            const deadline = (form.elements.namedItem("deadline") as HTMLInputElement).value;
            const startDate = (form.elements.namedItem("startDate") as HTMLInputElement).value;
            const assignee = (form.elements.namedItem("assignee") as HTMLSelectElement).value;
            
            try {
                // Prepare API Payload matching the required spec
                const payload = {
                    title: title,
                    description: description,
                    priority: selectedEditTask.priority === "HIGH" ? 3 : selectedEditTask.priority === "MEDIUM" ? 2 : 1,
                    start_date: startDate || "2026-06-15",
                    end_date: deadline,
                    status: selectedEditTask._raw?.status || "In Progress",
                    assigned_user_ids: assignee || "2",
                    activity_type_id: 1,
                    milestone_id: 1,
                    boq_id: 1,
                    remove_audio: false,
                    remove_image: false
                };

                // Call PUT API
                await projectService.updateTask(1, Number(selectedEditTask.id), payload);

                // Optimistically update local UI state
                setTasks(prev => prev.map(t => t.id === selectedEditTask.id ? { 
                    ...t, 
                    title, 
                    subtitle: description, 
                    deadline 
                } : t));
                
                setIsEditModalOpen(false);
                setSelectedEditTask(null);
            } catch (err) {
                console.error("Failed to update task", err);
                alert("Failed to update task. Please try again.");
            }
        }
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as TaskItem["status"] } : t));
        
        try {
            let apiStatus = newStatus;
            if (newStatus === "To Do") apiStatus = "Planned";
            await projectService.updateTaskStatus(1, Number(taskId), apiStatus);
        } catch (error) {
            console.error("Failed to update task status", error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              task.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All Status" || task.status === statusFilter;
        const matchesType = typeFilter === "All Tasks" || task.filterType === typeFilter;
        const matchesDepartment = departmentFilter === "All Departments" || task.department === departmentFilter;
        return matchesSearch && matchesStatus && matchesType && matchesDepartment;
    });

    // Stat counts
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const overdueTasks = tasks.filter(t => t.status === "Overdue").length;
    const cancelledTasks = tasks.filter(t => t.status === "Cancelled").length;

    if (isLoadingReports) {
        return (
            <>
                <Navbar title="Labour Detail" breadcrumb={["Engineer", "Labour Management", "Labour Detail"]} />
                <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        <p className="text-slate-500 font-medium">Loading details...</p>
                    </div>
                </PageTransition>
            </>
        );
    }

    return (
        <>
            <Navbar title="Labour Detail" breadcrumb={["Engineer", "Labour Management", "Labour Detail"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                
                {/* ─── Header Section ──────────────────────────────────────────────────────── */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Labour Profile: {labourInfo?.user_name || labourInfo?.labour_name || id || 'LAB-001'}</h1>
                        <p className="text-slate-500 text-sm">Efficiently organize, track, and manage all tasks assigned to this personnel</p>
                    </div>
                </div>

                {/* ─── Tabs Section ──────────────────────────────────────────────────────── */}
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 mb-6 border border-slate-200 w-full max-w-sm">
                    <button 
                        onClick={() => setActiveTab("All Tasks")}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'All Tasks' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        All Tasks
                    </button>
                    <button 
                        onClick={() => setActiveTab("Labour Detail")}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Labour Detail' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Labour Detail
                    </button>
                </div>

                {activeTab === 'All Tasks' ? (
                    <>

                {/* ─── Stats Cards Section ──────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                            <h3 className="text-2xl font-black text-slate-800">{totalTasks}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <List className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                            <h3 className="text-2xl font-black text-slate-800">{inProgressTasks}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                            <h3 className="text-2xl font-black text-slate-800">{completedTasks}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
                            <h3 className="text-2xl font-black text-slate-800">{overdueTasks}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cancelled</p>
                            <h3 className="text-2xl font-black text-slate-800">{cancelledTasks}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <XCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* ─── Filters Section ──────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                    
                    {/* All Tasks Filters Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-slate-800 shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                                <Filter className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">All Tasks Filters</span>
                        </div>

                        <div className="flex flex-wrap items-end gap-4 flex-1 justify-end">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-48 md:w-56"
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 mb-1">Status</span>
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-colors"
                                >
                                    <option value="All Status">All Status</option>
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Overdue">Overdue</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 mb-1">Filter</span>
                                <select 
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-colors"
                                >
                                    <option value="All Tasks">All Tasks</option>
                                    <option value="My Tasks">My Tasks</option>
                                    <option value="Assigned">Assigned</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 mb-1">Department</span>
                                <select 
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-colors"
                                >
                                    <option value="All Departments">All Departments</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Electrical">Electrical</option>
                                </select>
                            </div>

                            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-1">
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* All Tasks Content */}
                    <div className="p-6 bg-slate-50 flex-1">
                        {viewMode === 'list' ? (
                            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                                <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned By</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Priority</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Selfie</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Start Work Image</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">End Work Image</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.length === 0 ? (
                                        <tr><td colSpan={10} className="p-8 text-center text-slate-500 font-medium">No tasks found.</td></tr>
                                    ) : filteredTasks.map((task) => (
                                        <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{task.subtitle}</p>
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
                                                        {task.deadline}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-8 h-8 rounded-full border border-slate-200 bg-emerald-50 flex items-center justify-center shrink-0">
                                                            <span className="text-[8px] font-bold text-emerald-600">IN</span>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full border border-slate-200 bg-rose-50 flex items-center justify-center shrink-0">
                                                            <span className="text-[8px] font-bold text-rose-500">OUT</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {task.startWorkImgUrl ? (
                                                        <div 
                                                            onClick={() => setPreviewImage({ url: task.startWorkImgUrl!, title: "Start Work Image - " + task.title })}
                                                            className="w-10 h-10 rounded-lg border-2 border-blue-400 overflow-hidden bg-blue-50 mx-auto cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        >
                                                            <img src={task.startWorkImgUrl} alt="Start Work" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 mx-auto flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {task.endWorkImgUrl ? (
                                                        <div 
                                                            onClick={() => setPreviewImage({ url: task.endWorkImgUrl!, title: "End Work Image - " + task.title })}
                                                            className="w-10 h-10 rounded-lg border-2 border-orange-400 overflow-hidden bg-orange-50 mx-auto cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        >
                                                            <img src={task.endWorkImgUrl} alt="End Work" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 mx-auto flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <select 
                                                        value={task.status}
                                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                        className="w-full min-w-[130px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white shadow-sm outline-none cursor-pointer focus:border-indigo-500"
                                                    >
                                                        <option value="To Do">To Do</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Overdue">Overdue</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => openTaskModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter" title="View Details">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Task">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Task">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        {task.status === 'Overdue' && (
                                                            <button className="px-2 py-1 ml-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center gap-1">
                                                                <RefreshCw className="w-3 h-3" /> Reassign
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredTasks.length === 0 ? (
                                    <div className="col-span-full p-8 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">No tasks found.</div>
                                ) : filteredTasks.map((task) => (
                                    <div key={task.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800">{task.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.subtitle || "No description"}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ml-2 ${priorityBadges[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned By</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                        <User className="w-2.5 h-2.5" />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700 truncate">{task.assignedBy.name}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned To</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                        <User className="w-2.5 h-2.5" />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700 truncate">{task.assignedTo.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-t border-b border-slate-100 mb-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {task.deadline}
                                            </div>
                                            <select 
                                                defaultValue={task.status}
                                                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none cursor-pointer"
                                            >
                                                <option value="To Do">To Do</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Overdue">Overdue</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-2">
                                            <div className="flex gap-2">
                                                {task.startWorkImgUrl ? (
                                                    <div onClick={() => setPreviewImage({ url: task.startWorkImgUrl!, title: "Start Work Image" })} className="w-8 h-8 rounded-lg border border-blue-200 overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                                                        <img src={task.startWorkImgUrl} alt="Start" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                                {task.endWorkImgUrl ? (
                                                    <div onClick={() => setPreviewImage({ url: task.endWorkImgUrl!, title: "End Work Image" })} className="w-8 h-8 rounded-lg border border-orange-200 overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                                                        <img src={task.endWorkImgUrl} alt="End" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openTaskModal(task)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Details">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Task">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Task">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {task.status === 'Overdue' && (
                                            <button className="mt-3 w-full py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                                                <RefreshCw className="w-3.5 h-3.5" /> Reassign
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                </>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 flex-1">
                        {/* ─── Profile Style Header ─── */}
                        <div className="bg-indigo-500 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-bold font-inter">R</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-indigo-500 rounded-full animate-pulse`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{labourInfo?.user_name || labourInfo?.labour_name || "Rahul Sharma"}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">{labourInfo?.department || "Skilled"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter">worker.lab-{id || '001'}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">DAILY WAGE: ₹900.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-indigo-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Professional Information</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Worker ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase">{id || 'LAB-001'}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Daily Base</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">₹900.00</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Aadhaar Reference</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">XXXX-XXXX-0123</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Skill Category</p>
                                        <p className="text-sm font-black text-indigo-600 font-inter italic-none">Skilled</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-indigo-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Trail & Logistics</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Registration Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">2026-04-10</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Contractor ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">CONT-01</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-indigo-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Deployment Status</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Assigned Site</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">Skyline Tower A</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Status</p>
                                        <p className="text-sm font-black text-emerald-600 font-inter italic-none">Active</p>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Report Section */}
                            {weeklyReport && (
                                <div className="font-inter">
                                    <div className="flex items-center gap-2 mb-6 font-inter">
                                        <div className="p-2 bg-emerald-50 rounded-lg font-inter">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Weekly Report</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 font-inter bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Present Days</p>
                                            <p className="text-sm font-black text-slate-800">{weeklyReport.present_days} / {weeklyReport.total_days}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Absent Days</p>
                                            <p className="text-sm font-black text-rose-600">{weeklyReport.absent_days}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Hours</p>
                                            <p className="text-sm font-black text-slate-800">{weeklyReport.total_hours}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Wage</p>
                                            <p className="text-sm font-black text-indigo-600">₹{weeklyReport.total_wage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Monthly Report Section */}
                            {monthlyReport && (
                                <div className="font-inter">
                                    <div className="flex items-center gap-2 mb-6 font-inter">
                                        <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Monthly Report</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 font-inter bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Present Days</p>
                                            <p className="text-sm font-black text-slate-800">{monthlyReport.present_days} / {monthlyReport.total_days}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Absent Days</p>
                                            <p className="text-sm font-black text-rose-600">{monthlyReport.absent_days}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Hours</p>
                                            <p className="text-sm font-black text-slate-800">{monthlyReport.total_hours}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Wage</p>
                                            <p className="text-sm font-black text-indigo-600">₹{monthlyReport.total_wage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
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
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {modalTab === "Details" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { key: "title", label: "Title" },
                                        { key: "description", label: "Description" },
                                        { key: "priority", label: "Priority" },
                                        { key: "status", label: "Status" },
                                        { key: "start_date", label: "Start Date" },
                                        { key: "end_date", label: "End Date" },
                                        { key: "actual_start_date", label: "Actual Start Date" },
                                        { key: "actual_end_date", label: "Actual End Date" },
                                        { key: "assigned_users", label: "Assigned Users" },
                                        { key: "completion_percentage", label: "Completion Percentage" },
                                        { key: "is_delayed", label: "Is Delayed" },
                                        { key: "execution_duration", label: "Execution Duration" },
                                        { key: "delay_days", label: "Delay Days" },
                                        { key: "actual_cost", label: "Actual Cost" },
                                        { key: "planned_cost", label: "Planned Cost" },
                                        { key: "audio_instruction_url", label: "Audio Instruction" }
                                    ].map((field) => (
                                        <div key={field.key} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm ${field.key === 'description' ? 'md:col-span-2' : ''}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-bold text-slate-800">{field.label}</span>
                                            </div>
                                            <div>
                                                {field.key === 'audio_instruction_url' ? (
                                                    (selectedTask as any)[field.key] ? (
                                                        <div className="flex items-center gap-3 max-w-sm bg-slate-50 rounded-full p-2 pr-4 border border-slate-200 shadow-sm mt-1">
                                                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:bg-emerald-600 transition-colors" onClick={(e) => {
                                                                const audio = e.currentTarget.parentElement?.querySelector('audio');
                                                                if (audio) { audio.paused ? audio.play() : audio.pause(); }
                                                            }}>
                                                                <Play className="w-4 h-4 ml-0.5" />
                                                            </div>
                                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex items-center">
                                                                <div className="h-full bg-emerald-500 w-1/3"></div>
                                                            </div>
                                                            <audio src={(selectedTask as any)[field.key]} className="hidden" />
                                                            <span className="text-xs font-bold text-slate-400">Audio</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-600">-</span>
                                                    )
                                                ) : field.key === 'priority' ? (
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${priorityBadges[String((selectedTask as any)[field.key] || '').toUpperCase()] || 'bg-slate-100 text-slate-600'}`}>
                                                        {String((selectedTask as any)[field.key] || '-').toUpperCase()}
                                                    </span>
                                                ) : field.key === 'status' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${(selectedTask as any).status === 'Cancelled' ? 'bg-rose-500' : (selectedTask as any).status === 'Completed' ? 'bg-emerald-500' : (selectedTask as any).status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                                        <p className="text-sm text-slate-600 font-medium">{(selectedTask as any).status || '-'}</p>
                                                    </div>
                                                ) : field.key === 'assigned_users' ? (
                                                    <p className="text-sm text-slate-600">
                                                        {Array.isArray((selectedTask as any)[field.key]) && (selectedTask as any)[field.key].length > 0 
                                                            ? (selectedTask as any)[field.key].map((u: any) => typeof u === 'object' ? (u.full_name || u.name || `User ${u.id}`) : u).join(', ') 
                                                            : 'None'}
                                                    </p>
                                                ) : field.key.includes('date') && (selectedTask as any)[field.key] ? (
                                                    <p className="text-sm text-slate-600">{new Date((selectedTask as any)[field.key]).toLocaleDateString()}</p>
                                                ) : typeof (selectedTask as any)[field.key] === 'boolean' ? (
                                                    <p className="text-sm text-slate-600">{(selectedTask as any)[field.key] ? 'Yes' : 'No'}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-600 break-all">{(selectedTask as any)[field.key] !== null && (selectedTask as any)[field.key] !== undefined && (selectedTask as any)[field.key] !== '' ? String((selectedTask as any)[field.key]) : 'null'}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
                    {/* Custom Header since hideHeader is true (to match exact UI) */}
                    <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-sm -rotate-3">
                                <Edit2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Task</h2>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Update task details and assignment</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6 bg-white">
                        {/* Task Title */}
                        <div>
                            <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 inline-block"></div>
                                Task Title <span className="text-rose-500 ml-1">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                name="title"
                                defaultValue={selectedEditTask?.title}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 inline-block"></div>
                                Description <span className="text-rose-500 ml-1">*</span>
                            </label>
                            <textarea
                                required
                                name="description"
                                defaultValue={selectedEditTask?.subtitle}
                                placeholder="Enter task description"
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:italic resize-none"
                            />
                        </div>

                        {/* 2 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Assign To */}
                            <div>
                                <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                    <User className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                    Assign To
                                </label>
                                <select 
                                    name="assignee" 
                                    defaultValue={selectedEditTask?._raw?.assigned_users?.[0]?.id || "2"}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">Select Assignee</option>
                                    <option value="1">Darshan Patil</option>
                                    <option value="2">Vishal Sathe</option>
                                    <option value="3">Suresh Chaudhari</option>
                                    <option value="225">Assigned User (225)</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    defaultValue={selectedEditTask?._raw?.start_date?.split('T')[0] || "2026-09-27"}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all"
                                />
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                    Deadline <span className="text-rose-500 ml-1">*</span>
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="deadline"
                                    defaultValue={selectedEditTask?._raw?.end_date?.split('T')[0] || "2026-08-12"}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all"
                                />
                            </div>

                            {/* Project (Optional) */}
                            <div>
                                <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                    <FileText className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                    Project (Optional)
                                </label>
                                <select 
                                    name="project"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all cursor-pointer appearance-none"
                                >
                                    <option value="none">None</option>
                                    <option value="skyline">Skyline Tower A</option>
                                    <option value="horizon">Horizon Complex</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all active:scale-95"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                title={previewImage?.title || "Image Preview"}
                maxWidth="max-w-md"
            >
                <div className="w-full p-4 flex items-center justify-center bg-slate-50">
                    {previewImage && (
                        <img
                            src={previewImage.url}
                            alt={previewImage.title}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-xl shadow-sm border border-slate-200"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};

export default LabourTaskDetailPage;
