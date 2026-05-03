import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Briefcase,
  Phone,
  Mail,
  FileText
} from "lucide-react";

const statusColors: Record<string, string> = {
    'Approved': 'bg-emerald-600',
    'Pending': 'bg-amber-600',
    'Hold': 'bg-rose-600',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface WorkApprovalRecord {
    id: string;
    requestType: string;
    description: string;
    quantity: string;
    requestedBy: string;
    approvedBy: string;
    status: "Pending" | "Approved" | "Hold";
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
    },
    {
        id: "WAP-202",
        requestType: "Plastering - Wing A",
        description: "Approval for internal plastering start on 2nd floor.",
        quantity: "450 Sqft",
        requestedBy: "Eng. Sunil Dutt",
        approvedBy: "Pending",
        status: "Pending",
    },
];

const WorkApprovalPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<WorkApprovalRecord | null>(null);
    const [approvalData, setApprovalData] = useState<WorkApprovalRecord[]>(workApprovals);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        requestType: "",
        description: "",
        quantity: "",
        requestedBy: "Eng. Site User",
        approvedBy: "Pending",
        status: "Pending" as "Pending" | "Approved" | "Hold",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.requestType.trim()) newErrors.requestType = "Required";
        if (!formData.quantity.trim()) newErrors.quantity = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.approvedBy.trim()) newErrors.approvedBy = "Required";
        if (!formData.status) newErrors.status = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (isEditMode) {
            setApprovalData(prev => prev.map(t => t.id === formData.id ? { ...formData } : t));
            toast.success("Request Updated!");
        } else {
            const newEntry: WorkApprovalRecord = {
                ...formData,
                id: `WAP-${200 + approvalData.length + 1}`,
                approvedBy: "Verification Pending",
            };
            setApprovalData((prev) => [newEntry, ...prev]);
            toast.success("Work Approval Request Submitted!");
        }
        setIsFormModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (!requestToDelete) return;
        setApprovalData(prev => prev.filter(a => a.id !== requestToDelete));
        toast.success("Request deleted");
        setIsDeleteModalOpen(false);
        setRequestToDelete(null);
    };

    const filteredApprovals = useMemo(() => {
        return approvalData.filter(a => 
            a.requestType.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [approvalData, searchTerm]);

    const stats = {
        total: approvalData.length,
        cleared: approvalData.filter(a => a.status === "Approved").length,
        pending: approvalData.filter(a => a.status !== "Approved").length,
        clearanceRate: "94%"
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-rose-50 text-rose-600 border-rose-100';
        }
    };

    return (
        <>
            <Navbar title="Work Approvals" breadcrumb={["Engineer", "Approvals", "Technical Clearance"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Work Authorizations</h1>
                        <p className="text-slate-500 text-sm">Technical clearance portal for critical site activities and execution milestones.</p>
                    </div>
                    <button
                        onClick={() => { setIsEditMode(false); setFormData({ id: "", requestType: "", description: "", quantity: "", requestedBy: "Eng. Site User", approvedBy: "Pending", status: "Pending" }); setErrors({}); setIsFormModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Request
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Logs"
                        value={stats.total.toString()}
                        sub="Activity Baseline"
                        accent="text-slate-800"
                        icon={<ClipboardCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Cleared"
                        value={stats.cleared.toString()}
                        sub="Work Authorized"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Held / Pending"
                        value={stats.pending.toString()}
                        sub="Awaiting Clearance"
                        accent="text-rose-500"
                        icon={<AlertCircle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Clearance Rate"
                        value={stats.clearanceRate}
                        sub="Avg Site Precision"
                        accent="text-blue-500"
                        icon={<Zap className="w-5 h-5" />}
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
                                placeholder="Search by activity or ID..."
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
                                    <th className="px-6 py-4">Work Authorization</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Target Qty</th>
                                    <th className="px-6 py-4">Requested By</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredApprovals.length > 0 ? (
                                    filteredApprovals.map((approval) => (
                                        <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{approval.requestType}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{approval.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(approval.status)}`}>
                                                    {approval.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-blue-600">{approval.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {approval.requestedBy}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedApproval(approval)}
                                                        className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 ${statusColors[approval.status as keyof typeof statusColors] || 'bg-primary'} ${approval.status ? `shadow-${statusColors[approval.status as keyof typeof statusColors]?.split('-')[1]}/20` : 'shadow-primary/20'}`}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setIsEditMode(true); setFormData({ ...approval }); setIsFormModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setRequestToDelete(approval.id); setIsDeleteModalOpen(true); }}
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
                                            No approval requests found.
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
                isOpen={!!selectedApproval}
                onClose={() => setSelectedApproval(null)}
                title="Work Authorization Insight"
                maxWidth="max-w-xl"
            >
                {selectedApproval && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${statusColors[selectedApproval.status as keyof typeof statusColors] || 'bg-primary'} rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedApproval.requestType.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">Work Approval</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedApproval.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                            {selectedApproval.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">approval.ref-{selectedApproval.id.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">REQUEST: {selectedApproval.requestType}</span>
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Operational Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Request Type</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedApproval.requestType}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Target Quantity</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedApproval.quantity}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Authorization Status</p>
                                        <p className={`text-sm font-black font-inter italic-none ${selectedApproval.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedApproval.status.toUpperCase()}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Approval ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">AUT-{selectedApproval.id}X</p>
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
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Scope Observations</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedApproval.description || "No additional technical scope narrated for this authorization request."}"
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Integrity</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Verified By</p>
                                        <p className="text-sm font-black text-blue-600 font-inter italic-none">{selectedApproval.approvedBy}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Sync</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">Verified Request</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedApproval(null)}
                            className={`w-full py-4 ${statusColors[selectedApproval.status as keyof typeof statusColors] || 'bg-primary'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${selectedApproval.status ? `shadow-${statusColors[selectedApproval.status as keyof typeof statusColors]?.split('-')[1]}/20` : 'shadow-primary/20'}`}
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
                title={isEditMode ? "Modify Work Approval" : "New Work Request"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="approval-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {isEditMode ? "Update Request" : "Submit Request"}
                        </button>
                    </>
                }
            >
                <form id="approval-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Authorization Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Request Type <span className="text-rose-500">*</span></label>
                                <input name="requestType" value={formData.requestType} onChange={handleInputChange} placeholder="e.g. Concrete Pouring" className={inputClasses(errors.requestType)} />
                                {errors.requestType && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.requestType}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Target Quantity <span className="text-rose-500">*</span></label>
                                <input name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="e.g. 500 Sqft" className={inputClasses(errors.quantity)} />
                                {errors.quantity && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.quantity}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Technical Scope</h3>
                        <div>
                            <label className={labelClasses}>Work Description <span className="text-rose-500">*</span></label>
                            <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Describe the technical requirements..." className={`${inputClasses(errors.description)} resize-none`} />
                            {errors.description && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.description}</p>}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Workflow Control</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClasses}>Requested By <span className="text-rose-500">*</span></label>
                                <input name="requestedBy" value={formData.requestedBy} readOnly className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 font-bold" />
                            </div>
                            <div>
                                <label className={labelClasses}>Verified By <span className="text-rose-500">*</span></label>
                                <input name="approvedBy" value={formData.approvedBy} onChange={handleInputChange} placeholder="Authority Name" className={inputClasses(errors.approvedBy)} />
                                {errors.approvedBy && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.approvedBy}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Status <span className="text-rose-500">*</span></label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses(errors.status)}>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Hold">Hold</option>
                                </select>
                                {errors.status && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.status}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Work Request"
                message="Are you sure you want to delete this work approval request? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default WorkApprovalPage;
