import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DrawingRecord {
    id: string;
    drawingName: string;
    version: string;
    fileName: string;
    approvedBy: string;
    date: string;
    remarks: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const drawingHistory: DrawingRecord[] = [
    {
        id: "DRW-701",
        drawingName: "Main Gate structural Detail",
        version: "V2.1",
        fileName: "GATE_STR_V2.pdf",
        approvedBy: "Ar. Rajesh Kumar",
        date: "2026-04-10",
        remarks: "Approved with minor changes in foundation width.",
    },
    {
        id: "DRW-702",
        drawingName: "Electrical Layout - Floor 1",
        version: "V1.0",
        fileName: "ELEC_L1_FINAL.dwg",
        approvedBy: "Eng. Sunil Dutt",
        date: "2026-04-12",
        remarks: "Final layout for conduit installation.",
    },
];

// ─── Profile Field Helper ──────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
    mono = false,
}: {
    label: string;
    value: string;
    accent?: string;
    mono?: boolean;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${mono ? "font-mono tracking-tight" : ""} ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const DrawingsDocumentsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState<DrawingRecord | null>(null);
    const [drawingData, setDrawingData] = useState<DrawingRecord[]>(drawingHistory);

    const [formData, setFormData] = useState({
        drawingName: "",
        version: "",
        approvedBy: "",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
        fileName: "",
    });

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
            setFormData(prev => ({ ...prev, fileName: e.target.files![0].name }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.drawingName) newErrors.drawingName = "Drawing name is required";
        if (!formData.version) newErrors.version = "Version is required";
        if (!formData.approvedBy) newErrors.approvedBy = "Approval authority is required";
        if (!formData.fileName) newErrors.fileName = "Please upload a file";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required document metadata.");
            return;
        }

        const newEntry: DrawingRecord = {
            id: `DRW-${700 + drawingData.length + 1}`,
            ...formData,
        };

        setDrawingData((prev) => [newEntry, ...prev]);
        toast.success("Drawing Registered Successfully!");
        setIsFormModalOpen(false);
        setFormData({
            drawingName: "",
            version: "",
            approvedBy: "",
            date: new Date().toISOString().split("T")[0],
            remarks: "",
            fileName: "",
        });
    };

    return (
        <>
            <Navbar
                title="Drawings & Documents"
                breadcrumb={["InfraPilot", "Engineer", "Drawings"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Engineering Library
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Technical Drawing Repository
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Centralized dashboard for blueprint management and engineering compliance.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Register Drawing
                    </button>
                </div>

                {/* Registry View */}
                <div className="grid grid-cols-1 gap-5">
                    {drawingData.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedDrawing(item)}
                        >
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all uppercase">
                                            {item.fileName.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.drawingName}</h3>
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
                                                    V {item.version}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                ID: {item.id} | Released: {item.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-800 tracking-tight">{item.fileName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Source</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="APPROVED BY" value={item.approvedBy} accent="text-blue-600" />
                                    <ProfileField label="VERSION" value={item.version} mono />
                                    <ProfileField label="DATE" value={item.date} />
                                    <ProfileField label="ENTITY ID" value={item.id} mono />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Engineering Assets Registry • Encrypted
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Document Audit →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Contractor Profile Style - PIXEL PERFECT) ────────────────── */}
            <Modal
                isOpen={!!selectedDrawing}
                onClose={() => setSelectedDrawing(null)}
                title="Document Profile Audit"
                maxWidth="max-w-[1000px]"
            >
                {selectedDrawing && (
                    <div className="bg-white p-0 italic-none pb-8">
                        {/* ── Header Banner ── */}
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2.25rem] border border-white/30 shadow-inner relative">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedDrawing.drawingName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">
                                            {selectedDrawing.drawingName}
                                        </h3>
                                        <span className="px-3 py-1 rounded-[0.75rem] text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-md">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-emerald-400 text-sm">★</span>
                                        <p className="text-sm font-bold text-white tracking-wide">Verified Technical Document</p>
                                    </div>
                                    <p className="text-sm font-semibold text-blue-100/80">
                                        Primary Contact: <span className="text-white">{selectedDrawing.approvedBy}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Content Sections ── */}
                        <div className="px-12 space-y-12">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">D</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Document Identity</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="DRAWING NAME" value={selectedDrawing.drawingName} />
                                        <ProfileField label="VERSION CONTROL" value={selectedDrawing.version} mono />
                                        <ProfileField label="ENTITY ID" value={selectedDrawing.id} mono />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">A</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Approval & Trace</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="APPROVED BY" value={selectedDrawing.approvedBy} />
                                        <ProfileField label="REGISTRATION DATE" value={selectedDrawing.date} />
                                        <ProfileField label="SOURCE FILE" value={selectedDrawing.fileName} accent="text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">N</div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Engineer Notes</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-10">
                                <ProfileField label="REMARKS / AUDIT NOTES" value={selectedDrawing.remarks} />
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="px-12 py-8 mt-12 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedDrawing(null)}
                                className="px-12 py-4 bg-[#0b1222] hover:bg-black text-white text-[13px] font-black rounded-2xl shadow-xl transition-all active:scale-95 tracking-wide uppercase"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (DSR Style Sectioned Form) ────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="Register Engineering Document"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="drawing-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Section 1 */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Document Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Drawing Name *</label>
                                    <input
                                        name="drawingName"
                                        value={formData.drawingName}
                                        onChange={handleInputChange}
                                        placeholder="Identification ofblueprint..."
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.drawingName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.drawingName && <p className="text-[10px] text-rose-500 font-bold">{errors.drawingName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Version Control *</label>
                                    <input
                                        name="version"
                                        value={formData.version}
                                        onChange={handleInputChange}
                                        placeholder="e.g. V1.0"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.version ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.version && <p className="text-[10px] text-rose-500 font-bold">{errors.version}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Approval & Source</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Approved By *</label>
                                    <input
                                        name="approvedBy"
                                        value={formData.approvedBy}
                                        onChange={handleInputChange}
                                        placeholder="Name of authority"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.approvedBy ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.approvedBy && <p className="text-[10px] text-rose-500 font-bold">{errors.approvedBy}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Registration Date *</label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Upload File *</label>
                                    <div className={`relative w-full px-5 py-3 bg-slate-50 border rounded-xl flex items-center justify-between group cursor-pointer transition-all ${errors.fileName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}>
                                        <span className="text-sm font-bold text-slate-400 truncate pr-4">
                                            {formData.fileName || "Select source file..."}
                                        </span>
                                        <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg group-hover:bg-black transition-all">UPLOAD</div>
                                    </div>
                                    {errors.fileName && <p className="text-[10px] text-rose-500 font-bold">{errors.fileName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Engineer Notes</h3>
                            </div>
                            <textarea
                                name="remarks"
                                rows={4}
                                value={formData.remarks}
                                onChange={handleInputChange}
                                placeholder="Enter any technical remarks or audit notes here…"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={() => setIsFormModalOpen(false)} className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all font-inter">Discard</button>
                    <button type="submit" form="drawing-form" className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">Register Document</button>
                </div>
            </Modal>
        </>
    );
};

export default DrawingsDocumentsPage;
