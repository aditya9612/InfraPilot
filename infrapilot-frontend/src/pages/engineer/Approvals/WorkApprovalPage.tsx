import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkApprovalRecord {
    id: string;
    requestType: string;
    description: string;
    quantity: string;
    requestedBy: string;
    approvedBy: string;
    status: "Pending" | "Approved" | "Hold";
    date: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const workApprovals: WorkApprovalRecord[] = [
    {
        id: "WAP-201",
        requestType: "Concrete Pouring - Beam B12",
        description: "Requesting approval for M30 grade concrete pouring after reinforcement check.",
        quantity: "12 Cum",
        requestedBy: "Eng. Amit Sharma",
        approvedBy: "Sr. Eng. Sahil Kapur",
        status: "Approved",
        date: "2026-04-10",
    },
    {
        id: "WAP-202",
        requestType: "Plastering - Wing A",
        description: "Approval for internal plastering start on 2nd floor.",
        quantity: "450 Sqft",
        requestedBy: "Eng. Sunil Dutt",
        approvedBy: "Pending",
        status: "Pending",
        date: "2026-04-12",
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    Approved: "border border-emerald-200 text-emerald-500 bg-emerald-50/50",
    Pending: "border border-amber-200 text-amber-500 bg-amber-50/50",
    Hold: "border border-rose-200 text-rose-500 bg-rose-50/50",
};

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

const WorkApprovalPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<WorkApprovalRecord | null>(null);
    const [approvalData, setApprovalData] = useState<WorkApprovalRecord[]>(workApprovals);

    const [formData, setFormData] = useState({
        requestType: "",
        description: "",
        quantity: "",
        requestedBy: "Eng. Site User",
        status: "Pending" as any,
        date: new Date().toISOString().split("T")[0],
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

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.requestType) newErrors.requestType = "Approval type is required";
        if (!formData.quantity) newErrors.quantity = "Scope/Quantity is required";
        if (!formData.description) newErrors.description = "Work description is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required work approval details.");
            return;
        }

        const newEntry: WorkApprovalRecord = {
            id: `WAP-${200 + approvalData.length + 1}`,
            ...formData,
            approvedBy: "Verification Pending",
        };

        setApprovalData((prev) => [newEntry, ...prev]);
        toast.success("Work Approval Request Submitted!");
        setIsFormModalOpen(false);
        setFormData({
            requestType: "",
            description: "",
            quantity: "",
            requestedBy: "Eng. Site User",
            status: "Pending",
            date: new Date().toISOString().split("T")[0],
        });
    };

    return (
        <>
            <Navbar
                title="Work Approvals"
                breadcrumb={["InfraPilot", "Engineer", "Approvals", "Work"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Execution Governance
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Site Execution Approvals
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Formal requests for activity commencement, material pouring, and phase sign-offs.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Submit Work Approval
                    </button>
                </div>

                {/* Approval Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {approvalData.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedApproval(item)}
                        >
                            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${item.status === "Approved" ? "bg-emerald-500" : item.status === "Pending" ? "bg-amber-500" : "bg-rose-500"}`} />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all uppercase">
                                            {item.requestType.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.requestType}</h3>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${item.status === "Approved" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                ID: {item.id} | Logged: {item.date}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[item.status]}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="SCOPE / QUANTITY" value={item.quantity} accent="text-emerald-600" />
                                    <ProfileField label="REQUESTED BY" value={item.requestedBy} />
                                    <ProfileField label="APPROVING AUTHORITY" value={item.approvedBy} />
                                    <ProfileField label="ENTITY ID" value={item.id} mono />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Work Governance Trace • Secure
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        Inspect Approval Details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Inspect Detail Modal */}
            <Modal
                isOpen={!!selectedApproval}
                onClose={() => setSelectedApproval(null)}
                title="Execution Approval Audit"
                maxWidth="max-w-[1000px]"
            >
                {selectedApproval && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-emerald-600 to-emerald-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2.25rem] border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">{selectedApproval.requestType.substring(0, 1)}A</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">{selectedApproval.requestType}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm`}>
                                            {selectedApproval.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">Work Scope: {selectedApproval.quantity}</p>
                                    <p className="text-sm font-semibold text-white/80 mt-1 italic">Diagnostic ID: <span className="text-white font-mono">{selectedApproval.id}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">W</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Work Parameters</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="APPROVAL SUBJECT" value={selectedApproval.requestType} />
                                        <ProfileField label="ESTIMATED SCOPE" value={selectedApproval.quantity} accent="text-emerald-600" />
                                        <ProfileField label="REQUESTED BY" value={selectedApproval.requestedBy} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">A</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Audit & Authority</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="APPROVING AUTHORITY" value={selectedApproval.approvedBy} />
                                        <ProfileField label="PROCESS DATE" value={selectedApproval.date} />
                                        <ProfileField label="APPROVAL STATUS" value={selectedApproval.status} accent={selectedApproval.status === "Approved" ? "text-emerald-600" : "text-amber-600"} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-xs">N</div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Technical Narrative</h4>
                                </div>
                                <ProfileField label="WORK BREAKDOWN / JUSTIFICATION" value={selectedApproval.description} />
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-8 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedApproval(null)}
                                className="px-12 py-4 bg-black text-white text-[13px] font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase"
                            >Close Audit</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Work Approval Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="Site Execution Work Approval"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="approval-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Section 1: Work Identity */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Work Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Approval Type / Subject *</label>
                                    <input
                                        name="requestType"
                                        value={formData.requestType}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Concrete Pouring Slab L3"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.requestType ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.requestType && <p className="text-[10px] text-rose-500 font-bold">{errors.requestType}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Quantity / Scope *</label>
                                    <input
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 50 Cum / 1200 Sqft"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.quantity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.quantity && <p className="text-[10px] text-rose-500 font-bold">{errors.quantity}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Traceability */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Audit Traceability</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Requested By</label>
                                    <input
                                        name="requestedBy"
                                        value={formData.requestedBy}
                                        readOnly
                                        className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 focus:outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Approval Request Date</label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Description */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Technical Justification</h3>
                            </div>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe the work phase and technical compliance observed…"
                                className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none transition-all ${errors.description ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                            />
                            {errors.description && <p className="text-[10px] text-rose-500 font-bold">{errors.description}</p>}
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all font-inter"
                    >Discard Request</button>
                    <button
                        type="submit"
                        form="approval-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >Submit for Approval</button>
                </div>
            </Modal>
        </>
    );
};

export default WorkApprovalPage;
