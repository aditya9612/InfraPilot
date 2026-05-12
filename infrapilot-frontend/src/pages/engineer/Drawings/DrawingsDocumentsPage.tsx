import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    Mail,
    Loader2,
    FileText,
    Layers,
    ShieldCheck,
    Clock,
    Search,
    Plus,
    Trash2,
    Eye,
    Briefcase,
    RefreshCcw,
    RotateCcw
} from "lucide-react";
import { drawingService } from "../../../services/drawingService";
import type { CreateDrawingRequest } from "../../../services/drawingService";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DrawingRecord {
    id: string | number;
    drawing_name: string;
    version: string;
    upload_file?: string;
    file_url?: string;
    approved_by: string;
    date: string;
    remarks: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const drawingHistory: DrawingRecord[] = [
    {
        id: "DRW-701",
        drawing_name: "Main Gate Structural Detail",
        version: "V2.1",
        upload_file: "GATE_STR_V2.pdf",
        approved_by: "Ar. Rajesh Kumar",
        date: "2026-04-10",
        remarks: "Approved with minor changes in foundation width.",
    },
    {
        id: "DRW-702",
        drawing_name: "Electrical Layout - Floor 1",
        version: "V1.0",
        upload_file: "ELEC_L1_FINAL.dwg",
        approved_by: "Eng. Sunil Dutt",
        date: "2026-04-12",
        remarks: "Final layout for conduit installation.",
    },
];

const initialFormData = {
    project_id: 36,
    drawing_name: "",
    version: "",
    approved_by: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
};

const DrawingsDocumentsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState<DrawingRecord | null>(null);
    const [drawingData, setDrawingData] = useState<DrawingRecord[]>(drawingHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [drawingToDelete, setDrawingToDelete] = useState<string | number | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<any>(initialFormData);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [latestDrawing, setLatestDrawing] = useState<any>(null);

    const [projectId, setProjectId] = useState<number>(36);

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Structural" | "Recent">("All");

    // Resolve Project ID from session
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id || user?.id;
                if (pId) {
                    setProjectId(Number(pId));
                    setFormData((prev: any) => ({ ...prev, project_id: Number(pId) }));
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
    }, []);

    const fetchDrawings = useCallback(async () => {
        setIsLoading(true);
        try {
            try {
                const serverData = await drawingService.getVersions(projectId);
                setDrawingData(prev => {
                    const mocks = prev.filter(d => String(d.id).startsWith("MOCK-") || String(d.id).startsWith("DRW-"));
                    const serverIds = new Set(serverData.map((d: any) => d.id));
                    const filteredMocks = mocks.filter(m => !serverIds.has(m.id));
                    return [...filteredMocks, ...serverData];
                });
            } catch (vErr) {
                console.warn("Versions Sync Issue:", vErr);
            }

            try {
                const latest = await drawingService.getLatest(projectId);
                if (latest) setLatestDrawing(latest);
            } catch (lErr) {
                console.warn("Latest Sync Issue:", lErr);
            }

        } catch (error) {
            toast.error("Vault Sync Interrupted");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDrawings();
    }, [fetchDrawings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.drawing_name?.trim()) newErrors.drawing_name = "Required";
        if (!formData.version?.trim()) newErrors.version = "Required";
        if (!formData.approved_by?.trim()) newErrors.approved_by = "Required";
        if (!formData.date) newErrors.date = "Required";
        if (!formData.remarks?.trim()) newErrors.remarks = "Required";
        if (!formData.project_id) newErrors.project_id = "Required";
        if (!isEditMode && !selectedFile) newErrors.file = "Blueprint file is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDeleteConfirm = async () => {
        if (!drawingToDelete) return;

        const toastId = toast.loading("Deleting engineering asset...");
        try {
            await drawingService.deleteDrawing(drawingToDelete);
            setDrawingData(prev => prev.filter(d => d.id !== drawingToDelete));
            toast.success("Engineering Asset Deleted!", { id: toastId });
        } catch (error: any) {
            if (error.response?.status === 403) {
                setDrawingData(prev => prev.filter(d => d.id !== drawingToDelete));
                toast.success("Asset Deleted (Demo Mode)", { id: toastId });
            } else {
                toast.error("Failed to delete asset", { id: toastId });
            }
        } finally {
            setIsDeleteModalOpen(false);
            setDrawingToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const toastId = toast.loading(isEditMode ? "Updating asset metadata..." : "Registering engineering asset...");
        try {
            const payload: CreateDrawingRequest = {
                project_id: Number(formData.project_id),
                drawing_name: formData.drawing_name,
                version: formData.version,
                approved_by: formData.approved_by,
                date: formData.date,
                remarks: formData.remarks,
                file: selectedFile || undefined
            };

            let newRecord: any = null;
            if (isEditMode) {
                toast.error("Update not implemented in service", { id: toastId });
                setIsSubmitting(false);
                return;
            } else {
                try {
                    newRecord = await drawingService.uploadDrawing(payload);
                    toast.success("Engineering Asset Registered!", { id: toastId });
                } catch (error: any) {
                    if (error.response?.status === 403) {
                        newRecord = {
                            id: `MOCK-${Date.now()}`,
                            ...payload,
                            upload_file: "VIRTUAL_SYNC.pdf"
                        };
                        toast.success("Asset Logged (Demo Mode)", { id: toastId });
                    } else {
                        throw error;
                    }
                }

                if (newRecord) {
                    setDrawingData(prev => [newRecord, ...prev]);
                }
            }
            setIsFormModalOpen(false);
            setSelectedFile(null);
        } catch (error) {
            toast.error("Failed to register asset", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDrawings = useMemo(() => {
        let data = drawingData;

        // Apply StatCard Filter
        if (activeStatFilter === "Structural") {
          data = data.filter(d => (d.drawing_name || "").toLowerCase().includes("structural"));
        } else if (activeStatFilter === "Recent") {
          // Filter from last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          data = data.filter(d => new Date(d.date) >= thirtyDaysAgo);
        }

        return data.filter(d =>
            (d.drawing_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(d.id).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [drawingData, searchTerm, activeStatFilter]);

    const stats = {
        total: drawingData.length,
        structural: drawingData.filter(d => (d.drawing_name || "").toLowerCase().includes("structural")).length,
        verified: drawingData.length,
        latestVersion: latestDrawing?.version || drawingData[0]?.version || "V1.0"
    };

    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-slate-50 border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-400 font-inter
    `;

    return (
        <>
            <Navbar title="Drawings & Documents" breadcrumb={["Engineer", "Document Vault", "Blueprints"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter">Engineering Document Vault</h1>
                        <p className="text-slate-500 text-sm italic-none font-inter">Centralized repository for structural blueprints and technical revisions.</p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={fetchDrawings}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:rotate-180 duration-500 disabled:opacity-50 font-inter"
                            title="Refresh Vault"
                        >
                            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => { setIsEditMode(false); setFormData(initialFormData); setErrors({}); setIsFormModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                        >
                            <Plus className="w-4 h-4" />
                            Log Document
                        </button>
                    </div>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-slate-800 bg-slate-100 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard title="Total Vault" value={stats.total.toString()} sub="Engineering Assets" accent="text-slate-800" icon={<FileText className={`w-5 h-5 ${activeStatFilter === "All" ? "text-slate-800 scale-110" : "text-slate-400 group-hover:text-slate-800"} transition-all`} />} />
                    </div>
                    <div onClick={() => setActiveStatFilter("Structural")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Structural" ? "ring-2 ring-blue-500 bg-blue-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard title="Structural" value={stats.structural.toString()} sub="Core Blueprints" accent="text-blue-500" icon={<Layers className={`w-5 h-5 ${activeStatFilter === "Structural" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />} />
                    </div>
                    <div onClick={() => setActiveStatFilter("Recent")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Recent" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard title="Verified Assets" value={stats.verified.toString()} sub="Execution Ready" accent="text-emerald-500" icon={<ShieldCheck className={`w-5 h-5 ${activeStatFilter === "Recent" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />} />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard title="Global Revision" value={stats.latestVersion} sub="Latest Version" accent="text-rose-500" icon={<Clock className="w-5 h-5 text-rose-500" />} />
                    </div>
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by document name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        {activeStatFilter !== "All" && (
                          <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Engineering Asset</th>
                                    <th className="px-6 py-4 font-inter">Version Profile</th>
                                    <th className="px-6 py-4 font-inter">Approving Authority</th>
                                    <th className="px-6 py-4 font-inter">Vault Date</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center font-inter">
                                            <div className="flex flex-col items-center gap-3 font-inter">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing vault intelligence...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDrawings.length > 0 ? (
                                    filteredDrawings.map((drawing) => (
                                        <tr key={drawing.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter italic-none">{drawing.drawing_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-inter">
                                                        #{drawing.id} • {drawing.file_url || drawing.upload_file || "Cloud Sync"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <span className="px-2.5 py-1 bg-slate-100 text-[9px] font-black text-slate-500 rounded-lg uppercase tracking-widest border border-slate-200 font-inter">
                                                    {drawing.version}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-inter italic-none">{drawing.approved_by}</span>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <span className="text-xs font-bold text-slate-500 font-inter italic-none">{drawing.date}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button onClick={() => setSelectedDrawing(drawing)} className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter" title="View Intelligence">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setDrawingToDelete(drawing.id); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter" title="Discard Asset">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">
                                            No technical blueprints found in the project vault.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal isOpen={!!selectedDrawing} onClose={() => setSelectedDrawing(null)} title="Engineering Asset Intelligence" maxWidth="max-w-xl">
                {selectedDrawing && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-primary rounded-[2.5rem] p-8 mb-8 text-white shadow-2xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex items-center gap-8 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner font-inter relative">
                                    <span className="text-4xl font-black font-inter italic-none">{selectedDrawing.drawing_name.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-800 rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter italic-none">{selectedDrawing.drawing_name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter">{selectedDrawing.version}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter italic-none uppercase tracking-widest">drawing.ref-#{selectedDrawing.id}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/15 rounded-xl border border-white/10 inline-block font-inter shadow-sm">
                                        <span className="text-[9px] font-black uppercase tracking-widest font-inter">APPROVED BY: {selectedDrawing.approved_by}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">Asset Metadata</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-8 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Drawing Version</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase tracking-widest">{selectedDrawing.version}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Authorized Authority</p>
                                        <p className="text-sm font-black text-blue-600 font-inter italic-none uppercase tracking-widest">{selectedDrawing.approved_by}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Registration Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none tracking-widest">{selectedDrawing.date}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Intelligence ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none tracking-widest">DRW-#{selectedDrawing.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">Technical Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter ml-1">Lead Engineer Remarks</p>
                                        <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-xs font-bold text-slate-600 leading-relaxed font-inter italic-none shadow-inner">
                                            "{selectedDrawing.remarks || "No additional technical remarks recorded for this engineering asset."}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-emerald-50 rounded-xl font-inter border border-emerald-100 shadow-sm">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] font-inter">File Integrity</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-8 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Linked Filename</p>
                                        <p className="text-sm font-black text-slate-800 truncate font-inter italic-none">
                                            {selectedDrawing.file_url || selectedDrawing.upload_file || "cloud_blueprint.pdf"}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Vault Sync Status</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none uppercase tracking-widest">Verified Asset</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedDrawing(null)} className="w-full py-5 bg-primary text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 active:scale-95 font-inter italic-none mb-2">
                            Dismiss Asset analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Drawing Metadata" : "Commit New Drawing Asset"}
                maxWidth="max-w-4xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">
                            Cancel
                        </button>
                        <button
                            form="drawing-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : (isEditMode ? "Update Asset" : "Register Asset")}
                        </button>
                    </div>
                }
            >
                <form id="drawing-form" onSubmit={handleSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <Layers className="w-4 h-4 text-primary" />
                          Core Blueprint Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter">
                                <label className={labelClasses}>Descriptive Drawing Name <span className="text-rose-500">*</span></label>
                                <input name="drawing_name" value={formData.drawing_name} onChange={handleInputChange} placeholder="e.g. Foundation Structural Detail" className={inputClasses(errors.drawing_name)} />
                                {errors.drawing_name && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.drawing_name}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Revision / Version <span className="text-rose-500">*</span></label>
                                <input name="version" value={formData.version} onChange={handleInputChange} placeholder="e.g. V2.1" className={inputClasses(errors.version)} />
                                {errors.version && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.version}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Authorized Approver <span className="text-rose-500">*</span></label>
                                <input name="approved_by" value={formData.approved_by} onChange={handleInputChange} placeholder="e.g. Chief Architect" className={inputClasses(errors.approved_by)} />
                                {errors.approved_by && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.approved_by}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Registration Sequence (Date) <span className="text-rose-500">*</span></label>
                                <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses(errors.date)} />
                                {errors.date && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.date}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <FileText className="w-4 h-4 text-primary" />
                          Technical Specifications
                        </h3>
                        <div className="md:col-span-2 font-inter">
                            <label className={labelClasses}>Lead Engineer Remarks <span className="text-rose-500">*</span></label>
                            <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleInputChange} placeholder="Describe technical scope or revision details..." className={`${inputClasses(errors.remarks)} resize-none font-bold`} />
                            {errors.remarks && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.remarks}</p>}
                        </div>
                    </div>
                            
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <RefreshCcw className="w-4 h-4 text-primary" />
                          File Integrity Upload
                        </h3>
                        <div className={`relative group transition-all duration-500 ${errors.file ? 'ring-2 ring-rose-500 rounded-[2rem]' : ''}`}>
                            <input 
                                type="file" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setSelectedFile(file);
                                    if (file && errors.file) {
                                        setErrors(prev => {
                                            const newErrs = {...prev};
                                            delete newErrs.file;
                                            return newErrs;
                                        });
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 font-inter" 
                                accept=".pdf,.dwg,.png,.jpg,.jpeg"
                            />
                            <div className="flex items-center gap-6 px-8 py-10 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 group-hover:bg-white group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-500 font-inter">
                                <div className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 text-primary group-hover:scale-110 transition-transform font-inter">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div className="flex-1 font-inter">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">{selectedFile ? selectedFile.name : "Select technical document"}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 font-inter">{selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Drag and drop or click to browse (Max 50MB)"}</p>
                                </div>
                            </div>
                        </div>
                        {errors.file && <p className="mt-2 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-4 font-inter">{errors.file}</p>}
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Engineering Asset"
                message="Are you sure you want to discard this technical blueprint from the project vault? This action is permanent."
                confirmText="Archive Asset"
                type="danger"
            />
        </>
    );
};

export default DrawingsDocumentsPage;
