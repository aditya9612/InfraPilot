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
import { CustomSelect } from "../../../../components/common/CustomDropdown";


const RATE_TYPES = ["FIXED", "PER_UNIT", "PER_KG", "PER_TON", "PER_BAG"];
const ISSUE_TYPES = ["SYSTEM", "SITE", "DAMAGE", "LOSS", "VENDOR", "TRANSFER", "ADJUSTMENT", "PURCHASE"] as IssueType[];

const getApiErrorMessage = (error: any, defaultMessage: string = "Operation failed") => {
    if (typeof error?.response?.data?.detail === 'string') return error.response.data.detail;
    return error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.message || defaultMessage;
};

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
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);

    // Data States
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [alerts, setAlerts] = useState<MaterialItem[]>([]);
    const [inventoryValue, setInventoryValue] = useState(0);
    const [projectsList, setProjectsList] = useState<any[]>([]);


    // Modal Specific Data
    const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
    const [transactions, setTransactions] = useState<MaterialLog[]>([]);

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
        if (!pId || Number(pId) <= 0) { setBoqs([]); return; }
        try {
            let items: any[] = [];
            // 1. Try getBoqItems (project items)
            try {
                const bItems = await boqService.getBoqItems(Number(pId));
                const list = Array.isArray(bItems) ? bItems : (bItems as any)?.items || (bItems as any)?.boq_items || (bItems as any)?.data || [];
                if (list.length > 0) items = list;
            } catch (err) { }

            // 2. Try getBoqsByProject
            if (items.length === 0) {
                try {
                    const byProj = await boqService.getBoqsByProject(Number(pId));
                    const list = Array.isArray(byProj) ? byProj : (byProj as any)?.items || (byProj as any)?.boq_items || (byProj as any)?.data || [];
                    if (list.length > 0) items = list;
                } catch (err) { }
            }

            // 3. Try getBoqs with project_id filter and unwrap nested items
            if (items.length === 0) {
                try {
                    const data = await boqService.getBoqs({ project_id: Number(pId), limit: 100, skip: 0 } as any);
                    const raw = Array.isArray(data) ? data : (data?.items || (data as any)?.data || []);
                    const flattened = raw.flatMap((b: any) => {
                        if (Array.isArray(b?.items) && b.items.length > 0) return b.items;
                        if (Array.isArray(b?.boq_items) && b.boq_items.length > 0) return b.boq_items;
                        return [b];
                    });
                    if (flattened.length > 0) items = flattened;
                } catch (err) { }
            }

            // 4. Fallback to global getBoqs
            if (items.length === 0) {
                try {
                    const allBoqs = await boqService.getBoqs({ limit: 100 } as any);
                    const raw = Array.isArray(allBoqs) ? allBoqs : (allBoqs?.items || (allBoqs as any)?.data || []);
                    const matching = raw.filter((b: any) => Number(b.project_id) === Number(pId));
                    const flattened = (matching.length > 0 ? matching : raw).flatMap((b: any) => {
                        if (Array.isArray(b?.items) && b.items.length > 0) return b.items;
                        if (Array.isArray(b?.boq_items) && b.boq_items.length > 0) return b.boq_items;
                        return [b];
                    });
                    if (flattened.length > 0) items = flattened;
                } catch (err) { }
            }

            setBoqs(items);
        } catch (e) {
            console.error("Failed to load BOQs", e);
            setBoqs([]);
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

    const masterMaterialOptions = useMemo(() => [
        { id: "", label: "Select Master Material" },
        ...masterMaterials.map((m: any) => ({
            id: m.id,
            label: `${m.title || m.name || m.material_name}${m.brand ? ` — ${m.brand}` : ''}`,
            searchKey: `${m.title || m.name || m.material_name} ${m.brand || ''} ${m.category || ''}`
        }))
    ], [masterMaterials]);

    const supplierOptions = useMemo(() => [
        { id: "", label: "Select Supplier" },
        ...suppliers.map(s => ({
            id: s.id,
            label: s.name,
            searchKey: `${s.name} ${s.contact || ''}`
        }))
    ], [suppliers]);

    const projectOptions = useMemo(() => [
        { id: "", label: "Select Project" },
        ...projectsList.map(p => ({
            id: p.id,
            label: p.project_name || `Project #${p.id}`
        }))
    ], [projectsList]);

    const rateTypeOptions = useMemo(() => [
        ...RATE_TYPES.map(r => ({ id: r, label: r }))
    ], []);

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary";
    const supplierLabelClasses = "block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 ml-1";
    const supplierInputClasses = "w-full px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 text-slate-800 text-sm font-medium rounded-xl outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 shadow-sm";

    // ─── CRUD Handlers ──────────────────────────────────────────────
    const handleMaterialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);

        // Validation for mandatory fields
        const missingFields: string[] = [];
        if (!materialForm.project_id && !projectId) missingFields.push("Project");
        if (!materialForm.material_master_id) missingFields.push("Material Master");
        if (!materialForm.supplier_id) missingFields.push("Supplier");
        if (materialForm.purchase_rate === undefined || materialForm.purchase_rate === null || materialForm.purchase_rate === ("" as any) || isNaN(Number(materialForm.purchase_rate))) {
            missingFields.push("Purchase Rate");
        }
        if (!materialForm.rate_type) missingFields.push("Rate Type");
        if (!selectedMaterial) {
            if (materialForm.quantity_purchased === undefined || materialForm.quantity_purchased === null || materialForm.quantity_purchased === ("" as any) || isNaN(Number(materialForm.quantity_purchased))) {
                missingFields.push("Qty Purchased");
            }
            if (materialForm.payment_given === undefined || materialForm.payment_given === null || materialForm.payment_given === ("" as any) || isNaN(Number(materialForm.payment_given))) {
                missingFields.push("Payment Given");
            }
        }
        if (materialForm.minimum_stock_level === undefined || materialForm.minimum_stock_level === null || materialForm.minimum_stock_level === ("" as any) || isNaN(Number(materialForm.minimum_stock_level))) {
            missingFields.push("Min Stock Level");
        }

        if (missingFields.length > 0) {
            setFormNotification({
                type: 'error',
                message: `Please fill in all mandatory fields: ${missingFields.join(', ')}`,
                fields: missingFields
            });
            toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        try {
            if (selectedMaterial) await materialService.updateMaterial(selectedMaterial.id, materialForm);
            else await materialService.createMaterial({ ...materialForm, project_id: materialForm.project_id || projectId } as any);
            toast.success(selectedMaterial ? "Material updated!" : "Material added successfully!");
            setIsMaterialModalOpen(false); fetchMaterials();
        } catch (error: any) { toast.error(getApiErrorMessage(error, "Operation failed")); }
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
        } catch (error: any) { toast.error(getApiErrorMessage(error, "Failed to record purchase")); }
        finally { setIsSubmitting(false); }
    };

    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);

        const name = (supplierForm.name || "").trim();
        const contactPerson = (supplierForm.contactPerson || "").trim();
        const contact = (supplierForm.contact || "").trim();
        const gst = (supplierForm.gst || "").trim();
        const address = (supplierForm.address || "").trim();

        // 1. Mandatory fields check
        const missingFields: string[] = [];
        if (!name) missingFields.push("Supplier Name");
        if (!contactPerson) missingFields.push("Contact Person");
        if (!contact) missingFields.push("Phone Number");
        if (!gst) missingFields.push("GST Number");

        if (missingFields.length > 0) {
            const msg = `Please fill all mandatory fields: ${missingFields.join(', ')}`;
            setFormNotification({
                type: 'error',
                message: msg,
                fields: missingFields
            });
            toast.error(msg);
            return;
        }

        // 2. Format validations
        const invalidFields: string[] = [];
        const errorFields: string[] = [];
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(name)) {
            invalidFields.push("Supplier Name (letters only)");
            errorFields.push("Supplier Name");
        }
        if (!nameRegex.test(contactPerson)) {
            invalidFields.push("Contact Person (letters only)");
            errorFields.push("Contact Person");
        }
        const isPhone = /^[0-9]{10}$/.test(contact);
        if (!isPhone) {
            invalidFields.push("Phone Number (must be 10 digits)");
            errorFields.push("Phone Number");
        }
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        if (!gstRegex.test(gst.toUpperCase())) {
            invalidFields.push("GST Number (format: 27ABCDE1234F1Z5)");
            errorFields.push("GST Number");
        }

        if (invalidFields.length > 0) {
            const msg = `Please correct the following: ${invalidFields.join('; ')}`;
            setFormNotification({
                type: 'error',
                message: msg,
                fields: errorFields
            });
            toast.error(msg);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name,
                contactPerson,
                contact,
                gst: gst.toUpperCase(),
                address
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
            const msg = getApiErrorMessage(error, "Operation failed");
            setFormNotification({ type: 'error', message: msg });
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePOSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (selectedPO) await materialService.updatePurchaseOrder(selectedPO.id, poForm);
            else await materialService.createPurchaseOrder({ ...poForm, project_id: poForm.project_id || projectId || 1, supplier_id: poForm.supplier_id!, material_id: poForm.material_id!, quantity: poForm.quantity!, rate: poForm.rate! });
            toast.success(selectedPO ? "PO updated!" : "Purchase Order created!");
            setIsPOModalOpen(false); fetchPOs();
        } catch (error: any) { toast.error(getApiErrorMessage(error, "Operation failed")); }
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
        } catch (error: any) { toast.error(getApiErrorMessage(error, "Failed to delete")); }
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
                        <button onClick={() => { setSelectedMaterial(null); setFormNotification(null); setMaterialForm({ category: "Construction", unit: "Bags", rate_type: "FIXED", project_id: projectId || undefined }); if (suppliers.length === 0) fetchSuppliers(projectId); setIsMaterialModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> Add Material
                        </button>
                    )}
                    {activeTab === "Suppliers" && (
                        <button onClick={() => { setSelectedSupplier(null); setSupplierForm({}); setFormNotification(null); setIsSupplierModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> Add Supplier
                        </button>
                    )}
                    {activeTab === "Purchase Orders" && (
                        <button onClick={() => {
                            setSelectedPO(null);
                            const defaultPid = projectId || (projectsList.length > 0 ? projectsList[0].id : undefined);
                            setPoForm({ project_id: defaultPid });
                            if (defaultPid) {
                                fetchMaterials(defaultPid);
                                fetchSuppliers(defaultPid);
                                fetchBoqs(defaultPid);
                            }




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
                                    <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                                        {activeTab === "Materials" && (
                                            <tr>
                                                <th className="px-6 py-4">Name</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Unit</th>
                                                <th className="px-6 py-4 text-center">Stock</th><th className="px-6 py-4 text-center">Min Level</th><th className="px-6 py-4 text-right">Rate</th>
                                                <th className="px-6 py-4">Alert</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        )}
                                        {activeTab === "Suppliers" && (
                                            <tr className="bg-slate-100 text-slate-700">
                                                <th className="px-6 py-4 font-bold text-slate-800">Supplier Name</th><th className="px-6 py-4 font-bold text-slate-800">Contact Person</th>
                                                <th className="px-6 py-4 font-bold text-slate-800">Phone</th><th className="px-6 py-4 font-bold text-slate-800">GST Number</th><th className="px-6 py-4 font-bold text-slate-800">Address</th><th className="px-6 py-4 text-right font-bold text-slate-800">Actions</th>
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
                                    <tbody className="divide-y divide-slate-100">
                                        {isLoading ? <tr><td colSpan={10} className="p-8 text-center text-slate-400">Loading...</td></tr> :
                                            activeTab === "Materials" ? paginatedMaterials.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{m.material_name}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.category}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.unit_name || m.unit}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-center">{m.remaining_stock}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-medium">{m.minimum_stock_level}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatINR(m.purchase_rate)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${m.alert_type === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : m.alert_type === 'LOW_STOCK' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{m.alert_type.replace(/_/g, ' ')}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.supplier_name}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullM = await materialService.getMaterial(m.id);
                                                                    setSelectedMaterial(fullM);
                                                                    setIsViewMaterialOpen(true);
                                                                } catch (e) { toast.error("Failed to load details"); }
                                                            }} className="p-1.5 text-slate-500 hover:text-primary rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullM = await materialService.getMaterial(m.id);
                                                                    setSelectedMaterial(fullM);
                                                                    setFormNotification(null);
                                                                    setMaterialForm(fullM);
                                                                    setIsMaterialModalOpen(true);
                                                                } catch (e) { toast.error("Failed to load details"); }
                                                            }} className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => { setSelectedMaterial(m); setPurchaseForm({ quantity: 0, rate: m.purchase_rate, project_id: projectId, supplier_id: m.supplier_id }); if (boqs.length === 0 && projectId) fetchBoqs(projectId); setIsPurchaseModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg" title="Purchase"><ShoppingCart className="w-4 h-4" /></button>
                                                            <button onClick={async () => {
                                                                try {
                                                                    setSelectedMaterial(m);
                                                                    const res = await materialService.getTransactions(m.id);
                                                                    setTransactions(res || []);
                                                                    setIsTransactionsOpen(true);
                                                                } catch (e) { toast.error("Failed to load transactions"); }
                                                            }} className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg" title="Transactions"><Activity className="w-4 h-4" /></button>
                                                            <button onClick={async () => {
                                                                try {
                                                                    setSelectedMaterial(m);
                                                                    const res = await materialService.getPriceHistory(m.id);
                                                                    setPriceHistory(res || []);
                                                                    setIsPriceHistoryOpen(true);
                                                                } catch (e) { toast.error("Failed to load price history"); }
                                                            }} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg" title="Price History"><TrendingUp className="w-4 h-4" /></button>
                                                            <button onClick={() => { setDeleteTarget({ type: 'material', id: m.id }); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : activeTab === "Suppliers" ? paginatedSuppliers.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{s.name}</td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{s.contactPerson}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{s.contact}</td>
                                                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-700">{s.gst || '-'}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{s.address || '-'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={async () => {
                                                                try {
                                                                    const fullS = await materialService.getSupplier(s.id);
                                                                    setSelectedSupplier(fullS);
                                                                    setIsViewSupplierOpen(true);
                                                                } catch (e) { toast.error("Failed to load supplier details"); }
                                                            }} className="p-1.5 text-slate-500 hover:text-primary rounded-lg" title="View Supplier"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={() => { setSelectedSupplier(s); setSupplierForm(s); setFormNotification(null); setIsSupplierModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => { setDeleteTarget({ type: 'supplier', id: s.id }); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
            <Modal isOpen={isMaterialModalOpen} onClose={() => { setIsMaterialModalOpen(false); setFormNotification(null); }} title={selectedMaterial ? "Edit Material" : "Add Material"} maxWidth="max-w-4xl" footer={<><button type="button" onClick={() => { setIsMaterialModalOpen(false); setFormNotification(null); }} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="material-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : "Save Material"}</button></>}>
                <form id="material-form" noValidate onSubmit={handleMaterialSubmit} className="space-y-6">
                    {/* Top Validation Error Banner */}
                    {formNotification && formNotification.type === 'error' && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4 animate-in fade-in duration-200">
                            <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">!</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-red-600">{formNotification.fields && formNotification.fields.length > 0 ? "Validation Error" : "Error"}</p>
                                <p className="text-xs text-red-500 mt-0.5">{formNotification.fields && formNotification.fields.length > 0 ? `Mandatory fields required: ${formNotification.fields.join(', ')}` : formNotification.message}</p>
                            </div>
                            <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                        </div>
                    )}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!selectedMaterial && (
                                <div>
                                    <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                                    <CustomSelect
                                        value={materialForm.project_id || projectId || ""}
                                        onChange={val => {
                                            setMaterialForm(prev => ({ ...prev, project_id: val ? Number(val) : undefined }));
                                            if (formNotification?.fields?.includes("Project")) {
                                                setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Project") } : null);
                                            }
                                        }}
                                        options={projectOptions}
                                        placeholder="Select Project"
                                        searchable={true}
                                        maxHeight="max-h-52"
                                        error={formNotification?.fields?.includes("Project")}
                                    />
                                    {formNotification?.fields?.includes("Project") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                                </div>
                            )}
                            <div>
                                <label className={labelClasses}>Material Master <span className="text-rose-500">*</span></label>
                                <CustomSelect
                                    value={materialForm.material_master_id || ""}
                                    onChange={val => {
                                        const mId = val ? Number(val) : undefined;
                                        const mat = masterMaterials.find(m => m.id === mId);
                                        setMaterialForm(prev => ({
                                            ...prev,
                                            material_master_id: mId,
                                            material_name: mat ? (mat.title || mat.name || mat.material_name || prev.material_name) : prev.material_name
                                        }));
                                        if (formNotification?.fields?.includes("Material Master")) {
                                            setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Material Master") } : null);
                                        }
                                    }}
                                    options={masterMaterialOptions}
                                    placeholder="Select Master Material"
                                    searchable={true}
                                    maxHeight="max-h-52"
                                    error={formNotification?.fields?.includes("Material Master")}
                                />
                                {formNotification?.fields?.includes("Material Master") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>Supplier <span className="text-rose-500">*</span></label>
                                <CustomSelect
                                    value={materialForm.supplier_id || ""}
                                    onChange={val => {
                                        setMaterialForm(prev => ({ ...prev, supplier_id: val ? Number(val) : undefined }));
                                        if (formNotification?.fields?.includes("Supplier")) {
                                            setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Supplier") } : null);
                                        }
                                    }}
                                    options={supplierOptions}
                                    placeholder="Select Supplier"
                                    searchable={true}
                                    maxHeight="max-h-52"
                                    error={formNotification?.fields?.includes("Supplier")}
                                />
                                {formNotification?.fields?.includes("Supplier") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Pricing & Inventory</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Purchase Rate <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    value={materialForm.purchase_rate ?? ""}
                                    onChange={e => {
                                        setMaterialForm({ ...materialForm, purchase_rate: e.target.value === "" ? ("" as any) : Number(e.target.value) });
                                        if (formNotification?.fields?.includes("Purchase Rate")) {
                                            setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Purchase Rate") } : null);
                                        }
                                    }}
                                    className={`${inputClasses} ${formNotification?.fields?.includes("Purchase Rate") ? "!border-rose-500 !bg-rose-50" : ""}`}
                                />
                                {formNotification?.fields?.includes("Purchase Rate") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Rate Type <span className="text-rose-500">*</span></label>
                                <CustomSelect
                                    value={materialForm.rate_type || "FIXED"}
                                    onChange={val => {
                                        setMaterialForm(prev => ({ ...prev, rate_type: val as RateType }));
                                        if (formNotification?.fields?.includes("Rate Type")) {
                                            setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Rate Type") } : null);
                                        }
                                    }}
                                    options={rateTypeOptions}
                                    placeholder="Select Rate Type"
                                    maxHeight="max-h-52"
                                    error={formNotification?.fields?.includes("Rate Type")}
                                />
                                {formNotification?.fields?.includes("Rate Type") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            {!selectedMaterial && (
                                <>
                                    <div>
                                        <label className={labelClasses}>Qty Purchased <span className="text-rose-500">*</span></label>
                                        <input
                                            type="number"
                                            value={materialForm.quantity_purchased ?? ""}
                                            onChange={e => {
                                                setMaterialForm({ ...materialForm, quantity_purchased: e.target.value === "" ? ("" as any) : Number(e.target.value) });
                                                if (formNotification?.fields?.includes("Qty Purchased")) {
                                                    setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Qty Purchased") } : null);
                                                }
                                            }}
                                            className={`${inputClasses} ${formNotification?.fields?.includes("Qty Purchased") ? "!border-rose-500 !bg-rose-50" : ""}`}
                                        />
                                        {formNotification?.fields?.includes("Qty Purchased") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Payment Given <span className="text-rose-500">*</span></label>
                                        <input
                                            type="number"
                                            value={materialForm.payment_given ?? ""}
                                            onChange={e => {
                                                setMaterialForm({ ...materialForm, payment_given: e.target.value === "" ? ("" as any) : Number(e.target.value) });
                                                if (formNotification?.fields?.includes("Payment Given")) {
                                                    setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Payment Given") } : null);
                                                }
                                            }}
                                            className={`${inputClasses} ${formNotification?.fields?.includes("Payment Given") ? "!border-rose-500 !bg-rose-50" : ""}`}
                                        />
                                        {formNotification?.fields?.includes("Payment Given") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                                    </div>
                                </>
                            )}
                            <div>
                                <label className={labelClasses}>Min Stock Level <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    value={materialForm.minimum_stock_level ?? ""}
                                    onChange={e => {
                                        setMaterialForm({ ...materialForm, minimum_stock_level: e.target.value === "" ? ("" as any) : Number(e.target.value) });
                                        if (formNotification?.fields?.includes("Min Stock Level")) {
                                            setFormNotification(prev => prev ? { ...prev, fields: prev.fields?.filter(f => f !== "Min Stock Level") } : null);
                                        }
                                    }}
                                    className={`${inputClasses} ${formNotification?.fields?.includes("Min Stock Level") ? "!border-rose-500 !bg-rose-50" : ""}`}
                                />
                                {formNotification?.fields?.includes("Min Stock Level") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal C: View Material */}
            <Modal
                isOpen={isViewMaterialOpen}
                onClose={() => setIsViewMaterialOpen(false)}
                title="Material Details"
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex justify-end w-full">
                        <button
                            type="button"
                            onClick={() => setIsViewMaterialOpen(false)}
                            className="px-8 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                }
            >
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
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">New Purchase Request</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClasses}>Quantity <span className="text-rose-500">*</span></label><input type="number" required value={purchaseForm.quantity || ""} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Rate <span className="text-rose-500">*</span></label><input type="number" required value={purchaseForm.rate || ""} onChange={e => setPurchaseForm({ ...purchaseForm, rate: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Amount Paid <span className="text-rose-500">*</span></label><input type="number" required value={purchaseForm.amount_paid || ""} onChange={e => setPurchaseForm({ ...purchaseForm, amount_paid: Number(e.target.value) })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Project <span className="text-rose-500">*</span></label><select required value={purchaseForm.project_id || projectId} onChange={e => setPurchaseForm({ ...purchaseForm, project_id: Number(e.target.value) })} className={inputClasses}><option value="">Select Project</option>{projectsList.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}</select></div>
                            <div><label className={labelClasses}>BOQ Item</label><select value={purchaseForm.boq_item_id || ""} onChange={e => setPurchaseForm({ ...purchaseForm, boq_item_id: Number(e.target.value) || undefined })} className={inputClasses}><option value="">Select BOQ</option>{boqs.map(b => <option key={b.id || b.boq_item_id} value={b.id || b.boq_item_id}>{b.item_name || b.description || `BOQ Item #${b.id}`}</option>)}</select></div>
                            <div><label className={labelClasses}>Issue Type <span className="text-rose-500">*</span></label><select required value={purchaseForm.issue_type} onChange={e => setPurchaseForm({ ...purchaseForm, issue_type: e.target.value as IssueType })} className={inputClasses}>{ISSUE_TYPES.map(i => <option key={i}>{i}</option>)}</select></div>
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
            {/* Modal G & H: Add/Edit Supplier */}
            <Modal
                isOpen={isSupplierModalOpen}
                onClose={() => { setIsSupplierModalOpen(false); setFormNotification(null); }}
                title={selectedSupplier ? "Edit Supplier" : "Add Supplier"}
                maxWidth="max-w-2xl"
                footer={<>
                    <button type="button" onClick={() => { setIsSupplierModalOpen(false); setFormNotification(null); }} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                    <button form="supplier-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : (selectedSupplier ? "Update Supplier" : "Save Supplier")}</button>
                </>}
            >
                <form id="supplier-form" noValidate onSubmit={handleSupplierSubmit} className="space-y-6">
                    {/* Inline Validation Error Banner */}
                    {formNotification && formNotification.type === 'error' && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4 animate-in fade-in duration-200">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-red-700">Validation Error</p>
                                <p className="text-xs text-red-600 mt-0.5 font-medium">{formNotification.message}</p>
                            </div>
                            <button type="button" onClick={() => setFormNotification(null)} className="text-red-400 hover:text-red-600 text-lg leading-none p-1">×</button>
                        </div>
                    )}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Supplier Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={supplierLabelClasses}>
                                    Supplier Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    value={supplierForm.name || ""}
                                    onChange={e => {
                                        setSupplierForm({ ...supplierForm, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') });
                                        if (formNotification?.fields?.includes("Supplier Name")) {
                                            const updated = formNotification.fields.filter(f => f !== "Supplier Name");
                                            setFormNotification(updated.length > 0 ? { ...formNotification, fields: updated } : null);
                                        }
                                    }}
                                    className={`${supplierInputClasses} ${formNotification?.fields?.includes("Supplier Name") ? "!border-rose-500 !bg-rose-50/50 ring-2 ring-rose-500/20" : ""}`}
                                    placeholder="E.g. BuildTech Supplies"
                                />
                                {formNotification?.fields?.includes("Supplier Name") && (
                                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Required / Letters only</p>
                                )}
                            </div>

                            <div>
                                <label className={supplierLabelClasses}>
                                    Contact Person <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    value={supplierForm.contactPerson || ""}
                                    onChange={e => {
                                        setSupplierForm({ ...supplierForm, contactPerson: e.target.value.replace(/[^a-zA-Z\s]/g, '') });
                                        if (formNotification?.fields?.includes("Contact Person")) {
                                            const updated = formNotification.fields.filter(f => f !== "Contact Person");
                                            setFormNotification(updated.length > 0 ? { ...formNotification, fields: updated } : null);
                                        }
                                    }}
                                    className={`${supplierInputClasses} ${formNotification?.fields?.includes("Contact Person") ? "!border-rose-500 !bg-rose-50/50 ring-2 ring-rose-500/20" : ""}`}
                                    placeholder="E.g. Rajesh Kumar"
                                />
                                {formNotification?.fields?.includes("Contact Person") && (
                                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Required / Letters only</p>
                                )}
                            </div>

                            <div>
                                <label className={supplierLabelClasses}>
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={supplierForm.contact || ""}
                                    onChange={e => {
                                        setSupplierForm({ ...supplierForm, contact: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) });
                                        if (formNotification?.fields?.includes("Phone Number")) {
                                            const updated = formNotification.fields.filter(f => f !== "Phone Number");
                                            setFormNotification(updated.length > 0 ? { ...formNotification, fields: updated } : null);
                                        }
                                    }}
                                    className={`${supplierInputClasses} ${formNotification?.fields?.includes("Phone Number") ? "!border-rose-500 !bg-rose-50/50 ring-2 ring-rose-500/20" : ""}`}
                                    placeholder="E.g. 9876543210"
                                />
                                {formNotification?.fields?.includes("Phone Number") && (
                                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Required / Exactly 10 digits</p>
                                )}
                            </div>

                            <div>
                                <label className={supplierLabelClasses}>
                                    GST Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    value={supplierForm.gst || ""}
                                    onChange={e => {
                                        setSupplierForm({ ...supplierForm, gst: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15) });
                                        if (formNotification?.fields?.includes("GST Number")) {
                                            const updated = formNotification.fields.filter(f => f !== "GST Number");
                                            setFormNotification(updated.length > 0 ? { ...formNotification, fields: updated } : null);
                                        }
                                    }}
                                    className={`${supplierInputClasses} ${formNotification?.fields?.includes("GST Number") ? "!border-rose-500 !bg-rose-50/50 ring-2 ring-rose-500/20" : ""}`}
                                    placeholder="E.g. 27ABCDE1234F1Z5"
                                />
                                {formNotification?.fields?.includes("GST Number") && (
                                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Required / Format: 27ABCDE1234F1Z5</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className={supplierLabelClasses}>Address</label>
                                <textarea
                                    value={supplierForm.address || ""}
                                    onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                    className={supplierInputClasses}
                                    rows={3}
                                    placeholder="E.g. 123 Industrial Area, Phase 2, Pune"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal I: View Supplier */}
            <Modal
                isOpen={isViewSupplierOpen}
                onClose={() => setIsViewSupplierOpen(false)}
                title="Supplier Details"
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex justify-end w-full">
                        <button
                            type="button"
                            onClick={() => setIsViewSupplierOpen(false)}
                            className="px-8 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                }
            >
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
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</p><p className="font-bold text-slate-700">{selectedSupplier.contact || '-'}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p><p className="font-bold text-slate-700">{selectedSupplier.address || '-'}</p></div>
                            </div>
                        </div>


                    </div>
                )}
            </Modal>

            {/* Modal J & L: Add/Edit PO */}
            <Modal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title={selectedPO ? "Edit PO" : "Create PO"} maxWidth="max-w-2xl" footer={<><button type="button" onClick={() => setIsPOModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">Cancel</button><button form="po-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all flex items-center gap-2 active:scale-95">{isSubmitting ? "Saving..." : "Save PO"}</button></>}>
                <form id="po-form" onSubmit={handlePOSubmit} className="space-y-6">
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
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Purchase Order Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="z-[60]">
                                <CustomSelect
                                    label="Project"
                                    required={true}
                                    error={formNotification?.fields?.includes("Project")}
                                    value={poForm.project_id || projectId || ""}
                                    onChange={(val: any) => {
                                        const pId = val ? Number(val) : undefined;
                                        setPoForm({ ...poForm, project_id: pId, boq_item_id: undefined, material_id: undefined });
                                        if (pId) {
                                            fetchMaterials(pId);
                                            fetchSuppliers(pId);
                                            fetchBoqs(pId);
                                        }
                                    }}
                                    options={[
                                        { id: '', label: 'Select Project' },
                                        ...projectsList.map(p => ({
                                            id: p.id?.toString(),
                                            label: p.project_name || `Project #${p.id}`,
                                            searchKey: p.project_name || `Project #${p.id}`
                                        }))
                                    ]}
                                    placeholder="Select Project"
                                    searchable={projectsList.length > 5}
                                    maxHeight="max-h-48"
                                />
                                {formNotification?.fields?.includes("Project") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div className="z-[59]">
                                <CustomSelect
                                    label="Supplier"
                                    required={true}
                                    error={formNotification?.fields?.includes("Supplier")}
                                    value={poForm.supplier_id ? poForm.supplier_id.toString() : ""}
                                    onChange={(val: any) => {
                                        const newSupplierId = val ? Number(val) : undefined;
                                        setPoForm({
                                            ...poForm,
                                            supplier_id: newSupplierId,
                                            material_id: (poForm.material_id && materials.find(m => m.id === poForm.material_id)?.supplier_id !== newSupplierId) ? undefined : poForm.material_id
                                        });
                                    }}
                                    options={[
                                        { id: '', label: 'Select Supplier' },
                                        ...suppliers.map(s => ({
                                            id: s.id?.toString(),
                                            label: s.name,
                                            searchKey: s.name
                                        }))
                                    ]}
                                    placeholder="Select Supplier"
                                    searchable={suppliers.length > 5}
                                    maxHeight="max-h-48"
                                />
                                {formNotification?.fields?.includes("Supplier") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div className="z-[58]">
                                <CustomSelect
                                    label="Material"
                                    required={true}
                                    error={formNotification?.fields?.includes("Material")}
                                    value={poForm.material_id ? poForm.material_id.toString() : ""}
                                    onChange={(val: any) => {
                                        const materialId = val ? Number(val) : undefined;
                                        const selectedMat = materialId ? materials.find(m => m.id === materialId) : undefined;
                                        setPoForm({
                                            ...poForm,
                                            material_id: materialId,
                                            rate: selectedMat ? selectedMat.purchase_rate : poForm.rate
                                        });
                                    }}
                                    options={[
                                        { id: '', label: 'Select Material' },
                                        ...(poForm.supplier_id ? materials.filter(m => m.supplier_id === poForm.supplier_id) : materials).map(m => ({
                                            id: m.id?.toString(),
                                            label: m.material_name,
                                            searchKey: m.material_name
                                        }))
                                    ]}
                                    placeholder="Select Material"
                                    searchable={materials.length > 5}
                                    maxHeight="max-h-48"
                                />
                                {formNotification?.fields?.includes("Material") && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">REQUIRED</p>}
                            </div>
                            <div className="z-[57]">
                                <CustomSelect
                                    label="BOQ Item"
                                    value={poForm.boq_item_id ? poForm.boq_item_id.toString() : ""}
                                    onChange={(val: any) => setPoForm({ ...poForm, boq_item_id: val ? Number(val) : undefined })}
                                    options={[
                                        { id: '', label: 'Select BOQ' },
                                        ...boqs.map(b => ({
                                            id: (b.id || b.boq_item_id || b.item_id)?.toString(),
                                            label: b.item_name || b.name || b.title || b.item_description || b.description || b.work_description || `BOQ Item #${b.id || b.boq_item_id || b.item_id}`,
                                            searchKey: b.item_name || b.name || b.title || b.item_description || b.description || b.work_description || `BOQ Item #${b.id || b.boq_item_id || b.item_id}`
                                        }))
                                    ]}
                                    placeholder="Select BOQ"
                                    searchable={boqs.length > 5}
                                    maxHeight="max-h-48"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 ml-1">Quantity <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    value={poForm.quantity || ""}
                                    onChange={e => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-slate-800 text-sm font-semibold rounded-xl outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="Enter quantity"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 ml-1">Rate <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    value={poForm.rate || ""}
                                    onChange={e => setPoForm({ ...poForm, rate: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-slate-800 text-sm font-semibold rounded-xl outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="Enter rate"
                                />
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center md:col-span-2">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                                <span className="font-black text-2xl text-purple-600">{formatINR((poForm.quantity || 0) * (poForm.rate || 0))}</span>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal K: View PO */}
            <Modal
                isOpen={isViewPOOpen}
                onClose={() => setIsViewPOOpen(false)}
                title="Purchase Order Intelligence"
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex justify-end w-full">
                        <button
                            type="button"
                            onClick={() => setIsViewPOOpen(false)}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow transition-colors"
                        >
                            Close
                        </button>
                    </div>
                }
            >
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
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title={`Delete ${deleteTarget?.type ? deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1) : ''}`} message="Are you sure? This cannot be undone." confirmText="Delete" type="danger" isLoading={isSubmitting} />
        </>
    );
};

export default MaterialReceiptPage;
