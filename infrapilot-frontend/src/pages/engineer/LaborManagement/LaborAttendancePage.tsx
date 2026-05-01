import { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Users, 
  Clock, 
  MapPin, 
  Camera, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AttendanceRecord {
    id: number;
    worker_name: string;
    worker_code: string;
    check_in_time: string;
    check_out_time: string | null;
    location_coords: string;
    selfie_url: string;
    status: "Present" | "On-Leave" | "Half-Day";
    shift: "Day" | "Night";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockAttendance: AttendanceRecord[] = [
    {
        id: 1,
        worker_name: "Rajesh Kumar",
        worker_code: "W-2026-001",
        check_in_time: "08:15 AM",
        check_out_time: "05:30 PM",
        location_coords: "19.0760° N, 72.8777° E",
        selfie_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
        status: "Present",
        shift: "Day",
    },
    {
        id: 2,
        worker_name: "Amit Singh",
        worker_code: "W-2026-042",
        check_in_time: "08:30 AM",
        check_out_time: null,
        location_coords: "19.0755° N, 72.8780° E",
        selfie_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        status: "Present",
        shift: "Day",
    },
];

const LaborAttendancePage = () => {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>(mockAttendance);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");

    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

    const filteredAttendance = useMemo(() => {
        return attendance.filter(a => {
            const matchesSearch = a.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                a.worker_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All Status" || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [attendance, searchTerm, statusFilter]);

    const stats = {
        total: attendance.length,
        onSite: attendance.filter(a => !a.check_out_time).length,
        verified: attendance.filter(a => a.status === "Present").length,
        compliance: "98%"
    };

    return (
        <>
            <Navbar title="Workforce Attendance" breadcrumb={["Engineer", "Workforce", "Live Attendance"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Daily Workforce Attendance Log</h1>
                        <p className="text-slate-500 text-sm italic-none">Real-time tracking of site personnel with GPS and Selfie verification.</p>
                    </div>
                    <button
                        onClick={() => toast.success("Attendance Marking Flow Initiated")}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Mark Attendance
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Logged" value={stats.total.toString()} sub="Daily Registry" accent="text-slate-800" icon={<Users className="w-5 h-5" />} />
                    <StatCard title="On-Site Now" value={stats.onSite.toString()} sub="Active Personnel" accent="text-blue-500" icon={<Clock className="w-5 h-5" />} />
                    <StatCard title="Verified Present" value={stats.verified.toString()} sub="GPS Validated" accent="text-emerald-500" icon={<CheckCircle2 className="w-5 h-5" />} />
                    <StatCard title="Compliance Score" value={stats.compliance} sub="Policy Adherence" accent="text-indigo-500" icon={<AlertCircle className="w-5 h-5" />} />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input type="text" placeholder="Search by name or worker code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter">
                                <option>All Status</option>
                                <option>Present</option>
                                <option>On-Leave</option>
                                <option>Half-Day</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Personnel Detail</th>
                                    <th className="px-6 py-4 font-inter">Timing & Shift</th>
                                    <th className="px-6 py-4 font-inter">Verification Audit</th>
                                    <th className="px-6 py-4 font-inter">Status</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredAttendance.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 font-inter">
                                                <img src={record.selfie_url} alt="selfie" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter">{record.worker_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{record.worker_code}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-black text-slate-700 tabular-nums font-inter">{record.check_in_time} → {record.check_out_time || "ACTIVE"}</span>
                                                <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">{record.shift} Shift</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 font-inter">
                                                    <MapPin className="w-3 h-3 text-primary font-inter" />
                                                    <span className="font-inter italic-none truncate max-w-[120px]">{record.location_coords}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 font-inter">
                                                    <Camera className="w-3 h-3 text-emerald-500 font-inter" />
                                                    <span className="font-inter italic-none">SELFIE VERIFIED</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button onClick={() => { setSelectedRecord(record); setIsDetailOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => toast.success("Attendance entry editable")} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => { setRecordToDelete(record.id); setIsDeleteOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Attendance Verification Audit" maxWidth="max-w-xl">
                {selectedRecord && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter text-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Live Site Attendance Profile</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">{selectedRecord.worker_name}</h3>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Inbound</p>
                                        <p className="text-lg font-black font-inter italic-none">{selectedRecord.check_in_time}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Outbound</p>
                                        <p className="text-lg font-black font-inter italic-none">{selectedRecord.check_out_time || "ACTIVE"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-8 font-inter">
                            <img src={selectedRecord.selfie_url} alt="Verification" className="w-32 h-32 rounded-2xl object-cover mb-4 border-2 border-white shadow-md font-inter" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Identity Verification Selfie</p>
                        </div>
                        <button onClick={() => setIsDetailOpen(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 font-inter italic-none">Dismiss Audit Insight</button>
                    </div>
                )}
            </Modal>

            <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => { setAttendance(prev => prev.filter(r => r.id !== recordToDelete)); setIsDeleteOpen(false); toast.success("Attendance entry purged"); }} title="Purge Attendance Log" message="Are you sure you want to delete this worker attendance record? This will remove the verification selfie and GPS audit trail." confirmText="Purge Record" type="danger" />
        </>
    );
};

export default LaborAttendancePage;
