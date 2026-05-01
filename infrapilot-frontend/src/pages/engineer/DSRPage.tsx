import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import NewDSREntryModal from "../../components/dashboard/NewDSREntryModal";
import EditDSRModal from "../../components/dashboard/EditDSRModal";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  MapPin
} from "lucide-react";

import { dsrService } from "../../services/dsrService";
import type { DsrItem, CreateDsrRequest, UpdateDsrRequest } from "../../types/dsr";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-500",
    Submitted: "bg-blue-100 text-primary",
    Approved: "bg-emerald-100 text-success",
    Verified: "bg-emerald-100 text-success",
    Rejected: "bg-red-100 text-red-600",
};

// ─── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_DSR: DsrItem[] = [
    {
        id: 101,
        business_id: "DSR-101",
        project_id: 1,
        report_date: new Date().toISOString().split("T")[0],
        report_type: "Daily",
        site_location: "Main Bridge Pier 04",
        weather: "Sunny",
        work_done: "Completed reinforcement for pile cap. Inspection done by consultant.",
        work_planned: "Start shuttering and concrete pouring for pile cap.",
        total_labour: 24,
        skilled_labour: 8,
        unskilled_labour: 16,
        contractor_id: 1,
        machinery_used: "Transit Mixer (2), Excavator (1)",
        material_received: "Steel (5 MT), Cement (100 bags)",
        material_used: "Steel (3 MT), Binding wire (20 kg)",
        status: "Verified",
        remarks: "Work progressing as per schedule.",
        issues: "",
        safety_observations: "All workers using PPE correctly.",
        latitude: 18.5204,
        longitude: 73.8567
    },
];

const DSRPage = () => {
    const [dsrList, setDsrList] = useState<DsrItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedDsr, setSelectedDsr] = useState<DsrItem | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [dsrToDelete, setDsrToDelete] = useState<number | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const resolveProjectId = async () => {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId = user?.project_id || user?.user?.project_id;
            setProjectId(pId ? Number(pId) : 1);
        };
        resolveProjectId();
    }, []);

    const fetchDsr = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            let apiData: DsrItem[] = [];
            try {
                const response = await dsrService.getDsrByProject(projectId);
                apiData = response.items;
            } catch (err) {
                console.warn("API unavailable, using demo data.");
            }

            if (apiData.length === 0) {
                setDsrList(DEMO_DSR);
            } else {
                setDsrList(apiData);
            }
        } catch (error) {
            toast.error("Failed to sync DSR logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDsr();
    }, [fetchDsr]);

    const handleCreate = async (data: CreateDsrRequest) => {
        try {
            await dsrService.createDsr({ ...data, project_id: projectId || 1 });
            toast.success("DSR submitted successfully!");
            fetchDsr();
            setIsCreateOpen(false);
        } catch (error) {
            toast.error("Failed to submit DSR");
        }
    };

    const handleUpdate = async (data: UpdateDsrRequest) => {
        if (!selectedDsr) return;
        try {
            await dsrService.updateDsr(selectedDsr.id, data);
            toast.success("DSR updated successfully!");
            fetchDsr();
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update DSR");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!dsrToDelete) return;
        try {
            await dsrService.deleteDsr(dsrToDelete);
            toast.success("DSR record removed");
            setIsDeleteOpen(false);
            fetchDsr();
        } catch (error) {
            toast.error("Failed to remove DSR");
        }
    };

    const filteredList = useMemo(() => {
        return dsrList.filter(dsr => {
            const matchesSearch = dsr.work_done.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (dsr.business_id && dsr.business_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                dsr.site_location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || dsr.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [dsrList, searchTerm, statusFilter]);

    const stats = {
        total: dsrList.length,
        verified: dsrList.filter(d => d.status === "Verified" || d.status === "Approved").length,
        pending: dsrList.filter(d => d.status === "Submitted" || d.status === "Draft").length,
    };

    return (
        <>
            <Navbar title="Daily Site Reports" breadcrumb={["Engineer", "Site Records", "DSR Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Project Daily Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none">Historical record of activities, labour, and material movements.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log New Entry
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Logs"
                        value={stats.total.toString()}
                        sub="Verified Archives"
                        accent="text-slate-800"
                        icon={<FileText className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Compliance"
                        value={`${Math.round((stats.verified / (stats.total || 1)) * 100)}%`}
                        sub="Verification Rate"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Audit"
                        value={stats.pending.toString()}
                        sub="Action Required"
                        accent="text-rose-500"
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Efficiency"
                        value="94%"
                        sub="Project Momentum"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar & Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by activity, location or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                            >
                                <option value="All">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Verified">Verified</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing site records...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Report Details</th>
                                        <th className="px-6 py-4 font-inter">Work Summary</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Resources</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((dsr) => (
                                            <tr key={dsr.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{dsr.report_date}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{dsr.business_id || `DSR-${dsr.id}`} • {dsr.report_type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-xs font-inter">
                                                        <span className="text-xs font-bold text-slate-700 truncate font-inter">{dsr.work_done}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate font-inter">{dsr.site_location}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${dsr.status ? statusBadge[dsr.status] : "bg-slate-100 text-slate-500"}`}>
                                                        {dsr.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <p className="text-[10px] font-black text-slate-800 font-inter">{dsr.total_labour} Labour</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">{dsr.weather} Weather</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity font-inter">
                                                        <button 
                                                            onClick={() => { setSelectedDsr(dsr); setIsDetailOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setSelectedDsr(dsr); setIsEditOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setDsrToDelete(dsr.id); setIsDeleteOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                                                No daily reports found in the project vault.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="DSR Insight"
                maxWidth="max-w-2xl"
            >
                {selectedDsr && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Project Execution Ledger</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6">{selectedDsr.site_location}</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">DSR ID</p>
                                        <p className="text-lg font-black text-blue-400">{selectedDsr.business_id || `DSR-${selectedDsr.id}`}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Weather</p>
                                        <p className="text-lg font-black">{selectedDsr.weather}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Labour</p>
                                        <p className="text-lg font-black tabular-nums">{selectedDsr.total_labour}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Work Completed Today</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                    "{selectedDsr.work_done}"
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 font-inter">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Material Received</p>
                                    <p className="text-sm font-bold text-slate-800 font-inter">{selectedDsr.material_received || "Nil"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Machinery Deployed</p>
                                    <p className="text-sm font-bold text-slate-800 font-inter">{selectedDsr.machinery_used || "Nil"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Site Constraints / Issues</p>
                                <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 text-sm text-rose-600 font-medium italic-none">
                                    {selectedDsr.issues || "No operational constraints reported today."}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsDetailOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
                        >
                            Dismiss Registry Insight
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modals ────────────────────────────────── */}
            <NewDSREntryModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onSubmit={handleCreate}
                projectId={projectId || 1}
            />

            <EditDSRModal 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                onSubmit={(id, data) => handleUpdate(data)} 
                initialData={selectedDsr} 
            />

            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Remove Site Record"
                message="Are you sure you want to delete this DSR record? This action will permanently remove the entry from the project ledger."
                confirmText="Delete Ledger Entry"
                type="danger"
            />
        </>
    );
};

export default DSRPage;
