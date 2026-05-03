import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import CreateChecklistModal from "../../../components/forms/CreateChecklistModal";
import toast from "react-hot-toast";
import { 
  ShieldCheck, 
  FileText, 
  AlertOctagon, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Briefcase,
  Phone,
  Mail,
  Activity,
  Filter
} from "lucide-react";

import { checklistService } from "../../../services/checklistService";
import type { ChecklistRecord, CreateChecklistRequest } from "../../../types/checklist";

// ─── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_CHECKLISTS: ChecklistRecord[] = [
    {
        id: 901,
        business_id: "CHK-901",
        project_id: 1,
        checklist_name: "Site Opening Inventory Check",
        item_list: [
            { id: "1", task: "Security Guard Presence", status: "Done" },
            { id: "2", task: "Logbooks Updated", status: "Done" },
            { id: "3", task: "Safety Gear Check", status: "Done" },
        ],
        status: "Done",
        remarks: "All morning protocols observed.",
        reported_date: new Date().toISOString().split("T")[0],
    },
    {
        id: 902,
        business_id: "CHK-902",
        project_id: 1,
        checklist_name: "Column Reinforcement Verification",
        item_list: [
            { id: "1", task: "Steel Grade Verification", status: "Done" },
            { id: "2", task: "Spacing as per GFC", status: "Done" },
            { id: "3", task: "Binding Wire Tightness", status: "Pending" },
        ],
        status: "Pending",
        remarks: "Binding wire checks pending for Wing C columns.",
        reported_date: new Date().toISOString().split("T")[0],
    },
];

const ChecklistsPage = () => {
    const [checklistData, setChecklistData] = useState<ChecklistRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRecord | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [checklistToDelete, setChecklistToDelete] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        const resolveProjectId = async () => {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId = user?.project_id || user?.user?.project_id;
            setProjectId(pId ? Number(pId) : 1);
        };
        resolveProjectId();
    }, []);

    const fetchChecklists = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            let apiData: ChecklistRecord[] = [];
            try {
                const response = await checklistService.listChecklistsByProject(projectId);
                apiData = response.items;
            } catch (err) {
                console.warn("API unavailable, using demo data.");
            }

            if (apiData.length === 0) {
                setChecklistData(DEMO_CHECKLISTS);
            } else {
                setChecklistData(apiData);
            }
        } catch (error) {
            toast.error("Failed to sync checklists");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchChecklists();
    }, [fetchChecklists]);

    const handleCreateOrUpdate = async (data: CreateChecklistRequest) => {
        try {
            if (selectedChecklist) {
                await checklistService.updateChecklist(selectedChecklist.id, data);
                toast.success("Checklist updated successfully");
            } else {
                await checklistService.createChecklist({ ...data, project_id: projectId || 1 });
                toast.success("Checklist created successfully");
            }
            fetchChecklists();
        } catch (error) {
            toast.error("Failed to save checklist");
            throw error;
        }
    };

    const handleDeleteConfirm = async () => {
        if (!checklistToDelete) return;
        try {
            await checklistService.deleteChecklist(checklistToDelete);
            toast.success("Checklist deleted successfully");
            setIsDeleteModalOpen(false);
            fetchChecklists();
        } catch (error) {
            toast.error("Failed to delete checklist");
        }
    };

    const filteredList = useMemo(() => {
        return checklistData.filter(item => {
            const matchesSearch = item.checklist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.business_id && item.business_id.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === "All" || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [checklistData, searchTerm, statusFilter]);

    const stats = {
        total: checklistData.length,
        compliant: checklistData.filter(c => c.status === "Done").length,
        pending: checklistData.filter(c => c.status === "Pending").length,
    };

  
    return (
        <>
            <Navbar title="Checklists Vault" breadcrumb={["Engineer", "Compliance", "Checklists"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-inter">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter italic-none">Compliance Registry</h1>
                        <p className="text-slate-500 text-sm font-inter italic-none">Standardized verification logs for site operations and quality assurance.</p>
                    </div>
                    <button
                        onClick={() => { setSelectedChecklist(null); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Plus className="w-4 h-4" />
                        Initiate Checklist
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <StatCard
                        title="Total Logs"
                        value={stats.total.toString()}
                        sub="Verification Archives"
                        accent="text-slate-800"
                        icon={<FileText className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Compliant"
                        value={stats.compliant.toString()}
                        sub="Verified Done"
                        accent="text-emerald-500"
                        icon={<ShieldCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Audit"
                        value={stats.pending.toString()}
                        sub="Action Required"
                        accent="text-rose-500"
                        icon={<AlertOctagon className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Success Rate"
                        value={`${Math.round((stats.compliant / (stats.total || 1)) * 100)}%`}
                        sub="Quality Milestone"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 font-inter">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none font-inter"
                            >
                                <option value="All">All Status</option>
                                <option value="Done">Verified Done</option>
                                <option value="Pending">Pending Audit</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing compliance logs...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Checklist Name</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Verification Pts</th>
                                        <th className="px-6 py-4 font-inter">Reported</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{item.checklist_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{item.business_id || `CHK-${item.id}`}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.status === 'Done' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <p className="text-xs font-black text-slate-800 tabular-nums font-inter">{item.item_list.length} Points</p>
                                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest font-inter">{item.item_list.filter(i => i.status === "Done").length} Verified</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500 font-inter">
                                                    {item.reported_date}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity font-inter">
                                                        <button 
                                                            onClick={() => { setSelectedChecklist(item); setIsDetailModalOpen(true); }}
                                                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setSelectedChecklist(item); setIsFormModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setChecklistToDelete(item.id); setIsDeleteModalOpen(true); }}
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
                                                No compliance records found.
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
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Compliance Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedChecklist && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedChecklist.checklist_name.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">{selectedChecklist.checklist_name}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedChecklist.status === 'Done' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                                            {selectedChecklist.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">compliance.ref-{selectedChecklist.id}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">AUDIT ID: {selectedChecklist.business_id || `CHK-${selectedChecklist.id}`}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Verification Matrix</p>
                                </div>
                                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar font-inter">
                                    {selectedChecklist.item_list.map((point) => (
                                        <div key={point.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 font-inter">
                                            <div className="flex items-center gap-4 font-inter">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm ${point.status === "Done" ? "bg-emerald-500 text-white" : "bg-white border-2 border-slate-200 text-slate-300"}`}>
                                                    {point.status === "Done" ? "✓" : "!"}
                                                </div>
                                                <span className={`text-sm font-black transition-all ${point.status === "Done" ? "text-slate-800" : "text-slate-400"}`}>{point.task}</span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${point.status === "Done" ? "text-emerald-500" : "text-rose-500"}`}>
                                                {point.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Technical Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Lead Engineer Remarks</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedChecklist.remarks || "No additional technical remarks recorded for this compliance cycle."}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Protocol Integrity</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit Status</p>
                                        <p className={`text-sm font-black font-inter italic-none ${selectedChecklist.status === 'Done' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedChecklist.status.toUpperCase()}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Sync</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">Verified Registry</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsDetailModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
                        >
                            Dismiss Audit Insight
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <CreateChecklistModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleCreateOrUpdate}
                initialData={selectedChecklist}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Compliance Log"
                message="Are you sure you want to delete this checklist record? This will permanently remove the verification matrix and technical remarks."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default ChecklistsPage;
