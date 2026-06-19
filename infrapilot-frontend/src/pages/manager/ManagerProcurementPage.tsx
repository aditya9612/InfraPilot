import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import {
    ShoppingCart, ClipboardList, Package, Plus, Search,
    Filter, Clock, CheckCircle2, AlertCircle, MoreVertical,
    Download, FileText, Eye, Check, X, Box, ChevronLeft, ChevronRight, RotateCcw
} from "lucide-react";
import { siteRequestService } from "../../services/siteRequestService";
import type { SiteRequestResponse } from "../../services/siteRequestService";
import { materialService } from "../../services/materialService";
import type { PurchaseOrder } from "../../services/materialService";

const ManagerProcurementPage = () => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || "material";
    const { selectedProjectId } = useProject();

    // ── Data States ───────────────────────────────────────────────
    const [materialRequests, setMaterialRequests] = useState<SiteRequestResponse[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── UI States ─────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeStatFilter, setActiveStatFilter] = useState("All");

    // ── Modal States ──────────────────────────────────────────────
    const [selectedRequest, setSelectedRequest] = useState<SiteRequestResponse | null>(null);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);

    // ── DATA FETCH ────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            const [requests, pos] = await Promise.all([
                siteRequestService.getRequests(selectedProjectId),
                materialService.listPurchaseOrders(0, 1000)
            ]);

            setMaterialRequests(Array.isArray(requests) ? requests : []);
            // Filter POs by project_id since the service listPurchaseOrders doesn't take project_id in signature
            setPurchaseOrders((pos || []).filter(po => po.project_id === selectedProjectId));
        } catch (err) {
            console.error("Failed to fetch procurement data", err);
            toast.error("Failed to sync supply chain data");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, activeTab, activeStatFilter]);

    // ── Computed Stats ────────────────────────────────────────────
    const stats = useMemo(() => {
        const pendingReq = materialRequests.filter(r => r.status === "Pending").length;
        const openPO = purchaseOrders.filter(po => po.status !== "COMPLETED" && po.status !== "CANCELLED").length;
        const deliveredMonth = purchaseOrders.filter(po => po.status === "COMPLETED").length;
        const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);

        return {
            pendingReq,
            openPO,
            deliveredMonth,
            totalSpend: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSpend)
        };
    }, [materialRequests, purchaseOrders]);

    // ── ACTIONS ───────────────────────────────────────────────────
    const handleApprove = async (id: number) => {
        setIsSubmitting(true);
        try {
            await siteRequestService.approveRequest(id);
            toast.success("Requisition approved!");
            setMaterialRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" } : r));
        } catch {
            toast.error("Approval failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (id: number) => {
        setIsSubmitting(true);
        try {
            await siteRequestService.rejectRequest(id);
            toast.success("Requisition rejected");
            setMaterialRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Rejected" } : r));
        } catch {
            toast.error("Rejection failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: "material", label: "Material Requests", icon: <Package className="w-4 h-4" /> },
        { id: "purchase-order", label: "Purchase Orders", icon: <ShoppingCart className="w-4 h-4" /> },
    ];

    const activeTabData = useMemo(() => {
        if (activeTab === "material") {
            let data = materialRequests;
            if (activeStatFilter === "Pending") data = data.filter(r => r.status === "Pending");
            if (filterStatus !== "All") data = data.filter(r => r.status === filterStatus);
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                data = data.filter(r => r.description.toLowerCase().includes(s) || r.request_type.toLowerCase().includes(s) || String(r.id).includes(s));
            }
            return data.sort((a, b) => b.id - a.id);
        } else {
            let data = purchaseOrders;
            if (activeStatFilter === "Open") data = data.filter(po => po.status !== "COMPLETED" && po.status !== "CANCELLED");
            if (filterStatus !== "All") data = data.filter(po => po.status === filterStatus);
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                data = data.filter(po => po.material_name.toLowerCase().includes(s) || String(po.id).includes(s));
            }
            return data.sort((a, b) => b.id - a.id);
        }
    }, [activeTab, materialRequests, purchaseOrders, searchTerm, filterStatus, activeStatFilter]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return activeTabData.slice(start, start + itemsPerPage);
    }, [activeTabData, currentPage, itemsPerPage]);

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        if (s === "APPROVED" || s === "COMPLETED") return "bg-emerald-100 text-emerald-600";
        if (s === "PENDING" || s === "CREATED" || s === "PROCESSING") return "bg-amber-100 text-amber-600";
        if (s === "REJECTED" || s === "CANCELLED") return "bg-rose-100 text-rose-600";
        return "bg-slate-100 text-slate-500";
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

    return (
        <div className="min-h-screen bg-slate-50 font-inter">
            <Navbar
                title="Supply Chain Hub"
                breadcrumb={["Manager", "Procurement", tabs.find(t => t.id === activeTab)?.label || "Material Requests"]}
            />

            <PageTransition className="p-6">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Supply Chain Orchestrator</h1>
                        <p className="text-slate-500 mt-1">Directing site requisitions and procurement pipelines.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <Download className="w-4 h-4 text-primary" /> Export
                        </button>
                        {activeTab === "purchase-order" && (
                            <button onClick={() => setIsNewPOModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                                <Plus className="w-4 h-4" /> New Order
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { title: "Pending Requests", value: stats.pendingReq.toString(), sub: "Awaiting Action", accent: "text-amber-500", icon: <Clock className="w-5 h-5 text-amber-500" />, filter: "Pending" },
                        { title: "Open Orders", value: stats.openPO.toString(), sub: "In Pipeline", accent: "text-primary", icon: <ShoppingCart className="w-5 h-5 text-primary" />, filter: "Open" },
                        { title: "Delivered", value: stats.deliveredMonth.toString(), sub: "Completed POs", accent: "text-emerald-500", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, filter: "All" },
                        { title: "Project Spend", value: stats.totalSpend, sub: "Total Commitment", accent: "text-slate-900", icon: <FileText className="w-5 h-5 text-slate-700" />, filter: "All" },
                    ].map(s => (
                        <div key={s.title} onClick={() => s.filter && setActiveStatFilter(s.filter)}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md cursor-pointer active:scale-95 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-primary/5 transition-colors">{s.icon}</div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{s.title}</p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Tab Switcher ── */}
                <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl mb-8 w-fit shadow-sm overflow-x-auto scrollbar-none">
                    {tabs.map((t) => (
                        <button key={t.id} onClick={() => navigate(`/manager/procurement/${t.id}`)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === t.id ? "text-slate-800 bg-slate-100 shadow-inner" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                            {t.icon}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Main List Container ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/20">
                        <div className="flex flex-1 items-center gap-4 max-w-md">
                            <div className="relative w-full">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder={`Search ${activeTab === "material" ? "requests" : "orders"}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm cursor-pointer hover:border-primary/50 transition-colors">
                                <option value="All">All Status</option>
                                {activeTab === "material" ? (
                                    <>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="CREATED">Created</option>
                                        <option value="PENDING">In Transit</option>
                                        <option value="COMPLETED">Fulfilled</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </>
                                )}
                            </select>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:bg-rose-50">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">ID & Origin</th>
                                    <th className="px-6 py-4">{activeTab === "material" ? "Requisition Details" : "Order Contents"}</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">{activeTab === "material" ? "Quantity" : "Value"}</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing ledger...</p>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? paginatedData.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm">
                                                {activeTab === "material" ? `RQ-${item.id}` : `PO-${item.id}`}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                                {activeTab === "material" ? `By Auth ID: ${item.requested_by}` : `Vendor ID: ${item.supplier_id}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 leading-tight">
                                                    {activeTab === "material" ? item.request_type : item.material_name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1 italic uppercase tracking-tight">
                                                    {activeTab === "material" ? (item.description || "No narrative") : `Linked Order — ID: ${item.id}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 tabular-nums">
                                                    {activeTab === "material" ? `${item.quantity} Units` : `₹${(item.total_amount || 0).toLocaleString()}`}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-0.5">
                                                    {activeTab === "material" ? "Site Requisition" : `${item.quantity} Qty @ ₹${item.rate}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => activeTab === "material" ? setSelectedRequest(item) : setSelectedPO(item)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {activeTab === "material" && item.status === "Pending" && (
                                                    <div className="flex items-center gap-1.5 border-l border-slate-100 pl-2">
                                                        <button onClick={() => handleApprove(item.id)} disabled={isSubmitting}
                                                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleReject(item.id)} disabled={isSubmitting}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                            No {activeTab === "material" ? "requisitions" : "purchase orders"} archived for this project.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!isLoading && activeTabData.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">Page size:</span>
                                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg text-[11px] px-2 py-1 outline-none bg-white shadow-sm font-bold text-slate-700">
                                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold tabular-nums">
                                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, activeTabData.length)} of {activeTabData.length}
                            </p>
                            <div className="flex gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm active:scale-95 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.ceil(activeTabData.length / itemsPerPage) }, (_, i) => i + 1).slice(
                                    Math.max(0, currentPage - 3), Math.min(Math.ceil(activeTabData.length / itemsPerPage), currentPage + 2)
                                ).map(p => (
                                    <button key={p} onClick={() => setCurrentPage(p)}
                                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${currentPage === p ? "bg-primary text-white border border-primary shadow-md shadow-primary/20 scale-110" : "bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm hover:border-primary/50"}`}>
                                        {p}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(activeTabData.length / itemsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(activeTabData.length / itemsPerPage)}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm active:scale-95 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── Detail Modals ── */}
            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Requisition Artifact Analysis" maxWidth="max-w-xl">
                {selectedRequest && (
                    <div className="p-6 space-y-6">
                        <div className={`rounded-2xl p-8 text-white shadow-lg ${selectedRequest.status === 'Approved' ? 'bg-emerald-600' : selectedRequest.status === 'Pending' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Procurement Record</p>
                            <h3 className="text-xl font-bold mb-4">{selectedRequest.request_type}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                    <p className="text-[9px] font-bold uppercase opacity-60">Status</p>
                                    <p className="font-bold text-lg">{selectedRequest.status.toUpperCase()}</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                    <p className="text-[9px] font-bold uppercase opacity-60">Quantum</p>
                                    <p className="font-bold text-lg">{selectedRequest.quantity} UNITS</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Narrative</p>
                                <div className="p-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 leading-relaxed italic border border-slate-100">
                                    "{selectedRequest.description}"
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title="Purchase Order Analysis" maxWidth="max-w-xl">
                {selectedPO && (
                    <div className="p-6 space-y-6">
                        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Electronic Order Sheet</p>
                            <h3 className="text-xl font-bold mb-4">{selectedPO.material_name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] font-bold uppercase opacity-60">Total Value</p>
                                    <p className="font-bold text-lg">₹{(selectedPO.total_amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] font-bold uppercase opacity-60">Order Status</p>
                                    <p className="font-bold text-lg tracking-widest text-primary">{selectedPO.status}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ["Quantity", `${selectedPO.quantity} Units`],
                                ["Rate", `₹${selectedPO.rate}/unit`],
                                ["Supplier Ref", `#SUP-${selectedPO.supplier_id}`],
                                ["Project Ref", `#PRJ-${selectedPO.project_id}`],
                            ].map(([l, v]) => (
                                <div key={l} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                                    <p className="text-sm font-bold text-slate-800 uppercase tabular-nums">{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManagerProcurementPage;
