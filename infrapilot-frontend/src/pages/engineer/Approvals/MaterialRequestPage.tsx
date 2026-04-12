import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const MaterialRequestPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [requests, setRequests] = useState([
        { id: 1, type: "Construction Material", description: "Grade 43 OPC Cement for Block A foundation", quantity: "500 Bags", requestedBy: "Karan Singh", approvedBy: "Project Manager", status: "Approved", date: "2024-03-15", remarks: "Urgent procurement for next phase." },
        { id: 2, type: "Electrical Supplies", description: "16mm TMT Reinforcement Bars", quantity: "12 Tons", requestedBy: "Karan Singh", approvedBy: "Procurement Head", status: "Pending", date: "2024-03-20", remarks: "Standard replenishment." },
        { id: 3, type: "Plumbing Fixtures", description: "PVC Conduit Pipes - 25mm", quantity: "800 Meters", requestedBy: "Karan Singh", approvedBy: "MEP Lead", status: "Rejected", date: "2024-04-01", remarks: "Budget constraints." },
    ]);

    const [formData, setFormData] = useState({
        type: "Construction Material",
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

        const newRequest = {
            id: Date.now(),
            ...formData,
            date: new Date().toISOString().split("T")[0]
        };

        toast.loading("Broadcasting requisition protocol...");
        setTimeout(() => {
            setRequests([newRequest, ...requests]);
            toast.dismiss();
            toast.success("Requisition Logged!");
            setIsFormModalOpen(false);
            setFormData({
                type: "Construction Material",
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
                title="Logistics Vault"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Approvals"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Supply Chain Intel</h1>
                        <p className="text-slate-500 text-sm font-medium">Inventory replenishment and logistical material tracking across all active project zones.</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + FILE REQUISITION
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Logistical Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Active Filings"
                            value="42"
                            sub="+4 Today"
                            accent="text-primary"
                        />
                        <StatCard
                            title="Pending PM"
                            value="08"
                            sub="In Review"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Authorized"
                            value="28"
                            sub="Procured"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Disputed"
                            value="03"
                            sub="Clarify"
                            accent="text-rose-600"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 mb-24">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                            onClick={() => setSelectedRequest(request)}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity ${request.status === 'Approved' ? 'bg-emerald-600' : request.status === 'Rejected' ? 'bg-rose-600' : 'bg-amber-500'}`} />

                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                📦
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">REQ-{request.id}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest ${request.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : request.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                                        {request.status}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{request.date}</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Requisition Specification</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{request.description}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Logistical Category</span>
                                        <p className="text-[11px] font-black text-blue-600 uppercase">{request.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Volume / Volume</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{request.quantity}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Initiating Actor</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{request.requestedBy}</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Authorization Artifact</span>
                                    <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"Auth: {request.approvedBy} | {request.remarks}"</p>
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
                    title="Requisition Initialization"
                    maxWidth="max-w-4xl"
                >
                    <div className="admin-pulse-modal-body p-12 bg-white">
                        <form id="requisition-form" onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Request Category</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="admin-pulse-form-input font-black appearance-none cursor-pointer">
                                        <option>Construction Material</option>
                                        <option>Electrical Supplies</option>
                                        <option>Plumbing Fixtures</option>
                                        <option>Mechanical Tooling</option>
                                        <option>Safety Infrastructure</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Quantity / Volume</label>
                                    <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="e.g. 500 Bags / 12 Tons" className="admin-pulse-form-input font-black" />
                                    {errors.quantity && <p className="text-[10px] font-bold text-red-500 px-1">{errors.quantity}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Scope Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="DETAILED REQUISITION SPECIFICATIONS..." className="admin-pulse-form-input font-black  resize-none" />
                                    {errors.description && <p className="text-[10px] font-bold text-red-500 px-1">{errors.description}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Verifying Authority</label>
                                    <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} placeholder="e.g. Project Manager" className="admin-pulse-form-input font-black" />
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
                            form="requisition-form"
                            className="px-14 py-5 bg-primary text-white text-[11px] font-black  tracking-[0.3em] rounded-[24px] shadow-2xl shadow-primary/30 hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            Register Protocol
                        </button>
                    </div>
                </Modal>

                {selectedRequest && (
                    <Modal
                        isOpen={!!selectedRequest}
                        onClose={() => setSelectedRequest(null)}
                        title="Material Requisition Intelligence"
                        maxWidth="max-w-4xl"
                    >
                        <div className="p-10 bg-white">
                            {/* Premium Banner */}
                            <div className="admin-pulse-details-banner">
                                <div className="admin-pulse-details-icon-container bg-blue-600">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedRequest.type}</h2>
                                        <span className={`admin-pulse-status-badge ${selectedRequest.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                            selectedRequest.status === 'Rejected' ? 'bg-rose-500/20 text-rose-100 border-rose-500/30' :
                                                'bg-amber-500/20 text-amber-100 border-amber-500/30 animate-pulse'
                                            } backdrop-blur-md border`}>
                                            {selectedRequest.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Supply Chain Requisition</h3>
                                        <span className="px-3 py-1 bg-slate-800 text-blue-400 rounded-lg text-[9px] font-black tracking-[0.2em] border border-slate-700">
                                            {selectedRequest.quantity.toUpperCase()} VOLUME
                                        </span>
                                    </div>
                                    <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Requisition Hash: REQ-{selectedRequest.id}-LOGISTICS</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                {/* Left Column: Intelligence Matrix */}
                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Requisition Intelligence</h3>
                                        </div>
                                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-8 font-black uppercase">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Volume Analytics</span>
                                                <p className="text-5xl font-black text-slate-800 tracking-tighter italic">{selectedRequest.quantity}</p>
                                            </div>
                                            <div className="admin-pulse-details-group border-t border-slate-200 pt-6 mt-6">
                                                <span className="admin-pulse-details-label uppercase mb-2 block">Protocol Identification</span>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xl font-black text-blue-600 tracking-tighter italic">{selectedRequest.type.toUpperCase()}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 italic">Verified Log</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Operational Specification</h3>
                                        </div>
                                        <div className="p-8 bg-blue-50/30 rounded-[32px] border border-blue-100 font-black uppercase">
                                            <span className="admin-pulse-details-label mb-4 block underline underline-offset-4 decoration-blue-200 uppercase font-black">Intellectual Description</span>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic uppercase font-black">"{selectedRequest.description}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Logistical Narrative */}
                                <div className="space-y-10 font-black uppercase">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Logistical Narrative</h3>
                                        </div>
                                        <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 min-h-[300px] font-black uppercase shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
                                            <div className="space-y-8 relative z-10">
                                                <div>
                                                    <span className="admin-pulse-details-label mb-2 block text-slate-400">Initiating Actor</span>
                                                    <p className="text-2xl font-black text-white tracking-tighter italic">{selectedRequest.requestedBy}</p>
                                                </div>
                                                <div className="pt-8 border-t border-slate-800">
                                                    <span className="admin-pulse-details-label mb-2 block text-slate-400">Verifying Authority</span>
                                                    <p className="text-2xl font-black text-blue-400 tracking-tighter italic">{selectedRequest.approvedBy}</p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${selectedRequest.status === 'Approved' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500 animate-pulse'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">FILING DATE: {selectedRequest.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between font-black uppercase">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-black">Authorization Integrity</span>
                                            <p className="text-2xl font-black text-slate-800 tracking-tighter italic font-black">{selectedRequest.status.toUpperCase()}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedRequest.status === 'Approved' ? 'bg-emerald-600 shadow-emerald-500/20' :
                                            selectedRequest.status === 'Rejected' ? 'bg-rose-600 shadow-rose-500/20' :
                                                'bg-amber-600 shadow-amber-500/20'
                                            }`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">REQUISITION PROTOCOL ARCHIVED IN LOGISTICS VAULT</span>
                                <button onClick={() => setSelectedRequest(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                    Archive Dossier
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </PageTransition>
        </>
    );
};

export default MaterialRequestPage;
