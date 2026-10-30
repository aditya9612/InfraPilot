import { useState, useEffect, useMemo } from "react";
import Navbar from "../../../../components/common/Navbar";
import PageTransition from "../../../../components/common/PageTransition";
import Modal from "../../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Search, RotateCcw, ChevronLeft, ChevronRight,
    ArrowRightLeft, Eye, AlertTriangle
} from "lucide-react";
import { materialService, type InventoryItem, type Transfer, type MaterialLog, type IssueType, type TransferStatus } from "../../../../services/materialService";
import { projectService } from "../../../../services/projectService";
import { boqService } from "../../../../services/boqService";
import { useProject } from "../../../../context/ProjectContext";
import { CustomSelect } from "../../../../components/common/CustomDropdown";

type TabType = "Usage" | "Transfers" | "Transactions";
const ISSUE_TYPES = ["SYSTEM", "SITE", "DAMAGE", "LOSS", "VENDOR", "TRANSFER", "ADJUSTMENT", "PURCHASE"];

const MaterialConsumptionPage = () => {
    const { selectedProjectId: globalProjectId, setSelectedProjectId, assignedProjects } = useProject();
    const formatINR = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(amount));
    };

    const [activeTab, setActiveTab] = useState<TabType>("Usage");
    const projectId = Number(globalProjectId) || 0;
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);

    // Data
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [transactions, setTransactions] = useState<MaterialLog[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [tasksList, setTasksList] = useState<any[]>([]);
    const [boqsList, setBoqsList] = useState<any[]>([]);
    const [allMaterialsList, setAllMaterialsList] = useState<any[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [selectedIssueType, setSelectedIssueType] = useState<string>("");

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Modal States
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isUpdateTransferOpen, setIsUpdateTransferOpen] = useState(false);
    const [isViewTransferModalOpen, setIsViewTransferModalOpen] = useState(false);
    const [viewTransferDetails, setViewTransferDetails] = useState<Transfer | null>(null);

    // Forms & Selected Items
    const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);


    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

    const [usageForm, setUsageForm] = useState<any>({ quantity: "", project_id: projectId, issue_type: "SITE", task_id: 0, boq_item_id: 0 });
    const [usageErrors, setUsageErrors] = useState<{ project_id?: string; quantity?: string; issue_type?: string }>({});
    const [transferForm, setTransferForm] = useState<Partial<{ material_id: number; from_project_id: number; to_project_id: number; quantity: number; remarks: string; transport_mode: string; vehicle_number: string }>>({ from_project_id: projectId });
    const [updateTransferForm, setUpdateTransferForm] = useState({ status: "DELIVERED" as TransferStatus, remarks: "" });

    // Fetch methods
    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const data = await materialService.getProjectInventory(projectId || undefined);
            setInventory(Array.isArray(data) ? data : []);
        } catch (e) {
            console.warn("Failed to load inventory", e);
            setInventory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransfers = async () => {
        setIsLoading(true);
        try { const data = await materialService.listTransfers(0, 500, projectId || undefined); setTransfers(data.data || data.items || data); }
        catch (e) { toast.error("Failed to load transfers"); }
        finally { setIsLoading(false); }
    };

    const fetchAllMaterials = async () => {
        try {
            const data = await materialService.listMaterials(projectId || undefined, 0, 500);
            setAllMaterialsList(Array.isArray(data) ? data : ((data as any).items || (data as any).data || []));
        } catch (e) { console.error("Failed to fetch all materials", e); }
    };

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (projectId && Number(projectId) > 0) params.project_id = Number(projectId);
            if (selectedMaterialId) params.material_id = Number(selectedMaterialId);
            const data = await materialService.getLogs(params);
            setTransactions(data as any);
        }
        catch (e) { toast.error("Failed to load transactions"); }
        finally { setIsLoading(false); }
    };

    const fetchTasksAndBoqs = async () => {
        if (!projectId || Number(projectId) <= 0) {
            setTasksList([]);
            setBoqsList([]);
            return;
        }
        try {
            const [tasksRes, boqsRes] = await Promise.all([
                projectService.getTasks(projectId, { limit: 100, offset: 0 }).catch(() => ({ items: [] })),
                boqService.getBoqs({ project_id: projectId, limit: 100, skip: 0 } as any).catch(() => ({ items: [] }))
            ]);
            setTasksList(Array.isArray(tasksRes) ? tasksRes : (tasksRes.items || tasksRes.data || []));
            setBoqsList(boqsRes.items || []);
        } catch (e) {
            console.error("Failed to fetch tasks or boqs", e);
        }
    };

    const handleProjectChange = (id: number) => {
        const newProjectId = id === 0 ? null : id;
        setSelectedProjectId(newProjectId);
        if (newProjectId) {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    const selectedProjObj = projectsList.find(p => Number(p.id) === newProjectId);
                    parsed.project_id = newProjectId;
                    parsed.default_project_id = newProjectId;
                    if (selectedProjObj) parsed.project_name = selectedProjObj.project_name || selectedProjObj.name;
                    if (parsed.user) {
                        parsed.user.project_id = newProjectId;
                        if (selectedProjObj) parsed.user.project_name = selectedProjObj.project_name || selectedProjObj.name;
                    }
                    localStorage.setItem("infrapilot_user", JSON.stringify(parsed));
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (e) { }
        } else {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    parsed.project_id = null;
                    if (parsed.user) parsed.user.project_id = null;
                    localStorage.setItem("infrapilot_user", JSON.stringify(parsed));
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (e) { }
        }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                let assigned: any[] = (assignedProjects && assignedProjects.length > 0) ? assignedProjects : [];
                if (assigned.length === 0) {
                    const userStr = localStorage.getItem("infrapilot_user");
                    if (userStr) {
                        const parsed = JSON.parse(userStr);
                        assigned = parsed.assigned_projects || parsed.user?.assigned_projects || [];
                        if (assigned.length === 0 && (parsed.project_id || parsed.user?.project_id)) {
                            const pid = parsed.project_id || parsed.user?.project_id;
                            const pname = parsed.project_name || parsed.user?.project_name;
                            assigned = [{ id: pid, project_name: pname || `Project #${pid}` }];
                        }
                    }
                }
                if (assigned.length === 0) {
                    const res = await projectService.getProjects(100, 0);
                    assigned = Array.isArray(res) ? res : (res.items || res.data || []);
                }
                setProjectsList(assigned);
            } catch (err) { }
        };
        fetchProjects();
    }, [assignedProjects]);

    useEffect(() => {
        const fetchFormTasks = async () => {
            if (!usageForm.project_id || !isUsageModalOpen) return;
            try {
                const [tasksRes, boqsRes] = await Promise.all([
                    projectService.getTasks(usageForm.project_id, { limit: 100, offset: 0 }).catch(() => ({ items: [] })),
                    boqService.getBoqs({ project_id: usageForm.project_id, limit: 100, skip: 0 } as any).catch(() => ({ items: [] }))
                ]);
                setTasksList(Array.isArray(tasksRes) ? tasksRes : ((tasksRes as any).items || (tasksRes as any).data || []));
                setBoqsList(Array.isArray(boqsRes) ? boqsRes : ((boqsRes as any).items || (boqsRes as any).data || []));
            } catch (e) {
                console.error("Failed to fetch form tasks", e);
            }
        };
        fetchFormTasks();
    }, [usageForm.project_id, isUsageModalOpen]);

    useEffect(() => {
        setCurrentPage(1);
        if (activeTab === "Usage") { fetchInventory(); fetchTasksAndBoqs(); }
        else if (activeTab === "Transfers") fetchTransfers();
        else if (activeTab === "Transactions") { fetchTransactions(); fetchInventory(); fetchAllMaterials(); }
    }, [activeTab, projectId, selectedMaterialId, selectedIssueType]);

    // Derived Data
    const filteredInventory = useMemo(() => {
        const list = inventory.filter(i => i.material_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return [...list].sort((a: any, b: any) => {
            const timeA = a.updated_at || a.created_at ? new Date(a.updated_at || a.created_at).getTime() : (Number(a.material_id || a.id) || 0);
            const timeB = b.updated_at || b.created_at ? new Date(b.updated_at || b.created_at).getTime() : (Number(b.material_id || b.id) || 0);
            return sortOrder === "latest" ? (timeB - timeA) : (timeA - timeB);
        });
    }, [inventory, searchTerm, sortOrder]);
    const paginatedInventory = useMemo(() => filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredInventory, currentPage, itemsPerPage]);

    const filteredTransfers = useMemo(() => {
        const list = transfers.filter(t => t.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(t.id).includes(searchTerm));
        return [...list].sort((a: any, b: any) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : Number(a.id || 0);
            const timeB = b.created_at ? new Date(b.created_at).getTime() : Number(b.id || 0);
            return sortOrder === "latest" ? (timeB - timeA) : (timeA - timeB);
        });
    }, [transfers, searchTerm, sortOrder]);
    const paginatedTransfers = useMemo(() => filteredTransfers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredTransfers, currentPage, itemsPerPage]);

    const filteredTransactions = useMemo(() => {
        const list = transactions.filter(t => (t.type.toLowerCase().includes(searchTerm.toLowerCase()) || (t.issue_type || '').toLowerCase().includes(searchTerm.toLowerCase())) && (selectedIssueType ? t.issue_type === selectedIssueType || t.type === selectedIssueType : true));
        return [...list].sort((a: any, b: any) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : Number(a.id || 0);
            const timeB = b.created_at ? new Date(b.created_at).getTime() : Number(b.id || 0);
            return sortOrder === "latest" ? (timeB - timeA) : (timeA - timeB);
        });
    }, [transactions, searchTerm, selectedIssueType, sortOrder]);
    const paginatedTransactions = useMemo(() => filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredTransactions, currentPage, itemsPerPage]);

    // Unique materials for Transactions filter and Initiate Transfer dropdowns
    const uniqueMaterials = useMemo(() => {
        const seen = new Set<number>();
        return inventory.filter(m => {
            if (!m.material_id || seen.has(m.material_id)) return false;
            seen.add(m.material_id);
            return true;
        });
    }, [inventory]);

    const transferMaterialOptions = useMemo(() => {
        const map = new Map<number, { id: string; label: string; remaining: number; unit: string }>();
        inventory.forEach(i => {
            if (!i.material_id) return;
            if (!map.has(i.material_id)) {
                const unitStr = (i as any).unit_name || i.unit || '';
                const stockStr = i.remaining_stock !== undefined ? ` (Available: ${i.remaining_stock}${unitStr ? ' ' + unitStr : ''})` : '';
                map.set(i.material_id, {
                    id: i.material_id.toString(),
                    label: `${i.material_name}${stockStr}`,
                    remaining: Number(i.remaining_stock || 0),
                    unit: unitStr
                });
            }
        });
        return Array.from(map.values());
    }, [inventory]);

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = "w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary";

    // Handlers
    const handleUsageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);

        const errors: { project_id?: string; quantity?: string; issue_type?: string } = {};
        if (!usageForm.project_id) errors.project_id = "Project is required.";
        if (usageForm.quantity === "" || usageForm.quantity === undefined || usageForm.quantity === null || Number(usageForm.quantity) <= 0) {
            errors.quantity = "Quantity must be greater than 0.";
        } else if (selectedInventory && Number(usageForm.quantity) > selectedInventory.remaining_stock) {
            errors.quantity = `Quantity cannot exceed available stock (${selectedInventory.remaining_stock}).`;
        }
        if (!usageForm.issue_type) errors.issue_type = "Issue Type is required.";

        const totalRequiredFields = 3; // project_id, quantity, issue_type
        const missingCount = Object.keys(errors).length;

        if (missingCount > 0) {
            setUsageErrors(errors);
            // Rule 3: generic toast only when all required fields are blank
            if (missingCount >= totalRequiredFields) {
                toast.error("Please fill in all mandatory fields.");
            }
            // Keep the popup open!
            setIsUsageModalOpen(true);
            return;
        }

        setUsageErrors({});
        if (!selectedInventory) return;
        setIsSubmitting(true);
        try {
            const payload = { ...usageForm, quantity: Number(usageForm.quantity), issue_type: usageForm.issue_type as IssueType };
            if (!payload.task_id) delete payload.task_id;
            if (!payload.boq_item_id) delete payload.boq_item_id;
            await materialService.recordUsage(selectedInventory.material_id, payload);
            toast.success("Usage recorded successfully!");
            setIsUsageModalOpen(false);
            fetchInventory();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to record usage");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);

        const missingFields: string[] = [];
        if (!transferForm.material_id) missingFields.push("Material");
        if (!transferForm.quantity || transferForm.quantity <= 0) missingFields.push("Quantity");
        if (!transferForm.to_project_id) missingFields.push("Destination Project");
        if (!transferForm.transport_mode?.trim()) missingFields.push("Transport Mode");
        if (!transferForm.vehicle_number?.trim()) missingFields.push("Vehicle Number");

        if (missingFields.length > 0) {
            setFormNotification({
                type: 'error',
                message: 'Please fill all mandatory fields.',
                fields: missingFields
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await materialService.createTransfer({ ...transferForm } as any);
            setFormNotification({ type: 'success', message: "Transfer initiated!" });
            setTimeout(() => setFormNotification(null), 3000);
            setIsTransferModalOpen(false); fetchTransfers();
        } catch (e: any) {
            const rawMsg = e.response?.data?.detail || e.response?.data?.message || "Failed to update transfer";
            const errorMsg = typeof rawMsg === 'string' ? rawMsg : (Array.isArray(rawMsg) ? rawMsg.map((m: any) => m.msg || m.message || JSON.stringify(m)).join(', ') : "Failed to update transfer");
            setFormNotification({ type: 'error', message: typeof errorMsg === 'string' ? errorMsg : "Failed to create transfer" });
        }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);

        if (!updateTransferForm.status) {
            setFormNotification({ type: 'error', message: 'Please select a status', fields: ["Status"] });
            return;
        }

        if (selectedTransfer?.status === 'COMPLETED') {
            setFormNotification({ type: 'error', message: 'Transfer is already completed and cannot be modified.' });
            return;
        }

        if (!selectedTransfer) return;
        setIsSubmitting(true);
        try {
            await materialService.updateTransferStatus(selectedTransfer.id, updateTransferForm.status);
            setFormNotification({ type: 'success', message: "Transfer updated!" });
            setTimeout(() => setFormNotification(null), 3000);
            setIsUpdateTransferOpen(false); fetchTransfers();
        } catch (e: any) {
            const rawMsg = e.response?.data?.detail || e.response?.data?.message || "Failed to update transfer";
            const errorMsg = typeof rawMsg === 'string' ? rawMsg : (Array.isArray(rawMsg) ? rawMsg.map((m: any) => m.msg || m.message || JSON.stringify(m)).join(', ') : "Failed to update transfer");
            setFormNotification({ type: 'error', message: typeof errorMsg === 'string' ? errorMsg : "Failed to update transfer" });
        }
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
            {/* Top-right floating toast */}
            {formNotification && (
                <div
                    style={{
                        position: 'fixed',
                        top: '18px',
                        right: '18px',
                        zIndex: 99999999,
                        padding: '16px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        minWidth: '320px',
                        maxWidth: '400px',
                        border: `1px solid ${formNotification.type === 'error' ? '#fecaca' : '#a7f3d0'}`
                    }}
                    className="animate-fade-in-up"
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        <span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
                        {formNotification.type === 'error' && formNotification.fields && formNotification.fields.length > 0
                            ? `Mandatory fields required: ${(formNotification.fields || []).join(', ')}`
                            : formNotification.message}
                    </p>
                    <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
                </div>
            )}

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
                            <option value={0}>All Projects</option>
                            {projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-4 h-full flex flex-col min-h-0">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Consumption Logs</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab.toLowerCase()}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0 ml-auto">
                                <select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as "latest" | "oldest");
                                        setCurrentPage(1);
                                    }}
                                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 shadow-sm"
                                    title="Sort by latest or oldest"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                {activeTab === "Transactions" && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Material:</span>
                                            <select
                                                value={selectedMaterialId}
                                                onChange={e => setSelectedMaterialId(e.target.value)}
                                                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 shadow-sm max-w-[200px] truncate"
                                            >
                                                <option value="">All Materials</option>
                                                {uniqueMaterials.map(m => (
                                                    <option key={m.material_id} value={m.material_id} className="truncate">{m.material_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <select
                                            value={selectedIssueType}
                                            onChange={e => setSelectedIssueType(e.target.value)}
                                            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 shadow-sm w-36"
                                        >
                                            <option value="">All Issue Types</option>
                                            {ISSUE_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                                <button
                                    onClick={activeTab === "Usage" ? fetchInventory : activeTab === "Transfers" ? fetchTransfers : fetchTransactions}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm bg-white"
                                    title="Refresh"
                                >
                                    <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
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
                                            <th className="px-6 py-4 text-center">Qty</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4">Created At</th><th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    )}
                                    {activeTab === "Transactions" && (
                                        <tr>
                                            <th className="px-6 py-4">Date</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Material</th><th className="px-6 py-4 text-center">Qty</th>
                                            <th className="px-6 py-4 text-right">Rate</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-right">Amount Paid</th><th className="px-6 py-4">Issue Type</th>
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
                                                    <button onClick={() => { setSelectedInventory(i); setUsageForm({ quantity: "", project_id: projectId, issue_type: "SITE" }); setUsageErrors({}); setFormNotification(null); setIsUsageModalOpen(true); }} className="px-4 py-2 bg-rose-50 text-rose-600 hover:text-white hover:bg-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Record Usage</button>
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
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => { handleViewTransfer(t.id); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => { setSelectedTransfer(t); setUpdateTransferForm({ status: t.status === 'PENDING' ? '' as TransferStatus : t.status as TransferStatus, remarks: t.remarks || "" }); setIsUpdateTransferOpen(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-all">Update Status</button>
                                                </td>
                                            </tr>
                                        )) : paginatedTransactions.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[9px] font-bold ${t.type === 'PURCHASE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{t.type}</span></td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{inventory.find(m => m.material_id === t.material_id)?.material_name || allMaterialsList.find(m => m.id === t.material_id || m.material_id === t.material_id)?.material_name || t.material_name || `Mat-${t.material_id}`}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-center">{t.quantity}</td>
                                                <td className="px-6 py-4 text-sm text-right">{formatINR(t.rate)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-right">{formatINR(t.total_amount)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatINR((t as any).amount_paid ?? 0)}</td>
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
            <Modal isOpen={isUsageModalOpen} onClose={() => { setIsUsageModalOpen(false); setUsageErrors({}); setFormNotification(null); }} title="Record Material Usage" maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => { setIsUsageModalOpen(false); setUsageErrors({}); setFormNotification(null); }} className="px-6 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50">Cancel</button><button form="usage-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Syncing..." : "Add Usage"}</button></>}>
                <form id="usage-form" onSubmit={handleUsageSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Usage Details</h3>
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 mb-4"><p className="text-sm font-bold text-rose-800">{selectedInventory?.material_name}</p><p className="text-xs text-rose-600">Available: {selectedInventory?.remaining_stock} {selectedInventory?.unit}</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                                <select
                                    required
                                    value={usageForm.project_id || ""}
                                    onChange={e => {
                                        setUsageForm({ ...usageForm, project_id: Number(e.target.value) });
                                        if (usageErrors.project_id) setUsageErrors(prev => ({ ...prev, project_id: undefined }));
                                    }}
                                    className={`${inputClasses} ${usageErrors.project_id ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/20' : ''}`}
                                >
                                    <option value="">Select Project</option>
                                    {projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}
                                </select>
                                {usageErrors.project_id && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{usageErrors.project_id}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Task Name</label>
                                <select value={usageForm.task_id || ""} onChange={e => setUsageForm({ ...usageForm, task_id: Number(e.target.value) || 0 })} className={inputClasses}>
                                    <option value="">Select Task (Optional)</option>
                                    {tasksList.map(t => <option key={t.id} value={t.id}>{t.title || t.task_name || t.name || `Task #${t.id}`}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>BOQ Item</label>
                                <select value={usageForm.boq_item_id || ""} onChange={e => setUsageForm({ ...usageForm, boq_item_id: Number(e.target.value) || 0 })} className={inputClasses}>
                                    <option value="">Select BOQ (Optional)</option>
                                    {boqsList.map(b => <option key={b.id || b.boq_item_id} value={b.id || b.boq_item_id}>{b.item_name || b.description || `BOQ Item #${b.id}`}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Quantity <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    value={usageForm.quantity}
                                    onChange={e => {
                                        setUsageForm({ ...usageForm, quantity: e.target.value === '' ? '' : Number(e.target.value) });
                                        if (usageErrors.quantity) setUsageErrors(prev => ({ ...prev, quantity: undefined }));
                                    }}
                                    className={`${inputClasses} ${usageErrors.quantity || (selectedInventory && Number(usageForm.quantity) > selectedInventory.remaining_stock) ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/20' : ''}`}
                                />
                                {usageErrors.quantity && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{usageErrors.quantity}</p>}
                                {!usageErrors.quantity && selectedInventory && Number(usageForm.quantity) > selectedInventory.remaining_stock && (
                                    <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">Cannot exceed available stock ({selectedInventory.remaining_stock}).</p>
                                )}
                                {!usageErrors.quantity && usageForm.quantity !== "" && Number(usageForm.quantity) <= 0 && (
                                    <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">Quantity must be greater than 0.</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Issue Type <span className="text-rose-500">*</span></label>
                                <select
                                    required
                                    value={usageForm.issue_type || ""}
                                    onChange={e => {
                                        setUsageForm({ ...usageForm, issue_type: e.target.value });
                                        if (usageErrors.issue_type) setUsageErrors(prev => ({ ...prev, issue_type: undefined }));
                                    }}
                                    className={`${inputClasses} ${usageErrors.issue_type ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/20' : ''}`}
                                >
                                    <option value="">Select Issue Type</option>
                                    {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                                {usageErrors.issue_type && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{usageErrors.issue_type}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Create Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Initiate Transfer" maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50">Cancel</button><button form="transfer-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Processing..." : "Create Transfer"}</button></>}>
                <form id="transfer-form" onSubmit={handleTransferSubmit} className="space-y-6">
                    {/* Inline Validation Error Banner */}
                    {formNotification && formNotification.type === 'error' && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-red-600">{formNotification.fields && formNotification.fields.length > 0 ? "Validation Error" : "Error"}</p>
                                <p className="text-xs text-red-500 mt-0.5">{formNotification.fields && formNotification.fields.length > 0 ? `Mandatory fields required: ${formNotification.fields.join(', ')}` : formNotification.message}</p>
                            </div>
                            <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                        </div>
                    )}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm min-h-[380px]">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Transfer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="z-[61]">
                                <CustomSelect
                                    label="From Project"
                                    required
                                    value={transferForm.from_project_id?.toString() || ""}
                                    onChange={(val) => setTransferForm({ ...transferForm, from_project_id: Number(val) })}
                                    options={[
                                        { id: "", label: "Select Origin" },
                                        ...projectsList.map(p => ({
                                            id: p.id.toString(),
                                            label: p.project_name || `Project #${p.id}`
                                        }))
                                    ]}
                                    placeholder="Select Origin"
                                    error={formNotification?.fields?.includes("From Project")}
                                    maxHeight="max-h-48"
                                    searchable={true}
                                />
                                {formNotification?.fields?.includes("From Project") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div className="z-[60]">
                                <CustomSelect
                                    label="To Project"
                                    required
                                    value={transferForm.to_project_id?.toString() || ""}
                                    onChange={(val) => setTransferForm({ ...transferForm, to_project_id: Number(val) })}
                                    options={[
                                        { id: "", label: "Select Destination" },
                                        ...projectsList
                                            .filter(p => !transferForm.from_project_id || p.id !== transferForm.from_project_id)
                                            .map(p => ({
                                                id: p.id.toString(),
                                                label: p.project_name || `Project #${p.id}`
                                            }))
                                    ]}
                                    placeholder="Select Destination"
                                    error={formNotification?.fields?.includes("To Project")}
                                    maxHeight="max-h-48"
                                    searchable={true}
                                />
                                {formNotification?.fields?.includes("To Project") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div className="z-[59]">
                                <CustomSelect
                                    label="Material"
                                    required
                                    value={transferForm.material_id?.toString() || ""}
                                    onChange={(val) => setTransferForm({ ...transferForm, material_id: Number(val) })}
                                    options={[
                                        { id: "", label: "Select Material" },
                                        ...transferMaterialOptions
                                    ]}
                                    placeholder="Select Material"
                                    error={formNotification?.fields?.includes("Material")}
                                    maxHeight="max-h-48"
                                    searchable={true}
                                />
                                {formNotification?.fields?.includes("Material") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Quantity <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Enter quantity"
                                    value={transferForm.quantity || ""}
                                    onChange={e => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Remarks (Optional)</label>
                                <textarea
                                    value={transferForm.remarks || ""}
                                    onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })}
                                    placeholder="Add any transfer notes or dispatch instructions..."
                                    className={inputClasses}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Update Transfer Modal */}
            <Modal
                isOpen={isUpdateTransferOpen}
                onClose={() => setIsUpdateTransferOpen(false)}
                title="Update Transfer Status"
                maxWidth="max-w-xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsUpdateTransferOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            form="update-transfer-form"
                            type="submit"
                            disabled={isSubmitting || selectedTransfer?.status === 'COMPLETED'}
                            className="px-8 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Updating..." : "Update Status"}
                        </button>
                    </>
                }
            >
                <form id="update-transfer-form" onSubmit={handleUpdateTransfer} className="space-y-5">
                    {selectedTransfer?.status === 'COMPLETED' && (
                        <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>This transfer has already been completed and cannot be modified.</span>
                        </div>
                    )}
                    {/* Inline Validation Error Banner */}
                    {formNotification && formNotification.type === 'error' && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-red-600">{formNotification.fields && formNotification.fields.length > 0 ? "Validation Error" : "Error"}</p>
                                <p className="text-xs text-red-500 mt-0.5">{formNotification.fields && formNotification.fields.length > 0 ? `Mandatory fields required: ${formNotification.fields.join(', ')}` : formNotification.message}</p>
                            </div>
                            <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                        </div>
                    )}

                    {/* Transfer Summary Card */}
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transfer Record</span>
                                <span className="text-sm font-bold text-slate-800">#{selectedTransfer?.id}</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${selectedTransfer?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedTransfer?.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : selectedTransfer?.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                {selectedTransfer?.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Material</span>
                                <span className="font-bold text-slate-800 text-sm truncate block">{selectedTransfer?.material?.name || '-'}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Quantity</span>
                                <span className="font-bold text-blue-600 text-sm block">{selectedTransfer?.quantity} {(selectedTransfer?.material as any)?.unit || ''}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">From Project</span>
                                <span className="font-bold text-slate-700 truncate block">{selectedTransfer?.from_project?.name || '-'}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">To Project</span>
                                <span className="font-bold text-slate-700 truncate block">{selectedTransfer?.to_project?.name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Update Controls */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Update Status Details</h3>
                        <div>
                            <label className={labelClasses}>Status <span className="text-rose-500">*</span></label>
                            <select
                                required
                                value={updateTransferForm.status}
                                onChange={(e) => setUpdateTransferForm({ ...updateTransferForm, status: e.target.value as TransferStatus })}
                                disabled={selectedTransfer?.status === 'COMPLETED'}
                                className={`${inputClasses} font-semibold text-slate-700`}
                            >
                                <option value="" disabled>Select Status</option>
                                <option value="PENDING">PENDING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Remarks (Optional)</label>
                            <textarea
                                value={updateTransferForm.remarks || ""}
                                onChange={(e) => setUpdateTransferForm({ ...updateTransferForm, remarks: e.target.value })}
                                placeholder="Add any comments or inspection details..."
                                disabled={selectedTransfer?.status === 'COMPLETED'}
                                className={inputClasses}
                                rows={2}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Transfer Modal */}
            <Modal isOpen={isViewTransferModalOpen} onClose={() => setIsViewTransferModalOpen(false)} title="Transfer Details" maxWidth="max-w-xl" footer={<button type="button" onClick={() => setIsViewTransferModalOpen(false)} className="px-6 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">Close</button>}>
                {viewTransferDetails && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p><p className="text-sm font-bold text-slate-800">{new Date(viewTransferDetails.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(viewTransferDetails.created_at || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p></div>
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
