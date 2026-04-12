import React, { useState, useRef } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const DrawingsPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
    const [drawings, setDrawings] = useState([
        { id: 1, name: "Foundation Layout - Block A", version: "v2.1", approvedBy: "Rajesh V.", date: "2024-03-15", remarks: "Revised footing dimensions for seismic compliance.", hasFile: true },
        { id: 2, name: "Column Reinforcement Schedule", version: "v1.4", approvedBy: "Anita S.", date: "2024-03-20", remarks: "Updated based on latest soil report.", hasFile: true },
        { id: 3, name: "Ground Floor Electrical Plan", version: "v1.0", approvedBy: "Manoj K.", date: "2024-04-01", remarks: "Initial submission for block B.", hasFile: true },
    ]);

    const [formData, setFormData] = useState({
        name: "",
        version: "v1.0",
        approvedBy: "",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
        hasFile: false,
        fileName: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const upd = { ...prev };
                delete upd[name];
                return upd;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({ ...prev, hasFile: true, fileName: e.target.files![0].name }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Required";
        if (!formData.approvedBy.trim()) newErrors.approvedBy = "Required";
        if (!formData.hasFile) newErrors.file = "File Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newDrawing = {
            id: Date.now(),
            ...formData,
        };

        toast.loading("Synchronizing Technical Asset...");
        setTimeout(() => {
            setDrawings([newDrawing, ...drawings]);
            toast.dismiss();
            toast.success("Blueprint Released!");
            setIsFormModalOpen(false);
            setFormData({
                name: "",
                version: "v1.0",
                approvedBy: "",
                date: new Date().toISOString().split("T")[0],
                remarks: "",
                hasFile: false,
                fileName: ""
            });
        }, 1200);
    };

    return (
        <>
            <Navbar
                title="Blueprint Vault"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Drawings"]}
                            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Technical Drawing Ledger</h1>
                        <p className="text-slate-500 text-sm font-medium">Secure repository for GFC drawings, revisions, and technical approvals.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + RELEASE DRAWING
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Vault Intelligence
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Drawings"
                            value="142"
                            sub="Vector indexed"
                            accent="text-primary"
                        />
                        <StatCard
                            title="GFC Status"
                            value="94%"
                            sub="Approved"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="In Review"
                            value="08"
                            sub="Processing"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Revisions Due"
                            value="02"
                            sub="Critical updates"
                            accent="text-rose-600"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 mb-24">
                    {drawings.map((drawing) => (
                        <div
                            key={drawing.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                            onClick={() => setSelectedDrawing(drawing)}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600" />

                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {drawing.name[0]}
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">DWG-{drawing.id}</span>
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-widest">
                                        VERSION {drawing.version}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{drawing.date}</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Blueprint Specification</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{drawing.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Release Logic</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">Rev {drawing.version}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Technical Authority</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{drawing.approvedBy}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Vault Pulse</span>
                                        <p className="text-[11px] font-black text-emerald-600 uppercase">SYNCHRONIZED</p>
                                    </div>
                    
                                </div>

                                <div className="pt-2">
                                    <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Asset Narrative</span>
                                    <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"{drawing.remarks}"</p>
                                </div>
                            </div>

                            <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                →
                            </button>
                        </div>
                    ))}
                </div>

                <Modal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    title="Digital Asset Release"
                    maxWidth="max-w-4xl"
                >
                    <div className="admin-pulse-modal-body p-12 bg-white">
                        <form id="drawing-form" onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-6">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                    <h3 className="admin-pulse-form-section-title">Technical Specification</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required">Drawing Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Foundation Layout" className="admin-pulse-form-input font-black" />
                                        {errors.name && <p className="text-[10px] font-bold text-red-500 px-1">{errors.name}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required">Version</label>
                                        <input type="text" name="version" value={formData.version} onChange={handleChange} className="admin-pulse-form-input font-black" />
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required">Approved By</label>
                                        <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} placeholder="Approving Authority" className="admin-pulse-form-input font-black" />
                                        {errors.approvedBy && <p className="text-[10px] font-bold text-red-500 px-1">{errors.approvedBy}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required">Date of Issue</label>
                                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="admin-pulse-form-input font-black" />
                                    </div>
                                    <div className="col-span-2 admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">Technical Remarks</label>
                                        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} placeholder="Revision notes..." className="admin-pulse-form-input font-bold" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-indigo-600" />
                                    <h3 className="admin-pulse-form-section-title">Asset Uplink</h3>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full h-32 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center cursor-pointer transition-all ${formData.hasFile ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    <p className="text-[10px] font-black  tracking-widest text-slate-500">
                                        {formData.hasFile ? `ATTACHED: ${formData.fileName}` : "+ SELECT BLUEPRINT FILE"}
                                    </p>
                                </div>
                                {errors.file && <p className="text-[10px] font-bold text-red-500 text-center ">{errors.file}</p>}
                            </div>
                        </form>
                    </div>

                    <div className="admin-pulse-modal-footer bg-slate-50/50 p-12 border-t border-slate-100 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => setIsFormModalOpen(false)}
                            className="px-8 py-5 text-[11px] font-black text-slate-400  tracking-[0.2em] hover:text-slate-800 transition-all"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            form="drawing-form"
                            className="px-14 py-5 bg-primary text-white text-[11px] font-black  tracking-[0.3em] rounded-[24px] shadow-2xl shadow-primary/30 hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            Release to Vault
                        </button>
                    </div>
                </Modal>

                {selectedDrawing && (
                    <Modal
                        isOpen={!!selectedDrawing}
                        onClose={() => setSelectedDrawing(null)}
                        title="Technical Asset Intelligence"
                        maxWidth="max-w-[1200px]"
                    >
                        <div className="p-10 bg-white">
                            {/* Premium Banner */}
                            <div className="admin-pulse-details-banner bg-blue-900 border-blue-800">
                                <div className="admin-pulse-details-icon-container bg-blue-600">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedDrawing.name}</h2>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-white tracking-tighter leading-none">{selectedDrawing.version}</p>
                                            <span className="text-[10px] font-black text-blue-300 tracking-[0.2em] uppercase">GFC REVISION VERIFIED</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Technical Release Archive</h3>
                                        <span className="px-3 py-1 bg-blue-950 text-blue-400 rounded-lg text-[9px] font-black tracking-[0.2em] border border-blue-800">
                                            {selectedDrawing.date} SYNC
                                        </span>
                                    </div>
                                    <p className="text-blue-200/40 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Asset Hash: DWG-{selectedDrawing.id}-RECON</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-10">
                                {/* Technical Details */}
                                <div className="col-span-4 space-y-10 font-black uppercase">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Technical Intelligence</h3>
                                        </div>
                                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                                            <div className="space-y-6">
                                                <div className="admin-pulse-details-group">
                                                    <span className="admin-pulse-details-label">Revision Logic</span>
                                                    <p className="text-xl font-black text-slate-800 italic">Version {selectedDrawing.version}</p>
                                                </div>
                                                <div className="admin-pulse-details-group">
                                                    <span className="admin-pulse-details-label">Release Sequence</span>
                                                    <p className="text-xl font-black text-slate-800 italic">{selectedDrawing.date}</p>
                                                </div>
                                                <div className="admin-pulse-details-group pt-4 border-t border-slate-200">
                                                    <span className="admin-pulse-details-label block mb-2">Approving Authority</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                                            {selectedDrawing.approvedBy[0]}
                                                        </div>
                                                        <p className="text-lg font-black text-slate-800 tracking-tight italic">{selectedDrawing.approvedBy}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Asset Narrative</h3>
                                        </div>
                                        <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800">
                                            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase italic">
                                                {selectedDrawing.remarks || "No additional technical remarks logged for this architectural asset. The blueprint remains active for site execution dynamics."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Blueprint Preview */}
                                <div className="col-span-8 flex flex-col gap-6">
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">High-Fidelity Blueprint Render</h3>
                                    </div>
                                    <div className="flex-1 bg-slate-50 rounded-[40px] border border-slate-100 p-6 relative group overflow-hidden shadow-inner">
                                        <img
                                            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop"
                                            alt="Blueprint Render"
                                            className="w-full h-full object-cover rounded-[24px] shadow-2xl transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-10 flex flex-col justify-end">
                                            <p className="text-white text-xl font-black uppercase tracking-tight italic">GFC_Blue_Station_01_RECON.IMG</p>
                                            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Asset Sync: Force Level Verification Active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">BLUEPRINT SECURED BY INFRAPILOT TECHNICAL LAYER</span>
                                <div className="flex items-center gap-4">
                                    <button className="px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[20px] text-[10px] font-black tracking-widest hover:bg-slate-50 transition-all">
                                        Download SVG
                                    </button>
                                    <button onClick={() => setSelectedDrawing(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                        Deactivate Dossier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </PageTransition>
        </>
    );
};

export default DrawingsPage;
