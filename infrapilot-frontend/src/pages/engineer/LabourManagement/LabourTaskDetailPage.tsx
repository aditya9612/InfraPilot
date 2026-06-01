import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import Modal from '../../../components/common/Modal';
import { 
    Filter, Search, Eye, Calendar, User, 
    CheckCircle, Clock, AlertCircle, XCircle, List, 
    Download, FileText, X, Mail, Briefcase, Phone,
    Edit2, Trash2, RefreshCw, LayoutGrid, Camera,
    BarChart3
} from 'lucide-react';
import { labourService } from '../../../services/labourService';

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

const mockTasks: TaskItem[] = [
    {
        id: "1",
        title: "API Testing",
        subtitle: "Start to test all APIs.",
        assignedBy: { name: "Darshan Patil", role: "Admin" },
        assignedTo: { name: "Suresh Chaudhari", role: "Employee" },
        priority: "MEDIUM",
        deadline: "May 27, 2026",
        assignedDate: "May 19, 2026",
        status: "To Do",
        hasHistory: true,
        startWorkImgUrl: "https://images.unsplash.com/photo-1504307651254-35680f356f27?w=100&h=100&fit=crop",
        filterType: "Assigned",
        department: "Engineering"
    },
    {
        id: "2",
        title: "ueihfuhaodj",
        subtitle: "string",
        assignedBy: { name: "Darshan Patil", role: "Admin" },
        assignedTo: { name: "Vishal Sathe", role: "Employee" },
        priority: "MEDIUM",
        deadline: "Jul 23, 2026",
        status: "To Do",
        hasHistory: true,
        startWorkImgUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=100&h=100&fit=crop",
        endWorkImgUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=100&h=100&fit=crop",
        filterType: "My Tasks",
        department: "Plumbing"
    },
    {
        id: "3",
        title: "ghsvfjagkjf",
        subtitle: "No description provided.",
        assignedBy: { name: "Darshan Patil", role: "Admin" },
        assignedTo: { name: "Suresh Chaudhari", role: "Employee" },
        priority: "MEDIUM",
        deadline: "Aug 12, 2026",
        status: "To Do",
        hasHistory: false,
        filterType: "Assigned",
        department: "Electrical"
    }
];

const priorityBadges: Record<string, string> = {
    LOW: "bg-emerald-500 text-white",
    MEDIUM: "bg-blue-500 text-white",
    HIGH: "bg-rose-500 text-white",
};

const LabourTaskDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<"All Tasks" | "Labour Detail">("All Tasks");
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const [modalTab, setModalTab] = useState<"Details" | "Activity" | "Comments">("Details");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    // For this view, we'll only use list mode
    const openTaskModal = (task: TaskItem) => {
        setSelectedTask(task);
        setModalTab("Details");
    };

    const [tasks, setTasks] = useState<TaskItem[]>(mockTasks);
    
    // Filters and View State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [typeFilter, setTypeFilter] = useState("All Tasks");
    const [departmentFilter, setDepartmentFilter] = useState("All Departments");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditTask, setSelectedEditTask] = useState<TaskItem | null>(null);
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    const [weeklyReport, setWeeklyReport] = useState<any>(null);
    const [monthlyReport, setMonthlyReport] = useState<any>(null);
    const [isLoadingReports, setIsLoadingReports] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            if (!id) return;
            setIsLoadingReports(true);
            try {
                const [weeklyData, monthlyData] = await Promise.all([
                    labourService.getLabourWeeklyReport(id),
                    labourService.getLabourMonthlyReport(id)
                ]);
                
                if (weeklyData && weeklyData.length > 0) {
                    setWeeklyReport(weeklyData[0]);
                }
                if (monthlyData && monthlyData.length > 0) {
                    setMonthlyReport(monthlyData[0]);
                }
            } catch (error) {
                console.error("Failed to fetch labour reports", error);
            } finally {
                setIsLoadingReports(false);
            }
        };

        fetchReports();
    }, [id]);

    const openEditModal = (task: TaskItem) => {
        setSelectedEditTask(task);
        setIsEditModalOpen(true);
    };



    const handleEditFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEditTask) {
            const form = e.target as HTMLFormElement;
            const title = (form.elements.namedItem("title") as HTMLInputElement).value;
            const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
            const deadline = (form.elements.namedItem("deadline") as HTMLInputElement).value;
            
            setTasks(prev => prev.map(t => t.id === selectedEditTask.id ? { 
                ...t, 
                title, 
                subtitle: description, 
                deadline 
            } : t));
            setIsEditModalOpen(false);
            setSelectedEditTask(null);
        }
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleStatusChange = (taskId: string, newStatus: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as TaskItem["status"] } : t));
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

    return (
        <>
            <Navbar title="Labour Detail" breadcrumb={["Engineer", "Labour Management", "Labour Detail"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                
                {/* ─── Header Section ──────────────────────────────────────────────────────── */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Labour Profile: {id || 'LAB-001'}</h1>
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
                        {filteredTasks.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-slate-500">No tasks found matching your filters.</p>
                            </div>
                        ) : viewMode === 'list' ? (
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
                                        {filteredTasks.map((task) => (
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTasks.map(task => (
                                    <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col transition-all hover:shadow-md hover:border-slate-300">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800 mb-1">{task.title}</h4>
                                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">{task.subtitle}</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                                <select 
                                                    value={task.status}
                                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none cursor-pointer"
                                                >
                                                    <option value="To Do">To Do</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Overdue">Overdue</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline</span>
                                                <div className="flex items-center gap-1.5 text-sm text-slate-800 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {task.deadline}
                                                </div>
                                            </div>
                                        </div>
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
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">Rahul Sharma</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">Skilled</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter">worker.lab-001@infrapilot.com</span>
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
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Attendance Integrity</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">High Consistency</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reports style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-indigo-50 rounded-lg font-inter">
                                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Attendance & Performance Reports</p>
                                </div>
                                
                                {isLoadingReports ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <div className="inline-block w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Loading Reports...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                                        {/* Weekly Report Card */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Weekly Summary</h4>
                                            {weeklyReport ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Present Days</p>
                                                        <p className="text-lg font-black text-emerald-500">{weeklyReport.present_days || 0} / {weeklyReport.total_days || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Absent Days</p>
                                                        <p className="text-lg font-black text-rose-500">{weeklyReport.absent_days || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Hours</p>
                                                        <p className="text-lg font-black text-slate-800">{weeklyReport.total_hours || 0}h</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Wage</p>
                                                        <p className="text-lg font-black text-blue-500">₹{weeklyReport.total_wage || 0}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic py-4">No weekly data available</p>
                                            )}
                                        </div>

                                        {/* Monthly Report Card */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Monthly Summary (Month: {monthlyReport?.month || '-'})</h4>
                                            {monthlyReport ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Present Days</p>
                                                        <p className="text-lg font-black text-emerald-500">{monthlyReport.present_days || 0} / {monthlyReport.total_days || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Absent Days</p>
                                                        <p className="text-lg font-black text-rose-500">{monthlyReport.absent_days || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Hours</p>
                                                        <p className="text-lg font-black text-slate-800">{monthlyReport.total_hours || 0}h</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Wage</p>
                                                        <p className="text-lg font-black text-indigo-500">₹{monthlyReport.total_wage || 0}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic py-4">No monthly data available</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Description</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.subtitle || "No description provided."}</p>
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
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.deadline}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <Clock className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Assigned Date</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.assignedDate || "Not available"}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Status</span>
                                        </div>
                                        <div className="pl-8 flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${selectedTask.status === 'Overdue' ? 'bg-rose-500' : selectedTask.status === 'Completed' ? 'bg-emerald-500' : selectedTask.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                            <p className="text-sm text-slate-600 font-medium">{selectedTask.status}</p>
                                        </div>
                                    </div>
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
                                <select className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all cursor-pointer appearance-none">
                                    <option value="">Select Assignee</option>
                                    <option value="1">Darshan Patil</option>
                                    <option value="2" selected>Vishal Sathe</option>
                                    <option value="3">Suresh Chaudhari</option>
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
                                    defaultValue="2026-09-27"
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
                                    defaultValue="2026-08-12"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all"
                                />
                            </div>

                            {/* Project (Optional) */}
                            <div>
                                <label className="flex items-center text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                                    <FileText className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                    Project (Optional)
                                </label>
                                <select className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all cursor-pointer appearance-none">
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
