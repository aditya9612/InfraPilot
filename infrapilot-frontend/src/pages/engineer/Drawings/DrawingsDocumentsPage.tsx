import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  FileText, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Upload,
  Briefcase,
  Phone,
  Mail
} from "lucide-react";

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

const DrawingsDocumentsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState<DrawingRecord | null>(null);
    const [drawingData, setDrawingData] = useState<DrawingRecord[]>(drawingHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [drawingToDelete, setDrawingToDelete] = useState<string | null>(null);

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
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.drawing_name.trim()) newErrors.drawing_name = "Required";
        if (!formData.version.trim()) newErrors.version = "Required";
        if (!formData.approved_by.trim()) newErrors.approved_by = "Required";
        if (!formData.upload_file) newErrors.upload_file = "Required";
        if (!formData.date) newErrors.date = "Required";
        if (!formData.remarks.trim()) newErrors.remarks = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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

    const handleDeleteConfirm = () => {
        if (!drawingToDelete) return;
        setDrawingData(prev => prev.filter(d => d.id !== drawingToDelete));
        toast.success("Engineering Asset Deleted!");
        setIsDeleteModalOpen(false);
        setDrawingToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

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

    const filteredDrawings = useMemo(() => {
        return drawingData.filter(d => 
            d.drawing_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            d.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [drawingData, searchTerm]);

    const stats = {
        total: drawingData.length,
        structural: drawingData.filter(d => d.drawing_name.toLowerCase().includes("structural")).length,
        verified: drawingData.length,
        latestVersion: "V2.1"
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="Drawings & Documents" breadcrumb={["Engineer", "Document Vault", "Blueprints"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Document Vault</h1>
                        <p className="text-slate-500 text-sm">Centralized repository for structural blueprints and technical revisions.</p>
                    </div>
                    <button
                        onClick={() => { setIsEditMode(false); setFormData(initialFormData); setErrors({}); setIsFormModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Document
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Vault"
                        value={stats.total.toString()}
                        sub="Engineering Assets"
                        accent="text-slate-800"
                        icon={<FileText className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Structural"
                        value={stats.structural.toString()}
                        sub="Core Blueprints"
                        accent="text-blue-500"
                        icon={<Layers className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Verified Assets"
                        value={stats.verified.toString()}
                        sub="Execution Ready"
                        accent="text-emerald-500"
                        icon={<ShieldCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Global Revision"
                        value={stats.latestVersion}
                        sub="Latest Version"
                        accent="text-rose-500"
                        icon={<Clock className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
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
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Drawing Name</th>
                                    <th className="px-6 py-4">Version</th>
                                    <th className="px-6 py-4">Approved By</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDrawings.length > 0 ? (
                                    filteredDrawings.map((drawing) => (
                                        <tr key={drawing.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{drawing.drawing_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{drawing.id} • {drawing.upload_file}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md uppercase tracking-widest border border-slate-100">
                                                    {drawing.version}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-blue-600">{drawing.approved_by}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {drawing.date}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedDrawing(drawing)}
                                                        className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenEdit(drawing)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDrawingToDelete(drawing.id); setIsDeleteModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                            No drawing records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedDrawing}
                onClose={() => setSelectedDrawing(null)}
                title="Engineering Asset Intelligence"
                maxWidth="max-w-xl"
            >
                {selectedDrawing && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedDrawing.drawing_name.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">{selectedDrawing.drawing_name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{selectedDrawing.version}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">drawing.ref-{selectedDrawing.id.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">APPROVED BY: {selectedDrawing.approved_by}</span>
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Asset Metadata</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Drawing Version</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDrawing.version}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Approved Authority</p>
                                        <p className="text-sm font-black text-blue-600 font-inter italic-none">{selectedDrawing.approved_by}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Registration Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDrawing.date}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Asset ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedDrawing.id}</p>
                                    </div>
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
                                            "{selectedDrawing.remarks || "No additional technical remarks recorded for this engineering asset."}"
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">File Integrity</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Linked Filename</p>
                                        <p className="text-sm font-black text-slate-800 truncate font-inter italic-none">{selectedDrawing.upload_file}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Sync</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">Verified Blueprint</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedDrawing(null)}
                            className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            Dismiss analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Drawing Metadata" : "Register New Drawing"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="drawing-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {isEditMode ? "Update Asset" : "Register Asset"}
                        </button>
                    </>
                }
            >
                <form id="drawing-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Core Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Drawing Name <span className="text-rose-500">*</span></label>
                                <input name="drawing_name" value={formData.drawing_name} onChange={handleInputChange} placeholder="Identification of blueprint..." className={inputClasses(errors.drawing_name)} />
                                {errors.drawing_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.drawing_name}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Version <span className="text-rose-500">*</span></label>
                                <input name="version" value={formData.version} onChange={handleInputChange} placeholder="e.g. V1.0" className={inputClasses(errors.version)} />
                                {errors.version && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.version}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Upload File <span className="text-rose-500">*</span></label>
                                <div className={`relative ${inputClasses(errors.upload_file)} flex items-center justify-between group`}>
                                    <span className="text-slate-400 truncate pr-4">{formData.upload_file || "Select source file..."}</span>
                                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <Upload className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                {errors.upload_file && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.upload_file}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Registration Detail</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Approved By <span className="text-rose-500">*</span></label>
                                <input name="approved_by" value={formData.approved_by} onChange={handleInputChange} placeholder="Name of authority" className={inputClasses(errors.approved_by)} />
                                {errors.approved_by && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.approved_by}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Date <span className="text-rose-500">*</span></label>
                                <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses(errors.date)} />
                                {errors.date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.date}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Remarks <span className="text-rose-500">*</span></label>
                                <textarea name="remarks" rows={4} value={formData.remarks} onChange={handleInputChange} placeholder="Enter any technical remarks..." className={`${inputClasses(errors.remarks)} resize-none`} />
                                {errors.remarks && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.remarks}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Engineering Asset"
                message="Are you sure you want to delete this drawing record? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default DrawingsDocumentsPage;
