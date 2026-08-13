import { useState, useEffect, useMemo } from "react";
import Navbar from "../../../../components/common/Navbar";
import PageTransition from "../../../../components/common/PageTransition";
import Modal from "../../../../components/common/Modal";
import ConfirmModal from "../../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    Plus, ShoppingCart, Eye, Edit2, Trash2, Search, RotateCcw,
    ChevronLeft, ChevronRight, TrendingUp, Activity,
    AlertTriangle
} from "lucide-react";
import { materialService, type MaterialItem, type Supplier, type PurchaseOrder, type InventorySummary, type PriceHistory, type MaterialLog, type IssueType, type RateType } from "../../../../services/materialService";
import { projectService } from "../../../../services/projectService";
import { masterService } from "../../../../services/masterService";
import { boqService } from "../../../../services/boqService";
import { useProject } from "../../../../context/ProjectContext";

const CATEGORIES = ["Construction", "Electrical", "Plumbing", "Finishing", "Other"];
const UNITS = ["Bags", "Kg", "Ton", "Litre", "Nos", "Sqft", "Rft", "Cum"];
const RATE_TYPES = ["FIXED", "VARIABLE"];
const ISSUE_TYPES = ["SYSTEM", "SITE", "DAMAGE", "LOSS", "VENDOR", "TRANSFER", "ADJUSTMENT", "PURCHASE"] as IssueType[];

type TabType = "Materials" | "Suppliers" | "Purchase Orders" | "Dashboard";

const MaterialReceiptPage = () => {
    const formatINR = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(amount));
    };

    const [activeTab, setActiveTab] = useState<TabType>("Dashboard");
    const { selectedProjectId, setSelectedProjectId } = useProject();
    const projectId = selectedProjectId || 0;
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data States
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [alerts, setAlerts] = useState<MaterialItem[]>([]);
    const [inventoryValue, setInventoryValue] = useState(0);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [masterUnits, setMasterUnits] = useState<any[]>([]);

    // Modal Specific Data
    const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
    const [transactions, setTransactions] = useState<MaterialLog[]>([]);
    const [supplierMaterials, setSupplierMaterials] = useState<MaterialItem[]>([]);
    const [boqs, setBoqs] = useState<any[]>([]);

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal Visibility States
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

    useEffect(() => {

        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                setProjectsList(Array.isArray(res) ? res : (res.items || res.data || []));
            } catch (err) { }
        };
        fetchProjects();

        const fetchUnits = async () => {
            try {
                const res = await masterService.getEntities("units");
                setMasterUnits(Array.isArray(res) ? res : ((res as any).items || (res as any).data || []));
            } catch (err) { }
        };
        fetchUnits();
        const fetchMasterMaterials = async () => {
            try {
                const res = await masterService.getEntities("materials");
                setMasterMaterials(Array.isArray(res) ? res : ((res as any).items || (res as any).data || []));
            } catch (err) { }
        };
        fetchMasterMaterials();
    }, []);


    const [isViewMaterialOpen, setIsViewMaterialOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
    const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isViewSupplierOpen, setIsViewSupplierOpen] = useState(false);

    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [isViewPOOpen, setIsViewPOOpen] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Selected Items for Modals
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'material' | 'supplier' | 'po', id: number } | null>(null);

    const [masterMaterials, setMasterMaterials] = useState<any[]>([]);

    // Forms
    const [materialForm, setMaterialForm] = useState<Partial<MaterialItem>>({ category: "Construction", unit: "Bags", rate_type: "FIXED" });
    const [purchaseForm, setPurchaseForm] = useState<any>({ quantity: 0, rate: 0, project_id: 1, supplier_id: 0, boq_item_id: undefined });
    const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({});
    const [poForm, setPoForm] = useState<Partial<PurchaseOrder>>({});

    // Fetch Methods
    const fetchMaterials = async (pId: number = projectId) => {
        setIsLoading(true);
        try {
            const raw = await materialService.listMaterials(pId || undefined, 0, 500);
            const data: MaterialItem[] = Array.isArray(raw) ? raw : ((raw as any)?.items || (raw as any)?.data || []);
            // Sort by id descending so newest is first
            setMaterials(data.sort((a: any, b: any) => (b.id || b.material_id || 0) - (a.id || a.material_id || 0)));
        }
        catch (e) { toast.error("Failed to load materials"); }
        finally { setIsLoading(false); }
    };

    const fetchSuppliers = async (pId: number = projectId) => {
        setIsLoading(true);
        try {
            const raw = await materialService.getSuppliers(pId || undefined);
            const data: Supplier[] = Array.isArray(raw) ? raw : ((raw as any)?.items || (raw as any)?.data || []);
            setSuppliers(data);
        }
        catch (e) { toast.error("Failed to load suppliers"); }
        finally { setIsLoading(false); }
    };

    const fetchPOs = async (pId: number = projectId) => {
        setIsLoading(true);
        try {
            const raw = await materialService.listPurchaseOrders(pId || undefined, 0, 500);
            const data: PurchaseOrder[] = Array.isArray(raw) ? raw : ((raw as any)?.items || (raw as any)?.data || []);
            setPurchaseOrders(data);
        }
        catch (e) { toast.error("Failed to load POs"); }
        finally { setIsLoading(false); }
    };

    const fetchDashboard = async (pId: number = projectId) => {
        setIsLoading(true);
        try {
            const [sum, val, al] = await Promise.all([
                materialService.getMaterialSummary(pId),
                materialService.getInventoryValuation(pId),
                materialService.getMaterialAlerts(200, pId)
            ]);
            setSummary(sum);
            setInventoryValue(val.total_value);
            setAlerts(al);
        } catch (e) { toast.error("Failed to load dashboard data"); }
        finally { setIsLoading(false); }
    };

    const fetchBoqs = async (pId: number = projectId) => {
        try {
            const data = await boqService.getBoqs({ project_id: pId, limit: 100, skip: 0 } as any);
            setBoqs(data.items || []);
        } catch (e) {
            console.error("Failed to load BOQs", e);
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
        setCurrentPage(1);
        if (activeTab === "Materials") { fetchMaterials(projectId); fetchSuppliers(projectId); fetchDashboard(projectId); }
        else if (activeTab === "Suppliers") fetchSuppliers(projectId);
        else if (activeTab === "Purchase Orders") { fetchPOs(projectId); fetchSuppliers(projectId); fetchMaterials(projectId); fetchBoqs(projectId); }
        else if (activeTab === "Dashboard") fetchDashboard(projectId);
    }, [activeTab, projectId]);

    // Derived Data
    const filteredMaterials = useMemo(() => materials.filter(m => m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || m.material_code?.toLowerCase().includes(searchTerm.toLowerCase())), [materials, searchTerm]);
    const paginatedMaterials = useMemo(() => filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredMaterials, currentPage, itemsPerPage]);

    const filteredSuppliers = useMemo(() => suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())), [suppliers, searchTerm]);
    const paginatedSuppliers = useMemo(() => filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredSuppliers, currentPage, itemsPerPage]);

    const filteredPOs = useMemo(() => purchaseOrders.filter(p => p.material_name.toLowerCase().includes(searchTerm.toLowerCase())), [purchaseOrders, searchTerm]);
    const paginatedPOs = useMemo(() => filteredPOs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredPOs, currentPage, itemsPerPage]);

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary";

    // ─── CRUD Handlers ──────────────────────────────────────────────
    const handleMaterialSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (selectedMaterial) await materialService.updateMaterial(selectedMaterial.id, materialForm);
            else await materialService.createMaterial({ ...materialForm, project_id: materialForm.project_id || projectId } as any);
            toast.success(selectedMaterial ? "Material updated!" : "Material added successfully!");
            setIsMaterialModalOpen(false); fetchMaterials();
        } catch (e) { toast.error("Operation failed"); }
        finally { setIsSubmitting(false); }
    };

    const handleRecordPurchase = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedMaterial) return; setIsSubmitting(true);
        try {
            await materialService.createPurchaseOrder({
                supplier_id: purchaseForm.supplier_id || selectedMaterial.supplier_id,
                project_id: purchaseForm.project_id || projectId || 1,
                material_id: selectedMaterial.id,
                boq_item_id: purchaseForm.boq_item_id,
                quantity: purchaseForm.quantity,
                rate: purchaseForm.rate
            });
            toast.success("Purchase recorded as a Purchase Order!");
            setIsPurchaseModalOpen(false); fetchPOs();
        } catch (e) { toast.error("Failed to record purchase"); }
        finally { setIsSubmitting(false); }
    };

    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Front-end validations
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(supplierForm.name || "")) {
            return toast.error("Supplier name must contain only letters and spaces.");
        }
        if (!nameRegex.test(supplierForm.contactPerson || "")) {
            return toast.error("Contact person must contain only letters and spaces.");
        }
        if (!/^[0-9]{10}$/.test(supplierForm.contact || "")) {
            return toast.error("Phone number must be exactly 10 digits.");
        }
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        if (!gstRegex.test(supplierForm.gst || "")) {
            return toast.error("Invalid GST Number format. e.g. 27ABCDE1234F1Z5");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: supplierForm.name,
                contactPerson: supplierForm.contactPerson,
                contact: supplierForm.contact,
                gst: supplierForm.gst,
                address: supplierForm.address || ""
            };

            if (selectedSupplier) {
                await materialService.updateSupplier(selectedSupplier.id, payload);
            } else {
                await materialService.createSupplier(payload);
            }
            toast.success(selectedSupplier ? "Supplier updated!" : "Supplier added!");
            setIsSupplierModalOpen(false);
            fetchSuppliers();
        } catch (error: any) {
            console.error("Supplier submit error:", error.response?.data || error.message);
            toast.error(error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || "Operation failed");
        }
        finally { setIsSubmitting(false); }
    };

    const handlePOSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (selectedPO) await materialService.updatePurchaseOrder(selectedPO.id, poForm);
            else await materialService.createPurchaseOrder({ ...poForm, project_id: projectId, supplier_id: poForm.supplier_id!, material_id: poForm.material_id!, quantity: poForm.quantity!, rate: poForm.rate! });
            toast.success(selectedPO ? "PO updated!" : "Purchase Order created!");
            setIsPOModalOpen(false); fetchPOs();
        } catch (e) { toast.error("Operation failed"); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return; setIsSubmitting(true);
        try {
            if (deleteTarget.type === 'material') await materialService.deleteMaterial(deleteTarget.id);
            if (deleteTarget.type === 'supplier') await materialService.deleteSupplier(deleteTarget.id);
            if (deleteTarget.type === 'po') await materialService.deletePurchaseOrder(deleteTarget.id);
            toast.success(`${deleteTarget.type} deleted!`);
            setIsDeleteModalOpen(false);
            if (deleteTarget.type === 'material') fetchMaterials();
            if (deleteTarget.type === 'supplier') fetchSuppliers();
            if (deleteTarget.type === 'po') fetchPOs();
        } catch (e) { toast.error("Failed to delete"); }
        finally { setIsSubmitting(false); }
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
            <Navbar title="Material Receipt" breadcrumb={["Engineer", "Material Management", "Receipt & Masters"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ─── Header ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Material Management
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Manage materials, suppliers, purchase orders and inventory
                        </p>
                    </div>
                    {activeTab === "Materials" && (
                        <button onClick={() => { setSelectedMaterial(null); setMaterialForm({ category: "Construction", unit: "Bags", rate_type: "FIXED", quantity_purchased: 0, payment_given: 0 }); if (suppliers.length === 0) fetchSuppliers(projectId); setIsMaterialModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> Add Material
                        </button>
                    )}
                    {activeTab === "Suppliers" && (
                        <button onClick={() => { setSelectedSupplier(null); setSupplierForm({}); setIsSupplierModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> Add Supplier
                        </button>
                    )}
                    {activeTab === "Purchase Orders" && (
                        <button onClick={() => {
                            setSelectedPO(null);
                            setPoForm({ project_id: projectId });
                            // Ensure materials and suppliers are loaded before opening
                            if (materials.length === 0 && projectId) fetchMaterials(projectId);
                            if (suppliers.length === 0 && projectId) fetchSuppliers(projectId);
                            if (boqs.length === 0 && projectId) fetchBoqs(projectId);
                            setIsPOModalOpen(true);
                        }} className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> Create PO
                        </button>
                    )}
                </div>

                {/* Tabs & Project Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit max-w-full overflow-x-auto scrollbar-none">
                        {(["Dashboard", "Materials", "Suppliers", "Purchase Orders"] as TabType[]).map(tab => (
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

                {/* Dashboard Tab */}
                {activeTab === "Dashboard" && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Stats</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {[
                                    {
                                        title: "Total Materials",
                                        value: summary?.total_materials.toString() || "0",
                                        sub: "Registered items",
                                        accent: "text-slate-800",
                                    },
                                    {
                                        title: "Inventory Value",
                                        value: formatINR(inventoryValue),
                                        sub: "Total stock valuation",
                                        accent: "text-blue-500",
                                    },
                                    {
                                        title: "Pending Payments",
                                        value: formatINR(summary?.total_pending_payments),
                                        sub: "Amount due",
                                        accent: "text-rose-500",
                                    },
                                    {
                                        title: "Low Stock Alerts",
                                        value: alerts.length.toString(),
                                        sub: "Items below threshold",
                                        accent: "text-amber-500",
                                    },
                                ].map((s) => (
                                    <div
                                        key={s.title}
                                        className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-default hover:scale-[1.01]`}
                                    >
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                            {s.title}
                                        </p>
                                        <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                            {s.sub}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Alerts</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Material Alerts</h3>
                                {isLoading ? <p className="text-sm text-slate-400">Loading...</p> : alerts.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {alerts.map(a => (
                                            <div key={a.id} className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-slate-800">{a.material_name} <span className="text-xs text-slate-400 font-normal">({a.material_code})</span></p>
                                                    <p className="text-sm text-slate-600 mt-1">Stock: {a.remaining_stock} {a.unit}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-lg border border-rose-200">
                                                    {a.alert_type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-slate-400">No active alerts.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Lists with Search */}
                {activeTab !== "Dashboard" && (
                    <div className="space-y-4 h-full flex flex-col min-h-0">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Data Register</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                            <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                                    <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                </div>
                                <button onClick={() => activeTab === "Materials" ? fetchMaterials(projectId) : activeTab === "Suppliers" ? fetchSuppliers(projectId) : fetchPOs(projectId)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                            </div>
                            <div className="flex-1 overflow-auto scrollbar-thin">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0">
                                        {activeTab === "Materials" && (
                                            <tr>
                                                <th className="px-6 py-4">Name</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Unit</th>
                                                <th className="px-6 py-4 text-center">Stock</th><th className="px-6 py-4 text-center">Min Level</th><th className="px-6 py-4 text-right">Rate</th>
                                                <th className="px-6 py-4">Alert</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        )}
                                        {activeTab === "Suppliers" && (
                                            <tr>
                                                <th className="px-6 py-4">Supplier Name</th><th className="px-6 py-4">Contact Person</th>
                                                <th className="px-6 py-4">Phone/Email</th><th className="px-6 py-4">GST Number</th><th className="px-6 py-4">Address</th><th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        )}
                                        {activeTab === "Purchase Orders" && (
                                            <tr>
                                                <th className="px-6 py-4">Material</th>
                                                <th className="px-6 py-4 text-center">Qty</th><th className="px-6 py-4 text-right">Rate</th><th className="px-6 py-4 text-right">Total</th>
                                                <th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? <tr><td colSpan={10} className="p-8 text-center text-slate-400">Loading...</td></tr> :
                                            activeTab === "Materials" ? paginatedMaterials.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{m.material_name}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{m.category}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{m.unit_name || m.unit}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-center">{m.remaining_stock}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 text-center">{m.minimum_stock_level}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(m.purchase_rate)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${m.alert_type === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : m.alert_type === 'LOW_STOCK' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{m.alert_type.replace(/_/g, ' ')}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{m.supplier_name}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullM = await materialService.getMaterial(m.id);
                                                                    setSelectedMaterial(fullM);
                                                                    setIsViewMaterialOpen(true);
                                                                } catch (e) { toast.error("Failed to load details"); }
                                                            }} className="p-1.5 text-slate-400 hover:text-primary rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullM = await materialService.getMaterial(m.id);
                                                                    setSelectedMaterial(fullM);
                                                                    setMaterialForm(fullM);
                                                                    setIsMaterialModalOpen(true);
                                                                } catch (e) { toast.error("Failed to load details"); }
                                                            }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => { setSelectedMaterial(m); setPurchaseForm({ quantity: 0, rate: m.purchase_rate, project_id: projectId, supplier_id: m.supplier_id }); setIsPurchaseModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg" title="Purchase"><ShoppingCart className="w-4 h-4" /></button>
                                                            <button onClick={async () => {
                                                                try {
                                                                    setSelectedMaterial(m);
                                                                    const res = await materialService.getTransactions(m.id);
                                                                    setTransactions(res || []);
                                                                    setIsTransactionsOpen(true);
                                                                } catch (e) { toast.error("Failed to load transactions"); }
                                                            }} className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg" title="Transactions"><Activity className="w-4 h-4" /></button>
                                                            <button onClick={async () => {
                                                                try {
                                                                    setSelectedMaterial(m);
                                                                    const res = await materialService.getPriceHistory(m.id);
                                                                    setPriceHistory(res || []);
                                                                    setIsPriceHistoryOpen(true);
                                                                } catch (e) { toast.error("Failed to load price history"); }
                                                            }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg" title="Price History"><TrendingUp className="w-4 h-4" /></button>
                                                            <button onClick={() => { setDeleteTarget({ type: 'material', id: m.id }); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : activeTab === "Suppliers" ? paginatedSuppliers.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{s.name}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{s.contactPerson}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{s.contact}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{s.gst || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{s.address || '-'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullS = await materialService.getSupplier(s.id);
                                                                    setSelectedSupplier(fullS);
                                                                    const mats = await materialService.getSupplierMaterials(fullS.id);
                                                                    setSupplierMaterials(mats || []);
                                                                    setIsViewSupplierOpen(true);
                                                                } catch (e) { toast.error("Failed to load supplier details"); }
                                                            }} className="p-1.5 text-slate-400 hover:text-primary rounded-lg" title="View Supplier"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={() => { setSelectedSupplier(s); setSupplierForm(s); setIsSupplierModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => { setDeleteTarget({ type: 'supplier', id: s.id }); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : paginatedPOs.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{p.material_name}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-center">{p.quantity}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-800 text-right">{formatINR(p.rate)}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(p.total_amount)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.status === 'CREATED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{p.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullPO = await materialService.getPurchaseOrder(p.id);
                                                                    setSelectedPO(fullPO);
                                                                    setIsViewPOOpen(true);
                                                                } catch (e) { toast.error("Failed to load PO details"); }
                                                            }} className="p-1.5 text-slate-400 hover:text-primary rounded-lg" title="View PO"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={() => { setSelectedPO(p); setPoForm(p); setIsPOModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => { setDeleteTarget({ type: 'po', id: p.id }); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(activeTab === "Materials" ? filteredMaterials.length : activeTab === "Suppliers" ? filteredSuppliers.length : filteredPOs.length)}
                        </div>
                    </div>
                )}
            </PageTransition>

            {/* Modals */}
            {/* Modal A & B: Add/Edit Material */}
            <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title={selectedMaterial ? "Edit Material" : "Add Material"} maxWidth="max-w-4xl" footer={<><button type="button" onClick={() => setIsMaterialModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="material-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : "Save Material"}</button></>}>
                <form id="material-form" onSubmit={handleMaterialSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!selectedMaterial && <div><label className={labelClasses}>Project *</label><select required value={materialForm.project_id || projectId} onChange={e => setMaterialForm({ ...materialForm, project_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Project</option>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>}
                            <div><label className={labelClasses}>Material Master *</label><select required value={materialForm.material_master_id || ""} onChange={e => { const mId = Number(e.target.value); const mat = masterMaterials.find(m => m.id === mId); setMaterialForm({ ...materialForm, material_master_id: mId, material_name: mat ? (mat.title || mat.name || mat.material_name || materialForm.material_name) : materialForm.material_name }); }} className={inputClasses}><option value="">Select Master Material</option>{masterMaterials.map(m => <option key={m.id} value={m.id}>{m.title || m.name || m.material_name}</option>)}</select></div>
                            <div><label className={labelClasses}>Material Name *</label><input required value={materialForm.material_name || ""} onChange={e => setMaterialForm({ ...materialForm, material_name: e.target.value })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Category *</label><select required value={materialForm.category} onChange={e => setMaterialForm({ ...materialForm, category: e.target.value })} className={inputClasses}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                            <div><label className={labelClasses}>Unit *</label><select required value={materialForm.unit} onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })} className={inputClasses}>{(masterUnits.length > 0 ? masterUnits.map(u => u.name) : UNITS).map(u => <option key={u}>{u}</option>)}</select></div>
                            <div><label className={labelClasses}>Supplier *</label><select required value={materialForm.supplier_id || ""} onChange={e => setMaterialForm({ ...materialForm, supplier_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Pricing & Inventory</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Purchase Rate *</label><input type="number" required value={materialForm.purchase_rate || ""} onChange={e => setMaterialForm({ ...materialForm, purchase_rate: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Rate Type *</label><select required value={materialForm.rate_type} onChange={e => setMaterialForm({ ...materialForm, rate_type: e.target.value as RateType })} className={inputClasses}>{RATE_TYPES.map(r => <option key={r}>{r}</option>)}</select></div>
                            {!selectedMaterial && (
                                <>
                                    <div><label className={labelClasses}>Qty Purchased *</label><input type="number" required value={materialForm.quantity_purchased || ""} onChange={e => setMaterialForm({ ...materialForm, quantity_purchased: Number(e.target.value) })} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Payment Given *</label><input type="number" required value={materialForm.payment_given || ""} onChange={e => setMaterialForm({ ...materialForm, payment_given: Number(e.target.value) })} className={inputClasses} /></div>
                                </>
                            )}
                            <div><label className={labelClasses}>Min Stock Level *</label><input type="number" required value={materialForm.minimum_stock_level || ""} onChange={e => setMaterialForm({ ...materialForm, minimum_stock_level: Number(e.target.value) })} className={inputClasses} /></div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal C: View Material */}
            <Modal isOpen={isViewMaterialOpen} onClose={() => setIsViewMaterialOpen(false)} title="Material Details" maxWidth="max-w-3xl">
                {selectedMaterial && (
                    <div className="p-6 space-y-6">
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{selectedMaterial.material_master_name || selectedMaterial.material_name}</h3>
                                <p className="text-sm font-bold text-slate-500">{selectedMaterial.material_code} • {selectedMaterial.category}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border ${selectedMaterial.alert_type === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedMaterial.alert_type === 'LOW_STOCK' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {selectedMaterial.alert_type?.replace(/_/g, ' ')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">General Info</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project</p><p className="font-bold text-slate-700">{projectsList.find(p => p.id === selectedMaterial.project_id)?.project_name || `Project #${selectedMaterial.project_id}`}</p></div>
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</p><p className="font-bold text-slate-700">{selectedMaterial.supplier_name || `ID: ${selectedMaterial.supplier_id}`}</p></div>
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit</p><p className="font-bold text-slate-700">{selectedMaterial.unit_name || selectedMaterial.unit}</p></div>
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min. Stock</p><p className="font-bold text-slate-700">{selectedMaterial.minimum_stock_level}</p></div>
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Master Name</p><p className="font-bold text-slate-700">{selectedMaterial.material_master_name || 'N/A'}</p></div>
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand</p><p className="font-bold text-slate-700">{selectedMaterial.material_master_brand || 'General'}</p></div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Stock Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purchased</p><p className="font-bold text-slate-700">{selectedMaterial.quantity_purchased}</p></div>
                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Used</p><p className="font-bold text-slate-700">{selectedMaterial.quantity_used || 0}</p></div>
                                    <div className="col-span-2 bg-blue-50 p-3 rounded-xl border border-blue-100 flex justify-between items-center"><p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Remaining</p><p className="font-black text-lg text-blue-700">{selectedMaterial.remaining_stock} {selectedMaterial.unit}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Financials</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate ({selectedMaterial.rate_type})</p><p className="font-bold text-slate-700">{formatINR(selectedMaterial.purchase_rate)}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p><p className="font-bold text-slate-700">{formatINR(selectedMaterial.total_amount)}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Given</p><p className="font-bold text-emerald-600">{formatINR(selectedMaterial.payment_given)}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending / Extra</p><p className={`font-bold ${(selectedMaterial.payment_pending ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{(selectedMaterial.payment_pending ?? 0) > 0 ? `Pending: ${formatINR(selectedMaterial.payment_pending)}` : `Extra: ${formatINR(selectedMaterial.extra_paid || 0)}`}</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal D: Record Purchase */}
            <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Record Purchase" maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="purchase-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : "Save Purchase"}</button></>}>
                <form id="purchase-form" onSubmit={handleRecordPurchase} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">New Purchase Request</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>quantity *</label><input type="number" required value={purchaseForm.quantity || ""} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>rate *</label><input type="number" required value={purchaseForm.rate || ""} onChange={e => setPurchaseForm({ ...purchaseForm, rate: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>amount_paid *</label><input type="number" required value={purchaseForm.amount_paid || ""} onChange={e => setPurchaseForm({ ...purchaseForm, amount_paid: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>project_id *</label><select required value={purchaseForm.project_id || projectId} onChange={e => setPurchaseForm({ ...purchaseForm, project_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Project</option>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>
                            <div className="md:col-span-2"><label className={labelClasses}>issue_type *</label><select required value={purchaseForm.issue_type} onChange={e => setPurchaseForm({ ...purchaseForm, issue_type: e.target.value as IssueType })} className={inputClasses}>{ISSUE_TYPES.map(i => <option key={i}>{i}</option>)}</select></div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal E: Price History */}
            <Modal isOpen={isPriceHistoryOpen} onClose={() => setIsPriceHistoryOpen(false)} title={`Price History - ${selectedMaterial?.material_name}`} maxWidth="max-w-lg">
                <div className="p-4">
                    <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Date</th><th className="p-3 text-right">Rate</th></tr></thead><tbody className="divide-y divide-slate-100">
                        {priceHistory.map((ph, i) => <tr key={i}> <td className="p-3">{new Date(ph.date).toLocaleString()}</td><td className="p-3 text-right font-bold">{formatINR(ph.rate)}</td></tr>)}
                        {priceHistory.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-slate-400">No history found</td></tr>}
                    </tbody></table>
                </div>
            </Modal>

            {/* Modal F: Transactions */}
            <Modal isOpen={isTransactionsOpen} onClose={() => setIsTransactionsOpen(false)} title={`Transactions - ${selectedMaterial?.material_name}`} maxWidth="max-w-4xl">
                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Rate</th><th className="p-3 text-right">Amount</th><th className="p-3">Issue Type</th></tr></thead><tbody className="divide-y divide-slate-100">
                        {transactions.map((t, i) => <tr key={i}>
                            <td className="p-3">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="p-3"><span className={`px-2 py-1 rounded text-[9px] font-bold ${t.type === 'PURCHASE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{t.type}</span></td>
                            <td className="p-3 text-center font-bold">{t.quantity}</td><td className="p-3 text-right">{formatINR(t.rate)}</td><td className="p-3 text-right">{formatINR(t.total_amount)}</td><td className="p-3">{t.issue_type}</td>
                        </tr>)}
                        {transactions.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-400">No transactions found</td></tr>}
                    </tbody></table>
                </div>
            </Modal>

            {/* Modal G & H: Add/Edit Supplier */}
            <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={selectedSupplier ? "Edit Supplier" : "Add Supplier"} maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="supplier-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : "Save Supplier"}</button></>}>
                <form id="supplier-form" onSubmit={handleSupplierSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Supplier Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Supplier Name *</label><input required value={supplierForm.name || ""} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })} className={inputClasses} placeholder="E.g. BuildTech Supplies" /></div>
                            <div><label className={labelClasses}>Contact Person *</label><input required value={supplierForm.contactPerson || ""} onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value.replace(/[^a-zA-Z\s]/g, '') })} className={inputClasses} placeholder="E.g. Rajesh Kumar" /></div>
                            <div><label className={labelClasses}>Phone Number * <span className="text-rose-400 text-[9px] normal-case font-normal ml-1">(exactly 10 digits)</span></label><input required type="tel" maxLength={10} value={supplierForm.contact || ""} onChange={e => setSupplierForm({ ...supplierForm, contact: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={inputClasses} placeholder="E.g. 9876543210" /></div>
                            <div><label className={labelClasses}>GST Number *</label><input required value={supplierForm.gst || ""} onChange={e => setSupplierForm({ ...supplierForm, gst: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15) })} className={inputClasses} placeholder="E.g. 27ABCDE1234F1Z5" /></div>
                            <div className="md:col-span-2"><label className={labelClasses}>Address</label><textarea value={supplierForm.address || ""} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} className={inputClasses} rows={3} /></div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal I: View Supplier */}
            <Modal isOpen={isViewSupplierOpen} onClose={() => setIsViewSupplierOpen(false)} title="Supplier Details" maxWidth="max-w-3xl">
                {selectedSupplier && (
                    <div className="p-6 space-y-6">
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{selectedSupplier.name}</h3>
                                <p className="text-sm font-bold text-slate-500">GST: {selectedSupplier.gst || "N/A"}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Person</p><p className="font-bold text-slate-700">{selectedSupplier.contactPerson || '-'}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone / Email</p><p className="font-bold text-slate-700">{selectedSupplier.contact || '-'}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p><p className="font-bold text-slate-700">{selectedSupplier.address || '-'}</p></div>
                            </div>
                        </div>


                    </div>
                )}
            </Modal>

            {/* Modal J & L: Add/Edit PO */}
            <Modal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title={selectedPO ? "Edit PO" : "Create PO"} maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsPOModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="po-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : "Save PO"}</button></>}>
                <form id="po-form" onSubmit={handlePOSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Purchase Order Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Project *</label><select required value={poForm.project_id || projectId} onChange={e => setPoForm({ ...poForm, project_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Project</option>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>
                            <div>
                                <label className={labelClasses}>Supplier *</label>
                                <select
                                    required
                                    value={poForm.supplier_id || ""}
                                    onChange={e => {
                                        const newSupplierId = Number(e.target.value);
                                        setPoForm({
                                            ...poForm,
                                            supplier_id: newSupplierId,
                                            material_id: (poForm.material_id && materials.find(m => m.id === poForm.material_id)?.supplier_id !== newSupplierId) ? undefined : poForm.material_id
                                        });
                                    }}
                                    className={inputClasses}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Material *</label>
                                <select
                                    required
                                    value={poForm.material_id || ""}
                                    onChange={e => {
                                        const materialId = Number(e.target.value);
                                        const selectedMat = materials.find(m => m.id === materialId);
                                        setPoForm({
                                            ...poForm,
                                            material_id: materialId,
                                            rate: selectedMat ? selectedMat.purchase_rate : poForm.rate
                                        });
                                    }}
                                    className={inputClasses}
                                >
                                    <option value="">Select Material</option>
                                    {materials
                                        .filter(m => !poForm.supplier_id || m.supplier_id === poForm.supplier_id)
                                        .map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>BOQ Item</label>
                                <select
                                    value={poForm.boq_item_id || ""}
                                    onChange={e => setPoForm({ ...poForm, boq_item_id: Number(e.target.value) || undefined })}
                                    className={inputClasses}
                                >
                                    <option value="">Select BOQ</option>
                                    {boqs.map(b => (
                                        <option key={b.id || b.boq_item_id} value={b.id || b.boq_item_id}>
                                            {b.item_name || b.description || `BOQ Item #${b.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div><label className={labelClasses}>Quantity *</label><input type="number" required value={poForm.quantity || ""} onChange={e => setPoForm({ ...poForm, quantity: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Rate *</label><input type="number" required value={poForm.rate || ""} onChange={e => setPoForm({ ...poForm, rate: Number(e.target.value) })} className={inputClasses} /></div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center md:col-span-2">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                                <span className="font-black text-2xl text-purple-600">{formatINR((poForm.quantity || 0) * (poForm.rate || 0))}</span>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal K: View PO */}
            <Modal isOpen={isViewPOOpen} onClose={() => setIsViewPOOpen(false)} title="Purchase Order Intelligence" maxWidth="max-w-3xl">
                {selectedPO && (
                    <div className="p-6 space-y-6">
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">PO-{selectedPO.id}</h3>
                                <p className="text-sm font-bold text-slate-500">Project: {projectsList.find(p => p.id === selectedPO.project_id)?.project_name || `Proj-${selectedPO.project_id}`} &bull; Supplier: {suppliers.find(s => s.id === selectedPO.supplier_id)?.name || `Supp-${selectedPO.supplier_id}`}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${selectedPO.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPO.status === 'CREATED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    {selectedPO.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Order Specifics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p><p className="font-bold text-slate-700">{selectedPO.material_name || `Mat-${selectedPO.material_id}`}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</p><p className="font-bold text-blue-600">{selectedPO.quantity}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Rate</p><p className="font-bold text-slate-700">{formatINR(selectedPO.rate)}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p><p className="font-black text-purple-600">{formatINR(selectedPO.total_amount)}</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal M: Delete Confirm */}
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title={`Delete ${deleteTarget?.type}`} message="Are you sure? This cannot be undone." confirmText="Delete" type="danger" isLoading={isSubmitting} />
        </>
    );
};

export default MaterialReceiptPage;
