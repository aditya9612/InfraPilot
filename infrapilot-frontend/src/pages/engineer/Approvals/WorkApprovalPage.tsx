import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const WorkApprovalPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<any>(null);
    const [approvals, setApprovals] = useState([
        { id: 1, type: "Structural Inspection", description: "Column Reinforcement Inspection for G Floor", quantity: "24 Columns", requestedBy: "Karan Singh", approvedBy: "Structural EngG", status: "Approved", date: "2024-04-04", remarks: "QC standards met." },
        { id: 2, type: "Pour Clearance", description: "Wait for Slump Test on M35 Concrete Pour", quantity: "450 m³", requestedBy: "Karan Singh", approvedBy: "Project Head", status: "Pending", date: "2024-04-08", remarks: "Awaiting lab reports." },
        { id: 3, type: "MEP Verification", description: "Electrical Conduit Laying in Slab - Zone 2", quantity: "1200 RM", requestedBy: "Karan Singh", approvedBy: "MEP Lead", status: "Rejected", date: "2024-04-01", remarks: "Design deviations found." },
    ]);

    const [formData, setFormData] = useState({
        type: "Structural Inspection",
        description: "",
        quantity: "",
        requestedBy: "Karan Singh",
        approvedBy: "",
        status: "Pending",
        remarks: ""
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.quantity.trim()) newErrors.quantity = "Required";
        if (!formData.approvedBy.trim()) newErrors.approvedBy = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newApproval = {
            id: Date.now(),
            ...formData,
            date: new Date().toISOString().split("T")[0]
        };

        toast.loading("Broadcasting clearance protocol...");
        setTimeout(() => {
            setApprovals([newApproval, ...approvals]);
            toast.dismiss();
            toast.success("Clearance Logged!");
            setIsFormModalOpen(false);
            setFormData({
                type: "Structural Inspection",
                description: "",
                quantity: "",
                requestedBy: "Karan Singh",
                approvedBy: "",
                status: "Pending",
                remarks: ""
            });
        }, 1200);
    };

    return (
        <>
            <Navbar
                title="Authorization Vault"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Approvals"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Clearance Protocol</h1>
                        <p className="text-slate-500 text-sm font-medium">Formal work verification and administrative authorizations across project verticals.</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + INITIATE CLEARANCE
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Operational Integrity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Authorized Ops"
                            value="156"
                            sub="+12 Weekly"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Pending Review"
                            value="14"
                            sub="Critical Path"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Disputed"
                            value="08"
                            sub="Requires Info"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Active Zones"
                            value="05"
                            sub="High Intensity"
                            accent="text-indigo-600"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 mb-24">
                    {approvals.map((approval) => (
                        <div
                            key={approval.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                            onClick={() => setSelectedApproval(approval)}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity ${approval.status === 'Approved' ? 'bg-emerald-600' : approval.status === 'Rejected' ? 'bg-rose-600' : 'bg-amber-500'}`} />

                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                ⚡
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">AUTH-{approval.id}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest ${approval.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : approval.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                                        {approval.status}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{approval.date}</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Activity Specification</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{approval.description}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Operational Category</span>
                                        <p className="text-[11px] font-black text-emerald-600 uppercase">{approval.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Metric Tracking</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{approval.quantity}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Verifying Entity</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{approval.approvedBy}</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Authorization Artifact</span>
                                    <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"Auth: {approval.approvedBy} | {approval.remarks}"</p>
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
                    title="Clearance Initiation"
                    maxWidth="max-w-4xl"
                >
                    <div className="admin-pulse-modal-body p-12 bg-white">
                        <form id="clearance-form" onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Activity Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="admin-pulse-form-input font-black appearance-none cursor-pointer">
                                        <option>Structural Inspection</option>
                                        <option>Pour Clearance</option>
                                        <option>MEP Verification</option>
                                        <option>Finishing Sign-off</option>
                                        <option>Safety Audit</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Volume / Metric</label>
                                    <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="e.g. 24 Columns / 450 m³" className="admin-pulse-form-input font-black" />
                                    {errors.quantity && <p className="text-[10px] font-bold text-red-500 px-1">{errors.quantity}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Scope Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="DOCUMENT DETAILED ACTIVITY SCOPE..." className="admin-pulse-form-input font-black  resize-none" />
                                    {errors.description && <p className="text-[10px] font-bold text-red-500 px-1">{errors.description}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Verifying Authority</label>
                                    <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} placeholder="e.g. Structural Engineer" className="admin-pulse-form-input font-black" />
                                    {errors.approvedBy && <p className="text-[10px] font-bold text-red-500 px-1">{errors.approvedBy}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Authorization State</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="admin-pulse-form-input font-black appearance-none cursor-pointer">
                                        <option value="Pending">Awaiting Sign-off</option>
                                        <option value="Approved">Fully Authorized</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="admin-pulse-modal-footer bg-slate-50/50 p-12 border-t border-slate-100 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => setIsFormModalOpen(false)}
                            className="px-8 py-5 text-[11px] font-black text-slate-400  tracking-[0.2em] hover:text-slate-800 transition-all"
                        >
                            Discard Protocol
                        </button>
                        <button
                            type="submit"
                            form="clearance-form"
                            className="px-14 py-5 bg-emerald-600 text-white text-[11px] font-black  tracking-[0.3em] rounded-[24px] shadow-2xl shadow-emerald-500/30 hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            Register Protocol
                        </button>
                    </div>
                </Modal>

                {selectedApproval && (
                    <Modal
                        isOpen={!!selectedApproval}
                        onClose={() => setSelectedApproval(null)}
                        title="Authorization Protocol Intelligence"
                        maxWidth="max-w-4xl"
                    >
                        <div className="p-10 bg-white">
                            {/* Premium Banner */}
                            <div className="admin-pulse-details-banner bg-emerald-900 border-emerald-800">
                                <div className="admin-pulse-details-icon-container bg-emerald-600">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedApproval.type}</h2>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-white tracking-tighter leading-none">{selectedApproval.quantity}</p>
                                            <span className="text-[10px] font-black text-emerald-300 tracking-[0.2em] uppercase">VERIFIED METRIC</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Clearance Protocol Log</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] border ${selectedApproval.status === "Approved" ? "bg-emerald-950 text-emerald-400 border-emerald-800" : selectedApproval.status === "Rejected" ? "bg-rose-950 text-rose-400 border-rose-800" : "bg-amber-950 text-amber-400 border-amber-800"}`}>
                                            {selectedApproval.status.toUpperCase()} ARCHIVE
                                        </span>
                                    </div>
                                    <p className="text-emerald-200/40 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Authorization Hash: AUTH-{selectedApproval.id}-RECON</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-12">
                                {/* Left Column: Intelligence */}
                                <div className="col-span-3 space-y-10 font-black uppercase">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Clearance Intelligence</h3>
                                        </div>
                                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 italic">
                                            <div className="admin-pulse-details-group mb-8">
                                                <span className="admin-pulse-details-label mb-2 block">Structural Specification</span>
                                                <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight">"{selectedApproval.description}"</p>
                                            </div>
                                            <div className="h-px bg-slate-200 mb-8" />
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="admin-pulse-details-group">
                                                    <span className="admin-pulse-details-label">Metric Tracking</span>
                                                    <p className="text-xl font-black text-emerald-600 italic">{selectedApproval.quantity}</p>
                                                </div>
                                                <div className="admin-pulse-details-group">
                                                    <span className="admin-pulse-details-label">Protocol Date</span>
                                                    <p className="text-xl font-black text-slate-800 italic">{selectedApproval.date}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Validation Narrative</h3>
                                        </div>
                                        <div className="p-8 bg-amber-50/30 rounded-[32px] border border-amber-100 italic">
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase">
                                                {selectedApproval.remarks || "No additional remarks logged for this authorization sequence. The protocol stands verified against established blueprint dynamics."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Authorization */}
                                <div className="col-span-2 space-y-10 font-black uppercase">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Authorization Flow</h3>
                                        </div>
                                        <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 min-h-[350px] shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-600/20 transition-all"></div>
                                            <div className="space-y-8 relative z-10">
                                                <div>
                                                    <span className="admin-pulse-details-label mb-2 block text-slate-400">Initiating Entity</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-700 flex items-center justify-center text-sm font-black text-slate-900 shadow-xl">
                                                            {selectedApproval.requestedBy.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <p className="text-2xl font-black text-white tracking-tighter italic">{selectedApproval.requestedBy}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-8 border-t border-slate-800">
                                                    <span className="admin-pulse-details-label mb-2 block text-slate-400">Verifying Authority</span>
                                                    <p className="text-2xl font-black text-emerald-400 tracking-tighter italic">{selectedApproval.approvedBy}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-8">
                                                    <div>
                                                        <span className="admin-pulse-details-label mb-1 block text-slate-500">Validation State</span>
                                                        <p className={`text-xl font-black italic ${selectedApproval.status === "Approved" ? "text-emerald-500" : "text-rose-500"}`}>{selectedApproval.status.toUpperCase()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="admin-pulse-details-label mb-1 block text-slate-500">Sync Hash</span>
                                                        <p className="text-base font-black text-slate-400 italic">#{selectedApproval.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-6 left-8 flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">CLEARANCE ACTIVE: SITE V-01</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">VALIDATION DOSSIER ARCHIVED BY INFRAPILOT SECURE</span>
                                <button onClick={() => setSelectedApproval(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                    Dismiss Archive
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </PageTransition>
        </>
    );
};

export default WorkApprovalPage;
