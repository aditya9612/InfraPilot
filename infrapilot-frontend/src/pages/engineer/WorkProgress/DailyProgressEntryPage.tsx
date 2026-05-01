import { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  Layers,
  FileText
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyEntry {
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

const mockDailyEntries: DailyEntry[] = [
    {
        id: 101,
        activity_name: "Excavation",
        boq_code: "BOQ-STR-001",
        today_progress: 120,
        planned_quantity: 5000,
        total_completed: 3800,
        remaining_quantity: 1200,
        percent_completion: 76,
        start_date: "2026-03-01",
        end_date: "2026-04-20",
        status: "On Track",
    },
    {
        id: 102,
        activity_name: "RCC Work",
        boq_code: "BOQ-STR-002",
        today_progress: 45,
        planned_quantity: 1500,
        total_completed: 600,
        remaining_quantity: 900,
        percent_completion: 40,
        start_date: "2026-03-15",
        end_date: "2026-05-30",
        status: "Delay",
    },
];

const initialFormData = {
    activity_name: "",
    boq_code: "",
    today_progress: "",
    status: "On Track" as "On Track" | "Delay",
};

const DailyProgressEntryPage = () => {
    const [entries, setEntries] = useState<DailyEntry[]>(mockDailyEntries);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(initialFormData);
    const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                e.boq_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All Status" || e.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [entries, searchTerm, statusFilter]);

    const stats = {
        avgCompletion: Math.round(entries.reduce((acc, curr) => acc + curr.percent_completion, 0) / entries.length),
        onTrack: entries.filter(e => e.status === "On Track").length,
        delay: entries.filter(e => e.status === "Delay").length,
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry: DailyEntry = {
            id: formMode === 'edit' && selectedEntry ? selectedEntry.id : Date.now(),
            activity_name: formData.activity_name,
            boq_code: formData.boq_code,
            today_progress: Number(formData.today_progress),
            planned_quantity: 5000,
            total_completed: (selectedEntry?.total_completed || 0) + Number(formData.today_progress),
            remaining_quantity: 1200,
            percent_completion: 80,
            start_date: "2026-03-01",
            end_date: "2026-05-01",
            status: formData.status,
        };

        if (formMode === 'edit') {
            setEntries(prev => prev.map(e => e.id === selectedEntry?.id ? newEntry : e));
            toast.success("Progress log updated");
        } else {
            setEntries(prev => [newEntry, ...prev]);
            toast.success("Daily progress logged");
        }
        setIsFormOpen(false);
    };

    return (
        <>
            <Navbar title="Daily Progress Tracking" breadcrumb={["Engineer", "Work Progress", "Daily Entry"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Daily Progress & Execution Log</h1>
                        <p className="text-slate-500 text-sm italic-none">Record daily activity benchmarks and monitor site execution against planned BOQ milestones.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setIsFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Progress
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Average Efficiency" value={`${stats.avgCompletion}%`} sub="Overall Completion" accent="text-blue-500" icon={<TrendingUp className="w-5 h-5" />} />
                    <StatCard title="Healthy Metrics" value={stats.onTrack.toString()} sub="On Track Activities" accent="text-emerald-500" icon={<Clock className="w-5 h-5" />} />
                    <StatCard title="Critical Delays" value={stats.delay.toString()} sub="Action Required" accent="text-rose-500" icon={<AlertCircle className="w-5 h-5" />} />
                    <StatCard title="Milestone Status" value="Active" sub="Project Health" accent="text-slate-800" icon={<Layers className="w-5 h-5" />} />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input type="text" placeholder="Search by activity or BOQ code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter">
                                <option>All Status</option>
                                <option>On Track</option>
                                <option>Delay</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Site Activity & BOQ Code</th>
                                    <th className="px-6 py-4 font-inter">Work Progress Delta</th>
                                    <th className="px-6 py-4 font-inter">Execution Status</th>
                                    <th className="px-6 py-4 font-inter">Efficiency</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{entry.activity_name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{entry.boq_code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-black text-slate-700 tabular-nums font-inter">+{entry.today_progress} Units Today</span>
                                                <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">Total: {entry.total_completed} / {entry.planned_quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-bold text-slate-600 font-inter truncate italic-none">{entry.status}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                    <FileText className="w-3 h-3" />
                                                    <span className="truncate font-inter italic-none">Target: {entry.end_date}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full max-w-[100px] flex flex-col gap-1.5 font-inter">
                                                <div className="flex items-center justify-between font-inter">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{entry.percent_completion}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden font-inter">
                                                    <div className={`h-full rounded-full ${entry.status === 'On Track' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${entry.percent_completion}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button onClick={() => { setSelectedEntry(entry); setIsDetailOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setFormMode("edit"); setSelectedEntry(entry); setFormData({ activity_name: entry.activity_name, boq_code: entry.boq_code, today_progress: entry.today_progress.toString(), status: entry.status }); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => { setEntryToDelete(entry.id); setIsDeleteOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── Form Modal ──────────────────────────────────── */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === 'create' ? 'Log Daily Site Progress' : 'Update Progress Log'} maxWidth="max-w-xl">
                <div className="p-8 font-inter text-inter">
                    <form onSubmit={handleSubmit} className="space-y-6 font-inter">
                        <div className="grid grid-cols-1 gap-6 font-inter">
                            <div className="flex flex-col font-inter">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Activity Name</label>
                                <input type="text" value={formData.activity_name} onChange={(e) => setFormData({...formData, activity_name: e.target.value})} placeholder="e.g. RCC Foundation" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-inter">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">BOQ Code</label>
                                    <input type="text" value={formData.boq_code} onChange={(e) => setFormData({...formData, boq_code: e.target.value})} placeholder="BOQ-001" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Today's Progress</label>
                                    <input type="number" value={formData.today_progress} onChange={(e) => setFormData({...formData, today_progress: e.target.value})} placeholder="45" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                            </div>
                            <div className="flex flex-col font-inter">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Execution Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter">
                                    <option value="On Track">On Track</option>
                                    <option value="Delay">Delay</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-6 font-inter">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all font-inter italic-none">Cancel</button>
                            <button type="submit" className="px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter italic-none">
                                {formMode === 'create' ? 'Confirm & Log Progress' : 'Update Log'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Activity Execution Insight" maxWidth="max-w-2xl">
                {selectedEntry && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Daily Progress Analytics</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">{selectedEntry.activity_name}</h3>
                                <div className="grid grid-cols-3 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Efficiency</p>
                                        <p className="text-lg font-black font-inter italic-none">{selectedEntry.percent_completion}%</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Today</p>
                                        <p className="text-lg font-black font-inter italic-none">+{selectedEntry.today_progress} Units</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Status</p>
                                        <p className="text-lg font-black font-inter italic-none uppercase">{selectedEntry.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsDetailOpen(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 font-inter italic-none">Dismiss Execution Insight</button>
                    </div>
                )}
            </Modal>

            <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => { setEntries(prev => prev.filter(e => e.id !== entryToDelete)); setIsDeleteOpen(false); toast.success("Activity log archived"); }} title="Discard Progress Record" message="Are you sure you want to remove this daily progress log?" confirmText="Archive Log" type="danger" />
        </>
    );
};

export default DailyProgressEntryPage;
