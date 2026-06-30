import type { Milestone, Task, ProjectMember } from "../../types/project";
import {
    X,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    Percent,
    ClipboardList
} from "lucide-react";

interface MilestoneDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    milestone: Milestone;
    tasks: Task[];
    members: ProjectMember[];
}

const MilestoneDetailsModal = ({
    isOpen,
    onClose,
    milestone,
    tasks,
    members
}: MilestoneDetailsModalProps) => {
    if (!isOpen) return null;

    // Calculate progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const averageProgress =
        totalTasks > 0
            ? Math.round(
                tasks.reduce((sum, t) => sum + (t.completion_percentage || 0), 0) /
                totalTasks
            )
            : 0;

    const getMemberName = (task: Task) => {
        const directName = (task as any).assigned_to_name || (task as any).engineer_name || (task as any).assigned_user?.full_name || (task as any).engineer?.full_name;
        if (directName) return directName;
        const id = task.assigned_user_id || (task as any).assigned_to || (task as any).engineer_id;
        if (!id) return "Unassigned";
        const member = members.find(
            (m) => (m as any).user_id == id || (m as any).id == id
        );
        if (!member) return `User ${id}`;
        return member.full_name;
    };

    const priorityBadges: Record<any, string> = {
        HIGH: "bg-rose-500 text-white",
        MEDIUM: "bg-amber-500 text-white",
        LOW: "bg-blue-500 text-white",
        1: "bg-rose-500 text-white",
        2: "bg-amber-500 text-white",
        3: "bg-blue-500 text-white"
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-primary py-5 px-6 flex items-center justify-between relative overflow-hidden font-inter border-b border-primary/20 shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10 flex items-center gap-4 flex-1 min-w-0 mr-4">
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-primary text-xl font-bold border border-white/20">
                                <ClipboardList className="w-6 h-6 text-primary" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-pulse ${milestone.status === "Completed" ? 'bg-success' : 'bg-primary'
                                }`}>
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight break-words pr-2">
                                {milestone.title}
                            </h2>
                            <p className="text-blue-100 text-xs font-medium tracking-wide">
                                Milestone Details & Associated Tasks
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    {/* Milestone Details Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase ${milestone.status === "Completed"
                                    ? "bg-green-100 text-success"
                                    : milestone.status === "In Progress"
                                        ? "bg-blue-100 text-primary animate-pulse"
                                        : "bg-slate-100 text-slate-500"
                                    }`}>
                                    {milestone.status || "Pending"}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Milestone ID: #{milestone.id}
                                </span>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400 font-bold uppercase text-[10px]">Start:</span>
                                    <span>
                                        {milestone.start_date
                                            ? new Date(milestone.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400 font-bold uppercase text-[10px]">Target:</span>
                                    <span>
                                        {milestone.end_date
                                            ? new Date(milestone.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                Description
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                                {milestone.description || "No description provided for this milestone."}
                            </p>
                        </div>

                        {/* Progress Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Overall Completion
                                </span>
                                <div className="flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-primary" />
                                    <span className="text-xl font-black text-slate-800">
                                        {averageProgress}%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Tasks (Compl / Total)
                                </span>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span className="text-xl font-black text-slate-800">
                                        {completedTasks} / {totalTasks}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Pending Tasks
                                </span>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <span className="text-xl font-black text-slate-800">
                                        {totalTasks - completedTasks}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span>Milestone Progress Bar</span>
                                <span className="text-slate-700 font-extrabold">{averageProgress}%</span>
                            </div>
                            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                    style={{ width: `${averageProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Associated Tasks Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-base">Associated Tasks ({totalTasks})</h3>
                        </div>

                        {totalTasks === 0 ? (
                            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                                <p className="text-3xl mb-3">📋</p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    No tasks assigned to this milestone
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-inter">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-100 font-inter">
                                                <th className="p-4 whitespace-nowrap">Task Title</th>
                                                <th className="p-4 whitespace-nowrap text-center">Priority</th>
                                                <th className="p-4 whitespace-nowrap">Status</th>
                                                <th className="p-4 whitespace-nowrap">Start / End Date</th>
                                                <th className="p-4 whitespace-nowrap">Assigned User</th>
                                                <th className="p-4 whitespace-nowrap text-center">Completion %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs"
                                                >
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-800">{task.title}</div>
                                                        {task.description && (
                                                            <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${priorityBadges[task.priority] || 'bg-slate-500 text-white'
                                                            }`}>
                                                            {typeof task.priority === 'number'
                                                                ? (task.priority === 1 ? 'HIGH' : task.priority === 2 ? 'MEDIUM' : 'LOW')
                                                                : (task.priority || 'LOW')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${task.status === 'Cancelled'
                                                                ? 'bg-rose-500'
                                                                : task.status === 'Completed'
                                                                    ? 'bg-emerald-500'
                                                                    : task.status === 'In Progress'
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-slate-400'
                                                                }`} />
                                                            <span className="font-bold text-slate-700">{task.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[9px] text-slate-400">
                                                                S: <span className="font-bold text-slate-600">{new Date(task.start_date).toLocaleDateString()}</span>
                                                            </span>
                                                            <span className="text-[9px] text-slate-400">
                                                                E: <span className="font-bold text-slate-600">{new Date(task.end_date).toLocaleDateString()}</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-600 font-medium">
                                                        {getMemberName(task)}
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-slate-800">
                                                        {task.completion_percentage || 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MilestoneDetailsModal;
