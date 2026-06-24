import { useState, useEffect, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Search, RotateCcw, ChevronLeft, ChevronRight,
    ArrowRightLeft, Eye
} from "lucide-react";
import { materialService, type InventoryItem, type Transfer, type MaterialLog, type IssueType, type TransferStatus } from "../../../services/materialService";
import { projectService } from "../../../services/projectService";

type TabType = "Usage" | "Transfers" | "Transactions";
const ISSUE_TYPES = ["SYSTEM", "SITE", "DAMAGE", "LOSS", "VENDOR", "TRANSFER", "ADJUSTMENT", "PURCHASE"];
const TRANSFER_STATUSES: TransferStatus[] = ["PENDING", "COMPLETED", "CANCELLED"];

const MaterialConsumptionPage = () => {
    const formatINR = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(amount));
    };

    const [activeTab, setActiveTab] = useState<TabType>("Usage");
    const [projectId, setProjectId] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [transactions, setTransactions] = useState<MaterialLog[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isUpdateTransferOpen, setIsUpdateTransferOpen] = useState(false);
    const [isViewTransferModalOpen, setIsViewTransferModalOpen] = useState(false);
    const [viewTransferDetails, setViewTransferDetails] = useState<Transfer | null>(null);

    // Forms & Selected Items
    const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) setProjectId(Number(pId));
            } catch (e) { console.error(e); }
        }
    }, []);

    const handleProjectChange = (newProjectId: number) => {
        setProjectId(newProjectId);
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.user) {
                    user.user.project_id = newProjectId;
                } else {
                    user.project_id = newProjectId;
                }
                localStorage.setItem("infrapilot_user", JSON.stringify(user));
            } catch (e) { }
        }
    };
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

    const [usageForm, setUsageForm] = useState({ quantity: 0, project_id: projectId, issue_type: "SITE" });
    const [transferForm, setTransferForm] = useState<Partial<{ material_id: number; from_project_id: number; to_project_id: number; quantity: number; remarks: string }>>({ from_project_id: projectId });
    const [updateTransferForm, setUpdateTransferForm] = useState({ status: "DELIVERED" as TransferStatus, remarks: "" });

    // Fetch methods
    const fetchInventory = async () => {
        setIsLoading(true);
        try { const data = await materialService.getProjectInventory(projectId); setInventory(data); }
        catch (e) { toast.error("Failed to load inventory"); }
        finally { setIsLoading(false); }
    };

    const fetchTransfers = async () => {
        setIsLoading(true);
        try { const data = await materialService.listTransfers(0, 500); setTransfers(data.data); }
        catch (e) { toast.error("Failed to load transfers"); }
        finally { setIsLoading(false); }
    };

    const fetchTransactions = async () => {
        setIsLoading(true);
        try { const data = await materialService.getLogs({ project_id: projectId }); setTransactions(data as any); }
        catch (e) { toast.error("Failed to load transactions"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                setProjectsList(Array.isArray(res) ? res : (res.items || res.data || []));
            } catch (err) { }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        if (activeTab === "Usage") fetchInventory();
        else if (activeTab === "Transfers") fetchTransfers();
        else if (activeTab === "Transactions") fetchTransactions();
    }, [activeTab, projectId]);

    // Derived Data
    const filteredInventory = useMemo(() => inventory.filter(i => i.material_name.toLowerCase().includes(searchTerm.toLowerCase())), [inventory, searchTerm]);
    const paginatedInventory = useMemo(() => filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredInventory, currentPage, itemsPerPage]);

    const filteredTransfers = useMemo(() => transfers.filter(t => t.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(t.id).includes(searchTerm)), [transfers, searchTerm]);
    const paginatedTransfers = useMemo(() => filteredTransfers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredTransfers, currentPage, itemsPerPage]);

    const filteredTransactions = useMemo(() => transactions.filter(t => t.type.toLowerCase().includes(searchTerm.toLowerCase()) || t.issue_type.toLowerCase().includes(searchTerm.toLowerCase())), [transactions, searchTerm]);
    const paginatedTransactions = useMemo(() => filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredTransactions, currentPage, itemsPerPage]);

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = "w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary";

    // Handlers
    const handleUsageSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedInventory) return; setIsSubmitting(true);
        try {
            await materialService.recordUsage(selectedInventory.material_id, { ...usageForm, issue_type: usageForm.issue_type as IssueType });
            toast.success("Usage recorded!"); setIsUsageModalOpen(false); fetchInventory();
        } catch (e) { toast.error("Failed to record usage"); }
        finally { setIsSubmitting(false); }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            await materialService.createTransfer({ ...transferForm } as any);
            toast.success("Transfer initiated!"); setIsTransferModalOpen(false); fetchTransfers();
        } catch (e) { toast.error("Failed to create transfer"); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateTransfer = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedTransfer) return; setIsSubmitting(true);
        try {
            await materialService.updateTransferStatus(selectedTransfer.id, updateTransferForm.status);
            toast.success("Transfer updated!"); setIsUpdateTransferOpen(false); fetchTransfers();
        } catch (e) { toast.error("Failed to update transfer"); }
        finally { setIsSubmitting(false); }
    };

    const handleViewTransfer = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await materialService.getTransfer(id);
            setViewTransferDetails(data);
            setIsViewTransferModalOpen(true);
        } catch (e) { toast.error("Failed to fetch transfer details"); }
        finally { setIsLoading(false); }
    };

    const renderPagination = (total: number) => {
        const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky bottom-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-200 rounded-lg text-[11px] font-medium px-2 py-1 outline-none bg-white">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                    Showing {total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} records
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"><ChevronLeft className="w-4 h-4" /></button>
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || total === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar title="Material Consumption" breadcrumb={["Engineer", "Material Management", "Consumption"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ─── Header ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Consumption & Logistics
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Manage usage, inter-project transfers, and log history
                        </p>
                    </div>
                    {activeTab === "Transfers" && (
                        <button onClick={() => { setTransferForm({ from_project_id: projectId }); setIsTransferModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95">
                            <ArrowRightLeft className="w-4 h-4" /> Initiate Transfer
                        </button>
                    )}
                </div>

                {/* Tabs & Project Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit max-w-full overflow-x-auto scrollbar-none">
                        {(["Usage", "Transfers", "Transactions"] as TabType[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Project Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500">Project:</span>
                        <select value={projectId} onChange={(e) => handleProjectChange(Number(e.target.value))} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm min-w-[200px]">
                            {projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-4 h-full flex flex-col min-h-0">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Consumption Logs</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <button onClick={activeTab === "Usage" ? fetchInventory : activeTab === "Transfers" ? fetchTransfers : fetchTransactions} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        <div className="flex-1 overflow-auto scrollbar-thin">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0 z-10">
                                    {activeTab === "Usage" && (
                                        <tr>
                                            <th className="px-6 py-4">Material Name</th><th className="px-6 py-4 text-center">Remaining Stock</th>
                                            <th className="px-6 py-4 text-right">Avg Rate</th><th className="px-6 py-4 text-right">Total Value</th><th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    )}
                                    {activeTab === "Transfers" && (
                                        <tr>
                                            <th className="px-6 py-4">Material</th>
                                            <th className="px-6 py-4">From Project</th>
                                            <th className="px-6 py-4">To Project</th>
                                            <th className="px-6 py-4 text-center">Qty</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4">Transfer Date</th><th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    )}
                                    {activeTab === "Transactions" && (
                                        <tr>
                                            <th className="px-6 py-4">Date</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Material</th><th className="px-6 py-4 text-center">Qty</th>
                                            <th className="px-6 py-4 text-right">Rate</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4">Issue Type</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading...</td></tr> :
                                        activeTab === "Usage" ? paginatedInventory.map(i => (
                                            <tr key={i.material_id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{i.material_name}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-center text-emerald-600">{i.remaining_stock}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(i.avg_rate)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(i.total_value)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => { setSelectedInventory(i); setUsageForm({ quantity: 0, project_id: projectId, issue_type: "SITE" }); setIsUsageModalOpen(true); }} className="px-4 py-2 bg-rose-50 text-rose-600 hover:text-white hover:bg-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Record Usage</button>
                                                </td>
                                            </tr>
                                        )) : activeTab === "Transfers" ? paginatedTransfers.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{t.material?.name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{t.from_project?.name || `Project #${t.from_project?.id}`}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{t.to_project?.name || `Project #${t.to_project?.id}`}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-center">{t.quantity}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : t.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{t.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.created_at || Date.now()).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => { handleViewTransfer(t.id); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => { setSelectedTransfer(t); setUpdateTransferForm({ status: t.status as TransferStatus, remarks: t.remarks || "" }); setIsUpdateTransferOpen(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-all">Update Status</button>
                                                </td>
                                            </tr>
                                        )) : paginatedTransactions.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[9px] font-bold ${t.type === 'PURCHASE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{t.type}</span></td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{t.material_name || `Mat-${t.material_id}`}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-center">{t.quantity}</td>
                                                <td className="px-6 py-4 text-sm text-right">{formatINR(t.rate)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-right">{formatINR(t.total_amount)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{t.issue_type}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                        {renderPagination(activeTab === "Usage" ? filteredInventory.length : activeTab === "Transfers" ? filteredTransfers.length : filteredTransactions.length)}
                    </div>
                </div>
            </PageTransition>

            {/* Modals */}
            {/* Usage Modal */}
            <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title="Record Material Usage" maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsUsageModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="usage-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Syncing..." : "Add Usage"}</button></>}>
                <form id="usage-form" onSubmit={handleUsageSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Usage Details</h3>
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 mb-4"><p className="text-sm font-bold text-rose-800">{selectedInventory?.material_name}</p><p className="text-xs text-rose-600">Available: {selectedInventory?.remaining_stock} {selectedInventory?.unit}</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Project *</label><select required value={usageForm.project_id} onChange={e => setUsageForm({ ...usageForm, project_id: Number(e.target.value) })} className={inputClasses}>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>
                            <div><label className={labelClasses}>Quantity *</label><input type="number" required value={usageForm.quantity || ""} onChange={e => setUsageForm({ ...usageForm, quantity: Number(e.target.value) })} className={inputClasses} max={selectedInventory?.remaining_stock} /></div>
                            <div><label className={labelClasses}>Issue Type *</label><select required value={usageForm.issue_type} onChange={e => setUsageForm({ ...usageForm, issue_type: e.target.value })} className={inputClasses}>{ISSUE_TYPES.map(i => <option key={i}>{i}</option>)}</select></div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Create Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Initiate Transfer" maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="transfer-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Processing..." : "Create Transfer"}</button></>}>
                <form id="transfer-form" onSubmit={handleTransferSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Transfer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Material *</label><select required value={transferForm.material_id || ""} onChange={e => setTransferForm({ ...transferForm, material_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Material</option>{inventory.map(i => <option key={i.material_id} value={i.material_id}>{i.material_name}</option>)}</select></div>
                            <div><label className={labelClasses}>From Project *</label><select required value={transferForm.from_project_id || ""} onChange={e => setTransferForm({ ...transferForm, from_project_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Origin</option>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>
                            <div><label className={labelClasses}>To Project *</label><select required value={transferForm.to_project_id || ""} onChange={e => setTransferForm({ ...transferForm, to_project_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Destination</option>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>
                            <div><label className={labelClasses}>Quantity *</label><input type="number" required value={transferForm.quantity || ""} onChange={e => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })} className={inputClasses} /></div>
                            <div className="md:col-span-2"><label className={labelClasses}>Remarks</label><textarea value={transferForm.remarks || ""} onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })} className={inputClasses} rows={2} /></div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Update Transfer Modal */}
            <Modal isOpen={isUpdateTransferOpen} onClose={() => setIsUpdateTransferOpen(false)} title="Update Transfer Status" maxWidth="max-w-xl" footer={<><button type="button" onClick={() => setIsUpdateTransferOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="update-transfer-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Updating..." : "Update"}</button></>}>
                <form id="update-transfer-form" onSubmit={handleUpdateTransfer} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Status Details</h3>
                        <div className="space-y-4">
                            <div><label className={labelClasses}>Transfer ID *</label><input type="text" readOnly value={selectedTransfer?.id || ""} className={`${inputClasses} bg-slate-50 text-slate-500 font-medium`} /></div>
                            <div><label className={labelClasses}>Status *</label><select required value={updateTransferForm.status} onChange={e => setUpdateTransferForm({ ...updateTransferForm, status: e.target.value as TransferStatus })} className={inputClasses}>{TRANSFER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Transfer Modal */}
            <Modal isOpen={isViewTransferModalOpen} onClose={() => setIsViewTransferModalOpen(false)} title="Transfer Details" maxWidth="max-w-xl" footer={<button type="button" onClick={() => setIsViewTransferModalOpen(false)} className="px-6 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">Close</button>}>
                {viewTransferDetails && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transfer ID</p><p className="text-sm font-bold text-slate-800">#{viewTransferDetails.id}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p><p className="text-sm font-bold text-slate-800">{new Date(viewTransferDetails.created_at || Date.now()).toLocaleString()}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p><p className="text-sm font-bold text-slate-800">{viewTransferDetails.material?.name}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</p><p className="text-sm font-bold text-slate-800">{viewTransferDetails.quantity}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From Project</p><p className="text-sm font-bold text-slate-800">{viewTransferDetails.from_project?.name}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To Project</p><p className="text-sm font-bold text-slate-800">{viewTransferDetails.to_project?.name}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p><span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border inline-block ${viewTransferDetails.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : viewTransferDetails.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{viewTransferDetails.status}</span></div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialConsumptionPage;
