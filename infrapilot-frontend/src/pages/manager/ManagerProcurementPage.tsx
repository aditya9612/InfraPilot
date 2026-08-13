import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import {
    Search, AlertTriangle,
    FileText, Eye, Check, X, ChevronLeft, ChevronRight, RotateCcw, ShoppingCart
} from "lucide-react";
import { siteRequestService } from "../../services/siteRequestService";
import type { CreateSiteRequest, SiteRequestResponse } from "../../services/siteRequestService";
import ProjectSelector from "../../components/common/ProjectSelector";
import CreatePurchaseModal from "../../components/forms/CreatePurchaseModal";
import ViewPurchaseModal from "../../components/forms/ViewPurchaseModal";
import EditPurchaseModal from "../../components/forms/EditPurchaseModal";
import { equipmentService } from "../../services/equipmentService";
import { Trash2, Edit2 } from "lucide-react";

const ManagerProcurementPage = () => {
    const { selectedProjectId, selectedProject } = useProject();
    const [activeTab, setActiveTab] = useState<"material" | "purchase-order">("material");

    // ── Data States ───────────────────────────────────────────────
    const [materialRequests, setMaterialRequests] = useState<SiteRequestResponse[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── UI States ─────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [requestTypeFilter, setRequestTypeFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [activeStatFilter, setActiveStatFilter] = useState("All");

    // ── Purchase Filters ──────────────────────────────────────────
    const [purchaseType, setPurchaseType] = useState("");
    const [assetId, setAssetId] = useState("");
    const [purchaseDateFrom, setPurchaseDateFrom] = useState("");
    const [purchaseDateTo, setPurchaseDateTo] = useState("");
    const [boqItemId, setBoqItemId] = useState("");

    // ── Modal States ──────────────────────────────────────────────
    const [selectedRequest, setSelectedRequest] = useState<SiteRequestResponse | null>(null);
    const [selectedPO, setSelectedPO] = useState<any | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatePurchaseModalOpen, setIsCreatePurchaseModalOpen] = useState(false);
    const [isViewPurchaseOpen, setIsViewPurchaseOpen] = useState(false);
    const [isEditPurchaseOpen, setIsEditPurchaseOpen] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
    const [isDeletePurchaseOpen, setIsDeletePurchaseOpen] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
    const [requestType, setRequestType] = useState<CreateSiteRequest["request_type"]>("Material");
    const [requestDescription, setRequestDescription] = useState("");
    const [requestQuantity, setRequestQuantity] = useState(1);
    const [isCreatingRequest, setIsCreatingRequest] = useState(false);

    // ── DATA FETCH ────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!selectedProjectId) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const skip = (currentPage - 1) * itemsPerPage;
            const [reqResult, posResult] = await Promise.allSettled([
                siteRequestService.getRequests(selectedProjectId),
                equipmentService.listPurchase({
                    project_id: selectedProjectId,
                    limit: itemsPerPage,
                    offset: skip,
                    ...(purchaseType && { purchase_type: purchaseType }),
                    ...(assetId && { asset_id: Number(assetId) }),
                    ...(boqItemId && { boq_item_id: Number(boqItemId) }),
                    ...(purchaseDateFrom && { purchase_date_from: purchaseDateFrom }),
                    ...(purchaseDateTo && { purchase_date_to: purchaseDateTo })
                })
            ]);

            // Handle site requests result
            if (reqResult.status === "fulfilled") {
                const raw = reqResult.value;
                const reqList = Array.isArray(raw) ? raw : ((raw as any)?.items || (raw as any)?.data || []);
                setMaterialRequests(reqList);
            } else {
                console.error("Site requests fetch failed:", reqResult.reason);
                setMaterialRequests([]);
            }

            // Handle purchase orders result
            if (posResult.status === "fulfilled") {
                const raw = posResult.value;
                const pos: any[] = Array.isArray(raw)
                    ? raw
                    : ((raw as any)?.items || (raw as any)?.data || []);
                const total = Array.isArray(raw)
                    ? raw.length
                    : ((raw as any)?.total ?? (raw as any)?.count ?? pos.length);
                setPurchaseOrders(pos);
                setTotalItems(total);
            } else {
                console.error("Purchase orders fetch failed:", posResult.reason);
                setPurchaseOrders([]);
                setTotalItems(0);
            }
        } catch (err) {
            console.error("Failed to fetch procurement data", err);
            toast.error("Failed to sync supply chain data");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, currentPage, itemsPerPage, activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, activeTab, activeStatFilter]);

    // ── Computed Stats ────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalReq = materialRequests.length;
        const approvedReq = materialRequests.filter(r => r.status === "Approved").length;
        const pendingReq = materialRequests.filter(r => r.status === "Pending").length;
        const fulfillment = totalReq > 0 ? Math.round((approvedReq / totalReq) * 100) : 0;
        
        return {
            totalReq,
            approvedReq,
            pendingReq,
            fulfillment
        };
    }, [materialRequests]);

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

    const handleDeletePurchase = async () => {
        if (!purchaseToDelete) return;
        setIsSubmitting(true);
        try {
            await equipmentService.deletePurchase(purchaseToDelete);
            toast.success("Purchase deleted successfully");
            setIsDeletePurchaseOpen(false);
            setPurchaseToDelete(null);
            fetchData();
        } catch {
            toast.error("Failed to delete purchase");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!selectedProjectId) {
            toast.error("Please select a project before creating a request.");
            return;
        }
        if (!requestDescription.trim()) {
            toast.error("Please enter a description for the request.");
            return;
        }
        if (requestQuantity <= 0) {
            toast.error("Quantity must be greater than zero.");
            return;
        }

        setIsCreatingRequest(true);
        try {
            const payload: CreateSiteRequest = {
                project_id: selectedProjectId,
                request_type: requestType,
                description: requestDescription.trim(),
                quantity: requestQuantity
            };
            const created = await siteRequestService.createRequest(payload);
            setMaterialRequests(prev => [created, ...prev]);
            toast.success("Request created successfully.");
            setIsCreateModalOpen(false);
            setRequestType("Material");
            setRequestDescription("");
            setRequestQuantity(1);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Failed to create request.");
        } finally {
            setIsCreatingRequest(false);
        }
    };

    const activeTabData = useMemo(() => {
        if (activeTab === "material") {
            let data = materialRequests;
            if (activeStatFilter === "Pending") data = data.filter(r => r.status === "Pending");
            if (filterStatus !== "All") data = data.filter(r => r.status === filterStatus);
            if (requestTypeFilter !== "All") data = data.filter(r => r.request_type === requestTypeFilter);
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                data = data.filter(r => r.description.toLowerCase().includes(s) || r.request_type.toLowerCase().includes(s) || String(r.id).includes(s));
            }
            return data.sort((a, b) => b.id - a.id);
        } else {
            let data = purchaseOrders;
            if (activeStatFilter === "Open") data = data.filter(po => po.status !== "COMPLETED" && po.status !== "CANCELLED");
            if (purchaseType) data = data.filter(po => po.purchase_type === purchaseType);
            if (purchaseDateFrom) data = data.filter(po => po.purchase_date >= purchaseDateFrom);
            if (purchaseDateTo) data = data.filter(po => po.purchase_date <= purchaseDateTo);
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                data = data.filter(po => 
                    (po.asset_name || "").toLowerCase().includes(s) || 
                    (po.vendor_name || "").toLowerCase().includes(s) || 
                    (po.invoice_number || "").toLowerCase().includes(s) || 
                    (po.purchase_type || "").toLowerCase().includes(s) || 
                    String(po.id).includes(s)
                );
            }
            return data.sort((a, b) => b.id - a.id);
        }
    }, [activeTab, materialRequests, purchaseOrders, searchTerm, filterStatus, activeStatFilter, requestTypeFilter, purchaseType, purchaseDateFrom, purchaseDateTo]);

    const paginatedData = useMemo(() => {
        if (activeTab === "purchase-order") return activeTabData;
        const start = (currentPage - 1) * itemsPerPage;
        return activeTabData.slice(start, start + itemsPerPage);
    }, [activeTab, activeTabData, purchaseOrders, currentPage, itemsPerPage]);

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        if (s === "APPROVED" || s === "COMPLETED") return "bg-emerald-100 text-emerald-600";
        if (s === "PENDING" || s === "CREATED" || s === "PROCESSING") return "bg-amber-100 text-amber-600";
        if (s === "REJECTED" || s === "CANCELLED") return "bg-rose-100 text-rose-600";
        return "bg-slate-100 text-slate-500";
    };

    return (
        <div className="min-h-screen bg-slate-50 font-inter">
            <Navbar
                title="Supply Chain Hub"
                breadcrumb={["Manager", "Procurement", activeTab === "material" ? "Material Requests" : "Purchase Orders"]}
            />

            <PageTransition className="p-6">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Supply Chain Orchestrator</h1>
                        <p className="text-slate-500 mt-1">Directing site requisitions and procurement pipelines.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ProjectSelector variant="page" />
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm disabled:opacity-40"
                            title="Refresh data"
                        >
                            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        {activeTab === "material" && (
                            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                                <FileText className="w-4 h-4" /> Create Request
                            </button>
                        )}
                        {activeTab === "purchase-order" && (
                            <button onClick={() => setIsCreatePurchaseModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                                <ShoppingCart className="w-4 h-4" /> Create Purchase
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Tab Switcher ── */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6">
                    <button
                        onClick={() => { setActiveTab("material"); setCurrentPage(1); setSearchTerm(""); setFilterStatus("All"); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === "material" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        Site Requisitions
                    </button>
                    <button
                        onClick={() => { setActiveTab("purchase-order"); setCurrentPage(1); setSearchTerm(""); setFilterStatus("All"); setPurchaseType(""); setAssetId(""); setPurchaseDateFrom(""); setPurchaseDateTo(""); setBoqItemId(""); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === "purchase-order" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        Purchase Orders
                    </button>
                </div>

                {/* ── Stat Cards ── */}
                {activeTab === "material" && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[
                            { title: "TOTAL LOGS", value: stats.totalReq.toString(), sub: "All Requests", accent: "text-slate-800", filter: "All" },
                            { title: "APPROVED", value: stats.approvedReq.toString(), sub: "Released for Site", accent: "text-emerald-500", filter: "Approved" },
                            { title: "PENDING REVIEW", value: stats.pendingReq.toString(), sub: "PM Validation", accent: "text-amber-500", filter: "Pending" },
                            { title: "FULFILLMENT", value: `${stats.fulfillment}%`, sub: "Procurement Yield", accent: "text-blue-500", filter: "All" },
                        ].map(s => (
                            <div key={s.title} onClick={() => s.filter && setActiveStatFilter(s.filter)}
                                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md cursor-pointer transition-all group">
                                <p className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest mb-3 group-hover:text-primary transition-colors">{s.title}</p>
                                <p className={`text-3xl font-bold mb-1 ${s.accent}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                )}


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
                            {activeTab === "material" && (
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm cursor-pointer hover:border-primary/50 transition-colors">
                                    <option value="All">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            )}
                            {activeTab === "material" && (
                                <select value={requestTypeFilter} onChange={e => setRequestTypeFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm cursor-pointer hover:border-primary/50 transition-colors">
                                    <option value="All">All Types</option>
                                    <option value="Material">Material</option>
                                    <option value="Doc">Doc</option>
                                    <option value="Drawing">Drawing</option>
                                    <option value="BOQ">BOQ</option>
                                    <option value="Bill">Bill</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Labour">Labour</option>
                                </select>
                            )}
                            {activeTab === "purchase-order" && (
                                <>
                                    <select value={purchaseType} onChange={e => setPurchaseType(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none shadow-sm cursor-pointer">
                                        <option value="">Type</option>
                                        <option value="NEW">New</option>
                                        <option value="USED">Used</option>
                                        <option value="RENT">Rental</option>
                                        <option value="SPARE_PART">Spare Part</option>
                                    </select>
                                    <input type="date" value={purchaseDateFrom} onChange={e => setPurchaseDateFrom(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none shadow-sm" title="Date From" />
                                    <input type="date" value={purchaseDateTo} onChange={e => setPurchaseDateTo(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none shadow-sm" title="Date To" />
                                </>
                            )}
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
                                {activeTab === "material" ? (
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Project Name</th>
                                        <th className="px-6 py-4">Request Type</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4">Quantity</th>
                                        <th className="px-6 py-4">Req. & Approval</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                ) : (
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Project & Type</th>
                                        <th className="px-6 py-4">Asset Details</th>
                                        <th className="px-6 py-4">Vendor & Invoice</th>
                                        <th className="px-6 py-4">Value</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={activeTab === "material" ? 7 : 5} className="px-6 py-20 text-center">
                                            <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing ledger...</p>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? paginatedData.map((item: any) => (
                                    activeTab === "material" ? (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{selectedProject?.project_name || "Unknown Project"}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.request_type}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]" title={item.description}>{item.description}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.quantity}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-600"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Req:</span> {item.requested_by}</span>
                                                    <span className="text-sm text-slate-600 mt-0.5"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">App:</span> {item.approved_by || "-"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.status === "Pending" && (
                                                        <div className="flex items-center gap-1.5 border-slate-100">
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
                                    ) : (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm">
                                                    {selectedProject?.project_name || "Unknown Project"}
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                                    {item.purchase_type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 leading-tight">
                                                        {item.asset_name || `Asset #${item.asset_id}`}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1 italic uppercase tracking-tight">
                                                        {item.purchase_date}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 leading-tight">
                                                        {item.vendor_name || "N/A"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1 italic uppercase tracking-tight">
                                                        INV: {item.invoice_number || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 tabular-nums">
                                                        ₹{(item.total_amount || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-0.5">
                                                        {item.quantity} Qty @ ₹{item.unit_price}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => { setSelectedPurchaseId(item.id); setIsViewPurchaseOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setSelectedPurchaseId(item.id); setIsEditPurchaseOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setPurchaseToDelete(item.id); setIsDeletePurchaseOpen(true); }} disabled={isSubmitting}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )) : (
                                    <tr>
                                        <td colSpan={activeTab === "material" ? 7 : 5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
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
                                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, activeTab === "purchase-order" ? totalItems : activeTabData.length)} of {activeTab === "purchase-order" ? totalItems : activeTabData.length}
                            </p>
                            <div className="flex gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm active:scale-95 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.ceil((activeTab === "purchase-order" ? totalItems : activeTabData.length) / itemsPerPage) }, (_, i) => i + 1).slice(
                                    Math.max(0, currentPage - 3), Math.min(Math.ceil((activeTab === "purchase-order" ? totalItems : activeTabData.length) / itemsPerPage), currentPage + 2)
                                ).map(p => (
                                    <button key={p} onClick={() => setCurrentPage(p)}
                                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${currentPage === p ? "bg-primary text-white border border-primary shadow-md shadow-primary/20 scale-110" : "bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm hover:border-primary/50"}`}>
                                        {p}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil((activeTab === "purchase-order" ? totalItems : activeTabData.length) / itemsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil((activeTab === "purchase-order" ? totalItems : activeTabData.length) / itemsPerPage)}
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

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Site Request" maxWidth="max-w-lg">
                <div className="p-6 space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned Project</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{selectedProject?.project_name || "No project selected"}</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Request Type</label>
                            <select value={requestType} onChange={e => setRequestType(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                <option value="Material">Material</option>
                                <option value="Labour">Labour</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Work">Work</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                            <textarea value={requestDescription} onChange={e => setRequestDescription(e.target.value)} rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Describe the request" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantity</label>
                            <input type="number" min={1} value={requestQuantity} onChange={e => setRequestQuantity(Number(e.target.value))}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
                        <button type="button" onClick={handleCreateRequest} disabled={isCreatingRequest}
                            className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50">
                            {isCreatingRequest ? "Creating..." : "Create Request"}
                        </button>
                    </div>
                </div>
            </Modal>

            <CreatePurchaseModal
                isOpen={isCreatePurchaseModalOpen}
                onClose={() => setIsCreatePurchaseModalOpen(false)}
                projectId={selectedProjectId || 0}
                projectName={selectedProject?.project_name || "Unknown Project"}
                onSuccess={fetchData}
            />

            <ViewPurchaseModal
                isOpen={isViewPurchaseOpen}
                onClose={() => { setIsViewPurchaseOpen(false); setSelectedPurchaseId(null); }}
                purchaseId={selectedPurchaseId}
                projectName={selectedProject?.project_name || "Unknown Project"}
            />

            <EditPurchaseModal
                isOpen={isEditPurchaseOpen}
                onClose={() => { setIsEditPurchaseOpen(false); setSelectedPurchaseId(null); }}
                purchaseId={selectedPurchaseId}
                projectId={selectedProjectId || 0}
                projectName={selectedProject?.project_name || "Unknown Project"}
                onSuccess={fetchData}
            />

            {/* Delete Purchase Modal */}
            <Modal isOpen={isDeletePurchaseOpen} onClose={() => { setIsDeletePurchaseOpen(false); setPurchaseToDelete(null); }} title="Delete Purchase Order" maxWidth="max-w-md">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 px-4">
                        Are you sure you want to delete this purchase order? This will remove the purchase record for this specific item.
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => { setIsDeletePurchaseOpen(false); setPurchaseToDelete(null); }} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        Cancel
                    </button>
                    <button onClick={handleDeletePurchase} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all flex items-center gap-2">
                        {isSubmitting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ManagerProcurementPage;
