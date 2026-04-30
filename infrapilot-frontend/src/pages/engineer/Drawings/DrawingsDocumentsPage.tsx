import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DrawingRecord {
    id: string;
    drawing_name: string;
    version: string;
    upload_file: string;
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
    drawing_name: "",
    version: "",
    upload_file: "",
    approved_by: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
};

// ─── Profile Field Helper ──────────────────────────────────────────────────────

// ─── Main Component ─────────────────────────────────────────────────────────────

const DrawingsDocumentsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState<DrawingRecord | null>(null);
    const [drawingData, setDrawingData] = useState<DrawingRecord[]>(drawingHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [drawingToDelete, setDrawingToDelete] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"All" | "Recent">("All");

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, upload_file: e.target.files![0].name }));
            if (errors.upload_file) {
                setErrors((prev) => {
                    const newErrs = { ...prev };
                    delete newErrs.upload_file;
                    return newErrs;
                });
            }
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.drawing_name) newErrors.drawing_name = "Required";
        if (!formData.version) newErrors.version = "Required";
        if (!formData.approved_by) newErrors.approved_by = "Required";
        if (!formData.upload_file) newErrors.upload_file = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData(initialFormData);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: DrawingRecord) => {
        setIsEditMode(true);
        setEditId(record.id);
        setFormData({
            drawing_name: record.drawing_name,
            version: record.version,
            upload_file: record.upload_file,
            approved_by: record.approved_by,
            date: record.date,
            remarks: record.remarks,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDrawingToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!drawingToDelete) return;
        setDrawingData(prev => prev.filter(t => t.id !== drawingToDelete));
        toast.success("Drawing record deleted");
        setIsDeleteModalOpen(false);
        setDrawingToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required diagnostic details.");
            return;
        }

        const entryData: DrawingRecord = {
            id: isEditMode ? editId! : `DRW-${700 + drawingData.length + 1}`,
            ...formData,
        };

        if (isEditMode) {
            setDrawingData(prev => prev.map(t => t.id === editId ? entryData : t));
            toast.success("Document Metadata Updated!");
        } else {
            setDrawingData(prev => [entryData, ...prev]);
            toast.success("New Engineering Asset Registered!");
        }
        setIsFormModalOpen(false);
    };

    return (
        <>
            <Navbar
                title="Drawings & Documents"
                breadcrumb={["InfraPilot", "Engineer", "Drawings"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Document Control & Engineering
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Document Vault
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Centralized repository for structural blueprints, architectural revisions, and technical drawings.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            Register New Drawing
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Vault Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Vault</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{drawingData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Engineering Assets</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Structural</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">
                                {drawingData.filter(d => d.drawing_name.toLowerCase().includes("structural")).length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Core Blueprints</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative overflow-hidden group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Verified Assets</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">{drawingData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Execution Ready</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Global Revision</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter italic-none">V2.1</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Latest Control Version</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by drawing name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab("All")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "All" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                All Documents
                            </button>
                            <button
                                onClick={() => setActiveTab("Recent")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "Recent" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                Recent
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Drawing Grid ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                    {drawingData
                        .filter(d => {
                            const matchesSearch = d.drawing_name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase());
                            if (activeTab === "Recent") {
                                const docDate = new Date(d.date);
                                const today = new Date();
                                const diffTime = Math.abs(today.getTime() - docDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return matchesSearch && diffDays <= 7;
                            }
                            return matchesSearch;
                        })
                        .map((drawing) => (
                            <div
                                key={drawing.id}
                                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer p-6"
                                onClick={() => setSelectedDrawing(drawing)}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-black text-slate-400 rounded-md uppercase tracking-widest border border-slate-100">
                                        {drawing.version}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">DRW-{drawing.id}</span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors h-10 line-clamp-2">
                                        {drawing.drawing_name}
                                    </h3>
                                </div>

                                <div className="space-y-3 py-4 border-y border-slate-50 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approved By</span>
                                        <span className="text-[10px] font-bold text-slate-700">{drawing.approved_by}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                                        <span className="text-[10px] font-bold text-slate-700 tabular-nums">{drawing.date}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">View Detail</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(drawing); }}
                                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(drawing.id); }}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {drawingData.filter(d => {
                        const matchesSearch = d.drawing_name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase());
                        if (activeTab === "Recent") {
                            const docDate = new Date(d.date);
                            const today = new Date();
                            const diffTime = Math.abs(today.getTime() - docDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return matchesSearch && diffDays <= 7;
                        }
                        return matchesSearch;
                    }).length === 0 && (
                            <div className="col-span-full bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No documents found</p>
                                <p className="text-slate-300 text-xs mt-1">Try adjusting your search query.</p>
                            </div>
                        )}
                </div>

            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedDrawing}
                onClose={() => setSelectedDrawing(null)}
                title="Drawing Insight"
                maxWidth="max-w-2xl"
            >
                {selectedDrawing && (
                    <div className="bg-white p-6 italic-none font-inter text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Engineering Blueprint</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedDrawing.drawing_name}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 11h8c0 4.42-3.58 8-8 8v-8z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Version</p>
                                        <p className="text-xl font-black">{selectedDrawing.version}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Approval Date</p>
                                        <p className="text-xl font-black tabular-nums">{selectedDrawing.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Document Data */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Document Specifications</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asset ID</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums">{selectedDrawing.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Filename</p>
                                        <p className="text-sm font-black text-slate-800 truncate" title={selectedDrawing.upload_file}>
                                            {selectedDrawing.upload_file}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Approved By</p>
                                        <p className="text-sm font-black text-blue-600">{selectedDrawing.approved_by}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Source Type</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tabular-nums">Engineering PDF</p>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Technical Remarks</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-sm text-slate-600 leading-relaxed italic-none">
                                    {selectedDrawing.remarks || "No additional technical remarks recorded for this version."}
                                </div>
                            </div>

                            {/* Verified Asset Footer */}
                            <div>
                                <div className="flex items-center gap-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 mb-0.5 uppercase tracking-wide">Verified Technical Asset</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Authorized for Execution</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedDrawing(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
                            >
                                Close Audit
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedDrawing);
                                    setSelectedDrawing(null);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Modify Asset
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify Drawing Metadata" : "Register New Drawing"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-2 italic-none font-inter">
                    <form id="drawing-form" onSubmit={handleSubmit} className="p-6 md:p-10 space-y-12">
                        {/* Section 1: Core Details */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-8 w-1.5 bg-slate-900 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.3)]" />
                                <h3 className="text-xs font-black text-slate-800 tracking-[0.3em] uppercase italic-none">Core Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic-none">Drawing Name *</label>
                                    <input name="drawing_name" value={formData.drawing_name} onChange={handleInputChange} placeholder="Identification of blueprint..." className={`w-full px-6 py-4.5 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-slate-900/5 ${errors.drawing_name ? "border-rose-400" : "border-slate-100 group-hover:border-slate-200"}`} />
                                    {errors.drawing_name && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase italic-none mt-1 ml-1">{errors.drawing_name}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic-none">Version *</label>
                                    <input name="version" value={formData.version} onChange={handleInputChange} placeholder="e.g. V1.0" className={`w-full px-6 py-4.5 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-slate-900/5 ${errors.version ? "border-rose-400" : "border-slate-100 group-hover:border-slate-200"}`} />
                                    {errors.version && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.version}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic-none">Upload File *</label>
                                    <div className={`relative w-full px-6 py-4 bg-slate-50 border rounded-2xl flex items-center justify-between group cursor-pointer transition-all ${errors.upload_file ? "border-rose-400 bg-rose-50/10" : "border-slate-100 focus-within:border-blue-500"}`}>
                                        <span className="text-sm font-bold text-slate-400 truncate pr-4">
                                            {formData.upload_file || "Select source file..."}
                                        </span>
                                        <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="bg-primary text-white text-[9px] font-black px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">UPLOAD</div>
                                    </div>
                                    {errors.upload_file && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.upload_file}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Registration Detail */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-8 w-1.5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                                <h3 className="text-xs font-black text-slate-800 tracking-[0.3em] uppercase italic-none">Registration Detail</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic-none">Approved By *</label>
                                    <input name="approved_by" value={formData.approved_by} onChange={handleInputChange} placeholder="Name of authority" className={`w-full px-6 py-4.5 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-blue-600/5 ${errors.approved_by ? "border-rose-400" : "border-slate-100 group-hover:border-slate-200"}`} />
                                    {errors.approved_by && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.approved_by}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic-none">Date</label>
                                    <input name="date" type="date" value={formData.date} onChange={handleInputChange} className="w-full px-6 py-4.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 tabular-nums shadow-sm" />
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic-none">Remarks</label>
                                    <textarea name="remarks" rows={4} value={formData.remarks} onChange={handleInputChange} placeholder="Enter any technical remarks or audit notes here..." className="w-full px-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-sm font-medium text-slate-600 leading-relaxed shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-600/5" />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between font-inter">
                    <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-800 tracking-widest uppercase transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="drawing-form"
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {isEditMode ? "Commit Changes" : "Register Asset"}
                    </button>
                </div>
            </Modal >
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDrawingToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Engineering Asset"
                message="Are you sure you want to delete this drawing record? This will permanently remove the document metadata and historical versioning from the vault."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default DrawingsDocumentsPage;

