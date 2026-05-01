import { useState, useMemo, useRef } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import CreateActivityModal from "../../../components/forms/CreateActivityModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  FileSpreadsheet,
  LayoutList,
  GanttChart,
  Eye,
  Filter,
  Layers,
  ArrowRight
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Activity {
    id: number;
    activity_name: string;
    boq_code: string;
    planned_quantity: number;
    today_progress: number;
    total_completed: number;
    remaining_quantity: number;
    percent_completion: number;
    start_date: string;
    end_date: string;
    status: "On Track" | "Delay";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockActivities: Activity[] = [
    {
        id: 1,
        activity_name: "Excavation",
        boq_code: "BOQ-STR-001",
        planned_quantity: 5000,
        today_progress: 120,
        total_completed: 3800,
        remaining_quantity: 1200,
        percent_completion: 76,
        start_date: "2026-03-01",
        end_date: "2026-04-20",
        status: "On Track",
    },
    {
        id: 2,
        activity_name: "RCC Work",
        boq_code: "BOQ-STR-002",
        planned_quantity: 1500,
        today_progress: 45,
        total_completed: 600,
        remaining_quantity: 900,
        percent_completion: 40,
        start_date: "2026-03-15",
        end_date: "2026-05-30",
        status: "Delay",
    },
];

const ActivityListPage = () => {
    const [activities, setActivities] = useState<Activity[]>(mockActivities);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"List" | "Gantt">("List");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const totalActivities = activities.length;
    const delayedActivities = activities.filter((a: Activity) => a.status === "Delay").length;
    const avgCompletion = Math.round(activities.reduce((sum: number, a: Activity) => sum + a.percent_completion, 0) / (totalActivities || 1));

    const handleCreateOrUpdate = async (data: any) => {
        setIsLoading(true);
        try {
            if (editingActivity) {
                setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, ...data } : a));
                toast.success("Activity updated");
            } else {
                const newActivity = { ...data, id: Date.now(), today_progress: 0, total_completed: 0, remaining_quantity: data.planned_quantity, percent_completion: 0 };
                setActivities(prev => [newActivity, ...prev]);
                toast.success("New activity added");
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        setActivities(prev => prev.filter(a => a.id !== itemToDelete));
        toast.success("Activity archived");
        setIsDeleteModalOpen(false);
    };

    const filteredActivities = useMemo(() => {
        return activities.filter((activity: Activity) => {
            const matchesSearch = activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.boq_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || activity.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [activities, searchTerm, statusFilter]);

    return (
        <>
            <Navbar title="Activity Master List" breadcrumb={["Engineer", "Execution", "Activity Master"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Project Activity Master List</h1>
                        <p className="text-slate-500 text-sm italic-none">Monitor technical benchmarks and monitor site execution against BOQ milestones.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx, .xls, .csv" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Import BOQ
                        </button>
                        <button
                            onClick={() => { setEditingActivity(null); setIsModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            New Activity
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Milestones" value={totalActivities.toString()} sub="Activity Registry" accent="text-slate-800" icon={<ClipboardList className="w-5 h-5" />} />
                    <StatCard title="Overall Progress" value={`${avgCompletion}%`} sub="Project Completion" accent="text-emerald-500" icon={<CheckCircle2 className="w-5 h-5" />} />
                    <StatCard title="Critical Delays" value={delayedActivities.toString()} sub="Action Required" accent="text-rose-500" icon={<Clock className="w-5 h-5" />} />
                    <StatCard title="Asset Intensity" value="High" sub="System Health" accent="text-indigo-500" icon={<Layers className="w-5 h-5" />} />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input type="text" placeholder="Search by name or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" />
                        </div>
                        <div className="flex items-center gap-4 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter">
                                    <option value="All">All Status</option>
                                    <option value="On Track">On Track</option>
                                    <option value="Delay">Delay</option>
                                </select>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-100 font-inter">
                                <button onClick={() => setViewMode("List")} className={`p-1.5 rounded-lg transition-all ${viewMode === 'List' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode("Gantt")} className={`p-1.5 rounded-lg transition-all ${viewMode === 'Gantt' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><GanttChart className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Activity Milestone</th>
                                    <th className="px-6 py-4 font-inter">BOQ Metrics</th>
                                    <th className="px-6 py-4 font-inter">Execution Period</th>
                                    <th className="px-6 py-4 font-inter">Progress</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredActivities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{activity.activity_name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{activity.boq_code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-black text-slate-700 tabular-nums font-inter">{activity.total_completed.toLocaleString()} / {activity.planned_quantity.toLocaleString()} Units</span>
                                                <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">REMAINING: {activity.remaining_quantity.toLocaleString()} Units</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 font-inter">
                                                    <span className="font-inter italic-none uppercase tracking-widest">Target Finish</span>
                                                    <ArrowRight className="w-3 h-3 text-slate-400 font-inter" />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 font-inter">{activity.end_date}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full max-w-[120px] flex flex-col gap-1.5 font-inter">
                                                <div className="flex items-center justify-between font-inter">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${activity.status === 'On Track' ? 'text-emerald-500' : 'text-rose-500'}`}>{activity.percent_completion}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden font-inter border border-slate-200/50">
                                                    <div className={`h-full rounded-full ${activity.status === 'On Track' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${activity.percent_completion}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button onClick={() => toast.success("Activity details visible in Gantt view")} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setEditingActivity(activity); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => { setItemToDelete(activity.id); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            <CreateActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateOrUpdate} initialData={editingActivity} isLoading={isLoading} />
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title="Archive Milestone" message="Are you sure you want to remove this activity from the master list?" confirmText="Archive Activity" type="danger" />
        </>
    );
};

export default ActivityListPage;
