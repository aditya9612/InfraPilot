import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import { 
    Filter, Search, Eye, Calendar, User, 
    CheckCircle, Clock, AlertCircle, XCircle, List, 
    Download, FileText, X, Mail, Briefcase, Phone
} from 'lucide-react';

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
        hasHistory: true
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
        hasHistory: true
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
        hasHistory: false
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
    
    // For this view, we'll only use list mode
    const openTaskModal = (task: TaskItem) => {
        setSelectedTask(task);
        setModalTab("Details");
    };

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
                            <h3 className="text-2xl font-black text-slate-800">27</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <List className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                            <h3 className="text-2xl font-black text-slate-800">0</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                            <h3 className="text-2xl font-black text-slate-800">6</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
                            <h3 className="text-2xl font-black text-slate-800">14</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cancelled</p>
                            <h3 className="text-2xl font-black text-slate-800">4</h3>
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
                        <div className="flex items-center gap-3 text-slate-800">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                                <Filter className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">All Tasks Filters</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-48"
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-800 mb-1">Status</span>
                                <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer">
                                    <option>All Status</option>
                                    <option>To Do</option>
                                    <option>In Progress</option>
                                    <option>Overdue</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 mt-5 transition-colors">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* All Tasks Content (List view) */}
                    <div className="p-6 bg-slate-50 flex-1">
                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned By</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Priority</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                        <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockTasks.map((task) => (
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
                                                <div className="relative inline-block w-full min-w-[130px]">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white shadow-sm`}>
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            task.status === 'Overdue' ? 'bg-rose-500' : 
                                                            task.status === 'Completed' ? 'bg-emerald-500' : 
                                                            task.status === 'In Progress' ? 'bg-blue-500' : 
                                                            'bg-slate-400'
                                                        }`}></div>
                                                        {task.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => openTaskModal(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
        </>
    );
};

export default LabourTaskDetailPage;
