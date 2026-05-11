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
    MapPin,
    AlertCircle,
    Briefcase,
    Phone,
    Mail,
    Image as ImageIcon,
    RotateCcw
} from "lucide-react";

import { dsrService } from "../../services/dsrService";
import { API_BASE_URL } from "../../services/api";
import type { DsrItem, CreateDsrRequest, UpdateDsrRequest } from "../../types/dsr";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-500",
    Submitted: "bg-blue-100 text-primary",
    Approved: "bg-emerald-100 text-success",
    Verified: "bg-emerald-100 text-success",
    Rejected: "bg-red-100 text-red-600",
};

const statusColors: Record<string, string> = {
    Draft: "bg-slate-500",
    Submitted: "bg-primary",
    Approved: "bg-emerald-600",
    Verified: "bg-emerald-600",
    Rejected: "bg-rose-600",
};

const DSRPage = () => {
    const [dsrList, setDsrList] = useState<DsrItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);

    // Filter state for StatCards
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Pending" | "Efficiency">("All");

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedDsr, setSelectedDsr] = useState<DsrItem | null>(null);
    const [dsrToDelete, setDsrToDelete] = useState<number | null>(null);

    useEffect(() => {
        const resolveProjectId = async () => {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId = user?.project_id || user?.user?.project_id;
            setProjectId(pId ? Number(pId) : 36);
        };
        resolveProjectId();
    }, []);

    const fetchDsr = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await dsrService.getDsrByProject(projectId);
            const apiData = response.items;

            const itemsWithPhotos = await Promise.all(apiData.map(async (item: any) => {
                try {
                    const photos = await dsrService.getDsrPhotos(item.id);
                    return { ...item, photos };
                } catch (e) {
                    return item;
                }
            }));
            setDsrList(itemsWithPhotos);
        } catch (error) {
            toast.error("Failed to sync DSR logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDsr();
    }, [fetchDsr]);

    const handleView = async (id: number) => {
        try {
            const data = await dsrService.getDsrById(id);
            setSelectedDsr(data);
            setIsDetailOpen(true);
        } catch (error) {
            const localItem = dsrList.find(item => item.id === id);
            if (localItem) {
                setSelectedDsr(localItem);
                setIsDetailOpen(true);
            } else {
                toast.error("Failed to load project ledger details");
            }
        }
    };

    const handleEdit = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await dsrService.getDsrById(id);
            setSelectedDsr(data);
            setIsEditOpen(true);
        } catch (error) {
            const localItem = dsrList.find(item => item.id === id);
            if (localItem) {
                setSelectedDsr(localItem);
                setIsEditOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: CreateDsrRequest) => {
        try {
            await dsrService.createDsr({ ...data, project_id: projectId || 36 });
            toast.success("DSR submitted successfully!");
            fetchDsr();
            setIsCreateOpen(false);
        } catch (error) {
            toast.error("Failed to submit DSR");
        }
    };

    const handleUpdate = async (id: number, data: UpdateDsrRequest) => {
        try {
            await dsrService.updateDsr(id, data);
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
            toast.success("DSR record archived");
            setIsDeleteOpen(false);
            fetchDsr();
        } catch (error) {
            toast.error("Failed to remove DSR");
        }
    };

    const filteredList = useMemo(() => {
        let data = dsrList;

        // Apply StatCard Filter
        if (activeStatFilter === "Compliance") {
            data = data.filter(d => d.status === "Verified" || d.status === "Approved");
        } else if (activeStatFilter === "Pending") {
            data = data.filter(d => d.status === "Submitted" || d.status === "Draft");
        }

        return data.filter(dsr => {
            const matchesSearch = dsr.work_done.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (dsr.business_id && dsr.business_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                dsr.site_location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || dsr.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [dsrList, searchTerm, statusFilter, activeStatFilter]);

    const stats = useMemo(() => {
        const total = dsrList.length;
        const verified = dsrList.filter(d => d.status === "Verified" || d.status === "Approved").length;
        const pending = dsrList.filter(d => d.status === "Submitted" || d.status === "Draft").length;
        return {
            total,
            verified,
            pending,
            complianceRate: `${total > 0 ? Math.round((verified / total) * 100) : 0}%`
        };
    }, [dsrList]);

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
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log DSR Entry
                    </button>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Logs"
                            value={stats.total.toString()}
                            sub="Verified Archives"
                            accent="text-slate-800"
                            icon={<FileText className={`w-5 h-5 ${activeStatFilter === "All" ? "text-primary scale-110" : "text-slate-400 group-hover:text-primary"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Compliance" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Compliance"
                            value={stats.complianceRate}
                            sub="Verification Rate"
                            accent="text-emerald-500"
                            icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Compliance" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500 bg-rose-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Pending Audit"
                            value={stats.pending.toString()}
                            sub="Action Required"
                            accent="text-rose-500"
                            icon={<AlertTriangle className={`w-5 h-5 ${activeStatFilter === "Pending" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Efficiency")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Efficiency" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Efficiency"
                            value="94%"
                            sub="Project Momentum"
                            accent="text-blue-500"
                            icon={<Activity className={`w-5 h-5 ${activeStatFilter === "Efficiency" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
                        />
                    </div>
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
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-3 font-inter">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest"
                            >
                                <option value="All">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Verified">Verified</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing DSR vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Report Details</th>
                                        <th className="px-6 py-4 font-inter">Work Summary</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Resources</th>
                                        <th className="px-6 py-4 font-inter">Site Media</th>
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
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${dsr.status ? statusBadge[dsr.status] : "bg-slate-100 text-slate-500"} font-inter`}>
                                                        {dsr.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <p className="text-[10px] font-black text-slate-800 font-inter">{dsr.total_labour} Labour</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">{dsr.weather} Weather</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                                        {dsr.photos && dsr.photos.length > 0 ? (
                                                            dsr.photos.slice(0, 3).map((photo) => (
                                                                <div key={photo.id} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:z-10 transition-transform hover:scale-110">
                                                                    <img
                                                                        src={photo.url.startsWith('http') ? photo.url : `${API_BASE_URL}/${photo.url}`}
                                                                        alt="Site"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))
                                                        ) : dsr.dsr_image ? (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                                                <img src={dsr.dsr_image} alt="Site" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                                <ImageIcon className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        {dsr.photos && dsr.photos.length > 3 && (
                                                            <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500 z-0">
                                                                +{dsr.photos.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity font-inter">
                                                        <button
                                                            onClick={() => handleView(dsr.id)}
                                                            className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 font-inter ${dsr.status ? statusColors[dsr.status] : 'bg-primary'} ${dsr.status ? `shadow-${statusColors[dsr.status].split('-')[1]}/20` : 'shadow-primary/20'}`}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(dsr.id)}
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
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
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
                title="DSR Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedDsr && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${selectedDsr.status ? statusColors[selectedDsr.status] : 'bg-primary'} rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">D</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter italic-none">{selectedDsr.business_id || `DSR-${selectedDsr.id}`}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{selectedDsr.status || 'Verified'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">dsr.ref-{selectedDsr.id}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">LOG DATE: {selectedDsr.report_date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(selectedDsr.photos && selectedDsr.photos.length > 0) ? (
                            <div className="px-2 mb-8 font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter text-center">Site Media Gallery ({selectedDsr.photos.length})</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedDsr.photos.map((photo) => (
                                        <div key={photo.id} className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-[4/3] group relative">
                                            <img
                                                src={photo.url.startsWith('http') ? photo.url : `${API_BASE_URL}/${photo.url}`}
                                                alt="Site Documentation"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : selectedDsr.dsr_image && (
                            <div className="px-2 mb-8 font-inter text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Site Documentation</p>
                                <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm aspect-video">
                                    <img src={selectedDsr.dsr_image} alt="Site Documentation" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Operational Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Site Location</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDsr.site_location}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Weather Condition</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDsr.weather}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Total Personnel</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDsr.total_labour || 0} Units</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Registry ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDsr.business_id || `DSR-${selectedDsr.id}`}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Work Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Work Completed Today</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedDsr.work_done}"
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Resource Logistics</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Material Received</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDsr.material_received || "Nil"}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Machinery Used</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDsr.machinery_used || "Nil"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Issues section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-rose-50 rounded-lg font-inter">
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.15em] font-inter">Constraints & Observations</p>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-600 font-medium font-inter italic-none">
                                    {selectedDsr.issues || "No operational constraints reported today."}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDetailOpen(false)}
                            className={`w-full py-5 ${selectedDsr.status ? statusColors[selectedDsr.status] : 'bg-primary'} text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 font-inter italic-none shadow-primary/20`}
                        >
                            Dismiss DSR Insight
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modals ────────────────────────────────── */}
            <NewDSREntryModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
                projectId={projectId || 36}
            />

            <EditDSRModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdate}
                dsr={selectedDsr}
                projectId={projectId || 36}
            />


            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard DSR Entry"
                message="Are you sure you want to delete this DSR record? This action will permanently remove the entry from the project ledger."
                confirmText="Archive Record"
                type="danger"
            />
        </>
    );
};

export default DSRPage;
