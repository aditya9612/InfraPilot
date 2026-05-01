import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MaterialRequestRecord {
    id: string;
    requestType: string;
    description: string;
    quantity: string;
    requestedBy: string;
    approvedBy: string;
    status: "Pending" | "Approved" | "Rejected";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const materialRequests: MaterialRequestRecord[] = [
    {
        id: "REQ-101",
        requestType: "Structural Steel",
        description: "TMT bars for 2nd floor slab reinforcement.",
        quantity: "5 Tons",
        requestedBy: "Eng. Amit Sharma",
        approvedBy: "PM - Vikram Singh",
        status: "Approved",
    },
    {
        id: "REQ-102",
        requestType: "Cement",
        description: "OPC 53 Grade cement for masonry work.",
        quantity: "200 Bags",
        requestedBy: "Eng. Sunil Dutt",
        approvedBy: "Pending",
        status: "Pending",
    },
];

const MaterialRequestPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequestRecord | null>(null);
    const [requestData, setRequestData] = useState<MaterialRequestRecord[]>(materialRequests);
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
        status: "Pending" as "Pending" | "Approved" | "Rejected",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.requestType) newErrors.requestType = "Required";
        if (!formData.quantity) newErrors.quantity = "Required";
        if (!formData.description) newErrors.description = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (isEditMode) {
            setRequestData(prev => prev.map(t => t.id === formData.id ? { ...formData } : t));
            toast.success("Request Updated!");
        } else {
            const newEntry: MaterialRequestRecord = {
                ...formData,
                id: `REQ-${100 + requestData.length + 1}`,
                approvedBy: "Pending",
            };
            setRequestData((prev) => [newEntry, ...prev]);
            toast.success("Request Submitted!");
        }
        setIsFormModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (!requestToDelete) return;
        setRequestData(prev => prev.filter(r => r.id !== requestToDelete));
        toast.success("Requisition deleted");
        setIsDeleteModalOpen(false);
        setRequestToDelete(null);
    };

    const filteredRequests = useMemo(() => {
        return requestData.filter(r => 
            r.requestType.toLowerCase().includes(searchTerm.toLowerCase()) || 
            r.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requestData, searchTerm]);

    const stats = {
        total: requestData.length,
        approved: requestData.filter(r => r.status === "Approved").length,
        pending: requestData.filter(r => r.status === "Pending").length,
        fulfillment: "88%"
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
            <Navbar title="Material Requests" breadcrumb={["Engineer", "Approvals", "Material Requisition"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Requisitions</h1>
                        <p className="text-slate-500 text-sm">Formal procurement requests for structural and consumable site resources.</p>
                    </div>
                    <button
                        onClick={() => { setIsEditMode(false); setFormData({ id: "", requestType: "", description: "", quantity: "", requestedBy: "Eng. Site User", approvedBy: "Pending", status: "Pending" }); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Requisition
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Logs"
                        value={stats.total.toString()}
                        sub="All Requests"
                        accent="text-slate-800"
                        icon={<Package className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Approved"
                        value={stats.approved.toString()}
                        sub="Released for Site"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Review"
                        value={stats.pending.toString()}
                        sub="Awaiting PM Approval"
                        accent="text-amber-500"
                        icon={<Clock className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Fulfillment"
                        value={stats.fulfillment}
                        sub="Site Delivery Rate"
                        accent="text-blue-500"
                        icon={<TrendingUp className="w-5 h-5" />}
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
                                placeholder="Search by material or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Resource Requisition</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Requested By</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{request.requestType}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{request.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-blue-600">{request.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {request.requestedBy}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedRequest(request)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setIsEditMode(true); setFormData({ ...request }); setIsFormModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setRequestToDelete(request.id); setIsDeleteModalOpen(true); }}
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
                                            No requisitions found.
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
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Requisition Insight"
                maxWidth="max-w-xl"
            >
                {selectedRequest && (
                    <div className="p-6">
                        <div className={`rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden ${selectedRequest.status === 'Approved' ? 'bg-emerald-600' : selectedRequest.status === 'Pending' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Procurement Record</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6">{selectedRequest.requestType}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Status</p>
                                        <p className="text-lg font-black">{selectedRequest.status.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Quantity</p>
                                        <p className="text-lg font-black">{selectedRequest.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10">
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-2')}>Requirement Narrative</p>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                                    "{selectedRequest.description}"
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Requested By</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedRequest.requestedBy}</p>
                                </div>
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Approved By</p>
                                    <p className="text-sm font-bold text-blue-600">{selectedRequest.approvedBy}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedRequest(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
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
                title={isEditMode ? "Modify Requisition" : "New Material Requisition"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="request-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {isEditMode ? "Update Requisition" : "Submit Requisition"}
                        </button>
                    </>
                }
            >
                <form id="request-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Requisition Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Request Type *</label>
                                <input name="requestType" value={formData.requestType} onChange={handleInputChange} placeholder="e.g. Structural Steel" className={inputClasses(errors.requestType)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Order Quantity *</label>
                                <input name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="e.g. 5 Tons" className={inputClasses(errors.quantity)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Requirement Narrative</h3>
                        <div>
                            <label className={labelClasses}>Description *</label>
                            <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Detailed specifications..." className={`${inputClasses(errors.description)} resize-none`} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Supply Chain Control</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClasses}>Requested By</label>
                                <input name="requestedBy" value={formData.requestedBy} readOnly className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 font-bold" />
                            </div>
                            <div>
                                <label className={labelClasses}>Approved By</label>
                                <input name="approvedBy" value={formData.approvedBy} onChange={handleInputChange} placeholder="Authority Name" className={inputClasses()} />
                            </div>
                            <div>
                                <label className={labelClasses}>Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Requisition"
                message="Are you sure you want to delete this material request record? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default MaterialRequestPage;
